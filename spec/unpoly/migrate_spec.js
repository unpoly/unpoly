const u = up.util
const e = up.element

if (up.migrate.loaded) {

  describe('up.migrate', function() {

    describe('up.migrate.transformAttribute()', function() {

      it('runs a callback with each new element that has the given attribute', function() {
        let callback = jasmine.createSpy('callback')
        up.migrate.transformAttribute('my-attr', callback)

        let container = fixture('.container')
        let elementWithAttr = e.affix(container, 'div[my-attr]')
        let elementWithoutAttr = e.affix(container, 'div[other-attr]')

        up.hello(container)

        expect(callback).toHaveBeenCalledWith(elementWithAttr, jasmine.anything())
        expect(callback).not.toHaveBeenCalledWith(elementWithoutAttr, jasmine.anything())
      })

      it('passes the current attribute value as a second callback attribute', function() {
        let callback = jasmine.createSpy('callback')
        up.migrate.transformAttribute('my-attr', callback)

        let element = fixture('div[my-attr="value"]')

        up.hello(element)

        expect(callback).toHaveBeenCalledWith(element, 'value')
      })

      describe('with { scope } option', function() {

        it('only sees an element when it has both the given attribute and it also matches the given scope selector', function() {
          let callback = jasmine.createSpy('callback')
          up.migrate.transformAttribute('my-attr', { scope: '.scope' }, callback)

          let container = fixture('.container')
          let elementInScope = e.affix(container, '.scope[my-attr]')
          let elementOutsideScope = e.affix(container, '.other[my-attr]')

          up.hello(container)

          expect(callback).toHaveBeenCalledWith(elementInScope, jasmine.anything())
          expect(callback).not.toHaveBeenCalledWith(elementOutsideScope, jasmine.anything())
        })

      })

    })

    describe('up.migrate.renamedAttribute()', function() {

      it('renames the given old attribute to the given new attribute', function() {
        up.migrate.renamedAttribute('old-attr', 'new-attr')
        let element = fixture('.element[old-attr="attr-value"]')

        up.hello(element)

        expect(element).toHaveAttribute('new-attr', 'attr-value')
      })

      describe('with { mapValue } option', function() {

        it('transforms the attribute value through the given function', function() {
          up.migrate.renamedAttribute('old-attr', 'new-attr', { mapValue: (value) => value.toUpperCase() })
          let element = fixture('.element[old-attr="attr-value"]')

          up.hello(element)

          expect(element).toHaveAttribute('new-attr', 'ATTR-VALUE')
        })

      })

    })

    describe('up.migrate.fixKey()', function() {

      it('renames a key in the given object', function() {
        let obj = { foo: 123 }
        up.migrate.fixKey(obj, 'foo', 'bar')

        expect(obj).not.toHaveKey('foo')
        expect(obj.bar).toBe(123)
      })

      it('does not set the new key if the object never had the old key', function() {
        let obj = { }
        up.migrate.fixKey(obj, 'foo', 'bar')

        expect(obj).not.toHaveKey('foo')
        expect(obj).not.toHaveKey('bar')

      })

      it('prints the object in the warning', function() {
        const warnSpy = up.migrate.warn.mock()
        let obj = { foo: 123 }
        up.migrate.fixKey(obj, 'foo', 'bar')

        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('(found in %o)'), 'foo', 'bar', obj)
      })

      it('names the object by the given { label }', function() {
        const warnSpy = up.migrate.warn.mock()
        up.migrate.fixKey({ foo: 123 }, 'foo', 'bar', { label: 'render options' })

        expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe('Property { foo } has been renamed to { bar } (found in render options)')
      })

      it('prints a labeled warning only once for multiple objects', function() {
        const errorSpy = spyOn(up.log, 'error')
        up.migrate.fixKey({ foo: 1 }, 'foo', 'bar', { label: 'render options' })
        up.migrate.fixKey({ foo: 2 }, 'foo', 'bar', { label: 'render options' })

        expect(errorSpy.calls.count()).toBe(1)
      })

    })

    describe('up.migrate.renamedProperty()', function() {

      it('warns when the old property is accessed', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { newKey: 'value' }
        up.migrate.renamedProperty(object, 'oldKey', 'newKey')

        expect(object.oldKey).toBe('value')
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('(found in %o)'), 'oldKey', 'newKey', object)
      })

      it('names the object by the given { label }', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { newKey: 'value' }
        up.migrate.renamedProperty(object, 'oldKey', 'newKey', { label: 'up.foo.config' })

        expect(object.oldKey).toBe('value')
        expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe('Property up.foo.config.oldKey has been renamed to up.foo.config.newKey')
      })

      it('logs the given { warning } instead of the default warning', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { newKey: 'value' }
        up.migrate.renamedProperty(object, 'oldKey', 'newKey', { warning: 'Custom warning' })

        expect(object.oldKey).toBe('value')
        expect(warnSpy).toHaveBeenCalledWith('Custom warning')
      })

    })

    describe('up.migrate.removedProperty()', function() {

      it('warns when the property is accessed', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { removedKey: 'value' }
        up.migrate.removedProperty(object, 'removedKey')

        expect(object.removedKey).toBe('value')
        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringContaining('(found in %o)'), 'removedKey', object)
      })

      it('names the object by the given { label }', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { removedKey: 'value' }
        up.migrate.removedProperty(object, 'removedKey', { label: 'up.foo.config' })

        expect(object.removedKey).toBe('value')
        expect(u.sprintf(...warnSpy.calls.argsFor(0))).toBe('Property up.foo.config.removedKey has been removed without replacement')
      })

      it('does not warn when the object is enumerated, e.g. when another warning prints it', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = { keptKey: 'kept', removedKey: 'value' }
        up.migrate.removedProperty(object, 'removedKey')

        expect(Object.keys(object)).toEqual(['keptKey'])
        JSON.stringify(object)
        expect(warnSpy).not.toHaveBeenCalled()
      })

      it('starts with the given { value } without a warning when defined again, like when up.framework.reset() runs a config patch', function() {
        const warnSpy = up.migrate.warn.mock()
        const object = {}
        up.migrate.removedProperty(object, 'removedKey', { value: 'default' })
        object.removedKey = 'changed'
        warnSpy.calls.reset()

        const valueRef = up.migrate.removedProperty(object, 'removedKey', { value: 'default' })

        expect(valueRef[0]).toBe('default')
        expect(warnSpy).not.toHaveBeenCalled()
      })

    })

    describe('up.modal and up.popup', function() {

      it('do not warn about their deprecated config when enumerated', function() {
        expect(Object.keys(up.modal)).not.toContain('config')
        expect(Object.keys(up.popup)).not.toContain('config')
      })

    })

    describe('up.migrate.renamedPackage()', function() {

      it('prints a warning and forwards the call to the new module', function() {
        const warnSpy = up.migrate.warn.mock()
        const value = up.dom
        expect(warnSpy).toHaveBeenCalled()
        expect(value).toBe(up.fragment)
      })

    })

    describe('up.migrate.warn()', function() {

      it('prepends a deprecation prefix to the given message and prints it to the error log', function() {
        const spy = spyOn(up.log, 'error')
        up.migrate.warn("a legacy warning")
        expect(spy).toHaveBeenCalledWith('unpoly-migrate', 'a legacy warning')
      })

      it('only prints a given message once', function() {
        const spy = spyOn(up.log, 'error')
        up.migrate.warn("a very unique legacy warning")
        up.migrate.warn("a very unique legacy warning")
        expect(spy.calls.count()).toBe(1)
      })

      it('allows substitution', function() {
        const spy = spyOn(up.log, 'error')
        up.migrate.warn('%s is a substituted warning', 'foo')
        up.migrate.warn('%s is a substituted warning', 'bar')

        // Messages with different substitutions are not deduplicated
        expect(spy.calls.allArgs()).toEqual([
          ['unpoly-migrate', '%s is a substituted warning', 'foo'],
          ['unpoly-migrate', '%s is a substituted warning', 'bar'],
        ])
      })

      describe('log level', function() {
        it('logs errors by default, so test suites that fail on console errors find deprecations', function() {
          const warnSpy = spyOn(up.log, 'warn')
          const errorSpy = spyOn(up.log, 'error')
          up.migrate.warn("a legacy warning")
          expect(errorSpy).toHaveBeenCalledWith('unpoly-migrate', 'a legacy warning')
          expect(warnSpy).not.toHaveBeenCalled()
        })

        it('logs warnings with up.migrate.config.logLevel = "warn"', function() {
          up.migrate.config.logLevel = 'warn'
          const warnSpy = spyOn(up.log, 'warn')
          const errorSpy = spyOn(up.log, 'error')
          up.migrate.warn("a legacy warning")
          expect(warnSpy).toHaveBeenCalledWith('unpoly-migrate', 'a legacy warning')
          expect(errorSpy).not.toHaveBeenCalled()
        })

        it('does not log anything with up.migrate.config.logLevel = "none"', function() {
          up.migrate.config.logLevel = 'none'
          const warnSpy = spyOn(up.log, 'warn')
          const errorSpy = spyOn(up.log, 'error')
          up.migrate.warn("a legacy warning")
          expect(errorSpy).not.toHaveBeenCalled()
          expect(warnSpy).not.toHaveBeenCalled()
        })

      })
    })


  })
}
