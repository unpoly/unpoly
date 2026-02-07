const u = up.util

describe('up.NonceableCallback', function() {

  describe('.fromString()', function() {

    it('parses a string of JavaScript', function() {
      let callback = up.NonceableCallback.fromString('a + b')
      expect(callback.nonce).toBeMissing()
      expect(callback.script).toEqual('a + b')
    })

    it('parses a string of JavaScript with a prefixed nonce', function() {
      let callback = up.NonceableCallback.fromString('nonce-secret a + b')
      expect(callback.nonce).toEqual('secret')
      expect(callback.script).toEqual('a + b')
    })

  })

  describe('#unsafeEval()', function() {

    it('runs the callback with the given argNames and argValues', function() {
      let callback = up.NonceableCallback.fromString('return a + b')

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
      let callback = up.NonceableCallback.fromString('return this.length + a')

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
      let callback = up.NonceableCallback.fromString('nonce-specs-nonce return a + b')
      let result = callback.unsafeEval({
        argNames: ['a', 'b'],
        argValues: [2, 3],
      })
      expect(result).toBe(5)
    })

    it('re-throws errors thrown by the callback script', function() {
      let callback = up.NonceableCallback.fromString('nonce-specs-nonce throw "error message"')
      let doEval = () => callback.unsafeEval({ argNames: [], argValues: []})
      expect(doEval).toThrow('error message')
    })

  })

})
