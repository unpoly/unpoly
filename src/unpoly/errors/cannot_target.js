import { Error as UpError } from './error.js'

export class CannotTarget extends UpError {
  get [Symbol.toStringTag]() { return 'up.CannotTarget' }
}

export const api = {
  CannotTarget,
}
