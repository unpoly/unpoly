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

      it 'returns the query section for the given nested object', ->
        string = up.params.toQuery('foo-key': { 'bar-key': 'bar-value' }, 'bam-key': 'bam-value')
        expect(string).toEqual("foo-key#{encodedOpeningBracket}bar-key#{encodedClosingBracket}=bar-value&bam-key=bam-value")

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

      describe 'nested params', ->

        it "build nested query strings correctly" , ->
          expect(up.params.toQuery("foo": null)).toEqualAfterEncodingBrackets "foo"
          expect(up.params.toQuery("foo": "")).toEqualAfterEncodingBrackets "foo="
          expect(up.params.toQuery("foo": "bar")).toEqualAfterEncodingBrackets "foo=bar"

          expect(up.params.toQuery("foo": [null])).toEqualAfterEncodingBrackets "foo[]"
          expect(up.params.toQuery("foo": [""])).toEqualAfterEncodingBrackets "foo[]="
          expect(up.params.toQuery("foo": ["bar"])).toEqualAfterEncodingBrackets "foo[]=bar"
          expect(up.params.toQuery('foo': [])).toEqualAfterEncodingBrackets ''
          expect(up.params.toQuery('foo': {})).toEqualAfterEncodingBrackets ''
          expect(up.params.toQuery('foo': 'bar', 'baz': [])).toEqualAfterEncodingBrackets 'foo=bar'
          expect(up.params.toQuery('foo': 'bar', 'baz': {})).toEqualAfterEncodingBrackets 'foo=bar'

          expect(up.params.toQuery('foo': null, 'bar': '')).toEqualAfterEncodingBrackets 'foo&bar='
          expect(up.params.toQuery('foo': 'bar', 'baz': '')).toEqualAfterEncodingBrackets 'foo=bar&baz='
          expect(up.params.toQuery('foo': ['1', '2'])).toEqualAfterEncodingBrackets 'foo[]=1&foo[]=2'
          expect(up.params.toQuery('foo': 'bar', 'baz': ['1', '2', '3'])).toEqualAfterEncodingBrackets 'foo=bar&baz[]=1&baz[]=2&baz[]=3'
          expect(up.params.toQuery('foo': ['bar'], 'baz': ['1', '2', '3'])).toEqualAfterEncodingBrackets 'foo[]=bar&baz[]=1&baz[]=2&baz[]=3'
          expect(up.params.toQuery('foo': ['bar'], 'baz': ['1', '2', '3'])).toEqualAfterEncodingBrackets 'foo[]=bar&baz[]=1&baz[]=2&baz[]=3'
          expect(up.params.toQuery('x': { 'y': { 'z': '1' } })).toEqualAfterEncodingBrackets 'x[y][z]=1'
          expect(up.params.toQuery('x': { 'y': { 'z': ['1'] } })).toEqualAfterEncodingBrackets 'x[y][z][]=1'
          expect(up.params.toQuery('x': { 'y': { 'z': ['1', '2'] } })).toEqualAfterEncodingBrackets 'x[y][z][]=1&x[y][z][]=2'
          expect(up.params.toQuery('x': { 'y': [{ 'z': '1' }] })).toEqualAfterEncodingBrackets 'x[y][][z]=1'
          expect(up.params.toQuery('x': { 'y': [{ 'z': ['1'] }] })).toEqualAfterEncodingBrackets 'x[y][][z][]=1'
          expect(up.params.toQuery('x': { 'y': [{ 'z': '1', 'w': '2' }] })).toEqualAfterEncodingBrackets 'x[y][][z]=1&x[y][][w]=2'
          expect(up.params.toQuery('x': { 'y': [{ 'v': { 'w': '1' } }] })).toEqualAfterEncodingBrackets 'x[y][][v][w]=1'
          expect(up.params.toQuery('x': { 'y': [{ 'z': '1', 'v': { 'w': '2' } }] })).toEqualAfterEncodingBrackets 'x[y][][z]=1&x[y][][v][w]=2'
          expect(up.params.toQuery('x': { 'y': [{ 'z': '1' }, { 'z': '2' }] })).toEqualAfterEncodingBrackets 'x[y][][z]=1&x[y][][z]=2'
          expect(up.params.toQuery('x': { 'y': [{ 'z': '1', 'w': 'a' }, { 'z': '2', 'w': '3' }] })).toEqualAfterEncodingBrackets 'x[y][][z]=1&x[y][][w]=a&x[y][][z]=2&x[y][][w]=3'
          expect(up.params.toQuery({"foo": ["1", ["2"]]})).toEqualAfterEncodingBrackets 'foo[]=1&foo[][]=2'

        it 'performs the inverse function of up.params.toObject', ->
          objects = [
            {"foo": null, "bar": ""},
            {"foo": "bar", "baz": ""},
            {"foo": ["1", "2"]},
            {"foo": "bar", "baz": ["1", "2", "3"]},
            {"foo": ["bar"], "baz": ["1", "2", "3"]},
            {"foo": ["1", "2"]},
            {"foo": "bar", "baz": ["1", "2", "3"]},
            {"x": {"y": {"z": "1"}}},
            {"x": {"y": {"z": ["1"]}}},
            {"x": {"y": {"z": ["1", "2"]}}},
            {"x": {"y": [{"z": "1"}]}},
            {"x": {"y": [{"z": ["1"]}]}},
            {"x": {"y": [{"z": "1", "w": "2"}]}},
            {"x": {"y": [{"v": {"w": "1"}}]}},
            {"x": {"y": [{"z": "1", "v": {"w": "2"}}]}},
            {"x": {"y": [{"z": "1"}, {"z": "2"}]}},
            {"x": {"y": [{"z": "1", "w": "a"}, {"z": "2", "w": "3"}]}},
            {"foo": ["1", ["2"]]},
          ]

          u.each objects, (object) ->
            query = up.params.toQuery(object)
            revertedObject = up.params.toObject(query)
            expect(revertedObject).toEqual(object)

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

      it 'normalizes a nested object hash to a flat array using param naming conventions', ->
        array = up.params.toArray(
          'foo-key': 'foo-value'
          'bar-key': {
            'bam-key': 'bam-value'
            'baz-key': {
              'qux-key': 'qux-value'
            }
          }
        )
        expect(array).toEqual([
          { name: 'foo-key', value: 'foo-value' },
          { name: 'bar-key[bam-key]', value: 'bam-value' },
          { name: 'bar-key[baz-key][qux-key]', value: 'qux-value' },
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
          'äpfel': { 'bäume': 'börse' }
        )
        expect(array).toEqual([
          { name: 'äpfel[bäume]', value: 'börse' },
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

      it 'ignores nested keys that would overwrite an Object prototype property', ->
        obj = up.params.toObject("foo[hasOwnProperty]=bar")
        expect(u.isFunction obj['foo']['hasOwnProperty']).toBe(true)

      describe 'nested params', ->

        it 'parses nested key/value pairs', ->
          expect(up.params.toObject("foo[]")).toEqual("foo": [null])
          expect(up.params.toObject("foo[]=")).toEqual("foo": [""])
          expect(up.params.toObject("foo[]=bar")).toEqual("foo": ["bar"])
          expect(up.params.toObject("foo[]=bar&foo")).toEqual("foo": null)
          expect(up.params.toObject("foo[]=bar&foo[")).toEqual("foo": ["bar"], "foo[": null)
          expect(up.params.toObject("foo[]=bar&foo[=baz")).toEqual("foo": ["bar"], "foo[": "baz")
          expect(up.params.toObject("foo[]=bar&foo[]")).toEqual("foo": ["bar", null])
          expect(up.params.toObject("foo[]=bar&foo[]=")).toEqual("foo": ["bar", ""])

          expect(up.params.toObject("foo[]=1&foo[]=2")).toEqual("foo": ["1", "2"])
          expect(up.params.toObject("foo=bar&baz[]=1&baz[]=2&baz[]=3")).toEqual("foo": "bar", "baz": ["1", "2", "3"])
          expect(up.params.toObject("foo[]=bar&baz[]=1&baz[]=2&baz[]=3")).toEqual("foo": ["bar"], "baz": ["1", "2", "3"])

          expect(up.params.toObject("x[y][z]=1")).toEqual("x": {"y": {"z": "1"}})
          expect(up.params.toObject("x[y][z][]=1")).toEqual("x": {"y": {"z": ["1"]}})
          expect(up.params.toObject("x[y][z]=1&x[y][z]=2")).toEqual("x": {"y": {"z": "2"}})
          expect(up.params.toObject("x[y][z][]=1&x[y][z][]=2")).toEqual("x": {"y": {"z": ["1", "2"]}})

          expect(up.params.toObject("x[y][][z]=1")).toEqual("x": {"y": [{"z": "1"}]})
          expect(up.params.toObject("x[y][][z][]=1")).toEqual("x": {"y": [{"z": ["1"]}]})
          expect(up.params.toObject("x[y][][z]=1&x[y][][w]=2")).toEqual("x": {"y": [{"z": "1", "w": "2"}]})

          expect(up.params.toObject("x[y][][v][w]=1")).toEqual("x": {"y": [{"v": {"w": "1"}}]})
          expect(up.params.toObject("x[y][][z]=1&x[y][][v][w]=2")).toEqual("x": {"y": [{"z": "1", "v": {"w": "2"}}]})

          expect(up.params.toObject("x[y][][z]=1&x[y][][z]=2")).toEqual("x": {"y": [{"z": "1"}, {"z": "2"}]})

          expect(up.params.toObject("x[y][][z]=1&x[y][][w]=a&x[y][][z]=2&x[y][][w]=3")).toEqual("x": {"y": [{"z": "1", "w": "a"}, {"z": "2", "w": "3"}]})

          expect(up.params.toObject("x[][y]=1&x[][z][w]=a&x[][y]=2&x[][z][w]=b")).toEqual("x": [{"y": "1", "z": {"w": "a"}}, {"y": "2", "z": {"w": "b"}}])
          expect(up.params.toObject("x[][z][w]=a&x[][y]=1&x[][z][w]=b&x[][y]=2")).toEqual("x": [{"y": "1", "z": {"w": "a"}}, {"y": "2", "z": {"w": "b"}}])

          expect(up.params.toObject("data[books][][data][page]=1&data[books][][data][page]=2")).toEqual("data": { "books": [{ "data": { "page": "1"}}, { "data": { "page": "2"}}] })

          expect(up.params.toObject('x[][a]=1&x[][b]=2&foo=bar&x[][c]=3')).toEqual {"x": [{"a": "1", "b": "2", "c": "3"}], "foo": "bar"}
          expect(up.params.toObject('foo[]=1&foo[][]=2')).toEqual {"foo": ["1", ["2"]]}

        it 'throws an error if multiple key/value pairs cannot belong to the same data structure', ->
          expect(-> up.params.toObject("x[y]=1&x[y]z=2")).toThrowError() # expected Hash (got String) for param `y'
          expect(-> up.params.toObject("x[y]=1&x[]=1")).toThrowError() # expected Array \(got [^)]*\) for param `x'
          expect(-> up.params.toObject("x[y]=1&x[y][][w]=2")).toThrowError() # expected Array (got String) for param `y'

        it "only moves to a new array when the full key has been seen", ->
          expect(up.params.toObject("x[][y][][z]=1&x[][y][][w]=2")).toEqual("x": [{"y": [{"z": "1", "w": "2"}]}])

          expect(up.params.toObject(
            "x[][id]=1&x[][y][a]=5&x[][y][b]=7&x[][z][id]=3&x[][z][w]=0&x[][id]=2&x[][y][a]=6&x[][y][b]=8&x[][z][id]=4&x[][z][w]=0"
          )).toEqual("x": [
              {"id": "1", "y": {"a": "5", "b": "7"}, "z": {"id": "3", "w": "0"}},
              {"id": "2", "y": {"a": "6", "b": "8"}, "z": {"id": "4", "w": "0"}},
            ]
          )

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

        it 'merges a nested object, deep-merging the other object', ->
          obj = { a: '1', b: { c: '2', d: '3' } }
          other = { e: '4', b: { f: '5', g: '6' }}
          obj = up.params.merge(obj, other)
          expect(obj).toEqual { a: '1', e: '4', b: { c: '2', d: '3', f: '5', g: '6' } }

        it 'merges a nested object, overwriting (and not merging) nested arrays', ->
          obj = { a: ['1', '2'] }
          other = { a: ['3', '4'] }
          obj = up.params.merge(obj, other)
          expect(obj).toEqual { a: ['3', '4'] }

        it 'merges an array', ->
          obj = { a: '1', b: '2' }
          other = [
            { name: 'c', value: '3' },
            { name: 'd', value: '4' }
          ]
          obj = up.params.merge(obj, other)
          expect(obj).toEqual({ a: '1', b: '2', c: '3', d: '4' })

        it 'merges an array with nested keys', ->
          obj = { a: '1', b: { c: '2', d: '3' } }
          other = [
            { name: 'e', value: '4' },
            { name: 'b[f]', value: '5' },
            { name: 'b[g]', value: '6' }
          ]
          obj = up.params.merge(obj, other)
          expect(obj).toEqual { a: '1', e: '4', b: { c: '2', d: '3', f: '5', g: '6' } }

        it 'merges a query string', ->
          obj = { a: '1', b: '2' }
          other = 'c=3&d=4'
          obj = up.params.merge(obj, other)
          expect(obj).toEqual({ a: '1', b: '2', c: '3', d: '4' })

        it 'merges a query string with nested keys', ->
          obj = { a: '1', b: { c: '2', d: '3' } }
          other = 'e=4&b[f]=5&b[g]=6'
          obj = up.params.merge(obj, other)
          expect(obj).toEqual { a: '1', e: '4', b: { c: '2', d: '3', f: '5', g: '6' } }

        it 'does not change or crash when merged with undefined', ->
          obj = { a: '1', b: '2' }
          obj = up.params.merge(obj, undefined)
          expect(obj).toEqual({ a: '1', b: '2' })

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

        it 'merges a nested object', ->
          obj = [
            { name: 'a', value: '1' },
            { name: 'b[c]', value: '2' },
            { name: 'b[d]', value: '3' }
          ]
          other = [
            { name: 'e', value: '4' },
            { name: 'b[f]', value: '5' },
            { name: 'b[g]', value: '6' }
          ]
          obj = up.params.merge(obj, other)

          expect(obj).toEqual [
            { name: 'a', value: '1' },
            { name: 'b[c]', value: '2' },
            { name: 'b[d]', value: '3' },
            { name: 'e', value: '4' },
            { name: 'b[f]', value: '5' },
            { name: 'b[g]', value: '6' }
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

      describe '(with query)', ->

        it 'merges a flat object', ->
          obj = 'a=1&b=2'
          other = { c: '3', d: '4'}
          obj = up.params.merge(obj, other)
          expect(obj).toEqual('a=1&b=2&c=3&d=4')

        it 'merges a nested object', ->
          obj = encodeBrackets('a=1&b[c]=2&b[d]=3')
          other = { e: '4', b: { f: '5', g: '6' }}
          obj = up.params.merge(obj, other)
          expect(obj).toEqualAfterEncodingBrackets 'a=1&b[c]=2&b[d]=3&e=4&b[f]=5&b[g]=6'

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
