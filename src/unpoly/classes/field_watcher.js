const u = up.util

up.FieldWatcher = class FieldWatcher {

  constructor(root, options, callback) {
    this._options = options
    this._root = root
    this._callback = callback
    this._batch = options.batch
  }

  start() {
    this._scheduledValues = null
    this._processedValues = this._readFieldValues()
    this._currentTimer = null
    this._callbackRunning = false

    return u.sequence(
      up.form.trackFields(this._root, (field) => this._watchField(field)),
      this._trackAbort(),
      this._trackReset(),
      () => this._abort(),
    )
  }

  _trackAbort() {
    let guard = ({ target }) => target.contains(this._scope)
    return up.on('up:fragment:aborted', { guard }, () => this._abort())
  }

  _trackReset() {
    let guard = ({ target }) => target === this._scope
    return up.on('reset', { guard }, () => this._onFormReset())
  }

  get _scope() {
    return up.form.getScope(this._root)
  }

  _fieldOptions(field) {
    let rootOptions = u.copy(this._options)
    return up.form.watchOptions(field, rootOptions, { defaults: { event: 'input' } })
  }

  _watchField(field) {
    let fieldOptions = this._fieldOptions(field)
    // Return a function that unbinds all events when the field is removed from _root.
    // Note that an [up-keep] field may be moved to another root.
    console.debug("[FieldWatcher] Added field %o", field)
    return up.on(field, fieldOptions.event, () => this._check(fieldOptions))
  }

  _abort() {
    // This causes the next call to _requestCallback() to return early.
    this._scheduledValues = null
  }

  _scheduleValues(values, fieldOptions) {
    this._scheduledValues = values
    this._scheduledFieldOptions = fieldOptions
    let delay = fieldOptions.delay || 0
    console.debug("[Watcher] _scheduleValues(%o)", u.copy(values))
    clearTimeout(this._currentTimer) // debounce a previously set timer

    this._currentTimer = u.timer(delay, () => {
      this._currentTimer = null
      this._requestCallback()
    })
    // // TODO: Do we need this?
    // if (delay === 0) {
    //   this._requestCallback()
    // } else {
    //   this._currentTimer = u.timer(delay, () => {
    //     this._currentTimer = null
    //     this._requestCallback()
    //   })
    // }
  }

  _isNewValues(values) {
    return !u.isEqual(values, this._processedValues) && !u.isEqual(this._scheduledValues, values)
  }

  async _requestCallback() {
    console.debug("[Watcher] _requestCallback")

    // When aborted we nullify _scheduledValues to cancel a scheduled callback.
    if (!this._scheduledValues) return

    // We don't run callbacks when a prior async callback is still running.
    // We will call _requestCallback() again once the prior callback terminates.
    if (this._callbackRunning) return

    // When we re-called _requestCallback() after waiting for a prior callback, another
    // debounce delay may have started while waiting for the prior callback.
    // We must not shorted that debounce delay.
    if (this._currentTimer) return

    // If the form was destroyed while a callback was scheduled, we don't run the callback.
    // TODO: Do we need this? Since we already clear scheduledValues in stop()?
    if (!up.fragment.isAlive(this._scope)) return

    // Don't forward { event, delay } because
    // (1) we have already processed them here and
    // (2) those aren't render options.
    let callbackOptions = u.omit(this._scheduledFieldOptions, ['event', 'delay'])
    const diff = this._changedValues(this._processedValues, this._scheduledValues)
    this._processedValues = this._scheduledValues
    this._scheduledValues = null
    this._callbackRunning = true
    this._scheduledFieldOptions = null

    const callbackReturnValues = []
    if (this._batch) {
      callbackReturnValues.push(this._runCallback(diff, callbackOptions))
    } else {
      for (let name in diff) {
        const value = diff[name]
        callbackReturnValues.push(this._runCallback(value, name, callbackOptions))
      }
    }

    if (u.some(callbackReturnValues, u.isPromise)) {
      let callbackDone = Promise.allSettled(callbackReturnValues)
      await callbackDone
    }

    this._callbackRunning = false

    // A debounce delay may have finished and returned earlier while a priour async callback was still running.
    this._requestCallback()
  }

  _runCallback(...args) {
    return up.error.guard(this._callback, ...args)
  }

  _changedValues(previous, next) {
    const changes = {}
    let keys = Object.keys(previous)
    keys = keys.concat(Object.keys(next))
    keys = u.uniq(keys)
    for (let key of keys) {
      const previousValue = previous[key]
      const nextValue = next[key]
      if (!u.isEqual(previousValue, nextValue)) {
        changes[key] = nextValue
      }
    }
    return changes
  }

  _readFieldValues() {
    return up.Params.fromContainer(this._root).toObject()
  }

  _check(fieldOptions = {}) {
    console.debug("[Watcher] checking after event")
    const values = this._readFieldValues()

    console.debug("[Watcher] current values: %o", u.copy(values))
    console.debug("[Watcher] processed values: %o", u.copy(this._processedValues))
    console.debug("[Watcher] scheduled values: %o", u.copy(this._scheduledValues))
    console.debug("[Watcher] isNew: %o", this._isNewValues(values))

    if (this._isNewValues(values)) {
      this._scheduleValues(values, fieldOptions)
    }
  }

  _onFormReset() {
    // We need to wait 1 task for the reset button to affect field values
    u.task(() => this._check())
  }
}
