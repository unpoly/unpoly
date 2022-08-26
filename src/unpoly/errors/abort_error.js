// AbortController already throws an abort error, which is really a DOMException(message, 'AbortError')
up.AbortError = class AbortError extends up.Failed {
  constructor(message) {
    super(message, { name: 'AbortError' })
  }
}
