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

  describe('#toFunction()', function() {

    beforeEach(function() {
      spyOn(up.protocol, 'cspNonce').and.returnValue('secret')
    })

    it('builds a callable function', function() {
      let callback = up.NonceableCallback.fromString('return a + b')

      let callFnWithArgs = () => {
        let fn = callback.toFunction('a', 'b')
        return fn(2, 3)
      }

      if (specs.config.csp) {
        expect(callFnWithArgs).toThrowError(EvalError)
      } else {
        expect(callFnWithArgs()).toBe(5)
      }
    })

    it('evals a function with an embedded nonce', function() {
      let callback = up.NonceableCallback.fromString('nonce-specs-nonce return a + b')
      let fn = callback.toFunction('a', 'b')
      expect(fn(2, 3)).toBe(5)
    })

    it('evals a function using a <script nonce> element', function() {
      spyOn(up.element, 'affix').and.callThrough()
      let callback = up.NonceableCallback.fromString('nonce-specs-nonce return a + b')
      let fn = callback.toFunction('a', 'b')
      fn()
      expect(up.element.affix).toHaveBeenCalledWith(document.body, 'script', jasmine.objectContaining({ nonce: 'specs-nonce' }))
    })

    it('re-throws errors thrown by the callback script', function() {
      let callback = up.NonceableCallback.fromString('nonce-specs-nonce throw "error message"')
      let fn = callback.toFunction()
      expect(fn).toThrow('error message')
    })

    it('returns a function that can be re-bound to another `this`', function() {
      let callback = up.NonceableCallback.fromString('nonce-specs-nonce return this')
      let fn = callback.toFunction()
      let newThis = new String('hi world')
      let value = fn.apply(newThis)
      expect(value).toBe(newThis)
    })

  })

})
