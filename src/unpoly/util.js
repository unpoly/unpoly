/*-
Utility functions
=================

The `up.util` module contains functions to facilitate the work with basic JavaScript
values like lists, strings or functions.

You will recognize many functions form other utility libraries like [Lodash](https://lodash.com/).
While feature parity with Lodash is not a goal of `up.util`, you might find it sufficient
to not include another library in your asset bundle.

@see url-patterns

@module up.util
*/
up.util = (function() {

  /*-
  A function that does nothing.

  @function up.util.noop
  @experimental
  */
  function noop() {
  }

  /*-
  A function that returns a resolved promise.

  @function up.util.asyncNoop
  @internal
  */
  function asyncNoop(){
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
  function memoize(func) {
    let cachedValue, cached
    return function(...args) {
      if (cached) {
        return cachedValue
      } else {
        cached = true
        return cachedValue = func.apply(this, args)
      }
    }
  }

  /*-
  Returns a normalized version of the given URL string.

  Two URLs that point to the same resource should normalize to the same string.

  ### Comparing normalized URLs

  The main purpose of this function is to normalize two URLs for string comparison:

  ```js
  up.util.normalizeURL('http://current-host/path') === up.util.normalizeURL('/path') // => true
  ```

  By default the hostname is only included if it points to a different origin:

  ```js
  up.util.normalizeURL('http://current-host/path') // => '/path'
  up.util.normalizeURL('http://other-host/path') // => 'http://other-host/path'
  ```

  Relative paths are normalized to absolute paths:

  ```js
  up.util.normalizeURL('index.html') // => '/path/index.html'
  ```

  ### Excluding URL components

  You may pass options to exclude URL components from the normalized string:

  ```js
  up.util.normalizeURL('/foo?query=bar', { query: false }) => '/foo'
  up.util.normalizeURL('/bar#hash', { hash: false }) => '/bar'
  ```

  ### Limitations

  - Username and password are always omitted from the normalized URL.
  - Only `http` and `https` schemes are supported.

  @function up.util.normalizeURL
  @param {string|URL} the URL to normalize
  @param {boolean} [options.host='cross-domain']
    Whether to include protocol, hostname and port in the normalized URL.

    When set to `'cross-domain'` (the default), the host is only included if it differ's from the page's hostname.

    The port is omitted if the port is the standard port for the given protocol, e.g. `:443` for `https://`.
  @param {boolean} [options.hash=true]
    Whether to include an `#hash` anchor in the normalized URL.
  @param {boolean} [options.search=true]
    Whether to include a `?query` string in the normalized URL.
  @param {boolean} [options.trailingSlash=true]
    Whether to include a trailing slash from the pathname.
  @return {string}
    The normalized URL.
  @experimental
  */
  function normalizeURL(url, options) {
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

  function matchURLs(leftURL, rightURL, options) {
    return matchableURL(leftURL, options) === matchableURL(rightURL, options)
  }

  // Normalize the URL so it is better suited for path comparison.
  // In particular it strips the hash and trailing slash.
  function matchableURL(url, options) {
    if (!url) return
    return normalizeURL(url, { hash: false, trailingSlash: false, ...options })
  }

  function matchableURLPatternAtom(patternAtom) {
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

  function isCrossOrigin(urlOrAnchor) {
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
  parsed.pathname // => '/path'
  parsed.search // => '/?foo=value'
  parsed.hash // => ''
  ```

  @function up.util.parseURL
  @param {string|URL} the URL to parse
  @return {Object}
    The parsed URL as an object with
    `{ protocol, hostname, port, pathname, search, hash }` properties.
  @stable
  */
  function parseURL(url) {
    if (url.pathname) {
      return url
    }

    // We would prefer to use `new URL(url, location.href)` here, but that is 30% slower
    // than creating a link (see benchmark at https://jsbench.me/l7l2x9cruf/1).
    // We're parsing a *lot* of URLs for [up-active], so this matters.
    let link = document.createElement('a')
    link.href = url
    return link
  }

  /*-
  @function up.util.normalizeMethod
  @internal
  */
  function normalizeMethod(method) {
    return method ? method.toUpperCase() : 'GET'
  }

  /*-
  @function up.util.methodAllowsPayload
  @internal
  */
  function methodAllowsPayload(method) {
    return (method !== 'GET') && (method !== 'HEAD')
  }

  function iteratee(block) {
    if (isString(block)) {
      return item => item[block]
    } else {
      return block
    }
  }

  /*-
  Translate all items in a [list](/up.util.isList) to new array of items.

  @function up.util.map
  @param {List|Iterator} list
  @param {Function(element, index): any|string} block
    A function that will be called with each element and (optional) iteration index.

    You can also pass a property name as a String,
    which will be collected from each item in the list.
  @return {Array}
    A new array containing the result of each function call.
  @stable
  */
  function map(list, block) {
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
  @function up.util.mapObject
  @internal
  */
  function mapObject(array, pairer) {
    const merger = function(object, pair) {
      object[pair[0]] = pair[1]
      return object
    }
    return map(array, pairer).reduce(merger, {})
  }

  /*-
  Calls the given function for each element (and, optional, index)
  of the given [list](/up.util.isList) or iterator.

  @function up.util.each
  @param {List|Iterator} list
  @param {Function(element, index)} block
    A function that will be called with each element and (optional) iteration index.
  @stable
  */
  function each(array, block) {
    // note that the native Array.forEach is very slow (https://jsperf.com/fast-array-foreach)
    let i = 0
    for (let item of array) {
      block(item, i++)
    }
  }

  /*-
  Returns whether the given argument is `null`.

  @function up.util.isNull
  @param object
  @return {boolean}
  @stable
  */
  function isNull(object) {
    return object === null
  }

  /*-
  Returns whether the given argument is `undefined`.

  @function up.util.isUndefined
  @param object
  @return {boolean}
  @stable
  */
  function isUndefined(object) {
    return object === undefined
  }


  /*-
  Returns whether the given argument is not `undefined`.

  @function up.util.isDefined
  @param object
  @return {boolean}
  @stable
  */
  const isDefined = negate(isUndefined)

  /*-
  Returns whether the given argument is either `undefined` or `null`.

  Note that empty strings or zero are *not* considered to be "missing".

  For the opposite of `up.util.isMissing()` see [`up.util.isGiven()`](/up.util.isGiven).

  @function up.util.isMissing
  @param object
  @return {boolean}
  @stable
  */
  function isMissing(object) {
    return isUndefined(object) || isNull(object)
  }

  /*-
  Returns whether the given argument is neither `undefined` nor `null`.

  For the opposite of `up.util.isGiven()` see [`up.util.isMissing()`](/up.util.isMissing).

  > [IMPORTANT]
  > Unpoly's concept of "given" does not correspond to JavaScript's concept of [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy).
  > Empty strings or the number zero are not truthy, but *are* considered to be "given".

  @function up.util.isGiven
  @param object
  @return {boolean}
  @stable
  */
  const isGiven = negate(isMissing)

  // isNan = (object) ->
  //   isNumber(value) && value != +value

  /*-
  Return whether the given argument is considered to be blank.

  By default, this function returns `true` for:

  - `undefined`
  - `null`
  - Empty strings
  - Empty arrays
  - A plain object without own enumerable properties

  All other arguments return `false`.

  To check implement blank-ness checks for user-defined classes,
  see `up.util.isBlank.key`.

  @function up.util.isBlank
  @param value
    The value is to check.
  @return {boolean}
    Whether the value is blank.
  @stable
  */
  function isBlank(value) {
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
  @experimental
  */
  isBlank.key = 'up.util.isBlank'

  /*-
  Returns the given argument if the argument is [present](/up.util.isPresent),
  otherwise returns `undefined`.

  @function up.util.presence
  @param value
  @param {Function(value): boolean} [tester=up.util.isPresent]
    The function that will be used to test whether the argument is present.
  @return {any|undefined}
  @stable
  */
  function presence(value, tester = isPresent) {
    if (tester(value)) {
      return value
    }
  }

  /*-
  Returns whether the given argument is not [blank](/up.util.isBlank).

  @function up.util.isPresent
  @param object
  @return {boolean}
  @stable
  */
  const isPresent = negate(isBlank)

  /*-
  Returns whether the given argument is a function.

  @function up.util.isFunction
  @param object
  @return {boolean}
  @stable
  */
  function isFunction(object) {
    return typeof(object) === 'function'
  }

  /*-
  Returns whether the given argument is a string.

  @function up.util.isString
  @param object
  @return {boolean}
  @stable
  */
  function isString(object) {
    return (typeof(object) === 'string') || object instanceof String
  }

  /*-
  Returns whether the given argument is a boolean value.

  @function up.util.isBoolean
  @param object
  @return {boolean}
  @stable
  */
  function isBoolean(object) {
    return (typeof(object) === 'boolean') || object instanceof Boolean
  }

  /*-
  Returns whether the given argument is a number.

  Note that this will check the argument's *type*.
  It will return `false` for a string like `"123"`.

  @function up.util.isNumber
  @param object
  @return {boolean}
  @stable
  */
  function isNumber(object) {
    return (typeof(object) === 'number') || object instanceof Number
  }

  /*-
  Returns whether the given argument is an options hash,

  Differently from [`up.util.isObject()`], this returns false for
  functions, jQuery collections, promises, `FormData` instances and arrays.

  @function up.util.isOptions
  @param object
  @return {boolean}
  @internal
  */
  function isOptions(object) {
    return (typeof(object) === 'object') && !isNull(object) && (isUndefined(object.constructor) || (object.constructor === Object))
  }

  /*-
  Returns whether the given argument is an object.

  This also returns `true` for functions, which may behave like objects in JavaScript.

  @function up.util.isObject
  @param object
  @return {boolean}
  @stable
  */
  function isObject(object) {
    const typeOfResult = typeof(object)
    return ((typeOfResult === 'object') && !isNull(object)) || (typeOfResult === 'function')
  }

  /*-
  Returns whether the given argument is a [DOM element](https://developer.mozilla.org/de/docs/Web/API/Element).

  @function up.util.isElement
  @param object
  @return {boolean}
  @stable
  */
  function isElement(object) {
    return object instanceof Element
  }

  /*-
  Returns whether the given argument is a [text node](https://developer.mozilla.org/en-US/docs/Web/API/Text).

  @function up.util.isTextNode
  @param object
  @return {boolean}
  @internal
  */
  function isTextNode(object) {
    return object instanceof Text
  }

  /*-
  Returns whether the given argument is a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp).

  @function up.util.isRegExp
  @param object
  @return {boolean}
  @internal
  */
  function isRegExp(object) {
    return object instanceof RegExp
  }

  /*-
  Returns whether the given argument is an error instance.

  @function up.util.isError
  @param object
  @return {boolean}
  @internal
  */
  function isError(object) {
    return object instanceof Error
  }

  /*-
  Returns whether the given argument is a [jQuery collection](https://learn.jquery.com/using-jquery-core/jquery-object/).

  @function up.util.isJQuery
  @param object
  @return {boolean}
  @stable
  */
  function isJQuery(object) {
    return up.browser.canJQuery() && object instanceof jQuery
  }

  /*-
  @function up.util.isElementLike
  @param object
  @return {boolean}
  @internal
  */
  function isElementLike(object) {
    return !!(object && (object.addEventListener || (isJQuery(object) && object[0]?.addEventListener)))
  }

  /*-
  Returns whether the given argument is an object with a `then` method.

  @function up.util.isPromise
  @param object
  @return {boolean}
  @stable
  */
  function isPromise(object) {
    return isObject(object) && isFunction(object.then)
  }

  /*-
  Returns whether the given argument is an array.

  @function up.util.isArray
  @param object
  @return {boolean}
  @stable
  */
  // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  const { isArray } = Array

  /*-
  Returns whether the given argument is a `FormData` instance.

  Always returns `false` in browsers that don't support `FormData`.

  @function up.util.isFormData
  @param object
  @return {boolean}
  @internal
  */
  function isFormData(object) {
    return object instanceof FormData
  }

  /*-
  Converts the given [array-like value](/up.util.isList) into an array.

  If the given value is already an array, it is returned unchanged.

  @function up.util.toArray
  @param object
  @return {Array}
  @stable
  */
  function toArray(value) {
    return isArray(value) ? value : copyArrayLike(value)
  }

  /*-
  Returns whether the given argument is an array-like value.

  Return true for `Array`, a
  [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList),
   the [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments)
   or a jQuery collection.

  Use [`up.util.isArray()`](/up.util.isArray) to test whether a value is an actual `Array`.

  @function up.util.isList
  @param value
  @return {boolean}
  @stable
  */
  function isList(value) {
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
  @param value
  @return {boolean}
  @internal
  */
  function isNodeList(value) {
    return value instanceof NodeList
  }

  function isHTMLCollection(value) {
    return value instanceof HTMLCollection
  }

  /*-
  Returns whether the given value is an [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments).

  @function up.util.isArguments
  @param value
  @return {boolean}
  @internal
  */
  function isArguments(value) {
    return Object.prototype.toString.call(value) === '[object Arguments]'
  }

  function isAdjacentPosition(value) {
    return /^(before|after)/.test(value)
  }

  /*-
  Returns the given value if it is [array-like](/up.util.isList), otherwise
  returns an array with the given value as its only element.

  Returns an empty array if called with `null` or `undefined`.

  ### Example

  ```js
  up.util.wrapList([1, 2, 3]) // => [1, 2, 3]
  up.util.wrapList('foo') // => ['foo']
  up.util.wrapList(undefined) // => []
  up.util.wrapList(null) // => []
  ```

  @function up.util.wrapList
  @param {any} value
  @return {Array|NodeList|jQuery}
  @experimental
  */
  function wrapList(value) {
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

  - By default `up.util.copy()` can copy [array-like values](/up.util.isList),
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
  function copy(value)  {
    if (isObject(value) && value[copy.key]) {
      value = value[copy.key]()
    } else if (isList(value)) {
      value = copyArrayLike(value)
    } else if (isOptions(value)) {
      value = Object.assign({}, value)
    }
    return value
  }

  function copyArrayLike(arrayLike) {
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

  ```
  original = new User('foo@foo.com')

  copy = up.util.copy(original)
  console.log(copy.email) // prints 'foo@foo.com'

  original.email = 'bar@bar.com' // change the original
  console.log(copy.email) // still prints 'foo@foo.com'
  ```

  @property up.util.copy.key
  @param {string} key
  @experimental
  */
  copy.key = 'up.util.copy'

  // Implement up.util.copy protocol for Date
  Date.prototype[copy.key] = function() { return new Date(+this) }

  /*-
  Creates a new object by merging together the properties from the given objects.

  ### Example

  ```js
  let a = { a: '1', b: '2' }
  let b = { b: '3', c: '4' }
  up.util.merge(a, b) // => { a: '1', b: '3', c: '4' }
  ```

  @function up.util.merge
  @param {Array<Object>} sources...
  @return Object
  @stable
  */
  function merge(...sources) {
    return Object.assign({}, ...sources)
  }

  /*-
  @function up.util.mergeDefined
  @param {Array<Object>} sources...
  @return Object
  @internal
  */
  function mergeDefined(...sources) {
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
  function newOptions(object, defaults) {
    if (defaults) {
      return merge(defaults, object)
    } else if (object) {
      return copy(object)
    } else {
      return {}
    }
  }

  function parseArgIntoOptions(args, argKey) {
    let [positionalArg, options] = parseArgs(args, 'val', 'options')
    if (isDefined(positionalArg)) {
      options[argKey] = positionalArg
    }
    return options
  }

  /*-
  Passes each element in the given [array-like value](/up.util.isList) to the given function.
  Returns the first element for which the function returns a truthy value.

  If no object matches, returns `undefined`.

  @function up.util.find
  @param {List<T>} list
  @param {Function(value): boolean} tester
  @return {T|undefined}
  @stable
  */
  function findInList(list, tester) {
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
  for any element in the given [array-like value](/up.util.isList).

  @function up.util.some
  @param {List} list
  @param {Function(value, index): boolean} tester
    A function that will be called with each element and (optional) iteration index.

  @return {boolean}
  @stable
  */
  function some(list, tester) {
    return !!findResult(list, tester)
  }

  /*-
  Consecutively calls the given function which each element
  in the given list. Returns the first truthy return value.

  Returned `undefined` iff the function does not return a truthy
  value for any element in the list.

  @function up.util.findResult
  @param {List|Iterator} list
  @param {Function(element): any} tester
    A function that will be called with each element and (optional) iteration index.

  @return {any|undefined}
  @experimental
  */
  function findResult(list, tester) {
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
  for all elements in the given [list](/up.util.isList) or iterator.

  @function up.util.every
  @param {List|Iterator} list
  @param {Function(element, index): boolean} tester
    A function that will be called with each element and (optional) iteration index.

  @return {boolean}
  @experimental
  */
  function every(list, tester) {
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
  Returns all elements from the given [list](/up.util.isList) that are
  neither `null` or `undefined`.

  @function up.util.compact
  @param {List<T>} list
  @return {Array<T>}
  @stable
  */
  function compact(array) {
    return filterList(array, isGiven)
  }

  function compactObject(object) {
    return pickBy(object, isGiven)
  }

  /*-
  Returns the given array without duplicates.

  @function up.util.uniq
  @param {Array<T>} array
  @return {Array<T>}
  @stable
  */
  function uniq(array) {
    if (array.length < 2) { return array }
    return Array.from(new Set(array))
  }

  /*-
  This function is like [`uniq`](/up.util.uniq), accept that
  the given function is invoked for each element to generate the value
  for which uniquness is computed.

  @function up.util.uniqBy
  @param {Array} array
  @param {Function(value): any} array
  @return {Array}
  @experimental
  */
  function uniqBy(array, mapper) {
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
  Returns all elements from the given [list](/up.util.isList) that return
  a truthy value when passed to the given function.

  @function up.util.filter
  @param {List|Iterator} list
  @param {Function(value, index): boolean} tester
  @return {Array}
  @stable
  */
  function filterList(list, tester) {
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
  Returns all elements from the given [array-like value](/up.util.isList) that do not return
  a truthy value when passed to the given function.

  @function up.util.reject
  @param {List} list
  @param {Function(element, index): boolean} tester
  @return {Array}
  @stable
  */
  function reject(list, tester) {
    tester = negate(iteratee(tester))
    return filterList(list, tester)
  }

  /*-
  Returns the intersection of the given two arrays.

  Implementation is not optimized. Don't use it for large arrays.

  @function up.util.intersect
  @internal
  */
  function intersect(array1, array2) {
    return filterList(array1, element => contains(array2, element))
  }

  /*-
  Waits for the given number of milliseconds, then runs the given callback.

  This function works like the built-in [`setTimeout()`](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout), except that the argument order is flipped for
  ergonomic reasons.

  Instead of `up.util.timer(0, fn)` you can also use [`up.util.task(fn)`](/up.util.task).

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
  function scheduleTimer(millis, callback) {
    return setTimeout(callback, millis)
  }

  /*-
  Pushes the given function to the [JavaScript task queue](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) (also "macrotask queue").

  Equivalent to calling `setTimeout(fn, 0)`.

  @function up.util.task
  @param {Function()} block
  @stable
  */
  function queueTask(task) {
    return setTimeout(task)
  }

  /*-
  Returns the last element of the given array or string.

  @function up.util.last
  @param {Array<T>|string} array
  @return {T|string}
  @stable
  */
  function last(value) {
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
  function contains(value, subValue) {
    let indexOf = value.indexOf || Array.prototype.indexOf
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
  function containsAll(values, subValues) {
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
  function objectContains(object, subObject) {
    const reducedValue = pick(object, Object.keys(subObject))
    return isEqual(subObject, reducedValue)
  }

  /*-
  Returns a copy of the given object that only contains
  the given keys.

  @function up.util.pick
  @param {Object} object
  @param {Array} keys
  @return {Object}
  @stable
  */
  function pick(object, keys) {
    const filtered = {}
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
  @param {Function(string, string, object): boolean} tester
    A function that will be called with each property.

    The arguments are the property value, key and the entire object.
  @return {Object}
  @experimental
  */
  function pickBy(object, tester) {
    tester = iteratee(tester)
    const filtered = {}
    for (let key in object) {
      const value = object[key]
      if (tester(value, key, object)) {
        filtered[key] = object[key]
      }
    }
    return filtered
  }

  /*-
  Returns a copy of the given object that contains all except
  the given keys.

  @function up.util.omit
  @param {Object} object
  @param {Array} keys
  @stable
  */
  function omit(object, keys) {
    return pickBy(object, (_value, key) => !contains(keys, key))
  }

  /*-
  Returns a promise that will never be resolved.

  @function up.util.unresolvablePromise
  @internal
  */
  function unresolvablePromise() {
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
  function remove(array, element) {
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
  up.util.evalOption(fn) // => 3
  ```

  @function up.util.evalOption
  @param {any} value
  @param {Array} ...args
  @return {any}
  @experimental
  */
  function evalOption(value, ...args) {
    return isFunction(value) ? value(...args) : value
  }

  function evalAutoOption(value, autoMeans, ...args) {
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
  function escapeHTML(string) {
    return string.replace(/[&<>"']/g, char => ESCAPE_HTML_ENTITY_MAP[char])
  }

  /*-
  @function up.util.escapeRegExp
  @internal
  */
  function escapeRegExp(string) {
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
  @param {string} key
  @return {any}
  @experimental
  */
  function pluckKey(object, key) {
    const value = object[key]
    delete object[key]
    return value
  }

  function renameKey(object, oldKey, newKey) {
    return object[newKey] = pluckKey(object, oldKey)
  }

  function extractLastArg(args, tester) {
    if (tester(last(args))) {
      return args.pop()
    }
  }

//  extractFirstArg = (args, tester) ->
//    firstArg = args[0]
//    if tester(firstArg)
//      return args.shift()

  function extractCallback(args) {
    return extractLastArg(args, isFunction)
  }

  function extractOptions(args) {
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

  function identity(arg) {
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
  @internal
  */
  function sequence(functions) {
    functions = compact(functions)
    return (...args) => map(functions, fn => fn(...args))
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

  ### Example

  ```js
  let nested = [1, [2, 3], [4]]
  up.util.flatten(nested) // => [1, 2, 3, 4]

  @function up.util.flatten
  @param {Array} array
    An array which might contain other arrays
  @return {Array}
    The flattened array
  @experimental
  */
  function flatten(array) {
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
  then [flattens](/up.util.flatten) the result into a new array.

  @function up.util.flatMap
  @param {List|Iterator} list
  @param {Function(element)} mapping
  @return {Array}
  @experimental
  */
  function flatMap(array, block) {
    return flatten(map(array, block))
  }

  /*-
  Sets the given callback as both fulfillment and rejection handler for the given promise.

  [Unlike `promise#finally()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally#Description), `up.util.always()` may change the settlement value
  of the given promise.

  ### Example: Callback style

  ```js
  let process = (value) => console.log(value)
  up.always(promise, process)
  ```

  ### Example with `await`

  ```js
  let value = await up.always(promise)
  console.log(value)
  ```

  @function up.util.always
  @internal
  */
  function always(promise, callback = identity) {
    return promise.then(callback, callback)
  }

  /*-
  @function up.util.newDeferred
  @internal
  */
  function newDeferred() {
    let resolveFn
    let rejectFn
    const nativePromise = new Promise(function(givenResolve, givenReject) {
      resolveFn = givenResolve
      rejectFn = givenReject
    })
    nativePromise.resolve = resolveFn
    nativePromise.reject = rejectFn
    return nativePromise
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

  function isBasicObjectProperty(k) {
    return Object.prototype.hasOwnProperty(k) // eslint-disable-line no-prototype-builtins
  }

  /*-
  Returns whether the two arguments are equal by value.

  ### Comparison protocol

  - By default `up.util.isEqual()` can compare strings, numbers,
    [array-like values](/up.util.isList), plain objects and `Date` objects.
  - To make the copying protocol work with user-defined classes,
    see `up.util.isEqual.key`.
  - Objects without a defined comparison protocol are
    defined by reference (`===`).

  @function up.util.isEqual
  @param {any} a
  @param {any} b
  @return {boolean}
    Whether the arguments are equal by value.
  @experimental
  */
  function isEqual(a, b) {
    if (a?.valueOf) { a = a.valueOf() } // Date, String objects, Number objects
    if (b?.valueOf) { b = b.valueOf() } // Date, String objects, Number objects
    if (typeof(a) !== typeof(b)) {
      return false
    } else if (isList(a) && isList(b)) {
      return isEqualList(a, b)
    } else if (isObject(a) && a[isEqual.key]) {
      return a[isEqual.key](b)
    } else if (isOptions(a) && isOptions(b)) {
      const aKeys = Object.keys(a)
      const bKeys = Object.keys(b)
      if (isEqualList(aKeys, bKeys)) {
        return every(aKeys, aKey => isEqual(a[aKey], b[aKey]))
      } else {
        return false
      }
    } else {
      return a === b
    }
  }

  /*-
  This property contains the name of a method that user-defined classes
  may implement to hook into the `up.util.isEqual()` protocol.

  ### Example

  We have a user-defined `Account` class that we want to use with `up.util.isEqual()`:

  ```
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
  let one = new User('foo@foo.com')
  let two = new User('foo@foo.com')
  let three = new User('bar@bar.com')

  up.util.isEqual(one, two)   // returns true
  up.util.isEqual(one, three) // returns false
  ```

  @property up.util.isEqual.key
  @param {string} key
  @experimental
  */
  isEqual.key = 'up.util.isEqual'

  function isEqualList(a, b) {
    return (a.length === b.length) && every(a, (elem, index) => isEqual(elem, b[index]))
  }

  // TODO: Remove
  const PARSE_TOKEN_PATTERNS = {
    'space/or': /\s+(?:or\s+)?/,
    'or': /\s+or\s+/,
    'comma': /\s*,\s*/
  }

  // TODO: Remove
  function parseTokens(value, { separator = 'space/or', json = false, complex = false } = {}) {
    let separatorPattern = PARSE_TOKEN_PATTERNS[separator]

    if (!isString(value)) {
      return wrapList(value)
    } else if (json && /^\[.*]$/.test(value)) {
      return parseRelaxedJSON(value)
    } else if (complex) {
      let { masked, restore } = expressionOutline(value)
      return masked.split(separatorPattern).map((s) => restore(s))
    } else {
      return value.split(separatorPattern)
    }
  }

  function getSimpleTokens(value, { json = false } = {}) {
    if (!isString(value)) {
      return wrapList(value)
    } else if (json && /^\[.*]$/.test(value)) {
      return parseRelaxedJSON(value)
    } else {
      return splitSimpleTokenString(value, /[,\s]/)
    }
  }

  function splitSimpleTokenString(value, separator) {
    let parts = up.migrate.splitAtOr?.(value) || value.split(separator)
    return parts.map((s) => s.trim()).filter(identity)
  }

  function getComplexTokens(value) {
    if (!isString(value)) {
      return wrapList(value)
    } else {
      let { maskedTokens, restore } = complexTokenOutlines(value)
      return maskedTokens.map((token) => restore(token))
    }
  }

  function complexTokenOutlines(string) {
    let { masked, restore } = expressionOutline(string)
    let maskedTokens = splitSimpleTokenString(masked, ',')
    return { maskedTokens, restore }
  }

  function wrapValue(constructor, ...args) {
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

  function uid() {
    return nextUid++
  }

  /*-
  Returns a copy of the given list, in reversed order.

  @function up.util.reverse
  @param {List<T>} list
  @return {Array<T>}
  @internal
  */
  function reverse(list) {
    return copy(list).reverse()
  }

  function renameKeys(object, renameKeyFn) {
    const renamed = {}
    for (let key in object) {
      renamed[renameKeyFn(key)] = object[key]
    }
    return renamed
  }

  function camelToKebabCase(str) {
    return str.replace(/[A-Z]/g, char => '-' + char.toLowerCase())
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

  function lowerCaseFirst(str) {
    return str[0].toLowerCase() + str.slice(1)
  }

  function upperCaseFirst(str) {
    return str[0].toUpperCase() + str.slice(1)
  }

  function defineDelegates(object, props, targetProvider) {
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

  function delegatePromise(object, promiseProp) {
    return defineDelegates(
      object,
      ['then', 'catch', 'finally'],
      function() { return this[promiseProp] }
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

  function stringifyArg(arg, placeholder = '%o') {
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

    if (isString(arg)) {
      string = arg.trim().replace(/[\n\r\t ]+/g, ' ')

      // In the browser console %o displays a string with quotes
      if (placeholder === '%o') {
        string = JSON.stringify(string)
      }
    } else if (isUndefined(arg)) {
      // JSON.stringify(undefined) is actually undefined
      string = 'undefined'
    } else if (isNumber(arg) || isFunction(arg)) {
      string = arg.toString()
    } else if (isArray(arg)) {
      string = `[${map(arg, stringifyArg).join(', ')}]`
    } else if (isJQuery(arg)) {
      string = `$(${map(arg, stringifyArg).join(', ')})`
    } else if (isElement(arg)) {
      string = `<${arg.tagName.toLowerCase()}`
      for (let attr of ['id', 'up-id', 'name', 'class']) {
        let value = arg.getAttribute(attr)
        if (value) {
          string += ` ${attr}="${value}"`
        }
      }
      string += ">"
    } else if (isRegExp(arg) || isError(arg)) {
      string = arg.toString()
    } else { // object, null
      try {
        string = JSON.stringify(arg)
      } catch (error) {
        if (error.name === 'TypeError') {
          string = '(circular structure)'
        } else {
          throw error
        }
      }
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
  function sprintf(message, ...args) {
    return message.replace(SPRINTF_PLACEHOLDERS, (placeholder) => stringifyArg(args.shift(), placeholder))
  }

  function negate(fn) {
    return function(...args) {
      return !fn(...args)
    }
  }

  function useMemoizeCacheEntry(cacheEntry) {
    if (cacheEntry.error) {
      throw cacheEntry.error
    } else {
      return cacheEntry.value
    }
  }

  function buildMemoizeCacheEntry(oldImpl, self, args) {
    try {
      return { value: oldImpl.apply(self, args) }
    } catch (e) {
      return { error: e }
    }
  }

  // function memoizeMethodOrGetter(object, propLiteral) {
  //   // We're accepting the property names as the keys of an object. We don't care about the values.
  //   // We do this so that object's keys go through the same property mangling as the rest of the code.
  //   for (let prop in propLiteral) {
  //     let originalDescriptor = Object.getOwnPropertyDescriptor(object, prop)
  //
  //     let oldImpl = originalDescriptor.get || originalDescriptor.value
  //
  //     let cachingImpl = function(...args) {
  //       let cache = this[`__${prop}MemoizeCache`] ||= {}
  //       let cacheKey = JSON.stringify(args)
  //       cache[cacheKey] ||= buildMemoizeCacheEntry(oldImpl, this, args)
  //       return useMemoizeCacheEntry(cache[cacheKey])
  //     }
  //
  //     if (originalDescriptor.get) {
  //       Object.defineProperty(object, prop, {
  //         get: cachingImpl
  //       })
  //     } else {
  //       object[prop] = cachingImpl
  //     }
  //
  //   }
  // }

  function memoizeMethod(object, propLiteral) {
    // We're accepting the property names as the keys of an object. We don't care about the values.
    // We do this so that object's keys go through the same property mangling as the rest of the code.
    for (let prop in propLiteral) {
      let originalDescriptor = Object.getOwnPropertyDescriptor(object, prop)

      let oldImpl = originalDescriptor.value

      let cachingImpl = function(...args) {
        let cache = this[`__${prop}MemoizeCache`] ||= {}
        let cacheKey = JSON.stringify(args)
        cache[cacheKey] ||= buildMemoizeCacheEntry(oldImpl, this, args)
        return useMemoizeCacheEntry(cache[cacheKey])
      }

      object[prop] = cachingImpl
    }
  }

  function safeStringifyJSON(value) {
    let json = JSON.stringify(value)
    return escapeHighASCII(json)
  }

  function escapeHighASCII(string) {
    let unicodeEscape = (char) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, '0')
    return string.replace(/[^\x00-\x7F]/g, unicodeEscape)
  }

  function variant(source, changes = {}) {
    let variant = Object.create(source)
    Object.assign(variant, changes)
    return variant
  }

  function parseArgs(args, ...specs) {
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

  function scanFunctions(...values) {
    return values.flat().filter(isFunction)
  }

  function cleaner() {
    let fns = []

    let track = function(values, transform) {
      values = scanFunctions(...values).map(transform)
      fns.push(...scanFunctions(...values))
    }

    let api = function(...values) {
      track(values, identity)
    }

    api.guard = function(...values) {
      track(values, up.error.guardFn)
    }

    api.clean = function(...args) {
      // (1) Run clean-up actions in the reverse order that they were scheduled in
      // (2) Don't allow clean-up actions to schedule more clean-up actions, to
      //     prevent infinite loops. E.g. a user misunderstanding Preview#show() calls
      //     Preview#hide() in an undo action.
      let { length } = fns
      for (let i = length - 1; i >= 0; i--) fns[i](...args)
      fns = []
    }

    return api
  }

  function maskPattern(str, patterns, { keepDelimiters = false } = {}) {
    let maskCount = 0
    let maskPattern = /§(\d+)/g
    let matches = []
    let replaceLayers = 0

    let replace = (replacePattern) => {
      let didReplace = false

      str = str.replaceAll(replacePattern, function(match) {
        didReplace = true
        let glyph = '§' + (maskCount++)

        let mask
        let masked

        if (keepDelimiters) {
          let startDelimiter = match[0]
          let endDelimiter = match.slice(-1)
          masked = match.slice(1, -1)
          mask = startDelimiter + glyph + endDelimiter
        } else {
          masked = match
          mask = glyph
        }

        matches.push(masked)
        return mask
      })

      if (didReplace) replaceLayers++
    }

    [maskPattern, ...patterns].forEach(replace)

    let restore = (s, transform = identity) => {
      for (let i = 0; i < replaceLayers; i++) {
        s = s.replace(maskPattern, (match, placeholderIndex) => transform(matches[placeholderIndex]))
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
  const NESTED_GROUP_PATTERN = /{(?:[^{}]|{[^{}]*})*}|\((?:[^\(\)]|\([^\(\)]*\))*\)|\[(?:[^\[\]]|\[[^\[\]]*\])*\]/g

  function expressionOutline(str) {
    return maskPattern(str, [QUOTED_STRING_PATTERN, NESTED_GROUP_PATTERN], { keepDelimiters: true })
  }

  // ("foo") => ("foo")
  // ('foo') => ("foo")
  // ('foo"bar\'baz"') => ("foo\"bar'baz")
  function ensureDoubleQuotes(str) {
    // If we already have double-quoted string, there's nothing to do.
    if (str[0] === '"') return str

    str = str.slice(1, -1)

    let transformed = str.replace(/(\\\\)|(\\')|(\\")|(")/g, function(_match, escapedBackslash, escapedSingleQuote, _doubleQuote) {
      return escapedBackslash           // keep (\\)
        || (escapedSingleQuote && "'")  // convert (\') to just (')
        || '\\"'                        // convert (") to (\")
    })
    return '"' + transformed + '"'
  }

  function parseString(value) {
    return JSON.parse(ensureDoubleQuotes(value))
  }

  function parseRelaxedJSON(str) {
    let { masked, restore } = maskPattern(str, [QUOTED_STRING_PATTERN])
    masked = masked.replace(/([a-z_$][\w$]*:)/gi, (unquotedProperty) => ('"' + unquotedProperty.slice(0, -1) + '":'))
    masked = restore(masked, ensureDoubleQuotes)
    return JSON.parse(masked)
  }

  function parseScalarJSONPairs(str) {
    // TODO: Use complexTokenOutlines
    let { masked, restore } = expressionOutline(str)
    let results = masked.matchAll(/([^{,]+)({[^}]*})?/g)

    // results is an iterator, not an array. We can only loop over it once.
    return map(results, ([_match, string, json]) => [
      restore(string.trim()),
      json && parseRelaxedJSON(restore(json))
    ])
  }

  return {
    parseURL,
    normalizeURL,
    matchableURL,
    matchableURLPatternAtom,
    matchURLs,
    normalizeMethod,
    methodAllowsPayload,
    copy,
    merge,
    mergeDefined,
    options: newOptions,
    parseArgIntoOptions,
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
    intersect,
    compact,
    compactObject,
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
    isTextNode,
    isJQuery,
    isElementLike,
    isPromise,
    isOptions,
    isArray,
    isFormData,
    // isNodeList,
    // isArguments,
    isList,
    isRegExp,
    isAdjacentPosition,
    timer: scheduleTimer,
    contains,
    containsAll,
    objectContains,
    toArray,
    pick,
    pickBy,
    omit,
    unresolvablePromise,
    remove,
    memoize,
    pluckKey,
    renameKey,
    extractOptions,
    extractCallback,
    noop,
    asyncNoop,
    identity,
    escapeHTML,
    escapeRegExp,
    sequence,
    evalOption,
    evalAutoOption,
    flatten,
    newDeferred,
    always,
    isBasicObjectProperty,
    isCrossOrigin,
    task: queueTask,
    isEqual,
    parseTokens,
    getSimpleTokens,
    getComplexTokens,
    complexTokenOutlines,
    wrapList,
    wrapValue,
    uid,
    upperCaseFirst,
    lowerCaseFirst,
    delegate: defineDelegates,
    delegatePromise,
    // temporaryDelegate: defineTemporaryDelegates,
    reverse,
    // prefixCamelCase,
    // unprefixCamelCase,
    camelToKebabCase,
    sprintf,
    renameKeys,
    memoizeMethod,
    safeStringifyJSON,
    // groupBy,
    variant,
    cleaner,
    scanFunctions,
    args: parseArgs,
    parseRelaxedJSON,
    parseScalarJSONPairs,
    maskPattern,
    expressionOutline,
    parseString,
    // partialRight,
  }
})()
