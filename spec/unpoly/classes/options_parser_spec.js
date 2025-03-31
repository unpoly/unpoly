const u = up.util
const e = up.element

describe('up.OptionsParser', function() {

  describe('#parse()', function() {

    const stringAttr = (element, attr) => element.getAttribute(attr)

    it('keeps the given key from the observed options', function() {
      const element = fixture('.element')
      const options = { foo: 1, bar: 2 }
      const parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'bar')
      expect(options.foo).toBe(1)
    })

    it('writes the value of an attribute with the given key (dasherized and prefixed with "up-") from the observed element', function() {
      const element = fixture('.element')
      element.setAttribute('up-foo-bar-baz', 'value')
      const options = {}
      const parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'fooBarBaz')
      expect(options.fooBarBaz).toBe('value')
    })

    it('allows to pass a custom element attribute name', function() {
      const element = fixture('.element')
      element.setAttribute('foo-bar', 'value')
      const options = {}
      const parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'baz', { attr: 'foo-bar' })
      expect(options.baz).toBe('value')
    })

    it('allows to pass multiple custom element attribute names that are queried in order to produce a value', function() {
      const element = fixture('.element')
      element.setAttribute('baz-bam', 'value')
      const options = {}
      const parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'baz', { attr: ['foo-bar', 'baz-bam'] })
      expect(options.baz).toBe('value')
    })

    it('prioritizes values from the observed options over values from the observed element', function() {
      const element = fixture('.element')
      element.setAttribute('up-foo', 'element value')
      const options = { foo: 'options value' }
      const parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'foo')
      expect(options.foo).toBe('options value')
    })

    it('writes undefined if neither observed options nor observed element produces a value', function() {
      const element = fixture('.element')
      const options = {}
      const parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'foo')
      expect(options.foo).toBeUndefined()
    })

    it('writes the given function to cast a value produced from the observed element', function() {
      const element = fixture('.element')
      element.setAttribute('up-foo', '123')
      const options = {}
      const parser = new up.OptionsParser(element, options)
      parser.parse(e.numberAttr, 'foo')
      expect(options.foo).toBe(123)
    })

    it('does not write the given function to cast a value produced from the observed options', function() {
      const element = fixture('.element')
      element.setAttribute('up-foo', '123')
      const options = { foo: '456' }
      const parser = new up.OptionsParser(element, options)
      parser.parse(e.numberAttr, 'foo')
      expect(options.foo).toBe('456')
    })

    describe('with { default } option', function() {

      it('does not write the given default value if the options produced a value', function() {
        const element = fixture('.element')
        const options = { foo: 'options value' }
        const parser = new up.OptionsParser(element, options)
        parser.parse(stringAttr, 'foo', { default: 'default value' })
        expect(options.foo).toBe('options value')
      })

      it("does not write the given default value if the element's attribute produced a value", function() {
        const element = fixture('.element', { 'up-foo': 'attribute value' })
        const options = {}
        const parser = new up.OptionsParser(element, options)
        parser.parse(stringAttr, 'foo', { default: 'default value' })
        expect(options.foo).toBe('attribute value')
      })

      it("writes the given default value if neither options nor observed element's attribute produce a value", function() {
        const element = fixture('.element')
        const options = {}
        const parser = new up.OptionsParser(element, options)
        parser.parse(stringAttr, 'foo', { default: 'default value' })
        expect(options.foo).toBe('default value')
      })
    })

    describe('with parser-wide { defaults } option', function() {
      it("writes the given default value if neither options nor observed element's attribute produce a value", function() {
        const element = fixture('.element')
        const options = {}
        const parser = new up.OptionsParser(element, options, { defaults: { foo: 'default value' } })
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBe('default value')
      })
    })

    describe('with parser-wide { fail: true } option', function() {

      it('uses a fail-prefixed option from the observed options', function() {
        const element = fixture('.element')
        const options = { foo: 1, failFoo: 2 }
        const parser = new up.OptionsParser(element, options, { fail: true })
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBe(1)
        expect(options.failFoo).toBe(2)
      })

      it('writes a [up-fail] prefixed option from the observed element', function() {
        const element = fixture('.element')
        element.setAttribute('up-foo', 'success value')
        element.setAttribute('up-fail-foo', 'failure value')
        const options = {}
        const parser = new up.OptionsParser(element, options, { fail: true })
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBe('success value')
        expect(options.failFoo).toBe('failure value')
      })

      it('writes undefined if neither observed options nor observed element produces a fail-prefixed value', function() {
        const element = fixture('.element')
        const options = {}
        const parser = new up.OptionsParser(element, options, { fail: true })
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBeUndefined()
        expect(options.failFoo).toBeUndefined()
      })

      it('also uses the default value for the fail-prefixed option', function() {
        const element = fixture('.element')
        const options = {}
        const parser = new up.OptionsParser(element, options, { fail: true })
        parser.parse(stringAttr, 'foo', { default: 'default value' })
        expect(options.foo).toBe('default value')
        expect(options.failFoo).toBe('default value')
      })

      describe('on-prefixed event handlers', function() {

        it('uses an onFail-prefixed option from the observed options', function() {
          const element = fixture('.element')
          const options = { onFoo: 1, onFailFoo: 2 }
          const parser = new up.OptionsParser(element, options, { fail: true })
          parser.parse(stringAttr, 'foo')
          expect(options.onFoo).toBe(1)
          expect(options.onFailFoo).toBe(2)
        })

        it('writes an [up-on-fail] prefixed option from the observed element', function() {
          const element = fixture('.element')
          element.setAttribute('up-on-foo', 'success value')
          element.setAttribute('up-on-fail-foo', 'failure value')
          const options = {}
          const parser = new up.OptionsParser(element, options, { fail: true })
          parser.parse(stringAttr, 'onFoo')
          expect(options.onFoo).toBe('success value')
          expect(options.onFailFoo).toBe('failure value')
        })
      })
    })

    describe('with parser-wide { closest: true } option', function() {
      it("also looks for matching attributes in the element's ancestors", function() {
        const container = fixture('.container[up-foo="value"]')
        const element = e.affix(container, '.element')
        const options = {}
        const parser = new up.OptionsParser(element, options, { closest: true })
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBe('value')
      })
    })
  })

  describe('#include()', function() {
    it('assigns the results of another parsing function', function() {
      const parsingFn = jasmine.createSpy('option parsing function').and.callFake((_element, _options, _parserOptions) => ({
        other: 'other-value'
      }))

      const element = fixture('.element', { 'up-attr': 'up-attr-value' })

      const options = {}
      const parser = new up.OptionsParser(element, options)

      parser.string('attr')
      parser.include(parsingFn)

      expect(parsingFn).toHaveBeenCalledWith(element, options, jasmine.any(Object))
      expect(options).toEqual({ attr: 'up-attr-value', other: 'other-value' })
    })

    it('forwards { defaults } as the only parser option', function() {
      const parsingFn = jasmine.createSpy('option parsing function').and.callFake((_element, _options, _parserOptions) => ({
        other: 'other-value'
      }))

      const element = fixture('.element', { 'my-prefix-attr': 'attr-value' })

      const options = {}
      const parserOptions = { fail: true, attrPrefix: 'my-prefix-', defaults: { fromDefault: 'defaultValue' } }
      const parser = new up.OptionsParser(element, options, parserOptions)

      parser.string('attr')
      parser.include(parsingFn)
      parser.string('fromDefault')

      expect(parsingFn).toHaveBeenCalledWith(element, options, { defaults: { fromDefault: 'defaultValue' } })
      expect(options).toEqual({ attr: 'attr-value', other: 'other-value', fromDefault: 'defaultValue' })
    })

  })
})

