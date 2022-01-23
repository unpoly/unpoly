u = up.util
e = up.element

describe 'up.OptionsParser', ->

  describe '#parse', ->

    stringAttr = (element, attr) ->
      element.getAttribute(attr)    

    it 'keeps the given key from the observed options', ->
      element = fixture('.element')
      options = { foo: 1, bar: 2 }
      parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'bar')
      expect(options.foo).toBe(1)

    it 'writes the value of an attribute with the given key (dasherized and prefixed with "up-") from the observed element', ->
      element = fixture('.element')
      element.setAttribute('up-foo-bar-baz', 'value')
      options = {}
      parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'fooBarBaz')
      expect(options.fooBarBaz).toBe('value')

    it 'allows to pass a custom element attribute name', ->
      element = fixture('.element')
      element.setAttribute('foo-bar', 'value')
      options = {}
      parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'baz', attr: 'foo-bar')
      expect(options.baz).toBe('value')

    it 'allows to pass multiple custom element attribute names that are queried in order to produce a value', ->
      element = fixture('.element')
      element.setAttribute('baz-bam', 'value')
      options = {}
      parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'baz', attr: ['foo-bar', 'baz-bam'])
      expect(options.baz).toBe('value')

    it 'prioritizes values from the observed options over values from the observed element', ->
      element = fixture('.element')
      element.setAttribute('up-foo', 'element value')
      options = { foo: 'options value' }
      parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'foo')
      expect(options.foo).toBe('options value')

    it 'writes undefined if neither observed options nor observed element produces a value', ->
      element = fixture('.element')
      options = {}
      parser = new up.OptionsParser(element, options)
      parser.parse(stringAttr, 'foo')
      expect(options.foo).toBeUndefined()

    it 'writes the given function to cast a value produced from the observed element', ->
      element = fixture('.element')
      element.setAttribute('up-foo', '123')
      options = {}
      parser = new up.OptionsParser(element, options)
      parser.parse(e.numberAttr, 'foo')
      expect(options.foo).toBe(123)

    it 'does not write the given function to cast a value produced from the observed options', ->
      element = fixture('.element')
      element.setAttribute('up-foo', '123')
      options = { foo: '456' }
      parser = new up.OptionsParser(element, options)
      parser.parse(e.numberAttr, 'foo')
      expect(options.foo).toBe('456')

    describe 'with { default } option', ->

      it 'does not write the given default value if the options produced a value'

      it 'does not write the given default value if the element produced a value'

      it 'writes the given default value if neither options nor observed element produce a value', ->
        element = fixture('.element')
        options = {}
        parser = new up.OptionsParser(element, options)
        parser.parse(stringAttr, 'foo', default: 'default value')
        expect(options.foo).toBe('default value')

    describe 'with parser-wide { defaults } option', ->

    describe 'with parser-wide { fail: true } option', ->

      it 'uses a fail-prefixed option from the observed options', ->
        element = fixture('.element')
        options = { foo: 1, failFoo: 2 }
        parser = new up.OptionsParser(element, options, fail: true)
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBe(1)
        expect(options.failFoo).toBe(2)

      it 'writes a fail-prefixed option from the observed element', ->
        element = fixture('.element')
        element.setAttribute('up-foo', 'success value')
        element.setAttribute('up-fail-foo', 'failure value')
        options = {}
        parser = new up.OptionsParser(element, options, fail: true)
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBe('success value')
        expect(options.failFoo).toBe('failure value')

      it 'writes undefined if neither observed options nor observed element produces a fail-prefixed value', ->
        element = fixture('.element')
        options = {}
        parser = new up.OptionsParser(element, options, fail: true)
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBeUndefined()
        expect(options.failFoo).toBeUndefined()

      it 'also uses the default value for the fail-prefixed option', ->
        element = fixture('.element')
        options = {}
        parser = new up.OptionsParser(element, options, fail: true)
        parser.parse(stringAttr, 'foo', default: 'default value')
        expect(options.foo).toBe('default value')
        expect(options.failFoo).toBe('default value')

    describe 'with parser-wide { closest: true } option', ->

      it "also looks for matching attributes in the element's ancestors", ->
        container = fixture('.container[up-foo="value"]')
        element = e.affix(container, '.element')
        options = {}
        parser = new up.OptionsParser(element, options, closest: true)
        parser.parse(stringAttr, 'foo')
        expect(options.foo).toBe('value')

    describe 'with parser-wide { only } option', ->
