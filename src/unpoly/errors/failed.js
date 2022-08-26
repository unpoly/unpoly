up.Failed = class Failed extends Error {
  constructor(message, props = {}) {
    if (Array.isArray(message)) {
      message = u.sprintf(...message)
    }
    super(message)
    Object.assign(this, props)
    this.name ||= 'up.' + this.constructor.name
  }
}
