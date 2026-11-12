import { type UpRequest } from '../network.js'
import { UpError } from './error.js'

export class Offline extends UpError {
  // Set from the props passed to the constructor.
  declare request: UpRequest
  declare reason: string
}

export const api = {
  Offline,
}
