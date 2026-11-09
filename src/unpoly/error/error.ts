import { sprintf } from '../util.js'
import type { PlainObject } from '../util.js'

export class UpError extends Error {
  // The message may be an array of a message with substitution marks and its values,
  // like `['Unexpected result %o', result]`.
  constructor(message?: string | any[], props: PlainObject = {}) {
    if (Array.isArray(message)) {
      message = sprintf(...message as [string, ...any[]])
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
