const u = up.util

up.Config = class Config {

  constructor(blueprintFn = (() => ({}))) {
    this.blueprintFn = blueprintFn
    this.reset()
  }

  reset() {
    u.assign(this, this.blueprintFn())
  }
}
