u = up.util

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

    it('builds a callable function', function() {
      let callback = up.NonceableCallback.fromString('return a + b')
      let fn = callback.toFunction('a', 'b')
      expect(fn(2, 3)).toBe(5)
    })

    describe('when the Content Security Policy disallows eval()', function() {

      beforeEach(function() {
        spyOn(up.browser, 'canEval').and.returnValue(false)
        spyOn(up.protocol, 'cspNonce').and.returnValue('secret')
      })

      it('evals a function with an embedded nonce', function() {
        let callback = up.NonceableCallback.fromString('nonce-secret return a + b')
        let fn = callback.toFunction('a', 'b')
        expect(fn(2, 3)).toBe(5)
      })

      it('evals a function using a <script nonce> element', function() {
        spyOn(up.element, 'affix').and.callThrough()
        let callback = up.NonceableCallback.fromString('nonce-secret return a + b')
        let fn = callback.toFunction('a', 'b')
        fn()
        expect(up.element.affix).toHaveBeenCalledWith(document.body, 'script', jasmine.objectContaining({ nonce: 'secret' }))
      })

      it('re-throws errors thrown by the callback script', function() {
        let callback = up.NonceableCallback.fromString('nonce-secret throw "error message"')
        let fn = callback.toFunction()
        expect(fn).toThrow('error message')
      })

      it('returns a function that can be re-bound to another `this`', function() {
        let callback = up.NonceableCallback.fromString('nonce-secret return this')
        let fn = callback.toFunction()
        let newThis = new String('hi world')
        let value = fn.apply(newThis)
        expect(value).toBe(newThis)
      })

      it('returns a function that throws an explanation when no nonce is given', function() {
        let callback = up.NonceableCallback.fromString('return a + b')
        let fn = callback.toFunction('a', 'b')
        expect(fn).toThrowError(/Your Content Security Policy disallows .* https:\/\/unpoly.com\/csp/i)
      })

    })

  })

})
