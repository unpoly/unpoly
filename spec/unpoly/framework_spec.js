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
        try {
          // Quirks mode is "BackCompat". Standards mode is "CSS1Compat".
          Object.defineProperty(document, 'compatMode', { value: 'BackCompat' })
          expect(up.framework.isSupported()).toBe(false)
        } finally {
          document.compatMode = oldCompatMode
        }
      })

    })

  })
})
