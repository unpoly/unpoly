const u = up.util
const e = up.element

up.FieldObserver = class FieldObserver {

  constructor(form, fields, options, callback) {
    this.scheduleValues = this.scheduleValues.bind(this)
    this.isNewValues = this.isNewValues.bind(this)
    this.callback = callback
    this.form = form
    this.fields = fields
    this.options = options

    this.defaultEvent = options.defaultEvent || up.form.config.observeEvent
    this.defaultDelay = options.defaultDelay || up.form.config.observeDelay

    this.batch = options.batch
    this.destructors = []
  }

  fieldOptions(field) {
    throw "move parsing base <form> options from up.form to this class."
    throw "reconsider whether we want observe-infixed attr names"
    throw "how are the { disable, feedback } options passed to the callback? As a third option? Then we should switch to new callback style"

    let options = u.copy(this.options, { origin: field })
    let parser = new up.OptionsParser(options, field, { closest: true })
    options.origin = field

    // TODO: We cannot preload [up-feedback], [up-disable] from <form> or parsing below will short-circuit
    parser.boolean('feedback', { attr: ['up-observe-feedback', 'up-feedback'] })
    parser.boolean('disable', { attr: ['up-observe-disable', 'up-disable'], default: up.form.config.disable })
    parser.boolean('observeDelay', { default: this.defaultDelay })
    parser.boolean('observeEvent', { default: u.evalOption(this.defaultEvent, field) })

    // TODO: If we keep [up-observe-delay] we should deprecate/migrate [up-observe][up-delay] / [up-autosubmit][up-delay]
  }


  start() {
    this.scheduledValues = null
    this.processedValues = this.readFieldValues()
    this.currentTimer = undefined
    this.callbackRunning = false

    for (let field in this.fields) {
      let fieldOptions = this.fieldOptions(field)
      let unbindField = up.on(field, fieldOptions.observeEvent, (event) => this.check(event, fieldOptions))
      destructors.push(unbindField)
    }

    if (this.form) {
      this.unbindFormEvents = up.on(this.form, 'up:form:submit', () => this.cancelTimer())
    }
  }

  stop() {
    this.unbindFieldEvents()
    this.unbindFormEvents?.()
    this.cancelTimer()
  }

  cancelTimer() {
    clearTimeout(this.currentTimer)
    this.currentTimer = undefined
  }

  scheduleTimer(delay) {
    this.cancelTimer()
    this.currentTimer = u.timer(delay, () => {
      this.currentTimer = undefined
      if (this.isAnyFieldAttached()) {
        this.requestCallback()
      }
    })
  }

  isAnyFieldAttached() {
    return u.some(this.fields, (field) => !e.isDetached(field))
  }

  scheduleValues(values, delay) {
    this.scheduledValues = values
    this.scheduleTimer(delay)
  }

  isNewValues(values) {
    return !u.isEqual(values, this.processedValues) && !u.isEqual(this.scheduledValues, values)
  }

  async requestCallback() {
    if ((this.scheduledValues !== null) && !this.currentTimer && !this.callbackRunning) {
      const diff = this.changedValues(this.processedValues, this.scheduledValues)
      this.processedValues = this.scheduledValues
      this.scheduledValues = null
      this.callbackRunning = true

      const callbackReturnValues = []
      if (this.batch) {
        callbackReturnValues.push(this.callback(diff))
      } else {
        for (let name in diff) {
          const value = diff[name]
          callbackReturnValues.push(this.callback(value, name))
        }
      }

      await u.allSettled(callbackReturnValues)
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
      let delay = u.evalOption(fieldOptions.observeDelay, event)
      this.scheduleValues(values, delay)
    }
  }
}
