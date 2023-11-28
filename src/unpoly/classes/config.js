const u = up.util

up.Config = class Config {

  constructor(blueprintFn = (() => ({}))) {
    this._blueprintFn = blueprintFn
    this.reset()

    document.addEventListener('up:framework:reset', () => this.reset())
  }

  reset() {
    Object.assign(this, this._blueprintFn())
  }

  matches(element, prop) {
    return element.matches(this.selector(prop))
  }

  selector(prop) {
    let includes = this[prop]
    let excludes = this['no' + u.upperCaseFirst(prop)]
    let selector = `:is(${includes.join()})`
    if (u.isPresent(excludes)) selector += `:not(${excludes.join()})`
    return selector
  }

  selectorFn(prop) {
    return () => this.selector(prop)
  }

}
