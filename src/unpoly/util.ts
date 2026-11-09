import { guardFn } from './error.js'
import { canJQuery } from './browser.js'

/**
A list that Unpoly's list functions accept: an array, a `NodeList`, an `HTMLCollection`,
an `arguments` object or a jQuery collection.
*/
export type List<T> = ArrayLike<T> & Iterable<T>

/**
A function called for each item of a list, or the name of a property to read from each item.
*/
export type Iteratee<T, R> = ((item: T, index: number) => R) | string

/**
A plain object with string keys, like an options object or parsed JSON.
*/
export type PlainObject = Record<string, any>

/**
A value, or a function that returns the value. See `up.util.evalOption()`.
*/
export type ValueOrFunction<T> = T | ((...args: any[]) => T)

/**
The parts of a URL, as returned by `up.util.parseURL()`.
A `URL`, a `Location` or an `<a>` element all have these properties.
*/
export type ParsedURL = Pick<URL, 'href' | 'protocol' | 'host' | 'hostname' | 'port' | 'pathname' | 'search' | 'hash'>

/**
Options for `up.util.normalizeURL()`.
*/
export interface NormalizeURLOptions {
  host?: boolean | 'cross-domain'
  hash?: boolean
  search?: boolean
  trailingSlash?: boolean
}

/** @internal */
export type AnyFunction = (...args: any[]) => any

/**
A promise that can be resolved or rejected from the outside. See `up.util.newDeferred()`.
@internal
*/
export type Deferred<T> = Promise<T> & {
  resolve(value?: T | PromiseLike<T>): void
  reject(reason?: any): void
}

/**
Collects clean-up functions and runs them later. See `up.util.cleaner()`.
@internal
*/
export interface Cleaner {
  /** Adds functions to run on clean-up. Values that are not functions are ignored. */
  (...values: any[]): void
  /** Like calling the cleaner, but a function that throws doesn't stop the others. */
  guard(...values: any[]): void
  /** Runs all functions and forgets them. */
  clean(...args: any[]): void
}

/**
A string with some substrings replaced by placeholders, and a function to put them back.
See `up.util.maskPattern()`.
@internal
*/
export interface MaskedString {
  masked: string
  restore(string: string, transform?: (masked: string) => string): string
}

/**
What `up.util.args()` should extract from the end of an argument list:
`'options'` (a plain object), `'callback'` (a function), `'val'` (any value),
or a function that tests whether the last argument matches.
@internal
*/
export type ArgSpec = 'options' | 'callback' | 'val' | ((value: any) => boolean)

/*-
Helper functions for basic JavaScript values.

Most functions are predicates like `up.util.isPresent()` or `up.util.isBlank()`, or list helpers like `up.util.uniq()`, `up.util.reject()` and `up.util.pick()`. They are similar to [Lodash](https://lodash.com/), but feature parity is not a goal. The namespace also parses the formats used in Unpoly's attributes: `up.util.parseRelaxedJSON()` reads [[relaxed-json]], and `up.util.normalizeURL()` and `up.util.parseURL()` work with URLs.

@learn-ref relaxed-json

@namespace up.util
*/

/*-
A function that does nothing.

@function up.util.noop
@stable
*/
export function noop(): void {
}

/*-
A function that returns a resolved promise.

@function up.util.asyncNoop
@internal
*/
export function asyncNoop(): Promise<void> {
  return Promise.resolve()
}

/*-
Ensures that the given function can only be called a single time.
Subsequent calls will return the return value of the first call.

Note that this is a simple implementation that
doesn't distinguish between argument lists.

@function up.util.memoize
@internal
*/
export function memoize<F extends AnyFunction>(func: F, cacheProp?: string): F {
  let cache: { value?: [ReturnType<F>], error?: any } = {}

  return function(this: any, ...args) {
    if (cacheProp) cache = (this[cacheProp] ||= {})
    if (cache.value) return cache.value[0]
    if (cache.error) throw cache.error
    try {
      return (cache.value = [func.apply(this, args)])[0]
    } catch (error) {
      throw (cache.error = error)
    }
  } as F
}

/*-
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
*/
export function normalizeURL(url: string | ParsedURL, options?: NormalizeURLOptions): string {
  options = newOptions(options, { host: 'cross-domain' })

  const parts = parseURL(url)
  let normalized = ''

  if (options.host === 'cross-domain') {
    options.host = isCrossOrigin(parts)
  }

  if (options.host) {
    normalized += parts.protocol + "//" + parts.host
  }

  let { pathname } = parts

  if (options.trailingSlash === false && pathname !== '/') {
    pathname = pathname.replace(/\/$/, '')
  }
  normalized += pathname

  if (options.search !== false) {
    normalized += parts.search
  }

  if (options.hash !== false) {
    normalized += parts.hash
  }

  return normalized
}

export function matchURLs(leftURL: string, rightURL: string, options?: NormalizeURLOptions): boolean {
  return matchableURL(leftURL, options) === matchableURL(rightURL, options)
}

// Normalize the URL so it is better suited for path comparison.
// In particular it strips the hash and trailing slash.
export function matchableURL(url: string | ParsedURL, options?: NormalizeURLOptions): string | undefined {
  if (!url) return
  return normalizeURL(url, { hash: false, trailingSlash: false, ...options })
}

export function matchableURLPatternAtom(patternAtom: string): string | string[] {
  // Convert "https://our-host/foo" to "/foo", like matchableURL() normalizes same-origin URLs
  if (patternAtom.startsWith(APP_ORIGIN + '/')) patternAtom = patternAtom.slice(APP_ORIGIN.length)

  // Convert "/foo/" to ["/foo/", "/foo"]
  if (patternAtom.endsWith('/')) return [patternAtom, patternAtom.slice(0, -1)]

  // Convert "/foo/?" to ["/foo/?", "/foo?"]
  if (patternAtom.includes('/?')) return [patternAtom, patternAtom.replace('/?', '?')]

  // Convert "/foo/*" to ["/foo/*", "/foo", "/foo?*"]
  if (patternAtom.endsWith('/*')) return [patternAtom, patternAtom.slice(0, -2), patternAtom.slice(0, -2) + '?*']

  return patternAtom
}

// We're calling isCrossOrigin() a lot.
// Accessing location.protocol and location.hostname every time
// is much slower than comparing cached strings.
// https://jsben.ch/kBATt
const APP_PROTOCOL = location.protocol
const APP_HOSTNAME = location.hostname
const APP_ORIGIN = location.origin

export function isCrossOrigin(urlOrAnchor: string | ParsedURL): boolean {
  // If the given URL does not contain a hostname we know it cannot be cross-origin.
  // In that case we don't need to parse the URL.
  if (isString(urlOrAnchor) && (urlOrAnchor.indexOf('//') === -1)) {
    return false
  }

  const parts = parseURL(urlOrAnchor)
  return (APP_HOSTNAME !== parts.hostname) || (APP_PROTOCOL !== parts.protocol)
}

/*-
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
*/
export function parseURL(url: string | ParsedURL): ParsedURL {
  if ((url as ParsedURL).pathname) {
    return url as ParsedURL
  }

  // We would prefer to use `new URL(url, location.href)` here, but that is 30% slower
  // than creating a link (see benchmark at https://jsbench.me/l7l2x9cruf/1).
  // We're parsing a *lot* of URLs for .up-active, so this matters.
  let link = document.createElement('a')
  link.href = url as string
  return link
}

/*-
@function up.util.normalizeMethod
@internal
*/
export function normalizeMethod(method?: string): string {
  return method ? method.toUpperCase() : 'GET'
}

/*-
@function up.util.methodAllowsPayload
@internal
*/
export function methodAllowsPayload(method: string): boolean {
  return (method !== 'GET') && (method !== 'HEAD')
}

function iteratee(block: AnyFunction | string): AnyFunction {
  if (isString(block)) {
    return (item: any) => item[block]
  } else {
    return block
  }
}

/*-
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
*/
// Also takes an iterator, like the one returned by String#matchAll(). It has no length.
export function map<T, R = any>(list: Iterable<T> & { length?: number }, block: Iteratee<T, R>): R[] {
  if (list.length === 0) { return [] }
  block = iteratee(block)
  let mapped = []
  let i = 0
  for (let item of list) {
    mapped.push(block(item, i++))
  }
  return mapped
}

/*-
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
*/
export function mapObject<T>(array: T[], pairer: (item: T, index: number) => [PropertyKey, any]): PlainObject {
  return Object.fromEntries(array.map(pairer))
}

/*-
Calls the given function for each element (and optional index)
of the given [list](/api/List) or iterator.

@function up.util.each
@param {List|Iterator} list
@param {Function(element, index)} block
  A function that will be called with each element and (optional) iteration index.
@stable
*/
export function each<T>(array: Iterable<T>, block: (item: T, index: number) => void): void {
  // note that the native Array.forEach is very slow (https://jsperf.com/fast-array-foreach)
  let i = 0
  for (let item of array) {
    block(item, i++)
  }
}

/*-
Returns whether the given argument is `null`.

@function up.util.isNull
@param {any} object
@return {boolean}
@stable
*/
export function isNull(value: any): value is null {
  return value === null
}

function isTruthy(value: any): boolean {
  return !!value
}

/*-
Returns whether the given argument is `undefined`.

@function up.util.isUndefined
@param {any} value
@return {boolean}
@stable
*/
export function isUndefined(value: any): value is undefined {
  return value === undefined
}


/*-
Returns whether the given argument is not `undefined`.

@function up.util.isDefined
@param {any} value
@return {boolean}
@stable
*/
export const isDefined = negate(isUndefined)

/*-
Returns whether the given argument is either `undefined` or `null`.

Note that empty strings or zero are *not* considered to be "missing".

For the opposite of `up.util.isMissing()` see [`up.util.isGiven()`](/api/up.util.isGiven).

@function up.util.isMissing
@param {any} value
@return {boolean}
@stable
*/
export function isMissing(value: any): value is null | undefined {
  return isUndefined(value) || isNull(value)
}

/*-
Returns whether the given argument is neither `undefined` nor `null`.

For the opposite of `up.util.isGiven()` see [`up.util.isMissing()`](/api/up.util.isMissing).

> [IMPORTANT]
> Unpoly's concept of "given" does not correspond to JavaScript's concept of [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy).
> Empty strings or the number zero are not truthy, but *are* considered to be "given".

@function up.util.isGiven
@param {any} value
@return {boolean}
@stable
*/
export const isGiven = negate(isMissing)

// isNan = (object) ->
//   isNumber(value) && value != +value

/*-
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
*/
export function isBlank(value: any): boolean {
  if (isMissing(value)) {
    return true
  }
  if (isObject(value) && value[isBlank.key]) {
    return value[isBlank.key]()
  }
  if (isString(value) || isList(value)) {
    return value.length === 0
  }
  if (isOptions(value)) {
    return Object.keys(value).length === 0
  }
  return false
}

/*-
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
*/
isBlank.key = 'up.util.isBlank'

/*-
Returns the given argument if the argument is [present](/api/up.util.isPresent),
otherwise returns `undefined`.

@function up.util.presence
@param {any} value
@param {Function(value): boolean} [tester=up.util.isPresent]
  The function that will be used to test whether the argument is present.
@return {any|undefined}
@stable
*/
export function presence<T>(value: T, tester: (value: T) => boolean = isPresent): T | undefined {
  if (tester(value)) {
    return value
  }
}

/*-
Returns whether the given argument is not [blank](/api/up.util.isBlank).

@function up.util.isPresent
@param {any} value
@return {boolean}
@stable
@signature
*/
export const isPresent = negate(isBlank)

/*-
Returns whether the given argument is a function.

@function up.util.isFunction
@param {any} value
@return {boolean}
@stable
*/
export function isFunction(value: any): value is AnyFunction {
  return typeof(value) === 'function'
}

/*-
Returns whether the given argument is a string.

@function up.util.isString
@param {any} value
@return {boolean}
@stable
*/
// Also true for `String` objects, which behave like strings in all places we care about.
export function isString(value: any): value is string {
  return (typeof(value) === 'string') || value instanceof String
}

/*-
Returns whether the given argument is a boolean value.

@function up.util.isBoolean
@param {any} value
@return {boolean}
@stable
*/
export function isBoolean(value: any): value is boolean {
  return (typeof(value) === 'boolean') || value instanceof Boolean
}

/*-
Returns whether the given argument is a number.

Note that this will check the argument's *type*.
It will return `false` for a string like `"123"`.

@function up.util.isNumber
@param {any} value
@return {boolean}
@stable
*/
export function isNumber(value: any): value is number {
  return (typeof(value) === 'number') || value instanceof Number
}

/*-
Returns whether the given argument is an options hash.

Unlike [`up.util.isObject()`], this returns false for
functions, jQuery collections, promises, `FormData` instances and arrays.

@function up.util.isOptions
@param {any} value
@return {boolean}
@internal
*/
export function isOptions(value: any): value is PlainObject {
  return (typeof(value) === 'object') && !isNull(value) && (isUndefined(value.constructor) || (value.constructor === Object))
}

/*-
Returns whether the given argument is an object.

This also returns `true` for functions, which may behave like objects in JavaScript.

@function up.util.isObject
@param {any} value
@return {boolean}
@stable
*/
export function isObject(value: any): boolean {
  const typeOfResult = typeof(value)
  return ((typeOfResult === 'object') && !isNull(value)) || (typeOfResult === 'function')
}

/*-
Returns whether the given argument is a [DOM element](https://developer.mozilla.org/en-US/docs/Web/API/Element).

@function up.util.isElement
@param {any} value
@return {boolean}
@stable
*/
export function isElement(value: any): value is Element {
  return value instanceof Element
}

/*-
Returns whether the given argument is a [text node](https://developer.mozilla.org/en-US/docs/Web/API/Text).

@function up.util.isTextNode
@param {any} value
@return {boolean}
@internal
*/
export function isTextNode(value: any): value is Text {
  return value instanceof Text
}

/*-
Returns whether the given argument is a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp).

@function up.util.isRegExp
@param {any} value
@return {boolean}
@internal
*/
export function isRegExp(value: any): value is RegExp {
  return value instanceof RegExp
}

/*-
Returns whether the given argument is an error instance.

@function up.util.isError
@param {any} object
@return {boolean}
@internal
*/
function isError(value: any): value is Error {
  return value instanceof Error
}

/*-
Returns whether the given argument is a [jQuery collection](https://learn.jquery.com/using-jquery-core/jquery-object/).

@function up.util.isJQuery
@param {any} value
@return {boolean}
@stable
*/
export function isJQuery(value: any): boolean {
  return canJQuery() && value instanceof jQuery
}

/*-
@function up.util.isElementLike
@param {any} value
@return {boolean}
@internal
*/
export function isElementLike(value: any): boolean {
  return !!(value && (value.addEventListener || (isJQuery(value) && value[0]?.addEventListener)))
}

/*-
Returns whether the given argument is an object with a `then` method.

@function up.util.isPromise
@param {any} value
@return {boolean}
@stable
*/
export function isPromise(value: any): value is Promise<any> {
  return isObject(value) && isFunction(value.then)
}

/*-
Returns whether the given argument is an array.

@function up.util.isArray
@param {any} value
@return {boolean}
@stable
*/
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
export const { isArray } = Array

/*-
Returns whether the given argument is a `FormData` instance.

Always returns `false` in browsers that don't support `FormData`.

@function up.util.isFormData
@param {any} value
@return {boolean}
@internal
*/
export function isFormData(value: any): value is FormData {
  return value instanceof FormData
}

/*-
Converts the given [array-like value](/api/List) into an array.

If the given value is already an array, it is returned unchanged.

@function up.util.toArray
@param {any} value
@return {Array}
@stable
*/
export function toArray<T>(value: List<T>): T[] {
  return isArray(value) ? value : copyArrayLike(value)
}

/*-
Returns whether the given argument is an [array-like value](/api/List).

To test whether a value is an actual `Array`, use [`up.util.isArray()`](/api/up.util.isArray).

@function up.util.isList
@param {any} value
@return {boolean}
@stable
*/
export function isList(value: any): value is List<any> {
  return isArray(value) ||
    isNodeList(value) ||
    isArguments(value) ||
    isJQuery(value) ||
    isHTMLCollection(value)
}

/*-
Returns whether the given value is a [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList).

`NodeLists` are array-like objects returned by [`document.querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).

@function up.util.isNodeList
@param {any} value
@return {boolean}
@internal
*/
function isNodeList(value: any): value is NodeList {
  return value instanceof NodeList
}

function isHTMLCollection(value: any): value is HTMLCollection {
  return value instanceof HTMLCollection
}

/*-
Returns whether the given value is an [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments).

@function up.util.isArguments
@param {any} value
@return {boolean}
@internal
*/
function isArguments(value: any): boolean {
  return Object.prototype.toString.call(value) === '[object Arguments]'
}

export function isAdjacentPosition(value: string): boolean {
  return /^(before|after)/.test(value)
}

/*-
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
*/
export function wrapList<T>(value: T[]): T[]
export function wrapList<T>(value: List<T>): List<T>
export function wrapList<T>(value: T | null | undefined): T[]
export function wrapList(value) {
  if (isList(value)) {
    return value
  } else if (isMissing(value)) {
    return []
  } else {
    return [value]
  }
}

/*-
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
*/
// A list (like a NodeList or an array) is copied into a new array.
export function copy<T>(value: List<T> & object): T[]
export function copy<T>(value: T): T
export function copy(value) {
  if (isObject(value) && value[copy.key]) {
    value = value[copy.key]()
  } else if (isList(value)) {
    value = copyArrayLike(value)
  } else if (isOptions(value)) {
    value = Object.assign({}, value)
  }
  return value
}

function copyArrayLike<T>(arrayLike: ArrayLike<T>): T[] {
  return Array.prototype.slice.call(arrayLike)
}

/*-
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
*/
copy.key = 'up.util.copy'

/*-
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
*/
export function merge(...sources: PlainObject[]): PlainObject {
  return Object.assign({}, ...sources)
}

/*-
@function up.util.mergeDefined
@param {Array<Object>} ...sources
@return {Object}
@internal
*/
export function mergeDefined(...sources: PlainObject[]): PlainObject {
  const result = {}
  for (let source of sources) {
    if (source) {
      for (let key in source) {
        const value = source[key]
        if (isDefined(value)) {
          result[key] = value
        }
      }
    }
  }
  return result
}

/*-
Creates an options hash from the given argument and some defaults.

The semantics of this function are confusing.
We want to get rid of this in the future.

@function up.util.options
@param {Object} object
@param {Object} [defaults]
@return {Object}
@internal
*/
export function newOptions(object?: PlainObject, defaults?: PlainObject): PlainObject {
  if (defaults) {
    return merge(defaults, object)
  } else if (object) {
    return copy(object)
  } else {
    return {}
  }
}

export function parseArgIntoOptions(args: any[], argKey: string): PlainObject {
  let [positionalArg, options] = parseArgs(args, 'val', 'options')
  if (isDefined(positionalArg)) {
    options[argKey] = positionalArg
  }
  return options
}

/*-
Passes each element in the given [array-like value](/api/List) to the given function.
Returns the first element for which the function returns a truthy value.

If no element matches, returns `undefined`.

@function up.util.find
@param {List<T>} list
@param {Function(value): boolean} tester
@return {T|undefined}
@stable
*/
export function findInList<T>(list: Iterable<T>, tester: ((item: T) => any) | string): T | undefined {
  tester = iteratee(tester)
  let match
  for (let element of list) {
    if (tester(element)) {
      match = element
      break
    }
  }
  return match
}

/*-
Returns whether the given function returns a truthy value
for any element in the given [array-like value](/api/List).

@function up.util.some
@param {List} list
@param {Function(value, index): boolean} tester
  A function that will be called with each element and (optional) iteration index.

@return {boolean}
@stable
*/
export function some<T>(list: Iterable<T>, tester: Iteratee<T, any>): boolean {
  return !!findResult(list, tester)
}

/*-
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
*/
export function findResult<T, R = any>(list: Iterable<T>, tester: Iteratee<T, R>): R | undefined {
  tester = iteratee(tester)
  let i = 0
  for (let item of list) {
    const result = tester(item, i++)
    if (result) {
      return result
    }
  }
}

/*-
Returns whether the given function returns a truthy value
for all elements in the given [list](/api/List) or iterator.

@function up.util.every
@param {List|Iterator} list
@param {Function(element, index): boolean} tester
  A function that will be called with each element and (optional) iteration index.

@return {boolean}
@stable
*/
export function every<T>(list: Iterable<T>, tester: Iteratee<T, any>): boolean {
  tester = iteratee(tester)
  let match = true
  let i = 0
  for (let item of list) {
    if (!tester(item, i++)) {
      match = false
      break
    }
  }
  return match
}

/*-
Returns all elements from the given [list](/api/List) that are
neither `null` nor `undefined`.

@function up.util.compact
@param {List<T>} list
@return {Array<T>}
@stable
*/
export function compact<T>(array: List<T>): T[] {
  return filterList(array, isGiven)
}

export function compactObject<T extends object>(object: T): Partial<T> {
  return pickBy(object, isGiven)
}

/*-
Returns the given array without duplicates.

@function up.util.uniq
@param {Array<T>} array
@return {Array<T>}
@stable
@signature
*/
export function uniq<T>(array: T[]): T[] {
  if (array.length < 2) { return array }
  return Array.from(new Set(array))
}

/*-
This function is like [`uniq`](/api/up.util.uniq), except that
the given function is invoked for each element to generate the value
for which uniqueness is computed.

@function up.util.uniqBy
@param {Array} array
@param {Function(value): any} array
@return {Array}
@experimental
*/
export function uniqBy<T>(array: T[], mapper: Iteratee<T, any>): T[] {
  if (array.length < 2) { return array }
  mapper = iteratee(mapper)
  const seenElements = new Set()
  return filterList(array, function(elem, index) {
    const mapped = mapper(elem, index)
    if (seenElements.has(mapped)) {
      return false
    } else {
      seenElements.add(mapped)
      return true
    }
  })
}

/*-
Returns all elements from the given [list](/api/List) that return
a truthy value when passed to the given function.

@function up.util.filter
@param {List|Iterator} list
@param {Function(value, index): boolean} tester
@return {Array}
@stable
*/
export function filterList<T>(list: Iterable<T>, tester: Iteratee<T, any>): T[] {
  tester = iteratee(tester)
  const matches = []
  each(list, function(element, index) {
    if (tester(element, index)) {
      return matches.push(element)
    }
  })
  return matches
}

/*-
Returns all elements from the given [array-like value](/api/List) that do not return
a truthy value when passed to the given function.

@function up.util.reject
@param {List} list
@param {Function(element, index): boolean} tester
@return {Array}
@stable
@signature
*/
export function reject<T>(list: Iterable<T>, tester: Iteratee<T, any>): T[] {
  tester = negate(iteratee(tester))
  return filterList(list, tester)
}

/*-
Returns the intersection of the given two arrays.

Implementation is not optimized. Don't use it for large arrays.

@function up.util.intersect
@internal
*/
export function intersect<T>(array1: List<T>, array2: List<T>): T[] {
  return filterList(array1, (element) => contains(array2, element))
}

/*-
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
*/
export function scheduleTimer(millis: number, callback: () => void): number {
  return setTimeout(callback, millis)
}

/*-
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
*/
export function queueTask(task: () => void): void {
  setTimeout(task)
}

/*-
Schedules a macrotask.

Unlike `up.util.task()`, this function uses `postMessage()` instead of `setTimeout()`.
This has pros and cons:

- This *tends* to cause the task to run before `setTimeout()`, sometimes even before the browser paints the screen.
- Safari does not honor the order of `postMessage()` calls on multiple `MessageChannels`, making
  it hard to reason about the order of tasks.
- Safari sometimes executes a `postMessage()` task before a `setTimeout()` task.

@function up.util.fastTask
@internal
*/
export function queueFastTask(task: () => void): void {
  const channel = new MessageChannel()
  channel.port1.onmessage = () => task()
  channel.port2.postMessage(0)
}

/*-
Returns the last element of the given array or string.

@function up.util.last
@param {Array<T>|string} array
@return {T|string}
@stable
*/
export function last<T>(value: ArrayLike<T>): T {
  return value[value.length - 1]
}

/*-
Returns whether the given value contains another value.

If `value` is a string, this returns whether `subValue` is a sub-string of `value`.

If `value` is an array, this returns whether `subValue` is an element of `value`.

@function up.util.contains
@param {Array|NodeList|string} value
@param {any} subValue
@return {boolean} Whether the value is contained.
@stable
*/
export function contains(value: List<any> | string, subValue: any): boolean {
  let indexOf = (value as any).indexOf || Array.prototype.indexOf
  return indexOf.call(value, subValue) >= 0
}

/*-
Returns whether the first list contains all elements of the second list.

Element order is ignored for this check.

@function up.util.containsAll
@param {Array|NodeList|string} values
@param {Array|NodeList|string} subValues
@return {boolean} Whether all values are contained.
@internal
*/
export function containsAll(values: List<any> | string, subValues: List<any>): boolean {
  return every(subValues, (subValue) => contains(values, subValue))
}


/*-
Returns whether `object`'s entries are a superset
of `subObject`'s entries.

@function up.util.objectContains
@param {Object} object
@param {Object} subObject
@internal
*/
export function objectContains(object: PlainObject, subObject: PlainObject): boolean {
  const reducedValue = pick(object, Object.keys(subObject))
  return isEqual(subObject, reducedValue)
}

/*-
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
*/
export function pick<T extends object, K extends keyof T>(object: T, keys: readonly K[]): Pick<T, K> {
  const filtered = {} as Pick<T, K>
  for (let key of keys) {
    if (key in object) {
      filtered[key] = object[key]
    }
  }
  return filtered
}

/*-
Returns a copy of the given object that only contains
properties that pass the given tester function.

@function up.util.pickBy
@param {Object} object
@param {Function(value, key): boolean} tester
  A function that will be called with each property.

  The arguments are the property value and key.
@return {Object}
@experimental
*/
export function pickBy<T extends object>(object: T, tester: ((value: any, key: string) => any) | string): Partial<T> {
  tester = iteratee(tester)
  const filtered: Partial<T> = {}
  for (let key in object) {
    const value = object[key]
    if (tester(value, key)) {
      filtered[key] = object[key]
    }
  }
  return filtered
}

/*-
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
*/
export function omit<T extends object, K extends keyof T>(object: T, keys: readonly K[]): Omit<T, K> {
  return pickBy(object, (_value, key) => !contains(keys, key)) as Omit<T, K>
}

/*-
Returns a promise that will never be resolved.

@function up.util.unresolvablePromise
@internal
*/
export function unresolvablePromise(): Promise<never> {
  return new Promise(noop)
}

/*-
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
*/
export function remove<T>(array: T[], element: T): T | undefined {
  const index = array.indexOf(element)
  if (index >= 0) {
    array.splice(index, 1)
    return element
  }
}

/*-
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
*/
export function evalOption<T>(value: ValueOrFunction<T>, ...args: any[]): T {
  return isFunction(value) ? value(...args) : value
}

export function evalAutoOption(value: any, autoMeans: any, ...args: any[]): any {
  value = evalOption(value, ...args)
  // Allow functions to return 'auto'
  if (value === 'auto') {
    value = evalOption(autoMeans, ...args)
  }
  return value
}

const ESCAPE_HTML_ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': '&quot;',
  "'": '&#x27;'
}

/*-
Escapes the given string of HTML by replacing control chars with their HTML entities.

@function up.util.escapeHTML
@param {string} string
  The text that should be escaped.
@stable
*/
export function escapeHTML(string: string): string {
  return string.replace(/[&<>"']/g, (char) => ESCAPE_HTML_ENTITY_MAP[char])
}

/*-
@function up.util.escapeRegExp
@internal
*/
export function escapeRegExp(string: string): string {
  // From https://github.com/benjamingr/RegExp.escape
  return string.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
}

// function groupBy(list, block) {
//   block = iteratee(block)
//   let groups = {}
//   for (let entry in list) {
//     let key = block(entry)
//     let group = (groups[key] ||= [])
//     group.push(entry)
//   }
//   return groups
// }

/*-
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
*/
export function pluckKey(object: PlainObject, key: string): any {
  const value = object[key]
  delete object[key]
  return value
}

export function renameKey(object: PlainObject, oldKey: string, newKey: string): void {
  if (oldKey in object) {
    object[newKey] = pluckKey(object, oldKey)
  }
}

function extractLastArg(args: any[], tester: (value: any) => boolean): any {
  if (tester(last(args))) {
    return args.pop()
  }
}

//  extractFirstArg = (args, tester) ->
//    firstArg = args[0]
//    if tester(firstArg)
//      return args.shift()

export function extractCallback(args: any[]): AnyFunction | undefined {
  return extractLastArg(args, isFunction)
}

export function extractOptions(args: any[]): PlainObject {
  return extractLastArg(args, isOptions) || {}
}

//  partial = (fn, fixedArgs...) ->
//    return (callArgs...) ->
//      fn.apply(this, fixedArgs.concat(callArgs))
//
//   function partialRight(fn, ...fixedArgs) {
//     return function(...callArgs) {
//       return fn.apply(this, [...callArgs, ...fixedArgs])
//     }
//   }

//function throttle(callback, limit) { // From https://jsfiddle.net/jonathansampson/m7G64/
//  var wait = false                   // Initially, we're not waiting
//  return function () {               // We return a throttled function
//    if (!wait) {                     // If we're not waiting
//      callback.call()                // Execute users function
//      wait = true                    // Prevent future invocations
//      setTimeout(function () {       // After a period of time
//        wait = false                 // And allow future invocations
//      }, limit)
//    }
//  }
//}

export function identity(arg: any): any {
  return arg
}

//  ###**
//  ###
//  parsePath = (input) ->
//    path = []
//    pattern = /([^\.\[\]\"\']+)|\[\'([^\']+?)\'\]|\[\"([^\"]+?)\"\]|\[([^\]]+?)\]/g
//    while match = pattern.exec(input)
//      path.push(match[1] || match[2] || match[3] || match[4])
//    path

//  ###**
//  Given an async function that will return a promise, returns a proxy function
//  with an additional `.promise` attribute.
//
//  When the proxy is called, the inner function is called.
//  The proxy's `.promise` attribute is available even before the function is called
//  and will resolve when the inner function's returned promise resolves.
//
//  If the inner function does not return a promise, the proxy's `.promise` attribute
//  will resolve as soon as the inner function returns.
//
//  @function up.util.previewable
//  @internal
//  ###
//  previewable = (fun) ->
//    deferred = newDeferred()
//    preview = (args...) ->
//      funValue = fun(args...)
//      # If funValue is again a Promise, it will defer resolution of `deferred`
//      # until `funValue` is resolved.
//      deferred.resolve(funValue)
//      funValue
//    preview.promise = deferred.promise()
//    preview

/*-
@function up.util.sequence

@param {Array<Function()>} functions
@return {Function()}
  A function that will call all `functions` if called.

  Its arguments are passed on to each function.
@internal
*/
export function sequence(...fns: any[]): (...args: any[]) => any[] {
  return (...callArgs) => callAll(fns, ...callArgs)
}

export function callAll(fns: any, ...args: any[]): any[] {
  fns = scanFunctions(fns)
  return map(fns, (fn: AnyFunction) => fn(...args))
}

//  ###**
//  @function up.util.race
//  @internal
//  ###
//  race = (promises...) ->
//    raceDone = newDeferred()
//    each promises, (promise) ->
//      promise.then -> raceDone.resolve()
//    raceDone.promise()

//  ###**
//  Returns `'left'` if the center of the given element is in the left 50% of the screen.
//  Otherwise returns `'right'`.
//
//  @function up.util.horizontalScreenHalf
//  @internal
//  ###
//  horizontalScreenHalf = (element) ->
//    elementDims = element.getBoundingClientRect()
//    elementMid = elementDims.left + 0.5 * elementDims.width
//    screenMid = 0.5 * up.viewport.rootWidth()
//    if elementMid < screenMid
//      'left'
//    else
//      'right'

/*-
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
*/
export function flatten<T>(array: List<T | List<T>>): T[] {
  const flattened = []
  for (let object of array) {
    if (isList(object)) {
      flattened.push(...object)
    } else {
      flattened.push(object)
    }
  }
  return flattened
}

//  flattenObject = (object) ->
//    result = {}
//    for key, value of object
//      result[key] = value
//    result

/*-
Maps each element using a mapping function,
then [flattens](/api/up.util.flatten) the result into a new array.

@function up.util.flatMap
@param {List|Iterator} list
@param {Function(element)} mapping
@return {Array}
@stable
*/
export function flatMap<T, R = any>(array: List<T>, block: Iteratee<T, R | List<R>>): R[] {
  return flatten(map(array, block))
}

/*-
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
*/
export function always<T>(promise: Promise<T>, callback: (valueOrError: any) => any = identity): Promise<any> {
  return promise.then(callback, callback)
}

/*-
@function up.util.newDeferred
@internal
*/
export function newDeferred<T = any>(): Deferred<T> {
  let { promise, resolve, reject } = Promise.withResolvers<T>()
  return Object.assign(promise, { resolve, reject })
}

//  ###**
//  Calls the given block. If the block throws an exception,
//  a rejected promise is returned instead.
//
//  @function up.util.rejectOnError
//  @internal
//  ###
//  rejectOnError = (block) ->
//    try
//      block()
//    catch error
//      Promise.reject(error)

//  sum = (list, block) ->
//    block = iteratee(block)
//    totalValue = 0
//    for entry in list
//      entryValue = block(entry)
//      if isGiven(entryValue) # ignore undefined/null, like SQL would do
//        totalValue += entryValue
//    totalValue

export function isBasicObjectProperty(k: PropertyKey): boolean {
  return Object.hasOwn(Object.prototype, k)
}

/*-
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
*/
export function isEqual(a: any, b: any): boolean {
  // When two values have trivial equality, return immediately instead of going
  // through the extensive normalization and comparison below.
  if (a === b) {
    return true
  }

  if (a?.valueOf) { a = a.valueOf() } // Date, String objects, Number objects
  if (b?.valueOf) { b = b.valueOf() } // Date, String objects, Number objects

  if (a === b) {
    return true
  }

  if (typeof(a) !== typeof(b)) {
    return false
  }

  if (isList(a) && isList(b)) {
    return isEqualList(a, b)
  }

  if (isObject(a) && a[isEqual.key]) {
    return a[isEqual.key](b)
  }

  if (isOptions(a) && isOptions(b)) {
    return isEqualOptions(a, b)
  }

  return false
}

function isEqualOptions(a: PlainObject, b: PlainObject): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  return isEqualList(aKeys, bKeys) && every(aKeys, (key) => isEqual(a[key], b[key]))
}

/*-
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
*/
isEqual.key = 'up.util.isEqual'

function isEqualList(a: List<any>, b: List<any>): boolean {
  return (a.length === b.length) && every(a, (elem, index) => isEqual(elem, b[index]))
}

export function getSimpleTokens(value: any, { json = false, separator = /[,\s]/ }: { json?: boolean, separator?: string | RegExp } = {}) {
  if (!isString(value)) {
    return wrapList(value)
  } else if (json && /^\[.*]$/.test(value)) {
    return parseRelaxedJSON(value)
  } else {
    return splitSimpleTokenString(value, separator)
  }
}

function splitSimpleTokenString(value: string, separator: string | RegExp): string[] {
  let parts = up.migrate.splitAtOr?.(value) || value.split(separator)
  return parts.map((s) => s.trim()).filter(identity)
}

export function getComplexTokens(value: any) {
  if (!isString(value)) {
    return wrapList(value)
  } else {
    let { maskedTokens, restore } = complexTokenOutlines(value)
    return maskedTokens.map((token) => restore(token))
  }
}

function complexTokenOutlines(string: string) {
  let { masked, restore } = expressionOutline(string)
  let maskedTokens = splitSimpleTokenString(masked, ',')
  return { maskedTokens, restore }
}

export function wrapValue<T>(constructor: new (...args: any[]) => T, ...args: any[]): T {
  return (args[0] instanceof constructor) ? args[0] : new constructor(...args)
}

//  wrapArray = (objOrArray) ->
//    if isUndefined(objOrArray)
//      []
//    else if isArray(objOrArray)
//      objOrArray
//    else
//      [objOrArray]

let nextUid = 0

export function uid(): number {
  return nextUid++
}

/*-
Returns a copy of the given object, with its keys transformed by the given function.

If the given function returns `undefined` for a key, that key
will be omitted from the returned object.

@function up.util.withRenamedKeys
@param {Object} object
@param {Function(string): string|undefined} renameKeyFn
@internal
*/
export function withRenamedKeys(object: PlainObject, renameKeyFn: (key: string) => string | null | undefined): PlainObject {
  const renamed = {}
  for (let key in object) {
    let transformed = renameKeyFn(key)
    if (isGiven(transformed)) {
      renamed[transformed] = object[key]
    }
  }
  return renamed
}

export function camelToKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (char) => '-' + char.toLowerCase())
}

export function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_match, char) => char.toUpperCase())
}

// function prefixCamelCase(str, prefix) {
//   return prefix + upperCaseFirst(str)
// }
//
// function unprefixCamelCase(str, prefix) {
//   const pattern = new RegExp('^' + prefix + '(.+)$')
//   let match = str.match(pattern)
//   if (match) {
//     return lowerCaseFirst(match[1])
//   }
// }

export function lowerCaseFirst(str: string): string {
  return str[0].toLowerCase() + str.slice(1)
}

export function upperCaseFirst(str: string): string {
  return str[0].toUpperCase() + str.slice(1)
}

export function defineDelegates(object: object, props: string[], targetProvider: (this: any) => any): void {
  for (let prop of props) {
    Object.defineProperty(object, prop, {
      get() {
        const target = targetProvider.call(this)
        let value = target[prop]
        if (isFunction(value)) {
          value = value.bind(target)
        }
        return value
      },
      set(newValue) {
        const target = targetProvider.call(this)
        target[prop] = newValue
      }
    })
  }
}

export function delegatePromise(object: object, targetProvider: (this: any) => any): void {
  return defineDelegates(
    object,
    ['then', 'catch', 'finally'],
    targetProvider
  )
}

// function defineTemporaryDelegates(object, props, targetProvider) {
//   let undo = sequence(props.map((prop) => {
//     let oldDescriptor = Object.getOwnPropertyDescriptor(object, prop)
//     // There's a case where Object.getOwnPropertyDescriptor() is missing because it is
//     // a inherited property. In this case it is non-trivial to undo the temporary delegation.
//     // Since we don't need that case, we don't handle it.
//     return () => Object.defineProperty(object, prop, oldDescriptor)
//     }
//   ))
//   defineDelegates(object, props, targetProvider)
//   return undo
// }

function stringifyArg(arg: any, placeholder = '%o', ancestors = new Set()): string {
  let string
  const maxLength = 200

  // Discard color styles: https://developer.mozilla.org/en-US/docs/Web/API/Console#styling_console_output
  if (placeholder === '%c') {
    return ''
  }

  // In the browser console %s always stringifies the output.
  // Objects become "[object Object]".
  if (placeholder === '%s' && isGiven(arg)) {
    arg = arg.toString()
  }

  // Values nested in an array or object print like a value passed directly with %o.
  let stringifyNested = (value) => stringifyArg(value, '%o', ancestors)

  if (isString(arg)) {
    string = arg.trim().replace(/[\n\r\t ]+/g, ' ')

    // In the browser console %o displays a string with quotes
    if (placeholder === '%o') {
      // This adds quotes and will log line breaks as verbatim `\n`.
      string = JSON.stringify(string)
    }
  } else if (isFunction(arg)) {
    string = arg.toString()
  } else if (isJQuery(arg)) {
    string = `$(${map(arg, stringifyNested).join(', ')})`
  } else if (isElement(arg)) {
    string = tagOuterHTML(arg)
  } else if (isError(arg)) {
    string = `${arg.name}(${arg.message})`
  } else if (isObject(arg)) {
    // Arrays and objects. Functions, elements and errors are objects, too, but are handled above.
    // Our public classes have a [Symbol.toStringTag] (see unpoly.ts), because minifiers rename them.
    let label = arg[Symbol.toStringTag] || arg.constructor?.name

    if (ancestors.has(arg)) {
      string = '(circular)'
    } else if (isArray(arg) || isOptions(arg)) {
      // Track the arrays and objects we're currently printing, so a cycle doesn't recurse infinitely.
      // An object that appears twice without a cycle is printed in full both times.
      ancestors.add(arg)
      if (isArray(arg)) {
        string = `[${map(arg, stringifyNested).join(', ')}]`
      } else {
        let pairs = Object.entries(arg).map(([key, value]) => `${key}: ${stringifyNested(value)}`)
        string = pairs.length ? `{ ${pairs.join(', ')} }` : '{}'
      }
      ancestors.delete(arg)
    } else if (arg.toString !== Object.prototype.toString) {
      // A class instance with its own readable name, like an up.Request or a Date.
      string = `${label}(${arg.toString()})`
    } else {
      string = `${label} {…}`
    }
  } else {
    // undefined, null, booleans, numbers
    string = String(arg)
  }

  if (string.length > maxLength) {
    string = `${string.substr(0, maxLength)}…${last(string)}`
  }
  return string
}

const SPRINTF_PLACEHOLDERS = /%[oOdisfc]/g

/*-
See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions

@function up.util.sprintf
@internal
*/
export function sprintf(message: string, ...args: any[]): string {
  return message.replace(SPRINTF_PLACEHOLDERS, (placeholder) => stringifyArg(args.shift(), placeholder))
}

const SERIALIZED_TAG_PATTERN = /<("[^"]*"|[^">])*>/

// This could go in up.element, but we want up.util to not have any dependencies
// so every other namespace can depend on up.util.
function tagOuterHTML(element: Element): string {
  return (element.cloneNode() as Element).outerHTML.match(SERIALIZED_TAG_PATTERN)[0]
}

function negate<A extends any[]>(fn: (...args: A) => any): (...args: A) => boolean {
  return function(...args: A) {
    return !fn(...args)
  }
}

export function memoizeMethod(object: object, propLiteral: PlainObject): void {
  // We're accepting the property names as the keys of an object. We don't care about the values.
  // We do this so that object's keys go through the same property mangling as the rest of the code.
  for (let prop in propLiteral) {
    // TODO: Why can't we just get the old prop using object[prop] ?
    let originalDescriptor = Object.getOwnPropertyDescriptor(object, prop)
    let oldImpl = originalDescriptor.value
    let memoizedImpl = memoize(oldImpl, `__${prop}MemoizeCache`)
    object[prop] = memoizedImpl
  }
}

export function safeStringifyJSON(value: any): string {
  let json = JSON.stringify(value)
  return escapeHighASCII(json)
}

function escapeHighASCII(string: string): string {
  let unicodeEscape = (char) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, '0')
  return string.replace(/[^\x00-\x7F]/g, unicodeEscape)
}

export function variant<T extends object>(source: T, changes: PlainObject = {}): T {
  let variant = Object.create(source)
  Object.assign(variant, changes)
  return variant
}

export function parseArgs(args: any[], ...specs: ArgSpec[]): any[] {
  let results = []

  // let originalArgs = copy(args)
  // let originalSpecs = copy(specs)

  while (specs.length) {
    let lastSpec = specs.pop()

    if (lastSpec === 'options') {
      results.unshift(extractOptions(args))
    } else if (lastSpec === 'callback') {
      results.unshift(extractCallback(args))
    } else if (lastSpec === 'val') {
      results.unshift(args.pop())
    } else if (isFunction(lastSpec)) {
      let value = lastSpec(last(args)) ? args.pop() : undefined
      // Write undefined if the tester failed. This makes the result order deterministic.
      // The caller can set a default liike this:
      //
      //     let [foo = 'default'] = up.util.args(args, tester)
      results.unshift(value)
    }
  }

  // if (args.length) {
  //   throw new up.CannotParse(['Invalid argument list (%o vs. %o), left is %o', originalArgs, originalSpecs, args])
  // }

  return results
}

// /*-
// [Assigns](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) the given properties to the given object.
//
// Returns a function that restores the object's properties to the value they had before assignment.
//
// ### Example
//
// ```js
// let obj = { a: 1, b: 2, c: 3, d: 4 }
// let undo = up.util.assignTemp(obj, { b: 20, c: 30 })
// console.log(obj) // logs { a: 1, b: 20, c: 30, d: 4 }
//
// undo()
// console.log(obj) // logs { a: 1, b: 2, c: 3, d: 4 }
// ```
//
// ### Limitations
//
// The returned function can only restore properties that existed before re-assignment.
//
// @function up.util.assignTemp
// @param {Object} target
//   The target object to mutate.
// @param {Object} props
//   An object containing the properties you want to apply.
//
//   All enumerable own properties of `props` will be copied to `object`.
// @return {Function}
//   A function that undoes the mutation of `target` when called.
//
//   Only properties listed in `props` will be restored.
// @experimental
// */
// function assignTemp(target, props) {
//   let oldProps = pick(target, Object.keys(props))
//   Object.assign(target, props)
//   return () => Object.assign(target, oldProps)
// }

export function scanFunctions(...values: any[]): AnyFunction[] {
  return values.flat(2).filter(isFunction)
}

export function cleaner(order: 'lifo' | 'fifo' = 'lifo'): Cleaner {
  let fns = []

  let track = function(values, transform) {
    values = scanFunctions(values).map(transform)
    fns.push(...scanFunctions(values))
  }

  let api = function(...values) {
    track(values, identity)
  } as Cleaner

  api.guard = function(...values) {
    track(values, guardFn)
  }

  api.clean = function(...args) {
    // By default, we run clean-up actions in the reverse order that they were scheduled in
    if (order === 'lifo') fns.reverse()

    // We don't allow clean-up actions to schedule more clean-up actions, to
    // prevent infinite loops. E.g. a user misunderstanding Preview#show() calls
    // Preview#hide() in an undo action.
    //
    // We can leverage the behavior of forEach(), which sets its range before the first iteration
    // and does not iterate over additional elements.
    // https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.foreach
    // AFAIK for ... of loops would behave differently.
    fns.forEach((fn) => fn(...args))

    // Allow the cleaner to be re-used.
    fns = []
  }

  return api
}

export function maskPattern(str: string, patterns: RegExp[], { keepDelimiters = false }: { keepDelimiters?: boolean } = {}): MaskedString {
  let maskCount = 0
  let maskPattern = /§\d+/g
  let maskings = {}
  let replaceLayers = []

  let replace = (replacePattern, allowRestoreTransform) => {
    let didReplace = false

    str = str.replaceAll(replacePattern, function(match) {
      didReplace = true
      let mask = '§' + (maskCount++)
      let remain
      let masked

      if (keepDelimiters) {
        let startDelimiter = match[0]
        let endDelimiter = match.slice(-1)
        masked = match.slice(1, -1)
        remain = startDelimiter + mask + endDelimiter
      } else {
        masked = match
        remain = mask
      }

      maskings[mask] = masked
      return remain
    })

    if (didReplace) replaceLayers.unshift({ allowRestoreTransform })
  }

  // If the input already contains a mask pattern (like §5), we mask it, but don't allow transforms on restore.
  replace(maskPattern, false)

  // When we mask the given patterns, we allow an optional transform on restore.
  for (let pattern of patterns) replace(pattern, true)

  let restore = (s: string, transform: (masked: string) => string = identity): string => {
    for (let { allowRestoreTransform } of replaceLayers) {
      let iterationTransform = allowRestoreTransform ? transform : identity
      s = s.replace(maskPattern, (match) => iterationTransform(assert(maskings[match], isString)))
    }
    return s
  }

  return { masked: str, restore }
}

const QUOTED_STRING_PATTERN = /'(?:\\\\|\\'|[^'])*'|"(?:\\\\|\\"|[^"])*"/g
// TODO: Remove
// const NESTED_BRACES = /{(?:[^{}]|{[^{}]*})*}/g
// const NESTED_PARENTHESES = /\((?:[^\(\)]|\([^\(\)]*\))*\)/g
// const NESTED_BRACKETS = /\[(?:[^\[\]]|\[[^\[\]]*\])*\]/g
const NESTED_GROUP_PATTERN = /{(?:[^{}]|{[^{}]*})*}|\((?:[^\(\)]|\([^\(\)]*\))*\)|\[(?:[^\[\]]|\[[^\[\]]*\])*\]/g // oxlint-disable-line no-useless-escape

export function expressionOutline(str: string): MaskedString {
  return maskPattern(str, [QUOTED_STRING_PATTERN, NESTED_GROUP_PATTERN], { keepDelimiters: true })
}

// ("foo") => ("foo")
// ('foo') => ("foo")
// ('foo"bar\'baz"') => ("foo\"bar'baz")
function ensureDoubleQuotes(str: string): string {
  // If we already have double-quoted string, there's nothing to do.
  if (str[0] === '"') return str
  assert(str[0] === "'")
  str = str.slice(1, -1)

  let transformed = str.replace(/(\\\\)|(\\')|(\\")|(")/g, function(_match, escapedBackslash, escapedSingleQuote, _doubleQuote) {
    return escapedBackslash           // keep (\\)
      || (escapedSingleQuote && "'")  // convert (\') to just (')
      || '\\"'                        // convert (") to (\")
  })
  return '"' + transformed + '"'
}

export function parseString(value: string): any {
  return JSON.parse(ensureDoubleQuotes(value))
}

/*-
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
*/
export function parseRelaxedJSON(str: string): any {
  let { masked, restore } = maskPattern(str, [QUOTED_STRING_PATTERN])
  masked = masked.replace(/([a-z_$][\w$]*:)/gi, (unquotedProperty) => ('"' + unquotedProperty.slice(0, -1) + '":'))
  masked = masked.replace(/,\s*([}\]])/g, '$1')
  masked = restore(masked, ensureDoubleQuotes)
  return JSON.parse(masked)
}

export function parseScalarJSONPairs(str: string) {
  let { maskedTokens, restore } = complexTokenOutlines(str)

  return maskedTokens.map((maskedToken) => {
    let [_match, string, json] = maskedToken.match(/([^{]+)({[^}]*})?/)
    return [
      restore(string.trim()),
      json && parseRelaxedJSON(restore(json))
    ]
  })
}

export function spanObject(keys: string[], value: any): PlainObject {
  return mapObject(keys, (key) => [key, value])
}

/*-
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
*/
export function parseNumber(str: any): number | undefined {
  if (isNumber(str)) {
    return str
  } else if (isString(str) && /^-?\.?\d[\d._]*$/.test(str)) {
    return parseFloat(str.replaceAll('_', ''))
  }
}

export function assert<T>(value: T, testFn: (value: T) => boolean = isTruthy): T {
  if (testFn(value)) {
    return value
  } else {
    throw "assert failed"
  }
}

export function install(): void {
  // Implement up.util.copy protocol for Date
  Date.prototype[copy.key] = function() { return new Date(+this) }
}

export const api = {
  util: {
    parseURL,
    normalizeURL,
    copy,
    merge,
    each,
    map,
    flatMap,
    mapObject,
    findResult,
    some,
    every,
    find: findInList,
    filter: filterList,
    reject,
    compact,
    uniq,
    uniqBy,
    last,
    isNull,
    isDefined,
    isUndefined,
    isGiven,
    isMissing,
    isPresent,
    isBlank,
    presence,
    isObject,
    isFunction,
    isString,
    isBoolean,
    isNumber,
    isElement,
    isJQuery,
    isPromise,
    isArray,
    // isNodeList,
    // isArguments,
    isList,
    timer: scheduleTimer,
    contains,
    toArray,
    pick,
    pickBy,
    omit,
    remove,
    pluckKey,
    noop,
    escapeHTML,
    evalOption,
    flatten,
    task: queueTask,
    isEqual,
    wrapList,
    // temporaryDelegate: defineTemporaryDelegates,
    // prefixCamelCase,
    // unprefixCamelCase,
    // groupBy,
    parseRelaxedJSON,
    parseNumber,
    // partialRight,
  },
}
