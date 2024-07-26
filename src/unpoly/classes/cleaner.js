up.Cleaner = class Cleaner {
  constructor() {
    this._fns = []
  }

  track(...fns) {
    this._fns.push(...fns)
  }

  clean() {
    for (let fn of this._fns) fn?.()
    this._fns = []
  }
}
