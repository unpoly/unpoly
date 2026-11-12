import * as u from '../util.js'

export class UpError extends Error {
  // Our public name, like 'up.Aborted'. unpoly.ts sets it on every class on window.up.
  declare [Symbol.toStringTag]: string

  // The message may be an array of a message with substitution marks and its values,
  // like `['Unexpected result %o', result]`.
  constructor(message?: string | any[], props: u.PlainObject = {}) {
    if (Array.isArray(message)) {
      message = u.sprintf(...message as [string, ...any[]])
    }
    super(message)
    // Minifiers rename our classes, but not a string from our tag.
    Object.assign(this, { name: this[Symbol.toStringTag] }, props)
  }
}

export const api = {
  Error: UpError,
}
