import { Error as UpError } from './error.js'

export class NotImplemented extends UpError {
  get [Symbol.toStringTag]() { return 'up.NotImplemented' }
}

export const api = {
  NotImplemented,
}
