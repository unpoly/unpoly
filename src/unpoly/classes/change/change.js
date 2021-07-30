const u = up.util

up.Change = class Change {

  constructor(options) {
    this.options = options
  }

  notApplicable(reason) {
    return up.error.notApplicable(this, reason)
  }

  execute() {
    throw up.error.notImplemented()
  }

  onFinished() {
    return this.options.onFinished?.()
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
