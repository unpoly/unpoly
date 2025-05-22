const u = up.util
const e = up.element

/*-
The `up.Params` class offers a consistent API to read and manipulate request parameters
independent of their type.

Request parameters are used in [form submissions](/up.Params.fromForm) and
[URLs](/up.Params.fromURL). Methods like `up.submit()` or `up.replace()` accept
request parameters as a `{ params }` option.

### Supported parameter types

The following types of parameter representation are supported:

1. An object like `{ email: 'foo@bar.com' }`
2. A query string like `'email=foo%40bar.com'`
3. An array of `{ name, value }` objects like `[{ name: 'email', value: 'foo@bar.com' }]`
4. A [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.

@class up.Params
@parent up.form
*/
up.Params = class Params {

  /*-
  Constructs a new `up.Params` instance.

  @constructor up.Params
  @param {Object|Array|string|FormData|up.Params} [params]
    An existing list of params with which to initialize the new `up.Params` object.

    The given params value may be of any [supported type](/up.Params).
  @return {up.Params}
  @experimental
  */
  constructor(raw) {
    this.clear()
    this.addAll(raw)
  }

  /*-
  Removes all params from this object.

  @function up.Params#clear
  @experimental
  */
  clear() {
    this.entries = []
  }

  [u.copy.key]() {
    return new up.Params(this)
  }

  /*-
  Returns an object representation of this `up.Params` instance.

  The returned value is a simple JavaScript object with properties
  that correspond to the key/values in the given `params`.

  ### Example

  ```js
  var params = new up.Params('foo=bar&baz=bam')
  var object = params.toObject()

  // object is now: {
  //   foo: 'bar',
  //   baz: 'bam'
  // ]
  ```

  @function up.Params#toObject
  @return {Object}
  @experimental
  */
  toObject() {
    const obj = {}
    for (let entry of this.entries) {
      const { name, value } = entry
      if (!u.isBasicObjectProperty(name)) {
        if (this._isArrayKey(name)) {
          obj[name] ||= []
          obj[name].push(value)
        } else {
          obj[name] = value
        }
      }
    }
    return obj
  }

  /*-
  Returns an array representation of this `up.Params` instance.

  The returned value is a JavaScript array with elements that are objects with
  `{ key }` and `{ value }` properties.

  ### Example

  ```js
  var params = new up.Params('foo=bar&baz=bam')
  var array = params.toArray()

  // array is now: [
  //   { name: 'foo', value: 'bar' },
  //   { name: 'baz', value: 'bam' }
  // ]
  ```

  @function up.Params#toArray
  @return {Array}
  @experimental
  */
  toArray() {
    return this.entries
  }

  /*-
  Returns a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation
  of this `up.Params` instance.

  ### Example

  ```js
  var params = new up.Params('foo=bar&baz=bam')
  var formData = params.toFormData()

  formData.get('foo') // 'bar'
  formData.get('baz') // 'bam'
  ```

  @function up.Params#toFormData
  @return {FormData}
  @experimental
  */
  toFormData() {
    const formData = new FormData()
    for (let entry of this.entries) {
      formData.append(entry.name, entry.value)
    }
    if (!formData.entries) {
      // If this browser cannot inspect FormData with the #entries()
      // iterator, assign the original array for inspection by specs.
      formData.originalArray = this.entries
    }
    return formData
  }

  /*-
  Returns an [query string](https://en.wikipedia.org/wiki/Query_string) for this `up.Params` instance.

  The keys and values in the returned query string will be [percent-encoded](https://developer.mozilla.org/en-US/docs/Glossary/percent-encoding).
  Non-primitive values (like [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) will be omitted from
  the retuned query string.

  ### Example

  ```js
  var params = new up.Params({ foo: 'bar', baz: 'bam' })
  var query = params.toQuery()

  // query is now: 'foo=bar&baz=bam'
  ```

  @function up.Params#toQuery
  @param {Object|FormData|string|Array|undefined} params
    the params to convert
  @return {string}
    a query string built from the given params
  @experimental
  */
  toQuery() {
    let parts = u.map(this.entries, this._arrayEntryToQuery.bind(this))
    parts = u.compact(parts)
    return parts.join('&')
  }

  _arrayEntryToQuery(entry) {
    const { value } = entry

    // We cannot transport a binary value in a query string.
    if (this._isBinaryValue(value)) {
      return
    }

    let query = encodeURIComponent(entry.name)
    // There is a subtle difference when encoding blank values:
    // 1. An undefined or null value is encoded to `key` with no equals sign
    // 2. An empty string value is encoded to `key=` with an equals sign but no value
    if (u.isGiven(value)) {
      query += "="
      query += encodeURIComponent(value)
    }
    return query
  }

  /*-
  Returns whether the given value cannot be encoded into a query string.

  We will have `File` values in our params when we serialize a form with a file input.
  These entries will be filtered out when converting to a query string.

  @function up.Params#_isBinaryValue
  @internal
  */
  _isBinaryValue(value) {
    return value instanceof Blob
  }

  hasBinaryValues() {
    const values = u.map(this.entries, 'value')
    return u.some(values, this._isBinaryValue)
  }

  /*-
  Builds an URL string from the given base URL and
  this `up.Params` instance as a [query string](https://en.wikipedia.org/wiki/Query_string).

  The base URL may or may not already contain a query string. The
  additional query string will be joined with an `&` or `?` character accordingly.

  @function up.Params#toURL
  @param {string} base
    The base URL that will be prepended to this `up.Params` object as a query string.
  @return {string}
    The built URL.
  @experimental
  */
  toURL(base) {
    let parts = [base, this.toQuery()]
    parts = u.filter(parts, u.isPresent)
    const separator = u.contains(base, '?') ? '&' : '?'
    return parts.join(separator)
  }

  /*-
  Adds a new entry with the given `name` and `value`.

  An `up.Params` instance can hold multiple entries with the same name.
  To overwrite all existing entries with the given `name`, use `up.Params#set()` instead.

  ### Example

  ```js
  var params = new up.Params()
  params.add('foo', 'fooValue')

  var foo = params.get('foo')
  // foo is now 'fooValue'
  ```

  @function up.Params#add
  @param {string} name
    The name of the new entry.
  @param {any} value
    The value of the new entry.
  @experimental
  */
  add(name, value) {
    this.entries.push({ name, value })
  }

  /*-
  Adds all entries from the given list of params.

  The given params value may be of any [supported type](/up.Params).

  @function up.Params#addAll
  @param {Object|Array|string|FormData|up.Params|undefined} params
  @experimental
  */
  addAll(raw) {
    if (u.isMissing(raw)) {
      // nothing to do
    } else if (raw instanceof this.constructor) {
      this.entries.push(...raw.entries)
    } else if (u.isArray(raw)) {
      // internal use for copying
      this.entries.push(...raw)
    } else if (u.isString(raw)) {
      this._addAllFromQuery(raw)
    } else if (u.isFormData(raw)) {
      this._addAllFromFormData(raw)
    } else if (u.isObject(raw)) {
      this._addAllFromObject(raw)
    } else {
      up.fail("Unsupport params type: %o", raw)
    }
  }

  _addAllFromObject(object) {
    for (let key in object) {
      const value = object[key]
      const valueElements = u.isArray(value) ? value : [value]
      for (let valueElement of valueElements) {
        this.add(key, valueElement)
      }
    }
  }

  _addAllFromQuery(query) {
    for (let part of query.split('&')) {
      if (part) {
        let [name, value] = part.split('=')
        name = decodeURIComponent(name)
        // There are three forms we need to handle:
        // (1) foo=bar should become { name: 'foo', bar: 'bar' }
        // (2) foo=    should become { name: 'foo', bar: '' }
        // (3) foo     should become { name: 'foo', bar: null }
        if (u.isGiven(value)) {
          value = decodeURIComponent(value)
        } else {
          value = null
        }
        this.add(name, value)
      }
    }
  }

  _addAllFromFormData(formData) {
    for (let value of formData.entries()) {
      this.add(...value)
    }
  }

  /*-
  Sets the `value` for the entry with given `name`.

  An `up.Params` instance can hold multiple entries with the same name.
  All existing entries with the given `name` are [deleted](/up.Params.prototype.delete) before the
  new entry is set. To add a new entry even if the `name` is taken, use `up.Params#add()`.

  @function up.Params#set
  @param {string} name
    The name of the entry to set.
  @param {any} value
    The new value of the entry.
  @experimental
  */
  set(name, value) {
    this.delete(name)
    this.add(name, value)
  }

  /*-
  Deletes all entries with the given `name`.

  @function up.Params#delete
  @param {string} name
  @experimental
  */
  delete(name) {
    this.entries = u.reject(this.entries, this._matchEntryFn(name))
  }

  _matchEntryFn(name) {
    return (entry) => entry.name === name
  }

  /*-
  Returns the first param value with the given `name` from the given `params`.

  Returns `undefined` if no param value with that name is set.

  If the `name` denotes an array field (e.g. `foo[]`), *all* param values with the given `name`
  are returned as an array. If no param value with that array name is set, an empty
  array is returned.

  To always return a single value use `up.Params#getFirst()` instead.
  To always return an array of values use `up.Params#getAll()` instead.

  ### Example

  ```js
  var params = new up.Params({ foo: 'fooValue', bar: 'barValue' })
  var params = new up.Params([
    { name: 'foo', value: 'fooValue' }
    { name: 'bar[]', value: 'barValue1' }
    { name: 'bar[]', value: 'barValue2' })
  ]})

  var foo = params.get('foo')
  // foo is now 'fooValue'

  var bar = params.get('bar')
  // bar is now ['barValue1', 'barValue2']
  ```

  @function up.Params#get
  @param {string} name
  @experimental
  */
  get(name) {
    if (this._isArrayKey(name)) {
      return this.getAll(name)
    } else {
      return this.getFirst(name)
    }
  }

  /*-
  Returns the first param value with the given `name`.

  Returns `undefined` if no param value with that name is set.

  @function up.Params#getFirst
  @param {string} name
  @return {any}
    The value of the param with the given name.
  @experimental
  */
  getFirst(name) {
    const entry = u.find(this.entries, this._matchEntryFn(name))
    return entry?.value
  }

  /*-
  Returns an array of all param values with the given `name`.

  Returns an empty array if no param value with that name is set.

  @function up.Params#getAll
  @param {string} name
  @return {Array}
    An array of all values with the given name.
  @experimental
  */
  getAll(name) {
    if (this._isArrayKey(name)) {
      return this.getAll(name)
    } else {
      const entries = u.map(this.entries, this._matchEntryFn(name))
      return u.map(entries, 'value')
    }
  }

  _isArrayKey(key) {
    return key.endsWith('[]')
  }

  [u.isBlank.key]() {
    return this.entries.length === 0
  }

  /*-
  Constructs a new `up.Params` instance from the given `<form>`.

  The returned params may be passed as `{ params }` option to
  `up.request()` or `up.replace()`.

  The constructed `up.Params` will include exactly those form values that would be
  included in a regular form submission. In particular:

  - All `<input>` types are suppported
  - Field values are usually strings, but an `<input type="file">` will produce
    [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) values.
  - An `<input type="radio">` or `<input type="checkbox">` will only be added if they are `[checked]`.
  - An `<select>` will only be added if at least one value is `[checked]`.
  - If passed a `<select multiple>` or `<input type="file" multiple>`, all selected values are added.
    If passed a `<select multiple>`, all selected values are added.
  - Fields that are `[disabled]` are ignored
  - Fields without a `[name]` attribute are ignored.

  ### Example

  Given this HTML form:

  ```html
  <form>
    <input type="text" name="email" value="foo@bar.com">
    <input type="password" name="pass" value="secret">
  </form>
  ```

  This would serialize the form into an array representation:

  ```js
  let params = up.Params.fromForm('input[name=email]')
  let email = params.get('email') // email is now 'foo@bar.com'
  let pass = params.get('pass') // pass is now 'secret'
  ```

  @function up.Params.fromForm
  @param {Element} form
    A `<form>` element.
  @return {up.Params}
    A new `up.Params` instance with values from the given form.
  @experimental
  */
  static fromForm(form) {
    return this.fromContainer(form)
  }

  static fromContainer(container) {
    let fields = up.form.fields(container)
    return this.fromFields(fields)
  }

  /*-
  Constructs a new `up.Params` instance from one or more
  [HTML form field](https://www.w3schools.com/html/html_form_elements.asp).

  The constructed `up.Params` will include exactly those form values that would be
  included for the given fields in a regular form submission. If a given field wouldn't
  submit a value (like an unchecked `<input type="checkbox">`, nothing will be added.

  See `up.Params.fromForm()` for more details and examples.

  @function up.Params.fromFields
  @param {Element|List<Element>|jQuery} fields
  @return {up.Params}
  @experimental
  */
  static fromFields(fields) {
    const params = new (this)()
    for (let field of u.wrapList(fields)) {
      params.addField(field)
    }
    return params
  }

  /*-
  Adds params from the given [HTML form field](https://www.w3schools.com/html/html_form_elements.asp).

  The added params will include exactly those form values that would be
  included for the given field in a regular form submission. If the given field wouldn't
  submit a value (like an unchecked `<input type="checkbox">`, nothing will be added.

  See `up.Params.fromForm()` for more details and examples.

  @function up.Params#addField
  @param {Element|jQuery} field
  @experimental
  */
  addField(field) {
    field = e.get(field) // unwrap jQuery

    // Input fields are excluded from form submissions if they have no [name]
    // or when they are [disabled].
    let name = field.name
    if (name && !field.disabled) {
      const { tagName } = field
      const { type } = field
      if (tagName === 'SELECT') {
        for (let option of field.querySelectorAll('option')) {
          if (option.selected) {
            this.add(name, option.value)
          }
        }
      } else if ((type === 'checkbox') || (type === 'radio')) {
        if (field.checked) {
          this.add(name, field.value)
        }
      } else if (type === 'file') {
        // The value of an input[type=file] is the local path displayed in the form.
        // The actual File objects are in the #files property.
        for (let file of field.files) {
          this.add(name, file)
        }
      } else {
        return this.add(name, field.value)
      }
    }
  }

  [u.isEqual.key](other) {
    return (this.constructor === other.constructor) && u.isEqual(this.entries, other.entries)
  }

  /*-
  Constructs a new `up.Params` instance from the given URL's
  [query string](https://en.wikipedia.org/wiki/Query_string).

  Constructs an empty `up.Params` instance if the given URL has no query string.

  ### Example

  ```js
  var params = up.Params.fromURL('http://foo.com?foo=fooValue&bar=barValue')
  var foo = params.get('foo')
  // foo is now: 'fooValue'
  ```

  @function up.Params.fromURL
  @param {string} url
    The URL from which to extract the query string.
  @return {string|undefined}
    The given URL's query string, or `undefined` if the URL has no query component.
  @experimental
  */
  static fromURL(url) {
    const params = new (this)()
    const urlParts = u.parseURL(url)
    let query = urlParts.search
    if (query) {
      query = query.replace(/^\?/, '')
      params.addAll(query)
    }
    return params
  }

  /*-
  Returns the given URL without its [query string](https://en.wikipedia.org/wiki/Query_string).

  ### Example

  ```js
  var url = up.Params.stripURL('http://foo.com?key=value')
  // url is now: 'http://foo.com'
  ```

  @function up.Params.stripURL
  @param {string} url
    A URL (with or without a query string).
  @return {string}
    The given URL without its query string.
  @experimental
  */
  static stripURL(url) {
    return u.normalizeURL(url, { search: false })
  }

  static merge(...objects) {
    return objects.reduce(
      function(allParams, params) {
        allParams.addAll(params)
        return allParams
      },
      new up.Params()
    )
  }

}
