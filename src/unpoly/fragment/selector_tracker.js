const u = up.util

up.SelectorTracker = class SelectorTracker {

  constructor(selectFn, addCallback) {
    this._selectFn = selectFn
    this._addCallback = addCallback
    this._knownMatches = new Map()
    this._syncScheduled = false
  }

  start() {
    // Get initial matches immediately. If we waited for scheduleSync(), the following race condition
    // could occur:
    //
    // (1) When we encounter [up-switch], we immediately-sync read field values.
    // (2) A later user compiler (after) us changes a field value and emits 'change'.
    //     The change event would normally cause us to re-read field values.
    //     But we aren't yet listening to field events!
    // (3) The change event is only registered via trackFields() and up.SelectorTracker, which
    //     only syncs the current mutation (after up:fragment:insert) for performance reasons.
    this.sync()

    return u.sequence(
      this._trackFragments(),
      () => this._removeAllMatches(),
    )
  }

  _trackFragments() {
    // A custom element may only match our selector after its definition, which can arrive
    // after the element was inserted (e.g. a form-associated custom element only matches
    // :enabled once defined).
    return up.on('up:fragment:inserted up:fragment:destroyed up:element:defined', () => this._scheduleSync())
  }

  _scheduleSync() {
    if (!this._syncScheduled) {
      this._syncScheduled = true
      // When we're in the middle of a render pass, we don't want to react to every
      // up:fragment:inserted/destroyed event, for performance reasons.
      // We want to only sync once at the end of the render pass.
      up.fragment.afterMutate(() => this.sync())
    }
  }

  // No _ prefix: specs spy on this name, and _-prefixed members are mangled in the minified build.
  sync() {
    this._syncScheduled = false

    let removeMap = new Map(this._knownMatches)
    this._knownMatches.clear()

    for (let newMatch of this._selectFn()) {
      let knownRemoveCallback = removeMap.get(newMatch)
      removeMap.delete(newMatch)
      let removeCallback = knownRemoveCallback || this._addCallback(newMatch) || u.noop
      this._knownMatches.set(newMatch, removeCallback)
    }

    this._runRemoveCallbacks(removeMap)
  }

  _removeAllMatches() {
    this._runRemoveCallbacks(this._knownMatches)
  }

  _runRemoveCallbacks(map) {
    for (let [element, removeCallback] of map) {
      removeCallback(element)
    }
  }

}
