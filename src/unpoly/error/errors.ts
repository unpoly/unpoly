import { type UpRequest } from '../network.js'
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

export class NotImplemented extends UpError {}

// AbortController already throws an abort error, which is really a DOMException(message, 'AbortError')
export class Aborted extends UpError {
  constructor(message: string | any[]) {
    super(message, { name: 'AbortError' })
  }
}

export class Blocked extends UpError {}

export class CannotMatch extends UpError {}

export class CannotParse extends UpError {}

export class CannotTarget extends UpError {}

export class Offline extends UpError {
  // Set from the props passed to the constructor.
  declare request: UpRequest
  declare reason: string
}

export const api = {
  Error: UpError,
  NotImplemented,
  Aborted,
  Blocked,
  CannotMatch,
  CannotParse,
  CannotTarget,
  Offline,
}
