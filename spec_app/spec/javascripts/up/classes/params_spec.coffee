describe 'up.Params', ->

  u = up.util

  encodeBrackets = (str) ->
    str = str.replace(/\[/g, '%5B')
    str = str.replace(/\]/g, '%5D')
    str

  beforeEach ->
    jasmine.addMatchers
      toEqualAfterEncodingBrackets: (util, customEqualityTesters) ->
        compare: (actual, expected) ->
          pass: actual == encodeBrackets(expected)

  toQuery = (value) -> new up.Params(value).toQuery()
  toArray = (value) -> new up.Params(value).toArray()
  toFormData = (value) -> new up.Params(value).toFormData()

  describe '#toQuery', ->

    encodedSpace = '%20'

    it 'returns the query section for the given object', ->
      string = toQuery('foo-key': 'foo value', 'bar-key': 'bar value')
      expect(string).toEqual("foo-key=foo#{encodedSpace}value&bar-key=bar#{encodedSpace}value")

    it 'returns the query section for the given array with { name } and { value } keys', ->
      string = toQuery([
        { name: 'foo-key', value: 'foo value' },
        { name: 'bar-key', value: 'bar value' }
      ])
      expect(string).toEqual("foo-key=foo#{encodedSpace}value&bar-key=bar#{encodedSpace}value")

    it 'returns a given query string', ->
      string = toQuery('foo=bar')
      expect(string).toEqual('foo=bar')

    it 'returns an empty string for an empty object', ->
      string = toQuery({})
      expect(string).toEqual('')

    it 'returns an empty string for an empty string', ->
      string = toQuery('')
      expect(string).toEqual('')

    it 'returns an empty string for undefined', ->
      string = toQuery(undefined)
      expect(string).toEqual('')

    it 'URL-encodes characters in the key and value', ->
      string = toQuery({ 'äpfel': 'bäume' })
      expect(string).toEqual('%C3%A4pfel=b%C3%A4ume')

    it "sets a blank value after the equal sign if a key's value is a blank string", ->
      string = toQuery({'foo': ''})
      expect(string).toEqual('foo=')

    it 'omits non-primitive values (like Files) from the given params', ->
      # I would like to construct a File, but IE11 does not support the constructor
      blob = new Blob([])
      string = toQuery(string: 'foo', blob: blob)
      expect(string).toEqual('string=foo')

    it "omits an equal sign if a key's value is null", ->
      string = toQuery({'foo': null})
      expect(string).toEqual('foo')

    it 'URL-encodes plus characters', ->
      string = toQuery({ 'my+key': 'my+value' })
      expect(string).toEqual('my%2Bkey=my%2Bvalue')

#    describeCapability 'canInspectFormData', ->
#
#      it 'converts a FormData object to a query string', ->
#        fd = new FormData()
#        fd.append('key1', 'value1')
#        fd.append('key2', 'value2')
#        string = toQuery(fd)
#        expect(string).toEqual('key1=value1&key2=value2')

  describe '#toArray', ->

    it 'normalized null to an empty array', ->
      array = toArray(null)
      expect(array).toEqual([])

    it 'normalized undefined to an empty array', ->
      array = toArray(undefined)
      expect(array).toEqual([])

    it 'normalizes an object hash to an array of objects with { name } and { value } keys', ->
      array = toArray(
        'foo-key': 'foo-value'
        'bar-key': 'bar-value'
      )
      expect(array).toEqual([
        { name: 'foo-key', value: 'foo-value' },
        { name: 'bar-key', value: 'bar-value' },
      ])

    it 'builds multiple entries if the given object has array values', ->
      array = toArray(
        foo: ['1', '2']
        bar: '3'
      )
      expect(array).toEqual([
        { name: 'foo', value: '1' },
        { name: 'foo', value: '2' },
        { name: 'bar', value: '3' },
      ])

    it 'returns a given array without modification', ->
      array = toArray([
        { name: 'foo-key', value: 'foo-value' },
        { name: 'bar-key', value: 'bar-value' },
      ])
      expect(array).toEqual([
        { name: 'foo-key', value: 'foo-value' },
        { name: 'bar-key', value: 'bar-value' },
      ])

    it 'does not URL-encode special characters in keys or values', ->
      array = toArray(
        'äpfel': 'bäume'
      )
      expect(array).toEqual([
        { name: 'äpfel', value: 'bäume' },
      ])

    it 'does not URL-encode spaces in keys or values', ->
      array = toArray(
        'my key': 'my value'
      )
      expect(array).toEqual([
        { name: 'my key', value: 'my value' },
      ])

    it 'does not URL-encode ampersands in keys or values', ->
      array = toArray(
        'my&key': 'my&value'
      )
      expect(array).toEqual([
        { name: 'my&key', value: 'my&value' },
      ])

    it 'does not URL-encode equal signs in keys or values', ->
      array = toArray(
        'my=key': 'my=value'
      )
      expect(array).toEqual([
        { name: 'my=key', value: 'my=value' },
      ])

#    describeCapability 'canInspectFormData', ->
#
#      it 'converts a FormData object to an array', ->
#        fd = new FormData()
#        fd.append('key1', 'value1')
#        fd.append('key2', 'value2')
#        array = toArray(fd)
#        expect(array).toEqual([
#          { name: 'key1', value: 'value1' },
#          { name: 'key2', value: 'value2' },
#        ])


  describe 'up.params.toFormData', ->

    describeCapability 'canInspectFormData', ->

      it 'converts undefined to an empty FormData object', ->
        params = undefined
        formData = toFormData(params)
        expect(toArray(formData)).toEqual []

      it 'converts null to an empty FormData object', ->
        params = null
        formData = toFormData(params)
        expect(toArray(formData)).toEqual []

      it 'converts an object to a FormData object', ->
        params = {
          key1: 'value1',
          key2: 'value2'
        }
        formData = toFormData(params)
        expect(toArray(formData)).toEqual [
          { name: 'key1', value: 'value1' },
          { name: 'key2', value: 'value2' },
        ]

      it 'returns a FormData object unchanged', ->
        params = new FormData()
        formData = toFormData(params)
        expect(formData).toBe(params)

      it 'converts a query string to a FormData object', ->
        params = 'key1=value1&key2=value2'
        formData = toFormData(params)
        expect(toArray(formData)).toEqual [
          { name: 'key1', value: 'value1' },
          { name: 'key2', value: 'value2' },
        ]

      it 'unescapes percent-encoded characters from a query string', ->
        params = 'my%20key=my%20value'
        formData = toFormData(params)
        expect(toArray(formData)).toEqual [
          { name: 'my key', value: 'my value' }
        ]


  describe 'up.params.toObject', ->

    it "parses a query string of flat key/value pairs", ->
      expect(toObject("xfoo")).toEqual("xfoo": null)
      expect(toObject("foo=")).toEqual("foo": "")
      expect(toObject("foo=bar")).toEqual("foo": "bar")
      expect(toObject("foo=\"bar\"")).toEqual("foo": "\"bar\"")

      expect(toObject("foo=bar&foo=quux")).toEqual("foo": "quux")
      expect(toObject("foo&foo=")).toEqual("foo": "")
      expect(toObject("foo=1&bar=2")).toEqual("foo": "1", "bar": "2")
      expect(toObject("&foo=1&&bar=2")).toEqual("foo": "1", "bar": "2")
      expect(toObject("foo&bar=")).toEqual("foo": null, "bar": "")
      expect(toObject("foo=bar&baz=")).toEqual("foo": "bar", "baz": "")

    it 'URL-decodes keys and values', ->
      expect(toObject("my%20weird%20field=q1%212%22%27w%245%267%2Fz8%29%3F")).toEqual("my weird field": "q1!2\"'w$5&7/z8)?")
      expect(toObject("a=b&pid%3D1234=1023")).toEqual("pid=1234": "1023", "a": "b")
      # expect(-> up.params.toObject("foo%81E=1")).toThrowError() # invalid byte sequence in UTF-8

    it 'keeps the last value if the same key appears multiple time in the input', ->
      expect(toObject("foo=1&bar=2&foo=3")).toEqual("foo": "3", "bar": "2")

    it 'builds an array value if the key ends in "[]"', ->
      expect(toObject("foo[]=1&bar=2&foo[]=3")).toEqual("foo[]": ["1", "3"], "bar": "2")

    it 'ignores keys that would overwrite an Object prototype property', ->
      obj = toObject("foo=bar&hasOwnProperty=baz")
      expect(obj['foo']).toEqual('bar')
      expect(u.isFunction obj['hasOwnProperty']).toBe(true)

  describe 'up.params.add', ->

    describe '(with object)', ->

      it 'adds a single key and value', ->
        obj = { foo: 'one' }
        obj = up.params.add(obj, 'bar', 'two')
        expect(obj).toEqual { foo: 'one', bar: 'two' }

    describe '(with array)', ->

      it 'adds a single key and value', ->
        obj = [{ name: 'foo', value: 'one' }]
        obj = up.params.add(obj, 'bar', 'two')
        expect(obj).toEqual [{ name: 'foo', value: 'one' }, { name: 'bar', value: 'two' }]

    describe '(with query string)', ->

      it 'adds a new key/value pair to the end of a query', ->
        query = 'foo=one'
        query = up.params.add(query, 'bar', 'two')
        expect(query).toEqual('foo=one&bar=two')

      it 'does not add superfluous ampersands if the previous query was a blank string', ->
        query = ''
        query = up.params.add(query, 'bar', 'two')
        expect(query).toEqual('bar=two')

      it 'escapes special characters in the new key and value', ->
        query = 'foo=one'
        query = up.params.add(query, 'bär', 'twö')
        expect(query).toEqual('foo=one&b%C3%A4r=tw%C3%B6')

    describe '(with FormData)', ->

      describeCapability 'canInspectFormData', ->

        it 'adds a single entry', ->
          formData = new FormData()
          formData.append('key1', 'value1')
          up.params.add(formData, 'key2', 'value2')
          expect(up.params.toArray(formData)).toEqual [
            { name: 'key1', value: 'value1' },
            { name: 'key2', value: 'value2' },
          ]

    describe '(with missing params)', ->

      it 'returns an object with only the new key and value', ->
        obj = undefined
        obj = up.params.add(obj, 'bar', 'two')
        expect(obj).toEqual { bar: 'two' }


  describe 'up.params.get', ->

    describe '(with object)', ->

      it 'returns the value for the given name', ->
        obj = { foo: 'one', bar: 'two' }
        value = up.params.get(obj, 'bar')
        expect(value).toEqual('two')

      it 'returns undefined if no value is set for the given name', ->
        obj = { foo: 'one' }
        value = up.params.get(obj, 'bar')
        expect(value).toBeUndefined()

      it 'returns undefined for names that are also a basic object property', ->
        obj = {}
        value = up.params.get(obj, 'hasOwnProperty')
        expect(value).toBeUndefined()

    describe '(with array)', ->

      it 'returns the value of the first entry with the given name', ->
        array = [
          { name: 'foo', value: 'one' }
          { name: 'bar', value: 'two' }
          { name: 'foo', value: 'three' }
        ]
        value = up.params.get(array, 'foo')
        expect(value).toEqual('one')

      it 'returns undefined if there is no entry with the given name', ->
        array = [
          { name: 'foo', value: 'one' }
        ]
        value = up.params.get(array, 'bar')
        expect(value).toBeUndefined()

    describe '(with query string)', ->

      it 'returns the query param with the given name', ->
        query = 'foo=one&bar=two'
        value = up.params.get(query, 'bar')
        expect(value).toEqual('two')

      it 'returns undefined if there is no query param with the given name', ->
        query = 'foo=one'
        query = up.params.get(query, 'bar')
        expect(query).toBeUndefined()

      it 'unescapes percent-encoded characters in the returned value', ->
        query = 'foo=one%20two'
        value = up.params.get(query, 'foo')
        expect(value).toEqual('one two')

    describe '(with FormData)', ->

      describeCapability 'canInspectFormData', ->

        it 'returns the first entry with the given name', ->
          formData = new FormData()
          formData.append('key1', 'value1')
          formData.append('key2', 'value2')
          value = up.params.get(formData, 'key2')
          expect(value).toEqual('value2')

        it 'returns undefined if there is no entry with the given name', ->
          formData = new FormData()
          value = up.params.get(formData, 'key')
          expect(value).toBeUndefined()

    describe '(with missing params)', ->

      it 'returns undefined', ->
        params = undefined
        value = up.params.get(params, 'foo')
        expect(value).toBeUndefined()

  describe 'up.params.merge', ->

    describe '(with object)', ->

      it 'merges a flat object', ->
        obj = { a: '1', b: '2' }
        other = { c: '3', d: '4'}
        obj = up.params.merge(obj, other)
        expect(obj).toEqual({ a: '1', b: '2', c: '3', d: '4' })

      it 'merges an array', ->
        obj = { a: '1', b: '2' }
        other = [
          { name: 'c', value: '3' },
          { name: 'd', value: '4' }
        ]
        obj = up.params.merge(obj, other)
        expect(obj).toEqual({ a: '1', b: '2', c: '3', d: '4' })

      it 'merges a query string', ->
        obj = { a: '1', b: '2' }
        other = 'c=3&d=4'
        obj = up.params.merge(obj, other)
        expect(obj).toEqual({ a: '1', b: '2', c: '3', d: '4' })

      it 'does not change or crash when merged with undefined', ->
        obj = { a: '1', b: '2' }
        obj = up.params.merge(obj, undefined)
        expect(obj).toEqual({ a: '1', b: '2' })

      describeCapability 'canInspectFormData', ->

        it 'merges a FormData object', ->
          obj = { a: '1', b: '2' }
          formData = new FormData()
          formData.append('c', '3')
          formData.append('d', '4')
          merged = up.params.merge(obj, formData)
          expect(merged).toEqual({ a: '1', b: '2', c: '3', d: '4' })

    describe '(with array)', ->

      it 'merges a flat object', ->
        array = [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' }
        ]
        other = { c: '3', d: '4'}
        array = up.params.merge(array, other)
        expect(array).toEqual [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' },
          { name: 'c', value: '3' },
          { name: 'd', value: '4' }
        ]

      it 'merges another array', ->
        array = [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' }
        ]
        other = [
          { name: 'c', value: '3' },
          { name: 'd', value: '4' }
        ]
        array = up.params.merge(array, other)
        expect(array).toEqual [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' },
          { name: 'c', value: '3' },
          { name: 'd', value: '4' }
        ]

      it 'merges a query string', ->
        array = [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' }
        ]
        other = 'c=3&d=4'
        array = up.params.merge(array, other)
        expect(array).toEqual [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' },
          { name: 'c', value: '3' },
          { name: 'd', value: '4' }
        ]

      it 'does not change or crash when merged with undefined', ->
        array = [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' }
        ]
        array = up.params.merge(array, undefined)
        expect(array).toEqual [
          { name: 'a', value: '1' },
          { name: 'b', value: '2' }
        ]

      describeCapability 'canInspectFormData', ->

        it 'merges a FormData object', ->
          array = [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' }
          ]
          formData = new FormData()
          formData.append('c', '3')
          formData.append('d', '4')
          merged = up.params.merge(array, formData)
          expect(merged).toEqual [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' },
            { name: 'c', value: '3' },
            { name: 'd', value: '4' }
          ]


    describe '(with query)', ->

      it 'merges a flat object', ->
        query = 'a=1&b=2'
        other = { c: '3', d: '4'}
        query = up.params.merge(query, other)
        expect(query).toEqual('a=1&b=2&c=3&d=4')

      it 'merges an array', ->
        query = 'a=1&b=2'
        other = [
          { name: 'c', value: '3' },
          { name: 'd', value: '4' }
        ]
        query = up.params.merge(query, other)
        expect(query).toEqual('a=1&b=2&c=3&d=4')

      it 'merges another query string', ->
        query = 'a=1&b=2'
        other = 'c=3&d=4'
        query = up.params.merge(query, other)
        expect(query).toEqual('a=1&b=2&c=3&d=4')

      it 'does not change or crash when merged with undefined', ->
        query = 'a=1&b=2'
        query = up.params.merge(query, undefined)
        expect(query).toEqual('a=1&b=2')

      describeCapability 'canInspectFormData', ->

        it 'merges a FormData object', ->
          query = 'a=1&b=2'
          formData = new FormData()
          formData.append('c', '3')
          formData.append('d', '4')
          merged = up.params.merge(query, formData)
          expect(merged).toEqual('a=1&b=2&c=3&d=4')

  describe 'up.params.buildURL', ->

    it 'composes a URL from a base URL (without query section) and a query section', ->
      base = 'http://foo.bar/path'
      query = 'key=value'
      expect(up.params.buildURL(base, query)).toEqual('http://foo.bar/path?key=value')

    it 'accepts other forms of params (instead of query sections)', ->
      base = 'http://foo.bar/path'
      params = { key: 'value' }
      expect(up.params.buildURL(base, params)).toEqual('http://foo.bar/path?key=value')

    it 'adds more params to a base URL that already has a query section', ->
      base = 'http://foo.bar/path?key1=value1'
      params = { key2: 'value2' }
      expect(up.params.buildURL(base, params)).toEqual('http://foo.bar/path?key1=value1&key2=value2')

    it 'does not add a question mark to the base URL if the given params are blank', ->
      base = 'http://foo.bar/path'
      params = ''
      expect(up.params.buildURL(base, params)).toEqual('http://foo.bar/path')

  describe 'up.params.fromURL', ->

    it 'returns the query section from an URL, without leading question mark', ->
      url = 'http://foo.bar/path?key=value'
      expect(up.params.fromURL(url)).toEqual('key=value')

    it 'returns undefined if the URL has no query section', ->
      url = 'http://foo.bar/path'
      expect(up.params.fromURL(url)).toBeUndefined()


  describe 'up.params.fromForm', ->

    it 'serializes a form with multiple inputs', ->
      $form = affix('form')
      $form.append('<input name="key1" value="value1">')
      $form.append('<input name="key2" value="value2">')

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key1', value: 'value1' },
        { name: 'key2', value: 'value2' },
      ]

    it 'serializes an <input type="text"> with its default [value]', ->
      $form = affix('form')
      $form.append('<input type="text" name="key" value="value-from-attribute">')

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value-from-attribute' }
      ]

    it 'serializes an <input type="text"> that had its value property changed by a script', ->
      $form = affix('form')
      $input = $('<input type="text" name="key" value="value-from-attribute">').appendTo($form)
      $input[0].value = 'value-from-script'

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value-from-script' }
      ]

    it 'serializes an <input type="hidden"> with its default [value]', ->
      $form = affix('form')
      $form.append('<input type="hidden" name="key" value="value-from-attribute">')

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value-from-attribute' }
      ]

    it 'serializes an <input type="hidden"> that had its value property changed by a script', ->
      $form = affix('form')
      $input = $('<input type="hidden" name="key" value="value-from-attribute">').appendTo($form)
      $input[0].value = 'value-from-script'

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value-from-script' }
      ]

    it 'seralizes a <select> with its default selected option', ->
      $form = affix('form')
      $select = $('<select name="key"></select>').appendTo($form)
      $option1 = $('<option value="value1">').appendTo($select)
      $option2 = $('<option value="value2" selected>').appendTo($select)
      $option3 = $('<option value="value3">').appendTo($select)

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value2' }
      ]

    it 'seralizes a <select> that had its selection changed by a script', ->
      $form = affix('form')
      $select = $('<select name="key"></select>').appendTo($form)
      $option1 = $('<option value="value1">').appendTo($select)
      $option2 = $('<option value="value2" selected>').appendTo($select)
      $option3 = $('<option value="value3">').appendTo($select)

      $option2[0].selected = false
      $option3[0].selected = true

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value3' }
      ]

    it 'serializes a <select multiple> with multiple selected options into multiple params', ->
      $form = affix('form')
      $select = $('<select name="key" multiple></select>').appendTo($form)
      $option1 = $('<option value="value1">').appendTo($select)
      $option2 = $('<option value="value2" selected>').appendTo($select)
      $option3 = $('<option value="value3" selected>').appendTo($select)

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value2' },
        { name: 'key', value: 'value3' }
      ]

    it 'serializes an <input type="file">'

    it 'serializes an <input type="file" multiple> into multiple params'

    it 'includes an <input type="checkbox"> that was [checked] by default', ->
      $form = affix('form')
      $input = $('<input type="checkbox" name="key" value="value" checked>').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value' }
      ]

    it 'includes an <input type="checkbox"> that was checked by a script', ->
      $form = affix('form')
      $input = $('<input type="checkbox" name="key" value="value">').appendTo($form)
      $input[0].checked = true

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value' }
      ]

    it 'excludes an <input type="checkbox"> that is unchecked', ->
      $form = affix('form')
      $input = $('<input type="checkbox" name="key" value="value">').appendTo($form)
      params = up.params.fromForm($form)
      expect(params).toEqual []

    it 'includes a checked <input type="radio"> in a radio button group that was [checked] by default', ->
      $form = affix('form')
      $button1 = $('<input type="radio" name="key" value="value1">').appendTo($form)
      $button2 = $('<input type="radio" name="key" value="value2" checked>').appendTo($form)
      $button3 = $('<input type="radio" name="key" value="value3">').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value2' }
      ]

    it 'includes a checked <input type="radio"> in a radio button group that was checked by a script', ->
      $form = affix('form')
      $button1 = $('<input type="radio" name="key" value="value1">').appendTo($form)
      $button2 = $('<input type="radio" name="key" value="value2" checked>').appendTo($form)
      $button3 = $('<input type="radio" name="key" value="value3">').appendTo($form)

      $button2[0].checked = false
      $button3[0].checked = true

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value3' }
      ]

    it 'excludes an radio button group if no button is selected', ->
      $form = affix('form')
      $button1 = $('<input type="radio" name="key" value="value1">').appendTo($form)
      $button2 = $('<input type="radio" name="key" value="value2">').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual []

    it 'excludes an <input> that is [disabled] by default', ->
      $form = affix('form')
      $input = $('<input type="text" name="key" value="value" disabled>').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual []

    it 'excludes an <input> that was disabled by a script', ->
      $form = affix('form')
      $input = $('<input type="text" name="key" value="value">').appendTo($form)
      $input[0].disabled = true

      params = up.params.fromForm($form)
      expect(params).toEqual []

    it 'excludes an <input> without a [name] attribute', ->
      $form = affix('form')
      $input = $('<input type="text" value="value">').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual []

    it 'includes an <input readonly>', ->
      $form = affix('form')
      $input = $('<input type="text" name="key" value="value" readonly>').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'key', value: 'value' }
      ]

    it 'includes the focused submit button', ->
      $form = affix('form')
      $input = $('<input type="text" name="input-key" value="input-value">').appendTo($form)
      $submit1 = $('<button type="submit" name="submit1-key" value="submit1-value">').appendTo($form)
      $submit2 = $('<input type="submit" name="submit2-key" value="submit2-value">').appendTo($form)
      $submit3 = $('<input type="submit" name="submit3-key" value="submit3-value">').appendTo($form)

      $submit2.focus()

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'input-key', value: 'input-value' },
        { name: 'submit2-key', value: 'submit2-value' }
      ]

    it 'includes a the first submit button if no button is focused', ->
      $form = affix('form')
      $input = $('<input type="text" name="input-key" value="input-value">').appendTo($form)
      $submit1 = $('<button type="submit" name="submit1-key" value="submit1-value">').appendTo($form)
      $submit2 = $('<input type="submit" name="submit2-key" value="submit2-value">').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'input-key', value: 'input-value' },
        { name: 'submit1-key', value: 'submit1-value' }
      ]

    it 'excludes a submit button without a [name] attribute', ->
      $form = affix('form')
      $input = $('<input type="text" name="input-key" value="input-value">').appendTo($form)
      $submit = $('<button type="submit" value="submit-value">').appendTo($form)

      params = up.params.fromForm($form)
      expect(params).toEqual [
        { name: 'input-key', value: 'input-value' }
      ]


