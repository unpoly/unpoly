const u = up.util
const $ = jQuery

describe('up.Params', function() {

  const encodeBrackets = function(str) {
    str = str.replace(/\[/g, '%5B')
    str = str.replace(/\]/g, '%5D')
    return str
  }

  beforeEach(function() {
    jasmine.addMatchers({
      toEqualAfterEncodingBrackets(util, customEqualityTesters) {
        return {
          compare(actual, expected) {
            return { pass: actual === encodeBrackets(expected) }
          }
        }
      }
    })
  })

  const toObject = (value) => new up.Params(value).toObject()
  const toQuery = (value) => new up.Params(value).toQuery()
  const toArray = (value) => new up.Params(value).toArray()
  const toFormData = (value) => new up.Params(value).toFormData()

  describe('#toQuery', function() {

    const encodedSpace = '%20'

    it('returns the query section for the given object', function() {
      const string = toQuery({ 'foo-key': 'foo value', 'bar-key': 'bar value' })
      expect(string).toEqual(`foo-key=foo${encodedSpace}value&bar-key=bar${encodedSpace}value`)
    })

    it('returns the query section for the given array with { name } and { value } keys', function() {
      const string = toQuery([
        { name: 'foo-key', value: 'foo value' },
        { name: 'bar-key', value: 'bar value' }
      ])
      expect(string).toEqual(`foo-key=foo${encodedSpace}value&bar-key=bar${encodedSpace}value`)
    })

    it('returns a given query string', function() {
      const string = toQuery('foo=bar')
      expect(string).toEqual('foo=bar')
    })

    it('returns an empty string for an empty object', function() {
      const string = toQuery({})
      expect(string).toEqual('')
    })

    it('returns an empty string for an empty string', function() {
      const string = toQuery('')
      expect(string).toEqual('')
    })

    it('returns an empty string for undefined', function() {
      const string = toQuery(undefined)
      expect(string).toEqual('')
    })

    it('URL-encodes characters in the key and value', function() {
      const string = toQuery({ 'äpfel': 'bäume' })
      expect(string).toEqual('%C3%A4pfel=b%C3%A4ume')
    })

    it("sets a blank value after the equal sign if a key's value is a blank string", function() {
      const string = toQuery({ 'foo': '' })
      expect(string).toEqual('foo=')
    })

    it('omits non-primitive values (like Files) from the given params', function() {
      // I would like to construct a File, but IE11 does not support the constructor
      const blob = new Blob([])
      const string = toQuery({ string: 'foo', blob })
      expect(string).toEqual('string=foo')
    })

    it("omits an equal sign if a key's value is null", function() {
      const string = toQuery({ 'foo': null })
      expect(string).toEqual('foo')
    })

    it('URL-encodes plus characters', function() {
      const string = toQuery({ 'my+key': 'my+value' })
      expect(string).toEqual('my%2Bkey=my%2Bvalue')
    })
  })

//    describeCapability 'canInspectFormData', ->
//
//      it 'converts a FormData object to a query string', ->
//        fd = new FormData()
//        fd.append('key1', 'value1')
//        fd.append('key2', 'value2')
//        string = toQuery(fd)
//        expect(string).toEqual('key1=value1&key2=value2')

  describe('#toArray', function() {

    it('normalized null to an empty array', function() {
      const array = toArray(null)
      expect(array).toEqual([])
    })

    it('normalized undefined to an empty array', function() {
      const array = toArray(undefined)
      expect(array).toEqual([])
    })

    it('normalizes an object hash to an array of objects with { name } and { value } keys', function() {
      const array = toArray({
        'foo-key': 'foo-value',
        'bar-key': 'bar-value'
      })
      expect(array).toEqual([
        { name: 'foo-key', value: 'foo-value' },
        { name: 'bar-key', value: 'bar-value' },
      ])
    })

    it('normalizes a FormData object to an array of objects with { name } and { value } keys', function() {
      const formData = new FormData()
      formData.append('foo-key', 'foo-value')
      formData.append('bar-key', 'bar-value')

      const array = toArray(formData)

      expect(array).toEqual([
        { name: 'foo-key', value: 'foo-value' },
        { name: 'bar-key', value: 'bar-value' },
      ])
    })

    it('builds multiple entries if the given object has array values', function() {
      const array = toArray({
        foo: ['1', '2'],
        bar: '3'
      })
      expect(array).toEqual([
        { name: 'foo', value: '1' },
        { name: 'foo', value: '2' },
        { name: 'bar', value: '3' },
      ])
    })

    it('returns a given array without modification', function() {
      const array = toArray([
        { name: 'foo-key', value: 'foo-value' },
        { name: 'bar-key', value: 'bar-value' },
      ])
      expect(array).toEqual([
        { name: 'foo-key', value: 'foo-value' },
        { name: 'bar-key', value: 'bar-value' },
      ])
    })

    it('does not URL-encode special characters in keys or values', function() {
      const array = toArray({
        'äpfel': 'bäume'
      })
      expect(array).toEqual([
        { name: 'äpfel', value: 'bäume' },
      ])
    })

    it('does not URL-encode spaces in keys or values', function() {
      const array = toArray({
        'my key': 'my value'
      })
      expect(array).toEqual([
        { name: 'my key', value: 'my value' },
      ])
    })

    it('does not URL-encode ampersands in keys or values', function() {
      const array = toArray({
        'my&key': 'my&value'
      })
      expect(array).toEqual([
        { name: 'my&key', value: 'my&value' },
      ])
    })

    it('does not URL-encode equal signs in keys or values', function() {
      const array = toArray({
        'my=key': 'my=value'
      })
      expect(array).toEqual([
        { name: 'my=key', value: 'my=value' },
      ])
    })
  })

//    describeCapability 'canInspectFormData', ->
//
//      it 'converts a FormData object to an array', ->
//        fd = new FormData()
//        fd.append('key1', 'value1')
//        fd.append('key2', 'value2')
//        array = toArray(fd)
//        expect(array).toEqual([
//          { name: 'key1', value: 'value1' },
//          { name: 'key2', value: 'value2' },
//        ])


  describe('#toFormData', function() {

    if (FormData.prototype.entries) {

      it('converts undefined to an empty FormData object', function() {
        const params = undefined
        const formData = toFormData(params)
        expect(toArray(formData)).toEqual([])
      })

      it('converts null to an empty FormData object', function() {
        const params = null
        const formData = toFormData(params)
        expect(toArray(formData)).toEqual([])
      })

      it('converts an object to a FormData object', function() {
        const params = {
          key1: 'value1',
          key2: 'value2'
        }
        const formData = toFormData(params)
        expect(toArray(formData)).toEqual([
          { name: 'key1', value: 'value1' },
          { name: 'key2', value: 'value2' },
        ])
      })

      it('returns a FormData with the same values', function() {
        const input = new FormData()
        input.append('foo', 'bar')

        const formData = toFormData(input)
        expect(formData.get('foo')).toEqual('bar')
      })

      it('converts a query string to a FormData object', function() {
        const params = 'key1=value1&key2=value2'
        const formData = toFormData(params)
        expect(toArray(formData)).toEqual([
          { name: 'key1', value: 'value1' },
          { name: 'key2', value: 'value2' },
        ])
      })

      it('unescapes percent-encoded characters from a query string', function() {
        const params = 'my%20key=my%20value'
        const formData = toFormData(params)
        expect(toArray(formData)).toEqual([
          { name: 'my key', value: 'my value' }
        ])
      })
    }
  })


  describe('#toObject', function() {

    it("parses a query string of flat key/value pairs", function() {
      expect(toObject("xfoo")).toEqual({ "xfoo": null })
      expect(toObject("foo=")).toEqual({ "foo": "" })
      expect(toObject("foo=bar")).toEqual({ "foo": "bar" })
      expect(toObject("foo=\"bar\"")).toEqual({ "foo": "\"bar\"" })

      expect(toObject("foo=bar&foo=quux")).toEqual({ "foo": "quux" })
      expect(toObject("foo&foo=")).toEqual({ "foo": "" })
      expect(toObject("foo=1&bar=2")).toEqual({ "foo": "1", "bar": "2" })
      expect(toObject("&foo=1&&bar=2")).toEqual({ "foo": "1", "bar": "2" })
      expect(toObject("foo&bar=")).toEqual({ "foo": null, "bar": "" })
      expect(toObject("foo=bar&baz=")).toEqual({ "foo": "bar", "baz": "" })
    })

    it('URL-decodes keys and values', function() {
      expect(toObject("my%20weird%20field=q1%212%22%27w%245%267%2Fz8%29%3F")).toEqual({ "my weird field": "q1!2\"'w$5&7/z8)?" })
      expect(toObject("a=b&pid%3D1234=1023")).toEqual({ "pid=1234": "1023", "a": "b" })
    })
    // expect(-> up.params.toObject("foo%81E=1")).toThrowError() # invalid byte sequence in UTF-8

    it('keeps the last value if the same key appears multiple time in the input', () => expect(toObject("foo=1&bar=2&foo=3")).toEqual({
      "foo": "3",
      "bar": "2"
    }))

    it('builds an array value if the key ends in "[]"', () => expect(toObject("foo[]=1&bar=2&foo[]=3")).toEqual({
      "foo[]": ["1", "3"],
      "bar": "2"
    }))

    it('ignores keys that would overwrite an Object prototype property', function() {
      const obj = toObject("foo=bar&hasOwnProperty=baz")
      expect(obj['foo']).toEqual('bar')
      expect(u.isFunction(obj['hasOwnProperty'])).toBe(true)
    })

    it('builds an object from the entries of a FormData object', function() {
      const formData = new FormData()
      formData.append('foo-key', 'foo-value')
      formData.append('bar-key', 'bar-value')

      const obj = toObject(formData)

      expect(obj).toEqual({
        'foo-key': 'foo-value',
        'bar-key': 'bar-value'
      })
    })
  })

  describe('#add', function() {

    it('adds a single key and value', function() {
      const params = new up.Params({ foo: 'one' })
      params.add('bar', 'two')
      expect(params.toObject()).toEqual({ foo: 'one', bar: 'two' })
    })

    it('stores multiple entries with the same name', function() {
      const params = new up.Params({ foo: 'one' })
      params.add('foo', 'two')
      expect(params.toArray()).toEqual([
        { name: 'foo', value: 'one' },
        { name: 'foo', value: 'two' }
      ])
    })
  })

  describe('#get', function() {
    describe('(with object)', function() {

      it('returns the value for the given name', function() {
        const params = new up.Params({ foo: 'one', bar: 'two' })
        const value = params.get('bar')
        expect(value).toEqual('two')
      })

      it('returns undefined if no value is set for the given name', function() {
        const params = new up.Params({ foo: 'one' })
        const value = params.get('bar')
        expect(value).toBeUndefined()
      })

      it('returns undefined for names that are also a basic object property', function() {
        const params = new up.Params({})
        const value = params.get('hasOwnProperty')
        expect(value).toBeUndefined()
      })

      it('returns the first matching entries if there are are multiple entries with the same name', function() {
        const params = new up.Params('foo=one&foo=two')
        const value = params.get('foo')
        expect(value).toEqual('one')
      })
    })
  })

  describe('#getAll', function() {
    it('returns all entries with the given name', function() {
      const params = new up.Params({})
      params.add('foo', '1')
      params.add('foo', '2')

      expect(params.getAll('foo')).toEqual(['1', '2'])
    })

    it('returns all entries with the given array param name', function() {
      const params = new up.Params({})
      params.add('foo[]', '1')
      params.add('foo[]', '2')

      expect(params.getAll('foo[]')).toEqual(['1', '2'])
    })
  })

  describe('#delete', () => it('deletes all entries with the given name'))

  describe('#set', function() {

    it('adds an entry with the given name and value')

    it('deletes any previous entries with the same name')
  })

  describe('#toURL', function() {

    it('composes a URL from a base URL (without query section) and a query section', function() {
      const base = 'http://foo.bar/path'
      const params = new up.Params('key=value')
      expect(params.toURL(base)).toEqual('http://foo.bar/path?key=value')
    })

    it('accepts other forms of params (instead of query sections)', function() {
      const base = 'http://foo.bar/path'
      const params = new up.Params({ key: 'value' })
      expect(params.toURL(base)).toEqual('http://foo.bar/path?key=value')
    })

    it('adds more params to a base URL that already has a query section', function() {
      const base = 'http://foo.bar/path?key1=value1'
      const params = new up.Params({ key2: 'value2' })
      expect(params.toURL(base)).toEqual('http://foo.bar/path?key1=value1&key2=value2')
    })

    it('does not add a question mark to the base URL if the given params are blank', function() {
      const base = 'http://foo.bar/path'
      const params = new up.Params([])
      expect(params.toURL(base)).toEqual('http://foo.bar/path')
    })
  })

  describe('.fromURL', function() {

    it('parses the query section from an URL, without leading question mark', function() {
      const url = 'http://foo.bar/path?key=value'
      const params = up.Params.fromURL(url)
      expect(params.toQuery()).toEqual('key=value')
    })

    it('parses no params if the URL has no query section', function() {
      const url = 'http://foo.bar/path'
      const params = up.Params.fromURL(url)
      expect(params.toArray()).toEqual([])
    })
  })

  describe('.fromForm', function() {

    it('serializes a form with multiple inputs', function() {
      const $form = $fixture('form')
      $form.append('<input name="key1" value="value1">')
      $form.append('<input name="key2" value="value2">')

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key1', value: 'value1' },
        { name: 'key2', value: 'value2' },
      ])
    })

    it('serializes an <input type="text"> with its default [value]', function() {
      const $form = $fixture('form')
      $form.append('<input type="text" name="key" value="value-from-attribute">')

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value-from-attribute' }
      ])
    })

    it('serializes an <input type="text"> that had its value property changed by a script', function() {
      const $form = $fixture('form')
      const $input = $('<input type="text" name="key" value="value-from-attribute">').appendTo($form)
      $input[0].value = 'value-from-script'

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value-from-script' }
      ])
    })

    it('serializes an <input type="hidden"> with its default [value]', function() {
      const $form = $fixture('form')
      $form.append('<input type="hidden" name="key" value="value-from-attribute">')

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value-from-attribute' }
      ])
    })

    it('serializes an <input type="hidden"> that had its value property changed by a script', function() {
      const $form = $fixture('form')
      const $input = $('<input type="hidden" name="key" value="value-from-attribute">').appendTo($form)
      $input[0].value = 'value-from-script'

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value-from-script' }
      ])
    })

    it('seralizes a <select> with its default selected option', function() {
      const $form = $fixture('form')
      const $select = $('<select name="key"></select>').appendTo($form)
      const $option1 = $('<option value="value1">').appendTo($select)
      const $option2 = $('<option value="value2" selected>').appendTo($select)
      const $option3 = $('<option value="value3">').appendTo($select)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value2' }
      ])
    })

    it('seralizes a <select> that had its selection changed by a script', function() {
      const $form = $fixture('form')
      const $select = $('<select name="key"></select>').appendTo($form)
      const $option1 = $('<option value="value1">').appendTo($select)
      const $option2 = $('<option value="value2" selected>').appendTo($select)
      const $option3 = $('<option value="value3">').appendTo($select)

      $option2[0].selected = false
      $option3[0].selected = true

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value3' }
      ])
    })

    it('serializes a <select multiple> with multiple selected options into multiple params', function() {
      const $form = $fixture('form')
      const $select = $('<select name="key" multiple></select>').appendTo($form)
      const $option1 = $('<option value="value1">').appendTo($select)
      const $option2 = $('<option value="value2" selected>').appendTo($select)
      const $option3 = $('<option value="value3" selected>').appendTo($select)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value2' },
        { name: 'key', value: 'value3' }
      ])
    })

    it('serializes an <input type="file">')

    it('serializes an <input type="file" multiple> into multiple params')

    it('includes an <input type="checkbox"> that was [checked] by default', function() {
      const $form = $fixture('form')
      const $input = $('<input type="checkbox" name="key" value="value" checked>').appendTo($form)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value' }
      ])
    })

    it('includes an <input type="checkbox"> that was checked by a script', function() {
      const $form = $fixture('form')
      const $input = $('<input type="checkbox" name="key" value="value">').appendTo($form)
      $input[0].checked = true

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value' }
      ])
    })

    it('excludes an <input type="checkbox"> that is unchecked', function() {
      const $form = $fixture('form')
      const $input = $('<input type="checkbox" name="key" value="value">').appendTo($form)
      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([])
    })

    it('includes a checked <input type="radio"> in a radio button group that was [checked] by default', function() {
      const $form = $fixture('form')
      const $button1 = $('<input type="radio" name="key" value="value1">').appendTo($form)
      const $button2 = $('<input type="radio" name="key" value="value2" checked>').appendTo($form)
      const $button3 = $('<input type="radio" name="key" value="value3">').appendTo($form)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value2' }
      ])
    })

    it('includes a checked <input type="radio"> in a radio button group that was checked by a script', function() {
      const $form = $fixture('form')
      const $button1 = $('<input type="radio" name="key" value="value1">').appendTo($form)
      const $button2 = $('<input type="radio" name="key" value="value2" checked>').appendTo($form)
      const $button3 = $('<input type="radio" name="key" value="value3">').appendTo($form)

      $button2[0].checked = false
      $button3[0].checked = true

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value3' }
      ])
    })

    it('excludes an radio button group if no button is selected', function() {
      const $form = $fixture('form')
      const $button1 = $('<input type="radio" name="key" value="value1">').appendTo($form)
      const $button2 = $('<input type="radio" name="key" value="value2">').appendTo($form)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([])
    })

    it('excludes an <input> that is [disabled] by default', function() {
      const $form = $fixture('form')
      const $input = $('<input type="text" name="key" value="value" disabled>').appendTo($form)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([])
    })

    it('excludes an <input> that was disabled by a script', function() {
      const $form = $fixture('form')
      const $input = $('<input type="text" name="key" value="value">').appendTo($form)
      $input[0].disabled = true

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([])
    })

    it('excludes an <input> without a [name] attribute', function() {
      const $form = $fixture('form')
      const $input = $('<input type="text" value="value">').appendTo($form)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([])
    })

    it('includes an <input readonly>', function() {
      const $form = $fixture('form')
      const $input = $('<input type="text" name="key" value="value" readonly>').appendTo($form)

      const params = up.Params.fromForm($form)
      expect(params.toArray()).toEqual([
        { name: 'key', value: 'value' }
      ])
    })
  })
})

