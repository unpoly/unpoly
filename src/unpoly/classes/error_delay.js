const u = up.util

up.ErrorDelay = class ErrorDelay {

  constructor(summaryClass, options = {}) {
    this._summaryClass = summaryClass
    this._delayedErrors = []
    this._captureAny = options.captureAny
  }

  flush() {
    let errors = this._delayedErrors
    if (errors.length) {
      this._delayedErrors = []
      throw new this._summaryClass({ errors })
    }
  }

  run(block, onError) {
    try {
      return block()
    } catch (error) {
      if (this._captureAny || (error instanceof this._summaryClass)) {
        onError?.(error)
        let errors = u.wrapList(error.errors || error)
        this._delayedErrors.push(...errors)
      }
    }
  }

}
