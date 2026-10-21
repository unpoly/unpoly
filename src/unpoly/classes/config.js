const u = up.util
const e = up.element

up.Config = class Config {

  constructor(label, blueprintFn = (() => ({}))) {
    this._label = label
    this._blueprintFn = blueprintFn
    this._knownKeys = []
    this.reset()
    // Our private properties and the blueprint's keys.
    this._knownKeys.push(...Object.keys(this))

    document.addEventListener('up:framework:reset', () => this.reset())
    document.addEventListener('up:framework:boot', () => this.logUnknownKeys())
  }

  // Logs an error for a setting that doesn't exist, e.g. a misspelled or renamed key.
  // This is an error rather than a warning, because an ignored setting may be a security setting.
  // We only check top-level keys: a nested object like up.layer.config.modal may hold any layer option.
  // Settings made after booting are not checked.
  //
  // This method is not private because a spec calls it.
  logUnknownKeys() {
    for (let key of Object.keys(this)) {
      if (!this._knownKeys.includes(key)) {
        up.log.error(this._label, 'Ignoring unknown setting %s', key)
      }
    }
  }

  reset() {
    Object.assign(this, this._blueprintFn())
  }

  matches(element, prop, condition) {
    return element?.matches(this.selector(prop, condition))
  }

  matchesFn(prop) {
    return (element, condition) => this.matches(element, prop, condition)
  }

  selector(prop, condition = '') {
    let includes = this[prop]
    let excludes = this['no' + u.upperCaseFirst(prop)]
    return e.unionSelector(includes, excludes, condition)
  }

  selectorFn(prop) {
    return (condition) => this.selector(prop, condition)
  }

  selectorFns(prop) {
    return [this.selectorFn(prop), this.matchesFn(prop)]
  }
}
