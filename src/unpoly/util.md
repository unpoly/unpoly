# up.util

Helper functions for basic JavaScript values.

Most functions are predicates like `up.util.isPresent()` or `up.util.isBlank()`, or list helpers like `up.util.uniq()`, `up.util.reject()` and `up.util.pick()`. They are similar to [Lodash](https://lodash.com/), but feature parity is not a goal. The namespace also parses the formats used in Unpoly's attributes: `up.util.parseRelaxedJSON()` reads [[relaxed-json]], and `up.util.normalizeURL()` and `up.util.parseURL()` work with URLs.

@learn-ref relaxed-json

@namespace up.util

-----

# up.util.noop()

A function that does nothing.

@function up.util.noop
@stable

-----

# up.util.asyncNoop()

A function that returns a resolved promise.

@function up.util.asyncNoop
@internal

-----

# up.util.memoize()

Ensures that the given function can only be called a single time.
Subsequent calls will return the return value of the first call.

Note that this is a simple implementation that
doesn't distinguish between argument lists.

@function up.util.memoize
@internal

-----

# up.util.normalizeURL()

Returns a normalized version of the given URL string.

Two URLs that point to the same resource should normalize to the same string.

### Comparing normalized URLs

The main purpose of this function is to normalize two URLs for string comparison:

```js
up.util.normalizeURL('http://current-host/path') === up.util.normalizeURL('/path') // result: true
```

By default the hostname is only included if it points to a different origin:

```js
up.util.normalizeURL('http://current-host/path') // result: '/path'
up.util.normalizeURL('http://other-host/path') // result: 'http://other-host/path'
```

Relative paths are normalized to absolute paths:

```js
up.util.normalizeURL('index.html') // result: '/path/index.html'
```

### Excluding URL components

You may pass options to exclude URL components from the normalized string:

```js
up.util.normalizeURL('/foo?query=bar', { search: false }) // result: '/foo'
up.util.normalizeURL('/bar#hash', { hash: false }) // result: '/bar'
```

### Limitations

- Username and password are always omitted from the normalized URL.
- Only `http` and `https` schemes are supported.

@function up.util.normalizeURL
@param {string|URL} url
  the URL to normalize
@param {boolean} [options.host='cross-domain']
  Whether to include protocol, hostname and port in the normalized URL.

  When set to `'cross-domain'` (the default), the host is only included if it differs from the page's hostname.

  The port is omitted if the port is the standard port for the given protocol, e.g. `:443` for `https://`.
@param {boolean} [options.hash=true]
  Whether to include an `#hash` anchor in the normalized URL.
@param {boolean} [options.search=true]
  Whether to include a `?query` string in the normalized URL.
@param {boolean} [options.trailingSlash=true]
  Whether to include a trailing slash from the pathname.
@return {string}
  The normalized URL.
@stable

-----

# up.util.parseURL()

Parses the given URL into components such as hostname and path.

If the given URL is not fully qualified, it is assumed to be relative
to the current page.

### Example

```js
let parsed = up.util.parseURL('/path?foo=value')
parsed.pathname // result: '/path'
parsed.search // result: '?foo=value'
parsed.hash // result: ''
```

@function up.util.parseURL
@param {string|URL} the URL to parse
@return {Object}
  The parsed URL as an object with
  `{ protocol, hostname, port, pathname, search, hash }` properties.
@stable

-----

# up.util.normalizeMethod()

@function up.util.normalizeMethod
@internal

-----

# up.util.methodAllowsPayload()

@function up.util.methodAllowsPayload
@internal

-----

# up.util.map()

Maps all items in a [list](/api/List) to a new array of items.

## Example

The given mapping function will be called for each element in the list:

```js
up.util.map(['apple', 'cherry'], (str) => str.length) // result: [5, 6]
```

You can also pass a property name as a string,
which will be collected from each item in the list:

```js
up.util.map(['apple', 'cherry'], 'length') // result: [5, 6]
```

@function up.util.map
@param {List|Iterator} list
@param {Function(element, index): any|string} block
  A function that will be called with each element and (optional) iteration index.

  You can also pass a property name as a string,
  which will be collected from each item in the list.
@return {Array}
  A new array containing the result of each function call.
@stable

-----

# up.util.mapObject()

Creates an object from the given array and mapping function.

## Example

The mapping function is called with each array element. It must return a tuple of the object key and value:

```js
up.util.mapObject(['alice', 'bob'], function(element) {
  return [element.toUpperCase(), element.length]
})
// result: { ALICE: 5, BOB: 3 }
```

@param {Array} array
  The array from which to create an object.

  Each array element will become a property of the created object.

@param {Function(element): Pair<string, any>} mapping
  A function that is called with each array element.

  It must return a tuple of the object key and value.

@function up.util.mapObject
@stable

-----

# up.util.each()

Calls the given function for each element (and optional index)
of the given [list](/api/List) or iterator.

@function up.util.each
@param {List|Iterator} list
@param {Function(element, index)} block
  A function that will be called with each element and (optional) iteration index.
@stable

-----

# up.util.isNull()

Returns whether the given argument is `null`.

@function up.util.isNull
@param {any} object
@return {boolean}
@stable

-----

# up.util.isUndefined()

Returns whether the given argument is `undefined`.

@function up.util.isUndefined
@param {any} value
@return {boolean}
@stable

-----

# up.util.isDefined()

Returns whether the given argument is not `undefined`.

@function up.util.isDefined
@param {any} value
@return {boolean}
@stable

-----

# up.util.isMissing()

Returns whether the given argument is either `undefined` or `null`.

Note that empty strings or zero are *not* considered to be "missing".

For the opposite of `up.util.isMissing()` see [`up.util.isGiven()`](/api/up.util.isGiven).

@function up.util.isMissing
@param {any} value
@return {boolean}
@stable

-----

# up.util.isGiven()

Returns whether the given argument is neither `undefined` nor `null`.

For the opposite of `up.util.isGiven()` see [`up.util.isMissing()`](/api/up.util.isMissing).

> [IMPORTANT]
> Unpoly's concept of "given" does not correspond to JavaScript's concept of [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy).
> Empty strings or the number zero are not truthy, but *are* considered to be "given".

@function up.util.isGiven
@param {any} value
@return {boolean}
@stable

-----

# up.util.isBlank()

Returns whether the given argument is considered to be blank.

By default, this function returns `true` for:

- `undefined`
- `null`
- Empty strings
- Empty arrays
- A plain object without own enumerable properties

All other arguments return `false`.

To implement blank-ness checks for user-defined classes,
see `up.util.isBlank.key`.

@function up.util.isBlank
@param {any} value
  The value to check.
@return {boolean}
  Whether the value is blank.
@stable

-----

# up.util.isBlank.key

This property contains the name of a method that user-defined classes
may implement to hook into the `up.util.isBlank()` protocol.

### Example

We have a user-defined `Account` class that we want to use with `up.util.isBlank()`:

```js
class Account {
  constructor(email) {
    this.email = email
  }

  [up.util.isBlank.key]() {
    return up.util.isBlank(this.email)
  }
}
```

> [NOTE]
> The protocol method is not actually named `'up.util.isBlank.key'`.
> Instead it is named after the *value* of the `up.util.isBlank.key` property.
> To do so, the code sample above is using a
> [computed property name](https://medium.com/front-end-weekly/javascript-object-creation-356e504173a8)
> in square brackets.

We may now use `Account` instances with `up.util.isBlank()`:

```js
let foo = new Account('foo@foo.com')
let bar = new Account('')

console.log(up.util.isBlank(foo)) // prints false
console.log(up.util.isBlank(bar)) // prints true
```

@property up.util.isBlank.key
@stable

-----

# up.util.presence()

Returns the given argument if the argument is [present](/api/up.util.isPresent),
otherwise returns `undefined`.

@function up.util.presence
@param {any} value
@param {Function(value): boolean} [tester=up.util.isPresent]
  The function that will be used to test whether the argument is present.
@return {any|undefined}
@stable

-----

# up.util.isPresent()

Returns whether the given argument is not [blank](/api/up.util.isBlank).

@function up.util.isPresent
@param {any} value
@return {boolean}
@stable
@signature

-----

# up.util.isFunction()

Returns whether the given argument is a function.

@function up.util.isFunction
@param {any} value
@return {boolean}
@stable

-----

# up.util.isString()

Returns whether the given argument is a string.

@function up.util.isString
@param {any} value
@return {boolean}
@stable

-----

# up.util.isBoolean()

Returns whether the given argument is a boolean value.

@function up.util.isBoolean
@param {any} value
@return {boolean}
@stable

-----

# up.util.isNumber()

Returns whether the given argument is a number.

Note that this will check the argument's *type*.
It will return `false` for a string like `"123"`.

@function up.util.isNumber
@param {any} value
@return {boolean}
@stable

-----

# up.util.isOptions()

Returns whether the given argument is an options hash.

Unlike [`up.util.isObject()`], this returns false for
functions, jQuery collections, promises, `FormData` instances and arrays.

@function up.util.isOptions
@param {any} value
@return {boolean}
@internal

-----

# up.util.isObject()

Returns whether the given argument is an object.

This also returns `true` for functions, which may behave like objects in JavaScript.

@function up.util.isObject
@param {any} value
@return {boolean}
@stable

-----

# up.util.isElement()

Returns whether the given argument is a [DOM element](https://developer.mozilla.org/en-US/docs/Web/API/Element).

@function up.util.isElement
@param {any} value
@return {boolean}
@stable

-----

# up.util.isTextNode()

Returns whether the given argument is a [text node](https://developer.mozilla.org/en-US/docs/Web/API/Text).

@function up.util.isTextNode
@param {any} value
@return {boolean}
@internal

-----

# up.util.isRegExp()

Returns whether the given argument is a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp).

@function up.util.isRegExp
@param {any} value
@return {boolean}
@internal

-----

# up.util.isError()

Returns whether the given argument is an error instance.

@function up.util.isError
@param {any} object
@return {boolean}
@internal

-----

# up.util.isJQuery()

Returns whether the given argument is a [jQuery collection](https://learn.jquery.com/using-jquery-core/jquery-object/).

@function up.util.isJQuery
@param {any} value
@return {boolean}
@stable

-----

# up.util.isElementLike()

@function up.util.isElementLike
@param {any} value
@return {boolean}
@internal

-----

# up.util.isPromise()

Returns whether the given argument is an object with a `then` method.

@function up.util.isPromise
@param {any} value
@return {boolean}
@stable

-----

# up.util.isArray()

Returns whether the given argument is an array.

@function up.util.isArray
@param {any} value
@return {boolean}
@stable

-----

# up.util.isFormData()

Returns whether the given argument is a `FormData` instance.

Always returns `false` in browsers that don't support `FormData`.

@function up.util.isFormData
@param {any} value
@return {boolean}
@internal

-----

# up.util.toArray()

Converts the given [array-like value](/api/List) into an array.

If the given value is already an array, it is returned unchanged.

@function up.util.toArray
@param {any} value
@return {Array}
@stable

-----

# up.util.isList()

Returns whether the given argument is an [array-like value](/api/List).

To test whether a value is an actual `Array`, use [`up.util.isArray()`](/api/up.util.isArray).

@function up.util.isList
@param {any} value
@return {boolean}
@stable

-----

# up.util.isNodeList()

Returns whether the given value is a [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList).

`NodeLists` are array-like objects returned by [`document.querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).

@function up.util.isNodeList
@param {any} value
@return {boolean}
@internal

-----

# up.util.isArguments()

Returns whether the given value is an [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments).

@function up.util.isArguments
@param {any} value
@return {boolean}
@internal

-----

# up.util.wrapList()

Returns the given value if it is [array-like](/api/List), otherwise
returns an array with the given value as its only element.

Returns an empty array if called with `null` or `undefined`.

### Example

```js
up.util.wrapList([1, 2, 3]) // result: [1, 2, 3]
up.util.wrapList('foo') // result: ['foo']
up.util.wrapList(undefined) // result: []
up.util.wrapList(null) // result: []
```

@function up.util.wrapList
@param {any} value
@return {Array|NodeList|jQuery}
@stable

-----

# up.util.copy()

Returns a shallow copy of the given value.

### Copying protocol

- By default `up.util.copy()` can copy [array-like values](/api/List),
  plain objects and `Date` instances.
- Array-like objects are copied into new arrays.
- Unsupported types of values are returned unchanged.
- To make the copying protocol work with user-defined class,
  see `up.util.copy.key`.
- Immutable objects, like strings or numbers, do not need to be copied.

@function up.util.copy
@param {any} object
@return {any}
@stable

-----

# up.util.copy.key

This property contains the name of a method that user-defined classes
may implement to hook into the `up.util.copy()` protocol.

### Example

We have a user-defined `Account` class that we want to use with `up.util.copy()`:

```js
class Account {
  constructor(email) {
    this.email = email
  }

  [up.util.copy.key]() {
    return new Account(this.email)
  }
}
```

> [NOTE]
> The protocol method is not actually named `'up.util.copy.key'`.
> Instead it is named after the *value* of the `up.util.copy.key` property.
> To do so, the code sample above is using a
> [computed property name](https://medium.com/front-end-weekly/javascript-object-creation-356e504173a8)
> in square brackets.

We may now use `Account` instances with `up.util.copy()`:

```js
original = new Account('foo@foo.com')

copy = up.util.copy(original)
console.log(copy.email) // prints 'foo@foo.com'

original.email = 'bar@bar.com' // change the original
console.log(copy.email) // still prints 'foo@foo.com'
```

@property up.util.copy.key
@param {string} key
@stable

-----

# up.util.merge()

Creates a new object by merging together the properties from the given objects.

Source values that are `null` or `undefined` are ignored.

### Example

```js
let a = { a: '1', b: '2' }
let b = { b: '3', c: '4' }
up.util.merge(a, b) // result: { a: '1', b: '3', c: '4' }
```

@function up.util.merge
@param {Array<Object|null|undefined>} ...sources
  The objects to merge.

  Sources that are `null` or `undefined` are ignored.

@return {Object}
  A new object with all merged properties.
@stable

-----

# up.util.mergeDefined()

@function up.util.mergeDefined
@param {Array<Object>} ...sources
@return {Object}
@internal

-----

# up.util.options()

Creates an options hash from the given argument and some defaults.

The semantics of this function are confusing.
We want to get rid of this in the future.

@function up.util.options
@param {Object} object
@param {Object} [defaults]
@return {Object}
@internal

-----

# up.util.find()

Passes each element in the given [array-like value](/api/List) to the given function.
Returns the first element for which the function returns a truthy value.

If no element matches, returns `undefined`.

@function up.util.find
@param {List<T>} list
@param {Function(value): boolean} tester
@return {T|undefined}
@stable

-----

# up.util.some()

Returns whether the given function returns a truthy value
for any element in the given [array-like value](/api/List).

@function up.util.some
@param {List} list
@param {Function(value, index): boolean} tester
  A function that will be called with each element and (optional) iteration index.

@return {boolean}
@stable

-----

# up.util.findResult()

Consecutively calls the given function with each element
in the given list. Returns the first truthy return value.

Returns `undefined` if the function does not return a truthy
value for any element in the list.

@function up.util.findResult
@param {List|Iterator} list
@param {Function(element): any} tester
  A function that will be called with each element and (optional) iteration index.

@return {any|undefined}
@stable

-----

# up.util.every()

Returns whether the given function returns a truthy value
for all elements in the given [list](/api/List) or iterator.

@function up.util.every
@param {List|Iterator} list
@param {Function(element, index): boolean} tester
  A function that will be called with each element and (optional) iteration index.

@return {boolean}
@stable

-----

# up.util.compact()

Returns all elements from the given [list](/api/List) that are
neither `null` nor `undefined`.

@function up.util.compact
@param {List<T>} list
@return {Array<T>}
@stable

-----

# up.util.uniq()

Returns the given array without duplicates.

@function up.util.uniq
@param {Array<T>} array
@return {Array<T>}
@stable
@signature

-----

# up.util.uniqBy()

This function is like [`uniq`](/api/up.util.uniq), except that
the given function is invoked for each element to generate the value
for which uniqueness is computed.

@function up.util.uniqBy
@param {Array} array
@param {Function(value): any} array
@return {Array}
@experimental

-----

# up.util.filter()

Returns all elements from the given [list](/api/List) that return
a truthy value when passed to the given function.

@function up.util.filter
@param {List|Iterator} list
@param {Function(value, index): boolean} tester
@return {Array}
@stable

-----

# up.util.reject()

Returns all elements from the given [array-like value](/api/List) that do not return
a truthy value when passed to the given function.

@function up.util.reject
@param {List} list
@param {Function(element, index): boolean} tester
@return {Array}
@stable
@signature

-----

# up.util.intersect()

Returns the intersection of the given two arrays.

Implementation is not optimized. Don't use it for large arrays.

@function up.util.intersect
@internal

-----

# up.util.timer()

Waits for the given number of milliseconds, then runs the given callback.

This function works like the built-in [`setTimeout()`](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout), except that the argument order is flipped for
ergonomic reasons.

Instead of `up.util.timer(0, fn)` you can also use [`up.util.task(fn)`](/api/up.util.task).

### Example

```js
up.util.timer(3000, function() {
  console.log("Look, it's 3 seconds later!")
})
```

@function up.util.timer
@param {number} millis
  The time interval to wait in milliseconds.
@param {Function()} callback
  The function to call after waiting.
@return {number}
  The ID of the scheduled timeout.

  To unschedule the task, pass this ID to [`clearTimeout()`](https://developer.mozilla.org/en-US/docs/Web/API/clearTimeout).
@stable

-----

# up.util.task()

Schedules a function to the [JavaScript task queue](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) (also "macrotask queue").

## Example

Pass a function argument to schedule it for the next macrotask:

```js
up.util.task(() => console.log('Hello from next task!'))
console.log('Hello from current task!')
```

@function up.util.task
@param {Function()} callback
  The function to schedule.
@stable

-----

# up.util.fastTask()

Schedules a macrotask.

Unlike `up.util.task()`, this function uses `postMessage()` instead of `setTimeout()`.
This has pros and cons:

- This *tends* to cause the task to run before `setTimeout()`, sometimes even before the browser paints the screen.
- Safari does not honor the order of `postMessage()` calls on multiple `MessageChannels`, making
  it hard to reason about the order of tasks.
- Safari sometimes executes a `postMessage()` task before a `setTimeout()` task.

@function up.util.fastTask
@internal

-----

# up.util.last()

Returns the last element of the given array or string.

@function up.util.last
@param {Array<T>|string} array
@return {T|string}
@stable

-----

# up.util.contains()

Returns whether the given value contains another value.

If `value` is a string, this returns whether `subValue` is a sub-string of `value`.

If `value` is an array, this returns whether `subValue` is an element of `value`.

@function up.util.contains
@param {Array|NodeList|string} value
@param {any} subValue
@return {boolean} Whether the value is contained.
@stable

-----

# up.util.containsAll()

Returns whether the first list contains all elements of the second list.

Element order is ignored for this check.

@function up.util.containsAll
@param {Array|NodeList|string} values
@param {Array|NodeList|string} subValues
@return {boolean} Whether all values are contained.
@internal

-----

# up.util.objectContains()

Returns whether `object`'s entries are a superset
of `subObject`'s entries.

@function up.util.objectContains
@param {Object} object
@param {Object} subObject
@internal

-----

# up.util.pick()

Returns a copy of the given object that only contains
the given keys.

## Example

```js
let object = { foo: 1, bar: 2, baz: 3 }
up.util.pick(object, ['foo', 'baz']) // result: { foo:1, baz: 3 }
```

@function up.util.pick
@param {Object} object
@param {Array} keys
@return {Object}
@stable
@signature

-----

# up.util.pickBy()

Returns a copy of the given object that only contains
properties that pass the given tester function.

@function up.util.pickBy
@param {Object} object
@param {Function(value, key): boolean} tester
  A function that will be called with each property.

  The arguments are the property value and key.
@return {Object}
@experimental

-----

# up.util.omit()

Returns a copy of the given object that contains all except
the given keys.

## Example

```js
let object = { foo: 1, bar: 2, baz: 3 }
up.util.omit(object, ['foo', 'baz']) // result: { bar: 2 }
```

@function up.util.omit
@param {Object} object
@param {Array} keys
@stable

-----

# up.util.unresolvablePromise()

Returns a promise that will never be resolved.

@function up.util.unresolvablePromise
@internal

-----

# up.util.remove()

Removes the given element from the given array.

This changes the given array.

@function up.util.remove
@param {Array<T>} array
  The array to change.
@param {T} element
  The element to remove.
@return {T|undefined}
  The removed element, or `undefined` if the array didn't contain the element.
@stable

-----

# up.util.evalOption()

If the given `value` is a function, calls the function with the given `args`.
Otherwise it just returns `value`.

### Example

```js
up.util.evalOption(5) // => 5

let fn = () => 1 + 2
up.util.evalOption(fn) // result: 3
```

@function up.util.evalOption
@param {any} value
@param {Array} ...args
@return {any}
@stable

-----

# up.util.escapeHTML()

Escapes the given string of HTML by replacing control chars with their HTML entities.

@function up.util.escapeHTML
@param {string} string
  The text that should be escaped.
@stable

-----

# up.util.escapeRegExp()

@function up.util.escapeRegExp
@internal

-----

# up.util.pluckKey()

Deletes the property with the given key from the given object
and returns its value.

@function up.util.pluckKey
@param {Object} object
  The object from which to pluck a property.
@param {string} key
  The name of the property to pluck.
@return {any}
  The value of the property before it was deleted.

  If the object didn't have the property, returns `undefined`.
@stable

-----

# up.util.sequence()

@function up.util.sequence

@param {Array<Function()>} functions
@return {Function()}
  A function that will call all `functions` if called.

  Its arguments are passed on to each function.
@internal

-----

# up.util.flatten()

Flattens the given `array` a single depth level.

Will also flatten [array-like](/api/List) values, like a `NodeList`.

### Example

```js
let nested = [1, [2, 3], [4]]
up.util.flatten(nested) // result: [1, 2, 3, 4]
```

@function up.util.flatten
@param {Array} array
  An array which might contain other arrays
@return {Array}
  The flattened array
@stable

-----

# up.util.flatMap()

Maps each element using a mapping function,
then [flattens](/api/up.util.flatten) the result into a new array.

@function up.util.flatMap
@param {List|Iterator} list
@param {Function(element)} mapping
@return {Array}
@stable

-----

# up.util.always()

Sets the given callback as both fulfillment and rejection handler for the given promise.

[Unlike `Promise#finally()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally#Description), `up.util.always()` may change the settlement value
of the given promise.

### Example: Callback style

```js
let process = (value) => console.log(value)
up.util.always(promise, process)
```

### Example with `await`

```js
let value = await up.util.always(promise)
console.log(value)
```

@function up.util.always
@internal

-----

# up.util.newDeferred()

@function up.util.newDeferred
@internal

-----

# up.util.isEqual()

Returns whether the two arguments are equal by value.

### Comparison protocol

- By default `up.util.isEqual()` can compare strings, numbers,
  [array-like values](/api/List), plain objects and `Date` objects.
- To make the comparison protocol work with user-defined classes,
  see `up.util.isEqual.key`.
- Objects without a defined comparison protocol are
  compared by reference (`===`).

@function up.util.isEqual
@param {any} a
  The first value to compare.
@param {any} b
  The second value to compare.
@return {boolean}
  Whether the arguments are considered equal.
@stable

-----

# up.util.isEqual.key

This property contains the name of a method that user-defined classes
may implement to hook into the `up.util.isEqual()` protocol.

### Example

We have a user-defined `Account` class that we want to use with `up.util.isEqual()`:

```js
class Account {
  constructor(email) {
    this.email = email
  }

  [up.util.isEqual.key](other) {
    return this.email === other.email
  }
}
```

Note that the protocol method is not actually named `'up.util.isEqual.key'`.
Instead it is named after the *value* of the `up.util.isEqual.key` property.
To do so, the code sample above is using a
[computed property name](https://medium.com/front-end-weekly/javascript-object-creation-356e504173a8)
in square brackets.

We may now use `Account` instances with `up.util.isEqual()`:

```js
let one = new Account('foo@foo.com')
let two = new Account('foo@foo.com')
let three = new Account('bar@bar.com')

up.util.isEqual(one, two)   // returns true
up.util.isEqual(one, three) // returns false
```

@property up.util.isEqual.key
@param {string} key
@stable

-----

# up.util.withRenamedKeys()

Returns a copy of the given object, with its keys transformed by the given function.

If the given function returns `undefined` for a key, that key
will be omitted from the returned object.

@function up.util.withRenamedKeys
@param {Object} object
@param {Function(string): string|undefined} renameKeyFn
@internal

-----

# up.util.sprintf()

See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions

@function up.util.sprintf
@internal

-----

# up.util.parseRelaxedJSON()

Parses a string of [relaxed JSON](/api/relaxed-json) into a JavaScript value.

## Example

```js
let value = up.util.parseRelaxedJSON("{ foo: 'one', bar: 'two', }")
console.log(value) // logs an object { foo: 'one', bar: 'two' }
```

## Syntax errors

When the passed text is not in relaxed JSON format, a `SyntaxError` is thrown.

@function up.util.parseRelaxedJSON
@param {string} text
  The text to parse.
@return {Object|Array|string|number|boolean|null}
  The parsed JSON value.
@experimental

-----

# up.util.parseNumber()

Parses the given value and returns a number.

## Example

```js
up.util.parseNumber("123.4") // result: 123.4
```

## Supported values

The list of supported notations differs slightly from [`parseFloat()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat)
and [`Number()`](https://www.w3schools.com/jsref/jsref_number.asp):

<table>
  <thead>
    <tr>
      <th colspan="2">Supported argument</th>
      <th>Return value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>✔️ Zero</td>
      <td><code>"0"</code></td>
      <td><code>0</code></td>
    </tr>
    <tr>
      <td>✔️ Positive integer</td>
      <td><code>"123"</code></td>
      <td><code>123</code></td>
    </tr>
    <tr>
      <td>✔️ Negative value</td>
      <td><code>"-5"</code></td>
      <td><code>-5</code></td>
    </tr>
    <tr>
      <td>✔️ Floating point number</td>
      <td><code>"4.6"</code></td>
      <td><code>4.6</code></td>
    </tr>
    <tr>
      <td>✔️ Numeric separators</td>
      <td><code>"1_000_000"</code></td>
      <td><code>1000000</code></td>
    </tr>
    <tr>
      <td>✔️ Already a number</td>
      <td><code>10</code></td>
      <td><code>10</code></td>
    </tr>
    <tr>
      <td>✔️ Negative zero</td>
      <td><code>"-0"</code></td>
      <td><code>-0</code></td>
    </tr>
  </tbody>
</table>

If the argument cannot be parsed, it returns `undefined`.
This function never throws an error and never returns `NaN`.

<table>
  <thead>
    <tr>
      <th colspan="2">Unsupported argument</th>
      <th>Return value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>❌ Unparseable format</td>
      <td><code>"foo"</code></td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td>❌ Missing argument</td>
      <td><code>undefined</code></td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td>❌ Infinity</td>
      <td><code>"Infinity"</code></td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td>❌ Exponential notation</td>
      <td><code>"314e-2"</code></td>
      <td><code>undefined</code></td>
    </tr>
    <tr>
      <td>❌ Unparseable type</td>
      <td><code>{ foo: 3 }</code></td>
      <td><code>undefined</code></td>
    </tr>
  </tbody>
</table>

@function up.util.parseNumber
@param {string|number} value
  The value to parse, usually a string.

  If a number is given, it is returned without further processing.
@return {number|undefined}
  The parsed number value.

  If the argument cannot be parsed, `undefined` is returned.
@experimental
