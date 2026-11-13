const u = up.util

describe('up.CSPInfo', function() {

  beforeEach(function() {
    jasmine.addMatchers({
      toBeEmptyCSPInfo(util, customEqualityTesters) {
        return {
          compare(cspInfo) {
            return { pass: u.isBlank(cspInfo.nonces) && u.isBlank(cspInfo.declaration) }
          }
        }
      },
    })
  })

  describe('.fromHeader()', function() {

    it('returns the CSP nonces for script-src', function() {
      const info = up.internal.CSPInfo.fromHeader("script-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info.nonces).toEqual(['secret2', 'secret3'])
      expect(info.declaration).toEqual("script-src 'nonce-secret2' 'self' 'nonce-secret3'")
    })

    it('returns the CSP nonces for default-src if no script-src is set', function() {
      const info = up.internal.CSPInfo.fromHeader("default-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info.nonces).toEqual(['secret2', 'secret3'])
      expect(info.declaration).toEqual("default-src 'nonce-secret2' 'self' 'nonce-secret3'")
    })

    it('ignores CSP nonces for default-src if script-src is set', function() {
      const info = up.internal.CSPInfo.fromHeader("default-src 'nonce-secret1'; script-src 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info.nonces).toEqual(['secret2', 'secret3'])
      expect(info.declaration).toEqual("script-src 'nonce-secret2' 'self' 'nonce-secret3'")
    })

    it('returns an empty object if the header has neither default-src nor script-src directive', function() {
      const info = up.internal.CSPInfo.fromHeader("image-src 'nonce-secret2'")
      expect(info).toBeEmptyCSPInfo()
    })

    it('does not parse a script-src-elem declaration, because we also validate attribute callbacks', function() {
      const info = up.internal.CSPInfo.fromHeader("script-src-elem: 'nonce-secret2' 'self' 'nonce-secret3'")
      expect(info).toBeEmptyCSPInfo()
    })

    it('does not parse a style-src declaration', function() {
      const info = up.internal.CSPInfo.fromHeader("style-src 'nonce-secret'")
      expect(info).toBeEmptyCSPInfo()
    })

    it('returns an empty object if the header is missing', function() {
      const info = up.internal.CSPInfo.fromHeader(null)
      expect(info).toBeEmptyCSPInfo()
    })

  })

  describe('.none()', function() {

    it('returns an empty up.CSPInfo instance', function() {
      expect(up.internal.CSPInfo.none()).toBeEmptyCSPInfo()
    })

  })
  
})

describe('up.NonceableCallback', function() {

  describe('.fromCallbackString()', function() {

    it('parses a string of JavaScript', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('a + b')
      expect(callback.nonce).toBeMissing()
      expect(callback.script).toEqual('a + b')
    })

    it('parses a string of JavaScript with a prefixed nonce', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('nonce-secret a + b')
      expect(callback.nonce).toEqual('secret')
      expect(callback.script).toEqual('a + b')
    })

    it('parses a string of JavaScript that spans multiple lines', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('\n  a()\n  b()\n')
      expect(callback.nonce).toBeMissing()
      expect(callback.script).toEqual('\n  a()\n  b()\n')
    })

    it('parses a string of JavaScript that spans multiple lines with a prefixed nonce', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('nonce-secret a()\nb()')
      expect(callback.nonce).toEqual('secret')
      expect(callback.script).toEqual('a()\nb()')
    })

  })

  describe('#toCallbackString()', function() {

    it('serializes the nonce and script into a string that .fromCallbackString() parses back', function() {
      let callback = new up.internal.NonceableCallback('a + b', 'secret')
      let string = callback.toCallbackString()
      expect(string).toEqual('nonce-secret a + b')

      let parsed = up.internal.NonceableCallback.fromCallbackString(string)
      expect(parsed.nonce).toEqual('secret')
      expect(parsed.script).toEqual('a + b')
    })

  })

  describe('#unsafeEval()', function() {

    it('runs the callback with the given argNames and argValues', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('return a + b')

      let callFnWithArgs = () => {
        let evalEnv = {
          argNames: ['a', 'b'],
          argValues: [2, 3],
        }
        return callback.unsafeEval(evalEnv)
      }

      if (specs.config.csp === 'none') {
        expect(callFnWithArgs()).toBe(5)
      } else {
        expect(callFnWithArgs).toThrowError(EvalError)
      }
    })

    it('runs the callback with the given thisContext', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('return this.length + a')

      let callFnWithArgs = () => {
        let evalEnv = {
          thisContext: new String('hello'),
          argNames: ['a'],
          argValues: [2],
        }
        return callback.unsafeEval(evalEnv)
      }

      if (specs.config.csp === 'none') {
        expect(callFnWithArgs()).toBe(7)
      } else {
        expect(callFnWithArgs).toThrowError(EvalError)
      }
    })

    it('runs a function with an embedded nonce', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('nonce-specs-nonce return a + b')
      let result = callback.unsafeEval({
        argNames: ['a', 'b'],
        argValues: [2, 3],
      })
      expect(result).toBe(5)
    })

    it('re-throws errors thrown by the callback script', function() {
      let callback = up.internal.NonceableCallback.fromCallbackString('nonce-specs-nonce throw "error message"')
      let doEval = () => callback.unsafeEval({ argNames: [], argValues: [] })
      expect(doEval).toThrow('error message')
    })

  })

})
