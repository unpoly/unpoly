import { UpError } from './error.js'

export class Offline extends UpError {
  // Set from the props passed to the constructor.
  declare request: any // up.Request
  declare reason: string
}

export const api = {
  Offline,
}
