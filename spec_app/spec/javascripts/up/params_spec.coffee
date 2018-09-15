describe 'up.params', ->

  u = up.util

  describe 'JavaScript functions', ->

    encodeBrackets = (str) ->
      str = str.replace(/\[/g, '%5B')
      str = str.replace(/\]/g, '%5D')
      str

    beforeEach ->
      jasmine.addMatchers
        toEqualAfterEncodingBrackets: (util, customEqualityTesters) ->
          compare: (actual, expected) ->
            pass: actual == encodeBrackets(expected)

    describe 'up.params.toQuery', ->

      encodedOpeningBracket = '%5B'
      encodedClosingBracket = '%5D'
      encodedSpace = '%20'

      it 'returns the query section for the given object', ->
        string = up.params.toQuery('foo-key': 'foo value', 'bar-key': 'bar value')
        expect(string).toEqual("foo-key=foo#{encodedSpace}value&bar-key=bar#{encodedSpace}value")

      it 'returns the query section for the given array with { name } and { value } keys', ->
        string = up.params.toQuery([
          { name: 'foo-key', value: 'foo value' },
          { name: 'bar-key', value: 'bar value' }
        ])
        expect(string).toEqual("foo-key=foo#{encodedSpace}value&bar-key=bar#{encodedSpace}value")

      it 'returns a given query string', ->
        string = up.params.toQuery('foo=bar')
        expect(string).toEqual('foo=bar')

      it 'returns an empty string for an empty object', ->
        string = up.params.toQuery({})
        expect(string).toEqual('')

      it 'returns an empty string for an empty string', ->
        string = up.params.toQuery('')
        expect(string).toEqual('')

      it 'returns an empty string for undefined', ->
        string = up.params.toQuery(undefined)
        expect(string).toEqual('')

      it 'URL-encodes characters in the key and value', ->
        string = up.params.toQuery({ 'äpfel': 'bäume' })
        expect(string).toEqual('%C3%A4pfel=b%C3%A4ume')

      it "sets a blank value after the equal sign if a key's value is a blank string", ->
        string = up.params.toQuery({'foo': ''})
        expect(string).toEqual('foo=')

      it "omits an equal sign if a key's value is null", ->
        string = up.params.toQuery({'foo': null})
        expect(string).toEqual('foo')

      it 'URL-encodes plus characters', ->
        string = up.params.toQuery({ 'my+key': 'my+value' })
        expect(string).toEqual('my%2Bkey=my%2Bvalue')

      it 'converts a FormData object to a query string'


    describe 'up.params.toArray', ->

      it 'normalized null to an empty array', ->
        array = up.params.toArray(null)
        expect(array).toEqual([])

      it 'normalized undefined to an empty array', ->
        array = up.params.toArray(undefined)
        expect(array).toEqual([])

      it 'normalizes an object hash to an array of objects with { name } and { value } keys', ->
        array = up.params.toArray(
          'foo-key': 'foo-value'
          'bar-key': 'bar-value'
        )
        expect(array).toEqual([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key', value: 'bar-value' },
        ])

      it 'returns a given array without modification', ->
        array = up.params.toArray([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key', value: 'bar-value' },
        ])
        expect(array).toEqual([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key', value: 'bar-value' },
        ])

      it 'does not URL-encode special characters in keys or values', ->
        array = up.params.toArray(
          'äpfel': 'bäume'
        )
        expect(array).toEqual([
          { name: 'äpfel', value: 'bäume' },
        ])

      it 'does not URL-encode spaces in keys or values', ->
        array = up.params.toArray(
          'my key': 'my value'
        )
        expect(array).toEqual([
          { name: 'my key', value: 'my value' },
        ])

      it 'does not URL-encode ampersands in keys or values', ->
        array = up.params.toArray(
          'my&key': 'my&value'
        )
        expect(array).toEqual([
          { name: 'my&key', value: 'my&value' },
        ])

      it 'does not URL-encode equal signs in keys or values', ->
        array = up.params.toArray(
          'my=key': 'my=value'
        )
        expect(array).toEqual([
          { name: 'my=key', value: 'my=value' },
        ])

      it 'converts a FormData object to an array'


    describe 'up.params.toFormData', ->

      it 'converts undefined to an empty FormData object'

      it 'converts null to an empty FormDat object'

      it 'converts a FormData object to a FormData object'

      it 'converts an object to a FormData object'

      it 'returns a FormData object unchanged'

      it 'converts a query string to a FormData object'

      it 'unescapes percent-encoded characters from a query string'


    describe 'up.params.toObject', ->

      it "parses flat key/value pairs", ->
        expect(up.params.toObject("xfoo")).toEqual("xfoo": null)
        expect(up.params.toObject("foo=")).toEqual("foo": "")
        expect(up.params.toObject("foo=bar")).toEqual("foo": "bar")
        expect(up.params.toObject("foo=\"bar\"")).toEqual("foo": "\"bar\"")

        expect(up.params.toObject("foo=bar&foo=quux")).toEqual("foo": "quux")
        expect(up.params.toObject("foo&foo=")).toEqual("foo": "")
        expect(up.params.toObject("foo=1&bar=2")).toEqual("foo": "1", "bar": "2")
        expect(up.params.toObject("&foo=1&&bar=2")).toEqual("foo": "1", "bar": "2")
        expect(up.params.toObject("foo&bar=")).toEqual("foo": null, "bar": "")
        expect(up.params.toObject("foo=bar&baz=")).toEqual("foo": "bar", "baz": "")

      it 'URL-decodes keys and values', ->
        expect(up.params.toObject("my%20weird%20field=q1%212%22%27w%245%267%2Fz8%29%3F")).toEqual("my weird field": "q1!2\"'w$5&7/z8)?")
        expect(up.params.toObject("a=b&pid%3D1234=1023")).toEqual("pid=1234": "1023", "a": "b")
        # expect(-> up.params.toObject("foo%81E=1")).toThrowError() # invalid byte sequence in UTF-8

      it 'ignores keys that would overwrite an Object prototype property', ->
        obj = up.params.toObject("foo=bar&hasOwnProperty=baz")
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

        it 'adds a single entry'


      describe '(with missing params)', ->

        it 'returns an object with only the new key and value', ->
          obj = undefined
          obj = up.params.add(obj, 'bar', 'two')
          expect(obj).toEqual { bar: 'two' }

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

        it 'merges a FormData object'

      describe '(with array)', ->

        it 'merges a flat object', ->
          obj = [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' }
          ]
          other = { c: '3', d: '4'}
          obj = up.params.merge(obj, other)
          expect(obj).toEqual [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' },
            { name: 'c', value: '3' },
            { name: 'd', value: '4' }
          ]

        it 'merges another array', ->
          obj = [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' }
          ]
          other = [
            { name: 'c', value: '3' },
            { name: 'd', value: '4' }
          ]
          obj = up.params.merge(obj, other)
          expect(obj).toEqual [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' },
            { name: 'c', value: '3' },
            { name: 'd', value: '4' }
          ]

        it 'merges a query string', ->
          obj = [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' }
          ]
          other = 'c=3&d=4'
          obj = up.params.merge(obj, other)
          expect(obj).toEqual [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' },
            { name: 'c', value: '3' },
            { name: 'd', value: '4' }
          ]

        it 'does not change or crash when merged with undefined', ->
          obj = [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' }
          ]
          obj = up.params.merge(obj, undefined)
          expect(obj).toEqual [
            { name: 'a', value: '1' },
            { name: 'b', value: '2' }
          ]

        it 'merges a FormData object'

      describe '(with query)', ->

        it 'merges a flat object', ->
          obj = 'a=1&b=2'
          other = { c: '3', d: '4'}
          obj = up.params.merge(obj, other)
          expect(obj).toEqual('a=1&b=2&c=3&d=4')

        it 'merges an array', ->
          obj = 'a=1&b=2'
          other = [
            { name: 'c', value: '3' },
            { name: 'd', value: '4' }
          ]
          obj = up.params.merge(obj, other)
          expect(obj).toEqual('a=1&b=2&c=3&d=4')

        it 'merges another query string', ->
          obj = 'a=1&b=2'
          other = 'c=3&d=4'
          obj = up.params.merge(obj, other)
          expect(obj).toEqual('a=1&b=2&c=3&d=4')

        it 'does not change or crash when merged with undefined', ->
          obj = 'a=1&b=2'
          obj = up.params.merge(obj, undefined)
          expect(obj).toEqual('a=1&b=2')

        it 'merges a FormData object'

    describe 'up.params.buildURL', ->

      it 'must have tests'

    describe 'up.params.fromForm', ->

      it 'must have tests'

    describe 'up.params.fromURL', ->

      it 'must have tests'
