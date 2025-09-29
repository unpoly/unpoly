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
