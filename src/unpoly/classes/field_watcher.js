const u = up.util

up.FieldWatcher = class FieldWatcher {

  constructor(root, options, callback) {
    this._options = options
    this._root = root
    this._container = up.form.getContainer(root)
    this._callback = callback
    this._batch = options.batch
    this._abortable = options.abortable
  }

  start() {
    this._scheduledValues = null
    this._processedValues = this._readFieldValues()
    this._currentTimer = null
    this._callbackRunning = false
    this._unbindFns = []

    this._watchFieldsWithin(this._root)

    this._root.addEventListener('up:fragment:inserted', ({ target }) => {
      if (target !== this._root) this._watchFieldsWithin(target)
    })

    for (let abortableElement of this._abortableElements()) {
      this._unbindFns.push(
        up.fragment.onAborted(abortableElement, () => this._abort())
      )
    }

    this._unbindFns.push(
      up.on(this._container, 'reset', () => this._onFormReset())
    )
  }

  stop() {
    this._abort()
    for (let unbindFn of this._unbindFns) unbindFn()
  }

  _fieldOptions(field) {
    let containerOptions = u.copy(this._options)
    return up.form.watchOptions(field, containerOptions, { defaults: { event: 'input' } })
  }

  _abortableElements() {
    if (this._abortable === false) {
      return []
    } else {
      return u.wrapList(this._abortable ?? this._container)
    }
  }

  _watchFieldsWithin(container) {
    for (let field of up.form.fields(container)) {
      this._watchField(field)
    }
  }

  _watchField(field) {
    let fieldOptions = this._fieldOptions(field)
    this._unbindFns.push(
      up.on(field, fieldOptions.event, () => this._check(fieldOptions))
    )
  }

  _abort() {
    // This causes the next call to _requestCallback() to return early.
    this._scheduledValues = null
  }

  _scheduleValues(values, fieldOptions) {
    clearTimeout(this._currentTimer) // debounce a previously set timer
    this._scheduledValues = values
    let delay = fieldOptions.delay || 0
    this._currentTimer = u.timer(delay, () => {
      this._scheduledFieldOptions = fieldOptions
      this._requestCallback()
    })
  }

  _isNewValues(values) {
    return !u.isEqual(values, this._processedValues) && !u.isEqual(this._scheduledValues, values)
  }

  async _requestCallback() {
    // When aborted we clear out _scheduledValues to cancel a scheduled callback.
    if (!this._scheduledValues) return

    // We don't run callbacks when a prior async callback is still running.
    // We will call _requestCallback() again once the prior callback terminates.
    if (this._callbackRunning) return

    // If the form was destroyed while a callback was scheduled, we don't run the callback.
    if (!this._container.isConnected) return

    let fieldOptions = this._scheduledFieldOptions
    const diff = this._changedValues(this._processedValues, this._scheduledValues)
    this._processedValues = this._scheduledValues
    this._scheduledValues = null
    this._callbackRunning = true
    this._scheduledFieldOptions = null

    // If any callback returns a promise, we will handle { disable } below.
    // We set { disable: false } so callbacks that *do* forward options
    // to up.render() don't unnecessarily disable a second time.
    let callbackOptions = { ...fieldOptions, disable: false }

    const callbackReturnValues = []
    if (this._batch) {
      callbackReturnValues.push(this._runCallback(diff, callbackOptions))
    } else {
      for (let name in diff) {
        const value = diff[name]
        callbackReturnValues.push(this._runCallback(value, name, callbackOptions))
      }
    }

    // If any callbacks returned promises, we wait for all of them to settle.
    // We also process a { disable } option from [up-disable] or [up-watch-disable]
    // attrs so callbacks don't have to handle this.
    if (u.some(callbackReturnValues, u.isPromise)) {
      let callbackDone = Promise.allSettled(callbackReturnValues)
      up.form.disableWhile(callbackDone, fieldOptions)
      await callbackDone
    }

    this._callbackRunning = false

    this._requestCallback()
  }

  _runCallback(...args) {
    return up.error.guard(() => this._callback(...args))
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
    const values = this._readFieldValues()

    if (this._isNewValues(values)) {
      this._scheduleValues(values, fieldOptions)
    }
  }

  _onFormReset() {
    // We need to wait 1 task for the reset button to affect field values
    u.task(() => this._check())
  }
}
