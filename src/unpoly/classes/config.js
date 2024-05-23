const u = up.util
const e = up.element

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
    return e.unionSelector(includes, excludes)
  }

  selectorFn(prop) {
    return () => this.selector(prop)
  }

}
