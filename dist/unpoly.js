
/***
@module up
 */

(function() {
  window.up = {
    version: "0.57.0",
    deprecateRenamedModule: function(oldName, newName) {
      return typeof Object.defineProperty === "function" ? Object.defineProperty(up, oldName, {
        get: function() {
          up.warn("Deprecated: up." + oldName + " has been renamed to up." + newName);
          return up[newName];
        }
      }) : void 0;
    }
  };

}).call(this);

/***
Utility functions
=================
  
Unpoly comes with a number of utility functions
that might save you from loading something like [Lodash](https://lodash.com/).

@class up.util
 */

(function() {
  var slice = [].slice,
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  up.util = (function($) {

    /***
    A function that does nothing.
    
    @function up.util.noop
    @experimental
     */
    var $createElementFromSelector, $createPlaceholder, CASE_CONVERSION_GROUP, CSS_LENGTH_PROPS, DivertibleChain, ESCAPE_HTML_ENTITY_MAP, addClass, addTemporaryClass, all, always, any, arrayToSet, assign, assignPolyfill, asyncNoop, attributeSelector, camelCase, camelCaseKeys, castedAttr, changeClassList, clientSize, compact, concludeCssTransition, config, contains, convertCase, copy, copyAttributes, copyWithRenamedKeys, createElementFromHtml, cssLength, deprecateRenamedKey, detachWith, detect, documentHasVerticalScrollbar, each, eachIterator, elementTagName, escapeHtml, escapePressed, evalOption, except, extractFromStyleObject, extractOptions, fail, fixedToAbsolute, flatMap, flatten, forceRepaint, getElement, hasClass, hasCssTransition, hide, horizontalScreenHalf, identity, intersect, isArray, isBasicObjectProperty, isBlank, isBodyDescendant, isBoolean, isCrossDomain, isDefined, isDetached, isElement, isEqual, isFixed, isFormData, isFunction, isGiven, isJQuery, isMissing, isNull, isNumber, isObject, isOptions, isPresent, isPromise, isSingletonElement, isStandardPort, isString, isTruthy, isUndefined, isUnmodifiedKeyEvent, isUnmodifiedMouseEvent, jsonAttr, kebabCase, kebabCaseKeys, last, listBlock, map, margins, measure, memoize, merge, methodAllowsPayload, microtask, muteRejection, newDeferred, newOptions, nextFrame, nonUpClasses, noop, normalizeMethod, normalizeStyleValueForWrite, normalizeUrl, nullJQuery, objectValues, offsetParent, only, opacity, openConfig, option, parseUrl, pluckData, pluckKey, presence, presentAttr, previewable, promiseTimer, readComputedStyle, readComputedStyleNumber, readInlineStyle, reject, rejectOnError, remove, removeClass, renameKey, scrollbarWidth, select, selectInDynasty, selectInSubtree, selectorForElement, sequence, setMissingAttrs, setTimer, setToArray, splitValues, submittedValue, sum, times, toArray, trim, uniq, uniqBy, unresolvablePromise, unwrapElement, valuesPolyfill, whenReady, writeInlineStyle, writeTemporaryStyle;
    noop = (function() {});

    /***
    A function that returns a resolved promise.
    
    @function up.util.asyncNoop
    @internal
     */
    asyncNoop = function() {
      return Promise.resolve();
    };

    /***
    Ensures that the given function can only be called a single time.
    Subsequent calls will return the return value of the first call.
    
    Note that this is a simple implementation that
    doesn't distinguish between argument lists.
    
    @function up.util.memoize
    @internal
     */
    memoize = function(func) {
      var cached, cachedValue;
      cachedValue = void 0;
      cached = false;
      return function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (cached) {
          return cachedValue;
        } else {
          cached = true;
          return cachedValue = func.apply(null, args);
        }
      };
    };

    /***
    Returns if the given port is the default port for the given protocol.
    
    @function up.util.isStandardPort
    @internal
     */
    isStandardPort = function(protocol, port) {
      port = port.toString();
      return ((port === "" || port === "80") && protocol === 'http:') || (port === "443" && protocol === 'https:');
    };

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
    normalizeUrl = function(urlOrAnchor, options) {
      var normalized, parts, pathname;
      parts = parseUrl(urlOrAnchor);
      normalized = parts.protocol + "//" + parts.hostname;
      if (!isStandardPort(parts.protocol, parts.port)) {
        normalized += ":" + parts.port;
      }
      pathname = parts.pathname;
      if (pathname[0] !== '/') {
        pathname = "/" + pathname;
      }
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
    isCrossDomain = function(targetUrl) {
      var currentUrl;
      currentUrl = parseUrl(location.href);
      targetUrl = parseUrl(targetUrl);
      return currentUrl.protocol !== targetUrl.protocol || currentUrl.host !== targetUrl.host;
    };

    /***
    Parses the given URL into components such as hostname and path.
    
    If the given URL is not fully qualified, it is assumed to be relative
    to the current page.
    
    @function up.util.parseUrl
    @return {Object}
      The parsed URL as an object with
      `protocol`, `hostname`, `port`, `pathname`, `search` and `hash`
      properties.
    @experimental
     */
    parseUrl = function(urlOrAnchor) {
      var anchor;
      if (isJQuery(urlOrAnchor)) {
        urlOrAnchor = getElement(urlOrAnchor);
      }
      if (urlOrAnchor.pathname) {
        return urlOrAnchor;
      }
      anchor = $('<a>').attr({
        href: urlOrAnchor
      }).get(0);
      if (isBlank(anchor.hostname)) {
        anchor.href = anchor.href;
      }
      return anchor;
    };

    /***
    @function up.util.normalizeMethod
    @internal
     */
    normalizeMethod = function(method) {
      if (method) {
        return method.toUpperCase();
      } else {
        return 'GET';
      }
    };

    /***
    @function up.util.methodAllowsPayload
    @internal
     */
    methodAllowsPayload = function(method) {
      return method !== 'GET' && method !== 'HEAD';
    };

    /***
    @function $createElementFromSelector
    @internal
     */
    $createElementFromSelector = function(selector) {
      var $element, $parent, $root, classes, conjunction, depthSelector, expression, html, id, iteration, j, l, len, len1, path, tag;
      path = selector.split(/[ >]/);
      $root = null;
      for (iteration = j = 0, len = path.length; j < len; iteration = ++j) {
        depthSelector = path[iteration];
        conjunction = depthSelector.match(/(^|\.|\#)[A-Za-z0-9\-_]+/g);
        tag = "div";
        classes = [];
        id = null;
        for (l = 0, len1 = conjunction.length; l < len1; l++) {
          expression = conjunction[l];
          switch (expression[0]) {
            case ".":
              classes.push(expression.substr(1));
              break;
            case "#":
              id = expression.substr(1);
              break;
            default:
              tag = expression;
          }
        }
        html = "<" + tag;
        if (classes.length) {
          html += " class=\"" + classes.join(" ") + "\"";
        }
        if (id) {
          html += " id=\"" + id + "\"";
        }
        html += ">";
        $element = $(html);
        if ($parent) {
          $element.appendTo($parent);
        }
        if (iteration === 0) {
          $root = $element;
        }
        $parent = $element;
      }
      return $root;
    };

    /***
    @function $createPlaceHolder
    @internal
     */
    $createPlaceholder = function(selector, container) {
      var $placeholder;
      if (container == null) {
        container = document.body;
      }
      $placeholder = $createElementFromSelector(selector);
      $placeholder.addClass('up-placeholder');
      $placeholder.appendTo(container);
      return $placeholder;
    };

    /***
    Returns a CSS selector that matches the given element as good as possible.
    
    This uses, in decreasing order of priority:
    
    - The element's `up-id` attribute
    - The element's ID
    - The element's name
    - The element's classes
    - The element's tag names
    
    @function up.util.selectorForElement
    @param {string|Element|jQuery}
      The element for which to create a selector.
    @experimental
     */
    selectorForElement = function(element) {
      var $element, ariaLabel, classes, id, j, klass, len, name, selector, upId;
      $element = $(element);
      selector = void 0;
      if (isSingletonElement($element)) {
        selector = elementTagName($element);
      } else if (upId = presence($element.attr("up-id"))) {
        selector = attributeSelector('up-id', upId);
      } else if (id = presence($element.attr("id"))) {
        if (id.match(/^[a-z0-9\-_]+$/i)) {
          selector = "#" + id;
        } else {
          selector = attributeSelector('id', id);
        }
      } else if (name = presence($element.attr("name"))) {
        selector = elementTagName($element) + attributeSelector('name', name);
      } else if (classes = presence(nonUpClasses($element))) {
        selector = '';
        for (j = 0, len = classes.length; j < len; j++) {
          klass = classes[j];
          selector += "." + klass;
        }
      } else if (ariaLabel = presence($element.attr("aria-label"))) {
        selector = attributeSelector('aria-label', ariaLabel);
      } else {
        selector = elementTagName($element);
      }
      return selector;
    };
    isSingletonElement = function($element) {
      return $element.is('html, body, head, title');
    };
    elementTagName = function($element) {
      return $element.prop('tagName').toLowerCase();
    };
    attributeSelector = function(attribute, value) {
      value = value.replace(/"/g, '\\"');
      return "[" + attribute + "=\"" + value + "\"]";
    };
    nonUpClasses = function($element) {
      var classString, classes;
      classString = $element.attr('class') || '';
      classes = splitValues(classString);
      return reject(classes, function(klass) {
        return klass.match(/^up-/);
      });
    };
    createElementFromHtml = function(html) {
      var parser;
      parser = new DOMParser();
      return parser.parseFromString(html, 'text/html');
    };
    assignPolyfill = function() {
      var j, key, len, source, sources, target, value;
      target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      for (j = 0, len = sources.length; j < len; j++) {
        source = sources[j];
        for (key in source) {
          if (!hasProp.call(source, key)) continue;
          value = source[key];
          target[key] = value;
        }
      }
      return target;
    };

    /***
    Merge the own properties of one or more `sources` into the `target` object.
    
    @function up.util.assign
    @param {Object} target
    @param {Array<Object>} sources...
    @stable
     */
    assign = Object.assign || assignPolyfill;
    valuesPolyfill = function(object) {
      var key, results, value;
      results = [];
      for (key in object) {
        value = object[key];
        results.push(value);
      }
      return results;
    };

    /***
    Returns an array of values of the given object.
    
    @function up.util.values
    @param {Object} object
    @return {Array<string>}
    @experimental
     */
    objectValues = Object.values || valuesPolyfill;

    /***
    Returns a new string with whitespace removed from the beginning
    and end of the given string.
    
    @param {string}
      A string that might have whitespace at the beginning and end.
    @return {string}
      The trimmed string.
    @stable
     */
    trim = $.trim;
    listBlock = function(block) {
      if (isString(block)) {
        return function(item) {
          return item[block];
        };
      } else {
        return block;
      }
    };

    /***
    Translate all items in an array to new array of items.
    
    @function up.util.map
    @param {Array<T>} array
    @param {Function(T, number): any|String} block
      A function that will be called with each element and (optional) iteration index.
    
      You can also pass a property name as a String,
      which will be collected from each item in the array.
    @return {Array}
      A new array containing the result of each function call.
    @stable
     */
    map = function(array, block) {
      var index, item, j, len, results;
      if (array.length === 0) {
        return [];
      }
      block = listBlock(block);
      results = [];
      for (index = j = 0, len = array.length; j < len; index = ++j) {
        item = array[index];
        results.push(block(item, index));
      }
      return results;
    };

    /***
    Calls the given function for each element (and, optional, index)
    of the given array.
    
    @function up.util.each
    @param {Array<T>} array
    @param {Function(T, number)} block
      A function that will be called with each element and (optional) iteration index.
    @stable
     */
    each = map;
    eachIterator = function(iterator, callback) {
      var entry, results;
      results = [];
      while ((entry = iterator.next()) && !entry.done) {
        results.push(callback(entry.value));
      }
      return results;
    };

    /***
    Calls the given function for the given number of times.
    
    @function up.util.times
    @param {number} count
    @param {Function} block
    @stable
     */
    times = function(count, block) {
      var iteration, j, ref, results;
      results = [];
      for (iteration = j = 0, ref = count - 1; 0 <= ref ? j <= ref : j >= ref; iteration = 0 <= ref ? ++j : --j) {
        results.push(block(iteration));
      }
      return results;
    };

    /***
    Returns whether the given argument is `null`.
    
    @function up.util.isNull
    @param object
    @return {boolean}
    @stable
     */
    isNull = function(object) {
      return object === null;
    };

    /***
    Returns whether the given argument is `undefined`.
    
    @function up.util.isUndefined
    @param object
    @return {boolean}
    @stable
     */
    isUndefined = function(object) {
      return object === void 0;
    };

    /***
    Returns whether the given argument is not `undefined`.
    
    @function up.util.isDefined
    @param object
    @return {boolean}
    @stable
     */
    isDefined = function(object) {
      return !isUndefined(object);
    };

    /***
    Returns whether the given argument is either `undefined` or `null`.
    
    Note that empty strings or zero are *not* considered to be "missing".
    
    For the opposite of `up.util.isMissing()` see [`up.util.isGiven()`](/up.util.isGiven).
    
    @function up.util.isMissing
    @param object
    @return {boolean}
    @stable
     */
    isMissing = function(object) {
      return isUndefined(object) || isNull(object);
    };

    /***
    Returns whether the given argument is neither `undefined` nor `null`.
    
    Note that empty strings or zero *are* considered to be "given".
    
    For the opposite of `up.util.isGiven()` see [`up.util.isMissing()`](/up.util.isMissing).
    
    @function up.util.isGiven
    @param object
    @return {boolean}
    @stable
     */
    isGiven = function(object) {
      return !isMissing(object);
    };

    /***
    Return whether the given argument is considered to be blank.
    
    This returns `true` for:
    
    - `undefined`
    - `null`
    - Empty strings
    - Empty arrays
    - An object without own enumerable properties
    
    All other arguments return `false`.
    
    @function up.util.isBlank
    @param object
    @return {boolean}
    @stable
     */
    isBlank = function(object) {
      if (isMissing(object)) {
        return true;
      }
      if (isFunction(object)) {
        return false;
      }
      if (isObject(object) && Object.keys(object).length === 0) {
        return true;
      }
      if (object.length === 0) {
        return true;
      }
      return false;
    };

    /***
    Returns the given argument if the argument is [present](/up.util.isPresent),
    otherwise returns `undefined`.
    
    @function up.util.presence
    @param object
    @param {Function(T): boolean} [tester=up.util.isPresent]
      The function that will be used to test whether the argument is present.
    @return {T|undefined}
    @stable
     */
    presence = function(object, tester) {
      if (tester == null) {
        tester = isPresent;
      }
      if (tester(object)) {
        return object;
      } else {
        return void 0;
      }
    };

    /***
    Returns whether the given argument is not [blank](/up.util.isBlank).
    
    @function up.util.isPresent
    @param object
    @return {boolean}
    @stable
     */
    isPresent = function(object) {
      return !isBlank(object);
    };

    /***
    Returns whether the given argument is a function.
    
    @function up.util.isFunction
    @param object
    @return {boolean}
    @stable
     */
    isFunction = function(object) {
      return typeof object === 'function';
    };

    /***
    Returns whether the given argument is a string.
    
    @function up.util.isString
    @param object
    @return {boolean}
    @stable
     */
    isString = function(object) {
      return typeof object === 'string' || object instanceof String;
    };

    /***
    Returns whether the given argument is a boolean value.
    
    @function up.util.isBoolean
    @param object
    @return {boolean}
    @experimental
     */
    isBoolean = function(object) {
      return typeof object === 'boolean' || object instanceof Boolean;
    };

    /***
    Returns whether the given argument is a number.
    
    Note that this will check the argument's *type*.
    It will return `false` for a string like `"123"`.
    
    @function up.util.isNumber
    @param object
    @return {boolean}
    @stable
     */
    isNumber = function(object) {
      return typeof object === 'number' || object instanceof Number;
    };

    /***
    Returns whether the given argument is an options hash,
    
    Differently from [`up.util.isObject()`], this returns false for
    functions, jQuery collections, promises, `FormData` instances and arrays.
    
    @function up.util.isOptions
    @param object
    @return {boolean}
    @internal
     */
    isOptions = function(object) {
      return typeof object === 'object' && !isNull(object) && (isUndefined(object.constructor) || object.constructor === Object);
    };

    /***
    Returns whether the given argument is an object.
    
    This also returns `true` for functions, which may behave like objects in JavaScript.
    
    @function up.util.isObject
    @param object
    @return {boolean}
    @stable
     */
    isObject = function(object) {
      var typeOfResult;
      typeOfResult = typeof object;
      return (typeOfResult === 'object' && !isNull(object)) || typeOfResult === 'function';
    };

    /***
    Returns whether the given argument is a DOM element.
    
    @function up.util.isElement
    @param object
    @return {boolean}
    @stable
     */
    isElement = function(object) {
      return !!(object && object.nodeType === 1);
    };

    /***
    Returns whether the given argument is a jQuery collection.
    
    @function up.util.isJQuery
    @param object
    @return {boolean}
    @stable
     */
    isJQuery = function(object) {
      return object instanceof jQuery;
    };

    /***
    Returns whether the given argument is an object with a `then` method.
    
    @function up.util.isPromise
    @param object
    @return {boolean}
    @stable
     */
    isPromise = function(object) {
      return isObject(object) && isFunction(object.then);
    };

    /***
    Returns whether the given argument is an array.
    
    @function up.util.isArray
    @param object
    @return {boolean}
    @stable
     */
    isArray = Array.isArray;

    /***
    Returns whether the given argument is a `FormData` instance.
    
    Always returns `false` in browsers that don't support `FormData`.
    
    @function up.util.isFormData
    @param object
    @return {boolean}
    @internal
     */
    isFormData = function(object) {
      return object instanceof FormData;
    };

    /***
    Converts the given array-like argument into an array.
    
    Returns the array.
    
    @function up.util.toArray
    @param object
    @return {Array}
    @stable
     */
    toArray = function(object) {
      return Array.prototype.slice.call(object);
    };

    /***
    Returns a shallow copy of the given array or object.
    
    @function up.util.copy
    @param {Object|Array} object
    @return {Object|Array}
    @stable
     */
    copy = function(object, deep) {
      if (isArray(object)) {
        object = object.slice();
      } else if (isOptions(object)) {
        object = assign({}, object);
      }
      return object;
    };

    /***
    If given a jQuery collection, returns the first native DOM element in the collection.
    If given a string, returns the first element matching that string.
    If given any other argument, returns the argument unchanged.
    
    @function up.util.element
    @param {jQuery|Element|String} object
    @return {Element}
    @internal
     */
    getElement = function(object) {
      if (isJQuery(object)) {
        return object.get(0);
      } else if (isString(object)) {
        return $(object).get(0);
      } else {
        return object;
      }
    };

    /***
    Creates a new object by merging together the properties from the given objects.
    
    @function up.util.merge
    @param {Array<Object>} sources...
    @return Object
    @stable
     */
    merge = function() {
      var sources;
      sources = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return assign.apply(null, [{}].concat(slice.call(sources)));
    };

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
    newOptions = function(object, defaults) {
      if (defaults) {
        return merge(defaults, object);
      } else if (object) {
        return copy(object);
      } else {
        return {};
      }
    };

    /***
    Returns the first argument that is considered [given](/up.util.isGiven).
    
    This function is useful when you have multiple option sources and the value can be boolean.
    In that case you cannot change the sources with a `||` operator
    (since that doesn't short-circuit at `false`).
    
    @function up.util.option
    @param {Array} args...
    @internal
     */
    option = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return detect(args, isGiven);
    };

    /***
    Passes each element in the given array to the given function.
    Returns the first element for which the function returns a truthy value.
    
    If no object matches, returns `undefined`.
    
    @function up.util.detect
    @param {Array<T>} array
    @param {Function(T): boolean} tester
    @return {T|undefined}
    @stable
     */
    detect = function(array, tester) {
      var element, j, len, match;
      match = void 0;
      for (j = 0, len = array.length; j < len; j++) {
        element = array[j];
        if (tester(element)) {
          match = element;
          break;
        }
      }
      return match;
    };

    /***
    Returns whether the given function returns a truthy value
    for any element in the given array.
    
    @function up.util.any
    @param {Array<T>} array
    @param {Function(T, number): boolean} tester
      A function that will be called with each element and (optional) iteration index.
    
    @return {boolean}
    @experimental
     */
    any = function(array, tester) {
      var element, index, j, len, match;
      tester = listBlock(tester);
      match = false;
      for (index = j = 0, len = array.length; j < len; index = ++j) {
        element = array[index];
        if (tester(element, index)) {
          match = true;
          break;
        }
      }
      return match;
    };

    /***
    Returns whether the given function returns a truthy value
    for all elements in the given array.
    
    @function up.util.all
    @param {Array<T>} array
    @param {Function(T, number): boolean} tester
      A function that will be called with each element and (optional) iteration index.
    
    @return {boolean}
    @experimental
     */
    all = function(array, tester) {
      var element, index, j, len, match;
      tester = listBlock(tester);
      match = true;
      for (index = j = 0, len = array.length; j < len; index = ++j) {
        element = array[index];
        if (!tester(element, index)) {
          match = false;
          break;
        }
      }
      return match;
    };

    /***
    Returns all elements from the given array that are
    neither `null` or `undefined`.
    
    @function up.util.compact
    @param {Array<T>} array
    @return {Array<T>}
    @stable
     */
    compact = function(array) {
      return select(array, isGiven);
    };

    /***
    Returns the given array without duplicates.
    
    @function up.util.uniq
    @param {Array<T>} array
    @return {Array<T>}
    @stable
     */
    uniq = function(array) {
      if (array.length < 2) {
        return array;
      }
      return setToArray(arrayToSet(array));
    };

    /***
    This function is like [`uniq`](/up.util.uniq), accept that
    the given function is invoked for each element to generate the value
    for which uniquness is computed.
    
    @function up.util.uniqBy
    @param {Array<T>} array
    @param {Function<T>: any} array
    @return {Array<T>}
    @experimental
     */
    uniqBy = function(array, mapper) {
      var set;
      if (array.length < 2) {
        return array;
      }
      mapper = listBlock(mapper);
      set = new Set();
      return select(array, function(elem, index) {
        var mapped;
        mapped = mapper(elem, index);
        if (set.has(mapped)) {
          return false;
        } else {
          set.add(mapped);
          return true;
        }
      });
    };

    /***
    @function up.util.setToArray
    @internal
     */
    setToArray = function(set) {
      var array;
      array = [];
      set.forEach(function(elem) {
        return array.push(elem);
      });
      return array;
    };

    /***
    @function up.util.arrayToSet
    @internal
     */
    arrayToSet = function(array) {
      var set;
      set = new Set();
      array.forEach(function(elem) {
        return set.add(elem);
      });
      return set;
    };

    /***
    Returns all elements from the given array that return
    a truthy value when passed to the given function.
    
    @function up.util.select
    @param {Array<T>} array
    @param {Function(T, number): boolean} tester
    @return {Array<T>}
    @stable
     */
    select = function(array, tester) {
      var matches;
      tester = listBlock(tester);
      matches = [];
      each(array, function(element, index) {
        if (tester(element, index)) {
          return matches.push(element);
        }
      });
      return matches;
    };

    /***
    Returns all elements from the given array that do not return
    a truthy value when passed to the given function.
    
    @function up.util.reject
    @param {Array<T>} array
    @param {Function(T, number): boolean} tester
    @return {Array<T>}
    @stable
     */
    reject = function(array, tester) {
      tester = listBlock(tester);
      return select(array, function(element, index) {
        return !tester(element, index);
      });
    };

    /***
    Returns the intersection of the given two arrays.
    
    Implementation is not optimized. Don't use it for large arrays.
    
    @function up.util.intersect
    @internal
     */
    intersect = function(array1, array2) {
      return select(array1, function(element) {
        return contains(array2, element);
      });
    };
    addClass = function(element, klassOrKlasses) {
      return changeClassList(element, klassOrKlasses, 'add');
    };
    removeClass = function(element, klassOrKlasses) {
      return changeClassList(element, klassOrKlasses, 'remove');
    };
    changeClassList = function(element, klassOrKlasses, fnName) {
      var classList;
      classList = getElement(element).classList;
      if (isArray(klassOrKlasses)) {
        return each(klassOrKlasses, function(klass) {
          return classList[fnName](klass);
        });
      } else {
        return classList[fnName](klassOrKlasses);
      }
    };
    addTemporaryClass = function(element, klassOrKlasses) {
      addClass(element, klassOrKlasses);
      return function() {
        return removeClass(element, klassOrKlasses);
      };
    };
    hasClass = function(element, klass) {
      var classList;
      classList = getElement(element).classList;
      return classList.contains(klass);
    };

    /***
    Returns the first [present](/up.util.isPresent) element attribute
    among the given list of attribute names.
    
    @function up.util.presentAttr
    @internal
     */
    presentAttr = function() {
      var $element, attrName, attrNames, values;
      $element = arguments[0], attrNames = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      values = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = attrNames.length; j < len; j++) {
          attrName = attrNames[j];
          results.push($element.attr(attrName));
        }
        return results;
      })();
      return detect(values, isPresent);
    };

    /***
    Waits for the given number of milliseconds, the runs the given callback.
    
    Instead of `up.util.setTimer(0, fn)` you can also use [`up.util.nextFrame(fn)`](/up.util.nextFrame).
    
    @function up.util.setTimer
    @param {number} millis
    @param {Function} callback
    @stable
     */
    setTimer = function(millis, callback) {
      return setTimeout(callback, millis);
    };

    /***
    Schedules the given function to be called in the
    next JavaScript execution frame.
    
    @function up.util.nextFrame
    @param {Function} block
    @stable
     */
    nextFrame = function(block) {
      return setTimeout(block, 0);
    };

    /***
    Queue a function to be executed in the next microtask.
    
    @function up.util.queueMicrotask
    @param {Function} task
    @internal
     */
    microtask = function(task) {
      return Promise.resolve().then(task);
    };

    /***
    Returns the last element of the given array.
    
    @function up.util.last
    @param {Array<T>} array
    @return {T}
     */
    last = function(array) {
      return array[array.length - 1];
    };

    /***
    Measures the drawable area of the document.
    
    @function up.util.clientSize
    @internal
     */
    clientSize = function() {
      var element;
      element = document.documentElement;
      return {
        width: element.clientWidth,
        height: element.clientHeight
      };
    };

    /***
    Returns the width of a scrollbar.
    
    This only runs once per page load.
    
    @function up.util.scrollbarWidth
    @internal
     */
    scrollbarWidth = memoize(function() {
      var $outer, outer, width;
      $outer = $('<div>');
      outer = $outer.get(0);
      $outer.attr('up-viewport', '');
      writeInlineStyle(outer, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100px',
        height: '100px',
        overflowY: 'scroll'
      });
      $outer.appendTo(document.body);
      width = outer.offsetWidth - outer.clientWidth;
      $outer.remove();
      return width;
    });

    /***
    Returns whether the given element is currently showing a vertical scrollbar.
    
    @function up.util.documentHasVerticalScrollbar
    @internal
     */
    documentHasVerticalScrollbar = function() {
      var $body, body, bodyOverflow, forcedHidden, forcedScroll, html;
      body = document.body;
      $body = $(body);
      html = document.documentElement;
      bodyOverflow = readComputedStyle($body, 'overflowY');
      forcedScroll = bodyOverflow === 'scroll';
      forcedHidden = bodyOverflow === 'hidden';
      return forcedScroll || (!forcedHidden && html.scrollHeight > html.clientHeight);
    };

    /***
    Temporarily sets the CSS for the given element.
    
    @function up.util.writeTemporaryStyle
    @param {jQuery} $element
    @param {Object} css
    @param {Function} [block]
      If given, the CSS is set, the block is called and
      the old CSS is restored.
    @return {Function}
      A function that restores the original CSS when called.
    @internal
     */
    writeTemporaryStyle = function(elementOrSelector, newCss, block) {
      var $element, oldStyles, restoreOldStyles;
      $element = $(elementOrSelector);
      oldStyles = readInlineStyle($element, Object.keys(newCss));
      restoreOldStyles = function() {
        return writeInlineStyle($element, oldStyles);
      };
      writeInlineStyle($element, newCss);
      if (block) {
        block();
        return restoreOldStyles();
      } else {
        return restoreOldStyles;
      }
    };

    /***
    Forces a repaint of the given element.
    
    @function up.util.forceRepaint
    @internal
     */
    forceRepaint = function(element) {
      element = getElement(element);
      return element.offsetHeight;
    };

    /***
    @function up.util.finishTransition
    @internal
     */
    concludeCssTransition = function(element) {
      var undo;
      undo = writeTemporaryStyle(element, {
        transition: 'none'
      });
      forceRepaint(element);
      return undo;
    };

    /***
    @internal
     */
    margins = function(selectorOrElement) {
      var element;
      element = getElement(selectorOrElement);
      return {
        top: readComputedStyleNumber(element, 'marginTop'),
        right: readComputedStyleNumber(element, 'marginRight'),
        bottom: readComputedStyleNumber(element, 'marginBottom'),
        left: readComputedStyleNumber(element, 'marginLeft')
      };
    };

    /***
    Measures the given element.
    
    @function up.util.measure
    @internal
     */
    measure = function($element, opts) {
      var $context, box, contextCoords, coordinates, elementCoords, mgs;
      opts = newOptions(opts, {
        relative: false,
        inner: false,
        includeMargin: false
      });
      if (opts.relative) {
        if (opts.relative === true) {
          coordinates = $element.position();
        } else {
          $context = $(opts.relative);
          elementCoords = $element.offset();
          if ($context.is(document)) {
            coordinates = elementCoords;
          } else {
            contextCoords = $context.offset();
            coordinates = {
              left: elementCoords.left - contextCoords.left,
              top: elementCoords.top - contextCoords.top
            };
          }
        }
      } else {
        coordinates = $element.offset();
      }
      box = {
        left: coordinates.left,
        top: coordinates.top
      };
      if (opts.inner) {
        box.width = $element.width();
        box.height = $element.height();
      } else {
        box.width = $element.outerWidth();
        box.height = $element.outerHeight();
      }
      if (opts.includeMargin) {
        mgs = margins($element);
        box.left -= mgs.left;
        box.top -= mgs.top;
        box.height += mgs.top + mgs.bottom;
        box.width += mgs.left + mgs.right;
      }
      return box;
    };

    /***
    Copies all attributes from the source element to the target element.
    
    @function up.util.copyAttributes
    @internal
     */
    copyAttributes = function($source, $target) {
      var attr, j, len, ref, results;
      ref = $source.get(0).attributes;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        attr = ref[j];
        if (attr.specified) {
          results.push($target.attr(attr.name, attr.value));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    /***
    Looks for the given selector in the element and its descendants.
    
    @function up.util.selectInSubtree
    @internal
     */
    selectInSubtree = function($element, selector) {
      var $matches;
      $matches = $();
      if ($element.is(selector)) {
        $matches = $matches.add($element);
      }
      $matches = $matches.add($element.find(selector));
      return $matches;
    };

    /***
    Looks for the given selector in the element, its descendants and its ancestors.
    
    @function up.util.selectInDynasty
    @internal
     */
    selectInDynasty = function($element, selector) {
      var $ancestors, $subtree;
      $subtree = selectInSubtree($element, selector);
      $ancestors = $element.parents(selector);
      return $subtree.add($ancestors);
    };

    /***
    Returns whether the given keyboard event involved the ESC key.
    
    @function up.util.escapePressed
    @internal
     */
    escapePressed = function(event) {
      return event.keyCode === 27;
    };

    /***
    Returns whether the given array or string contains the given element or substring.
    
    @function up.util.contains
    @param {Array|string} arrayOrString
    @param elementOrSubstring
    @stable
     */
    contains = function(arrayOrString, elementOrSubstring) {
      return arrayOrString.indexOf(elementOrSubstring) >= 0;
    };

    /***
    @function up.util.castedAttr
    @internal
     */
    castedAttr = function($element, attribute) {
      var value;
      value = $element.attr(attribute);
      switch (value) {
        case 'false':
          return false;
        case 'true':
        case '':
        case attribute:
          return true;
        default:
          return value;
      }
    };

    /***
    @function up.util.jsonAttr
    @internal
     */
    jsonAttr = function(elementOrSelector, attribute) {
      var element, json;
      if (element = getElement(elementOrSelector)) {
        json = typeof element.getAttribute === "function" ? element.getAttribute(attribute) : void 0;
        if (isString(json) && trim(json) !== '') {
          return JSON.parse(json);
        }
      }
    };

    /***
    Returns a copy of the given object that only contains
    the given properties.
    
    @function up.util.only
    @param {Object} object
    @param {Array} keys...
    @stable
     */
    only = function() {
      var filtered, j, len, object, properties, property;
      object = arguments[0], properties = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      filtered = {};
      for (j = 0, len = properties.length; j < len; j++) {
        property = properties[j];
        if (property in object) {
          filtered[property] = object[property];
        }
      }
      return filtered;
    };

    /***
    Returns a copy of the given object that contains all except
    the given properties.
    
    @function up.util.except
    @param {Object} object
    @param {Array} keys...
    @stable
     */
    except = function() {
      var filtered, j, len, object, properties, property;
      object = arguments[0], properties = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      filtered = copy(object);
      for (j = 0, len = properties.length; j < len; j++) {
        property = properties[j];
        delete filtered[property];
      }
      return filtered;
    };

    /***
    @function up.util.isUnmodifiedKeyEvent
    @internal
     */
    isUnmodifiedKeyEvent = function(event) {
      return !(event.metaKey || event.shiftKey || event.ctrlKey);
    };

    /***
    @function up.util.isUnmodifiedMouseEvent
    @internal
     */
    isUnmodifiedMouseEvent = function(event) {
      var isLeftButton;
      isLeftButton = isUndefined(event.button) || event.button === 0;
      return isLeftButton && isUnmodifiedKeyEvent(event);
    };

    /***
    Returns a promise that will never be resolved.
    
    @function up.util.unresolvablePromise
    @experimental
     */
    unresolvablePromise = function() {
      return new Promise(noop);
    };

    /***
    Returns an empty jQuery collection.
    
    @function up.util.nullJQuery
    @internal
     */
    nullJQuery = function() {
      return $();
    };

    /***
    On the given element, set attributes that are still missing.
    
    @function up.util.setMissingAttrs
    @internal
     */
    setMissingAttrs = function($element, attrs) {
      var key, results, value;
      results = [];
      for (key in attrs) {
        value = attrs[key];
        if (isMissing($element.attr(key))) {
          results.push($element.attr(key, value));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    /***
    Removes the given element from the given array.
    
    This changes the given array.
    
    @function up.util.remove
    @param {Array<T>} array
    @param {T} element
    @stable
     */
    remove = function(array, element) {
      var index;
      index = array.indexOf(element);
      if (index >= 0) {
        array.splice(index, 1);
        return element;
      }
    };

    /***
    If the given `value` is a function, calls the function with the given `args`.
    Otherwise it just returns `value`.
    
    @function up.util.evalOption
    @internal
     */
    evalOption = function() {
      var args, value;
      value = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (isFunction(value)) {
        return value.apply(null, args);
      } else {
        return value;
      }
    };

    /***
    @function up.util.config
    @param {Object|Function} blueprint
      Default configuration options.
      Will be restored by calling `reset` on the returned object.
    @return {Object}
      An object with a `reset` function.
    @internal
     */
    config = function(blueprint) {
      var hash;
      hash = openConfig(blueprint);
      Object.preventExtensions(hash);
      return hash;
    };

    /***
    @function up.util.openConfig
    @internal
     */
    openConfig = function(blueprint) {
      var hash;
      if (blueprint == null) {
        blueprint = {};
      }
      hash = {};
      hash.reset = function() {
        var opts;
        opts = blueprint;
        if (isFunction(opts)) {
          opts = opts();
        }
        return assign(hash, opts);
      };
      hash.reset();
      return hash;
    };

    /***
    @function up.util.unwrapElement
    @internal
     */
    unwrapElement = function(wrapper) {
      var parent, wrappedNodes;
      wrapper = getElement(wrapper);
      parent = wrapper.parentNode;
      wrappedNodes = toArray(wrapper.childNodes);
      each(wrappedNodes, function(wrappedNode) {
        return parent.insertBefore(wrappedNode, wrapper);
      });
      return parent.removeChild(wrapper);
    };

    /***
    @function up.util.offsetParent
    @internal
     */
    offsetParent = function($element) {
      var $match, position;
      $match = void 0;
      while (($element = $element.parent()) && $element.length) {
        position = readComputedStyle($element, 'position');
        if (position === 'absolute' || position === 'relative' || $element.is('body')) {
          $match = $element;
          break;
        }
      }
      return $match;
    };

    /***
    Returns if the given element has a `fixed` position.
    
    @function up.util.isFixed
    @internal
     */
    isFixed = function(element) {
      var $element, position;
      $element = $(element);
      while (true) {
        position = readComputedStyle($element, 'position');
        if (position === 'fixed') {
          return true;
        } else {
          $element = $element.parent();
          if ($element.length === 0 || $element.is(document)) {
            return false;
          }
        }
      }
    };

    /***
    @function up.util.fixedToAbsolute
    @internal
     */
    fixedToAbsolute = function(element, $viewport) {
      var $element, $futureOffsetParent, elementCoords, futureParentCoords;
      $element = $(element);
      $futureOffsetParent = offsetParent($element);
      elementCoords = $element.position();
      futureParentCoords = $futureOffsetParent.offset();
      return writeInlineStyle($element, {
        position: 'absolute',
        left: elementCoords.left - futureParentCoords.left,
        top: elementCoords.top - futureParentCoords.top + $viewport.scrollTop(),
        right: '',
        bottom: ''
      });
    };

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
    fail = function() {
      var args, asString, messageArgs, ref, ref1, toastOptions;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (isArray(args[0])) {
        messageArgs = args[0];
        toastOptions = args[1] || {};
      } else {
        messageArgs = args;
        toastOptions = {};
      }
      (ref = up.log).error.apply(ref, messageArgs);
      whenReady().then(function() {
        return up.toast.open(messageArgs, toastOptions);
      });
      asString = (ref1 = up.browser).sprintf.apply(ref1, messageArgs);
      throw new Error(asString);
    };
    ESCAPE_HTML_ENTITY_MAP = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;'
    };

    /***
    Escapes the given string of HTML by replacing control chars with their HTML entities.
    
    @function up.util.escapeHtml
    @param {string} string
      The text that should be escaped
    @experimental
     */
    escapeHtml = function(string) {
      return string.replace(/[&<>"]/g, function(char) {
        return ESCAPE_HTML_ENTITY_MAP[char];
      });
    };
    pluckKey = function(object, key) {
      var value;
      value = object[key];
      delete object[key];
      return value;
    };
    renameKey = function(object, oldKey, newKey) {
      return object[newKey] = pluckKey(object, oldKey);
    };
    deprecateRenamedKey = function(object, oldKey, newKey) {
      if (isDefined(object[oldKey])) {
        up.warn('Deprecated: Object key { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object);
        return renameKey(object, oldKey, newKey);
      }
    };
    pluckData = function(elementOrSelector, key) {
      var $element, value;
      $element = $(elementOrSelector);
      value = $element.data(key);
      $element.removeData(key);
      return value;
    };
    extractOptions = function(args) {
      var lastArg;
      lastArg = last(args);
      if (isOptions(lastArg)) {
        return args.pop();
      } else {
        return {};
      }
    };
    CASE_CONVERSION_GROUP = /[^\-\_]+?(?=[A-Z\-\_]|$)/g;
    convertCase = function(string, separator, fn) {
      var parts;
      parts = string.match(CASE_CONVERSION_GROUP);
      parts = map(parts, fn);
      return parts.join(separator);
    };

    /***
    Returns a copy of the given string that is transformed to `kebab-case`.
    
    @function up.util.kebabCase
    @param {string} string
    @return {string}
    @internal
     */
    kebabCase = function(string) {
      return convertCase(string, '-', function(part) {
        return part.toLowerCase();
      });
    };

    /***
    Returns a copy of the given string that is transformed to `camelCase`.
    
    @function up.util.camelCase
    @param {string} string
    @return {string}
    @internal
     */
    camelCase = function(string) {
      return convertCase(string, '', function(part, i) {
        if (i === 0) {
          return part.toLowerCase();
        } else {
          return part.charAt(0).toUpperCase() + part.substr(1).toLowerCase();
        }
      });
    };

    /***
    Returns a copy of the given object with all keys renamed
    in `kebab-case`.
    
    Does not change the given object.
    
    @function up.util.kebabCaseKeys
    @param {object} obj
    @return {object}
    @internal
     */
    kebabCaseKeys = function(obj) {
      return copyWithRenamedKeys(obj, kebabCase);
    };

    /***
    Returns a copy of the given object with all keys renamed
    in `camelCase`.
    
    Does not change the given object.
    
    @function up.util.camelCaseKeys
    @param {object} obj
    @return {object}
    @internal
     */
    camelCaseKeys = function(obj) {
      return copyWithRenamedKeys(obj, camelCase);
    };
    copyWithRenamedKeys = function(obj, keyTransformer) {
      var k, result, v;
      result = {};
      for (k in obj) {
        v = obj[k];
        k = keyTransformer(k);
        result[k] = v;
      }
      return result;
    };
    opacity = function(element) {
      return readComputedStyleNumber(element, 'opacity');
    };
    whenReady = memoize(function() {
      if ($.isReady) {
        return Promise.resolve();
      } else {
        return new Promise(function(resolve) {
          return $(resolve);
        });
      }
    });
    identity = function(arg) {
      return arg;
    };

    /***
    Returns whether the given element has been detached from the DOM
    (or whether it was never attached).
    
    @function up.util.isDetached
    @internal
     */
    isDetached = function(element) {
      element = getElement(element);
      return !$.contains(document.documentElement, element);
    };

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
    previewable = function(fun) {
      var deferred, preview;
      deferred = newDeferred();
      preview = function() {
        var args, funValue;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        funValue = fun.apply(null, args);
        deferred.resolve(funValue);
        return funValue;
      };
      preview.promise = deferred.promise();
      return preview;
    };

    /***
    A linear task queue whose (2..n)th tasks can be changed at any time.
    
    @function up.util.DivertibleChain
    @internal
     */
    DivertibleChain = (function() {
      function DivertibleChain() {
        this.asap = bind(this.asap, this);
        this.poke = bind(this.poke, this);
        this.allTasks = bind(this.allTasks, this);
        this.promise = bind(this.promise, this);
        this.reset = bind(this.reset, this);
        this.reset();
      }

      DivertibleChain.prototype.reset = function() {
        this.queue = [];
        return this.currentTask = void 0;
      };

      DivertibleChain.prototype.promise = function() {
        var lastTask;
        lastTask = last(this.allTasks());
        return (lastTask != null ? lastTask.promise : void 0) || Promise.resolve();
      };

      DivertibleChain.prototype.allTasks = function() {
        var tasks;
        tasks = [];
        if (this.currentTask) {
          tasks.push(this.currentTask);
        }
        tasks = tasks.concat(this.queue);
        return tasks;
      };

      DivertibleChain.prototype.poke = function() {
        var promise;
        if (!this.currentTask) {
          if (this.currentTask = this.queue.shift()) {
            promise = this.currentTask();
            return always(promise, (function(_this) {
              return function() {
                _this.currentTask = void 0;
                return _this.poke();
              };
            })(this));
          }
        }
      };

      DivertibleChain.prototype.asap = function() {
        var newTasks;
        newTasks = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        this.queue = map(newTasks, previewable);
        this.poke();
        return this.promise();
      };

      return DivertibleChain;

    })();

    /***
    @function up.util.submittedValue
    @internal
     */
    submittedValue = function(fieldOrSelector) {
      var $field;
      $field = $(fieldOrSelector);
      if ($field.is('[type=checkbox], [type=radio]') && !$field.is(':checked')) {
        return void 0;
      } else {
        return $field.val();
      }
    };

    /***
    @function up.util.sequence
    @param {Array<Function>} functions...
    @return {Function}
      A function that will call all `functions` if called.
    
    @internal
     */
    sequence = function() {
      var functions;
      functions = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return function() {
        return map(functions, function(f) {
          return f();
        });
      };
    };

    /***
    @function up.util.promiseTimer
    @internal
     */
    promiseTimer = function(ms) {
      var promise, timeout;
      timeout = void 0;
      promise = new Promise(function(resolve, reject) {
        return timeout = setTimer(ms, resolve);
      });
      promise.cancel = function() {
        return clearTimeout(timeout);
      };
      return promise;
    };

    /***
    Returns `'left'` if the center of the given element is in the left 50% of the screen.
    Otherwise returns `'right'`.
    
    @function up.util.horizontalScreenHalf
    @internal
     */
    horizontalScreenHalf = function($element) {
      var elementDims, elementMid, screenDims, screenMid;
      elementDims = measure($element);
      screenDims = clientSize();
      elementMid = elementDims.left + 0.5 * elementDims.width;
      screenMid = 0.5 * screenDims.width;
      if (elementMid < screenMid) {
        return 'left';
      } else {
        return 'right';
      }
    };

    /***
    Like `$old.replaceWith($new)`, but keeps event handlers bound to `$old`.
    
    Note that this is a memory leak unless you re-attach `$old` to the DOM aferwards.
    
    @function up.util.detachWith
    @internal
     */
    detachWith = function($old, $new) {
      var $insertion;
      $insertion = $('<div></div>');
      $insertion.insertAfter($old);
      $old.detach();
      $insertion.replaceWith($new);
      return $old;
    };

    /***
    Hides the given element faster than `jQuery.fn.hide()`.
    
    @function up.util.hide
    @param {jQuery|Element} element
     */
    hide = function(element) {
      return writeInlineStyle(element, {
        display: 'none'
      });
    };

    /***
    Gets the computed style(s) for the given element.
    
    @function up.util.readComputedStyle
    @param {jQuery|Element} element
    @param {String|Array} propOrProps
      One or more CSS property names in camelCase.
    @return {string|object}
    @internal
     */
    readComputedStyle = function(element, props) {
      var style;
      element = getElement(element);
      style = window.getComputedStyle(element);
      return extractFromStyleObject(style, props);
    };

    /***
    Gets a computed style value for the given element.
    If a value is set, the value is parsed to a number before returning.
    
    @function up.util.readComputedStyleNumber
    @param {jQuery|Element} element
    @param {String} prop
      A CSS property name in camelCase.
    @return {string|object}
    @internal
     */
    readComputedStyleNumber = function(element, prop) {
      var rawValue;
      rawValue = readComputedStyle(element, prop);
      if (isGiven(rawValue)) {
        return parseFloat(rawValue);
      } else {
        return void 0;
      }
    };

    /***
    Gets the given inline style(s) from the given element's `[style]` attribute.
    
    @function up.util.readInlineStyle
    @param {jQuery|Element} element
    @param {String|Array} propOrProps
      One or more CSS property names in camelCase.
    @return {string|object}
    @internal
     */
    readInlineStyle = function(element, props) {
      var style;
      element = getElement(element);
      style = element.style;
      return extractFromStyleObject(style, props);
    };
    extractFromStyleObject = function(style, keyOrKeys) {
      if (isString(keyOrKeys)) {
        return style[keyOrKeys];
      } else {
        return only.apply(null, [style].concat(slice.call(keyOrKeys)));
      }
    };

    /***
    Merges the given inline style(s) into the given element's `[style]` attribute.
    
    @function up.util.readInlineStyle
    @param {jQuery|Element} element
    @param {Object} props
      One or more CSS properties with camelCase keys.
    @return {string|object}
    @internal
     */
    writeInlineStyle = function(element, props) {
      var key, results, style, value;
      element = getElement(element);
      style = element.style;
      results = [];
      for (key in props) {
        value = props[key];
        value = normalizeStyleValueForWrite(key, value);
        results.push(style[key] = value);
      }
      return results;
    };
    normalizeStyleValueForWrite = function(key, value) {
      if (isMissing(value)) {
        value = '';
      } else if (CSS_LENGTH_PROPS.has(key)) {
        value = cssLength(value);
      }
      return value;
    };
    CSS_LENGTH_PROPS = arrayToSet(['top', 'right', 'bottom', 'left', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight']);

    /***
    Converts the given value to a CSS length value, adding a `px` unit if required.
    
    @function up.util.cssLength
    @internal
     */
    cssLength = function(obj) {
      if (isNumber(obj) || (isString(obj) && /^\d+$/.test(obj))) {
        return obj.toString() + "px";
      } else {
        return obj;
      }
    };

    /***
    Returns whether the given element has a CSS transition set.
    
    @function up.util.hasCssTransition
    @return {boolean}
    @internal
     */
    hasCssTransition = function(elementOrStyleHash) {
      var duration, element, noTransition, prop, style;
      if (isOptions(elementOrStyleHash)) {
        style = elementOrStyleHash;
      } else {
        element = getElement(element);
        style = getComputedStyle(element);
      }
      prop = style.transitionProperty;
      duration = style.transitionDuration;
      noTransition = prop === 'none' || (prop === 'all' && duration === 0);
      return !noTransition;
    };

    /***
    Flattens the given `array` a single level deep.
    
    @function up.util.flatten
    @param {Array} array
      An array which might contain other arrays
    @return {Array}
      The flattened array
    @internal
     */
    flatten = function(array) {
      var flattened, j, len, object;
      flattened = [];
      for (j = 0, len = array.length; j < len; j++) {
        object = array[j];
        if (isArray(object)) {
          flattened = flattened.concat(object);
        } else {
          flattened.push(object);
        }
      }
      return flattened;
    };
    flatMap = function(array, block) {
      return flatten(map(array, block));
    };

    /***
    Returns whether the given value is truthy.
    
    @function up.util.isTruthy
    @internal
     */
    isTruthy = function(object) {
      return !!object;
    };

    /***
    Sets the given callback as both fulfillment and rejection handler for the given promise.
    
    @function up.util.always
    @internal
     */
    always = function(promise, callback) {
      return promise.then(callback, callback);
    };

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
    muteRejection = function(promise) {
      return promise != null ? promise["catch"](noop) : void 0;
    };

    /***
    @function up.util.newDeferred
    @internal
     */

    /***
    @function up.util.newDeferred
    @internal
     */
    newDeferred = function() {
      var nativePromise, rejectFn, resolveFn;
      resolveFn = void 0;
      rejectFn = void 0;
      nativePromise = new Promise(function(givenResolve, givenReject) {
        resolveFn = givenResolve;
        return rejectFn = givenReject;
      });
      nativePromise.resolve = resolveFn;
      nativePromise.reject = rejectFn;
      nativePromise.promise = function() {
        return nativePromise;
      };
      return nativePromise;
    };

    /***
    Calls the given block. If the block throws an exception,
    a rejected promise is returned instead.
    
    @function up.util.rejectOnError
    @internal
     */
    rejectOnError = function(block) {
      var error;
      try {
        return block();
      } catch (error1) {
        error = error1;
        return Promise.reject(error);
      }
    };
    sum = function(list, block) {
      var entry, entryValue, j, len, totalValue;
      block = listBlock(block);
      totalValue = 0;
      for (j = 0, len = list.length; j < len; j++) {
        entry = list[j];
        entryValue = block(entry);
        if (isGiven(entryValue)) {
          totalValue += entryValue;
        }
      }
      return totalValue;
    };

    /***
    Returns whether the given element is a descendant of the `<body>` element.
    
    @function up.util.isBodyDescendant
    @internal
     */
    isBodyDescendant = function(element) {
      return $(element).parents('body').length > 0;
    };
    isBasicObjectProperty = function(k) {
      return Object.prototype.hasOwnProperty(k);
    };
    isEqual = function(a, b) {
      if (typeof a !== typeof b) {
        return false;
      } else if (isArray(a)) {
        return a.length === b.length && all(a, function(elem, index) {
          return isEqual(elem, b[index]);
        });
      } else if (isObject(a)) {
        return fail('isEqual cannot compare objects yet');
      } else {
        return a === b;
      }
    };
    splitValues = function(string, separator) {
      var values;
      if (separator == null) {
        separator = ' ';
      }
      values = string.split(separator);
      values = map(values, trim);
      values = select(values, isPresent);
      return values;
    };
    return {
      offsetParent: offsetParent,
      fixedToAbsolute: fixedToAbsolute,
      isFixed: isFixed,
      presentAttr: presentAttr,
      parseUrl: parseUrl,
      normalizeUrl: normalizeUrl,
      normalizeMethod: normalizeMethod,
      methodAllowsPayload: methodAllowsPayload,
      createElementFromHtml: createElementFromHtml,
      $createElementFromSelector: $createElementFromSelector,
      $createPlaceholder: $createPlaceholder,
      selectorForElement: selectorForElement,
      attributeSelector: attributeSelector,
      assign: assign,
      assignPolyfill: assignPolyfill,
      copy: copy,
      merge: merge,
      options: newOptions,
      option: option,
      fail: fail,
      each: each,
      eachIterator: eachIterator,
      map: map,
      flatMap: flatMap,
      times: times,
      any: any,
      all: all,
      detect: detect,
      select: select,
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
      isUnmodifiedKeyEvent: isUnmodifiedKeyEvent,
      isUnmodifiedMouseEvent: isUnmodifiedMouseEvent,
      nullJQuery: nullJQuery,
      element: getElement,
      setTimer: setTimer,
      nextFrame: nextFrame,
      measure: measure,
      addClass: addClass,
      removeClass: removeClass,
      hasClass: hasClass,
      addTemporaryClass: addTemporaryClass,
      writeTemporaryStyle: writeTemporaryStyle,
      forceRepaint: forceRepaint,
      concludeCssTransition: concludeCssTransition,
      escapePressed: escapePressed,
      copyAttributes: copyAttributes,
      selectInSubtree: selectInSubtree,
      selectInDynasty: selectInDynasty,
      contains: contains,
      toArray: toArray,
      castedAttr: castedAttr,
      jsonAttr: jsonAttr,
      clientSize: clientSize,
      only: only,
      except: except,
      trim: trim,
      unresolvablePromise: unresolvablePromise,
      setMissingAttrs: setMissingAttrs,
      remove: remove,
      memoize: memoize,
      scrollbarWidth: scrollbarWidth,
      documentHasVerticalScrollbar: documentHasVerticalScrollbar,
      config: config,
      openConfig: openConfig,
      unwrapElement: unwrapElement,
      camelCase: camelCase,
      camelCaseKeys: camelCaseKeys,
      kebabCase: kebabCase,
      kebabCaseKeys: kebabCaseKeys,
      error: fail,
      pluckData: pluckData,
      pluckKey: pluckKey,
      renameKey: renameKey,
      deprecateRenamedKey: deprecateRenamedKey,
      extractOptions: extractOptions,
      isDetached: isDetached,
      noop: noop,
      asyncNoop: asyncNoop,
      opacity: opacity,
      whenReady: whenReady,
      identity: identity,
      escapeHtml: escapeHtml,
      DivertibleChain: DivertibleChain,
      submittedValue: submittedValue,
      sequence: sequence,
      promiseTimer: promiseTimer,
      previewable: previewable,
      evalOption: evalOption,
      horizontalScreenHalf: horizontalScreenHalf,
      detachWith: detachWith,
      flatten: flatten,
      isTruthy: isTruthy,
      isSingletonElement: isSingletonElement,
      newDeferred: newDeferred,
      always: always,
      muteRejection: muteRejection,
      rejectOnError: rejectOnError,
      isBodyDescendant: isBodyDescendant,
      isBasicObjectProperty: isBasicObjectProperty,
      isCrossDomain: isCrossDomain,
      microtask: microtask,
      isEqual: isEqual,
      hide: hide,
      cssLength: cssLength,
      readComputedStyle: readComputedStyle,
      readComputedStyleNumber: readComputedStyleNumber,
      readInlineStyle: readInlineStyle,
      writeInlineStyle: writeInlineStyle,
      hasCssTransition: hasCssTransition,
      splitValues: splitValues,
      sum: sum,
      values: objectValues
    };
  })(jQuery);

  up.fail = up.util.fail;

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  u = up.util;


  /***
  @class up.Cache
  @internal
   */

  up.Cache = (function() {

    /***
    @constructor
    @param {number|Function() :number} [config.size]
      Maximum number of cache entries.
      Set to `undefined` to not limit the cache size.
    @param {number|Function(): number} [config.expiry]
      The number of milliseconds after which a cache entry
      will be discarded.
    @param {string} [config.logPrefix]
      A prefix for log entries printed by this cache object.
    @param {Function(any): string} [config.key]
      A function that takes an argument and returns a string key
      for storage. If omitted, `toString()` is called on the argument.
    @param {Function(any): boolean} [config.cachable]
      A function that takes a potential cache entry and returns whether
      this entry  can be stored in the hash. If omitted, all entries are considered
      cachable.
     */
    function Cache(config) {
      this.config = config != null ? config : {};
      this.get = bind(this.get, this);
      this.isFresh = bind(this.isFresh, this);
      this.remove = bind(this.remove, this);
      this.set = bind(this.set, this);
      this.timestamp = bind(this.timestamp, this);
      this.alias = bind(this.alias, this);
      this.makeRoomForAnotherKey = bind(this.makeRoomForAnotherKey, this);
      this.keys = bind(this.keys, this);
      this.log = bind(this.log, this);
      this.clear = bind(this.clear, this);
      this.isCachable = bind(this.isCachable, this);
      this.isEnabled = bind(this.isEnabled, this);
      this.normalizeStoreKey = bind(this.normalizeStoreKey, this);
      this.expiryMillis = bind(this.expiryMillis, this);
      this.maxKeys = bind(this.maxKeys, this);
      this.store = this.config.store || new up.store.Memory();
    }

    Cache.prototype.maxKeys = function() {
      return u.evalOption(this.config.size);
    };

    Cache.prototype.expiryMillis = function() {
      return u.evalOption(this.config.expiry);
    };

    Cache.prototype.normalizeStoreKey = function(key) {
      if (this.config.key) {
        return this.config.key(key);
      } else {
        return key.toString();
      }
    };

    Cache.prototype.isEnabled = function() {
      return this.maxKeys() !== 0 && this.expiryMillis() !== 0;
    };

    Cache.prototype.isCachable = function(key) {
      if (this.config.cachable) {
        return this.config.cachable(key);
      } else {
        return true;
      }
    };

    Cache.prototype.clear = function() {
      return this.store.clear();
    };

    Cache.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (this.config.logPrefix) {
        args[0] = "[" + this.config.logPrefix + "] " + args[0];
        return up.puts.apply(up, args);
      }
    };

    Cache.prototype.keys = function() {
      return this.store.keys();
    };

    Cache.prototype.makeRoomForAnotherKey = function() {
      var max, oldestKey, oldestTimestamp, storeKeys;
      storeKeys = u.copy(this.keys());
      max = this.maxKeys();
      if (max && storeKeys.length >= max) {
        oldestKey = void 0;
        oldestTimestamp = void 0;
        u.each(storeKeys, (function(_this) {
          return function(key) {
            var entry, timestamp;
            entry = _this.store.get(key);
            timestamp = entry.timestamp;
            if (!oldestTimestamp || oldestTimestamp > timestamp) {
              oldestKey = key;
              return oldestTimestamp = timestamp;
            }
          };
        })(this));
        if (oldestKey) {
          return this.store.remove(oldestKey);
        }
      }
    };

    Cache.prototype.alias = function(oldKey, newKey) {
      var value;
      value = this.get(oldKey, {
        silent: true
      });
      if (u.isDefined(value)) {
        return this.set(newKey, value);
      }
    };

    Cache.prototype.timestamp = function() {
      return (new Date()).valueOf();
    };

    Cache.prototype.set = function(key, value) {
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

    Cache.prototype.remove = function(key) {
      var storeKey;
      if (this.isCachable(key)) {
        storeKey = this.normalizeStoreKey(key);
        return this.store.remove(storeKey);
      }
    };

    Cache.prototype.isFresh = function(entry) {
      var millis, timeSinceTouch;
      millis = this.expiryMillis();
      if (millis) {
        timeSinceTouch = this.timestamp() - entry.timestamp;
        return timeSinceTouch < millis;
      } else {
        return true;
      }
    };

    Cache.prototype.get = function(key, options) {
      var entry;
      if (options == null) {
        options = {};
      }
      if (this.isCachable(key) && (entry = this.store.get(this.normalizeStoreKey(key)))) {
        if (this.isFresh(entry)) {
          if (!options.silent) {
            this.log("Cache hit for '%s'", key);
          }
          return entry.value;
        } else {
          if (!options.silent) {
            this.log("Discarding stale cache entry for '%s'", key);
          }
          this.remove(key);
          return void 0;
        }
      } else {
        if (!options.silent) {
          this.log("Cache miss for '%s'", key);
        }
        return void 0;
      }
    };

    return Cache;

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  u = up.util;

  up.Record = (function() {
    Record.prototype.fields = function() {
      throw 'Return an array of property names';
    };

    function Record(options) {
      this.copy = bind(this.copy, this);
      this.attributes = bind(this.attributes, this);
      u.assign(this, this.attributes(options));
    }

    Record.prototype.attributes = function(source) {
      if (source == null) {
        source = this;
      }
      return u.only.apply(u, [source].concat(slice.call(this.fields())));
    };

    Record.prototype.copy = function(changes) {
      var attributesWithChanges;
      if (changes == null) {
        changes = {};
      }
      attributesWithChanges = u.merge(this.attributes(), changes);
      return new this.constructor(attributesWithChanges);
    };

    return Record;

  })();

}).call(this);
(function() {
  var u;

  u = up.util;

  up.CompilePass = (function() {
    function CompilePass($root, compilers, options) {
      this.$root = $root;
      this.compilers = compilers;
      if (options == null) {
        options = {};
      }
      this.root = this.$root[0];
      this.$skipSubtrees = $(options.skip);
      if (!(this.$skipSubtrees.length && this.root.querySelector('[up-keep]'))) {
        this.$skipSubtrees = void 0;
      }
    }

    CompilePass.prototype.compile = function() {
      return up.log.group("Compiling fragment %o", this.root, (function(_this) {
        return function() {
          var compiler, i, len, ref, results;
          ref = _this.compilers;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            compiler = ref[i];
            results.push(_this.runCompiler(compiler));
          }
          return results;
        };
      })(this));
    };

    CompilePass.prototype.runCompiler = function(compiler) {
      var $matches;
      $matches = this.$select(compiler.selector);
      if (!$matches.length) {
        return;
      }
      return up.log.group((!compiler.isSystem ? "Compiling '%s' on %d element(s)" : void 0), compiler.selector, $matches.length, (function(_this) {
        return function() {
          var i, keepValue, len, match, value;
          if (compiler.batch) {
            _this.compileBatch(compiler, $matches);
          } else {
            for (i = 0, len = $matches.length; i < len; i++) {
              match = $matches[i];
              _this.compileOneElement(compiler, $(match));
            }
          }
          if (keepValue = compiler.keep) {
            value = u.isString(keepValue) ? keepValue : '';
            return $matches.attr('up-keep', value);
          }
        };
      })(this));
    };

    CompilePass.prototype.compileOneElement = function(compiler, $element) {
      var compileArgs, data, destructor, result;
      compileArgs = [$element];
      if (compiler.length !== 1) {
        data = up.syntax.data($element);
        compileArgs.push(data);
      }
      result = compiler.apply($element[0], compileArgs);
      if (destructor = this.normalizeDestructor(result)) {
        return up.syntax.destructor($element, destructor);
      }
    };

    CompilePass.prototype.compileBatch = function(compiler, $elements) {
      var compileArgs, dataList, result;
      compileArgs = [$elements];
      if (compiler.length !== 1) {
        dataList = u.map($elements, up.syntax.data);
        compileArgs.push(dataList);
      }
      result = compiler.apply($elements.get(), compileArgs);
      if (this.normalizeDestructor(result)) {
        return up.fail('Compilers with { batch: true } cannot return destructors');
      }
    };

    CompilePass.prototype.normalizeDestructor = function(result) {
      if (u.isFunction(result)) {
        return result;
      } else if (u.isArray(result) && u.all(result, u.isFunction)) {
        up.warn('up.compiler(): Returning an array of destructor functions is deprecated. Return a single function instead.');
        return u.sequence.apply(u, result);
      }
    };

    CompilePass.prototype.$select = function(selector) {
      var $matches, $skipSubtrees;
      if (u.isFunction(selector)) {
        selector = selector();
      }
      $matches = u.selectInSubtree(this.$root, selector);
      if ($skipSubtrees = this.$skipSubtrees) {
        $matches = $matches.filter(function() {
          var $match;
          $match = $(this);
          return $match.closest($skipSubtrees).length === 0;
        });
      }
      return $matches;
    };

    return CompilePass;

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  u = up.util;

  up.CssTransition = (function() {
    function CssTransition($element, lastFrame, options) {
      this.startMotion = bind(this.startMotion, this);
      this.resumeOldTransition = bind(this.resumeOldTransition, this);
      this.pauseOldTransition = bind(this.pauseOldTransition, this);
      this.finish = bind(this.finish, this);
      this.onTransitionEnd = bind(this.onTransitionEnd, this);
      this.stopListenToTransitionEnd = bind(this.stopListenToTransitionEnd, this);
      this.listenToTransitionEnd = bind(this.listenToTransitionEnd, this);
      this.stopFallbackTimer = bind(this.stopFallbackTimer, this);
      this.startFallbackTimer = bind(this.startFallbackTimer, this);
      this.onFinishEvent = bind(this.onFinishEvent, this);
      this.stopListenToFinishEvent = bind(this.stopListenToFinishEvent, this);
      this.listenToFinishEvent = bind(this.listenToFinishEvent, this);
      this.start = bind(this.start, this);
      this.$element = $element;
      this.element = u.element($element);
      this.lastFrameCamel = u.camelCaseKeys(lastFrame);
      this.lastFrameKebab = u.kebabCaseKeys(lastFrame);
      this.lastFrameKeysKebab = Object.keys(this.lastFrameKebab);
      this.finishEvent = options.finishEvent;
      this.duration = options.duration;
      this.delay = options.delay;
      this.totalDuration = this.delay + this.duration;
      this.easing = options.easing;
      this.finished = false;
    }

    CssTransition.prototype.start = function() {
      if (this.lastFrameKeysKebab.length === 0) {
        this.finished = true;
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

    CssTransition.prototype.listenToFinishEvent = function() {
      if (this.finishEvent) {
        return this.$element.on(this.finishEvent, this.onFinishEvent);
      }
    };

    CssTransition.prototype.stopListenToFinishEvent = function() {
      if (this.finishEvent) {
        return this.$element.off(this.finishEvent, this.onFinishEvent);
      }
    };

    CssTransition.prototype.onFinishEvent = function(event) {
      event.stopPropagation();
      return this.finish();
    };

    CssTransition.prototype.startFallbackTimer = function() {
      var timingTolerance;
      timingTolerance = 100;
      return this.fallbackTimer = u.setTimer(this.totalDuration + timingTolerance, (function(_this) {
        return function() {
          return _this.finish();
        };
      })(this));
    };

    CssTransition.prototype.stopFallbackTimer = function() {
      return clearTimeout(this.fallbackTimer);
    };

    CssTransition.prototype.listenToTransitionEnd = function() {
      return this.$element.on('transitionend', this.onTransitionEnd);
    };

    CssTransition.prototype.stopListenToTransitionEnd = function() {
      return this.$element.off('transitionend', this.onTransitionEnd);
    };

    CssTransition.prototype.onTransitionEnd = function(event) {
      var completedPropertyKebab, elapsed;
      if (event.target !== this.element) {
        return;
      }
      elapsed = new Date() - this.startTime;
      if (!(elapsed > 0.25 * this.totalDuration)) {
        return;
      }
      completedPropertyKebab = event.originalEvent.propertyName;
      if (!u.contains(this.lastFrameKeysKebab, completedPropertyKebab)) {
        return;
      }
      return this.finish();
    };

    CssTransition.prototype.finish = function() {
      if (this.finished) {
        return;
      }
      this.finished = true;
      this.stopFallbackTimer();
      this.stopListenToFinishEvent();
      this.stopListenToTransitionEnd();
      u.concludeCssTransition(this.element);
      this.resumeOldTransition();
      return this.deferred.resolve();
    };

    CssTransition.prototype.pauseOldTransition = function() {
      var oldTransition, oldTransitionFrameCamel, oldTransitionFrameKebab, oldTransitionProperties;
      oldTransition = u.readComputedStyle(this.element, ['transitionProperty', 'transitionDuration', 'transitionDelay', 'transitionTimingFunction']);
      if (u.hasCssTransition(oldTransition)) {
        if (oldTransition.transitionProperty !== 'all') {
          oldTransitionProperties = oldTransition.transitionProperty.split(/\s*,\s*/);
          oldTransitionFrameKebab = u.readComputedStyle(this.element, oldTransitionProperties);
          oldTransitionFrameCamel = u.camelCaseKeys(oldTransitionFrameKebab);
          this.setOldTransitionTargetFrame = u.writeTemporaryStyle(this.element, oldTransitionFrameCamel);
        }
        return this.setOldTransition = u.concludeCssTransition(this.element);
      }
    };

    CssTransition.prototype.resumeOldTransition = function() {
      if (typeof this.setOldTransitionTargetFrame === "function") {
        this.setOldTransitionTargetFrame();
      }
      return typeof this.setOldTransition === "function" ? this.setOldTransition() : void 0;
    };

    CssTransition.prototype.startMotion = function() {
      u.writeInlineStyle(this.element, {
        transitionProperty: Object.keys(this.lastFrameKebab).join(', '),
        transitionDuration: this.duration + "ms",
        transitionDelay: this.delay + "ms",
        transitionTimingFunction: this.easing
      });
      return u.writeInlineStyle(this.element, this.lastFrameCamel);
    };

    return CssTransition;

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  u = up.util;

  up.ExtractCascade = (function() {
    function ExtractCascade(selector, options) {
      this.oldPlanNotFound = bind(this.oldPlanNotFound, this);
      this.matchingPlanNotFound = bind(this.matchingPlanNotFound, this);
      this.bestMatchingSteps = bind(this.bestMatchingSteps, this);
      this.bestPreflightSelector = bind(this.bestPreflightSelector, this);
      this.detectPlan = bind(this.detectPlan, this);
      this.matchingPlan = bind(this.matchingPlan, this);
      this.newPlan = bind(this.newPlan, this);
      this.oldPlan = bind(this.oldPlan, this);
      this.options = u.options(options, {
        humanizedTarget: 'selector',
        layer: 'auto'
      });
      this.options.transition = u.option(this.options.transition, this.options.animation);
      this.options.hungry = u.option(this.options.hungry, true);
      this.candidates = this.buildCandidates(selector);
      this.plans = u.map(this.candidates, (function(_this) {
        return function(candidate, i) {
          var planOptions;
          planOptions = u.copy(_this.options);
          if (i > 0) {
            planOptions.transition = u.option(up.dom.config.fallbackTransition, _this.options.transition);
          }
          return new up.ExtractPlan(candidate, planOptions);
        };
      })(this));
    }

    ExtractCascade.prototype.buildCandidates = function(selector) {
      var candidates;
      candidates = [selector, this.options.fallback, up.dom.config.fallbacks];
      candidates = u.flatten(candidates);
      candidates = u.select(candidates, u.isTruthy);
      candidates = u.uniq(candidates);
      if (this.options.fallback === false || this.options.provideTarget) {
        candidates = [candidates[0]];
      }
      return candidates;
    };

    ExtractCascade.prototype.oldPlan = function() {
      return this.detectPlan('oldExists');
    };

    ExtractCascade.prototype.newPlan = function() {
      return this.detectPlan('newExists');
    };

    ExtractCascade.prototype.matchingPlan = function() {
      return this.detectPlan('matchExists');
    };

    ExtractCascade.prototype.detectPlan = function(checker) {
      return u.detect(this.plans, function(plan) {
        return plan[checker]();
      });
    };

    ExtractCascade.prototype.bestPreflightSelector = function() {
      var plan;
      if (this.options.provideTarget) {
        plan = this.plans[0];
      } else {
        plan = this.oldPlan();
      }
      if (plan) {
        plan.resolveNesting();
        return plan.selector();
      } else {
        return this.oldPlanNotFound();
      }
    };

    ExtractCascade.prototype.bestMatchingSteps = function() {
      var plan;
      if (plan = this.matchingPlan()) {
        plan.addHungrySteps();
        plan.resolveNesting();
        return plan.steps;
      } else {
        return this.matchingPlanNotFound();
      }
    };

    ExtractCascade.prototype.matchingPlanNotFound = function() {
      var inspectAction, message;
      if (this.newPlan()) {
        return this.oldPlanNotFound();
      } else {
        if (this.oldPlan()) {
          message = "Could not find " + this.options.humanizedTarget + " in response";
        } else {
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

    ExtractCascade.prototype.oldPlanNotFound = function() {
      var layerProse;
      layerProse = this.options.layer;
      if (layerProse === 'auto') {
        layerProse = 'page, modal or popup';
      }
      return up.fail("Could not find " + this.options.humanizedTarget + " in current " + layerProse + " (tried %o)", this.candidates);
    };

    return ExtractCascade;

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  u = up.util;

  up.ExtractPlan = (function() {
    function ExtractPlan(selector, options) {
      this.addHungrySteps = bind(this.addHungrySteps, this);
      this.parseSteps = bind(this.parseSteps, this);
      this.selector = bind(this.selector, this);
      this.resolveNesting = bind(this.resolveNesting, this);
      this.addSteps = bind(this.addSteps, this);
      this.matchExists = bind(this.matchExists, this);
      this.newExists = bind(this.newExists, this);
      this.oldExists = bind(this.oldExists, this);
      this.findNew = bind(this.findNew, this);
      this.findOld = bind(this.findOld, this);
      var originalSelector;
      this.reveal = options.reveal;
      this.origin = options.origin;
      this.hungry = options.hungry;
      this.transition = options.transition;
      this.response = options.response;
      this.oldLayer = options.layer;
      originalSelector = up.dom.resolveSelector(selector, this.origin);
      this.parseSteps(originalSelector);
    }

    ExtractPlan.prototype.findOld = function() {
      return u.each(this.steps, (function(_this) {
        return function(step) {
          return step.$old = up.dom.first(step.selector, {
            layer: _this.oldLayer
          });
        };
      })(this));
    };

    ExtractPlan.prototype.findNew = function() {
      return u.each(this.steps, (function(_this) {
        return function(step) {
          return step.$new = _this.response.first(step.selector);
        };
      })(this));
    };

    ExtractPlan.prototype.oldExists = function() {
      this.findOld();
      return u.all(this.steps, function(step) {
        return step.$old;
      });
    };

    ExtractPlan.prototype.newExists = function() {
      this.findNew();
      return u.all(this.steps, function(step) {
        return step.$new;
      });
    };

    ExtractPlan.prototype.matchExists = function() {
      return this.oldExists() && this.newExists();
    };

    ExtractPlan.prototype.addSteps = function(steps) {
      return this.steps = this.steps.concat(steps);
    };

    ExtractPlan.prototype.resolveNesting = function() {
      var compressed;
      if (this.steps.length < 2) {
        return;
      }
      compressed = u.copy(this.steps);
      compressed = u.uniqBy(compressed, function(step) {
        return step.$old[0];
      });
      compressed = u.select(compressed, (function(_this) {
        return function(candidateStep, candidateIndex) {
          return u.all(compressed, function(rivalStep, rivalIndex) {
            var candidateElement, rivalElement;
            if (rivalIndex === candidateIndex) {
              return true;
            } else {
              candidateElement = candidateStep.$old[0];
              rivalElement = rivalStep.$old[0];
              return rivalStep.pseudoClass || !$.contains(rivalElement, candidateElement);
            }
          });
        };
      })(this));
      compressed[0].reveal = this.steps[0].reveal;
      return this.steps = compressed;
    };

    ExtractPlan.prototype.selector = function() {
      return u.map(this.steps, 'expression').join(', ');
    };

    ExtractPlan.prototype.parseSteps = function(originalSelector) {
      var comma, disjunction;
      comma = /\ *,\ */;
      this.steps = [];
      disjunction = originalSelector.split(comma);
      return u.each(disjunction, (function(_this) {
        return function(expression, i) {
          var doReveal, expressionParts, pseudoClass, selector;
          expressionParts = expression.match(/^(.+?)(?:\:(before|after))?$/);
          expressionParts || up.fail('Could not parse selector literal "%s"', expression);
          selector = expressionParts[1];
          if (selector === 'html') {
            selector = 'body';
          }
          pseudoClass = expressionParts[2];
          doReveal = i === 0 ? _this.reveal : false;
          return _this.steps.push({
            expression: expression,
            selector: selector,
            pseudoClass: pseudoClass,
            transition: _this.transition,
            origin: _this.origin,
            reveal: doReveal
          });
        };
      })(this));
    };

    ExtractPlan.prototype.addHungrySteps = function() {
      var $hungries, $hungry, $newHungry, hungry, hungrySteps, j, len, selector, transition;
      hungrySteps = [];
      if (this.hungry) {
        $hungries = $(up.radio.hungrySelector());
        transition = u.option(up.radio.config.hungryTransition, this.transition);
        for (j = 0, len = $hungries.length; j < len; j++) {
          hungry = $hungries[j];
          $hungry = $(hungry);
          selector = u.selectorForElement($hungry);
          if ($newHungry = this.response.first(selector)) {
            hungrySteps.push({
              selector: selector,
              $old: $hungry,
              $new: $newHungry,
              transition: transition,
              reveal: false,
              origin: null
            });
          }
        }
      }
      return this.addSteps(hungrySteps);
    };

    return ExtractPlan;

  })();

}).call(this);
(function() {
  var u;

  u = up.util;

  up.ExtractStep = (function() {
    function ExtractStep() {}

    return ExtractStep;

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  u = up.util;

  up.FieldObserver = (function() {
    var CHANGE_EVENTS;

    CHANGE_EVENTS = 'input change';

    function FieldObserver($field, options) {
      this.$field = $field;
      this.check = bind(this.check, this);
      this.readFieldValue = bind(this.readFieldValue, this);
      this.requestCallback = bind(this.requestCallback, this);
      this.isNewValue = bind(this.isNewValue, this);
      this.scheduleTimer = bind(this.scheduleTimer, this);
      this.cancelTimer = bind(this.cancelTimer, this);
      this.stop = bind(this.stop, this);
      this.start = bind(this.start, this);
      this.delay = options.delay;
      this.callback = options.callback;
    }

    FieldObserver.prototype.start = function() {
      this.scheduledValue = null;
      this.processedValue = this.readFieldValue();
      this.currentTimer = void 0;
      this.currentCallback = void 0;
      return this.$field.on(CHANGE_EVENTS, this.check);
    };

    FieldObserver.prototype.stop = function() {
      this.$field.off(CHANGE_EVENTS, this.check);
      return this.cancelTimer();
    };

    FieldObserver.prototype.cancelTimer = function() {
      clearTimeout(this.currentTimer);
      return this.currentTimer = void 0;
    };

    FieldObserver.prototype.scheduleTimer = function() {
      return this.currentTimer = u.setTimer(this.delay, (function(_this) {
        return function() {
          _this.currentTimer = void 0;
          return _this.requestCallback();
        };
      })(this));
    };

    FieldObserver.prototype.isNewValue = function(value) {
      return value !== this.processedValue && (this.scheduledValue === null || this.scheduledValue !== value);
    };

    FieldObserver.prototype.requestCallback = function() {
      var callbackDone;
      if (this.scheduledValue !== null && !this.currentTimer && !this.currentCallback) {
        this.processedValue = this.scheduledValue;
        this.scheduledValue = null;
        this.currentCallback = (function(_this) {
          return function() {
            return _this.callback.call(_this.$field.get(0), _this.processedValue, _this.$field);
          };
        })(this);
        callbackDone = Promise.resolve(this.currentCallback());
        return u.always(callbackDone, (function(_this) {
          return function() {
            _this.currentCallback = void 0;
            return _this.requestCallback();
          };
        })(this));
      }
    };

    FieldObserver.prototype.readFieldValue = function() {
      return u.submittedValue(this.$field);
    };

    FieldObserver.prototype.check = function() {
      var value;
      value = this.readFieldValue();
      if (this.isNewValue(value)) {
        this.scheduledValue = value;
        this.cancelTimer();
        return this.scheduleTimer();
      }
    };

    return FieldObserver;

  })();

}).call(this);
(function() {


}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  u = up.util;

  up.FollowVariant = (function() {
    function FollowVariant(selector, options) {
      this.matchesLink = bind(this.matchesLink, this);
      this.preloadLink = bind(this.preloadLink, this);
      this.followLink = bind(this.followLink, this);
      this.fullSelector = bind(this.fullSelector, this);
      this.onMousedown = bind(this.onMousedown, this);
      this.onClick = bind(this.onClick, this);
      this.followNow = options.follow;
      this.preloadNow = options.preload;
      this.selectors = selector.split(/\s*,\s*/);
    }

    FollowVariant.prototype.onClick = function(event, $link) {
      if (up.link.shouldProcessEvent(event, $link)) {
        if ($link.is('[up-instant]')) {
          return up.bus.haltEvent(event);
        } else {
          up.bus.consumeAction(event);
          return this.followLink($link);
        }
      } else {
        return up.link.allowDefault(event);
      }
    };

    FollowVariant.prototype.onMousedown = function(event, $link) {
      if (up.link.shouldProcessEvent(event, $link)) {
        up.bus.consumeAction(event);
        return this.followLink($link);
      }
    };

    FollowVariant.prototype.fullSelector = function(additionalClause) {
      var parts;
      if (additionalClause == null) {
        additionalClause = '';
      }
      parts = [];
      this.selectors.forEach(function(variantSelector) {
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

    FollowVariant.prototype.registerEvents = function() {
      up.on('click', this.fullSelector(), (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return u.muteRejection(_this.onClick.apply(_this, args));
        };
      })(this));
      return up.on('mousedown', this.fullSelector('[up-instant]'), (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return u.muteRejection(_this.onMousedown.apply(_this, args));
        };
      })(this));
    };

    FollowVariant.prototype.followLink = function($link, options) {
      var followEventAttrs;
      options = u.options(options);
      followEventAttrs = {
        message: 'Following link',
        $link: $link,
        $element: $link
      };
      return up.bus.whenEmitted('up:link:follow', followEventAttrs).then((function(_this) {
        return function() {
          return up.feedback.start($link, options, function() {
            return _this.followNow($link, options);
          });
        };
      })(this));
    };

    FollowVariant.prototype.preloadLink = function($link, options) {
      options = u.options(options);
      return this.preloadNow($link, options);
    };

    FollowVariant.prototype.matchesLink = function($link) {
      return $link.is(this.fullSelector());
    };

    return FollowVariant;

  })();

}).call(this);
(function() {
  var u;

  u = up.util;

  up.HtmlParser = (function() {
    function HtmlParser(html) {
      this.html = html;
      this.wrapNoscriptInHtml();
      this.parsedDoc = u.createElementFromHtml(this.html);
    }

    HtmlParser.prototype.title = function() {
      var ref;
      return (ref = this.parsedDoc.querySelector("head title")) != null ? ref.textContent : void 0;
    };

    HtmlParser.prototype.first = function(selector) {
      var match;
      if (match = $.find(selector, this.parsedDoc)[0]) {
        return $(match);
      }
    };

    HtmlParser.prototype.prepareForInsertion = function($element) {
      var element;
      element = $element[0];
      this.unwrapNoscriptInElement(element);
      return $(element);
    };

    HtmlParser.prototype.wrapNoscriptInHtml = function() {
      var noscriptPattern;
      noscriptPattern = /<noscript[^>]*>((.|\s)*?)<\/noscript>/ig;
      return this.html = this.html.replace(noscriptPattern, (function(_this) {
        return function(match, content) {
          _this.didWrapNoscript = true;
          return '<div class="up-noscript" data-html="' + u.escapeHtml(content) + '"></div>';
        };
      })(this));
    };

    HtmlParser.prototype.unwrapNoscriptInElement = function(element) {
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

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  u = up.util;

  up.MotionTracker = (function() {
    function MotionTracker(name) {
      this.reset = bind(this.reset, this);
      this.whileForwardingFinishEvent = bind(this.whileForwardingFinishEvent, this);
      this.forwardFinishEvent = bind(this.forwardFinishEvent, this);
      this.unmarkCluster = bind(this.unmarkCluster, this);
      this.markCluster = bind(this.markCluster, this);
      this.whenElementFinished = bind(this.whenElementFinished, this);
      this.emitFinishEvent = bind(this.emitFinishEvent, this);
      this.finishOneElement = bind(this.finishOneElement, this);
      this.isActive = bind(this.isActive, this);
      this.expandFinishRequest = bind(this.expandFinishRequest, this);
      this.finish = bind(this.finish, this);
      this.claim = bind(this.claim, this);
      this.activeClass = "up-" + name;
      this.dataKey = "up-" + name + "-finished";
      this.selector = "." + this.activeClass;
      this.finishEvent = "up:" + name + ":finish";
      this.finishCount = 0;
      this.clusterCount = 0;
    }


    /***
    Finishes all animations in the given element cluster's ancestors and descendants,
    then calls the animator.
    
    The animation returned by the animator is tracked so it can be
    [`finished`](/up.MotionTracker.finish) later.
    
    @method claim
    @param {jQuery} $cluster
    @param {Function(jQuery): Promise} animator
    @param {Object} memory.trackMotion = true
      Whether
    @return {Promise} A promise that is fulfilled when the new animation ends.
     */

    MotionTracker.prototype.claim = function(cluster, animator, memory) {
      var $cluster;
      if (memory == null) {
        memory = {};
      }
      $cluster = $(cluster);
      memory.trackMotion = u.option(memory.trackMotion, up.motion.isEnabled());
      if (memory.trackMotion === false) {
        return u.microtask(animator);
      } else {
        memory.trackMotion = false;
        return this.finish($cluster).then((function(_this) {
          return function() {
            var promise;
            promise = _this.whileForwardingFinishEvent($cluster, animator);
            promise = promise.then(function() {
              return _this.unmarkCluster($cluster);
            });
            _this.markCluster($cluster, promise);
            return promise;
          };
        })(this));
      }
    };


    /***
    @method finish
    @param {jQuery} [elements]
      If no element is given, finishes all animations in the documnet.
      If an element is given, only finishes animations in its subtree and ancestors.
    @return {Promise} A promise that is fulfilled when animations have finished.
     */

    MotionTracker.prototype.finish = function(elements) {
      var $elements, allFinished;
      this.finishCount++;
      if (this.clusterCount === 0 || !up.motion.isEnabled()) {
        return Promise.resolve();
      }
      $elements = this.expandFinishRequest(elements);
      allFinished = u.map($elements, this.finishOneElement);
      return Promise.all(allFinished);
    };

    MotionTracker.prototype.expandFinishRequest = function(elements) {
      if (elements) {
        return u.selectInDynasty($(elements), this.selector);
      } else {
        return $(this.selector);
      }
    };

    MotionTracker.prototype.isActive = function(element) {
      return u.hasClass(element, this.activeClass);
    };

    MotionTracker.prototype.finishOneElement = function(element) {
      var $element;
      $element = $(element);
      this.emitFinishEvent($element);
      return this.whenElementFinished($element);
    };

    MotionTracker.prototype.emitFinishEvent = function($element, eventAttrs) {
      if (eventAttrs == null) {
        eventAttrs = {};
      }
      eventAttrs = u.merge({
        $element: $element,
        message: false
      }, eventAttrs);
      return up.emit(this.finishEvent, eventAttrs);
    };

    MotionTracker.prototype.whenElementFinished = function($element) {
      return $element.data(this.dataKey) || Promise.resolve();
    };

    MotionTracker.prototype.markCluster = function($cluster, promise) {
      this.clusterCount++;
      $cluster.addClass(this.activeClass);
      return $cluster.data(this.dataKey, promise);
    };

    MotionTracker.prototype.unmarkCluster = function($cluster) {
      this.clusterCount--;
      $cluster.removeClass(this.activeClass);
      return $cluster.removeData(this.dataKey);
    };

    MotionTracker.prototype.forwardFinishEvent = function($original, $ghost, duration) {
      return this.start($original, (function(_this) {
        return function() {
          var doForward;
          doForward = function() {
            return $ghost.trigger(_this.finishEvent);
          };
          $original.on(_this.finishEvent, doForward);
          return duration.then(function() {
            return $original.off(_this.finishEvent, doForward);
          });
        };
      })(this));
    };

    MotionTracker.prototype.whileForwardingFinishEvent = function($elements, fn) {
      var doForward;
      if ($elements.length < 2) {
        return fn();
      }
      doForward = (function(_this) {
        return function(event) {
          if (!event.forwarded) {
            return u.each($elements, function(element) {
              var $element;
              $element = $(element);
              if (element !== event.target && _this.isActive($element)) {
                return _this.emitFinishEvent($element, {
                  forwarded: true
                });
              }
            });
          }
        };
      })(this);
      $elements.on(this.finishEvent, doForward);
      return fn().then((function(_this) {
        return function() {
          return $elements.off(_this.finishEvent, doForward);
        };
      })(this));
    };

    MotionTracker.prototype.reset = function() {
      return this.finish().then((function(_this) {
        return function() {
          _this.finishCount = 0;
          return _this.clusterCount = 0;
        };
      })(this));
    };

    return MotionTracker;

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  u = up.util;


  /***
  Instances of `up.Request` normalizes properties of an [`AJAX request`](/up.request)
  such as the requested URL, form parameters and HTTP method.
  
  @class up.Request
   */

  up.Request = (function(superClass) {
    extend(Request, superClass);


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
    [Parameters](/up.params) that should be sent as the request's payload.
    
    @property up.Request#params
    @param {object|FormData|string|Array} params
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
    @param {object} headers
    @stable
     */


    /***
    A timeout in milliseconds.
    
    If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set,
    the timeout will not include the time spent waiting in the queue.
    
    @property up.Request#timeout
    @param {object|undefined} timeout
    @stable
     */

    Request.prototype.fields = function() {
      return ['method', 'url', 'params', 'data', 'target', 'failTarget', 'headers', 'timeout', 'preload', 'cache'];
    };


    /***
    @constructor up.Request
    @param {string} [attributes]
     */

    function Request(options) {
      this.cacheKey = bind(this.cacheKey, this);
      this.isCachable = bind(this.isCachable, this);
      this.buildResponse = bind(this.buildResponse, this);
      this.isCrossDomain = bind(this.isCrossDomain, this);
      this.csrfToken = bind(this.csrfToken, this);
      this.navigate = bind(this.navigate, this);
      this.send = bind(this.send, this);
      this.isSafe = bind(this.isSafe, this);
      this.transferSearchToParams = bind(this.transferSearchToParams, this);
      this.transferParamsToUrl = bind(this.transferParamsToUrl, this);
      this.extractHashFromUrl = bind(this.extractHashFromUrl, this);
      this.normalize = bind(this.normalize, this);
      Request.__super__.constructor.call(this, options);
      this.normalize();
    }

    Request.prototype.normalize = function() {
      u.deprecateRenamedKey(this, 'data', 'params');
      this.method = u.normalizeMethod(this.method);
      this.headers || (this.headers = {});
      this.extractHashFromUrl();
      if (u.methodAllowsPayload(this.method)) {
        return this.transferSearchToParams();
      } else {
        return this.transferParamsToUrl();
      }
    };

    Request.prototype.extractHashFromUrl = function() {
      var urlParts;
      urlParts = u.parseUrl(this.url);
      this.hash = u.presence(urlParts.hash);
      return this.url = u.normalizeUrl(urlParts, {
        hash: false
      });
    };

    Request.prototype.transferParamsToUrl = function() {
      if (this.params && !u.isFormData(this.params)) {
        this.url = up.params.buildURL(this.url, this.params);
        return this.params = void 0;
      }
    };

    Request.prototype.transferSearchToParams = function() {
      var query;
      if (query = up.params.fromURL(this.url)) {
        this.params = up.params.merge(this.params, query);
        return this.url = u.normalizeUrl(this.url, {
          search: false
        });
      }
    };

    Request.prototype.isSafe = function() {
      return up.proxy.isSafeMethod(this.method);
    };

    Request.prototype.send = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var csrfToken, header, pc, ref, resolveWithResponse, value, xhr, xhrHeaders, xhrMethod, xhrPayload, xhrUrl;
          xhr = new XMLHttpRequest();
          xhrHeaders = u.copy(_this.headers);
          xhrPayload = _this.params;
          xhrMethod = _this.method;
          xhrUrl = _this.url;
          ref = up.proxy.wrapMethod(xhrMethod, xhrPayload), xhrMethod = ref[0], xhrPayload = ref[1];
          if (xhrPayload) {
            delete xhrHeaders['Content-Type'];
            xhrPayload = up.params.toFormData(xhrPayload);
          } else {
            xhrPayload = null;
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
          resolveWithResponse = function() {
            var response;
            response = _this.buildResponse(xhr);
            if (response.isSuccess()) {
              return resolve(response);
            } else {
              return reject(response);
            }
          };
          xhr.onload = resolveWithResponse;
          xhr.onerror = resolveWithResponse;
          xhr.ontimeout = resolveWithResponse;
          if (_this.timeout) {
            xhr.timeout = _this.timeout;
          }
          return xhr.send(xhrPayload);
        };
      })(this));
    };

    Request.prototype.navigate = function() {
      var $form, addField, csrfParam, csrfToken, formMethod;
      this.transferSearchToParams();
      $form = $('<form class="up-page-loader"></form>');
      addField = function(field) {
        return $('<input type="hidden">').attr(field).appendTo($form);
      };
      if (this.method === 'GET') {
        formMethod = 'GET';
      } else {
        addField({
          name: up.protocol.config.methodParam,
          value: this.method
        });
        formMethod = 'POST';
      }
      $form.attr({
        method: formMethod,
        action: this.url
      });
      if ((csrfParam = up.protocol.csrfParam()) && (csrfToken = this.csrfToken())) {
        addField({
          name: csrfParam,
          value: csrfToken
        });
      }
      u.each(up.params.toArray(this.params), addField);
      $form.hide().appendTo('body');
      return up.browser.submitForm($form);
    };

    Request.prototype.csrfToken = function() {
      if (!this.isSafe() && !this.isCrossDomain()) {
        return up.protocol.csrfToken();
      }
    };

    Request.prototype.isCrossDomain = function() {
      return u.isCrossDomain(this.url);
    };

    Request.prototype.buildResponse = function(xhr) {
      var ref, responseAttrs, urlFromServer;
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
        responseAttrs.method = (ref = up.protocol.methodFromXhr(xhr)) != null ? ref : 'GET';
      }
      responseAttrs.title = up.protocol.titleFromXhr(xhr);
      return new up.Response(responseAttrs);
    };

    Request.prototype.isCachable = function() {
      return this.isSafe() && !u.isFormData(this.params);
    };

    Request.prototype.cacheKey = function() {
      var query;
      query = up.params.toQuery(this.params);
      return [this.url, this.method, query, this.target].join('|');
    };

    Request.wrap = function(object) {
      if (object instanceof this) {
        return object;
      } else {
        return new this(object);
      }
    };

    return Request;

  })(up.Record);

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  u = up.util;


  /***
  Instances of `up.Response` describe the server response to an [`AJAX request`](/up.request).
  
  \#\#\# Example
  
      up.request('/foo').then(function(response) {
        console.log(response.status); // 200
        console.log(response.text);   // "<html><body>..."
      });
  
  @class up.Response
   */

  up.Response = (function(superClass) {
    extend(Response, superClass);


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

    Response.prototype.fields = function() {
      return ['method', 'url', 'text', 'status', 'request', 'xhr', 'title'];
    };

    function Response(options) {
      this.getHeader = bind(this.getHeader, this);
      this.isFatalError = bind(this.isFatalError, this);
      this.isError = bind(this.isError, this);
      this.isSuccess = bind(this.isSuccess, this);
      Response.__super__.constructor.call(this, options);
    }


    /***
    Returns whether the server responded with a 2xx HTTP status.
    
    @function up.Response#isSuccess
    @return {boolean}
    @experimental
     */

    Response.prototype.isSuccess = function() {
      return this.status && (this.status >= 200 && this.status <= 299);
    };


    /***
    Returns whether the response was not [successful](/up.Request.prototype.isSuccess).
    
    This also returns `true` when the request encountered a [fatal error](/up.Request.prototype.isFatalError)
    like a timeout or loss of network connectivity.
    
    @function up.Response#isError
    @return {boolean}
    @experimental
     */

    Response.prototype.isError = function() {
      return !this.isSuccess();
    };


    /***
    Returns whether the request encountered a [fatal error](/up.Request.prototype.isFatalError)
    like a timeout or loss of network connectivity.
    
    When the server produces an error message with an HTTP status like `500`,
    this is not considered a fatal error and `false` is returned.
    
    @function up.Response#isFatalError
    @return {boolean}
    @experimental
     */

    Response.prototype.isFatalError = function() {
      return this.isError() && u.isBlank(this.text);
    };


    /***
    Returns the HTTP header value with the given name.
    
    The search for the header name is case-insensitive.
    
    Returns `undefined` if the given header name was not included in the response.
    
    @function up.Response#getHeader
    @param {string} name
    @return {string|undefined} value
    @experimental
     */

    Response.prototype.getHeader = function(name) {
      return this.xhr.getResponseHeader(name);
    };

    return Response;

  })(up.Record);

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  up.store || (up.store = {});

  u = up.util;

  up.store.Memory = (function() {
    function Memory() {
      this.values = bind(this.values, this);
      this.keys = bind(this.keys, this);
      this.remove = bind(this.remove, this);
      this.set = bind(this.set, this);
      this.get = bind(this.get, this);
      this.clear = bind(this.clear, this);
      this.clear();
    }

    Memory.prototype.clear = function() {
      return this.data = {};
    };

    Memory.prototype.get = function(key) {
      return this.data[key];
    };

    Memory.prototype.set = function(key, value) {
      return this.data[key] = value;
    };

    Memory.prototype.remove = function(key) {
      return delete this.data[key];
    };

    Memory.prototype.keys = function() {
      return Object.keys(this.data);
    };

    Memory.prototype.values = function() {
      return u.values(this.data);
    };

    return Memory;

  })();

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  u = up.util;

  up.store.Session = (function(superClass) {
    extend(Session, superClass);

    function Session(rootKey) {
      this.saveToSessionStorage = bind(this.saveToSessionStorage, this);
      this.loadFromSessionStorage = bind(this.loadFromSessionStorage, this);
      this.remove = bind(this.remove, this);
      this.set = bind(this.set, this);
      this.clear = bind(this.clear, this);
      this.rootKey = rootKey;
      this.loadFromSessionStorage();
    }

    Session.prototype.clear = function() {
      Session.__super__.clear.call(this);
      return this.saveToSessionStorage();
    };

    Session.prototype.set = function(key, value) {
      Session.__super__.set.call(this, key, value);
      return this.saveToSessionStorage();
    };

    Session.prototype.remove = function(key) {
      Session.__super__.remove.call(this, key);
      return this.saveToSessionStorage();
    };

    Session.prototype.loadFromSessionStorage = function() {
      var raw;
      try {
        if (raw = typeof sessionStorage !== "undefined" && sessionStorage !== null ? sessionStorage.getItem(this.rootKey) : void 0) {
          this.data = JSON.parse(raw);
        }
      } catch (error) {

      }
      return this.data || (this.data = {});
    };

    Session.prototype.saveToSessionStorage = function() {
      var json;
      json = JSON.stringify(this.data);
      try {
        return typeof sessionStorage !== "undefined" && sessionStorage !== null ? sessionStorage.setItem(this.rootKey, json) : void 0;
      } catch (error) {

      }
    };

    return Session;

  })(up.store.Memory);

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  u = up.util;

  up.UrlSet = (function() {
    function UrlSet(urls, options) {
      this.urls = urls;
      if (options == null) {
        options = {};
      }
      this.isEqual = bind(this.isEqual, this);
      this.matchesAny = bind(this.matchesAny, this);
      this.doesMatchPrefix = bind(this.doesMatchPrefix, this);
      this.doesMatchFully = bind(this.doesMatchFully, this);
      this.matches = bind(this.matches, this);
      this.normalizeUrl = options.normalizeUrl || u.normalizeUrl;
      this.urls = u.map(this.urls, this.normalizeUrl);
      this.urls = u.compact(this.urls);
    }

    UrlSet.prototype.matches = function(testUrl) {
      if (testUrl.substr(-1) === '*') {
        return this.doesMatchPrefix(testUrl.slice(0, -1));
      } else {
        return this.doesMatchFully(testUrl);
      }
    };

    UrlSet.prototype.doesMatchFully = function(testUrl) {
      return u.contains(this.urls, testUrl);
    };

    UrlSet.prototype.doesMatchPrefix = function(prefix) {
      return u.detect(this.urls, function(url) {
        return url.indexOf(prefix) === 0;
      });
    };

    UrlSet.prototype.matchesAny = function(testUrls) {
      return u.detect(testUrls, this.matches);
    };

    UrlSet.prototype.isEqual = function(otherSet) {
      return u.isEqual(this.urls, otherSet != null ? otherSet.urls : void 0);
    };

    return UrlSet;

  })();

}).call(this);

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

@class up.browser
 */

(function() {
  var slice = [].slice;

  up.browser = (function($) {
    var CONSOLE_PLACEHOLDERS, canConsole, canCssTransition, canCustomElements, canDOMParser, canFormData, canInputEvent, canInspectFormData, canPromise, canPushState, documentViewportSelector, isIE10OrWorse, isRecentJQuery, isSupported, navigate, popCookie, puts, sprintf, sprintfWithFormattedArgs, stringifyArg, submitForm, u, url, whenConfirmed;
    u = up.util;

    /***
    @method up.browser.navigate
    @param {string} url
    @param {string} [options.method='get']
    @param {object|Array|FormData|string} [options.params]
    @internal
     */
    navigate = function(url, options) {
      var request;
      if (options == null) {
        options = {};
      }
      request = new up.Request(u.merge(options, {
        url: url
      }));
      return request.navigate();
    };

    /***
    For mocking in specs.
    
    @method submitForm
     */
    submitForm = function($form) {
      return $form.submit();
    };

    /***
    A cross-browser way to interact with `console.log`, `console.error`, etc.
    
    This function falls back to `console.log` if the output stream is not implemented.
    It also prints substitution strings (e.g. `console.log("From %o to %o", "a", "b")`)
    as a single string if the browser console does not support substitution strings.
    
    \#\#\# Example
    
        up.browser.puts('log', 'Hi world');
        up.browser.puts('error', 'There was an error in %o', obj);
    
    @function up.browser.puts
    @internal
     */
    puts = function() {
      var args, stream;
      stream = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return console[stream].apply(console, args);
    };
    CONSOLE_PLACEHOLDERS = /\%[odisf]/g;
    stringifyArg = function(arg) {
      var $arg, attr, closer, j, len, maxLength, ref, string, value;
      maxLength = 200;
      closer = '';
      if (u.isString(arg)) {
        string = arg.replace(/[\n\r\t ]+/g, ' ');
        string = string.replace(/^[\n\r\t ]+/, '');
        string = string.replace(/[\n\r\t ]$/, '');
        string = "\"" + string + "\"";
        closer = '"';
      } else if (u.isUndefined(arg)) {
        string = 'undefined';
      } else if (u.isNumber(arg) || u.isFunction(arg)) {
        string = arg.toString();
      } else if (u.isArray(arg)) {
        string = "[" + (u.map(arg, stringifyArg).join(', ')) + "]";
        closer = ']';
      } else if (u.isJQuery(arg)) {
        string = "$(" + (u.map(arg, stringifyArg).join(', ')) + ")";
        closer = ')';
      } else if (u.isElement(arg)) {
        $arg = $(arg);
        string = "<" + (arg.tagName.toLowerCase());
        ref = ['id', 'name', 'class'];
        for (j = 0, len = ref.length; j < len; j++) {
          attr = ref[j];
          if (value = $arg.attr(attr)) {
            string += " " + attr + "=\"" + value + "\"";
          }
        }
        string += ">";
        closer = '>';
      } else {
        string = JSON.stringify(arg);
      }
      if (string.length > maxLength) {
        string = (string.substr(0, maxLength)) + " …";
        string += closer;
      }
      return string;
    };

    /***
    See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions
    
    @function up.browser.sprintf
    @internal
     */
    sprintf = function() {
      var args, message;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return sprintfWithFormattedArgs.apply(null, [u.identity, message].concat(slice.call(args)));
    };

    /***
    @function up.browser.sprintfWithBounds
    @internal
     */
    sprintfWithFormattedArgs = function() {
      var args, formatter, i, message;
      formatter = arguments[0], message = arguments[1], args = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (u.isBlank(message)) {
        return '';
      }
      i = 0;
      return message.replace(CONSOLE_PLACEHOLDERS, function() {
        var arg;
        arg = args[i];
        arg = formatter(stringifyArg(arg));
        i += 1;
        return arg;
      });
    };
    url = function() {
      return location.href;
    };
    isIE10OrWorse = u.memoize(function() {
      return !window.atob;
    });

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
    canPushState = function() {
      return u.isDefined(history.pushState) && up.protocol.initialRequestMethod() === 'get';
    };

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
    canCssTransition = u.memoize(function() {
      return 'transition' in document.documentElement.style;
    });

    /***
    Returns whether this browser supports the DOM event [`input`](https://developer.mozilla.org/de/docs/Web/Events/input).
    
    @function up.browser.canInputEvent
    @return {boolean}
    @internal
     */
    canInputEvent = u.memoize(function() {
      return 'oninput' in document.createElement('input');
    });

    /***
    Returns whether this browser supports promises.
    
    @function up.browser.canPromise
    @return {boolean}
    @internal
     */
    canPromise = u.memoize(function() {
      return !!window.Promise;
    });

    /***
    Returns whether this browser supports the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
    interface.
    
    @function up.browser.canFormData
    @return {boolean}
    @experimental
     */
    canFormData = u.memoize(function() {
      return !!window.FormData;
    });

    /***
    @function up.browser.canInspectFormData
    @return {boolean}
    @internal
     */
    canInspectFormData = u.memoize(function() {
      return canFormData() && !!FormData.prototype.entries;
    });

    /***
    Returns whether this browser supports the [`DOMParser`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
    interface.
    
    @function up.browser.canDOMParser
    @return {boolean}
    @internal
     */
    canDOMParser = u.memoize(function() {
      return !!window.DOMParser;
    });

    /***
    Returns whether this browser supports the [`debugging console`](https://developer.mozilla.org/en-US/docs/Web/API/Console).
    
    @function up.browser.canConsole
    @return {boolean}
    @internal
     */
    canConsole = u.memoize(function() {
      return window.console && console.debug && console.info && console.warn && console.error && console.group && console.groupCollapsed && console.groupEnd;
    });
    canCustomElements = u.memoize(function() {
      return !!window.customElements;
    });
    isRecentJQuery = u.memoize(function() {
      var major, minor, parts, version;
      version = $.fn.jquery;
      parts = version.split('.');
      major = parseInt(parts[0]);
      minor = parseInt(parts[1]);
      return major >= 2 || (major === 1 && minor >= 9);
    });
    popCookie = function(name) {
      var ref, value;
      value = (ref = document.cookie.match(new RegExp(name + "=(\\w+)"))) != null ? ref[1] : void 0;
      if (u.isPresent(value)) {
        document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/';
      }
      return value;
    };

    /***
    @function up,browser.whenConfirmed
    @return {Promise}
    @param {string} options.confirm
    @param {boolean} options.preload
    @internal
     */
    whenConfirmed = function(options) {
      if (options.preload || u.isBlank(options.confirm) || window.confirm(options.confirm)) {
        return Promise.resolve();
      } else {
        return Promise.reject(new Error('User canceled action'));
      }
    };

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
    isSupported = function() {
      return !isIE10OrWorse() && isRecentJQuery() && canConsole() && canDOMParser() && canFormData() && canCssTransition() && canInputEvent() && canPromise();
    };

    /***
    Return the [scrolling element](https://developer.mozilla.org/en-US/docs/Web/API/document/scrollingElement)
    for the browser's main content area.
    
    @function up.browser.documentViewportSelector
    @internal
     */
    documentViewportSelector = function() {
      var element;
      if (element = document.scrollingElement) {
        return element.tagName;
      } else {
        return 'html';
      }
    };
    return {
      url: url,
      navigate: navigate,
      submitForm: submitForm,
      canPushState: canPushState,
      canFormData: canFormData,
      canInspectFormData: canInspectFormData,
      canCustomElements: canCustomElements,
      documentViewportSelector: documentViewportSelector,
      whenConfirmed: whenConfirmed,
      isSupported: isSupported,
      puts: puts,
      sprintf: sprintf,
      sprintfWithFormattedArgs: sprintfWithFormattedArgs,
      popCookie: popCookie
    };
  })(jQuery);

}).call(this);

/***
Events
======

Most Unpoly interactions emit DOM events that are prefixed with `up:`.

    $(document).on('up:modal:opened', function(event) {
      console.log('A new modal has just opened!');
    });

Events often have both present ([`up:modal:open`](/up:modal:open))
and past forms ([`up:modal:opened`](/up:modal:opened)).


\#\#\# Preventing events

You can prevent most present form events by calling `preventDefault()`:

    $(document).on('up:modal:open', function(event) {
      if (event.url == '/evil') {
        // Prevent the modal from opening
        event.preventDefault();
      }
    });


\#\#\# A better way to bind event listeners

Instead of using jQuery to bind  an event handler to `document`, you can also
use the more convenient [`up.on()`](/up.on):

    up.on('click', 'button', function(event, $button) {
      // $button is a jQuery collection containing
      // the clicked <button> element
    });

This improves jQuery's [`on`](http://api.jquery.com/on/) in multiple ways:

- Event listeners on [unsupported browsers](/up.browser.isSupported) are silently discarded,
  leaving you with an application without JavaScript. This is typically preferable to
  a soup of randomly broken JavaScript in ancient browsers.
- A jQuery object with the target element is automatically passed to the event handler
  as a second argument. You no longer need to write `$(this)` in the handler function.
- You use an [`up-data`](/up-data) attribute to [attach structured data](/up.on#attaching-structured-data)
  to observed elements.

@class up.bus
 */

(function() {
  var slice = [].slice;

  up.bus = (function($) {
    var boot, consumeAction, deprecateRenamedEvent, emit, emitReset, fixRenamedEvents, forgetUpDescription, haltEvent, live, liveUpDescriptions, logEmission, nextUpDescriptionNumber, nobodyPrevents, onEscape, rememberUpDescription, renamedEvents, resetBus, snapshot, u, unbind, upDescriptionNumber, upDescriptionToJqueryDescription, upListenerToJqueryListener, whenEmitted;
    u = up.util;
    liveUpDescriptions = {};
    nextUpDescriptionNumber = 0;
    renamedEvents = {};

    /***
    Convert an Unpoly style listener (second argument is the event target
    as a jQuery collection) to a vanilla jQuery listener
    
    @function upListenerToJqueryListener
    @internal
     */
    upListenerToJqueryListener = function(upListener) {
      return function(event) {
        var $me, args, expectedArgCount;
        $me = event.$element || $(this);
        args = [event, $me];
        expectedArgCount = upListener.length;
        if (!(expectedArgCount === 1 || expectedArgCount === 2)) {
          args.push(up.syntax.data($me));
        }
        return upListener.apply($me.get(0), args);
      };
    };

    /***
    Converts an argument list for `up.on()` to an argument list for `jQuery.on`.
    This involves rewriting the listener signature in the last argument slot.
    
    @function upDescriptionToJqueryDescription
    @internal
     */
    upDescriptionToJqueryDescription = function(upDescription, isNew) {
      var jqueryDescription, jqueryListener, upListener;
      jqueryDescription = u.copy(upDescription);
      fixRenamedEvents(jqueryDescription);
      upListener = jqueryDescription.pop();
      jqueryListener = void 0;
      if (isNew) {
        jqueryListener = upListenerToJqueryListener(upListener);
        upListener._asJqueryListener = jqueryListener;
        if (upListener._descriptionNumber) {
          up.fail('up.on(): The callback %o cannot be registered more than once');
        }
        upListener._descriptionNumber = ++nextUpDescriptionNumber;
      } else {
        jqueryListener = upListener._asJqueryListener;
        jqueryListener || up.fail('up.off(): The callback %o was never registered through up.on()', upListener);
      }
      jqueryDescription.push(jqueryListener);
      return jqueryDescription;
    };
    fixRenamedEvents = function(description) {
      var events;
      events = u.splitValues(description[0]);
      events = u.map(events, function(event) {
        var newEvent;
        if (newEvent = renamedEvents[event]) {
          up.warn("Deprecated: " + event + " has been renamed to " + newEvent);
          return newEvent;
        } else {
          return event;
        }
      });
      return description[0] = events.join(' ');
    };

    /***
    Listens to an event on `document`.
    
    The given event listener which will be executed whenever the
    given event is [triggered](/up.emit) on the given selector:
    
        up.on('click', '.button', function(event, $element) {
          console.log("Someone clicked the button %o", $element);
        });
    
    This is roughly equivalent to binding an event listener to `document`:
    
        $(document).on('click', '.button', function(event) {
          console.log("Someone clicked the button %o", $(this));
        });
    
    Other than jQuery, Unpoly will silently discard event listeners
    on [unsupported browsers](/up.browser.isSupported).
    
    \#\#\# Attaching structured data
    
    In case you want to attach structured data to the event you're observing,
    you can serialize the data to JSON and put it into an `[up-data]` attribute:
    
        <span class='person' up-data='{ "age": 18, "name": "Bob" }'>Bob</span>
        <span class='person' up-data='{ "age": 22, "name": "Jim" }'>Jim</span>
    
    The JSON will parsed and handed to your event handler as a third argument:
    
        up.on('click', '.person', function(event, $element, data) {
          console.log("This is %o who is %o years old", data.name, data.age);
        });
    
    \#\#\# Unbinding an event listener
    
    `up.on()` returns a function that unbinds the event listeners when called:
    
        // Define the listener
        var listener =  function() { ... };
    
        // Binding the listener returns an unbind function
        unbind = up.on('click', listener);
    
        // Unbind the listener
        unbind()
    
    There is also a function [`up.off()`](/up.off) which you can use for the same purpose:
    
        // Define the listener
        var listener =  function() { ... };
    
        // Bind the listener
        up.on('click', listener);
    
        // Unbind the listener
        up.off('click', listener)
    
    \#\#\# Migrating jQuery event handlers to `up.on()`
    
    Within the event handler, Unpoly will bind `this` to the
    native DOM element to help you migrate your existing jQuery code to
    this new syntax.
    
    So if you had this before:
    
        $(document).on('click', '.button', function() {
          $(this).something();
        });
    
    ... you can simply copy the event handler to `up.on()`:
    
        up.on('click', '.button', function() {
          $(this).something();
        });
    
    @function up.on
    @param {string} events
      A space-separated list of event names to bind.
    @param {string} [selector]
      The selector of an element on which the event must be triggered.
      Omit the selector to listen to all events with that name, regardless
      of the event target.
    @param {Function(event, $element, data)} behavior
      The handler that should be called.
      The function takes the affected element as the first argument (as a jQuery object).
      If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
      and passed as a second argument.
    @return {Function}
      A function that unbinds the event listeners when called.
    @stable
     */
    live = function() {
      var jqueryDescription, ref, upDescription;
      upDescription = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (!up.browser.isSupported()) {
        return (function() {});
      }
      jqueryDescription = upDescriptionToJqueryDescription(upDescription, true);
      rememberUpDescription(upDescription);
      (ref = $(document)).on.apply(ref, jqueryDescription);
      return function() {
        return unbind.apply(null, upDescription);
      };
    };

    /***
    Unbinds an event listener previously bound with [`up.on()`](/up.on).
    
    \#\#\# Example
    
    Let's say you are listing to clicks on `.button` elements:
    
        var listener = function() { ... };
        up.on('click', '.button', listener);
    
    You can stop listening to these events like this:
    
        up.off('click', '.button', listener);
    
    Note that you need to pass `up.off()` a reference to the same listener function
    that was passed to `up.on()` earlier.
    
    @function up.off
    @stable
     */
    unbind = function() {
      var jqueryDescription, ref, upDescription;
      upDescription = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      jqueryDescription = upDescriptionToJqueryDescription(upDescription, false);
      forgetUpDescription(upDescription);
      return (ref = $(document)).off.apply(ref, jqueryDescription);
    };
    rememberUpDescription = function(upDescription) {
      var number;
      number = upDescriptionNumber(upDescription);
      return liveUpDescriptions[number] = upDescription;
    };
    forgetUpDescription = function(upDescription) {
      var number, upListener;
      number = upDescriptionNumber(upDescription);
      upListener = u.last(upDescription);
      delete upListener._descriptionNumber;
      delete upListener._asJqueryListener;
      return delete liveUpDescriptions[number];
    };
    upDescriptionNumber = function(upDescription) {
      return u.last(upDescription)._descriptionNumber;
    };

    /***
    Emits a event with the given name and properties.
    
    The event will be triggered as a jQuery event on `document`.
    
    Other code can subscribe to events with that name using
    [`up.on()`](/up.on) or by [binding a jQuery event listener](http://api.jquery.com/on/) to `document`.
    
    \#\#\# Example
    
        up.on('my:event', function(event) {
          console.log(event.foo);
        });
    
        up.emit('my:event', { foo: 'bar' });
         * Prints "bar" to the console
    
    @function up.emit
    @param {string} eventName
      The name of the event.
    @param {Object} [eventProps={}]
      A list of properties to become part of the event object
      that will be passed to listeners. Note that the event object
      will by default include properties like `preventDefault()`
      or `stopPropagation()`.
    @param {jQuery} [eventProps.$element=$(document)]
      The element on which the event is triggered.
    @param {string|Array} [eventProps.message]
      A message to print to the console when the event is emitted.
      If omitted, a default message is printed.
      Set this to `false` to prevent any console output.
    @experimental
     */
    emit = function(eventName, eventProps) {
      var $target, event;
      if (eventProps == null) {
        eventProps = {};
      }
      event = $.Event(eventName, eventProps);
      $target = eventProps.$target || eventProps.$element || $(document);
      logEmission(eventName, eventProps);
      $target.trigger(event);
      return event;
    };
    logEmission = function(eventName, eventProps) {
      var niceMessage, niceMessageArgs, ref;
      if (eventProps.hasOwnProperty('message')) {
        niceMessage = eventProps.message;
        delete eventProps.message;
        if (niceMessage !== false) {
          if (u.isArray(niceMessage)) {
            ref = niceMessage, niceMessage = ref[0], niceMessageArgs = 2 <= ref.length ? slice.call(ref, 1) : [];
          } else {
            niceMessageArgs = [];
          }
          if (niceMessage) {
            if (u.isPresent(eventProps)) {
              return up.puts.apply(up, [niceMessage + " (%s (%o))"].concat(slice.call(niceMessageArgs), [eventName], [eventProps]));
            } else {
              return up.puts.apply(up, [niceMessage + " (%s)"].concat(slice.call(niceMessageArgs), [eventName]));
            }
          }
        }
      } else {
        if (u.isPresent(eventProps)) {
          return up.puts('Emitted event %s (%o)', eventName, eventProps);
        } else {
          return up.puts('Emitted event %s', eventName);
        }
      }
    };

    /***
    [Emits an event](/up.emit) and returns whether no listener
    has prevented the default action.
    
    @function up.bus.nobodyPrevents
    @param {string} eventName
    @param {Object} eventProps
    @param {string|Array} [eventProps.message]
    @return {boolean}
      whether no listener has prevented the default action
    @experimental
     */
    nobodyPrevents = function() {
      var args, event;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      event = emit.apply(null, args);
      return !event.isDefaultPrevented();
    };

    /***
    [Emits](/up.emit) the given event and returns a promise
    that will be fulfilled if no listener has prevented the default action.
    
    If any listener prevented the default listener
    the returned promise will never be resolved.
    
    @function up.bus.whenEmitted
    @param {string} eventName
    @param {Object} eventProps
    @param {string|Array} [eventProps.message]
    @return {Promise}
    @internal
     */
    whenEmitted = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return new Promise(function(resolve, reject) {
        if (nobodyPrevents.apply(null, args)) {
          return resolve();
        } else {
          return reject(new Error("Event " + args[0] + " was prevented"));
        }
      });
    };

    /***
    Registers an event listener to be called when the user
    presses the `Escape` key.
    
    @function up.bus.onEscape
    @param {Function} listener
      The listener function to register.
    @return {Function}
      A function that unbinds the event listeners when called.
    @experimental
     */
    onEscape = function(listener) {
      return live('keydown', 'body', function(event) {
        if (u.escapePressed(event)) {
          return listener(event);
        }
      });
    };

    /***
    Stops the given event from propagating and prevents the default action.
    
    @function up.bus.haltEvent
    @internal
     */
    haltEvent = function(event) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      return event.preventDefault();
    };

    /***
    @function up.bus.consumeAction
    @internal
     */
    consumeAction = function(event) {
      haltEvent(event);
      if (event.type !== 'up:action:consumed') {
        return emit('up:action:consumed', {
          $element: $(event.target),
          message: false
        });
      }
    };

    /***
    Makes a snapshot of the currently registered event listeners,
    to later be restored through [`up.bus.reset()`](/up.bus.reset).
    
    @internal
     */
    snapshot = function() {
      var description, number, results;
      results = [];
      for (number in liveUpDescriptions) {
        description = liveUpDescriptions[number];
        results.push(description.isDefault = true);
      }
      return results;
    };
    resetBus = function() {
      var description, doomedDescriptions, i, len, number, results;
      doomedDescriptions = [];
      for (number in liveUpDescriptions) {
        description = liveUpDescriptions[number];
        if (!description.isDefault) {
          doomedDescriptions.push(description);
        }
      }
      results = [];
      for (i = 0, len = doomedDescriptions.length; i < len; i++) {
        description = doomedDescriptions[i];
        results.push(unbind.apply(null, description));
      }
      return results;
    };

    /***
    Resets Unpoly to the state when it was booted.
    All custom event handlers, animations, etc. that have been registered
    will be discarded.
    
    This is an internal method for to enable unit testing.
    Don't use this in production.
    
    Emits event [`up:framework:reset`](/up:framework:reset).
    
    @function up.reset
    @experimental
     */
    emitReset = function() {
      emit('up:framework:reset', {
        message: 'Resetting framework'
      });
      return up.protocol.reset();
    };

    /***
    This event is [emitted](/up.emit) when Unpoly is [reset](/up.reset) during unit tests.
    
    @event up:framework:reset
    @experimental
     */
    deprecateRenamedEvent = function(oldEvent, newEvent) {
      return renamedEvents[oldEvent] = newEvent;
    };

    /***
    Boots the Unpoly framework.
    
    **This is called automatically** by including the Unpoly JavaScript files.
    
    Unpoly will not boot if the current browser is [not supported](/up.browser.isSupported).
    This leaves you with a classic server-side application on legacy browsers.
    
    @function up.boot
    @internal
     */
    boot = function() {
      if (up.browser.isSupported()) {
        emit('up:framework:boot', {
          message: 'Booting framework'
        });
        emit('up:framework:booted', {
          message: 'Framework booted'
        });
        return u.nextFrame(function() {
          return u.whenReady().then(function() {
            emit('up:app:boot', {
              message: 'Booting user application'
            });
            return emit('up:app:booted', {
              message: 'User application booted'
            });
          });
        });
      } else {
        return typeof console.log === "function" ? console.log("Unpoly doesn't support this browser. Framework was not booted.") : void 0;
      }
    };

    /***
    This event is [emitted](/up.emit) when Unpoly [starts to boot](/up.boot).
    
    @event up:framework:boot
    @internal
     */
    live('up:framework:booted', snapshot);
    live('up:framework:reset', resetBus);
    return {
      on: live,
      off: unbind,
      emit: emit,
      nobodyPrevents: nobodyPrevents,
      whenEmitted: whenEmitted,
      onEscape: onEscape,
      emitReset: emitReset,
      haltEvent: haltEvent,
      consumeAction: consumeAction,
      deprecateRenamedEvent: deprecateRenamedEvent,
      boot: boot
    };
  })(jQuery);

  up.on = up.bus.on;

  up.off = up.bus.off;

  up.emit = up.bus.emit;

  up.reset = up.bus.emitReset;

  up.boot = up.bus.boot;

}).call(this);

/***
Request parameters
==================

Methods like [`up.replace()`](/up.replace) accept request parameters (or form data values) as a `{ params }` option.

This module offers a consistent API to read and manipulate request parameters independent of their type.


\#\#\# Supported parameter types

The following types of parameters are supported:

1. an object like `{ email: 'foo@bar.com' }`
2. a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object
3. a query string like `email=foo%40bar.com`
4. an array of `{ name, value }` objects like `[{ name: 'email', value: 'foo@bar.com' }]`

@class up.params
 */

(function() {
  up.params = (function($) {
    var NATURE_ARRAY, NATURE_FORM_DATA, NATURE_MISSING, NATURE_OBJECT, NATURE_QUERY, add, arrayEntryToQuery, assign, buildArrayFromFormData, buildArrayFromObject, buildArrayFromQuery, buildFormDataFromArray, buildObjectFromArray, buildQueryFromArray, buildURL, fromField, fromForm, fromURL, get, isPrimitiveValue, merge, natureOf, safeGet, safeSet, submittingButton, toArray, toFormData, toObject, toQuery, u;
    u = up.util;
    NATURE_MISSING = 0;
    NATURE_ARRAY = 1;
    NATURE_QUERY = 2;
    NATURE_FORM_DATA = 3;
    NATURE_OBJECT = 4;
    natureOf = function(params) {
      if (u.isMissing(params)) {
        return NATURE_MISSING;
      } else if (u.isArray(params)) {
        return NATURE_ARRAY;
      } else if (u.isString(params)) {
        return NATURE_QUERY;
      } else if (u.isFormData(params)) {
        return NATURE_FORM_DATA;
      } else if (u.isObject(params)) {
        return NATURE_OBJECT;
      } else {
        return up.fail("Unsupport params type: %o", params);
      }
    };

    /***
    Returns an array representation of the given `params`.
    
    The given params value may be of any [supported type](/up.params).
    
    Each element in the returned array is an object with `{ name }` and `{ value }` properties.
    
    \#\#\# Example
    
        var array = up.params.toArray('foo=bar&baz=bam')
    
        // array is now: [
        //   { name: 'foo', value: 'bar' },
        //   { name: 'baz', value: 'bam' },
        // ]
    
    @function up.params.toArray
    @param {Object|FormData|string|Array|undefined} params
      the params to convert
    @return {Array}
      an array representation of the given params
    @experimental
     */
    toArray = function(params) {
      switch (natureOf(params)) {
        case NATURE_MISSING:
          return [];
        case NATURE_ARRAY:
          return params;
        case NATURE_QUERY:
          return buildArrayFromQuery(params);
        case NATURE_FORM_DATA:
          return buildArrayFromFormData(params);
        case NATURE_OBJECT:
          return buildArrayFromObject(params);
      }
    };

    /***
    Returns an object representation of the given `params`.
    
    The given params value may be of any [supported type](/up.params).
    
    The returned value is a simple JavaScript object whose properties correspond
    to the key/values in the given `params`.
    
    \#\#\# Example
    
        var object = up.params.toObject('foo=bar&baz=bam')
    
        // object is now: {
        //   foo: 'bar',
        //   baz: 'bam'
        // ]
    
    @function up.params.toObject
    @param {Object|FormData|string|Array|undefined} params
      the params to convert
    @return {Array}
      an object representation of the given params
    @experimental
     */
    toObject = function(params) {
      switch (natureOf(params)) {
        case NATURE_MISSING:
          return {};
        case NATURE_ARRAY:
        case NATURE_QUERY:
        case NATURE_FORM_DATA:
          return buildObjectFromArray(toArray(params));
        case NATURE_OBJECT:
          return params;
      }
    };

    /***
    Returns [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation of the given `params`.
    
    The given params value may be of any [supported type](/up.params).
    
    \#\#\# Example
    
        var formData = up.params.toFormData('foo=bar&baz=bam')
    
        formData.get('foo') // 'bar'
        formData.get('baz') // 'bam'
    
    @function up.params.toFormData
    @param {Object|FormData|string|Array|undefined} params
      the params to convert
    @return {FormData}
      a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation of the given params
    @experimental
     */
    toFormData = function(params) {
      switch (natureOf(params)) {
        case NATURE_MISSING:
          return new FormData();
        case NATURE_ARRAY:
        case NATURE_QUERY:
        case NATURE_OBJECT:
          return buildFormDataFromArray(toArray(params));
        case NATURE_FORM_DATA:
          return params;
      }
    };

    /***
    Returns an query string for the given `params`.
    
    The given params value may be of any [supported type](/up.params).
    
    The keys and values in the returned query string will be [percent-encoded](https://developer.mozilla.org/en-US/docs/Glossary/percent-encoding).
    Non-primitive values (like [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) will be omitted from
    the retuned query string.
    
    \#\#\# Example
    
        var query = up.params.toQuery({ foo: 'bar', baz: 'bam' })
    
        // query is now: 'foo=bar&baz=bam'
    
    @function up.params.toQuery
    @param {Object|FormData|string|Array|undefined} params
      the params to convert
    @return {string}
      a query string built from the given params
    @experimental
     */
    toQuery = function(params) {
      switch (natureOf(params)) {
        case NATURE_MISSING:
          return '';
        case NATURE_QUERY:
          return params;
        case NATURE_ARRAY:
        case NATURE_FORM_DATA:
        case NATURE_OBJECT:
          return buildQueryFromArray(toArray(params));
      }
    };
    arrayEntryToQuery = function(entry) {
      var query, value;
      value = entry.value;
      if (!isPrimitiveValue(value)) {
        return void 0;
      }
      query = encodeURIComponent(entry.name);
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
     */
    isPrimitiveValue = function(value) {
      return u.isMissing(value) || u.isString(value) || u.isNumber(value) || u.isBoolean(value);
    };
    safeSet = function(obj, k, value) {
      if (!u.isBasicObjectProperty(k)) {
        return obj[k] = value;
      }
    };
    safeGet = function(obj, k) {
      if (!u.isBasicObjectProperty(k)) {
        return obj[k];
      }
    };
    buildQueryFromArray = function(array) {
      var parts;
      parts = u.map(array, arrayEntryToQuery);
      parts = u.compact(parts);
      return parts.join('&');
    };
    buildArrayFromQuery = function(query) {
      var array, i, len, name, part, ref, ref1, value;
      array = [];
      ref = query.split('&');
      for (i = 0, len = ref.length; i < len; i++) {
        part = ref[i];
        if (part) {
          ref1 = part.split('='), name = ref1[0], value = ref1[1];
          name = decodeURIComponent(name);
          if (u.isGiven(value)) {
            value = decodeURIComponent(value);
          } else {
            value = null;
          }
          array.push({
            name: name,
            value: value
          });
        }
      }
      return array;
    };
    buildArrayFromObject = function(object) {
      var array, k, v;
      array = [];
      for (k in object) {
        v = object[k];
        array.push({
          name: k,
          value: v
        });
      }
      return array;
    };
    buildObjectFromArray = function(array) {
      var entry, i, len, obj;
      obj = {};
      for (i = 0, len = array.length; i < len; i++) {
        entry = array[i];
        safeSet(obj, entry.name, entry.value);
      }
      return obj;
    };
    buildArrayFromFormData = function(formData) {
      var array;
      array = [];
      u.eachIterator(formData.entries(), function(value) {
        var name, ref;
        ref = value, name = ref[0], value = ref[1];
        return array.push({
          name: name,
          value: value
        });
      });
      return array;
    };
    buildFormDataFromArray = function(array) {
      var entry, formData, i, len;
      formData = new FormData();
      for (i = 0, len = array.length; i < len; i++) {
        entry = array[i];
        formData.append(entry.name, entry.value);
      }
      return formData;
    };
    buildURL = function(base, params) {
      var parts, separator;
      parts = [base, toQuery(params)];
      parts = u.select(parts, u.isPresent);
      separator = u.contains(base, '?') ? '&' : '?';
      return parts.join(separator);
    };

    /***
    Adds to the given `params` a new  entry with the given `name` and `value`.
    
    The given params value may be of any [supported type](/up.params).
    
    The given `params` value is changed in-place, if possible. Some types, such as query strings,
    cannot be changed in-place. The return value is always a params value that includes the new entry.
    
    \#\#\# Example
    
        var obj = { foo: 'bar' }
        up.params.add(obj, 'baz', 'bam')
        // obj is now: { foo: 'bar', baz: 'bam' }
    
    @function up.params.add
    @param {string|object|FormData|Array|undefined} params
    @param {string} name
    @param {any} value
    @return {string|object|FormData|Array}
    @experimental
     */
    add = function(params, name, value) {
      var newEntry;
      newEntry = [
        {
          name: name,
          value: value
        }
      ];
      return assign(params, newEntry);
    };

    /***
    Returns a new params value that contains entries from both `params` and `otherParams`.
    
    The given params value may be of any [supported type](/up.params).
    
    This function creates a new params value. The given `params` argument is not changed.
    
    @function up.params.merge
    @param {string|object|FormData|Array|undefined} params
    @param {string|object|FormData|Array|undefined} otherParams
    @return {string|object|FormData|Array}
    @experimental
     */
    merge = function(params, otherParams) {
      var formData, otherArray, otherQuery, parts;
      switch (natureOf(params)) {
        case NATURE_MISSING:
          return merge({}, otherParams);
        case NATURE_ARRAY:
          otherArray = toArray(otherParams);
          return params.concat(otherArray);
        case NATURE_FORM_DATA:
          formData = new FormData();
          assign(formData, params);
          assign(formData, otherParams);
          return formData;
        case NATURE_QUERY:
          otherQuery = toQuery(otherParams);
          parts = u.select([params, otherQuery], u.isPresent);
          return parts.join('&');
        case NATURE_OBJECT:
          return u.merge(params, toObject(otherParams));
      }
    };

    /***
    Returns the first param value with the given `name` from the given `params`.
    
    The given params value may be of any [supported type](/up.params).
    
    \#\#\# Example
    
        var array = [
          { name: 'foo', value: 'bar' },
          { name: 'baz', value: 'bam' }
        }
    
        value = up.params.get(array, 'baz')
        // value is now: 'bam'
    
    @function up.params.get
    @experimental
     */
    get = function(params, name) {
      var entry, value;
      switch (natureOf(params)) {
        case NATURE_MISSING:
          return void 0;
        case NATURE_ARRAY:
          entry = u.detect(params, function(entry) {
            return entry.name === name;
          });
          return entry != null ? entry.value : void 0;
        case NATURE_FORM_DATA:
          value = params.get(name);
          if (u.isNull(value)) {
            value = void 0;
          }
          return value;
        case NATURE_QUERY:
          return safeGet(toObject(params), name);
        case NATURE_OBJECT:
          return safeGet(params, name);
      }
    };

    /***
    Extends the given `params` with entries from the given `otherParams`.
    
    The given params value may be of any [supported type](/up.params).
    
    The given `params` is changed in-place, if possible. Some types, such as query strings,
    cannot be changed in-place. The return value is always a params value that includes the new entries.
    
    @function up.params.assign
    @param {string|object|FormData|Array|undefined} params
    @param {string|object|FormData|Array|undefined} otherParams
    @return {string|object|FormData|Array}
    @experimental
     */
    assign = function(params, otherParams) {
      var entry, i, len, otherArray;
      switch (natureOf(params)) {
        case NATURE_ARRAY:
          otherArray = toArray(otherParams);
          params.push.apply(params, otherArray);
          return params;
        case NATURE_FORM_DATA:
          otherArray = toArray(otherParams);
          for (i = 0, len = otherArray.length; i < len; i++) {
            entry = otherArray[i];
            params.append(entry.name, entry.value);
          }
          return params;
        case NATURE_OBJECT:
          return u.assign(params, toObject(otherParams));
        case NATURE_QUERY:
        case NATURE_MISSING:
          return merge(params, otherParams);
      }
    };
    submittingButton = function(form) {
      var $activeElement, $form, submitButtonSelector;
      $form = $(form);
      submitButtonSelector = up.form.submitButtonSelector();
      $activeElement = $(document.activeElement);
      if ($activeElement.is(submitButtonSelector) && $form.has($activeElement)) {
        return $activeElement[0];
      } else {
        return $form.find(submitButtonSelector)[0];
      }
    };

    /***
    Serializes request params from the given `<form>`.
    
    The returned params may be passed as `{ params }` option to
    [`up.request()`](/up.request) or [`up.replace()`](/up.replace).
    
    The serialized params will include the form's submit button, if that
    button as a `name` attribute.
    
    \#\#\#\# Example
    
    Given this HTML form:
    
        <form>
          <input type="text" name="name" value="Foo Bar">
          <input type="text" name="email" value="foo@bar.com">
        </form>
    
    This would serialize the form into an array representation:
    
        var params = up.params.fromForm('input[name=email]')
    
        // params is now: [
        //   { name: 'name', value: 'Foo Bar' },
        //   { name: 'email', value: 'foo@bar.com' }
        // ]
    
    @function up.params.fromForm
    @param {Element|jQuery|string} form
    @return {Array}
    @experimental
     */
    fromForm = function(form) {
      var button, fields;
      if (form = u.element(form)) {
        fields = form.querySelectorAll(up.form.fieldSelector());
        if (button = submittingButton(form)) {
          fields = u.toArray(fields);
          fields.push(button);
        }
        return u.flatMap(fields, fromField);
      }
    };

    /***
    Serializes request params from a single [input field](/up.form.config#config.fields).
    To serialize an entire form, use [`up.params.fromForm()`](/up.params.fromForm).
    
    Note that some fields may produce multiple params, such as `<select multiple>`.
    
    \#\#\#\# Example
    
    Given this HTML form:
    
        <form>
          <input type="text" name="email" value="foo@bar.com">
          <input type="password" name="password">
        </form>
    
    This would retrieve request parameters from the `email` field:
    
        var params = up.params.fromField('input[name=email]')
    
        // params is now: [{ name: 'email', value: 'foo@bar.com' }]
    
    @function up.params.fromField
    @param {Element|jQuery|string} form
    @return {Array}
      an array of `{ name, value }` objects
    @experimental
     */
    fromField = function(field) {
      var file, i, j, len, len1, name, option, params, ref, ref1, tagName, type;
      params = [];
      if ((field = u.element(field)) && (name = field.name) && (!field.disabled)) {
        tagName = field.tagName;
        type = field.type;
        if (tagName === 'SELECT') {
          ref = field.querySelectorAll('option');
          for (i = 0, len = ref.length; i < len; i++) {
            option = ref[i];
            if (option.selected) {
              params.push({
                name: name,
                value: option.value
              });
            }
          }
        } else if (type === 'checkbox' || type === 'radio') {
          if (field.checked) {
            params.push({
              name: name,
              value: field.value
            });
          }
        } else if (type === 'file') {
          ref1 = field.files;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            file = ref1[j];
            params.push({
              name: name,
              value: file
            });
          }
        } else {
          params.push({
            name: name,
            value: field.value
          });
        }
      }
      return params;
    };

    /***
    Returns the [query string](https://en.wikipedia.org/wiki/Query_string) from the given URL.
    
    The query string is returned **without** a leading question mark (`?`).
    Returns `undefined` if the given URL has no query component.
    
    You can access individual values from the returned query string using functions like
    [`up.params.get()`](/up.params.get) or [`up.params.toObject()`](/up.params.toObject).
    
    \#\#\# Example
    
        var query = up.params.fromURL('http://foo.com?bar=baz')
    
        // query is now: 'bar=baz'
    
    @function up.params.fromURL
    @param {string} url
      The URL from which to extract the query string.
    @return {string|undefined}
      The given URL's query string, or `undefined` if the URL has no query component.
    @experimental
     */
    fromURL = function(url) {
      var query, urlParts;
      urlParts = u.parseUrl(url);
      if (query = urlParts.search) {
        query = query.replace(/^\?/, '');
        return query;
      }
    };
    return {
      toArray: toArray,
      toObject: toObject,
      toQuery: toQuery,
      toFormData: toFormData,
      buildURL: buildURL,
      get: get,
      add: add,
      assign: assign,
      merge: merge,
      fromForm: fromForm,
      fromURL: fromURL
    };
  })(jQuery);

}).call(this);
(function() {


}).call(this);

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
   This issue affects Safari 9 and 10 (last tested in 2017-08).
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


@class up.protocol
 */

(function() {
  up.protocol = (function($) {
    var config, csrfParam, csrfToken, initialRequestMethod, locationFromXhr, methodFromXhr, reset, titleFromXhr, u;
    u = up.util;

    /***
    @function up.protocol.locationFromXhr
    @internal
     */
    locationFromXhr = function(xhr) {
      return xhr.getResponseHeader(config.locationHeader) || xhr.responseURL;
    };

    /***
    @function up.protocol.titleFromXhr
    @internal
     */
    titleFromXhr = function(xhr) {
      return xhr.getResponseHeader(config.titleHeader);
    };

    /***
    @function up.protocol.methodFromXhr
    @internal
     */
    methodFromXhr = function(xhr) {
      var method;
      if (method = xhr.getResponseHeader(config.methodHeader)) {
        return u.normalizeMethod(method);
      }
    };

    /***
    Server-side companion libraries like unpoly-rails set this cookie so we
    have a way to detect the request method of the initial page load.
    There is no JavaScript API for this.
    
    @function up.protocol.initialRequestMethod
    @internal
     */
    initialRequestMethod = u.memoize(function() {
      var methodFromServer;
      methodFromServer = up.browser.popCookie(config.methodCookie);
      return (methodFromServer || 'get').toLowerCase();
    });
    up.bus.on('up:framework:booted', initialRequestMethod);

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
    @param {String|Function} [config.csrfParam]
      The `name` of the hidden `<input>` used for sending a
      [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern) when
      submitting a default, non-AJAX form. For AJAX request the token is sent as an HTTP header instead.
    
      The parameter name can be configured as a string or as function that returns the parameter name.
      If no name is set, no token will be sent.
    
      Defaults to the `content` attribute of a `<meta>` tag named `csrf-token`:
    
          <meta name="csrf-param" content="authenticity_token" />
    
    @param {String|Function} [config.csrfToken]
      The [CSRF token](https://en.wikipedia.org/wiki/Cross-site_request_forgery#Synchronizer_token_pattern)
      to send for unsafe requests. The token will be sent as either a HTTP header (for AJAX requests)
      or hidden form `<input>` (for default, non-AJAX form submissions).
    
      The token can either be configured as a string or as function that returns the token.
      If no token is set, no token will be sent.
    
      Defaults to the `content` attribute of a `<meta>` tag named `csrf-token`:
    
          <meta name='csrf-token' content='secret12345'>
    
    @experimental
     */
    config = u.config({
      targetHeader: 'X-Up-Target',
      failTargetHeader: 'X-Up-Fail-Target',
      locationHeader: 'X-Up-Location',
      validateHeader: 'X-Up-Validate',
      titleHeader: 'X-Up-Title',
      methodHeader: 'X-Up-Method',
      methodCookie: '_up_method',
      methodParam: '_method',
      csrfParam: function() {
        return $('meta[name="csrf-param"]').attr('content');
      },
      csrfToken: function() {
        return $('meta[name="csrf-token"]').attr('content');
      },
      csrfHeader: 'X-CSRF-Token'
    });
    csrfParam = function() {
      return u.evalOption(config.csrfParam);
    };
    csrfToken = function() {
      return u.evalOption(config.csrfToken);
    };
    reset = function() {
      return config.reset();
    };
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
  })(jQuery);

}).call(this);

/***
Logging
=======

Unpoly can print debugging information to the developer console, e.g.:

- Which [events](/up.bus) are called
- When we're [making requests to the network](/up.proxy)
- Which [compilers](/up.syntax) are applied to which elements

You can activate logging by calling [`up.log.enable()`](/up.log.enable).
The output can be configured using the [`up.log.config`](/up.log.config) property.

@class up.log
 */

(function() {
  var slice = [].slice;

  up.log = (function($) {
    var b, config, debug, disable, enable, error, group, prefix, printBanner, puts, reset, sessionStore, setEnabled, u, warn;
    u = up.util;
    b = up.browser;
    sessionStore = new up.store.Session('up.log');

    /***
    Configures the logging output on the developer console.
    
    @property up.log.config
    @param {boolean} [options.enabled=false]
      Whether Unpoly will print debugging information to the developer console.
    
      Debugging information includes which elements are being [compiled](/up.syntax)
      and which [events](/up.bus) are being emitted.
      Note that errors will always be printed, regardless of this setting.
    @param {boolean} [options.collapse=false]
      Whether debugging information is printed as a collapsed tree.
    
      Set this to `true` if you are overwhelmed by the debugging information Unpoly
      prints to the developer console.
    @param {string} [options.prefix='[UP] ']
      A string to prepend to Unpoly's logging messages so you can distinguish it from your own messages.
    @stable
     */
    config = u.config({
      prefix: '[UP] ',
      enabled: sessionStore.get('enabled'),
      collapse: false
    });
    reset = function() {
      return config.reset();
    };
    prefix = function(message) {
      return "" + config.prefix + message;
    };

    /***
    Prints a debugging message to the browser console.
    
    @function up.log.debug
    @param {string} message
    @param {Array} args...
    @internal
     */
    debug = function() {
      var args, message;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (config.enabled && message) {
        return b.puts.apply(b, ['debug', prefix(message)].concat(slice.call(args)));
      }
    };

    /***
    Prints a logging message to the browser console.
    
    @function up.puts
    @param {string} message
    @param {Array} args...
    @internal
     */
    puts = function() {
      var args, message;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (config.enabled && message) {
        return b.puts.apply(b, ['log', prefix(message)].concat(slice.call(args)));
      }
    };

    /***
    @function up.warn
    @internal
     */
    warn = function() {
      var args, message;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (message) {
        return b.puts.apply(b, ['warn', prefix(message)].concat(slice.call(args)));
      }
    };

    /***
    - Makes sure the group always closes
    - Does not make a group if the message is nil
    
    @function up.log.group
    @internal
     */
    group = function() {
      var args, block, message, stream;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      block = args.pop();
      if (config.enabled && message) {
        stream = config.collapse ? 'groupCollapsed' : 'group';
        b.puts.apply(b, [stream, prefix(message)].concat(slice.call(args)));
        try {
          return block();
        } finally {
          if (message) {
            b.puts('groupEnd');
          }
        }
      } else {
        return block();
      }
    };

    /***
    @function up.log.error
    @internal
     */
    error = function() {
      var args, message;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (message) {
        return b.puts.apply(b, ['error', prefix(message)].concat(slice.call(args)));
      }
    };
    printBanner = function() {
      var banner;
      banner = " __ _____  ___  ___  / /_ __\n" + ("/ // / _ \\/ _ \\/ _ \\/ / // /  " + up.version + "\n") + "\\___/_//_/ .__/\\___/_/\\_. / \n" + "        / /            / /\n" + "\n";
      if (config.enabled) {
        banner += "Call `up.log.disable()` to disable logging for this session.";
      } else {
        banner += "Call `up.log.enable()` to enable logging for this session.";
      }
      return b.puts('log', banner);
    };
    up.on('up:framework:boot', printBanner);
    up.on('up:framework:reset', reset);
    setEnabled = function(value) {
      sessionStore.set('enabled', value);
      return config.enabled = value;
    };

    /***
    Makes future Unpoly events print vast amounts of debugging information to the developer console.
    
    Debugging information includes which elements are being [compiled](/up.syntax)
    and which [events](/up.bus) are being emitted.
    
    @function up.log.enable
    @stable
     */
    enable = function() {
      return setEnabled(true);
    };

    /***
    Prevents future Unpoly events from printing vast amounts of debugging information to the developer console.
    
    Errors will still be printed, even with logging disabled.
    
    @function up.log.disable
    @stable
     */
    disable = function() {
      return setEnabled(false);
    };
    return {
      puts: puts,
      debug: debug,
      error: error,
      warn: warn,
      group: group,
      config: config,
      enable: enable,
      disable: disable
    };
  })(jQuery);

  up.puts = up.log.puts;

  up.warn = up.log.warn;

}).call(this);

/***
Toast alerts
============

@class up.toast
 */

(function() {
  var slice = [].slice;

  up.toast = (function($) {
    var VARIABLE_FORMATTER, addAction, b, close, isOpen, messageToHtml, open, reset, state, u;
    u = up.util;
    b = up.browser;
    VARIABLE_FORMATTER = function(arg) {
      return "<span class='up-toast-variable'>" + (u.escapeHtml(arg)) + "</span>";
    };
    state = u.config({
      $toast: null
    });
    reset = function() {
      close();
      return state.reset();
    };
    messageToHtml = function(message) {
      if (u.isArray(message)) {
        message[0] = u.escapeHtml(message[0]);
        message = b.sprintfWithFormattedArgs.apply(b, [VARIABLE_FORMATTER].concat(slice.call(message)));
      } else {
        message = u.escapeHtml(message);
      }
      return message;
    };
    isOpen = function() {
      return !!state.$toast;
    };
    addAction = function($actions, label, callback) {
      var $action;
      $action = $('<span class="up-toast-action"></span>').text(label);
      $action.on('click', callback);
      return $action.appendTo($actions);
    };
    open = function(message, options) {
      var $actions, $message, $toast, action;
      if (options == null) {
        options = {};
      }
      close();
      $toast = $('<div class="up-toast"></div>').prependTo('body');
      $message = $('<div class="up-toast-message"></div>').appendTo($toast);
      $actions = $('<div class="up-toast-actions"></div>').appendTo($toast);
      message = messageToHtml(message);
      $message.html(message);
      if (action = options.action || options.inspect) {
        addAction($actions, action.label, action.callback);
      }
      addAction($actions, 'Close', close);
      return state.$toast = $toast;
    };
    close = function() {
      if (isOpen()) {
        state.$toast.remove();
        return state.$toast = null;
      }
    };
    up.on('up:framework:reset', reset);
    return {
      open: open,
      close: close,
      reset: reset,
      isOpen: isOpen
    };
  })(jQuery);

}).call(this);

/***
Custom JavaScript
=================

Every app needs a way to pair JavaScript snippets with certain HTML elements,
in order to integrate libraries or implement custom behavior.

Unpoly lets you organize your JavaScript snippets using [compilers](/up.compiler).

For instance, to activate the [Masonry](http://masonry.desandro.com/) jQuery plugin for every element
with a `grid` class, use this compiler:

    up.compiler('.grid', function($element) {
      $element.masonry();
    });

The compiler function will be called on matching elements when the page loads
or when a matching fragment is [inserted via AJAX](/up.link) later.

@class up.syntax
 */

(function() {
  var slice = [].slice;

  up.syntax = (function($) {
    var SYSTEM_MACRO_PRIORITIES, buildCompiler, clean, compile, compilers, detectSystemMacroPriority, insertCompiler, isBooting, macros, readData, registerCompiler, registerDestructor, registerMacro, reset, u;
    u = up.util;
    SYSTEM_MACRO_PRIORITIES = {
      '[up-back]': -100,
      '[up-drawer]': -200,
      '[up-dash]': -200,
      '[up-expand]': -300,
      '[data-method]': -400,
      '[data-confirm]': -400
    };
    isBooting = true;
    compilers = [];
    macros = [];

    /***
    Registers a function to be called whenever an element with
    the given selector is inserted into the DOM.
    
    Use compilers to activate your custom Javascript behavior on matching
    elements.
    
    You should migrate your [jQuery ready callbacks](https://api.jquery.com/ready/)
    to compilers.
    
    
    \#\#\# Example
    
    Let's say that any element with the `action` class should alert a message when clicked.
    We can implement this behavior as a compiler function that is called on all elements matching
    the `.action` selector:
    
        up.compiler('.action', function($element) {
          $element.on('click', function() {
            alert('Action was clicked!');
          });
        });
    
    The compiler function will be called once for each matching element when
    the page loads, or when a matching fragment is [inserted](/up.replace) later.
    
    
    \#\#\# Integrating jQuery plugins
    
    `up.compiler()` is a great way to integrate jQuery plugins.
    Let's say your JavaScript plugin wants you to call `lightboxify()`
    on links that should open a lightbox. You decide to
    do this for all links with an `lightbox` class:
    
        <a href="river.png" class="lightbox">River</a>
        <a href="ocean.png" class="lightbox">Ocean</a>
    
    This JavaScript will do exactly that:
    
        up.compiler('a.lightbox', function($element) {
          $element.lightboxify();
        });
    
    
    \#\#\# Custom elements
    
    You can use `up.compiler()` to implement custom elements like this:
    
        <clock></clock>
    
    Here is the JavaScript that inserts the current time into to these elements:
    
        up.compiler('clock', function($element) {
          var now = new Date();
          $element.text(now.toString()));
        });
    
    
    \#\#\# Cleaning up after yourself
    
    If your compiler returns a function, Unpoly will use this as a *destructor* to
    clean up if the element leaves the DOM. Note that in Unpoly the same DOM ad JavaScript environment
    will persist through many page loads, so it's important to not create
    [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).
    
    You should clean up after yourself whenever your compilers have global
    side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
    or [event handlers bound to the document root](/up.on).
    
    Here is a version of `<clock>` that updates
    the time every second, and cleans up once it's done. Note how it returns
    a function that calls `clearInterval`:
    
        up.compiler('clock', function($element) {
    
          function update() {
            var now = new Date();
            $element.text(now.toString()));
          }
    
          setInterval(update, 1000);
    
          return function() {
            clearInterval(update);
          };
    
        });
    
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
    
    The JSON will parsed and handed to your compiler as a second argument:
    
        up.compiler('.google-map', function($element, pins) {
    
          var map = new google.maps.Map($element);
    
          pins.forEach(function(pin) {
            var position = new google.maps.LatLng(pin.lat, pin.lng);
            new google.maps.Marker({
              position: position,
              map: map,
              title: pin.title
            });
          });
    
        });
    
    
    \#\#\# Migrating jQuery event handlers to `up.compiler()`
    
    Within the compiler, Unpoly will bind `this` to the
    native DOM element to help you migrate your existing jQuery code to
    this new syntax.
    
    So if you had this before:
    
        $(function() {
          $('.action').on('click', function() {
            $(this).something();
          });
        });
    
    ... you can reuse the callback function like this:
    
        up.compiler('.action', function($element) {
          $element.on('click', function() {
            $(this).something();
          });
        });
    
    
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
    @param {Function($element, data)} compiler
      The function to call when a matching element is inserted.
      The function takes the new element as the first argument (as a jQuery object).
      If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
      and passed as a second argument.
    
      The function may return a destructor function that destroys the compiled
      object before it is removed from the DOM. The destructor is supposed to
      [clear global state](/up.compiler#cleaning-up-after-yourself)
      such as timeouts and event handlers bound to the document.
      The destructor is *not* expected to remove the element from the DOM, which
      is already handled by [`up.destroy()`](/up.destroy).
    @stable
     */
    registerCompiler = function() {
      var args, compiler;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      compiler = buildCompiler.apply(null, args);
      return insertCompiler(compilers, compiler);
    };

    /***
    Registers a [compiler](/up.compiler) that is run before all other compilers.
    
    You can use `up.macro()` to register a compiler that sets other UJS attributes.
    
    \#\#\# Example
    
    You will sometimes find yourself setting the same combination of UJS attributes again and again:
    
        <a href="/page1" up-target=".content" up-transition="cross-fade" up-duration="300">Page 1</a>
        <a href="/page2" up-target=".content" up-transition="cross-fade" up-duration="300">Page 2</a>
        <a href="/page3" up-target=".content" up-transition="cross-fade" up-duration="300">Page 3</a>
    
    We would much rather define a new `content-link` attribute that let's us
    write the same links like this:
    
        <a href="/page1" content-link>Page 1</a>
        <a href="/page2" content-link>Page 2</a>
        <a href="/page3" content-link>Page 3</a>
    
    We can define the `content-link` attribute by registering a macro that
    sets the `up-target`, `up-transition` and `up-duration` attributes for us:
    
        up.macro('[content-link]', function($link) {
          $link.attr('up-target', '.content');
          $link.attr('up-transition', 'cross-fade');
          $link.attr('up-duration', '300');
        });
    
    Examples for built-in macros are [`a[up-dash]`](/a-up-dash) and [`[up-expand]`](/up-expand).
    
    @function up.macro
    @param {string} selector
      The selector to match.
    @param {Object} options
      See options for [`up.compiler()`](/up.compiler).
    @param {Function($element, data)} macro
      The function to call when a matching element is inserted.
      See [`up.compiler()`](/up.compiler) for details.
    @stable
     */
    registerMacro = function() {
      var args, macro;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      macro = buildCompiler.apply(null, args);
      if (isBooting) {
        macro.priority = detectSystemMacroPriority(macro.selector) || up.fail('Unregistered priority for system macro %o', macro.selector);
      }
      return insertCompiler(macros, macro);
    };
    detectSystemMacroPriority = function(macroSelector) {
      var priority, substr;
      for (substr in SYSTEM_MACRO_PRIORITIES) {
        priority = SYSTEM_MACRO_PRIORITIES[substr];
        if (macroSelector.indexOf(substr) >= 0) {
          return priority;
        }
      }
    };
    buildCompiler = function() {
      var args, callback, options, selector;
      selector = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      callback = args.pop();
      options = u.extractOptions(args);
      options = u.options(options, {
        selector: selector,
        isSystem: isBooting,
        priority: 0,
        batch: false,
        keep: false
      });
      return u.assign(callback, options);
    };
    insertCompiler = function(queue, newCompiler) {
      var existingCompiler, index;
      index = 0;
      while ((existingCompiler = queue[index]) && (existingCompiler.priority >= newCompiler.priority)) {
        index += 1;
      }
      return queue.splice(index, 0, newCompiler);
    };

    /***
    Applies all compilers on the given element and its descendants.
    Unlike [`up.hello()`](/up.hello), this doesn't emit any events.
    
    @function up.syntax.compile
    @param {Array<Element>} [options.skip]
      A list of elements whose subtrees should not be compiled.
    @internal
     */
    compile = function($fragment, options) {
      var compileRun, orderedCompilers;
      orderedCompilers = macros.concat(compilers);
      compileRun = new up.CompilePass($fragment, orderedCompilers, options);
      return compileRun.compile();
    };

    /***
    @function up.syntax.destructor
    @internal
     */
    registerDestructor = function(element, destructor) {
      var destructors;
      element = u.element(element);
      if (!(destructors = element.upDestructors)) {
        destructors = [];
        element.upDestructors = destructors;
        element.classList.add('up-can-clean');
      }
      return destructors.push(destructor);
    };

    /***
    Runs any destroyers on the given fragment and its descendants.
    Unlike [`up.destroy()`](/up.destroy), this doesn't emit any events
    and does not remove the element from the DOM.
    
    @function up.syntax.clean
    @internal
     */
    clean = function($fragment) {
      var cleanables;
      cleanables = u.selectInSubtree($fragment, '.up-can-clean');
      return u.each(cleanables, function(cleanable) {
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
    
    The JSON will parsed and handed to your compiler as a second argument:
    
        up.compiler('.google-map', function($element, pins) {
    
          var map = new google.maps.Map($element);
    
          pins.forEach(function(pin) {
            var position = new google.maps.LatLng(pin.lat, pin.lng);
            new google.maps.Marker({
              position: position,
              map: map,
              title: pin.title
            });
          });
    
        });
    
    Similarly, when an event is triggered on an element annotated with
    [`up-data`], the parsed object will be passed to any matching
    [`up.on()`](/up.on) handlers.
    
        up.on('click', '.google-map', function(event, $element, pins) {
          console.log("There are %d pins on the clicked map", pins.length);
        });
    
    @selector [up-data]
    @param {JSON} up-data
      A serialized JSON string
    @stable
     */
    readData = function(elementOrSelector) {
      var element;
      if (element = u.element(elementOrSelector)) {
        return u.jsonAttr(element, 'up-data') || {};
      }
    };

    /***
    Resets the list of registered compiler directives to the
    moment when the framework was booted.
    
    @internal
     */
    reset = function() {
      compilers = u.select(compilers, 'isSystem');
      return macros = u.select(macros, 'isSystem');
    };
    up.on('up:framework:booted', function() {
      return isBooting = false;
    });
    up.on('up:framework:reset', reset);
    return {
      compiler: registerCompiler,
      macro: registerMacro,
      destructor: registerDestructor,
      compile: compile,
      clean: clean,
      data: readData
    };
  })(jQuery);

  up.compiler = up.syntax.compiler;

  up.destructor = up.syntax.destructor;

  up.macro = up.syntax.macro;

}).call(this);

/***
History
========

In an Unpoly app, every page has an URL.

[Fragment updates](/up.link) automatically update the URL.

@class up.history
 */

(function() {
  up.history = (function($) {
    var buildState, config, currentUrl, isCurrentUrl, manipulate, nextPreviousUrl, normalizeUrl, observeNewUrl, pop, previousUrl, push, register, replace, reset, restoreStateOnPop, u;
    u = up.util;

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
    config = u.config({
      enabled: true,
      popTargets: ['body'],
      restoreScroll: true
    });

    /***
    Returns the previous URL in the browser history.
    
    Note that this will only work reliably for history changes that
    were applied by [`up.history.push()`](/up.history.replace) or
    [`up.history.replace()`](/up.history.replace).
    
    @function up.history.previousUrl
    @internal
     */
    previousUrl = void 0;
    nextPreviousUrl = void 0;
    reset = function() {
      config.reset();
      previousUrl = void 0;
      return nextPreviousUrl = void 0;
    };
    normalizeUrl = function(url, normalizeOptions) {
      normalizeOptions || (normalizeOptions = {});
      normalizeOptions.hash = true;
      return u.normalizeUrl(url, normalizeOptions);
    };

    /***
    Returns a normalized URL for the current history entry.
    
    @function up.history.url
    @experimental
     */
    currentUrl = function(normalizeOptions) {
      return normalizeUrl(up.browser.url(), normalizeOptions);
    };
    isCurrentUrl = function(url) {
      var normalizeOptions;
      normalizeOptions = {
        stripTrailingSlash: true
      };
      return normalizeUrl(url, normalizeOptions) === currentUrl(normalizeOptions);
    };

    /***
    Remembers the given URL so we can offer `up.history.previousUrl()`.
    
    @function observeNewUrl
    @internal
     */
    observeNewUrl = function(url) {
      if (nextPreviousUrl) {
        previousUrl = nextPreviousUrl;
        nextPreviousUrl = void 0;
      }
      return nextPreviousUrl = url;
    };

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
    replace = function(url) {
      if (manipulate('replaceState', url)) {
        return up.emit('up:history:replaced', {
          url: url
        });
      }
    };

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
    push = function(url, options) {
      options = u.options(options, {
        force: false
      });
      url = normalizeUrl(url);
      if ((options.force || !isCurrentUrl(url)) && up.bus.nobodyPrevents('up:history:push', {
        url: url,
        message: "Adding history entry for " + url
      })) {
        if (manipulate('pushState', url)) {
          return up.emit('up:history:pushed', {
            url: url,
            message: "Advanced to location " + url
          });
        } else {
          return up.emit('up:history:muted', {
            url: url,
            message: "Did not advance to " + url + " (history is unavailable)"
          });
        }
      }
    };

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
    manipulate = function(method, url) {
      var state;
      if (up.browser.canPushState() && config.enabled) {
        state = buildState();
        window.history[method](state, '', url);
        observeNewUrl(currentUrl());
        return true;
      } else {
        return false;
      }
    };
    buildState = function() {
      return {
        fromUp: true
      };
    };
    restoreStateOnPop = function(state) {
      var popSelector, replaced, url;
      if (state != null ? state.fromUp : void 0) {
        url = currentUrl();
        up.emit('up:history:restore', {
          url: url,
          message: "Restoring location " + url
        });
        popSelector = config.popTargets.join(', ');
        replaced = up.replace(popSelector, url, {
          history: false,
          title: true,
          reveal: false,
          transition: 'none',
          saveScroll: false,
          restoreScroll: config.restoreScroll,
          layer: 'page'
        });
        return replaced.then(function() {
          url = currentUrl();
          return up.emit('up:history:restored', {
            url: url,
            message: "Restored location " + url
          });
        });
      } else {
        return up.puts('Ignoring a state not pushed by Unpoly (%o)', state);
      }
    };
    pop = function(event) {
      var state;
      observeNewUrl(currentUrl());
      up.layout.saveScroll({
        url: previousUrl
      });
      state = event.originalEvent.state;
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
    if (up.browser.canPushState()) {
      register = function() {
        $(window).on("popstate", pop);
        return replace(currentUrl(), {
          force: true
        });
      };
      if (typeof jasmine !== "undefined" && jasmine !== null) {
        register();
      } else {
        setTimeout(register, 100);
      }
    }

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
    up.macro('a[up-back], [up-href][up-back]', function($link) {
      if (u.isPresent(previousUrl)) {
        u.setMissingAttrs($link, {
          'up-href': previousUrl,
          'up-restore-scroll': ''
        });
        $link.removeAttr('up-back');
        return up.link.makeFollowable($link);
      }
    });
    up.on('up:framework:reset', reset);
    return {
      config: config,
      push: push,
      replace: replace,
      url: currentUrl,
      isUrl: isCurrentUrl,
      previousUrl: function() {
        return previousUrl;
      },
      normalizeUrl: normalizeUrl
    };
  })(jQuery);

}).call(this);

/***
Application layout
==================

You can [make Unpoly aware](/up.layout.config) of fixed elements in your
layout, such as navigation bars or headers. Unpoly will respect these sticky
elements when [revealing elements](/up.reveal) or [opening a modal dialog](/a-up-modal).

This modules also contains functions to programmatically [scroll a viewport](/up.scroll)
or [reveal an element within its viewport](/up.reveal).

Bootstrap integration
---------------------

When using Bootstrap integration (`unpoly-bootstrap3.js` and `unpoly-bootstrap3.css`)
Unpoly will automatically be aware of sticky Bootstrap components such as
[fixed navbar](https://getbootstrap.com/examples/navbar-fixed-top/).

@class up.layout
 */

(function() {
  var slice = [].slice;

  up.layout = (function($) {
    var absolutize, anchoredRight, config, finishScrolling, firstHashTarget, fixedChildren, lastScrollTops, measureObstruction, pureHash, reset, restoreScroll, reveal, revealHash, saveScroll, scroll, scrollAbruptlyNow, scrollAfterInsertFragment, scrollTopKey, scrollTops, scrollWithAnimateNow, scrollingTracker, u, viewportOf, viewportSelector, viewports, viewportsWithin;
    u = up.util;

    /***
    Configures the application layout.
    
    @property up.layout.config
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
    @param {number} [config.duration=0]
      The duration of the scrolling animation in milliseconds.
      Setting this to `0` will disable scrolling animations.
    @param {string} [config.easing='swing']
      The timing function that controls the animation's acceleration.
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @param {number} [config.snap=50]
      When [revealing](/up.reveal) elements, Unpoly will scroll an viewport
      to the top when the revealed element is closer to the top than `config.snap`.
    @param {number} [config.substance=150]
      A number indicating how many top pixel rows of an element to [reveal](/up.reveal).
    @stable
     */
    config = u.config({
      duration: 0,
      viewports: ['.up-modal-viewport', '[up-viewport]'],
      fixedTop: ['[up-fixed~=top]'],
      fixedBottom: ['[up-fixed~=bottom]'],
      anchoredRight: ['[up-anchored~=right]', '[up-fixed~=top]', '[up-fixed~=bottom]', '[up-fixed~=right]'],
      snap: 50,
      substance: 150,
      easing: 'swing'
    });
    lastScrollTops = new up.Cache({
      size: 30,
      key: up.history.normalizeUrl
    });
    scrollingTracker = new up.MotionTracker('scrolling');
    reset = function() {
      config.reset();
      lastScrollTops.clear();
      return scrollingTracker.reset();
    };

    /***
    Scrolls the given viewport to the given Y-position.
    
    A "viewport" is an element that has scrollbars, e.g. `<body>` or
    a container with `overflow-x: scroll`.
    
    \#\#\# Example
    
    This will scroll a `<div class="main">...</div>` to a Y-position of 100 pixels:
    
        up.scroll('.main', 100);
    
    \#\#\# Animating the scrolling motion
    
    The scrolling can (optionally) be animated.
    
        up.scroll('.main', 100, {
          easing: 'swing',
          duration: 250
        });
    
    If the given viewport is already in a scroll animation when `up.scroll()`
    is called a second time, the previous animation will instantly jump to the
    last frame before the next animation is started.
    
    @function up.scroll
    @param {string|Element|jQuery} viewport
      The container element to scroll.
    @param {number} scrollPos
      The absolute number of pixels to set the scroll position to.
    @param {number}[options.duration]
      The number of miliseconds for the scrolling's animation.
    @param {string}[options.easing]
      The timing function that controls the acceleration for the scrolling's animation.
    @return {Promise}
      A promise that will be fulfilled when the scrolling ends.
    @experimental
     */
    scroll = function(viewport, scrollTop, options) {
      var $viewport;
      $viewport = $(viewport);
      options = u.options(options);
      options.duration = u.option(options.duration, config.duration);
      options.easing = u.option(options.easing, config.easing);
      return finishScrolling($viewport).then(function() {
        if (up.motion.isEnabled() && options.duration > 0) {
          return scrollWithAnimateNow($viewport, scrollTop, options);
        } else {
          return scrollAbruptlyNow($viewport, scrollTop);
        }
      });
    };
    scrollWithAnimateNow = function($scrollable, scrollTop, animateOptions) {
      var start;
      start = function() {
        var finish, scrollDone;
        finish = function() {
          return $scrollable.finish();
        };
        $scrollable.on(scrollingTracker.eventName, finish);
        scrollDone = $scrollable.animate({
          scrollTop: scrollTop
        }, animateOptions).promise();
        scrollDone.then(function() {
          return $scrollable.off(scrollingTracker.eventName);
        });
        return scrollDone;
      };
      return scrollingTracker.claim($scrollable, start);
    };
    scrollAbruptlyNow = function($scrollable, scrollTop) {
      $scrollable.scrollTop(scrollTop);
      return Promise.resolve();
    };

    /***
    Finishes scrolling animations in the given element, its ancestors or its descendants.
    
    @function up.layout.finishScrolling
    @param {string|Element|jQuery}
    @return {Promise}
    @internal
     */
    finishScrolling = function(element) {
      var $scrollable;
      if (!up.motion.isEnabled()) {
        return Promise.resolve();
      }
      $scrollable = viewportOf(element);
      return scrollingTracker.finish($scrollable);
    };

    /***
    @function up.layout.anchoredRight
    @internal
     */
    anchoredRight = function() {
      var selector;
      selector = config.anchoredRight.join(',');
      return $(selector);
    };

    /***
    @function measureObstruction
    @return {Object}
    @internal
     */
    measureObstruction = function(viewportHeight) {
      var $bottomObstructors, $topObstructors, bottomObstructions, composeHeight, measureBottomObstructor, measureTopObstructor, topObstructions;
      composeHeight = function(obstructor, distanceFromEdgeProps) {
        var distanceFromEdge;
        distanceFromEdge = u.sum(distanceFromEdgeProps, function(prop) {
          return u.readComputedStyleNumber(obstructor, prop);
        }) || 0;
        return distanceFromEdge + obstructor.offsetHeight;
      };
      measureTopObstructor = function(obstructor) {
        return composeHeight(obstructor, ['top', 'margin-top']);
      };
      measureBottomObstructor = function(obstructor) {
        return composeHeight(obstructor, ['bottom', 'margin-bottom']);
      };
      $topObstructors = $(config.fixedTop.join(', '));
      $bottomObstructors = $(config.fixedBottom.join(', '));
      topObstructions = u.map($topObstructors, measureTopObstructor);
      bottomObstructions = u.map($bottomObstructors, measureBottomObstructor);
      return {
        top: Math.max.apply(Math, [0].concat(slice.call(topObstructions))),
        bottom: Math.max.apply(Math, [0].concat(slice.call(bottomObstructions)))
      };
    };

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
    - an element matching the selector you have configured using `up.layout.config.viewports.push('my-custom-selector')`
    
    \#\#\# Fixed elements obstruction the viewport
    
    Many applications have a navigation bar fixed to the top or bottom,
    obstructing the view on an element.
    
    You can make `up.reveal()` aware of these fixed elements
    so it can scroll the viewport far enough so the revealed element is fully visible.
    To make `up.reveal()` aware fixed elements you can either:
    
    - give the element an attribute [`up-fixed="top"`](/up-fixed-top) or [`up-fixed="bottom"`](up-fixed-bottom)
    - [configure default options](/up.layout.config) for `fixedTop` or `fixedBottom`
    
    @function up.reveal
    @param {string|Element|jQuery} element
    @param {number} [options.duration]
    @param {string} [options.easing]
    @param {string} [options.snap]
    @param {string|Element|jQuery} [options.viewport]
    @param {boolean} [options.top=false]
      Whether to scroll the viewport so that the first element row aligns
      with the top edge of the viewport.
    @return {Promise}
      A promise that fulfills when the element is revealed.
    @stable
     */
    reveal = function(elementOrSelector, options) {
      var $element;
      $element = $(elementOrSelector).first();
      up.puts('Revealing fragment %o', $element.get(0));
      options = u.options(options);
      return u.rejectOnError(function() {
        var $viewport, elementDims, firstElementRow, lastElementRow, newScrollPos, obstruction, offsetShift, originalScrollPos, predictFirstVisibleRow, predictLastVisibleRow, snap, viewportHeight, viewportIsDocument;
        $viewport = options.viewport ? $(options.viewport) : viewportOf($element);
        snap = u.option(options.snap, config.snap);
        viewportIsDocument = $viewport.is(up.browser.documentViewportSelector());
        viewportHeight = viewportIsDocument ? u.clientSize().height : $viewport.outerHeight();
        originalScrollPos = $viewport.scrollTop();
        newScrollPos = originalScrollPos;
        offsetShift = void 0;
        obstruction = void 0;
        if (viewportIsDocument) {
          obstruction = measureObstruction(viewportHeight);
          offsetShift = 0;
        } else {
          obstruction = {
            top: 0,
            bottom: 0
          };
          offsetShift = originalScrollPos;
        }
        predictFirstVisibleRow = function() {
          return newScrollPos + obstruction.top;
        };
        predictLastVisibleRow = function() {
          return newScrollPos + viewportHeight - obstruction.bottom;
        };
        elementDims = u.measure($element, {
          relative: $viewport,
          includeMargin: true
        });
        firstElementRow = elementDims.top + offsetShift;
        lastElementRow = firstElementRow + Math.min(elementDims.height, config.substance);
        if (lastElementRow > predictLastVisibleRow()) {
          newScrollPos += lastElementRow - predictLastVisibleRow();
        }
        if (firstElementRow < predictFirstVisibleRow() || options.top) {
          newScrollPos = firstElementRow - obstruction.top;
        }
        if (newScrollPos < snap && elementDims.top < (0.5 * viewportHeight)) {
          newScrollPos = 0;
        }
        if (newScrollPos !== originalScrollPos) {
          return scroll($viewport, newScrollPos, options);
        } else {
          return Promise.resolve();
        }
      });
    };

    /***
    @function up.layout.scrollAfterInsertFragment
    @param {boolean|object} [options.restoreScroll]
    @param {boolean|string|jQuery|Element} [options.reveal]
    @param {boolean|string} [options.reveal]
    @return {Promise}
      A promise that is fulfilled when the scrolling has finished.
    @internal
     */
    scrollAfterInsertFragment = function(selectorOrElement, options) {
      var $element, durationOptions, givenTops, hashOpt, restoreScrollOpt, revealOpt, selector;
      options = u.options(options);
      $element = $(selectorOrElement);
      hashOpt = options.hash;
      revealOpt = options.reveal;
      restoreScrollOpt = options.restoreScroll;
      durationOptions = u.only(options, 'duration');
      if (restoreScrollOpt) {
        givenTops = u.presence(restoreScrollOpt, u.isObject);
        return restoreScroll({
          around: $element,
          scrollTops: givenTops
        });
      } else if (hashOpt && revealOpt === true) {
        return revealHash(hashOpt, durationOptions);
      } else if (revealOpt) {
        if (u.isElement(revealOpt) || u.isJQuery(revealOpt)) {
          $element = $(revealOpt);
        } else if (u.isString(revealOpt)) {
          selector = up.dom.resolveSelector(revealOpt, options.origin);
          $element = up.first(selector);
        } else {

        }
        if ($element.length) {
          return reveal($element, durationOptions);
        }
      } else {
        return Promise.resolve();
      }
    };

    /***
    [Reveals](/up.reveal) an element matching the given `#hash` anchor.
    
    Other than the default behavior found in browsers, `up.revealHash` works with
    [multiple viewports](/up-viewport) and honors [fixed elements](/up-fixed-top) obstructing the user's
    view of the viewport.
    
    When the page loads initially, this function is automatically called with the hash from
    the current URL.
    
    If no element matches the given `#hash` anchor, a resolved promise is returned.
    
    @function up.layout.revealHash
    @return {Promise}
      A promise that is fulfilled when scroll position has changed to match the location hash.
    @experimental
     */
    revealHash = function(hash) {
      var $match;
      if (hash && ($match = firstHashTarget(hash))) {
        return reveal($match, {
          top: true
        });
      } else {
        return Promise.resolve();
      }
    };
    viewportSelector = function() {
      return [up.browser.documentViewportSelector()].concat(slice.call(config.viewports)).join(',');
    };

    /***
    Returns the viewport for the given element.
    
    Returns the [document's scrolling element](https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollingElement)
    if no closer viewpoint exists.
    
    @function up.layout.viewportOf
    @param {string|Element|jQuery} selectorOrElement
    @return {jQuery}
    @internal
     */
    viewportOf = function(selectorOrElement, options) {
      var $element;
      if (options == null) {
        options = {};
      }
      $element = $(selectorOrElement);
      return $element.closest(viewportSelector());
    };

    /***
    Returns a jQuery collection of all the viewports contained within the
    given selector or element.
    
    @function up.layout.viewportsWithin
    @param {string|Element|jQuery} selectorOrElement
    @return jQuery
    @internal
     */
    viewportsWithin = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement);
      return u.selectInSubtree($element, viewportSelector());
    };

    /***
    Returns a jQuery collection of all the viewports on the screen.
    
    @function up.layout.viewports
    @internal
     */
    viewports = function() {
      return $(viewportSelector());
    };
    scrollTopKey = function(viewport) {
      return u.selectorForElement(viewport);
    };

    /***
    Returns a hash with scroll positions.
    
    Each key in the hash is a viewport selector. The corresponding
    value is the viewport's top scroll position:
    
        up.layout.scrollTops()
        => { '.main': 0, '.sidebar': 73 }
    
    @function up.layout.scrollTops
    @return Object<string, number>
    @internal
     */
    scrollTops = function() {
      var group, i, len, ref, topsBySelector;
      topsBySelector = {};
      ref = config.viewports;
      for (i = 0, len = ref.length; i < len; i++) {
        group = ref[i];
        $(group).each(function() {
          var $viewport, key, top;
          $viewport = $(this);
          key = scrollTopKey($viewport);
          top = $viewport.scrollTop();
          return topsBySelector[key] = top;
        });
      }
      return topsBySelector;
    };

    /***
    @function up.layout.fixedChildren
    @internal
     */
    fixedChildren = function(root) {
      var $elements, $root;
      if (root == null) {
        root = void 0;
      }
      root || (root = document.body);
      $root = $(root);
      $elements = $root.find('[up-fixed]');
      if (u.isPresent(config.fixedTop)) {
        $elements = $elements.add($root.find(config.fixedTop.join(', ')));
      }
      if (u.isPresent(config.fixedBottom)) {
        $elements = $elements.add($root.find(config.fixedBottom.join(', ')));
      }
      return $elements;
    };

    /***
    Saves the top scroll positions of all the
    viewports configured in [`up.layout.config.viewports`](/up.layout.config).
    
    The scroll positions will be associated with the current URL.
    They can later be restored by calling [`up.layout.restoreScroll()`](/up.layout.restoreScroll)
    at the same URL.
    
    Unpoly automatically saves scroll positions whenever a fragment was updated on the page.
    
    @function up.layout.saveScroll
    @param {string} [options.url]
    @param {Object<string, number>} [options.tops]
    @experimental
     */
    saveScroll = function(options) {
      var tops, url;
      if (options == null) {
        options = {};
      }
      url = u.option(options.url, up.history.url());
      tops = u.option(options.tops, scrollTops());
      return lastScrollTops.set(url, tops);
    };

    /***
    Restores [previously saved](/up.layout.saveScroll) scroll positions of viewports
    viewports configured in [`up.layout.config.viewports`](/up.layout.config).
    
    Unpoly automatically restores scroll positions when the user presses the back button.
    You can disable this behavior by setting [`up.history.config.restoreScroll = false`](/up.history.config).
    
    @function up.layout.restoreScroll
    @param {jQuery} [options.around]
      If set, only restores viewports that are either an ancestor
      or descendant of the given element.
    @return {Promise}
      A promise that will be fulfilled once scroll positions have been restored.
    @experimental
     */
    restoreScroll = function(options) {
      var $ancestorViewports, $descendantViewports, $viewports, scrollTopsForUrl, url;
      if (options == null) {
        options = {};
      }
      url = up.history.url();
      $viewports = void 0;
      if (options.around) {
        $descendantViewports = viewportsWithin(options.around);
        $ancestorViewports = viewportOf(options.around);
        $viewports = $ancestorViewports.add($descendantViewports);
      } else {
        $viewports = viewports();
      }
      scrollTopsForUrl = options.scrollTops || lastScrollTops.get(url) || {};
      return up.log.group('Restoring scroll positions for URL %s to %o', url, scrollTopsForUrl, function() {
        var allScrollPromises;
        allScrollPromises = u.map($viewports, function(viewport) {
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

    /***
    @internal
     */
    absolutize = function($element, options) {
      var $bounds, $fixedElements, $viewport, boundsStyle, fixedElement, i, len, moveTop, originalDims, originalOffset, top;
      options = u.options(options, {
        afterMeasure: u.noop
      });
      $viewport = up.layout.viewportOf($element);
      originalDims = u.measure($element, {
        relative: true,
        inner: true
      });
      originalOffset = $element.offset();
      options.afterMeasure();
      u.writeInlineStyle($element, {
        position: u.readComputedStyle($element, 'position') === 'static' ? 'static' : 'relative',
        top: 'auto',
        right: 'auto',
        bottom: 'auto',
        left: 'auto',
        width: '100%',
        height: '100%'
      });
      $bounds = $('<div class="up-bounds"></div>');
      boundsStyle = u.merge(originalDims, {
        position: 'absolute'
      });
      u.writeInlineStyle($bounds, boundsStyle);
      $bounds.insertBefore($element);
      $element.appendTo($bounds);
      top = originalDims.top;
      moveTop = function(diff) {
        if (diff !== 0) {
          top += diff;
          return u.writeInlineStyle($bounds, {
            top: top
          });
        }
      };
      moveTop(originalOffset.top - $element.offset().top);
      $fixedElements = up.layout.fixedChildren($element);
      for (i = 0, len = $fixedElements.length; i < len; i++) {
        fixedElement = $fixedElements[i];
        u.fixedToAbsolute(fixedElement, $viewport);
      }
      return {
        $element: $element,
        $bounds: $bounds,
        moveTop: moveTop
      };
    };

    /***
    Marks this element as a scrolling container ("viewport").
    
    Apply this attribute if your app uses a custom panel layout with fixed positioning
    instead of scrolling `<body>`. As an alternative you can also push a selector
    matching your custom viewport to the [`up.layout.config.viewports`](/up.layout.config) array.
    
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
    you can also configure a selector in [`up.layout.config.fixedTop`](/up.layout.config#config.fixedTop).
    
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
    you can also configure a selector in [`up.layout.config.fixedBottom`](/up.layout.config#config.fixedBottom).
    
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
    you can also configure a selector in [`up.layout.config.anchoredRight`](/up.layout.config#config.anchoredRight).
    
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
    @function up.layout.firstHashTarget
    @internal
     */
    firstHashTarget = function(hash) {
      var byID, byName;
      if (hash = pureHash(hash)) {
        byID = u.attributeSelector('id', hash);
        byName = 'a' + u.attributeSelector('name', hash);
        return up.first(byID + "," + byName);
      }
    };

    /***
    Returns `'foo'` if the hash is `'#foo'`.
    
    Returns undefined if the hash is `'#'`, `''` or `undefined`.
    
    @function up.browser.hash
    @internal
     */
    pureHash = function(value) {
      if (value && value[0] === '#') {
        value = value.substr(1);
      }
      return u.presence(value);
    };
    up.on('up:app:booted', function() {
      return revealHash(location.hash);
    });
    up.on('up:framework:reset', reset);
    return {
      reveal: reveal,
      revealHash: revealHash,
      firstHashTarget: firstHashTarget,
      scroll: scroll,
      config: config,
      viewportOf: viewportOf,
      viewportsWithin: viewportsWithin,
      viewports: viewports,
      scrollTops: scrollTops,
      saveScroll: saveScroll,
      restoreScroll: restoreScroll,
      scrollAfterInsertFragment: scrollAfterInsertFragment,
      anchoredRight: anchoredRight,
      fixedChildren: fixedChildren,
      absolutize: absolutize
    };
  })(jQuery);

  up.scroll = up.layout.scroll;

  up.reveal = up.layout.reveal;

  up.revealHash = up.layout.revealHash;

}).call(this);

/***
Fragment update API
===================
  
This module exposes a low-level Javascript API to [change](/up.replace) or
[destroy](/up.destroy) page fragments.

Most of Unpoly's functionality (like [fragment links](/up.link) or [modals](/up.modal))
is built from these functions. You can use them to extend Unpoly from your
[custom Javascript](/up.syntax).

@class up.dom
 */

(function() {
  up.dom = (function($) {
    var all, bestMatchingSteps, bestPreflightSelector, config, destroy, emitFragmentDestroy, emitFragmentDestroyed, emitFragmentInserted, emitFragmentKept, extract, findKeepPlan, first, firstInLayer, firstInPriority, hello, isRealElement, layerOf, markElementAsDestroying, matchesLayer, processResponse, reload, replace, reset, resolveSelector, setSource, shouldExtractTitle, shouldLogDestruction, source, swapElements, transferKeepableElements, u, updateHistoryAndTitle;
    u = up.util;

    /***
    Configures defaults for fragment insertion.
    
    @property up.dom.config
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
    config = u.config({
      fallbacks: ['body'],
      fallbackTransition: null
    });
    reset = function() {
      return config.reset();
    };
    setSource = function(element, sourceUrl) {
      var $element;
      if (sourceUrl !== false) {
        $element = $(element);
        if (u.isPresent(sourceUrl)) {
          sourceUrl = u.normalizeUrl(sourceUrl);
        }
        return $element.attr("up-source", sourceUrl);
      }
    };

    /***
    Returns the URL the given element was retrieved from.
    
    @method up.dom.source
    @param {string|Element|jQuery} selectorOrElement
    @experimental
     */
    source = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement).closest('[up-source]');
      return u.presence($element.attr("up-source")) || up.browser.url();
    };

    /***
    Resolves the given CSS selector (which might contain `&` references)
    to a full CSS selector without ampersands.
    
    If passed an `Element` or `jQuery` element, returns a CSS selector string
    for that element.
    
    @function up.dom.resolveSelector
    @param {string|Element|jQuery} selectorOrElement
    @param {string|Element|jQuery} origin
      The element that this selector resolution is relative to.
      That element's selector will be substituted for `&` ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).
    @return {string}
    @internal
     */
    resolveSelector = function(selectorOrElement, origin) {
      var originSelector, selector;
      if (u.isString(selectorOrElement)) {
        selector = selectorOrElement;
        if (u.contains(selector, '&')) {
          if (u.isPresent(origin)) {
            originSelector = u.selectorForElement(origin);
            selector = selector.replace(/\&/, originSelector);
          } else {
            up.fail("Found origin reference (%s) in selector %s, but no origin was given", '&', selector);
          }
        }
      } else {
        selector = u.selectorForElement(selectorOrElement);
      }
      return selector;
    };

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
    
        up.replace('.two', '/new');
    
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
      [Parameters](/up.params) that should be sent as the request's payload.
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
    replace = function(selectorOrElement, url, options) {
      var e, failureOptions, fullLoad, improvedFailTarget, improvedTarget, onFailure, onSuccess, promise, request, successOptions;
      options = u.options(options);
      options.inspectResponse = fullLoad = function() {
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
      } catch (error) {
        e = error;
        return Promise.reject(e);
      }
      request = new up.Request({
        url: url,
        method: options.method,
        data: options.data,
        params: options.params,
        target: improvedTarget,
        failTarget: improvedFailTarget,
        cache: options.cache,
        preload: options.preload,
        headers: options.headers,
        timeout: options.timeout
      });
      onSuccess = function(response) {
        return processResponse(true, improvedTarget, request, response, successOptions);
      };
      onFailure = function(response) {
        var promise, rejection;
        rejection = function() {
          return Promise.reject(response);
        };
        if (response.isFatalError()) {
          return rejection();
        } else {
          promise = processResponse(false, improvedFailTarget, request, response, failureOptions);
          return u.always(promise, rejection);
        }
      };
      promise = up.request(request);
      if (!options.preload) {
        promise = promise.then(onSuccess, onFailure);
      }
      return promise;
    };

    /***
    @internal
     */
    processResponse = function(isSuccess, selector, request, response, options) {
      var hash, historyUrl, isReloadable, sourceUrl;
      sourceUrl = response.url;
      historyUrl = sourceUrl;
      if (hash = request.hash) {
        options.hash = hash;
        historyUrl += hash;
      }
      isReloadable = response.method === 'GET';
      if (isSuccess) {
        if (isReloadable) {
          if (!(options.history === false || u.isString(options.history))) {
            options.history = historyUrl;
          }
          if (!(options.source === false || u.isString(options.source))) {
            options.source = sourceUrl;
          }
        } else {
          if (!u.isString(options.history)) {
            options.history = false;
          }
          if (!u.isString(options.source)) {
            options.source = 'keep';
          }
        }
      } else {
        if (isReloadable) {
          if (options.history !== false) {
            options.history = historyUrl;
          }
          if (options.source !== false) {
            options.source = sourceUrl;
          }
        } else {
          options.history = false;
          options.source = 'keep';
        }
      }
      if (shouldExtractTitle(options) && response.title) {
        options.title = response.title;
      }
      return extract(selector, response.text, options);
    };
    shouldExtractTitle = function(options) {
      return !(options.title === false || u.isString(options.title) || (options.history === false && options.title !== true));
    };

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
    
        up.extract('.two', html);
    
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
    extract = function(selectorOrElement, html, options) {
      return up.log.group('Extracting %s from %d bytes of HTML', selectorOrElement, html != null ? html.length : void 0, function() {
        options = u.options(options, {
          historyMethod: 'push',
          keep: true,
          layer: 'auto'
        });
        if (options.saveScroll !== false) {
          up.layout.saveScroll();
        }
        return u.rejectOnError(function() {
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
            up.log.group('Swapping fragment %s', step.selector, function() {
              var swapOptions, swapPromise;
              swapOptions = u.merge(options, u.only(step, 'origin', 'reveal'));
              responseDoc.prepareForInsertion(step.$new);
              swapPromise = swapElements(step.$old, step.$new, step.pseudoClass, step.transition, swapOptions);
              return swapPromises.push(swapPromise);
            });
          }
          return Promise.all(swapPromises);
        });
      });
    };
    bestPreflightSelector = function(selector, options) {
      var cascade;
      cascade = new up.ExtractCascade(selector, options);
      return cascade.bestPreflightSelector();
    };
    bestMatchingSteps = function(selector, response, options) {
      var cascade;
      options = u.merge(options, {
        response: response
      });
      cascade = new up.ExtractCascade(selector, options);
      return cascade.bestMatchingSteps();
    };
    updateHistoryAndTitle = function(options) {
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
    swapElements = function($old, $new, pseudoClass, transition, options) {
      var $parent, $wrapper, keepPlan, morphOptions, promise;
      transition || (transition = 'none');
      if (options.source === 'keep') {
        options = u.merge(options, {
          source: source($old)
        });
      }
      setSource($new, options.source);
      if (pseudoClass) {
        $wrapper = $new.contents().wrapAll('<div class="up-insertion"></div>').parent();
        if (pseudoClass === 'before') {
          $old.prepend($wrapper);
        } else {
          $old.append($wrapper);
        }
        hello($wrapper.children(), options);
        promise = up.layout.scrollAfterInsertFragment($wrapper, options);
        promise = promise.then(function() {
          return up.animate($wrapper, transition, options);
        });
        promise = promise.then(function() {
          return u.unwrapElement($wrapper);
        });
        return promise;
      } else if (keepPlan = findKeepPlan($old, $new, options)) {
        emitFragmentKept(keepPlan);
        return Promise.resolve();
      } else {
        options.keepPlans = transferKeepableElements($old, $new, options);
        $parent = $old.parent();
        morphOptions = u.merge(options, {
          beforeStart: function() {
            markElementAsDestroying($old);
            return emitFragmentDestroy($old, {
              log: false
            });
          },
          afterInsert: function() {
            return up.hello($new, options);
          },
          beforeDetach: function() {
            return up.syntax.clean($old);
          },
          afterDetach: function() {
            $old.remove();
            return emitFragmentDestroyed($old, {
              $parent: $parent,
              log: false
            });
          }
        });
        return up.morph($old, $new, transition, morphOptions);
      }
    };
    transferKeepableElements = function($old, $new, options) {
      var $keepable, $keepableClone, i, keepPlans, keepable, len, plan, ref;
      keepPlans = [];
      if (options.keep) {
        ref = $old.find('[up-keep]');
        for (i = 0, len = ref.length; i < len; i++) {
          keepable = ref[i];
          $keepable = $(keepable);
          if (plan = findKeepPlan($keepable, $new, u.merge(options, {
            descendantsOnly: true
          }))) {
            $keepableClone = $keepable.clone();
            u.detachWith($keepable, $keepableClone);
            plan.$newElement.replaceWith($keepable);
            keepPlans.push(plan);
          }
        }
      }
      return keepPlans;
    };
    findKeepPlan = function($element, $new, options) {
      var $keepable, $partner, keepEventArgs, partnerSelector, plan;
      if (options.keep) {
        $keepable = $element;
        if (partnerSelector = u.castedAttr($keepable, 'up-keep')) {
          u.isString(partnerSelector) || (partnerSelector = '&');
          partnerSelector = resolveSelector(partnerSelector, $keepable);
          if (options.descendantsOnly) {
            $partner = $new.find(partnerSelector);
          } else {
            $partner = u.selectInSubtree($new, partnerSelector);
          }
          $partner = $partner.first();
          if ($partner.length && $partner.is('[up-keep]')) {
            plan = {
              $element: $keepable,
              $newElement: $partner,
              newData: up.syntax.data($partner)
            };
            keepEventArgs = u.merge(plan, {
              message: ['Keeping element %o', $keepable.get(0)]
            });
            if (up.bus.nobodyPrevents('up:fragment:keep', keepEventArgs)) {
              return plan;
            }
          }
        }
      }
    };

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
    
        up.compiler('audio', function($element) {
          $element.on('up:fragment:keep', function(event) {
            if $element.attr('src') !== event.$newElement.attr('src') {
              event.preventDefault();
            }
          });
        });
    
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
    @param {jQuery} event.$element
      The fragment that will be kept.
    @param {jQuery} event.$newElement
      The discarded element.
    @param {Object} event.newData
      The value of the [`up-data`](/up-data) attribute of the discarded element,
      parsed as a JSON object.
    @stable
     */

    /***
    This event is [emitted](/up.emit) when an existing element has been [kept](/up-keep)
    during a page update.
    
    Event listeners can inspect the discarded update through `event.$newElement`
    and `event.newData` and then modify the preserved element when necessary.
    
    @event up:fragment:kept
    @param {jQuery} event.$element
      The fragment that has been kept.
    @param {jQuery} event.$newElement
      The discarded element.
    @param {Object} event.newData
      The value of the [`up-data`](/up-data) attribute of the discarded element,
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
    
        $element = $('.element');
        $element.html('<div>...</div>');
        up.hello($element);
    
    This function emits the [`up:fragment:inserted`](/up:fragment:inserted)
    event.
    
    @function up.hello
    @param {string|Element|jQuery} selectorOrElement
    @param {string|Element|jQuery} [options.origin]
    @param {string|Element|jQuery} [options.kept]
    @return {jQuery}
      The compiled element
    @stable
     */
    hello = function(selectorOrElement, options) {
      var $element, i, keptElements, len, plan, ref;
      $element = $(selectorOrElement);
      options = u.options(options, {
        keepPlans: []
      });
      keptElements = [];
      ref = options.keepPlans;
      for (i = 0, len = ref.length; i < len; i++) {
        plan = ref[i];
        emitFragmentKept(plan);
        keptElements.push(plan.$element[0]);
      }
      up.syntax.compile($element, {
        skip: keptElements
      });
      emitFragmentInserted($element, options);
      return $element;
    };

    /***
    When a page fragment has been [inserted or updated](/up.replace),
    this event is [emitted](/up.emit) on the fragment.
    
    \#\#\# Example
    
        up.on('up:fragment:inserted', function(event, $fragment) {
          console.log("Looks like we have a new %o!", $fragment);
        });
    
    @event up:fragment:inserted
    @param {jQuery} event.$element
      The fragment that has been inserted or updated.
    @stable
     */
    emitFragmentInserted = function($element, options) {
      return up.emit('up:fragment:inserted', {
        $element: $element,
        message: ['Inserted fragment %o', $element.get(0)],
        origin: options.origin
      });
    };
    emitFragmentKept = function(keepPlan) {
      var eventAttrs;
      eventAttrs = u.merge(keepPlan, {
        message: ['Kept fragment %o', keepPlan.$element.get(0)]
      });
      return up.emit('up:fragment:kept', eventAttrs);
    };
    emitFragmentDestroy = function($element, options) {
      var message;
      if (shouldLogDestruction($element, options)) {
        message = ['Destroying fragment %o', $element.get(0)];
      }
      return up.emit('up:fragment:destroy', {
        $element: $element,
        message: message
      });
    };
    emitFragmentDestroyed = function($element, options) {
      var $parent, message;
      if (shouldLogDestruction($element, options)) {
        message = ['Destroyed fragment %o', $element.get(0)];
      }
      $parent = options.$parent || up.fail("Missing { $parent } option");
      return up.emit('up:fragment:destroyed', {
        $target: $parent,
        $parent: $parent,
        $element: $element,
        message: message
      });
    };
    isRealElement = function($element) {
      var unreal;
      unreal = '.up-destroying';
      return $element.closest(unreal).length === 0;
    };

    /***
    Returns the first element matching the given selector, but
    ignores elements that are being [destroyed](/up.destroy) or that are being
    removed by a [transition](/up.morph).
    
    If the given argument is already a jQuery collection (or an array
    of DOM elements), the first element matching these conditions
    is returned.
    
    Returns `undefined` if no element matches these conditions.
    
    Also see the [`.up-destroying`](/up-destroying) class.
    
    @function up.first
    @param {string|Element|jQuery|Array<Element>} selectorOrElement
    @param {string} [options.layer='auto']
      The name of the layer in which to find the element.
    
      Valid values are `'auto'`, `'page'`, `'modal'` and `'popup'`.
    @param {string|Element|jQuery} [options.origin]
      An second element or selector that can be referenced as `&` in the first selector:
    
          $input = $('input.email');
          up.first('.field:has(&)', $input); // returns the .field containing $input
    @return {jQuery|undefined}
      The first element that is neither a ghost or being destroyed,
      or `undefined` if no such element was found.
    @experimental
     */
    first = function(selectorOrElement, options) {
      var resolved;
      options = u.options(options, {
        layer: 'auto'
      });
      resolved = resolveSelector(selectorOrElement, options.origin);
      if (options.layer === 'auto') {
        return firstInPriority(resolved, options.origin);
      } else {
        return firstInLayer(resolved, options.layer);
      }
    };
    firstInPriority = function(selectorOrElement, origin) {
      var $match, i, layer, layers, len, originLayer;
      layers = ['popup', 'modal', 'page'];
      $match = void 0;
      if (u.isPresent(origin)) {
        originLayer = layerOf(origin);
        u.remove(layers, originLayer);
        layers.unshift(originLayer);
      }
      for (i = 0, len = layers.length; i < len; i++) {
        layer = layers[i];
        if ($match = firstInLayer(selectorOrElement, layer)) {
          break;
        }
      }
      return $match;
    };
    firstInLayer = function(selectorOrElement, layer) {
      var $element, $elements, $match, element, i, len;
      $elements = $(selectorOrElement);
      $match = void 0;
      for (i = 0, len = $elements.length; i < len; i++) {
        element = $elements[i];
        $element = $(element);
        if (isRealElement($element) && matchesLayer($element, layer)) {
          $match = $element;
          break;
        }
      }
      return $match;
    };

    /***
    @function up.dom.layerOf
    @internal
     */
    layerOf = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement);
      if ($element.length) {
        if (up.popup.contains($element)) {
          return 'popup';
        } else if (up.modal.contains($element)) {
          return 'modal';
        } else {
          return 'page';
        }
      }
    };
    matchesLayer = function(selectorOrElement, layer) {
      return !layer || layerOf(selectorOrElement) === layer;
    };

    /***
    Returns all elements matching the given selector, but
    ignores elements that are being [destroyed](/up.destroy) or [transitioned](/up.morph).
    
    If the given argument is already a jQuery collection (or an array
    of DOM elements), returns the subset of the given list that is matching these conditions.
    
    @function up.all
    @param {string|jQuery|Array<Element>} selectorOrElements
    @param {string|Element|jQuery} [options.origin]
      An second element or selector that can be referenced as `&` in the first selector.
    @param {string} [options.layer]
      The name of the layer in which to find the element. Valid values are
      `'page'`, `'modal'` and `'popup'`.
    @return {jQuery}
      A jQuery collection of matching elements.
    @experimental
     */
    all = function(selectorOrElements, options) {
      var $root, resolved;
      options = u.options(options);
      resolved = resolveSelector(selectorOrElements, options.origin);
      $root = $(u.option(options.root, document));
      return $root.find(resolved).filter(function(index, element) {
        var $element;
        $element = $(element);
        return isRealElement($element) && matchesLayer($element, options.layer);
      });
    };

    /***
    Destroys the given element or selector.
    
    Takes care that all [`up.compiler()`](/up.compiler) destructors, if any, are called.
    
    The element is removed from the DOM.
    Note that if you choose to animate the element removal using `options.animate`,
    the element won't be removed until after the animation has completed.
    
    Emits events [`up:fragment:destroy`](/up:fragment:destroy) and [`up:fragment:destroyed`](/up:fragment:destroyed).
    
    @function up.destroy
    @param {string|Element|jQuery} selectorOrElement
    @param {string} [options.history]
      A URL that will be pushed as a new history entry when the element begins destruction.
    @param {string} [options.title]
      The document title to set when the element begins destruction.
    @param {string|Function} [options.animation='none']
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
    destroy = function(selectorOrElement, options) {
      var $element, animate, wipe;
      $element = $(selectorOrElement);
      options = u.options(options, {
        animation: false
      });
      if ($element.length === 0) {
        return Promise.resolve();
      }
      markElementAsDestroying($element);
      emitFragmentDestroy($element, options);
      updateHistoryAndTitle(options);
      animate = function() {
        var animateOptions;
        animateOptions = up.motion.animateOptions(options);
        return up.motion.animate($element, options.animation, animateOptions);
      };
      wipe = function() {
        var $parent;
        $parent = $element.parent();
        up.syntax.clean($element);
        $element.remove();
        return emitFragmentDestroyed($element, {
          $parent: $parent
        });
      };
      return animate().then(wipe);
    };
    shouldLogDestruction = function($element, options) {
      return options.log !== false && !$element.is('.up-placeholder, .up-tooltip, .up-modal, .up-popup');
    };

    /***
    Elements are assigned the `.up-destroying` class before they are [destroyed](/up.destroy)
    or while they are being removed by a [transition](/up.morph).
    
    If the removal is animated, the class is assigned before the animation.
    
    Also see the [`up.first()`](/up.first) function.
    
    @selector .up-destroying
    @stable
     */
    markElementAsDestroying = function($element) {
      return $element.addClass('up-destroying');
    };

    /***
    Before a page fragment is being [destroyed](/up.destroy), this
    event is [emitted](/up.emit) on the fragment.
    
    If the destruction is animated, this event is emitted before the
    animation begins.
    
    @event up:fragment:destroy
    @param {jQuery} event.$element
      The page fragment that is about to be destroyed.
    @stable
     */

    /***
    This event is [emitted](/up.emit) after a page fragment was [destroyed](/up.destroy) and removed from the DOM.
    
    If the destruction is animated, this event is emitted after the animation has ended.
    
    The event is emitted on the parent element of the fragment that was removed.
    
    @event up:fragment:destroyed
    @param {jQuery} event.$element
      The page fragment that has been removed from the DOM.
    @param {jQuery} event.$parent
      The parent element of the fragment that has been removed from the DOM.
    @stable
     */

    /***
    Replaces the given element with a fresh copy fetched from the server.
    
    \#\#\# Example
    
        up.on('new-mail', function() {
          up.reload('.inbox');
        });
    
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
    reload = function(selectorOrElement, options) {
      var sourceUrl;
      options = u.options(options, {
        cache: false
      });
      sourceUrl = options.url || source(selectorOrElement);
      return replace(selectorOrElement, sourceUrl, options);
    };
    up.on('up:app:boot', function() {
      var $body;
      $body = $(document.body);
      setSource($body, up.browser.url());
      return hello($body);
    });
    up.on('up:framework:reset', reset);
    return {
      replace: replace,
      reload: reload,
      destroy: destroy,
      extract: extract,
      first: first,
      all: all,
      source: source,
      resolveSelector: resolveSelector,
      hello: hello,
      config: config,
      layerOf: layerOf
    };
  })(jQuery);

  up.replace = up.dom.replace;

  up.extract = up.dom.extract;

  up.reload = up.dom.reload;

  up.destroy = up.dom.destroy;

  up.first = up.dom.first;

  up.all = up.dom.all;

  up.hello = up.dom.hello;

  up.deprecateRenamedModule('flow', 'dom');

}).call(this);

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

@class up.motion
 */

(function() {
  var slice = [].slice;

  up.motion = (function($) {
    var animCount, animate, animateNow, animateOptions, composeTransitionFn, config, defaultNamedAnimations, defaultNamedTransitions, findAnimationFn, findNamedAnimation, findTransitionFn, finish, isEnabled, isNone, morph, motionTracker, namedAnimations, namedTransitions, registerAnimation, registerTransition, reset, skipAnimate, snapshot, swapElementsDirectly, translateCss, u, willAnimate;
    u = up.util;
    namedAnimations = {};
    defaultNamedAnimations = {};
    namedTransitions = {};
    defaultNamedTransitions = {};
    motionTracker = new up.MotionTracker('motion');

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
    config = u.config({
      duration: 300,
      delay: 0,
      easing: 'ease',
      enabled: true
    });
    reset = function() {
      motionTracker.reset();
      namedAnimations = u.copy(defaultNamedAnimations);
      namedTransitions = u.copy(defaultNamedTransitions);
      return config.reset();
    };

    /***
    Returns whether Unpoly will perform animations.
    
    Set [`up.motion.config.enabled`](/up.motion.config) `false` in order to disable animations globally.
    
    @function up.motion.isEnabled
    @return {boolean}
    @stable
     */
    isEnabled = function() {
      return config.enabled;
    };

    /***
    Applies the given animation to the given element.
    
    \#\#\# Example
    
        up.animate('.warning', 'fade-in');
    
    You can pass additional options:
    
        up.animate('warning', '.fade-in', {
          delay: 1000,
          duration: 250,
          easing: 'linear'
        });
    
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
    
        var $warning = $('.warning');
        $warning.css({ opacity: 0 });
        up.animate($warning, { opacity: 1 });
    
    \#\#\# Multiple animations on the same element
    
    Unpoly doesn't allow more than one concurrent animation on the same element.
    
    If you attempt to animate an element that is already being animated,
    the previous animation will instantly jump to its last frame before
    the new animation begins.
    
    @function up.animate
    @param {Element|jQuery|string} elementOrSelector
      The element to animate.
    @param {string|Function|Object} animation
      Can either be:
    
      - The animation's name
      - A function performing the animation
      - An object of CSS attributes describing the last frame of the animation
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
    animate = function(elementOrSelector, animation, options) {
      var $element, animationFn, runNow, willRun;
      $element = $(elementOrSelector);
      options = animateOptions(options);
      animationFn = findAnimationFn(animation);
      willRun = willAnimate($element, animation, options);
      if (willRun) {
        runNow = function() {
          return animationFn($element, options);
        };
        return motionTracker.claim($element, runNow, options);
      } else {
        return skipAnimate($element, animation);
      }
    };
    willAnimate = function($elements, animationOrTransition, options) {
      options = animateOptions(options);
      return isEnabled() && !isNone(animationOrTransition) && options.duration > 0 && !u.isSingletonElement($elements);
    };
    skipAnimate = function($element, animation) {
      if (u.isOptions(animation)) {
        u.writeInlineStyle($element, animation);
      }
      return Promise.resolve();
    };
    animCount = 0;

    /***
    Animates the given element's CSS properties using CSS transitions.
    
    Does not track the animation, nor does it finishes existing animations
    (use `up.motion.animate()` for that). It does, however, listen to the motionTracker's
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
    animateNow = function($element, lastFrame, options) {
      var cssTransition;
      options = u.merge(options, {
        finishEvent: motionTracker.finishEvent
      });
      cssTransition = new up.CssTransition($element, lastFrame, options);
      return cssTransition.start();
    };

    /***
    Extracts animation-related options from the given options hash.
    If `$element` is given, also inspects the element for animation-related
    attributes like `up-easing` or `up-duration`.
    
    @function up.motion.animateOptions
    @internal
     */
    animateOptions = function() {
      var $element, args, consolidatedOptions, moduleDefaults, userOptions;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      userOptions = args.shift() || {};
      $element = u.isJQuery(args[0]) ? args.shift() : u.nullJQuery();
      moduleDefaults = u.isObject(args[0]) ? args.shift() : {};
      consolidatedOptions = {};
      consolidatedOptions.easing = u.option(userOptions.easing, u.presentAttr($element, 'up-easing'), moduleDefaults.easing, config.easing);
      consolidatedOptions.duration = Number(u.option(userOptions.duration, u.presentAttr($element, 'up-duration'), moduleDefaults.duration, config.duration));
      consolidatedOptions.delay = Number(u.option(userOptions.delay, u.presentAttr($element, 'up-delay'), moduleDefaults.delay, config.delay));
      consolidatedOptions.trackMotion = userOptions.trackMotion;
      return consolidatedOptions;
    };
    findNamedAnimation = function(name) {
      return namedAnimations[name] || up.fail("Unknown animation %o", name);
    };

    /***
    Completes [animations](/up.animate) and [transitions](/up.morph).
    
    If called without arguments, all animations on the screen are completed.
    If given an element (or selector), animations on that element and its children
    are completed.
    
    Animations are completed by jumping to the last animation frame instantly.
    
    Does nothing if there are no animation to complete.
    
    @function up.motion.finish
    @param {Element|jQuery|string} [elementOrSelector]
    @return {Promise}
      A promise that fulfills when animations and transitions have finished.
    @stable
     */
    finish = function(elementOrSelector) {
      return motionTracker.finish(elementOrSelector);
    };

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
    @param {Function|string} transitionOrName
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
    @experimental
     */
    morph = function(source, target, transitionObject, options) {
      var $both, $new, $old, $viewport, afterDetach, afterInsert, beforeDetach, beforeStart, oldRemote, promise, scrollNew, scrollTopBeforeReveal, trackable, transitionFn, willMorph;
      options = u.options(options);
      options = u.assign(options, animateOptions(options));
      $old = $(source);
      $new = $(target);
      $both = $old.add($new);
      transitionFn = findTransitionFn(transitionObject);
      willMorph = willAnimate($old, transitionFn, options);
      beforeStart = u.pluckKey(options, 'beforeStart') || u.noop;
      afterInsert = u.pluckKey(options, 'afterInsert') || u.noop;
      beforeDetach = u.pluckKey(options, 'beforeDetach') || u.noop;
      afterDetach = u.pluckKey(options, 'afterDetach') || u.noop;
      beforeStart();
      scrollNew = function() {
        var scrollOptions;
        scrollOptions = u.merge(options, {
          duration: 0
        });
        return up.layout.scrollAfterInsertFragment($new, scrollOptions);
      };
      if (willMorph) {
        if (motionTracker.isActive($old) && options.trackMotion === false) {
          return transitionFn($old, $new, options);
        }
        up.puts('Morphing %o to %o with transition %o', $old.get(0), $new.get(0), transitionObject);
        $viewport = up.layout.viewportOf($old);
        scrollTopBeforeReveal = $viewport.scrollTop();
        oldRemote = up.layout.absolutize($old, {
          afterMeasure: function() {
            $new.insertBefore($old);
            return afterInsert();
          }
        });
        trackable = function() {
          var promise;
          promise = scrollNew();
          promise = promise.then(function() {
            var scrollTopAfterReveal;
            scrollTopAfterReveal = $viewport.scrollTop();
            oldRemote.moveTop(scrollTopAfterReveal - scrollTopBeforeReveal);
            return transitionFn($old, $new, options);
          });
          promise = promise.then(function() {
            beforeDetach();
            $old.detach();
            oldRemote.$bounds.remove();
            return afterDetach();
          });
          return promise;
        };
        return motionTracker.claim($both, trackable, options);
      } else {
        beforeDetach();
        swapElementsDirectly($old, $new);
        afterInsert();
        afterDetach();
        promise = scrollNew();
        return promise;
      }
    };
    findTransitionFn = function(object) {
      var namedTransition;
      if (isNone(object)) {
        return void 0;
      } else if (u.isFunction(object)) {
        return object;
      } else if (u.isArray(object)) {
        return composeTransitionFn.apply(null, object);
      } else if (u.isString(object)) {
        if (object.indexOf('/') >= 0) {
          return composeTransitionFn.apply(null, object.split('/'));
        } else if (namedTransition = namedTransitions[object]) {
          return findTransitionFn(namedTransition);
        }
      } else {
        return up.fail("Unknown transition %o", object);
      }
    };
    composeTransitionFn = function(oldAnimation, newAnimation) {
      var newAnimationFn, oldAnimationFn;
      if (isNone(oldAnimation) && isNone(oldAnimation)) {
        return void 0;
      } else {
        oldAnimationFn = findAnimationFn(oldAnimation) || u.asyncNoop;
        newAnimationFn = findAnimationFn(newAnimation) || u.asyncNoop;
        return function($old, $new, options) {
          return Promise.all([oldAnimationFn($old, options), newAnimationFn($new, options)]);
        };
      }
    };
    findAnimationFn = function(object) {
      if (isNone(object)) {
        return void 0;
      } else if (u.isFunction(object)) {
        return object;
      } else if (u.isString(object)) {
        return findNamedAnimation(object);
      } else if (u.isOptions(object)) {
        return function($element, options) {
          return animateNow($element, object, options);
        };
      } else {
        return up.fail('Unknown animation %o', object);
      }
    };
    swapElementsDirectly = function($old, $new) {
      return $old.replaceWith($new);
    };

    /***
    Defines a named transition.
    
    Here is the definition of the pre-defined `cross-fade` animation:
    
        up.transition('cross-fade', ($old, $new, options) ->
          up.motion.when(
            up.animate($old, 'fade-out', options),
            up.animate($new, 'fade-in', options)
          )
        )
    
    It is recommended that your transitions use [`up.animate()`](/up.animate),
    passing along the `options` that were passed to you.
    
    If you choose to *not* use `up.animate()` and roll your own
    logic instead, your code must honor the following contract:
    
    1. It must honor the options `{ delay, duration, easing }` if given
    2. It must *not* remove any of the given elements from the DOM.
    3. It returns a promise that is fulfilled when the transition has ended
    4. If during the animation an event `up:motion:finish` is emitted on
       the given element, the transition instantly jumps to the last frame
       and resolves the returned promise.
    
    Calling [`up.animate()`](/up.animate) with an object argument
    will take care of all these points.
    
    @function up.transition
    @param {string} name
    @param {Function} transition
    @stable
     */
    registerTransition = function(name, transition) {
      return namedTransitions[name] = findTransitionFn(transition);
    };

    /***
    Defines a named animation.
    
    Here is the definition of the pre-defined `fade-in` animation:
    
        up.animation('fade-in', function($element, options) {
          $element.css(opacity: 0);
          up.animate($element, { opacity: 1 }, options);
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
    @param {Function} animation
    @stable
     */
    registerAnimation = function(name, animation) {
      return namedAnimations[name] = findAnimationFn(animation);
    };
    snapshot = function() {
      defaultNamedAnimations = u.copy(namedAnimations);
      return defaultNamedTransitions = u.copy(namedTransitions);
    };

    /***
    Returns whether the given animation option will cause the animation
    to be skipped.
    
    @function up.motion.isNone
    @internal
     */
    isNone = function(animationOrTransition) {
      return !animationOrTransition || animationOrTransition === 'none' || u.isBlank(animationOrTransition);
    };
    registerAnimation('fade-in', function($element, options) {
      u.writeInlineStyle($element, {
        opacity: 0
      });
      return animateNow($element, {
        opacity: 1
      }, options);
    });
    registerAnimation('fade-out', function($element, options) {
      u.writeInlineStyle($element, {
        opacity: 1
      });
      return animateNow($element, {
        opacity: 0
      }, options);
    });
    translateCss = function(x, y) {
      return {
        transform: "translate(" + x + "px, " + y + "px)"
      };
    };
    registerAnimation('move-to-top', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = box.top + box.height;
      return animateNow($element, translateCss(0, -travelDistance), options);
    });
    registerAnimation('move-from-top', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = box.top + box.height;
      u.writeInlineStyle($element, translateCss(0, -travelDistance));
      return animateNow($element, translateCss(0, 0), options);
    });
    registerAnimation('move-to-bottom', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = u.clientSize().height - box.top;
      return animateNow($element, translateCss(0, travelDistance), options);
    });
    registerAnimation('move-from-bottom', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = u.clientSize().height - box.top;
      u.writeInlineStyle($element, translateCss(0, travelDistance));
      return animateNow($element, translateCss(0, 0), options);
    });
    registerAnimation('move-to-left', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = box.left + box.width;
      return animateNow($element, translateCss(-travelDistance, 0), options);
    });
    registerAnimation('move-from-left', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = box.left + box.width;
      u.writeInlineStyle($element, translateCss(-travelDistance, 0));
      return animateNow($element, translateCss(0, 0), options);
    });
    registerAnimation('move-to-right', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = u.clientSize().width - box.left;
      return animateNow($element, translateCss(travelDistance, 0), options);
    });
    registerAnimation('move-from-right', function($element, options) {
      var box, travelDistance;
      u.writeInlineStyle($element, translateCss(0, 0));
      box = u.measure($element);
      travelDistance = u.clientSize().width - box.left;
      u.writeInlineStyle($element, translateCss(travelDistance, 0));
      return animateNow($element, translateCss(0, 0), options);
    });
    registerAnimation('roll-down', function($element, options) {
      var deferred, fullHeight, styleMemo;
      fullHeight = $element.height();
      styleMemo = u.writeTemporaryStyle($element, {
        height: '0px',
        overflow: 'hidden'
      });
      deferred = animate($element, {
        height: fullHeight + "px"
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
      willAnimate: willAnimate,
      finish: finish,
      finishCount: function() {
        return motionTracker.finishCount;
      },
      transition: registerTransition,
      animation: registerAnimation,
      config: config,
      isEnabled: isEnabled,
      isNone: isNone
    };
  })(jQuery);

  up.transition = up.motion.transition;

  up.animation = up.motion.animation;

  up.morph = up.motion.morph;

  up.animate = up.motion.animate;

}).call(this);

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

@class up.proxy
 */

(function() {
  var slice = [].slice;

  up.proxy = (function($) {
    var $waitingLink, ajax, alias, cache, cancelPreloadDelay, cancelSlowDelay, clear, config, get, isBusy, isIdle, isSafeMethod, load, loadEnded, loadOrQueue, loadStarted, makeRequest, pendingCount, pokeQueue, preload, preloadAfterDelay, preloadDelayTimer, queue, queuedLoaders, registerAliasForRedirect, remove, reset, responseReceived, set, slowDelayTimer, slowEventEmitted, startPreloadDelay, stopPreload, u, wrapMethod;
    u = up.util;
    $waitingLink = void 0;
    preloadDelayTimer = void 0;
    slowDelayTimer = void 0;
    pendingCount = void 0;
    slowEventEmitted = void 0;
    queuedLoaders = [];

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
    config = u.config({
      slowDelay: 300,
      preloadDelay: 75,
      cacheSize: 70,
      cacheExpiry: 1000 * 60 * 5,
      maxRequests: 4,
      wrapMethods: ['PATCH', 'PUT', 'DELETE'],
      safeMethods: ['GET', 'OPTIONS', 'HEAD']
    });
    cache = new up.Cache({
      size: function() {
        return config.cacheSize;
      },
      expiry: function() {
        return config.cacheExpiry;
      },
      key: function(request) {
        return up.Request.wrap(request).cacheKey();
      },
      cachable: function(request) {
        return up.Request.wrap(request).isCachable();
      }
    });

    /***
    Returns a cached response for the given request.
    
    Returns `undefined` if the given request is not currently cached.
    
    @function up.proxy.get
    @return {Promise<up.Response>}
      A promise for the response.
    @experimental
     */
    get = function(request) {
      var candidate, candidates, i, len, requestForBody, requestForHtml, response;
      request = up.Request.wrap(request);
      candidates = [request];
      if (request.target !== 'html') {
        requestForHtml = request.copy({
          target: 'html'
        });
        candidates.push(requestForHtml);
        if (request.target !== 'body') {
          requestForBody = request.copy({
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
    cancelPreloadDelay = function() {
      clearTimeout(preloadDelayTimer);
      return preloadDelayTimer = null;
    };
    cancelSlowDelay = function() {
      clearTimeout(slowDelayTimer);
      return slowDelayTimer = null;
    };
    reset = function() {
      $waitingLink = null;
      cancelPreloadDelay();
      cancelSlowDelay();
      pendingCount = 0;
      config.reset();
      cache.clear();
      slowEventEmitted = false;
      return queuedLoaders = [];
    };
    reset();

    /***
    Makes an AJAX request to the given URL.
    
    \#\#\# Example
    
        up.request('/search', params: { query: 'sunshine' }).then(function(response) {
          console.log('The response text is %o', response.text);
        }).catch(function() {
          console.error('The request failed');
        });
    
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
      [Parameters](/up.params) that should be sent as the request's payload.
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
    makeRequest = function() {
      var args, ignoreCache, promise, request, requestOrOptions, url;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (u.isString(args[0])) {
        url = args.shift();
      }
      requestOrOptions = args.shift() || {};
      if (url) {
        requestOrOptions.url = url;
      }
      request = up.Request.wrap(requestOrOptions);
      if (!request.isSafe()) {
        clear();
      }
      ignoreCache = request.cache === false;
      if (!ignoreCache && (promise = get(request))) {
        up.puts('Re-using cached response for %s %s', request.method, request.url);
      } else {
        promise = loadOrQueue(request);
        set(request, promise);
        promise["catch"](function(e) {
          return remove(request);
        });
      }
      if (!request.preload) {
        loadStarted();
        u.always(promise, loadEnded);
      }
      return promise;
    };

    /***
    Makes an AJAX request to the given URL and caches the response.
    
    The function returns a promise that fulfills with the response text.
    
    \#\#\# Example
    
        up.request('/search', params: { query: 'sunshine' }).then(function(text) {
          console.log('The response text is %o', text);
        }).catch(function() {
          console.error('The request failed');
        });
    
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
      [Parameters](/up.params) that should be sent as the request's payload.
    @param {string} [request.timeout]
      A timeout in milliseconds for the request.
    
      If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set, the timeout
      will not include the time spent waiting in the queue.
    @return {Promise<string>}
      A promise for the response text.
    @deprecated
      Use [`up.request()`](/up.request) instead.
     */
    ajax = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      up.warn('up.ajax() has been deprecated. Use up.request() instead.');
      return new Promise(function(resolve, reject) {
        var pickResponseText;
        pickResponseText = function(response) {
          return resolve(response.text);
        };
        return makeRequest.apply(null, args).then(pickResponseText, reject);
      });
    };

    /***
    Returns `true` if the proxy is not currently waiting
    for a request to finish. Returns `false` otherwise.
    
    @function up.proxy.isIdle
    @return {boolean}
      Whether the proxy is idle
    @experimental
     */
    isIdle = function() {
      return pendingCount === 0;
    };

    /***
    Returns `true` if the proxy is currently waiting
    for a request to finish. Returns `false` otherwise.
    
    @function up.proxy.isBusy
    @return {boolean}
      Whether the proxy is busy
    @experimental
     */
    isBusy = function() {
      return pendingCount > 0;
    };
    loadStarted = function() {
      var emission;
      pendingCount += 1;
      if (!slowDelayTimer) {
        emission = function() {
          if (isBusy()) {
            up.emit('up:proxy:slow', {
              message: 'Proxy is slow to respond'
            });
            return slowEventEmitted = true;
          }
        };
        return slowDelayTimer = u.setTimer(config.slowDelay, emission);
      }
    };

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
    
        up.compiler('.spinner', function($element) {
    
          show = function() { $element.show() };
          hide = function() { $element.hide() };
    
          hide();
    
          return [
            up.on('up:proxy:slow', show),
            up.on('up:proxy:recover', hide)
          ];
    
        });
    
    The `up:proxy:slow` event will be emitted after a delay of 300 ms
    to prevent the spinner from flickering on and off.
    You can change (or remove) this delay by [configuring `up.proxy`](/up.proxy.config) like this:
    
        up.proxy.config.slowDelay = 150;
    
    
    @event up:proxy:slow
    @stable
     */
    loadEnded = function() {
      pendingCount -= 1;
      if (isIdle()) {
        cancelSlowDelay();
        if (slowEventEmitted) {
          up.emit('up:proxy:recover', {
            message: 'Proxy has recovered from slow response'
          });
          return slowEventEmitted = false;
        }
      }
    };

    /***
    This event is [emitted](/up.emit) when [AJAX requests](/up.request)
    have [taken long to finish](/up:proxy:slow), but have finished now.
    
    See [`up:proxy:slow`](/up:proxy:slow) for more documentation on
    how to use this event for implementing a spinner that shows during
    long-running requests.
    
    @event up:proxy:recover
    @stable
     */
    loadOrQueue = function(request) {
      if (pendingCount < config.maxRequests) {
        return load(request);
      } else {
        return queue(request);
      }
    };
    queue = function(request) {
      var loader;
      up.puts('Queuing request for %s %s', request.method, request.url);
      loader = function() {
        return load(request);
      };
      loader = u.previewable(loader);
      queuedLoaders.push(loader);
      return loader.promise;
    };
    load = function(request) {
      var eventProps, responsePromise;
      eventProps = {
        request: request,
        message: ['Loading %s %s', request.method, request.url]
      };
      if (up.bus.nobodyPrevents('up:proxy:load', eventProps)) {
        responsePromise = request.send();
        u.always(responsePromise, responseReceived);
        u.always(responsePromise, pokeQueue);
        return responsePromise;
      } else {
        u.microtask(pokeQueue);
        return Promise.reject(new Error('Event up:proxy:load was prevented'));
      }
    };

    /***
    This event is [emitted](/up.emit) before an [AJAX request](/up.request)
    is sent over the network.
    
    @event up:proxy:load
    @param {up.Request} event.request
    @param event.preventDefault()
      Event listeners may call this method to prevent the request from being sent.
    @experimental
     */
    registerAliasForRedirect = function(response) {
      var newRequest, request;
      request = response.request;
      if (response.url && request.url !== response.url) {
        newRequest = request.copy({
          method: response.method,
          url: response.url
        });
        return up.proxy.alias(request, newRequest);
      }
    };
    responseReceived = function(response) {
      if (response.isFatalError()) {
        return up.emit('up:proxy:fatal', {
          message: 'Fatal error during request',
          request: response.request,
          response: response
        });
      } else {
        if (!response.isError()) {
          registerAliasForRedirect(response);
        }
        return up.emit('up:proxy:loaded', {
          message: ['Server responded with HTTP %d (%d bytes)', response.status, response.text.length],
          request: response.request,
          response: response
        });
      }
    };

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
    pokeQueue = function() {
      var base;
      if (typeof (base = queuedLoaders.shift()) === "function") {
        base();
      }
      return void 0;
    };

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
    alias = cache.alias;

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
    set = cache.set;

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
    remove = cache.remove;

    /***
    Removes all cache entries.
    
    Unpoly also automatically clears the cache whenever it processes
    a request with an [unsafe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    HTTP method like `POST`.
    
    @function up.proxy.clear
    @stable
     */
    clear = cache.clear;
    up.bus.deprecateRenamedEvent('up:proxy:received', 'up:proxy:loaded');
    preloadAfterDelay = function($link) {
      var curriedPreload, delay;
      delay = parseInt(u.presentAttr($link, 'up-delay')) || config.preloadDelay;
      if (!$link.is($waitingLink)) {
        $waitingLink = $link;
        cancelPreloadDelay();
        curriedPreload = function() {
          u.muteRejection(preload($link));
          return $waitingLink = null;
        };
        return startPreloadDelay(curriedPreload, delay);
      }
    };
    startPreloadDelay = function(block, delay) {
      return preloadDelayTimer = setTimeout(block, delay);
    };
    stopPreload = function($link) {
      if ($link.is($waitingLink)) {
        $waitingLink = void 0;
        return cancelPreloadDelay();
      }
    };

    /***
    Preloads the given link.
    
    When the link is clicked later, the response will already be cached,
    making the interaction feel instant.
    
    @function up.proxy.preload
    @param {string|Element|jQuery}
      The element whose destination should be preloaded.
    @param {object} options
      Options that will be passed to the function making the HTTP requests.
    @return
      A promise that will be fulfilled when the request was loaded and cached
    @experimental
     */
    preload = function(linkOrSelector, options) {
      var $link, preloadEventAttrs;
      $link = $(linkOrSelector);
      if (up.link.isSafe($link)) {
        preloadEventAttrs = {
          message: ['Preloading link %o', $link.get(0)],
          $element: $link,
          $link: $link
        };
        return up.bus.whenEmitted('up:link:preload', preloadEventAttrs).then(function() {
          var variant;
          variant = up.link.followVariantForLink($link);
          return variant.preloadLink($link, options);
        });
      } else {
        return Promise.reject(new Error("Won't preload unsafe link"));
      }
    };

    /***
    This event is [emitted](/up.emit) before a link is [preloaded](/up.preload).
    
    @event up:link:preload
    @param {jQuery} event.$link
      The link element that will be preloaded.
    @param event.preventDefault()
      Event listeners may call this method to prevent the link from being preloaded.
    @stable
     */

    /***
    @internal
     */
    isSafeMethod = function(method) {
      return u.contains(config.safeMethods, method);
    };

    /***
    @internal
     */
    wrapMethod = function(method, params) {
      if (u.contains(config.wrapMethods, method)) {
        params = up.params.add(params, up.protocol.config.methodParam, method);
        method = 'POST';
      }
      return [method, params];
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
    up.compiler('a[up-preload], [up-href][up-preload]', function($link) {
      if (up.link.isSafe($link)) {
        $link.on('mouseenter touchstart', function(event) {
          if (up.link.shouldProcessEvent(event, $link)) {
            return preloadAfterDelay($link);
          }
        });
        return $link.on('mouseleave', function() {
          return stopPreload($link);
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
  })(jQuery);

  up.ajax = up.proxy.ajax;

  up.request = up.proxy.request;

}).call(this);

/***
Linking to fragments
====================

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
the targeted ragments and discard the rest:

![Unpoly page flow](/images/tutorial/fragment_flow_unpoly.svg){:width="620" class="picture has_border is_sepia has_padding"}

With this model, following links feel smooth. All transient DOM changes outside the updated fragment are preserved.
Pages also load much faster since the DOM, CSS and Javascript environments do not need to be
destroyed and recreated for every request.


## Example

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

@class up.link
 */

(function() {
  up.link = (function($) {
    var DEFAULT_FOLLOW_VARIANT, addFollowVariant, allowDefault, defaultFollow, defaultPreload, follow, followMethod, followVariantForLink, followVariants, isFollowable, isSafe, makeFollowable, shouldProcessEvent, u, visit;
    u = up.util;

    /***
    Visits the given URL without a full page load.
    This is done by fetching `url` through an AJAX request
    and [replacing](/up.replace) the current `<body>` element with the response's `<body>` element.
    
    For example, this would fetch the `/users` URL:
    
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
    visit = function(url, options) {
      var selector;
      options = u.options(options);
      selector = u.option(options.target, 'body');
      return up.replace(selector, url, options);
    };

    /***
    Follows the given link via AJAX and [replaces](/up.replace) the current page
    with HTML from the response.
    
    By default the page's `<body>` element will be replaced.
    If the link has an attribute like [`[up-target]`](/up-target)
    or [`[up-modal]`](/a-up-modal), the corresponding UJS behavior will be activated
    just as if the user had clicked on the link.
    
    Emits the event [`up:link:follow`](/up:link:follow).
    
    \#\#\# Examples
    
    Let's say you have a link with an [`a[up-target]`](/a-up-target) attribute:
    
        <a href="/users" up-target=".main">Users</a>
    
    Calling `up.follow()` with this link will replace the page's `.main` fragment
    as if the user had clicked on the link:
    
        var $link = $('a:first');
        up.follow($link);
    
    @function up.follow
    @param {Element|jQuery|string} linkOrSelector
      An element or selector which is either an `<a>` tag or any element with an `up-href` attribute.
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
    follow = function(linkOrSelector, options) {
      var $link, variant;
      $link = $(linkOrSelector);
      variant = followVariantForLink($link);
      return variant.followLink($link, options);
    };

    /***
    This event is [emitted](/up.emit) when a link is [followed](/up.follow) through Unpoly.
    
    The event is emitted on the `<a>` element that is being followed.
    
    @event up:link:follow
    @param {jQuery} event.$link
      The link element that will be followed.
    @param event.preventDefault()
      Event listeners may call this method to prevent the link from being followed.
    @stable
     */

    /***
    @function defaultFollow
    @internal
     */
    defaultFollow = function(linkOrSelector, options) {
      var $link, target, url;
      $link = $(linkOrSelector);
      options = u.options(options);
      url = u.option(options.url, $link.attr('up-href'), $link.attr('href'));
      target = u.option(options.target, $link.attr('up-target'));
      options.failTarget = u.option(options.failTarget, $link.attr('up-fail-target'));
      options.fallback = u.option(options.fallback, $link.attr('up-fallback'));
      options.transition = u.option(options.transition, u.castedAttr($link, 'up-transition'), 'none');
      options.failTransition = u.option(options.failTransition, u.castedAttr($link, 'up-fail-transition'), 'none');
      options.history = u.option(options.history, u.castedAttr($link, 'up-history'));
      options.reveal = u.option(options.reveal, u.castedAttr($link, 'up-reveal'), true);
      options.failReveal = u.option(options.failReveal, u.castedAttr($link, 'up-fail-reveal'), true);
      options.cache = u.option(options.cache, u.castedAttr($link, 'up-cache'));
      options.restoreScroll = u.option(options.restoreScroll, u.castedAttr($link, 'up-restore-scroll'));
      options.method = followMethod($link, options);
      options.origin = u.option(options.origin, $link);
      options.layer = u.option(options.layer, $link.attr('up-layer'), 'auto');
      options.failLayer = u.option(options.failLayer, $link.attr('up-fail-layer'), 'auto');
      options.confirm = u.option(options.confirm, $link.attr('up-confirm'));
      options = u.merge(options, up.motion.animateOptions(options, $link));
      return up.browser.whenConfirmed(options).then(function() {
        return up.replace(target, url, options);
      });
    };
    defaultPreload = function($link, options) {
      options = u.options(options);
      options.preload = true;
      return defaultFollow($link, options);
    };

    /***
    Returns the HTTP method that should be used when following the given link.
    
    Looks at the link's `up-method` or `data-method` attribute.
    Defaults to `"get"`.
    
    @function up.link.followMethod
    @param linkOrSelector
    @param options.method {string}
    @internal
     */
    followMethod = function(linkOrSelector, options) {
      var $link;
      $link = $(linkOrSelector);
      options = u.options(options);
      return u.option(options.method, $link.attr('up-method'), $link.attr('data-method'), 'get').toUpperCase();
    };

    /***
    No-op that is called when we allow a browser's default action to go through,
    so we can spy on it in unit tests. See `link_spec.js`.
    
    @function allowDefault
    @internal
     */
    allowDefault = function(event) {};
    followVariants = [];

    /***
    Registers the given handler for links with the given selector.
    
    This does more than a simple `click` handler:
    
    - It also handles `[up-instant]`
    - It also handles `[up-href]`
    
    @function up.link.addFollowVariant
    @param {string} simplifiedSelector
      A selector without `a` or `[up-href]`, e.g. `[up-target]`
    @param {Function(jQuery, Object)} options.follow
    @param {Function(jQuery, Object)} options.preload
    @internal
     */
    addFollowVariant = function(simplifiedSelector, options) {
      var variant;
      variant = new up.FollowVariant(simplifiedSelector, options);
      followVariants.push(variant);
      variant.registerEvents();
      return variant;
    };

    /***
    Returns whether the given link will be handled by Unpoly instead of making a full page load.
    
    A link will be handled by Unpoly if it has an attribute
    like `up-target` or `up-modal`.
    
    @function up.link.isFollowable
    @param {Element|jQuery|string} linkOrSelector
      The link to check.
    @experimental
     */
    isFollowable = function(link) {
      return !!followVariantForLink(link, {
        "default": false
      });
    };

    /***
    Returns the handler function that can be used to follow the given link.
    E.g. it wil return a handler calling `up.modal.follow` if the link is a `[up-modal]`,
    but a handler calling `up.link.follow` if the links is `[up-target]`.
    
    @param {Element|jQuery|string}
    @return {Function(jQuery)}
    @internal
     */
    followVariantForLink = function(linkOrSelector, options) {
      var $link, variant;
      options = u.options(options);
      $link = $(linkOrSelector);
      variant = u.detect(followVariants, function(variant) {
        return variant.matchesLink($link);
      });
      if (options["default"] !== false) {
        variant || (variant = DEFAULT_FOLLOW_VARIANT);
      }
      return variant;
    };

    /***
    Makes sure that the given link will be handled by Unpoly instead of making a full page load.
    
    This is done by giving the link an `up-follow` attribute
    unless it already have it an attribute like `up-target` or `up-modal`.
    
    @function up.link.makeFollowable
    @param {Element|jQuery|string} linkOrSelector
      The link to process.
    @experimental
     */
    makeFollowable = function(link) {
      var $link;
      $link = $(link);
      if (!isFollowable($link)) {
        return $link.attr('up-follow', '');
      }
    };
    shouldProcessEvent = function(event, $link) {
      var $betterTarget, target;
      target = event.target;
      if (!u.isUnmodifiedMouseEvent(event)) {
        return false;
      }
      if (target === $link.get(0)) {
        return true;
      }
      $betterTarget = $(target).closest("a, [up-href], " + (up.form.fieldSelector())).not($link);
      if ($betterTarget.length) {
        return false;
      }
      return true;
    };

    /***
    Returns whether the given link has a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    HTTP method like `GET`.
    
    @function up.link.isSafe
    @experimental
     */
    isSafe = function(selectorOrLink, options) {
      var $link, method;
      $link = $(selectorOrLink);
      method = followMethod($link, options);
      return up.proxy.isSafeMethod(method);
    };

    /***
    Follows this link via AJAX and replaces a CSS selector in the current page
    with corresponding elements from a new page fetched from the server:
    
        <a href="/posts/5" up-target=".main">Read post</a>
    
    \#\#\# Updating multiple fragments
    
    You can update multiple fragments from a single request by separating
    separators with a comma (like in CSS). E.g. if opening a post should
    also update a bubble showing the number of unread posts, you might
    do this:
    
        <a href="/posts/5" up-target=".main, .unread-count">Read post</a>
    
    \#\#\# Appending or prepending content
    
    By default Unpoly will replace the given selector with the same
    selector from a freshly fetched page. Instead of replacing you
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
    In this case, put the link's destination into the `up-href` attribute:
    
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
    DEFAULT_FOLLOW_VARIANT = addFollowVariant('[up-target], [up-follow]', {
      follow: function($link, options) {
        return defaultFollow($link, options);
      },
      preload: function($link, options) {
        return defaultPreload($link, options);
      }
    });

    /***
    If applied on a link, follows this link via AJAX and replaces the
    current `<body>` element with the response's `<body>` element.
    
    To only update a fragment instead of the entire page, see
    [`a[up-target]`](/a-up-target).
    
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
    
    Note that using `[up-instant]` will prevent a user from canceling a link
    click by moving the mouse away from the interaction area. However, for
    navigation actions this isn't needed. E.g. popular operation
    systems switch tabs on `mousedown` instead of `click`.
    
    `up-instant` will also work for links that open [modals](/up.modal) or [popups](/up.popup).
    
    @selector a[up-instant]
    @stable
     */

    /***
    Marks up the current link to be followed *as fast as possible*.
    
    This is done by:
    
    - [Following the link through AJAX](/a-up-target) instead of a full page load
    - [Preloading the link's destination URL](/a-up-preload)
    - [Triggering the link on `mousedown`](/a-up-instant) instead of on `click`
    
    Use `up-dash` like this:
    
        <a href="/users" up-dash=".main">User list</a>
    
    Note that this is shorthand for:
    
        <a href="/users" up-target=".main" up-instant up-preload>User list</a>
    
    @selector a[up-dash]
    @stable
     */
    up.macro('[up-dash]', function($element) {
      var newAttrs, target;
      target = u.castedAttr($element, 'up-dash');
      $element.removeAttr('up-dash');
      newAttrs = {
        'up-preload': '',
        'up-instant': ''
      };
      if (target === true) {
        makeFollowable($element);
      } else {
        newAttrs['up-target'] = target;
      }
      return u.setMissingAttrs($element, newAttrs);
    });

    /***
    Add an `[up-expand]` attribute to any element that contains a link
    in order to enlarge the link's click area.
    
    `[up-expand]` honors all the UJS behavior in expanded links
    ([`a[up-target]`](/a-up-target), [`a[up-instant]`](/a-up-instant), [`a[up-preload]`](/a-up-preload), etc.).
    
    \#\#\# Example
    
        <div class="notification" up-expand>
          Record was saved!
          <a href="/records">Close</a>
        </div>
    
    In the example above, clicking anywhere within `.notification` element
    would [follow](/up.follow) the *Close* link.
    
    `up-expand` also expands links that open [modals](/up.modal) or [popups](/up.popup).
    
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
    - Users won't be able to CTRL+click the expanded area to open a new tab
    
    To overcome these limitations, consider nesting the entire clickable area in an actual `<a>` tag.
    [It's OK to put block elements inside an anchor tag](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).
    
    @selector [up-expand]
    @param {string} [up-expand]
      A CSS selector that defines which containing link should be expanded.
    
      If omitted, the first contained link will be expanded.
    @stable
     */
    up.macro('[up-expand]', function($area) {
      var $childLinks, attribute, i, len, link, name, newAttrs, ref, selector, upAttributePattern;
      $childLinks = $area.find('a, [up-href]');
      if (selector = $area.attr('up-expand')) {
        $childLinks = $childLinks.filter(selector);
      }
      if (link = $childLinks.get(0)) {
        upAttributePattern = /^up-/;
        newAttrs = {};
        newAttrs['up-href'] = $(link).attr('href');
        ref = link.attributes;
        for (i = 0, len = ref.length; i < len; i++) {
          attribute = ref[i];
          name = attribute.name;
          if (name.match(upAttributePattern)) {
            newAttrs[name] = attribute.value;
          }
        }
        u.setMissingAttrs($area, newAttrs);
        $area.removeAttr('up-expand');
        return makeFollowable($area);
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
  })(jQuery);

  up.visit = up.link.visit;

  up.follow = up.link.follow;

}).call(this);

/***
Forms
=====
  
Unpoly comes with functionality to [submit](/form-up-target) and [validate](/input-up-validate)
forms without leaving the current page. This means you can replace page fragments,
open dialogs with sub-forms, etc. all without losing form state.

@class up.form
 */

(function() {
  var slice = [].slice;

  up.form = (function($) {
    var autosubmit, config, fieldSelector, findSwitcherForTarget, observe, observeField, reset, resolveValidateTarget, submit, submitButtonSelector, switchTarget, switchTargets, switcherValues, u, validate;
    u = up.util;

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
      around the validating input field, or any element with an
      `up-fieldset` attribute.
    @param {string} [config.fields]
      An array of CSS selectors that represent form fields, such as `input` or `select`.
    @param {string} [config.submitButtons]
      An array of CSS selectors that represent submit buttons, such as `input[type=submit]`.
    @stable
     */
    config = u.config({
      validateTargets: ['[up-fieldset]:has(&)', 'fieldset:has(&)', 'label:has(&)', 'form:has(&)'],
      fields: ['select', 'input:not([type=submit]):not([type=image])', 'button[type]:not([type=submit])', 'textarea'],
      submitButtons: ['input[type=submit]', 'input[type=image]', 'button[type=submit]', 'button:not([type])'],
      observeDelay: 0
    });
    reset = function() {
      return config.reset();
    };

    /***
    @function up.form.fieldSelector
    @internal
     */
    fieldSelector = function() {
      return config.fields.join(',');
    };

    /***
    @function up.form.submitButtonSelector
    @internal
     */
    submitButtonSelector = function() {
      return config.submitButtons.join(',');
    };

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
    submit = function(formOrSelector, options) {
      var $form, target, url;
      $form = $(formOrSelector).closest('form');
      options = u.options(options);
      target = u.option(options.target, $form.attr('up-target'), 'body');
      url = u.option(options.url, $form.attr('action'), up.browser.url());
      options.failTarget = u.option(options.failTarget, $form.attr('up-fail-target')) || u.selectorForElement($form);
      options.reveal = u.option(options.reveal, u.castedAttr($form, 'up-reveal'), true);
      options.failReveal = u.option(options.failReveal, u.castedAttr($form, 'up-fail-reveal'), true);
      options.fallback = u.option(options.fallback, $form.attr('up-fallback'));
      options.history = u.option(options.history, u.castedAttr($form, 'up-history'), true);
      options.transition = u.option(options.transition, u.castedAttr($form, 'up-transition'), 'none');
      options.failTransition = u.option(options.failTransition, u.castedAttr($form, 'up-fail-transition'), 'none');
      options.method = u.option(options.method, $form.attr('up-method'), $form.attr('data-method'), $form.attr('method'), 'post').toUpperCase();
      options.headers = u.option(options.headers, {});
      options.cache = u.option(options.cache, u.castedAttr($form, 'up-cache'));
      options.restoreScroll = u.option(options.restoreScroll, u.castedAttr($form, 'up-restore-scroll'));
      options.origin = u.option(options.origin, $form);
      options.layer = u.option(options.layer, $form.attr('up-layer'), 'auto');
      options.failLayer = u.option(options.failLayer, $form.attr('up-fail-layer'), 'auto');
      options.params = up.params.fromForm($form);
      options = u.merge(options, up.motion.animateOptions(options, $form));
      if (options.validate) {
        options.headers || (options.headers = {});
        options.transition = false;
        options.failTransition = false;
        options.headers[up.protocol.config.validateHeader] = options.validate;
      }
      return up.bus.whenEmitted('up:form:submit', {
        message: 'Submitting form',
        $form: $form,
        $element: $form
      }).then(function() {
        var promise;
        up.feedback.start($form);
        if (!(up.browser.canPushState() || options.history === false)) {
          $form.get(0).submit();
          return u.unresolvablePromise();
        }
        promise = up.replace(target, url, options);
        u.always(promise, function() {
          return up.feedback.stop($form);
        });
        return promise;
      });
    };

    /***
    This event is [emitted](/up.emit) when a form is [submitted](/up.submit) through Unpoly.
    
    @event up:form:submit
    @param {jQuery} event.$form
      The `<form>` element that will be submitted.
    @param event.preventDefault()
      Event listeners may call this method to prevent the form from being submitted.
    @stable
     */

    /***
    Observes form fields and runs a callback when a value changes.
    
    This is useful for observing text fields while the user is typing.
    
    The unobtrusive variant of this is the [`up-observe`](/up-observe) attribute.
    
    \#\#\# Example
    
    The following would print to the console whenever an input field changes:
    
        up.observe('input.query', function(value, $input) {
          console.log('Query is now ' + value);
        });
    
    Instead of a single form field, you can also pass multiple fields,
    a `<form>` or any container that contains form fields.
    The callback will be run if any of the given fields change.
    
    \#\#\# Preventing concurrency
    
    Making network requests whenever a form field changes can cause
    [concurrency issues](https://makandracards.com/makandra/961-concurrency-issues-with-find-as-you-type-boxes).
    Since `up.observe()` can trigger many requests in a short period of time,
    the responses might not arrive in the same order.
    
    To mitigate this, `up.observe()` will try to never run a callback
    before the previous callback has completed.
    For this your callback code must return a promise that resolves
    when your request completes.
    
    The following would submit a form whenever an input field changes,
    but never make more than one request at a time:
    
        up.observe('input.query', function(value, $input) {
          var submitDone = up.submit($input);
          return submitDone;
        });
    
    Note that many Unpoly functions like [`up.submit()`](/up.submit) or
    [`up.replace()`](/up.replace) return promises.
    
    \#\#\# Debouncing
    
    If you are concerned about fast typists causing too much
    load on your server, you can use a `delay` option to wait
    a few miliseconds before executing the callback:
    
        up.observe('input', { delay: 100 }, function(value, $input) {
          up.submit($input)
        });
    
    @function up.observe
    @param {Element|jQuery|string} selectorOrElement
      The form fields that wiill be observed.
    
      You can pass one or more fields, a `<form>` or any container that contains form fields.
      The callback will be run if any of the given fields change.
    @param {number} [options.delay=up.form.config.observeDelay]
      The number of miliseconds to wait before executing the callback
      after the input value changes. Use this to limit how often the callback
      will be invoked for a fast typist.
    @param {Function(value, $field)|string} onChange
      The callback to run when the field's value changes.
      If given as a function, it must take two arguments (`value`, `$field`).
      If given as a string, it will be evaled as JavaScript code in a context where
      (`value`, `$field`) are set.
    @return {Function}
      A destructor function that removes the observe watch when called.
    @stable
     */
    observe = function() {
      var $element, $fields, callback, callbackArg, delay, destructors, extraArgs, options, rawCallback, selectorOrElement;
      selectorOrElement = arguments[0], extraArgs = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      options = {};
      callbackArg = void 0;
      if (extraArgs.length === 1) {
        callbackArg = extraArgs[0];
      } else if (extraArgs.length > 1) {
        options = u.options(extraArgs[0]);
        callbackArg = extraArgs[1];
      }
      $element = $(selectorOrElement);
      callback = null;
      rawCallback = u.option(callbackArg, u.presentAttr($element, 'up-observe'));
      if (u.isString(rawCallback)) {
        callback = new Function('value', '$field', rawCallback);
      } else {
        callback = rawCallback || up.fail('up.observe: No change callback given');
      }
      delay = u.option(u.presentAttr($element, 'up-delay'), options.delay, config.observeDelay);
      delay = parseInt(delay);
      $fields = u.selectInSubtree($element, fieldSelector());
      destructors = u.map($fields, function(field) {
        return observeField($(field), delay, callback);
      });
      return u.sequence.apply(u, destructors);
    };
    observeField = function($field, delay, callback) {
      var observer;
      observer = new up.FieldObserver($field, {
        delay: delay,
        callback: callback
      });
      observer.start();
      return observer.stop;
    };

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
    @return {Function}
      A destructor function that removes the observe watch when called.
    @stable
     */
    autosubmit = function(selectorOrElement, options) {
      return observe(selectorOrElement, options, function(value, $field) {
        var $form;
        $form = $field.closest('form');
        return up.feedback.start($field, function() {
          return submit($form);
        });
      });
    };
    resolveValidateTarget = function($field, options) {
      var target;
      target = u.option(options.target, $field.attr('up-validate'));
      if (u.isBlank(target)) {
        target || (target = u.detect(config.validateTargets, function(defaultTarget) {
          var resolvedDefault;
          resolvedDefault = up.dom.resolveSelector(defaultTarget, options.origin);
          return $field.closest(resolvedDefault).length;
        }));
      }
      if (u.isBlank(target)) {
        up.fail('Could not find default validation target for %o (tried ancestors %o)', $field.get(0), config.validateTargets);
      }
      if (!u.isString(target)) {
        target = u.selectorForElement(target);
      }
      return target;
    };

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
    validate = function(fieldOrSelector, options) {
      var $field, $form, promise;
      $field = $(fieldOrSelector);
      options = u.options(options);
      options.origin = $field;
      options.target = resolveValidateTarget($field, options);
      options.failTarget = options.target;
      options.reveal = u.option(options.reveal, u.castedAttr($field, 'up-reveal'), false);
      options.history = false;
      options.headers = u.option(options.headers, {});
      options.validate = $field.attr('name') || '__none__';
      options = u.merge(options, up.motion.animateOptions(options, $field));
      $form = $field.closest('form');
      promise = up.submit($form, options);
      return promise;
    };
    switcherValues = function($field) {
      var $checkedButton, meta, value, values;
      if ($field.is('input[type=checkbox]')) {
        if ($field.is(':checked')) {
          value = $field.val();
          meta = ':checked';
        } else {
          meta = ':unchecked';
        }
      } else if ($field.is('input[type=radio]')) {
        $checkedButton = $field.closest('form, body').find("input[type='radio'][name='" + ($field.attr('name')) + "']:checked");
        if ($checkedButton.length) {
          meta = ':checked';
          value = $checkedButton.val();
        } else {
          meta = ':unchecked';
        }
      } else {
        value = $field.val();
      }
      values = [];
      if (u.isPresent(value)) {
        values.push(value);
        values.push(':present');
      } else {
        values.push(':blank');
      }
      if (u.isPresent(meta)) {
        values.push(meta);
      }
      return values;
    };

    /***
    Shows or hides a target selector depending on the value.
    
    See [`input[up-switch]`](/input-up-switch) for more documentation and examples.
    
    This function does not currently have a very useful API outside
    of our use for `up-switch`'s UJS behavior, that's why it's currently
    still marked `@internal`.
    
    @function up.form.switchTargets
    @param {string|Element|jQuery} fieldOrSelector
    @param {string} [options.target]
      The target selectors to switch.
      Defaults to an `up-switch` attribute on the given field.
    @internal
     */
    switchTargets = function(fieldOrSelector, options) {
      var $switcher, fieldValues, targetSelector;
      $switcher = $(fieldOrSelector);
      options = u.options(options);
      targetSelector = u.option(options.target, $switcher.attr('up-switch'));
      u.isPresent(targetSelector) || up.fail("No switch target given for %o", $switcher.get(0));
      fieldValues = switcherValues($switcher);
      return $(targetSelector).each(function() {
        return switchTarget($(this), fieldValues);
      });
    };

    /***
    @internal
     */
    switchTarget = function(target, fieldValues) {
      var $target, hideValues, show, showValues;
      $target = $(target);
      fieldValues || (fieldValues = switcherValues(findSwitcherForTarget($target)));
      if (hideValues = $target.attr('up-hide-for')) {
        hideValues = u.splitValues(hideValues);
        show = u.intersect(fieldValues, hideValues).length === 0;
      } else {
        if (showValues = $target.attr('up-show-for')) {
          showValues = u.splitValues(showValues);
        } else {
          showValues = [':present', ':checked'];
        }
        show = u.intersect(fieldValues, showValues).length > 0;
      }
      $target.toggle(show);
      return $target.addClass('up-switched');
    };

    /***
    @internal
     */
    findSwitcherForTarget = function($target) {
      var $switchers, switcher;
      $switchers = $('[up-switch]');
      switcher = u.detect($switchers, function(switcher) {
        var target;
        target = $(switcher).attr('up-switch');
        return $target.is(target);
      });
      if (switcher) {
        return $(switcher);
      } else {
        return u.fail('Could not find [up-switch] field for %o', $target.get(0));
      }
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
    up.on('submit', 'form[up-target]', function(event, $form) {
      up.bus.consumeAction(event);
      return u.muteRejection(submit($form));
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
    up.on('change', '[up-validate]', function(event, $field) {
      return u.muteRejection(validate($field));
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
    up.compiler('[up-switch]', function($field) {
      return switchTargets($field);
    });
    up.on('change', '[up-switch]', function(event, $field) {
      return switchTargets($field);
    });
    up.compiler('[up-show-for]:not(.up-switched), [up-hide-for]:not(.up-switched)', function($element) {
      return switchTarget($element);
    });

    /***
    Observes this field and runs a callback when a value changes.
    
    This is useful for observing text fields while the user is typing.
    If you want to submit the form after a change see [`input[up-autosubmit]`](/input-up-autosubmit).
    
    The programmatic variant of this is the [`up.observe()`](/up.observe) function.
    
    \#\#\# Examples
    
    The following would run a global `showSuggestions(value)` function
    whenever the `<input>` changes:
    
        <form>
          <input name="query" up-observe="showSuggestions(value)">
        </form>
    
    \#\#\# Callback context
    
    The script given to `up-observe` runs with the following context:
    
    | Name     | Type      | Description                           |
    | -------- | --------- | ------------------------------------- |
    | `value`  | `string`  | The current value of the field        |
    | `this`   | `Element` | The form field                        |
    | `$field` | `jQuery`  | The form field as a jQuery collection |
    
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
    up.compiler('[up-observe]', function($formOrField) {
      return observe($formOrField);
    });

    /***
    [Observes](/up.observe) this form field and submits the form when its value changes.
    
    Both the form and the changed field will be assigned a CSS class [`up-active`](/form-up-active)
    while the autosubmitted form is loading.
    
    The programmatic variant of this is the [`up.autosubmit()`](/up.autosubmit) function.
    
    \#\#\# Example
    
    The following would automatically submit the form when the query is changed:
    
        <form method="GET" action="/search">
          <input type="search" name="query" up-autosubmit>
          <input type="checkbox" name="archive"> Include archive
        </form>
    
    @selector input[up-autosubmit]
    @param {string} up-delay
      The number of miliseconds to wait after a change before the form is submitted.
    @stable
     */

    /***
    [Observes](/up.observe) this form and submits the form when *any* field changes.
    
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
    up.compiler('[up-autosubmit]', function($formOrField) {
      return autosubmit($formOrField);
    });
    up.compiler('[autofocus]', {
      batch: true
    }, function($input) {
      return $input.last().focus();
    });
    up.on('up:framework:reset', reset);
    return {
      config: config,
      submit: submit,
      observe: observe,
      validate: validate,
      switchTargets: switchTargets,
      autosubmit: autosubmit,
      fieldSelector: fieldSelector,
      submitButtonSelector: submitButtonSelector
    };
  })(jQuery);

  up.submit = up.form.submit;

  up.observe = up.form.observe;

  up.autosubmit = up.form.autosubmit;

  up.validate = up.form.validate;

}).call(this);

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

The HTML of a popup element is simply this:

    <div class="up-popup">
      ...
    </div>


@class up.popup
 */

(function() {
  up.popup = (function($) {
    var align, attachAsap, attachNow, autoclose, chain, closeAsap, closeNow, config, contains, createHiddenFrame, discardHistory, isOpen, preloadNow, reset, state, toggleAsap, u, unveilFrame;
    u = up.util;

    /***
    Sets default options for future popups.
    
    @property up.popup.config
    @param {string} [config.position='bottom-right']
      Defines where the popup is attached to the opening element.
    
      Valid values are `'bottom-right'`, `'bottom-left'`, `'top-right'` and `'top-left'`.
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
    config = u.config({
      openAnimation: 'fade-in',
      closeAnimation: 'fade-out',
      openDuration: 150,
      closeDuration: 100,
      openEasing: null,
      closeEasing: null,
      position: 'bottom-right',
      history: false
    });

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
    state = u.config({
      phase: 'closed',
      $anchor: null,
      $popup: null,
      position: null,
      sticky: null,
      url: null,
      coveredUrl: null,
      coveredTitle: null
    });
    chain = new u.DivertibleChain();
    reset = function() {
      var ref;
      if ((ref = state.$popup) != null) {
        ref.remove();
      }
      state.reset();
      chain.reset();
      return config.reset();
    };
    align = function() {
      var linkBox, popupBox, style;
      style = {};
      popupBox = u.measure(state.$popup);
      if (u.isFixed(state.$anchor)) {
        linkBox = state.$anchor.get(0).getBoundingClientRect();
        style.position = 'fixed';
      } else {
        linkBox = u.measure(state.$anchor);
      }
      switch (state.position) {
        case 'bottom-right':
          style.top = linkBox.top + linkBox.height;
          style.left = linkBox.left + linkBox.width - popupBox.width;
          break;
        case 'bottom-left':
          style.top = linkBox.top + linkBox.height;
          style.left = linkBox.left;
          break;
        case 'top-right':
          style.top = linkBox.top - popupBox.height;
          style.left = linkBox.left + linkBox.width - popupBox.width;
          break;
        case 'top-left':
          style.top = linkBox.top - popupBox.height;
          style.left = linkBox.left;
          break;
        default:
          up.fail("Unknown position option '%s'", state.position);
      }
      state.$popup.attr('up-position', state.position);
      return u.writeInlineStyle(state.$popup, style);
    };
    discardHistory = function() {
      state.coveredTitle = null;
      return state.coveredUrl = null;
    };
    createHiddenFrame = function(target) {
      var $popup;
      $popup = u.$createElementFromSelector('.up-popup');
      u.$createPlaceholder(target, $popup);
      $popup.hide();
      $popup.appendTo(document.body);
      return state.$popup = $popup;
    };
    unveilFrame = function() {
      return state.$popup.show();
    };

    /***
    Returns whether popup modal is currently open.
    
    @function up.popup.isOpen
    @return {boolean}
    @stable
     */
    isOpen = function() {
      return state.phase === 'opened' || state.phase === 'opening';
    };

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
    @param {string} [options.position='bottom-right']
      Defines where the popup is attached to the opening element.
    
      Valid values are `'bottom-right'`, `'bottom-left'`, `'top-right'` and `'top-left'`.
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
    attachAsap = function(elementOrSelector, options) {
      return chain.asap(closeNow, (function() {
        return attachNow(elementOrSelector, options);
      }));
    };
    attachNow = function(elementOrSelector, options) {
      var $anchor, animateOptions, extractOptions, html, position, target, url;
      $anchor = $(elementOrSelector);
      $anchor.length || up.fail('Cannot attach popup to non-existing element %o', elementOrSelector);
      options = u.options(options);
      url = u.option(u.pluckKey(options, 'url'), $anchor.attr('up-href'), $anchor.attr('href'));
      html = u.option(u.pluckKey(options, 'html'));
      url || html || up.fail('up.popup.attach() requires either an { url } or { html } option');
      target = u.option(u.pluckKey(options, 'target'), $anchor.attr('up-popup')) || up.fail('No target selector given for [up-popup]');
      position = u.option(options.position, $anchor.attr('up-position'), config.position);
      options.animation = u.option(options.animation, $anchor.attr('up-animation'), config.openAnimation);
      options.sticky = u.option(options.sticky, u.castedAttr($anchor, 'up-sticky'), config.sticky);
      options.history = up.browser.canPushState() ? u.option(options.history, u.castedAttr($anchor, 'up-history'), config.history) : false;
      options.confirm = u.option(options.confirm, $anchor.attr('up-confirm'));
      options.method = up.link.followMethod($anchor, options);
      options.layer = 'popup';
      options.failTarget = u.option(options.failTarget, $anchor.attr('up-fail-target'));
      options.failLayer = u.option(options.failLayer, $anchor.attr('up-fail-layer'), 'auto');
      options.provideTarget = function() {
        return createHiddenFrame(target);
      };
      animateOptions = up.motion.animateOptions(options, $anchor, {
        duration: config.openDuration,
        easing: config.openEasing
      });
      extractOptions = u.merge(options, {
        animation: false
      });
      if (options.preload && url) {
        return up.replace(target, url, options);
      }
      return up.browser.whenConfirmed(options).then(function() {
        return up.bus.whenEmitted('up:popup:open', {
          url: url,
          message: 'Opening popup'
        }).then(function() {
          var promise;
          state.phase = 'opening';
          state.$anchor = $anchor;
          state.position = position;
          if (options.history) {
            state.coveredUrl = up.browser.url();
            state.coveredTitle = document.title;
          }
          state.sticky = options.sticky;
          if (html) {
            promise = up.extract(target, html, extractOptions);
          } else {
            promise = up.replace(target, url, extractOptions);
          }
          promise = promise.then(function() {
            align();
            unveilFrame();
            return up.animate(state.$popup, options.animation, animateOptions);
          });
          promise = promise.then(function() {
            state.phase = 'opened';
            return up.emit('up:popup:opened', {
              message: 'Popup opened'
            });
          });
          return promise;
        });
      });
    };

    /***
    This event is [emitted](/up.emit) when a popup is starting to open.
    
    @event up:popup:open
    @param event.preventDefault()
      Event listeners may call this method to prevent the popup from opening.
    @stable
     */

    /***
    This event is [emitted](/up.emit) when a popup has finished opening.
    
    @event up:popup:opened
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
    closeAsap = function(options) {
      return chain.asap(function() {
        return closeNow(options);
      });
    };
    closeNow = function(options) {
      var animateOptions;
      if (!isOpen()) {
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
      return up.bus.whenEmitted('up:popup:close', {
        message: 'Closing popup',
        $element: state.$popup
      }).then(function() {
        state.phase = 'closing';
        state.url = null;
        state.coveredUrl = null;
        state.coveredTitle = null;
        return up.destroy(state.$popup, options).then(function() {
          state.phase = 'closed';
          state.$popup = null;
          state.$anchor = null;
          state.sticky = null;
          return up.emit('up:popup:closed', {
            message: 'Popup closed'
          });
        });
      });
    };
    preloadNow = function($link, options) {
      options = u.options(options);
      options.preload = true;
      return attachNow($link, options);
    };
    toggleAsap = function($link, options) {
      if (u.hasClass($link, 'up-current')) {
        return closeAsap();
      } else {
        return attachAsap($link, options);
      }
    };

    /***
    This event is [emitted](/up.emit) when a popup dialog
    is starting to [close](/up.popup.close).
    
    @event up:popup:close
    @param event.preventDefault()
      Event listeners may call this method to prevent the popup from closing.
    @stable
     */

    /***
    This event is [emitted](/up.emit) when a popup dialog
    is done [closing](/up.popup.close).
    
    @event up:popup:closed
    @stable
     */
    autoclose = function() {
      if (!state.sticky) {
        discardHistory();
        return closeAsap();
      }
    };

    /***
    Returns whether the given element or selector is contained
    within the current popup.
    
    @methods up.popup.contains
    @param {string} elementOrSelector
      The element to test
    @return {boolean}
    @stable
     */
    contains = function(elementOrSelector) {
      var $element;
      $element = $(elementOrSelector);
      return $element.closest('.up-popup').length > 0;
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
    @param [up-position]
      Defines where the popup is attached to the opening element.
    
      Valid values are `'bottom-right'`, `'bottom-left'`, `'top-right'` and `'top-left'`.
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
      follow: function($link, options) {
        return toggleAsap($link, options);
      },
      preload: function($link, options) {
        return preloadNow($link, options);
      }
    });
    up.on('click up:action:consumed', function(event) {
      var $target;
      $target = $(event.target);
      if (!$target.closest('.up-popup, [up-popup]').length) {
        return u.muteRejection(closeAsap());
      }
    });
    up.on('up:fragment:inserted', function(event, $fragment) {
      var newSource;
      if (contains($fragment)) {
        if (newSource = $fragment.attr('up-source')) {
          return state.url = newSource;
        }
      } else if (event.origin && contains(event.origin)) {
        return u.muteRejection(autoclose());
      }
    });
    up.bus.onEscape(function() {
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
    up.on('click', '.up-popup [up-close]', function(event, $element) {
      u.muteRejection(closeAsap());
      return up.bus.consumeAction(event);
    });
    up.on('up:history:restore', function() {
      return u.muteRejection(closeAsap());
    });
    up.on('up:framework:reset', reset);
    return {
      attach: attachAsap,
      close: closeAsap,
      url: function() {
        return state.url;
      },
      coveredUrl: function() {
        return state.coveredUrl;
      },
      config: config,
      contains: contains,
      isOpen: isOpen
    };
  })(jQuery);

}).call(this);

/***
Modal dialogs
=============

Instead of [linking to a page fragment](/up.link), you can choose to show a fragment
in a modal dialog. The existing page will remain open in the background.

To open a modal, add an [`up-modal`](/a-up-modal) attribute to a link:

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


@class up.modal
 */

(function() {
  up.modal = (function($) {
    var animate, autoclose, chain, closeAsap, closeNow, config, contains, createHiddenFrame, discardHistory, extractAsap, flavor, flavorDefault, flavorOverrides, flavors, followAsap, isOpen, markAsAnimating, openAsap, openNow, preloadNow, reset, shiftElements, state, templateHtml, u, unshiftElements, unveilFrame, validateTarget, visitAsap;
    u = up.util;

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
    @param {string|Function(config)} [config.template]
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
    config = u.config({
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
      template: function(options) {
        return "<div class=\"up-modal\">\n  <div class=\"up-modal-backdrop\"></div>\n  <div class=\"up-modal-viewport\">\n    <div class=\"up-modal-dialog\">\n      <div class=\"up-modal-content\"></div>\n      <div class=\"up-modal-close\" up-close>" + options.closeLabel + "</div>\n    </div>\n  </div>\n</div>";
      }
    });

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
    flavors = u.openConfig({
      "default": {}
    });

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
    state = u.config(function() {
      return {
        phase: 'closed',
        $anchor: null,
        $modal: null,
        sticky: null,
        closable: null,
        flavor: null,
        url: null,
        coveredUrl: null,
        coveredTitle: null,
        position: null,
        unshifters: []
      };
    });
    chain = new u.DivertibleChain();
    reset = function() {
      var ref;
      if ((ref = state.$modal) != null) {
        ref.remove();
      }
      unshiftElements();
      state.reset();
      chain.reset();
      config.reset();
      return flavors.reset();
    };
    templateHtml = function() {
      var template;
      template = flavorDefault('template');
      return u.evalOption(template, {
        closeLabel: flavorDefault('closeLabel')
      });
    };
    discardHistory = function() {
      state.coveredTitle = null;
      return state.coveredUrl = null;
    };
    createHiddenFrame = function(target, options) {
      var $content, $dialog, $modal, dialogStyles;
      $modal = $(templateHtml());
      $modal.attr('up-flavor', state.flavor);
      if (u.isPresent(state.position)) {
        $modal.attr('up-position', state.position);
      }
      $dialog = $modal.find('.up-modal-dialog');
      dialogStyles = u.only(options, 'width', 'maxWidth', 'height');
      u.writeInlineStyle($dialog, dialogStyles);
      if (!state.closable) {
        $modal.find('.up-modal-close').remove();
      }
      $content = $modal.find('.up-modal-content');
      u.$createPlaceholder(target, $content);
      $modal.hide();
      $modal.appendTo(document.body);
      return state.$modal = $modal;
    };
    unveilFrame = function() {
      return state.$modal.show();
    };
    shiftElements = function() {
      var $body, bodyRightPadding, bodyRightShift, scrollbarWidth, unshiftBody;
      if (u.documentHasVerticalScrollbar()) {
        $body = $('body');
        scrollbarWidth = u.scrollbarWidth();
        bodyRightPadding = u.readComputedStyleNumber($body, 'paddingRight');
        bodyRightShift = scrollbarWidth + bodyRightPadding;
        unshiftBody = u.writeTemporaryStyle($body, {
          paddingRight: bodyRightShift,
          overflowY: 'hidden'
        });
        state.unshifters.push(unshiftBody);
        return up.layout.anchoredRight().each(function() {
          var $element, elementRight, elementRightShift, unshifter;
          $element = $(this);
          elementRight = u.readComputedStyleNumber($element, 'right');
          elementRightShift = scrollbarWidth + elementRight;
          unshifter = u.writeTemporaryStyle($element, {
            right: elementRightShift
          });
          return state.unshifters.push(unshifter);
        });
      }
    };
    unshiftElements = function() {
      var results, unshifter;
      results = [];
      while (unshifter = state.unshifters.pop()) {
        results.push(unshifter());
      }
      return results;
    };

    /***
    Returns whether a modal is currently open.
    
    This also returns `true` if the modal is in an opening or closing animation.
    
    @function up.modal.isOpen
    @return {boolean}
    @stable
     */
    isOpen = function() {
      return state.phase === 'opened' || state.phase === 'opening';
    };

    /***
    Opens the given link's destination in a modal overlay:
    
        var $link = $('...');
        up.modal.follow($link);
    
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
    followAsap = function(linkOrSelector, options) {
      options = u.options(options);
      options.$link = $(linkOrSelector);
      return openAsap(options);
    };
    preloadNow = function($link, options) {
      options = u.options(options);
      options.$link = $link;
      options.preload = true;
      return openNow(options);
    };

    /***
    Opens a modal for the given URL.
    
    \#\#\# Example
    
        up.modal.visit('/foo', { target: '.list' });
    
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
    visitAsap = function(url, options) {
      options = u.options(options);
      options.url = url;
      return openAsap(options);
    };

    /***
    [Extracts](/up.extract) the given CSS selector from the given HTML string and
    opens the results in a modal.
    
    \#\#\# Example
    
        var html = 'before <div class="content">inner</div> after';
        up.modal.extract('.content', html);
    
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
    extractAsap = function(selector, html, options) {
      options = u.options(options);
      options.html = html;
      options.history = u.option(options.history, false);
      options.target = selector;
      return openAsap(options);
    };
    openAsap = function(options) {
      return chain.asap(closeNow, (function() {
        return openNow(options);
      }));
    };
    openNow = function(options) {
      var $link, animateOptions, html, target, url;
      options = u.options(options);
      $link = u.option(u.pluckKey(options, '$link'), u.nullJQuery());
      url = u.option(u.pluckKey(options, 'url'), $link.attr('up-href'), $link.attr('href'));
      html = u.option(u.pluckKey(options, 'html'));
      target = u.option(u.pluckKey(options, 'target'), $link.attr('up-modal'));
      validateTarget(target);
      options.flavor = u.option(options.flavor, $link.attr('up-flavor'), config.flavor);
      options.position = u.option(options.position, $link.attr('up-position'), flavorDefault('position', options.flavor));
      options.position = u.evalOption(options.position, {
        $link: $link
      });
      options.width = u.option(options.width, $link.attr('up-width'), flavorDefault('width', options.flavor));
      options.maxWidth = u.option(options.maxWidth, $link.attr('up-max-width'), flavorDefault('maxWidth', options.flavor));
      options.height = u.option(options.height, $link.attr('up-height'), flavorDefault('height'));
      options.animation = u.option(options.animation, $link.attr('up-animation'), flavorDefault('openAnimation', options.flavor));
      options.animation = u.evalOption(options.animation, {
        position: options.position
      });
      options.backdropAnimation = u.option(options.backdropAnimation, $link.attr('up-backdrop-animation'), flavorDefault('backdropOpenAnimation', options.flavor));
      options.backdropAnimation = u.evalOption(options.backdropAnimation, {
        position: options.position
      });
      options.sticky = u.option(options.sticky, u.castedAttr($link, 'up-sticky'), flavorDefault('sticky', options.flavor));
      options.closable = u.option(options.closable, u.castedAttr($link, 'up-closable'), flavorDefault('closable', options.flavor));
      options.confirm = u.option(options.confirm, $link.attr('up-confirm'));
      options.method = up.link.followMethod($link, options);
      options.layer = 'modal';
      options.failTarget = u.option(options.failTarget, $link.attr('up-fail-target'));
      options.failLayer = u.option(options.failLayer, $link.attr('up-fail-layer'), 'auto');
      animateOptions = up.motion.animateOptions(options, $link, {
        duration: flavorDefault('openDuration', options.flavor),
        easing: flavorDefault('openEasing', options.flavor)
      });
      options.history = u.option(options.history, u.castedAttr($link, 'up-history'), flavorDefault('history', options.flavor));
      if (!up.browser.canPushState()) {
        options.history = false;
      }
      options.provideTarget = function() {
        return createHiddenFrame(target, options);
      };
      if (options.preload) {
        return up.replace(target, url, options);
      }
      return up.browser.whenConfirmed(options).then(function() {
        return up.bus.whenEmitted('up:modal:open', {
          url: url,
          message: 'Opening modal'
        }).then(function() {
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
          } else {
            promise = up.replace(target, url, extractOptions);
          }
          promise = promise.then(function() {
            shiftElements();
            unveilFrame();
            return animate(options.animation, options.backdropAnimation, animateOptions);
          });
          promise = promise.then(function() {
            state.phase = 'opened';
            return up.emit('up:modal:opened', {
              message: 'Modal opened'
            });
          });
          return promise;
        });
      });
    };
    validateTarget = function(target) {
      if (u.isBlank(target)) {
        return up.fail('Cannot open a modal without a target selector');
      } else if (target === 'body') {
        return up.fail('Cannot open the <body> in a modal');
      }
    };

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
    closeAsap = function(options) {
      return chain.asap(function() {
        return closeNow(options);
      });
    };
    closeNow = function(options) {
      var animateOptions, backdropCloseAnimation, destroyOptions, viewportCloseAnimation;
      options = u.options(options);
      if (!isOpen()) {
        return Promise.resolve();
      }
      viewportCloseAnimation = u.option(options.animation, flavorDefault('closeAnimation'));
      viewportCloseAnimation = u.evalOption(viewportCloseAnimation, {
        position: state.position
      });
      backdropCloseAnimation = u.option(options.backdropAnimation, flavorDefault('backdropCloseAnimation'));
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
      return up.bus.whenEmitted('up:modal:close', {
        $element: state.$modal,
        message: 'Closing modal'
      }).then(function() {
        var promise;
        state.phase = 'closing';
        state.url = null;
        state.coveredUrl = null;
        state.coveredTitle = null;
        promise = animate(viewportCloseAnimation, backdropCloseAnimation, animateOptions);
        promise = promise.then(function() {
          return up.destroy(state.$modal, destroyOptions);
        });
        promise = promise.then(function() {
          unshiftElements();
          state.phase = 'closed';
          state.$modal = null;
          state.flavor = null;
          state.sticky = null;
          state.closable = null;
          state.position = null;
          return up.emit('up:modal:closed', {
            message: 'Modal closed'
          });
        });
        return promise;
      });
    };
    markAsAnimating = function(isAnimating) {
      if (isAnimating == null) {
        isAnimating = true;
      }
      return state.$modal.toggleClass('up-modal-animating', isAnimating);
    };
    animate = function(viewportAnimation, backdropAnimation, animateOptions) {
      var promise;
      if (up.motion.isNone(viewportAnimation)) {
        return Promise.resolve();
      } else {
        markAsAnimating();
        promise = Promise.all([up.animate(state.$modal.find('.up-modal-viewport'), viewportAnimation, animateOptions), up.animate(state.$modal.find('.up-modal-backdrop'), backdropAnimation, animateOptions)]);
        promise = promise.then(function() {
          return markAsAnimating(false);
        });
        return promise;
      }
    };

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
    autoclose = function() {
      if (!state.sticky) {
        discardHistory();
        return closeAsap();
      }
    };

    /***
    Returns whether the given element or selector is contained
    within the current modal.
    
    @function up.modal.contains
    @param {string} elementOrSelector
      The element to test
    @return {boolean}
    @stable
     */
    contains = function(elementOrSelector) {
      var $element;
      $element = $(elementOrSelector);
      return $element.closest('.up-modal').length > 0;
    };
    flavor = function(name, overrideConfig) {
      if (overrideConfig == null) {
        overrideConfig = {};
      }
      up.warn('up.modal.flavor() is deprecated. Use the up.modal.flavors property instead.');
      return u.assign(flavorOverrides(name), overrideConfig);
    };

    /***
    Returns a config object for the given flavor.
    Properties in that config should be preferred to the defaults in
    [`/up.modal.config`](/up.modal.config).
    
    @function flavorOverrides
    @internal
     */
    flavorOverrides = function(flavor) {
      return flavors[flavor] || (flavors[flavor] = {});
    };

    /***
    Returns the config option for the current flavor.
    
    @function flavorDefault
    @internal
     */
    flavorDefault = function(key, flavorName) {
      var value;
      if (flavorName == null) {
        flavorName = state.flavor;
      }
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
      follow: function($link, options) {
        return followAsap($link, options);
      },
      preload: function($link, options) {
        return preloadNow($link, options);
      }
    });
    up.on('click', '.up-modal', function(event) {
      var $target;
      if (!state.closable) {
        return;
      }
      $target = $(event.target);
      if (!($target.closest('.up-modal-dialog').length || $target.closest('[up-modal]').length)) {
        up.bus.consumeAction(event);
        return u.muteRejection(closeAsap());
      }
    });
    up.on('up:fragment:inserted', function(event, $fragment) {
      var newSource;
      if (contains($fragment)) {
        if (newSource = $fragment.attr('up-source')) {
          return state.url = newSource;
        }
      } else if (event.origin && contains(event.origin) && !up.popup.contains($fragment)) {
        return u.muteRejection(autoclose());
      }
    });
    up.bus.onEscape(function() {
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
    up.on('click', '.up-modal [up-close]', function(event, $element) {
      u.muteRejection(closeAsap());
      return up.bus.consumeAction(event);
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
    up.macro('a[up-drawer], [up-href][up-drawer]', function($link) {
      var target;
      target = $link.attr('up-drawer');
      return $link.attr({
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
      openAnimation: function(options) {
        switch (options.position) {
          case 'left':
            return 'move-from-left';
          case 'right':
            return 'move-from-right';
        }
      },
      closeAnimation: function(options) {
        switch (options.position) {
          case 'left':
            return 'move-to-left';
          case 'right':
            return 'move-to-right';
        }
      },
      position: function(options) {
        if (u.isPresent(options.$link)) {
          return u.horizontalScreenHalf(options.$link);
        } else {
          return 'left';
        }
      }
    };
    up.on('up:history:restore', function() {
      return u.muteRejection(closeAsap());
    });
    up.on('up:framework:reset', reset);
    return {
      visit: visitAsap,
      follow: followAsap,
      extract: extractAsap,
      close: closeAsap,
      url: function() {
        return state.url;
      },
      coveredUrl: function() {
        return state.coveredUrl;
      },
      config: config,
      flavors: flavors,
      contains: contains,
      isOpen: isOpen,
      flavor: flavor
    };
  })(jQuery);

}).call(this);

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

The HTML of a tooltip element is simply this:

    <div class="up-tooltip">
      Show all decks
    </div>

The tooltip element is appended to the end of `<body>`.

@class up.tooltip
 */

(function() {
  up.tooltip = (function($) {
    var align, attachAsap, attachNow, chain, closeAsap, closeNow, config, createElement, isOpen, reset, state, u;
    u = up.util;

    /***
    Configures defaults for future tooltips.
    
    @property up.tooltip.config
    @param {string} [config.position]
      The default position of tooltips relative to the element.
      Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
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
    config = u.config({
      position: 'top',
      openAnimation: 'fade-in',
      closeAnimation: 'fade-out',
      openDuration: 100,
      closeDuration: 50,
      openEasing: null,
      closeEasing: null
    });
    state = u.config({
      phase: 'closed',
      $anchor: null,
      $tooltip: null,
      position: null
    });
    chain = new u.DivertibleChain();
    reset = function() {
      var ref;
      if ((ref = state.$tooltip) != null) {
        ref.remove();
      }
      state.reset();
      chain.reset();
      return config.reset();
    };
    align = function() {
      var linkBox, style, tooltipBox;
      style = {};
      tooltipBox = u.measure(state.$tooltip);
      if (u.isFixed(state.$anchor)) {
        linkBox = state.$anchor.get(0).getBoundingClientRect();
        style.position = 'fixed';
      } else {
        linkBox = u.measure(state.$anchor);
      }
      switch (state.position) {
        case 'top':
          style.top = linkBox.top - tooltipBox.height;
          style.left = linkBox.left + 0.5 * (linkBox.width - tooltipBox.width);
          break;
        case 'left':
          style.top = linkBox.top + 0.5 * (linkBox.height - tooltipBox.height);
          style.left = linkBox.left - tooltipBox.width;
          break;
        case 'right':
          style.top = linkBox.top + 0.5 * (linkBox.height - tooltipBox.height);
          style.left = linkBox.left + linkBox.width;
          break;
        case 'bottom':
          style.top = linkBox.top + linkBox.height;
          style.left = linkBox.left + 0.5 * (linkBox.width - tooltipBox.width);
          break;
        default:
          up.fail("Unknown position option '%s'", state.position);
      }
      state.$tooltip.attr('up-position', state.position);
      return u.writeInlineStyle(state.$tooltip, style);
    };
    createElement = function(options) {
      var $element;
      $element = u.$createElementFromSelector('.up-tooltip');
      if (u.isGiven(options.text)) {
        $element.text(options.text);
      } else {
        $element.html(options.html);
      }
      $element.appendTo(document.body);
      return state.$tooltip = $element;
    };

    /***
    Opens a tooltip over the given element.
    
    The unobtrusive variant of this is the [`[up-tooltip]`](/up-tooltip) selector.
    
    \#\#\# Examples
    
    In order to attach a tooltip to a `<span class="help">?</span>`:
    
        up.tooltip.attach('.help', {
          text: 'Enter multiple words or phrases'
        });
    
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
    @param {string} [options.position='top']
      The position of the tooltip.
      Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
    @param {string} [options.animation]
      The [animation](/up.motion) to use when opening the tooltip.
    @return {Promise}
      A promise that will be fulfilled when the tooltip's opening animation has finished.
    @stable
     */
    attachAsap = function(elementOrSelector, options) {
      if (options == null) {
        options = {};
      }
      return chain.asap(closeNow, (function() {
        return attachNow(elementOrSelector, options);
      }));
    };
    attachNow = function(elementOrSelector, options) {
      var $anchor, animateOptions, animation, html, position, text;
      $anchor = $(elementOrSelector);
      options = u.options(options);
      html = u.option(options.html, $anchor.attr('up-tooltip-html'));
      text = u.option(options.text, $anchor.attr('up-tooltip'));
      position = u.option(options.position, $anchor.attr('up-position'), config.position);
      animation = u.option(options.animation, u.castedAttr($anchor, 'up-animation'), config.openAnimation);
      animateOptions = up.motion.animateOptions(options, $anchor, {
        duration: config.openDuration,
        easing: config.openEasing
      });
      state.phase = 'opening';
      state.$anchor = $anchor;
      createElement({
        text: text,
        html: html
      });
      state.position = position;
      align();
      return up.animate(state.$tooltip, animation, animateOptions).then(function() {
        return state.phase = 'opened';
      });
    };

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
    closeAsap = function(options) {
      return chain.asap(function() {
        return closeNow(options);
      });
    };
    closeNow = function(options) {
      var animateOptions;
      if (!isOpen()) {
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
      return up.destroy(state.$tooltip, options).then(function() {
        state.phase = 'closed';
        state.$tooltip = null;
        return state.$anchor = null;
      });
    };

    /***
    Returns whether a tooltip is currently showing.
    
    @function up.tooltip.isOpen
    @stable
     */
    isOpen = function() {
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
      The default position of tooltips relative to the element.
      Can be either `"top"` or `"bottom"`.
      Defaults to [`up.tooltip.config.position`](/up.tooltip.config).
    @stable
     */

    /***
    Displays a tooltip with HTML content when hovering the mouse over this element:
    
        <a href="/decks" up-tooltip-html="Show &lt;b&gt;all&lt;/b&gt; decks">Decks</a>
    
    @selector [up-tooltip-html]
    @stable
     */
    up.compiler('[up-tooltip], [up-tooltip-html]', function($opener) {
      $opener.on('mouseenter', function() {
        return attachAsap($opener);
      });
      return $opener.on('mouseleave', function() {
        return closeAsap();
      });
    });
    up.on('click up:action:consumed', function(event) {
      return closeAsap();
    });
    up.on('up:framework:reset', reset);
    up.bus.onEscape(function() {
      return closeAsap();
    });
    return {
      config: config,
      attach: attachAsap,
      isOpen: isOpen,
      close: closeAsap
    };
  })(jQuery);

}).call(this);

/***
Navigation feedback
===================

Unpoly automatically adds the class [`.up-active`](/a.up-active) to links or forms while they are loading.

By marking navigation elements as [`[up-nav]`](/up-nav), contained links that point to the current location
automatically get the [`.up-current`](/up-nav-a.up-current) class.

You should style [`.up-active`](/a.up-active) and [`.up-current`](/up-nav a.up-current) with CSS to
provide instant feedback to user interactions. This improves the perceived speed of your interface.

\#\#\# Example

Let's say we have an navigation bar with two links, pointing to `/foo` and `/bar` respectively:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow>Bar</a>

If the current URL is `/foo`, the first link is automatically marked with an [`up-current`](/a.up-current) class:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow>Bar</a>

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/a.up-active) class while it is waiting
for the server to respond:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow class="up-active">Bar</a>

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow class="up-current">Bar</a>


@class up.feedback
 */

(function() {
  var slice = [].slice;

  up.feedback = (function($) {
    var CLASS_ACTIVE, NORMALIZED_SECTION_URLS_KEY, SELECTOR_LINK, buildCurrentUrlSet, buildSectionUrls, config, currentUrlSet, findActivatableArea, navSelector, normalizeUrl, previousUrlSet, reset, sectionUrls, start, stop, u, updateAllNavigationSections, updateAllNavigationSectionsIfLocationChanged, updateCurrentClassForLinks, updateNavigationSectionsInNewFragment;
    u = up.util;

    /***
    Sets default options for this module.
    
    @property up.feedback.config
    @param {Array<string>} [config.currentClasses]
      An array of classes to set on [links that point the current location](/a.up-current).
    @param {Array<string>} [config.navs]
      An array of CSS selectors that match [navigation components](/up-nav).
    @stable
     */
    config = u.config({
      currentClasses: ['up-current'],
      navs: ['[up-nav]']
    });
    previousUrlSet = void 0;
    currentUrlSet = void 0;
    reset = function() {
      config.reset();
      previousUrlSet = void 0;
      return currentUrlSet = void 0;
    };
    CLASS_ACTIVE = 'up-active';
    SELECTOR_LINK = 'a, [up-href]';
    navSelector = function() {
      return config.navs.join(',');
    };
    normalizeUrl = function(url) {
      if (u.isPresent(url)) {
        return u.normalizeUrl(url, {
          stripTrailingSlash: true
        });
      }
    };
    NORMALIZED_SECTION_URLS_KEY = 'up-normalized-urls';
    sectionUrls = function($section) {
      var urls;
      if (!(urls = $section.data(NORMALIZED_SECTION_URLS_KEY))) {
        urls = buildSectionUrls($section);
        $section.data(NORMALIZED_SECTION_URLS_KEY, urls);
      }
      return urls;
    };
    buildSectionUrls = function($section) {
      var attr, i, j, len, len1, ref, ref1, url, urls, value;
      urls = [];
      if (up.link.isSafe($section)) {
        ref = ['href', 'up-href', 'up-alias'];
        for (i = 0, len = ref.length; i < len; i++) {
          attr = ref[i];
          if (value = u.presentAttr($section, attr)) {
            ref1 = u.splitValues(value);
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
    buildCurrentUrlSet = function() {
      var urls;
      urls = [up.browser.url(), up.modal.url(), up.modal.coveredUrl(), up.popup.url(), up.popup.coveredUrl()];
      return new up.UrlSet(urls, {
        normalizeUrl: normalizeUrl
      });
    };
    updateAllNavigationSectionsIfLocationChanged = function() {
      previousUrlSet = currentUrlSet;
      currentUrlSet = buildCurrentUrlSet();
      if (!currentUrlSet.isEqual(previousUrlSet)) {
        return updateAllNavigationSections($('body'));
      }
    };
    updateAllNavigationSections = function($root) {
      var $navs, $sections;
      $navs = u.selectInSubtree($root, navSelector());
      $sections = u.selectInSubtree($navs, SELECTOR_LINK);
      return updateCurrentClassForLinks($sections);
    };
    updateNavigationSectionsInNewFragment = function($fragment) {
      var $sections;
      if ($fragment.closest(navSelector()).length) {
        $sections = u.selectInSubtree($fragment, SELECTOR_LINK);
        return updateCurrentClassForLinks($sections);
      } else {
        return updateAllNavigationSections($fragment);
      }
    };
    updateCurrentClassForLinks = function($links) {
      currentUrlSet || (currentUrlSet = buildCurrentUrlSet());
      return u.each($links, function(link) {
        var $link, classList, i, j, klass, len, len1, ref, ref1, results, results1, urls;
        $link = $(link);
        urls = sectionUrls($link);
        classList = link.classList;
        if (currentUrlSet.matchesAny(urls)) {
          ref = config.currentClasses;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            klass = ref[i];
            results.push(classList.add(klass));
          }
          return results;
        } else {
          ref1 = config.currentClasses;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            klass = ref1[j];
            results1.push(classList.remove(klass));
          }
          return results1;
        }
      });
    };

    /***
    @function findActivatableArea
    @param {string|Element|jQuery} elementOrSelector
    @internal
     */
    findActivatableArea = function(elementOrSelector) {
      var $area;
      $area = $(elementOrSelector);
      if ($area.is(SELECTOR_LINK)) {
        $area = u.presence($area.parent(SELECTOR_LINK)) || $area;
      }
      return $area;
    };

    /***
    Marks the given element as currently loading, by assigning the CSS class [`up-active`](/a.up-active).
    
    This happens automatically when following links or submitting forms through the Unpoly API.
    Use this function if you make custom network calls from your own JavaScript code.
    
    If the given element is a link within an [expanded click area](/up-expand),
    the class will be assigned to the expanded area.
    
    \#\#\# Example
    
        var $button = $('button');
        $button.on('click', function() {
          up.feedback.start($button, function() {
            // the .up-active class will be removed when this promise resolves:
            return up.request(...);
          });
        });
    
    @method up.feedback.start
    @param {Element|jQuery|string} elementOrSelector
      The element to mark as active
    @param {Object} [options.preload]
      If set to `false`, the element will not be marked as loading.
    @param {Function} [action]
      An optional function to run while the element is marked as loading.
      The function must return a promise.
      Once the promise resolves, the element will be [marked as no longer loading](/up.feedback.stop).
    @internal
     */
    start = function() {
      var $element, action, args, elementOrSelector, options, promise;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      elementOrSelector = args.shift();
      action = args.pop();
      options = u.options(args[0]);
      $element = findActivatableArea(elementOrSelector);
      if (!options.preload) {
        $element.addClass(CLASS_ACTIVE);
      }
      if (action) {
        promise = action();
        if (u.isPromise(promise)) {
          u.always(promise, function() {
            return stop($element);
          });
        } else {
          up.warn('Expected block to return a promise, but got %o', promise);
        }
        return promise;
      }
    };

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
    @param {jQuery} event.$element
      The link or form that has finished loading.
    @internal
     */
    stop = function(elementOrSelector) {
      var $element;
      $element = findActivatableArea(elementOrSelector);
      return $element.removeClass(CLASS_ACTIVE);
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
    
    \#\#\# Matching URL by prefix
    
    You can mark a link as `.up-current` whenever the current URL matches a prefix.
    To do so, end the `up-alias` attribute in an asterisk (`*`).
    
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
    up.on('up:history:pushed up:history:replaced up:history:restored up:modal:opened up:modal:closed up:popup:opened up:popup:closed', function(event) {
      return updateAllNavigationSectionsIfLocationChanged();
    });
    up.on('up:fragment:inserted', function(event, $newFragment) {
      return updateNavigationSectionsInNewFragment($newFragment);
    });
    up.on('up:framework:reset', reset);
    return {
      config: config,
      start: start,
      stop: stop
    };
  })(jQuery);

  up.deprecateRenamedModule('navigation', 'feedback');

}).call(this);

/***
Passive updates
===============

This work-in-progress package will contain functionality to
passively receive updates from the server.

@class up.radio
 */

(function() {
  up.radio = (function($) {
    var config, hungrySelector, reset, u;
    u = up.util;

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
    config = u.config({
      hungry: ['[up-hungry]'],
      hungryTransition: null
    });
    reset = function() {
      return config.reset();
    };

    /***
    @function up.radio.hungrySelector
    @internal
     */
    hungrySelector = function() {
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
  })(jQuery);

}).call(this);

/***
Play nice with Rails UJS
========================
 */

(function() {
  up.rails = (function($) {
    var isRails, u;
    u = up.util;
    isRails = function() {
      return !!$.rails;
    };
    return u.each(['method', 'confirm'], function(feature) {
      var dataAttribute, upAttribute;
      dataAttribute = "data-" + feature;
      upAttribute = "up-" + feature;
      return up.macro("[" + dataAttribute + "]", function($element) {
        var replacement;
        if (isRails() && up.link.isFollowable($element)) {
          replacement = {};
          replacement[upAttribute] = $element.attr(dataAttribute);
          u.setMissingAttrs($element, replacement);
          return $element.removeAttr(dataAttribute);
        }
      });
    });
  })(jQuery);

}).call(this);
(function() {
  up.boot();

}).call(this);
