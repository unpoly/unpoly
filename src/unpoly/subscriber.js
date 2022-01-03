// Utility class to bind to a number of events,
// while tracking unbind functions to unbind them all at once later.
up.Subscriber = class Subscriber {
  constructor() {
    this.unbindFns = []
  }

  on(...args) {
    let unbindFn = up.on(...args)
    this.unbindFns.push(unbindFn)
  }

  unbindAll() {
    for (let fn of this.unbindFns) {
      fn()
    }
    this.unbindFns = []
  }
}

