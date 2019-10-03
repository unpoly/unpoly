/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
__webpack_require__(2);
__webpack_require__(3);
__webpack_require__(4);
__webpack_require__(5);
__webpack_require__(6);
__webpack_require__(7);
__webpack_require__(8);
__webpack_require__(9);
__webpack_require__(10);
__webpack_require__(11);
__webpack_require__(12);
__webpack_require__(13);
__webpack_require__(14);
__webpack_require__(15);
__webpack_require__(16);
__webpack_require__(17);
__webpack_require__(18);
__webpack_require__(19);
__webpack_require__(20);
__webpack_require__(21);
__webpack_require__(22);
__webpack_require__(23);
__webpack_require__(24);
__webpack_require__(25);
__webpack_require__(26);
__webpack_require__(27);
__webpack_require__(28);
__webpack_require__(29);
__webpack_require__(30);
__webpack_require__(31);
__webpack_require__(32);
__webpack_require__(33);
__webpack_require__(34);
__webpack_require__(35);
__webpack_require__(36);
__webpack_require__(37);
__webpack_require__(38);
__webpack_require__(39);
__webpack_require__(40);
__webpack_require__(41);
__webpack_require__(42);
__webpack_require__(43);
__webpack_require__(44);
__webpack_require__(45);
__webpack_require__(46);
__webpack_require__(47);
__webpack_require__(48);
__webpack_require__(49);
__webpack_require__(50);
__webpack_require__(51);
up.framework.boot();


/***/ }),
/* 1 */
/***/ (function(module, exports) {

/***
@module up
*/
window.up = {
    version: '0.61.0'
};


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/***
Utility functions
=================

The `up.util` module contains functions to facilitate the work with basic JavaScript
values like lists, strings or functions.

You will recognize many functions form other utility libraries like [Lodash](https://lodash.com/).
While feature parity with Lodash is not a goal of `up.util`, you might find it sufficient
to not include another library in your asset bundle.

@module up.util
*/
var hasProp = {}.hasOwnProperty;
up.util = (function () {
    /***
    Sets the given callback as both fulfillment and rejection handler for the given promise.
  
    @function up.util.always
    @internal
    */
    /***
    @function up.util.arrayToSet
    @internal
    */
    /***
    Merge the own properties of one or more `sources` into the `target` object.
  
    @function up.util.assign
    @param {Object} target
    @param {Array<Object>} sources...
    @stable
    */
    /***
    A function that returns a resolved promise.
  
    @function up.util.asyncNoop
    @internal
    */
    /***
    Returns all elements from the given array that are
    neither `null` or `undefined`.
  
    @function up.util.compact
    @param {Array<T>} array
    @return {Array<T>}
    @stable
    */
    /***
    Returns whether the given array or string contains the given element or substring.
  
    @function up.util.contains
    @param {Array|string} arrayOrString
    @param elementOrSubstring
    @stable
    */
    /***
    Returns a shallow copy of the given value.
  
    \#\#\# Copying protocol
  
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
    /***
    Returns a deep copy of the given array or object.
  
    @function up.util.deepCopy
    @param {Object|Array} object
    @return {Object|Array}
    @internal
    */
    /***
    Calls the given function for each element (and, optional, index)
    of the given array.
  
    @function up.util.each
    @param {Array} array
    @param {Function(element, index)} block
    A function that will be called with each element and (optional) iteration index.
    @stable
    */
    /***
    Escapes the given string of HTML by replacing control chars with their HTML entities.
  
    @function up.util.escapeHtml
    @param {string} string
    The text that should be escaped
    @stable
    */
    /***
    Returns whether the given keyboard event involved the ESC key.
  
    @function up.util.escapePressed
    @internal
    */
    /***
    @function up.util.escapeRegexp
    @internal
    */
    /***
    If the given `value` is a function, calls the function with the given `args`.
    Otherwise it just returns `value`.
  
    @function up.util.evalOption
    @internal
    */
    /***
    Returns whether the given function returns a truthy value
    for all elements in the given [array-like value](/up.util.isList).
  
    @function up.util.every
    @param {List} list
    @param {Function(element, index): boolean} tester
    A function that will be called with each element and (optional) iteration index.
  
    @return {boolean}
    @experimental
    */
    /***
    Returns a copy of the given object that contains all except
    the given properties.
  
    @function up.util.except
    @param {Object} object
    @param {Array} keys...
    @stable
    */
    /***
    Throws a [JavaScript error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
    with the given message.
  
    The message will also be printed to the [error log](/up.log.error). Also a notification will be shown at the bottom of the screen.
  
    The message may contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions).
  
    \#\#\# Examples
  
    up.fail('Division by zero')
    up.fail('Unexpected result %o', result)
  
    @function up.fail
    @param {string} message
      A message with details about the error.
  
      The message can contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions)
      like `%s` or `%o`.
    @param {Array<string>} vars...
      A list of variables to replace any substitution marks in the error message.
    @experimental
    */
    /***
    Returns all elements from the given [array-like value](/up.util.isList) that return
    a truthy value when passed to the given function.
  
    @function up.util.filter
    @param {List} list
    @param {Function(value, index): boolean} tester
    @return {Array}
    @stable
    */
    /***
    Passes each element in the given [array-like value](/up.util.isList) to the given function.
    Returns the first element for which the function returns a truthy value.
  
    If no object matches, returns `undefined`.
  
    @function up.util.find
    @param {List<T>} list
    @param {Function(value): boolean} tester
    @return {T|undefined}
    @stable
    */
    /***
    Consecutively calls the given function which each element
    in the given array. Returns the first truthy return value.
  
    Returned `undefined` iff the function does not return a truthy
    value for any element in the array.
  
    @function up.util.findResult
    @param {Array} array
    @param {Function(element): any} tester
    A function that will be called with each element and (optional) iteration index.
  
    @return {any|undefined}
    @experimental
    */
    /***
    Maps each element using a mapping function,
    then flattens the result into a new array.
  
    @function up.util.flatMap
    @param {Array} array
    @param {Function(element)} mapping
    @return {Array}
    @experimental
    */
    /***
    Flattens the given `array` a single level deep.
  
    @function up.util.flatten
    @param {Array} array
      An array which might contain other arrays
    @return {Array}
      The flattened array
    @experimental
    */
    /***
    Returns the intersection of the given two arrays.
  
    Implementation is not optimized. Don't use it for large arrays.
  
    @function up.util.intersect
    @internal
    */
    /***
    Returns whether the given argument is a boolean value.
  
    @function up.util.isBoolean
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is not `undefined`.
  
    @function up.util.isDefined
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is a [DOM element](https://developer.mozilla.org/de/docs/Web/API/Element).
  
    @function up.util.isElement
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the two arguments are equal by value.
  
    \#\#\# Comparison protocol
  
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
    /***
    Returns whether the given argument is a `FormData` instance.
  
    Always returns `false` in browsers that don't support `FormData`.
  
    @function up.util.isFormData
    @param object
    @return {boolean}
    @internal
    */
    /***
    Returns whether the given argument is a function.
  
    @function up.util.isFunction
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is neither `undefined` nor `null`.
  
    Note that empty strings or zero *are* considered to be "given".
  
    For the opposite of `up.util.isGiven()` see [`up.util.isMissing()`](/up.util.isMissing).
  
    @function up.util.isGiven
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is a [jQuery collection](https://learn.jquery.com/using-jquery-core/jquery-object/).
  
    @function up.util.isJQuery
    @param object
    @return {boolean}
    @stable
    */
    /****
    Returns whether the given argument is an array-like value.
  
    Return true for `Array`, a
    [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList),
     the [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments)
     or a jQuery collection.
  
    Use [`up.util.isArray()`](/up.util.isArray) to test whether a value is an actual `Array`.
  
    @function up.util.isList
    @param value
    @return {Boolean}
    @experimental
    */
    /***
    Returns whether the given argument is either `undefined` or `null`.
  
    Note that empty strings or zero are *not* considered to be "missing".
  
    For the opposite of `up.util.isMissing()` see [`up.util.isGiven()`](/up.util.isGiven).
  
    @function up.util.isMissing
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given value is a [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList).
  
    `NodeLists` are array-like objects returned by [`document.querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).
  
    @function up.util.isNodeList
    @param value
    @return {Boolean}
    @internal
    */
    /***
    Returns whether the given argument is `null`.
  
    @function up.util.isNull
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is a number.
  
    Note that this will check the argument's *type*.
    It will return `false` for a string like `"123"`.
  
    @function up.util.isNumber
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is an object.
  
    This also returns `true` for functions, which may behave like objects in JavaScript.
  
    @function up.util.isObject
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is an options hash,
  
    Differently from [`up.util.isObject()`], this returns false for
    functions, jQuery collections, promises, `FormData` instances and arrays.
  
    @function up.util.isOptions
    @param object
    @return {boolean}
    @internal
    */
    /***
    Returns whether the given argument is not [blank](/up.util.isBlank).
  
    @function up.util.isPresent
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given argument is an object with a `then` method.
  
    @function up.util.isPromise
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns if the given port is the default port for the given protocol.
  
    @function up.util.isStandardPort
    @internal
    */
    /***
    Returns whether the given argument is a string.
  
    @function up.util.isString
    @param object
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given value is truthy.
  
    @function up.util.isTruthy
    @internal
    */
    /***
    Returns whether the given argument is `undefined`.
  
    @function up.util.isUndefined
    @param object
    @return {boolean}
    @stable
    */
    /***
    @function up.util.isUnmodifiedMouseEvent
    @internal
    */
    /***
    Returns the last element of the given array.
  
    @function up.util.last
    @param {Array<T>} array
    @return {T}
    */
    /***
    Translate all items in an array to new array of items.
  
    @function up.util.map
    @param {Array} array
    @param {Function(element, index): any|String} block
      A function that will be called with each element and (optional) iteration index.
  
      You can also pass a property name as a String,
      which will be collected from each item in the array.
    @return {Array}
      A new array containing the result of each function call.
    @stable
    */
    /***
    @function up.util.mapObject
    @internal
    */
    /***
    Ensures that the given function can only be called a single time.
    Subsequent calls will return the return value of the first call.
  
    Note that this is a simple implementation that
    doesn't distinguish between argument lists.
  
    @function up.util.memoize
    @internal
    */
    /***
    Creates a new object by merging together the properties from the given objects.
  
    @function up.util.merge
    @param {Array<Object>} sources...
    @return Object
    @stable
    */
    /***
    @function up.util.methodAllowsPayload
    @internal
    */
    /***
     * Registers an empty rejection handler with the given promise.
     * This prevents browsers from printing "Uncaught (in promise)" to the error
     * console when the promise is rejection.
     *
     * This is helpful for event handlers where it is clear that no rejection
     * handler will be registered:
     *
     *     up.on('submit', 'form[up-target]', (event, $form) => {
     *       promise = up.submit($form)
     *       up.util.muteRejection(promise)
     *     })
     *
     * Does nothing if passed a missing value.
     *
     * @function up.util.muteRejection
     * @param {Promise|undefined|null} promise
     * @return {Promise}
     */
    /***
    @function up.util.newDeferred
    @internal
    */
    /***
    @function up.util.newDeferred
    @internal
    */
    /***
    A function that does nothing.
  
    @function up.util.noop
    @experimental
    */
    /***
    @function up.util.normalizeMethod
    @internal
    */
    /***
    Normalizes relative paths and absolute paths to a full URL
    that can be checked for equality with other normalized URLs.
  
    By default hashes are ignored, search queries are included.
  
    @function up.util.normalizeUrl
    @param {boolean} [options.hash=false]
    Whether to include an `#hash` anchor in the normalized URL
    @param {boolean} [options.search=true]
    Whether to include a `?query` string in the normalized URL
    @param {boolean} [options.stripTrailingSlash=false]
    Whether to strip a trailing slash from the pathname
    @internal
    */
    /***
    Returns an array of values of the given object.
  
    @function up.util.values
    @param {Object} object
    @return {Array<string>}
    @stable
    */
    /***
    Returns a copy of the given object that only contains
    the given properties.
  
    @function up.util.only
    @param {Object} object
    @param {Array} keys...
    @stable
    */
    /***
    Parses the given URL into components such as hostname and path.
  
    If the given URL is not fully qualified, it is assumed to be relative
    to the current page.
  
    @function up.util.parseUrl
    @return {Object}
    The parsed URL as an object with
    `protocol`, `hostname`, `port`, `pathname`, `search` and `hash`
    properties.
    @stable
    */
    /***
    Returns the given argument if the argument is [present](/up.util.isPresent),
    otherwise returns `undefined`.
  
    @function up.util.presence
    @param value
    @param {Function(value): boolean} [tester=up.util.isPresent]
      The function that will be used to test whether the argument is present.
    @return {any|undefined}
    @stable
    */
    /***
    Pushes the given function to the [JavaScript microtask queue](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/).
  
    @function up.util.microtask
    @param {Function()} task
    @return {Promise}
    @experimental
    */
    /***
    Pushes the given function to the [JavaScript task queue](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) (also "macrotask queue").
  
    Equivalent to calling `setTimeout(fn, 0)`.
  
    Also see `up.util.microtask()`.
  
    @function up.util.task
    @param {Function()} block
    @stable
    */
    /***
    Returns all elements from the given [array-like value](/up.util.isList) that do not return
    a truthy value when passed to the given function.
  
    @function up.util.reject
    @param {List} list
    @param {Function(element, index): boolean} tester
    @return {Array}
    @stable
    */
    /***
    Calls the given block. If the block throws an exception,
    a rejected promise is returned instead.
  
    @function up.util.rejectOnError
    @internal
    */
    /***
    Removes the given element from the given array.
  
    This changes the given array.
  
    @function up.util.remove
    @param {Array<T>} array
    @param {T} element
    @stable
    */
    /***
    Waits for the given number of milliseconds, the runs the given callback.
  
    Instead of `up.util.timer(0, fn)` you can also use [`up.util.task(fn)`](/up.util.task).
  
    @function up.util.timer
    @param {number} millis
    @param {Function()} callback
    @stable
    */
    /***
    @function up.util.sequence
    @param {Array<Function()>} functions
    @return {Function()}
    A function that will call all `functions` if called.
  
    @internal
    */
    /***
    @function up.util.setToArray
    @internal
    */
    /***
    Returns whether the given function returns a truthy value
    for any element in the given [array-like value](/up.util.isList).
  
    @function up.util.some
    @param {List} list
    @param {Function(value, index): boolean} tester
    A function that will be called with each element and (optional) iteration index.
  
    @return {boolean}
    @stable
    */
    /***
    Calls the given function for the given number of times.
  
    @function up.util.times
    @param {number} count
    @param {Function()} block
    @stable
    */
    /***
    Converts the given [array-like value](/up.util.isList) into an array.
  
    If the given value is already an array, it is returned unchanged.
  
    @function up.util.toArray
    @param object
    @return {Array}
    @stable
    */
    /***
    Returns the given array without duplicates.
  
    @function up.util.uniq
    @param {Array<T>} array
    @return {Array<T>}
    @stable
    */
    /***
    This function is like [`uniq`](/up.util.uniq), accept that
    the given function is invoked for each element to generate the value
    for which uniquness is computed.
  
    @function up.util.uniqBy
    @param {Array} array
    @param {Function(value): any} array
    @return {Array}
    @experimental
    */
    /***
    Returns a promise that will never be resolved.
  
    @function up.util.unresolvablePromise
    @internal
    */
    /***
    @function up.util.wrapList
    @return {Array|NodeList|jQuery}
    @internal
    */
    var ESCAPE_HTML_ENTITY_MAP, always, arrayToSet, assign, assignPolyfill, asyncNoop, compact, contains, copy, deepCopy, each, eachIterator, endsWith, escapeHtml, escapePressed, escapeRegexp, evalOption, every, except, extractCallback, extractLastArg, extractOptions, fail, filterList, findInList, findResult, flatMap, flatten, horizontalScreenHalf, identity, intersect, isArguments, isArray, isBasicObjectProperty, isBlank, isBoolean, isCrossDomain, isDefined, isElement, isEqual, isEqualList, isFormData, isFunction, isGiven, isHTMLCollection, isJQuery, isList, isMissing, isNodeList, isNull, isNumber, isObject, isOptions, isPresent, isPromise, isStandardPort, isString, isTruthy, isUndefined, isUnmodifiedKeyEvent, isUnmodifiedMouseEvent, iteratee, last, map, mapObject, memoize, merge, methodAllowsPayload, muteRejection, newDeferred, newOptions, nextUid, noop, normalizeMethod, normalizeUrl, objectValues, only, parseUrl, partial, pluckKey, presence, previewable, queueMicrotask, queueTask, reject, rejectOnError, remove, renameKey, scheduleTimer, sequence, setToArray, simpleEase, some, splitValues, sum, times, toArray, uid, uniq, uniqBy, unresolvablePromise, valuesPolyfill, wrapList, wrapValue;
    noop = (function () { });
    asyncNoop = function () {
        return Promise.resolve();
    };
    memoize = function (func) {
        var cached, cachedValue;
        cachedValue = void 0;
        cached = false;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (cached) {
                return cachedValue;
            }
            else {
                cached = true;
                return cachedValue = func.apply(void 0, args);
            }
        };
    };
    isStandardPort = function (protocol, port) {
        port = port.toString();
        return ((port === "" || port === "80") && protocol === 'http:') || (port === "443" && protocol === 'https:');
    };
    normalizeUrl = function (urlOrAnchor, options) {
        var normalized, parts, pathname;
        parts = parseUrl(urlOrAnchor);
        normalized = parts.protocol + "//" + parts.hostname;
        if (!isStandardPort(parts.protocol, parts.port)) {
            normalized += ":" + parts.port;
        }
        pathname = parts.pathname;
        if ((options != null ? options.stripTrailingSlash : void 0) === true) {
            pathname = pathname.replace(/\/$/, '');
        }
        normalized += pathname;
        if ((options != null ? options.search : void 0) !== false) {
            normalized += parts.search;
        }
        if ((options != null ? options.hash : void 0) === true) {
            normalized += parts.hash;
        }
        return normalized;
    };
    isCrossDomain = function (targetUrl) {
        var currentUrl;
        currentUrl = parseUrl(location.href);
        targetUrl = parseUrl(targetUrl);
        return currentUrl.protocol !== targetUrl.protocol || currentUrl.hostname !== targetUrl.hostname;
    };
    parseUrl = function (urlOrLink) {
        var link;
        if (isJQuery(urlOrLink)) {
            // In case someone passed us a $link, unwrap it
            link = up.element.get(urlOrLink);
        }
        else if (urlOrLink.pathname) {
            // If we are handed a parsed URL, just return it
            link = urlOrLink;
        }
        else {
            link = document.createElement('a');
            link.href = urlOrLink;
        }
        // In IE11 the #hostname and #port properties of unqualified URLs are empty strings.
        // We can fix this by setting the link's { href } on the link itself.
        if (!link.hostname) {
            link.href = link.href;
        }
        // Some IEs don't include a leading slash in the #pathname property.
        // We have confirmed this in IE11 and earlier.
        if (link.pathname[0] !== '/') {
            // Only copy the link into an object when we need to (to change a property).
            // Note that we're parsing a lot of URLs for [up-active].
            link = only(link, 'protocol', 'hostname', 'port', 'pathname', 'search', 'hash');
            link.pathname = '/' + link.pathname;
        }
        return link;
    };
    normalizeMethod = function (method) {
        if (method) {
            return method.toUpperCase();
        }
        else {
            return 'GET';
        }
    };
    methodAllowsPayload = function (method) {
        return method !== 'GET' && method !== 'HEAD';
    };
    assignPolyfill = function (target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            sources[_i - 1] = arguments[_i];
        }
        var i, key, len, source, value;
        for (i = 0, len = sources.length; i < len; i++) {
            source = sources[i];
            for (key in source) {
                if (!hasProp.call(source, key))
                    continue;
                value = source[key];
                target[key] = value;
            }
        }
        return target;
    };
    assign = Object.assign || assignPolyfill;
    valuesPolyfill = function (object) {
        var key, results, value;
        results = [];
        for (key in object) {
            value = object[key];
            results.push(value);
        }
        return results;
    };
    objectValues = Object.values || valuesPolyfill;
    iteratee = function (block) {
        if (isString(block)) {
            return function (item) {
                return item[block];
            };
        }
        else {
            return block;
        }
    };
    map = function (array, block) {
        var i, index, item, len, results;
        if (array.length === 0) {
            return [];
        }
        block = iteratee(block);
        results = [];
        for (index = i = 0, len = array.length; i < len; index = ++i) {
            item = array[index];
            results.push(block(item, index));
        }
        return results;
    };
    mapObject = function (array, pairer) {
        var merger;
        merger = function (object, pair) {
            object[pair[0]] = pair[1];
            return object;
        };
        return map(array, pairer).reduce(merger, {});
    };
    each = map; // note that the native Array.forEach is very slow (https://jsperf.com/fast-array-foreach)
    eachIterator = function (iterator, callback) {
        var entry, results;
        results = [];
        while ((entry = iterator.next()) && !entry.done) {
            results.push(callback(entry.value));
        }
        return results;
    };
    times = function (count, block) {
        var i, iteration, ref, results;
        results = [];
        for (iteration = i = 0, ref = count - 1; (0 <= ref ? i <= ref : i >= ref); iteration = 0 <= ref ? ++i : --i) {
            results.push(block(iteration));
        }
        return results;
    };
    isNull = function (object) {
        return object === null;
    };
    isUndefined = function (object) {
        return object === void 0;
    };
    isDefined = function (object) {
        return !isUndefined(object);
    };
    isMissing = function (object) {
        return isUndefined(object) || isNull(object);
    };
    isGiven = function (object) {
        return !isMissing(object);
    };
    // isNan = (object) ->
    //   isNumber(value) && value != +value
    /***
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
    isBlank = function (value) {
        if (isMissing(value)) {
            return true;
        }
        if (isObject(value) && value[isBlank.key]) {
            return value[isBlank.key]();
        }
        if (isString(value) || isList(value)) {
            return value.length === 0;
        }
        if (isOptions(value)) {
            return Object.keys(value).length === 0;
        }
        return false;
    };
    /***
    This property contains the name of a method that user-defined classes
    may implement to hook into the `up.util.isBlank()` protocol.
  
    \#\#\# Example
  
    We have a user-defined `Account` class that we want to use with `up.util.isBlank()`:
  
    ```
    class Account {
    constructor(email) {
    this.email = email
    }
  
    [up.util.isBlank.key]() {
    return up.util.isBlank(this.email)
    }
    }
    ```
  
    Note that the protocol method is not actually named `'up.util.isBlank.key'`.
    Instead it is named after the *value* of the `up.util.isBlank.key` property.
    To do so, the code sample above is using a
    [computed property name](https://medium.com/front-end-weekly/javascript-object-creation-356e504173a8)
    in square brackets.
  
    We may now use `Account` instances with `up.util.isBlank()`:
  
    ```
    foo = new Account('foo@foo.com')
    bar = new Account('')
  
    console.log(up.util.isBlank(foo)) // prints false
    console.log(up.util.isBlank(bar)) // prints true
    ```
  
    @property up.util.isBlank.key
    @experimental
    */
    isBlank.key = 'up.util.isBlank';
    presence = function (value, tester) {
        if (tester === void 0) { tester = isPresent; }
        if (tester(value)) {
            return value;
        }
        else {
            return void 0;
        }
    };
    isPresent = function (object) {
        return !isBlank(object);
    };
    isFunction = function (object) {
        return typeof object === 'function';
    };
    isString = function (object) {
        return typeof object === 'string' || object instanceof String;
    };
    isBoolean = function (object) {
        return typeof object === 'boolean' || object instanceof Boolean;
    };
    isNumber = function (object) {
        return typeof object === 'number' || object instanceof Number;
    };
    isOptions = function (object) {
        return typeof object === 'object' && !isNull(object) && (isUndefined(object.constructor) || object.constructor === Object);
    };
    isObject = function (object) {
        var typeOfResult;
        typeOfResult = typeof object;
        return (typeOfResult === 'object' && !isNull(object)) || typeOfResult === 'function';
    };
    isElement = function (object) {
        return object instanceof Element;
    };
    isJQuery = function (object) {
        return !!(object != null ? object.jquery : void 0);
    };
    isPromise = function (object) {
        return isObject(object) && isFunction(object.then);
    };
    /***
    Returns whether the given argument is an array.
  
    @function up.util.isArray
    @param object
    @return {boolean}
    @stable
    */
    // https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    isArray = Array.isArray;
    isFormData = function (object) {
        return object instanceof FormData;
    };
    toArray = function (value) {
        if (isArray(value)) {
            return value;
        }
        else {
            return Array.prototype.slice.call(value);
        }
    };
    isList = function (value) {
        return isArray(value) || isNodeList(value) || isArguments(value) || isJQuery(value) || isHTMLCollection(value);
    };
    isNodeList = function (value) {
        return value instanceof NodeList;
    };
    isHTMLCollection = function (value) {
        return value instanceof HTMLCollection;
    };
    //  ###**
    //  Returns whether the given value is an [`HTMLCollection`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection).
    //  @function up.util.isHtmlCollection
    //  @param value
    //  @return {Boolean}
    //  @experimental
    //  ###
    //  isHtmlCollection = (value) ->
    //    value instanceof HTMLCollection
    /***
    Returns whether the given value is an [arguments object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments).
  
    @function up.util.isArguments
    @param value
    @return {Boolean}
    @internal
    */
    isArguments = function (value) {
        return Object.prototype.toString.call(value) === '[object Arguments]';
    };
    wrapList = function (value) {
        if (isList(value)) {
            return value;
        }
        else if (isMissing(value)) {
            return [];
        }
        else {
            return [value];
        }
    };
    copy = function (value, deep) {
        var copied, k, v;
        if (isObject(value) && value[copy.key]) {
            value = value[copy.key]();
        }
        else if (isList(value)) {
            value = Array.prototype.slice.call(value);
            copied = true;
        }
        else if (isOptions(value)) {
            value = assign({}, value);
            copied = true;
        }
        if (copied && deep) {
            for (k in value) {
                v = value[k];
                value[k] = copy(v, true);
            }
        }
        return value;
    };
    /***
    This property contains the name of a method that user-defined classes
    may implement to hook into the `up.util.copy()` protocol.
  
    \#\#\# Example
  
    We have a user-defined `Account` class that we want to use with `up.util.copy()`:
  
    ```
    class Account {
    constructor(email) {
    this.email = email
    }
  
    [up.util.copy.key]() {
    return new Account(this.email)
    }
    }
    ```
  
    Note that the protocol method is not actually named `'up.util.copy.key'`.
    Instead it is named after the *value* of the `up.util.copy.key` property.
    To do so, the code sample above is using a
    [computed property name](https://medium.com/front-end-weekly/javascript-object-creation-356e504173a8)
    in square brackets.
  
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
    copy.key = 'up.util.copy';
    // Implement up.util.copy protocol for Date
    Date.prototype[copy.key] = function () {
        return new Date(+this);
    };
    deepCopy = function (object) {
        return copy(object, true);
    };
    merge = function () {
        var sources = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            sources[_i] = arguments[_i];
        }
        return assign.apply(void 0, [{}].concat(sources));
    };
    //  ###**
    //  Creates a new object by recursively merging together the properties from the given objects.
    //  @function up.util.deepMerge
    //  @param {Array<Object>} sources...
    //  @return Object
    //  @internal
    //  ###
    //  deepMerge = (sources...) ->
    //    deepAssign({}, sources...)
    //  ###**
    //  @function up.util.deepAssign
    //  @param {Array<Object>} sources...
    //  @return Object
    //  ###
    //  deepAssign = (target, sources...) ->
    //    for source in sources
    //      for key, newValue of source
    //        if isOptions(newValue)
    //          oldValue = target[key]
    //          if isOptions(oldValue)
    //            newValue = deepMerge(oldValue, newValue)
    //        target[key] = newValue
    //    target
    /***
    Creates an options hash from the given argument and some defaults.
  
    The semantics of this function are confusing.
    We want to get rid of this in the future.
  
    @function up.util.options
    @param {Object} object
    @param {Object} [defaults]
    @return {Object}
    @internal
    */
    newOptions = function (object, defaults) {
        if (defaults) {
            return merge(defaults, object);
        }
        else if (object) {
            return copy(object);
        }
        else {
            return {};
        }
    };
    findInList = function (list, tester) {
        var element, i, len, match;
        match = void 0;
        for (i = 0, len = list.length; i < len; i++) {
            element = list[i];
            if (tester(element)) {
                match = element;
                break;
            }
        }
        return match;
    };
    some = function (list, tester) {
        return !!findResult(list, tester);
    };
    findResult = function (array, tester) {
        var element, i, index, len, result;
        tester = iteratee(tester);
        for (index = i = 0, len = array.length; i < len; index = ++i) {
            element = array[index];
            if (result = tester(element, index)) {
                return result;
            }
        }
        return void 0;
    };
    every = function (list, tester) {
        var element, i, index, len, match;
        tester = iteratee(tester);
        match = true;
        for (index = i = 0, len = list.length; i < len; index = ++i) {
            element = list[index];
            if (!tester(element, index)) {
                match = false;
                break;
            }
        }
        return match;
    };
    compact = function (array) {
        return filterList(array, isGiven);
    };
    uniq = function (array) {
        if (array.length < 2) {
            return array;
        }
        return setToArray(arrayToSet(array));
    };
    uniqBy = function (array, mapper) {
        var set;
        if (array.length < 2) {
            return array;
        }
        mapper = iteratee(mapper);
        set = new Set();
        return filterList(array, function (elem, index) {
            var mapped;
            mapped = mapper(elem, index);
            if (set.has(mapped)) {
                return false;
            }
            else {
                set.add(mapped);
                return true;
            }
        });
    };
    setToArray = function (set) {
        var array;
        array = [];
        set.forEach(function (elem) {
            return array.push(elem);
        });
        return array;
    };
    arrayToSet = function (array) {
        var set;
        set = new Set();
        array.forEach(function (elem) {
            return set.add(elem);
        });
        return set;
    };
    filterList = function (list, tester) {
        var matches;
        tester = iteratee(tester);
        matches = [];
        each(list, function (element, index) {
            if (tester(element, index)) {
                return matches.push(element);
            }
        });
        return matches;
    };
    reject = function (list, tester) {
        tester = iteratee(tester);
        return filterList(list, function (element, index) {
            return !tester(element, index);
        });
    };
    intersect = function (array1, array2) {
        return filterList(array1, function (element) {
            return contains(array2, element);
        });
    };
    scheduleTimer = function (millis, callback) {
        return setTimeout(callback, millis);
    };
    queueTask = function (block) {
        return setTimeout(block, 0);
    };
    queueMicrotask = function (task) {
        return Promise.resolve().then(task);
    };
    last = function (array) {
        return array[array.length - 1];
    };
    escapePressed = function (event) {
        var key;
        key = event.key;
        return key === 'Escape' || key === 'Esc';
    };
    contains = function (arrayOrString, elementOrSubstring) {
        return arrayOrString.indexOf(elementOrSubstring) >= 0;
    };
    only = function (object) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        var filtered, i, len, property;
        filtered = {};
        for (i = 0, len = properties.length; i < len; i++) {
            property = properties[i];
            if (property in object) {
                filtered[property] = object[property];
            }
        }
        return filtered;
    };
    except = function (object) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        var filtered, i, len, property;
        filtered = copy(object);
        for (i = 0, len = properties.length; i < len; i++) {
            property = properties[i];
            delete filtered[property];
        }
        return filtered;
    };
    //  pickBy = (obj, predicate) ->
    //    result = {}
    //    for k, v of obj
    //      if predicate(v, k)
    //        result[k] = v
    //    result
    /***
    @function up.util.isUnmodifiedKeyEvent
    @internal
    */
    isUnmodifiedKeyEvent = function (event) {
        return !(event.metaKey || event.shiftKey || event.ctrlKey);
    };
    isUnmodifiedMouseEvent = function (event) {
        var isLeftButton;
        isLeftButton = isUndefined(event.button) || event.button === 0;
        return isLeftButton && isUnmodifiedKeyEvent(event);
    };
    unresolvablePromise = function () {
        return new Promise(noop);
    };
    remove = function (array, element) {
        var index;
        index = array.indexOf(element);
        if (index >= 0) {
            array.splice(index, 1);
            return element;
        }
    };
    evalOption = function (value) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (isFunction(value)) {
            return value.apply(void 0, args);
        }
        else {
            return value;
        }
    };
    fail = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _a, _b;
        var asString, messageArgs, toastOptions;
        if (isArray(args[0])) {
            messageArgs = args[0];
            toastOptions = args[1] || {};
        }
        else {
            messageArgs = args;
            toastOptions = {};
        }
        (_a = up.log).error.apply(_a, messageArgs);
        up.event.onReady(function () {
            return up.toast.open(messageArgs, toastOptions);
        });
        asString = (_b = up.log).sprintf.apply(_b, messageArgs);
        throw new Error(asString);
    };
    ESCAPE_HTML_ENTITY_MAP = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;'
    };
    escapeHtml = function (string) {
        return string.replace(/[&<>"]/g, function (char) {
            return ESCAPE_HTML_ENTITY_MAP[char];
        });
    };
    escapeRegexp = function (string) {
        // From https://github.com/benjamingr/RegExp.escape
        return string.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    };
    pluckKey = function (object, key) {
        var value;
        value = object[key];
        delete object[key];
        return value;
    };
    renameKey = function (object, oldKey, newKey) {
        return object[newKey] = pluckKey(object, oldKey);
    };
    extractLastArg = function (args, tester) {
        var lastArg;
        lastArg = last(args);
        if (tester(lastArg)) {
            return args.pop();
        }
    };
    //  extractFirstArg = (args, tester) ->
    //    firstArg = args[0]
    //    if tester(firstArg)
    //      return args.shift()
    extractCallback = function (args) {
        return extractLastArg(args, isFunction);
    };
    extractOptions = function (args) {
        return extractLastArg(args, isOptions) || {};
    };
    partial = function (fn) {
        var fixedArgs = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            fixedArgs[_i - 1] = arguments[_i];
        }
        return function () {
            var callArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                callArgs[_i] = arguments[_i];
            }
            return fn.apply(this, fixedArgs.concat(callArgs));
        };
    };
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
    identity = function (arg) {
        return arg;
    };
    //  ###**
    //  ###
    //  parsePath = (input) ->
    //    path = []
    //    pattern = /([^\.\[\]\"\']+)|\[\'([^\']+?)\'\]|\[\"([^\"]+?)\"\]|\[([^\]]+?)\]/g
    //    while match = pattern.exec(input)
    //      path.push(match[1] || match[2] || match[3] || match[4])
    //    path
    /***
    Given a function that will return a promise, returns a proxy function
    with an additional `.promise` attribute.
  
    When the proxy is called, the inner function is called.
    The proxy's `.promise` attribute is available even before the function is called
    and will resolve when the inner function's returned promise resolves.
  
    If the inner function does not return a promise, the proxy's `.promise` attribute
    will resolve as soon as the inner function returns.
  
    @function up.util.previewable
    @internal
    */
    previewable = function (fun) {
        var deferred, preview;
        deferred = newDeferred();
        preview = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var funValue;
            funValue = fun.apply(void 0, args);
            // If funValue is again a Promise, it will defer resolution of `deferred`
            // until `funValue` is resolved.
            deferred.resolve(funValue);
            return funValue;
        };
        preview.promise = deferred.promise();
        return preview;
    };
    sequence = function (functions) {
        if (functions.length === 1) {
            return functions[0];
        }
        else {
            return function () {
                return map(functions, function (f) {
                    return f();
                });
            };
        }
    };
    //  ###**
    //  @function up.util.race
    //  @internal
    //  ###
    //  race = (promises...) ->
    //    raceDone = newDeferred()
    //    each promises, (promise) ->
    //      promise.then -> raceDone.resolve()
    //    raceDone.promise()
    /***
    Returns `'left'` if the center of the given element is in the left 50% of the screen.
    Otherwise returns `'right'`.
  
    @function up.util.horizontalScreenHalf
    @internal
    */
    horizontalScreenHalf = function (element) {
        var elementDims, elementMid, screenMid;
        elementDims = element.getBoundingClientRect();
        elementMid = elementDims.left + 0.5 * elementDims.width;
        screenMid = 0.5 * up.viewport.rootWidth();
        if (elementMid < screenMid) {
            return 'left';
        }
        else {
            return 'right';
        }
    };
    flatten = function (array) {
        var flattened, i, len, object;
        flattened = [];
        for (i = 0, len = array.length; i < len; i++) {
            object = array[i];
            if (isList(object)) {
                flattened.push.apply(flattened, object);
            }
            else {
                flattened.push(object);
            }
        }
        return flattened;
    };
    flatMap = function (array, block) {
        return flatten(map(array, block));
    };
    isTruthy = function (object) {
        return !!object;
    };
    always = function (promise, callback) {
        return promise.then(callback, callback);
    };
    muteRejection = function (promise) {
        return promise != null ? promise.catch(noop) : void 0;
    };
    newDeferred = function () {
        var nativePromise, rejectFn, resolveFn;
        resolveFn = void 0;
        rejectFn = void 0;
        nativePromise = new Promise(function (givenResolve, givenReject) {
            resolveFn = givenResolve;
            return rejectFn = givenReject;
        });
        nativePromise.resolve = resolveFn;
        nativePromise.reject = rejectFn;
        nativePromise.promise = function () {
            return nativePromise; // just return self
        };
        return nativePromise;
    };
    rejectOnError = function (block) {
        var error;
        try {
            return block();
        }
        catch (error1) {
            error = error1;
            return Promise.reject(error);
        }
    };
    sum = function (list, block) {
        var entry, entryValue, i, len, totalValue;
        block = iteratee(block);
        totalValue = 0;
        for (i = 0, len = list.length; i < len; i++) {
            entry = list[i];
            entryValue = block(entry);
            if (isGiven(entryValue)) { // ignore undefined/null, like SQL would do
                totalValue += entryValue;
            }
        }
        return totalValue;
    };
    isBasicObjectProperty = function (k) {
        return Object.prototype.hasOwnProperty(k);
    };
    isEqual = function (a, b) {
        var aKeys, bKeys;
        if (a != null ? a.valueOf : void 0) { // Date, String objects, Number objects
            a = a.valueOf();
        }
        if (b != null ? b.valueOf : void 0) { // Date, String objects, Number objects
            b = b.valueOf();
        }
        if (typeof a !== typeof b) {
            return false;
        }
        else if (isList(a) && isList(b)) {
            return isEqualList(a, b);
        }
        else if (isObject(a) && a[isEqual.key]) {
            return a[isEqual.key](b);
        }
        else if (isOptions(a) && isOptions(b)) {
            aKeys = Object.keys(a);
            bKeys = Object.keys(b);
            if (isEqualList(aKeys, bKeys)) {
                return every(aKeys, function (aKey) {
                    return isEqual(a[aKey], b[aKey]);
                });
            }
            else {
                return false;
            }
        }
        else {
            return a === b;
        }
    };
    /***
    This property contains the name of a method that user-defined classes
    may implement to hook into the `up.util.isEqual()` protocol.
  
    \#\#\# Example
  
    We have a user-defined `Account` class that we want to use with `up.util.isEqual()`:
  
    ```
    class Account {
      constructor(email) {
    this.email = email
      }
  
      [up.util.isEqual.key](other) {
    return this.email === other.email;
      }
    }
    ```
  
    Note that the protocol method is not actually named `'up.util.isEqual.key'`.
    Instead it is named after the *value* of the `up.util.isEqual.key` property.
    To do so, the code sample above is using a
    [computed property name](https://medium.com/front-end-weekly/javascript-object-creation-356e504173a8)
    in square brackets.
  
    We may now use `Account` instances with `up.util.isEqual()`:
  
    ```
    one = new User('foo@foo.com')
    two = new User('foo@foo.com')
    three = new User('bar@bar.com')
  
    isEqual = up.util.isEqual(one, two)
    // isEqual is now true
  
    isEqual = up.util.isEqual(one, three)
    // isEqual is now false
    ```
  
    @property up.util.isEqual.key
    @param {string} key
    @experimental
    */
    isEqual.key = 'up.util.isEqual';
    isEqualList = function (a, b) {
        return a.length === b.length && every(a, function (elem, index) {
            return isEqual(elem, b[index]);
        });
    };
    splitValues = function (value, separator) {
        if (separator === void 0) { separator = ' '; }
        var values;
        values = value.split(separator);
        values = map(values, function (v) {
            return v.trim();
        });
        values = filterList(values, isPresent);
        return values;
    };
    endsWith = function (string, search) {
        if (search.length > string.length) {
            return false;
        }
        else {
            return string.substring(string.length - search.length) === search;
        }
    };
    simpleEase = function (x) {
        // easing: http://fooplot.com/?lang=de#W3sidHlwZSI6MCwiZXEiOiJ4PDAuNT8yKngqeDp4Kig0LXgqMiktMSIsImNvbG9yIjoiIzEzRjIxNyJ9LHsidHlwZSI6MCwiZXEiOiJzaW4oKHheMC43LTAuNSkqcGkpKjAuNSswLjUiLCJjb2xvciI6IiMxQTUyRUQifSx7InR5cGUiOjEwMDAsIndpbmRvdyI6WyItMS40NyIsIjEuNzgiLCItMC41NSIsIjEuNDUiXX1d
        // easing nice: sin((x^0.7-0.5)*pi)*0.5+0.5
        // easing performant: x < 0.5 ? 2*x*x : x*(4 - x*2)-1
        // https://jsperf.com/easings/1
        // Math.sin((Math.pow(x, 0.7) - 0.5) * Math.PI) * 0.5 + 0.5
        if (x < 0.5) {
            return 2 * x * x;
        }
        else {
            return x * (4 - x * 2) - 1;
        }
    };
    wrapValue = function (object, constructor) {
        if (object instanceof constructor) {
            // This object has gone through instantiation and normalization before.
            return object;
        }
        else {
            return new constructor(object);
        }
    };
    //  wrapArray = (objOrArray) ->
    //    if isUndefined(objOrArray)
    //      []
    //    else if isArray(objOrArray)
    //      objOrArray
    //    else
    //      [objOrArray]
    nextUid = 0;
    uid = function () {
        return nextUid++;
    };
    return {
        parseUrl: parseUrl,
        normalizeUrl: normalizeUrl,
        normalizeMethod: normalizeMethod,
        methodAllowsPayload: methodAllowsPayload,
        //  isGoodSelector: isGoodSelector
        assign: assign,
        assignPolyfill: assignPolyfill,
        copy: copy,
        deepCopy: deepCopy,
        merge: merge,
        //  deepAssign: deepAssign
        //  deepMerge: deepMerge
        options: newOptions,
        fail: fail,
        each: each,
        eachIterator: eachIterator,
        map: map,
        flatMap: flatMap,
        mapObject: mapObject,
        times: times,
        findResult: findResult,
        some: some,
        any: function () {
            up.legacy.warn('up.util.any() has been renamed to up.util.some()');
            return some.apply(null, arguments);
        },
        every: every,
        all: function () {
            up.legacy.warn('up.util.all() has been renamed to up.util.every()');
            return every.apply(null, arguments);
        },
        detect: function () {
            up.legacy.warn('up.util.find() has been renamed to up.util.find()');
            return findInList.apply(null, arguments);
        },
        find: findInList,
        select: function () {
            up.legacy.warn('up.util.select() has been renamed to up.util.filter()');
            return filterList.apply(null, arguments);
        },
        filter: filterList,
        reject: reject,
        intersect: intersect,
        compact: compact,
        uniq: uniq,
        uniqBy: uniqBy,
        last: last,
        isNull: isNull,
        isDefined: isDefined,
        isUndefined: isUndefined,
        isGiven: isGiven,
        isMissing: isMissing,
        isPresent: isPresent,
        isBlank: isBlank,
        presence: presence,
        isObject: isObject,
        isFunction: isFunction,
        isString: isString,
        isBoolean: isBoolean,
        isNumber: isNumber,
        isElement: isElement,
        isJQuery: isJQuery,
        isPromise: isPromise,
        isOptions: isOptions,
        isArray: isArray,
        isFormData: isFormData,
        isNodeList: isNodeList,
        isArguments: isArguments,
        isList: isList,
        isUnmodifiedKeyEvent: isUnmodifiedKeyEvent,
        isUnmodifiedMouseEvent: isUnmodifiedMouseEvent,
        timer: scheduleTimer,
        setTimer: function () {
            up.legacy.warn('up.util.setTimer() has been renamed to up.util.timer()');
            return scheduleTimer.apply(null, arguments);
        },
        escapePressed: escapePressed,
        contains: contains,
        toArray: toArray,
        only: only,
        except: except,
        //  pickBy: pickBy
        unresolvablePromise: unresolvablePromise,
        remove: remove,
        memoize: memoize,
        error: fail,
        pluckKey: pluckKey,
        renameKey: renameKey,
        extractOptions: extractOptions,
        extractCallback: extractCallback,
        noop: noop,
        asyncNoop: asyncNoop,
        identity: identity,
        escapeHtml: escapeHtml,
        escapeRegexp: escapeRegexp,
        sequence: sequence,
        previewable: previewable,
        // parsePath: parsePath
        evalOption: evalOption,
        horizontalScreenHalf: horizontalScreenHalf,
        flatten: flatten,
        isTruthy: isTruthy,
        newDeferred: newDeferred,
        always: always,
        muteRejection: muteRejection,
        rejectOnError: rejectOnError,
        isBasicObjectProperty: isBasicObjectProperty,
        isCrossDomain: isCrossDomain,
        selectorForElement: function () {
            up.legacy.warn('up.util.selectorForElement() has been renamed to up.element.toSelector()');
            return up.element.toSelector.apply(null, arguments);
        },
        nextFrame: function () {
            up.legacy.warn('up.util.nextFrame() has been renamed to up.util.task()');
            return queueTask.apply(null, arguments);
        },
        task: queueTask,
        microtask: queueMicrotask,
        isEqual: isEqual,
        splitValues: splitValues,
        endsWith: endsWith,
        sum: sum,
        //  wrapArray: wrapArray
        wrapList: wrapList,
        wrapValue: wrapValue,
        simpleEase: simpleEase,
        values: objectValues,
        partial: partial,
        arrayToSet: arrayToSet,
        setToArray: setToArray,
        uid: uid
    };
})();
up.fail = up.util.fail;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

var u;
u = up.util;
up.legacy = (function () {
    var fixKey, renamedModule, warn, warnedMessages;
    //  renamedProperty = (object, oldKey, newKey) ->
    //    warning = -> warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
    //    Object.defineProperty object, oldKey,
    //      get: ->
    //        warning()
    //        @[newKey]
    //      set: (newValue) ->
    //        warning()
    //        @[newKey] = newValue
    //  removedProperty = (object, key) ->
    //    failure = -> up.fail('Deprecated: Property { %s } is no longer supported (found in %o)', key, object)
    //    Object.defineProperty object, key,
    //      get: failure
    //      set: failure
    fixKey = function (object, oldKey, newKey) {
        if (oldKey in object) {
            warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object);
            return u.renameKey(object, oldKey, newKey);
        }
    };
    //  # Maps old event name to new event name
    //  renamedEvents = {}
    //  renamedEvent = (oldName, newName) ->
    //    renamedEvents[oldName] = newName
    //  fixEventName = (eventName) ->
    //    if newEventName = renamedEvents[eventName]
    //      warn("Event #{eventName} has been renamed to #{newEventName}")
    //      newEventName
    //    else
    //      eventName
    renamedModule = function (oldName, newName) {
        return Object.defineProperty(up, oldName, {
            get: function () {
                warn("up." + oldName + " has been renamed to up." + newName);
                return up[newName];
            }
        });
    };
    warnedMessages = {};
    warn = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var _a;
        message = "[DEPRECATION] " + message;
        message = (_a = up.log).sprintf.apply(_a, [message].concat(args));
        if (!warnedMessages[message]) {
            warnedMessages[message] = true;
            return up.warn(message);
        }
    };
    return {
        renamedModule: renamedModule,
        //  renamedProperty: renamedProperty
        //  removedProperty: removedProperty
        //  renamedEvent: renamedEvent
        //  fixEventName: fixEventName
        fixKey: fixKey,
        warn: warn
    };
})();


/***/ }),
/* 4 */
/***/ (function(module, exports) {

/***
Browser support
===============

Unpoly supports all modern browsers.

Chrome, Firefox, Edge, Safari
: Full support

Internet Explorer 11
: Full support with a `Promise` polyfill like [es6-promise](https://github.com/stefanpenner/es6-promise) (2.4 KB).

Internet Explorer 10 or lower
: Unpoly prevents itself from booting itself, leaving you with a classic server-side application.

@module up.browser
*/
up.browser = (function () {
    /***
    Returns whether this browser supports the [`debugging console`](https://developer.mozilla.org/en-US/docs/Web/API/Console).
  
    @function up.browser.canConsole
    @return {boolean}
    @internal
    */
    /***
    Returns whether this browser supports animation using
    [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions).
  
    When Unpoly is asked to animate history on a browser that doesn't support
    CSS transitions (e.g. through [`up.animate()`](/up.animate)), it will skip the
    animation by instantly jumping to the last frame.
  
    @function up.browser.canCssTransition
    @return {boolean}
    @internal
    */
    /***
    Returns whether this browser supports the [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
    interface.
  
    @function up.browser.canDOMParser
    @return {boolean}
    @internal
    */
    /***
    Returns whether this browser supports the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
    interface.
  
    @function up.browser.canFormData
    @return {boolean}
    @experimental
    */
    /***
    Returns whether this browser supports the DOM event [`input`](https://developer.mozilla.org/de/docs/Web/Events/input).
  
    @function up.browser.canInputEvent
    @return {boolean}
    @internal
    */
    /***
    @function up.browser.canInspectFormData
    @return {boolean}
    @internal
    */
    /***
    Returns whether this browser supports promises.
  
    @function up.browser.canPromise
    @return {boolean}
    @internal
    */
    /***
    Returns whether this browser supports manipulation of the current URL
    via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
  
    When `pushState`  (e.g. through [`up.follow()`](/up.follow)), it will gracefully
    fall back to a full page load.
  
    Note that Unpoly will not use `pushState` if the initial page was loaded with
    a request method other than GET.
  
    @function up.browser.canPushState
    @return {boolean}
    @experimental
    */
    /***
    Returns whether Unpoly supports the current browser.
  
    If this returns `false` Unpoly will prevent itself from [booting](/up.boot)
    and ignores all registered [event handlers](/up.on) and [compilers](/up.compiler).
    This leaves you with a classic server-side application.
    This is usually a better fallback than loading incompatible Javascript and causing
    many errors on load.
  
    @function up.browser.isSupported
    @stable
    */
    /***
    @method up.browser.navigate
    @param {string} url
    @param {string} [options.method='get']
    @param {object|Array|FormData|string} [options.params]
    @internal
    */
    /***
    For mocking in specs.
  
    @method submitForm
    */
    /***
    @function up,browser.whenConfirmed
    @return {Promise}
    @param {string} options.confirm
    @param {boolean} options.preload
    @internal
    */
    var callJQuery, canAnimationFrame, canConsole, canControlScrollRestoration, canCssTransition, canCustomElements, canDOMParser, canFormData, canInputEvent, canInspectFormData, canPromise, canPushState, isIE10OrWorse, isIE11, isSupported, navigate, popCookie, submitForm, u, url, whenConfirmed;
    u = up.util;
    navigate = function (url, options) {
        var request, requestOpts;
        requestOpts = u.merge(options, { url: url });
        request = new up.Request(requestOpts);
        return request.navigate();
    };
    submitForm = function (form) {
        return form.submit();
    };
    url = function () {
        return location.href;
    };
    isIE10OrWorse = u.memoize(function () {
        return !window.atob;
    });
    isIE11 = u.memoize(function () {
        return 'ActiveXObject' in window; // this is undefined, but the key is set
    });
    canPushState = function () {
        // We cannot use pushState if the initial request method is a POST for two reasons:
        // 1. Unpoly replaces the initial state so it can handle the pop event when the
        //    user goes back to the initial URL later. If the initial request was a POST,
        //    Unpoly will wrongly assumed that it can restore the state by reloading with GET.
        // 2. Some browsers have a bug where the initial request method is used for all
        //    subsequently pushed states. That means if the user reloads the page on a later
        //    GET state, the browser will wrongly attempt a POST request.
        //    This issue affects Safari 9 and 10 (last tested in 2017-08).
        //    Modern Firefoxes, Chromes and IE10+ don't have this behavior.
        // The way that we work around this is that we don't support pushState if the
        // initial request method was anything other than GET (but allow the rest of the
        // Unpoly framework to work). This way Unpoly will fall back to full page loads until
        // the framework was booted from a GET request.
        return u.isDefined(history.pushState) && up.protocol.initialRequestMethod() === 'get';
    };
    canCssTransition = u.memoize(function () {
        return 'transition' in document.documentElement.style;
    });
    canInputEvent = u.memoize(function () {
        return 'oninput' in document.createElement('input');
    });
    canPromise = u.memoize(function () {
        return !!window.Promise;
    });
    canFormData = u.memoize(function () {
        return !!window.FormData;
    });
    canInspectFormData = u.memoize(function () {
        return canFormData() && !!FormData.prototype.entries;
    });
    canDOMParser = u.memoize(function () {
        return !!window.DOMParser;
    });
    canConsole = u.memoize(function () {
        return window.console && console.debug && console.info && console.warn && console.error && console.group && console.groupCollapsed && console.groupEnd;
    });
    canCustomElements = u.memoize(function () {
        return !!window.customElements;
    });
    canAnimationFrame = u.memoize(function () {
        return 'requestAnimationFrame' in window;
    });
    canControlScrollRestoration = u.memoize(function () {
        return 'scrollRestoration' in history;
    });
    popCookie = function (name) {
        var ref, value;
        value = (ref = document.cookie.match(new RegExp(name + "=(\\w+)"))) != null ? ref[1] : void 0;
        if (u.isPresent(value)) {
            document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/';
        }
        return value;
    };
    whenConfirmed = function (options) {
        if (options.preload || u.isBlank(options.confirm) || window.confirm(options.confirm)) {
            return Promise.resolve();
        }
        else {
            return Promise.reject(new Error('User canceled action'));
        }
    };
    isSupported = function () {
        // We don't require pushState in order to cater for Safari booting Unpoly with a non-GET method.
        // canPushState() &&
        return !isIE10OrWorse() && canConsole() && canDOMParser() && canFormData() && canCssTransition() && canInputEvent() && canPromise() && canAnimationFrame();
    };
    callJQuery = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var jQuery;
        jQuery = window.jQuery || up.fail("jQuery must be published as window.jQuery");
        return jQuery.apply(void 0, args);
    };
    return {
        url: url,
        navigate: navigate,
        submitForm: submitForm,
        canPushState: canPushState,
        canFormData: canFormData,
        canInspectFormData: canInspectFormData,
        canCustomElements: canCustomElements,
        canControlScrollRestoration: canControlScrollRestoration,
        whenConfirmed: whenConfirmed,
        isSupported: isSupported,
        popCookie: popCookie,
        jQuery: callJQuery,
        isIE11: isIE11
    };
})();


/***/ }),
/* 5 */
/***/ (function(module, exports) {

//= require ./classes/selector
/***
DOM helpers
===========

The `up.element` module offers functions for DOM manipulation and traversal.

It complements [native `Element` methods](https://www.w3schools.com/jsref/dom_obj_all.asp) and works across all [supported browsers](/up.browser).

@module up.element
*/
up.element = (function () {
    /***
    Returns a null-object that mostly behaves like an `Element`.
  
    @function up.element.none()
    @internal
    */
    /***
    Creates an element matching the given CSS selector and attaches it to the given parent element.
  
    To create a detached element from a selector,
    see `up.element.createFromSelector()`.
  
    \#\#\# Example
  
    element = up.element.affix(document.body, '.klass')
    element.parentElement // returns document.body
    element.className // returns 'klass'
  
    @function up.element.affix
    @params {Element} parent
    The parent to which to attach the created element.
    @params {string} selector
    The CSS selector from which to create an element.
    @params {Object} attrs
    An object of attributes to set on the created element.
    @param {Object} attrs.text
    The [text content](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) of the created element.
    @param {Object} attrs.style
    An object of CSS properties that will be set as the inline style
    of the created element.
    @return {Element}
    The created element.
    @experimental
    */
    /***
    Returns all descendant elements matching the given selector.
  
    @function up.element.all
    @param {Element} [parent=document]
    The parent element whose descendants to search.
  
    If omitted, all elements in the `document` will be searched.
    @param {string} selector
    The CSS selector to match.
    @return {NodeList<Element>|Array<Element>}
    A list of all elements matching the selector.
  
    Returns an empty list if there are no matches.
    @experimental
    */
    /***
    @function up.element.ancestor
    @internal
    */
    /***
    @function up.element.attributeSelector
    @internal
    */
    /***
    Returns the given attribute value cast as boolean.
  
    If the attribute value cannot be cast, returns the attribute value unchanged.
  
    @internal
    */
    /***
    Returns the first element that matches the selector by testing the element itself
    and traversing up through its ancestors in the DOM tree.
  
    @function up.element.closest
    @param {Element} element
    The element on which to start the search.
    @param {string}
    The CSS selector to match.
    @return {Element|null|undefined} element
    The matching element.
  
    Returns `null` or `undefined` if no element matches.
    @experimental
    */
    /***
    Receives [computed CSS styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
    for the given element.
  
    \#\#\# Examples
  
    When requesting a single CSS property, its value will be returned as a string:
  
    value = up.element.style(element, 'font-size')
    // value is '16px'
  
    When requesting multiple CSS properties, the function returns an object of property names and values:
  
    value = up.element.style(element, ['font-size', 'margin-top'])
    // value is { 'font-size': '16px', 'margin-top': '10px' }
  
    @function up.element.style
    @param {Element} element
    @param {String|Array} propOrProps
    One or more CSS property names in kebab-case or camelCase.
    @return {string|object}
    @experimental
    */
    /***
    Receives a [computed CSS property value](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle)
    for the given element, casted as a number.
  
    The value is casted by removing the property's [unit](https://www.w3schools.com/cssref/css_units.asp) (which is usually `px` for computed properties).
    The result is then parsed as a floating point number.
  
    Returns `undefined` if the property value is missing, or if it cannot
    be parsed as a number.
  
    \#\#\# Examples
  
    When requesting a single CSS property, its value will be returned as a string:
  
    value = up.element.style(element, 'font-size')
    // value is '16px'
  
    value = up.element.styleNumber(element, 'font-size')
    // value is 16
  
    @function up.element.styleNumber
    @param {Element} element
    @param {String} prop
    A single property name in kebab-case or camelCase.
    @return {number|undefined}
    @experimental
    */
    /***
    @function up.element.concludeCssTransition
    @internal
    */
    /***
    @function up.element.createDocumentFromHtml
    @internal
    */
    /***
    Creates an element from the given HTML fragment.
  
    \#\#\# Example
  
    element = up.element.createFromHtml('<div class="foo"><span>text</span></div>')
    element.className // returns 'foo'
    element.children[0] // returns <span> element
    element.children[0].textContent // returns 'text'
  
    @function up.element.createFromHtml
    @experimental
    */
    /***
    Creates an element matching the given CSS selector.
  
    The created element will not yet be attached to the DOM tree.
    Attach it with [`Element#appendChild()`](https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild)
    or use `up.element.affix()` to create an attached element.
  
    \#\#\# Examples
  
    To create an element with a given tag name:
  
    element = up.element.createFromSelector('span')
    // element is <span></span>
  
    To create an element with a given class:
  
    element = up.element.createFromSelector('.klass')
    // element is <div class="klass"></div>
  
    To create an element with a given ID:
  
    element = up.element.createFromSelector('#foo')
    // element is <div id="foo"></div>
  
    To create an element with a given boolean attribute:
  
    element = up.element.createFromSelector('[attr]')
    // element is <div attr></div>
  
    To create an element with a given attribute value:
  
    element = up.element.createFromSelector('[attr="value"]')
    // element is <div attr="value"></div>
  
    You may also pass an object of attribute names/values as a second argument:
  
    element = up.element.createFromSelector('div', { attr: 'value' })
    // element is <div attr="value"></div>
  
    You may set the element's inner text by passing a `{ text }` option:
  
    element = up.element.createFromSelector('div', { text: 'inner text' })
    // element is <div>inner text</div>
  
    You may set inline styles by passing an object of CSS properties as a second argument:
  
    element = up.element.createFromSelector('div', { style: { color: 'red' }})
    // element is <div style="color: red"></div>
  
    @function up.element.createFromSelector
    @param {string} selector
    The CSS selector from which to create an element.
    @param {Object} [attrs]
    An object of attributes to set on the created element.
    @param {Object} [attrs.text]
    The [text content](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) of the created element.
    @param {Object} [attrs.style]
    An object of CSS properties that will be set as the inline style
    of the created element.
    @return {Element}
    The created element.
    @experimental
    */
    /***
    Converts the given value to a CSS length value, adding a `px` unit if required.
  
    @function cssLength
    @internal
    */
    /***
    Returns the first descendant element matching the given selector.
  
    It is similar to [`element.querySelector()`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector),
    but also supports the [`:has()`](/has) selector.
  
    @function up.element.first
    @param {Element} [parent=document]
    The parent element whose descendants to search.
  
    If omitted, all elements in the `document` will be searched.
    @param {string} selector
    The CSS selector to match.
    @return {Element|undefined|null}
    The first element matching the selector.
  
    Returns `null` or `undefined` if no element macthes.
    @experimental
    */
    /***
    @function up.element.fixedToAbsolute
    @internal
    */
    /***
    Composes a list of elements from the given arguments.
  
    \#\#\# Casting rules
  
    - If given a string, returns the all elements matching that string.
    - If given any other argument, returns the argument [wrapped as a list](/up.util.wrapList).
  
    \#\#\# Example
  
    ```javascript
    $jquery = $('.jquery')                          // returns jQuery (2) [div.jquery, div.jquery]
    nodeList = document.querySelectorAll('.node')   // returns NodeList (2) [div.node, div.node]
    element = document.querySelector('.element')    // returns Element div.element
    selector = '.selector'                          // returns String '.selector'
  
    elements = up.element.list($jquery, nodeList, undefined, element, selector)
    // returns [div.jquery, div.jquery, div.node, div.node, div.element, div.selector]
    ```
  
    @function up.element.list
    @param {Array<jQuery|Element|Array<Element>|String|undefined|null>} ...args
    @return {Array<Element>}
    @internal
    */
    /***
    Casts the given value to a native [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element).
  
    This is useful when working with jQuery values, or to allow callers to pass CSS selectors
    instead of elements.
  
    \#\#\# Casting rules
  
    - If given an element, returns that element.
    - If given a CSS selector string, returns the [first element matching](/up.element.first) that selector.
    - If given a jQuery collection , returns the first element in the collection.
    Throws an error if the collection contains more than one element.
    - If given any other argument (`undefined`, `null`, `document`, `window`…), returns the argument unchanged.
  
    @function up.element.get
    @param {Element|jQuery|string} value
    The value to cast.
    @return {Element}
    The obtained `Element`.
    @experimental
    */
    /***
    @function up.element.root
    @internal
    */
    /***
    Returns whether the given element has a CSS transition set.
  
    @function up.element.hasCssTransition
    @return {boolean}
    @internal
    */
    /***
    Hides the given element.
  
    The element is hidden by setting an [inline style](https://www.codecademy.com/articles/html-inline-styles)
    of `{ display: none }`.
  
    Also see `up.element.show()`.
  
    @function up.element.hide
    @param {Element} element
    @experimental
    */
    /***
    Gets the given inline style(s) from the given element's `[style]` attribute.
  
    @function up.element.inlineStyle
    @param {Element} element
    @param {String|Array} propOrProps
      One or more CSS property names in kebab-case or camelCase.
    @return {string|object}
    @internal
    */
    /***
    @function up.element.insertBefore
    @internal
    */
    /***
    Sets an unique identifier for this element.
  
    This identifier is used by `up.element.toSelector()`
    to create a CSS selector that matches this element precisely.
  
    If the element already has other attributes that make a good identifier,
    like a `[id]`, `[class]` or `[aria-label]`, it is not necessary to
    set `[up-id]`.
  
    \#\#\# Example
  
    Take this element:
  
    <a href="/">Homepage</a>
  
    Unpoly cannot generate a good CSS selector for this element:
  
    up.element.toSelector(element)
    // returns 'a'
  
    We can improve this by assigning an `[up-id]`:
  
    <a href="/" up-id="link-to-home">Open user 4</a>
  
    The attribute value is used to create a better selector:
  
    up.element.toSelector(element)
    // returns '[up-id="link-to-home"]'
  
    @selector [up-id]
    @param {string} up-id
    A string that uniquely identifies this element.
    @stable
    */
    /***
    @function up.element.isSingleton
    @internal
    */
    /***
    Returns whether the given element is currently visible.
  
    An element is considered visible if it consumes space in the document.
    Elements with `{ visibility: hidden }` or `{ opacity: 0 }` are considered visible, since they still consume space in the layout.
  
    Elements not attached to the DOM are considered hidden.
  
    @function up.element.isVisible
    @param {Element} element
    The element to check.
    @experimental
    */
    /***
    Reads the given attribute from the element, parsed as [JSON](https://www.json.org/).
  
    Returns `undefined` if the attribute value is [blank](/up.util.isBlank).
  
    Throws a `SyntaxError` if the attribute value is an invalid JSON string.
  
    @function up.element.jsonAttr
    @param {Element} element
      The element from which to retrieve the attribute value.
    @param {String} attribute
      The attribute name.
    @return {Object|undefined}
      The cast attribute value.
    @experimental
    */
    /***
    Returns whether the given element matches the given CSS selector.
  
    @function up.element.matches
    @param {Element} element
    The element to check.
    @param {string} selector
    The CSS selector to match.
    @return {boolean}
    Whether `element` matches `selector`.
    @experimental
    */
    /***
    @function up.element.metaContent
    @internal
    */
    /***
    Returns the value of the given attribute on the given element, cast to a number.
  
    If the attribute value cannot be cast to a number, `undefined` is returned.
  
    @function up.element.numberAttr
    @param {Element} element
    The element from which to retrieve the attribute value.
    @param {String} attribute
    The attribute name.
    @return {number|undefined}
    The cast attribute value.
    @experimental
    */
    /***
    Forces the browser to paint the given element now.
  
    @function up.element.paint
    @internal
    */
    /***
    Matches all elements that have a descendant matching the given selector.
  
    \#\#\# Example
  
    `up.element.all('div:has(span)')`  matches all `<div>` elements with at least one `<span>` among its descendants:
  
    ```html
    <div>
      <span>Will be matched</span>
    </div>
    <div>
      Will NOT be matched
    </div>
    <div>
      <span>Will be matched</span>
    </div>
    ```
  
    \#\#\# Compatibility
  
    `:has()` is supported by all Unpoly functions (like `up.element.all()`) and
     selectors (like `a[up-target]`).
  
    As a [level 4 CSS selector](https://drafts.csswg.org/selectors-4/#relational),
    `:has()` [has yet to be implemented](https://caniuse.com/#feat=css-has)
    in native browser functions like [`document.querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll).
  
    You can also use [`:has()` in jQuery](https://api.jquery.com/has-selector/).
  
    @selector :has()
    @experimental
    */
    /***
    Resolves the given CSS selector (which might contain `&` references)
    to a full CSS selector without ampersands.
  
    If passed an `Element` or `jQuery` element, returns a CSS selector string
    for that element.
  
    @function up.element.resolveSelector
    @param {string|Element|jQuery} selectorOrElement
    @param {string|Element|jQuery} origin
      The element that this selector resolution is relative to.
      That element's selector will be substituted for `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @return {string}
    @internal
    */
    /***
    Sets all key/values from the given object as attributes on the given element.
  
    \#\#\# Example
  
    up.element.setAttrs(element, { title: 'Tooltip', tabindex: 1 })
  
    @function up.element.setAttrs
    @param {Element} element
      The element on which to set attributes.
    @param {object} attributes
      An object of attributes to set.
    @experimental
    */
    /***
    Sets the given CSS properties as inline styles on the given element.
  
    @function up.element.setStyle
    @param {Element} element
    @param {Object} props
      One or more CSS properties with kebab-case keys or camelCase keys.
    @return {string|object}
    @experimental
    */
    /***
    On the given element, set attributes that are still missing.
  
    @function up.element.setMissingAttrs
    @internal
    */
    /***
    Temporarily sets the inline CSS styles on the given element.
  
    Returns a function that restores the original inline styles when called.
  
    \#\#\# Example
  
    element = document.querySelector('div')
    unhide = up.element.setTemporaryStyle(element, { 'visibility': 'hidden' })
    // do things while element is invisible
    unhide()
    // element is visible again
  
    @function up.element.setTemporaryStyle
    @param {Element} element
      The element to style.
    @param {Object} styles
      An object of CSS property names and values.
    @return {Function()}
      A function that restores the original inline styles when called.
    @internal
    */
    /***
    Shows the given element.
  
    Also see `up.element.hide()`.
  
    \#\#\# Limitations
  
    The element is shown by setting an [inline style](https://www.codecademy.com/articles/html-inline-styles)
    of `{ display: '' }`.
  
    You might have CSS rules causing the element to remain hidden after calling `up.element.show(element)`.
    Unpoly will not handle such cases in order to keep this function performant. As a workaround, you may
    manually set the `element.style.display` property. Also see discussion
    in jQuery issues [#88](https://github.com/jquery/jquery.com/issues/88),
    [#2057](https://github.com/jquery/jquery/issues/2057) and
    [this WHATWG mailing list post](http://lists.w3.org/Archives/Public/public-whatwg-archive/2014Apr/0094.html).
  
    @function up.element.show
    @experimental
    */
    /***
    Returns a list of the given parent's descendants matching the given selector.
    The list will also include the parent element if it matches the selector itself.
  
    @function up.element.subtree
    @param {Element} parent
    The parent element for the search.
    @param {string} selector
    The CSS selector to match.
    @return {NodeList<Element>|Array<Element>}
    A list of all matching elements.
    @experimental
    */
    /***
    Returns a CSS selector that matches the given element as good as possible.
  
    To build the selector, the following element properties are used in decreasing
    order of priority:
  
    - The element's `[up-id]` attribute
    - The element's `[id]` attribute
    - The element's `[name]` attribute
    - The element's `[class]` names
    - The element's [`[aria-label]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-label_attribute) attribute
    - The element's tag name
  
    \#\#\# Example
  
    element = document.createElement('span')
    element.className = 'klass'
    selector = up.element.toSelector(element) // returns '.klass'
  
    @function up.element.toSelector
    @param {string|Element|jQuery}
    The element for which to create a selector.
    @experimental
    */
    /***
    Display or hide the given element, depending on its current visibility.
  
    @function up.element.toggle
    @param {Element} element
    @param {Boolean} [newVisible]
    Pass `true` to show the element or `false` to hide it.
  
    If omitted, the element will be hidden if shown and shown if hidden.
    @experimental
    */
    /***
    @function up.element.unwrap
    @internal
    */
    var CSS_LENGTH_PROPS, NONE, affix, all, ancestor, attributeSelector, booleanAttr, booleanOrStringAttr, closest, computedStyle, computedStyleNumber, concludeCssTransition, createDocumentFromHtml, createFromHtml, createFromSelector, cssLength, elementTagName, extractFromStyleObject, first, fixedToAbsolute, getList, getOne, getRoot, hasCssTransition, hide, inlineStyle, insertBefore, isSingleton, isVisible, jsonAttr, matches, metaContent, nonUpClasses, normalizeStyleValueForWrite, numberAttr, paint, parseSelector, remove, replace, resolveSelector, setAttrs, setInlineStyle, setMissingAttrs, setTemporaryStyle, show, subtree, toSelector, toggle, toggleClass, u, unwrap, valueToList;
    u = up.util;
    NONE = {
        getAttribute: function () {
            return void 0;
        }
    };
    parseSelector = function (selector) {
        return up.Selector.parse(selector);
    };
    first = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var parent, ref, selector;
        selector = args.pop();
        parent = (ref = args[0]) != null ? ref : document;
        return parseSelector(selector).descendant(parent);
    };
    all = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var parent, ref, selector;
        selector = args.pop();
        parent = (ref = args[0]) != null ? ref : document;
        return parseSelector(selector).descendants(parent);
    };
    subtree = function (root, selector) {
        return parseSelector(selector).subtree(root);
    };
    closest = function (element, selector) {
        return parseSelector(selector).closest(element);
    };
    matches = function (element, selector) {
        return parseSelector(selector).matches(element);
    };
    ancestor = function (element, selector) {
        return parseSelector(selector).ancestor(element);
    };
    getOne = function (value) {
        if (u.isElement(value)) { // Return an element before we run any other expensive checks
            return value;
        }
        else if (u.isString(value)) {
            return first(value);
        }
        else if (u.isJQuery(value)) {
            if (value.length > 1) {
                up.fail('up.element.get(): Cannot cast multiple elements (%o) to a single element', value);
            }
            return value[0];
        }
        else {
            // undefined, null, Window, Document, DocumentFragment, ...
            return value;
        }
    };
    getList = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return u.flatMap(args, valueToList);
    };
    valueToList = function (value) {
        if (u.isString(value)) {
            return all(value);
        }
        else {
            return u.wrapList(value);
        }
    };
    //  assertIsElement = (element) ->
    //    unless u.isElement(element)
    //      up.fail('Not an element: %o', element)
    /***
    Removes the given element from the DOM tree.
  
    If you don't need IE11 support you may also use the built-in
    [`Element#remove()`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove) to the same effect.
  
    @function up.element.remove
    @param {Element} element
      The element to remove.
    @experimental
    */
    remove = function (element) {
        var parent;
        if (element.remove) {
            return element.remove();
            // IE does not support Element#remove()
        }
        else if (parent = element.parentNode) {
            return parent.removeChild(element);
        }
    };
    hide = function (element) {
        return element.style.display = 'none';
    };
    show = function (element) {
        return element.style.display = '';
    };
    toggle = function (element, newVisible) {
        if (newVisible == null) {
            newVisible = !isVisible(element);
        }
        if (newVisible) {
            return show(element);
        }
        else {
            return hide(element);
        }
    };
    //  trace = (fn) ->
    //    (args...) ->
    //      console.debug("Calling %o with %o", fn, args)
    //      fn(args...)
    /***
    Adds or removes the given class from the given element.
  
    If you don't need IE11 support you may also use the built-in
    [`Element#classList.toggle(className)`](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList) to the same effect.
  
    @function up.element.toggleClass
    @param {Element} element
      The element for which to add or remove the class.
    @param {String} className
      A boolean value to determine whether the class should be added or removed.
    @param {String} state
      If omitted, the class will be added if missing and removed if present.
    @experimental
    */
    toggleClass = function (element, klass, newPresent) {
        var list;
        list = element.classList;
        if (newPresent == null) {
            newPresent = !list.contains(klass);
        }
        if (newPresent) {
            return list.add(klass);
        }
        else {
            return list.remove(klass);
        }
    };
    setAttrs = function (element, attributes) {
        var key, results, value;
        results = [];
        for (key in attributes) {
            value = attributes[key];
            results.push(element.setAttribute(key, value));
        }
        return results;
    };
    metaContent = function (name) {
        var ref, selector;
        selector = "meta" + attributeSelector('name', name);
        return (ref = first(selector)) != null ? ref.getAttribute('content') : void 0;
    };
    insertBefore = function (existingElement, newElement) {
        return existingElement.insertAdjacentElement('beforebegin', newElement);
    };
    //  insertAfter = (existingElement, newElement) ->
    //    existingElement.insertAdjacentElement('afterend', newElement)
    /***
    Replaces the given old element with the given new element.
  
    The old element will be removed from the DOM tree.
  
    If you don't need IE11 support you may also use the built-in
    [`Element#replaceWith()`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/replaceWith) to the same effect.
  
    @function up.element.replace
    @param {Element} oldElement
    @param {Element} newElement
    @experimental
    */
    replace = function (oldElement, newElement) {
        return oldElement.parentElement.replaceChild(newElement, oldElement);
    };
    createFromSelector = function (selector, attrs) {
        var attrValues, classValue, depthElement, depthSelector, depths, i, j, klass, len, len1, previousElement, ref, rootElement, selectorWithoutAttrValues, styleValue, tagName, textValue;
        // Extract attribute values before we do anything else.
        // Attribute values might contain spaces, and then we would incorrectly
        // split depths at that space.
        attrValues = [];
        selectorWithoutAttrValues = selector.replace(/\[([\w-]+)(?:=(["'])?([^"'\]]*?)\2)?\]/g, function (_match, attrName, _quote, attrValue) {
            attrValues.push(attrValue || '');
            return "[" + attrName + "]";
        });
        depths = selectorWithoutAttrValues.split(/[ >]+/);
        rootElement = void 0;
        depthElement = void 0;
        previousElement = void 0;
        for (i = 0, len = depths.length; i < len; i++) {
            depthSelector = depths[i];
            tagName = void 0;
            depthSelector = depthSelector.replace(/^[\w-]+/, function (match) {
                tagName = match;
                return '';
            });
            depthElement = document.createElement(tagName || 'div');
            rootElement || (rootElement = depthElement);
            depthSelector = depthSelector.replace(/\#([\w-]+)/, function (_match, id) {
                depthElement.id = id;
                return '';
            });
            depthSelector = depthSelector.replace(/\.([\w-]+)/g, function (_match, className) {
                depthElement.classList.add(className);
                return '';
            });
            // If we have stripped out attrValues at the beginning of the function,
            // they have been replaced with the attribute name only (as "[name]").
            if (attrValues.length) {
                depthSelector = depthSelector.replace(/\[([\w-]+)\]/g, function (_match, attrName) {
                    depthElement.setAttribute(attrName, attrValues.shift());
                    return '';
                });
            }
            if (depthSelector !== '') {
                throw new Error('Cannot parse selector: ' + selector);
            }
            if (previousElement != null) {
                previousElement.appendChild(depthElement);
            }
            previousElement = depthElement;
        }
        if (attrs) {
            if (classValue = u.pluckKey(attrs, 'class')) {
                ref = u.wrapList(classValue);
                for (j = 0, len1 = ref.length; j < len1; j++) {
                    klass = ref[j];
                    rootElement.classList.add(klass);
                }
            }
            if (styleValue = u.pluckKey(attrs, 'style')) {
                setInlineStyle(rootElement, styleValue);
            }
            if (textValue = u.pluckKey(attrs, 'text')) {
                rootElement.innerText = textValue;
            }
            setAttrs(rootElement, attrs);
        }
        return rootElement;
    };
    affix = function (parent, selector, attributes) {
        var element;
        element = createFromSelector(selector, attributes);
        parent.appendChild(element);
        return element;
    };
    toSelector = function (element) {
        var ariaLabel, classes, i, id, klass, len, name, selector, upId;
        if (u.isString(element)) {
            return element;
        }
        // resolveSelector() might be called with jQuery collections
        element = getOne(element);
        selector = void 0;
        if (isSingleton(element)) {
            selector = elementTagName(element);
        }
        else if (upId = element.getAttribute("up-id")) {
            selector = attributeSelector('up-id', upId);
        }
        else if (id = element.getAttribute("id")) {
            if (id.match(/^[a-z0-9\-_]+$/i)) {
                selector = "#" + id;
            }
            else {
                selector = attributeSelector('id', id);
            }
        }
        else if (name = element.getAttribute("name")) {
            selector = elementTagName(element) + attributeSelector('name', name);
        }
        else if (classes = u.presence(nonUpClasses(element))) {
            selector = '';
            for (i = 0, len = classes.length; i < len; i++) {
                klass = classes[i];
                selector += "." + klass;
            }
        }
        else if (ariaLabel = element.getAttribute("aria-label")) {
            selector = attributeSelector('aria-label', ariaLabel);
        }
        else {
            selector = elementTagName(element);
        }
        return selector;
    };
    isSingleton = function (element) {
        return matches(element, 'html, body, head, title');
    };
    elementTagName = function (element) {
        return element.tagName.toLowerCase();
    };
    attributeSelector = function (attribute, value) {
        value = value.replace(/"/g, '\\"');
        return "[" + attribute + "=\"" + value + "\"]";
    };
    nonUpClasses = function (element) {
        var classString, classes;
        classString = element.className;
        classes = u.splitValues(classString);
        return u.reject(classes, function (klass) {
            return klass.match(/^up-/);
        });
    };
    createDocumentFromHtml = function (html) {
        var parser;
        // IE9 cannot set innerHTML on a <html> or <head> element.
        parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    };
    createFromHtml = function (html) {
        var doc;
        doc = createDocumentFromHtml(html);
        return doc.body.children[0];
    };
    getRoot = function () {
        return document.documentElement;
    };
    paint = function (element) {
        return element.offsetHeight;
    };
    concludeCssTransition = function (element) {
        var undo;
        undo = setTemporaryStyle(element, {
            transition: 'none'
        });
        // Browsers need to paint at least one frame without a transition to stop the
        // animation. In theory we could just wait until the next paint, but in case
        // someone will set another transition after us, let's force a repaint here.
        paint(element);
        return undo;
    };
    hasCssTransition = function (elementOrStyleHash) {
        var duration, noTransition, prop, styleHash;
        if (u.isOptions(elementOrStyleHash)) {
            styleHash = elementOrStyleHash;
        }
        else {
            styleHash = computedStyle(elementOrStyleHash);
        }
        prop = styleHash.transitionProperty;
        duration = styleHash.transitionDuration;
        // The default transition for elements is actually "all 0s ease 0s"
        // instead of "none", although that has the same effect as "none".
        noTransition = prop === 'none' || (prop === 'all' && duration === 0);
        return !noTransition;
    };
    fixedToAbsolute = function (element) {
        var elementRectAsFixed, offsetParentRect;
        elementRectAsFixed = element.getBoundingClientRect();
        // Set the position to 'absolute' so it gains an offsetParent
        element.style.position = 'absolute';
        offsetParentRect = element.offsetParent.getBoundingClientRect();
        return setInlineStyle(element, {
            left: elementRectAsFixed.left - computedStyleNumber(element, 'margin-left') - offsetParentRect.left,
            top: elementRectAsFixed.top - computedStyleNumber(element, 'margin-top') - offsetParentRect.top,
            right: '',
            bottom: ''
        });
    };
    setMissingAttrs = function (element, attrs) {
        var key, results, value;
        results = [];
        for (key in attrs) {
            value = attrs[key];
            if (u.isMissing(element.getAttribute(key))) {
                results.push(element.setAttribute(key, value));
            }
            else {
                results.push(void 0);
            }
        }
        return results;
    };
    unwrap = function (wrapper) {
        var parent, wrappedNodes;
        parent = wrapper.parentNode;
        wrappedNodes = u.toArray(wrapper.childNodes);
        u.each(wrappedNodes, function (wrappedNode) {
            return parent.insertBefore(wrappedNode, wrapper);
        });
        return parent.removeChild(wrapper);
    };
    //  ###**
    //  Returns the value of the given attribute on the given element, if the value is [present](/up.util.isPresent).
    //  Returns `undefined` if the attribute is not set, or if it is set to an empty string.
    //  @function up.element.presentAttr
    //  @param {Element} element
    //    The element from which to retrieve the attribute value.
    //  @param {String} attribute
    //    The attribute name.
    //  @return {string|undefined}
    //    The attribute value, if present.
    //  @experimental
    //  ###
    //  presentAttr = (element, attribute) ->
    //    value = element.getAttribute(attribute)
    //    u.presence(value)
    /***
    Returns the value of the given attribute on the given element, cast as a boolean value.
  
    If the attribute value cannot be cast to `true` or `false`, `undefined` is returned.
  
    \#\#\# Casting rules
  
    This function deviates from the
    [HTML Standard for boolean attributes](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)
    in order to allow `undefined` values. When an attribute is missing, Unpoly considers the value to be `undefined`
    (where the standard would assume `false`).
  
    Unpoly also allows `"true"` and `"false"` as attribute values.
  
    The table below shows return values for `up.element.booleanAttr(element, 'foo')` given different elements:
  
    | Element             | Return value |
    |---------------------|--------------|
    | `<div foo>`         | `true`       |
    | `<div foo="foo">`   | `true`       |
    | `<div foo="true">`  | `true`       |
    | `<div foo="">`      | `true`       |
    | `<div foo="false">` | `false`      |
    | `<div>`             | `undefined`  |
    | `<div foo="bar">`   | `undefined`  |
  
    @function up.element.booleanAttr
    @param {Element} element
    The element from which to retrieve the attribute value.
    @param {String} attribute
    The attribute name.
    @return {boolean|undefined}
    The cast attribute value.
    @experimental
     */
    booleanAttr = function (element, attribute, pass) {
        var value;
        value = element.getAttribute(attribute);
        switch (value) {
            case 'false':
                return false;
            case 'true':
            case '':
            case attribute:
                return true;
            default:
                if (pass) {
                    return value;
                }
        }
    };
    booleanOrStringAttr = function (element, attribute) {
        return booleanAttr(element, attribute, true);
    };
    numberAttr = function (element, attribute) {
        var value;
        value = element.getAttribute(attribute);
        if (value != null ? value.match(/^[\d\.]+$/) : void 0) {
            return parseFloat(value);
        }
    };
    jsonAttr = function (element, attribute) {
        var json, ref;
        // The document does not respond to #getAttribute()
        if (json = typeof element.getAttribute === "function" ? (ref = element.getAttribute(attribute)) != null ? ref.trim() : void 0 : void 0) {
            return JSON.parse(json);
        }
    };
    setTemporaryStyle = function (element, newStyles, block) {
        var oldStyles;
        oldStyles = inlineStyle(element, Object.keys(newStyles));
        setInlineStyle(element, newStyles);
        return function () {
            return setInlineStyle(element, oldStyles);
        };
    };
    computedStyle = function (element, props) {
        var style;
        style = window.getComputedStyle(element);
        return extractFromStyleObject(style, props);
    };
    computedStyleNumber = function (element, prop) {
        var rawValue;
        rawValue = computedStyle(element, prop);
        if (u.isGiven(rawValue)) {
            return parseFloat(rawValue);
        }
        else {
            return void 0;
        }
    };
    inlineStyle = function (element, props) {
        var style;
        style = element.style;
        return extractFromStyleObject(style, props);
    };
    extractFromStyleObject = function (style, keyOrKeys) {
        if (u.isString(keyOrKeys)) {
            return style[keyOrKeys];
        }
        else {
            return u.only.apply(u, [style].concat(keyOrKeys));
        }
    };
    setInlineStyle = function (element, props) {
        var key, results, style, value;
        style = element.style;
        results = [];
        for (key in props) {
            value = props[key];
            value = normalizeStyleValueForWrite(key, value);
            results.push(style[key] = value);
        }
        return results;
    };
    normalizeStyleValueForWrite = function (key, value) {
        if (u.isMissing(value)) {
            value = '';
        }
        else if (CSS_LENGTH_PROPS.has(key.toLowerCase().replace(/-/, ''))) {
            value = cssLength(value);
        }
        return value;
    };
    CSS_LENGTH_PROPS = u.arrayToSet(['top', 'right', 'bottom', 'left', 'padding', 'paddingtop', 'paddingright', 'paddingbottom', 'paddingleft', 'margin', 'margintop', 'marginright', 'marginbottom', 'marginleft', 'borderwidth', 'bordertopwidth', 'borderrightwidth', 'borderbottomwidth', 'borderleftwidth', 'width', 'height', 'maxwidth', 'maxheight', 'minwidth', 'minheight']);
    cssLength = function (obj) {
        if (u.isNumber(obj) || (u.isString(obj) && /^\d+$/.test(obj))) {
            return obj.toString() + "px";
        }
        else {
            return obj;
        }
    };
    resolveSelector = function (selectorOrElement, origin) {
        var originSelector, selector;
        if (u.isString(selectorOrElement)) {
            selector = selectorOrElement;
            if (u.contains(selector, '&')) {
                if (u.isPresent(origin)) { // isPresent returns false for empty jQuery collection
                    originSelector = toSelector(origin);
                    selector = selector.replace(/\&/, originSelector);
                }
                else {
                    up.fail("Found origin reference (%s) in selector %s, but no origin was given", '&', selector);
                }
            }
        }
        else {
            selector = toSelector(selectorOrElement);
        }
        return selector;
    };
    isVisible = function (element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    };
    return {
        // also document :has()!
        first: first,
        all: all,
        subtree: subtree,
        closest: closest,
        matches: matches,
        ancestor: ancestor,
        get: getOne,
        list: getList,
        remove: remove,
        toggle: toggle,
        toggleClass: toggleClass,
        hide: hide,
        show: show,
        metaContent: metaContent,
        replace: replace,
        insertBefore: insertBefore,
        createFromSelector: createFromSelector,
        setAttrs: setAttrs,
        affix: affix,
        toSelector: toSelector,
        isSingleton: isSingleton,
        attributeSelector: attributeSelector,
        createDocumentFromHtml: createDocumentFromHtml,
        createFromHtml: createFromHtml,
        root: getRoot,
        paint: paint,
        concludeCssTransition: concludeCssTransition,
        hasCssTransition: hasCssTransition,
        fixedToAbsolute: fixedToAbsolute,
        setMissingAttrs: setMissingAttrs,
        unwrap: unwrap,
        // presentAttr: presentAttr # experimental
        booleanAttr: booleanAttr,
        numberAttr: numberAttr,
        jsonAttr: jsonAttr,
        booleanOrStringAttr: booleanOrStringAttr,
        setTemporaryStyle: setTemporaryStyle,
        style: computedStyle,
        styleNumber: computedStyleNumber,
        inlineStyle: inlineStyle,
        setStyle: setInlineStyle,
        resolveSelector: resolveSelector,
        none: function () {
            return NONE; // internal
        },
        isVisible: isVisible // practical
    };
})();


/***/ }),
/* 6 */
/***/ (function(module, exports) {

var u;
u = up.util;
up.Record = /** @class */ (function () {
    function Record(options) {
        u.assign(this, this.attributes(options));
    }
    Record.prototype.fields = function () {
        throw 'Return an array of property names';
    };
    Record.prototype.attributes = function (source) {
        if (source === void 0) { source = this; }
        return u.only.apply(u, [source].concat(this.fields()));
    };
    Record.prototype["" + u.copy.key] = function () {
        return this.variant();
    };
    Record.prototype.variant = function (changes) {
        if (changes === void 0) { changes = {}; }
        var attributesWithChanges;
        attributesWithChanges = u.merge(this.attributes(), changes);
        return new this.constructor(attributesWithChanges);
    };
    Record.prototype["" + u.isEqual.key] = function (other) {
        return other && (this.constructor === other.constructor) && u.isEqual(this.attributes(), other.attributes());
    };
    return Record;
}());


/***/ }),
/* 7 */
/***/ (function(module, exports) {

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//= require ./record
var e, ref, u, boundMethodCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
} };
u = up.util;
e = up.element;
/***
Instances of `up.Request` normalizes properties of an [`AJAX request`](/up.request)
such as the requested URL, form parameters and HTTP method.

@class up.Request
*/
ref = up.Request = /** @class */ (function (_super) {
    __extends(Request, _super);
    /***
    Creates a new `up.Request` object.
  
    This will not actually send the request over the network. For that use `up.request()`.
  
    @constructor up.Request
    @param {string} attrs.url
    @param {string} [attrs.method='get']
    @param {up.Params|string|Object|Array} [attrs.params]
    @param {string} [attrs.target]
    @param {string} [attrs.failTarget]
    @param {Object<string, string>} [attrs.headers]
    @param {number} [attrs.timeout]
    @internal
    */
    function Request(options) {
        var _this = this;
        up.legacy.fixKey(options, 'data', 'params');
        _this = _super.call(this, options) || this;
        _this.normalize = _this.normalize.bind(_this);
        _this.extractHashFromUrl = _this.extractHashFromUrl.bind(_this);
        _this.transferParamsToUrl = _this.transferParamsToUrl.bind(_this);
        _this.transferSearchToParams = _this.transferSearchToParams.bind(_this);
        _this.isSafe = _this.isSafe.bind(_this);
        _this.send = _this.send.bind(_this);
        _this.navigate = _this.navigate.bind(_this);
        // Returns a csrfToken if this request requires it
        _this.csrfToken = _this.csrfToken.bind(_this);
        _this.isCrossDomain = _this.isCrossDomain.bind(_this);
        _this.buildResponse = _this.buildResponse.bind(_this);
        _this.isCachable = _this.isCachable.bind(_this);
        _this.cacheKey = _this.cacheKey.bind(_this);
        _this.normalize();
        return _this;
    }
    /***
    The HTTP method for the request.
  
    @property up.Request#method
    @param {string} method
    @stable
    */
    /***
    The URL for the request.
  
    @property up.Request#url
    @param {string} url
    @stable
    */
    /***
    [Parameters](/up.Params) that should be sent as the request's payload.
  
    @property up.Request#params
    @param {Object|FormData|string|Array} params
    @stable
    */
    /***
    The CSS selector that will be sent as an [`X-Up-Target` header](/up.protocol#optimizing-responses).
  
    @property up.Request#target
    @param {string} target
    @stable
    */
    /***
    The CSS selector that will be sent as an [`X-Up-Fail-Target` header](/up.protocol#optimizing-responses).
  
    @property up.Request#failTarget
    @param {string} failTarget
    @stable
    */
    /***
    An object of additional HTTP headers.
  
    @property up.Request#headers
    @param {Object} headers
    @stable
    */
    /***
    A timeout in milliseconds.
  
    If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set,
    the timeout will not include the time spent waiting in the queue.
  
    @property up.Request#timeout
    @param {Object|undefined} timeout
    @stable
    */
    Request.prototype.fields = function () {
        return [
            'method',
            'url',
            'params',
            'target',
            'failTarget',
            'headers',
            'timeout',
            'preload',
            'cache' // since up.proxy.request() options are sometimes wrapped in this class
        ];
    };
    Request.prototype.normalize = function () {
        boundMethodCheck(this, ref);
        this.params = new up.Params(this.params); // copies, which we want
        this.method = u.normalizeMethod(this.method);
        this.headers || (this.headers = {});
        this.extractHashFromUrl();
        if (!u.methodAllowsPayload(this.method)) {
            return this.transferParamsToUrl();
        }
    };
    Request.prototype.extractHashFromUrl = function () {
        var urlParts;
        boundMethodCheck(this, ref);
        urlParts = u.parseUrl(this.url);
        // Remember the #hash for later revealing.
        // It will be lost during normalization.
        this.hash = u.presence(urlParts.hash);
        return this.url = u.normalizeUrl(urlParts, {
            hash: false
        });
    };
    Request.prototype.transferParamsToUrl = function () {
        boundMethodCheck(this, ref);
        if (!u.isBlank(this.params)) {
            // GET methods are not allowed to have a payload, so we transfer { params } params to the URL.
            this.url = this.params.toURL(this.url);
            // Now that we have transfered the params into the URL, we delete them from the { params } option.
            return this.params.clear();
        }
    };
    Request.prototype.transferSearchToParams = function () {
        var paramsFromQuery;
        boundMethodCheck(this, ref);
        paramsFromQuery = up.Params.fromURL(this.url);
        if (!u.isBlank(paramsFromQuery)) {
            this.params.addAll(paramsFromQuery);
            return this.url = u.normalizeUrl(this.url, {
                search: false
            });
        }
    };
    Request.prototype.isSafe = function () {
        boundMethodCheck(this, ref);
        return up.proxy.isSafeMethod(this.method);
    };
    Request.prototype.send = function () {
        var _this = this;
        boundMethodCheck(this, ref);
        // We will modify this request below.
        // This would confuse API clients and cache key logic in up.proxy.
        return new Promise(function (resolve, reject) {
            var csrfToken, header, pc, resolveWithResponse, value, xhr, xhrHeaders, xhrMethod, xhrParams, xhrPayload, xhrUrl;
            xhr = new XMLHttpRequest();
            xhrHeaders = u.copy(_this.headers);
            xhrUrl = _this.url;
            xhrParams = u.copy(_this.params);
            xhrMethod = up.proxy.wrapMethod(_this.method, xhrParams);
            xhrPayload = null;
            if (!u.isBlank(xhrParams)) {
                delete xhrHeaders['Content-Type'];
                xhrPayload = xhrParams.toFormData();
            }
            pc = up.protocol.config;
            if (_this.target) {
                xhrHeaders[pc.targetHeader] = _this.target;
            }
            if (_this.failTarget) {
                xhrHeaders[pc.failTargetHeader] = _this.failTarget;
            }
            if (!_this.isCrossDomain()) {
                xhrHeaders['X-Requested-With'] || (xhrHeaders['X-Requested-With'] = 'XMLHttpRequest');
            }
            if (csrfToken = _this.csrfToken()) {
                xhrHeaders[pc.csrfHeader] = csrfToken;
            }
            xhr.open(xhrMethod, xhrUrl);
            for (header in xhrHeaders) {
                value = xhrHeaders[header];
                xhr.setRequestHeader(header, value);
            }
            resolveWithResponse = function () {
                var response;
                response = _this.buildResponse(xhr);
                if (response.isSuccess()) {
                    return resolve(response);
                }
                else {
                    return reject(response);
                }
            };
            // Convert from XHR API to promise API
            xhr.onload = resolveWithResponse;
            xhr.onerror = resolveWithResponse;
            xhr.ontimeout = resolveWithResponse;
            if (_this.timeout) {
                xhr.timeout = _this.timeout;
            }
            return xhr.send(xhrPayload);
        });
    };
    Request.prototype.navigate = function () {
        var addField, csrfParam, csrfToken, form, formMethod;
        boundMethodCheck(this, ref);
        // GET forms cannot have an URL with a query section in their [action] attribute.
        // The query section would be overridden by the serialized input values on submission.
        this.transferSearchToParams();
        form = e.affix(document.body, 'form.up-page-loader');
        addField = function (attrs) {
            return e.affix(form, 'input[type=hidden]', attrs);
        };
        if (this.method === 'GET') {
            formMethod = 'GET';
        }
        else {
            // Browser forms can only have GET or POST methods.
            // When we want to make a request with another method, most backend
            // frameworks allow to pass the method as a param.
            addField({
                name: up.protocol.config.methodParam,
                value: this.method
            });
            formMethod = 'POST';
        }
        e.setAttrs(form, {
            method: formMethod,
            action: this.url
        });
        if ((csrfParam = up.protocol.csrfParam()) && (csrfToken = this.csrfToken())) {
            addField({
                name: csrfParam,
                value: csrfToken
            });
        }
        // @params will be undefined for GET requests, since we have already
        // transfered all params to the URL during normalize().
        u.each(this.params.toArray(), addField);
        e.hide(form);
        return up.browser.submitForm(form);
    };
    Request.prototype.csrfToken = function () {
        boundMethodCheck(this, ref);
        if (!this.isSafe() && !this.isCrossDomain()) {
            return up.protocol.csrfToken();
        }
    };
    Request.prototype.isCrossDomain = function () {
        boundMethodCheck(this, ref);
        return u.isCrossDomain(this.url);
    };
    Request.prototype.buildResponse = function (xhr) {
        var ref1, responseAttrs, urlFromServer;
        boundMethodCheck(this, ref);
        responseAttrs = {
            method: this.method,
            url: this.url,
            text: xhr.responseText,
            status: xhr.status,
            request: this,
            xhr: xhr
        };
        if (urlFromServer = up.protocol.locationFromXhr(xhr)) {
            responseAttrs.url = urlFromServer;
            // If the server changes a URL, it is expected to signal a new method as well.
            responseAttrs.method = (ref1 = up.protocol.methodFromXhr(xhr)) != null ? ref1 : 'GET';
        }
        responseAttrs.title = up.protocol.titleFromXhr(xhr);
        return new up.Response(responseAttrs);
    };
    Request.prototype.isCachable = function () {
        boundMethodCheck(this, ref);
        return this.isSafe() && !u.isFormData(this.params);
    };
    Request.prototype.cacheKey = function () {
        boundMethodCheck(this, ref);
        return [this.url, this.method, this.params.toQuery(), this.target].join('|');
    };
    Request.wrap = function (value) {
        return u.wrapValue(value, this);
    };
    return Request;
}(up.Record));


/***/ }),
/* 8 */
/***/ (function(module, exports) {

var u;
u = up.util;
up.Config = /** @class */ (function () {
    function Config(blueprint) {
        this.blueprint = blueprint;
        this.reset();
    }
    Config.prototype.reset = function () {
        return u.assign(this, u.deepCopy(this.blueprint));
    };
    return Config;
}());


/***/ }),
/* 9 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
/***
The `up.Params` class offers a consistent API to read and manipulate request parameters
independent of their type.

Request parameters are used in [form submissions](/up.Params#fromForm) and
[URLs](/up.Params#fromURL). Methods like `up.submit()` or `up.replace()` accept
request parameters as a `{ params }` option.

\#\#\# Supported parameter types

The following types of parameter representation are supported:

1. An object like `{ email: 'foo@bar.com' }`
2. A query string like `'email=foo%40bar.com'`
3. An array of `{ name, value }` objects like `[{ name: 'email', value: 'foo@bar.com' }]`
4. A [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.
   On IE 11 and Edge, `FormData` payloads require a [polyfill for `FormData#entries()`](https://github.com/jimmywarting/FormData).

@class up.Params
*/
up.Params = /** @class */ (function () {
    /***
    Constructs a new `up.Params` instance.
  
    @constructor up.Params
    @param {Object|Array|string|up.Params} [params]
      An existing list of params with which to initialize the new `up.Params` object.
  
      The given params value may be of any [supported type](/up.Params).
    @return {up.Params}
    @experimental
    */
    function Params(raw) {
        this.arrayEntryToQuery = this.arrayEntryToQuery.bind(this);
        this.clear();
        this.addAll(raw);
    }
    /***
    Removes all params from this object.
  
    @method up.Params#clear
    @experimental
    */
    Params.prototype.clear = function () {
        return this.entries = [];
    };
    Params.prototype["" + u.copy.key] = function () {
        return new up.Params(this);
    };
    /***
    Returns an object representation of this `up.Params` instance.
  
    The returned value is a simple JavaScript object with properties
    that correspond to the key/values in the given `params`.
  
    \#\#\# Example
  
    var params = new up.Params('foo=bar&baz=bam')
    var object = params.toObject()
  
    // object is now: {
    //   foo: 'bar',
    //   baz: 'bam'
    // ]
  
    @function up.Params#toObject
    @return {Object}
    @experimental
    */
    Params.prototype.toObject = function () {
        var entry, i, len, name, obj, ref, value;
        obj = {};
        ref = this.entries;
        for (i = 0, len = ref.length; i < len; i++) {
            entry = ref[i];
            (name = entry.name, value = entry.value);
            if (!u.isBasicObjectProperty(name)) {
                if (this.isArrayKey(name)) {
                    obj[name] || (obj[name] = []);
                    obj[name].push(value);
                }
                else {
                    obj[name] = value;
                }
            }
        }
        return obj;
    };
    /***
    Returns an array representation of this `up.Params` instance.
  
    The returned value is a JavaScript array with elements that are objects with
    `{ key }` and `{ value }` properties.
  
    \#\#\# Example
  
    var params = new up.Params('foo=bar&baz=bam')
    var array = params.toArray()
  
    // array is now: [
    //   { name: 'foo', value: 'bar' },
    //   { name: 'baz', value: 'bam' }
    // ]
  
    @function up.Params#toArray
    @return {Array}
    @experimental
    */
    Params.prototype.toArray = function () {
        return this.entries;
    };
    /***
    Returns a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation
    of this `up.Params` instance.
  
    \#\#\# Example
  
    var params = new up.Params('foo=bar&baz=bam')
    var formData = params.toFormData()
  
    formData.get('foo') // 'bar'
    formData.get('baz') // 'bam'
  
    @function up.Params#toFormData
    @return {FormData}
    @experimental
    */
    Params.prototype.toFormData = function () {
        var entry, formData, i, len, ref;
        formData = new FormData();
        ref = this.entries;
        for (i = 0, len = ref.length; i < len; i++) {
            entry = ref[i];
            formData.append(entry.name, entry.value);
        }
        return formData;
    };
    /***
    Returns an [query string](https://en.wikipedia.org/wiki/Query_string) for this `up.Params` instance.
  
    The keys and values in the returned query string will be [percent-encoded](https://developer.mozilla.org/en-US/docs/Glossary/percent-encoding).
    Non-primitive values (like [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) will be omitted from
    the retuned query string.
  
    \#\#\# Example
  
    var params = new up.Params({ foo: 'bar', baz: 'bam' })
    var query = params.toQuery()
  
    // query is now: 'foo=bar&baz=bam'
  
    @function up.Params#toQuery
    @param {Object|FormData|string|Array|undefined} params
    the params to convert
    @return {string}
    a query string built from the given params
    @experimental
    */
    Params.prototype.toQuery = function () {
        var parts;
        parts = u.map(this.entries, this.arrayEntryToQuery);
        parts = u.compact(parts);
        return parts.join('&');
    };
    Params.prototype.arrayEntryToQuery = function (entry) {
        var query, value;
        value = entry.value;
        if (!this.isPrimitiveValue(value)) {
            return void 0;
        }
        query = encodeURIComponent(entry.name);
        // There is a subtle difference when encoding blank values:
        // 1. An undefined or null value is encoded to `key` with no equals sign
        // 2. An empty string value is encoded to `key=` with an equals sign but no value
        if (u.isGiven(value)) {
            query += "=";
            query += encodeURIComponent(value);
        }
        return query;
    };
    /***
    Returns whether the given value can be encoded into a query string.
  
    We will have `File` values in our params when we serialize a form with a file input.
    These entries will be filtered out when converting to a query string.
  
    @function up.Params#isPrimitiveValue
    @internal
    */
    Params.prototype.isPrimitiveValue = function (value) {
        return u.isMissing(value) || u.isString(value) || u.isNumber(value) || u.isBoolean(value);
    };
    /***
    Builds an URL string from the given base URL and
    this `up.Params` instance as a [query string](/up.Params.toString).
  
    The base URL may or may not already contain a query string. The
    additional query string will be joined with an `&` or `?` character accordingly.
  
    @function up.Params#toURL
    @param {string} base
    The base URL that will be prepended to this `up.Params` object as a [query string](/up.Params.toString).
    @return {string}
    The built URL.
    @experimental
    */
    Params.prototype.toURL = function (base) {
        var parts, separator;
        parts = [base, this.toQuery()];
        parts = u.filter(parts, u.isPresent);
        separator = u.contains(base, '?') ? '&' : '?';
        return parts.join(separator);
    };
    /***
    Adds a new entry with the given `name` and `value`.
  
    An `up.Params` instance can hold multiple entries with the same name.
    To overwrite all existing entries with the given `name`, use `up.Params#set()` instead.
  
    \#\#\# Example
  
    var params = new up.Params()
    params.add('foo', 'fooValue')
  
    var foo = params.get('foo')
    // foo is now 'fooValue'
  
    @function up.Params#add
    @param {string} name
    The name of the new entry.
    @param {any} value
    The value of the new entry.
    @experimental
    */
    Params.prototype.add = function (name, value) {
        return this.entries.push({ name: name, value: value });
    };
    /***
    Adds all entries from the given list of params.
  
    The given params value may be of any [supported type](/up.Params).
  
    @function up.Params#addAll
    @param {Object|Array|string|up.Params|undefined} params
    @experimental
    */
    Params.prototype.addAll = function (raw) {
        var _a, _b;
        if (u.isMissing(raw)) {
            // no-op
        }
        else if (raw instanceof this.constructor) {
            return (_a = this.entries).push.apply(_a, raw.entries);
        }
        else if (u.isArray(raw)) {
            // internal use for copying
            return (_b = this.entries).push.apply(_b, raw);
        }
        else if (u.isString(raw)) {
            return this.addAllFromQuery(raw);
        }
        else if (u.isFormData(raw)) {
            return this.addAllFromFormData(raw);
        }
        else if (u.isObject(raw)) {
            return this.addAllFromObject(raw);
        }
        else {
            return up.fail("Unsupport params type: %o", raw);
        }
    };
    Params.prototype.addAllFromObject = function (object) {
        var key, results, value, valueElement, valueElements;
        results = [];
        for (key in object) {
            value = object[key];
            valueElements = u.isArray(value) ? value : [value];
            results.push((function () {
                var i, len, results1;
                results1 = [];
                for (i = 0, len = valueElements.length; i < len; i++) {
                    valueElement = valueElements[i];
                    results1.push(this.add(key, valueElement));
                }
                return results1;
            }).call(this));
        }
        return results;
    };
    Params.prototype.addAllFromQuery = function (query) {
        var _a;
        var i, len, name, part, ref, results, value;
        ref = query.split('&');
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
            part = ref[i];
            if (part) {
                _a = part.split('='), name = _a[0], value = _a[1];
                name = decodeURIComponent(name);
                // There are three forms we need to handle:
                // (1) foo=bar should become { name: 'foo', bar: 'bar' }
                // (2) foo=    should become { name: 'foo', bar: '' }
                // (3) foo     should become { name: 'foo', bar: null }
                if (u.isGiven(value)) {
                    value = decodeURIComponent(value);
                }
                else {
                    value = null;
                }
                results.push(this.add(name, value));
            }
            else {
                results.push(void 0);
            }
        }
        return results;
    };
    Params.prototype.addAllFromFormData = function (formData) {
        var _this = this;
        return u.eachIterator(formData.entries(), function (value) {
            return _this.add.apply(_this, value);
        });
    };
    /***
    Sets the `value` for the entry with given `name`.
  
    An `up.Params` instance can hold multiple entries with the same name.
    All existing entries with the given `name` are [deleted](/up.Params#delete) before the
    new entry is set. To add a new entry even if the `name` is taken, use `up.Params#add()`.
  
    @function up.Params#set
    @param {string} name
      The name of the entry to set.
    @param {any} value
      The new value of the entry.
    @experimental
    */
    Params.prototype.set = function (name, value) {
        this.delete(name);
        return this.add(name, value);
    };
    /***
    Deletes all entries with the given `name`.
  
    @function up.Params#delete
    @param {string} name
    @experimental
    */
    Params.prototype.delete = function (name) {
        return this.entries = u.reject(this.entries, this.matchEntryFn(name));
    };
    Params.prototype.matchEntryFn = function (name) {
        return function (entry) {
            return entry.name === name;
        };
    };
    /***
    Returns the first param value with the given `name` from the given `params`.
  
    Returns `undefined` if no param value with that name is set.
  
    If the `name` denotes an array field (e.g. `foo[]`), *all* param values with the given `name`
    are returned as an array. If no param value with that array name is set, an empty
    array is returned.
  
    To always return a single value use `up.Params#getFirst()` instead.
    To always return an array of values use `up.Params#getAll()` instead.
  
    \#\#\# Example
  
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
  
    @function up.Params#get
    @param {string} name
    @experimental
    */
    Params.prototype.get = function (name) {
        if (this.isArrayKey(name)) {
            return this.getAll(name);
        }
        else {
            return this.getFirst(name);
        }
    };
    /***
    Returns the first param value with the given `name`.
  
    Returns `undefined` if no param value with that name is set.
  
    @function up.Params#getFirst
    @param {string} name
    @return {any}
      The value of the param with the given name.
    */
    Params.prototype.getFirst = function (name) {
        var entry;
        entry = u.find(this.entries, this.matchEntryFn(name));
        return entry != null ? entry.value : void 0;
    };
    /***
    Returns an array of all param values with the given `name`.
  
    Returns an empty array if no param value with that name is set.
  
    @function up.Params#getAll
    @param {string} name
    @return {Array}
    An array of all values with the given name.
    */
    Params.prototype.getAll = function (name) {
        var entries;
        if (this.isArrayKey(name)) {
            return this.getAll(name);
        }
        else {
            entries = u.map(this.entries, this.matchEntryFn(name));
            return u.map(entries, 'value');
        }
    };
    Params.prototype.isArrayKey = function (key) {
        return u.endsWith(key, '[]');
    };
    Params.prototype["" + u.isBlank.key] = function () {
        return this.entries.length === 0;
    };
    /***
    Constructs a new `up.Params` instance from the given `<form>`.
  
    The returned params may be passed as `{ params }` option to
    [`up.request()`](/up.request) or [`up.replace()`](/up.replace).
  
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
    - The serialized params will include the form's submit button, if that
    button as a `name` attribute.
  
    \#\#\# Example
  
    Given this HTML form:
  
    <form>
      <input type="text" name="email" value="foo@bar.com">
      <input type="password" name="pass" value="secret">
    </form>
  
    This would serialize the form into an array representation:
  
    var params = up.Params.fromForm('input[name=email]')
    var email = params.get('email') // email is now 'foo@bar.com'
    var pass = params.get('pass') // pass is now 'secret'
  
    @function up.Params.fromForm
    @param {Element|jQuery|string} form
    A `<form>` element or a selector that matches a `<form>` element.
    @return {up.Params}
    A new `up.Params` instance with values from the given form.
    @experimental
    */
    Params.fromForm = function (form) {
        var fields;
        if (form = e.get(form)) {
            fields = up.form.submissionFields(form);
            return this.fromFields(fields);
        }
    };
    /***
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
    Params.fromFields = function (fields) {
        var field, i, len, params, ref;
        params = new this();
        ref = u.wrapList(fields);
        for (i = 0, len = ref.length; i < len; i++) {
            field = ref[i];
            params.addField(field);
        }
        return params;
    };
    /***
    Adds params from the given [HTML form field](https://www.w3schools.com/html/html_form_elements.asp).
  
    The added params will include exactly those form values that would be
    included for the given field in a regular form submission. If the given field wouldn't
    submit a value (like an unchecked `<input type="checkbox">`, nothing will be added.
  
    See `up.Params.fromForm()` for more details and examples.
  
    @function up.Params#addField
    @param {Element|jQuery} field
    @experimental
    */
    Params.prototype.addField = function (field) {
        var file, i, j, len, len1, name, option, params, ref, ref1, results, results1, tagName, type;
        params = new this.constructor();
        if ((field = e.get(field)) && (name = field.name) && (!field.disabled)) {
            tagName = field.tagName;
            type = field.type;
            if (tagName === 'SELECT') {
                ref = field.querySelectorAll('option');
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    option = ref[i];
                    if (option.selected) {
                        results.push(this.add(name, option.value));
                    }
                    else {
                        results.push(void 0);
                    }
                }
                return results;
            }
            else if (type === 'checkbox' || type === 'radio') {
                if (field.checked) {
                    return this.add(name, field.value);
                }
            }
            else if (type === 'file') {
                ref1 = field.files;
                // The value of an input[type=file] is the local path displayed in the form.
                // The actual File objects are in the #files property.
                results1 = [];
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                    file = ref1[j];
                    results1.push(this.add(name, file));
                }
                return results1;
            }
            else {
                return this.add(name, field.value);
            }
        }
    };
    Params.prototype["" + u.isEqual.key] = function (other) {
        return other && (this.constructor === other.constructor) && u.isEqual(this.entries, other.entries);
    };
    /***
    Constructs a new `up.Params` instance from the given URL's
    [query string](https://en.wikipedia.org/wiki/Query_string).
  
    Constructs an empty `up.Params` instance if the given URL has no query string.
  
    \#\#\# Example
  
    var params = up.Params.fromURL('http://foo.com?foo=fooValue&bar=barValue')
    var foo = params.get('foo')
    // foo is now: 'fooValue'
  
    @function up.Params.fromURL
    @param {string} url
    The URL from which to extract the query string.
    @return {string|undefined}
    The given URL's query string, or `undefined` if the URL has no query component.
    @experimental
    */
    Params.fromURL = function (url) {
        var params, query, urlParts;
        params = new this();
        urlParts = u.parseUrl(url);
        if (query = urlParts.search) {
            query = query.replace(/^\?/, '');
            params.addAll(query);
        }
        return params;
    };
    /***
    Returns the given URL without its [query string](https://en.wikipedia.org/wiki/Query_string).
  
    \#\#\# Example
  
    var url = up.Params.stripURL('http://foo.com?key=value')
    // url is now: 'http://foo.com'
  
    @function up.Params.stripURL
    @param {string} url
    A URL (with or without a query string).
    @return {string}
    The given URL without its query string.
    @experimental
    */
    Params.stripURL = function (url) {
        return u.normalizeUrl(url, {
            search: false
        });
    };
    /***
    If passed an `up.Params` instance, it is returned unchanged.
    Otherwise constructs an `up.Params` instance from the given value.
  
    The given params value may be of any [supported type](/up.Params)
    The return value is always an `up.Params` instance.
  
    @function up.Params.wrap
    @param {Object|Array|string|up.Params|undefined} params
    @return {up.Params}
    */
    Params.wrap = function (value) {
        return u.wrapValue(value, this);
    };
    return Params;
}());


/***/ }),
/* 10 */
/***/ (function(module, exports) {

var e;
e = up.element;
up.RevealMotion = /** @class */ (function () {
    function RevealMotion(element, options) {
        if (options === void 0) { options = {}; }
        var layoutConfig, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, snapDefault;
        this.element = element;
        layoutConfig = up.viewport.config;
        this.viewport = (ref = options.viewport) != null ? ref : up.viewport.closest(this.element);
        up.legacy.fixKey(layoutConfig, 'snap', 'revealSnap');
        snapDefault = layoutConfig.revealSnap;
        this.snap = (ref1 = (ref2 = options.snap) != null ? ref2 : options.revealSnap) != null ? ref1 : snapDefault;
        if (this.snap === false) {
            this.snap = 0;
        }
        else if (this.snap === true) {
            this.snap = snapDefault;
        }
        this.padding = (ref3 = (ref4 = options.padding) != null ? ref4 : options.revealPadding) != null ? ref3 : layoutConfig.revealPadding;
        this.top = options.top;
        this.fixedTop = (ref5 = options.fixedTop) != null ? ref5 : layoutConfig.fixedTop;
        this.fixedBottom = (ref6 = options.fixedBottom) != null ? ref6 : layoutConfig.fixedBottom;
        // Options for up.ScrollMotion
        this.speed = (ref7 = (ref8 = options.speed) != null ? ref8 : options.scrollSpeed) != null ? ref7 : layoutConfig.scrollSpeed;
        this.behavior = (ref9 = options.behavior) != null ? ref9 : options.scrollBehavior;
    }
    RevealMotion.prototype.start = function () {
        var diff, elementRect, newScrollTop, originalScrollTop, viewportRect;
        elementRect = up.Rect.fromElement(this.element);
        viewportRect = this.getViewportRect(this.viewport);
        this.addPadding(elementRect);
        this.substractObstructions(viewportRect);
        if (viewportRect.height <= 0) {
            return Promise.reject(new Error('Viewport has no visible area'));
        }
        originalScrollTop = this.viewport.scrollTop;
        newScrollTop = originalScrollTop;
        if (this.top || elementRect.height > viewportRect.height) {
            // Element is either larger than the viewport,
            // or the user has explicitely requested for the element to align at top
            // => Scroll the viewport so the first element row is the first viewport row
            diff = elementRect.top - viewportRect.top;
            newScrollTop += diff;
        }
        else if (elementRect.top < viewportRect.top) {
            // Element fits within viewport, but sits too high
            // => Scroll up (reduce scrollY), so the element comes down
            newScrollTop -= viewportRect.top - elementRect.top;
        }
        else if (elementRect.bottom > viewportRect.bottom) {
            // Element fits within viewport, but sits too low
            // => Scroll down (increase scrollY), so the element comes up
            newScrollTop += elementRect.bottom - viewportRect.bottom;
        }
        else {
        }
        // Element is fully visible within viewport
        // => Do nothing
        if (newScrollTop < this.snap && elementRect.top < (0.5 * viewportRect.height)) {
            newScrollTop = 0;
        }
        if (newScrollTop !== originalScrollTop) {
            return this.scrollTo(newScrollTop);
        }
        else {
            return Promise.resolve();
        }
    };
    RevealMotion.prototype.scrollTo = function (newScrollTop) {
        var scrollOptions;
        scrollOptions = {
            speed: this.speed,
            behavior: this.behavior
        };
        this.scrollMotion = new up.ScrollMotion(this.viewport, newScrollTop, scrollOptions);
        return this.scrollMotion.start();
    };
    RevealMotion.prototype.getViewportRect = function () {
        if (up.viewport.isRoot(this.viewport)) {
            // Other than an element with overflow-y, the document viewport
            // stretches to the full height of its contents. So we create a viewport
            // sized to the usuable screen area.
            return new up.Rect({
                left: 0,
                top: 0,
                width: up.viewport.rootWidth(),
                height: up.viewport.rootHeight()
            });
        }
        else {
            return up.Rect.fromElement(this.viewport);
        }
    };
    RevealMotion.prototype.addPadding = function (elementRect) {
        elementRect.top -= this.padding;
        return elementRect.height += 2 * this.padding;
    };
    RevealMotion.prototype.substractObstructions = function (viewportRect) {
        var diff, i, j, len, len1, obstruction, obstructionRect, ref, ref1, results;
        ref = e.list.apply(e, this.fixedTop);
        for (i = 0, len = ref.length; i < len; i++) {
            obstruction = ref[i];
            obstructionRect = up.Rect.fromElement(obstruction);
            diff = obstructionRect.bottom - viewportRect.top;
            if (diff > 0) {
                viewportRect.top += diff;
                viewportRect.height -= diff;
            }
        }
        ref1 = e.list.apply(e, this.fixedBottom);
        results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
            obstruction = ref1[j];
            obstructionRect = up.Rect.fromElement(obstruction);
            diff = viewportRect.bottom - obstructionRect.top;
            if (diff > 0) {
                results.push(viewportRect.height -= diff);
            }
            else {
                results.push(void 0);
            }
        }
        return results;
    };
    RevealMotion.prototype.finish = function () {
        var ref;
        return (ref = this.scrollMotion) != null ? ref.finish() : void 0;
    };
    return RevealMotion;
}());


/***/ }),
/* 11 */
/***/ (function(module, exports) {

var e;
e = up.element;
// Gives `<body>` a right padding in the width of a scrollbar.
// Also gives elements anchored to the right side of the screen
// an increased `right`.
// This is to prevent the body and elements from jumping when we add the
// modal overlay, which has its own scroll bar.
// This is screwed up, but Bootstrap does the same.
up.BodyShifter = /** @class */ (function () {
    function BodyShifter() {
        this.unshiftFns = [];
    }
    BodyShifter.prototype.shift = function () {
        var anchor, body, bodyRightPadding, bodyRightShift, elementRight, elementRightShift, i, len, overflowElement, ref, results, scrollbarWidth;
        if (!up.viewport.rootHasVerticalScrollbar()) {
            return;
        }
        body = document.body;
        overflowElement = up.viewport.rootOverflowElement();
        scrollbarWidth = up.viewport.scrollbarWidth();
        bodyRightPadding = e.styleNumber(body, 'paddingRight');
        bodyRightShift = scrollbarWidth + bodyRightPadding;
        this.unshiftFns.push(e.setTemporaryStyle(body, {
            paddingRight: bodyRightShift
        }));
        this.unshiftFns.push(e.setTemporaryStyle(overflowElement, {
            overflowY: 'hidden'
        }));
        ref = up.viewport.anchoredRight();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
            anchor = ref[i];
            elementRight = e.styleNumber(anchor, 'right');
            elementRightShift = scrollbarWidth + elementRight;
            results.push(this.unshiftFns.push(e.setTemporaryStyle(anchor, {
                right: elementRightShift
            })));
        }
        return results;
    };
    BodyShifter.prototype.unshift = function () {
        var results, unshiftFn;
        results = [];
        while (unshiftFn = this.unshiftFns.pop()) {
            results.push(unshiftFn());
        }
        return results;
    };
    return BodyShifter;
}());


/***/ }),
/* 12 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.Tether = /** @class */ (function () {
    function Tether(options) {
        var _a;
        this.scheduleSync = this.scheduleSync.bind(this);
        this.sync = this.sync.bind(this);
        this.anchor = options.anchor;
        _a = options.position.split('-'), this.position = _a[0], this.align = _a[1];
        if (this.align) {
            up.legacy.warn('The position value %o is deprecated. Use %o instead.', options.position, this.describeConstraints());
        }
        else {
            this.align = options.align;
        }
        this.alignAxis = this.position === 'top' || this.position === 'bottom' ? 'horizontal' : 'vertical';
        this.viewport = up.viewport.closest(this.anchor);
        // The document viewport is <html> on some browsers, and we cannot attach children to that.
        this.parent = this.viewport === e.root() ? document.body : this.viewport;
        // If the offsetParent is within the viewport (or is the viewport)
        // we can simply absolutely position it and it will move as the viewport scrolls.
        // If not however, we have no choice but to move it on every scroll event.
        this.syncOnScroll = !this.viewport.contains(this.anchor.offsetParent);
        this.root = e.affix(this.parent, '.up-bounds');
        this.setBoundsOffset(0, 0);
        this.changeEventSubscription('on');
    }
    Tether.prototype.destroy = function () {
        e.remove(this.root);
        return this.changeEventSubscription('off');
    };
    Tether.prototype.changeEventSubscription = function (fn) {
        up[fn](window, 'resize', this.scheduleSync);
        if (this.syncOnScroll) {
            return up[fn](this.viewport, 'scroll', this.scheduleSync);
        }
    };
    Tether.prototype.scheduleSync = function () {
        clearTimeout(this.syncTimer);
        return this.syncTimer = u.task(this.sync);
    };
    Tether.prototype.sync = function () {
        var anchorBox, left, rootBox, top;
        rootBox = this.root.getBoundingClientRect();
        anchorBox = this.anchor.getBoundingClientRect();
        left = void 0;
        top = void 0;
        switch (this.alignAxis) {
            case 'horizontal':
                top = (function () {
                    switch (this.position) {
                        case 'top':
                            return anchorBox.top - rootBox.height;
                        case 'bottom':
                            return anchorBox.top + anchorBox.height;
                    }
                }).call(this);
                left = (function () {
                    switch (this.align) {
                        case 'left':
                            // anchored to anchor's left, grows to the right
                            return anchorBox.left;
                        case 'center':
                            // anchored to anchor's horizontal center, grows equally to left/right
                            return anchorBox.left + 0.5 * (anchorBox.width - rootBox.width);
                        case 'right':
                            // anchored to anchor's right, grows to the left
                            return anchorBox.left + anchorBox.width - rootBox.width;
                    }
                }).call(this);
                break;
            case 'vertical':
                top = (function () {
                    switch (this.align) {
                        case 'top':
                            // anchored to the top, grows to the bottom
                            return anchorBox.top;
                        case 'center':
                            // anchored to anchor's vertical center, grows equally to left/right
                            return anchorBox.top + 0.5 * (anchorBox.height - rootBox.height);
                        case 'bottom':
                            // anchored to the bottom, grows to the top
                            return anchorBox.top + anchorBox.height - rootBox.height;
                    }
                }).call(this);
                left = (function () {
                    switch (this.position) {
                        case 'left':
                            return anchorBox.left - rootBox.width;
                        case 'right':
                            return anchorBox.left + anchorBox.width;
                    }
                }).call(this);
        }
        if (u.isDefined(left) || u.isDefined(top)) {
            return this.moveTo(left, top);
        }
        else {
            return up.fail('Invalid tether constraints: %o', this.describeConstraints());
        }
    };
    Tether.prototype.describeConstraints = function () {
        return { position: this.position, align: this.align };
    };
    Tether.prototype.moveTo = function (targetLeft, targetTop) {
        var rootBox;
        rootBox = this.root.getBoundingClientRect();
        return this.setBoundsOffset(targetLeft - rootBox.left + this.offsetLeft, targetTop - rootBox.top + this.offsetTop);
    };
    Tether.prototype.setBoundsOffset = function (left, top) {
        this.offsetLeft = left;
        this.offsetTop = top;
        return e.setStyle(this.root, { left: left, top: top });
    };
    return Tether;
}());


/***/ }),
/* 13 */
/***/ (function(module, exports) {

//= require ./record
var e, u;
u = up.util;
e = up.element;
up.CompilePass = /** @class */ (function () {
    function CompilePass(root, compilers, options) {
        if (options === void 0) { options = {}; }
        this.isInSkippedSubtree = this.isInSkippedSubtree.bind(this);
        this.root = root;
        this.compilers = compilers;
        // Exclude all elements that are descendants of the subtrees we want to keep.
        // The exclusion process is very expensive (in one case compiling 100 slements
        // took 1.5s because of this). That's why we only do it if (1) options.skipSubtrees
        // was given and (2) there is an [up-keep] element in root.
        this.skipSubtrees = options.skip;
        if (!(this.skipSubtrees.length && this.root.querySelector('[up-keep]'))) {
            this.skipSubtrees = void 0;
        }
    }
    CompilePass.prototype.compile = function () {
        var _this = this;
        return up.log.group("Compiling fragment %o", this.root, function () {
            var compiler, i, len, ref, results;
            ref = _this.compilers;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
                compiler = ref[i];
                results.push(_this.runCompiler(compiler));
            }
            return results;
        });
    };
    CompilePass.prototype.runCompiler = function (compiler) {
        var _this = this;
        var matches;
        matches = this.select(compiler.selector);
        if (!matches.length) {
            return;
        }
        return up.log.group((!compiler.isDefault ? "Compiling '%s' on %d element(s)" : void 0), compiler.selector, matches.length, function () {
            var i, j, keepValue, len, len1, match, results, value;
            if (compiler.batch) {
                _this.compileBatch(compiler, matches);
            }
            else {
                for (i = 0, len = matches.length; i < len; i++) {
                    match = matches[i];
                    _this.compileOneElement(compiler, match);
                }
            }
            // up.compiler() has a legacy { keep } option that will automatically
            // set [up-keep] on the elements it compiles
            if (keepValue = compiler.keep) {
                value = u.isString(keepValue) ? keepValue : '';
                results = [];
                for (j = 0, len1 = matches.length; j < len1; j++) {
                    match = matches[j];
                    results.push(match.setAttribute('up-keep', value));
                }
                return results;
            }
        });
    };
    CompilePass.prototype.compileOneElement = function (compiler, element) {
        var compileArgs, data, destructorOrDestructors, elementArg, result;
        elementArg = compiler.jQuery ? up.browser.jQuery(element) : element;
        compileArgs = [elementArg];
        // Do not retrieve and parse [up-data] unless the compiler function
        // expects a second argument. Note that we must pass data for an argument
        // count of 0, since then the function might take varargs.
        if (compiler.length !== 1) {
            data = up.syntax.data(element);
            compileArgs.push(data);
        }
        result = compiler.apply(element, compileArgs);
        if (destructorOrDestructors = this.destructorPresence(result)) {
            return up.destructor(element, destructorOrDestructors);
        }
    };
    CompilePass.prototype.compileBatch = function (compiler, elements) {
        var compileArgs, dataList, elementsArgs, result;
        elementsArgs = compiler.jQuery ? up.browser.jQuery(elements) : elements;
        compileArgs = [elementsArgs];
        // Do not retrieve and parse [up-data] unless the compiler function
        // expects a second argument. Note that we must pass data for an argument
        // count of 0, since then the function might take varargs.
        if (compiler.length !== 1) {
            dataList = u.map(elements, up.syntax.data);
            compileArgs.push(dataList);
        }
        result = compiler.apply(elements, compileArgs);
        if (this.destructorPresence(result)) {
            return up.fail('Compilers with { batch: true } cannot return destructors');
        }
    };
    CompilePass.prototype.destructorPresence = function (result) {
        // Check if the result value looks like a destructor to filter out
        // unwanted implicit returns in CoffeeScript.
        if (u.isFunction(result) || u.isArray(result) && (u.every(result, u.isFunction))) {
            return result;
        }
    };
    CompilePass.prototype.select = function (selector) {
        var matches;
        if (u.isFunction(selector)) {
            selector = selector();
        }
        matches = e.subtree(this.root, selector);
        if (this.skipSubtrees) {
            matches = u.reject(matches, this.isInSkippedSubtree);
        }
        return matches;
    };
    CompilePass.prototype.isInSkippedSubtree = function (element) {
        var parent;
        if (u.contains(this.skipSubtrees, element)) {
            return true;
        }
        else if (parent = element.parentElement) {
            return this.isInSkippedSubtree(parent);
        }
        else {
            return false;
        }
    };
    return CompilePass;
}());


/***/ }),
/* 14 */
/***/ (function(module, exports) {

//# Working example for this: https://codepen.io/anon/pen/MBVewo
//class up.FocusFollower
//  constructor: ->
//    @discardDelay = 80
//    fieldSelector = up.form.fieldSelector()
//    $(document).on('focusin', fieldSelector, @fieldFocused)
//    $(document).on('focusout', fieldSelector, @fieldBlurred)
//    @reset()
//  reset: ->
//    clearTimeout(@discardTimer)
//    @field = undefined
//  fieldFocused: (event) =>
//    clearTimeout(@discardTimer)
//    @field = event.currentTarget
//  fieldBlurred: (event) =>
//    clearTimeout(@discardTimer)
//    @discardTimer = u.timer(@discardDelay, @discardField)
//  discardField: =>
//    @field = undefined
//  lastField: ->
//    if u.isDetached(@field)
//      @discardField()
//    @field


/***/ }),
/* 15 */
/***/ (function(module, exports) {

(function () {
    var u = up.util;
    up.Rect = function (props) {
        u.assign(this, u.only(props, 'left', 'top', 'width', 'height'));
    };
    up.Rect.prototype = {
        get bottom() {
            return this.top + this.height;
        },
        get right() {
            return this.left + this.width;
        }
    };
    up.Rect.fromElement = function (element) {
        return new up.Rect(element.getBoundingClientRect());
    };
})();


/***/ }),
/* 16 */
/***/ (function(module, exports) {

var u;
u = up.util;
up.Selector = (function () {
    var CSS_HAS_SUFFIX_PATTERN, MATCH_FN_NAME;
    var Selector = /** @class */ (function () {
        function Selector(selector1, filterFn) {
            this.selector = selector1;
            this.filterFn = filterFn;
        }
        Selector.prototype.matches = function (element) {
            var doesMatch;
            doesMatch = element[MATCH_FN_NAME](this.selector);
            if (this.filterFn) {
                doesMatch && (doesMatch = this.filterFn(element));
            }
            return doesMatch;
        };
        Selector.prototype.descendants = function (root) {
            var matches;
            matches = root.querySelectorAll(this.selector);
            if (this.filterFn) {
                matches = u.filter(matches, this.filterFn);
            }
            return matches;
        };
        Selector.prototype.descendant = function (root) {
            var candidates;
            if (!this.filterFn) {
                return root.querySelector(this.selector);
            }
            else {
                candidates = root.querySelectorAll(this.selector);
                return u.find(candidates, this.filterFn);
            }
        };
        Selector.prototype.subtree = function (root) {
            var matches;
            matches = [];
            if (this.matches(root)) {
                matches.push(root);
            }
            matches.push.apply(matches, this.descendants(root));
            return matches;
        };
        Selector.prototype.closest = function (root) {
            if (root.closest && !this.filterFn) {
                return root.closest(this.selector);
            }
            else {
                return this.closestPolyfill(root);
            }
        };
        Selector.prototype.closestPolyfill = function (root) {
            if (this.matches(root, this.selector)) {
                return root;
            }
            else {
                return this.ancestor(root);
            }
        };
        Selector.prototype.ancestor = function (element) {
            var parentElement;
            if (parentElement = element.parentElement) {
                if (this.matches(parentElement)) {
                    return parentElement;
                }
                else {
                    return this.ancestor(parentElement);
                }
            }
        };
        Selector.parse = function (selector) {
            var filter;
            filter = null;
            selector = selector.replace(CSS_HAS_SUFFIX_PATTERN, function (match, descendantSelector) {
                filter = function (element) {
                    return element.querySelector(descendantSelector);
                };
                return '';
            });
            return new this(selector, filter);
        };
        return Selector;
    }());
    ;
    CSS_HAS_SUFFIX_PATTERN = new RegExp("\\:has\\(([^\\)]+)\\)$");
    MATCH_FN_NAME = up.browser.isIE11() ? 'msMatchesSelector' : 'matches';
    return Selector;
}).call(this);


/***/ }),
/* 17 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.HtmlParser = /** @class */ (function () {
    function HtmlParser(html) {
        this.html = html;
        this.wrapNoscriptInHtml();
        this.parsedDoc = e.createDocumentFromHtml(this.html);
    }
    HtmlParser.prototype.title = function () {
        var ref;
        return (ref = this.parsedDoc.querySelector("head title")) != null ? ref.textContent : void 0;
    };
    HtmlParser.prototype.first = function (selector) {
        return e.first(this.parsedDoc, selector);
    };
    HtmlParser.prototype.prepareForInsertion = function (element) {
        return this.unwrapNoscriptInElement(element);
    };
    HtmlParser.prototype.wrapNoscriptInHtml = function () {
        var _this = this;
        var noscriptPattern;
        // We wrap <noscript> tags into a <div> for two reasons:
        // (1) IE11 and Edge cannot find <noscript> tags with jQuery or querySelector() or
        //     getElementsByTagName() when the tag was created by DOMParser. This is a bug.
        //     https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12453464/
        // (2) The children of a <nonscript> tag are expected to be a verbatim text node
        //     in a scripting-capable browser. However, due to rules in the DOMParser spec,
        //     the children are parsed into actual DOM nodes. This confuses libraries that
        //     work with <noscript> tags, such as lazysizes.
        //     http://w3c.github.io/DOM-Parsing/#dom-domparser-parsefromstring
        // We will unwrap the wrapped <noscript> tags when a fragment is requested with
        // #first(), and only in the requested fragment.
        noscriptPattern = /<noscript[^>]*>((.|\s)*?)<\/noscript>/ig;
        return this.html = this.html.replace(noscriptPattern, function (match, content) {
            _this.didWrapNoscript = true;
            return '<div class="up-noscript" data-html="' + u.escapeHtml(content) + '"></div>';
        });
    };
    HtmlParser.prototype.unwrapNoscriptInElement = function (element) {
        var i, len, noscript, results, wrappedContent, wrappedNoscript, wrappedNoscripts;
        if (!this.didWrapNoscript) {
            return;
        }
        wrappedNoscripts = element.querySelectorAll('.up-noscript');
        results = [];
        for (i = 0, len = wrappedNoscripts.length; i < len; i++) {
            wrappedNoscript = wrappedNoscripts[i];
            wrappedContent = wrappedNoscript.getAttribute('data-html');
            noscript = document.createElement('noscript');
            noscript.textContent = wrappedContent;
            results.push(wrappedNoscript.parentNode.replaceChild(noscript, wrappedNoscript));
        }
        return results;
    };
    return HtmlParser;
}());


/***/ }),
/* 18 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.EventListener = /** @class */ (function () {
    function EventListener(element1, eventName1, selector1, callback1, options) {
        if (options === void 0) { options = {}; }
        this.unbind = this.unbind.bind(this);
        this.nativeCallback = this.nativeCallback.bind(this);
        this.element = element1;
        this.eventName = eventName1;
        this.selector = selector1;
        this.callback = callback1;
        (this.jQuery = options.jQuery);
        this.key = this.constructor.key(this.eventName, this.selector, this.callback);
        this.isDefault = up.framework.isBooting();
    }
    EventListener.prototype.bind = function () {
        var base, map;
        map = ((base = this.element).upEventListeners || (base.upEventListeners = {}));
        if (map[this.key]) {
            up.fail('up.on(): The %o callback %o cannot be registered more than once', this.eventName, this.callback);
        }
        map[this.key] = this;
        return this.element.addEventListener(this.eventName, this.nativeCallback);
    };
    EventListener.prototype.unbind = function () {
        var map;
        if (map = this.element.upEventListeners) {
            delete map[this.key];
        }
        return this.element.removeEventListener(this.eventName, this.nativeCallback);
    };
    EventListener.prototype.nativeCallback = function (event) {
        var args, data, element, elementArg, expectedArgCount;
        // 1. Since we're listing on `document`, event.currentTarget is now `document`.
        // 2. event.target is the element that received an event, which might be a
        //    child of `selector`.
        // 3. There is only a single event bubbling up the DOM, so we are only called once.
        element = event.target;
        if (this.selector) {
            element = e.closest(element, this.selector);
        }
        if (element) {
            elementArg = this.jQuery ? up.browser.jQuery(element) : element;
            args = [event, elementArg];
            // Do not retrieve and parse [up-data] unless the listener function
            // expects a third argument. Note that we must pass data for an argument
            // count of 0, since then the function might take varargs.
            expectedArgCount = this.callback.length;
            if (!(expectedArgCount === 1 || expectedArgCount === 2)) {
                data = up.syntax.data(element);
                args.push(data);
            }
            return this.callback.apply(element, args);
        }
    };
    /*
    Parses the following arg variants into an object:
  
    - [elements, eventNames, selector, callback]
    - [elements, eventNames,           callback]
    - [          eventNames, selector, callback]
    - [          eventNames,           callback]
  
    @function up.EventListener#parseArgs
    @internal
    */
    EventListener.parseArgs = function (args) {
        var callback, elements, eventNames, selector;
        args = u.copy(args);
        // A callback function is given in all arg variants.
        callback = args.pop();
        // Give the callback function a numeric identifier so it
        // can become part of the upEventListeners key.
        callback.upUid || (callback.upUid = u.uid());
        // The user can pass an element (or the document, or the window) as the
        // first argument. If omitted, the listener will bind to the document.
        if (args[0].addEventListener) {
            elements = [args.shift()];
        }
        else if (u.isJQuery(args[0]) || (u.isList(args[0]) && args[0][0].addEventListener)) {
            elements = args.shift();
        }
        else {
            elements = [document];
        }
        // Event names are given in all arg variants
        eventNames = u.splitValues(args.shift());
        // eventNames = u.map(eventNames, up.legacy.fixEventName)
        // A selector is given if the user wants to delegate events.
        // It might be undefined.
        selector = args[0];
        return { elements: elements, eventNames: eventNames, selector: selector, callback: callback };
    };
    EventListener.bind = function (args, options) {
        var element, eventName, i, j, len, len1, listener, parsed, ref, ref1, unbindFns;
        parsed = this.parseArgs(args);
        unbindFns = [];
        ref = parsed.elements;
        for (i = 0, len = ref.length; i < len; i++) {
            element = ref[i];
            ref1 = parsed.eventNames;
            for (j = 0, len1 = ref1.length; j < len1; j++) {
                eventName = ref1[j];
                listener = new this(element, eventName, parsed.selector, parsed.callback, options);
                listener.bind();
                unbindFns.push(listener.unbind);
            }
        }
        return u.sequence(unbindFns);
    };
    EventListener.key = function (eventName, selector, callback) {
        return [eventName, selector, callback.upUid].join('|');
    };
    EventListener.unbind = function (args) {
        var element, eventName, i, key, len, listener, map, parsed, ref, results;
        parsed = this.parseArgs(args);
        ref = parsed.elements;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
            element = ref[i];
            map = element.upEventListeners;
            results.push((function () {
                var j, len1, ref1, results1;
                ref1 = parsed.eventNames;
                results1 = [];
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                    eventName = ref1[j];
                    key = this.key(eventName, parsed.selector, parsed.callback);
                    if (map && (listener = map[key])) {
                        results1.push(listener.unbind());
                    }
                    else {
                        results1.push(void 0);
                    }
                }
                return results1;
            }).call(this));
        }
        return results;
    };
    EventListener.unbindNonDefault = function (element) {
        var i, len, listener, listeners, map, results;
        if (map = element.upEventListeners) {
            listeners = u.values(map);
            results = [];
            for (i = 0, len = listeners.length; i < len; i++) {
                listener = listeners[i];
                // Calling unbind() also removes the listener from element.upEventListeners
                if (!listener.isDefault) {
                    results.push(listener.unbind());
                }
                else {
                    results.push(void 0);
                }
            }
            return results;
        }
    };
    return EventListener;
}());


/***/ }),
/* 19 */
/***/ (function(module, exports) {

var u;
u = up.util;
/***
@class up.Cache
@internal
*/
up.Cache = /** @class */ (function () {
    /***
    @constructor
    @param {number|Function(): number} [config.size]
      Maximum number of cache entries.
      Set to `undefined` to not limit the cache size.
    @param {number|Function(): number} [config.expiry]
      The number of milliseconds after which a cache entry
      will be discarded.
    @param {string} [config.logPrefix]
      A prefix for log entries printed by this cache object.
    @param {Function(entry): string} [config.key]
      A function that takes an argument and returns a string key
      for storage. If omitted, `toString()` is called on the argument.
    @param {Function(entry): boolean} [config.cachable]
      A function that takes a potential cache entry and returns whether
      this entry  can be stored in the hash. If omitted, all entries are considered
      cachable.
    */
    function Cache(config) {
        if (config === void 0) { config = {}; }
        this.maxKeys = this.maxKeys.bind(this);
        this.expiryMillis = this.expiryMillis.bind(this);
        this.normalizeStoreKey = this.normalizeStoreKey.bind(this);
        this.isEnabled = this.isEnabled.bind(this);
        this.isCachable = this.isCachable.bind(this);
        this.clear = this.clear.bind(this);
        this.log = this.log.bind(this);
        this.keys = this.keys.bind(this);
        this.makeRoomForAnotherKey = this.makeRoomForAnotherKey.bind(this);
        this.alias = this.alias.bind(this);
        this.timestamp = this.timestamp.bind(this);
        this.set = this.set.bind(this);
        this.remove = this.remove.bind(this);
        this.isFresh = this.isFresh.bind(this);
        this.get = this.get.bind(this);
        this.config = config;
        this.store = this.config.store || new up.store.Memory();
    }
    Cache.prototype.maxKeys = function () {
        return u.evalOption(this.config.size);
    };
    Cache.prototype.expiryMillis = function () {
        return u.evalOption(this.config.expiry);
    };
    Cache.prototype.normalizeStoreKey = function (key) {
        if (this.config.key) {
            return this.config.key(key);
        }
        else {
            return key.toString();
        }
    };
    Cache.prototype.isEnabled = function () {
        return this.maxKeys() !== 0 && this.expiryMillis() !== 0;
    };
    Cache.prototype.isCachable = function (key) {
        if (this.config.cachable) {
            return this.config.cachable(key);
        }
        else {
            return true;
        }
    };
    Cache.prototype.clear = function () {
        return this.store.clear();
    };
    Cache.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (this.config.logPrefix) {
            args[0] = "[" + this.config.logPrefix + "] " + args[0];
            return up.puts.apply(up, args);
        }
    };
    Cache.prototype.keys = function () {
        return this.store.keys();
    };
    Cache.prototype.makeRoomForAnotherKey = function () {
        var _this = this;
        var max, oldestKey, oldestTimestamp, storeKeys;
        storeKeys = u.copy(this.keys());
        max = this.maxKeys();
        if (max && storeKeys.length >= max) {
            oldestKey = void 0;
            oldestTimestamp = void 0;
            u.each(storeKeys, function (key) {
                var entry, timestamp;
                entry = _this.store.get(key); // we don't need to call cacheKey here
                timestamp = entry.timestamp;
                if (!oldestTimestamp || oldestTimestamp > timestamp) {
                    oldestKey = key;
                    return oldestTimestamp = timestamp;
                }
            });
            if (oldestKey) {
                return this.store.remove(oldestKey);
            }
        }
    };
    Cache.prototype.alias = function (oldKey, newKey) {
        var value;
        value = this.get(oldKey, {
            silent: true
        });
        if (u.isDefined(value)) {
            return this.set(newKey, value);
        }
    };
    Cache.prototype.timestamp = function () {
        return (new Date()).valueOf();
    };
    Cache.prototype.set = function (key, value) {
        var storeKey, timestampedValue;
        if (this.isEnabled() && this.isCachable(key)) {
            this.makeRoomForAnotherKey();
            storeKey = this.normalizeStoreKey(key);
            this.log("Setting entry %o to %o", storeKey, value);
            timestampedValue = {
                timestamp: this.timestamp(),
                value: value
            };
            return this.store.set(storeKey, timestampedValue);
        }
    };
    Cache.prototype.remove = function (key) {
        var storeKey;
        if (this.isCachable(key)) {
            storeKey = this.normalizeStoreKey(key);
            return this.store.remove(storeKey);
        }
    };
    Cache.prototype.isFresh = function (entry) {
        var millis, timeSinceTouch;
        millis = this.expiryMillis();
        if (millis) {
            timeSinceTouch = this.timestamp() - entry.timestamp;
            return timeSinceTouch < millis;
        }
        else {
            return true;
        }
    };
    Cache.prototype.get = function (key, options) {
        if (options === void 0) { options = {}; }
        var entry;
        if (this.isCachable(key) && (entry = this.store.get(this.normalizeStoreKey(key)))) {
            if (this.isFresh(entry)) {
                if (!options.silent) {
                    this.log("Cache hit for '%s'", key);
                }
                return entry.value;
            }
            else {
                if (!options.silent) {
                    this.log("Discarding stale cache entry for '%s'", key);
                }
                this.remove(key);
                return void 0;
            }
        }
        else {
            if (!options.silent) {
                this.log("Cache miss for '%s'", key);
            }
            return void 0;
        }
    };
    return Cache;
}());
//  first: (keyOrKeys) =>
//    @all(keyOrKeys)[0]
//  all: (keys = @keys()) =>
//    keys = u.wrapArray(keys)
//    matches = u.map keys, (key) =>
//      @get(key)
//    u.filter(matches, u.isPresent)


/***/ }),
/* 20 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.FieldObserver = /** @class */ (function () {
    function FieldObserver(fieldOrFields, options, callback) {
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.cancelTimer = this.cancelTimer.bind(this);
        this.scheduleTimer = this.scheduleTimer.bind(this);
        this.scheduleValues = this.scheduleValues.bind(this);
        this.isNewValues = this.isNewValues.bind(this);
        this.requestCallback = this.requestCallback.bind(this);
        this.readFieldValues = this.readFieldValues.bind(this);
        this.check = this.check.bind(this);
        this.callback = callback;
        this.fields = e.list(fieldOrFields);
        this.delay = options.delay;
        this.batch = options.batch;
    }
    FieldObserver.prototype.start = function () {
        this.scheduledValues = null;
        this.processedValues = this.readFieldValues();
        this.currentTimer = void 0;
        this.callbackRunning = false;
        // Although (depending on the browser) we only need/receive either input or change,
        // we always bind to both events in case another script manually triggers it.
        return this.unbind = up.on(this.fields, 'input change', this.check);
    };
    FieldObserver.prototype.stop = function () {
        this.unbind();
        return this.cancelTimer();
    };
    FieldObserver.prototype.cancelTimer = function () {
        clearTimeout(this.currentTimer);
        return this.currentTimer = void 0;
    };
    FieldObserver.prototype.scheduleTimer = function () {
        var _this = this;
        this.cancelTimer();
        return this.currentTimer = u.timer(this.delay, function () {
            _this.currentTimer = void 0;
            return _this.requestCallback();
        });
    };
    FieldObserver.prototype.scheduleValues = function (values) {
        this.scheduledValues = values;
        return this.scheduleTimer();
    };
    FieldObserver.prototype.isNewValues = function (values) {
        return !u.isEqual(values, this.processedValues) && !u.isEqual(this.scheduledValues, values);
    };
    FieldObserver.prototype.requestCallback = function () {
        var _this = this;
        var callbackReturnValues, callbacksDone, diff, name, value;
        if (this.scheduledValues !== null && !this.currentTimer && !this.callbackRunning) {
            diff = this.changedValues(this.processedValues, this.scheduledValues);
            this.processedValues = this.scheduledValues;
            this.scheduledValues = null;
            this.callbackRunning = true;
            callbackReturnValues = [];
            if (this.batch) {
                callbackReturnValues.push(this.callback(diff));
            }
            else {
                for (name in diff) {
                    value = diff[name];
                    callbackReturnValues.push(this.callback(value, name));
                }
            }
            // Promise.all() will wait for any promises that might be
            // contained in the `callbackReturnValues` array.
            callbacksDone = Promise.all(callbackReturnValues);
            return u.always(callbacksDone, function () {
                _this.callbackRunning = false;
                return _this.requestCallback();
            });
        }
    };
    FieldObserver.prototype.changedValues = function (previous, next) {
        var changes, i, key, keys, len, nextValue, previousValue;
        changes = {};
        keys = Object.keys(previous);
        keys = keys.concat(Object.keys(next));
        keys = u.uniq(keys);
        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            previousValue = previous[key];
            nextValue = next[key];
            if (!u.isEqual(previousValue, nextValue)) {
                changes[key] = nextValue;
            }
        }
        return changes;
    };
    FieldObserver.prototype.readFieldValues = function () {
        return up.Params.fromFields(this.fields).toObject();
    };
    FieldObserver.prototype.check = function () {
        var values;
        values = this.readFieldValues();
        if (this.isNewValues(values)) {
            return this.scheduleValues(values);
        }
    };
    return FieldObserver;
}());


/***/ }),
/* 21 */
/***/ (function(module, exports) {

var u;
u = up.util;
up.ExtractCascade = /** @class */ (function () {
    function ExtractCascade(selectorOrElement, options) {
        var _this = this;
        var base, base1;
        this.oldPlan = this.oldPlan.bind(this);
        this.newPlan = this.newPlan.bind(this);
        this.matchingPlan = this.matchingPlan.bind(this);
        this.detectPlan = this.detectPlan.bind(this);
        this.bestPreflightSelector = this.bestPreflightSelector.bind(this);
        this.bestMatchingSteps = this.bestMatchingSteps.bind(this);
        this.matchingPlanNotFound = this.matchingPlanNotFound.bind(this);
        this.oldPlanNotFound = this.oldPlanNotFound.bind(this);
        this.options = u.options(options, {
            humanizedTarget: 'selector',
            layer: 'auto'
        });
        if ((base = this.options).transition == null) {
            base.transition = this.options.animation;
        }
        if ((base1 = this.options).hungry == null) {
            base1.hungry = true;
        }
        this.candidates = this.buildCandidates(selectorOrElement);
        this.plans = u.map(this.candidates, function (candidate, i) {
            var planOptions, ref;
            planOptions = u.copy(_this.options);
            if (i > 0) {
                // If we're using a fallback (any candidate that's not the first),
                // the original transition might no longer be appropriate.
                planOptions.transition = (ref = up.fragment.config.fallbackTransition) != null ? ref : _this.options.transition;
            }
            return new up.ExtractPlan(candidate, planOptions);
        });
    }
    ExtractCascade.prototype.buildCandidates = function (selector) {
        var candidates;
        candidates = [selector, this.options.fallback, up.fragment.config.fallbacks];
        candidates = u.flatten(candidates);
        // Remove undefined, null and false from the list
        candidates = u.filter(candidates, u.isTruthy);
        candidates = u.uniq(candidates);
        if (this.options.fallback === false || this.options.provideTarget) {
            // Use the first defined candidate, but not `selector` since that
            // might be an undefined options.failTarget
            candidates = [candidates[0]];
        }
        return candidates;
    };
    ExtractCascade.prototype.oldPlan = function () {
        return this.detectPlan('oldExists');
    };
    ExtractCascade.prototype.newPlan = function () {
        return this.detectPlan('newExists');
    };
    ExtractCascade.prototype.matchingPlan = function () {
        return this.detectPlan('matchExists');
    };
    ExtractCascade.prototype.detectPlan = function (checker) {
        return u.find(this.plans, function (plan) {
            return plan[checker]();
        });
    };
    ExtractCascade.prototype.bestPreflightSelector = function () {
        var plan;
        if (this.options.provideTarget) {
            // We know that the target will be created right before swapping,
            // so just assume the first plan will work.
            plan = this.plans[0];
        }
        else {
            plan = this.oldPlan();
        }
        if (plan) {
            plan.resolveNesting();
            return plan.selector();
        }
        else {
            return this.oldPlanNotFound();
        }
    };
    ExtractCascade.prototype.bestMatchingSteps = function () {
        var plan;
        if (plan = this.matchingPlan()) {
            // Only when we have a match in the required selectors, we
            // append the optional steps for [up-hungry] elements.
            plan.addHungrySteps();
            plan.resolveNesting();
            return plan.steps;
        }
        else {
            return this.matchingPlanNotFound();
        }
    };
    ExtractCascade.prototype.matchingPlanNotFound = function () {
        var inspectAction, message;
        // The job of this method is to simply throw an error.
        // However, we will investigate the reasons for the failure
        // so we can provide a more helpful error message.
        if (this.newPlan()) {
            return this.oldPlanNotFound();
        }
        else {
            if (this.oldPlan()) {
                message = "Could not find " + this.options.humanizedTarget + " in response";
            }
            else {
                message = "Could not match " + this.options.humanizedTarget + " in current page and response";
            }
            if (this.options.inspectResponse) {
                inspectAction = {
                    label: 'Open response',
                    callback: this.options.inspectResponse
                };
            }
            return up.fail([message + " (tried %o)", this.candidates], {
                action: inspectAction
            });
        }
    };
    ExtractCascade.prototype.oldPlanNotFound = function () {
        var layerProse;
        layerProse = this.options.layer;
        if (layerProse === 'auto') {
            layerProse = 'page, modal or popup';
        }
        return up.fail("Could not find " + this.options.humanizedTarget + " in current " + layerProse + " (tried %o)", this.candidates);
    };
    return ExtractCascade;
}());


/***/ }),
/* 22 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.ExtractPlan = /** @class */ (function () {
    function ExtractPlan(selector, options) {
        var originalSelector;
        this.findOld = this.findOld.bind(this);
        this.findNew = this.findNew.bind(this);
        this.oldExists = this.oldExists.bind(this);
        this.newExists = this.newExists.bind(this);
        this.matchExists = this.matchExists.bind(this);
        this.addSteps = this.addSteps.bind(this);
        this.resolveNesting = this.resolveNesting.bind(this);
        this.selector = this.selector.bind(this);
        this.parseSteps = this.parseSteps.bind(this);
        this.addHungrySteps = this.addHungrySteps.bind(this);
        this.reveal = options.reveal;
        this.origin = options.origin;
        this.hungry = options.hungry;
        this.transition = options.transition;
        this.response = options.response;
        this.oldLayer = options.layer;
        originalSelector = e.resolveSelector(selector, this.origin);
        this.parseSteps(originalSelector);
    }
    ExtractPlan.prototype.findOld = function () {
        var _this = this;
        return u.each(this.steps, function (step) {
            return step.oldElement = up.fragment.first(step.selector, {
                layer: _this.oldLayer
            });
        });
    };
    ExtractPlan.prototype.findNew = function () {
        var _this = this;
        return u.each(this.steps, function (step) {
            // The response has no layers. It's always just the page.
            return step.newElement = _this.response.first(step.selector);
        });
    };
    ExtractPlan.prototype.oldExists = function () {
        this.findOld();
        return u.every(this.steps, function (step) {
            return step.oldElement;
        });
    };
    ExtractPlan.prototype.newExists = function () {
        this.findNew();
        return u.every(this.steps, function (step) {
            return step.newElement;
        });
    };
    ExtractPlan.prototype.matchExists = function () {
        return this.oldExists() && this.newExists();
    };
    ExtractPlan.prototype.addSteps = function (steps) {
        return this.steps = this.steps.concat(steps);
    };
    ExtractPlan.prototype.resolveNesting = function () {
        var compressed;
        if (this.steps.length < 2) {
            return;
        }
        compressed = u.copy(this.steps);
        // When two replacements target the same element, we would process
        // the same content twice. We never want that, so we only keep the first step.
        compressed = u.uniqBy(compressed, function (step) {
            return step.oldElement;
        });
        compressed = u.filter(compressed, function (candidateStep, candidateIndex) {
            return u.every(compressed, function (rivalStep, rivalIndex) {
                var candidateElement, rivalElement;
                if (rivalIndex === candidateIndex) {
                    return true;
                }
                else {
                    candidateElement = candidateStep.oldElement;
                    rivalElement = rivalStep.oldElement;
                    return rivalStep.pseudoClass || !rivalElement.contains(candidateElement);
                }
            });
        });
        // If we revealed before, we should reveal now
        compressed[0].reveal = this.steps[0].reveal;
        return this.steps = compressed;
    };
    ExtractPlan.prototype.selector = function () {
        return u.map(this.steps, 'expression').join(', ');
    };
    ExtractPlan.prototype.parseSteps = function (originalSelector) {
        var _this = this;
        var comma, disjunction;
        comma = /\ *,\ */;
        this.steps = [];
        disjunction = originalSelector.split(comma);
        return u.each(disjunction, function (expression, i) {
            var doReveal, expressionParts, pseudoClass, selector;
            expressionParts = expression.match(/^(.+?)(?:\:(before|after))?$/);
            expressionParts || up.fail('Could not parse selector literal "%s"', expression);
            selector = expressionParts[1];
            if (selector === 'html') {
                // If someone really asked us to replace the <html> root, the best
                // we can do is replace the <body>.
                selector = 'body';
            }
            pseudoClass = expressionParts[2];
            // When extracting multiple selectors, we only want to reveal the first element.
            // So we set the { reveal } option to false for the next iteration.
            doReveal = i === 0 ? _this.reveal : false;
            return _this.steps.push({
                expression: expression,
                selector: selector,
                pseudoClass: pseudoClass,
                transition: _this.transition,
                origin: _this.origin,
                reveal: doReveal
            });
        });
    };
    ExtractPlan.prototype.addHungrySteps = function () {
        var hungries, hungry, hungrySteps, j, len, newHungry, ref, selector, transition;
        hungrySteps = [];
        if (this.hungry) {
            hungries = e.all(up.radio.hungrySelector());
            transition = (ref = up.radio.config.hungryTransition) != null ? ref : this.transition;
            for (j = 0, len = hungries.length; j < len; j++) {
                hungry = hungries[j];
                selector = e.toSelector(hungry);
                if (newHungry = this.response.first(selector)) {
                    hungrySteps.push({
                        selector: selector,
                        oldElement: hungry,
                        newElement: newHungry,
                        transition: transition,
                        reveal: false,
                        origin: null // don't let the hungry element auto-close a non-sticky modal or popup
                    });
                }
            }
        }
        return this.addSteps(hungrySteps);
    };
    return ExtractPlan;
}());


/***/ }),
/* 23 */
/***/ (function(module, exports) {

var u;
up.store || (up.store = {});
u = up.util;
up.store.Memory = /** @class */ (function () {
    function Memory() {
        this.clear = this.clear.bind(this);
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.remove = this.remove.bind(this);
        this.keys = this.keys.bind(this);
        this.values = this.values.bind(this);
        this.clear();
    }
    Memory.prototype.clear = function () {
        return this.data = {};
    };
    Memory.prototype.get = function (key) {
        return this.data[key];
    };
    Memory.prototype.set = function (key, value) {
        return this.data[key] = value;
    };
    Memory.prototype.remove = function (key) {
        return delete this.data[key];
    };
    Memory.prototype.keys = function () {
        return Object.keys(this.data);
    };
    Memory.prototype.values = function () {
        return u.values(this.data);
    };
    return Memory;
}());


/***/ }),
/* 24 */
/***/ (function(module, exports) {

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ref, u, boundMethodCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
} };
u = up.util;
//#
// Store implementation backed by window.sessionStorage
// ====================================================
// This improves plain sessionStorage access in several ways:
// - Falls back to in-memory storage if window.sessionStorage is not available (see below).
// - Allows to store other types of values than just strings.
// - Allows to store structured values.
// - Allows to invalidate existing data by incrementing a version number on the server.
// On sessionStorage availability
// ------------------------------
// All supported browsers have sessionStorage, but the property is `null`
// in private browsing mode in Safari and the default Android webkit browser.
// See https://makandracards.com/makandra/32865-sessionstorage-per-window-browser-storage
// Also Chrome explodes upon access of window.sessionStorage when
// user blocks third-party cookies and site data and this page is embedded
// as an <iframe>. See https://bugs.chromium.org/p/chromium/issues/detail?id=357625
ref = up.store.Session = /** @class */ (function (_super) {
    __extends(Session, _super);
    function Session(rootKey) {
        var _this = _super.call(this) || this;
        _this.clear = _this.clear.bind(_this);
        _this.set = _this.set.bind(_this);
        _this.remove = _this.remove.bind(_this);
        _this.loadFromSessionStorage = _this.loadFromSessionStorage.bind(_this);
        _this.saveToSessionStorage = _this.saveToSessionStorage.bind(_this);
        _this.rootKey = rootKey;
        _this.loadFromSessionStorage();
        return _this;
    }
    Session.prototype.clear = function () {
        boundMethodCheck(this, ref);
        _super.prototype.clear.call(this);
        return this.saveToSessionStorage();
    };
    Session.prototype.set = function (key, value) {
        boundMethodCheck(this, ref);
        _super.prototype.set.call(this, key, value);
        return this.saveToSessionStorage();
    };
    Session.prototype.remove = function (key) {
        boundMethodCheck(this, ref);
        _super.prototype.remove.call(this, key);
        return this.saveToSessionStorage();
    };
    Session.prototype.loadFromSessionStorage = function () {
        var raw;
        boundMethodCheck(this, ref);
        try {
            if (raw = typeof sessionStorage !== "undefined" && sessionStorage !== null ? sessionStorage.getItem(this.rootKey) : void 0) {
                this.data = JSON.parse(raw);
            }
        }
        catch (error) {
        }
        // window.sessionStorage not supported (see class comment)
        // or JSON syntax error. We start with a blank object instead.
        return this.data || (this.data = {});
    };
    Session.prototype.saveToSessionStorage = function () {
        var json;
        boundMethodCheck(this, ref);
        json = JSON.stringify(this.data);
        try {
            return typeof sessionStorage !== "undefined" && sessionStorage !== null ? sessionStorage.setItem(this.rootKey, json) : void 0;
        }
        catch (error) {
        }
    };
    return Session;
}(up.store.Memory));
// window.sessionStorage not supported (see class comment).
// We do nothing and only keep data in-memory.


/***/ }),
/* 25 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.MotionController = /** @class */ (function () {
    function MotionController(name) {
        /***
        Finishes all animations in the given elements' ancestors and
        descendants, then calls the given function.
    
        The function is expected to return a promise that is fulfilled when
        the animation ends. The function is also expected to listen to
        `this.finishEvent` and instantly skip to the last frame
        when the event is observed.
    
        The animation is tracked so it can be
        [`finished`](/up.MotionController.finish) later.
    
        @method startFunction
        @param {Element|List<Element>} cluster
        A list of elements that will be affected by the motion.
        @param {Function(): Promise} startMotion
        @param {Object} [memory.trackMotion=true]
        @return {Promise}
        A promise that is fulfilled when the animation ends.
        */
        this.startFunction = this.startFunction.bind(this);
        /***
        @method finish
        @param {List<Element>} [elements]
        If no element is given, finishes all animations in the documnet.
        If an element is given, only finishes animations in its subtree and ancestors.
        @return {Promise} A promise that is fulfilled when animations have finished.
        */
        this.finish = this.finish.bind(this);
        this.expandFinishRequest = this.expandFinishRequest.bind(this);
        this.isActive = this.isActive.bind(this);
        this.finishOneElement = this.finishOneElement.bind(this);
        this.emitFinishEvent = this.emitFinishEvent.bind(this);
        this.whenElementFinished = this.whenElementFinished.bind(this);
        this.markCluster = this.markCluster.bind(this);
        this.unmarkCluster = this.unmarkCluster.bind(this);
        this.whileForwardingFinishEvent = this.whileForwardingFinishEvent.bind(this);
        this.reset = this.reset.bind(this);
        this.activeClass = "up-" + name;
        this.dataKey = "up-" + name + "-finished";
        this.selector = "." + this.activeClass;
        this.finishEvent = "up:" + name + ":finish";
        this.finishCount = 0;
        this.clusterCount = 0;
    }
    MotionController.prototype.startFunction = function (cluster, startMotion, memory) {
        var _this = this;
        if (memory === void 0) { memory = {}; }
        var mutedAnimator, ref;
        cluster = e.list(cluster);
        // Some motions might reject after starting. E.g. a scrolling animation
        // will reject when the user scrolls manually during the animation. For
        // the purpose of this controller, we just want to know when the animation
        // has setteld, regardless of whether it was resolved or rejected.
        mutedAnimator = function () {
            return u.muteRejection(startMotion());
        };
        // Callers can pass an options hash `memory` in which we store a { trackMotion }
        // property. With this we can prevent tracking the same motion multiple times.
        // This is an issue when composing a transition from two animations, or when
        // using another transition from within a transition function.
        memory.trackMotion = (ref = memory.trackMotion) != null ? ref : up.motion.isEnabled();
        if (memory.trackMotion === false) {
            // Since we don't want recursive tracking or finishing, we could run
            // the animator() now. However, since the else branch is async, we push
            // the animator into the microtask queue to be async as well.
            return u.microtask(mutedAnimator);
        }
        else {
            memory.trackMotion = false;
            return this.finish(cluster).then(function () {
                var promise;
                promise = _this.whileForwardingFinishEvent(cluster, mutedAnimator);
                promise = promise.then(function () {
                    return _this.unmarkCluster(cluster);
                });
                // Attach the modified promise to the cluster's elements
                _this.markCluster(cluster, promise);
                return promise;
            });
        }
    };
    /**
    Finishes all animations in the given elements' ancestors and
    descendants, then calls `motion.start()`.
  
    Also listens to `this.finishEvent` on the given elements.
    When this event is observed, calls `motion.finish()`.
  
    @method startMotion
    @param {Element|List<Element>} cluster
    @param {up.Motion} motion
    @param {Object} [memory.trackMotion=true]
    */
    MotionController.prototype.startMotion = function (cluster, motion, memory) {
        if (memory === void 0) { memory = {}; }
        var finish, promise, start, unbindFinish;
        start = function () {
            return motion.start();
        };
        finish = function () {
            return motion.finish();
        };
        unbindFinish = up.on(cluster, this.finishEvent, finish);
        promise = this.startFunction(cluster, start, memory);
        promise = promise.then(unbindFinish);
        return promise;
    };
    MotionController.prototype.finish = function (elements) {
        var allFinished;
        this.finishCount++;
        if (this.clusterCount === 0 || !up.motion.isEnabled()) {
            return Promise.resolve();
        }
        elements = this.expandFinishRequest(elements);
        allFinished = u.map(elements, this.finishOneElement);
        return Promise.all(allFinished);
    };
    MotionController.prototype.expandFinishRequest = function (elements) {
        var _this = this;
        if (elements) {
            return u.flatMap(elements, function (el) {
                return e.list(e.closest(el, _this.selector), e.all(el, _this.selector));
            });
        }
        else {
            // If no reference elements were given, we finish every matching
            // element on the screen.
            return e.all(this.selector);
        }
    };
    MotionController.prototype.isActive = function (element) {
        return element.classList.contains(this.activeClass);
    };
    MotionController.prototype.finishOneElement = function (element) {
        // Animating code is expected to listen to this event, fast-forward
        // the animation and resolve their promise. All built-ins like
        // `up.animate`, `up.morph`, or `up.scroll` behave that way.
        this.emitFinishEvent(element);
        // If animating code ignores the event, we cannot force the animation to
        // finish from here. We will wait for the animation to end naturally before
        // starting the next animation.
        return this.whenElementFinished(element);
    };
    MotionController.prototype.emitFinishEvent = function (element, eventAttrs) {
        if (eventAttrs === void 0) { eventAttrs = {}; }
        eventAttrs = u.merge({
            target: element,
            log: false
        }, eventAttrs);
        return up.emit(this.finishEvent, eventAttrs);
    };
    MotionController.prototype.whenElementFinished = function (element) {
        // There are some cases related to element ghosting where an element
        // has the class, but not the data value. In that case simply return
        // a resolved promise.
        return element[this.dataKey] || Promise.resolve();
    };
    MotionController.prototype.markCluster = function (cluster, promise) {
        var element, i, len, results;
        this.clusterCount++;
        results = [];
        for (i = 0, len = cluster.length; i < len; i++) {
            element = cluster[i];
            element.classList.add(this.activeClass);
            results.push(element[this.dataKey] = promise);
        }
        return results;
    };
    MotionController.prototype.unmarkCluster = function (cluster) {
        var element, i, len, results;
        this.clusterCount--;
        results = [];
        for (i = 0, len = cluster.length; i < len; i++) {
            element = cluster[i];
            element.classList.remove(this.activeClass);
            results.push(delete element[this.dataKey]);
        }
        return results;
    };
    MotionController.prototype.whileForwardingFinishEvent = function (cluster, fn) {
        var _this = this;
        var doForward, unbindFinish;
        if (cluster.length < 2) {
            return fn();
        }
        doForward = function (event) {
            if (!event.forwarded) {
                return u.each(cluster, function (element) {
                    if (element !== event.target && _this.isActive(element)) {
                        return _this.emitFinishEvent(element, {
                            forwarded: true
                        });
                    }
                });
            }
        };
        // Forward the finish event to the ghost that is actually animating
        unbindFinish = up.on(cluster, this.finishEvent, doForward);
        // Our own pseudo-animation finishes when the actual animation on $ghost finishes
        return fn().then(unbindFinish);
    };
    MotionController.prototype.reset = function () {
        var _this = this;
        return this.finish().then(function () {
            _this.finishCount = 0;
            return _this.clusterCount = 0;
        });
    };
    return MotionController;
}());


/***/ }),
/* 26 */
/***/ (function(module, exports) {

var u;
u = up.util;
up.ScrollMotion = (function () {
    var SPEED_CALIBRATION;
    var ScrollMotion = /** @class */ (function () {
        function ScrollMotion(scrollable, targetTop, options) {
            if (options === void 0) { options = {}; }
            var ref, ref1, ref2, ref3;
            this.start = this.start.bind(this);
            this.animationFrame = this.animationFrame.bind(this);
            this.cancel = this.cancel.bind(this);
            this.finish = this.finish.bind(this);
            this.scrollable = scrollable;
            this.targetTop = targetTop;
            // The option for up.scroll() is { behavior }, but coming
            // from up.replace() it's { scrollBehavior }.
            this.behavior = (ref = (ref1 = options.behavior) != null ? ref1 : options.scrollBehavior) != null ? ref : 'auto';
            // The option for up.scroll() is { behavior }, but coming
            // from up.replace() it's { scrollSpeed }.
            this.speed = ((ref2 = (ref3 = options.speed) != null ? ref3 : options.scrollSpeed) != null ? ref2 : up.viewport.config.scrollSpeed) * SPEED_CALIBRATION;
        }
        ScrollMotion.prototype.start = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.resolve = resolve;
                _this.reject = reject;
                if (_this.behavior === 'smooth' && up.motion.isEnabled()) {
                    return _this.startAnimation();
                }
                else {
                    return _this.finish();
                }
            });
        };
        ScrollMotion.prototype.startAnimation = function () {
            this.startTime = Date.now();
            this.startTop = this.scrollable.scrollTop;
            this.topDiff = this.targetTop - this.startTop;
            // We're applying a square root to become slower for small distances
            // and faster for large distances.
            this.duration = Math.sqrt(Math.abs(this.topDiff)) / this.speed;
            return requestAnimationFrame(this.animationFrame);
        };
        ScrollMotion.prototype.animationFrame = function () {
            var currentTime, timeElapsed, timeFraction;
            if (this.settled) {
                return;
            }
            // When the scroll position is not the one we previously set, we assume
            // that the user has tried scrolling on her own. We then cancel the scrolling animation.
            if (this.frameTop && Math.abs(this.frameTop - this.scrollable.scrollTop) > 1.5) {
                this.cancel('Animation aborted due to user intervention');
            }
            currentTime = Date.now();
            timeElapsed = currentTime - this.startTime;
            timeFraction = Math.min(timeElapsed / this.duration, 1);
            this.frameTop = this.startTop + (u.simpleEase(timeFraction) * this.topDiff);
            // When we're very close to the target top, finish the animation
            // directly to deal with rounding errors.
            if (Math.abs(this.targetTop - this.frameTop) < 0.3) {
                return this.finish();
            }
            else {
                this.scrollable.scrollTop = this.frameTop;
                return requestAnimationFrame(this.animationFrame);
            }
        };
        ScrollMotion.prototype.cancel = function (reason) {
            this.settled = true;
            return this.reject(new Error(reason));
        };
        ScrollMotion.prototype.finish = function () {
            // In case we're animating with emulation, cancel the next scheduled frame
            this.settled = true;
            // Setting the { scrollTop } prop will also finish a native scrolling
            // animation in Firefox and Chrome.
            this.scrollable.scrollTop = this.targetTop;
            return this.resolve();
        };
        return ScrollMotion;
    }());
    ;
    // We want to make the default speed mimic Chrome's smooth scrolling behavior.
    // We also want to keep the default value in up.viewport.config.scrollSpeed to be 1.
    // For our calculation in #animationFrame() we need to multiply it with this factor.
    SPEED_CALIBRATION = 0.065;
    return ScrollMotion;
}).call(this);


/***/ }),
/* 27 */
/***/ (function(module, exports) {

var u;
u = up.util;
up.UrlSet = /** @class */ (function () {
    function UrlSet(urls, options) {
        if (options === void 0) { options = {}; }
        this.matches = this.matches.bind(this);
        this.doesMatchFully = this.doesMatchFully.bind(this);
        this.doesMatchPattern = this.doesMatchPattern.bind(this);
        this.matchesAny = this.matchesAny.bind(this);
        this["" + u.isEqual.key] = this["" + u.isEqual.key].bind(this);
        this.urls = urls;
        this.normalizeUrl = options.normalizeUrl || u.normalizeUrl;
        this.urls = u.map(this.urls, this.normalizeUrl);
        this.urls = u.compact(this.urls);
    }
    UrlSet.prototype.matches = function (testUrl) {
        if (testUrl.indexOf('*') >= 0) {
            return this.doesMatchPattern(testUrl);
        }
        else {
            return this.doesMatchFully(testUrl);
        }
    };
    UrlSet.prototype.doesMatchFully = function (testUrl) {
        return u.contains(this.urls, testUrl);
    };
    UrlSet.prototype.doesMatchPattern = function (pattern) {
        var placeholder;
        placeholder = "__ASTERISK__";
        pattern = pattern.replace(/\*/g, placeholder);
        pattern = u.escapeRegexp(pattern);
        pattern = pattern.replace(new RegExp(placeholder, 'g'), '.*?');
        pattern = new RegExp('^' + pattern + '$');
        return u.find(this.urls, function (url) {
            return pattern.test(url);
        });
    };
    UrlSet.prototype.matchesAny = function (testUrls) {
        return u.find(testUrls, this.matches);
    };
    UrlSet.prototype["" + u.isEqual.key] = function (otherSet) {
        return u.isEqual(this.urls, otherSet != null ? otherSet.urls : void 0);
    };
    return UrlSet;
}());


/***/ }),
/* 28 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.CssTransition = /** @class */ (function () {
    function CssTransition(element, lastFrameKebab, options) {
        this.start = this.start.bind(this);
        this.listenToFinishEvent = this.listenToFinishEvent.bind(this);
        this.onFinishEvent = this.onFinishEvent.bind(this);
        this.startFallbackTimer = this.startFallbackTimer.bind(this);
        this.stopFallbackTimer = this.stopFallbackTimer.bind(this);
        this.listenToTransitionEnd = this.listenToTransitionEnd.bind(this);
        this.onTransitionEnd = this.onTransitionEnd.bind(this);
        this.finish = this.finish.bind(this);
        this.pauseOldTransition = this.pauseOldTransition.bind(this);
        this.resumeOldTransition = this.resumeOldTransition.bind(this);
        this.startMotion = this.startMotion.bind(this);
        this.element = element;
        this.lastFrameKebab = lastFrameKebab;
        this.lastFrameKeysKebab = Object.keys(this.lastFrameKebab);
        if (u.some(this.lastFrameKeysKebab, function (key) {
            return key.match(/A-Z/);
        })) {
            up.fail('Animation keys must be kebab-case');
        }
        this.finishEvent = options.finishEvent;
        this.duration = options.duration;
        this.delay = options.delay;
        this.totalDuration = this.delay + this.duration;
        this.easing = options.easing;
        this.finished = false;
    }
    CssTransition.prototype.start = function () {
        if (this.lastFrameKeysKebab.length === 0) {
            this.finished = true;
            // If we have nothing to animate, we will never get a transitionEnd event
            // and the returned promise will never resolve.
            return Promise.resolve();
        }
        this.deferred = u.newDeferred();
        this.pauseOldTransition();
        this.startTime = new Date();
        this.startFallbackTimer();
        this.listenToFinishEvent();
        this.listenToTransitionEnd();
        this.startMotion();
        return this.deferred.promise();
    };
    CssTransition.prototype.listenToFinishEvent = function () {
        if (this.finishEvent) {
            return this.stopListenToFinishEvent = this.element.addEventListener(this.finishEvent, this.onFinishEvent);
        }
    };
    CssTransition.prototype.onFinishEvent = function (event) {
        // don't waste time letting the event bubble up the DOM
        event.stopPropagation();
        return this.finish();
    };
    CssTransition.prototype.startFallbackTimer = function () {
        var _this = this;
        var timingTolerance;
        timingTolerance = 100;
        return this.fallbackTimer = u.timer(this.totalDuration + timingTolerance, function () {
            return _this.finish();
        });
    };
    CssTransition.prototype.stopFallbackTimer = function () {
        return clearTimeout(this.fallbackTimer);
    };
    CssTransition.prototype.listenToTransitionEnd = function () {
        return this.stopListenToTransitionEnd = up.on(this.element, 'transitionend', this.onTransitionEnd);
    };
    CssTransition.prototype.onTransitionEnd = function (event) {
        var completedPropertyKebab, elapsed;
        // Check if the transitionend event was caused by our own transition,
        // and not by some other transition that happens to affect this element.
        if (event.target !== this.element) {
            return;
        }
        // Check if we are receiving a late transitionEnd event
        // from a previous CSS transition.
        elapsed = new Date() - this.startTime;
        if (!(elapsed > 0.25 * this.totalDuration)) {
            return;
        }
        completedPropertyKebab = event.propertyName;
        if (!u.contains(this.lastFrameKeysKebab, completedPropertyKebab)) {
            return;
        }
        return this.finish();
    };
    CssTransition.prototype.finish = function () {
        // Make sure that any queued events won't finish multiple times.
        if (this.finished) {
            return;
        }
        this.finished = true;
        this.stopFallbackTimer();
        if (typeof this.stopListenToFinishEvent === "function") {
            this.stopListenToFinishEvent();
        }
        if (typeof this.stopListenToTransitionEnd === "function") {
            this.stopListenToTransitionEnd();
        }
        // Cleanly finish our own transition so the old transition
        // (or any other transition set right after that) will be able to take effect.
        e.concludeCssTransition(this.element);
        this.resumeOldTransition();
        return this.deferred.resolve();
    };
    CssTransition.prototype.pauseOldTransition = function () {
        var oldTransition, oldTransitionFrameKebab, oldTransitionProperties;
        oldTransition = e.style(this.element, ['transitionProperty', 'transitionDuration', 'transitionDelay', 'transitionTimingFunction']);
        if (e.hasCssTransition(oldTransition)) {
            // Freeze the previous transition at its current place, by setting the currently computed,
            // animated CSS properties as inline styles. Transitions on all properties will not be frozen,
            // since that would involve setting every single CSS property as an inline style.
            if (oldTransition.transitionProperty !== 'all') {
                oldTransitionProperties = oldTransition.transitionProperty.split(/\s*,\s*/);
                oldTransitionFrameKebab = e.style(this.element, oldTransitionProperties);
                this.setOldTransitionTargetFrame = e.setTemporaryStyle(this.element, oldTransitionFrameKebab);
            }
            // Stop the existing CSS transition so it does not emit transitionEnd events
            return this.setOldTransition = e.concludeCssTransition(this.element);
        }
    };
    CssTransition.prototype.resumeOldTransition = function () {
        if (typeof this.setOldTransitionTargetFrame === "function") {
            this.setOldTransitionTargetFrame();
        }
        return typeof this.setOldTransition === "function" ? this.setOldTransition() : void 0;
    };
    CssTransition.prototype.startMotion = function () {
        e.setStyle(this.element, {
            transitionProperty: Object.keys(this.lastFrameKebab).join(', '),
            transitionDuration: this.duration + "ms",
            transitionDelay: this.delay + "ms",
            transitionTimingFunction: this.easing
        });
        return e.setStyle(this.element, this.lastFrameKebab);
    };
    return CssTransition;
}());


/***/ }),
/* 29 */
/***/ (function(module, exports) {

var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//= require ./record
var ref, u, boundMethodCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
} };
u = up.util;
/***
Instances of `up.Response` describe the server response to an [`AJAX request`](/up.request).

\#\#\# Example

    up.request('/foo').then(function(response) {
      console.log(response.status) // 200
      console.log(response.text)   // "<html><body>..."
    })

@class up.Response
*/
ref = up.Response = /** @class */ (function (_super) {
    __extends(Response, _super);
    /***
    @constructor up.Response
    @internal
    */
    function Response(options) {
        var _this = _super.call(this, options) || this;
        /***
        Returns whether the server responded with a 2xx HTTP status.
    
        @function up.Response#isSuccess
        @return {boolean}
        @experimental
        */
        _this.isSuccess = _this.isSuccess.bind(_this);
        /***
        Returns whether the response was not [successful](/up.Request.prototype.isSuccess).
    
        This also returns `true` when the request encountered a [fatal error](/up.Request.prototype.isFatalError)
        like a timeout or loss of network connectivity.
    
        @function up.Response#isError
        @return {boolean}
        @experimental
        */
        _this.isError = _this.isError.bind(_this);
        /***
        Returns whether the request encountered a [fatal error](/up.Request.prototype.isFatalError)
        like a timeout or loss of network connectivity.
    
        When the server produces an error message with an HTTP status like `500`,
        this is not considered a fatal error and `false` is returned.
    
        @function up.Response#isFatalError
        @return {boolean}
        @experimental
        */
        _this.isFatalError = _this.isFatalError.bind(_this);
        /***
        Returns the HTTP header value with the given name.
    
        The search for the header name is case-insensitive.
    
        Returns `undefined` if the given header name was not included in the response.
    
        @function up.Response#getHeader
        @param {string} name
        @return {string|undefined} value
        @experimental
        */
        _this.getHeader = _this.getHeader.bind(_this);
        return _this;
    }
    /***
    The HTTP method used for the response.
  
    This is usually the HTTP method used by the request.
    However, after a redirect the server should signal a `GET` method using
    an [`X-Up-Method: GET` header](/up.protocol#redirect-detection).
  
    @property up.Response#method
    @param {string} method
    @stable
    */
    /***
    The URL used for the response.
  
    This is usually the requested URL.
    However, after a redirect the server should signal a the new URL
    using an [`X-Up-Location: /new-url` header](/up.protocol#redirect-detection).
  
    @property up.Response#url
    @param {string} method
    @stable
    */
    /***
    The response body as a `string`.
  
    @property up.Response#text
    @param {string} text
    @stable
    */
    /***
    The response's
    [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
    as a `number`.
  
    A successful response will usually have a `200` or `201' status code.
  
    @property up.Response#status
    @param {number} status
    @stable
    */
    /***
    The [request](/up.Request) that triggered this response.
  
    @property up.Response#request
    @param {up.Request} request
    @experimental
    */
    /***
    The [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
    object that was used to create this response.
  
    @property up.Response#xhr
    @param {XMLHttpRequest} xhr
    @experimental
    */
    /***
    A [document title pushed by the server](/up.protocol#pushing-a-document-title-to-the-client).
  
    If the server pushed no title via HTTP header, this will be `undefined`.
  
    @property up.Response#title
    @param {string} [title]
    @stable
    */
    Response.prototype.fields = function () {
        return ['method', 'url', 'text', 'status', 'request', 'xhr', 'title'];
    };
    Response.prototype.isSuccess = function () {
        boundMethodCheck(this, ref);
        return this.status && (this.status >= 200 && this.status <= 299);
    };
    Response.prototype.isError = function () {
        boundMethodCheck(this, ref);
        return !this.isSuccess();
    };
    Response.prototype.isFatalError = function () {
        boundMethodCheck(this, ref);
        return this.isError() && u.isBlank(this.text);
    };
    Response.prototype.getHeader = function (name) {
        boundMethodCheck(this, ref);
        return this.xhr.getResponseHeader(name);
    };
    return Response;
}(up.Record));


/***/ }),
/* 30 */
/***/ (function(module, exports) {

var e, u;
u = up.util;
e = up.element;
up.FollowVariant = /** @class */ (function () {
    function FollowVariant(selector, options) {
        this.onClick = this.onClick.bind(this);
        this.onMousedown = this.onMousedown.bind(this);
        this.fullSelector = this.fullSelector.bind(this);
        this.followLink = this.followLink.bind(this);
        this.matchesLink = this.matchesLink.bind(this);
        // @followLink() will wrap @followNow() with event submission and [up-active] feedback
        this.followNow = options.follow;
        this.preloadLink = options.preload;
        this.selectors = u.splitValues(selector, ',');
    }
    FollowVariant.prototype.onClick = function (event, link) {
        if (up.link.shouldProcessEvent(event, link)) {
            if (e.matches(link, '[up-instant]')) {
                // If the link was already processed on mousedown, we still need
                // to prevent this later click event's chain.
                return up.event.halt(event);
            }
            else {
                up.event.consumeAction(event);
                return this.followLink(link);
            }
        }
        else {
            // For tests
            return up.link.allowDefault(event);
        }
    };
    FollowVariant.prototype.onMousedown = function (event, link) {
        if (up.link.shouldProcessEvent(event, link)) {
            up.event.consumeAction(event);
            return this.followLink(link);
        }
    };
    FollowVariant.prototype.fullSelector = function (additionalClause) {
        if (additionalClause === void 0) { additionalClause = ''; }
        var parts;
        parts = [];
        this.selectors.forEach(function (variantSelector) {
            var i, len, ref, results, tagSelector;
            ref = ['a', '[up-href]'];
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
                tagSelector = ref[i];
                results.push(parts.push("" + tagSelector + variantSelector + additionalClause));
            }
            return results;
        });
        return parts.join(', ');
    };
    FollowVariant.prototype.registerEvents = function () {
        var _this = this;
        up.on('click', this.fullSelector(), function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return u.muteRejection(_this.onClick.apply(_this, args));
        });
        return up.on('mousedown', this.fullSelector('[up-instant]'), function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return u.muteRejection(_this.onMousedown.apply(_this, args));
        });
    };
    FollowVariant.prototype.followLink = function (link, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var promise;
        promise = up.event.whenEmitted('up:link:follow', {
            log: 'Following link',
            target: link
        });
        promise = promise.then(function () {
            if (!options.preload) {
                up.feedback.start(link);
            }
            return _this.followNow(link, options);
        });
        if (!options.preload) {
            // Make sure we always remove .up-active, even if the follow fails or the user
            // does not confirm an [up-confirm] link. However, don't re-assign promise
            // to the result of up.always() since that would change the state of promise.
            u.always(promise, function () {
                return up.feedback.stop(link);
            });
        }
        return promise;
    };
    FollowVariant.prototype.matchesLink = function (link) {
        return e.matches(link, this.fullSelector());
    };
    return FollowVariant;
}());


/***/ }),
/* 31 */
/***/ (function(module, exports) {

var u;
u = up.util;
/***
A linear task queue whose (2..n)th tasks can be changed at any time.

@function up.DivertibleChain
@internal
*/
up.DivertibleChain = /** @class */ (function () {
    function DivertibleChain() {
        this.reset = this.reset.bind(this);
        this.promise = this.promise.bind(this);
        this.allTasks = this.allTasks.bind(this);
        this.poke = this.poke.bind(this);
        this.asap = this.asap.bind(this);
        this.reset();
    }
    DivertibleChain.prototype.reset = function () {
        this.queue = [];
        return this.currentTask = void 0;
    };
    DivertibleChain.prototype.promise = function () {
        var lastTask;
        lastTask = u.last(this.allTasks());
        return (lastTask != null ? lastTask.promise : void 0) || Promise.resolve();
    };
    DivertibleChain.prototype.allTasks = function () {
        var tasks;
        tasks = [];
        if (this.currentTask) {
            tasks.push(this.currentTask);
        }
        tasks = tasks.concat(this.queue);
        return tasks;
    };
    DivertibleChain.prototype.poke = function () {
        var _this = this;
        var promise;
        if (!this.currentTask) { // don't start a new task while we're still running one
            if (this.currentTask = this.queue.shift()) {
                promise = this.currentTask();
                return u.always(promise, function () {
                    _this.currentTask = void 0;
                    return _this.poke();
                });
            }
        }
    };
    DivertibleChain.prototype.asap = function () {
        var newTasks = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            newTasks[_i] = arguments[_i];
        }
        this.queue = u.map(newTasks, u.previewable);
        this.poke();
        return this.promise();
    };
    return DivertibleChain;
}());


/***/ }),
/* 32 */
/***/ (function(module, exports) {

/***
@module up.framework
*/
up.framework = (function () {
    /***
    This event is [emitted](/up.emit) when Unpoly is [reset](/up.framework.reset) during unit tests.
  
    @event up:framework:reset
    @internal
    */
    /***
    Boots the Unpoly framework.
  
    **This is called automatically** by including the Unpoly JavaScript files.
  
    Unpoly will not boot if the current browser is [not supported](/up.browser.isSupported).
    This leaves you with a classic server-side application on legacy browsers.
  
    @function up.boot
    @internal
     */
    /***
    Resets Unpoly to the state when it was booted.
    All custom event handlers, animations, etc. that have been registered
    will be discarded.
  
    Emits event [`up:framework:reset`](/up:framework:reset).
  
    @function up.framework.reset
    @internal
    */
    var boot, emitReset, isBooting, u;
    u = up.util;
    isBooting = true;
    emitReset = function () {
        return up.emit('up:framework:reset', {
            log: 'Resetting framework'
        });
    };
    boot = function () {
        if (up.browser.isSupported()) {
            // This is called synchronously after all Unpoly modules have been parsed
            // and executed. User code hasn't been executed yet. Use this moment to
            // tell everyone to snapshot
            up.emit('up:framework:booted', {
                log: 'Framework booted'
            });
            isBooting = false;
            // From here on, all event handlers (both Unpoly's and user code) should be able
            // to work with the DOM, so wait for the DOM to be ready.
            return up.event.onReady(function () {
                // In case the DOM was already ready when up.event.boot() was called, we still
                // haven't executed user-provided code. So we wait one more frame until
                // user-provided compilers, event handlers, etc. have been registered.
                // This also gives async user-code a chance to run in the next microtask.
                return u.task(function () {
                    // At this point all user-code has been called.
                    // The following event will cause Unpoly to compile the <body>.
                    up.emit('up:app:boot', {
                        log: 'Booting user application'
                    });
                    return up.emit('up:app:booted', {
                        log: 'User application booted'
                    });
                });
            });
        }
        else {
            return typeof console.log === "function" ? console.log("Unpoly doesn't support this browser. Framework was not booted.") : void 0;
        }
    };
    return {
        reset: emitReset,
        boot: boot,
        isBooting: function () {
            return isBooting;
        }
    };
})();


/***/ }),
/* 33 */
/***/ (function(module, exports) {

/***
Events
======

Most Unpoly interactions emit DOM events that are prefixed with `up:`.

    document.addEventListener('up:modal:opened', (event) => {
      console.log('A new modal has just opened!')
    })

Events often have both present and past forms. For example,
`up:modal:open` is emitted before a modal starts to open.
`up:modal:opened` is emitted when the modal has finished its
opening animation.

\#\#\# Preventing events

You can prevent most present form events by calling `preventDefault()`:

    document.addEventListener('up:modal:open', (event) => {
      if (event.url == '/evil') {
        // Prevent the modal from opening
        event.preventDefault()
      }
    })

\#\#\# A better way to bind event listeners

Instead of using [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener),
you may find it convenient to use [`up.on()`](/up.on) instead:

    up.on('click', 'button', function(event, button, data) {
      // button is the clicked element
      // data is the parsed [`up-data`](/up-data) attribute
    })

There are some advantages to using `up.on()`:

  - You may pass a selector for [event delegation](https://davidwalsh.name/event-delegate).
  - The event target is automatically passed as a second argument.
  - You may register a listener to multiple events by passing a space-separated list of event name (e.g. `"click mousedown"`).
  - You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/up.util.isList) of elements.
  - You may use an [`[up-data]`](/up-data) attribute to [attach structured data](/up.on#attaching-structured-data)
    to observed elements. If an `[up-data]` attribute is set, its value will automatically be
    parsed as JSON and passed as a third argument.
  - Event listeners on [unsupported browsers](/up.browser.isSupported) are silently discarded,
    leaving you with an application without JavaScript. This is typically preferable to
    a soup of randomly broken JavaScript in ancient browsers.

@module up.event
*/
up.event = (function () {
    /***
    Listens to an event on `document` or a given element.
    The event handler is called with the event target as a
    [jQuery collection](https://learn.jquery.com/using-jquery-core/jquery-object/).
  
    If you're not using jQuery, use `up.on()` instead, which calls
    event handlers with a native element.
  
    \#\#\# Example
  
    ```
    up.$on('click', 'a', function(event, $link) {
    console.log("Click on a link with destination %s", $element.attr('href'))
    })
    ```
  
    @function up.$on
    @param {Element|jQuery} [element=document]
    The element on which to register the event listener.
  
    If no element is given, the listener is registered on the `document`.
    @param {string} events
    A space-separated list of event names to bind to.
    @param {string} [selector]
    The selector of an element on which the event must be triggered.
    Omit the selector to listen to all events with that name, regardless
    of the event target.
    @param {Function(event, [element], [data])} listener
    The listener function that should be called.
  
    The function takes the affected element as the first argument).
    If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
    and passed as a second argument.
    @return {Function()}
    A function that unbinds the event listeners when called.
    @stable
    */
    /***
    Listens to a [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events)
    on `document` or a given element.
  
    `up.on()` has some quality of life improvements over
    [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener):
  
    - You may pass a selector for [event delegation](https://davidwalsh.name/event-delegate).
    - The event target is automatically passed as a second argument.
    - You may register a listener to multiple events by passing a space-separated list of event name (e.g. `"click mousedown"`)
    - You may register a listener to multiple elements in a single `up.on()` call, by passing a [list](/up.util.isList) of elements.
    - You use an [`[up-data]`](/up-data) attribute to [attach structured data](/up.on#attaching-structured-data)
      to observed elements. If an `[up-data]` attribute is set, its value will automatically be
      parsed as JSON and passed as a third argument.
    - Event listeners on [unsupported browsers](/up.browser.isSupported) are silently discarded,
      leaving you with an application without JavaScript. This is typically preferable to
      a soup of randomly broken JavaScript in ancient browsers.
  
    \#\#\# Examples
  
    The code below will call the listener when a `<a>` is clicked
    anywhere in the `document`:
  
    up.on('click', 'a', function(event, element) {
    console.log("Click on a link %o", element)
    })
  
    You may also bind the listener to a given element instead of `document`:
  
    var form = document.querySelector('form')
    up.on(form, 'click', function(event, form) {
    console.log("Click within %o", form)
    })
  
    You may also pass both an element and a selector
    for [event delegation](https://davidwalsh.name/event-delegate):
  
    var form = document.querySelector('form')
    document.addEventListener(form, 'click', 'a', function(event, link) {
    console.log("Click on a link %o within %o", link, form)
    })
  
    \#\#\# Attaching structured data
  
    In case you want to attach structured data to the event you're observing,
    you can serialize the data to JSON and put it into an `[up-data]` attribute:
  
    <span class='person' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
    <span class='person' up-data='{ "age": 22, "name": "Jim" }'>Jim</span>
  
    The JSON will be parsed and handed to your event handler as a third argument:
  
    up.on('click', '.person', function(event, element, data) {
    console.log("This is %o who is %o years old", data.name, data.age)
    })
  
    \#\#\# Unbinding an event listener
  
    `up.on()` returns a function that unbinds the event listeners when called:
  
    // Define the listener
    var listener =  function(event) { ... }
  
    // Binding the listener returns an unbind function
    var unbind = up.on('click', listener)
  
    // Unbind the listener
    unbind()
  
    There is also a function [`up.off()`](/up.off) which you can use for the same purpose:
  
    // Define the listener
    var listener =  function(event) { ... }
  
    // Bind the listener
    up.on('click', listener)
  
    // Unbind the listener
    up.off('click', listener)
  
    @function up.on
    @param {Element|jQuery} [element=document]
      The element on which to register the event listener.
  
      If no element is given, the listener is registered on the `document`.
    @param {string} events
      A space-separated list of event names to bind to.
    @param {string} [selector]
      The selector of an element on which the event must be triggered.
      Omit the selector to listen to all events with that name, regardless
      of the event target.
    @param {Function(event, [element], [data])} listener
      The listener function that should be called.
  
      The function takes the affected element as the first argument).
      If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
      and passed as a second argument.
    @return {Function()}
      A function that unbinds the event listeners when called.
    @stable
    */
    /***
    @function up.event.consumeAction
    @internal
    */
    /***
    Emits a event with the given name and properties.
  
    The event will be triggered as an event on `document` or on the given element.
  
    Other code can subscribe to events with that name using
    [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
    or [`up.on()`](/up.on).
  
    \#\#\# Example
  
    up.on('my:event', function(event) {
      console.log(event.foo)
    })
  
    up.emit('my:event', { foo: 'bar' })
    // Prints "bar" to the console
  
    @function up.emit
    @param {Element|jQuery} [target=document]
    The element on which the event is triggered.
  
    If omitted, the event will be emitted on the `document`.
    @param {string} eventName
    The name of the event.
    @param {Object} [eventProps={}]
    A list of properties to become part of the event object
    that will be passed to listeners. Note that the event object
    will by default include properties like `preventDefault()`
    or `stopPropagation()`.
    @param {string|Array} [eventProps.log=false]
    A message to print to the console when the event is emitted.
  
    Pass `true` to print a default message
    @param {Element|jQuery} [eventProps.target=document]
    The element on which the event is triggered.
    @stable
    */
    /***
    Prevents the event from bubbling up the DOM.
    Also prevents other event handlers bound on the same element.
    Also prevents the event's default action.
  
    \#\#\# Example
  
    up.on('click', 'link.disabled', function(event) {
      up.event.halt(event)
    })
  
    @function up.event.halt
    @param {Event} event
    @experimental
    */
    /***
    [Emits an event](/up.emit) and returns whether no listener
    has prevented the default action.
  
    @function up.event.nobodyPrevents
    @param {string} eventName
    @param {Object} eventProps
    @param {string|Array} [eventProps.log]
    @return {boolean}
      whether no listener has prevented the default action
    @experimental
    */
    /***
    Registers an event listener to be called when the user
    presses the `Escape` key.
  
    @function up.event.onEscape
    @param {Function(event)} listener
      The listener function to register.
    @return {Function()}
      A function that unbinds the event listeners when called.
    @experimental
    */
    /***
    Unbinds an event listener previously bound with [`up.on()`](/up.on).
  
    \#\#\# Example
  
    Let's say you are listing to clicks on `.button` elements:
  
    var listener = function() { ... }
    up.on('click', '.button', listener)
  
    You can stop listening to these events like this:
  
    up.off('click', '.button', listener)
  
    Note that you need to pass `up.off()` a reference to the same listener function
    that was passed to `up.on()` earlier.
  
    @function up.off
    @stable
    */
    /***
    [Emits](/up.emit) the given event and returns a promise
    that will be fulfilled if no listener has prevented the default action.
  
    If any listener prevented the default listener
    the returned promise will never be resolved.
  
    @function up.event.whenEmitted
    @param {string} eventName
    @param {Object} eventProps
    @param {string|Array} [eventProps.message]
    @return {Promise}
    @internal
    */
    var $bind, bind, bindNow, buildEvent, consumeAction, e, emit, halt, logEmission, nobodyPrevents, onEscape, onReady, reset, u, unbind, whenEmitted;
    u = up.util;
    e = up.element;
    reset = function () {
        var element, i, len, ref, results;
        ref = [window, document, document.documentElement, document.body];
        // Resets the list of registered event listeners to the
        // moment when the framework was booted.
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
            element = ref[i];
            results.push(up.EventListener.unbindNonDefault(element));
        }
        return results;
    };
    bind = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return bindNow(args);
    };
    $bind = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return bindNow(args, {
            jQuery: true
        });
    };
    bindNow = function (args, options) {
        if (!up.browser.isSupported()) {
            return (function () { });
            // Silently discard any event handlers that are registered on unsupported
            // browsers and return a no-op destructor
        }
        return up.EventListener.bind(args, options);
    };
    unbind = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return up.EventListener.unbind(args);
    };
    emit = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var event, eventName, eventProps, target, targetFromProps;
        if (args[0].addEventListener) {
            target = args.shift();
        }
        else if (u.isJQuery(args[0])) {
            target = e.get(args.shift());
        }
        eventName = args[0];
        eventProps = args[1] || {};
        if (targetFromProps = u.pluckKey(eventProps, 'target')) {
            target = targetFromProps;
        }
        if (target == null) {
            target = document;
        }
        logEmission(eventName, eventProps);
        event = buildEvent(eventName, eventProps);
        target.dispatchEvent(event);
        return event;
    };
    buildEvent = function (name, props) {
        var event;
        event = document.createEvent('Event');
        event.initEvent(name, true, true); // name, bubbles, cancelable
        u.assign(event, props);
        // IE11 does not set { defaultPrevented: true } after #preventDefault()
        // was called on a custom event.
        // See discussion here: https://stackoverflow.com/questions/23349191
        if (up.browser.isIE11()) {
            event.preventDefault = function () {
                return Object.defineProperty(event, 'defaultPrevented', {
                    get: function () {
                        return true;
                    }
                });
            };
        }
        return event;
    };
    logEmission = function (eventName, eventProps) {
        var _a;
        var message, messageArgs;
        if (!up.log.isEnabled()) {
            return;
        }
        message = u.pluckKey(eventProps, 'log');
        if (u.isArray(message)) {
            _a = message, message = _a[0], messageArgs = _a.slice(1);
        }
        else {
            messageArgs = [];
        }
        if (u.isString(message)) {
            if (u.isPresent(eventProps)) {
                return up.puts.apply(up, [message + " (%s (%o))"].concat(messageArgs, [eventName, eventProps]));
            }
            else {
                return up.puts.apply(up, [message + " (%s)"].concat(messageArgs, [eventName]));
            }
        }
        else if (message === true) {
            if (u.isPresent(eventProps)) {
                return up.puts('Event %s (%o)', eventName, eventProps);
            }
            else {
                return up.puts('Event %s', eventName);
            }
        }
    };
    nobodyPrevents = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var event;
        event = emit.apply(void 0, args);
        return !event.defaultPrevented;
    };
    whenEmitted = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            if (nobodyPrevents.apply(void 0, args)) {
                return resolve();
            }
            else {
                return reject(new Error("Event " + args[0] + " was prevented"));
            }
        });
    };
    onEscape = function (listener) {
        return bind('keydown', 'body', function (event) {
            if (u.escapePressed(event)) {
                return listener(event);
            }
        });
    };
    halt = function (event) {
        event.stopImmediatePropagation();
        return event.preventDefault();
    };
    consumeAction = function (event) {
        // Halt the event chain to stop duplicate processing of this user interaction.
        halt(event);
        if (event.type !== 'up:action:consumed') {
            // Although we have consumed this action and halted the event chain,
            // other components might still need to react. E.g. a popup needs to close when
            // an outside link consumes the user click. So we emit another event for that.
            return emit(event.target, 'up:action:consumed', {
                log: false
            });
        }
    };
    onReady = function (callback) {
        // Values are "loading", "interactive" and "completed".
        // https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState
        if (document.readyState !== 'loading') {
            return callback();
        }
        else {
            return document.addEventListener('DOMContentLoaded', callback);
        }
    };
    bind('up:framework:reset', reset);
    return {
        on: bind,
        $on: $bind,
        off: unbind,
        emit: emit,
        nobodyPrevents: nobodyPrevents,
        whenEmitted: whenEmitted,
        onEscape: onEscape,
        halt: halt,
        consumeAction: consumeAction,
        onReady: onReady
    };
})();
up.on = up.event.on;
up.$on = up.event.$on;
up.off = up.event.off;
up.$off = up.event.off; // it's the same as up.off()
up.emit = up.event.emit;
up.legacy.renamedModule('bus', 'event');


/***/ }),
/* 34 */
/***/ (function(module, exports) {

//###**
//Cookies
//=======
//class up.cookies
//###
//up.cookie = (->
//  u = up.util
//  escape = encodeURIComponent
//  unescape = decodeURIComponent
//  lastRaw = undefined
//  lastParsed = {}
//  all = ->
//    currentRaw = document.cookie
//    if u.isUndefined(lastRaw) || lastRaw != currentRaw
//      lastParsed = parse()
//      lastRaw = currentRaw
//    lastParsed
//  parse = ->
//    hash = {}
//    pairs = u.splitValues(document.cookie, ';')
//    for pair in pairs
//      parts = u.splitValues(pair, '=')
//      name = unescape(parts[0])
//      value = unescape(parts[1])
//      hash[name] = value
//    hash
//  remove = (name) ->
//    set(name, '', 'expires=Thu, 01-Jan-70 00:00:01 GMT; path=/')
//  get = (name) ->
//    all()[name]
//  set = (name, value, meta) ->
//    str = escape(name) + '=' + escape(value)
//    str += ';' + meta if meta
//    document.cookie = str
//    lastRaw = undefined
//  pop = (name) ->
//    value = get(name)
//    if u.isPresent(value)
//      remove(name)
//    value
//  all: all
//  get: get
//  set: set
//  remove: remove
//  pop: pop
//)()


/***/ }),
/* 35 */
/***/ (function(module, exports) {

/***
Server protocol
===============

You rarely need to change server-side code
in order to use Unpoly. There is no need to provide a JSON API, or add
extra routes for AJAX requests. The server simply renders a series
of full HTML pages, just like it would without Unpoly.

That said, there is an **optional** protocol your server can use to
exchange additional information when Unpoly is [updating fragments](/up.link).

While the protocol can help you optimize performance and handle some
edge cases, implementing it is **entirely optional**. For instance,
`unpoly.com` itself is a static site that uses Unpoly on the frontend
and doesn't even have a server component.

## Existing implementations

You should be able to implement the protocol in a very short time.
There are existing implementations for various web frameworks:

- [Ruby on Rails](/install/rails)
- [Roda](https://github.com/adam12/roda-unpoly)
- [Rack](https://github.com/adam12/rack-unpoly) (Sinatra, Padrino, Hanami, Cuba, ...)
- [Phoenix](https://elixirforum.com/t/unpoly-a-framework-like-turbolinks/3614/15) (Elixir)

## Protocol details

\#\#\# Redirect detection for IE11

On Internet Explorer 11, Unpoly cannot detect the final URL after a redirect.
You can fix this edge case by delivering an additional HTTP header
with the *last* response in a series of redirects:

```http
X-Up-Location: /current-url
```

The **simplest implementation** is to set these headers for every request.

\#\#\# Optimizing responses

When [updating a fragment](/up.link), Unpoly will send an
additional HTTP header containing the CSS selector that is being replaced:

```http
X-Up-Target: .user-list
```

Server-side code is free to **optimize its response** by only returning HTML
that matches the selector. For example, you might prefer to not render an
expensive sidebar if the sidebar is not targeted.

Unpoly will often update a different selector in case the request fails.
This selector is also included as a HTTP header:

```
X-Up-Fail-Target: body
```

\#\#\# Pushing a document title to the client

When [updating a fragment](/up.link), Unpoly will by default
extract the `<title>` from the server response and update the document title accordingly.

The server can also force Unpoly to set a document title by passing a HTTP header:

```http
X-Up-Title: My server-pushed title
```

This is useful when you [optimize your response](#optimizing-responses) and not render
the application layout unless it is targeted. Since your optimized response
no longer includes a `<title>`, you can instead use the HTTP header to pass the document title.

\#\#\# Signaling failed form submissions

When [submitting a form via AJAX](/form-up-target)
Unpoly needs to know whether the form submission has failed (to update the form with
validation errors) or succeeded (to update the `up-target` selector).

For Unpoly to be able to detect a failed form submission, the response must be
return a non-200 HTTP status code. We recommend to use either
400 (bad request) or 422 (unprocessable entity).

To do so in [Ruby on Rails](http://rubyonrails.org/), pass a [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option):

    class UsersController < ApplicationController

      def create
        user_params = params[:user].permit(:email, :password)
        @user = User.new(user_params)
        if @user.save?
          sign_in @user
        else
          render 'form', status: :bad_request
        end
      end

    end

\#\#\# Detecting live form validations

When [validating a form](/input-up-validate), Unpoly will
send an additional HTTP header containing a CSS selector for the form that is
being updated:

```http
X-Up-Validate: .user-form
```

When detecting a validation request, the server is expected to **validate (but not save)**
the form submission and render a new copy of the form with validation errors.

Below you will an example for a writing route that is aware of Unpoly's live form
validations. The code is for [Ruby on Rails](http://rubyonrails.org/),
but you can adapt it for other languages:

    class UsersController < ApplicationController

      def create
        user_params = params[:user].permit(:email, :password)
        @user = User.new(user_params)
        if request.headers['X-Up-Validate']
          @user.valid?  # run validations, but don't save to the database
          render 'form' # render form with error messages
        elsif @user.save?
          sign_in @user
        else
          render 'form', status: :bad_request
        end
      end

    end

\#\#\# Signaling the initial request method

If the initial page was loaded  with a non-`GET` HTTP method, Unpoly prefers to make a full
page load when you try to update a fragment. Once the next page was loaded with a `GET` method,
Unpoly will restore its standard behavior.

This fixes two edge cases you might or might not care about:

1. Unpoly replaces the initial page state so it can later restore it when the user
   goes back to that initial URL. However, if the initial request was a POST,
   Unpoly will wrongly assume that it can restore the state by reloading with GET.
2. Some browsers have a bug where the initial request method is used for all
   subsequently pushed states. That means if the user reloads the page on a later
   GET state, the browser will wrongly attempt a POST request.
   This issue affects Safari 9-12 (last tested in 2019-03).
   Modern Firefoxes, Chromes and IE10+ don't have this behavior.

In order to allow Unpoly to detect the HTTP method of the initial page load,
the server must set a cookie:

```http
Set-Cookie: _up_method=POST
```

When Unpoly boots, it will look for this cookie and configure its behavior accordingly.
The cookie is then deleted in order to not affect following requests.

The **simplest implementation** is to set this cookie for every request that is neither
`GET` nor contains an [`X-Up-Target` header](/#optimizing-responses). For all other requests
an existing cookie should be deleted.

@module up.protocol
 */
up.protocol = (function () {
    /***
    Configures strings used in the optional [server protocol](/up.protocol).
  
    @property up.protocol.config
    @param {String} [config.targetHeader='X-Up-Target']
    @param {String} [config.failTargetHeader='X-Up-Fail-Target']
    @param {String} [config.locationHeader='X-Up-Location']
    @param {String} [config.titleHeader='X-Up-Title']
    @param {String} [config.validateHeader='X-Up-Validate']
    @param {String} [config.methodHeader='X-Up-Method']
    @param {String} [config.methodCookie='_up_method']
      The name of the optional cookie the server can send to
      [signal the initial request method](/up.protocol#signaling-the-initial-request-method).
    @param {String} [config.methodParam='_method']
      The name of the POST parameter when [wrapping HTTP methods](/up.proxy.config#config.wrapMethods)
      in a `POST` request.
    @param {String} [config.csrfHeader='X-CSRF-Token']
      The name of the HTTP header that will include the
      [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
      for AJAX requests.
    @param {string|Function(): string} [config.csrfParam]
      The `name` of the hidden `<input>` used for sending a
      [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern) when
      submitting a default, non-AJAX form. For AJAX request the token is sent as an HTTP header instead.
  
      The parameter name can be configured as a string or as function that returns the parameter name.
      If no name is set, no token will be sent.
  
      Defaults to the `content` attribute of a `<meta>` tag named `csrf-param`:
  
          <meta name="csrf-param" content="authenticity_token" />
  
    @param {string|Function(): string} [config.csrfToken]
      The [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
      to send for unsafe requests. The token will be sent as either a HTTP header (for AJAX requests)
      or hidden form `<input>` (for default, non-AJAX form submissions).
  
      The token can either be configured as a string or as function that returns the token.
      If no token is set, no token will be sent.
  
      Defaults to the `content` attribute of a `<meta>` tag named `csrf-token`:
  
          <meta name='csrf-token' content='secret12345'>
  
    @experimental
    */
    /***
    Server-side companion libraries like unpoly-rails set this cookie so we
    have a way to detect the request method of the initial page load.
    There is no JavaScript API for this.
  
    @function up.protocol.initialRequestMethod
    @internal
    */
    /***
    @function up.protocol.locationFromXhr
    @internal
    */
    /***
    @function up.protocol.methodFromXhr
    @internal
    */
    /***
    @function up.protocol.titleFromXhr
    @internal
    */
    var config, csrfParam, csrfToken, e, initialRequestMethod, locationFromXhr, methodFromXhr, reset, titleFromXhr, u;
    u = up.util;
    e = up.element;
    locationFromXhr = function (xhr) {
        return xhr.getResponseHeader(config.locationHeader) || xhr.responseURL;
    };
    titleFromXhr = function (xhr) {
        return xhr.getResponseHeader(config.titleHeader);
    };
    methodFromXhr = function (xhr) {
        var method;
        if (method = xhr.getResponseHeader(config.methodHeader)) {
            return u.normalizeMethod(method);
        }
    };
    initialRequestMethod = u.memoize(function () {
        var methodFromServer;
        methodFromServer = up.browser.popCookie(config.methodCookie);
        return (methodFromServer || 'get').toLowerCase();
    });
    // Remove the method cookie as soon as possible.
    // Don't wait until the first call to initialRequestMethod(),
    // which might be much later.
    up.on('up:framework:booted', initialRequestMethod);
    config = new up.Config({
        targetHeader: 'X-Up-Target',
        failTargetHeader: 'X-Up-Fail-Target',
        locationHeader: 'X-Up-Location',
        validateHeader: 'X-Up-Validate',
        titleHeader: 'X-Up-Title',
        methodHeader: 'X-Up-Method',
        methodCookie: '_up_method',
        methodParam: '_method',
        csrfParam: function () {
            return e.metaContent('csrf-param');
        },
        csrfToken: function () {
            return e.metaContent('csrf-token');
        },
        csrfHeader: 'X-CSRF-Token'
    });
    csrfParam = function () {
        return u.evalOption(config.csrfParam);
    };
    csrfToken = function () {
        return u.evalOption(config.csrfToken);
    };
    reset = function () {
        return config.reset();
    };
    up.on('up:framework:reset', reset);
    return {
        config: config,
        reset: reset,
        locationFromXhr: locationFromXhr,
        titleFromXhr: titleFromXhr,
        methodFromXhr: methodFromXhr,
        csrfParam: csrfParam,
        csrfToken: csrfToken,
        initialRequestMethod: initialRequestMethod
    };
})();


/***/ }),
/* 36 */
/***/ (function(module, exports) {

/***
Logging
=======

Unpoly can print debugging information to the developer console, e.g.:

- Which [events](/up.event) are called
- When we're [making requests to the network](/up.proxy)
- Which [compilers](/up.syntax) are applied to which elements

You can activate logging by calling [`up.log.enable()`](/up.log.enable).
The output can be configured using the [`up.log.config`](/up.log.config) property.

@module up.log
*/
up.log = (function () {
    /***
    A cross-browser way to interact with `console.log`, `console.error`, etc.
  
    This function falls back to `console.log` if the output stream is not implemented.
    It also prints substitution strings (e.g. `console.log("From %o to %o", "a", "b")`)
    as a single string if the browser console does not support substitution strings.
  
    \#\#\# Example
  
    up.browser.puts('log', 'Hi world')
    up.browser.puts('error', 'There was an error in %o', obj)
  
    @function up.browser.puts
    @internal
    */
    /***
    Configures the logging output on the developer console.
  
    @property up.log.config
    @param {boolean} [options.enabled=false]
      Whether Unpoly will print debugging information to the developer console.
  
      Debugging information includes which elements are being [compiled](/up.syntax)
      and which [events](/up.event) are being emitted.
      Note that errors will always be printed, regardless of this setting.
    @param {boolean} [options.collapse=false]
      Whether debugging information is printed as a collapsed tree.
  
      Set this to `true` if you are overwhelmed by the debugging information Unpoly
      prints to the developer console.
    @param {string} [options.prefix='[UP] ']
      A string to prepend to Unpoly's logging messages so you can distinguish it from your own messages.
    @stable
    */
    /***
    Prints a debugging message to the browser console.
  
    @function up.log.debug
    @param {string} message
    @param {Array} ...args
    @internal
    */
    /***
    Prevents future Unpoly events from printing vast amounts of debugging information to the developer console.
  
    Errors will still be printed, even with logging disabled.
  
    @function up.log.disable
    @stable
    */
    /***
    Makes future Unpoly events print vast amounts of debugging information to the developer console.
  
    Debugging information includes which elements are being [compiled](/up.syntax)
    and which [events](/up.event) are being emitted.
  
    @function up.log.enable
    @stable
    */
    /***
    @function up.log.error
    @internal
    */
    /***
    - Makes sure the group always closes
    - Does not make a group if the message is nil
  
    @function up.log.group
    @internal
    */
    /***
    Prints a logging message to the browser console.
  
    @function up.puts
    @param {string} message
    @param {Array} ...args
    @internal
    */
    /***
    See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions
  
    @function up.browser.sprintf
    @internal
    */
    /***
    @function up.browser.sprintfWithFormattedArgs
    @internal
    */
    /***
    @function up.warn
    @internal
    */
    var CONSOLE_PLACEHOLDERS, b, callConsole, config, debug, disable, enable, error, group, prefix, printBanner, puts, reset, sessionStore, setEnabled, sprintf, sprintfWithFormattedArgs, stringifyArg, u, warn;
    u = up.util;
    b = up.browser;
    sessionStore = new up.store.Session('up.log');
    config = new up.Config({
        prefix: '[UP] ',
        enabled: sessionStore.get('enabled'),
        collapse: false
    });
    reset = function () {
        return config.reset();
    };
    prefix = function (message) {
        return "" + config.prefix + message;
    };
    callConsole = function (stream) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return console[stream].apply(console, args);
    };
    CONSOLE_PLACEHOLDERS = /\%[odisf]/g;
    stringifyArg = function (arg) {
        var attr, closer, j, len, maxLength, ref, string, value;
        maxLength = 200;
        closer = '';
        if (u.isString(arg)) {
            string = arg.replace(/[\n\r\t ]+/g, ' ');
            string = string.replace(/^[\n\r\t ]+/, '');
            string = string.replace(/[\n\r\t ]$/, '');
            string = "\"" + string + "\"";
            closer = '"';
        }
        else if (u.isUndefined(arg)) {
            // JSON.stringify(undefined) is actually undefined
            string = 'undefined';
        }
        else if (u.isNumber(arg) || u.isFunction(arg)) {
            string = arg.toString();
        }
        else if (u.isArray(arg)) {
            string = "[" + u.map(arg, stringifyArg).join(', ') + "]";
            closer = ']';
        }
        else if (u.isJQuery(arg)) {
            string = "$(" + u.map(arg, stringifyArg).join(', ') + ")";
            closer = ')';
        }
        else if (u.isElement(arg)) {
            string = "<" + arg.tagName.toLowerCase();
            ref = ['id', 'name', 'class'];
            for (j = 0, len = ref.length; j < len; j++) {
                attr = ref[j];
                if (value = arg.getAttribute(attr)) {
                    string += " " + attr + "=\"" + value + "\"";
                }
            }
            string += ">";
            closer = '>'; // object
        }
        else {
            string = JSON.stringify(arg);
        }
        if (string.length > maxLength) {
            string = string.substr(0, maxLength) + " \u2026";
            string += closer;
        }
        return string;
    };
    sprintf = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return sprintfWithFormattedArgs.apply(void 0, [u.identity, message].concat(args));
    };
    sprintfWithFormattedArgs = function (formatter, message) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var i;
        if (u.isBlank(message)) {
            return '';
        }
        i = 0;
        return message.replace(CONSOLE_PLACEHOLDERS, function () {
            var arg;
            arg = args[i];
            arg = formatter(stringifyArg(arg));
            i += 1;
            return arg;
        });
    };
    debug = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (config.enabled && message) {
            return console.debug.apply(console, [prefix(message)].concat(args));
        }
    };
    puts = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (config.enabled && message) {
            return console.log.apply(console, [prefix(message)].concat(args));
        }
    };
    warn = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (message) {
            return console.warn.apply(console, [prefix(message)].concat(args));
        }
    };
    group = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var block, fn;
        block = args.pop(); // Coffeescript copies the arguments array
        if (config.enabled && message) {
            fn = config.collapse ? 'groupCollapsed' : 'group';
            console[fn].apply(console, [prefix(message)].concat(args));
            try {
                return block();
            }
            finally {
                if (message) {
                    console.groupEnd();
                }
            }
        }
        else {
            return block();
        }
    };
    error = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (message) {
            return console.error.apply(console, [prefix(message)].concat(args));
        }
    };
    printBanner = function () {
        var banner;
        // The ASCII art looks broken in code since we need to escape backslashes
        banner = " __ _____  ___  ___  / /_ __\n" + ("/ // / _ \\/ _ \\/ _ \\/ / // /  " + up.version + "\n") + "\\___/_//_/ .__/\\___/_/\\_. / \n" + "        / /            / /\n" + "\n";
        if (config.enabled) {
            banner += "Call `up.log.disable()` to disable logging for this session.";
        }
        else {
            banner += "Call `up.log.enable()` to enable logging for this session.";
        }
        return console.log(banner);
    };
    up.on('up:framework:booted', printBanner);
    up.on('up:framework:reset', reset);
    setEnabled = function (value) {
        sessionStore.set('enabled', value);
        return config.enabled = value;
    };
    enable = function () {
        return setEnabled(true);
    };
    disable = function () {
        return setEnabled(false);
    };
    return {
        puts: puts,
        sprintf: sprintf,
        sprintfWithFormattedArgs: sprintfWithFormattedArgs,
        puts: puts,
        debug: debug,
        error: error,
        warn: warn,
        group: group,
        config: config,
        enable: enable,
        disable: disable,
        isEnabled: function () {
            return config.enabled;
        }
    };
})();
up.puts = up.log.puts;
up.warn = up.log.warn;


/***/ }),
/* 37 */
/***/ (function(module, exports) {

/***
Toast alerts
============

@module up.toast
*/
up.toast = (function () {
    var VARIABLE_FORMATTER, addAction, close, e, isOpen, messageToHtml, open, reset, state, u;
    u = up.util;
    e = up.element;
    VARIABLE_FORMATTER = function (arg) {
        return "<span class='up-toast-variable'>" + u.escapeHtml(arg) + "</span>";
    };
    state = new up.Config({
        element: null
    });
    reset = function () {
        close();
        return state.reset();
    };
    messageToHtml = function (message) {
        var _a;
        if (u.isArray(message)) {
            message[0] = u.escapeHtml(message[0]);
            message = (_a = up.log).sprintfWithFormattedArgs.apply(_a, [VARIABLE_FORMATTER].concat(message));
        }
        else {
            message = u.escapeHtml(message);
        }
        return message;
    };
    isOpen = function () {
        return !!state.element;
    };
    addAction = function (label, callback) {
        var action, actions;
        actions = state.element.querySelector('.up-toast-actions');
        action = e.affix(actions, '.up-toast-action');
        action.innerText = label;
        return action.addEventListener('click', callback);
    };
    open = function (message, options) {
        if (options === void 0) { options = {}; }
        var action;
        close();
        message = messageToHtml(message);
        state.element = e.createFromHtml("<div class=\"up-toast\">\n  <div class=\"up-toast-message\">" + message + "</div>\n  <div class=\"up-toast-actions\"></div>\n</div>");
        if (action = options.action || options.inspect) {
            addAction(action.label, action.callback);
        }
        addAction('Close', close);
        return document.body.appendChild(state.element);
    };
    close = function () {
        if (isOpen()) {
            e.remove(state.element);
            return state.element = null;
        }
    };
    // The framework is reset between tests
    up.on('up:framework:reset', reset);
    return {
        open: open,
        close: close,
        reset: reset,
        isOpen: isOpen
    };
})();


/***/ }),
/* 38 */
/***/ (function(module, exports) {

/***
Custom JavaScript
=================

Every app needs a way to pair JavaScript snippets with certain HTML elements,
in order to integrate libraries or implement custom behavior.

Unpoly lets you organize your JavaScript snippets using [compilers](/up.compiler).

For instance, to activate the [Masonry](http://masonry.desandro.com/) library for every element
with a `grid` class, use this compiler:

    up.compiler('.grid', function(element) {
      new Masonry(element, { itemSelector: '.grid--item' })
    })

The compiler function will be called on matching elements when the page loads
or when a matching fragment is [inserted via AJAX](/up.link) later.

@module up.syntax
*/
up.syntax = (function () {
    /***
    Runs any destructor on the given fragment and its descendants.
    Unlike [`up.destroy()`](/up.destroy), this doesn't emit any events
    and does not remove the element from the DOM.
  
    @function up.syntax.clean
    @internal
    */
    /***
    Applies all compilers on the given element and its descendants.
    Unlike [`up.hello()`](/up.hello), this doesn't emit any events.
  
    @function up.syntax.compile
    @param {Array<Element>} [options.skip]
    A list of elements whose subtrees should not be compiled.
    @internal
    */
    /***
    Registers a function to be called when an element with
    the given selector is inserted into the DOM.
  
    Use compilers to activate your custom Javascript behavior on matching
    elements.
  
    You should migrate your [`DOMContentLoaded`](https://api.jquery.com/ready/)
    callbacks to compilers. This will make sure they run both at page load and
    when [a new fragment is inserted later](/a-up-target).
    It will also organize your JavaScript snippets by selector of affected elements.
  
    \#\#\# Example
  
    This jQuery compiler will insert the current time into a
    `<div class='current-time'></div>`:
  
        up.compiler('.current-time', function(element) {
          var now = new Date()
          element.textContent = now.toString()
        })
  
    The compiler function will be called once for each matching element when
    the page loads, or when a matching fragment is [inserted](/up.replace) later.
  
    \#\#\# Integrating JavaScript libraries
  
    `up.compiler()` is a great way to integrate JavaScript libraries.
    Let's say your JavaScript plugin wants you to call `lightboxify()`
    on links that should open a lightbox. You decide to
    do this for all links with an `lightbox` class:
  
        <a href="river.png" class="lightbox">River</a>
        <a href="ocean.png" class="lightbox">Ocean</a>
  
    This JavaScript will do exactly that:
  
        up.compiler('a.lightbox', function(element) {
          lightboxify(element)
        })
  
    \#\#\# Cleaning up after yourself
  
    If your compiler returns a function, Unpoly will use this as a *destructor* to
    clean up if the element leaves the DOM. Note that in Unpoly the same DOM and JavaScript environment
    will persist through many page loads, so it's important to not create
    [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).
  
    You should clean up after yourself whenever your compilers have global
    side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
    or [event handlers bound to the document root](/up.on).
  
    Here is a version of `.current-time` that updates
    the time every second, and cleans up once it's done. Note how it returns
    a function that calls `clearInterval`:
  
        up.compiler('.current-time', function(element) {
  
          function update() {
            var now = new Date()
            element.textContent = now.toString()
          }
  
          setInterval(update, 1000)
  
          return function() {
            clearInterval(update)
          };
  
        })
  
    If we didn't clean up after ourselves, we would have many ticking intervals
    operating on detached DOM elements after we have created and removed a couple
    of `<clock>` elements.
  
    \#\#\# Attaching structured data
  
    In case you want to attach structured data to the event you're observing,
    you can serialize the data to JSON and put it into an `[up-data]` attribute.
    For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
    might attach the location and names of its marker pins:
  
        <div class='google-map' up-data='[
          { "lat": 48.36, "lng": 10.99, "title": "Friedberg" },
          { "lat": 48.75, "lng": 11.45, "title": "Ingolstadt" }
        ]'></div>
  
    The JSON will be parsed and handed to your compiler as a second argument:
  
        up.compiler('.google-map', function(element, pins) {
          var map = new google.maps.Map(element)
  
          pins.forEach(function(pin) {
            var position = new google.maps.LatLng(pin.lat, pin.lng)
            new google.maps.Marker({
              position: position,
              map: map,
              title: pin.title
            })
          })
        })
  
    @function up.compiler
    @param {string} selector
      The selector to match.
    @param {number} [options.priority=0]
      The priority of this compiler.
      Compilers with a higher priority are run first.
      Two compilers with the same priority are run in the order they were registered.
    @param {boolean} [options.batch=false]
      If set to `true` and a fragment insertion contains multiple
      elements matching the selector, `compiler` is only called once
      with a jQuery collection containing all matching elements.
    @param {boolean} [options.keep=false]
      If set to `true` compiled fragment will be [persisted](/up-keep) during
      [page updates](/a-up-target).
  
      This has the same effect as setting an `up-keep` attribute on the element.
    @param {Function(element, data)} compiler
      The function to call when a matching element is inserted.
  
      The function takes the new element as the first argument.
      If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
      and passed as a second argument.
  
      The function may return a destructor function that cleans the compiled
      object before it is removed from the DOM. The destructor is supposed to
      [clear global state](/up.compiler#cleaning-up-after-yourself)
      such as timeouts and event handlers bound to the document.
      The destructor is *not* expected to remove the element from the DOM, which
      is already handled by [`up.destroy()`](/up.destroy).
    @stable
    */
    /***
    Registers a function to be called when the given element
    is [destroyed](/up.destroy).
  
    The preferred way to register a destructor function is to `return`
    it from a [compiler function](/up.compiler).
  
    @function up.destructor
    @param {Element} element
    @param {Function|Array<Function>} destructor
    One or more destructor functions
    @internal
    */
    /***
    Registers a function to be called when an element with
    the given selector is inserted into the DOM. The function is called
    with each matching element as a
    [jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).
  
    If you're not using jQuery, use `up.compiler()` instead, which calls
    the compiler function with a native element.
  
    \#\#\# Example
  
    This jQuery compiler will insert the current time into a
    `<div class='current-time'></div>`:
  
    up.$compiler('.current-time', function($element) {
      var now = new Date()
      $element.text(now.toString())
    })
  
    @function up.$compiler
    @param {string} selector
    The selector to match.
    @param {Object} [options]
    See [`options` argument for `up.compiler()`](/up.compiler#parameters).
    @param {Function($element, data)} compiler
    The function to call when a matching element is inserted.
  
    See [`compiler` argument for `up.compiler()`](/up.compiler#parameters).
    @stable
    */
    /***
    Registers a [compiler](/up.compiler) that is run before all other compilers.
    The compiler function is called with each matching element as a
    [jQuery object](https://learn.jquery.com/using-jquery-core/jquery-object/).
  
    If you're not using jQuery, use `up.macro()` instead, which calls
    the macro function with a native element.
  
    \#\#\# Example
  
    up.$macro('[content-link]', function($link) {
      $link.attr(
        'up-target': '.content',
        'up-transition': 'cross-fade',
        'up-duration':'300'
      )
    })
  
    @function up.$macro
    @param {string} selector
    The selector to match.
    @param {Object} options
    See [`options` argument for `up.compiler()`](/up.compiler#parameters).
    @param {Function(element, data)} macro
    The function to call when a matching element is inserted.
  
    See [`compiler` argument for `up.compiler()`](/up.compiler#parameters).
    @stable
    */
    /***
    Registers a [compiler](/up.compiler) that is run before all other compilers.
  
    Use `up.macro()` to register a compiler that sets multiply Unpoly attributes.
  
    \#\#\# Example
  
    You will sometimes find yourself setting the same combination of UJS attributes again and again:
  
    <a href="/page1" up-target=".content" up-transition="cross-fade" up-duration="300">Page 1</a>
    <a href="/page2" up-target=".content" up-transition="cross-fade" up-duration="300">Page 2</a>
    <a href="/page3" up-target=".content" up-transition="cross-fade" up-duration="300">Page 3</a>
  
    We would much rather define a new `[content-link]` attribute that let's us
    write the same links like this:
  
    <a href="/page1" content-link>Page 1</a>
    <a href="/page2" content-link>Page 2</a>
    <a href="/page3" content-link>Page 3</a>
  
    We can define the `[content-link]` attribute by registering a macro that
    sets the `[up-target]`, `[up-transition]` and `[up-duration]` attributes for us:
  
    up.macro('[content-link]', function(link) {
      link.setAttribute('up-target', '.content')
      link.setAttribute('up-transition', 'cross-fade')
      link.setAttribute('up-duration', '300')
    })
  
    Examples for built-in macros are [`a[up-dash]`](/a-up-dash) and [`[up-expand]`](/up-expand).
  
    @function up.macro
    @param {string} selector
    The selector to match.
    @param {Object} options
    See options for [`up.compiler()`](/up.compiler).
    @param {Function(element, data)} macro
    The function to call when a matching element is inserted.
  
    See [`up.compiler()`](/up.compiler#parameters) for details.
    @stable
    */
    /***
    Resets the list of registered compiler directives to the
    moment when the framework was booted.
  
    @internal
    */
    var SYSTEM_MACRO_PRIORITIES, buildCompiler, clean, compile, compilers, detectSystemMacroPriority, e, insertCompiler, macros, parseCompilerArgs, readData, registerCompiler, registerDestructor, registerJQueryCompiler, registerJQueryMacro, registerMacro, reset, u;
    u = up.util;
    e = up.element;
    SYSTEM_MACRO_PRIORITIES = {
        '[up-back]': -100,
        '[up-drawer]': -200,
        '[up-dash]': -200,
        '[up-expand]': -300,
        '[data-method]': -400,
        '[data-confirm]': -400 // converts [data-conform] to [up-confirm] only if link has followable [up-*] attributes
    };
    compilers = [];
    macros = [];
    registerCompiler = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var compiler;
        compiler = buildCompiler(args);
        return insertCompiler(compilers, compiler);
    };
    registerJQueryCompiler = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var compiler;
        compiler = registerCompiler.apply(void 0, args);
        compiler.jQuery = true;
        return compiler;
    };
    registerMacro = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var macro;
        macro = buildCompiler(args);
        if (up.framework.isBooting()) {
            macro.priority = detectSystemMacroPriority(macro.selector) || up.fail('Unregistered priority for system macro %o', macro.selector);
        }
        return insertCompiler(macros, macro);
    };
    registerJQueryMacro = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var macro;
        macro = registerMacro.apply(void 0, args);
        macro.jQuery = true;
        return macro;
    };
    detectSystemMacroPriority = function (macroSelector) {
        var priority, substr;
        for (substr in SYSTEM_MACRO_PRIORITIES) {
            priority = SYSTEM_MACRO_PRIORITIES[substr];
            if (macroSelector.indexOf(substr) >= 0) {
                return priority;
            }
        }
    };
    parseCompilerArgs = function (args) {
        var callback, options, selector;
        selector = args.shift();
        callback = args.pop();
        options = u.extractOptions(args);
        return [selector, options, callback];
    };
    buildCompiler = function (args) {
        var _a;
        var callback, options, selector;
        _a = parseCompilerArgs(args), selector = _a[0], options = _a[1], callback = _a[2];
        options = u.options(options, {
            selector: selector,
            isDefault: up.framework.isBooting(),
            priority: 0,
            batch: false,
            keep: false,
            jQuery: false
        });
        return u.assign(callback, options);
    };
    insertCompiler = function (queue, newCompiler) {
        var existingCompiler, index;
        index = 0;
        while ((existingCompiler = queue[index]) && (existingCompiler.priority >= newCompiler.priority)) {
            index += 1;
        }
        queue.splice(index, 0, newCompiler);
        return newCompiler;
    };
    compile = function (fragment, options) {
        var compileRun, orderedCompilers;
        orderedCompilers = macros.concat(compilers);
        compileRun = new up.CompilePass(fragment, orderedCompilers, options);
        return compileRun.compile();
    };
    registerDestructor = function (element, destructor) {
        var destructors;
        if (!(destructors = element.upDestructors)) {
            destructors = [];
            element.upDestructors = destructors;
            element.classList.add('up-can-clean');
        }
        if (u.isArray(destructor)) {
            return destructors.push.apply(destructors, destructor);
        }
        else {
            return destructors.push(destructor);
        }
    };
    clean = function (fragment) {
        var cleanables;
        cleanables = e.subtree(fragment, '.up-can-clean');
        return u.each(cleanables, function (cleanable) {
            var destructor, destructors, i, len, results;
            if (destructors = cleanable.upDestructors) {
                results = [];
                for (i = 0, len = destructors.length; i < len; i++) {
                    destructor = destructors[i];
                    results.push(destructor());
                }
                return results;
            }
        });
    };
    // We do not actually remove the #upDestructors property or .up-can-* classes for performance reasons.
    // The element we just cleaned is about to be removed from the DOM.
    /***
    Checks if the given element has an [`up-data`](/up-data) attribute.
    If yes, parses the attribute value as JSON and returns the parsed object.
  
    Returns `undefined` if the element has no `up-data` attribute.
  
    \#\#\# Example
  
    You have an element with JSON data serialized into an `up-data` attribute:
  
        <span class='person' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
  
    Calling `up.syntax.data()` will deserialize the JSON string into a JavaScript object:
  
        up.syntax.data('.person') // returns { age: 18, name: 'Bob' }
  
    @function up.syntax.data
    @param {string|Element|jQuery} elementOrSelector
    @return
      The JSON-decoded value of the `up-data` attribute.
  
      Returns `undefined` if the element has no (or an empty) `up-data` attribute.
    @experimental
    */
    /***
    If an element with an `up-data` attribute enters the DOM,
    Unpoly will parse the JSON and pass the resulting object to any matching
    [`up.compiler()`](/up.compiler) handlers.
  
    For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
    might attach the location and names of its marker pins:
  
        <div class='google-map' up-data='[
    { "lat": 48.36, "lng": 10.99, "title": "Friedberg" },
    { "lat": 48.75, "lng": 11.45, "title": "Ingolstadt" }
        ]'></div>
  
    The JSON will be parsed and handed to your compiler as a second argument:
  
        up.compiler('.google-map', function(element, pins) {
    var map = new google.maps.Map(element)
    pins.forEach(function(pin) {
    var position = new google.maps.LatLng(pin.lat, pin.lng)
    new google.maps.Marker({
      position: position,
      map: map,
      title: pin.title
    })
    })
        })
  
    Similarly, when an event is triggered on an element annotated with
    [`up-data`], the parsed object will be passed to any matching
    [`up.on()`](/up.on) handlers.
  
        up.on('click', '.google-map', function(event, element, pins) {
    console.log("There are %d pins on the clicked map", pins.length)
        })
  
    @selector [up-data]
    @param {JSON} up-data
      A serialized JSON string
    @stable
    */
    readData = function (elementOrSelector) {
        var element;
        element = e.get(elementOrSelector);
        return e.jsonAttr(element, 'up-data') || {};
    };
    reset = function () {
        compilers = u.filter(compilers, 'isDefault');
        return macros = u.filter(macros, 'isDefault');
    };
    up.on('up:framework:reset', reset);
    return {
        compiler: registerCompiler,
        macro: registerMacro,
        $compiler: registerJQueryCompiler,
        $macro: registerJQueryMacro,
        destructor: registerDestructor,
        compile: compile,
        clean: clean,
        data: readData
    };
})();
up.compiler = up.syntax.compiler;
up.$compiler = up.syntax.$compiler;
up.destructor = up.syntax.destructor;
up.macro = up.syntax.macro;
up.$macro = up.syntax.$macro;


/***/ }),
/* 39 */
/***/ (function(module, exports) {

/***
History
========

In an Unpoly app, every page has an URL.

[Fragment updates](/up.link) automatically update the URL.

@module up.history
*/
up.history = (function () {
    /***
    Configures behavior when the user goes back or forward in browser history.
  
    @property up.history.config
    @param {Array} [config.popTargets=['body']]
      An array of CSS selectors to replace when the user goes
      back in history.
    @param {boolean} [config.restoreScroll=true]
      Whether to restore the known scroll positions
      when the user goes back or forward in history.
    @stable
    */
    /***
    Returns a normalized URL for the current history entry.
  
    @function up.history.url
    @experimental
    */
    /***
    This event is [emitted](/up.emit) before a new history entry is added.
  
    @event up:history:push
    @param {string} event.url
      The URL for the history entry that is going to be added.
    @param event.preventDefault()
      Event listeners may call this method to prevent the history entry from being added.
    @experimental
    */
    /***
    This event is [emitted](/up.emit) after a new history entry has been added.
  
    @event up:history:pushed
    @param {string} event.url
      The URL for the history entry that has been added.
    @experimental
    */
    /***
    Remembers the given URL so we can offer `up.history.previousUrl()`.
  
    @function observeNewUrl
    @internal
    */
    /***
    Returns the previous URL in the browser history.
  
    Note that this will only work reliably for history changes that
    were applied by [`up.history.push()`](/up.history.replace) or
    [`up.history.replace()`](/up.history.replace).
  
    @function up.history.previousUrl
    @internal
    */
    /***
    Adds a new history entry and updates the browser's
    address bar with the given URL.
  
    When the user navigates to the added  history entry at a later time,
    Unpoly will [`replace`](/up.replace) the document body with
    the body from that URL.
  
    Note that functions like [`up.replace()`](/up.replace) or
    [`up.submit()`](/up.submit) will automatically update the
    browser's location bar for you.
  
    Emits events [`up:history:push`](/up:history:push) and [`up:history:pushed`](/up:history:pushed).
  
    @function up.history.push
    @param {string} url
      The URL for the history entry to be added.
    @experimental
    */
    /***
    Replaces the current history entry and updates the
    browser's location bar with the given URL.
  
    When the user navigates to the replaced history entry at a later time,
    Unpoly will [`replace`](/up.replace) the document body with
    the body from that URL.
  
    Note that functions like [`up.replace()`](/up.replace) or
    [`up.submit()`](/up.submit) will automatically update the
    browser's location bar for you.
  
    @function up.history.replace
    @param {string} url
    @internal
    */
    var buildState, config, currentUrl, e, isCurrentUrl, manipulate, nextPreviousUrl, normalizeUrl, observeNewUrl, pop, previousUrl, push, replace, reset, restoreStateOnPop, u;
    u = up.util;
    e = up.element;
    config = new up.Config({
        enabled: true,
        popTargets: ['body'],
        restoreScroll: true
    });
    previousUrl = void 0;
    nextPreviousUrl = void 0;
    reset = function () {
        config.reset();
        previousUrl = void 0;
        return nextPreviousUrl = void 0;
    };
    normalizeUrl = function (url, normalizeOptions) {
        normalizeOptions || (normalizeOptions = {});
        normalizeOptions.hash = true;
        return u.normalizeUrl(url, normalizeOptions);
    };
    currentUrl = function (normalizeOptions) {
        return normalizeUrl(up.browser.url(), normalizeOptions);
    };
    isCurrentUrl = function (url) {
        var normalizeOptions;
        normalizeOptions = {
            stripTrailingSlash: true
        };
        return normalizeUrl(url, normalizeOptions) === currentUrl(normalizeOptions);
    };
    observeNewUrl = function (url) {
        if (nextPreviousUrl) {
            previousUrl = nextPreviousUrl;
            nextPreviousUrl = void 0;
        }
        return nextPreviousUrl = url;
    };
    replace = function (url) {
        if (manipulate('replaceState', url)) {
            return up.emit('up:history:replaced', {
                url: url
            });
        }
    };
    push = function (url, options) {
        options = u.options(options, {
            force: false
        });
        url = normalizeUrl(url);
        if ((options.force || !isCurrentUrl(url)) && up.event.nobodyPrevents('up:history:push', {
            url: url,
            log: "Adding history entry for " + url
        })) {
            if (manipulate('pushState', url)) {
                return up.emit('up:history:pushed', {
                    url: url,
                    log: "Advanced to location " + url
                });
            }
            else {
                return up.emit('up:history:muted', {
                    url: url,
                    log: "Did not advance to " + url + " (history is unavailable)"
                });
            }
        }
    };
    manipulate = function (method, url) {
        var state;
        if (up.browser.canPushState() && config.enabled) {
            state = buildState();
            window.history[method](state, '', url);
            observeNewUrl(currentUrl());
            return true;
        }
        else {
            return false;
        }
    };
    buildState = function () {
        return {
            fromUp: true
        };
    };
    restoreStateOnPop = function (state) {
        var popSelector, replaced, url;
        if (state != null ? state.fromUp : void 0) {
            url = currentUrl();
            // We can't let people prevent this event, since `popstate` is also unpreventable.
            up.emit('up:history:restore', {
                url: url,
                log: "Restoring location " + url
            });
            popSelector = config.popTargets.join(', ');
            replaced = up.replace(popSelector, url, {
                history: false,
                title: true,
                reveal: false,
                saveScroll: false,
                restoreScroll: config.restoreScroll,
                layer: 'page' // Don't replace elements in a modal that might still be open
            });
            return replaced.then(function () {
                url = currentUrl();
                return up.emit('up:history:restored', {
                    url: url,
                    log: "Restored location " + url
                });
            });
        }
        else {
            return up.puts('Ignoring a state not pushed by Unpoly (%o)', state);
        }
    };
    pop = function (event) {
        var state;
        observeNewUrl(currentUrl());
        up.viewport.saveScroll({
            url: previousUrl
        });
        state = event.state;
        return restoreStateOnPop(state);
    };
    /***
    This event is [emitted](/up.emit) before a history entry will be restored.
  
    History entries are restored when the user uses the *Back* or *Forward* button.
  
    @event up:history:restore
    @param {string} event.url
    The URL for the history entry that has been restored.
    @internal
    */
    /***
    This event is [emitted](/up.emit) after a history entry has been restored.
  
    History entries are restored when the user uses the *Back* or *Forward* button.
  
    @event up:history:restored
    @param {string} event.url
    The URL for the history entry that has been restored.
    @experimental
    */
    up.on('up:app:boot', function () {
        var register;
        if (up.browser.canPushState()) {
            register = function () {
                if (up.browser.canControlScrollRestoration()) {
                    window.history.scrollRestoration = 'manual';
                }
                window.addEventListener('popstate', pop);
                return replace(currentUrl(), {
                    force: true
                });
            };
            if (typeof jasmine !== "undefined" && jasmine !== null) {
                // Can't delay this in tests.
                return register();
            }
            else {
                // Defeat an unnecessary popstate that some browsers trigger
                // on pageload (Safari, Chrome < 34).
                // We should check in 2023 if we can remove this.
                return setTimeout(register, 100);
            }
        }
    });
    /***
    Changes the link's destination so it points to the previous URL.
  
    Note that this will *not* call `location.back()`, but will set
    the link's `up-href` attribute to the actual, previous URL.
  
    If no previous URL is known, the link will not be changed.
  
    \#\#\# Example
  
    This link ...
  
        <a href="/default" up-back>
    Go back
        </a>
  
    ... will be transformed to:
  
        <a href="/default" up-href="/previous-page" up-restore-scroll up-follow>
    Go back
        </a>
  
    @selector a[up-back]
    @stable
    */
    up.macro('a[up-back], [up-href][up-back]', function (link) {
        if (u.isPresent(previousUrl)) {
            e.setMissingAttrs(link, {
                'up-href': previousUrl,
                'up-restore-scroll': ''
            });
            link.removeAttribute('up-back');
            return up.link.makeFollowable(link);
        }
    });
    up.on('up:framework:reset', reset);
    return {
        config: config,
        push: push,
        replace: replace,
        url: currentUrl,
        isUrl: isCurrentUrl,
        previousUrl: function () {
            return previousUrl;
        },
        normalizeUrl: normalizeUrl
    };
})();


/***/ }),
/* 40 */
/***/ (function(module, exports) {

/***
Scrolling viewports
===================

The `up.viewport` module controls the scroll position of scrollable containers ("viewports").

The default viewport for any web application is the main document. An application may
define additional viewports by giving the CSS property `{ overflow-y: scroll }` to any `<div>`.

\#\#\# Revealing new content

When following a [link to a fragment](/a-up-target) Unpoly will automatically
scroll the document's viewport to [reveal](/up.viewport) the updated content.

You should [make Unpoly aware](/up.viewport.config#config.fixedTop) of fixed elements in your
layout, such as navigation bars or headers. Unpoly will respect these sticky
elements when [revealing updated fragments](/up.reveal).

You should also [tell Unpoly](/up.viewport.config#config.viewports) when your application has more than one viewport,
so Unpoly can pick the right viewport to scroll for each fragment update.

\#\#\# Bootstrap integration

When using Bootstrap integration (`unpoly-bootstrap3.js` and `unpoly-bootstrap3.css`)
Unpoly will automatically be aware of sticky Bootstrap components such as
[fixed navbar](https://getbootstrap.com/examples/navbar-fixed-top/).

@module up.viewport
*/
up.viewport = (function () {
    /***
    @internal
    */
    /***
    @function up.viewport.anchoredRight
    @internal
    */
    /***
    Returns the scrolling container for the given element.
  
    Returns the [document's scrolling element](/up.viewport.root)
    if no closer viewport exists.
  
    @function up.viewport.closest
    @param {string|Element|jQuery} selectorOrElement
    @return {Element}
    @experimental
    */
    /***
    Configures the application layout.
  
    @property up.viewport.config
    @param {Array} [config.viewports]
      An array of CSS selectors that find viewports
      (containers that scroll their contents).
    @param {Array} [config.fixedTop]
      An array of CSS selectors that find elements fixed to the
      top edge of the screen (using `position: fixed`).
      See [`[up-fixed="top"]`](/up-fixed-top) for details.
    @param {Array} [config.fixedBottom]
      An array of CSS selectors that find elements fixed to the
      bottom edge of the screen (using `position: fixed`).
      See [`[up-fixed="bottom"]`](/up-fixed-bottom) for details.
    @param {Array} [config.anchoredRight]
      An array of CSS selectors that find elements anchored to the
      right edge of the screen (using `right:0` with `position: fixed` or `position: absolute`).
      See [`[up-anchored="right"]`](/up-anchored-right) for details.
    @param {number} [config.revealSnap=50]
      When [revealing](/up.reveal) elements, Unpoly will scroll an viewport
      to the top when the revealed element is closer to the top than `config.revealSnap`.
    @param {number} [config.revealPadding=0]
      The desired padding between a [revealed](/up.reveal) element and the
      closest [viewport](/up.viewport) edge (in pixels).
    @param {number} [config.scrollSpeed=1]
      The speed of the scrolling motion when [scrolling](/up.scroll) with `{ behavior: 'smooth' }`.
  
      The default value (`1`) roughly corresponds to the speed of Chrome's
      [native smooth scrolling](https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior).
    @stable
    */
    /***
    Finishes scrolling animations in the given element, its ancestors or its descendants.
  
    @function up.viewport.finishScrolling
    @param {string|Element|jQuery}
    @return {Promise}
    @internal
    */
    /***
    Marks this element as a scrolling container ("viewport").
  
    Apply this attribute if your app uses a custom panel layout with fixed positioning
    instead of scrolling `<body>`. As an alternative you can also push a selector
    matching your custom viewport to the [`up.viewport.config.viewports`](/up.viewport.config) array.
  
    [`up.reveal()`](/up.reveal) will always try to scroll the viewport closest
    to the element that is being revealed. By default this is the `<body>` element.
  
    \#\#\# Example
  
    Here is an example for a layout for an e-mail client, showing a list of e-mails
    on the left side and the e-mail text on the right side:
  
    .side {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      width: 100px;
      overflow-y: scroll;
    }
  
    .main {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 100px;
      right: 0;
      overflow-y: scroll;
    }
  
    This would be the HTML (notice the `up-viewport` attribute):
  
    <div class=".side" up-viewport>
      <a href="/emails/5001" up-target=".main">Re: Your invoice</a>
      <a href="/emails/2023" up-target=".main">Quote for services</a>
      <a href="/emails/9002" up-target=".main">Fwd: Room reservation</a>
    </div>
  
    <div class="main" up-viewport>
      <h1>Re: Your Invoice</h1>
      <p>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr.
        Stet clita kasd gubergren, no sea takimata sanctus est.
      </p>
    </div>
  
    @selector [up-viewport]
    @stable
    */
    /***
    Marks this element as being fixed to the top edge of the screen
    using `position: fixed`.
  
    When [following a fragment link](/a-up-target), the viewport is scrolled
    so the targeted element becomes visible. By using this attribute you can make
    Unpoly aware of fixed elements that are obstructing the viewport contents.
    Unpoly will then scroll the viewport far enough that the revealed element is fully visible.
  
    Instead of using this attribute,
    you can also configure a selector in [`up.viewport.config.fixedTop`](/up.viewport.config#config.fixedTop).
  
    \#\#\# Example
  
    <div class="top-nav" up-fixed="top">...</div>
  
    @selector [up-fixed=top]
    @stable
    */
    /***
    Marks this element as being fixed to the bottom edge of the screen
    using `position: fixed`.
  
    When [following a fragment link](/a-up-target), the viewport is scrolled
    so the targeted element becomes visible. By using this attribute you can make
    Unpoly aware of fixed elements that are obstructing the viewport contents.
    Unpoly will then scroll the viewport far enough that the revealed element is fully visible.
  
    Instead of using this attribute,
    you can also configure a selector in [`up.viewport.config.fixedBottom`](/up.viewport.config#config.fixedBottom).
  
    \#\#\# Example
  
    <div class="bottom-nav" up-fixed="bottom">...</div>
  
    @selector [up-fixed=bottom]
    @stable
    */
    /***
    Marks this element as being anchored to the right edge of the screen,
    typically fixed navigation bars.
  
    Since [modal dialogs](/up.modal) hide the document scroll bar,
    elements anchored to the right appear to jump when the dialog opens or
    closes. Applying this attribute to anchored elements will make Unpoly
    aware of the issue and adjust the `right` property accordingly.
  
    You should give this attribute to layout elements
    with a CSS of `right: 0` with `position: fixed` or `position:absolute`.
  
    Instead of giving this attribute to any affected element,
    you can also configure a selector in [`up.viewport.config.anchoredRight`](/up.viewport.config#config.anchoredRight).
  
    \#\#\# Example
  
    Here is the CSS for a navigation bar that is anchored to the top edge of the screen:
  
    .top-nav {
       position: fixed;
       top: 0;
       left: 0;
       right: 0;
     }
  
    By adding an `up-anchored="right"` attribute to the element, we can prevent the
    `right` edge from jumping when a [modal dialog](/up.modal) opens or closes:
  
    <div class="top-nav" up-anchored="right">...</div>
  
    @selector [up-anchored=right]
    @stable
    */
    /***
    @function up.viewport.firstHashTarget
    @internal
    */
    /***
    @function up.viewport.fixedElements
    @internal
    */
    /***
    Returns a list of all the viewports on the screen.
  
    @function up.viewport.all
    @internal
    */
    /***
    Return the [scrolling element](https://developer.mozilla.org/en-US/docs/Web/API/document/scrollingElement)
    for the browser's main content area.
  
    @function up.viewport.root
    @return {Element}
    @experimental
    */
    /***
    Returns a jQuery collection of all the viewports contained within the
    given selector or element.
  
    @function up.viewport.subtree
    @param {string|Element|jQuery} selectorOrElement
    @return List<Element>
    @internal
    */
    /***
    @function measureObstruction
    @return {Object}
    @internal
    */
    /***
    Returns `'foo'` if the hash is `'#foo'`.
  
    Returns undefined if the hash is `'#'`, `''` or `undefined`.
  
    @function pureHash
    @internal
    */
    /***
    Restores [previously saved](/up.viewport.saveScroll) scroll positions of viewports
    viewports configured in [`up.viewport.config.viewports`](/up.viewport.config).
  
    Unpoly automatically restores scroll positions when the user presses the back button.
    You can disable this behavior by setting [`up.history.config.restoreScroll = false`](/up.history.config).
  
    @function up.viewport.restoreScroll
    @param {Element} [options.around]
    If set, only restores viewports that are either an ancestor
    or descendant of the given element.
    @return {Promise}
    A promise that will be fulfilled once scroll positions have been restored.
    @experimental
    */
    /***
    Scroll's the given element's viewport so the first rows of the
    element are visible for the user.
  
    By default Unpoly will always reveal an element before
    updating it with JavaScript functions like [`up.replace()`](/up.replace)
    or UJS behavior like [`[up-target]`](/a-up-target).
  
    \#\#\# How Unpoly finds the viewport
  
    The viewport (the container that is going to be scrolled)
    is the closest parent of the element that is either:
  
    - the currently open [modal](/up.modal)
    - an element with the attribute `[up-viewport]`
    - the `<body>` element
    - an element matching the selector you have configured using `up.viewport.config.viewports.push('my-custom-selector')`
  
    \#\#\# Fixed elements obstruction the viewport
  
    Many applications have a navigation bar fixed to the top or bottom,
    obstructing the view on an element.
  
    You can make `up.reveal()` aware of these fixed elements
    so it can scroll the viewport far enough so the revealed element is fully visible.
    To make `up.reveal()` aware fixed elements you can either:
  
    - give the element an attribute [`up-fixed="top"`](/up-fixed-top) or [`up-fixed="bottom"`](up-fixed-bottom)
    - [configure default options](/up.viewport.config) for `fixedTop` or `fixedBottom`
  
    @function up.reveal
    @param {string|Element|jQuery} element
    @param {number} [options.speed]
    @param {string} [options.snap]
    @param {string|Element|jQuery} [options.viewport]
    @param {boolean} [options.top=false]
    Whether to scroll the viewport so that the first element row aligns
    with the top edge of the viewport.
    @param {string}[options.behavior='auto']
    When set to `'auto'`, this will immediately scroll to the new position.
  
    When set to `'smooth'`, this will scroll smoothly to the new position.
    @param {number}[options.speed]
    The speed of the scrolling motion when scrolling with `{ behavior: 'smooth' }`.
  
    Defaults to `up.viewport.config.scrollSpeed`.
    @param {number} [config.padding=0]
    The desired padding between the revealed element and the
    closest [viewport](/up.viewport) edge (in pixels).
    @param {number|boolean} [config.snap]
    Whether to snap to the top of the viewport if the new scroll position
    after revealing the element is close to the top edge.
  
    You may pass a maximum number of pixels under which to snap to the top.
  
    Passing `false` will disable snapping.
  
    Passing `true` will use the snap pixel value from `up.viewport.config.revealSnap`.
    @return {Promise}
    A promise that fulfills when the element is revealed.
    @stable
    */
    /***
    [Reveals](/up.reveal) an element matching the given `#hash` anchor.
  
    Other than the default behavior found in browsers, `up.revealHash` works with
    [multiple viewports](/up-viewport) and honors [fixed elements](/up-fixed-top) obstructing the user's
    view of the viewport.
  
    When the page loads initially, this function is automatically called with the hash from
    the current URL.
  
    If no element matches the given `#hash` anchor, a resolved promise is returned.
  
    \#\#\# Example
  
    up.revealHash('#chapter2')
  
    @function up.viewport.revealHash
    @param {string} hash
  
    @return {Promise}
      A promise that is fulfilled when scroll position has changed to match the location hash.
    @experimental
    */
    /***
    Returns whether the given element is currently showing a vertical scrollbar.
  
    @function up.viewport.rootHasVerticalScrollbar
    @internal
    */
    /***
    Returns the element that controls the `overflow-y` behavior for the
    [document viewport](/up.viewport.root()).
  
    @function up.viewport.rootOverflowElement
    @internal
    */
    /***
    Saves the top scroll positions of all the
    viewports configured in [`up.viewport.config.viewports`](/up.viewport.config).
  
    The scroll positions will be associated with the current URL.
    They can later be restored by calling [`up.viewport.restoreScroll()`](/up.viewport.restoreScroll)
    at the same URL, or by following a link with an [`[up-restore-scroll]`](/a-up-follow#up-restore-scroll)
    attribute.
  
    Unpoly automatically saves scroll positions before a [fragment update](/up.replace)
    you will rarely need to call this function yourself.
  
    \#\#\# Examples
  
    Should you need to save the current scroll positions outside of a [fragment update](/up.replace),
    you may call:
  
    up.viewport.saveScroll()
  
    Instead of saving the current scroll positions for the current URL, you may also pass another
    url or vertical scroll positionsfor each viewport:
  
    up.viewport.saveScroll({
      url: '/inbox',
      tops: {
        'body': 0,
        '.sidebar', 100,
        '.main', 320
      }
    })
  
    @function up.viewport.saveScroll
    @param {string} [options.url]
    The URL for which to save scroll positions.
    If omitted, the current browser location is used.
    @param {Object<string, number>} [options.tops]
    An object mapping viewport selectors to vertical scroll positions in pixels.
    @experimental
    */
    /***
    Scrolls the given viewport to the given Y-position.
  
    A "viewport" is an element that has scrollbars, e.g. `<body>` or
    a container with `overflow-x: scroll`.
  
    \#\#\# Example
  
    This will scroll a `<div class="main">...</div>` to a Y-position of 100 pixels:
  
    up.scroll('.main', 100)
  
    \#\#\# Animating the scrolling motion
  
    The scrolling can (optionally) be animated.
  
    up.scroll('.main', 100, { behavior: 'smooth' })
  
    If the given viewport is already in a scroll animation when `up.scroll()`
    is called a second time, the previous animation will instantly jump to the
    last frame before the next animation is started.
  
    @function up.scroll
    @param {string|Element|jQuery} viewport
    The container element to scroll.
    @param {number} scrollPos
    The absolute number of pixels to set the scroll position to.
    @param {string}[options.behavior='auto']
    When set to `'auto'`, this will immediately scroll to the new position.
  
    When set to `'smooth'`, this will scroll smoothly to the new position.
    @param {number}[options.speed]
    The speed of the scrolling motion when scrolling with `{ behavior: 'smooth' }`.
  
    Defaults to `up.viewport.config.scrollSpeed`.
    @return {Promise}
    A promise that will be fulfilled when the scrolling ends.
    @experimental
    */
    /***
    @function up.viewport.scrollAfterInsertFragment
    @param {boolean|object} [options.restoreScroll]
    @param {boolean|string|jQuery|Element} [options.reveal]
    @param {boolean|string} [options.reveal]
    @return {Promise}
    A promise that is fulfilled when the scrolling has finished.
    @internal
    */
    /***
    Returns a hash with scroll positions.
  
    Each key in the hash is a viewport selector. The corresponding
    value is the viewport's top scroll position:
  
    up.viewport.scrollTops()
    => { '.main': 0, '.sidebar': 73 }
  
    @function up.viewport.scrollTops
    @return Object<string, number>
    @internal
    */
    /***
    Returns the width of a scrollbar.
  
    This only runs once per page load.
  
    @function up.viewport.scrollbarWidth
    @internal
    */
    /***
    Returns whether the given element was chosen as the overflowing
    element by the developer.
  
    We have no control whether developers set the property on <body> or
    <html>. The developer also won't know what is going to be the
    [scrolling element](/up.viewport.root()) on the user's brower.
  
    @function wasChosenAsOverflowingElement
    @internal
    */
    var absolutize, allSelector, anchoredRight, closest, config, e, finishScrolling, firstHashTarget, fixedElements, getAll, getAround, getRoot, getSubtree, isRoot, lastScrollTops, measureObstruction, pureHash, reset, restoreScroll, reveal, revealHash, rootHasVerticalScrollbar, rootHeight, rootOverflowElement, rootSelector, rootWidth, saveScroll, scroll, scrollAfterInsertFragment, scrollTopKey, scrollTops, scrollbarWidth, scrollingController, u, wasChosenAsOverflowingElement;
    u = up.util;
    e = up.element;
    config = new up.Config({
        duration: 0,
        viewports: ['.up-modal-viewport', '[up-viewport]', '[up-fixed]'],
        fixedTop: ['[up-fixed~=top]'],
        fixedBottom: ['[up-fixed~=bottom]'],
        anchoredRight: ['[up-anchored~=right]', '[up-fixed~=top]', '[up-fixed~=bottom]', '[up-fixed~=right]'],
        revealSnap: 50,
        revealPadding: 0,
        scrollSpeed: 1
    });
    //  up.legacy.renamedProperty(config, 'snap', 'revealSnap')
    //  up.legacy.removedProperty(config, 'easing')
    //  up.legacy.removedProperty(config, 'duration')
    lastScrollTops = new up.Cache({
        size: 30,
        key: up.history.normalizeUrl
    });
    scrollingController = new up.MotionController('scrolling');
    reset = function () {
        config.reset();
        lastScrollTops.clear();
        return scrollingController.reset();
    };
    scroll = function (viewport, scrollTop, options) {
        var motion;
        motion = new up.ScrollMotion(viewport, scrollTop, options);
        return scrollingController.startMotion(viewport, motion, options);
    };
    finishScrolling = function (element) {
        var scrollable;
        if (!up.motion.isEnabled()) {
            // Don't emit expensive events if no animation can be running anyway
            return Promise.resolve();
        }
        scrollable = closest(element);
        return scrollingController.finish(scrollable);
    };
    anchoredRight = function () {
        var selector;
        selector = config.anchoredRight.join(',');
        return e.all(selector);
    };
    measureObstruction = function (viewportHeight) {
        var bottomObstructions, bottomObstructors, composeHeight, measureBottomObstructor, measureTopObstructor, topObstructions, topObstructors;
        composeHeight = function (obstructor, distanceFromEdgeProps) {
            var distanceFromEdge;
            distanceFromEdge = u.sum(distanceFromEdgeProps, function (prop) {
                return e.styleNumber(obstructor, prop);
            }) || 0;
            return distanceFromEdge + obstructor.offsetHeight;
        };
        measureTopObstructor = function (obstructor) {
            return composeHeight(obstructor, ['top', 'margin-top']);
        };
        measureBottomObstructor = function (obstructor) {
            return composeHeight(obstructor, ['bottom', 'margin-bottom']);
        };
        topObstructors = e.all(config.fixedTop.join(', '));
        bottomObstructors = e.all(config.fixedBottom.join(', '));
        topObstructions = u.map(topObstructors, measureTopObstructor);
        bottomObstructions = u.map(bottomObstructors, measureBottomObstructor);
        return {
            top: Math.max.apply(Math, [0].concat(topObstructions)),
            bottom: Math.max.apply(Math, [0].concat(bottomObstructions))
        };
    };
    reveal = function (elementOrSelector, options) {
        var element, motion;
        element = e.get(elementOrSelector);
        motion = new up.RevealMotion(element, options);
        return scrollingController.startMotion(element, motion, options);
    };
    scrollAfterInsertFragment = function (element, options) {
        if (options === void 0) { options = {}; }
        var givenTops, hashOpt, restoreScrollOpt, revealOpt, scrollOptions, selector;
        hashOpt = options.hash;
        revealOpt = options.reveal;
        restoreScrollOpt = options.restoreScroll;
        scrollOptions = u.only(options, 'scrollBehavior', 'scrollSpeed');
        if (restoreScrollOpt) {
            // If options.restoreScroll is an object, its keys map viewport selectors
            // to scroll positions. If it is just true, we leave the scrollTops option
            // undefined and let restoreScroll() retrieve previous scrollTops from cache.
            givenTops = u.presence(restoreScrollOpt, u.isObject);
            return restoreScroll({
                around: element,
                scrollTops: givenTops
            });
        }
        else if (hashOpt && revealOpt === true) { // hash revealing can be disabled with { reveal: false }
            return revealHash(hashOpt, scrollOptions);
        }
        else if (revealOpt) {
            // We allow to pass another element as { reveal } option
            if (u.isElement(revealOpt) || u.isJQuery(revealOpt)) {
                element = e.get(revealOpt);
                // We allow to pass a selector as { reveal } option
            }
            else if (u.isString(revealOpt)) {
                selector = e.resolveSelector(revealOpt, options.origin);
                element = up.fragment.first(selector);
            }
            else {
            }
            // We reveal the given element
            // If selectorOrElement was a CSS selector, don't blow up by calling reveal()
            // with an empty jQuery collection. This might happen if a failed form submission
            // reveals the first validation error message, but the error is shown in an
            // unexpected element.
            if (element) {
                return reveal(element, scrollOptions);
            }
        }
        else {
            // If we didn't need to scroll above, just return a resolved promise
            // to fulfill this function's signature.
            return Promise.resolve();
        }
    };
    revealHash = function (hash) {
        var match;
        if (hash && (match = firstHashTarget(hash))) {
            return reveal(match, {
                top: true
            });
        }
        else {
            return Promise.resolve();
        }
    };
    allSelector = function () {
        // On Edge the document viewport can be changed from CSS
        return [rootSelector()].concat(config.viewports).join(',');
    };
    closest = function (selectorOrElement) {
        var element;
        element = e.get(selectorOrElement);
        return e.closest(element, allSelector());
    };
    getSubtree = function (selectorOrElement) {
        var element;
        element = e.get(selectorOrElement);
        return e.subtree(element, allSelector());
    };
    getAround = function (selectorOrElement) {
        var element;
        element = e.get(selectorOrElement);
        return e.list(closest(element), getSubtree(element));
    };
    getAll = function () {
        return e.all(allSelector());
    };
    rootSelector = function () {
        var element;
        // The spec says this should be <html> in standards mode
        // and <body> in quirks mode. However, it is currently (2018-07)
        // always <body> in Webkit browsers (not Blink). Luckily Webkit
        // also supports document.scrollingElement.
        if (element = document.scrollingElement) {
            return element.tagName;
        }
        else {
            // IE11
            return 'html';
        }
    };
    getRoot = function () {
        return document.querySelector(rootSelector());
    };
    rootWidth = function () {
        // This should happen on the <html> element, regardless of document.scrollingElement
        return e.root().clientWidth;
    };
    rootHeight = function () {
        // This should happen on the <html> element, regardless of document.scrollingElement
        return e.root().clientHeight;
    };
    isRoot = function (element) {
        return e.matches(element, rootSelector());
    };
    rootHasVerticalScrollbar = function () {
        // We could also check if scrollHeight > offsetHeight for the document viewport.
        // However, we would also need to check overflow-y for that element.
        // Also we have no control whether developers set the property on <body> or <html>.
        // https://tylercipriani.com/blog/2014/07/12/crossbrowser-javascript-scrollbar-detection/
        return window.innerWidth > document.documentElement.offsetWidth;
    };
    rootOverflowElement = function () {
        var body, element, html;
        body = document.body;
        html = document.documentElement;
        element = u.find([html, body], wasChosenAsOverflowingElement);
        return element || getRoot();
    };
    wasChosenAsOverflowingElement = function (element) {
        var overflowY;
        overflowY = e.style(element, 'overflow-y');
        return overflowY === 'auto' || overflowY === 'scroll';
    };
    scrollbarWidth = u.memoize(function () {
        var outer, outerStyle, width;
        // This is how Bootstrap does it also:
        // https://github.com/twbs/bootstrap/blob/c591227602996c542b9fd0cb65cff3cc9519bdd5/dist/js/bootstrap.js#L1187
        outerStyle = {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100px',
            height: '100px',
            overflowY: 'scroll'
        };
        outer = up.element.affix(document.body, '[up-viewport]', {
            style: outerStyle
        });
        width = outer.offsetWidth - outer.clientWidth;
        up.element.remove(outer);
        return width;
    });
    scrollTopKey = function (viewport) {
        return e.toSelector(viewport);
    };
    scrollTops = function () {
        return u.mapObject(getAll(), function (viewport) {
            return [scrollTopKey(viewport), viewport.scrollTop];
        });
    };
    fixedElements = function (root) {
        if (root === void 0) { root = document; }
        var queryParts;
        queryParts = ['[up-fixed]'].concat(config.fixedTop).concat(config.fixedBottom);
        return root.querySelectorAll(queryParts.join(','));
    };
    saveScroll = function (options) {
        if (options === void 0) { options = {}; }
        var ref, ref1, tops, url;
        url = (ref = options.url) != null ? ref : up.history.url();
        tops = (ref1 = options.tops) != null ? ref1 : scrollTops();
        return lastScrollTops.set(url, tops);
    };
    restoreScroll = function (options) {
        if (options === void 0) { options = {}; }
        var scrollTopsForUrl, url, viewports;
        url = up.history.url();
        viewports = options.around ? getAround(options.around) : getAll();
        scrollTopsForUrl = options.scrollTops || lastScrollTops.get(url) || {};
        return up.log.group('Restoring scroll positions for URL %s to %o', url, scrollTopsForUrl, function () {
            var allScrollPromises;
            allScrollPromises = u.map(viewports, function (viewport) {
                var key, scrollTop;
                key = scrollTopKey(viewport);
                scrollTop = scrollTopsForUrl[key] || 0;
                return scroll(viewport, scrollTop, {
                    duration: 0
                });
            });
            return Promise.all(allScrollPromises);
        });
    };
    absolutize = function (elementOrSelector, options) {
        if (options === void 0) { options = {}; }
        var bounds, boundsRect, element, moveBounds, newElementRect, originalRect, viewport, viewportRect;
        element = e.get(elementOrSelector);
        viewport = up.viewport.closest(element);
        viewportRect = viewport.getBoundingClientRect();
        originalRect = element.getBoundingClientRect();
        boundsRect = new up.Rect({
            left: originalRect.left - viewportRect.left,
            top: originalRect.top - viewportRect.top,
            width: originalRect.width,
            height: originalRect.height
        });
        if (typeof options.afterMeasure === "function") {
            options.afterMeasure();
        }
        e.setStyle(element, {
            // If the element had a layout context before, make sure the
            // ghost will have layout context as well (and vice versa).
            position: element.style.position === 'static' ? 'static' : 'relative',
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            left: 'auto',
            width: '100%',
            height: '100%' // stretch to the .up-bounds height we set below
        });
        // Wrap the ghost in another container so its margin can expand
        // freely. If we would position the element directly (old implementation),
        // it would gain a layout context which cannot be crossed by margins.
        bounds = e.createFromSelector('.up-bounds');
        // Insert the bounds object before our element, then move element into it.
        e.insertBefore(element, bounds);
        bounds.appendChild(element);
        moveBounds = function (diffX, diffY) {
            boundsRect.left += diffX;
            boundsRect.top += diffY;
            return e.setStyle(bounds, boundsRect);
        };
        // Position the bounds initially
        moveBounds(0, 0);
        // In theory, element should not have moved visually. However, element
        // (or a child of element) might collapse its margin against a previous
        // sibling element, and now that it is absolute it does not have the
        // same sibling. So we manually correct element's top position so it aligns
        // with the previous top position.
        newElementRect = element.getBoundingClientRect();
        moveBounds(originalRect.left - newElementRect.left, originalRect.top - newElementRect.top);
        u.each(fixedElements(element), e.fixedToAbsolute);
        return {
            bounds: bounds,
            moveBounds: moveBounds
        };
    };
    firstHashTarget = function (hash) {
        var selector;
        if (hash = pureHash(hash)) {
            selector = [
                // First match an <* up-id="hash">. This won't be picked up without JS,
                // preventing the scroll position from jump if up.viewport.revealPadding
                // is set.
                e.attributeSelector('up-id', hash),
                // Match an <* id="hash">
                e.attributeSelector('id', hash),
                // Match an <a name="hash">
                'a' + e.attributeSelector('name', hash)
            ].join(',');
            return up.fragment.first(selector);
        }
    };
    pureHash = function (value) {
        if (value && value[0] === '#') {
            value = value.substr(1);
        }
        return u.presence(value);
    };
    up.on('up:app:booted', function () {
        return revealHash(location.hash);
    });
    up.on('up:framework:reset', reset);
    return {
        reveal: reveal,
        revealHash: revealHash,
        firstHashTarget: firstHashTarget,
        scroll: scroll,
        config: config,
        closest: closest,
        subtree: getSubtree,
        around: getAround,
        all: getAll,
        rootSelector: rootSelector,
        root: getRoot,
        rootWidth: rootWidth,
        rootHeight: rootHeight,
        rootHasVerticalScrollbar: rootHasVerticalScrollbar,
        rootOverflowElement: rootOverflowElement,
        isRoot: isRoot,
        scrollbarWidth: scrollbarWidth,
        scrollTops: scrollTops,
        saveScroll: saveScroll,
        restoreScroll: restoreScroll,
        scrollAfterInsertFragment: scrollAfterInsertFragment,
        anchoredRight: anchoredRight,
        fixedElements: fixedElements,
        absolutize: absolutize
    };
})();
up.scroll = up.viewport.scroll;
up.reveal = up.viewport.reveal;
up.revealHash = up.viewport.revealHash;
up.legacy.renamedModule('layout', 'viewport');


/***/ }),
/* 41 */
/***/ (function(module, exports) {

/***
Fragment update API
===================

The `up.fragment` module exposes a high-level Javascript API to [update](/up.replace) or
[destroy](/up.destroy) page fragments.

Fragments are [compiled](/up.compiler) elements that can be updated from a server URL.
They also exist on a layer (page, modal, popup).

Most of Unpoly's functionality (like [fragment links](/up.link) or [modals](/up.modal))
is built from `up.fragment` functions. You may use them to extend Unpoly from your
[custom Javascript](/up.syntax).

@module up.fragment
*/
up.fragment = (function () {
    /***
    Configures defaults for fragment insertion.
  
    @property up.fragment.config
    @param {string} [options.fallbacks=['body']]
      When a fragment updates cannot find the requested element, Unpoly will try this list of alternative selectors.
  
      The first selector that matches an element in the current page (or response) will be used.
      If the response contains none of the selectors, an error message will be shown.
  
      It is recommend to always keep `'body'` as the last selector in the last in the case
      your server or load balancer renders an error message that does not contain your
      application layout.
    @param {string} [options.fallbackTransition=null]
      The transition to use when using a [fallback target](/#options.fallbacks).
  
      By default this is not set and the original replacement's transition is used.
    @stable
    */
    /***
    @function up.fragment.createPlaceHolder
    @internal
    */
    /***
    Destroys the given element or selector.
  
    Takes care that all [`up.compiler()`](/up.compiler) destructors, if any, are called.
  
    The element is removed from the DOM.
    Note that if you choose to animate the element removal using `options.animate`,
    the element won't be removed until after the animation has completed.
  
    Emits events [`up:fragment:destroyed`](/up:fragment:destroyed).
  
    @function up.destroy
    @param {string|Element|jQuery} selectorOrElement
    @param {string} [options.history]
    A URL that will be pushed as a new history entry when the element begins destruction.
    @param {string} [options.title]
    The document title to set when the element begins destruction.
    @param {string|Function(element, options): Promise} [options.animation='none']
    The animation to use before the element is removed from the DOM.
    @param {number} [options.duration]
    The duration of the animation. See [`up.animate()`](/up.animate).
    @param {number} [options.delay]
    The delay before the animation starts. See [`up.animate()`](/up.animate).
    @param {string} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate()`](/up.animate).
    @return {Promise}
    A promise that will be fulfilled once the element has been removed from the DOM.
    @stable
    */
    /***
    When any page fragment has been [inserted or updated](/up.replace),
    this event is [emitted](/up.emit) on the fragment.
  
    If you're looking to run code when a new fragment matches
    a selector, use `up.compiler()` instead.
  
    \#\#\# Example
  
    up.on('up:fragment:inserted', function(event, fragment) {
      console.log("Looks like we have a new %o!", fragment)
    })
  
    @event up:fragment:inserted
    @param {Element} event.target
    The fragment that has been inserted or updated.
    @stable
    */
    /***
    Updates a selector on the current page with the
    same selector from the given HTML string.
  
    \#\#\# Example
  
    Let's say your curent HTML looks like this:
  
    <div class="one">old one</div>
    <div class="two">old two</div>
  
    We now replace the second `<div>`, using an HTML string
    as the source:
  
    html = '<div class="one">new one</div>' +
           '<div class="two">new two</div>';
  
    up.extract('.two', html)
  
    Unpoly looks for the selector `.two` in the strings and updates its
    contents in the current page. The current page now looks like this:
  
    <div class="one">old one</div>
    <div class="two">new two</div>
  
    Note how only `.two` has changed. The update for `.one` was
    discarded, since it didn't match the selector.
  
    @function up.extract
    @param {string|Element|jQuery} selectorOrElement
    @param {string} html
    @param {Object} [options]
    See options for [`up.replace()`](/up.replace).
    @return {Promise}
    A promise that will be fulfilled then the selector was updated
    and all animation has finished.
    @stable
    */
    /***
    Returns the first element matching the given selector, but
    ignores elements that are being [destroyed](/up.destroy) or that are being
    removed by a [transition](/up.morph).
  
    Returns `undefined` if no element matches these conditions.
  
    \#\#\# Example
  
    To select the first element with the selector `.foo`:
  
    var fooInModal = up.fragment.first('.foo')
  
    You may also pass a `{ layer }` option to only match elements witin a layer:
  
    var fooInModal = up.fragment.first('.foo', { layer: 'modal' })
  
    You may also pass a root element as a first argument:
  
    var container = up.fragment.first('.container')
    var fooInContainer = up.fragment.first(container, '.foo')
  
    \#\#\# Similar features
  
    - The [`.up-destroying`](/up-destroying) class is assigned to elements during their removal animation.
    - The [`up.element.first()`](/up.element.first) function simply returns the first element matching a selector
    without further filtering.
  
    @function up.fragment.first
    @param {Element|jQuery} [root=document]
    The root element for the search. Only the root's children will be matched.
  
    May be omitted to search through all elements in the `document`.
    @param {string} selector
    The selector to match
    @param {string} [options.layer='auto']
    The name of the layer in which to find the element.
  
    Valid values are `'auto'`, `'page'`, `'modal'` and `'popup'`.
    @param {string|Element|jQuery} [options.origin]
    An second element or selector that can be referenced as `&` in the first selector:
  
      var input = document.querySelector('input.email')
      up.fragment.first('fieldset:has(&)', { origin: input }) // returns the <fieldset> containing input
    @return {Element|undefined}
    The first element that is neither a ghost or being destroyed,
    or `undefined` if no such element was found.
    @experimental
    */
    /***
    Elements with an `up-keep` attribute will be persisted during
    [fragment updates](/a-up-target).
  
    For example:
  
        <audio up-keep src="song.mp3"></audio>
  
    The element you're keeping should have an umambiguous class name, ID or `up-id`
    attribute so Unpoly can find its new position within the page update.
  
    Emits events [`up:fragment:keep`](/up:fragment:keep) and [`up:fragment:kept`](/up:fragment:kept).
  
    \#\#\# Controlling if an element will be kept
  
    Unpoly will **only** keep an existing element if:
  
    - The existing element has an `up-keep` attribute
    - The response contains an element matching the CSS selector of the existing element
    - The matching element *also* has an `up-keep` attribute
    - The [`up:fragment:keep`](/up:fragment:keep) event that is [emitted](/up.emit) on the existing element
      is not prevented by a event listener.
  
    Let's say we want only keep an `<audio>` element as long as it plays
    the same song (as identified by the tag's `src` attribute).
  
    On the client we can achieve this by listening to an `up:keep:fragment` event
    and preventing it if the `src` attribute of the old and new element differ:
  
        up.compiler('audio', function(element) {
          element.addEventListener('up:fragment:keep', function(event) {
            if element.getAttribute('src') !== event.newElement.getAttribute('src') {
    event.preventDefault()
            }
          })
        })
  
    If we don't want to solve this on the client, we can achieve the same effect
    on the server. By setting the value of the `up-keep` attribute we can
    define the CSS selector used for matching elements.
  
        <audio up-keep="audio[src='song.mp3']" src="song.mp3"></audio>
  
    Now, if a response no longer contains an `<audio src="song.mp3">` tag, the existing
    element will be destroyed and replaced by a fragment from the response.
  
    @selector [up-keep]
    @stable
    */
    /***
    This event is [emitted](/up.emit) before an existing element is [kept](/up-keep) during
    a page update.
  
    Event listeners can call `event.preventDefault()` on an `up:fragment:keep` event
    to prevent the element from being persisted. If the event is prevented, the element
    will be replaced by a fragment from the response.
  
    @event up:fragment:keep
    @param event.preventDefault()
      Event listeners may call this method to prevent the element from being preserved.
    @param {Element} event.target
      The fragment that will be kept.
    @param {Element} event.newFragment
      The discarded element.
    @param {Object} event.newData
      The value of the [`up-data`](/up-data) attribute of the discarded element,
      parsed as a JSON object.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when an existing element has been [kept](/up-keep)
    during a page update.
  
    Event listeners can inspect the discarded update through `event.newElement`
    and `event.newData` and then modify the preserved element when necessary.
  
    @event up:fragment:kept
    @param {Element} event.target
      The fragment that has been kept.
    @param {Element} event.newFragment
      The discarded fragment.
    @param {Object} event.newData
      The value of the [`up-data`](/up-data) attribute of the discarded fragment,
      parsed as a JSON object.
    @stable
    */
    /***
    Compiles a page fragment that has been inserted into the DOM
    by external code.
  
    **As long as you manipulate the DOM using Unpoly, you will never
    need to call this method.** You only need to use `up.hello()` if the
    DOM is manipulated without Unpoly' involvement, e.g. by setting
    the `innerHTML` property or calling jQuery methods like
    `html`, `insertAfter` or `appendTo`:
  
        element = document.createElement('div')
        element.innerHTML = '... HTML that needs to be activated ...'
        up.hello(element)
  
    This function emits the [`up:fragment:inserted`](/up:fragment:inserted)
    event.
  
    @function up.hello
    @param {string|Element|jQuery} selectorOrElement
    @param {string|Element|jQuery} [options.origin]
    @param {string|Element|jQuery} [options.kept]
    @return {Element}
      The compiled element
    @stable
     */
    /***
    @function up.fragment.layerOf
    @internal
    */
    /***
    Elements are assigned the `.up-destroying` class before they are [destroyed](/up.destroy)
    or while they are being removed by a [transition](/up.morph).
  
    If the removal is animated, the class is assigned before the animation starts.
  
    To select an element while ignoring elements that are being destroyed,
    see the [`up.fragment.first()`](/up.fragment.first) function.
  
    @selector .up-destroying
    @stable
    */
    /***
    @internal
    */
    /***
    This event is [emitted](/up.emit) after a page fragment was [destroyed](/up.destroy) and removed from the DOM.
  
    If the destruction is animated, this event is emitted after the animation has ended.
  
    The event is emitted on the parent element of the fragment that was removed.
  
    @event up:fragment:destroyed
    @param {Element} event.fragment
    The detached element that has been removed from the DOM.
    @param {Element} event.parent
    The former parent element of the fragment that has now been detached from the DOM.
    @param {Element} event.target
    The former parent element of the fragment that has now been detached from the DOM.
    @stable
    */
    /***
    Replaces the given element with a fresh copy fetched from the server.
  
    \#\#\# Example
  
    up.on('new-mail', function() { up.reload('.inbox') })
  
    Unpoly remembers the URL from which a fragment was loaded, so you
    don't usually need to give an URL when reloading.
  
    @function up.reload
    @param {string|Element|jQuery} selectorOrElement
    @param {Object} [options]
    See options for [`up.replace()`](/up.replace)
    @param {string} [options.url]
    The URL from which to reload the fragment.
    This defaults to the URL from which the fragment was originally loaded.
    @stable
    */
    /***
    Replaces elements on the current page with corresponding elements
    from a new page fetched from the server.
  
    The current and new elements must both match the given CSS selector.
  
    The unobtrusive variant of this is the [`a[up-target]`](/a-up-target) selector.
  
    \#\#\# Example
  
    Let's say your curent HTML looks like this:
  
    <div class="one">old one</div>
    <div class="two">old two</div>
  
    We now replace the second `<div>`:
  
    up.replace('.two', '/new')
  
    The server renders a response for `/new`:
  
    <div class="one">new one</div>
    <div class="two">new two</div>
  
    Unpoly looks for the selector `.two` in the response and [implants](/up.extract) it into
    the current page. The current page now looks like this:
  
    <div class="one">old one</div>
    <div class="two">new two</div>
  
    Note how only `.two` has changed. The update for `.one` was
    discarded, since it didn't match the selector.
  
    \#\#\# Appending or prepending instead of replacing
  
    By default Unpoly will replace the given selector with the same
    selector from a freshly fetched page. Instead of replacing you
    can *append* the loaded content to the existing content by using the
    `:after` pseudo selector. In the same fashion, you can use `:before`
    to indicate that you would like the *prepend* the loaded content.
  
    A practical example would be a paginated list of items:
  
    <ul class="tasks">
    <li>Wash car</li>
    <li>Purchase supplies</li>
    <li>Fix tent</li>
    </ul>
  
    In order to append more items from a URL, replace into
    the `.tasks:after` selector:
  
    up.replace('.tasks:after', '/page/2')
  
    \#\#\# Setting the window title from the server
  
    If the `replace` call changes history, the document title will be set
    to the contents of a `<title>` tag in the response.
  
    The server can also change the document title by setting
    an `X-Up-Title` header in the response.
  
    \#\#\# Optimizing response rendering
  
    The server is free to optimize Unpoly requests by only rendering the HTML fragment
    that is being updated. The request's `X-Up-Target` header will contain
    the CSS selector for the updating fragment.
  
    If you are using the `unpoly-rails` gem you can also access the selector via
    `up.target` in all controllers, views and helpers.
  
    \#\#\# Events
  
    Unpoly will emit [`up:fragment:destroyed`](/up:fragment:destroyed) on the element
    that was replaced and [`up:fragment:inserted`](/up:fragment:inserted) on the new
    element that replaces it.
  
    @function up.replace
    @param {string|Element|jQuery} selectorOrElement
      The CSS selector to update. You can also pass a DOM element or jQuery element
      here, in which case a selector will be inferred from the element's class and ID.
    @param {string} url
      The URL to fetch from the server.
    @param {string} [options.failTarget]
      The CSS selector to update if the server sends a non-200 status code.
    @param {string} [options.fallback]
      The selector to update when the original target was not found in the page.
    @param {string} [options.title]
      The document title after the replacement.
  
      If the call pushes an history entry and this option is missing, the title is extracted from the response's `<title>` tag.
      You can also pass `false` to explicitly prevent the title from being updated.
    @param {string} [options.method='get']
      The HTTP method to use for the request.
    @param {Object|FormData|string|Array} [options.params]
      [Parameters](/up.Params) that should be sent as the request's payload.
    @param {string} [options.transition='none']
    @param {string|boolean} [options.history=true]
      If a string is given, it is used as the URL the browser's location bar and history.
      If omitted or true, the `url` argument will be used.
      If set to `false`, the history will remain unchanged.
    @param {boolean|string} [options.source=true]
    @param {boolean|string} [options.reveal=false]
      Whether to [reveal](/up.reveal) the new fragment.
  
      You can also pass a CSS selector for the element to reveal.
    @param {boolean|string} [options.failReveal=false]
      Whether to [reveal](/up.reveal) the new fragment when the server responds with an error.
  
      You can also pass a CSS selector for the element to reveal.
    @param {number} [options.revealPadding]
  
    @param {boolean} [options.restoreScroll=false]
      If set to true, Unpoly will try to restore the scroll position
      of all the viewports around or below the updated element. The position
      will be reset to the last known top position before a previous
      history change for the current URL.
    @param {boolean} [options.cache]
      Whether to use a [cached response](/up.proxy) if available.
    @param {string} [options.historyMethod='push']
    @param {Object} [options.headers={}]
      An object of additional header key/value pairs to send along
      with the request.
    @param {Element|jQuery} [options.origin]
      The element that triggered the replacement.
  
      The element's selector will be substituted for the `&` shorthand in the target selector ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [options.layer='auto']
      The name of the layer that ought to be updated. Valid values are
      `'auto'`, `'page'`, `'modal'` and `'popup'`.
  
      If set to `'auto'` (default), Unpoly will try to find a match in the
      same layer as the element that triggered the replacement (see `options.origin`).
      If that element is not known, or no match was found in that layer,
      Unpoly will search in other layers, starting from the topmost layer.
    @param {string} [options.failLayer='auto']
      The name of the layer that ought to be updated if the server sends a non-200 status code.
    @param {boolean} [options.keep=true]
      Whether this replacement will preserve [`[up-keep]`](/up-keep) elements.
    @param {boolean} [options.hungry=true]
      Whether this replacement will update [`[up-hungry]`](/up-hungry) elements.
  
    @return {Promise}
      A promise that will be fulfilled when the page has been updated.
    @stable
    */
    /***
    Returns the URL the given element was retrieved from.
  
    @method up.fragment.source
    @param {string|Element|jQuery} selectorOrElement
    @experimental
    */
    var bestMatchingSteps, bestPreflightSelector, config, createPlaceholder, destroy, e, emitFragmentDestroyed, emitFragmentInserted, emitFragmentKept, extract, findKeepPlan, first, firstInLayer, firstInPriority, hello, isRealElement, layerOf, markElementAsDestroying, matchesLayer, processResponse, reload, replace, reset, setSource, shouldExtractTitle, shouldLogDestruction, source, swapElements, transferKeepableElements, u, updateHistoryAndTitle;
    u = up.util;
    e = up.element;
    config = new up.Config({
        fallbacks: ['body'],
        fallbackTransition: null
    });
    reset = function () {
        return config.reset();
    };
    setSource = function (element, sourceUrl) {
        if (sourceUrl !== false) {
            if (u.isPresent(sourceUrl)) {
                sourceUrl = u.normalizeUrl(sourceUrl);
            }
            return element.setAttribute("up-source", sourceUrl);
        }
    };
    source = function (selectorOrElement) {
        var element;
        element = e.get(selectorOrElement);
        if (element = e.closest(element, '[up-source]')) {
            return element.getAttribute("up-source");
        }
        else {
            return up.browser.url();
        }
    };
    replace = function (selectorOrElement, url, options) {
        var error, failureOptions, fullLoad, improvedFailTarget, improvedTarget, onFailure, onSuccess, promise, request, requestAttrs, successOptions;
        options = u.options(options);
        options.inspectResponse = fullLoad = function () {
            return up.browser.navigate(url, u.only(options, 'method', 'params'));
        };
        if (!up.browser.canPushState() && options.history !== false) {
            if (!options.preload) {
                fullLoad();
            }
            return u.unresolvablePromise();
        }
        successOptions = u.merge(options, {
            humanizedTarget: 'target'
        });
        failureOptions = u.merge(options, {
            humanizedTarget: 'failure target',
            provideTarget: void 0,
            restoreScroll: false
        });
        u.renameKey(failureOptions, 'failTransition', 'transition');
        u.renameKey(failureOptions, 'failLayer', 'layer');
        u.renameKey(failureOptions, 'failReveal', 'reveal');
        try {
            improvedTarget = bestPreflightSelector(selectorOrElement, successOptions);
            improvedFailTarget = bestPreflightSelector(options.failTarget, failureOptions);
        }
        catch (error1) {
            error = error1;
            // Since we're an async function, we should not throw exceptions but return a rejected promise.
            // http://2ality.com/2016/03/promise-rejections-vs-exceptions.html
            return Promise.reject(error);
        }
        requestAttrs = u.only(options, 'method', 'data', 'params', 'cache', 'preload', 'headers', 'timeout'); // deprecated
        u.assign(requestAttrs, {
            url: url,
            target: improvedTarget,
            failTarget: improvedFailTarget
        });
        request = new up.Request(requestAttrs);
        onSuccess = function (response) {
            return processResponse(true, improvedTarget, request, response, successOptions);
        };
        onFailure = function (response) {
            var promise, rejection;
            rejection = function () {
                return Promise.reject(response);
            };
            if (response.isFatalError()) {
                return rejection();
            }
            else {
                promise = processResponse(false, improvedFailTarget, request, response, failureOptions);
                // Although processResponse() we will perform a successful replacement of options.failTarget,
                // we still want to reject the promise that's returned to our API client.
                return u.always(promise, rejection);
            }
        };
        promise = up.request(request);
        if (!options.preload) {
            promise = promise.then(onSuccess, onFailure);
        }
        return promise;
    };
    processResponse = function (isSuccess, selector, request, response, options) {
        var hash, historyUrl, isReloadable, sourceUrl;
        sourceUrl = response.url;
        historyUrl = sourceUrl;
        if (hash = request.hash) {
            options.hash = hash;
            historyUrl += hash;
        }
        isReloadable = response.method === 'GET';
        if (isSuccess) {
            if (isReloadable) { // e.g. GET returns 200 OK
                if (!(options.history === false || u.isString(options.history))) {
                    options.history = historyUrl;
                }
                if (!(options.source === false || u.isString(options.source))) { // e.g. POST returns 200 OK
                    options.source = sourceUrl;
                }
            }
            else {
                if (!u.isString(options.history)) {
                    // We allow the developer to pass GETable URLs as { history } and { source } options.
                    options.history = false;
                }
                if (!u.isString(options.source)) {
                    options.source = 'keep';
                }
            }
        }
        else {
            if (isReloadable) { // e.g. GET returns 500 Internal Server Error
                if (options.history !== false) {
                    options.history = historyUrl;
                }
                if (options.source !== false) { // e.g. POST returns 500 Internal Server Error
                    options.source = sourceUrl;
                }
            }
            else {
                options.history = false;
                options.source = 'keep';
            }
        }
        if (shouldExtractTitle(options) && response.title) {
            options.title = response.title;
        }
        return extract(selector, response.text, options);
    };
    shouldExtractTitle = function (options) {
        return !(options.title === false || u.isString(options.title) || (options.history === false && options.title !== true));
    };
    extract = function (selectorOrElement, html, options) {
        return up.log.group('Extracting %s from %d bytes of HTML', selectorOrElement, html != null ? html.length : void 0, function () {
            options = u.options(options, {
                historyMethod: 'push',
                keep: true,
                layer: 'auto'
            });
            if (options.saveScroll !== false) {
                up.viewport.saveScroll();
            }
            return u.rejectOnError(function () {
                var extractSteps, i, len, responseDoc, responseTitle, step, swapPromises;
                if (typeof options.provideTarget === "function") {
                    options.provideTarget();
                }
                responseDoc = new up.HtmlParser(html);
                extractSteps = bestMatchingSteps(selectorOrElement, responseDoc, options);
                if (shouldExtractTitle(options) && (responseTitle = responseDoc.title())) {
                    options.title = responseTitle;
                }
                updateHistoryAndTitle(options);
                swapPromises = [];
                for (i = 0, len = extractSteps.length; i < len; i++) {
                    step = extractSteps[i];
                    up.log.group('Swapping fragment %s', step.selector, function () {
                        var swapOptions, swapPromise;
                        // Note that we must copy the options hash instead of changing it in-place,  since the
                        // async swapElements() is scheduled for the next microtask and we must not change the options
                        // for the previous iteration.
                        swapOptions = u.merge(options, u.only(step, 'origin', 'reveal'));
                        responseDoc.prepareForInsertion(step.newElement);
                        swapPromise = swapElements(step.oldElement, step.newElement, step.pseudoClass, step.transition, swapOptions);
                        return swapPromises.push(swapPromise);
                    });
                }
                // Delay all further links in the promise chain until all fragments have been swapped
                return Promise.all(swapPromises);
            });
        });
    };
    bestPreflightSelector = function (selectorOrElement, options) {
        var cascade;
        cascade = new up.ExtractCascade(selectorOrElement, options);
        return cascade.bestPreflightSelector();
    };
    bestMatchingSteps = function (selectorOrElement, response, options) {
        var cascade;
        options = u.merge(options, { response: response });
        cascade = new up.ExtractCascade(selectorOrElement, options);
        return cascade.bestMatchingSteps();
    };
    updateHistoryAndTitle = function (options) {
        options = u.options(options, {
            historyMethod: 'push'
        });
        if (options.history) {
            up.history[options.historyMethod](options.history);
        }
        if (u.isString(options.title)) {
            return document.title = options.title;
        }
    };
    swapElements = function (oldElement, newElement, pseudoClass, transition, options) {
        var child, childNode, i, keepPlan, len, morphOptions, parent, promise, ref, wrapper;
        transition || (transition = 'none');
        // When the server responds with an error, or when the request method is not
        // reloadable (not GET), we keep the same source as before.
        if (options.source === 'keep') {
            options = u.merge(options, {
                source: source(oldElement)
            });
        }
        // Remember where the element came from in case someone needs to up.reload(newElement) later.
        setSource(newElement, options.source);
        if (pseudoClass) {
            // Text nodes are wrapped in a .up-insertion container so we can
            // animate them and measure their position/size for scrolling.
            // This is not possible for container-less text nodes.
            wrapper = e.createFromSelector('.up-insertion');
            while (childNode = newElement.firstChild) {
                wrapper.appendChild(childNode);
            }
            // Note that since we're prepending/appending instead of replacing,
            // newElement will not actually be inserted into the DOM, only its children.
            if (pseudoClass === 'before') {
                oldElement.insertAdjacentElement('afterbegin', wrapper);
            }
            else {
                oldElement.insertAdjacentElement('beforeend', wrapper);
            }
            ref = wrapper.children;
            for (i = 0, len = ref.length; i < len; i++) {
                child = ref[i];
                hello(child, options);
            }
            // Reveal element that was being prepended/appended.
            // Since we will animate (not morph) it's OK to allow animation of scrolling
            // if options.scrollBehavior is given.
            promise = up.viewport.scrollAfterInsertFragment(wrapper, options);
            // Since we're adding content instead of replacing, we'll only
            // animate newElement instead of morphing between oldElement and newElement
            promise = u.always(promise, up.animate(wrapper, transition, options));
            // Remove the wrapper now that is has served it purpose
            promise = promise.then(function () {
                return e.unwrap(wrapper);
            });
            return promise;
        }
        else if (keepPlan = findKeepPlan(oldElement, newElement, options)) {
            // Since we're keeping the element that was requested to be swapped,
            // there is nothing left to do here, except notify event listeners.
            emitFragmentKept(keepPlan);
            return Promise.resolve();
        }
        else {
            // This needs to happen before prepareClean() below.
            // Otherwise we would collect destructors for elements we want to keep.
            options.keepPlans = transferKeepableElements(oldElement, newElement, options);
            parent = oldElement.parentNode;
            morphOptions = u.merge(options, {
                beforeStart: function () {
                    return markElementAsDestroying(oldElement);
                },
                afterInsert: function () {
                    return up.hello(newElement, options);
                },
                beforeDetach: function () {
                    return up.syntax.clean(oldElement);
                },
                afterDetach: function () {
                    e.remove(oldElement); // clean up jQuery data
                    return emitFragmentDestroyed(oldElement, {
                        parent: parent,
                        log: false
                    });
                }
            });
            return up.morph(oldElement, newElement, transition, morphOptions);
        }
    };
    // This will find all [up-keep] descendants in oldElement, overwrite their partner
    // element in newElement and leave a visually identical clone in oldElement for a later transition.
    // Returns an array of keepPlans.
    transferKeepableElements = function (oldElement, newElement, options) {
        var i, keepPlans, keepable, keepableClone, len, plan, ref;
        keepPlans = [];
        if (options.keep) {
            ref = oldElement.querySelectorAll('[up-keep]');
            for (i = 0, len = ref.length; i < len; i++) {
                keepable = ref[i];
                if (plan = findKeepPlan(keepable, newElement, u.merge(options, {
                    descendantsOnly: true
                }))) {
                    // plan.oldElement is now keepable
                    // Replace keepable with its clone so it looks good in a transition between
                    // oldElement and newElement. Note that keepable will still point to the same element
                    // after the replacement, which is now detached.
                    keepableClone = keepable.cloneNode(true);
                    e.replace(keepable, keepableClone);
                    // Since we're going to swap the entire oldElement and newElement containers afterwards,
                    // replace the matching element with keepable so it will eventually return to the DOM.
                    e.replace(plan.newElement, keepable);
                    keepPlans.push(plan);
                }
            }
        }
        return keepPlans;
    };
    findKeepPlan = function (element, newElement, options) {
        var keepEventArgs, keepable, partner, partnerSelector, plan;
        if (options.keep) {
            keepable = element;
            if (partnerSelector = e.booleanOrStringAttr(keepable, 'up-keep')) {
                u.isString(partnerSelector) || (partnerSelector = '&');
                partnerSelector = e.resolveSelector(partnerSelector, keepable);
                if (options.descendantsOnly) {
                    partner = e.first(newElement, partnerSelector);
                }
                else {
                    partner = e.subtree(newElement, partnerSelector)[0];
                }
                if (partner && e.matches(partner, '[up-keep]')) {
                    plan = {
                        oldElement: keepable,
                        newElement: partner,
                        newData: up.syntax.data(partner) // the parsed up-data attribute of the element we will discard
                    };
                    keepEventArgs = {
                        target: keepable,
                        newFragment: partner,
                        newData: plan.newData,
                        log: ['Keeping element %o', keepable]
                    };
                    if (up.event.nobodyPrevents('up:fragment:keep', keepEventArgs)) {
                        return plan;
                    }
                }
            }
        }
    };
    hello = function (selectorOrElement, options) {
        var element, i, keptElements, len, plan, ref;
        element = e.get(selectorOrElement);
        options = u.options(options, {
            keepPlans: []
        });
        keptElements = [];
        ref = options.keepPlans;
        for (i = 0, len = ref.length; i < len; i++) {
            plan = ref[i];
            emitFragmentKept(plan);
            keptElements.push(plan.oldElement);
        }
        up.syntax.compile(element, {
            skip: keptElements
        });
        emitFragmentInserted(element, options);
        return element;
    };
    emitFragmentInserted = function (element, options) {
        return up.emit(element, 'up:fragment:inserted', {
            log: ['Inserted fragment %o', element],
            origin: options.origin
        });
    };
    emitFragmentKept = function (keepPlan) {
        var eventAttrs, keptElement;
        keptElement = keepPlan.oldElement;
        eventAttrs = {
            target: keptElement,
            newFragment: keepPlan.newElement,
            newData: keepPlan.newData,
            log: ['Kept fragment %o', keptElement]
        };
        return up.emit('up:fragment:kept', eventAttrs);
    };
    emitFragmentDestroyed = function (fragment, options) {
        var log, parent;
        if (shouldLogDestruction(fragment, options)) {
            log = ['Destroyed fragment %o', fragment];
        }
        parent = options.parent || up.fail("Missing { parent } option");
        return up.emit(parent, 'up:fragment:destroyed', { fragment: fragment, parent: parent, log: log });
    };
    isRealElement = function (element) {
        return !e.closest(element, '.up-destroying');
    };
    first = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var layer, options, origin, ref, root, selector;
        options = u.extractOptions(args);
        selector = args.pop();
        root = args[0] || document;
        layer = (ref = options.layer) != null ? ref : 'auto';
        origin = options.origin;
        selector = e.resolveSelector(selector, origin);
        if (layer === 'auto') {
            return firstInPriority(root, selector, origin);
        }
        else {
            return firstInLayer(root, selector, layer);
        }
    };
    firstInPriority = function (parent, selector, origin) {
        var layers, originLayer;
        layers = ['popup', 'modal', 'page'];
        if (origin) {
            originLayer = layerOf(origin);
            // Make the origin's layer the top priority
            u.remove(layers, originLayer);
            layers.unshift(originLayer);
        }
        return u.findResult(layers, function (layer) {
            return firstInLayer(parent, selector, layer);
        });
    };
    firstInLayer = function (parent, selector, layer) {
        var elements;
        elements = e.all(parent, selector);
        return u.findResult(elements, function (element) {
            if (isRealElement(element) && matchesLayer(element, layer)) {
                return element;
            }
        });
    };
    layerOf = function (element) {
        if (up.popup.contains(element)) {
            return 'popup';
        }
        else if (up.modal.contains(element)) {
            return 'modal';
        }
        else {
            return 'page';
        }
    };
    matchesLayer = function (element, layer) {
        return !layer || layerOf(element) === layer;
    };
    createPlaceholder = function (selector, container) {
        if (container === void 0) { container = document.body; }
        return e.affix(container, selector, {
            class: 'up-placeholder'
        });
    };
    destroy = function (selectorOrElement, options) {
        var animate, element, wipe;
        element = e.get(selectorOrElement);
        options = u.options(options, {
            animation: false
        });
        if (!element) {
            return Promise.resolve();
        }
        markElementAsDestroying(element);
        updateHistoryAndTitle(options);
        animate = function () {
            var animateOptions;
            animateOptions = up.motion.animateOptions(options);
            return up.motion.animate(element, options.animation, animateOptions);
        };
        wipe = function () {
            var parent;
            parent = element.parentNode;
            up.syntax.clean(element);
            e.remove(element);
            return emitFragmentDestroyed(element, {
                parent: parent,
                log: options.log
            });
        };
        return animate().then(wipe);
    };
    shouldLogDestruction = function (element, options) {
        // Don't log destruction for elements that are either Unpoly internals or frequently destroyed
        return options.log !== false && !e.matches(element, '.up-placeholder, .up-tooltip, .up-modal, .up-popup');
    };
    markElementAsDestroying = function (element) {
        return element.classList.add('up-destroying');
    };
    reload = function (selectorOrElement, options) {
        var sourceUrl;
        options = u.options(options, {
            cache: false
        });
        sourceUrl = options.url || source(selectorOrElement);
        return replace(selectorOrElement, sourceUrl, options);
    };
    up.on('up:app:boot', function () {
        var body;
        body = document.body;
        setSource(body, up.browser.url());
        return hello(body);
    });
    up.on('up:framework:reset', reset);
    return {
        createPlaceholder: createPlaceholder,
        replace: replace,
        reload: reload,
        destroy: destroy,
        extract: extract,
        first: first,
        source: source,
        hello: hello,
        config: config,
        layerOf: layerOf
    };
})();
up.replace = up.fragment.replace;
up.extract = up.fragment.extract;
up.reload = up.fragment.reload;
up.destroy = up.fragment.destroy;
up.hello = up.fragment.hello;
up.first = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var _a;
    up.legacy.warn('up.first() has been renamed to up.fragment.first()');
    return (_a = up.fragment).first.apply(_a, args);
};
up.legacy.renamedModule('flow', 'fragment');
up.legacy.renamedModule('dom', 'fragment');


/***/ }),
/* 42 */
/***/ (function(module, exports) {

/***
Animation
=========

Whenever you [update a page fragment](/up.link) you can animate the change.

Let's say you are using an [`up-target`](/a-up-target) link to update an element
with content from the server. You can add an attribute [`up-transition`](/a-up-target#up-transition)
to smoothly fade out the old element while fading in the new element:

    <a href="/users" up-target=".list" up-transition="cross-fade">Show users</a>

\#\#\# Transitions vs. animations

When we morph between an old and a new element, we call it a *transition*.
In contrast, when we animate a new element without simultaneously removing an
old element, we call it an *animation*.

An example for an animation is opening a new dialog. We can animate the appearance
of the dialog by adding an [`[up-animation]`](/a-up-modal#up-animation) attribute to the opening link:

    <a href="/users" up-modal=".list" up-animation="move-from-top">Show users</a>

\#\#\# Which animations are available?

Unpoly ships with a number of [predefined transitions](/up.morph#named-transitions)
and [predefined animations](/up.animate#named-animations).

You can define custom animations using [`up.transition()`](/up.transition) and
[`up.animation()`](/up.animation).

@module up.motion
*/
up.motion = (function () {
    /***
    Applies the given animation to the given element.
  
    \#\#\# Example
  
    up.animate('.warning', 'fade-in')
  
    You can pass additional options:
  
    up.animate('warning', '.fade-in', {
      delay: 1000,
      duration: 250,
      easing: 'linear'
    })
  
    \#\#\# Named animations
  
    The following animations are pre-defined:
  
    | `fade-in`          | Changes the element's opacity from 0% to 100% |
    | `fade-out`         | Changes the element's opacity from 100% to 0% |
    | `move-to-top`      | Moves the element upwards until it exits the screen at the top edge |
    | `move-from-top`    | Moves the element downwards from beyond the top edge of the screen until it reaches its current position |
    | `move-to-bottom`   | Moves the element downwards until it exits the screen at the bottom edge |
    | `move-from-bottom` | Moves the element upwards from beyond the bottom edge of the screen until it reaches its current position |
    | `move-to-left`     | Moves the element leftwards until it exists the screen at the left edge  |
    | `move-from-left`   | Moves the element rightwards from beyond the left edge of the screen until it reaches its current position |
    | `move-to-right`    | Moves the element rightwards until it exists the screen at the right edge  |
    | `move-from-right`  | Moves the element leftwards from beyond the right  edge of the screen until it reaches its current position |
    | `none`             | An animation that has no visible effect. Sounds useless at first, but can save you a lot of `if` statements. |
  
    You can define additional named animations using [`up.animation()`](/up.animation).
  
    \#\#\# Animating CSS properties directly
  
    By passing an object instead of an animation name, you can animate
    the CSS properties of the given element:
  
    var warning = document.querySelector('.warning')
    warning.style.opacity = 0
    up.animate(warning, { opacity: 1 })
  
    CSS properties must be given in `kebab-case`, not `camelCase`.
  
    \#\#\# Multiple animations on the same element
  
    Unpoly doesn't allow more than one concurrent animation on the same element.
  
    If you attempt to animate an element that is already being animated,
    the previous animation will instantly jump to its last frame before
    the new animation begins.
  
    @function up.animate
    @param {Element|jQuery|string} elementOrSelector
    The element to animate.
    @param {string|Function(element, options): Promise|Object} animation
    Can either be:
  
    - The animation's name
    - A function performing the animation
    - An object of CSS attributes describing the last frame of the animation (using kebeb-case property names)
    @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
    @param {number} [options.delay=0]
    The delay before the animation starts, in milliseconds.
    @param {string} [options.easing='ease']
    The timing function that controls the animation's acceleration.
  
    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
    @return {Promise}
    A promise for the animation's end.
    @stable
     */
    /***
    Animates the given element's CSS properties using CSS transitions.
  
    Does not track the animation, nor does it finishes existing animations
    (use `up.motion.animate()` for that). It does, however, listen to the motionController's
    finish event.
  
    @function animateNow
    @param {Element|jQuery|string} elementOrSelector
      The element to animate.
    @param {Object} lastFrame
      The CSS properties that should be transitioned to.
    @param {number} [options.duration=300]
      The duration of the animation, in milliseconds.
    @param {number} [options.delay=0]
      The delay before the animation starts, in milliseconds.
    @param {string} [options.easing='ease']
      The timing function that controls the animation's acceleration.
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @return {Promise}
      A promise that fulfills when the animation ends.
    @internal
    */
    /***
    Extracts animation-related options from the given options hash.
    If `element` is given, also inspects the element for animation-related
    attributes like `up-easing` or `up-duration`.
  
    @param {Object} userOptions
    @param {Element|jQuery} [element]
    @param {Object} [moduleDefaults]
    @function up.motion.animateOptions
    @internal
    */
    /***
    Sets default options for animations and transitions.
  
    @property up.motion.config
    @param {number} [config.duration=300]
      The default duration for all animations and transitions (in milliseconds).
    @param {number} [config.delay=0]
      The default delay for all animations and transitions (in milliseconds).
    @param {string} [config.easing='ease']
      The default timing function that controls the acceleration of animations and transitions.
  
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @param {boolean} [config.enabled=true]
      Whether animation is enabled.
  
      Set this to `false` to disable animation globally.
      This can be useful in full-stack integration tests like a Selenium test suite.
  
      Regardless of this setting, all animations will be skipped on browsers
      that do not support [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions).
    @stable
    */
    /***
    Completes [animations](/up.animate) and [transitions](/up.morph).
  
    If called without arguments, all animations on the screen are completed.
    If given an element (or selector), animations on that element and its children
    are completed.
  
    Animations are completed by jumping to the last animation frame instantly.
    Promises returned by animation and transition functions instantly settle.
  
    Emits the `up:motion:finish` event that is already handled by `up.animate()`.
  
    Does nothing if there are no animation to complete.
  
    @function up.motion.finish
    @param {Element|jQuery|string} [elementOrSelector]
    @return {Promise}
    A promise that fulfills when animations and transitions have finished.
    @stable
    */
    /***
    Returns whether Unpoly will perform animations.
  
    Set [`up.motion.config.enabled`](/up.motion.config) `false` in order to disable animations globally.
  
    @function up.motion.isEnabled
    @return {boolean}
    @stable
    */
    /***
    Returns whether the given animation option will cause the animation
    to be skipped.
  
    @function up.motion.isNone
    @internal
    */
    /***
    This event is emitted on an [animating](/up.animating) element by `up.motion.finish()` to
    request the animation to instantly finish and skip to the last frame.
  
    Promises returned by completed animation functions are expected to settle.
  
    Animations started by `up.animate()` already handle this event.
  
    @event up:motion:finish
    @param {Element} event.target
    The animating element.
    @experimental
    */
    /***
    Performs an animated transition between the `source` and `target` elements.
  
    Transitions are implement by performing two animations in parallel,
    causing `source` to disappear and the `target` to appear.
  
    - `target` is [inserted before](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore) `source`
    - `source` is removed from the [document flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Positioning) with `position: absolute`.
     It will be positioned over its original place in the flow that is now occupied by `target`.
    - Both `source` and `target` are animated in parallel
    - `source` is removed from the DOM
  
    \#\#\# Named transitions
  
    The following transitions are pre-defined:
  
    | `cross-fade` | Fades out the first element. Simultaneously fades in the second element. |
    | `move-up`    | Moves the first element upwards until it exits the screen at the top edge. Simultaneously moves the second element upwards from beyond the bottom edge of the screen until it reaches its current position. |
    | `move-down`  | Moves the first element downwards until it exits the screen at the bottom edge. Simultaneously moves the second element downwards from beyond the top edge of the screen until it reaches its current position. |
    | `move-left`  | Moves the first element leftwards until it exists the screen at the left edge. Simultaneously moves the second element leftwards from beyond the right  edge of the screen until it reaches its current position. |
    | `move-right` | Moves the first element rightwards until it exists the screen at the right edge. Simultaneously moves the second element rightwards from beyond the left edge of the screen until it reaches its current position. |
    | `none`       | A transition that has no visible effect. Sounds useless at first, but can save you a lot of `if` statements. |
  
    You can define additional named transitions using [`up.transition()`](/up.transition).
  
    You can also compose a transition from two [named animations](/named-animations).
    separated by a slash character (`/`):
  
    - `move-to-bottom/fade-in`
    - `move-to-left/move-from-top`
  
    \#\#\# Implementation details
  
    During a transition both the old and new element occupy
    the same position on the screen.
  
    Since the CSS layout flow will usually not allow two elements to
    overlay the same space, Unpoly:
  
    - The old and new elements are cloned
    - The old element is removed from the layout flow using `display: hidden`
    - The new element is hidden, but still leaves space in the layout flow by setting `visibility: hidden`
    - The clones are [absolutely positioned](https://developer.mozilla.org/en-US/docs/Web/CSS/position#Absolute_positioning)
    over the original elements.
    - The transition is applied to the cloned elements.
    At no point will the hidden, original elements be animated.
    - When the transition has finished, the clones are removed from the DOM and the new element is shown.
    The old element remains hidden in the DOM.
  
    @function up.morph
    @param {Element|jQuery|string} source
    @param {Element|jQuery|string} target
    @param {Function(oldElement, newElement)|string} transition
    @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
    @param {number} [options.delay=0]
    The delay before the animation starts, in milliseconds.
    @param {string} [options.easing='ease']
    The timing function that controls the transition's acceleration.
  
    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
    @param {boolean} [options.reveal=false]
    Whether to reveal the new element by scrolling its parent viewport.
    @return {Promise}
    A promise that fulfills when the transition ends.
    @stable
     */
    /***
    Defines a named animation.
  
    Here is the definition of the pre-defined `fade-in` animation:
  
    up.animation('fade-in', function(element, options) {
      element.style.opacity = 0
      up.animate(element, { opacity: 1 }, options)
    })
  
    It is recommended that your definitions always end by calling
    calling [`up.animate()`](/up.animate) with an object argument, passing along
    the `options` that were passed to you.
  
    If you choose to *not* use `up.animate()` and roll your own
    animation code instead, your code must honor the following contract:
  
    1. It must honor the options `{ delay, duration, easing }` if given
    2. It must *not* remove any of the given elements from the DOM.
    3. It returns a promise that is fulfilled when the transition has ended
    4. If during the animation an event `up:motion:finish` is emitted on
     the given element, the transition instantly jumps to the last frame
     and resolves the returned promise.
  
    Calling [`up.animate()`](/up.animate) with an object argument
    will take care of all these points.
  
    @function up.animation
    @param {string} name
    @param {Function(element, options): Promise} animation
    @stable
    */
    /***
    Defines a named transition that [morphs](/up.element) from one element to another.
  
    \#\#\# Example
  
    Here is the definition of the pre-defined `cross-fade` animation:
  
     up.transition('cross-fade', (oldElement, newElement, options) ->
     Promise.all([
       up.animate(oldElement, 'fade-out', options),
       up.animate(newElement, 'fade-in', options)
     ])
     )
  
    It is recommended that your transitions use [`up.animate()`](/up.animate),
    passing along the `options` that were passed to you.
  
    If you choose to *not* use `up.animate()` and roll your own
    logic instead, your code must honor the following contract:
  
    1. It must honor the options `{ delay, duration, easing }` if given.
    2. It must *not* remove any of the given elements from the DOM.
    3. It returns a promise that is fulfilled when the transition has ended.
    4. If during the animation an event `up:motion:finish` is emitted on
    either element, the transition instantly jumps to the last frame
    and resolves the returned promise.
  
    Calling [`up.animate()`](/up.animate) with an object argument
    will take care of all these points.
  
    @function up.transition
    @param {string} name
    @param {Function(oldElement, newElement, options): Promise|Array} transition
    @stable
    */
    var animCount, animate, animateNow, animateOptions, composeTransitionFn, config, defaultNamedAnimations, defaultNamedTransitions, e, findAnimationFn, findNamedAnimation, findTransitionFn, finish, isEnabled, isNone, morph, motionController, namedAnimations, namedTransitions, registerAnimation, registerTransition, reset, skipAnimate, snapshot, swapElementsDirectly, translateCss, u, willAnimate;
    u = up.util;
    e = up.element;
    namedAnimations = {};
    defaultNamedAnimations = {};
    namedTransitions = {};
    defaultNamedTransitions = {};
    motionController = new up.MotionController('motion');
    config = new up.Config({
        duration: 300,
        delay: 0,
        easing: 'ease',
        enabled: true
    });
    reset = function () {
        motionController.reset();
        namedAnimations = u.copy(defaultNamedAnimations);
        namedTransitions = u.copy(defaultNamedTransitions);
        return config.reset();
    };
    isEnabled = function () {
        return config.enabled;
    };
    animate = function (elementOrSelector, animation, options) {
        var animationFn, element, runNow, willRun;
        element = e.get(elementOrSelector);
        options = animateOptions(options);
        animationFn = findAnimationFn(animation);
        willRun = willAnimate(element, animation, options);
        if (willRun) {
            runNow = function () {
                return animationFn(element, options);
            };
            return motionController.startFunction(element, runNow, options);
        }
        else {
            return skipAnimate(element, animation);
        }
    };
    willAnimate = function (element, animationOrTransition, options) {
        options = animateOptions(options);
        return isEnabled() && !isNone(animationOrTransition) && options.duration > 0 && !e.isSingleton(element);
    };
    skipAnimate = function (element, animation) {
        if (u.isOptions(animation)) {
            // If we are given the final animation frame as an object of CSS properties,
            // the best we can do is to set the final frame without animation.
            e.setStyle(element, animation);
        }
        // Signal that the animation is already done.
        return Promise.resolve();
    };
    animCount = 0;
    animateNow = function (element, lastFrame, options) {
        var cssTransition;
        options = u.merge(options, {
            finishEvent: motionController.finishEvent
        });
        cssTransition = new up.CssTransition(element, lastFrame, options);
        return cssTransition.start();
    };
    animateOptions = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var consolidatedOptions, element, moduleDefaults, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, userOptions;
        userOptions = (ref = args.shift()) != null ? ref : {};
        moduleDefaults = u.extractOptions(args);
        element = args.pop() || e.none();
        consolidatedOptions = {};
        consolidatedOptions.easing = (ref1 = (ref2 = (ref3 = userOptions.easing) != null ? ref3 : element.getAttribute('up-easing')) != null ? ref2 : moduleDefaults.easing) != null ? ref1 : config.easing;
        consolidatedOptions.duration = (ref4 = (ref5 = (ref6 = userOptions.duration) != null ? ref6 : e.numberAttr(element, 'up-duration')) != null ? ref5 : moduleDefaults.duration) != null ? ref4 : config.duration;
        consolidatedOptions.delay = (ref7 = (ref8 = (ref9 = userOptions.delay) != null ? ref9 : e.numberAttr(element, 'up-delay')) != null ? ref8 : moduleDefaults.delay) != null ? ref7 : config.delay;
        consolidatedOptions.trackMotion = userOptions.trackMotion; // required by up.MotionController
        return consolidatedOptions;
    };
    findNamedAnimation = function (name) {
        return namedAnimations[name] || up.fail("Unknown animation %o", name);
    };
    finish = function (elementOrSelector) {
        return motionController.finish(elementOrSelector);
    };
    morph = function (oldElement, newElement, transitionObject, options) {
        var afterDetach, afterInsert, beforeDetach, beforeStart, oldRemote, promise, scrollNew, scrollTopBeforeReveal, trackable, transitionFn, viewport, willMorph;
        options = u.options(options);
        u.assign(options, animateOptions(options));
        oldElement = e.get(oldElement);
        newElement = e.get(newElement);
        transitionFn = findTransitionFn(transitionObject);
        willMorph = willAnimate(oldElement, transitionFn, options);
        // Remove callbacks from our options hash in case transitionFn calls morph() recursively.
        // If we passed on these callbacks, we might call destructors, events, etc. multiple times.
        beforeStart = u.pluckKey(options, 'beforeStart') || u.noop;
        afterInsert = u.pluckKey(options, 'afterInsert') || u.noop;
        beforeDetach = u.pluckKey(options, 'beforeDetach') || u.noop;
        afterDetach = u.pluckKey(options, 'afterDetach') || u.noop;
        beforeStart();
        scrollNew = function () {
            var scrollOptions;
            // Don't animate the scrolling.
            scrollOptions = u.merge(options, {
                scrollBehavior: 'auto'
            });
            // Scroll newElement into position before we start the enter animation.
            return up.viewport.scrollAfterInsertFragment(newElement, scrollOptions);
        };
        if (willMorph) {
            if (motionController.isActive(oldElement) && options.trackMotion === false) {
                return transitionFn(oldElement, newElement, options);
            }
            up.puts('Morphing %o to %o with transition %o', oldElement, newElement, transitionObject);
            viewport = up.viewport.closest(oldElement);
            scrollTopBeforeReveal = viewport.scrollTop;
            oldRemote = up.viewport.absolutize(oldElement, {
                // Because the insertion will shift elements visually, we must delay insertion
                // until absolutize() has measured the bounding box of the old element.
                afterMeasure: function () {
                    e.insertBefore(oldElement, newElement);
                    return afterInsert();
                }
            });
            trackable = function () {
                var promise;
                // Scroll newElement into position before we start the enter animation.
                promise = scrollNew();
                promise = promise.then(function () {
                    var scrollTopAfterReveal;
                    // Since we have scrolled the viewport (containing both oldElement and newElement),
                    // we must shift the old copy so it looks like it it is still sitting
                    // in the same position.
                    scrollTopAfterReveal = viewport.scrollTop;
                    oldRemote.moveBounds(0, scrollTopAfterReveal - scrollTopBeforeReveal);
                    return transitionFn(oldElement, newElement, options);
                });
                promise = promise.then(function () {
                    beforeDetach();
                    e.remove(oldRemote.bounds);
                    return afterDetach();
                });
                return promise;
            };
            return motionController.startFunction([oldElement, newElement], trackable, options);
        }
        else {
            beforeDetach();
            // Swapping the elements directly with replaceWith() will cause
            // jQuery to remove all data attributes, which we use to store destructors
            swapElementsDirectly(oldElement, newElement);
            afterInsert();
            afterDetach();
            promise = scrollNew();
            return promise;
        }
    };
    findTransitionFn = function (object) {
        var namedTransition;
        if (isNone(object)) {
            return void 0;
        }
        else if (u.isFunction(object)) {
            return object;
        }
        else if (u.isArray(object)) {
            return composeTransitionFn.apply(void 0, object);
        }
        else if (u.isString(object)) {
            if (object.indexOf('/') >= 0) { // Compose a transition from two animation names
                return composeTransitionFn.apply(void 0, object.split('/'));
            }
            else if (namedTransition = namedTransitions[object]) {
                return findTransitionFn(namedTransition);
            }
        }
        else {
            return up.fail("Unknown transition %o", object);
        }
    };
    composeTransitionFn = function (oldAnimation, newAnimation) {
        var newAnimationFn, oldAnimationFn;
        if (isNone(oldAnimation) && isNone(oldAnimation)) {
            // A composition of two null-animations is a null-transform
            // and should be skipped.
            return void 0;
        }
        else {
            oldAnimationFn = findAnimationFn(oldAnimation) || u.asyncNoop;
            newAnimationFn = findAnimationFn(newAnimation) || u.asyncNoop;
            return function (oldElement, newElement, options) {
                return Promise.all([oldAnimationFn(oldElement, options), newAnimationFn(newElement, options)]);
            };
        }
    };
    findAnimationFn = function (object) {
        if (isNone(object)) {
            return void 0;
        }
        else if (u.isFunction(object)) {
            return object;
        }
        else if (u.isString(object)) {
            return findNamedAnimation(object);
        }
        else if (u.isOptions(object)) {
            return function (element, options) {
                return animateNow(element, object, options);
            };
        }
        else {
            return up.fail('Unknown animation %o', object);
        }
    };
    // Have a separate function so we can mock it in specs.
    swapElementsDirectly = function (oldElement, newElement) {
        return e.replace(oldElement, newElement);
    };
    registerTransition = function (name, transition) {
        return namedTransitions[name] = findTransitionFn(transition);
    };
    registerAnimation = function (name, animation) {
        return namedAnimations[name] = findAnimationFn(animation);
    };
    snapshot = function () {
        defaultNamedAnimations = u.copy(namedAnimations);
        return defaultNamedTransitions = u.copy(namedTransitions);
    };
    isNone = function (animationOrTransition) {
        return !animationOrTransition || animationOrTransition === 'none' || u.isBlank(animationOrTransition);
    };
    registerAnimation('fade-in', function (element, options) {
        e.setStyle(element, {
            opacity: 0
        });
        return animateNow(element, {
            opacity: 1
        }, options);
    });
    registerAnimation('fade-out', function (element, options) {
        e.setStyle(element, {
            opacity: 1
        });
        return animateNow(element, {
            opacity: 0
        }, options);
    });
    translateCss = function (x, y) {
        return {
            transform: "translate(" + x + "px, " + y + "px)"
        };
    };
    registerAnimation('move-to-top', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = box.top + box.height;
        return animateNow(element, translateCss(0, -travelDistance), options);
    });
    registerAnimation('move-from-top', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = box.top + box.height;
        e.setStyle(element, translateCss(0, -travelDistance));
        return animateNow(element, translateCss(0, 0), options);
    });
    registerAnimation('move-to-bottom', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = e.root().clientHeight - box.top;
        return animateNow(element, translateCss(0, travelDistance), options);
    });
    registerAnimation('move-from-bottom', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = up.viewport.rootHeight() - box.top;
        e.setStyle(element, translateCss(0, travelDistance));
        return animateNow(element, translateCss(0, 0), options);
    });
    registerAnimation('move-to-left', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = box.left + box.width;
        return animateNow(element, translateCss(-travelDistance, 0), options);
    });
    registerAnimation('move-from-left', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = box.left + box.width;
        e.setStyle(element, translateCss(-travelDistance, 0));
        return animateNow(element, translateCss(0, 0), options);
    });
    registerAnimation('move-to-right', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = up.viewport.rootWidth() - box.left;
        return animateNow(element, translateCss(travelDistance, 0), options);
    });
    registerAnimation('move-from-right', function (element, options) {
        var box, travelDistance;
        e.setStyle(element, translateCss(0, 0));
        box = element.getBoundingClientRect();
        travelDistance = up.viewport.rootWidth() - box.left;
        e.setStyle(element, translateCss(travelDistance, 0));
        return animateNow(element, translateCss(0, 0), options);
    });
    registerAnimation('roll-down', function (element, options) {
        var deferred, previousHeightStr, styleMemo;
        previousHeightStr = e.style(element, 'height');
        styleMemo = e.setTemporaryStyle(element, {
            height: '0px',
            overflow: 'hidden'
        });
        deferred = animate(element, {
            height: previousHeightStr
        }, options);
        deferred.then(styleMemo);
        return deferred;
    });
    registerTransition('move-left', ['move-to-left', 'move-from-right']);
    registerTransition('move-right', ['move-to-right', 'move-from-left']);
    registerTransition('move-up', ['move-to-top', 'move-from-bottom']);
    registerTransition('move-down', ['move-to-bottom', 'move-from-top']);
    registerTransition('cross-fade', ['fade-out', 'fade-in']);
    up.on('up:framework:booted', snapshot);
    up.on('up:framework:reset', reset);
    return {
        morph: morph,
        animate: animate,
        animateOptions: animateOptions,
        finish: finish,
        finishCount: function () {
            return motionController.finishCount;
        },
        transition: registerTransition,
        animation: registerAnimation,
        config: config,
        isEnabled: isEnabled,
        isNone: isNone
    };
})();
up.transition = up.motion.transition;
up.animation = up.motion.animation;
up.morph = up.motion.morph;
up.animate = up.motion.animate;


/***/ }),
/* 43 */
/***/ (function(module, exports) {

/***
AJAX acceleration
=================

Unpoly comes with a number of tricks to shorten the latency between browser and server.

\#\#\# Server responses are cached by default

Unpoly caches server responses for a few minutes,
making requests to these URLs return instantly.
All Unpoly functions and selectors go through this cache, unless
you explicitly pass a `{ cache: false }` option or set an `up-cache="false"` attribute.

The cache holds up to 70 responses for 5 minutes. You can configure the cache size and expiry using
[`up.proxy.config`](/up.proxy.config), or clear the cache manually using [`up.proxy.clear()`](/up.proxy.clear).

Also the entire cache is cleared with every non-`GET` request (like `POST` or `PUT`).

If you need to make cache-aware requests from your [custom JavaScript](/up.syntax),
use [`up.request()`](/up.request).

\#\#\# Preloading links

Unpoly also lets you speed up reaction times by [preloading
links](/a-up-preload) when the user hovers over the click area (or puts the mouse/finger
down). This way the response will already be cached when
the user releases the mouse/finger.

\#\#\# Spinners

You can listen to the [`up:proxy:slow`](/up:proxy:slow) event to implement a spinner
that appears during a long-running request.

\#\#\# More acceleration

Other Unpoly modules contain even more tricks to outsmart network latency:

- [Instantaneous feedback for links that are currently loading](/a.up-active)
- [Follow links on `mousedown` instead of `click`](/a-up-instant)

@module up.proxy
*/
up.proxy = (function () {
    /***
    Makes an AJAX request to the given URL and caches the response.
  
    The function returns a promise that fulfills with the response text.
  
    \#\#\# Example
  
    up.request('/search', { params: { query: 'sunshine' } }).then(function(text) {
      console.log('The response text is %o', text)
    }).catch(function() {
      console.error('The request failed')
    })
  
    @function up.ajax
    @param {string} [url]
    The URL for the request.
  
    Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.
    @param {string} [request.url]
    You can omit the first string argument and pass the URL as
    a `request` property instead.
    @param {string} [request.method='GET']
    The HTTP method for the request.
    @param {boolean} [request.cache]
    Whether to use a cached response for [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    requests, if available. If set to `false` a network connection will always be attempted.
    @param {Object} [request.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
    @param {Object|FormData|string|Array} [options.params]
    [Parameters](/up.Params) that should be sent as the request's payload.
  
    On IE 11 and Edge, `FormData` payloads require a [polyfill for `FormData#entries()`](https://github.com/jimmywarting/FormData).
    @param {string} [request.timeout]
    A timeout in milliseconds for the request.
  
    If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set, the timeout
    will not include the time spent waiting in the queue.
    @return {Promise<string>}
    A promise for the response text.
    @deprecated
    Use [`up.request()`](/up.request) instead.
    */
    /***
    Makes the proxy assume that `newRequest` has the same response as the
    already cached `oldRequest`.
  
    Unpoly uses this internally when the user redirects from `/old` to `/new`.
    In that case, both `/old` and `/new` will cache the same response from `/new`.
  
    @function up.proxy.alias
    @param {Object} oldRequest
    @param {Object} newRequest
    @experimental
    */
    /***
    Removes all cache entries.
  
    Unpoly also automatically clears the cache whenever it processes
    a request with an [unsafe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    HTTP method like `POST`.
  
    @function up.proxy.clear
    @stable
    */
    /***
    @property up.proxy.config
    @param {number} [config.preloadDelay=75]
      The number of milliseconds to wait before [`[up-preload]`](/a-up-preload)
      starts preloading.
    @param {number} [config.cacheSize=70]
      The maximum number of responses to cache.
      If the size is exceeded, the oldest items will be dropped from the cache.
    @param {number} [config.cacheExpiry=300000]
      The number of milliseconds until a cache entry expires.
      Defaults to 5 minutes.
    @param {number} [config.slowDelay=300]
      How long the proxy waits until emitting the [`up:proxy:slow` event](/up:proxy:slow).
      Use this to prevent flickering of spinners.
    @param {number} [config.maxRequests=4]
      The maximum number of concurrent requests to allow before additional
      requests are queued. This currently ignores preloading requests.
  
      You might find it useful to set this to `1` in full-stack integration
      tests (e.g. Selenium).
  
      Note that your browser might [impose its own request limit](http://www.browserscope.org/?category=network)
      regardless of what you configure here.
    @param {Array<string>} [config.wrapMethods]
      An array of uppercase HTTP method names. AJAX requests with one of these methods
      will be converted into a `POST` request and carry their original method as a `_method`
      parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).
    @param {Array<string>} [config.safeMethods]
      An array of uppercase HTTP method names that are considered [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1).
      The proxy cache will only cache safe requests and will clear the entire
      cache after an unsafe request.
    @stable
    */
    /***
    Returns `true` if the proxy is currently waiting
    for a request to finish. Returns `false` otherwise.
  
    @function up.proxy.isBusy
    @return {boolean}
    Whether the proxy is busy
    @experimental
    */
    /***
    Returns `true` if the proxy is not currently waiting
    for a request to finish. Returns `false` otherwise.
  
    @function up.proxy.isIdle
    @return {boolean}
      Whether the proxy is idle
    @experimental
    */
    /***
    This event is [emitted](/up.emit) before a link is [preloaded](/up.preload).
  
    @event up:link:preload
    @param {Element} event.target
      The link element that will be preloaded.
    @param event.preventDefault()
      Event listeners may call this method to prevent the link from being preloaded.
    @stable
    */
    /***
    @internal
    */
    /***
    This event is [emitted](/up.emit) when [AJAX requests](/up.request)
    are taking long to finish.
  
    By default Unpoly will wait 300 ms for an AJAX request to finish
    before emitting `up:proxy:slow`. You can configure this time like this:
  
    up.proxy.config.slowDelay = 150;
  
    Once all responses have been received, an [`up:proxy:recover`](/up:proxy:recover)
    will be emitted.
  
    Note that if additional requests are made while Unpoly is already busy
    waiting, **no** additional `up:proxy:slow` events will be triggered.
  
    \#\#\# Spinners
  
    You can [listen](/up.on) to the `up:proxy:slow`
    and [`up:proxy:recover`](/up:proxy:recover) events to implement a spinner
    that appears during a long-running request,
    and disappears once the response has been received:
  
    <div class="spinner">Please wait!</div>
  
    Here is the JavaScript to make it alive:
  
    up.compiler('.spinner', function(element) {
    show = () => { up.element.show(element) }
    hide = () => { up.element.hide(element) }
  
    hide()
  
    return [
      up.on('up:proxy:slow', show),
      up.on('up:proxy:recover', hide)
    ]
    })
  
    The `up:proxy:slow` event will be emitted after a delay of 300 ms
    to prevent the spinner from flickering on and off.
    You can change (or remove) this delay by [configuring `up.proxy`](/up.proxy.config) like this:
  
    up.proxy.config.slowDelay = 150;
  
    @event up:proxy:slow
    @stable
    */
    /***
    This event is [emitted](/up.emit) when [AJAX requests](/up.request)
    have [taken long to finish](/up:proxy:slow), but have finished now.
  
    See [`up:proxy:slow`](/up:proxy:slow) for more documentation on
    how to use this event for implementing a spinner that shows during
    long-running requests.
  
    @event up:proxy:recover
    @stable
    */
    /***
    Makes an AJAX request to the given URL.
  
    \#\#\# Example
  
        up.request('/search', { params: { query: 'sunshine' } }).then(function(response) {
          console.log('The response text is %o', response.text)
        }).catch(function() {
          console.error('The request failed')
        })
  
    \#\#\# Caching
  
    All responses are cached by default. If requesting a URL with a non-`GET` method, the response will
    not be cached and the entire cache will be cleared.
  
    You can configure caching with the [`up.proxy.config`](/up.proxy.config) property.
  
    \#\#\# Events
  
    If a network connection is attempted, the proxy will emit
    a [`up:proxy:load`](/up:proxy:load) event with the `request` as its argument.
    Once the response is received, a [`up:proxy:loaded`](/up:proxy:loaded) event will
    be emitted.
  
    @function up.request
    @param {string} [url]
      The URL for the request.
  
      Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.
    @param {string} [options.url]
      You can omit the first string argument and pass the URL as
      a `request` property instead.
    @param {string} [options.method='GET']
      The HTTP method for the options.
    @param {boolean} [options.cache]
      Whether to use a cached response for [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
      requests, if available. If set to `false` a network connection will always be attempted.
    @param {Object} [options.headers={}]
      An object of additional HTTP headers.
    @param {Object|FormData|string|Array} [options.params={}]
      [Parameters](/up.Params) that should be sent as the request's payload.
    @param {string} [options.timeout]
      A timeout in milliseconds.
  
      If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set, the timeout
      will not include the time spent waiting in the queue.
    @param {string} [options.target='body']
      The CSS selector that will be sent as an [`X-Up-Target` header](/up.protocol#optimizing-responses).
    @param {string} [options.failTarget='body']
      The CSS selector that will be sent as an [`X-Up-Fail-Target` header](/up.protocol#optimizing-responses).
    @return {Promise<up.Response>}
      A promise for the response.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when the response to an
    [AJAX request](/up.request) has been received.
  
    Note that this event will also be emitted when the server signals an
    error with an HTTP status like `500`. Only if the request
    encounters a fatal error (like a loss of network connectivity),
    [`up:proxy:fatal`](/up:proxy:fatal) is emitted instead.
  
    @event up:proxy:loaded
    @param {up.Request} event.request
    @param {up.Response} event.response
    @experimental
    */
    /***
    This event is [emitted](/up.emit) when an [AJAX request](/up.request)
    encounters fatal error like a timeout or loss of network connectivity.
  
    Note that this event will *not* be emitted when the server produces an
    error message with an HTTP status like `500`. When the server can produce
    any response, [`up:proxy:loaded`](/up:proxy:loaded) is emitted instead.
  
    @event up:proxy:fatal
    */
    /***
    Preloads the given link.
  
    When the link is clicked later, the response will already be cached,
    making the interaction feel instant.
  
    @function up.proxy.preload
    @param {string|Element|jQuery} linkOrSelector
      The element whose destination should be preloaded.
    @param {Object} options
      Options that will be passed to the function making the HTTP requests.
    @return
      A promise that will be fulfilled when the request was loaded and cached
    @experimental
    */
    /***
    This event is [emitted](/up.emit) before an [AJAX request](/up.request)
    is sent over the network.
  
    @event up:proxy:load
    @param {up.Request} event.request
    @param event.preventDefault()
      Event listeners may call this method to prevent the request from being sent.
    @experimental
    */
    /***
    Manually removes the given request from the cache.
  
    You can also [configure](/up.proxy.config) when the proxy
    automatically removes cache entries.
  
    @function up.proxy.remove
    @param {string} request.url
    @param {string} [request.method='GET']
    @param {string} [request.target='body']
    @experimental
    */
    /***
    Manually stores a promise for the response to the given request.
  
    @function up.proxy.set
    @param {string} request.url
    @param {string} [request.method='GET']
    @param {string} [request.target='body']
    @param {Promise<up.Response>} response
      A promise for the response.
    @experimental
    */
    /***
    @internal
    */
    var ajax, alias, cache, cancelPreloadDelay, cancelSlowDelay, clear, config, e, get, isBusy, isIdle, isSafeMethod, load, loadEnded, loadOrQueue, loadStarted, makeRequest, pendingCount, pokeQueue, preload, preloadAfterDelay, preloadDelayTimer, queue, queuedLoaders, registerAliasForRedirect, remove, reset, responseReceived, set, slowDelayTimer, slowEventEmitted, startPreloadDelay, stopPreload, u, waitingLink, wrapMethod;
    u = up.util;
    e = up.element;
    waitingLink = void 0;
    preloadDelayTimer = void 0;
    slowDelayTimer = void 0;
    pendingCount = void 0;
    slowEventEmitted = void 0;
    queuedLoaders = [];
    config = new up.Config({
        slowDelay: 300,
        preloadDelay: 75,
        cacheSize: 70,
        cacheExpiry: 1000 * 60 * 5,
        maxRequests: 4,
        wrapMethods: ['PATCH', 'PUT', 'DELETE'],
        safeMethods: ['GET', 'OPTIONS', 'HEAD']
    });
    cache = new up.Cache({
        size: function () {
            return config.cacheSize;
        },
        expiry: function () {
            return config.cacheExpiry;
        },
        key: function (request) {
            return up.Request.wrap(request).cacheKey();
        },
        cachable: function (request) {
            return up.Request.wrap(request).isCachable();
        }
    });
    // logPrefix: 'up.proxy'
    /***
    Returns a cached response for the given request.
  
    Returns `undefined` if the given request is not currently cached.
  
    @function up.proxy.get
    @return {Promise<up.Response>}
    A promise for the response.
    @experimental
    */
    get = function (request) {
        var candidate, candidates, i, len, requestForBody, requestForHtml, response;
        request = up.Request.wrap(request);
        candidates = [request];
        if (request.target !== 'html') {
            // Since <html> is the root tag, a request for the `html` selector
            // will contain all other selectors.
            requestForHtml = request.variant({
                target: 'html'
            });
            candidates.push(requestForHtml);
            // Although <body> is not the root tag, we consider it the selector developers
            // will use when they want to replace the entire page. Hence we consider it
            // a suitable match for all other selectors, including `html`.
            if (request.target !== 'body') {
                requestForBody = request.variant({
                    target: 'body'
                });
                candidates.push(requestForBody);
            }
        }
        for (i = 0, len = candidates.length; i < len; i++) {
            candidate = candidates[i];
            if (response = cache.get(candidate)) {
                return response;
            }
        }
    };
    cancelPreloadDelay = function () {
        clearTimeout(preloadDelayTimer);
        return preloadDelayTimer = null;
    };
    cancelSlowDelay = function () {
        clearTimeout(slowDelayTimer);
        return slowDelayTimer = null;
    };
    reset = function () {
        waitingLink = null;
        cancelPreloadDelay();
        cancelSlowDelay();
        pendingCount = 0;
        config.reset();
        cache.clear();
        slowEventEmitted = false;
        return queuedLoaders = [];
    };
    reset();
    makeRequest = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var ignoreCache, promise, request, requestOrOptions, url;
        if (u.isString(args[0])) {
            url = args.shift();
        }
        // We cannot use u.extractOptions() since sometimes the last argument
        // is an up.Request instead of a basic object.
        requestOrOptions = args.shift() || {};
        if (url) {
            requestOrOptions.url = url;
        }
        request = up.Request.wrap(requestOrOptions);
        if (!request.isSafe()) {
            // We clear the entire cache before an unsafe request, since we
            // assume the user is writing a change.
            clear();
        }
        ignoreCache = request.cache === false;
        if (!ignoreCache && (promise = get(request))) {
            up.puts('Re-using cached response for %s %s', request.method, request.url);
        }
        else {
            // If no existing promise is available, we make a network request.
            promise = loadOrQueue(request);
            set(request, promise);
            // Uncache failed requests
            promise.catch(function () {
                return remove(request);
            });
        }
        if (!request.preload) {
            // This might actually make `pendingCount` higher than the actual
            // number of outstanding requests. However, we need to cover the
            // following case:
            // - User starts preloading a request.
            //   This triggers *no* `up:proxy:slow`.
            // - User starts loading the request (without preloading).
            //   This triggers `up:proxy:slow`.
            // - The request finishes.
            //   This triggers `up:proxy:recover`.
            loadStarted();
            u.always(promise, loadEnded);
        }
        return promise;
    };
    ajax = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        up.legacy.warn('up.ajax() has been deprecated. Use up.request() instead.');
        return new Promise(function (resolve, reject) {
            var pickResponseText;
            pickResponseText = function (response) {
                return resolve(response.text);
            };
            return makeRequest.apply(void 0, args).then(pickResponseText, reject);
        });
    };
    isIdle = function () {
        return pendingCount === 0;
    };
    isBusy = function () {
        return pendingCount > 0;
    };
    loadStarted = function () {
        var emission;
        pendingCount += 1;
        if (!slowDelayTimer) {
            // Since the emission of up:proxy:slow might be delayed by config.slowDelay,
            // we wrap the mission in a function for scheduling below.
            emission = function () {
                if (isBusy()) { // a fast response might have beaten the delay
                    up.emit('up:proxy:slow', {
                        log: 'Proxy is slow to respond'
                    });
                    return slowEventEmitted = true;
                }
            };
            return slowDelayTimer = u.timer(config.slowDelay, emission);
        }
    };
    loadEnded = function () {
        pendingCount -= 1;
        if (isIdle()) {
            cancelSlowDelay();
            if (slowEventEmitted) {
                up.emit('up:proxy:recover', {
                    log: 'Proxy has recovered from slow response'
                });
                return slowEventEmitted = false;
            }
        }
    };
    loadOrQueue = function (request) {
        if (pendingCount < config.maxRequests) {
            return load(request);
        }
        else {
            return queue(request);
        }
    };
    queue = function (request) {
        var loader;
        up.puts('Queuing request for %s %s', request.method, request.url);
        loader = function () {
            return load(request);
        };
        loader = u.previewable(loader);
        queuedLoaders.push(loader);
        return loader.promise;
    };
    load = function (request) {
        var eventProps, responsePromise;
        eventProps = {
            request: request,
            log: ['Loading %s %s', request.method, request.url]
        };
        if (up.event.nobodyPrevents('up:proxy:load', eventProps)) {
            responsePromise = request.send();
            u.always(responsePromise, responseReceived);
            u.always(responsePromise, pokeQueue);
            return responsePromise;
        }
        else {
            u.microtask(pokeQueue);
            return Promise.reject(new Error('Event up:proxy:load was prevented'));
        }
    };
    registerAliasForRedirect = function (response) {
        var newRequest, request;
        request = response.request;
        if (response.url && request.url !== response.url) {
            newRequest = request.variant({
                method: response.method,
                url: response.url
            });
            return up.proxy.alias(request, newRequest);
        }
    };
    responseReceived = function (response) {
        if (response.isFatalError()) {
            return up.emit('up:proxy:fatal', {
                log: 'Fatal error during request',
                request: response.request,
                response: response
            });
        }
        else {
            if (!response.isError()) {
                registerAliasForRedirect(response);
            }
            return up.emit('up:proxy:loaded', {
                log: ['Server responded with HTTP %d (%d bytes)', response.status, response.text.length],
                request: response.request,
                response: response
            });
        }
    };
    pokeQueue = function () {
        var base;
        if (typeof (base = queuedLoaders.shift()) === "function") {
            base();
        }
        // Don't return the promise from the loader above
        return void 0;
    };
    alias = cache.alias;
    set = cache.set;
    remove = cache.remove;
    clear = cache.clear;
    // up.legacy.renamedEvent('up:proxy:received', 'up:proxy:loaded')
    preloadAfterDelay = function (link) {
        var curriedPreload, delay;
        delay = e.numberAttr(link, 'up-delay') || config.preloadDelay;
        if (link !== waitingLink) {
            waitingLink = link;
            cancelPreloadDelay();
            curriedPreload = function () {
                u.muteRejection(preload(link));
                return waitingLink = null;
            };
            return startPreloadDelay(curriedPreload, delay);
        }
    };
    startPreloadDelay = function (block, delay) {
        return preloadDelayTimer = setTimeout(block, delay);
    };
    stopPreload = function (link) {
        if (link === waitingLink) {
            waitingLink = void 0;
            return cancelPreloadDelay();
        }
    };
    preload = function (linkOrSelector, options) {
        var link, preloadEventAttrs;
        link = e.get(linkOrSelector);
        if (up.link.isSafe(link)) {
            preloadEventAttrs = {
                log: ['Preloading link %o', link],
                target: link
            };
            return up.event.whenEmitted('up:link:preload', preloadEventAttrs).then(function () {
                var variant;
                variant = up.link.followVariantForLink(link);
                return variant.preloadLink(link, options);
            });
        }
        else {
            return Promise.reject(new Error("Won't preload unsafe link"));
        }
    };
    isSafeMethod = function (method) {
        return u.contains(config.safeMethods, method);
    };
    wrapMethod = function (method, params) {
        if (u.contains(config.wrapMethods, method)) {
            params.add(up.protocol.config.methodParam, method);
            method = 'POST';
        }
        return method;
    };
    /***
    Links with an `up-preload` attribute will silently fetch their target
    when the user hovers over the click area, or when the user puts her
    mouse/finger down (before releasing).
  
    When the link is clicked later, the response will already be cached,
    making the interaction feel instant.
  
    @selector a[up-preload]
    @param [up-delay=75]
    The number of milliseconds to wait between hovering
    and preloading. Increasing this will lower the load in your server,
    but will also make the interaction feel less instant.
    @stable
    */
    up.compiler('a[up-preload], [up-href][up-preload]', function (link) {
        if (up.link.isSafe(link)) {
            link.addEventListener('mouseenter', function (event) {
                if (up.link.shouldProcessEvent(event, link)) {
                    return preloadAfterDelay(link);
                }
            });
            return link.addEventListener('mouseleave', function () {
                return stopPreload(link);
            });
        }
    });
    up.on('up:framework:reset', reset);
    return {
        preload: preload,
        ajax: ajax,
        request: makeRequest,
        get: get,
        alias: alias,
        clear: clear,
        remove: remove,
        isIdle: isIdle,
        isBusy: isBusy,
        isSafeMethod: isSafeMethod,
        wrapMethod: wrapMethod,
        config: config
    };
})();
up.ajax = up.proxy.ajax;
up.request = up.proxy.request;


/***/ }),
/* 44 */
/***/ (function(module, exports) {

/***
Linking to fragments
====================

The `up.link` module lets you build links that update fragments instead of entire pages.

\#\#\# Motivation

In a traditional web application, the entire page is destroyed and re-created when the
user follows a link:

![Traditional page flow](/images/tutorial/fragment_flow_vanilla.svg){:width="620" class="picture has_border is_sepia has_padding"}

This makes for an unfriendly experience:

- State changes caused by AJAX updates get lost during the page transition.
- Unsaved form changes get lost during the page transition.
- The JavaScript VM is reset during the page transition.
- If the page layout is composed from multiple srollable containers
  (e.g. a pane view), the scroll positions get lost during the page transition.
- The user sees a "flash" as the browser loads and renders the new page,
  even if large portions of the old and new page are the same (navigation, layout, etc.).

Unpoly fixes this by letting you annotate links with an [`up-target`](/a-up-target)
attribute. The value of this attribute is a CSS selector that indicates which page
fragment to update. The server **still renders full HTML pages**, but we only use
the targeted fragments and discard the rest:

![Unpoly page flow](/images/tutorial/fragment_flow_unpoly.svg){:width="620" class="picture has_border is_sepia has_padding"}

With this model, following links feels smooth. All transient DOM changes outside the updated fragment are preserved.
Pages also load much faster since the DOM, CSS and Javascript environments do not need to be
destroyed and recreated for every request.

\#\#\# Example

Let's say we are rendering three pages with a tabbed navigation to switch between screens:

Your HTML could look like this:

```
<nav>
  <a href="/pages/a">A</a>
  <a href="/pages/b">B</a>
  <a href="/pages/b">C</a>
</nav>

<article>
  Page A
</article>
```

Since we only want to update the `<article>` tag, we annotate the links
with an `up-target` attribute:

```
<nav>
  <a href="/pages/a" up-target="article">A</a>
  <a href="/pages/b" up-target="article">B</a>
  <a href="/pages/b" up-target="article">C</a>
</nav>
```

Note that instead of `article` you can use any other CSS selector like `#main .article`.

With these [`up-target`](/a-up-target) annotations Unpoly only updates the targeted part of the screen.
The JavaScript environment will persist and the user will not see a white flash while the
new page is loading.

@module up.link
*/
up.link = (function () {
    /***
    [Follows](/up.follow) this link with JavaScript and replaces a CSS selector
    on the current page with a corresponding element from the response.
  
    \#\#\# Example
  
    This will update the fragment `<div class="main">` with the same element
    fetched from `/posts/5`:
  
    <a href="/posts/5" up-target=".main">Read post</a>
  
    \#\#\# Updating multiple fragments
  
    You can update multiple fragments from a single request by separating
    separators with a comma (like in CSS).
  
    For instance, if opening a post should
    also update a bubble showing the number of unread posts, you might
    do this:
  
    <a href="/posts/5" up-target=".main, .unread-count">Read post</a>
  
    \#\#\# Appending or prepending content
  
    By default Unpoly will replace the given selector with the same
    selector from the server response. Instead of replacing you
    can *append* the loaded content to the existing content by using the
    `:after` pseudo selector. In the same fashion, you can use `:before`
    to indicate that you would like the *prepend* the loaded content.
  
    A practical example would be a paginated list of items. Below the list is
    a button to load the next page. You can append to the existing list
    by using `:after` in the `up-target` selector like this:
  
    <ul class="tasks">
      <li>Wash car</li>
      <li>Purchase supplies</li>
      <li>Fix tent</li>
    </ul>
  
    <a href="/page/2" class="next-page" up-target=".tasks:after, .next-page">
      Load more tasks
    </a>
  
    \#\#\# Following elements that are no links
  
    You can also use `[up-target]` to turn an arbitrary element into a link.
    In this case, put the link's destination into the `[up-href]` attribute:
  
    <button up-target=".main" up-href="/foo/bar">Go</button>
  
    Note that using any element other than `<a>` will prevent users from
    opening the destination in a new tab.
  
    @selector a[up-target]
    @param {string} up-target
    The CSS selector to replace
  
    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [up-method='get']
    The HTTP method to use for the request.
    @param {string} [up-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements.
    @param [up-fail-target='body']
    The CSS selector to replace if the server responds with an error.
  
    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [up-fail-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements
    when the server responds with an error.
    @param {string} [up-fallback]
    The selector to update when the original target was not found in the page.
    @param {string} [up-href]
    The destination URL to follow.
    If omitted, the the link's `href` attribute will be used.
    @param {string} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the link is followed.
    @param {string} [up-reveal='true']
    Whether to reveal the target element after it was replaced.
  
    You can also pass a CSS selector for the element to reveal.
    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [up-fail-reveal='true']
    Whether to reveal the target element when the server responds with an error.
  
    You can also pass a CSS selector for the element to reveal.
    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [up-restore-scroll='false']
    Whether to restore previously known scroll position of all viewports
    within the target selector.
    @param {string} [up-cache]
    Whether to force the use of a cached response (`true`)
    or never use the cache (`false`)
    or make an educated guess (default).
    @param {string} [up-layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `'auto'`, `'page'`, `'modal'` and `'popup'`.
  
    If set to `'auto'` (default), Unpoly will try to find a match in the link's layer.
    If no match was found in that layer,
    Unpoly will search in other layers, starting from the topmost layer.
    @param {string} [up-fail-layer='auto']
    The name of the layer that ought to be updated if the server sends a
    non-200 status code.
    @param [up-history]
    Whether to push an entry to the browser history when following the link.
  
    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
    @stable
    */
    /***
    Registers the given handler for links with the given selector.
  
    This does more than a simple `click` handler:
  
    - It also handles `[up-instant]`
    - It also handles `[up-href]`
  
    @function up.link.addFollowVariant
    @param {string} simplifiedSelector
      A selector without `a` or `[up-href]`, e.g. `[up-target]`
    @param {Function(element, options)} options.follow
    @param {Function(element, options)} options.preload
    @internal
    */
    /***
    No-op that is called when we allow a browser's default action to go through,
    so we can spy on it in unit tests. See `link_spec.js`.
  
    @function allowDefault
    @internal
    */
    /***
    This event is [emitted](/up.emit) when a link is [followed](/up.follow) through Unpoly.
  
    The event is emitted on the `<a>` element that is being followed.
  
    @event up:link:follow
    @param {Element} event.target
    The link element that will be followed.
    @param event.preventDefault()
    Event listeners may call this method to prevent the link from being followed.
    @stable
    */
    /***
    @function defaultFollow
    @internal
    */
    /***
    Fetches the given link's `[href]` with JavaScript and [replaces](/up.replace) the current page with HTML from the response.
  
    By default the page's `<body>` element will be replaced.
    If the link has an attribute like `a[up-target]`
    or `a[up-modal]`, the respective Unpoly behavior will be used.
  
    Emits the event `up:link:follow`.
  
    \#\#\# Examples
  
    Assume we have a link with an `a[up-target]` attribute:
  
    <a href="/users" up-target=".main">Users</a>
  
    Calling `up.follow()` with this link will replace the page's `.main` fragment
    as if the user had clicked on the link:
  
    var link = document.querySelector('a')
    up.follow(link)
  
    @function up.follow
    @param {Element|jQuery|string} linkOrSelector
    An element or selector which is either an `<a>` tag or any element with an `[up-href]` attribute.
    @param {string} [options.target]
    The selector to replace.
  
    Defaults to the link's `[up-target]`, `[up-modal]` or `[up-popup]` attribute.
    If no target is given, the `<body>` element will be replaced.
    @param {String} [options.url]
    The URL to navigate to.
  
    Defaults to the link's `[up-href]` or `[href]` attribute.
    @param {boolean|string} [options.reveal=true]
    Whether to [reveal](/up.reveal) the target fragment after it was replaced.
  
    You can also pass a CSS selector for the element to reveal.
    @param {boolean|string} [options.failReveal=true]
    Whether to [reveal](/up.reveal) the target fragment when the server responds with an error.
  
    You can also pass a CSS selector for the element to reveal.
    @return {Promise}
    A promise that will be fulfilled when the link destination
    has been loaded and rendered.
    @stable
    */
    /***
    Returns the HTTP method that should be used when following the given link.
  
    Looks at the link's `up-method` or `data-method` attribute.
    Defaults to `"get"`.
  
    @function up.link.followMethod
    @param link
    @param options.method {string}
    @internal
    */
    /***
    Returns the handler function that can be used to follow the given link.
    E.g. it wil return a handler calling `up.modal.follow` if the link is a `[up-modal]`,
    but a handler calling `up.link.follow` if the links is `[up-target]`.
  
    @param {Element} link
    @return {Object}
    @internal
    */
    /***
    Returns whether the given link will be [followed](/up.follow) by Unpoly
    instead of making a full page load.
  
    A link will be followed by Unpoly if it has an attribute
    like `a[up-target]` or `a[up-modal]`.
  
    @function up.link.isFollowable
    @param {Element|jQuery|string} linkOrSelector
    The link to check.
    @experimental
    */
    /***
    Returns whether the given link has a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    HTTP method like `GET`.
  
    @function up.link.isSafe
    @experimental
    */
    /***
    Makes sure that the given link will be [followed](/up.follow)
    by Unpoly instead of making a full page load.
  
    This is done by giving the link an `a[up-follow]` attribute
    unless it already have it an attribute like `a[up-target]` or `a[up-modal]`.
  
    @function up.link.makeFollowable
    @param {Element|jQuery|string} linkOrSelector
    The link to process.
    @experimental
    */
    /***
    Fetches this given URL with JavaScript and [replaces](/up.replace) the
    current `<body>` element with the response's `<body>` element.
  
    \#\#\# Example
  
    This would replace the current page with the response for `/users`:
  
        up.visit('/users')
  
    @function up.visit
    @param {string} url
      The URL to visit.
    @param {string} [options.target='body']
      The selector to replace.
    @param {Object} [options]
      See options for [`up.replace()`](/up.replace)
    @stable
    */
    var DEFAULT_FOLLOW_VARIANT, addFollowVariant, allowDefault, defaultFollow, defaultPreload, e, follow, followMethod, followVariantForLink, followVariants, isFollowable, isSafe, makeFollowable, shouldProcessEvent, u, visit;
    u = up.util;
    e = up.element;
    visit = function (url, options) {
        if (options === void 0) { options = {}; }
        var ref, selector;
        selector = (ref = options.target) != null ? ref : 'body';
        return up.replace(selector, url, options);
    };
    follow = function (linkOrSelector, options) {
        var link, variant;
        link = e.get(linkOrSelector);
        variant = followVariantForLink(link);
        return variant.followLink(link, options);
    };
    defaultFollow = function (link, options) {
        var ref, ref1, ref2, ref3, ref4, target, url;
        options = u.options(options);
        url = (ref = (ref1 = options.url) != null ? ref1 : link.getAttribute('up-href')) != null ? ref : link.getAttribute('href');
        target = (ref2 = options.target) != null ? ref2 : link.getAttribute('up-target');
        if (options.failTarget == null) {
            options.failTarget = link.getAttribute('up-fail-target');
        }
        if (options.fallback == null) {
            options.fallback = link.getAttribute('up-fallback');
        }
        if (options.transition == null) {
            options.transition = e.booleanOrStringAttr(link, 'up-transition');
        }
        if (options.failTransition == null) {
            options.failTransition = e.booleanOrStringAttr(link, 'up-fail-transition');
        }
        if (options.history == null) {
            options.history = e.booleanOrStringAttr(link, 'up-history');
        }
        if (options.reveal == null) {
            options.reveal = (ref3 = e.booleanOrStringAttr(link, 'up-reveal')) != null ? ref3 : true;
        }
        if (options.failReveal == null) {
            options.failReveal = (ref4 = e.booleanOrStringAttr(link, 'up-fail-reveal')) != null ? ref4 : true;
        }
        if (options.cache == null) {
            options.cache = e.booleanAttr(link, 'up-cache');
        }
        if (options.restoreScroll == null) {
            options.restoreScroll = e.booleanAttr(link, 'up-restore-scroll'); // the option may contain an Object, but not the attr
        }
        options.method = followMethod(link, options);
        if (options.origin == null) {
            options.origin = link;
        }
        if (options.layer == null) {
            options.layer = link.getAttribute('up-layer');
        }
        if (options.failLayer == null) {
            options.failLayer = link.getAttribute('up-fail-layer');
        }
        if (options.confirm == null) {
            options.confirm = link.getAttribute('up-confirm');
        }
        if (options.scrollBehavior == null) {
            options.scrollBehavior = link.getAttribute('up-scroll-behavior');
        }
        if (options.scrollSpeed == null) {
            options.scrollSpeed = link.getAttribute('up-scroll-speed');
        }
        options = u.merge(options, up.motion.animateOptions(options, link));
        return up.browser.whenConfirmed(options).then(function () {
            return up.replace(target, url, options);
        });
    };
    defaultPreload = function (link, options) {
        options = u.options(options);
        options.preload = true;
        return defaultFollow(link, options);
    };
    followMethod = function (link, options) {
        if (options === void 0) { options = {}; }
        var rawMethod, ref, ref1, ref2;
        rawMethod = (ref = (ref1 = (ref2 = options.method) != null ? ref2 : link.getAttribute('up-method')) != null ? ref1 : link.getAttribute('data-method')) != null ? ref : 'GET';
        return rawMethod.toUpperCase();
    };
    allowDefault = function (event) { };
    followVariants = [];
    addFollowVariant = function (simplifiedSelector, options) {
        var variant;
        variant = new up.FollowVariant(simplifiedSelector, options);
        followVariants.push(variant);
        variant.registerEvents();
        return variant;
    };
    isFollowable = function (linkOrSelector) {
        linkOrSelector = e.get(linkOrSelector);
        return !!followVariantForLink(linkOrSelector, {
            default: false
        });
    };
    followVariantForLink = function (link, options) {
        if (options === void 0) { options = {}; }
        var variant;
        variant = u.find(followVariants, function (variant) {
            return variant.matchesLink(link);
        });
        if (options.default !== false) {
            variant || (variant = DEFAULT_FOLLOW_VARIANT);
        }
        return variant;
    };
    makeFollowable = function (link) {
        if (!isFollowable(link)) {
            return link.setAttribute('up-follow', '');
        }
    };
    shouldProcessEvent = function (event, link) {
        var betterTarget, betterTargetSelector, target;
        target = event.target;
        if (!u.isUnmodifiedMouseEvent(event)) {
            // We never handle events for the right mouse button, or when Shift/CTRL/Meta is pressed
            return false;
        }
        if (target === link) {
            // If we actually targeted `link`, save ourselves the expensive DOM traversal below
            return true;
        }
        // If user clicked on a child link of $link, or in an <input> within an [up-expand][up-href]
        // we want those other elements handle the click.
        betterTargetSelector = "a, [up-href], " + up.form.fieldSelector();
        betterTarget = e.closest(target, betterTargetSelector);
        return !betterTarget || betterTarget === link;
    };
    isSafe = function (selectorOrLink, options) {
        var method;
        method = followMethod(selectorOrLink, options);
        return up.proxy.isSafeMethod(method);
    };
    DEFAULT_FOLLOW_VARIANT = addFollowVariant('[up-target], [up-follow]', {
        // Don't just pass the `defaultFollow` function reference so we can stub it in tests
        follow: function (link, options) {
            return defaultFollow(link, options);
        },
        preload: function (link, options) {
            return defaultPreload(link, options);
        }
    });
    /***
    Fetches this link's `[href]` with JavaScript and [replaces](/up.replace) the
    current `<body>` element with the response's `<body>` element.
  
    To only update a fragment instead of the entire `<body>`, see `a[up-target]`.
  
    \#\#\# Example
  
    <a href="/users" up-follow>User list</a>
  
    \#\#\# Turn any element into a link
  
    You can also use `[up-follow]` to turn an arbitrary element into a link.
    In this case, put the link's destination into the `up-href` attribute:
  
    <span up-follow up-href="/foo/bar">Go</span>
  
    Note that using any element other than `<a>` will prevent users from
    opening the destination in a new tab.
  
    @selector a[up-follow]
  
    @param {string} [up-method='get']
    The HTTP method to use for the request.
    @param [up-fail-target='body']
    The selector to replace if the server responds with an error.
    @param {string} [up-fallback]
    The selector to update when the original target was not found in the page.
    @param {string} [up-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements.
    @param {string} [up-fail-transition='none']
    The [transition](/up.motion) to use for morphing between the old and new elements
    when the server responds with an error.
    @param [up-href]
    The destination URL to follow.
    If omitted, the the link's `href` attribute will be used.
    @param {string} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the link is followed.
    @param {string} [up-history]
    Whether to push an entry to the browser history when following the link.
  
    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
    @param [up-restore-scroll='false']
    Whether to restore the scroll position of all viewports
    within the response.
    @stable
    */
    /***
    By adding an `up-instant` attribute to a link, the destination will be
    fetched on `mousedown` instead of `click` (`mouseup`).
  
    <a href="/users" up-target=".main" up-instant>User list</a>
  
    This will save precious milliseconds that otherwise spent
    on waiting for the user to release the mouse button. Since an
    AJAX request will be triggered right way, the interaction will
    appear faster.
  
    Note that using `[up-instant]` will prevent a user from canceling a
    click by moving the mouse away from the link. However, for
    navigation actions this isn't needed. E.g. popular operation
    systems switch tabs on `mousedown` instead of `click`.
  
    `[up-instant]` will also work for links that open [modals](/up.modal) or [popups](/up.popup).
  
    @selector a[up-instant]
    @stable
    */
    /***
    [Follows](/up.follow) this link *as fast as possible*.
  
    This is done by:
  
    - [Following the link through AJAX](/a-up-target) instead of a full page load
    - [Preloading the link's destination URL](/a-up-preload)
    - [Triggering the link on `mousedown`](/a-up-instant) instead of on `click`
  
    \#\#\# Example
  
    Use `up-dash` like this:
  
    <a href="/users" up-dash=".main">User list</a>
  
    This is shorthand for:
  
    <a href="/users" up-target=".main" up-instant up-preload>User list</a>
  
    @selector a[up-dash]
    @param {string} [up-dash='body']
    The CSS selector to replace
  
    Inside the CSS selector you may refer to this link as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @stable
    */
    up.macro('[up-dash]', function (element) {
        var newAttrs, target;
        target = e.booleanOrStringAttr(element, 'up-dash');
        element.removeAttribute('up-dash');
        newAttrs = {
            'up-preload': '',
            'up-instant': ''
        };
        if (target === true) {
            // If it's literally `true` then we don't have a target selector.
            // Just follow the link by replacing `<body>`.
            makeFollowable(element);
        }
        else {
            newAttrs['up-target'] = target;
        }
        return e.setMissingAttrs(element, newAttrs);
    });
    /***
    Add an `[up-expand]` attribute to any element to enlarge the click area of a
    descendant link.
  
    `[up-expand]` honors all the Unppoly attributes in expanded links, like
    `a[up-target]`, `a[up-instant]` or `a[up-preload]`.
    It also expands links that open [modals](/up.modal) or [popups](/up.popup).
  
    \#\#\# Example
  
    <div class="notification" up-expand>
      Record was saved!
      <a href="/records">Close</a>
    </div>
  
    In the example above, clicking anywhere within `.notification` element
    would [follow](/up.follow) the *Close* link.
  
    \#\#\# Elements with multiple contained links
  
    If a container contains more than one link, you can set the value of the
    `up-expand` attribute to a CSS selector to define which link should be expanded:
  
    <div class="notification" up-expand=".close">
      Record was saved!
      <a class="details" href="/records/5">Details</a>
      <a class="close" href="/records">Close</a>
    </div>
  
    \#\#\# Limitations
  
    `[up-expand]` has some limitations for advanced browser users:
  
    - Users won't be able to right-click the expanded area to open a context menu
    - Users won't be able to `CTRL`+click the expanded area to open a new tab
  
    To overcome these limitations, consider nesting the entire clickable area in an actual `<a>` tag.
    [It's OK to put block elements inside an anchor tag](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).
  
    @selector [up-expand]
    @param {string} [up-expand]
    A CSS selector that defines which containing link should be expanded.
  
    If omitted, the first link in this element will be expanded.
    @stable
    */
    up.macro('[up-expand]', function (area) {
        var attribute, childLink, childLinks, i, len, name, newAttrs, ref, selector, upAttributePattern;
        selector = area.getAttribute('up-expand') || 'a, [up-href]';
        childLinks = e.all(area, selector);
        if (childLink = childLinks[0]) {
            upAttributePattern = /^up-/;
            newAttrs = {};
            newAttrs['up-href'] = childLink.getAttribute('href');
            ref = childLink.attributes;
            for (i = 0, len = ref.length; i < len; i++) {
                attribute = ref[i];
                name = attribute.name;
                if (name.match(upAttributePattern)) {
                    newAttrs[name] = attribute.value;
                }
            }
            e.setMissingAttrs(area, newAttrs);
            area.removeAttribute('up-expand');
            return makeFollowable(area);
        }
    });
    return {
        visit: visit,
        follow: follow,
        makeFollowable: makeFollowable,
        isSafe: isSafe,
        isFollowable: isFollowable,
        shouldProcessEvent: shouldProcessEvent,
        followMethod: followMethod,
        addFollowVariant: addFollowVariant,
        followVariantForLink: followVariantForLink,
        allowDefault: allowDefault
    };
})();
up.visit = up.link.visit;
up.follow = up.link.follow;


/***/ }),
/* 45 */
/***/ (function(module, exports) {

/***
Forms
=====

Unpoly comes with functionality to [submit](/form-up-target) and [validate](/input-up-validate)
forms without leaving the current page. This means you can replace page fragments,
open dialogs with sub-forms, etc. all without losing form state.

@module up.form
*/
up.form = (function () {
    /***
    [Observes](/up.observe) a field or form and submits the form when a value changes.
  
    Both the form and the changed field will be assigned a CSS class [`form-up-active`](/form-up-active)
    while the autosubmitted form is processing.
  
    The unobtrusive variant of this is the [`up-autosubmit`](/form-up-autosubmit) attribute.
  
    @function up.autosubmit
    @param {string|Element|jQuery} selectorOrElement
      The field or form to observe.
    @param {Object} [options]
      See options for [`up.observe()`](/up.observe)
    @return {Function()}
      A destructor function that removes the observe watch when called.
    @stable
    */
    /***
    Sets default options for form submission and validation.
  
    @property up.form.config
    @param {number} [config.observeDelay=0]
      The number of miliseconds to wait before [`up.observe()`](/up.observe) runs the callback
      after the input value changes. Use this to limit how often the callback
      will be invoked for a fast typist.
    @param {Array} [config.validateTargets=['[up-fieldset]:has(&)', 'fieldset:has(&)', 'label:has(&)', 'form:has(&)']]
      An array of CSS selectors that are searched around a form field
      that wants to [validate](/up.validate). The first matching selector
      will be updated with the validation messages from the server.
  
      By default this looks for a `<fieldset>`, `<label>` or `<form>`
      around the validating input field.
    @param {string} [config.fields]
      An array of CSS selectors that represent form fields, such as `input` or `select`.
    @param {string} [config.submitButtons]
      An array of CSS selectors that represent submit buttons, such as `input[type=submit]`.
    @stable
    */
    /***
    @function up.form.fieldSelector
    @internal
    */
    /***
    Returns a list of form fields within the given element.
  
    You can configure what Unpoly considers a form field by adding CSS selectors to the
    [`up.form.config.fields`](/up.form.config#config.fields) array.
  
    If the given element is itself a form field, a list of that given element is returned.
  
    @function up.form.fields
    @param {Element|jQuery} root
    The element to scan for contained form fields.
  
    If the element is itself a form field, a list of that element is returned.
    @return {NodeList<Element>|Array<Element>}
    @experimental
    */
    /***
    @internal
    */
    /***
    This event is [emitted](/up.emit) when a form is [submitted](/up.submit) through Unpoly.
  
    The event is emitted on the`<form>` element.
  
    @event up:form:submit
    @param {Element} event.target
      The `<form>` element that will be submitted.
    @param event.preventDefault()
      Event listeners may call this method to prevent the form from being submitted.
    @stable
    */
    /***
    Observes form fields and runs a callback when a value changes.
  
    This is useful for observing text fields while the user is typing.
  
    The unobtrusive variant of this is the [`[up-observe]`](/up-observe) attribute.
  
    \#\#\# Example
  
    The following would print to the console whenever an input field changes:
  
    up.observe('input.query', function(value) {
    console.log('Query is now %o', value)
    })
  
    Instead of a single form field, you can also pass multiple fields,
    a `<form>` or any container that contains form fields.
    The callback will be run if any of the given fields change:
  
    up.observe('form', function(value, name) {
    console.log('The value of %o is now %o', name, value)
    })
  
    You may also pass the `{ batch: true }` option to receive all
    changes since the last callback in a single object:
  
    up.observe('form', { batch: true }, function(diff) {
    console.log('Observed one or more changes: %o', diff)
    })
  
    @function up.observe
    @param {string|Element|Array<Element>|jQuery} elements
      The form fields that will be observed.
  
      You can pass one or more fields, a `<form>` or any container that contains form fields.
      The callback will be run if any of the given fields change.
    @param {boolean} [options.batch=false]
      If set to `true`, the `onChange` callback will receive multiple
      detected changes in a single diff object as its argument.
    @param {number} [options.delay=up.form.config.observeDelay]
      The number of miliseconds to wait before executing the callback
      after the input value changes. Use this to limit how often the callback
      will be invoked for a fast typist.
    @param {Function(value, name): string} onChange
      The callback to run when the field's value changes.
  
      If given as a function, it receives two arguments (`value`, `name`).
      `value` is a string with the new attribute value and `string` is the name
      of the form field that changed.
  
      If given as a string, it will be evaled as JavaScript code in a context where
      (`value`, `name`) are set.
    @return {Function()}
      A destructor function that removes the observe watch when called.
    @stable
    */
    /***
    Submits a form via AJAX and updates a page fragment with the response.
  
    up.submit('form.new-user', { target: '.main' })
  
    Instead of loading a new page, the form is submitted via AJAX.
    The response is parsed for a CSS selector and the matching elements will
    replace corresponding elements on the current page.
  
    The unobtrusive variant of this is the [`form[up-target]`](/form-up-target) selector.
    See the documentation for [`form[up-target]`](/form-up-target) for more
    information on how AJAX form submissions work in Unpoly.
  
    Emits the event [`up:form:submit`](/up:form:submit).
  
    @function up.submit
    @param {Element|jQuery|string} formOrSelector
    A reference or selector for the form to submit.
    If the argument points to an element that is not a form,
    Unpoly will search its ancestors for the closest form.
    @param {string} [options.url]
    The URL where to submit the form.
    Defaults to the form's `action` attribute, or to the current URL of the browser window.
    @param {string} [options.method='post']
    The HTTP method used for the form submission.
    Defaults to the form's `up-method`, `data-method` or `method` attribute, or to `'post'`
    if none of these attributes are given.
    @param {string} [options.target]
    The CSS selector to update when the form submission succeeds (server responds with status 200).
    Defaults to the form's `up-target` attribute.
  
    Inside the CSS selector you may refer to the form as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [options.failTarget]
    The CSS selector to update when the form submission fails (server responds with non-200 status).
    Defaults to the form's `up-fail-target` attribute, or to an auto-generated
    selector that matches the form itself.
  
    Inside the CSS selector you may refer to the form as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [options.fallback]
    The selector to update when the original target was not found in the page.
    Defaults to the form's `up-fallback` attribute.
    @param {boolean|string} [options.history=true]
    Successful form submissions will add a history entry and change the browser's
    location bar if the form either uses the `GET` method or the response redirected
    to another page (this requires the `unpoly-rails` gem).
    If you want to prevent history changes in any case, set this to `false`.
    If you pass a string, it is used as the URL for the browser history.
    @param {string} [options.transition='none']
    The transition to use when a successful form submission updates the `options.target` selector.
    Defaults to the form's `up-transition` attribute, or to `'none'`.
    @param {string} [options.failTransition='none']
    The transition to use when a failed form submission updates the `options.failTarget` selector.
    Defaults to the form's `up-fail-transition` attribute, or to `options.transition`, or to `'none'`.
    @param {number} [options.duration]
    The duration of the transition. See [`up.morph()`](/up.morph).
    @param {number} [options.delay]
    The delay before the transition starts. See [`up.morph()`](/up.morph).
    @param {string} [options.easing]
    The timing function that controls the transition's acceleration. [`up.morph()`](/up.morph).
    @param {Element|string} [options.reveal=true]
    Whether to reveal the target fragment after it was replaced.
  
    You can also pass a CSS selector for the element to reveal.
    @param {boolean|string} [options.failReveal=true]
    Whether to [reveal](/up.reveal) the target fragment when the server responds with an error.
  
    You can also pass a CSS selector for the element to reveal.
    @param {boolean} [options.restoreScroll]
    If set to `true`, this will attempt to [`restore scroll positions`](/up.restoreScroll)
    previously seen on the destination URL.
    @param {boolean} [options.cache]
    Whether to force the use of a cached response (`true`)
    or never use the cache (`false`)
    or make an educated guess (`undefined`).
  
    By default only responses to `GET` requests are cached
    for a few minutes.
    @param {Object} [options.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
    @param {string} [options.layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `'auto'`, `'page'`, `'modal'` and `'popup'`.
  
    If set to `'auto'` (default), Unpoly will try to find a match in the form's layer.
    @param {string} [options.failLayer='auto']
    The name of the layer that ought to be updated if the server sends a non-200 status code.
    @return {Promise}
    A promise for the successful form submission.
    @stable
    */
    /***
    @function up.form.submitButtonSelector
    @internal
    */
    /***
    @function up.form.submittingButton
    @internal
    */
    /***
    @internal
    */
    /***
    Shows or hides a target selector depending on the value.
  
    See [`input[up-switch]`](/input-up-switch) for more documentation and examples.
  
    This function does not currently have a very useful API outside
    of our use for `up-switch`'s UJS behavior, that's why it's currently
    still marked `@internal`.
  
    @function up.form.switchTargets
    @param {Element} switcher
    @param {string} [options.target]
    The target selectors to switch.
    Defaults to an `[up-switch]` attribute on the given field.
    @internal
    */
    /***
    Performs a server-side validation of a form field.
  
    `up.validate()` submits the given field's form with an additional `X-Up-Validate`
    HTTP header. Upon seeing this header, the server is expected to validate (but not save)
    the form submission and render a new copy of the form with validation errors.
  
    The unobtrusive variant of this is the [`input[up-validate]`](/input-up-validate) selector.
    See the documentation for [`input[up-validate]`](/input-up-validate) for more information
    on how server-side validation works in Unpoly.
  
    \#\#\# Example
  
    up.validate('input[name=email]', { target: '.email-errors' })
  
    @function up.validate
    @param {string|Element|jQuery} fieldOrSelector
  
    @param {string|Element|jQuery} [options.target]
    @return {Promise}
    A promise that is fulfilled when the server-side
    validation is received and the form was updated.
    @stable
    */
    var autosubmit, closestContainer, config, e, fieldSelector, findFields, findSubmissionFields, findSwitcherForTarget, findValidateTarget, observe, observeCallbackFromElement, reset, submit, submitButtonSelector, submittingButton, switchTarget, switchTargets, switcherValues, u, validate;
    u = up.util;
    e = up.element;
    config = new up.Config({
        validateTargets: ['[up-fieldset]:has(&)', 'fieldset:has(&)', 'label:has(&)', 'form:has(&)'],
        fields: ['select', 'input:not([type=submit]):not([type=image])', 'button[type]:not([type=submit])', 'textarea'],
        submitButtons: ['input[type=submit]', 'input[type=image]', 'button[type=submit]', 'button:not([type])'],
        observeDelay: 0
    });
    reset = function () {
        return config.reset();
    };
    fieldSelector = function () {
        return config.fields.join(',');
    };
    findFields = function (root) {
        root = e.get(root);
        return e.subtree(root, fieldSelector());
    };
    //  findFields = (rootOrRoots) ->
    //    rootOrRoots = e.list(rootOrRoots)
    //    u.flatMap rootOrRoots, (root) -> e.subtree(root, fieldSelector())
    /****
    @function up.form.submissionFields
    @internal
    */
    findSubmissionFields = function (root) {
        var button, fields;
        fields = findFields(root);
        if (button = submittingButton(root)) {
            fields = u.toArray(fields);
            fields.push(button);
        }
        return fields;
    };
    submittingButton = function (form) {
        var focusedElement, selector;
        selector = submitButtonSelector();
        focusedElement = document.activeElement;
        if (focusedElement && e.matches(focusedElement, selector) && form.contains(focusedElement)) {
            return focusedElement;
        }
        else {
            // If no button is focused, we assume the first button in the form.
            return e.first(form, selector);
        }
    };
    submitButtonSelector = function () {
        return config.submitButtons.join(',');
    };
    submit = function (formOrSelector, options) {
        var form, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, target, url;
        options = u.options(options);
        form = e.get(formOrSelector);
        form = e.closest(form, 'form');
        target = (ref = (ref1 = options.target) != null ? ref1 : form.getAttribute('up-target')) != null ? ref : 'body';
        if (options.failTarget == null) {
            options.failTarget = (ref2 = form.getAttribute('up-fail-target')) != null ? ref2 : e.toSelector(form);
        }
        if (options.reveal == null) {
            options.reveal = (ref3 = e.booleanOrStringAttr(form, 'up-reveal')) != null ? ref3 : true;
        }
        if (options.failReveal == null) {
            options.failReveal = (ref4 = e.booleanOrStringAttr(form, 'up-fail-reveal')) != null ? ref4 : true;
        }
        if (options.fallback == null) {
            options.fallback = form.getAttribute('up-fallback');
        }
        if (options.history == null) {
            options.history = (ref5 = e.booleanOrStringAttr(form, 'up-history')) != null ? ref5 : true;
        }
        if (options.transition == null) {
            options.transition = e.booleanOrStringAttr(form, 'up-transition');
        }
        if (options.failTransition == null) {
            options.failTransition = e.booleanOrStringAttr(form, 'up-fail-transition');
        }
        if (options.method == null) {
            options.method = u.normalizeMethod((ref6 = (ref7 = (ref8 = form.getAttribute('up-method')) != null ? ref8 : form.getAttribute('data-method')) != null ? ref7 : form.getAttribute('method')) != null ? ref6 : 'post');
        }
        if (options.cache == null) {
            options.cache = e.booleanAttr(form, 'up-cache');
        }
        if (options.restoreScroll == null) {
            options.restoreScroll = e.booleanAttr(form, 'up-restore-scroll'); // the option supports an object value, but not the attr
        }
        if (options.origin == null) {
            options.origin = form;
        }
        if (options.layer == null) {
            options.layer = form.getAttribute('up-layer');
        }
        if (options.failLayer == null) {
            options.failLayer = form.getAttribute('up-fail-layer');
        }
        options.params = up.Params.fromForm(form);
        options = u.merge(options, up.motion.animateOptions(options, form));
        if (options.validate) {
            options.headers || (options.headers = {});
            options.transition = false;
            options.failTransition = false;
            options.headers[up.protocol.config.validateHeader] = options.validate;
        }
        url = (ref9 = (ref10 = options.url) != null ? ref10 : form.getAttribute('action')) != null ? ref9 : up.browser.url();
        if (options.method === 'GET') {
            // Only for GET forms, browsers discard all query params from the form's [action] URL.
            // The URLs search part will be replaced with the serialized form data.
            // See design/query-params-in-form-actions/cases.html for
            // a demo of vanilla browser behavior.
            url = up.Params.stripURL(url);
        }
        return up.event.whenEmitted('up:form:submit', {
            log: 'Submitting form',
            target: form
        }).then(function () {
            var promise;
            up.feedback.start(form);
            // If we can't update the location URL, fall back to a vanilla form submission.
            if (!(up.browser.canPushState() || options.history === false)) {
                // Don't use up.browser.navigate(); It cannot deal with file inputs.
                form.submit();
                return u.unresolvablePromise();
            }
            promise = up.replace(target, url, options);
            u.always(promise, function () {
                return up.feedback.stop(form);
            });
            return promise;
        });
    };
    observe = function (elements) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var callback, fields, observer, options, ref, ref1, ref2, ref3;
        elements = e.list(elements);
        fields = u.flatMap(elements, findFields);
        callback = (ref = (ref1 = u.extractCallback(args)) != null ? ref1 : observeCallbackFromElement(elements[0])) != null ? ref : up.fail('up.observe: No change callback given');
        options = u.extractOptions(args);
        options.delay = (ref2 = (ref3 = options.delay) != null ? ref3 : e.numberAttr(elements[0], 'up-delay')) != null ? ref2 : config.observeDelay;
        observer = new up.FieldObserver(fields, options, callback);
        observer.start();
        return observer.stop;
    };
    observeCallbackFromElement = function (element) {
        var rawCallback;
        if (rawCallback = element.getAttribute('up-observe')) {
            return new Function('value', 'name', rawCallback);
        }
    };
    autosubmit = function (selectorOrElement, options) {
        return observe(selectorOrElement, options, function () {
            return submit(selectorOrElement);
        });
    };
    findValidateTarget = function (field, options) {
        var option, ref;
        option = (ref = options.target) != null ? ref : field.getAttribute('up-validate');
        option || (option = u.findResult(config.validateTargets, function (defaultTarget) {
            var resolvedDefault;
            resolvedDefault = e.resolveSelector(defaultTarget, options.origin);
            if (e.first(resolvedDefault)) {
                // We want to return the selector, *not* the element. If we returned the element
                // and derive a selector from that, any :has() expression would be lost.
                return resolvedDefault;
            }
        }));
        if (!option) {
            up.fail('Could not find validation target for %o (tried defaults %o)', field, config.validateTargets);
        }
        // resolveSelector() also creates a selector string if given an element
        return e.resolveSelector(option, options.origin);
    };
    validate = function (fieldOrSelector, options) {
        var field, promise, ref;
        field = e.get(fieldOrSelector);
        options = u.options(options);
        options.origin = field;
        options.target = findValidateTarget(field, options);
        options.failTarget = options.target;
        if (options.reveal == null) {
            options.reveal = (ref = e.booleanOrStringAttr(field, 'up-reveal')) != null ? ref : false;
        }
        options.history = false;
        // Make sure the X-Up-Validate header is present, so the server-side
        // knows that it should not persist the form submission
        options.validate = field.getAttribute('name') || ':none';
        options = u.merge(options, up.motion.animateOptions(options, field));
        promise = up.submit(field, options);
        return promise;
    };
    switcherValues = function (field) {
        var checkedButton, form, groupName, meta, value, values;
        value = void 0;
        meta = void 0;
        if (e.matches(field, 'input[type=checkbox]')) {
            if (field.checked) {
                value = field.value;
                meta = ':checked';
            }
            else {
                meta = ':unchecked';
            }
        }
        else if (e.matches(field, 'input[type=radio]')) {
            form = closestContainer(field);
            groupName = field.getAttribute('name');
            checkedButton = form.querySelector("input[type=radio]" + e.attributeSelector('name', groupName) + ":checked");
            if (checkedButton) {
                meta = ':checked';
                value = checkedButton.value;
            }
            else {
                meta = ':unchecked';
            }
        }
        else {
            value = field.value;
        }
        values = [];
        if (u.isPresent(value)) {
            values.push(value);
            values.push(':present');
        }
        else {
            values.push(':blank');
        }
        if (u.isPresent(meta)) {
            values.push(meta);
        }
        return values;
    };
    switchTargets = function (switcher, options) {
        if (options === void 0) { options = {}; }
        var fieldValues, form, ref, targetSelector;
        targetSelector = (ref = options.target) != null ? ref : switcher.getAttribute('up-switch');
        form = closestContainer(switcher);
        u.isPresent(targetSelector) || up.fail("No switch target given for %o", switcher);
        fieldValues = switcherValues(switcher);
        return u.each(e.all(form, targetSelector), function (target) {
            return switchTarget(target, fieldValues);
        });
    };
    switchTarget = function (target, fieldValues) {
        var hideValues, show, showValues;
        fieldValues || (fieldValues = switcherValues(findSwitcherForTarget(target)));
        if (hideValues = target.getAttribute('up-hide-for')) {
            hideValues = u.splitValues(hideValues);
            show = u.intersect(fieldValues, hideValues).length === 0;
        }
        else {
            if (showValues = target.getAttribute('up-show-for')) {
                showValues = u.splitValues(showValues);
            }
            else {
                // If the target has neither up-show-for or up-hide-for attributes,
                // assume the user wants the target to be visible whenever anything
                // is checked or entered.
                showValues = [':present', ':checked'];
            }
            show = u.intersect(fieldValues, showValues).length > 0;
        }
        e.toggle(target, show);
        return target.classList.add('up-switched');
    };
    findSwitcherForTarget = function (target) {
        var form, switcher, switchers;
        form = closestContainer(target);
        switchers = e.all(form, '[up-switch]');
        switcher = u.find(switchers, function (switcher) {
            var targetSelector;
            targetSelector = switcher.getAttribute('up-switch');
            return e.matches(target, targetSelector);
        });
        return switcher || u.fail('Could not find [up-switch] field for %o', target);
    };
    closestContainer = function (element) {
        return e.closest(element, 'form, body');
    };
    /***
    Forms with an `up-target` attribute are [submitted via AJAX](/up.submit)
    instead of triggering a full page reload.
  
    <form method="post" action="/users" up-target=".main">
      ...
    </form>
  
    The server response is searched for the selector given in `up-target`.
    The selector content is then [replaced](/up.replace) in the current page.
  
    The programmatic variant of this is the [`up.submit()`](/up.submit) function.
  
    \#\#\# Failed submission
  
    When the server was unable to save the form due to invalid params,
    it will usually re-render an updated copy of the form with
    validation messages.
  
    For Unpoly to be able to detect a failed form submission,
    the form must be re-rendered with a non-200 HTTP status code.
    We recommend to use either 400 (bad request) or
    422 (unprocessable entity).
  
    In Ruby on Rails, you can pass a
    [`:status` option to `render`](http://guides.rubyonrails.org/layouts_and_rendering.html#the-status-option)
    for this:
  
    class UsersController < ApplicationController
  
      def create
        user_params = params[:user].permit(:email, :password)
        @user = User.new(user_params)
        if @user.save?
          sign_in @user
        else
          render 'form', status: :bad_request
        end
      end
  
    end
  
    Note that you can also use
    [`input[up-validate]`](/input-up-validate) to perform server-side
    validations while the user is completing fields.
  
    \#\#\# Redirects
  
    Unpoly requires an additional response headers to detect redirects,
    which are otherwise undetectable for an AJAX client.
  
    After the form's action performs a redirect, the next response should echo
    the new request's URL as a response header `X-Up-Location`.
  
    If you are using Unpoly via the `unpoly-rails` gem, these headers
    are set automatically for every request.
  
    \#\#\# Giving feedback while the form is processing
  
    The `<form>` element will be assigned a CSS class [`up-active`](/form.up-active) while
    the submission is loading.
  
    You can also [implement a spinner](/up.proxy/#spinners)
    by [listening](/up.on) to the [`up:proxy:slow`](/up:proxy:slow)
    and [`up:proxy:recover`](/up:proxy:recover) events.
  
    @selector form[up-target]
    @param {string} up-target
    The CSS selector to [replace](/up.replace) if the form submission is successful (200 status code).
  
    Inside the CSS selector you may refer to this form as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [up-fail-target]
    The CSS selector to [replace](/up.replace) if the form submission is not successful (non-200 status code).
  
    Inside the CSS selector you may refer to this form as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
  
    If omitted, Unpoly will replace the `<form>` tag itself, assuming that the server has echoed the form with validation errors.
    @param [up-fallback]
    The selector to replace if the server responds with an error.
    @param {string} [up-transition]
    The animation to use when the form is replaced after a successful submission.
    @param {string} [up-fail-transition]
    The animation to use when the form is replaced after a failed submission.
    @param [up-history]
    Whether to push a browser history entry after a successful form submission.
  
    By default the form's target URL is used. If the form redirects to another URL,
    the redirect target will be used.
  
    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
    @param {string} [up-method]
    The HTTP method to be used to submit the form (`get`, `post`, `put`, `delete`, `patch`).
    Alternately you can use an attribute `data-method`
    ([Rails UJS](https://github.com/rails/jquery-ujs/wiki/Unobtrusive-scripting-support-for-jQuery))
    or `method` (vanilla HTML) for the same purpose.
    @param {string} [up-layer='auto']
    The name of the layer that ought to be updated. Valid values are
    `'auto'`, `'page'`, `'modal'` and `'popup'`.
  
    If set to `'auto'` (default), Unpoly will try to find a match in the form's layer.
    If no match was found in that layer,
    Unpoly will search in other layers, starting from the topmost layer.
    @param {string} [up-fail-layer='auto']
    The name of the layer that ought to be updated if the server sends a
    non-200 status code.
    @param {string} [up-reveal='true']
    Whether to reveal the target element after it was replaced.
  
    You can also pass a CSS selector for the element to reveal.
    Inside the CSS selector you may refer to the form as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [up-fail-reveal='true']
    Whether to reveal the target element when the server responds with an error.
  
    You can also pass a CSS selector for the element to reveal. You may use this, for example,
    to reveal the first validation error message:
  
      <form up-target=".content" up-fail-reveal=".error">
        ...
      </form>
  
    Inside the CSS selector you may refer to the form as `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @param {string} [up-restore-scroll='false']
    Whether to restore previously known scroll position of all viewports
    within the target selector.
    @param {string} [up-cache]
    Whether to force the use of a cached response (`true`)
    or never use the cache (`false`)
    or make an educated guess (`undefined`).
  
    By default only responses to `GET` requests are cached for a few minutes.
    @stable
    */
    up.on('submit', 'form[up-target]', function (event, form) {
        up.event.consumeAction(event);
        return u.muteRejection(submit(form));
    });
    /***
    When a form field with this attribute is changed, the form is validated on the server
    and is updated with validation messages.
  
    To validate the form, Unpoly will submit the form with an additional `X-Up-Validate` HTTP header.
    When seeing this header, the server is expected to validate (but not save)
    the form submission and render a new copy of the form with validation errors.
  
    The programmatic variant of this is the [`up.validate()`](/up.validate) function.
  
    \#\#\# Example
  
    Let's look at a standard registration form that asks for an e-mail and password:
  
    <form action="/users">
  
      <label>
        E-mail: <input type="text" name="email" />
      </label>
  
      <label>
        Password: <input type="password" name="password" />
      </label>
  
      <button type="submit">Register</button>
  
    </form>
  
    When the user changes the `email` field, we want to validate that
    the e-mail address is valid and still available. Also we want to
    change the `password` field for the minimum required password length.
    We can do this by giving both fields an `up-validate` attribute:
  
    <form action="/users">
  
      <label>
        E-mail: <input type="text" name="email" up-validate />
      </label>
  
      <label>
        Password: <input type="password" name="password" up-validate />
      </label>
  
      <button type="submit">Register</button>
  
    </form>
  
    Whenever a field with `up-validate` changes, the form is POSTed to
    `/users` with an additional `X-Up-Validate` HTTP header.
    When seeing this header, the server is expected to validate (but not save)
    the form submission and render a new copy of the form with validation errors.
  
    In Ruby on Rails the processing action should behave like this:
  
    class UsersController < ApplicationController
  
     * This action handles POST /users
      def create
        user_params = params[:user].permit(:email, :password)
        @user = User.new(user_params)
        if request.headers['X-Up-Validate']
          @user.valid?  # run validations, but don't save to the database
          render 'form' # render form with error messages
        elsif @user.save?
          sign_in @user
        else
          render 'form', status: :bad_request
        end
      end
  
    end
  
    Note that if you're using the `unpoly-rails` gem you can simply say `up.validate?`
    instead of manually checking for `request.headers['X-Up-Validate']`.
  
    The server now renders an updated copy of the form with eventual validation errors:
  
    <form action="/users">
  
      <label class="has-error">
        E-mail: <input type="text" name="email" value="foo@bar.com" />
        Has already been taken!
      </label>
  
      <button type="submit">Register</button>
  
    </form>
  
    The `<label>` around the e-mail field is now updated to have the `has-error`
    class and display the validation message.
  
    \#\#\# How validation results are displayed
  
    Although the server will usually respond to a validation with a complete,
    fresh copy of the form, Unpoly will by default not update the entire form.
    This is done in order to preserve volatile state such as the scroll position
    of `<textarea>` elements.
  
    By default Unpoly looks for a `<fieldset>`, `<label>` or `<form>`
    around the validating input field, or any element with an
    `up-fieldset` attribute.
    With the Bootstrap bindings, Unpoly will also look
    for a container with the `form-group` class.
  
    You can change this default behavior by setting [`up.form.config.validateTargets`](/up.form.config#config.validateTargets):
  
    // Always update the entire form containing the current field ("&")
    up.form.config.validateTargets = ['form &']
  
    You can also individually override what to update by setting the `up-validate`
    attribute to a CSS selector:
  
    <input type="text" name="email" up-validate=".email-errors">
    <span class="email-errors"></span>
  
    \#\#\# Updating dependent fields
  
    The `[up-validate]` behavior is also a great way to partially update a form
    when one fields depends on the value of another field.
  
    Let's say you have a form with one `<select>` to pick a department (sales, engineering, ...)
    and another `<select>` to pick an employeee from the selected department:
  
    <form action="/contracts">
      <select name="department">...</select> <!-- options for all departments -->
      <select name="employeed">...</select> <!-- options for employees of selected department -->
    </form>
  
    The list of employees needs to be updated as the appartment changes:
  
    <form action="/contracts">
      <select name="department" up-validate="[name=employee]">...</select>
      <select name="employee">...</select>
    </form>
  
    In order to update the `department` field in addition to the `employee` field, you could say
    `up-validate="&, [name=employee]"`, or simply `up-validate="form"` to update the entire form.
  
    @selector input[up-validate]
    @param {string} up-validate
    The CSS selector to update with the server response.
  
    This defaults to a fieldset or form group around the validating field.
    @stable
     */
    /***
    Performs [server-side validation](/input-up-validate) when any fieldset within this form changes.
  
    You can configure what Unpoly considers a fieldset by adding CSS selectors to the
    [`up.form.config.validateTargets`](/up.form.config#config.validateTargets) array.
  
    @selector form[up-validate]
    @stable
    */
    up.on('change', '[up-validate]', function (event) {
        var field;
        field = findFields(event.target)[0];
        return u.muteRejection(validate(field));
    });
    /***
    Show or hide elements when a `<select>` or `<input>` has a given value.
  
    \#\#\# Example: Select options
  
    The controlling form field gets an `up-switch` attribute with a selector for the elements to show or hide:
  
    <select name="advancedness" up-switch=".target">
      <option value="basic">Basic parts</option>
      <option value="advanced">Advanced parts</option>
      <option value="very-advanced">Very advanced parts</option>
    </select>
  
    The target elements can use [`[up-show-for]`](/up-show-for) and [`[up-hide-for]`](/up-hide-for)
    attributes to indicate for which values they should be shown or hidden:
  
    <div class="target" up-show-for="basic">
      only shown for advancedness = basic
    </div>
  
    <div class="target" up-hide-for="basic">
      hidden for advancedness = basic
    </div>
  
    <div class="target" up-show-for="advanced very-advanced">
      shown for advancedness = advanced or very-advanced
    </div>
  
    \#\#\# Example: Text field
  
    The controlling `<input>` gets an `up-switch` attribute with a selector for the elements to show or hide:
  
    <input type="text" name="user" up-switch=".target">
  
    <div class="target" up-show-for="alice">
      only shown for user alice
    </div>
  
    You can also use the pseudo-values `:blank` to match an empty input value,
    or `:present` to match a non-empty input value:
  
    <input type="text" name="user" up-switch=".target">
  
    <div class="target" up-show-for=":blank">
      please enter a username
    </div>
  
    \#\#\# Example: Checkbox
  
    For checkboxes you can match against the pseudo-values `:checked` or `:unchecked`:
  
    <input type="checkbox" name="flag" up-switch=".target">
  
    <div class="target" up-show-for=":checked">
      only shown when checkbox is checked
    </div>
  
    <div class="target" up-show-for=":cunhecked">
      only shown when checkbox is unchecked
    </div>
  
    Of course you can also match against the `value` property of the checkbox element:
  
    <input type="checkbox" name="flag" value="active" up-switch=".target">
  
    <div class="target" up-show-for="active">
      only shown when checkbox is checked
    </div>
  
    @selector input[up-switch]
    @param {string} up-switch
    A CSS selector for elements whose visibility depends on this field's value.
    @stable
    */
    /***
    Only shows this element if an input field with [`[up-switch]`](/input-up-switch) has one of the given values.
  
    See [`input[up-switch]`](/input-up-switch) for more documentation and examples.
  
    @selector [up-show-for]
    @param {string} [up-show-for]
    A space-separated list of input values for which this element should be shown.
    @stable
    */
    /***
    Hides this element if an input field with [`[up-switch]`](/input-up-switch) has one of the given values.
  
    See [`input[up-switch]`](/input-up-switch) for more documentation and examples.
  
    @selector [up-hide-for]
    @param {string} [up-hide-for]
    A space-separated list of input values for which this element should be hidden.
    @stable
    */
    up.compiler('[up-switch]', function (switcher) {
        return switchTargets(switcher);
    });
    up.on('change', '[up-switch]', function (event, switcher) {
        return switchTargets(switcher);
    });
    up.compiler('[up-show-for]:not(.up-switched), [up-hide-for]:not(.up-switched)', function (element) {
        return switchTarget(element);
    });
    /***
    Observes this field and runs a callback when a value changes.
  
    This is useful for observing text fields while the user is typing.
    If you want to submit the form after a change see [`input[up-autosubmit]`](/input-up-autosubmit).
  
    The programmatic variant of this is the [`up.observe()`](/up.observe) function.
  
    \#\#\# Example
  
    The following would run a global `showSuggestions(value)` function
    whenever the `<input>` changes:
  
    <input name="query" up-observe="showSuggestions(value)">
  
    \#\#\# Callback context
  
    The script given to `[up-observe]` runs with the following context:
  
    | Name     | Type      | Description                           |
    | -------- | --------- | ------------------------------------- |
    | `value`  | `string`  | The current value of the field        |
    | `this`   | `Element` | The form field                        |
    | `$field` | `jQuery`  | The form field as a jQuery collection |
  
    \#\#\# Observing radio buttons
  
    Multiple radio buttons with the same `[name]` (a radio button group)
    produce a single value for the form.
  
    To observe radio buttons group, use the `[up-observe]` attribute on an
    element that contains all radio button elements with a given name:
  
    <div up-observe="formatSelected(value)">
      <input type="radio" name="format" value="html"> HTML format
      <input type="radio" name="format" value="pdf"> PDF format
      <input type="radio" name="format" value="txt"> Text format
    </div>
  
    @selector input[up-observe]
    @param {string} up-observe
    The code to run when the field's value changes.
    @param {string} up-delay
    The number of miliseconds to wait after a change before the code is run.
    @stable
     */
    /***
    Observes this form and runs a callback when any field changes.
  
    This is useful for observing text fields while the user is typing.
    If you want to submit the form after a change see [`input[up-autosubmit]`](/input-up-autosubmit).
  
    The programmatic variant of this is the [`up.observe()`](/up.observe) function.
  
    \#\#\# Example
  
    The would call a function `somethingChanged(value)`
    when any `<input>` within the `<form>` changes:
  
    <form up-observe="somethingChanged(value)">
      <input name="foo">
      <input name="bar">
    </form>
  
    \#\#\# Callback context
  
    The script given to `up-observe` runs with the following context:
  
    | Name     | Type      | Description                           |
    | -------- | --------- | ------------------------------------- |
    | `value`  | `string`  | The current value of the field        |
    | `this`   | `Element` | The form field                        |
    | `$field` | `jQuery`  | The form field as a jQuery collection |
  
    @selector form[up-observe]
    @param {string} up-observe
    The code to run when any field's value changes.
    @param {string} up-delay
    The number of miliseconds to wait after a change before the code is run.
    @stable
     */
    up.compiler('[up-observe]', function (formOrField) {
        return observe(formOrField);
    });
    /***
    Submits this field's form when this field changes its values.
  
    Both the form and the changed field will be assigned a CSS class [`up-active`](/form-up-active)
    while the autosubmitted form is loading.
  
    The programmatic variant of this is the [`up.autosubmit()`](/up.autosubmit) function.
  
    \#\#\# Example
  
    The following would automatically submit the form when the query is changed:
  
        <form method="GET" action="/search">
          <input type="search" name="query" up-autosubmit>
          <input type="checkbox" name="archive"> Include archive
        </form>
  
    \#\#\# Auto-submitting radio buttons
  
    Multiple radio buttons with the same `[name]` (a radio button group)
    produce a single value for the form.
  
    To auto-submit radio buttons group, use the `[up-submit]` attribute on an
    element that contains all radio button elements with a given name:
  
        <div up-autosubmit>
          <input type="radio" name="format" value="html"> HTML format
          <input type="radio" name="format" value="pdf"> PDF format
          <input type="radio" name="format" value="txt"> Text format
        </div>
  
    @selector input[up-autosubmit]
    @param {string} up-delay
      The number of miliseconds to wait after a change before the form is submitted.
    @stable
    */
    /***
    Submits the form when *any* field changes.
  
    Both the form and the field will be assigned a CSS class [`up-active`](/form-up-active)
    while the autosubmitted form is loading.
  
    The programmatic variant of this is the [`up.autosubmit()`](/up.autosubmit) function.
  
    \#\#\# Example
  
    This will submit the form when either query or checkbox was changed:
  
        <form method="GET" action="/search" up-autosubmit>
          <input type="search" name="query">
          <input type="checkbox" name="archive"> Include archive
        </form>
  
    @selector form[up-autosubmit]
    @param {string} up-delay
      The number of miliseconds to wait after a change before the form is submitted.
    @stable
    */
    up.compiler('[up-autosubmit]', function (formOrField) {
        return autosubmit(formOrField);
    });
    up.compiler('[autofocus]', {
        batch: true
    }, function (inputs) {
        return u.last(inputs).focus();
    });
    up.on('up:framework:reset', reset);
    return {
        config: config,
        submit: submit,
        observe: observe,
        validate: validate,
        autosubmit: autosubmit,
        fieldSelector: fieldSelector,
        fields: findFields,
        submissionFields: findSubmissionFields
    };
})();
up.submit = up.form.submit;
up.observe = up.form.observe;
up.autosubmit = up.form.autosubmit;
up.validate = up.form.validate;


/***/ }),
/* 46 */
/***/ (function(module, exports) {

/***
Pop-up overlays
===============

Instead of [linking to a page fragment](/up.link), you can choose
to show a fragment in a popup overlay that rolls down from an anchoring element.

To open a popup, add an [`up-popup` attribute](/a-up-popup) to a link:

    <a href="/options" up-popup=".menu">Show options</a>

When this link is clicked, Unpoly will request the path `/options` and extract
an element matching the selector `.menu` from the response. The matching element
will then be placed in the popup overlay.

\#\#\# Closing behavior

The popup closes when the user clicks anywhere outside the popup area.

The popup also closes *when a link within the popup changes a fragment behind the popup*.
This is useful to have the popup interact with the page that
opened it, e.g. by updating parts of a larger form.

To disable this behavior, give the opening link an [`up-sticky`](/a-up-popup#up-sticky) attribute.

\#\#\# Customizing the popup design

Popups have a minimal default design:

- Popup contents are displayed in a white box
- There is a a subtle box shadow around the popup
- The box will grow to fit the popup contents

The easiest way to change how the popup looks is to override the
[default CSS styles](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/unpoly/popup.sass).

The HTML of a popup element looks like this:

    <div class="up-popup">
      <div class="up-popup-content">
        Fragment content here
      </div>
    </div>

The popup element is appended to the [viewport](/up.viewport) of the anchor element.

@module up.popup
*/
up.popup = (function () {
    /***
    Attaches a popup overlay to the given element or selector.
  
    Emits events [`up:popup:open`](/up:popup:open) and [`up:popup:opened`](/up:popup:opened).
  
    @function up.popup.attach
    @param {Element|jQuery|string} anchor
    The element to which the popup will be attached.
    @param {string} [options.url]
    The URL from which to fetch the popup contents.
  
    If omitted, the `href` or `up-href` attribute of the anchor element will be used.
  
    Will be ignored if `options.html` is given.
    @param {string} [options.target]
    A CSS selector that will be extracted from the response and placed into the popup.
    @param {string} [options.position='bottom']
    Defines on which side of the opening element the popup is attached.
  
    Valid values are `'top'`, `'right'`, `'bottom'` and `'left'`.
    @param {string} [options.align='left']
    Defines the alignment of the popup along its side.
  
    When the popup's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
    When the popup's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
    @param {string} [options.html]
    A string of HTML from which to extract the popup contents. No network request will be made.
    @param {string} [options.confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the modal is being opened.
    @param {string} [options.animation]
    The animation to use when opening the popup.
    @param {number} [options.duration]
    The duration of the animation. See [`up.animate()`](/up.animate).
    @param {number} [options.delay]
    The delay before the animation starts. See [`up.animate()`](/up.animate).
    @param {string} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate()`](/up.animate).
    @param {string} [options.method="GET"]
    Override the request method.
    @param {boolean} [options.sticky=false]
    If set to `true`, the popup remains
    open even if the page changes in the background.
    @param {boolean} [options.history=false]
    @return {Promise}
    A promise that will be fulfilled when the popup has been loaded and
    the opening animation has completed.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when a popup dialog
    is starting to [close](/up.popup.close).
  
    @event up:popup:close
    @param {Element} event.anchor
      The element to which the popup is attached.
    @param event.preventDefault()
      Event listeners may call this method to prevent the popup from closing.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when a popup dialog
    is done [closing](/up.popup.close).
  
    @event up:popup:closed
    @param {Element} event.anchor
      The element to which the popup was attached.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when a popup is starting to open.
  
    @event up:popup:open
    @param {Element} event.anchor
      The element to which the popup will be attached.
    @param event.preventDefault()
      Event listeners may call this method to prevent the popup from opening.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when a popup has finished opening.
  
    @event up:popup:opened
    @param {Element} event.anchor
      The element to which the popup was attached.
    @stable
    */
    /***
    Closes a currently opened popup overlay.
  
    Does nothing if no popup is currently open.
  
    Emits events [`up:popup:close`](/up:popup:close) and [`up:popup:closed`](/up:popup:closed).
  
    @function up.popup.close
    @param {Object} options
      See options for [`up.animate()`](/up.animate).
    @return {Promise}
      A promise that will be fulfilled once the modal's close
      animation has finished.
    @stable
    */
    /***
    Sets default options for future popups.
  
    @property up.popup.config
    @param {string} [config.position='bottom']
      Defines on which side of the opening element the popup is attached.
  
      Valid values are `'top'`, `'right'`, `'bottom'` and `'left'`.
    @param {string} [config.align='left']
      Defines the alignment of the popup along its side.
  
      When the popup's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
      When the popup's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
    @param {string} [config.history=false]
      Whether opening a popup will add a browser history entry.
    @param {string} [config.openAnimation='fade-in']
      The animation used to open a popup.
    @param {string} [config.closeAnimation='fade-out']
      The animation used to close a popup.
    @param {string} [config.openDuration]
      The duration of the open animation (in milliseconds).
    @param {string} [config.closeDuration]
      The duration of the close animation (in milliseconds).
    @param {string} [config.openEasing]
      The timing function controlling the acceleration of the opening animation.
    @param {string} [config.closeEasing]
      The timing function controlling the acceleration of the closing animation.
    @param {boolean} [options.sticky=false]
      If set to `true`, the popup remains
      open even it changes the page in the background.
    @stable
    */
    /***
    Returns whether the given element or selector is contained
    within the current popup.
  
    @methods up.popup.contains
    @param {string} elementOrSelector
      The element to test
    @return {boolean}
    @stable
    */
    /***
    Returns whether popup modal is currently open.
  
    @function up.popup.isOpen
    @return {boolean}
    @stable
    */
    /***
    Returns the URL from which the current popup's contents were loaded.
  
    Returns `undefined` if no  popup is open.
  
    @function up.popup.url
    @return {string}
    the source URL
    @stable
    */
    /***
    Returns the URL of the page or modal behind the popup.
  
    @function up.popup.coveredUrl
    @return {string}
    @experimental
    */
    /***
    Forces the popup to update its position relative to its anchor element.
  
    Unpoly automatically keep popups aligned when
    the document is resized or scrolled. Complex layout changes may make
    it necessary to call this function.
  
    @function up.popup.sync
    @experimental
    */
    var attachAsap, attachNow, autoclose, chain, closeAsap, closeNow, config, contains, createHiddenFrame, discardHistory, e, isOpen, preloadNow, reset, state, syncPosition, toggleAsap, u, unveilFrame;
    u = up.util;
    e = up.element;
    config = new up.Config({
        openAnimation: 'fade-in',
        closeAnimation: 'fade-out',
        openDuration: 150,
        closeDuration: 100,
        openEasing: null,
        closeEasing: null,
        position: 'bottom',
        align: 'left',
        history: false
    });
    state = new up.Config({
        phase: 'closed',
        anchor: null,
        popup: null,
        content: null,
        tether: null,
        position: null,
        align: null,
        sticky: null,
        url: null,
        coveredUrl: null,
        coveredTitle: null
    });
    chain = new up.DivertibleChain();
    reset = function () {
        var ref;
        if ((ref = state.tether) != null) {
            ref.destroy();
        }
        state.reset();
        chain.reset();
        return config.reset();
    };
    discardHistory = function () {
        state.coveredTitle = null;
        return state.coveredUrl = null;
    };
    createHiddenFrame = function (targetSelector) {
        state.tether = new up.Tether(u.only(state, 'anchor', 'position', 'align'));
        state.popup = e.affix(state.tether.root, '.up-popup', {
            'up-position': state.position,
            'up-align': state.align
        });
        state.content = e.affix(state.popup, '.up-popup-content');
        // Create an empty element that will match the
        // selector that is being replaced.
        up.fragment.createPlaceholder(targetSelector, state.content);
        return e.hide(state.popup);
    };
    unveilFrame = function () {
        return e.show(state.popup);
    };
    syncPosition = function () {
        var ref;
        return (ref = state.tether) != null ? ref.sync() : void 0;
    };
    isOpen = function () {
        return state.phase === 'opened' || state.phase === 'opening';
    };
    attachAsap = function (elementOrSelector, options) {
        return chain.asap(closeNow, (function () {
            return attachNow(elementOrSelector, options);
        }));
    };
    attachNow = function (elementOrSelector, options) {
        var align, anchor, animateOptions, extractOptions, html, position, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, target, url;
        anchor = e.get(elementOrSelector);
        if (options == null) {
            options = {};
        }
        url = (ref = (ref1 = u.pluckKey(options, 'url')) != null ? ref1 : anchor.getAttribute('up-href')) != null ? ref : anchor.getAttribute('href');
        html = u.pluckKey(options, 'html');
        url || html || up.fail('up.popup.attach() requires either an { url } or { html } option');
        target = (ref2 = u.pluckKey(options, 'target')) != null ? ref2 : anchor.getAttribute('up-popup') || up.fail('No target selector given for [up-popup]');
        position = (ref3 = (ref4 = options.position) != null ? ref4 : anchor.getAttribute('up-position')) != null ? ref3 : config.position;
        align = (ref5 = (ref6 = options.align) != null ? ref6 : anchor.getAttribute('up-align')) != null ? ref5 : config.align;
        if (options.animation == null) {
            options.animation = (ref7 = anchor.getAttribute('up-animation')) != null ? ref7 : config.openAnimation;
        }
        if (options.sticky == null) {
            options.sticky = (ref8 = e.booleanAttr(anchor, 'up-sticky')) != null ? ref8 : config.sticky;
        }
        options.history = up.browser.canPushState() ? (ref9 = (ref10 = options.history) != null ? ref10 : e.booleanOrStringAttr(anchor, 'up-history')) != null ? ref9 : config.history : false;
        if (options.confirm == null) {
            options.confirm = anchor.getAttribute('up-confirm');
        }
        options.method = up.link.followMethod(anchor, options);
        options.layer = 'popup';
        if (options.failTarget == null) {
            options.failTarget = anchor.getAttribute('up-fail-target');
        }
        if (options.failLayer == null) {
            options.failLayer = anchor.getAttribute('up-fail-layer');
        }
        // This will prevent up.replace() from looking for fallbacks, since
        // it knows the target will always exist.
        options.provideTarget = function () {
            return createHiddenFrame(target);
        };
        animateOptions = up.motion.animateOptions(options, anchor, {
            duration: config.openDuration,
            easing: config.openEasing
        });
        extractOptions = u.merge(options, {
            animation: false
        });
        if (options.preload && url) {
            return up.replace(target, url, options);
        }
        return up.browser.whenConfirmed(options).then(function () {
            return up.event.whenEmitted('up:popup:open', {
                url: url,
                anchor: anchor,
                log: 'Opening popup'
            }).then(function () {
                var promise;
                state.phase = 'opening';
                state.anchor = anchor;
                state.position = position;
                state.align = align;
                if (options.history) {
                    state.coveredUrl = up.browser.url();
                    state.coveredTitle = document.title;
                }
                state.sticky = options.sticky;
                if (html) {
                    promise = up.extract(target, html, extractOptions);
                }
                else {
                    promise = up.replace(target, url, extractOptions);
                }
                promise = promise.then(function () {
                    unveilFrame();
                    syncPosition();
                    return up.animate(state.popup, options.animation, animateOptions);
                });
                promise = promise.then(function () {
                    state.phase = 'opened';
                    return up.emit(state.popup, 'up:popup:opened', {
                        anchor: state.anchor,
                        log: 'Popup opened'
                    });
                });
                return promise;
            });
        });
    };
    closeAsap = function (options) {
        return chain.asap(function () {
            return closeNow(options);
        });
    };
    closeNow = function (options) {
        var animateOptions;
        if (!isOpen()) { // this can happen when a request fails and the chain proceeds to the next task
            return Promise.resolve();
        }
        options = u.options(options, {
            animation: config.closeAnimation,
            history: state.coveredUrl,
            title: state.coveredTitle
        });
        animateOptions = up.motion.animateOptions(options, {
            duration: config.closeDuration,
            easing: config.closeEasing
        });
        u.assign(options, animateOptions);
        return up.event.whenEmitted('up:popup:close', {
            anchor: state.anchor,
            log: 'Closing popup'
        }).then(function () {
            state.phase = 'closing';
            state.url = null;
            state.coveredUrl = null;
            state.coveredTitle = null;
            return up.destroy(state.popup, options).then(function () {
                state.phase = 'closed';
                state.tether.destroy();
                state.tether = null;
                state.popup = null;
                state.content = null;
                state.anchor = null;
                state.sticky = null;
                return up.emit('up:popup:closed', {
                    anchor: state.anchor,
                    log: 'Popup closed'
                });
            });
        });
    };
    preloadNow = function (link, options) {
        options = u.options(options);
        options.preload = true;
        // Use attachNow() and not attachAsap() so (1) we don't close a currently open popup
        // and (2) our pending AJAX request does not prevent other popups from opening
        return attachNow(link, options);
    };
    toggleAsap = function (link, options) {
        if (link.classList.contains('up-current')) {
            return closeAsap();
        }
        else {
            return attachAsap(link, options);
        }
    };
    autoclose = function () {
        if (!state.sticky) {
            discardHistory();
            return closeAsap();
        }
    };
    contains = function (elementOrSelector) {
        var element;
        element = e.get(elementOrSelector);
        return !!e.closest(element, '.up-popup');
    };
    /***
    Opens this link's destination of in a popup overlay:
  
    <a href="/decks" up-popup=".deck_list">Switch deck</a>
  
    If the `up-sticky` attribute is set, the dialog does not auto-close
    if a page fragment behind the popup overlay updates:
  
    <a href="/decks" up-popup=".deck_list">Switch deck</a>
    <a href="/settings" up-popup=".options" up-sticky>Settings</a>
  
    @selector a[up-popup]
    @param {string} up-popup
    The CSS selector that will be extracted from the response and
    displayed in a popup overlay.
    @param {string} [up-position]
    Defines on which side of the opening element the popup is attached.
  
    Valid values are `'top'`, `'right'`, `'bottom'` and `'left'`.
    @param {string} [up-align]
    Defines the alignment of the popup along its side.
  
    When the popup's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
    When the popup's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
    @param {string} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the popup is opened.
    @param {string} [up-method='GET']
    Override the request method.
    @param [up-sticky]
    If set to `true`, the popup remains
    open even if the page changes in the background.
    @param {string} [up-history='false']
    Whether to push an entry to the browser history for the popup's source URL.
  
    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
  
    @stable
    */
    up.link.addFollowVariant('[up-popup]', {
        // Don't just pass the `toggleAsap` function reference so we can stub it in tests
        follow: function (link, options) {
            return toggleAsap(link, options);
        },
        preload: function (link, options) {
            return preloadNow(link, options);
        }
    });
    // We close the popup when someone clicks on the document.
    // We also need to listen to up:action:consumed in case an [up-instant] link
    // was followed on mousedown.
    up.on('click up:action:consumed', function (event) {
        var target;
        target = event.target;
        // Don't close when the user clicked on a popup opener.
        if (!e.closest(target, '.up-popup, [up-popup]')) {
            return u.muteRejection(closeAsap());
        }
    });
    // Do not halt the event chain here. The user is allowed to directly activate
    // a link in the background, even with a (now closing) popup open.
    up.on('up:fragment:inserted', function (event, fragment) {
        var newSource;
        if (contains(fragment)) {
            if (newSource = fragment.getAttribute('up-source')) {
                return state.url = newSource;
            }
        }
        else if (event.origin && contains(event.origin)) {
            return u.muteRejection(autoclose());
        }
    });
    // Close the pop-up overlay when the user presses ESC.
    up.event.onEscape(function () {
        return u.muteRejection(closeAsap());
    });
    /***
    When this element is clicked, a currently open [popup](/up.popup) is closed.
  
    Does nothing if no popup is currently open.
  
    \#\#\# Example
  
    Clickin on this `<span>` will close a currently open popup:
  
    <span class='up-close'>Close this popup</span>
  
    When a popup changes the current URL, you might need to deal with content being displayed
    as either a popup or a full page.
  
    To make a link that closes the current popup, but follows to
    a fallback destination if no popup is open:
  
    <a href="/fallback" up-close>Okay</a>
  
    @selector .up-popup [up-close]
    @stable
    */
    up.on('click', '.up-popup [up-close]', function (event) {
        u.muteRejection(closeAsap());
        // Only prevent the default when we actually closed a popup.
        // This way we can have buttons that close a popup when within a popup,
        // but link to a destination if not.
        return up.event.consumeAction(event);
    });
    // When the user uses the back button we will usually restore <body> or a base container.
    // We close any open modal because it probably won't match the restored state.
    up.on('up:history:restore', function () {
        return u.muteRejection(closeAsap());
    });
    // The framework is reset between tests
    up.on('up:framework:reset', reset);
    return {
        attach: attachAsap,
        close: closeAsap,
        url: function () {
            return state.url;
        },
        coveredUrl: function () {
            return state.coveredUrl;
        },
        config: config,
        contains: contains,
        isOpen: isOpen,
        sync: syncPosition
    };
})();


/***/ }),
/* 47 */
/***/ (function(module, exports) {

/***
Modal dialogs
=============

Instead of [linking to a page fragment](/up.link), you can choose to show a fragment
in a modal dialog. The existing page will remain open in the background.

To open a modal, add an [`[up-modal]`](/a-up-modal) attribute to a link:

    <a href="/blogs" up-modal=".blog-list">Switch blog</a>

When this link is clicked, Unpoly will request the path `/blogs` and extract
an element matching the selector `.blog-list` from the response. The matching element
will then be placed in a modal dialog.

\#\#\# Closing behavior

By default the dialog automatically closes
*when a link inside a modal changes a fragment behind the modal*.
This is useful to have the dialog interact with the page that
opened it, e.g. by updating parts of a larger form.

To disable this behavior, give the opening link an [`up-sticky`](/a-up-modal#up-sticky) attribute:

\#\#\# Customizing the dialog design

Dialogs have a minimal default design:

- Contents are displayed in a white box with a subtle box shadow
- The box will grow to fit the dialog contents, but never grow larger than the screen
- The box is placed over a semi-transparent backdrop to dim the rest of the page
- There is a button to close the dialog in the top-right corner

The easiest way to change how the dialog looks is to override the
[default CSS styles](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/unpoly/modal.sass).

By default the dialog uses the following DOM structure:

    <div class="up-modal">
      <div class="up-modal-backdrop">
      <div class="up-modal-viewport">
        <div class="up-modal-dialog">
          <div class="up-modal-content">
            <!-- the matching element will be placed here -->
          </div>
          <div class="up-modal-close" up-close>X</div>
        </div>
      </div>
    </div>

You can change this structure by setting [`up.modal.config.template`](/up.modal.config#config.template) to a new template string
or function.

@module up.modal
 */
up.modal = (function () {
    /***
    This event is [emitted](/up.emit) when a modal dialog
    is starting to [close](/up.modal.close).
  
    @event up:modal:close
    @param event.preventDefault()
      Event listeners may call this method to prevent the modal from closing.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when a modal dialog
    is done [closing](/up.modal.close).
  
    @event up:modal:closed
    @stable
    */
    /***
    This event is [emitted](/up.emit) when a modal dialog is starting to open.
  
    @event up:modal:open
    @param event.preventDefault()
      Event listeners may call this method to prevent the modal from opening.
    @stable
    */
    /***
    This event is [emitted](/up.emit) when a modal dialog has finished opening.
  
    @event up:modal:opened
    @stable
    */
    /***
    Closes a currently opened modal overlay.
  
    Does nothing if no modal is currently open.
  
    Emits events [`up:modal:close`](/up:modal:close) and [`up:modal:closed`](/up:modal:closed).
  
    @function up.modal.close
    @param {Object} options
      See options for [`up.animate()`](/up.animate)
    @return {Promise}
      A promise that will be fulfilled once the modal's close
      animation has finished.
    @stable
    */
    /***
    Sets default options for future modals.
  
    @property up.modal.config
    @param {string} [config.history=true]
      Whether opening a modal will add a browser history entry.
    @param {number} [config.width]
      The width of the dialog as a CSS value like `'400px'` or `'50%'`.
  
      Defaults to `undefined`, meaning that the dialog will grow to fit its contents
      until it reaches `config.maxWidth`. Leaving this as `undefined` will
      also allow you to control the width using CSS on `.up-modal-dialog´.
    @param {number} [config.maxWidth]
      The width of the dialog as a CSS value like `'400px'` or `50%`.
      You can set this to `undefined` to make the dialog fit its contents.
      Be aware however, that e.g. Bootstrap stretches input elements
      to `width: 100%`, meaning the dialog will also stretch to the full
      width of the screen.
    @param {number} [config.height='auto']
      The height of the dialog in pixels.
      Defaults to `undefined`, meaning that the dialog will grow to fit its contents.
    @param {string|Function(config): string} [config.template]
      A string containing the HTML structure of the modal.
      You can supply an alternative template string, but make sure that it
      defines tag with the classes `up-modal`, `up-modal-dialog` and  `up-modal-content`.
  
      You can also supply a function that returns a HTML string.
      The function will be called with the modal options (merged from these defaults
      and any per-open overrides) whenever a modal opens.
    @param {string} [config.closeLabel='×']
      The label of the button that closes the dialog.
    @param {boolean} [config.closable=true]
      When `true`, the modal will render a close icon and close when the user
      clicks on the backdrop or presses Escape.
  
      When `false`, you need to either supply an element with `[up-close]` or
      close the modal manually with `up.modal.close()`.
    @param {string} [config.openAnimation='fade-in']
      The animation used to open the viewport around the dialog.
    @param {string} [config.closeAnimation='fade-out']
      The animation used to close the viewport the dialog.
    @param {string} [config.backdropOpenAnimation='fade-in']
      The animation used to open the backdrop that dims the page below the dialog.
    @param {string} [config.backdropCloseAnimation='fade-out']
      The animation used to close the backdrop that dims the page below the dialog.
    @param {number} [config.openDuration]
      The duration of the open animation (in milliseconds).
    @param {number} [config.closeDuration]
      The duration of the close animation (in milliseconds).
    @param {string} [config.openEasing]
      The timing function controlling the acceleration of the opening animation.
    @param {string} [config.closeEasing]
      The timing function controlling the acceleration of the closing animation.
    @param {boolean} [options.sticky=false]
      If set to `true`, the modal remains
      open even it changes the page in the background.
    @param {string} [options.flavor='default']
      The default [flavor](/up.modal.flavors).
    @stable
    */
    /***
    Returns whether the given element or selector is contained
    within the current modal.
  
    @function up.modal.contains
    @param {string} elementOrSelector
      The element to test
    @return {boolean}
    @stable
    */
    /***
    [Extracts](/up.extract) the given CSS selector from the given HTML string and
    opens the results in a modal.
  
    \#\#\# Example
  
    var html = 'before <div class="content">inner</div> after';
    up.modal.extract('.content', html)
  
    The would open a modal with the following contents:
  
    <div class="content">inner</div>
  
    Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).
  
    @function up.modal.extract
    @param {string} selector
    The CSS selector to extract from the HTML.
    @param {string} html
    The HTML containing the modal content.
    @param {Object} options
    See options for [`up.modal.follow()`](/up.modal.follow).
    @return {Promise}
    A promise that will be fulfilled when the modal has been opened and the opening
    animation has completed.
    @stable
    */
    /***
    Returns the config option for the current flavor.
  
    @function flavorDefault
    @internal
    */
    /***
    Returns a config object for the given flavor.
    Properties in that config should be preferred to the defaults in
    [`/up.modal.config`](/up.modal.config).
  
    @function flavorOverrides
    @internal
    */
    /***
    Define modal variants with their own default configuration, CSS or HTML template.
  
    \#\#\# Example
  
    Unpoly's [`[up-drawer]`](/a-up-drawer) is implemented as a modal flavor:
  
    up.modal.flavors.drawer = {
    openAnimation: 'move-from-right',
    closeAnimation: 'move-to-right'
    }
  
    Modals with that flavor will have a container with an `up-flavor` attribute:
  
    <div class='up-modal' up-flavor='drawer'>
    ...
    </div>
  
    We can target the `up-flavor` attribute to override the default dialog styles:
  
    .up-modal[up-flavor='drawer'] {
  
    .up-modal-dialog {
      margin: 0;         // Remove margin so drawer starts at the screen edge
      max-width: 350px;  // Set drawer size
    }
  
    .up-modal-content {
      min-height: 100vh; // Stretch background to full window height
    }
    }
  
    @property up.modal.flavors
    @param {Object} flavors
      An object where the keys are flavor names (e.g. `'drawer') and
      the values are the respective default configurations.
    @experimental
    */
    /***
    Opens the given link's destination in a modal overlay:
  
    var link = document.querySelector('a')
    up.modal.follow(link)
  
    Any option attributes for [`a[up-modal]`](/a.up-modal) will be honored.
  
    Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).
  
    @function up.modal.follow
    @param {Element|jQuery|string} linkOrSelector
    The link to follow.
    @param {string} [options.target]
    The selector to extract from the response and open in a modal dialog.
    @param {number} [options.width]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {number} [options.height]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {boolean} [options.sticky=false]
    If set to `true`, the modal remains
    open even it changes the page in the background.
    @param {boolean} [config.closable=true]
    When `true`, the modal will render a close icon and close when the user
    clicks on the backdrop or presses Escape.
  
    When `false`, you need to either supply an element with `[up-close]` or
    close the modal manually with `up.modal.close()`.
    @param {string} [options.confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the modal is being opened.
    @param {string} [options.method="GET"]
    Override the request method.
    @param {boolean} [options.history=true]
    Whether to add a browser history entry for the modal's source URL.
    @param {string} [options.animation]
    The animation to use when opening the modal.
    @param {number} [options.duration]
    The duration of the animation. See [`up.animate()`](/up.animate).
    @param {number} [options.delay]
    The delay before the animation starts. See [`up.animate()`](/up.animate).
    @param {string} [options.easing]
    The timing function that controls the animation's acceleration. [`up.animate()`](/up.animate).
    @return {Promise}
    A promise that will be fulfilled when the modal has been loaded and
    the opening animation has completed.
    @stable
    */
    /***
    Returns whether a modal is currently open.
  
    This also returns `true` if the modal is in an opening or closing animation.
  
    @function up.modal.isOpen
    @return {boolean}
    @stable
    */
    /***
    Returns the source URL for the fragment displayed in the current modal overlay,
    or `undefined` if no modal is currently open.
  
    @function up.modal.url
    @return {string}
    the source URL
    @stable
    */
    /***
    Returns the URL of the page behind the modal overlay.
  
    @function up.modal.coveredUrl
    @return {string}
    @experimental
    */
    /***
    Opens a modal for the given URL.
  
    \#\#\# Example
  
    up.modal.visit('/foo', { target: '.list' })
  
    This will request `/foo`, extract the `.list` selector from the response
    and open the selected container in a modal dialog.
  
    Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).
  
    @function up.modal.visit
    @param {string} url
    The URL to load.
    @param {string} options.target
    The CSS selector to extract from the response.
    The extracted content will be placed into the dialog window.
    @param {Object} options
    See options for [`up.modal.follow()`](/up.modal.follow).
    @return {Promise}
    A promise that will be fulfilled when the modal has been loaded and the opening
    animation has completed.
    @stable
    */
    var animate, autoclose, bodyShifter, chain, closeAsap, closeNow, config, contains, createHiddenFrame, discardHistory, e, extractAsap, flavor, flavorDefault, flavorOverrides, flavors, followAsap, isOpen, markAsAnimating, openAsap, openNow, part, preloadNow, reset, state, templateHtml, u, unveilFrame, validateTarget, visitAsap;
    u = up.util;
    e = up.element;
    config = new up.Config({
        maxWidth: null,
        width: null,
        height: null,
        history: true,
        openAnimation: 'fade-in',
        closeAnimation: 'fade-out',
        openDuration: null,
        closeDuration: null,
        openEasing: null,
        closeEasing: null,
        backdropOpenAnimation: 'fade-in',
        backdropCloseAnimation: 'fade-out',
        closeLabel: '×',
        closable: true,
        sticky: false,
        flavor: 'default',
        position: null,
        template: function (options) {
            return "<div class=\"up-modal\">\n  <div class=\"up-modal-backdrop\"></div>\n  <div class=\"up-modal-viewport\">\n    <div class=\"up-modal-dialog\">\n      <div class=\"up-modal-content\"></div>\n      <div class=\"up-modal-close\" up-close>" + options.closeLabel + "</div>\n    </div>\n  </div>\n</div>";
        }
    });
    flavors = new up.Config({
        default: {}
    });
    state = new up.Config({
        phase: 'closed',
        anchorElement: null,
        modalElement: null,
        sticky: null,
        closable: null,
        flavor: null,
        url: null,
        coveredUrl: null,
        coveredTitle: null,
        position: null
    });
    bodyShifter = new up.BodyShifter();
    chain = new up.DivertibleChain();
    reset = function () {
        if (state.modalElement) {
            e.remove(state.modalElement);
        }
        bodyShifter.unshift();
        state.reset();
        chain.reset();
        config.reset();
        return flavors.reset();
    };
    templateHtml = function () {
        var template;
        template = flavorDefault('template');
        return u.evalOption(template, {
            closeLabel: flavorDefault('closeLabel')
        });
    };
    discardHistory = function () {
        state.coveredTitle = null;
        return state.coveredUrl = null;
    };
    part = function (name) {
        var selector;
        selector = ".up-modal-" + name;
        return state.modalElement.querySelector(selector);
    };
    createHiddenFrame = function (target, options) {
        var closeElement, contentElement, dialogStyles, html, modalElement;
        html = templateHtml();
        state.modalElement = modalElement = e.createFromHtml(html);
        modalElement.setAttribute('up-flavor', state.flavor);
        if (u.isPresent(state.position)) {
            modalElement.setAttribute('up-position', state.position);
        }
        dialogStyles = u.only(options, 'width', 'maxWidth', 'height');
        e.setStyle(part('dialog'), dialogStyles);
        if (!state.closable) {
            closeElement = part('close');
            e.remove(closeElement);
        }
        contentElement = part('content');
        // Create an empty element that will match the
        // selector that is being replaced.
        up.fragment.createPlaceholder(target, contentElement);
        e.hide(modalElement);
        return document.body.appendChild(modalElement);
    };
    unveilFrame = function () {
        return e.show(state.modalElement);
    };
    isOpen = function () {
        return state.phase === 'opened' || state.phase === 'opening';
    };
    followAsap = function (linkOrSelector, options) {
        options = u.options(options);
        options.link = e.get(linkOrSelector);
        return openAsap(options);
    };
    preloadNow = function (link, options) {
        options = u.options(options);
        options.link = link;
        options.preload = true;
        // Use openNow() and not openAsap() so (1) we don't close a currently open modal
        // and (2) our pending AJAX request does not prevent other modals from opening
        return openNow(options);
    };
    visitAsap = function (url, options) {
        options = u.options(options);
        options.url = url;
        return openAsap(options);
    };
    extractAsap = function (selector, html, options) {
        options = u.options(options);
        options.html = html;
        if (options.history == null) {
            options.history = false;
        }
        options.target = selector;
        return openAsap(options);
    };
    openAsap = function (options) {
        return chain.asap(closeNow, (function () {
            return openNow(options);
        }));
    };
    openNow = function (options) {
        var animateOptions, html, link, ref, ref1, ref10, ref11, ref12, ref13, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, target, url;
        options = u.options(options);
        link = u.pluckKey(options, 'link') || e.none();
        url = (ref = (ref1 = u.pluckKey(options, 'url')) != null ? ref1 : link.getAttribute('up-href')) != null ? ref : link.getAttribute('href');
        html = u.pluckKey(options, 'html');
        target = (ref2 = u.pluckKey(options, 'target')) != null ? ref2 : link.getAttribute('up-modal');
        validateTarget(target);
        if (options.flavor == null) {
            options.flavor = (ref3 = link.getAttribute('up-flavor')) != null ? ref3 : config.flavor;
        }
        if (options.position == null) {
            options.position = (ref4 = link.getAttribute('up-position')) != null ? ref4 : flavorDefault('position', options.flavor);
        }
        options.position = u.evalOption(options.position, { link: link });
        if (options.width == null) {
            options.width = (ref5 = link.getAttribute('up-width')) != null ? ref5 : flavorDefault('width', options.flavor);
        }
        if (options.maxWidth == null) {
            options.maxWidth = (ref6 = link.getAttribute('up-max-width')) != null ? ref6 : flavorDefault('maxWidth', options.flavor);
        }
        if (options.height == null) {
            options.height = (ref7 = link.getAttribute('up-height')) != null ? ref7 : flavorDefault('height');
        }
        if (options.animation == null) {
            options.animation = (ref8 = link.getAttribute('up-animation')) != null ? ref8 : flavorDefault('openAnimation', options.flavor);
        }
        options.animation = u.evalOption(options.animation, {
            position: options.position
        });
        if (options.backdropAnimation == null) {
            options.backdropAnimation = (ref9 = link.getAttribute('up-backdrop-animation')) != null ? ref9 : flavorDefault('backdropOpenAnimation', options.flavor);
        }
        options.backdropAnimation = u.evalOption(options.backdropAnimation, {
            position: options.position
        });
        if (options.sticky == null) {
            options.sticky = (ref10 = e.booleanAttr(link, 'up-sticky')) != null ? ref10 : flavorDefault('sticky', options.flavor);
        }
        if (options.closable == null) {
            options.closable = (ref11 = e.booleanAttr(link, 'up-closable')) != null ? ref11 : flavorDefault('closable', options.flavor);
        }
        if (options.confirm == null) {
            options.confirm = link.getAttribute('up-confirm');
        }
        options.method = up.link.followMethod(link, options);
        options.layer = 'modal';
        if (options.failTarget == null) {
            options.failTarget = link.getAttribute('up-fail-target');
        }
        if (options.failLayer == null) {
            options.failLayer = (ref12 = link.getAttribute('up-fail-layer')) != null ? ref12 : 'auto';
        }
        animateOptions = up.motion.animateOptions(options, link, {
            duration: flavorDefault('openDuration', options.flavor),
            easing: flavorDefault('openEasing', options.flavor)
        });
        // Although we usually fall back to full page loads if a browser doesn't support pushState,
        // in the case of modals we assume that the developer would rather see a dialog
        // without an URL update.
        if (options.history == null) {
            options.history = (ref13 = e.booleanOrStringAttr(link, 'up-history')) != null ? ref13 : flavorDefault('history', options.flavor);
        }
        if (!up.browser.canPushState()) {
            options.history = false;
        }
        // This will prevent up.replace() from looking for fallbacks, since
        // it knows the target will always exist.
        options.provideTarget = function () {
            return createHiddenFrame(target, options);
        };
        if (options.preload) {
            return up.replace(target, url, options);
        }
        return up.browser.whenConfirmed(options).then(function () {
            return up.event.whenEmitted('up:modal:open', {
                url: url,
                log: 'Opening modal'
            }).then(function () {
                var extractOptions, promise;
                state.phase = 'opening';
                state.flavor = options.flavor;
                state.sticky = options.sticky;
                state.closable = options.closable;
                state.position = options.position;
                if (options.history) {
                    state.coveredUrl = up.browser.url();
                    state.coveredTitle = document.title;
                }
                extractOptions = u.merge(options, {
                    animation: false
                });
                if (html) {
                    promise = up.extract(target, html, extractOptions);
                }
                else {
                    promise = up.replace(target, url, extractOptions);
                }
                promise = promise.then(function () {
                    bodyShifter.shift();
                    unveilFrame();
                    return animate(options.animation, options.backdropAnimation, animateOptions);
                });
                promise = promise.then(function () {
                    state.phase = 'opened';
                    return up.emit('up:modal:opened', {
                        log: 'Modal opened'
                    });
                });
                return promise;
            });
        });
    };
    validateTarget = function (target) {
        if (u.isBlank(target)) {
            return up.fail('Cannot open a modal without a target selector');
        }
        else if (target === 'body') {
            return up.fail('Cannot open the <body> in a modal');
        }
    };
    closeAsap = function (options) {
        return chain.asap(function () {
            return closeNow(options);
        });
    };
    closeNow = function (options) {
        var animateOptions, backdropCloseAnimation, destroyOptions, ref, ref1, viewportCloseAnimation;
        options = u.options(options);
        if (!isOpen()) {
            return Promise.resolve();
        }
        viewportCloseAnimation = (ref = options.animation) != null ? ref : flavorDefault('closeAnimation');
        viewportCloseAnimation = u.evalOption(viewportCloseAnimation, {
            position: state.position
        });
        backdropCloseAnimation = (ref1 = options.backdropAnimation) != null ? ref1 : flavorDefault('backdropCloseAnimation');
        backdropCloseAnimation = u.evalOption(backdropCloseAnimation, {
            position: state.position
        });
        animateOptions = up.motion.animateOptions(options, {
            duration: flavorDefault('closeDuration'),
            easing: flavorDefault('closeEasing')
        });
        destroyOptions = u.options(u.except(options, 'animation', 'duration', 'easing', 'delay'), {
            history: state.coveredUrl,
            title: state.coveredTitle
        });
        return up.event.whenEmitted(state.modalElement, 'up:modal:close', {
            log: 'Closing modal'
        }).then(function () {
            var promise;
            state.phase = 'closing';
            // the current URL must be deleted *before* calling up.destroy,
            // since up.feedback listens to up:fragment:destroyed and then
            // re-assigns .up-current classes.
            state.url = null;
            state.coveredUrl = null;
            state.coveredTitle = null;
            promise = animate(viewportCloseAnimation, backdropCloseAnimation, animateOptions);
            promise = promise.then(function () {
                return up.destroy(state.modalElement, destroyOptions);
            });
            promise = promise.then(function () {
                bodyShifter.unshift();
                state.phase = 'closed';
                state.modalElement = null;
                state.flavor = null;
                state.sticky = null;
                state.closable = null;
                state.position = null;
                return up.emit('up:modal:closed', {
                    log: 'Modal closed'
                });
            });
            return promise;
        });
    };
    markAsAnimating = function (isAnimating) {
        if (isAnimating === void 0) { isAnimating = true; }
        return e.toggleClass(state.modalElement, 'up-modal-animating', isAnimating);
    };
    animate = function (viewportAnimation, backdropAnimation, animateOptions) {
        var promise;
        // If we're not animating the dialog, don't animate the backdrop either
        if (up.motion.isNone(viewportAnimation)) {
            return Promise.resolve();
        }
        else {
            markAsAnimating();
            promise = Promise.all([up.animate(part('viewport'), viewportAnimation, animateOptions), up.animate(part('backdrop'), backdropAnimation, animateOptions)]);
            promise = promise.then(function () {
                return markAsAnimating(false);
            });
            return promise;
        }
    };
    autoclose = function () {
        if (!state.sticky) {
            discardHistory();
            return closeAsap();
        }
    };
    contains = function (elementOrSelector) {
        var element;
        element = e.get(elementOrSelector);
        return !!e.closest(element, '.up-modal');
    };
    flavor = function (name, overrideConfig) {
        if (overrideConfig === void 0) { overrideConfig = {}; }
        up.legacy.warn('up.modal.flavor() is deprecated. Use the up.modal.flavors property instead.');
        return u.assign(flavorOverrides(name), overrideConfig);
    };
    flavorOverrides = function (flavor) {
        return flavors[flavor] || (flavors[flavor] = {});
    };
    flavorDefault = function (key, flavorName) {
        if (flavorName === void 0) { flavorName = state.flavor; }
        var value;
        if (flavorName) {
            value = flavorOverrides(flavorName)[key];
        }
        if (u.isMissing(value)) {
            value = config[key];
        }
        return value;
    };
    /***
    Clicking this link will load the destination via AJAX and open
    the given selector in a modal dialog.
  
    \#\#\# Example
  
    <a href="/blogs" up-modal=".blog-list">Switch blog</a>
  
    Clicking would request the path `/blog` and select `.blog-list` from
    the HTML response. Unpoly will dim the page
    and place the matching `.blog-list` tag will be placed in
    a modal dialog.
  
    @selector a[up-modal]
    @param {string} up-modal
    The CSS selector that will be extracted from the response and displayed in a modal dialog.
    @param {string} [up-confirm]
    A message that will be displayed in a cancelable confirmation dialog
    before the modal is opened.
    @param {string} [up-method='GET']
    Override the request method.
    @param {string} [up-sticky]
    If set to `"true"`, the modal remains
    open even if the page changes in the background.
    @param {boolean} [up-closable]
    When `true`, the modal will render a close icon and close when the user
    clicks on the backdrop or presses Escape.
  
    When `false`, you need to either supply an element with `[up-close]` or
    close the modal manually with `up.modal.close()`.
    @param {string} [up-animation]
    The animation to use when opening the viewport containing the dialog.
    @param {string} [up-backdrop-animation]
    The animation to use when opening the backdrop that dims the page below the dialog.
    @param {string} [up-height]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {string} [up-width]
    The width of the dialog in pixels.
    By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {string} [up-history]
    Whether to push an entry to the browser history for the modal's source URL.
  
    Set this to `'false'` to prevent the URL bar from being updated.
    Set this to a URL string to update the history with the given URL.
  
    @stable
    */
    up.link.addFollowVariant('[up-modal]', {
        // Don't just pass the `follow` function reference so we can stub it in tests
        follow: function (link, options) {
            return followAsap(link, options);
        },
        preload: function (link, options) {
            return preloadNow(link, options);
        }
    });
    // Close the modal when someone clicks outside the dialog (but not on a modal opener).
    // We register the event on .up-modal, which covers the *entire* viewport, not just
    // the dialog area.
    // Note that we cannot listen to clicks on .up-modal-backdrop, which is a sister element
    // of .up-modal-viewport. Since the user will effectively click on the viewport, not
    // the backdrop, backdrop will not receive a bubbling event.
    up.on('click', '.up-modal', function (event) {
        var target;
        if (!state.closable) {
            return;
        }
        target = event.target;
        if (!(e.closest(target, '.up-modal-dialog') || e.closest(target, '[up-modal]'))) {
            up.event.consumeAction(event);
            return u.muteRejection(closeAsap());
        }
    });
    up.on('up:fragment:inserted', function (event, fragment) {
        var newSource;
        if (contains(fragment)) {
            if (newSource = fragment.getAttribute('up-source')) {
                return state.url = newSource;
            }
        }
        else if (event.origin && contains(event.origin) && !up.popup.contains(fragment)) {
            return u.muteRejection(autoclose());
        }
    });
    // Close the pop-up overlay when the user presses ESC.
    up.event.onEscape(function () {
        if (state.closable) {
            return u.muteRejection(closeAsap());
        }
    });
    /***
    When this element is clicked, closes a currently open dialog.
  
    Does nothing if no modal is currently open.
  
    To make a link that closes the current modal, but follows to
    a fallback destination if no modal is open:
  
    <a href="/fallback" up-close>Okay</a>
  
    @selector .up-modal [up-close]
    @stable
    */
    up.on('click', '.up-modal [up-close]', function (event) {
        u.muteRejection(closeAsap());
        // If the user closes the modal by clicking on the background, we want to halt the event chain here.
        // The event should not trigger anything else. The user needs to click again for another interaction.
        // Also only prevent the default when we actually closed a modal.
        // This way we can have buttons that close a modal when within a modal, but link to a destination if not.
        return up.event.consumeAction(event);
    });
    /***
    Clicking this link will load the destination via AJAX and open
    the given selector in a modal drawer that slides in from the edge of the screen.
  
    You can configure drawers using the [`up.modal.flavors.drawer`](/up.modal.flavors.drawer) property.
  
    \#\#\# Example
  
        <a href="/blogs" up-drawer=".blog-list">Switch blog</a>
  
    Clicking would request the path `/blog` and select `.blog-list` from
    the HTML response. Unpoly will dim the page
    and place the matching `.blog-list` tag will be placed in
    a modal drawer.
  
    @selector a[up-drawer]
    @param {string} up-drawer
      The CSS selector to extract from the response and open in the drawer.
    @param {string} [up-position='auto']
      The side from which the drawer slides in.
  
      Valid values are `'left'`, `'right'` and `'auto'`. If set to `'auto'`, the
      drawer will slide in from left if the opening link is on the left half of the screen.
      Otherwise it will slide in from the right.
    @stable
    */
    up.macro('a[up-drawer], [up-href][up-drawer]', function (link) {
        var target;
        target = link.getAttribute('up-drawer');
        return e.setAttrs(link, {
            'up-modal': target,
            'up-flavor': 'drawer'
        });
    });
    /***
    Sets default options for future drawers.
  
    @property up.modal.flavors.drawer
    @param {Object} config
      Default options for future drawers.
  
      See [`up.modal.config`](/up.modal.config) for available options.
    @experimental
    */
    flavors.drawer = {
        openAnimation: function (options) {
            switch (options.position) {
                case 'left':
                    return 'move-from-left';
                case 'right':
                    return 'move-from-right';
            }
        },
        closeAnimation: function (options) {
            switch (options.position) {
                case 'left':
                    return 'move-to-left';
                case 'right':
                    return 'move-to-right';
            }
        },
        position: function (options) {
            if (u.isPresent(options.link)) {
                return u.horizontalScreenHalf(options.link);
            }
            else {
                // In case the drawer was opened programmatically through Javascript,
                // we might now know the link that was clicked on.
                return 'left';
            }
        }
    };
    // When the user uses the back button we will usually restore <body> or a base container.
    // We close any open modal because it probably won't match the restored state.
    up.on('up:history:restore', function () {
        return u.muteRejection(closeAsap());
    });
    // The framework is reset between tests
    up.on('up:framework:reset', reset);
    return {
        visit: visitAsap,
        follow: followAsap,
        extract: extractAsap,
        close: closeAsap,
        url: function () {
            return state.url;
        },
        coveredUrl: function () {
            return state.coveredUrl;
        },
        config: config,
        flavors: flavors,
        contains: contains,
        isOpen: isOpen,
        flavor: flavor // deprecated
    };
})();


/***/ }),
/* 48 */
/***/ (function(module, exports) {

/***
Tooltips
========

Unpoly comes with a basic tooltip implementation.

Add an [`up-tooltip`](/up-tooltip) attribute to any HTML tag to show a tooltip whenever
the user hovers over the element:

      <a href="/decks" up-tooltip="Show all decks">Decks</a>

\#\#\# Styling

The default styles
render a tooltip with white text on a gray background.
A gray triangle points to the element.

To change the styling, simply override the [CSS rules](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/unpoly/tooltip.sass) for the `.up-tooltip` selector and its `:after`
selector that is used for the triangle.

The HTML of a tooltip element looks like this:

    <div class="up-tooltip">
      <div class="up-tooltip-content">
        Tooltip text here
      </div>
    </div>

The tooltip element is appended to the [viewport](/up.viewport) of the anchor element.

@module up.tooltip
*/
up.tooltip = (function () {
    /***
    Opens a tooltip over the given element.
  
    The unobtrusive variant of this is the [`[up-tooltip]`](/up-tooltip) selector.
  
    \#\#\# Examples
  
    In order to attach a tooltip to a `<span class="help">?</span>`:
  
    up.tooltip.attach('.help', { text: 'Useful info' })
  
    @function up.tooltip.attach
    @param {Element|jQuery|string} elementOrSelector
    @param {string} [options.text]
    The text to display in the tooltip.
  
    Any HTML control characters will be escaped.
    If you need to use HTML formatting in the tooltip, use `options.html` instead.
    @param {string} [options.html]
    The HTML to display in the tooltip unescaped.
  
    Make sure to escape any user-provided text before passing it as this option,
    or use `options.text` (which automatically escapes).
    @param {string} [options.position]
    The tooltip's position relative to the opening element.
  
    Valid values are `'top'`, `'right'`, `'bottom'` or `'left'`.
    @param {string} [options.align]
    Defines the alignment of the tooltip along its side.
  
    When the tooltip's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
    When the tooltip's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
    @param {string} [options.animation]
    The [animation](/up.motion) to use when opening the tooltip.
    @return {Promise}
    A promise that will be fulfilled when the tooltip's opening animation has finished.
    @stable
    */
    /***
    Closes a currently shown tooltip.
  
    Does nothing if no tooltip is currently shown.
  
    @function up.tooltip.close
    @param {Object} options
      See options for [`up.animate()`](/up.animate).
    @return {Promise}
      A promise for the end of the closing animation.
    @stable
    */
    /***
    Configures defaults for future tooltips.
  
    @property up.tooltip.config
    @param {string} [config.position]
      The default position of tooltips relative to the opening element.
  
      Valid values are `'top'`, `'right'`, `'bottom'` or `'left'`.
    @param {string} [config.align]
      Defines the alignment of the tooltip along its side.
  
      When the tooltip's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
      When the tooltip's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
    @param {string} [config.openAnimation='fade-in']
      The animation used to open a tooltip.
    @param {string} [config.closeAnimation='fade-out']
      The animation used to close a tooltip.
    @param {number} [config.openDuration]
      The duration of the open animation (in milliseconds).
    @param {number} [config.closeDuration]
      The duration of the close animation (in milliseconds).
    @param {string} [config.openEasing]
      The timing function controlling the acceleration of the opening animation.
    @param {string} [config.closeEasing]
      The timing function controlling the acceleration of the closing animation.
    @stable
    */
    /***
    Returns whether a tooltip is currently showing.
  
    @function up.tooltip.isOpen
    @stable
    */
    /***
    Forces the tooltip to update its position relative to its anchor element.
  
    Unpoly will automatically keep tooltips aligned when
    the document is resized or scrolled. Complex layout changes may make
    it necessary to call this function.
  
    @function up.tooltip.sync
    @experimental
    */
    var attachAsap, attachNow, chain, closeAsap, closeNow, config, createElement, e, isOpen, reset, state, syncPosition, u;
    u = up.util;
    e = up.element;
    config = new up.Config({
        position: 'top',
        align: 'center',
        openAnimation: 'fade-in',
        closeAnimation: 'fade-out',
        openDuration: 100,
        closeDuration: 50,
        openEasing: null,
        closeEasing: null
    });
    state = new up.Config({
        phase: 'closed',
        anchor: null,
        tooltip: null,
        content: null,
        tether: null,
        position: null,
        align: null
    });
    chain = new up.DivertibleChain();
    reset = function () {
        var ref;
        if ((ref = state.tether) != null) {
            ref.destroy();
        }
        state.reset();
        chain.reset();
        return config.reset();
    };
    createElement = function (options) {
        state.tether = new up.Tether(u.only(state, 'anchor', 'position', 'align'));
        state.tooltip = e.affix(state.tether.root, '.up-tooltip', {
            'up-position': state.position,
            'up-align': state.align
        });
        state.content = e.affix(state.tooltip, '.up-tooltip-content');
        if (options.text) {
            return state.content.innerText = options.text;
        }
        else {
            return state.content.innerHTML = options.html;
        }
    };
    syncPosition = function () {
        var ref;
        return (ref = state.tether) != null ? ref.sync() : void 0;
    };
    attachAsap = function (elementOrSelector, options) {
        return chain.asap(closeNow, (function () {
            return attachNow(elementOrSelector, options);
        }));
    };
    attachNow = function (elementOrSelector, options) {
        if (options === void 0) { options = {}; }
        var align, anchor, animateOptions, animation, html, position, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, text;
        anchor = e.get(elementOrSelector);
        html = (ref = options.html) != null ? ref : anchor.getAttribute('up-tooltip-html');
        text = (ref1 = options.text) != null ? ref1 : anchor.getAttribute('up-tooltip');
        position = (ref2 = (ref3 = options.position) != null ? ref3 : anchor.getAttribute('up-position')) != null ? ref2 : config.position;
        align = (ref4 = (ref5 = options.align) != null ? ref5 : anchor.getAttribute('up-align')) != null ? ref4 : config.align;
        animation = (ref6 = (ref7 = options.animation) != null ? ref7 : e.booleanOrStringAttr(anchor, 'up-animation')) != null ? ref6 : config.openAnimation;
        animateOptions = up.motion.animateOptions(options, anchor, {
            duration: config.openDuration,
            easing: config.openEasing
        });
        state.phase = 'opening';
        state.anchor = anchor;
        state.position = position;
        state.align = align;
        createElement({ text: text, html: html });
        syncPosition();
        return up.animate(state.tooltip, animation, animateOptions).then(function () {
            return state.phase = 'opened';
        });
    };
    closeAsap = function (options) {
        return chain.asap(function () {
            return closeNow(options);
        });
    };
    closeNow = function (options) {
        var animateOptions;
        if (!isOpen()) { // this can happen when a request fails and the chain proceeds to the next task
            return Promise.resolve();
        }
        options = u.options(options, {
            animation: config.closeAnimation
        });
        animateOptions = up.motion.animateOptions(options, {
            duration: config.closeDuration,
            easing: config.closeEasing
        });
        u.assign(options, animateOptions);
        state.phase = 'closing';
        return up.destroy(state.tooltip, options).then(function () {
            state.phase = 'closed';
            state.tether.destroy();
            state.tether = null;
            state.tooltip = null;
            state.content = null;
            return state.anchor = null;
        });
    };
    isOpen = function () {
        return state.phase === 'opening' || state.phase === 'opened';
    };
    /***
    Displays a tooltip with text content when hovering the mouse over this element.
  
    \#\#\# Example
  
    <a href="/decks" up-tooltip="Show all decks">Decks</a>
  
    To make the tooltip appear below the element instead of above the element,
    add an `up-position` attribute:
  
    <a href="/decks" up-tooltip="Show all decks" up-position="bottom">Decks</a>
  
    @selector [up-tooltip]
    @param {string} [up-animation]
    The animation used to open the tooltip.
    Defaults to [`up.tooltip.config.openAnimation`](/up.tooltip.config).
    @param {string} [up-position]
    The tooltip's position relative to the opening element.
  
    Valid values are `'top'`, `'right'`, `'bottom'` or `'left'`.
    @param {string} [up-align]
    Defines the alignment of the tooltip along its side.
  
    When the tooltip's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
    When the tooltip's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
    @stable
    */
    /***
    Displays a tooltip with HTML content when hovering the mouse over this element:
  
    <a href="/decks" up-tooltip-html="Show &lt;b&gt;all&lt;/b&gt; decks">Decks</a>
  
    @selector [up-tooltip-html]
    @stable
    */
    up.compiler('[up-tooltip], [up-tooltip-html]', function (opener) {
        // Don't register these events on document since *every*
        // mouse move interaction  bubbles up to the document. 
        opener.addEventListener('mouseenter', function () {
            return attachAsap(opener);
        });
        return opener.addEventListener('mouseleave', function () {
            return closeAsap();
        });
    });
    // We close the tooltip when someone clicks on the document.
    // We also need to listen to up:action:consumed in case an [up-instant] link
    // was followed on mousedown.
    up.on('click up:action:consumed', function (_event) {
        return closeAsap();
    });
    // Do not halt the event chain here. The user is allowed to directly activate
    // a link in the background, even with a (now closing) tooltip open.
    // The framework is reset between tests, so also close a currently open tooltip.
    up.on('up:framework:reset', reset);
    // Close the tooltip when the user presses ESC.
    up.event.onEscape(function () {
        return closeAsap();
    });
    return {
        config: config,
        attach: attachAsap,
        isOpen: isOpen,
        close: closeAsap,
        sync: syncPosition
    };
})();


/***/ }),
/* 49 */
/***/ (function(module, exports) {

/***
Navigation feedback
===================

The `up.feedback` module adds useful CSS classes to links while they are loading,
or when they point to the current URL. By styling these classes you may
provide instant feedback to user interactions. This improves the perceived speed of your interface.

\#\#\# Example

Let's say we have an navigation bar with two links, pointing to `/foo` and `/bar` respectively:

    <div up-nav>
      <a href="/foo" up-follow>Foo</a>
      <a href="/bar" up-follow>Bar</a>
    </div>

If the current URL is `/foo`, the first link is automatically marked with an [`.up-current`](/a.up-current) class:

    <div up-nav>
      <a href="/foo" up-follow class="up-current">Foo</a>
      <a href="/bar" up-follow>Bar</a>
    </div>

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/a.up-active) class while it is waiting
for the server to respond:

    <div up-nav>
      <a href="/foo" up-follow class="up-current">Foo</a>
      <a href="/bar" up-follow class="up-active">Bar</a>
    </div>

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

    <div up-nav>
      <a href="/foo" up-follow>Foo</a>
      <a href="/bar" up-follow class="up-current">Bar</a>
    </div>

@module up.feedback
*/
up.feedback = (function () {
    /***
    Sets default options for this module.
  
    @property up.feedback.config
    @param {Array<string>} [config.currentClasses]
      An array of classes to set on [links that point the current location](/a.up-current).
    @param {Array<string>} [config.navs]
      An array of CSS selectors that match [navigation components](/up-nav).
    @stable
    */
    /***
    @function findActivatableArea
    @param {string|Element|jQuery} elementOrSelector
    @internal
    */
    /***
    Marks the given element as currently loading, by assigning the CSS class [`up-active`](/a.up-active).
  
    This happens automatically when following links or submitting forms through the Unpoly API.
    Use this function if you make custom network calls from your own JavaScript code.
  
    If the given element is a link within an [expanded click area](/up-expand),
    the class will be assigned to the expanded area.
  
    \#\#\# Example
  
    var button = document.querySelector('button')
  
    button.addEventListener('click', () => {
      up.feedback.start(button)
      up.request(...).then(() => {
        up.feedback.stop(button)
      })
    })
  
    @method up.feedback.start
    @param {Element|jQuery|string} element
    The element to mark as active
    @internal
    */
    /***
    Links that are currently [loading through Unpoly](/form-up-target)
    are assigned the `up-active` class automatically.
    Style `.up-active` in your CSS to improve the perceived responsiveness
    of your user interface.
  
    The `up-active` class will be removed when the link is done loading.
  
    \#\#\# Example
  
    We have a link:
  
    <a href="/foo" up-follow>Foo</a>
  
    The user clicks on the link. While the request is loading,
    the link has the `up-active` class:
  
    <a href="/foo" up-follow class="up-active">Foo</a>
  
    Once the link destination has loaded and rendered, the `up-active` class
    is removed and the [`up-current`](/a.up-current) class is added:
  
    <a href="/foo" up-follow class="up-current">Foo</a>
  
    @selector a.up-active
    @stable
    */
    /***
    Forms that are currently [loading through Unpoly](/a-up-target)
    are assigned the `up-active` class automatically.
    Style `.up-active` in your CSS to improve the perceived responsiveness
    of your user interface.
  
    The `up-active` class will be removed as soon as the response to the
    form submission has been received.
  
    \#\#\# Example
  
    We have a form:
  
    <form up-target=".foo">
      <button type="submit">Submit</button>
    </form>
  
    The user clicks on the submit button. While the form is being submitted
    and waiting for the server to respond, the form has the `up-active` class:
  
    <form up-target=".foo" class="up-active">
      <button type="submit">Submit</button>
    </form>
  
    Once the link destination has loaded and rendered, the `up-active` class
    is removed.
  
    @selector form.up-active
    @stable
    */
    /***
    Marks the given element as no longer loading, by removing the CSS class [`up-active`](/a.up-active).
  
    This happens automatically when network requests initiated by the Unpoly API have completed.
    Use this function if you make custom network calls from your own JavaScript code.
  
    @function up.feedback.stop
    @param {Element|jQuery|string} element
    The link or form that has finished loading.
    @internal
    */
    var CLASS_ACTIVE, SELECTOR_LINK, buildCurrentUrlSet, buildSectionUrls, config, currentUrlSet, e, findActivatableArea, navSelector, normalizeUrl, previousUrlSet, reset, sectionUrls, start, stop, u, updateAllNavigationSections, updateAllNavigationSectionsIfLocationChanged, updateCurrentClassForLinks, updateNavigationSectionsInNewFragment;
    u = up.util;
    e = up.element;
    config = new up.Config({
        currentClasses: ['up-current'],
        navs: ['[up-nav]']
    });
    previousUrlSet = void 0;
    currentUrlSet = void 0;
    reset = function () {
        config.reset();
        previousUrlSet = void 0;
        return currentUrlSet = void 0;
    };
    CLASS_ACTIVE = 'up-active';
    SELECTOR_LINK = 'a, [up-href]';
    navSelector = function () {
        return config.navs.join(',');
    };
    normalizeUrl = function (url) {
        if (u.isPresent(url)) {
            return u.normalizeUrl(url, {
                stripTrailingSlash: true
            });
        }
    };
    sectionUrls = function (section) {
        var urls;
        // Check if we have computed the URLs before.
        // Computation is sort of expensive (multiplied by number of links),
        // so we cache the results in a data attribute.
        if (!(urls = section.upNormalizedUrls)) {
            urls = buildSectionUrls(section);
            section.upNormalizedUrls = urls;
        }
        return urls;
    };
    buildSectionUrls = function (section) {
        var attr, i, j, len, len1, ref, ref1, url, urls, value;
        urls = [];
        // A link with an unsafe method will never be higlighted with .up-current,
        // so we cache an empty array.
        if (up.link.isSafe(section)) {
            ref = ['href', 'up-href', 'up-alias'];
            for (i = 0, len = ref.length; i < len; i++) {
                attr = ref[i];
                if (value = section.getAttribute(attr)) {
                    ref1 = u.splitValues(value);
                    // Allow to include multiple space-separated URLs in [up-alias]
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                        url = ref1[j];
                        if (url !== '#') {
                            url = normalizeUrl(url);
                            urls.push(url);
                        }
                    }
                }
            }
        }
        return urls;
    };
    buildCurrentUrlSet = function () {
        var urls;
        urls = [
            up.browser.url(),
            up.modal.url(),
            up.modal.coveredUrl(),
            up.popup.url(),
            up.popup.coveredUrl() // The URL of the page behind the popup
        ];
        return new up.UrlSet(urls, { normalizeUrl: normalizeUrl });
    };
    updateAllNavigationSectionsIfLocationChanged = function () {
        previousUrlSet = currentUrlSet;
        currentUrlSet = buildCurrentUrlSet();
        if (!u.isEqual(currentUrlSet, previousUrlSet)) {
            return updateAllNavigationSections(document.body);
        }
    };
    updateAllNavigationSections = function (root) {
        var navs, sections;
        navs = e.subtree(root, navSelector());
        sections = u.flatMap(navs, function (nav) {
            return e.subtree(nav, SELECTOR_LINK);
        });
        return updateCurrentClassForLinks(sections);
    };
    updateNavigationSectionsInNewFragment = function (fragment) {
        var sections;
        if (e.closest(fragment, navSelector())) {
            // If the new fragment is an [up-nav], or if the new fragment is a child of an [up-nav],
            // all links in the new fragment are considered sections that we need to update.
            // Note that:
            // - The [up-nav] element might not be part of this update.
            //   It might already be in the DOM, and only a child was updated.
            // - The fragment might be a link itself
            // - We do not need to update sibling links of fragment that have been processed before.
            sections = e.subtree(fragment, SELECTOR_LINK);
            return updateCurrentClassForLinks(sections);
        }
        else {
            return updateAllNavigationSections(fragment);
        }
    };
    updateCurrentClassForLinks = function (links) {
        currentUrlSet || (currentUrlSet = buildCurrentUrlSet());
        return u.each(links, function (link) {
            var classList, i, j, klass, len, len1, ref, ref1, results, results1, urls;
            urls = sectionUrls(link);
            classList = link.classList;
            if (currentUrlSet.matchesAny(urls)) {
                ref = config.currentClasses;
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                    klass = ref[i];
                    // Once we drop IE11 support in 2020 we can call add() with multiple arguments
                    results.push(classList.add(klass));
                }
                return results;
            }
            else {
                ref1 = config.currentClasses;
                results1 = [];
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                    klass = ref1[j];
                    // Once we drop IE11 support in 2020 we can call remove() with multiple arguments
                    results1.push(classList.remove(klass));
                }
                return results1;
            }
        });
    };
    findActivatableArea = function (element) {
        element = e.get(element);
        // Try to enlarge links that are expanded with [up-expand] on a surrounding container.
        // Note that the expression below is not the same as e.closest(area, SELECTOR_LINK)!
        return e.ancestor(element, SELECTOR_LINK) || element;
    };
    start = function (element) {
        return findActivatableArea(element).classList.add(CLASS_ACTIVE);
    };
    stop = function (element) {
        return findActivatableArea(element).classList.remove(CLASS_ACTIVE);
    };
    /***
    Marks this element as a navigation component, such as a menu or navigation bar.
  
    When a link within an `[up-nav]` element points to the current location, it is assigned the `.up-current` class. When the browser navigates to another location, the class is removed automatically.
  
    You may also assign `[up-nav]` to an individual link instead of an navigational container.
  
    If you don't want to manually add this attribute to every navigational element, you can configure selectors to automatically match your navigation components in [`up.feedback.config.navs`](/up.feedback.config#config.navs).
  
    \#\#\# Example
  
    Let's take a simple menu with two links. The menu has been marked with the `[up-nav]` attribute:
  
    <div up-nav>
      <a href="/foo">Foo</a>
      <a href="/bar">Bar</a>
    </div>
  
    If the browser location changes to `/foo`, the first link is marked as `.up-current`:
  
    <div up-nav>
      <a href="/foo" class="up-current">Foo</a>
      <a href="/bar">Bar</a>
    </div>
  
    If the browser location changes to `/bar`, the first link automatically loses its `.up-current` class. Now the second link is marked as `.up-current`:
  
    <div up-nav>
      <a href="/foo">Foo</a>
      <a href="/bar" class="up-current">Bar</a>
    </div>
  
    \#\#\# What is considered to be "current"?
  
    The current location is considered to be either:
  
    - the URL displayed in the browser window's location bar
    - the source URL of a [modal dialog](/up.modal)
    - the URL of the page behind a [modal dialog](/up.modal)
    - the source URL of a [popup overlay](/up.popup)
    - the URL of the content behind a [popup overlay](/up.popup)
  
    A link matches the current location (and is marked as `.up-current`) if it matches either:
  
    - the link's `href` attribute
    - the link's `up-href` attribute
    - a space-separated list of URLs in the link's `up-alias` attribute
  
    \#\#\# Matching URL by pattern
  
    You can mark a link as `.up-current` whenever the current URL matches a prefix or suffix.
    To do so, include an asterisk (`*`) in the `up-alias` attribute.
  
    For instance, the following `[up-nav]` link is highlighted for both `/reports` and `/reports/123`:
  
    <a up-nav href="/reports" up-alias="/reports/*">Reports</a>
  
    @selector [up-nav]
    @stable
    */
    /***
    When a link within an `[up-nav]` element points to the current location, it is assigned the `.up-current` class.
  
    See [`[up-nav]`](/up-nav) for more documentation and examples.
  
    @selector [up-nav] a.up-current
    @stable
    */
    // Even when the modal or popup does not change history, we consider the URLs of the content it displays.
    up.on('up:history:pushed up:history:replaced up:history:restored up:modal:opened up:modal:closed up:popup:opened up:popup:closed', function (event) {
        return updateAllNavigationSectionsIfLocationChanged();
    });
    up.on('up:fragment:inserted', function (event, newFragment) {
        return updateNavigationSectionsInNewFragment(newFragment);
    });
    // The framework is reset between tests
    up.on('up:framework:reset', reset);
    return {
        config: config,
        start: start,
        stop: stop
    };
})();
up.legacy.renamedModule('navigation', 'feedback');


/***/ }),
/* 50 */
/***/ (function(module, exports) {

/***
Passive updates
===============

This work-in-progress package will contain functionality to
passively receive updates from the server.

@module up.radio
*/
up.radio = (function () {
    /***
    Configures defaults for passive updates.
  
    @property up.radio.config
    @param {Array<string>} [options.hungry]
      An array of CSS selectors that is replaced whenever a matching element is found in a response.
      These elements are replaced even when they were not targeted directly.
  
      By default this contains the [`[up-hungry]`](/up-hungry) attribute.
    @param {string} [options.hungryTransition=null]
      The transition to use when a [hungry element](/up-hungry) is replacing itself
      while another target is replaced.
  
      By default this is not set and the original replacement's transition is used.
    @stable
    */
    /***
    @function up.radio.hungrySelector
    @internal
    */
    var config, hungrySelector, reset, u;
    u = up.util;
    config = new up.Config({
        hungry: ['[up-hungry]'],
        hungryTransition: null
    });
    reset = function () {
        return config.reset();
    };
    hungrySelector = function () {
        return config.hungry.join(',');
    };
    /***
    Elements with this attribute are [updated](/up.replace) whenever there is a
    matching element found in a successful response. The element is replaced even
    when it isn't [targeted](/a-up-target) directly.
  
    Use cases for this are unread message counters or notification flashes.
    Such elements often live in the layout, outside of the content area that is
    being replaced.
  
    @selector [up-hungry]
    @stable
    */
    up.on('up:framework:reset', reset);
    return {
        config: config,
        hungrySelector: hungrySelector
    };
})();


/***/ }),
/* 51 */
/***/ (function(module, exports) {

/***
Play nice with Rails UJS
========================
*/
up.rails = (function () {
    var e, isRails, u;
    u = up.util;
    e = up.element;
    isRails = function () {
        var ref;
        return !!(window.Rails || ((ref = window.jQuery) != null ? ref.rails : void 0));
    };
    return u.each(['method', 'confirm'], function (feature) {
        var dataAttribute, upAttribute;
        dataAttribute = "data-" + feature;
        upAttribute = "up-" + feature;
        return up.macro("[" + dataAttribute + "]", function (element) {
            var replacement;
            if (isRails() && up.link.isFollowable(element)) {
                replacement = {};
                replacement[upAttribute] = element.getAttribute(dataAttribute);
                e.setMissingAttrs(element, replacement);
                return element.removeAttribute(dataAttribute);
            }
        });
    });
})();


/***/ })
/******/ ]);