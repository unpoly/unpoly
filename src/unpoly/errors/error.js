import { sprintf } from '../util.js'

// A class expression, so the class keeps its name when webpack's module concatenation
// renames the binding, which collides with the global `Error`.
export const Error = class Error extends window.Error {
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
  Error,
}
