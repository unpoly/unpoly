import { UpError } from './error.js'

// AbortController already throws an abort error, which is really a DOMException(message, 'AbortError')
export class Aborted extends UpError {
  constructor(message) {
    super(message, { name: 'AbortError' })
  }
}

export const api = {
  Aborted,
}
