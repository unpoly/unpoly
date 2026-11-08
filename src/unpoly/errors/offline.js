import { Error as UpError } from './error.js'

export class Offline extends UpError {
  get [Symbol.toStringTag]() { return 'up.Offline' }
}

export const api = {
  Offline,
}
