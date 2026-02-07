const e = up.element

up.NonceableCallback = class NonceableCallback {

  constructor(script, nonce) {
    this.script = script
    this.nonce = nonce
  }

  static fromString(string) {
    let match = string.match(/^(nonce-(\S+)\s)?(.*)$/)
    return new this(match[3], match[2])
  }

  unsafeEval(evalEnv) {
    if (this.nonce) {
      return this._runAsScriptElement(evalEnv)
    } else {
      return this._runAsFunction(evalEnv)
    }
  }

  toString() {
    return `nonce-${this.nonce} ${this.script}`
  }

  _runAsFunction({ argNames, argValues, thisContext }) {
    let fn = new Function(...argNames, this.script)
    return fn.apply(thisContext, argValues)
  }

  _runAsScriptElement(evalEnv) {
    // A strict CSP will block use of `eval()` or `new Function()`.
    // What we can do instead is insert an inline script that is allowed per a [nonce] attr.
    let wrappedScript = `
      try {
        up.noncedEval.value = (function(${evalEnv.argNames.join()}) {
          ${this.script}
        }).apply(up.noncedEval.thisContext, up.noncedEval.argValues)
      } catch (error) {
        up.noncedEval.error = error
      }
    `

    let scriptElement
    try {
      up.noncedEval = { ...evalEnv }
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
