const u = up.util
const DEFAULT_EVENT_TYPE = 'input'

up.FieldWatcher = class FieldWatcher {

  constructor(container, options, callback) {
    this._options = options
    this._container = container
    this._form = up.form.get(container)
    this._callback = callback
    this._batch = options.batch
    this._abortable = options.abortable
    this._fieldOptionsCache = new Map()
  }

  start() {
    this._scheduledValues = null
    this._processedValues = this._readFieldValues()
    this._currentTimer = null
    this._callbackRunning = false
    this._unbindFns = []

    for (let eventType of this._possibleEventTypes()) {
      this._unbindFns.push(
        this._watchEvent(eventType)
      )
    }

    for (let abortableElement of this._abortableElements()) {
      this._unbindFns.push(
        up.fragment.onAborted(abortableElement, () => this._abort())
      )
    }
  }

  stop() {
    this._abort()
    for (let unbindFn of this._unbindFns) unbindFn()
  }

  _fieldOptions(field) {
    return this._cachedFieldOptions(field) || this._readAndCacheFieldOptions(field)
  }

  _cachedFieldOptions(field) {
    return this._fieldOptionsCache.get(field)
  }

  _readAndCacheFieldOptions(field) {
    let containerOptions = u.copy(this._options)
    let fieldOptions = up.form.watchOptions(field, containerOptions, { defaults: { event: DEFAULT_EVENT_TYPE } })
    this._fieldOptionsCache.set(field, fieldOptions)
    return fieldOptions
  }

  _fieldEventTypes(field) {
    let { event } = this._fieldOptions(field)
    return u.parseTokens(event)
  }

  _possibleEventTypes() {
    let fields = up.form.fields(this._container)
    let types = u.flatMap(fields, (field) => this._fieldEventTypes(field))
    if (types.length) {
      return u.uniq(types)
    } else {
      return [DEFAULT_EVENT_TYPE]
    }
  }

  _abortableElements() {
    if (this._abortable === false) {
      return []
    } else {
      return u.wrapList(this._abortable ?? this._form)
    }
  }

  _watchEvent(type) {
    return up.on(this._container, type, (event) => this._onEvent(event))
  }

  _onEvent({ type, target }) {
    if (!up.form.isField(target)) return
    let fieldOptions = this._fieldOptions(target)
    let fieldEventTypes = u.parseTokens(fieldOptions.event)
    if (!u.contains(fieldEventTypes, type)) return
    this._check(fieldOptions)
  }

  _abort() {
    // This causes the next call to _requestCallback() to return early
    this._scheduledValues = null
  }

  _cancelTimer() {
    clearTimeout(this._currentTimer)
    this._currentTimer = null
  }

  _scheduleValues(values,  fieldOptions) {
    this._cancelTimer()
    this._scheduledValues = values
    this._currentTimer = u.timer(fieldOptions.delay, () => {
      this._currentTimer = null
      this._scheduledFieldOptions = fieldOptions
      this._requestCallback()
    })
  }

  _isNewValues(values) {
    return !u.isEqual(values, this._processedValues) && !u.isEqual(this._scheduledValues, values)
  }

  async _requestCallback() {
    if (!this._form.isConnected) {
      this._abort()
    }

    let fieldOptions = this._scheduledFieldOptions

    if ((this._scheduledValues !== null) && !this._currentTimer && !this._callbackRunning) {
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
    return up.Params.fromContainer(this._container).toObject()
  }

  _check(fieldOptions) {
    const values = this._readFieldValues()
    if (this._isNewValues(values)) {
      this._scheduleValues(values, fieldOptions)
    }
  }
}
