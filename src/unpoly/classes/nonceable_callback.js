const e = up.element

up.NonceableCallback = class NonceableCallback {

  constructor(script, nonce, policy) {
    this.script = script
    this.nonce = nonce
    this.policy = policy
  }

  static fromString(string, policy = 'block') {
    let match = string.match(/^(nonce-([^\s]+)\s)?(.*)$/)
    return new this(match[3], match[2], policy)
  }

  /*-
  Replacement for `new Function()` that can take a nonce to work with a strict Content Security Policy.

  It also prints an error when a strict CSP is active, but user supplies no nonce.

  ### Examples

  ```js
  new up.NonceableCallback('1 + 2', 'secret', up.script.config.policy.default).toFunction()
  ```

  @function up.NonceableCallback#toFunction
  @internal
  */
  toFunction(...argNames) {
    // Don't return a bound function so callers can re-bind to a different this.
    let me = this

    // For performance reason we delay callback verification until the script is called.
    // When parsing follow options on links we may parse a lot of callbacks, and most will never be used.
    return function(...args) {
      // There are multiple reasons why we explicitly check if a callback is allowed,
      // instead of relying on the document's CSP checks:
      //
      // (A) The user might have configured a rejecting script policy in up.script.config.policy.
      //     This policy might be stricter than the CSP, e.g. to prevent body scripts from executing.
      // (B) While we proactively block scripts in new fragments, we may have unprocessed scripts
      //     from the initial page load, or from an attacker that has some control over the HTML.
      // (C) We might have a nonced callback, meaning we need to execute using a <script nonce> element.
      //     With a viral strict-dynamic CSP the browser will happily let Unpoly execute *any* <script>,
      //     even if a nonce is missing or incorrect. In this case we want to explicitly check for
      //     a valid nonce. Otherwise an attacker could set an [up-on-loaded] callback with an incorrect nonce,
      //     trigger <script nonce> execution and run arbitrary JavaScript.
      return up.script.verifyAndRunCallback(me, argNames, this, args)
    }
  }

  runUnsafe(...runArgs) {
    if (this.nonce) {
      return this._runAsScriptElement(...runArgs)
    } else {
      return this._runAsFunction(...runArgs)
    }
  }

  toString() {
    return `nonce-${this.nonce} ${this.script}`
  }

  _runAsFunction(argNames, thisArg, args) {
    return new Function(...argNames, this.script).apply(thisArg, args)
  }

  _runAsScriptElement(argNames, thisArg, args) {
    let wrappedScript = `
      try {
        up.noncedEval.value = (function(${argNames.join()}) {
          ${this.script}
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
      scriptElement?.remove()
    }
  }

}
