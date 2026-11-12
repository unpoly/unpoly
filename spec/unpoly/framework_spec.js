const u = up.util
const $ = jQuery

describe('up.framework', function() {

  describe('JavaScript', function() {

    describe('.up-booted', function() {

      it('is set on the <html> element after booting', function() {
        expect(up.framework.booted).toBe(true)
        expect(document.documentElement).toHaveClass('up-booted')
      })

    })

    describe('classes on window.up', function() {

      // Minifiers rename our classes. chromedriver's browser log would then say `Uncaught m: …`
      // instead of `Uncaught up.Aborted: …`, unless we set these properties (see src/unpoly.ts).
      // tooling/test/build/class_names.test.mjs checks what Chrome shows.

      it("sets each class's name and [Symbol.toStringTag] to its public name", function() {
        let keys = Object.keys(up).filter((key) => /^[A-Z]/.test(key) && up[key].prototype)
        expect(keys).toContain('Aborted')
        expect(keys).toContain('Request')

        for (let key of keys) {
          expect(up[key].name).toBe(`up.${key}`)
          // A data property on the class's own prototype, since Chrome ignores a getter.
          expect(Object.getOwnPropertyDescriptor(up[key].prototype, Symbol.toStringTag)?.value).toBe(`up.${key}`)
        }
      })

      it('tags the class of a layer in any mode as up.Layer', async function() {
        let layers = [up.layer.root]
        for (let mode of ['modal', 'popup', 'drawer', 'cover']) {
          layers.push(await up.layer.open({ mode, content: 'content', origin: document.body }))
        }

        for (let layer of layers) {
          expect(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(layer), Symbol.toStringTag)?.value).toBe('up.Layer')
        }
      })

    })

    describe('evaluation order', function() {

      // esbuild turns top-level `const`, `let` and `class` into `var`. So when a module reads a
      // binding from a module that is not evaluated yet (an import cycle entered from the wrong
      // side, see src/unpoly.ts), it gets `undefined` instead of an error. An api object that
      // captured such a binding puts `undefined` on window.up. This test catches that. It can't see
      // a binding that a module only keeps for itself (see src/unpoly.ts).
      //
      // We only check data properties. A getter reads its bindings when it is called, after every
      // module has been evaluated, so its value says nothing about the order. Calling it could also
      // print a deprecation warning from unpoly-migrate.

      it('publishes no undefined value on window.up, in its namespaces or on up.internal', function() {
        let problems = []

        function check(object, path) {
          let values = {}
          for (let key of Object.getOwnPropertyNames(object)) {
            let descriptor = Object.getOwnPropertyDescriptor(object, key)
            if (!('value' in descriptor)) continue
            values[key] = descriptor.value
            if (descriptor.value === undefined) problems.push(`${path}.${key} is undefined`)
          }
          return values
        }

        for (let [key, value] of Object.entries(check(up, 'up'))) {
          // A namespace, like up.link or up.internal. Not a class or a function.
          if (typeof value === 'object' && value !== null) check(value, `up.${key}`)
        }

        expect(problems).toEqual([])
      })

    })

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
