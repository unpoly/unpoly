const u = up.util

up.Change = class Change {

  constructor(options) {
    this.options = options
  }

  execute() {
    throw new up.NotImplemented()
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

  deriveFailOptions() {
    // This will merge shared keys and unprefix failKeys.
    return up.RenderOptions.deriveFailOptions(this.options)
  }

}
