const u = up.util
const e = up.element

up.FieldWatcher = class FieldWatcher {

  constructor(form, fields, options, callback) {
    this.callback = callback
    this.form = form
    this.fields = fields
    this.options = options
    this.batch = options.batch
    this.formDefaults = form ? up.form.submitOptions(form, {}, { only: ['feedback', 'disable'] }) : {} // TODO: Also parse [up-sequence] when we get it
    this.unbindFns = []
  }

  fieldOptions(field) {
    let options = u.copy(this.options)
    let defaults = { event: 'input', ...this.formDefaults }
    return up.form.watchOptions(field, options, { defaults })
  }

  start() {
    this.scheduledValues = null
    this.processedValues = this.readFieldValues()
    this.currentTimer = null
    this.callbackRunning = false

    for (let field of this.fields) {
      this.watchField(field)
    }
  }

  watchField(field) {
    let fieldOptions = this.fieldOptions(field)
    this.unbindFns.push(up.on(field, fieldOptions.event, (event) => this.check(event, fieldOptions)))
    this.unbindFns.push(up.fragment.onAborted(field, () => this.cancelTimer()))
  }

  stop() {
    for (let unbindFn of this.unbindFns) unbindFn()
    this.cancelTimer()
  }

  cancelTimer() {
    clearTimeout(this.currentTimer)
    this.currentTimer = null
  }

  isAnyFieldAttached() {
    return u.some(this.fields, (field) => !e.isDetached(field))
  }

  scheduleValues(values, event, fieldOptions) {
    this.cancelTimer()
    this.scheduledValues = values
    let delay = u.evalOption(fieldOptions.delay, event)
    this.currentTimer = u.timer(delay, () => {
      this.currentTimer = null
      if (this.isAnyFieldAttached()) { // TODO: Docs and changelog for this new feature
        this.scheduledFieldOptions = fieldOptions
        this.requestCallback()
      } else {
        // If a pending callback finished after elements got detached,
        // it will call requestCallback() again. Nullifying this.scheduledValues
        // will prevent the callback from running again.
        this.scheduledValues = null
      }
    })
  }

  isNewValues(values) {
    return !u.isEqual(values, this.processedValues) && !u.isEqual(this.scheduledValues, values)
  }

  async requestCallback() {
    let fieldOptions = this.scheduledFieldOptions

    if ((this.scheduledValues !== null) && !this.currentTimer && !this.callbackRunning) {
      const diff = this.changedValues(this.processedValues, this.scheduledValues)
      this.processedValues = this.scheduledValues
      this.scheduledValues = null
      this.callbackRunning = true
      this.scheduledFieldOptions = null

      // If any callback returns a promise, we will handle { disable } below.
      // We set { disable: false } so callbacks that *do* forward options
      // to up.render() don't unnecessarily disable a second time.
      let callbackOptions = { ...fieldOptions, disable: false }

      const callbackReturnValues = []
      if (this.batch) {
        callbackReturnValues.push(this.callback(diff, callbackOptions))
      } else {
        for (let name in diff) {
          const value = diff[name]
          callbackReturnValues.push(this.callback(value, name, callbackOptions))
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

      this.callbackRunning = false

      this.requestCallback()
    }
  }

  changedValues(previous, next) {
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

  readFieldValues() {
    return up.Params.fromFields(this.fields).toObject()
  }

  check(event, fieldOptions) {
    const values = this.readFieldValues()
    if (this.isNewValues(values)) {
      this.scheduleValues(values, event, fieldOptions)
    }
  }
}
