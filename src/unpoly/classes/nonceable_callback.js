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
    let script = this.script
    if (this.nonce) {
      // Don't return a bound function so callers can re-bind to a different this.
      let callbackThis = this
      return function(...args) {
        return callbackThis._runAsNoncedFunction(script, this, argNames, args)
      }
    } else {
      return new Function(...argNames, script)
    }
  }

  toString() {
    return `nonce-${this.nonce} ${this.script}`
  }

  _runAsNoncedFunction(script, thisArg, argNames, args) {
    let wrappedScript = `
      try {
        up.noncedEval.value = (function(${argNames.join()}) {
          ${script}
        }).apply(up.noncedEval.thisArg, up.noncedEval.args)
      } catch (error) {
        up.noncedEval.error = error
      }
    `

    let scriptElement
    try {
      up.noncedEval = { args, thisArg: thisArg }
      scriptElement = e.affix(document.body, 'script', { nonce: this.nonce, text: wrappedScript })
      if (up.noncedEval.error) {
        throw up.noncedEval.error
      } else {
        return up.noncedEval.value
      }
    } finally {
      up.noncedEval = undefined
      if (scriptElement) {
        scriptElement.remove()
      }
    }
  }

}
