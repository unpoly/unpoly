// AbortController already throws an abort error, which is really a DOMException(message, 'AbortError')
up.Aborted = class Aborted extends up.Error {
  constructor(message) {
    super(message, { name: 'AbortError' })
  }
}
