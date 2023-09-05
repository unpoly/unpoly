up.Config = class Config {

  constructor(blueprintFn = (() => ({}))) {
    this._blueprintFn = blueprintFn
    this.reset()
  }

  reset() {
    Object.assign(this, this._blueprintFn())
  }
}
