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

      it('prepends a deprecation prefix to the given message and prints it to the warning log', function() {
        const spy = spyOn(up.log, 'warn')
        up.migrate.warn("a legacy warning")
        expect(spy).toHaveBeenCalledWith('unpoly-migrate', 'a legacy warning')
      })

      it('only prints a given message once', function() {
        const spy = spyOn(up.log, 'warn')
        up.migrate.warn("a very unique legacy warning")
        up.migrate.warn("a very unique legacy warning")
        expect(spy.calls.count()).toBe(1)
      })

      it('allows substitution')
    })


  })
}
