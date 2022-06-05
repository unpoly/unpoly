const u = up.util

up.Change = class Change {

  constructor(options) {
    this.options = options
  }

  cannotApply(reason) {
    return up.error.cannotApply(this, reason)
  }

  execute() {
    throw up.error.notImplemented()
  }

  onFinished(renderResult) {
    return this.options.onFinished?.(renderResult)
  }

  // Values we want to keep:
  // - false (no update)
  // - string (forced update)
  // Values we want to override:
  // - true (do update with defaults)
  improveHistoryValue(existingValue, newValue) {
    if ((existingValue === false) || u.isString(existingValue)) {
      return existingValue
    } else {
      return newValue
    }
  }
}
