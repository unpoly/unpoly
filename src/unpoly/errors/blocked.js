import { UpError } from './error.js'

export class Blocked extends UpError {
  get [Symbol.toStringTag]() { return 'up.Blocked' }
}

export const api = {
  Blocked,
}
