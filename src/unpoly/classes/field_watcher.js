const u = up.util

up.FieldWatcher = class FieldWatcher {

  constructor(form, fields, options, callback) {
    this._callback = callback
    this._fields = fields
    this._options = options
    this._batch = options.batch
    this._abortable = u.wrapList(options.abortable ?? form)
    this._unbindFns = []
  }

  _fieldOptions(field) {
    let options = u.copy(this._options)
    return up.form.watchOptions(field, options, { defaults: { event: 'input' } })
  }

  start() {
    this._scheduledValues = null
    this._processedValues = this._readFieldValues()
    this._currentTimer = null
    this._callbackRunning = false

    for (let field of this._fields) {
      this._watchField(field)
    }

    for (let abortableElement of this._abortable) {
      if (abortableElement !== false) {
        this._unbindFns.push(
          up.fragment.onAborted(abortableElement, () => {
            this._abort()
          })
        )
      }
    }
  }

  _abort() {
    // This causes the next call to _requestCallback() to return early
    this._scheduledValues = null
  }

  _watchField(field) {
    let fieldOptions = this._fieldOptions(field)
    this._unbindFns.push(up.on(field, fieldOptions.event, (event) => this._check(event, fieldOptions)))
  }

  stop() {
    this._abort()
    for (let unbindFn of this._unbindFns) unbindFn()
  }

  _cancelTimer() {
    clearTimeout(this._currentTimer)
    this._currentTimer = null
  }

  _isAnyFieldAttached() {
    return u.some(this._fields, 'isConnected')
  }

  _scheduleValues(values, event, fieldOptions) {
    this._cancelTimer()
    this._scheduledValues = values
    let delay = u.evalOption(fieldOptions.delay, event)
    this._currentTimer = u.timer(delay, () => {
      this._currentTimer = null
      this._scheduledFieldOptions = fieldOptions
      this._requestCallback()
    })
  }

  _isNewValues(values) {
    return !u.isEqual(values, this._processedValues) && !u.isEqual(this._scheduledValues, values)
  }

  async _requestCallback() {
    if (!this._isAnyFieldAttached()) {
      this._abort()
    }

    let fieldOptions = this._scheduledFieldOptions

    if ((this._scheduledValues !== null) && !this._currentTimer && !this._callbackRunning && this._isAnyFieldAttached()) {
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
    return up.Params.fromFields(this._fields).toObject()
  }

  _check(event, fieldOptions) {
    const values = this._readFieldValues()
    if (this._isNewValues(values)) {
      this._scheduleValues(values, event, fieldOptions)
    }
  }
}
