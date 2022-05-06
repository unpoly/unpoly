up.Config = class Config {

  constructor(blueprintFn = (() => ({}))) {
    this.blueprintFn = blueprintFn
    this.reset()
  }

  reset() {
    Object.assign(this, this.blueprintFn())
  }
}
