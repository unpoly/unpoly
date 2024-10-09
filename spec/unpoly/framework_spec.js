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

      it('returns false if window.FormData is missing', function() {
        // Cannot use spyOnProperty() for window.FormData, as window does not return a property descriptor.
        let oldFormData = window.FormData
        try {
          window.FormData = undefined
          expect(up.framework.isSupported()).toBe(false)
       } finally {
          window.FormData = oldFormData
        }
      })

      it('returns false if window.DOMParser is missing', function() {
        // Cannot use spyOnProperty() for window.DOMParser, as window does not return a property descriptor.
        let oldDOMParser = window.DOMParser
        try {
          window.DOMParser = undefined
          expect(up.framework.isSupported()).toBe(false)
       } finally {
          window.DOMParser = oldDOMParser
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

      it('returns false if the browser does not support the :has() selector', function() {
        let oldSupports = CSS.supports
        spyOn(CSS, 'supports').and.callFake((selector) => {
          if (selector.includes(':has(')) {
            return false
          } else {
            return oldSupports.call(this, selector)
          }
        })

        expect(up.framework.isSupported()).toBe(false)
      })

      it('returns false if the browser does not support the :is() selector', function() {
        let oldSupports = CSS.supports
        spyOn(CSS, 'supports').and.callFake((selector) => {
          if (selector.includes(':has(')) {
            return false
          } else {
            return oldSupports.call(this, selector)
          }
        })

        expect(up.framework.isSupported()).toBe(false)
      })

    })

  })
})
