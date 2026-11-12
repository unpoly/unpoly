# up.Params

The `up.Params` class offers a consistent API to read and manipulate request parameters
independent of their type.

Request parameters are used in [form submissions](/api/up.Params.fromForm) and
[URLs](/api/up.Params.fromURL). Methods like `up.submit()` or `up.render()` accept
request parameters as a `{ params }` option.

### Supported parameter types

The following types of parameter representation are supported:

1. An object like `{ email: 'foo@bar.com' }`
2. A query string like `'email=foo%40bar.com'`
3. An array of `{ name, value }` objects like `[{ name: 'email', value: 'foo@bar.com' }]`
4. A [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.

@class up.Params
@parent up.form

-----

# new up.Params()

Constructs a new `up.Params` instance.

@constructor up.Params
@param {Object|Array|string|FormData|up.Params} [params]
  An existing list of params with which to initialize the new `up.Params` object.

  The given params value may be of any [supported type](/api/up.Params).
@return {up.Params}
@stable

-----

# up.Params#clear()

Removes all params from this object.

@function up.Params#clear
@stable

-----

# up.Params#toObject()

Returns an object representation of this `up.Params` instance.

The returned value is a simple JavaScript object with properties
that correspond to the key/values in the given `params`.

### Example

```js
let params = new up.Params('foo=bar&baz=bam')
let object = params.toObject()

// object is now: {
//   foo: 'bar',
//   baz: 'bam'
// }
```

@function up.Params#toObject
@return {Object}
@experimental

-----

# up.Params#toArray()

Returns an array representation of this `up.Params` instance.

The returned value is a JavaScript array with elements that are objects with
`{ name }` and `{ value }` properties.

### Example

```js
let params = new up.Params('foo=bar&baz=bam')
let array = params.toArray()

// array is now: [
//   { name: 'foo', value: 'bar' },
//   { name: 'baz', value: 'bam' }
// ]
```

@function up.Params#toArray
@return {Array}
@experimental

-----

# up.Params#toFormData()

Returns a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation
of this `up.Params` instance.

### Example

```js
let params = new up.Params('foo=bar&baz=bam')
let formData = params.toFormData()

formData.get('foo') // 'bar'
formData.get('baz') // 'bam'
```

@function up.Params#toFormData
@return {FormData}
@stable

-----

# up.Params#toQuery()

Returns a [query string](https://en.wikipedia.org/wiki/Query_string) for this `up.Params` instance.

The keys and values in the returned query string will be [percent-encoded](https://developer.mozilla.org/en-US/docs/Glossary/percent-encoding).
Non-primitive values (like [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File)) will be omitted from
the returned query string.

### Example

```js
let params = new up.Params({ foo: 'bar', baz: 'bam' })
let query = params.toQuery()

// query is now: 'foo=bar&baz=bam'
```

@function up.Params#toQuery
@return {string}
  A query string built from this `up.Params` instance.
@stable

-----

# up.Params#_isBinaryEntry()

Returns whether the given entry cannot be encoded into a query string.

We will have `File` values in our params when we serialize a form with a file input.
These entries will be filtered out when converting to a query string.

@function up.Params#_isBinaryEntry
@internal

-----

# up.Params#toURL()

Builds a URL string from the given base URL and
this `up.Params` instance as a [query string](https://en.wikipedia.org/wiki/Query_string).

The base URL may or may not already contain a query string. The
additional query string will be joined with `&` or `?` accordingly.

@function up.Params#toURL
@param {string} base
  The base URL that will be prepended to this `up.Params` object as a query string.
@return {string}
  The built URL.
@experimental

-----

# up.Params#add()

Adds a new entry with the given `name` and `value`.

An `up.Params` instance can hold multiple entries with the same name.
To overwrite all existing entries with the given `name`, use `up.Params#set()` instead.

### Example

```js
let params = new up.Params()
params.add('foo', 'fooValue')

let foo = params.get('foo')
// foo is now 'fooValue'
```

@function up.Params#add
@param {string} name
  The name of the new entry.
@param {any} value
  The value of the new entry.
@stable

-----

# up.Params#addAll()

Adds all entries from the given list of params.

The given params value may be of any [supported type](/api/up.Params).

@function up.Params#addAll
@param {Object|Array|string|FormData|up.Params|undefined} params
@stable

-----

# up.Params#keys()

@function up.Params#keys
@internal

-----

# up.Params#values()

@function up.Params#values
@internal

-----

# up.Params#set()

Sets the `value` for the entry with given `name`.

An `up.Params` instance can hold multiple entries with the same name.
All existing entries with the given `name` are [deleted](/api/up.Params.prototype.delete) before the
new entry is set. To add a new entry even if the `name` is taken, use `up.Params#add()`.

@function up.Params#set
@param {string} name
  The name of the entry to set.
@param {any} value
  The new value of the entry.
@stable

-----

# up.Params#delete()

Deletes all entries with the given `name`.

@function up.Params#delete
@param {string} name
@stable

-----

# up.Params#get()

Returns the first param value with the given `name`.

Returns `undefined` if no param value with that name is set.

If the `name` denotes an array field (e.g. `foo[]`), *all* param values with the given `name`
are returned as an array. If no param value with that array name is set, an empty
array is returned.

To always return a single value, use `up.Params#getFirst()` instead.
To always return an array of values, use `up.Params#getAll()` instead.

### Example

```js
let params = new up.Params([
  { name: 'foo', value: 'fooValue' },
  { name: 'bar[]', value: 'barValue1' },
  { name: 'bar[]', value: 'barValue2' }
])

let foo = params.get('foo')
// foo is now 'fooValue'

let bar = params.get('bar[]')
// bar is now ['barValue1', 'barValue2']
```

@function up.Params#get
@param {string} name
@stable

-----

# up.Params#getFirst()

Returns the first param value with the given `name`.

Returns `undefined` if no param value with that name is set.

@function up.Params#getFirst
@param {string} name
@return {any}
  The value of the param with the given name.
@experimental

-----

# up.Params#getAll()

Returns an array of all param values with the given `name`.

Returns an empty array if no param value with that name is set.

@function up.Params#getAll
@param {string} name
@return {Array}
  An array of all values with the given name.
@experimental

-----

# up.Params.fromForm()

Constructs a new `up.Params` instance from the given `<form>`.

The returned params may be passed as `{ params }` option to
`up.request()` or `up.render()`.

The params are built with the browser's own
[form-data algorithm](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData),
so they contain exactly what a regular form submission would send:

- All `<input>` types are supported.
- Field values are usually strings, but an `<input type="file">` will produce
  [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) values.
- An `<input type="radio">` or `<input type="checkbox">` is only added if it is checked.
- A `<select>` adds every selected option.
- Fields that are disabled, or inside a `<fieldset disabled>`, are ignored.
- Fields without a `[name]` attribute are ignored.
- Fields [outside the form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form)
  that reference it with a `[form]` attribute are included.
- [Form-associated custom elements](/learn/custom-form-fields#form-associated) are included.
- Values appended by a [`formdata`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event)
  event listener are included.
- The [submit button](#submit-button) contributes its `[name]` and `[value]`.

On top of that, [elements registered as fields](/learn/custom-form-fields#registering) in
`up.form.config.fieldSelectors` are included. The browser cannot know about those.

### Example

Given this HTML form:

```html
<form id="signup">
  <input type="text" name="email" value="foo@bar.com">
  <input type="password" name="pass" value="secret">
</form>
```

This serializes the form into params:

```js
let params = up.Params.fromForm(document.querySelector('#signup'))
let email = params.get('email') // email is now 'foo@bar.com'
let pass = params.get('pass') // pass is now 'secret'
```

### Submit buttons {#submit-button}

A submit button only contributes params when it is the one that submitted the form.
Pass the button as a `{ submitButton }` option, or `false` to submit no button at all.
Without the option the first submit button is assumed, which is also what a browser
does when the user submits from a field by pressing `Enter`.

The button must belong to the form. Like the browser's `FormData`, `up.Params.fromForm()` throws
an error for a button of another form.

### Disabled fields {#disabled-fields}

Like in a browser submission, a disabled field contributes no params.
The exceptions are fields and buttons that a [preview](/api/up.Preview.prototype.disable) disabled while a request is loading,
e.g. with [`[up-disable]`](/api/up-submit#up-disable). These still count as part of the form,
so a second submission sends the same params as the first one.

@function up.Params.fromForm
@param {Element} form
  A `<form>` element.
@param {Element|false} [options.submitButton]
  The submit button that submitted the form.

  The button must belong to the form, or an error is thrown.
  Pass `false` to include no submit button.
@return {up.Params}
  A new `up.Params` instance with values from the given form.
@stable

-----

# up.Params.fromContainer()

Constructs a new `up.Params` instance from the fields within the given container.

Unlike `up.Params.fromForm()`, the container may be any element.
The params contain the values of all [fields](/api/up.form.fields) within the container,
and no submit button.

@function up.Params.fromContainer
@param {Element|jQuery} container
  The element to scan for fields.
@param {boolean} [options.includeDisabled=false]
  Whether to add fields that are disabled.
@return {up.Params}
@experimental

-----

# up.Params.fromFields()

Constructs a new `up.Params` instance from one or more
[HTML form fields](https://www.w3schools.com/html/html_form_elements.asp).

The constructed `up.Params` will include exactly those form values that would be
included for the given fields in a regular form submission. If a given field wouldn't
submit a value (like an unchecked `<input type="checkbox">`), nothing will be added.

See `up.Params.fromForm()` for more details and examples.

@function up.Params.fromFields
@param {Element|List<Element>|jQuery} fields
@return {up.Params}
@experimental

-----

# up.Params#addField()

Adds params from the given [HTML form field](https://www.w3schools.com/html/html_form_elements.asp).

The added params will include exactly those form values that would be
included for the given field in a regular form submission. If the given field wouldn't
submit a value (like an unchecked `<input type="checkbox">`), nothing will be added.

See `up.Params.fromForm()` for more details and examples.

@function up.Params#addField
@param {Element|jQuery} field
@param {boolean} [options.includeDisabled=false]
  Whether to add a field that is disabled.

  A field that a [preview](/api/up.Preview.prototype.disable) disabled is always added.
@experimental

-----

# up.Params.fromURL()

Constructs a new `up.Params` instance from the given URL's
[query string](https://en.wikipedia.org/wiki/Query_string).

Constructs an empty `up.Params` instance if the given URL has no query string.

### Example

```js
let params = up.Params.fromURL('http://foo.com?foo=fooValue&bar=barValue')
let foo = params.get('foo')
// foo is now: 'fooValue'
```

@function up.Params.fromURL
@param {string} url
  The URL from which to extract the query string.
@return {up.Params}
  The params from the given URL's query string.
@stable

-----

# up.Params.stripURL()

Returns the given URL without its [query string](https://en.wikipedia.org/wiki/Query_string).

### Example

```js
let url = up.Params.stripURL('http://foo.com?key=value')
// url is now: 'http://foo.com/'
```

@function up.Params.stripURL
@param {string} url
  A URL (with or without a query string).
@return {string}
  The given URL without its query string.
@experimental
