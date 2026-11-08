import { sprintf } from '../util.js'

// A class expression, so the class is still named `Error` at runtime (`up.Error.name`),
// while the binding is `UpError` and doesn't shadow the global `Error` here or in importers.
export const UpError = class Error extends window.Error {
  constructor(message, props = {}) {
    if (Array.isArray(message)) {
      message = sprintf(...message)
    }
    super(message)
    // Minifiers in app bundlers drop class names, but not a string from our tag.
    Object.assign(this, { name: this[Symbol.toStringTag] }, props)
  }

  get [Symbol.toStringTag]() { return 'up.Error' }
}

export const api = {
  Error: UpError,
}
