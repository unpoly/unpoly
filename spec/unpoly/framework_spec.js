const u = up.util
const $ = jQuery

describe('up.framework', function() {

  describe('JavaScript functions', function() {

    describe('up.framework.isSupported', function() {

      it('returns true on a supported browser', function() {
        expect(up.framework.isSupported()).toBe(true)
      })

      it('returns false if window.Promise is missing', function() {
        // Cannot use spyOnProperty() for window.Promise, as window does not return a property descriptor.
        let oldPromise = window.Promise
        try {
          window.Promise = undefined
          expect(up.framework.isSupported()).toBe(false)
       } finally {
          window.Promise = oldPromise
        }
      })

      it('returns false if the document is missing a DOCTYPE, triggering quirks mode', function() {
        // Cannot use spyOnProperty() for document.compatMode, as document does not return a property descriptor.
        let oldCompatMode = document.compatMode
        expect(oldCompatMode).toEqual('CSS1Compat')
        try {
          // Quirks mode is "BackCompat". Standards mode is "CSS1Compat".
          Object.defineProperty(document, 'compatMode', { value: 'BackCompat', configurable: true })
          expect(up.framework.isSupported()).toBe(false)
        } finally {
          Object.defineProperty(document, 'compatMode', { value: oldCompatMode, configurable: true })
          // Make sure we cleaned up correctly
          expect(document.compatMode).toEqual(oldCompatMode)
        }
      })

      it('returns false for Edge 18', function() {
        spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.19582')
        expect(up.framework.isSupported()).toBe(false)
      })

      it('returns true for Edge 79+', function() {
        spyOnProperty(navigator, 'userAgent', 'get').and.returnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 Edg/92.0.902.78')
        expect(up.framework.isSupported()).toBe(true)
      })

    })

  })
})
