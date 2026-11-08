import { UpError } from './error.js'

export class CannotMatch extends UpError {
  get [Symbol.toStringTag]() { return 'up.CannotMatch' }
}

export const api = {
  CannotMatch,
}
