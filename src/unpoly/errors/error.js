up.Error = class Error extends window.Error {
  constructor(message, props = {}) {
    if (Array.isArray(message)) {
      message = up.util.sprintf(...message)
    }
    super(message)
    // Minifiers in app bundlers drop class names, but not a string from our tag.
    Object.assign(this, { name: this[Symbol.toStringTag] }, props)
  }

  get [Symbol.toStringTag]() { return 'up.Error' }
}
