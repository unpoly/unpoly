up.Change = class Change {

  constructor(options) {
    this.options = options
  }

  execute() {
    throw new up.NotImplemented()
  }

  deriveFailOptions() {
    // This will merge shared keys and unprefix failKeys.
    return up.RenderOptions.deriveFailOptions(this.options)
  }

}
