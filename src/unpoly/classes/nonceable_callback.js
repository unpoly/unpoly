const u = up.util
const e = up.element

up.NonceableCallback = class NonceableCallback {

  constructor(script, nonce) {
    this.script = script
    this.nonce = nonce
  }

  static fromString(string) {
    let match = string.match(/^(nonce-([^\s]+)\s)?(.*)$/)
    return new this(match[3], match[2])
  }

  /*-
  Replacement for `new Function()` that can take a nonce to work with a strict Content Security Policy.

  It also prints an error when a strict CSP is active, but user supplies no nonce.

  ### Examples

  ```js
  new up.NonceableCallback('1 + 2', 'secret').toFunction()
  ```

  @function up.NonceableCallback#toFunction
  @internal
  */
  toFunction(...argNames) {
    if (up.browser.canEval()) {
      return new Function(...argNames, this.script)
    } else if (this.nonce) {
      // Don't return a bound function so callers can re-bind to a different this.
      let callbackThis = this
      return function(...args) {
        return callbackThis.runAsNoncedFunction(this, argNames, args)
      }
    } else {
      return this.cannotRun.bind(this)
    }
  }

  toString() {
    return `nonce-${this.nonce} ${this.script}`
  }

  cannotRun() {
    throw new Error(`Your Content Security Policy disallows inline JavaScript (${this.script}). See https://unpoly.com/csp for solutions.`)
  }

  runAsNoncedFunction(thisArg, argNames, args) {
    let wrappedScript = `
      try {
        up.noncedEval.value = (function(${argNames.join()}) {
          ${this.script}
        }).apply(up.noncedEval.thisArg, up.noncedEval.args)
      } catch (error) {
        up.noncedEval.error = error
      }
    `

    let script
    try {
      up.noncedEval = { args, thisArg: thisArg }
      script = up.element.affix(document.body, 'script', { nonce: this.nonce, text: wrappedScript })
      if (up.noncedEval.error) {
        throw up.noncedEval.error
      } else {
        return up.noncedEval.value
      }
    } finally {
      up.noncedEval = undefined
      if (script) {
        script.remove()
      }
    }
  }

  allowedBy(allowedNonces) {
    return this.nonce && u.contains(allowedNonces, this.nonce)
  }

  static adoptNonces(element, allowedNonces) {
    if (!allowedNonces?.length) {
      return
    }

    // Looking up a nonce requires a DOM query.
    // For performance reasons we only do this when we're actually rewriting
    // a nonce, and only once per response.
    const getPageNonce = u.memoize(up.protocol.cspNonce)

    u.each(up.protocol.config.nonceableAttributes, (attribute) => {
      let matches = e.subtree(element, `[${attribute}^="nonce-"]`)
      u.each(matches, (match) => {
        let attributeValue = match.getAttribute(attribute)
        let callback = this.fromString(attributeValue)
        let warn = (message, ...args) => up.log.warn('up.render()', `Cannot use callback [${attribute}="${attributeValue}"]: ${message}`, ...args)

        if (!callback.allowedBy(allowedNonces)) {
          // Don't rewrite a nonce that the browser would have rejected.
          return warn("Callback's CSP nonce (%o) does not match response header (%o)", callback.nonce, allowedNonces)
        }

        // Replace the nonce with that of the current page.
        // This will allow the handler to run via #toFunction().
        let pageNonce = getPageNonce()
        if (!pageNonce) {
          return warn("Current page's CSP nonce is unknown")
        }
        callback.nonce = pageNonce
        match.setAttribute(attribute, callback.toString())
      })
    })
  }

}
