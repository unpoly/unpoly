import * as e from '../../element.js'

/**
The names and values of the arguments for a callback string, and its `this`.
@internal
*/
export interface EvalEnv {
  argNames: string[]
  argValues: any[]
  thisContext?: any
}

// The inline script that _runAsScriptElement() inserts can only reach us through the global `up`.
declare module '../../../unpoly.js' {
  interface Up {
    /** @internal */
    noncedEval?: EvalEnv & { value?: any, error?: any }
  }
}

export class NonceableCallback {
  declare script: string
  declare nonce: string | undefined

  constructor(script: string, nonce?: string) {
    this.script = script
    this.nonce = nonce
  }

  static fromCallbackString(string: string): NonceableCallback {
    // With the s flag, the pattern matches any string, including one with line breaks.
    let match = string.match(/^(nonce-(\S+)\s)?(.*)$/s)!
    return new this(match[3], match[2])
  }

  unsafeEval(evalEnv: EvalEnv): any {
    if (this.nonce) {
      return this._runAsScriptElement(evalEnv)
    } else {
      return this._runAsFunction(evalEnv)
    }
  }

  toCallbackString(): string {
    return `nonce-${this.nonce} ${this.script}`
  }

  _runAsFunction({ argNames, argValues, thisContext }: EvalEnv): any {
    let fn = new Function(...argNames, this.script)
    return fn.apply(thisContext, argValues)
  }

  _runAsScriptElement(evalEnv: EvalEnv): any {
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
      // Delete rather than assign undefined, so window.up has no key left that is undefined.
      delete up.noncedEval
      scriptElement?.remove()
    }
  }

}
