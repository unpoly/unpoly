const u = up.util

up.Config = class Config extends up.Class {

  constructor(blueprintFn = (() => ({}))) {
    super()
    this.blueprintFn = blueprintFn
    this.reset()
  }

  reset() {
    u.assign(this, this.blueprintFn())
  }
}
