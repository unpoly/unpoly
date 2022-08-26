up.Failed = class Failed extends Error {
  constructor(message, props = {}) {
    if (Array.isArray(message)) {
      message = up.util.sprintf(...message)
    }
    super(message)
    let name = 'up.' + this.constructor.name
    Object.assign(this, { name }, props)
  }
}
