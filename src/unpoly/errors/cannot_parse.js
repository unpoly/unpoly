import { Error as UpError } from './error.js'

export class CannotParse extends UpError {
  get [Symbol.toStringTag]() { return 'up.CannotParse' }
}

export const api = {
  CannotParse,
}
