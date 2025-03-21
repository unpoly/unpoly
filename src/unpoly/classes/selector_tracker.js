const u = up.util

up.SelectorTracker = class SelectorTracker {

  constructor(selector, options, addCallback) {
    this._selector = selector
    this._addCallback = addCallback
    this._layer = options.layer || 'any'
    this._filter = options.filter || u.identity
    this._live = options.live ?? true
    this._knownMatches = new Map()
  }

  start() {
    this._sync()

    return u.sequence(
      this._trackFragments(),
      () => this._removeAllMatches(),
    )
  }

  _trackFragments() {
    if (this._live) {
      return up.on('up:fragment:inserted up:fragment:destroyed', () => this._sync())
    }
  }

  _sync() {
    let removeMap = new Map(this._knownMatches)
    this._knownMatches.clear()

    for (let newMatch of this._currentMatches) {
      let knownRemoveCallback = removeMap.get(newMatch)
      removeMap.delete(newMatch)
      let removeCallback = knownRemoveCallback || this._addCallback(newMatch) || u.noop
      this._knownMatches.set(newMatch, removeCallback)
    }

    this._runRemoveCallbacks(removeMap)
  }

  get _currentMatches() {
    let allMatches = up.fragment.all(this._selector, { layer: this._layer })
    return this._filter(allMatches)
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
