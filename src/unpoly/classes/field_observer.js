const u = up.util
const e = up.element

up.FieldObserver = class FieldObserver {

  constructor(form, fields, options, callback) {
    this.callback = callback
    this.form = form
    this.fields = fields
    this.options = options
    this.batch = options.batch
    this.intent = options.intent || 'observe'
    this.intentDefaults = up.form.config[this.intent + 'Options']
    this.formDefaults = form ? up.form.submitOptions(form, {}, { only: ['feedback', 'disable'] }) : {} // TODO: Also parse [up-sequence] when we get it
    this.subscriber = new up.Subscriber()
  }

  fieldOptions(field) {
    let options = { ...this.options, origin: field }
    let parser = new up.OptionsParser(options, field, { closest: true })

    // Computing the effective options for a given field is pretty involved,
    // as there are multiple layers of defaults.
    //
    // Form-wide options are also used for observers:
    //
    // 		<form up-disable="true">
    // 			<input up-autosubmit>
    // 		</form>
    //		
    // Form-wide options can be overridden at the input level:
    //
    // 		<form up-disable="true">
    // 			<input up-autosubmit up-observe-disable="false">
    // 		</form>
    //		
    // Forms can configure a separate option for all observers:
    //
    // 		<form up-disable="true" up-observe-disable="false">
    // 			<input up-autosubmit>
    // 		</form>
    //
    // Radio buttons are grouped within a container that has all the options.
    // There are no options at individual inputs:
    //
    // 		<form up-disable="true">
    // 			<div up-form-group up-autosubmit up-observe-disable="false">
    // 				<input type="radio" name="kind" value="0">
    // 				<input type="radio" name="kind" value="1">
    // 				<input type="radio" name="kind" value="2">
    // 			</div>
    // 		</form>
    //
    // Users can configure app-wide defaults:
    //
    // 		up.form.config.observeOptions.disable = true
    //
    // Summing up, we get an option like { disable } through the following priorities:
    //
    // 1. Passed as explicit `up.observe({ disable })` option
    // 2. Attribute for the observe intent (e.g. `[up-observe-disable]` at the input or form)
    // 3. Default config for this observe() intent (e.g. `up.form.config.observeOptions.disable`).
    // 4. The option the form would use for regular submission (e.g. `[up-disable]` at the form), if applicable.
    parser.boolean('feedback', { attr: this.intentAttr('feedback'), default: this.intentDefaults.feedback ?? this.formDefaults.feedback })
    parser.boolean('disable', { attr: this.intentAttr('disable'), default: this.intentDefaults.disable ?? this.formDefaults.disable })
    parser.number('delay', { attr: this.intentAttr('delay'), default: this.intentDefaults.delay })
    parser.string('event', { attr: this.intentAttr('event'), default: u.evalOption(this.intentDefaults.event, field) })

    return options
  }

  intentAttr(key) {
    return `up-${this.intent}-${key}`
  }

  start() {
    this.scheduledValues = null
    this.processedValues = this.readFieldValues()
    this.currentTimer = null
    this.callbackRunning = false

    for (let field of this.fields) {
      let fieldOptions = this.fieldOptions(field)
      this.subscriber.on(field, fieldOptions.event, (event) => this.check(event, fieldOptions))
    }

    if (this.form) {
      this.subscriber.on(this.form, 'up:form:submit', () => this.cancelTimer())
    }
  }

  stop() {
    this.subscriber.unbindAll()
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
    if ((this.scheduledValues !== null) && !this.currentTimer && !this.callbackRunning) {
      const diff = this.changedValues(this.processedValues, this.scheduledValues)
      this.processedValues = this.scheduledValues
      this.scheduledValues = null
      this.callbackRunning = true

      const callbackReturnValues = []
      if (this.batch) {
        callbackReturnValues.push(this.callback(diff, this.scheduledFieldOptions))
      } else {
        for (let name in diff) {
          const value = diff[name]
          callbackReturnValues.push(this.callback(value, name, this.scheduledFieldOptions))
        }
      }

      this.scheduledFieldOptions = null

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
      this.scheduleValues(values, event, fieldOptions)
    }
  }
}
