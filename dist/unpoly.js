
/**
@module up
 */

(function() {
  this.up = {
    version: "0.33.0",
    renamedModule: function(oldName, newName) {
      return typeof Object.defineProperty === "function" ? Object.defineProperty(up, oldName, {
        get: function() {
          up.log.warn("up." + oldName + " has been renamed to up." + newName);
          return up[newName];
        }
      }) : void 0;
    }
  };

}).call(this);

/**
Utility functions
=================
  
Unpoly comes with a number of utility functions
that might save you from loading something like [Underscore.js](http://underscorejs.org/).

@class up.util
 */

(function() {
  var slice = [].slice,
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  up.util = (function($) {

    /**
    A function that does nothing.
    
    @function up.util.noop
    @experimental
     */
    var $createElementFromSelector, $createPlaceholder, ANIMATION_DEFERRED_KEY, DivertibleChain, ESCAPE_HTML_ENTITY_MAP, all, any, appendRequestData, assign, assignPolyfill, cache, castedAttr, clientSize, compact, config, contains, copy, copyAttributes, createElement, createElementFromHtml, cssAnimate, detachWith, detect, documentHasVerticalScrollbar, each, escapeHtml, escapePressed, evalOption, except, extractOptions, fail, findWithSelf, finishCssAnimate, fixedToAbsolute, flatten, forceCompositing, forceRepaint, horizontalScreenHalf, identity, intersect, isArray, isBlank, isDeferred, isDefined, isDetached, isElement, isFixed, isFormData, isFunction, isGiven, isHash, isJQuery, isMissing, isNull, isNumber, isObject, isPresent, isPromise, isResolvedPromise, isStandardPort, isString, isTruthy, isUndefined, isUnmodifiedKeyEvent, isUnmodifiedMouseEvent, last, locationFromXhr, map, margins, measure, memoize, merge, methodFromXhr, multiSelector, nextFrame, nonUpClasses, noop, normalizeMethod, normalizeUrl, nullJQuery, offsetParent, once, only, opacity, openConfig, option, options, parseUrl, pluckData, pluckKey, presence, presentAttr, previewable, promiseTimer, reject, rejectedPromise, remove, requestDataAsArray, requestDataAsQuery, requestDataFromForm, resolvableWhen, resolvedDeferred, resolvedPromise, scrollbarWidth, select, selectorForElement, sequence, setMissingAttrs, setTimer, submittedValue, temporaryCss, times, titleFromXhr, toArray, trim, unJQuery, uniq, unresolvableDeferred, unresolvablePromise, unwrapElement, whenReady;
    noop = $.noop;

    /**
    Ensures that the given function can only be called a single time.
    Subsequent calls will return the return value of the first call.
    
    Note that this is a simple implementation that
    doesn't distinguish between argument lists.
    
    @function up.util.memoize
    @internal
     */
    memoize = function(func) {
      var cache, cached;
      cache = void 0;
      cached = false;
      return function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (cached) {
          return cache;
        } else {
          cached = true;
          return cache = func.apply(null, args);
        }
      };
    };

    /**
    Returns if the given port is the default port for the given protocol.
    
    @function up.util.isStandardPort
    @internal
     */
    isStandardPort = function(protocol, port) {
      port = port.toString();
      return ((port === "" || port === "80") && protocol === 'http:') || (port === "443" && protocol === 'https:');
    };

    /**
    Normalizes relative paths and absolute paths to a full URL
    that can be checked for equality with other normalized URLs.
    
    By default hashes are ignored, search queries are included.
    
    @function up.util.normalizeUrl
    @param {Boolean} [options.hash=false]
      Whether to include an `#hash` anchor in the normalized URL
    @param {Boolean} [options.search=true]
      Whether to include a `?query` string in the normalized URL
    @param {Boolean} [options.stripTrailingSlash=true]
      Whether to strip a trailing slash from the pathname
    @internal
     */
    normalizeUrl = function(urlOrAnchor, options) {
      var anchor, normalized, pathname;
      anchor = parseUrl(urlOrAnchor);
      normalized = anchor.protocol + "//" + anchor.hostname;
      if (!isStandardPort(anchor.protocol, anchor.port)) {
        normalized += ":" + anchor.port;
      }
      pathname = anchor.pathname;
      if (pathname[0] !== '/') {
        pathname = "/" + pathname;
      }
      if ((options != null ? options.stripTrailingSlash : void 0) !== false) {
        pathname = pathname.replace(/\/$/, '');
      }
      normalized += pathname;
      if ((options != null ? options.hash : void 0) === true) {
        normalized += anchor.hash;
      }
      if ((options != null ? options.search : void 0) !== false) {
        normalized += anchor.search;
      }
      return normalized;
    };

    /**
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
      anchor = null;
      if (isString(urlOrAnchor)) {
        anchor = $('<a>').attr({
          href: urlOrAnchor
        }).get(0);
        if (isBlank(anchor.hostname)) {
          anchor.href = anchor.href;
        }
      } else {
        anchor = unJQuery(urlOrAnchor);
      }
      return anchor;
    };

    /**
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

    /**
    @function $createElementFromSelector
    @internal
     */
    $createElementFromSelector = function(selector) {
      var $element, $parent, $root, classes, conjunction, depthSelector, expression, html, i, id, iteration, j, len, len1, path, tag;
      path = selector.split(/[ >]/);
      $root = null;
      for (iteration = i = 0, len = path.length; i < len; iteration = ++i) {
        depthSelector = path[iteration];
        conjunction = depthSelector.match(/(^|\.|\#)[A-Za-z0-9\-_]+/g);
        tag = "div";
        classes = [];
        id = null;
        for (j = 0, len1 = conjunction.length; j < len1; j++) {
          expression = conjunction[j];
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
    createElement = function(tagName, html) {
      var element;
      element = document.createElement(tagName);
      if (isPresent(html)) {
        element.innerHTML = html;
      }
      return element;
    };

    /**
    @function $create
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

    /**
    Returns a CSS selector that matches the given element as good as possible.
    
    This uses, in decreasing order of priority:
    
    - The element's `up-id` attribute
    - The element's ID
    - The element's name
    - The element's classes
    - The element's tag names
    
    @function up.util.selectorForElement
    @param {String|Element|jQuery}
      The element for which to create a selector.
    @experimental
     */
    selectorForElement = function(element) {
      var $element, classes, i, id, klass, len, name, selector, upId;
      $element = $(element);
      selector = void 0;
      up.puts("Creating selector from element %o", $element.get(0));
      if (upId = presence($element.attr("up-id"))) {
        selector = "[up-id='" + upId + "']";
      } else if (id = presence($element.attr("id"))) {
        selector = "#" + id;
      } else if (name = presence($element.attr("name"))) {
        selector = "[name='" + name + "']";
      } else if (classes = presence(nonUpClasses($element))) {
        selector = '';
        for (i = 0, len = classes.length; i < len; i++) {
          klass = classes[i];
          selector += "." + klass;
        }
      } else {
        selector = $element.prop('tagName').toLowerCase();
      }
      return selector;
    };
    nonUpClasses = function($element) {
      var classString, classes;
      classString = $element.attr('class') || '';
      classes = classString.split(' ');
      return select(classes, function(klass) {
        return isPresent(klass) && !klass.match(/^up-/);
      });
    };
    createElementFromHtml = function(html) {
      var anything, bodyElement, bodyMatch, bodyPattern, capture, closeTag, headElement, htmlElement, openTag, titleElement, titleMatch, titlePattern;
      openTag = function(tag) {
        return "<" + tag + "(?: [^>]*)?>";
      };
      closeTag = function(tag) {
        return "</" + tag + ">";
      };
      anything = '(?:.|\\s)*?';
      capture = function(pattern) {
        return "(" + pattern + ")";
      };
      titlePattern = new RegExp(openTag('title') + capture(anything) + closeTag('title'), 'i');
      bodyPattern = new RegExp(openTag('body') + capture(anything) + closeTag('body'), 'i');
      if (bodyMatch = html.match(bodyPattern)) {
        htmlElement = document.createElement('html');
        bodyElement = createElement('body', bodyMatch[1]);
        htmlElement.appendChild(bodyElement);
        if (titleMatch = html.match(titlePattern)) {
          headElement = createElement('head');
          htmlElement.appendChild(headElement);
          titleElement = createElement('title', titleMatch[1]);
          headElement.appendChild(titleElement);
        }
        return htmlElement;
      } else {
        return createElement('div', html);
      }
    };
    assignPolyfill = function() {
      var i, key, len, source, sources, target, value;
      target = arguments[0], sources = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      for (i = 0, len = sources.length; i < len; i++) {
        source = sources[i];
        for (key in source) {
          if (!hasProp.call(source, key)) continue;
          value = source[key];
          target[key] = value;
        }
      }
      return target;
    };

    /**
    Merge the own properties of one or more `sources` into the `target` object.
    
    @function up.util.assign
    @param {Object} target
    @param {Array<Object>} sources...
    @stable
     */
    assign = Object.assign || assignPolyfill;

    /**
    Returns a new string with whitespace removed from the beginning
    and end of the given string.
    
    @param {String}
      A string that might have whitespace at the beginning and end.
    @return {String}
      The trimmed string.
    @stable
     */
    trim = $.trim;

    /**
    Calls the given function for each element (and, optional, index)
    of the given array.
    
    @function up.util.each
    @param {Array} array
    @param {Function<Object, Number>} block
      A function that will be called with each element and (optional) iteration index.
    @stable
     */
    each = function(array, block) {
      var i, index, item, len, results;
      results = [];
      for (index = i = 0, len = array.length; i < len; index = ++i) {
        item = array[index];
        results.push(block(item, index));
      }
      return results;
    };

    /**
    Translate all items in an array to new array of items.
    
    @function up.util.map
    @param {Array} array
    @param {Function<Object, Number>} block
      A function that will be called with each element and (optional) iteration index.
    @return {Array}
      A new array containing the result of each function call.
    @stable
     */
    map = each;

    /**
    Calls the given function for the given number of times.
    
    @function up.util.times
    @param {Number} count
    @param {Function} block
    @stable
     */
    times = function(count, block) {
      var i, iteration, ref, results;
      results = [];
      for (iteration = i = 0, ref = count - 1; 0 <= ref ? i <= ref : i >= ref; iteration = 0 <= ref ? ++i : --i) {
        results.push(block(iteration));
      }
      return results;
    };

    /**
    Returns whether the given argument is `null`.
    
    @function up.util.isNull
    @param object
    @return {Boolean}
    @stable
     */
    isNull = function(object) {
      return object === null;
    };

    /**
    Returns whether the given argument is `undefined`.
    
    @function up.util.isUndefined
    @param object
    @return {Boolean}
    @stable
     */
    isUndefined = function(object) {
      return object === void(0);
    };

    /**
    Returns whether the given argument is not `undefined`.
    
    @function up.util.isDefined
    @param object
    @return {Boolean}
    @stable
     */
    isDefined = function(object) {
      return !isUndefined(object);
    };

    /**
    Returns whether the given argument is either `undefined` or `null`.
    
    Note that empty strings or zero are *not* considered to be "missing".
    
    For the opposite of `up.util.isMissing()` see [`up.util.isGiven()`](/up.util.isGiven).
    
    @function up.util.isMissing
    @param object
    @return {Boolean}
    @stable
     */
    isMissing = function(object) {
      return isUndefined(object) || isNull(object);
    };

    /**
    Returns whether the given argument is neither `undefined` nor `null`.
    
    Note that empty strings or zero *are* considered to be "given".
    
    For the opposite of `up.util.isGiven()` see [`up.util.isMissing()`](/up.util.isMissing).
    
    @function up.util.isGiven
    @param object
    @return {Boolean}
    @stable
     */
    isGiven = function(object) {
      return !isMissing(object);
    };

    /**
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
    @return {Boolean}
    @stable
     */
    isBlank = function(object) {
      return isMissing(object) || (isObject(object) && Object.keys(object).length === 0) || (object.length === 0);
    };

    /**
    Returns the given argument if the argument is [present](/up.util.isPresent),
    otherwise returns `undefined`.
    
    @function up.util.presence
    @param object
    @param {Function<T>} [tester=up.util.isPresent]
      The function that will be used to test whether the argument is present.
    @return {T|Undefined}
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

    /**
    Returns whether the given argument is not [blank](/up.util.isBlank).
    
    @function up.util.isPresent
    @param object
    @return {Boolean}
    @stable
     */
    isPresent = function(object) {
      return !isBlank(object);
    };

    /**
    Returns whether the given argument is a function.
    
    @function up.util.isFunction
    @param object
    @return {Boolean}
    @stable
     */
    isFunction = function(object) {
      return typeof object === 'function';
    };

    /**
    Returns whether the given argument is a string.
    
    @function up.util.isString
    @param object
    @return {Boolean}
    @stable
     */
    isString = function(object) {
      return typeof object === 'string';
    };

    /**
    Returns whether the given argument is a number.
    
    Note that this will check the argument's *type*.
    It will return `false` for a string like `"123"`.
    
    @function up.util.isNumber
    @param object
    @return {Boolean}
    @stable
     */
    isNumber = function(object) {
      return typeof object === 'number';
    };

    /**
    Returns whether the given argument is an object, but not a function.
    
    @function up.util.isHash
    @param object
    @return {Boolean}
    @stable
     */
    isHash = function(object) {
      return typeof object === 'object' && !!object;
    };

    /**
    Returns whether the given argument is an object.
    
    This also returns `true` for functions, which may behave like objects in JavaScript.
    For an alternative that returns `false` for functions, see [`up.util.isHash()`](/up.util.isHash).
    
    @function up.util.isObject
    @param object
    @return {Boolean}
    @stable
     */
    isObject = function(object) {
      return isHash(object) || (typeof object === 'function');
    };

    /**
    Returns whether the given argument is a DOM element.
    
    @function up.util.isElement
    @param object
    @return {Boolean}
    @stable
     */
    isElement = function(object) {
      return !!(object && object.nodeType === 1);
    };

    /**
    Returns whether the given argument is a jQuery collection.
    
    @function up.util.isJQuery
    @param object
    @return {Boolean}
    @stable
     */
    isJQuery = function(object) {
      return object instanceof jQuery;
    };

    /**
    Returns whether the given argument is an object with a `then` method.
    
    @function up.util.isPromise
    @param object
    @return {Boolean}
    @stable
     */
    isPromise = function(object) {
      return isObject(object) && isFunction(object.then);
    };

    /**
    Returns whether the given argument is an object with `then` and `resolve` methods.
    
    @function up.util.isDeferred
    @param object
    @return {Boolean}
    @stable
     */
    isDeferred = function(object) {
      return isPromise(object) && isFunction(object.resolve);
    };

    /**
    Returns whether the given argument is an array.
    
    @function up.util.isArray
    @param object
    @return {Boolean}
    @stable
     */
    isArray = Array.isArray || function(object) {
      return Object.prototype.toString.call(object) === '[object Array]';
    };

    /**
    Returns whether the given argument is a `FormData` instance.
    
    Always returns `false` in browsers that don't support `FormData`.
    
    @function up.util.isFormData
    @param object
    @return {Boolean}
    @internal
     */
    isFormData = function(object) {
      return up.browser.canFormData() && object instanceof FormData;
    };

    /**
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

    /**
    Shallow-copies the given array or object into a new array or object.
    
    Returns the new array or object.
    
    @function up.util.copy
    @param {Object|Array} object
    @return {Object|Array}
    @stable
     */
    copy = function(object) {
      if (isArray(object)) {
        return object.slice();
      } else if (isHash(object)) {
        return assign({}, object);
      }
    };

    /**
    If given a jQuery collection, returns the underlying array of DOM element.
    If given any other argument, returns the argument unchanged.
    
    @function up.util.unJQuery
    @param object
    @internal
     */
    unJQuery = function(object) {
      if (isJQuery(object)) {
        return object.get(0);
      } else {
        return object;
      }
    };

    /**
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

    /**
    Creates an options hash from the given argument and some defaults.
    
    The semantics of this function are confusing.
    We want to get rid of this in the future.
    
    @function up.util.options
    @param {Object} object
    @param {Object} [defaults]
    @return {Object}
    @internal
     */
    options = function(object, defaults) {
      var defaultValue, key, merged, value;
      merged = object ? copy(object) : {};
      if (defaults) {
        for (key in defaults) {
          defaultValue = defaults[key];
          value = merged[key];
          if (!isGiven(value)) {
            merged[key] = defaultValue;
          } else if (isObject(defaultValue) && isObject(value)) {
            merged[key] = options(value, defaultValue);
          }
        }
      }
      return merged;
    };

    /**
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

    /**
    Passes each element in the given array to the given function.
    Returns the first element for which the function returns a truthy value.
    
    If no object matches, returns `undefined`.
    
    @function up.util.detect
    @param {Array<T>} array
    @param {Function<T>} tester
    @return {T|Undefined}
    @stable
     */
    detect = function(array, tester) {
      var element, i, len, match;
      match = void 0;
      for (i = 0, len = array.length; i < len; i++) {
        element = array[i];
        if (tester(element)) {
          match = element;
          break;
        }
      }
      return match;
    };

    /**
    Returns whether the given function returns a truthy value
    for any element in the given array.
    
    @function up.util.any
    @param {Array<T>} array
    @param {Function<T>} tester
    @return {Boolean}
    @experimental
     */
    any = function(array, tester) {
      var element, i, len, match;
      match = false;
      for (i = 0, len = array.length; i < len; i++) {
        element = array[i];
        if (tester(element)) {
          match = true;
          break;
        }
      }
      return match;
    };

    /**
    Returns whether the given function returns a truthy value
    for all elements in the given array.
    
    @function up.util.all
    @param {Array<T>} array
    @param {Function<T>} tester
    @return {Boolean}
    @experimental
     */
    all = function(array, tester) {
      var element, i, len, match;
      match = true;
      for (i = 0, len = array.length; i < len; i++) {
        element = array[i];
        if (!tester(element)) {
          match = false;
          break;
        }
      }
      return match;
    };

    /**
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

    /**
    Returns the given array without duplicates.
    
    @function up.util.uniq
    @param {Array<T>} array
    @return {Array<T>}
    @stable
     */
    uniq = function(array) {
      var seen;
      seen = {};
      return select(array, function(element) {
        if (seen.hasOwnProperty(element)) {
          return false;
        } else {
          return seen[element] = true;
        }
      });
    };

    /**
    Returns all elements from the given array that return
    a truthy value when passed to the given function.
    
    @function up.util.select
    @param {Array<T>} array
    @return {Array<T>}
    @stable
     */
    select = function(array, tester) {
      var matches;
      matches = [];
      each(array, function(element) {
        if (tester(element)) {
          return matches.push(element);
        }
      });
      return matches;
    };

    /**
    Returns all elements from the given array that do not return
    a truthy value when passed to the given function.
    
    @function up.util.reject
    @param {Array<T>} array
    @return {Array<T>}
    @stable
     */
    reject = function(array, tester) {
      return select(array, function(element) {
        return !tester(element);
      });
    };

    /**
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

    /**
    Returns the first [present](/up.util.isPresent) element attribute
    among the given list of attribute names.
    
    @function up.util.presentAttr
    @internal
     */
    presentAttr = function() {
      var $element, attrName, attrNames, values;
      $element = arguments[0], attrNames = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      values = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = attrNames.length; i < len; i++) {
          attrName = attrNames[i];
          results.push($element.attr(attrName));
        }
        return results;
      })();
      return detect(values, isPresent);
    };

    /**
    Waits for the given number of milliseconds, the nruns the given callback.
    
    If the number of milliseconds is zero, the callback is run in the current execution frame.
    See [`up.util.nextFrame()`] for running a function in the next executation frame.
    
    @function up.util.setTimer
    @param {Number} millis
    @param {Function} callback
    @experimental
     */
    setTimer = function(millis, callback) {
      if (millis > 0) {
        return setTimeout(callback, millis);
      } else {
        callback();
        return void 0;
      }
    };

    /**
    Schedules the given function to be called in the
    next JavaScript execution frame.
    
    @function up.util.nextFrame
    @param {Function} block
    @stable
     */
    nextFrame = function(block) {
      return setTimeout(block, 0);
    };

    /**
    Returns the last element of the given array.
    
    @function up.util.last
    @param {Array<T>} array
    @return {T}
     */
    last = function(array) {
      return array[array.length - 1];
    };

    /**
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

    /**
    Returns the width of a scrollbar.
    
    This only runs once per page load.
    
    @function up.util.scrollbarWidth
    @internal
     */
    scrollbarWidth = memoize(function() {
      var $outer, outer, width;
      $outer = $('<div>');
      $outer.attr('up-viewport', '');
      $outer.css({
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100px',
        height: '100px',
        overflowY: 'scroll'
      });
      $outer.appendTo(document.body);
      outer = $outer.get(0);
      width = outer.offsetWidth - outer.clientWidth;
      $outer.remove();
      return width;
    });

    /**
    Returns whether the given element is currently showing a vertical scrollbar.
    
    @function up.util.documentHasVerticalScrollbar
    @internal
     */
    documentHasVerticalScrollbar = function() {
      var $body, body, bodyOverflow, forcedHidden, forcedScroll, html;
      body = document.body;
      $body = $(body);
      html = document.documentElement;
      bodyOverflow = $body.css('overflow-y');
      forcedScroll = bodyOverflow === 'scroll';
      forcedHidden = bodyOverflow === 'hidden';
      return forcedScroll || (!forcedHidden && html.scrollHeight > html.clientHeight);
    };

    /**
    Modifies the given function so it only runs once.
    Subsequent calls will return the previous return value.
    
    @function up.util.once
    @param {Function} fun
    @experimental
     */
    once = function(fun) {
      var result;
      result = void 0;
      return function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (fun != null) {
          result = fun.apply(null, args);
        }
        fun = void 0;
        return result;
      };
    };

    /**
    Temporarily sets the CSS for the given element.
    
    @function up.util.temporaryCss
    @param {jQuery} $element
    @param {Object} css
    @param {Function} [block]
      If given, the CSS is set, the block is called and
      the old CSS is restored.
    @return {Function}
      A function that restores the original CSS when called.
    @internal
     */
    temporaryCss = function(elementOrSelector, css, block) {
      var $element, memo, oldCss;
      $element = $(elementOrSelector);
      oldCss = $element.css(Object.keys(css));
      $element.css(css);
      memo = function() {
        return $element.css(oldCss);
      };
      if (block) {
        block();
        return memo();
      } else {
        return once(memo);
      }
    };

    /**
    Forces the given jQuery element into an accelerated compositing layer.
    
    @function up.util.forceCompositing
    @internal
     */
    forceCompositing = function($element) {
      var memo, oldTransforms;
      oldTransforms = $element.css(['transform', '-webkit-transform']);
      if (isBlank(oldTransforms) || oldTransforms['transform'] === 'none') {
        memo = function() {
          return $element.css(oldTransforms);
        };
        $element.css({
          'transform': 'translateZ(0)',
          '-webkit-transform': 'translateZ(0)'
        });
      } else {
        memo = function() {};
      }
      return memo;
    };

    /**
    Forces a repaint of the given element.
    
    @function up.util.forceRepaint
    @internal
     */
    forceRepaint = function(element) {
      element = unJQuery(element);
      return element.offsetHeight;
    };

    /**
    Animates the given element's CSS properties using CSS transitions.
    
    If the element is already being animated, the previous animation
    will instantly jump to its last frame before the new animation begins. 
    
    To improve performance, the element will be forced into compositing for
    the duration of the animation.
    
    @function up.util.cssAnimate
    @param {Element|jQuery|String} elementOrSelector
      The element to animate.
    @param {Object} lastFrame
      The CSS properties that should be transitioned to.
    @param {Number} [options.duration=300]
      The duration of the animation, in milliseconds.
    @param {Number} [options.delay=0]
      The delay before the animation starts, in milliseconds.
    @param {String} [options.easing='ease']
      The timing function that controls the animation's acceleration.
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @return {Deferred}
      A promise for the animation's end.
    @internal
     */
    cssAnimate = function(elementOrSelector, lastFrame, opts) {
      var $element, deferred, oldTransition, onTransitionEnd, transition, transitionProperties, withoutCompositing;
      $element = $(elementOrSelector);
      opts = options(opts, {
        duration: 300,
        delay: 0,
        easing: 'ease'
      });
      if (opts.duration === 0) {
        $element.css(lastFrame);
        return resolvedDeferred();
      }
      deferred = $.Deferred();
      transitionProperties = Object.keys(lastFrame);
      transition = {
        'transition-property': transitionProperties.join(', '),
        'transition-duration': opts.duration + "ms",
        'transition-delay': opts.delay + "ms",
        'transition-timing-function': opts.easing
      };
      oldTransition = $element.css(Object.keys(transition));
      onTransitionEnd = function(event) {
        var completedProperty;
        completedProperty = event.originalEvent.propertyName;
        if (contains(transitionProperties, completedProperty)) {
          return deferred.resolve();
        }
      };
      $element.on('transitionend', onTransitionEnd);
      deferred.then(function() {
        var hadTransitionBefore;
        $element.removeClass('up-animating');
        $element.off('transitionend', onTransitionEnd);
        $element.removeData(ANIMATION_DEFERRED_KEY);
        withoutCompositing();
        $element.css({
          'transition': 'none'
        });
        hadTransitionBefore = !(oldTransition['transition-property'] === 'none' || (oldTransition['transition-property'] === 'all' && oldTransition['transition-duration'][0] === '0'));
        if (hadTransitionBefore) {
          forceRepaint($element);
          return $element.css(oldTransition);
        }
      });
      $element.addClass('up-animating');
      withoutCompositing = forceCompositing($element);
      $element.css(transition);
      $element.data(ANIMATION_DEFERRED_KEY, deferred);
      $element.css(lastFrame);
      return deferred;
    };
    ANIMATION_DEFERRED_KEY = 'up-animation-deferred';

    /**
    Completes the animation for  the given element by jumping
    to the last frame instantly. All callbacks chained to
    the original animation's promise will be called.
    
    Does nothing if the given element is not currently animating.
    
    Also see [`up.motion.finish()`](/up.motion.finish).
    
    @function up.util.finishCssAnimate
    @param {Element|jQuery|String} elementOrSelector
    @internal
     */
    finishCssAnimate = function(elementOrSelector) {
      return $(elementOrSelector).each(function() {
        var existingAnimation;
        if (existingAnimation = pluckData(this, ANIMATION_DEFERRED_KEY)) {
          return existingAnimation.resolve();
        }
      });
    };

    /**
    @internal
     */
    margins = function(selectorOrElement) {
      var $element, withUnits;
      $element = $(selectorOrElement);
      withUnits = $element.css(['margin-top', 'margin-right', 'margin-bottom', 'margin-left']);
      return {
        top: parseFloat(withUnits['margin-top']),
        right: parseFloat(withUnits['margin-right']),
        bottom: parseFloat(withUnits['margin-bottom']),
        left: parseFloat(withUnits['margin-left'])
      };
    };

    /**
    Measures the given element.
    
    @function up.util.measure
    @internal
     */
    measure = function($element, opts) {
      var $context, box, contextCoords, coordinates, elementCoords, mgs;
      opts = options(opts, {
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

    /**
    Copies all attributes from the source element to the target element.
    
    @function up.util.copyAttributes
    @internal
     */
    copyAttributes = function($source, $target) {
      var attr, i, len, ref, results;
      ref = $source.get(0).attributes;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        attr = ref[i];
        if (attr.specified) {
          results.push($target.attr(attr.name, attr.value));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    /**
    Looks for the given selector in the element and its descendants.
    
    @function up.util.findWithSelf
    @internal
     */
    findWithSelf = function($element, selector) {
      return $element.find(selector).addBack(selector);
    };

    /**
    Returns whether the given keyboard event involved the ESC key.
    
    @function up.util.escapePressed
    @internal
     */
    escapePressed = function(event) {
      return event.keyCode === 27;
    };

    /**
    Returns whether the given array or string contains the given element or substring.
    
    @function up.util.contains
    @param {Array|String} arrayOrString
    @param elementOrSubstring
    @stable
     */
    contains = function(arrayOrString, elementOrSubstring) {
      return arrayOrString.indexOf(elementOrSubstring) >= 0;
    };

    /**
    @function up.util.castedAttr
    @internal
     */
    castedAttr = function($element, attrName) {
      var value;
      value = $element.attr(attrName);
      switch (value) {
        case 'false':
          return false;
        case 'true':
          return true;
        case '':
          return true;
        default:
          return value;
      }
    };

    /**
    @function up.util.locationFromXhr
    @internal
     */
    locationFromXhr = function(xhr) {
      return xhr.getResponseHeader('X-Up-Location');
    };

    /**
    @function up.util.titleFromXhr
    @internal
     */
    titleFromXhr = function(xhr) {
      return xhr.getResponseHeader('X-Up-Title');
    };

    /**
    @function up.util.methodFromXhr
    @internal
     */
    methodFromXhr = function(xhr) {
      return xhr.getResponseHeader('X-Up-Method');
    };

    /**
    Returns a copy of the given object that only contains
    the given properties.
    
    @function up.util.only
    @param {Object} object
    @param {Array} keys...
    @stable
     */
    only = function() {
      var filtered, i, len, object, properties, property;
      object = arguments[0], properties = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      filtered = {};
      for (i = 0, len = properties.length; i < len; i++) {
        property = properties[i];
        if (object.hasOwnProperty(property)) {
          filtered[property] = object[property];
        }
      }
      return filtered;
    };

    /**
    Returns a copy of the given object that contains all except
    the given properties.
    
    @function up.util.except
    @param {Object} object
    @param {Array} keys...
    @stable
     */
    except = function() {
      var filtered, i, len, object, properties, property;
      object = arguments[0], properties = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      filtered = copy(object);
      for (i = 0, len = properties.length; i < len; i++) {
        property = properties[i];
        delete filtered[property];
      }
      return filtered;
    };

    /**
    @function up.util.isUnmodifiedKeyEvent
    @internal
     */
    isUnmodifiedKeyEvent = function(event) {
      return !(event.metaKey || event.shiftKey || event.ctrlKey);
    };

    /**
    @function up.util.isUnmodifiedMouseEvent
    @internal
     */
    isUnmodifiedMouseEvent = function(event) {
      var isLeftButton;
      isLeftButton = isUndefined(event.button) || event.button === 0;
      return isLeftButton && isUnmodifiedKeyEvent(event);
    };

    /**
    Returns a [Deferred object](https://api.jquery.com/category/deferred-object/) that is
    already resolved.
    
    @function up.util.resolvedDeferred
    @param {Array<Object>} [args...]
      The resolution values that will be passed to callbacks
    @return {Deferred}
    @stable
     */
    resolvedDeferred = function() {
      var args, deferred;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      deferred = $.Deferred();
      deferred.resolve.apply(deferred, args);
      return deferred;
    };

    /**
    Returns a promise that is already resolved.
    
    @function up.util.resolvedPromise
    @param {Array<Object>} [args...]
      The resolution values that will be passed to callbacks
    @return {Promise}
    @stable
     */
    resolvedPromise = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return resolvedDeferred.apply(null, args).promise();
    };

    /**
    Returns a promise that is already rejected.
    
    @function up.util.rejectedPromise
    @param {Array<Object>} [args...]
      The rejection values that will be passed to callbacks
    @return {Promise}
    @stable
     */
    rejectedPromise = function() {
      var args, deferred;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      deferred = $.Deferred();
      deferred.reject.apply(deferred, args);
      return deferred.promise();
    };

    /**
    Returns whether the given argument is a resolved jQuery promise.
    
    @return {Boolean}
    @internal
     */
    isResolvedPromise = function(promise) {
      return isPromise(promise) && (typeof promise.state === "function" ? promise.state() : void 0) === 'resolved';
    };

    /**
    Returns whether the given argument is a resolved jQuery promise.
    
    @return {Boolean}
    @internal
     */
    isResolvedPromise = function(promise) {
      return isPromise(promise) && (typeof promise.state === "function" ? promise.state() : void 0) === 'resolved';
    };

    /**
    Returns a [Deferred object](https://api.jquery.com/category/deferred-object/) that will never be resolved.
    
    @function up.util.unresolvableDeferred
    @return {Deferred}
    @experimental
     */
    unresolvableDeferred = function() {
      return $.Deferred();
    };

    /**
    Returns a promise that will never be resolved.
    
    @function up.util.unresolvablePromise
    @experimental
     */
    unresolvablePromise = function() {
      return unresolvableDeferred().promise();
    };

    /**
    Returns an empty jQuery collection.
    
    @function up.util.nullJQuery
    @internal
     */
    nullJQuery = function() {
      return $();
    };

    /**
    Returns a new promise that resolves once all promises in arguments resolve.
    
    Other then [`$.when` from jQuery](https://api.jquery.com/jquery.when/),
    the combined promise will have a `resolve` method. This `resolve` method
    will resolve all the wrapped promises.
    
    @function up.util.resolvableWhen
    @internal
     */
    resolvableWhen = function() {
      var deferreds, joined;
      deferreds = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      joined = $.when.apply($, [resolvedDeferred()].concat(slice.call(deferreds)));
      joined.resolve = memoize(function() {
        return each(deferreds, function(deferred) {
          return deferred.resolve();
        });
      });
      return joined;
    };

    /**
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

    /**
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

    /**
    @function up.util.multiSelector
    @internal
     */
    multiSelector = function(parts) {
      var combinedSelector, elements, i, len, obj, part, selectors;
      obj = {};
      selectors = [];
      elements = [];
      for (i = 0, len = parts.length; i < len; i++) {
        part = parts[i];
        if (isString(part)) {
          selectors.push(part);
        } else {
          elements.push(part);
        }
      }
      obj.parsed = elements;
      if (selectors.length) {
        combinedSelector = selectors.join(', ');
        obj.parsed.push(combinedSelector);
      }
      obj.select = function() {
        return obj.find(void 0);
      };
      obj.find = function($root) {
        var $matches, $result, j, len1, ref, selector;
        $result = nullJQuery();
        ref = obj.parsed;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          selector = ref[j];
          $matches = $root ? $root.find(selector) : $(selector);
          $result = $result.add($matches);
        }
        return $result;
      };
      obj.findWithSelf = function($start) {
        var $matches;
        $matches = obj.find($start);
        if (obj.doesMatch($start)) {
          $matches = $matches.add($start);
        }
        return $matches;
      };
      obj.doesMatch = function(element) {
        var $element;
        $element = $(element);
        return any(obj.parsed, function(selector) {
          return $element.is(selector);
        });
      };
      obj.seekUp = function(start) {
        var $element, $result, $start;
        $start = $(start);
        $element = $start;
        $result = void 0;
        while ($element.length) {
          if (obj.doesMatch($element)) {
            $result = $element;
            break;
          }
          $element = $element.parent();
        }
        return $result || nullJQuery();
      };
      return obj;
    };

    /**
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

    /**
    @function up.util.cache
    @param {Number|Function} [config.size]
      Maximum number of cache entries.
      Set to `undefined` to not limit the cache size.
    @param {Number|Function} [config.expiry]
      The number of milliseconds after which a cache entry
      will be discarded.
    @param {String} [config.log]
      A prefix for log entries printed by this cache object.
    @param {Function<Object>} [config.key]
      A function that takes an argument and returns a `String` key
      for storage. If omitted, `toString()` is called on the argument.
    @internal
     */
    cache = function(config) {
      var alias, clear, expiryMillis, get, isEnabled, isFresh, keys, log, makeRoomForAnotherKey, maxKeys, normalizeStoreKey, set, store, timestamp;
      if (config == null) {
        config = {};
      }
      store = void 0;
      maxKeys = function() {
        return evalOption(config.size);
      };
      expiryMillis = function() {
        return evalOption(config.expiry);
      };
      normalizeStoreKey = function(key) {
        if (config.key) {
          return config.key(key);
        } else {
          return key.toString();
        }
      };
      isEnabled = function() {
        return maxKeys() !== 0 && expiryMillis() !== 0;
      };
      clear = function() {
        return store = {};
      };
      clear();
      log = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (config.logPrefix) {
          args[0] = "[" + config.logPrefix + "] " + args[0];
          return up.puts.apply(up, args);
        }
      };
      keys = function() {
        return Object.keys(store);
      };
      makeRoomForAnotherKey = function() {
        var max, oldestKey, oldestTimestamp, storeKeys;
        storeKeys = copy(keys());
        max = maxKeys();
        if (max && storeKeys.length >= max) {
          oldestKey = null;
          oldestTimestamp = null;
          each(storeKeys, function(key) {
            var promise, timestamp;
            promise = store[key];
            timestamp = promise.timestamp;
            if (!oldestTimestamp || oldestTimestamp > timestamp) {
              oldestKey = key;
              return oldestTimestamp = timestamp;
            }
          });
          if (oldestKey) {
            return delete store[oldestKey];
          }
        }
      };
      alias = function(oldKey, newKey) {
        var value;
        value = get(oldKey, {
          silent: true
        });
        if (isDefined(value)) {
          return set(newKey, value);
        }
      };
      timestamp = function() {
        return (new Date()).valueOf();
      };
      set = function(key, value) {
        var storeKey;
        if (isEnabled()) {
          makeRoomForAnotherKey();
          storeKey = normalizeStoreKey(key);
          return store[storeKey] = {
            timestamp: timestamp(),
            value: value
          };
        }
      };
      remove = function(key) {
        var storeKey;
        storeKey = normalizeStoreKey(key);
        return delete store[storeKey];
      };
      isFresh = function(entry) {
        var millis, timeSinceTouch;
        millis = expiryMillis();
        if (millis) {
          timeSinceTouch = timestamp() - entry.timestamp;
          return timeSinceTouch < millis;
        } else {
          return true;
        }
      };
      get = function(key, options) {
        var entry, storeKey;
        if (options == null) {
          options = {};
        }
        storeKey = normalizeStoreKey(key);
        if (entry = store[storeKey]) {
          if (isFresh(entry)) {
            if (!options.silent) {
              log("Cache hit for '%s'", key);
            }
            return entry.value;
          } else {
            if (!options.silent) {
              log("Discarding stale cache entry for '%s'", key);
            }
            remove(key);
            return void 0;
          }
        } else {
          if (!options.silent) {
            log("Cache miss for '%s'", key);
          }
          return void 0;
        }
      };
      return {
        alias: alias,
        get: get,
        set: set,
        remove: remove,
        clear: clear,
        keys: keys
      };
    };

    /**
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

    /**
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
        var newOptions;
        newOptions = blueprint;
        if (isFunction(newOptions)) {
          newOptions = newOptions();
        }
        return assign(hash, newOptions);
      };
      hash.reset();
      return hash;
    };

    /**
    @function up.util.unwrapElement
    @internal
     */
    unwrapElement = function(wrapper) {
      var parent, wrappedNodes;
      wrapper = unJQuery(wrapper);
      parent = wrapper.parentNode;
      wrappedNodes = toArray(wrapper.childNodes);
      each(wrappedNodes, function(wrappedNode) {
        return parent.insertBefore(wrappedNode, wrapper);
      });
      return parent.removeChild(wrapper);
    };

    /**
    @function up.util.offsetParent
    @internal
     */
    offsetParent = function($element) {
      var $match, position;
      $match = void 0;
      while (($element = $element.parent()) && $element.length) {
        position = $element.css('position');
        if (position === 'absolute' || position === 'relative' || $element.is('body')) {
          $match = $element;
          break;
        }
      }
      return $match;
    };

    /**
    Returns if the given element has a `fixed` position.
    
    @function up.util.isFixed
    @internal
     */
    isFixed = function(element) {
      var $element, position;
      $element = $(element);
      while (true) {
        position = $element.css('position');
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

    /**
    @function up.util.fixedToAbsolute
    @internal
     */
    fixedToAbsolute = function(element, $viewport) {
      var $element, $futureOffsetParent, elementCoords, futureParentCoords;
      $element = $(element);
      $futureOffsetParent = offsetParent($element);
      elementCoords = $element.position();
      futureParentCoords = $futureOffsetParent.offset();
      return $element.css({
        position: 'absolute',
        left: elementCoords.left - futureParentCoords.left,
        top: elementCoords.top - futureParentCoords.top + $viewport.scrollTop(),
        right: '',
        bottom: ''
      });
    };

    /**
    Normalizes the given params object to the form returned by
    [`jQuery.serializeArray`](https://api.jquery.com/serializeArray/).
    
    @function up.util.requestDataAsArray
    @param {Object|Array|Undefined|Null} data
    @internal
     */
    requestDataAsArray = function(data) {
      var array, i, len, pair, part, query, ref;
      if (isFormData(data)) {
        return up.fail('Cannot convert FormData into an array');
      } else {
        query = requestDataAsQuery(data);
        array = [];
        ref = query.split('&');
        for (i = 0, len = ref.length; i < len; i++) {
          part = ref[i];
          if (isPresent(part)) {
            pair = part.split('=');
            array.push({
              name: decodeURIComponent(pair[0]),
              value: decodeURIComponent(pair[1])
            });
          }
        }
        return array;
      }
    };

    /**
    Returns an URL-encoded query string for the given params object.
    
    @function up.util.requestDataAsQuery
    @param {Object|Array|Undefined|Null} data
    @internal
     */
    requestDataAsQuery = function(data) {
      var query;
      if (isFormData(data)) {
        return up.fail('Cannot convert FormData into a query string');
      } else if (isPresent(data)) {
        query = $.param(data);
        query = query.replace(/\+/g, '%20');
        return query;
      } else {
        return "";
      }
    };

    /**
    Serializes the given form into a request data representation.
    
    @function up.util.requestDataFromForm
    @return {Array|FormData}
    @internal
     */
    requestDataFromForm = function(form) {
      var $form, hasFileInputs;
      $form = $(form);
      hasFileInputs = $form.find('input[type=file]').length;
      if (hasFileInputs && up.browser.canFormData()) {
        return new FormData($form.get(0));
      } else {
        return $form.serializeArray();
      }
    };

    /**
    Adds a key/value pair to the given request data representation.
    
    This mutates the given `data` if `data` is a `FormData`, an object
    or an array. When `data` is `String` a new string with the appended key/value
    pair is returned.
    
    @function up.util.appendRequestData
    @param {FormData|Object|Array|Undefined|Null} data
    @param {String} key
    @param {String|Blob|File} value
    @internal
     */
    appendRequestData = function(data, name, value) {
      var newPair;
      if (isFormData(data)) {
        data.append(name, value);
      } else if (isArray(data)) {
        data.push({
          name: name,
          value: value
        });
      } else if (isObject(data)) {
        data[name] = value;
      } else if (isString(data) || isMissing(data)) {
        newPair = requestDataAsQuery([
          {
            name: name,
            value: value
          }
        ]);
        if (isPresent(data)) {
          data = [data, newPair].join('&');
        } else {
          data = newPair;
        }
      }
      return data;
    };

    /**
    Throws a [JavaScript error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
    with the given message.
    
    The message will also be printed to the [error log](/up.log.error). Also a notification will be shown at the bottom of the screen.
    
    The message may contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions).
    
    \#\#\# Examples
    
        up.fail('Division by zero')
        up.fail('Unexpected result %o', result)
    
    @function up.fail
    @param {String} message
      A message with details about the error.
    
      The message can contain [substitution marks](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions)
      like `%s` or `%o`.
    @param {Array<String>} vars...
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

    /**
    Escapes the given string of HTML by replacing control chars with their HTML entities.
    
    @function up.util.escapeHtml
    @param {String} string
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
      if (isHash(lastArg) && !isJQuery(lastArg)) {
        return args.pop();
      } else {
        return {};
      }
    };
    opacity = function(element) {
      var rawOpacity;
      rawOpacity = $(element).css('opacity');
      if (isGiven(rawOpacity)) {
        return parseFloat(rawOpacity);
      } else {
        return void 0;
      }
    };
    whenReady = memoize(function() {
      var deferred;
      if ($.isReady) {
        return resolvedPromise();
      } else {
        deferred = $.Deferred();
        $(function() {
          return deferred.resolve();
        });
        return deferred.promise();
      }
    });
    identity = function(arg) {
      return arg;
    };

    /**
    Returns whether the given element has been detached from the DOM
    (or whether it was never attached).
    
    @function up.util.isDetached
    @internal
     */
    isDetached = function(element) {
      element = unJQuery(element);
      return !jQuery.contains(document.documentElement, element);
    };

    /**
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
      deferred = $.Deferred();
      preview = function() {
        var args, funValue;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        funValue = fun.apply(null, args);
        if (isPromise(funValue)) {
          funValue.then(function() {
            return deferred.resolve(funValue);
          });
        } else {
          deferred.resolve(funValue);
        }
        return funValue;
      };
      preview.promise = deferred.promise();
      return preview;
    };

    /**
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
        var promises;
        promises = map(this.allTasks(), function(task) {
          return task.promise;
        });
        return $.when.apply($, promises);
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
            return promise.always((function(_this) {
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
        return this.poke();
      };

      return DivertibleChain;

    })();

    /**
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

    /**
    @function up.util.sequence
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

    /**
    @function up.util.promiseTimer
    @internal
     */
    promiseTimer = function(ms) {
      var deferred, timeout;
      deferred = $.Deferred();
      timeout = setTimer(ms, function() {
        return deferred.resolve();
      });
      deferred.cancel = function() {
        return clearTimeout(timeout);
      };
      return deferred;
    };

    /**
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

    /**
    Like `$old.replaceWith($new)`, but keeps event handlers bound to `$old`.
    
    Note that this is a memory leak unless you re-attach `$new` to the DOM aferwards.
    
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

    /**
    Flattens the given `array` a single level deep.
    
    @function up.util.flatten
    @param {Array} array
      An array which might contain other arrays
    @return {Array}
      The flattened array
    @internal
     */
    flatten = function(array) {
      var flattened, i, len, object;
      flattened = [];
      for (i = 0, len = array.length; i < len; i++) {
        object = array[i];
        if (isArray(object)) {
          flattened = flattened.concat(object);
        } else {
          flattened.push(object);
        }
      }
      return flattened;
    };
    isTruthy = function(object) {
      return !!object;
    };
    return {
      isDetached: isDetached,
      requestDataAsArray: requestDataAsArray,
      requestDataAsQuery: requestDataAsQuery,
      appendRequestData: appendRequestData,
      requestDataFromForm: requestDataFromForm,
      offsetParent: offsetParent,
      fixedToAbsolute: fixedToAbsolute,
      isFixed: isFixed,
      presentAttr: presentAttr,
      createElement: createElement,
      parseUrl: parseUrl,
      normalizeUrl: normalizeUrl,
      normalizeMethod: normalizeMethod,
      createElementFromHtml: createElementFromHtml,
      $createElementFromSelector: $createElementFromSelector,
      $createPlaceholder: $createPlaceholder,
      selectorForElement: selectorForElement,
      assign: assign,
      assignPolyfill: assignPolyfill,
      copy: copy,
      merge: merge,
      options: options,
      option: option,
      fail: fail,
      each: each,
      map: map,
      times: times,
      any: any,
      all: all,
      detect: detect,
      select: select,
      reject: reject,
      intersect: intersect,
      compact: compact,
      uniq: uniq,
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
      isNumber: isNumber,
      isElement: isElement,
      isJQuery: isJQuery,
      isPromise: isPromise,
      isResolvedPromise: isResolvedPromise,
      isDeferred: isDeferred,
      isHash: isHash,
      isArray: isArray,
      isFormData: isFormData,
      isUnmodifiedKeyEvent: isUnmodifiedKeyEvent,
      isUnmodifiedMouseEvent: isUnmodifiedMouseEvent,
      nullJQuery: nullJQuery,
      unJQuery: unJQuery,
      setTimer: setTimer,
      nextFrame: nextFrame,
      measure: measure,
      temporaryCss: temporaryCss,
      cssAnimate: cssAnimate,
      finishCssAnimate: finishCssAnimate,
      forceCompositing: forceCompositing,
      forceRepaint: forceRepaint,
      escapePressed: escapePressed,
      copyAttributes: copyAttributes,
      findWithSelf: findWithSelf,
      contains: contains,
      toArray: toArray,
      castedAttr: castedAttr,
      locationFromXhr: locationFromXhr,
      titleFromXhr: titleFromXhr,
      methodFromXhr: methodFromXhr,
      clientSize: clientSize,
      only: only,
      except: except,
      trim: trim,
      unresolvableDeferred: unresolvableDeferred,
      unresolvablePromise: unresolvablePromise,
      resolvedPromise: resolvedPromise,
      rejectedPromise: rejectedPromise,
      resolvedDeferred: resolvedDeferred,
      resolvableWhen: resolvableWhen,
      setMissingAttrs: setMissingAttrs,
      remove: remove,
      memoize: memoize,
      scrollbarWidth: scrollbarWidth,
      documentHasVerticalScrollbar: documentHasVerticalScrollbar,
      config: config,
      openConfig: openConfig,
      cache: cache,
      unwrapElement: unwrapElement,
      multiSelector: multiSelector,
      error: fail,
      pluckData: pluckData,
      pluckKey: pluckKey,
      extractOptions: extractOptions,
      isDetached: isDetached,
      noop: noop,
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
      isTruthy: isTruthy
    };
  })($);

  up.fail = up.util.fail;

}).call(this);

/**
Browser support
===============

Unpoly supports all modern browsers. It degrades gracefully with old versions of Internet Explorer:

IE 10, IE11, Edge
: Full support

IE 9
: Page updates that change browser history fall back to a classic page load.

IE 8
: Unpoly prevents itself from booting itself, leaving you with a classic server-side application.


@class up.browser
 */

(function() {
  var slice = [].slice;

  up.browser = (function($) {
    var CONSOLE_PLACEHOLDERS, canCssTransition, canFormData, canInputEvent, canLogSubstitution, canPushState, initialRequestMethod, installPolyfills, isIE8OrWorse, isIE9OrWorse, isRecentJQuery, isSupported, loadPage, popCookie, puts, sessionStorage, setLocationHref, sprintf, sprintfWithFormattedArgs, stringifyArg, submitForm, u, url, whenConfirmed;
    u = up.util;

    /**
    @method up.browser.loadPage
    @param {String} url
    @param {String} [options.method='get']
    @param {Object|Array} [options.data]
    @internal
     */
    loadPage = function(url, options) {
      var $form, addField, csrfField, method, query;
      if (options == null) {
        options = {};
      }
      method = u.option(options.method, 'get').toLowerCase();
      if (method === 'get') {
        query = u.requestDataAsQuery(options.data);
        if (query) {
          url = url + "?" + query;
        }
        return setLocationHref(url);
      } else {
        $form = $("<form method='post' action='" + url + "' class='up-page-loader'></form>");
        addField = function(field) {
          var $field;
          $field = $('<input type="hidden">');
          $field.attr(field);
          return $field.appendTo($form);
        };
        addField({
          name: up.proxy.config.wrapMethodParam,
          value: method
        });
        if (csrfField = up.rails.csrfField()) {
          addField(csrfField);
        }
        u.each(u.requestDataAsArray(options.data), addField);
        $form.hide().appendTo('body');
        return submitForm($form);
      }
    };

    /**
    For mocking in specs.
    
    @method submitForm
     */
    submitForm = function($form) {
      return $form.submit();
    };

    /**
    For mocking in specs.
    
    @method setLocationHref
     */
    setLocationHref = function(url) {
      return location.href = url;
    };

    /**
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
      var args, message, stream;
      stream = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (canLogSubstitution()) {
        return console[stream].apply(console, args);
      } else {
        message = sprintf.apply(null, args);
        return console[stream](message);
      }
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

    /**
    See https://developer.mozilla.org/en-US/docs/Web/API/Console#Using_string_substitutions
    
    @function up.browser.sprintf
    @internal
     */
    sprintf = function() {
      var args, message;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      return sprintfWithFormattedArgs.apply(null, [u.identity, message].concat(slice.call(args)));
    };

    /**
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
    isIE8OrWorse = u.memoize(function() {
      return u.isUndefined(document.addEventListener);
    });
    isIE9OrWorse = u.memoize(function() {
      return isIE8OrWorse() || navigator.appVersion.indexOf('MSIE 9.') !== -1;
    });

    /**
    Returns whether this browser supports manipulation of the current URL
    via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
    
    When Unpoly is asked to change history on a browser that doesn't support
    `pushState` (e.g. through [`up.follow()`](/up.follow)), it will gracefully
    fall back to a full page load.
    
    @function up.browser.canPushState
    @return {Boolean}
    @experimental
     */
    canPushState = u.memoize(function() {
      return u.isDefined(history.pushState) && initialRequestMethod() === 'get';
    });

    /**
    Returns whether this browser supports animation using
    [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions).
    
    When Unpoly is asked to animate history on a browser that doesn't support
    CSS transitions (e.g. through [`up.animate()`](/up.animate)), it will skip the
    animation by instantly jumping to the last frame.
    
    @function up.browser.canCssTransition
    @return {Boolean}
    @experimental
     */
    canCssTransition = u.memoize(function() {
      return 'transition' in document.documentElement.style;
    });

    /**
    Returns whether this browser supports the DOM event [`input`](https://developer.mozilla.org/de/docs/Web/Events/input).
    
    @function up.browser.canInputEvent
    @return {Boolean}
    @experimental
     */
    canInputEvent = u.memoize(function() {
      return 'oninput' in document.createElement('input');
    });

    /**
    Returns whether this browser supports the [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
    interface.
    
    @function up.browser.canFormData
    @return {Boolean}
    @experimental
     */
    canFormData = u.memoize(function() {
      return !!window.FormData;
    });

    /**
    Returns whether this browser supports
    [string substitution](https://developer.mozilla.org/en-US/docs/Web/API/console#Using_string_substitutions)
    in `console` functions.
    
    \#\#\# Example for string substition
    
        console.log("Hello %o!", "Judy");
    
    @function up.browser.canLogSubstitution
    @return {Boolean}
    @internal
     */
    canLogSubstitution = u.memoize(function() {
      return !isIE9OrWorse();
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

    /**
    @function up,browser.whenConfirmed
    @return {Promise}
    @param {String} options.confirm
    @param {Boolean} options.preload
    @internal
     */
    whenConfirmed = function(options) {
      if (options.preload || u.isBlank(options.confirm) || window.confirm(options.confirm)) {
        return u.resolvedPromise();
      } else {
        return u.unresolvablePromise();
      }
    };
    initialRequestMethod = u.memoize(function() {
      return (popCookie('_up_request_method') || 'get').toLowerCase();
    });

    /**
    Returns whether Unpoly supports the current browser.
    
    This also returns `true` if Unpoly only support some features, but falls back
    gracefully for other features. E.g. IE9 is almost fully supported, but due to
    its lack of [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
    Unpoly falls back to a full page load when asked to manipulate history.
    
    Currently Unpoly supports IE9 with jQuery 1.9+.
    On older browsers Unpoly will prevent itself from [booting](/up.boot)
    and ignores all registered [event handlers](/up.on) and [compilers](/up.compiler).
    This leaves you with a classic server-side application.
    
    @function up.browser.isSupported
    @experimental
     */
    isSupported = function() {
      return (!isIE8OrWorse()) && isRecentJQuery();
    };

    /**
    @internal
     */
    installPolyfills = function() {
      var j, len, method, ref;
      if (window.console == null) {
        window.console = {};
      }
      ref = ['debug', 'info', 'warn', 'error', 'group', 'groupCollapsed', 'groupEnd'];
      for (j = 0, len = ref.length; j < len; j++) {
        method = ref[j];
        if (console[method] == null) {
          console[method] = function() {
            var args;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            return puts.apply(null, ['log'].concat(slice.call(args)));
          };
        }
      }
      return console.log != null ? console.log : console.log = u.noop;
    };

    /**
    @internal
     */
    sessionStorage = u.memoize(function() {
      return window.sessionStorage || {
        getItem: u.noop,
        setItem: u.noop,
        removeItem: u.noop
      };
    });
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      url: url,
      loadPage: loadPage,
      whenConfirmed: whenConfirmed,
      canPushState: canPushState,
      canCssTransition: canCssTransition,
      canInputEvent: canInputEvent,
      canFormData: canFormData,
      canLogSubstitution: canLogSubstitution,
      isSupported: isSupported,
      installPolyfills: installPolyfills,
      puts: puts,
      sprintf: sprintf,
      sprintfWithFormattedArgs: sprintfWithFormattedArgs,
      sessionStorage: sessionStorage
    };
  })(jQuery);

}).call(this);

/**
Events
======

Most Unpoly interactions emit DOM events that are prefixed with `up:`.

    $(document).on('up:modal:opened', function(event) {
      console.log('A new modal has just opened!');
    });

Events often have both present ([`up:modal:open`](/up:modal:open))
and past forms ([`up:modal:opened`](/up:modal:opened)).

You can usually prevent an action by listening to the present form
and call `preventDefault()` on the `event` object:

    $(document).on('up:modal:open', function(event) {
      if (event.url == '/evil') {
        // Prevent the modal from opening
        event.preventDefault();
      }
    });


A better way to bind event listeners
------------------------------------

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
    var boot, consumeAction, emit, emitReset, forgetUpDescription, haltEvent, live, liveUpDescriptions, logEmission, nextUpDescriptionNumber, nobodyPrevents, onEscape, rememberUpDescription, restoreSnapshot, snapshot, u, unbind, upDescriptionNumber, upDescriptionToJqueryDescription, upListenerToJqueryListener, whenEmitted;
    u = up.util;
    liveUpDescriptions = {};
    nextUpDescriptionNumber = 0;

    /**
    Convert an Unpoly style listener (second argument is the event target
    as a jQuery collection) to a vanilla jQuery listener
    
    @function upListenerToJqueryListener
    @internal
     */
    upListenerToJqueryListener = function(upListener) {
      return function(event) {
        var $me;
        $me = event.$element || $(this);
        return upListener.apply($me.get(0), [event, $me, up.syntax.data($me)]);
      };
    };

    /**
    Converts an argument list for `up.on()` to an argument list for `jQuery.on`.
    This involves rewriting the listener signature in the last argument slot.
    
    @function upDescriptionToJqueryDescription
    @internal
     */
    upDescriptionToJqueryDescription = function(upDescription, isNew) {
      var jqueryDescription, jqueryListener, upListener;
      jqueryDescription = u.copy(upDescription);
      upListener = jqueryDescription.pop();
      jqueryListener = void 0;
      if (isNew) {
        jqueryListener = upListenerToJqueryListener(upListener);
        upListener._asJqueryListener = jqueryListener;
        upListener._descriptionNumber = ++nextUpDescriptionNumber;
      } else {
        jqueryListener = upListener._asJqueryListener;
        jqueryListener || up.fail('up.off: The event listener %o was never registered through up.on');
      }
      jqueryDescription.push(jqueryListener);
      return jqueryDescription;
    };

    /**
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
    
        <span class="person" up-data="{ age: 18, name: 'Bob' }">Bob</span>
        <span class="person" up-data="{ age: 22, name: 'Jim' }">Jim</span>
    
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
    @param {String} events
      A space-separated list of event names to bind.
    @param {String} [selector]
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

    /**
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
      var number;
      number = upDescriptionNumber(upDescription);
      return delete liveUpDescriptions[number];
    };
    upDescriptionNumber = function(upDescription) {
      return u.last(upDescription)._descriptionNumber;
    };

    /**
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
    @param {String} eventName
      The name of the event.
    @param {Object} [eventProps={}]
      A list of properties to become part of the event object
      that will be passed to listeners. Note that the event object
      will by default include properties like `preventDefault()`
      or `stopPropagation()`.
    @param {jQuery} [eventProps.$element=$(document)]
      The element on which the event is triggered.
    @param {String|Array} [eventProps.message]
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
      if ($target = eventProps.$element) {
        delete eventProps.$element;
      } else {
        $target = $(document);
      }
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

    /**
    [Emits an event](/up.emit) and returns whether no listener
    has prevented the default action.
    
    @function up.bus.nobodyPrevents
    @param {String} eventName
    @param {Object} eventProps
    @param {String|Array} [eventProps.message]
    @return {Boolean}
      whether no listener has prevented the default action
    @experimental
     */
    nobodyPrevents = function() {
      var args, event;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      event = emit.apply(null, args);
      if (event.isDefaultPrevented()) {
        up.puts("An observer prevented the event %s", args[0]);
        return false;
      } else {
        return true;
      }
    };

    /**
    [Emits](/up.emit) the given event and returns a promise
    that will be resolved if no listener has prevented the default action.
    
    If any listener prevented the default listener
    the returned promise will never be resolved.
    
    @function up.bus.whenEmitted
    @param {String} eventName
    @param {Object} eventProps
    @param {String|Array} [eventProps.message]
    @return {Promise}
    @internal
     */
    whenEmitted = function() {
      var args, deferred;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      deferred = $.Deferred();
      if (nobodyPrevents.apply(null, args)) {
        deferred.resolve();
      }
      return deferred.promise();
    };

    /**
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

    /**
    Stops the given event from propagating and prevents the default action.
    
    @function up.bus.haltEvent
    @internal
     */
    haltEvent = function(event) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      return event.preventDefault();
    };

    /**
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

    /**
    Makes a snapshot of the currently registered event listeners,
    to later be restored through [`up.bus.reset()`](/up.bus.reset).
    
    @internal
     */
    snapshot = function() {
      var description, i, len, results;
      results = [];
      for (i = 0, len = liveUpDescriptions.length; i < len; i++) {
        description = liveUpDescriptions[i];
        results.push(description.isDefault = true);
      }
      return results;
    };

    /**
    Resets the list of registered event listeners to the
    moment when the framework was booted.
    
    @internal
     */
    restoreSnapshot = function() {
      var description, doomedDescriptions, i, len, results;
      doomedDescriptions = u.reject(liveUpDescriptions, function(description) {
        return description.isDefault;
      });
      results = [];
      for (i = 0, len = doomedDescriptions.length; i < len; i++) {
        description = doomedDescriptions[i];
        results.push(unbind.apply(null, description));
      }
      return results;
    };

    /**
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
      return emit('up:framework:reset', {
        message: 'Resetting framework'
      });
    };

    /**
    This event is [emitted](/up.emit) when Unpoly is [reset](/up.reset) during unit tests.
    
    @event up:framework:reset
    @experimental
     */

    /**
    Boots the Unpoly framework.
    
    **This is called automatically** by including the Unpoly JavaScript files.
    
    Unpoly will not boot if the current browser is [not supported](/up.browser.isSupported).
    This leaves you with a classic server-side application on legacy browsers.
    
    Emits the [`up:framework:boot`](/up:framework:boot) event.
    
    @function up.boot
    @internal
     */
    boot = function() {
      if (up.browser.isSupported()) {
        up.browser.installPolyfills();
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
      }
    };

    /**
    This event is [emitted](/up.emit) when Unpoly [starts to boot](/up.boot).
    
    @event up:framework:boot
    @internal
     */
    live('up:framework:booted', snapshot);
    live('up:framework:reset', restoreSnapshot);
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      on: live,
      off: unbind,
      emit: emit,
      nobodyPrevents: nobodyPrevents,
      whenEmitted: whenEmitted,
      onEscape: onEscape,
      emitReset: emitReset,
      haltEvent: haltEvent,
      consumeAction: consumeAction,
      boot: boot
    };
  })(jQuery);

  up.on = up.bus.on;

  up.off = up.bus.off;

  up.emit = up.bus.emit;

  up.reset = up.bus.emitReset;

  up.boot = up.bus.boot;

}).call(this);

/**
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
    var SESSION_KEY_ENABLED, b, config, debug, disable, enable, error, group, prefix, printBanner, puts, reset, setEnabled, u, warn;
    u = up.util;
    b = up.browser;
    SESSION_KEY_ENABLED = 'up.log.enabled';

    /**
    Configures the logging output on the developer console.
    
    @property up.log.config
    @param {Boolean} [options.enabled=false]
      Whether Unpoly will print debugging information to the developer console.
    
      Debugging information includes which elements are being [compiled](/up.syntax)
      and which [events](/up.bus) are being emitted.
      Note that errors will always be printed, regardless of this setting.
    @param {Boolean} [options.collapse=false]
      Whether debugging information is printed as a collapsed tree.
    
      Set this to `true` if you are overwhelmed by the debugging information Unpoly
      prints to the developer console.
    @param {String} [options.prefix='[UP] ']
      A string to prepend to Unpoly's logging messages so you can distinguish it from your own messages.
    @stable
     */
    config = u.config({
      prefix: '[UP] ',
      enabled: b.sessionStorage().getItem(SESSION_KEY_ENABLED) === 'true',
      collapse: false
    });
    reset = function() {
      return config.reset();
    };
    prefix = function(message) {
      return "" + config.prefix + message;
    };

    /**
    Prints a debugging message to the browser console.
    
    @function up.log.debug
    @param {String} message
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

    /**
    Prints a logging message to the browser console.
    
    @function up.puts
    @param {String} message
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

    /**
    @function up.log.warn
    @internal
     */
    warn = function() {
      var args, message;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (message) {
        return b.puts.apply(b, ['warn', prefix(message)].concat(slice.call(args)));
      }
    };

    /**
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

    /**
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
      b.sessionStorage().setItem(SESSION_KEY_ENABLED, value.toString());
      return config.enabled = value;
    };

    /**
    Makes future Unpoly events print vast amounts of debugging information to the developer console.
    
    Debugging information includes which elements are being [compiled](/up.syntax)
    and which [events](/up.bus) are being emitted.
    
    @function up.log.enable
    @stable
     */
    enable = function() {
      return setEnabled(true);
    };

    /**
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

}).call(this);

/**
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

/**
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
    var DESTRUCTIBLE_CLASS, DESTRUCTORS_KEY, addDestructor, applyCompiler, buildCompiler, clean, compile, compiler, compilers, data, discoverDestructors, insertCompiler, macro, macros, reset, snapshot, u;
    u = up.util;
    DESTRUCTIBLE_CLASS = 'up-destructible';
    DESTRUCTORS_KEY = 'up-destructors';
    compilers = [];
    macros = [];

    /**
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
    
        <div class="google-map" up-data="[
          { lat: 48.36, lng: 10.99, title: 'Friedberg' },
          { lat: 48.75, lng: 11.45, title: 'Ingolstadt' }
        ]"></div>
    
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
    @param {String} selector
      The selector to match.
    @param {Number} [options.priority=0]
      The priority of this compilers.
      Compilers with a higher priority are run first.
      Two compilers with the same priority are run in the order they were registered.
    @param {Boolean} [options.batch=false]
      If set to `true` and a fragment insertion contains multiple
      elements matching the selector, `compiler` is only called once
      with a jQuery collection containing all matching elements. 
    @param {Boolean} [options.keep=false]
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
    
      The function may also return an array of destructor functions.
    @stable
     */
    compiler = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return insertCompiler.apply(null, [compilers].concat(slice.call(args)));
    };

    /**
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
    
    Examples for built-in macros are [`up-dash`](/up-dash) and [`up-expand`](/up-expand).
    
    @function up.macro
    @param {String} selector
      The selector to match.
    @param {Object} options
      See options for [`up.compiler()`](/up.compiler).
    @param {Function($element, data)} compiler
      The function to call when a matching element is inserted.
      See [`up.compiler()`](/up.compiler) for details.
    @stable
     */
    macro = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return insertCompiler.apply(null, [macros].concat(slice.call(args)));
    };
    buildCompiler = function() {
      var args, callback, options, selector;
      selector = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      callback = args.pop();
      options = u.options(args[0], {
        priority: 0
      });
      if (options.priority === 'first') {
        options.priority = Number.POSITIVE_INFINITY;
      } else if (options.priority === 'last') {
        options.priority = Number.NEGATIVE_INFINITY;
      }
      return {
        selector: selector,
        callback: callback,
        priority: options.priority,
        batch: options.batch,
        keep: options.keep
      };
    };
    insertCompiler = function() {
      var args, index, newCompiler, oldCompiler, queue;
      queue = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!up.browser.isSupported()) {
        return;
      }
      newCompiler = buildCompiler.apply(null, args);
      index = 0;
      while ((oldCompiler = queue[index]) && (oldCompiler.priority >= newCompiler.priority)) {
        index += 1;
      }
      return queue.splice(index, 0, newCompiler);
    };
    applyCompiler = function(compiler, $jqueryElement, nativeElement) {
      var destructor, i, len, ref, results, returnValue, value;
      up.puts((!compiler.isDefault ? "Compiling '%s' on %o" : void 0), compiler.selector, nativeElement);
      if (compiler.keep) {
        value = u.isString(compiler.keep) ? compiler.keep : '';
        $jqueryElement.attr('up-keep', value);
      }
      returnValue = compiler.callback.apply(nativeElement, [$jqueryElement, data($jqueryElement)]);
      ref = discoverDestructors(returnValue);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        destructor = ref[i];
        results.push(addDestructor($jqueryElement, destructor));
      }
      return results;
    };
    discoverDestructors = function(returnValue) {
      if (u.isFunction(returnValue)) {
        return [returnValue];
      } else if (u.isArray(returnValue) && u.all(returnValue, u.isFunction)) {
        return returnValue;
      } else {
        return [];
      }
    };
    addDestructor = function($jqueryElement, destructor) {
      var destructors;
      $jqueryElement.addClass(DESTRUCTIBLE_CLASS);
      destructors = $jqueryElement.data(DESTRUCTORS_KEY) || [];
      destructors.push(destructor);
      return $jqueryElement.data(DESTRUCTORS_KEY, destructors);
    };

    /**
    Applies all compilers on the given element and its descendants.
    Unlike [`up.hello()`](/up.hello), this doesn't emit any events.
    
    @function up.syntax.compile
    @param {Array<Element>} [options.skip]
      A list of elements whose subtrees should not be compiled.
    @internal
     */
    compile = function($fragment, options) {
      var $skipSubtrees;
      options = u.options(options);
      $skipSubtrees = $(options.skip);
      return up.log.group("Compiling fragment %o", $fragment.get(0), function() {
        var $matches, i, len, queue, ref, results;
        ref = [macros, compilers];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          queue = ref[i];
          results.push((function() {
            var j, len1, results1;
            results1 = [];
            for (j = 0, len1 = queue.length; j < len1; j++) {
              compiler = queue[j];
              $matches = u.findWithSelf($fragment, compiler.selector);
              $matches = $matches.filter(function() {
                var $match;
                $match = $(this);
                return u.all($skipSubtrees, function(element) {
                  return $match.closest(element).length === 0;
                });
              });
              if ($matches.length) {
                results1.push(up.log.group((!compiler.isDefault ? "Compiling '%s' on %d element(s)" : void 0), compiler.selector, $matches.length, function() {
                  if (compiler.batch) {
                    return applyCompiler(compiler, $matches, $matches.get());
                  } else {
                    return $matches.each(function() {
                      return applyCompiler(compiler, $(this), this);
                    });
                  }
                }));
              } else {
                results1.push(void 0);
              }
            }
            return results1;
          })());
        }
        return results;
      });
    };

    /**
    Runs any destroyers on the given fragment and its descendants.
    Unlike [`up.destroy()`](/up.destroy), this doesn't emit any events
    and does not remove the element from the DOM.
    
    @function up.syntax.clean
    @internal
     */
    clean = function($fragment) {
      return u.findWithSelf($fragment, "." + DESTRUCTIBLE_CLASS).each(function() {
        var $element, destructor, destructors, i, len;
        $element = $(this);
        destructors = $element.data(DESTRUCTORS_KEY);
        if (destructors) {
          for (i = 0, len = destructors.length; i < len; i++) {
            destructor = destructors[i];
            destructor();
          }
          $element.removeData(DESTRUCTORS_KEY);
          return $element.removeClass(DESTRUCTIBLE_CLASS);
        }
      });
    };

    /**
    Checks if the given element has an [`up-data`](/up-data) attribute.
    If yes, parses the attribute value as JSON and returns the parsed object.
    
    Returns an empty object if the element has no `up-data` attribute.
    
    \#\#\# Example
    
    You have an element with JSON data serialized into an `up-data` attribute:
    
        <span class="person" up-data="{ age: 18, name: 'Bob' }">Bob</span>
    
    Calling `up.syntax.data()` will deserialize the JSON string into a JavaScript object:
    
        up.syntax.data('.person') // returns { age: 18, name: 'Bob' }
    
    @function up.syntax.data
    @param {String|Element|jQuery} elementOrSelector
    @return
      The JSON-decoded value of the `up-data` attribute.
    
      Returns an empty object (`{}`) if the element has no (or an empty) `up-data` attribute.
    @stable
     */

    /**
    If an element annotated with [`up-data`] is inserted into the DOM,
    Up will parse the JSON and pass the resulting object to any matching
    [`up.compiler()`](/up.compiler) handlers.
    
    For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
    might attach the location and names of its marker pins:
    
        <div class="google-map" up-data="[
          { lat: 48.36, lng: 10.99, title: 'Friedberg' },
          { lat: 48.75, lng: 11.45, title: 'Ingolstadt' }
        ]"></div>
    
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
    data = function(elementOrSelector) {
      var $element, json;
      $element = $(elementOrSelector);
      json = $element.attr('up-data');
      if (u.isString(json) && u.trim(json) !== '') {
        return JSON.parse(json);
      } else {
        return {};
      }
    };

    /**
    Makes a snapshot of the currently registered event listeners,
    to later be restored through `reset`.
    
    @internal
     */
    snapshot = function() {
      var setDefault;
      setDefault = function(compiler) {
        return compiler.isDefault = true;
      };
      u.each(compilers, setDefault);
      return u.each(macros, setDefault);
    };

    /**
    Resets the list of registered compiler directives to the
    moment when the framework was booted.
    
    @internal
     */
    reset = function() {
      var isDefault;
      isDefault = function(compiler) {
        return compiler.isDefault;
      };
      compilers = u.select(compilers, isDefault);
      return macros = u.select(macros, isDefault);
    };
    up.on('up:framework:booted', snapshot);
    up.on('up:framework:reset', reset);
    return {
      compiler: compiler,
      macro: macro,
      compile: compile,
      clean: clean,
      data: data
    };
  })(jQuery);

  up.compiler = up.syntax.compiler;

  up.macro = up.syntax.macro;

}).call(this);

/**
Browser history
===============
  
\#\#\# Incomplete documentation!
  
We need to work on this page:

- Explain how the other modules manipulate history
- Decide whether we want to expose these methods as public API
- Document methods and parameters

@class up.history
 */

(function() {
  up.history = (function($) {
    var buildState, config, currentUrl, isCurrentUrl, manipulate, nextPreviousUrl, normalizeUrl, observeNewUrl, pop, previousUrl, push, register, replace, reset, restoreStateOnPop, u;
    u = up.util;

    /**
    @property up.history.config
    @param {Array} [config.popTargets=['body']]
      An array of CSS selectors to replace when the user goes
      back in history.
    @param {Boolean} [config.restoreScroll=true]
      Whether to restore the known scroll positions
      when the user goes back or forward in history.
    @stable
     */
    config = u.config({
      popTargets: ['body'],
      restoreScroll: true
    });

    /**
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
    normalizeUrl = function(url) {
      return u.normalizeUrl(url, {
        hash: true
      });
    };

    /**
    Returns a normalized URL for the current history entry.
    
    @function up.history.url
    @experimental
     */
    currentUrl = function() {
      return normalizeUrl(up.browser.url());
    };
    isCurrentUrl = function(url) {
      return normalizeUrl(url) === currentUrl();
    };
    observeNewUrl = function(url) {
      if (nextPreviousUrl) {
        previousUrl = nextPreviousUrl;
        nextPreviousUrl = void 0;
      }
      return nextPreviousUrl = url;
    };

    /**
    Replaces the current history entry and updates the
    browser's location bar with the given URL.
    
    When the user navigates to the replaced history entry at a later time,
    Unpoly will [`replace`](/up.replace) the document body with
    the body from that URL.
    
    Note that functions like [`up.replace()`](/up.replace) or
    [`up.submit()`](/up.submit) will automatically update the
    browser's location bar for you.
    
    @function up.history.replace
    @param {String} url
    @experimental
     */
    replace = function(url) {
      return manipulate('replaceState', url);
    };

    /**
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
    @param {String} url
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
        manipulate('pushState', url);
        return up.emit('up:history:pushed', {
          url: url,
          message: "Advanced to location " + url
        });
      }
    };

    /**
    This event is [emitted](/up.emit) before a new history entry is added.
    
    @event up:history:push
    @param {String} event.url
      The URL for the history entry that is going to be added.
    @param event.preventDefault()
      Event listeners may call this method to prevent the history entry from being added.
    @experimental
     */

    /**
    This event is [emitted](/up.emit) after a new history entry has been added.
    
    @event up:history:pushed
    @param {String} event.url
      The URL for the history entry that has been added.
    @experimental
     */
    manipulate = function(method, url) {
      var state;
      if (up.browser.canPushState()) {
        state = buildState();
        window.history[method](state, '', url);
        return observeNewUrl(currentUrl());
      } else {
        return up.fail("This browser doesn't support history." + method);
      }
    };
    buildState = function() {
      return {
        fromUp: true
      };
    };
    restoreStateOnPop = function(state) {
      var url;
      if (state != null ? state.fromUp : void 0) {
        url = currentUrl();
        return up.log.group("Restoring URL %s", url, function() {
          var popSelector;
          popSelector = config.popTargets.join(', ');
          return up.replace(popSelector, url, {
            history: false,
            title: true,
            reveal: false,
            transition: 'none',
            saveScroll: false,
            restoreScroll: config.restoreScroll
          });
        });
      } else {
        return up.puts('Ignoring a state not pushed by Unpoly (%o)', state);
      }
    };
    pop = function(event) {
      var state, url;
      observeNewUrl(currentUrl());
      up.layout.saveScroll({
        url: previousUrl
      });
      state = event.originalEvent.state;
      restoreStateOnPop(state);
      url = currentUrl();
      return up.emit('up:history:restored', {
        url: url,
        message: "Restored location " + url
      });
    };

    /**
    This event is [emitted](/up.emit) after a history entry has been restored.
    
    History entries are restored when the user uses the *Back* or *Forward* button.
    
    @event up:history:restored
    @param {String} event.url
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

    /**
    Changes the link's destination so it points to the previous URL.
    
    Note that this will *not* call `location.back()`, but will set
    the link's `up-href` attribute to the actual, previous URL.
    
    \#\#\# Under the hood
    
    This link ...
    
        <a href="/default" up-back>
          Go back
        </a>
    
    ... will be transformed to:
    
        <a href="/default" up-href="/previous-page" up-restore-scroll up-follow>
          Goback
        </a>
    
    @selector [up-back]
    @stable
     */
    up.compiler('[up-back]', function($link) {
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
      previousUrl: function() {
        return previousUrl;
      },
      normalizeUrl: normalizeUrl
    };
  })(jQuery);

}).call(this);

/**
Application layout
==================

You can [make Unpoly aware](/up.layout.config) of fixed elements in your
layout, such as navigation bars or headers. Unpoly will respect these sticky
elements when [revealing elements](/up.reveal) or [opening a modal dialog](/up-modal).

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
    var SCROLL_PROMISE_KEY, anchoredRight, config, finishScrolling, fixedChildren, lastScrollTops, measureObstruction, reset, restoreScroll, reveal, revealOrRestoreScroll, saveScroll, scroll, scrollTops, u, viewportOf, viewportSelector, viewports, viewportsWithin;
    u = up.util;

    /**
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
    @param {Number} [config.duration=0]
      The duration of the scrolling animation in milliseconds.
      Setting this to `0` will disable scrolling animations.
    @param {String} [config.easing='swing']
      The timing function that controls the animation's acceleration.
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @param {Number} [config.snap=50]
      When [revealing](/up.reveal) elements, Unpoly will scroll an viewport
      to the top when the revealed element is closer to the top than `config.snap`.
    @param {Number} [config.substance=150]
      A number indicating how many top pixel rows of an element to [reveal](/up.reveal).
    @stable
     */
    config = u.config({
      duration: 0,
      viewports: [document, '.up-modal-viewport', '[up-viewport]'],
      fixedTop: ['[up-fixed~=top]'],
      fixedBottom: ['[up-fixed~=bottom]'],
      anchoredRight: ['[up-anchored~=right]', '[up-fixed~=top]', '[up-fixed~=bottom]', '[up-fixed~=right]'],
      snap: 50,
      substance: 150,
      easing: 'swing'
    });
    lastScrollTops = u.cache({
      size: 30,
      key: up.history.normalizeUrl
    });
    reset = function() {
      config.reset();
      return lastScrollTops.clear();
    };
    SCROLL_PROMISE_KEY = 'up-scroll-promise';

    /**
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
    @param {String|Element|jQuery} viewport
      The container element to scroll.
    @param {Number} scrollPos
      The absolute number of pixels to set the scroll position to.
    @param {Number}[options.duration]
      The number of miliseconds for the scrolling's animation.
    @param {String}[options.easing]
      The timing function that controls the acceleration for the scrolling's animation.
    @return {Deferred}
      A promise that will be resolved when the scrolling ends.
    @experimental
     */
    scroll = function(viewport, scrollTop, options) {
      var $viewport, deferred, duration, easing, targetProps;
      $viewport = $(viewport);
      options = u.options(options);
      duration = u.option(options.duration, config.duration);
      easing = u.option(options.easing, config.easing);
      finishScrolling($viewport);
      if (duration > 0) {
        deferred = $.Deferred();
        $viewport.data(SCROLL_PROMISE_KEY, deferred);
        deferred.then(function() {
          $viewport.removeData(SCROLL_PROMISE_KEY);
          return $viewport.finish();
        });
        targetProps = {
          scrollTop: scrollTop
        };
        if ($viewport.get(0) === document) {
          $viewport = $('html, body');
        }
        $viewport.animate(targetProps, {
          duration: duration,
          easing: easing,
          complete: function() {
            return deferred.resolve();
          }
        });
        return deferred;
      } else {
        $viewport.scrollTop(scrollTop);
        return u.resolvedDeferred();
      }
    };

    /**
    @function up.layout.finishScrolling
    @param {String|Element|jQuery}
      The element that might currently be scrolling.
    @internal
     */
    finishScrolling = function(elementOrSelector) {
      return $(elementOrSelector).each(function() {
        var existingScrolling;
        if (existingScrolling = $(this).data(SCROLL_PROMISE_KEY)) {
          return existingScrolling.resolve();
        }
      });
    };

    /**
    @function up.layout.anchoredRight
    @internal
     */
    anchoredRight = function() {
      return u.multiSelector(config.anchoredRight).select();
    };
    measureObstruction = function() {
      var fixedBottomTops, fixedTopBottoms, measurePosition, obstructor;
      measurePosition = function(obstructor, cssAttr) {
        var $obstructor, anchorPosition;
        $obstructor = $(obstructor);
        anchorPosition = $obstructor.css(cssAttr);
        if (!u.isPresent(anchorPosition)) {
          up.fail("Fixed element %o must have a CSS attribute %s", $obstructor.get(0), cssAttr);
        }
        return parseFloat(anchorPosition) + $obstructor.height();
      };
      fixedTopBottoms = (function() {
        var i, len, ref, results;
        ref = $(config.fixedTop.join(', '));
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          obstructor = ref[i];
          results.push(measurePosition(obstructor, 'top'));
        }
        return results;
      })();
      fixedBottomTops = (function() {
        var i, len, ref, results;
        ref = $(config.fixedBottom.join(', '));
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          obstructor = ref[i];
          results.push(measurePosition(obstructor, 'bottom'));
        }
        return results;
      })();
      return {
        top: Math.max.apply(Math, [0].concat(slice.call(fixedTopBottoms))),
        bottom: Math.max.apply(Math, [0].concat(slice.call(fixedBottomTops)))
      };
    };

    /**
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
    @param {String|Element|jQuery} element
    @param {Number} [options.duration]
    @param {String} [options.easing]
    @param {String} [options.snap]
    @param {String|Element|jQuery} [options.viewport]
    @param {Boolean} [options.top=false]
      Whether to scroll the viewport so that the first element row aligns
      with the top edge of the viewport.
    @return {Deferred}
      A promise that will be resolved when the element is revealed.
    @stable
     */
    reveal = function(elementOrSelector, options) {
      var $element, $viewport, elementDims, firstElementRow, lastElementRow, newScrollPos, obstruction, offsetShift, originalScrollPos, predictFirstVisibleRow, predictLastVisibleRow, snap, viewportHeight, viewportIsDocument;
      $element = $(elementOrSelector);
      up.puts('Revealing fragment %o', elementOrSelector.get(0));
      options = u.options(options);
      $viewport = options.viewport ? $(options.viewport) : viewportOf($element);
      snap = u.option(options.snap, config.snap);
      viewportIsDocument = $viewport.is(document);
      viewportHeight = viewportIsDocument ? u.clientSize().height : $viewport.outerHeight();
      originalScrollPos = $viewport.scrollTop();
      newScrollPos = originalScrollPos;
      offsetShift = void 0;
      obstruction = void 0;
      if (viewportIsDocument) {
        obstruction = measureObstruction();
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
        return newScrollPos + viewportHeight - obstruction.bottom - 1;
      };
      elementDims = u.measure($element, {
        relative: $viewport,
        includeMargin: true
      });
      firstElementRow = elementDims.top + offsetShift;
      lastElementRow = firstElementRow + Math.min(elementDims.height, config.substance) - 1;
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
        return u.resolvedDeferred();
      }
    };
    viewportSelector = function() {
      return u.multiSelector(config.viewports);
    };

    /**
    Returns the viewport for the given element.
    
    Throws an error if no viewport could be found.
    
    @function up.layout.viewportOf
    @param {String|Element|jQuery} selectorOrElement
    @internal
     */
    viewportOf = function(selectorOrElement, options) {
      var $element, $viewport;
      if (options == null) {
        options = {};
      }
      $element = $(selectorOrElement);
      $viewport = viewportSelector().seekUp($element);
      if ($viewport.length === 0 && options.strict !== false) {
        up.fail("Could not find viewport for %o", $element);
      }
      return $viewport;
    };

    /**
    Returns a jQuery collection of all the viewports contained within the
    given selector or element.
    
    @function up.layout.viewportsWithin
    @param {String|Element|jQuery} selectorOrElement
    @return jQuery
    @internal
     */
    viewportsWithin = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement);
      return viewportSelector().findWithSelf($element);
    };

    /**
    Returns a jQuery collection of all the viewports on the screen.
    
    @function up.layout.viewports
    @internal
     */
    viewports = function() {
      return viewportSelector().select();
    };

    /**
    Returns a hash with scroll positions.
    
    Each key in the hash is a viewport selector. The corresponding
    value is the viewport's top scroll position:
    
        up.layout.scrollTops()
        => { '.main': 0, '.sidebar': 73 }
    
    @function up.layout.scrollTops
    @return Object<String, Number>
    @internal
     */
    scrollTops = function() {
      var $viewport, i, key, len, ref, topsBySelector, viewport;
      topsBySelector = {};
      ref = config.viewports;
      for (i = 0, len = ref.length; i < len; i++) {
        viewport = ref[i];
        $viewport = $(viewport);
        if ($viewport.length) {
          key = viewport;
          if (viewport === document) {
            key = 'document';
          }
          topsBySelector[key] = $viewport.scrollTop();
        }
      }
      return topsBySelector;
    };

    /**
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

    /**
    Saves the top scroll positions of all the
    viewports configured in [`up.layout.config.viewports`](/up.layout.config).
    
    The scroll positions will be associated with the current URL.
    They can later be restored by calling [`up.layout.restoreScroll()`](/up.layout.restoreScroll)
    at the same URL.
    
    Unpoly automatically saves scroll positions whenever a fragment was updated on the page.
    
    @function up.layout.saveScroll
    @param {String} [options.url]
    @param {Object<String, Number>} [options.tops]
    @experimental
     */
    saveScroll = function(options) {
      var tops, url;
      if (options == null) {
        options = {};
      }
      url = u.option(options.url, up.history.url());
      tops = u.option(options.tops, scrollTops());
      up.puts('Saving scroll positions for URL %s (%o)', url, tops);
      return lastScrollTops.set(url, tops);
    };

    /**
    Restores [previously saved](/up.layout.saveScroll) scroll positions of viewports
    viewports configured in [`up.layout.config.viewports`](/up.layout.config).
    
    Unpoly automatically restores scroll positions when the user presses the back button.
    You can disable this behavior by setting [`up.history.config.restoreScroll = false`](/up.history.config).
    
    @function up.layout.restoreScroll
    @param {jQuery} [options.around]
      If set, only restores viewports that are either an ancestor
      or descendant of the given element.
    @experimental
     */
    restoreScroll = function(options) {
      var $ancestorViewports, $descendantViewports, $viewports, tops, url;
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
      tops = lastScrollTops.get(url);
      return up.log.group('Restoring scroll positions for URL %s to %o', url, tops, function() {
        var $matchingViewport, key, right, scrollTop;
        for (key in tops) {
          scrollTop = tops[key];
          right = key === 'document' ? document : key;
          $matchingViewport = $viewports.filter(right);
          scroll($matchingViewport, scrollTop, {
            duration: 0
          });
        }
        return u.resolvedDeferred();
      });
    };

    /**
    @function up.layout.revealOrRestoreScroll
    @return {Deferred}
      A promise for when the revealing or scroll restoration ends
    @internal
     */
    revealOrRestoreScroll = function(selectorOrElement, options) {
      var $element, $target, id, parsed, revealOptions;
      $element = $(selectorOrElement);
      if (options.restoreScroll) {
        return restoreScroll({
          around: $element
        });
      } else if (options.reveal) {
        revealOptions = {};
        if (options.source) {
          parsed = u.parseUrl(options.source);
          if (parsed.hash && parsed.hash !== '#') {
            id = parsed.hash.substr(1);
            $target = u.findWithSelf($element, "#" + id + ", a[name='" + id + "']");
            if ($target.length) {
              $element = $target;
              revealOptions.top = true;
            }
          }
        }
        return reveal($element, revealOptions);
      } else {
        return u.resolvedDeferred();
      }
    };

    /**
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

    /**
    Marks this element as being fixed to the top edge of the screen
    using `position: fixed`.
    
    When [following a fragment link](/a-up-target), the viewport is scrolled
    so the targeted element becomes visible. By using this attribute you can make
    Unpoly aware of fixed elements that are obstructing the viewport contents.
    Unpoly will then scroll the viewport far enough that the revealed element is fully visible.
    
    Instead of using this attribute,
    you can also configure a selector in [`up.layout.config.fixedTop`](/up.layout.config#fixedTop).
    
    \#\#\# Example
    
        <div class="top-nav" up-fixed="top">...</div>
    
    @selector [up-fixed=top]
    @stable
     */

    /**
    Marks this element as being fixed to the bottom edge of the screen
    using `position: fixed`.
    
    When [following a fragment link](/a-up-target), the viewport is scrolled
    so the targeted element becomes visible. By using this attribute you can make
    Unpoly aware of fixed elements that are obstructing the viewport contents.
    Unpoly will then scroll the viewport far enough that the revealed element is fully visible.
    
    Instead of using this attribute,
    you can also configure a selector in [`up.layout.config.fixedBottom`](/up.layout.config#fixedBottom).
    
    \#\#\# Example
    
        <div class="bottom-nav" up-fixed="bottom">...</div>
    
    @selector [up-fixed=bottom]
    @stable
     */

    /**
    Marks this element as being anchored to the right edge of the screen,
    typically fixed navigation bars.
    
    Since [modal dialogs](/up.modal) hide the document scroll bar,
    elements anchored to the right appear to jump when the dialog opens or
    closes. Applying this attribute to anchored elements will make Unpoly
    aware of the issue and adjust the `right` property accordingly.
    
    You should give this attribute to layout elements
    with a CSS of `right: 0` with `position: fixed` or `position:absolute`.
    
    Instead of giving this attribute to any affected element,
    you can also configure a selector in [`up.layout.config.anchoredRight`](/up.layout.config#anchoredRight).
    
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
    up.on('up:framework:reset', reset);
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      reveal: reveal,
      scroll: scroll,
      finishScrolling: finishScrolling,
      config: config,
      viewportOf: viewportOf,
      viewportsWithin: viewportsWithin,
      viewports: viewports,
      scrollTops: scrollTops,
      saveScroll: saveScroll,
      restoreScroll: restoreScroll,
      revealOrRestoreScroll: revealOrRestoreScroll,
      anchoredRight: anchoredRight,
      fixedChildren: fixedChildren
    };
  })(jQuery);

  up.scroll = up.layout.scroll;

  up.reveal = up.layout.reveal;

}).call(this);

/**
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
    var autofocus, bestMatchingSteps, bestPreflightSelector, config, destroy, emitFragmentInserted, emitFragmentKept, extract, filterScripts, findKeepPlan, first, firstInLayer, firstInPriority, hello, isRealElement, layerOf, matchesLayer, parseResponse, processResponse, reload, replace, reset, resolveSelector, setSource, shouldExtractTitle, source, swapBody, swapElements, transferKeepableElements, u, updateHistoryAndTitle;
    u = up.util;

    /**
    Configures defaults for fragment insertion.
    
    @property up.dom.config
    @param {Boolean} [options.runInlineScripts=true]
      Whether inline `<script>` tags inside inserted HTML fragments will be executed.
    @param {Boolean} [options.runLinkedScripts=false]
      Whether `<script src='...'>` tags inside inserted HTML fragments will fetch and execute
      the linked JavaScript file.
    @param {String} [options.fallbacks=['body']]
      When a fragment updates cannot find the requested element, Unpoly will try this list of alternative selectors.
      The first selector that matches an element in the current page (or response) will be used.
    @param {String} [options.fallbackTransition='none']
      The transition to use when using a fallback target.
    @stable
     */
    config = u.config({
      fallbacks: ['body'],
      fallbackTransition: 'none',
      runInlineScripts: true,
      runLinkedScripts: false
    });
    reset = function() {
      return config.reset();
    };
    setSource = function(element, sourceUrl) {
      var $element;
      $element = $(element);
      if (u.isPresent(sourceUrl)) {
        sourceUrl = u.normalizeUrl(sourceUrl);
      }
      return $element.attr("up-source", sourceUrl);
    };

    /**
    Returns the URL the given element was retrieved from.
    
    @method up.dom.source
    @param {String|Element|jQuery} selectorOrElement
    @experimental
     */
    source = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement).closest('[up-source]');
      return u.presence($element.attr("up-source")) || up.browser.url();
    };

    /**
    Resolves the given selector (which might contain `&` references)
    to an absolute selector.
    
    @function up.dom.resolveSelector
    @param {String|Element|jQuery} selectorOrElement
    @param {String|Element|jQuery} origin
      The element that this selector resolution is relative to.
      That element's selector will be substituted for `&`.
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

    /**
    Replaces elements on the current page with corresponding elements
    from a new page fetched from the server.
    
    The current and new elements must both match the given CSS selector.
    
    The UJS variant of this is the [`a[up-target]`](/a-up-target) selector.
    
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
    @param {String|Element|jQuery} selectorOrElement
      The CSS selector to update. You can also pass a DOM element or jQuery element
      here, in which case a selector will be inferred from the element's class and ID.
    @param {String} url
      The URL to fetch from the server.
    @param {String} [options.failTarget='body']
      The CSS selector to update if the server sends a non-200 status code.
    @param {String} [options.fallback]
      The selector to update when the original target was not found in the page.
    @param {String} [options.title]
      The document title after the replacement.
    
      If the call pushes an history entry and this option is missing, the title is extracted from the response's `<title>` tag.
      You can also pass `false` to explicitly prevent the title from being updated.
    @param {String} [options.method='get']
      The HTTP method to use for the request.
    @param {Object|Array} [options.data]
      Parameters that should be sent as the request's payload.
    
      Parameters can either be passed as an object (where the property names become
      the param names and the property values become the param values) or as
      an array of `{ name: 'param-name', value: 'param-value' }` objects
      (compare to jQuery's [`serializeArray`](https://api.jquery.com/serializeArray/)).
    @param {String} [options.transition='none']
    @param {String|Boolean} [options.history=true]
      If a `String` is given, it is used as the URL the browser's location bar and history.
      If omitted or true, the `url` argument will be used.
      If set to `false`, the history will remain unchanged.
    @param {String|Boolean} [options.source=true]
    @param {String} [options.reveal=false]
      Whether to [reveal](/up.reveal) the element being updated, by
      scrolling its containing viewport.
    @param {Boolean} [options.restoreScroll=false]
      If set to true, Unpoly will try to restore the scroll position
      of all the viewports around or below the updated element. The position
      will be reset to the last known top position before a previous
      history change for the current URL.
    @param {Boolean} [options.cache]
      Whether to use a [cached response](/up.proxy) if available.
    @param {String} [options.historyMethod='push']
    @param {Object} [options.headers={}]
      An object of additional header key/value pairs to send along
      with the request.
    @param {Boolean} [options.requireMatch=true]
      Whether to raise an error if the given selector is missing in
      either the current page or in the response.
    @param {Element|jQuery} [options.origin]
      The element that triggered the replacement.
    
      The element's selector will be substituted for the `&` shorthand in the target selector.
    @param {String} [options.layer='auto']
      The name of the layer that ought to be updated. Valid values are
      `auto`, `page`, `modal` and `popup`.
    
      If set to `auto` (default), Unpoly will try to find a match in the
      same layer as the element that triggered the replacement (see `options.origin`).
      If that element is not known, or no match was found in that layer,
      Unpoly will search in other layers, starting from the topmost layer.
    
    @return {Promise}
      A promise that will be resolved when the page has been updated.
    @stable
     */
    replace = function(selectorOrElement, url, options) {
      var failTarget, failureOptions, onFailure, onSuccess, promise, request, successOptions, target;
      options = u.options(options);
      if (!up.browser.canPushState() && options.history !== false) {
        if (!options.preload) {
          up.browser.loadPage(url, u.only(options, 'method', 'data'));
        }
        return u.unresolvablePromise();
      }
      options.inspectResponse = function() {
        return up.browser.loadPage(url, u.only(options, 'method', 'data'));
      };
      successOptions = u.merge(options, {
        humanizedTarget: 'target'
      });
      failureOptions = u.merge(options, {
        humanizedTarget: 'failure target',
        provideTarget: void 0
      });
      target = bestPreflightSelector(selectorOrElement, successOptions);
      failTarget = bestPreflightSelector(options.failTarget, failureOptions);
      request = {
        url: url,
        method: options.method,
        data: options.data,
        target: target,
        failTarget: failTarget,
        cache: options.cache,
        preload: options.preload,
        headers: options.headers,
        timeout: options.timeout
      };
      onSuccess = function(html, textStatus, xhr) {
        return processResponse(true, target, url, request, xhr, successOptions);
      };
      onFailure = function(xhr, textStatus, errorThrown) {
        var promise, rejection;
        rejection = function() {
          return u.rejectedPromise(xhr, textStatus, errorThrown);
        };
        if (xhr.responseText) {
          promise = processResponse(false, failTarget, url, request, xhr, failureOptions);
          return promise.then(rejection, rejection);
        } else {
          return rejection();
        }
      };
      promise = up.ajax(request);
      promise = promise.then(onSuccess, onFailure);
      return promise;
    };

    /**
    @internal
     */
    processResponse = function(isSuccess, selector, url, request, xhr, options) {
      var isReloadable, newRequest, query, titleFromXhr, urlFromServer;
      options.method = u.normalizeMethod(u.option(u.methodFromXhr(xhr), options.method));
      isReloadable = options.method === 'GET';
      if (urlFromServer = u.locationFromXhr(xhr)) {
        url = urlFromServer;
        if (isSuccess && up.proxy.isCachable(request)) {
          newRequest = {
            url: url,
            method: u.methodFromXhr(xhr),
            target: selector
          };
          up.proxy.alias(request, newRequest);
        }
      } else if (isReloadable) {
        if (query = u.requestDataAsQuery(options.data)) {
          url = url + "?" + query;
        }
      }
      if (isSuccess) {
        if (isReloadable) {
          if (!(options.history === false || u.isString(options.history))) {
            options.history = url;
          }
          if (!(options.source === false || u.isString(options.source))) {
            options.source = url;
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
        options.transition = options.failTransition;
        options.failTransition = void 0;
        if (isReloadable) {
          if (options.history !== false) {
            options.history = url;
          }
          if (options.source !== false) {
            options.source = url;
          }
        } else {
          options.source = 'keep';
          options.history = false;
        }
      }
      if (shouldExtractTitle(options) && (titleFromXhr = u.titleFromXhr(xhr))) {
        options.title = titleFromXhr;
      }
      if (options.preload) {
        return u.resolvedPromise();
      } else {
        return extract(selector, xhr.responseText, options);
      }
    };
    shouldExtractTitle = function(options) {
      return !(options.title === false || u.isString(options.title) || (options.history === false && options.title !== true));
    };

    /**
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
    @param {String|Element|jQuery} selectorOrElement
    @param {String} html
    @param {Object} [options]
      See options for [`up.replace()`](/up.replace).
    @return {Promise}
      A promise that will be resolved then the selector was updated
      and all animation has finished.
    @stable
     */
    extract = function(selectorOrElement, html, options) {
      return up.log.group('Extracting %s from %d bytes of HTML', selectorOrElement, html != null ? html.length : void 0, function() {
        var i, implantSteps, len, response, responseTitle, step, swapPromises;
        options = u.options(options, {
          historyMethod: 'push',
          requireMatch: true,
          keep: true,
          layer: 'auto'
        });
        if (options.saveScroll !== false) {
          up.layout.saveScroll();
        }
        if (typeof options.provideTarget === "function") {
          options.provideTarget();
        }
        response = parseResponse(html);
        implantSteps = bestMatchingSteps(selectorOrElement, response, options);
        if (shouldExtractTitle(options) && (responseTitle = response.title())) {
          options.title = responseTitle;
        }
        updateHistoryAndTitle(options);
        swapPromises = [];
        for (i = 0, len = implantSteps.length; i < len; i++) {
          step = implantSteps[i];
          up.log.group('Updating %s', step.selector, function() {
            var swapPromise;
            filterScripts(step.$new, options);
            swapPromise = swapElements(step.$old, step.$new, step.pseudoClass, step.transition, options);
            swapPromises.push(swapPromise);
            return options.reveal = false;
          });
        }
        return $.when.apply($, swapPromises);
      });
    };
    bestPreflightSelector = function(selector, options) {
      var cascade;
      cascade = new up.dom.ExtractCascade(selector, options);
      return cascade.bestPreflightSelector();
    };
    bestMatchingSteps = function(selector, response, options) {
      var cascade;
      options = u.merge(options, {
        response: response
      });
      cascade = new up.dom.ExtractCascade(selector, options);
      return cascade.bestMatchingSteps();
    };
    filterScripts = function($element, options) {
      var $script, $scripts, i, isInline, isLinked, len, results, runInlineScripts, runLinkedScripts, script;
      runInlineScripts = u.option(options.runInlineScripts, config.runInlineScripts);
      runLinkedScripts = u.option(options.runLinkedScripts, config.runLinkedScripts);
      $scripts = u.findWithSelf($element, 'script');
      results = [];
      for (i = 0, len = $scripts.length; i < len; i++) {
        script = $scripts[i];
        $script = $(script);
        isLinked = u.isPresent($script.attr('src'));
        isInline = !isLinked;
        if (!((isLinked && runLinkedScripts) || (isInline && runInlineScripts))) {
          results.push($script.remove());
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    parseResponse = function(html) {
      var htmlElement;
      htmlElement = u.createElementFromHtml(html);
      return {
        title: function() {
          var ref;
          return (ref = htmlElement.querySelector("title")) != null ? ref.textContent : void 0;
        },
        first: function(selector) {
          var child;
          if (child = $.find(selector, htmlElement)[0]) {
            return $(child);
          }
        }
      };
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
      var $wrapper, keepPlan, promise, replacement;
      transition || (transition = 'none');
      if (options.source === 'keep') {
        options = u.merge(options, {
          source: source($old)
        });
      }
      up.motion.finish($old);
      if (pseudoClass) {
        $wrapper = $new.contents().wrapAll('<div class="up-insertion"></div>').parent();
        if (pseudoClass === 'before') {
          $old.prepend($wrapper);
        } else {
          $old.append($wrapper);
        }
        hello($wrapper.children(), options);
        promise = up.layout.revealOrRestoreScroll($wrapper, options);
        promise = promise.then(function() {
          return up.animate($wrapper, transition, options);
        });
        promise = promise.then(function() {
          return u.unwrapElement($wrapper);
        });
      } else if (keepPlan = findKeepPlan($old, $new, options)) {
        emitFragmentKept(keepPlan);
        promise = u.resolvedPromise();
      } else {
        replacement = function() {
          options.keepPlans = transferKeepableElements($old, $new, options);
          if ($old.is('body')) {
            swapBody($old, $new);
            transition = false;
          } else {
            $new.insertBefore($old);
          }
          if (options.source !== false) {
            setSource($new, options.source);
          }
          autofocus($new);
          hello($new, options);
          return up.morph($old, $new, transition, options);
        };
        promise = destroy($old, {
          animation: replacement
        });
      }
      return promise;
    };
    swapBody = function($oldBody, $newBody) {
      return $oldBody.replaceWith($newBody);
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
            up.util.detachWith($keepable, $keepableClone);
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
            $partner = u.findWithSelf($new, partnerSelector);
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

    /**
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

    /**
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
    @param {jqQuery} event.$newElement
      The discarded element.
    @param {jQuery} event.newData
      The value of the [`up-data`](/up-data) attribute of the discarded element,
      parsed as a JSON object.
    @stable
     */

    /**
    This event is [emitted](/up.emit) when an existing element has been [kept](/up-keep)
    during a page update.
    
    Event listeners can inspect the discarded update through `event.$newElement`
    and `event.newData` and then modify the preserved element when necessary.
    
    @event up:fragment:kept
    @param {jQuery} event.$element
      The fragment that has been kept.
    @param {jqQuery} event.$newElement
      The discarded element.
    @param {jQuery} event.newData
      The value of the [`up-data`](/up-data) attribute of the discarded element,
      parsed as a JSON object.
    @stable
     */

    /**
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
    @param {String|Element|jQuery} selectorOrElement
    @param {String|Element|jQuery} [options.origin]
    @param {String|Element|jQuery} [options.kept]
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
        keptElements.push(plan.$element);
      }
      up.syntax.compile($element, {
        skip: keptElements
      });
      emitFragmentInserted($element, options);
      return $element;
    };

    /**
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
    emitFragmentInserted = function(fragment, options) {
      var $fragment;
      $fragment = $(fragment);
      return up.emit('up:fragment:inserted', {
        $element: $fragment,
        message: ['Inserted fragment %o', $fragment.get(0)],
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
    autofocus = function($element) {
      var $control, selector;
      selector = '[autofocus]:last';
      $control = u.findWithSelf($element, selector);
      if ($control.length && $control.get(0) !== document.activeElement) {
        return $control.focus();
      }
    };
    isRealElement = function($element) {
      var unreal;
      unreal = '.up-ghost, .up-destroying';
      return $element.closest(unreal).length === 0;
    };

    /**
    Returns the first element matching the given selector, but
    ignores elements that are being [destroyed](/up.destroy) or [transitioned](/up.morph).
    
    If the given argument is already a jQuery collection (or an array
    of DOM elements), the first element matching these conditions
    is returned.
    
    Returns `undefined` if no element matches these conditions.
    
    @function up.first
    @param {String|Element|jQuery|Array<Element>} selectorOrElement
    @param {String} options.layer
      The name of the layer in which to find the element. Valid values are
      `auto`, `page`, `modal` and `popup`.
    @param {String|Element|jQuery} [options.origin]
      An second element or selector that can be referenced as `&` in the first selector:
    
          $input = $('input.email');
          up.first('.field:has(&)', $input); // returns the .field containing $input
    @return {jQuery|Undefined}
      The first element that is neither a ghost or being destroyed,
      or `undefined` if no such element was given.
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
    layerOf = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement);
      if (up.popup.contains($element)) {
        return 'popup';
      } else if (up.modal.contains($element)) {
        return 'modal';
      } else {
        return 'page';
      }
    };
    matchesLayer = function(selectorOrElement, layer) {
      return layerOf(selectorOrElement) === layer;
    };

    /**
    Destroys the given element or selector.
    
    Takes care that all [`up.compiler()`](/up.compiler) destructors, if any, are called.
    
    The element is removed from the DOM.
    Note that if you choose to animate the element removal using `options.animate`,
    the element won't be removed until after the animation has completed.
    
    Emits events [`up:fragment:destroy`](/up:fragment:destroy) and [`up:fragment:destroyed`](/up:fragment:destroyed).
    
    @function up.destroy
    @param {String|Element|jQuery} selectorOrElement 
    @param {String} [options.history]
      A URL that will be pushed as a new history entry when the element begins destruction.
    @param {String} [options.title]
      The document title to set when the element begins destruction.
    @param {String|Function} [options.animation='none']
      The animation to use before the element is removed from the DOM.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate()`](/up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate()`](/up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate()`](/up.animate).
    @return {Deferred}
      A promise that will be resolved once the element has been removed from the DOM.
    @stable
     */
    destroy = function(selectorOrElement, options) {
      var $element, animateOptions, animationDeferred, destroyMessage, destroyedMessage;
      $element = $(selectorOrElement);
      if (!$element.is('.up-placeholder, .up-tooltip, .up-modal, .up-popup')) {
        destroyMessage = ['Destroying fragment %o', $element.get(0)];
        destroyedMessage = ['Destroyed fragment %o', $element.get(0)];
      }
      if ($element.length === 0) {
        return u.resolvedDeferred();
      } else if (up.bus.nobodyPrevents('up:fragment:destroy', {
        $element: $element,
        message: destroyMessage
      })) {
        options = u.options(options, {
          animation: false
        });
        animateOptions = up.motion.animateOptions(options);
        $element.addClass('up-destroying');
        updateHistoryAndTitle(options);
        animationDeferred = u.presence(options.animation, u.isDeferred) || up.motion.animate($element, options.animation, animateOptions);
        animationDeferred.then(function() {
          up.syntax.clean($element);
          up.emit('up:fragment:destroyed', {
            $element: $element,
            message: destroyedMessage
          });
          return $element.remove();
        });
        return animationDeferred;
      } else {
        return $.Deferred();
      }
    };

    /**
    Before a page fragment is being [destroyed](/up.destroy), this
    event is [emitted](/up.emit) on the fragment.
    
    If the destruction is animated, this event is emitted before the
    animation begins.
    
    @event up:fragment:destroy
    @param {jQuery} event.$element
      The page fragment that is about to be destroyed.
    @param event.preventDefault()
      Event listeners may call this method to prevent the fragment from being destroyed.
    @stable
     */

    /**
    This event is [emitted](/up.emit) right before a [destroyed](/up.destroy)
    page fragment is removed from the DOM.
    
    If the destruction is animated, this event is emitted after
    the animation has ended.
    
    @event up:fragment:destroyed
    @param {jQuery} event.$element
      The page fragment that is about to be removed from the DOM.
    @stable
     */

    /**
    Replaces the given element with a fresh copy fetched from the server.
    
    \#\#\# Example
    
        up.on('new-mail', function() {
          up.reload('.inbox');
        });
    
    Unpoly remembers the URL from which a fragment was loaded, so you
    don't usually need to give an URL when reloading.
    
    @function up.reload
    @param {String|Element|jQuery} selectorOrElement
    @param {Object} [options]
      See options for [`up.replace()`](/up.replace)
    @param {String} [options.url]
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
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      replace: replace,
      reload: reload,
      destroy: destroy,
      extract: extract,
      first: first,
      source: source,
      resolveSelector: resolveSelector,
      hello: hello,
      config: config
    };
  })(jQuery);

  up.replace = up.dom.replace;

  up.extract = up.dom.extract;

  up.reload = up.dom.reload;

  up.destroy = up.dom.destroy;

  up.first = up.dom.first;

  up.hello = up.dom.hello;

  up.renamedModule('flow', 'dom');

}).call(this);
(function() {
  var u,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  u = up.util;

  up.dom.ExtractCascade = (function() {
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
      this.candidates = this.buildCandidates(selector);
      this.plans = u.map(this.candidates, (function(_this) {
        return function(candidate, i) {
          var planOptions;
          planOptions = u.copy(_this.options);
          if (i > 0) {
            planOptions.transition = up.dom.config.fallbackTransition;
          }
          return new up.dom.ExtractPlan(candidate, planOptions);
        };
      })(this));
    }

    ExtractCascade.prototype.buildCandidates = function(selector) {
      var candidates;
      candidates = [selector, this.options.fallback, up.dom.config.fallbacks];
      candidates = u.flatten(candidates);
      candidates = u.select(candidates, u.isTruthy);
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
        return this.plans[0].selector;
      } else if (plan = this.oldPlan()) {
        return plan.selector;
      } else {
        return this.oldPlanNotFound();
      }
    };

    ExtractCascade.prototype.bestMatchingSteps = function() {
      var plan;
      if (plan = this.matchingPlan()) {
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
        if (this.response && this.options.inspectResponse) {
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

  up.dom.ExtractPlan = (function() {
    function ExtractPlan(selector, options) {
      this.parseSteps = bind(this.parseSteps, this);
      this.matchExists = bind(this.matchExists, this);
      this.newExists = bind(this.newExists, this);
      this.oldExists = bind(this.oldExists, this);
      this.findNew = bind(this.findNew, this);
      this.findOld = bind(this.findOld, this);
      this.origin = options.origin;
      this.selector = up.dom.resolveSelector(selector, options.origin);
      this.transition = options.transition || options.animation || 'none';
      this.response = options.response;
      this.steps = this.parseSteps();
    }

    ExtractPlan.prototype.findOld = function() {
      return u.each(this.steps, function(step) {
        return step.$old = up.dom.first(step.selector, this.options);
      });
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


    /**
    Example:
    
        parseSelector('foo, bar:before', transition: 'cross-fade')
    
        [
          { selector: 'foo', pseudoClass: undefined, transition: 'cross-fade' },
          { selector: 'bar', pseudoClass: 'before', transition: 'cross-fade' }
        ]
     */

    ExtractPlan.prototype.parseSteps = function() {
      var comma, disjunction, transitions;
      if (u.isString(this.transition)) {
        transitions = this.transition.split(comma);
      } else {
        transitions = [this.transition];
      }
      comma = /\ *,\ */;
      disjunction = this.selector.split(comma);
      return u.map(disjunction, function(literal, i) {
        var literalParts, pseudoClass, selector, transition;
        literalParts = literal.match(/^(.+?)(?:\:(before|after))?$/);
        literalParts || up.fail('Could not parse selector literal "%s"', literal);
        selector = literalParts[1];
        if (selector === 'html') {
          selector = 'body';
        }
        pseudoClass = literalParts[2];
        transition = transitions[i] || u.last(transitions);
        return {
          selector: selector,
          pseudoClass: pseudoClass,
          transition: transition
        };
      });
    };

    return ExtractPlan;

  })();

}).call(this);

/**
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
of the dialog by adding an [`up-animation`](/up-modal#up-animation) attribute to the opening link:

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
    var GHOSTING_CLASS, GHOSTING_DEFERRED_KEY, animate, animateOptions, animation, animations, assertIsDeferred, config, defaultAnimations, defaultTransitions, ensureMorphable, findAnimation, finish, finishGhosting, isEnabled, isNone, morph, none, prependCopy, reset, resolvableWhen, skipMorph, snapshot, transition, transitions, translateCss, u, withGhosts;
    u = up.util;
    animations = {};
    defaultAnimations = {};
    transitions = {};
    defaultTransitions = {};

    /**
    Sets default options for animations and transitions.
    
    @property up.motion.config
    @param {Number} [config.duration=300]
      The default duration for all animations and transitions (in milliseconds).
    @param {Number} [config.delay=0]
      The default delay for all animations and transitions (in milliseconds).
    @param {String} [config.easing='ease']
      The default timing function that controls the acceleration of animations and transitions.
    
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @param {Boolean} [config.enabled=true]
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
      finish();
      animations = u.copy(defaultAnimations);
      transitions = u.copy(defaultTransitions);
      return config.reset();
    };

    /**
    Returns whether Unpoly will perform animations.
    
    Animations will be performed if the browser supports
    [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
    and if [`up.motion.config.enabled`](/up.motion.config) is set to `true` (which is the default).
    
    @function up.motion.isEnabled
    @return {Boolean}
    @stable
     */
    isEnabled = function() {
      return config.enabled && up.browser.canCssTransition();
    };

    /**
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
    @param {Element|jQuery|String} elementOrSelector
      The element to animate.
    @param {String|Function|Object} animation
      Can either be:
    
      - The animation's name
      - A function performing the animation
      - An object of CSS attributes describing the last frame of the animation
    @param {Number} [options.duration=300]
      The duration of the animation, in milliseconds.
    @param {Number} [options.delay=0]
      The delay before the animation starts, in milliseconds.
    @param {String} [options.easing='ease']
      The timing function that controls the animation's acceleration.
    
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @return {Promise}
      A promise for the animation's end.
    @stable
     */
    animate = function(elementOrSelector, animation, options) {
      var $element;
      $element = $(elementOrSelector);
      finish($element);
      options = animateOptions(options);
      if (isNone(animation)) {
        return none();
      } else if (u.isFunction(animation)) {
        return assertIsDeferred(animation($element, options), animation);
      } else if (u.isString(animation)) {
        return animate($element, findAnimation(animation), options);
      } else if (u.isHash(animation)) {
        if (isEnabled()) {
          return u.cssAnimate($element, animation, options);
        } else {
          $element.css(animation);
          return u.resolvedDeferred();
        }
      } else {
        return up.fail("Unknown animation type for %o", animation);
      }
    };

    /**
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
      return consolidatedOptions;
    };
    findAnimation = function(name) {
      return animations[name] || up.fail("Unknown animation %o", name);
    };
    GHOSTING_DEFERRED_KEY = 'up-ghosting-deferred';
    GHOSTING_CLASS = 'up-ghosting';
    withGhosts = function($old, $new, options, block) {
      var $both, $viewport, deferred, newCopy, newScrollTop, oldCopy, oldScrollTop, showNew;
      if (options.copy === false || $old.is('.up-ghost') || $new.is('.up-ghost')) {
        return block($old, $new);
      }
      oldCopy = void 0;
      newCopy = void 0;
      oldScrollTop = void 0;
      newScrollTop = void 0;
      $viewport = up.layout.viewportOf($old);
      $both = $old.add($new);
      u.temporaryCss($new, {
        display: 'none'
      }, function() {
        oldCopy = prependCopy($old, $viewport);
        return oldScrollTop = $viewport.scrollTop();
      });
      u.temporaryCss($old, {
        display: 'none'
      }, function() {
        up.layout.revealOrRestoreScroll($new, options);
        newCopy = prependCopy($new, $viewport);
        return newScrollTop = $viewport.scrollTop();
      });
      oldCopy.moveTop(newScrollTop - oldScrollTop);
      $old.hide();
      showNew = u.temporaryCss($new, {
        opacity: '0'
      });
      deferred = block(oldCopy.$ghost, newCopy.$ghost);
      $both.data(GHOSTING_DEFERRED_KEY, deferred);
      $both.addClass(GHOSTING_CLASS);
      deferred.then(function() {
        $both.removeData(GHOSTING_DEFERRED_KEY);
        $both.removeClass(GHOSTING_CLASS);
        showNew();
        oldCopy.$bounds.remove();
        return newCopy.$bounds.remove();
      });
      return deferred;
    };

    /**
    Completes [animations](/up.animate) and [transitions](/up.morph).
    
    If called without arguments, all animations on the screen are completed.
    If given an element (or selector), animations on that element and its children
    are completed.
    
    Animations are completed by jumping to the last animation frame instantly.
    
    Does nothing if there are no animation to complete.
    
    @function up.motion.finish
    @param {Element|jQuery|String} [elementOrSelector]
    @stable
     */
    finish = function(elementOrSelector) {
      var $animatingSubtree, $element, $ghostingSubtree;
      if (elementOrSelector == null) {
        elementOrSelector = '.up-animating';
      }
      if (!isEnabled()) {
        return;
      }
      $element = $(elementOrSelector);
      $animatingSubtree = u.findWithSelf($element, '.up-animating');
      u.finishCssAnimate($animatingSubtree);
      $ghostingSubtree = u.findWithSelf($element, "." + GHOSTING_CLASS);
      return finishGhosting($ghostingSubtree);
    };
    finishGhosting = function($collection) {
      return $collection.each(function() {
        var $element, existingGhosting;
        $element = $(this);
        if (existingGhosting = u.pluckData($element, GHOSTING_DEFERRED_KEY)) {
          return existingGhosting.resolve();
        }
      });
    };
    assertIsDeferred = function(object, source) {
      if (u.isDeferred(object)) {
        return object;
      } else {
        return up.fail("Did not return a promise with .then and .resolve methods: %o", source);
      }
    };

    /**
    Performs an animated transition between two elements.
    Transitions are implement by performing two animations in parallel,
    causing one element to disappear and the other to appear.
    
    Note that the transition does not remove any elements from the DOM.
    The first element will remain in the DOM, albeit hidden using `display: none`.
    
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
    @param {Element|jQuery|String} source
    @param {Element|jQuery|String} target
    @param {Function|String} transitionOrName
    @param {Number} [options.duration=300]
      The duration of the animation, in milliseconds.
    @param {Number} [options.delay=0]
      The delay before the animation starts, in milliseconds.
    @param {String} [options.easing='ease']
      The timing function that controls the transition's acceleration.
    
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @param {Boolean} [options.reveal=false]
      Whether to reveal the new element by scrolling its parent viewport.
    @return {Promise}
      A promise for the transition's end.
    @stable
     */
    morph = function(source, target, transitionOrName, options) {
      var $new, $old, willMorph;
      options = u.options(options);
      willMorph = isEnabled() && !isNone(transitionOrName);
      $old = $(source);
      $new = $(target);
      return up.log.group((willMorph ? 'Morphing %o to %o (using %s, %o)' : void 0), $old.get(0), $new.get(0), transitionOrName, options, function() {
        var animation, parsedOptions, parts, transition;
        parsedOptions = u.only(options, 'reveal', 'restoreScroll', 'source');
        parsedOptions = u.assign(parsedOptions, animateOptions(options));
        finish($old);
        finish($new);
        if (willMorph) {
          ensureMorphable($old);
          ensureMorphable($new);
          if (animation = animations[transitionOrName]) {
            skipMorph($old, $new, parsedOptions);
            return animate($new, animation, parsedOptions);
          } else if (transition = u.presence(transitionOrName, u.isFunction) || transitions[transitionOrName]) {
            return withGhosts($old, $new, parsedOptions, function($oldGhost, $newGhost) {
              var transitionPromise;
              transitionPromise = transition($oldGhost, $newGhost, parsedOptions);
              return assertIsDeferred(transitionPromise, transitionOrName);
            });
          } else if (u.isString(transitionOrName) && transitionOrName.indexOf('/') >= 0) {
            parts = transitionOrName.split('/');
            transition = function($old, $new, options) {
              return resolvableWhen(animate($old, parts[0], options), animate($new, parts[1], options));
            };
            return morph($old, $new, transition, parsedOptions);
          } else {
            return up.fail("Unknown transition %o", transitionOrName);
          }
        } else {
          return skipMorph($old, $new, parsedOptions);
        }
      });
    };
    ensureMorphable = function($element) {
      var element;
      if ($element.parents('body').length === 0) {
        element = $element.get(0);
        return up.fail("Can't morph a <%s> element (%o)", element.tagName, element);
      }
    };

    /**
    This causes the side effects of a successful transition, but instantly.
    We use this to skip morphing for old browsers, or when the developer
    decides to only animate the new element (i.e. no real ghosting or transition)   .
    
    @internal
     */
    skipMorph = function($old, $new, options) {
      $old.hide();
      return up.layout.revealOrRestoreScroll($new, options);
    };

    /**
    @internal
     */
    prependCopy = function($element, $viewport) {
      var $bounds, $fixedElements, $ghost, elementDims, fixedElement, i, len, moveTop, top;
      elementDims = u.measure($element, {
        relative: true,
        inner: true
      });
      $ghost = $element.clone();
      $ghost.find('script').remove();
      $ghost.css({
        position: $element.css('position') === 'static' ? 'static' : 'relative',
        top: 'auto',
        right: 'auto',
        bottom: 'auto',
        left: 'auto',
        width: '100%',
        height: '100%'
      });
      $ghost.addClass('up-ghost');
      $bounds = $('<div class="up-bounds"></div>');
      $bounds.css({
        position: 'absolute'
      });
      $bounds.css(elementDims);
      top = elementDims.top;
      moveTop = function(diff) {
        if (diff !== 0) {
          top += diff;
          return $bounds.css({
            top: top
          });
        }
      };
      $ghost.appendTo($bounds);
      $bounds.insertBefore($element);
      moveTop($element.offset().top - $ghost.offset().top);
      $fixedElements = up.layout.fixedChildren($ghost);
      for (i = 0, len = $fixedElements.length; i < len; i++) {
        fixedElement = $fixedElements[i];
        u.fixedToAbsolute(fixedElement, $viewport);
      }
      return {
        $ghost: $ghost,
        $bounds: $bounds,
        moveTop: moveTop
      };
    };

    /**
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
    
    1. It must honor the passed options `{ delay, duration, easing }` if present
    2. It must *not* remove any of the given elements from the DOM.
    3. It returns a promise that is resolved when the transition ends
    4. The returned promise responds to a `resolve()` function that
       instantly jumps to the last transition frame and resolves the promise.
    
    Calling [`up.animate()`](/up.animate) with an object argument
    will take care of all these points.
    
    @function up.transition
    @param {String} name
    @param {Function} transition
    @stable
     */
    transition = function(name, transition) {
      return transitions[name] = transition;
    };

    /**
    Defines a named animation.
    
    Here is the definition of the pre-defined `fade-in` animation:
    
        up.animation('fade-in', function($element, options) {
          $element.css(opacity: 0);
          up.animate($ghost, { opacity: 1 }, options);
        })
    
    It is recommended that your definitions always end by calling
    calling [`up.animate()`](/up.animate) with an object argument, passing along
    the `options` that were passed to you.
    
    If you choose to *not* use `up.animate()` and roll your own
    animation code instead, your code must honor the following contract:
    
    1. It must honor the passed options `{ delay, duration, easing }` if present
    2. It must *not* remove the passed element from the DOM.
    3. It returns a promise that is resolved when the animation ends
    4. The returned promise responds to a `resolve()` function that
       instantly jumps to the last animation frame and resolves the promise.
    
    Calling [`up.animate()`](/up.animate) with an object argument
    will take care of all these points.
    
    @function up.animation
    @param {String} name
    @param {Function} animation
    @stable
     */
    animation = function(name, animation) {
      return animations[name] = animation;
    };
    snapshot = function() {
      defaultAnimations = u.copy(animations);
      return defaultTransitions = u.copy(transitions);
    };

    /**
    Returns a new deferred that resolves once all given deferreds have resolved.
    
    Other then [`$.when` from jQuery](https://api.jquery.com/jquery.when/),
    the combined deferred will have a `resolve` method. This `resolve` method
    will resolve all the wrapped deferreds.
    
    This is important when composing multiple existing animations into
    a [custom transition](/up.transition), since the transition function
    must return a deferred with a `resolve` function that fast-forwards
    the animation to its last frame.
    
    @function up.motion.when
    @param {Array<Deferred>} deferreds...
    @return {Deferred} A new deferred
    @experimental
     */
    resolvableWhen = u.resolvableWhen;

    /**
    Returns a no-op animation or transition which has no visual effects
    and completes instantly.
    
    @function up.motion.none
    @return {Promise}
      A resolved promise
    @stable
     */
    none = u.resolvedDeferred;

    /**
    Returns whether the given animation option will cause the animation
    to be skipped.
    
    @function up.motion.isNone
    @internal
     */
    isNone = function(animation) {
      return animation === false || animation === 'none' || u.isMissing(animation) || u.isResolvedPromise(animation);
    };
    animation('none', none);
    animation('fade-in', function($ghost, options) {
      $ghost.css({
        opacity: 0
      });
      return animate($ghost, {
        opacity: 1
      }, options);
    });
    animation('fade-out', function($ghost, options) {
      $ghost.css({
        opacity: 1
      });
      return animate($ghost, {
        opacity: 0
      }, options);
    });
    translateCss = function(x, y) {
      return {
        transform: "translate(" + x + "px, " + y + "px)"
      };
    };
    animation('move-to-top', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.top + box.height;
      $ghost.css(translateCss(0, 0));
      return animate($ghost, translateCss(0, -travelDistance), options);
    });
    animation('move-from-top', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.top + box.height;
      $ghost.css(translateCss(0, -travelDistance));
      return animate($ghost, translateCss(0, 0), options);
    });
    animation('move-to-bottom', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().height - box.top;
      $ghost.css(translateCss(0, 0));
      return animate($ghost, translateCss(0, travelDistance), options);
    });
    animation('move-from-bottom', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().height - box.top;
      $ghost.css(translateCss(0, travelDistance));
      return animate($ghost, translateCss(0, 0), options);
    });
    animation('move-to-left', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.left + box.width;
      $ghost.css(translateCss(0, 0));
      return animate($ghost, translateCss(-travelDistance, 0), options);
    });
    animation('move-from-left', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.left + box.width;
      $ghost.css(translateCss(-travelDistance, 0));
      return animate($ghost, translateCss(0, 0), options);
    });
    animation('move-to-right', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().width - box.left;
      $ghost.css(translateCss(0, 0));
      return animate($ghost, translateCss(travelDistance, 0), options);
    });
    animation('move-from-right', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().width - box.left;
      $ghost.css(translateCss(travelDistance, 0));
      return animate($ghost, translateCss(0, 0), options);
    });
    animation('roll-down', function($ghost, options) {
      var deferred, fullHeight, styleMemo;
      fullHeight = $ghost.height();
      styleMemo = u.temporaryCss($ghost, {
        height: '0px',
        overflow: 'hidden'
      });
      deferred = animate($ghost, {
        height: fullHeight + "px"
      }, options);
      deferred.then(styleMemo);
      return deferred;
    });
    transition('none', none);
    transition('move-left', function($old, $new, options) {
      return resolvableWhen(animate($old, 'move-to-left', options), animate($new, 'move-from-right', options));
    });
    transition('move-right', function($old, $new, options) {
      return resolvableWhen(animate($old, 'move-to-right', options), animate($new, 'move-from-left', options));
    });
    transition('move-up', function($old, $new, options) {
      return resolvableWhen(animate($old, 'move-to-top', options), animate($new, 'move-from-bottom', options));
    });
    transition('move-down', function($old, $new, options) {
      return resolvableWhen(animate($old, 'move-to-bottom', options), animate($new, 'move-from-top', options));
    });
    transition('cross-fade', function($old, $new, options) {
      return resolvableWhen(animate($old, 'fade-out', options), animate($new, 'fade-in', options));
    });
    up.on('up:framework:booted', snapshot);
    up.on('up:framework:reset', reset);
    return {
      morph: morph,
      animate: animate,
      animateOptions: animateOptions,
      finish: finish,
      transition: transition,
      animation: animation,
      config: config,
      isEnabled: isEnabled,
      none: none,
      when: resolvableWhen,
      prependCopy: prependCopy,
      isNone: isNone
    };
  })(jQuery);

  up.transition = up.motion.transition;

  up.animation = up.motion.animation;

  up.morph = up.motion.morph;

  up.animate = up.motion.animate;

}).call(this);

/**
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
use [`up.ajax()`](/up.ajax).

\#\#\# Preloading links

Unpoly also lets you speed up reaction times by [preloading
links](/up-preload) when the user hovers over the click area (or puts the mouse/finger
down). This way the response will already be cached when
the user releases the mouse/finger.

\#\#\# Spinners

You can listen to the [`up:proxy:slow`](/up:proxy:slow) event to implement a spinner
that appears during a long-running request.

\#\#\# More acceleration

Other Unpoly modules contain even more tricks to outsmart network latency:

- [Instantaneous feedback for links that are currently loading](/up-active)
- [Follow links on `mousedown` instead of `click`](/up-instant)

@class up.proxy
 */

(function() {
  var slice = [].slice;

  up.proxy = (function($) {
    var $waitingLink, ajax, alias, cache, cacheKey, cancelPreloadDelay, cancelSlowDelay, checkPreload, clear, config, get, isBusy, isCachable, isIdempotent, isIdle, load, loadEnded, loadOrQueue, loadStarted, normalizeRequest, pendingCount, pokeQueue, preload, preloadDelayTimer, queue, queuedRequests, remove, reset, responseReceived, set, slowDelayTimer, slowEventEmitted, startPreloadDelay, u;
    u = up.util;
    $waitingLink = void 0;
    preloadDelayTimer = void 0;
    slowDelayTimer = void 0;
    pendingCount = void 0;
    slowEventEmitted = void 0;
    queuedRequests = [];

    /**
    @property up.proxy.config
    @param {Number} [config.preloadDelay=75]
      The number of milliseconds to wait before [`[up-preload]`](/up-preload)
      starts preloading.
    @param {Number} [config.cacheSize=70]
      The maximum number of responses to cache.
      If the size is exceeded, the oldest items will be dropped from the cache.
    @param {Number} [config.cacheExpiry=300000]
      The number of milliseconds until a cache entry expires.
      Defaults to 5 minutes.
    @param {Number} [config.slowDelay=300]
      How long the proxy waits until emitting the [`up:proxy:slow` event](/up:proxy:slow).
      Use this to prevent flickering of spinners.
    @param {Number} [config.maxRequests=4]
      The maximum number of concurrent requests to allow before additional
      requests are queued. This currently ignores preloading requests.
    
      You might find it useful to set this to `1` in full-stack integration
      tests (e.g. Selenium).
    
      Note that your browser might [impose its own request limit](http://www.browserscope.org/?category=network)
      regardless of what you configure here.
    @param {Array<String>} [config.wrapMethods]
      An array of uppercase HTTP method names. AJAX requests with one of these methods
      will be converted into a `POST` request and carry their original method as a `_method`
      parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).
    @param {String} [config.wrapMethodParam]
      The name of the POST parameter when wrapping HTTP methods in a `POST` request.
    @param {Array<String>} [config.safeMethods]
      An array of uppercase HTTP method names that are considered idempotent.
      The proxy cache will only cache idempotent requests and will clear the entire
      cache after a non-idempotent request.
    @stable
     */
    config = u.config({
      slowDelay: 300,
      preloadDelay: 75,
      cacheSize: 70,
      cacheExpiry: 1000 * 60 * 5,
      maxRequests: 4,
      wrapMethods: ['PATCH', 'PUT', 'DELETE'],
      wrapMethodParam: '_method',
      safeMethods: ['GET', 'OPTIONS', 'HEAD']
    });
    cacheKey = function(request) {
      normalizeRequest(request);
      return [request.url, request.method, u.requestDataAsQuery(request.data), request.target].join('|');
    };
    cache = u.cache({
      size: function() {
        return config.cacheSize;
      },
      expiry: function() {
        return config.cacheExpiry;
      },
      key: cacheKey
    });

    /**
    Returns a cached response for the given request.
    
    Returns `undefined` if the given request is not currently cached.
    
    @function up.proxy.get
    @return {Promise}
      A promise for the response that is API-compatible with the
      promise returned by [`jQuery.ajax`](http://api.jquery.com/jquery.ajax/).
    @experimental
     */
    get = function(request) {
      var candidate, candidates, i, len, requestForBody, requestForHtml, response;
      request = normalizeRequest(request);
      if (isCachable(request)) {
        candidates = [request];
        if (request.target !== 'html') {
          requestForHtml = u.merge(request, {
            target: 'html'
          });
          candidates.push(requestForHtml);
          if (request.target !== 'body') {
            requestForBody = u.merge(request, {
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
      return queuedRequests = [];
    };
    reset();
    normalizeRequest = function(request) {
      if (!request._normalized) {
        request.method = u.normalizeMethod(request.method);
        if (request.url) {
          request.url = u.normalizeUrl(request.url);
        }
        request.target || (request.target = 'body');
        request._normalized = true;
      }
      return request;
    };

    /**
    Makes a request to the given URL and caches the response.
    If the response was already cached, returns the HTML instantly.
    
    If requesting a URL that is not read-only, the response will
    not be cached and the entire cache will be cleared.
    Only requests with a method of `GET`, `OPTIONS` and `HEAD`
    are considered to be read-only.
    
    \#\#\# Example
    
        up.ajax('/search', data: { query: 'sunshine' }).then(function(data, status, xhr) {
          console.log('The response body is %o', data);
        }).fail(function(xhr, status, error) {
          console.error('The request failed');
        });
    
    \#\#\# Events
    
    If a network connection is attempted, the proxy will emit
    a [`up:proxy:load`](/up:proxy:load) event with the `request` as its argument.
    Once the response is received, a [`up:proxy:receive`](/up:proxy:receive) event will
    be emitted.
    
    @function up.ajax
    @param {String} url
    @param {String} [request.method='GET']
    @param {String} [request.target='body']
    @param {Boolean} [request.cache]
      Whether to use a cached response, if available.
      If set to `false` a network connection will always be attempted.
    @param {Object} [request.headers={}]
      An object of additional header key/value pairs to send along
      with the request.
    @param {Object} [request.data={}]
      An object of request parameters.
    @param {String} [request.url]
      You can omit the first string argument and pass the URL as
      a `request` property instead.
    @param {String} [request.timeout]
      A timeout in milliseconds for the request.
    
      If [`up.proxy.config.maxRequests`](/up.proxy.config#maxRequests) is set, the timeout
      will not include the time spent waiting in the queue.
    @return
      A promise for the response that is API-compatible with the
      promise returned by [`jQuery.ajax`](http://api.jquery.com/jquery.ajax/).
    @stable
     */
    ajax = function() {
      var args, forceCache, ignoreCache, options, pending, promise, request;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      options = u.extractOptions(args);
      if (u.isGiven(args[0])) {
        options.url = args[0];
      }
      forceCache = options.cache === true;
      ignoreCache = options.cache === false;
      request = u.only(options, 'url', 'method', 'data', 'target', 'headers', 'timeout', '_normalized');
      request = normalizeRequest(request);
      pending = true;
      if (!isIdempotent(request) && !forceCache) {
        clear();
        promise = loadOrQueue(request);
      } else if ((promise = get(request)) && !ignoreCache) {
        up.puts('Re-using cached response for %s %s', request.method, request.url);
        pending = promise.state() === 'pending';
      } else {
        promise = loadOrQueue(request);
        set(request, promise);
        promise.fail(function() {
          return remove(request);
        });
      }
      if (pending && !options.preload) {
        loadStarted();
        promise.always(loadEnded);
      }
      return promise;
    };

    /**
    Returns whether the proxy is capable of caching the given request.
    Even if this returns `true`, only idempodent requests will be
    cached by default.
    
    @function up.proxy.isCachable
    @internal
     */
    isCachable = function(request) {
      return !u.isFormData(request.data);
    };

    /**
    Returns `true` if the proxy is not currently waiting
    for a request to finish. Returns `false` otherwise.
    
    @function up.proxy.isIdle
    @return {Boolean}
      Whether the proxy is idle
    @experimental
     */
    isIdle = function() {
      return pendingCount === 0;
    };

    /**
    Returns `true` if the proxy is currently waiting
    for a request to finish. Returns `false` otherwise.
    
    @function up.proxy.isBusy
    @return {Boolean}
      Whether the proxy is busy
    @experimental
     */
    isBusy = function() {
      return pendingCount > 0;
    };
    loadStarted = function() {
      var emission, wasIdle;
      wasIdle = isIdle();
      pendingCount += 1;
      if (wasIdle) {
        emission = function() {
          if (isBusy()) {
            up.emit('up:proxy:slow', {
              message: 'Proxy is busy'
            });
            return slowEventEmitted = true;
          }
        };
        return slowDelayTimer = u.setTimer(config.slowDelay, emission);
      }
    };

    /**
    This event is [emitted](/up.emit) when [AJAX requests](/up.ajax)
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
      if (isIdle() && slowEventEmitted) {
        up.emit('up:proxy:recover', {
          message: 'Proxy is idle'
        });
        return slowEventEmitted = false;
      }
    };

    /**
    This event is [emitted](/up.emit) when [AJAX requests](/up.ajax)
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
      var deferred, entry;
      up.puts('Queuing request for %s %s', request.method, request.url);
      deferred = $.Deferred();
      entry = {
        deferred: deferred,
        request: request
      };
      queuedRequests.push(entry);
      return deferred.promise();
    };
    load = function(request) {
      var promise;
      up.emit('up:proxy:load', u.merge(request, {
        message: ['Loading %s %s', request.method, request.url]
      }));
      request = u.copy(request);
      request.headers || (request.headers = {});
      request.headers['X-Up-Target'] = request.target;
      if (u.contains(config.wrapMethods, request.method)) {
        request.data = u.appendRequestData(request.data, config.wrapMethodParam, request.method);
        request.method = 'POST';
      }
      if (u.isFormData(request.data)) {
        request.contentType = false;
        request.processData = false;
      }
      promise = $.ajax(request);
      promise.done(function(data, textStatus, xhr) {
        return responseReceived(request, xhr);
      });
      promise.fail(function(xhr, textStatus, errorThrown) {
        return responseReceived(request, xhr);
      });
      return promise;
    };
    responseReceived = function(request, xhr) {
      var ref;
      up.emit('up:proxy:received', u.merge(request, {
        message: ['Server responded with %s %s (%d bytes)', xhr.status, xhr.statusText, (ref = xhr.responseText) != null ? ref.length : void 0]
      }));
      return pokeQueue();
    };
    pokeQueue = function() {
      var entry, promise;
      if (entry = queuedRequests.shift()) {
        promise = load(entry.request);
        promise.done(function() {
          var args, ref;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return (ref = entry.deferred).resolve.apply(ref, args);
        });
        promise.fail(function() {
          var args, ref;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return (ref = entry.deferred).reject.apply(ref, args);
        });
      }
    };

    /**
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

    /**
    Manually stores a promise for the response to the given request.
    
    @function up.proxy.set
    @param {String} request.url
    @param {String} [request.method='GET']
    @param {String} [request.target='body']
    @param {Promise} response
      A promise for the response that is API-compatible with the
      promise returned by [`jQuery.ajax`](http://api.jquery.com/jquery.ajax/).
    @experimental
     */
    set = cache.set;

    /**
    Manually removes the given request from the cache.
    
    You can also [configure](/up.proxy.config) when the proxy
    automatically removes cache entries.
    
    @function up.proxy.remove
    @param {String} request.url
    @param {String} [request.method='GET']
    @param {String} [request.target='body']
    @experimental
     */
    remove = cache.remove;

    /**
    Removes all cache entries.
    
    Unpoly also automatically clears the cache whenever it processes
    a request with a non-GET HTTP method.
    
    @function up.proxy.clear
    @stable
     */
    clear = cache.clear;

    /**
    This event is [emitted](/up.emit) before an [AJAX request](/up.ajax)
    is starting to load.
    
    @event up:proxy:load
    @param event.url
    @param event.method
    @param event.target
    @experimental
     */

    /**
    This event is [emitted](/up.emit) when the response to an [AJAX request](/up.ajax)
    has been received.
    
    @event up:proxy:received
    @param event.url
    @param event.method
    @param event.target
    @experimental
     */
    isIdempotent = function(request) {
      normalizeRequest(request);
      return u.contains(config.safeMethods, request.method);
    };
    checkPreload = function($link) {
      var curriedPreload, delay;
      delay = parseInt(u.presentAttr($link, 'up-delay')) || config.preloadDelay;
      if (!$link.is($waitingLink)) {
        $waitingLink = $link;
        cancelPreloadDelay();
        curriedPreload = function() {
          preload($link);
          return $waitingLink = null;
        };
        return startPreloadDelay(curriedPreload, delay);
      }
    };
    startPreloadDelay = function(block, delay) {
      return preloadDelayTimer = setTimeout(block, delay);
    };

    /**
    @function up.proxy.preload
    @param {String|Element|jQuery}
      The element whose destination should be preloaded.
    @return
      A promise that will be resolved when the request was loaded and cached
    @experimental
     */
    preload = function(linkOrSelector, options) {
      var $link, method;
      $link = $(linkOrSelector);
      options = u.options(options);
      method = up.link.followMethod($link, options);
      if (isIdempotent({
        method: method
      })) {
        return up.log.group("Preloading link %o", $link, function() {
          options.preload = true;
          return up.follow($link, options);
        });
      } else {
        up.puts("Won't preload %o due to unsafe method %s", $link, method);
        return u.resolvedPromise();
      }
    };

    /**
    Links with an `up-preload` attribute will silently fetch their target
    when the user hovers over the click area, or when the user puts her
    mouse/finger down (before releasing). This way the
    response will already be cached when the user performs the click,
    making the interaction feel instant.   
    
    @selector [up-preload]
    @param [up-delay=75]
      The number of milliseconds to wait between hovering
      and preloading. Increasing this will lower the load in your server,
      but will also make the interaction feel less instant.
    @stable
     */
    up.on('mouseover mousedown touchstart', '[up-preload]', function(event, $element) {
      if (!up.link.childClicked(event, $element)) {
        return checkPreload($element);
      }
    });
    up.on('up:framework:reset', reset);
    return {
      preload: preload,
      ajax: ajax,
      get: get,
      alias: alias,
      clear: clear,
      remove: remove,
      isIdle: isIdle,
      isBusy: isBusy,
      isCachable: isCachable,
      config: config
    };
  })(jQuery);

  up.ajax = up.proxy.ajax;

}).call(this);

/**
Linking to fragments
====================

In a traditional web application, the entire page is destroyed and re-created when the
user follows a link:

![Traditional page flow](/images/tutorial/fragment_flow_vanilla.svg){:width="620px" class="picture has_border is_sepia has_padding"}

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

![Unpoly page flow](/images/tutorial/fragment_flow_unpoly.svg){:width="620px" class="picture has_border is_sepia has_padding"}

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
    var allowDefault, childClicked, follow, followMethod, followVariantSelectors, isFollowable, makeFollowable, onAction, shouldProcessLinkEvent, u, visit;
    u = up.util;

    /**
    Visits the given URL without a full page load.
    This is done by fetching `url` through an AJAX request
    and replacing the current `<body>` element with the response's `<body>` element.
    
    For example, this would fetch the `/users` URL:
    
        up.visit('/users')
    
    @function up.visit
    @param {String} url
      The URL to visit.
    @param {String} [options.target='body']
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

    /**
    Follows the given link via AJAX and [replaces](/up.replace) a CSS selector in the current page
    with corresponding elements from a new page fetched from the server.
    
    Any Unpoly UJS attributes on the given link will be honored. E. g. you have this link:
    
        <a href="/users" up-target=".main">Users</a>
    
    You can update the page's `.main` selector with the `.main` from `/users` like this:
    
        var $link = $('a:first'); // select link with jQuery
        up.follow($link);
    
    The UJS variant of this are the [`a[up-target]`](/a-up-target) and [`a[up-follow]`](/a-up-follow) selectors.
    
    @function up.follow
    @param {Element|jQuery|String} linkOrSelector
      An element or selector which resolves to an `<a>` tag
      or any element that is marked up with an `up-href` attribute.
    @param {String} [options.target]
      The selector to replace.
      Defaults to the `up-target` attribute on `link`, or to `body` if such an attribute does not exist.
    @param {String} [options.failTarget]
      The selector to replace if the server responds with a non-200 status code.
      Defaults to the `up-fail-target` attribute on `link`, or to `body` if such an attribute does not exist.
    @param {String} [options.fallback]
      The selector to update when the original target was not found in the page.
    @param {String} [options.method='get']
      The HTTP method to use for the request.
    @param {String} [options.confirm]
      A message that will be displayed in a cancelable confirmation dialog
      before the link is followed.
    @param {Function|String} [options.transition]
      A transition function or name.
    @param {Function|String} [options.failTransition]
      The transition to use if the server responds with a non-200 status code.
    @param {Number} [options.duration]
      The duration of the transition. See [`up.morph()`](/up.morph).
    @param {Number} [options.delay]
      The delay before the transition starts. See [`up.morph()`](/up.morph).
    @param {String} [options.easing]
      The timing function that controls the transition's acceleration. [`up.morph()`](/up.morph).
    @param {Element|jQuery|String} [options.reveal]
      Whether to reveal the target  element within its viewport before updating.
    @param {Boolean} [options.restoreScroll]
      If set to `true`, this will attempt to [restore scroll positions](/up.restoreScroll)
      previously seen on the destination URL.
    @param {Boolean} [options.cache]
      Whether to force the use of a cached response (`true`)
      or never use the cache (`false`)
      or make an educated guess (`undefined`).
    @param {Object} [options.headers={}]
      An object of additional header key/value pairs to send along
      with the request.
    @param {Object} [options.timeout={}]
      A timeout in milliseconds for the request.
    @param {String} [options.layer='auto']
      The name of the layer that ought to be updated. Valid values are
      `auto`, `page`, `modal` and `popup`.
    
      If set to `auto` (default), Unpoly will try to find a match in the
      same layer as the given link. If no match was found in that layer,
      Unpoly will search in other layers, starting from the topmost layer.
    @return {Promise}
      A promise that will be resolved when the link destination
      has been loaded and rendered.
    @stable
     */
    follow = function(linkOrSelector, options) {
      var $link, target, url;
      $link = $(linkOrSelector);
      options = u.options(options);
      url = u.option($link.attr('up-href'), $link.attr('href'));
      target = u.option(options.target, $link.attr('up-target'));
      options.failTarget = u.option(options.failTarget, $link.attr('up-fail-target'));
      options.fallback = u.option(options.fallback, $link.attr('up-fallback'));
      options.transition = u.option(options.transition, u.castedAttr($link, 'up-transition'), 'none');
      options.failTransition = u.option(options.failTransition, u.castedAttr($link, 'up-fail-transition'), 'none');
      options.history = u.option(options.history, u.castedAttr($link, 'up-history'));
      options.reveal = u.option(options.reveal, u.castedAttr($link, 'up-reveal'), true);
      options.cache = u.option(options.cache, u.castedAttr($link, 'up-cache'));
      options.restoreScroll = u.option(options.restoreScroll, u.castedAttr($link, 'up-restore-scroll'));
      options.method = followMethod($link, options);
      options.origin = u.option(options.origin, $link);
      options.layer = u.option(options.layer, $link.attr('up-layer'), 'auto');
      options.confirm = u.option(options.confirm, $link.attr('up-confirm'));
      options = u.merge(options, up.motion.animateOptions(options, $link));
      return up.browser.whenConfirmed(options).then(function() {
        return up.replace(target, url, options);
      });
    };

    /**
    Returns the HTTP method that should be used when following the given link.
    
    Looks at the link's `up-method` or `data-method` attribute.
    Defaults to `"get"`.
    
    @function up.link.followMethod
    @param linkOrSelector
    @param options.method {String}
    @internal
     */
    followMethod = function(linkOrSelector, options) {
      var $link;
      $link = $(linkOrSelector);
      options = u.options(options);
      return u.option(options.method, $link.attr('up-method'), $link.attr('data-method'), 'get').toUpperCase();
    };

    /**
    @function up.link.childClicked
    @internal
     */
    childClicked = function(event, $link) {
      var $target, $targetLink;
      $target = $(event.target);
      $targetLink = $target.closest('a, [up-href]');
      return $targetLink.length && $link.find($targetLink).length;
    };
    shouldProcessLinkEvent = function(event, $link) {
      return u.isUnmodifiedMouseEvent(event) && !childClicked(event, $link);
    };
    followVariantSelectors = [];

    /**
    No-op that is called when we allow a browser's default action to go through,
    so we can spy on it in unit tests. See `link_spec.js`.
    
    @function allowDefault
    @internal
     */
    allowDefault = function(event) {};
    onAction = function(selector, handler) {
      var handlerWithActiveMark;
      followVariantSelectors.push(selector);
      handlerWithActiveMark = function($link) {
        return up.feedback.start($link, function() {
          return handler($link);
        });
      };
      up.on('click', "a" + selector + ", [up-href]" + selector, function(event, $link) {
        if (shouldProcessLinkEvent(event, $link)) {
          if ($link.is('[up-instant]')) {
            return up.bus.haltEvent(event);
          } else {
            up.bus.consumeAction(event);
            return handlerWithActiveMark($link);
          }
        } else {
          return allowDefault(event);
        }
      });
      return up.on('mousedown', "a" + selector + "[up-instant], [up-href]" + selector + "[up-instant]", function(event, $link) {
        if (shouldProcessLinkEvent(event, $link)) {
          up.bus.consumeAction(event);
          return handlerWithActiveMark($link);
        }
      });
    };

    /**
    Returns whether the given link will be handled by Unpoly instead of making a full page load.
    
    A link will be handled by Unpoly if it has an attribute
    like `up-target` or `up-modal`.
    
    @function up.link.isFollowable
    @param {Element|jQuery|String} linkOrSelector
      The link to check.
    @experimental
     */
    isFollowable = function(link) {
      var $link;
      $link = $(link);
      return u.any(followVariantSelectors, function(selector) {
        return $link.is(selector);
      });
    };

    /**
    Makes sure that the given link will be handled by Unpoly instead of making a full page load.
    
    This is done by giving the link an `up-follow` attribute
    unless it already have it an attribute like `up-target` or `up-modal`.
    
    @function up.link.makeFollowable
    @param {Element|jQuery|String} linkOrSelector
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

    /**
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
    @param {String} up-target
      The CSS selector to replace
    @param {String} [up-method='get']
      The HTTP method to use for the request.
    @param {String} [up-transition='none']
      The [transition](/up.motion) to use for morphing between the old and new elements.
    @param [up-fail-target='body']
      The selector to replace if the server responds with a non-200 status code.
    @param {String} [up-fail-transition='none']
      The [transition](/up.motion) to use for morphing between the old and new elements
      when the server responds with a non-200 status code.
    @param {String} [up-fallback]
      The selector to update when the original target was not found in the page.
    @param {String} [up-href]
      The destination URL to follow.
      If omitted, the the link's `href` attribute will be used.
    @param {String} [up-confirm]
      A message that will be displayed in a cancelable confirmation dialog
      before the link is followed.
    @param {String} [up-reveal='true']
      Whether to reveal the target element within its viewport before updating.
    @param {String} [up-restore-scroll='false']
      Whether to restore previously known scroll position of all viewports
      within the target selector.
    @param {String} [up-cache]
      Whether to force the use of a cached response (`true`)
      or never use the cache (`false`)
      or make an educated guess (default).
    @param {String} [up-layer='auto']
      The name of the layer that ought to be updated. Valid values are
      `auto`, `page`, `modal` and `popup`.
    
      If set to `auto` (default), Unpoly will try to find a match in the
      same layer as the given link. If no match was found in that layer,
      Unpoly will search in other layers, starting from the topmost layer.
    @param [up-history]
      Whether to push an entry to the browser history when following the link.
    
      Set this to `'false'` to prevent the URL bar from being updated.
      Set this to a URL string to update the history with the given URL.
    @stable
     */
    onAction('[up-target]', function($link) {
      return follow($link);
    });

    /**
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
    
    @selector [up-instant]
    @stable
     */

    /**
    If applied on a link, Follows this link via AJAX and replaces the
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
    
    @param {String} [up-method='get']
      The HTTP method to use for the request.
    @param [up-fail-target='body']
      The selector to replace if the server responds with a non-200 status code.
    @param {String} [up-fallback]
      The selector to update when the original target was not found in the page.
    @param {String} [up-transition='none']
      The [transition](/up.motion) to use for morphing between the old and new elements.
    @param {String} [up-fail-transition='none']
      The [transition](/up.motion) to use for morphing between the old and new elements
      when the server responds with a non-200 status code.
    @param [up-href]
      The destination URL to follow.
      If omitted, the the link's `href` attribute will be used.
    @param {String} [up-confirm]
      A message that will be displayed in a cancelable confirmation dialog
      before the link is followed.
    @param {String} [up-history]
      Whether to push an entry to the browser history when following the link.
    
      Set this to `'false'` to prevent the URL bar from being updated.
      Set this to a URL string to update the history with the given URL.
    @param [up-restore-scroll='false']
      Whether to restore the scroll position of all viewports
      within the response.
    @stable
     */
    onAction('[up-follow]', function($link) {
      return follow($link);
    });

    /**
    Marks up the current link to be followed *as fast as possible*.
    
    This is done by:
    
    - [Following the link through AJAX](/a-up-target) instead of a full page load
    - [Preloading the link's destination URL](/up-preload)
    - [Triggering the link on `mousedown`](/up-instant) instead of on `click`
    
    Use `up-dash` like this:
    
        <a href="/users" up-dash=".main">User list</a>
    
    Note that this is shorthand for:
    
        <a href="/users" up-target=".main" up-instant up-preload>User list</a>
    
    @selector [up-dash]
    @stable
     */
    up.macro('[up-dash]', {
      priority: 'last'
    }, function($element) {
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

    /**
    Add an `up-expand` class to any element that contains a link
    in order to enlarge the link's click area.
    
    `up-expand` honors all the UJS behavior in expanded links
    ([`up-target`](/a-up-target), [`up-instant`](/up-instant), [`up-preload`](/up-preload), etc.).
    
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
    
    Users will not be able to use the expanded area to open a context menu by right clicking,
    or to open the link in a new tab.
    To enable this, make the entire clickable area an actual `<a>` tag.
    [It's OK to put block elements inside an anchor tag](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag).
    
    
    @selector [up-expand]
    @param {String} [up-expand]
      A CSS selector that defines which containing link should be expanded.
    
      If omitted, the first contained link will be expanded.
    @stable
     */
    up.macro('[up-expand]', {
      priority: 'last'
    }, function($area) {
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
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      visit: visit,
      follow: follow,
      makeFollowable: makeFollowable,
      isFollowable: isFollowable,
      shouldProcessLinkEvent: shouldProcessLinkEvent,
      childClicked: childClicked,
      followMethod: followMethod,
      onAction: onAction
    };
  })(jQuery);

  up.visit = up.link.visit;

  up.follow = up.link.follow;

}).call(this);

/**
Forms
=====
  
Unpoly comes with functionality to [submit](/form-up-target) and [validate](/up-validate)
forms without leaving the current page. This means you can replace page fragments,
open dialogs with sub-forms, etc. all without losing form state.

@class up.form
 */

(function() {
  var slice = [].slice;

  up.form = (function($) {
    var autosubmit, config, currentValuesForSwitch, observe, observeField, reset, resolveValidateTarget, submit, switchTargets, u, validate;
    u = up.util;

    /**
    Sets default options for form submission and validation.
    
    @property up.form.config
    @param {Number} [config.observeDelay=0]
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
    @param {String} [config.fields=[':input']]
      An array of CSS selectors that represent form fields, such as `input` or `select`.
    @stable
     */
    config = u.config({
      validateTargets: ['[up-fieldset]:has(&)', 'fieldset:has(&)', 'label:has(&)', 'form:has(&)'],
      fields: [':input'],
      observeDelay: 0
    });
    reset = function() {
      return config.reset();
    };

    /**
    Submits a form via AJAX and updates a page fragment with the response.
    
        up.submit('form.new-user', { target: '.main' })
    
    Instead of loading a new page, the form is submitted via AJAX.
    The response is parsed for a CSS selector and the matching elements will
    replace corresponding elements on the current page.
    
    The UJS variant of this is the [`form[up-target]`](/form-up-target) selector.
    See the documentation for [`form[up-target]`](/form-up-target) for more
    information on how AJAX form submissions work in Unpoly.
    
    @function up.submit
    @param {Element|jQuery|String} formOrSelector
      A reference or selector for the form to submit.
      If the argument points to an element that is not a form,
      Unpoly will search its ancestors for the closest form.
    @param {String} [options.url]
      The URL where to submit the form.
      Defaults to the form's `action` attribute, or to the current URL of the browser window.
    @param {String} [options.method='post']
      The HTTP method used for the form submission.
      Defaults to the form's `up-method`, `data-method` or `method` attribute, or to `'post'`
      if none of these attributes are given.
    @param {String} [options.target]
      The selector to update when the form submission succeeds (server responds with status 200).
      Defaults to the form's `up-target` attribute.
    @param {String} [options.failTarget]
      The selector to update when the form submission fails (server responds with non-200 status).
      Defaults to the form's `up-fail-target` attribute, or to an auto-generated
      selector that matches the form itself.
    @param {String} [options.fallback]
      The selector to update when the original target was not found in the page.
      Defaults to the form's `up-fallback` attribute.
    @param {Boolean|String} [options.history=true]
      Successful form submissions will add a history entry and change the browser's
      location bar if the form either uses the `GET` method or the response redirected
      to another page (this requires the `unpoly-rails` gem).
      If you want to prevent history changes in any case, set this to `false`.
      If you pass a `String`, it is used as the URL for the browser history.
    @param {String} [options.transition='none']
      The transition to use when a successful form submission updates the `options.target` selector.
      Defaults to the form's `up-transition` attribute, or to `'none'`.
    @param {String} [options.failTransition='none']
      The transition to use when a failed form submission updates the `options.failTarget` selector.
      Defaults to the form's `up-fail-transition` attribute, or to `options.transition`, or to `'none'`.
    @param {Number} [options.duration]
      The duration of the transition. See [`up.morph()`](/up.morph).
    @param {Number} [options.delay]
      The delay before the transition starts. See [`up.morph()`](/up.morph).
    @param {String} [options.easing]
      The timing function that controls the transition's acceleration. [`up.morph()`](/up.morph).
    @param {Element|jQuery|String} [options.reveal]
      Whether to reveal the target element within its viewport.
    @param {Boolean} [options.restoreScroll]
      If set to `true`, this will attempt to [`restore scroll positions`](/up.restoreScroll)
      previously seen on the destination URL.
    @param {Boolean} [options.cache]
      Whether to force the use of a cached response (`true`)
      or never use the cache (`false`)
      or make an educated guess (`undefined`).
    
      By default only responses to `GET` requests are cached
      for a few minutes.
    @param {Object} [options.headers={}]
      An object of additional header key/value pairs to send along
      with the request.
    @return {Promise}
      A promise for the successful form submission.
    @stable
     */
    submit = function(formOrSelector, options) {
      var $form, canAjaxSubmit, canHistoryOption, hasFileInputs, promise, target, url;
      $form = $(formOrSelector).closest('form');
      options = u.options(options);
      target = u.option(options.target, $form.attr('up-target'), 'body');
      url = u.option(options.url, $form.attr('action'), up.browser.url());
      options.failTarget = u.option(options.failTarget, $form.attr('up-fail-target')) || u.selectorForElement($form);
      options.fallback = u.option(options.fallback, $form.attr('up-fallback'));
      options.history = u.option(options.history, u.castedAttr($form, 'up-history'), true);
      options.transition = u.option(options.transition, u.castedAttr($form, 'up-transition'), 'none');
      options.failTransition = u.option(options.failTransition, u.castedAttr($form, 'up-fail-transition'), 'none');
      options.method = u.option(options.method, $form.attr('up-method'), $form.attr('data-method'), $form.attr('method'), 'post').toUpperCase();
      options.headers = u.option(options.headers, {});
      options.reveal = u.option(options.reveal, u.castedAttr($form, 'up-reveal'), true);
      options.cache = u.option(options.cache, u.castedAttr($form, 'up-cache'));
      options.restoreScroll = u.option(options.restoreScroll, u.castedAttr($form, 'up-restore-scroll'));
      options.origin = u.option(options.origin, $form);
      options.layer = u.option(options.layer, $form.attr('up-layer'), 'auto');
      options.data = up.util.requestDataFromForm($form);
      options = u.merge(options, up.motion.animateOptions(options, $form));
      hasFileInputs = $form.find('input[type=file]').length;
      canAjaxSubmit = !hasFileInputs || u.isFormData(options.data);
      canHistoryOption = up.browser.canPushState() || options.history === false;
      if (options.validate) {
        options.headers || (options.headers = {});
        options.transition = false;
        options.failTransition = false;
        options.headers['X-Up-Validate'] = options.validate;
        if (!canAjaxSubmit) {
          return u.unresolvablePromise();
        }
      }
      up.feedback.start($form);
      if (!(canAjaxSubmit && canHistoryOption)) {
        $form.get(0).submit();
        return u.unresolvablePromise();
      }
      promise = up.replace(target, url, options);
      promise.always(function() {
        return up.feedback.stop($form);
      });
      return promise;
    };

    /**
    Observes form fields and runs a callback when a value changes.
    
    This is useful for observing text fields while the user is typing.
    
    The UJS variant of this is the [`up-observe`](/up-observe) attribute.
    
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
    @param {Element|jQuery|String} selectorOrElement
      The form fields that wiill be observed.
    
      You can pass one or more fields, a `<form>` or any container that contains form fields.
      The callback will be run if any of the given fields change.
    @param {Number} [options.delay=up.form.config.observeDelay]
      The number of miliseconds to wait before executing the callback
      after the input value changes. Use this to limit how often the callback
      will be invoked for a fast typist.
    @param {Function(value, $field)|String} onChange
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
      $fields = u.multiSelector(config.fields).findWithSelf($element);
      callback = null;
      rawCallback = u.option(callbackArg, u.presentAttr($fields, 'up-observe'));
      if (u.isString(rawCallback)) {
        console.debug("**** RAW CALLBACK IS %o", rawCallback);
        callback = function(value, $field) {
          return eval(rawCallback);
        };
      } else {
        callback = rawCallback || up.fail('up.observe: No change callback given');
      }
      delay = u.option($fields.attr('up-delay'), options.delay, config.observeDelay);
      delay = parseInt(delay);
      destructors = u.map($fields, function(field) {
        return observeField($(field), delay, callback);
      });
      return u.sequence.apply(u, destructors);
    };
    observeField = function($field, delay, callback) {
      var changeEvents, check, lastCallbackDone, processedValue, runCallback, timer;
      processedValue = u.submittedValue($field);
      timer = void 0;
      lastCallbackDone = u.resolvedPromise();
      runCallback = function(value) {
        var callbackReturnValue;
        processedValue = value;
        callbackReturnValue = callback.apply($field.get(0), [value, $field]);
        if (u.isPromise(callbackReturnValue)) {
          return lastCallbackDone = callbackReturnValue;
        } else {
          return lastCallbackDone = callbackReturnValue;
        }
      };
      check = function() {
        var nextCallback, value;
        value = u.submittedValue($field);
        if (processedValue !== value) {
          nextCallback = function() {
            return runCallback(value);
          };
          if (timer != null) {
            timer.cancel();
          }
          timer = u.promiseTimer(delay);
          return $.when(timer, lastCallbackDone).then(nextCallback);
        }
      };
      changeEvents = 'input change';
      if (!up.browser.canInputEvent()) {
        changeEvents += ' keypress paste cut click propertychange';
      }
      $field.on(changeEvents, check);
      return function() {
        $field.off(changeEvents, check);
        return timer != null ? timer.cancel() : void 0;
      };
    };

    /**
    [Observes](/up.observe) a field or form and submits the form when a value changes.
    
    The changed form field will be assigned a CSS class [`up-active`](/up-active)
    while the autosubmitted form is processing.
    
    The UJS variant of this is the [`up-autosubmit`](/up-autosubmit) attribute.
    
    @function up.autosubmit
    @param {String|Element|jQuery} selectorOrElement
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

    /**
    Performs a server-side validation of a form and update the form
    with validation messages.
    
    `up.validate()` submits the given field's form with an additional `X-Up-Validate`
    HTTP header. Upon seeing this header, the server is expected to validate (but not save)
    the form submission and render a new copy of the form with validation errors.
    
    The UJS variant of this is the [`[up-validate]`](/up-validate) selector.
    See the documentation for [`[up-validate]`](/up-validate) for more information
    on how server-side validation works in Unpoly.
    
    \#\#\# Example
    
        up.validate('input[name=email]', { target: '.email-errors' })
    
    @function up.validate
    @param {String|Element|jQuery} fieldOrSelector
    @param {String|Element|jQuery} [options.target]
    @return {Promise}
      A promise that is resolved when the server-side
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
      options.history = false;
      options.headers = u.option(options.headers, {});
      options.validate = $field.attr('name') || '__none__';
      options = u.merge(options, up.motion.animateOptions(options, $field));
      $form = $field.closest('form');
      promise = up.submit($form, options);
      return promise;
    };
    currentValuesForSwitch = function($field) {
      var $checkedButton, value, values;
      values = void 0;
      if ($field.is('input[type=checkbox]')) {
        if ($field.is(':checked')) {
          values = [':checked', ':present', $field.val()];
        } else {
          values = [':unchecked', ':blank'];
        }
      } else if ($field.is('input[type=radio]')) {
        $checkedButton = $field.closest('form, body').find("input[type='radio'][name='" + ($field.attr('name')) + "']:checked");
        if ($checkedButton.length) {
          values = [':checked', ':present', $checkedButton.val()];
        } else {
          values = [':unchecked', ':blank'];
        }
      } else {
        value = $field.val();
        if (u.isPresent(value)) {
          values = [':present', value];
        } else {
          values = [':blank'];
        }
      }
      return values;
    };
    currentValuesForSwitch = function($field) {
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

    /**
    Shows or hides a target selector depending on the value.
    
    See [`[up-switch]`](/up-switch) for more documentation and examples.
    
    This function does not currently have a very useful API outside
    of our use for `up-switch`'s UJS behavior, that's why it's currently
    still marked `@internal`.
    
    @function up.form.switchTargets
    @param {String|Element|jQuery} fieldOrSelector
    @param {String} [options.target]
      The target selectors to switch.
      Defaults to an `up-switch` attribute on the given field.
    @internal
     */
    switchTargets = function(fieldOrSelector, options) {
      var $field, fieldValues, targets;
      $field = $(fieldOrSelector);
      options = u.options(options);
      targets = u.option(options.target, $field.attr('up-switch'));
      u.isPresent(targets) || up.fail("No switch target given for %o", $field.get(0));
      fieldValues = currentValuesForSwitch($field);
      return $(targets).each(function() {
        var $target, hideValues, show, showValues;
        $target = $(this);
        if (hideValues = $target.attr('up-hide-for')) {
          hideValues = hideValues.split(' ');
          show = u.intersect(fieldValues, hideValues).length === 0;
        } else {
          if (showValues = $target.attr('up-show-for')) {
            showValues = showValues.split(' ');
          } else {
            showValues = [':present', ':checked'];
          }
          show = u.intersect(fieldValues, showValues).length > 0;
        }
        return $target.toggle(show);
      });
    };

    /**
    Forms with an `up-target` attribute are [submitted via AJAX](/up.submit)
    instead of triggering a full page reload.
    
        <form method="post" action="/users" up-target=".main">
          ...
        </form>
    
    The server response is searched for the selector given in `up-target`.
    The selector content is then [replaced](/up.replace) in the current page.
    
    The programmatic variant of this is the [`up.submit()`](/up.submit) function.
    
    \#\#\# Failed submission
    
    When the server was unable to save the form due to invalid data,
    it will usually re-render an updated copy of the form with
    validation messages.
    
    For Unpoly to be able to detect a failed form submission,,
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
    
    Note that you can also use the
    [`up-validate`](/up-validate) attribute to perform server-side
    validations while the user is completing fields.
    
    \#\#\# Redirects
    
    Unpoly requires two additional response headers to detect redirects,
    which are otherwise undetectable for an AJAX client.
    
    When the form's action performs a redirect, the server should echo
    the new request's URL as a response header `X-Up-Location`
    and the request's HTTP method as `X-Up-Method: GET`.
    
    If you are using Unpoly via the `unpoly-rails` gem, these headers
    are set automatically for every request.
    
    \#\#\# Giving feedback while the form is processing
    
    The `<form>` element will be assigned a CSS class `up-active` while
    the submission is loading.
    
    You can also [implement a spinner](/up.proxy/#spinners)
    by [listening](/up.on) to the [`up:proxy:slow`](/up:proxy:slow)
    and [`up:proxy:recover`](/up:proxy:recover) events.
    
    @selector form[up-target]
    @param {String} up-target
      The selector to [replace](/up.replace) if the form submission is successful (200 status code).
    @param {String} [up-fail-target]
      The selector to [replace](/up.replace) if the form submission is not successful (non-200 status code).
      If omitted, Unpoly will replace the `<form>` tag itself, assuming that the
      server has echoed the form with validation errors.
    @param [up-fallback]
      The selector to replace if the server responds with a non-200 status code.
    @param {String} [up-transition]
      The animation to use when the form is replaced after a successful submission.
    @param {String} [up-fail-transition]
      The animation to use when the form is replaced after a failed submission.
    @param [up-history]
      Whether to push a browser history entry after a successful form submission.
    
      By default the form's target URL is used. If the form redirects to another URL,
      the redirect target will be used.
    
      Set this to `'false'` to prevent the URL bar from being updated.
      Set this to a URL string to update the history with the given URL.
    @param {String} [up-method]
      The HTTP method to be used to submit the form (`get`, `post`, `put`, `delete`, `patch`).
      Alternately you can use an attribute `data-method`
      ([Rails UJS](https://github.com/rails/jquery-ujs/wiki/Unobtrusive-scripting-support-for-jQuery))
      or `method` (vanilla HTML) for the same purpose.
    @param {String} [up-reveal='true']
      Whether to reveal the target element within its viewport before updating.
    @param {String} [up-restore-scroll='false']
      Whether to restore previously known scroll position of all viewports
      within the target selector.
    @param {String} [up-cache]
      Whether to force the use of a cached response (`true`)
      or never use the cache (`false`)
      or make an educated guess (`undefined`).
    
      By default only responses to `GET` requests are cached for a few minutes.
    @stable
     */
    up.on('submit', 'form[up-target]', function(event, $form) {
      up.bus.consumeAction(event);
      return submit($form);
    });

    /**
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
    
    You can change this default behavior by setting [`up.form.config.validateTargets`](/up.form.config#validateTargets):
    
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
    
    @selector [up-validate]
    @param {String} up-validate
      The CSS selector to update with the server response.
    
      This defaults to a fieldset or form group around the validating field.
    @stable
     */
    up.on('change', '[up-validate]', function(event, $field) {
      return validate($field);
    });

    /**
    Show or hide part of a form if certain options are selected or boxes are checked.
    
    \#\#\# Example
    
    The triggering input gets an `up-switch` attribute with a selector for the elements to show or hide:
    
        <select name="advancedness" up-switch=".target">
          <option value="basic">Basic parts</option>
          <option value="advanced">Advanced parts</option>
          <option value="very-advanced">Very advanced parts</option>
        </select>
    
    The target elements get a space-separated list of select values for which they are shown or hidden:
    
        <div class="target" up-show-for="basic">
          only shown for advancedness = basic
        </div>
    
        <div class="target" up-hide-for="basic">
          hidden for advancedness = basic
        </div>
    
        <div class="target" up-show-for="advanced very-advanced">
          shown for advancedness = advanced or very-advanced
        </div>
    
    For checkboxes you can also use the pseudo-values `:checked` or `:unchecked` like so:
    
        <input type="checkbox" name="flag" up-switch=".target">
    
        <div class="target" up-show-for=":checked">
          only shown when checkbox is checked
        </div>
    
    You can also use the pseudo-values `:blank` to match an empty input value,
    or `:present` to match a non-empty input value:
    
        <input type="text" name="email" up-switch=".target">
    
        <div class="target" up-show-for=":blank">
          please enter an email address
        </div>
    
    @selector [up-switch]
    @stable
     */

    /**
    Show this element only if a form field has a given value.
    
    See [`[up-switch]`](/up-switch) for more documentation and examples.
    
    @selector [up-show-for]
    @param up-show-for
      A space-separated list of values for which to show this element.
    @stable
     */

    /**
    Hide this element if a form field has a given value.
    
    See [`[up-switch]`](/up-switch) for more documentation and examples.
    
    @selector [up-hide-for]
    @param up-hide-for
      A space-separated list of values for which to hide this element.
    @stable
     */
    up.on('change', '[up-switch]', function(event, $field) {
      return switchTargets($field);
    });
    up.compiler('[up-switch]', function($field) {
      return switchTargets($field);
    });

    /**
    Observes this field or form and runs a callback when a value changes.
    
    This is useful for observing text fields while the user is typing.
    
    The programmatic variant of this is the [`up.observe()`](/up.observe) function.
    
    \#\#\# Example
    
    The following would run a global `showSuggestions(value)` function
    whenever the `<input>` changes:
    
        <form>
          <input type="query" up-observe="showSuggestions(value)">
        </form>
    
    \#\#\# Callback context
    
    The script given to `up-observe` runs with the following context:
    
    | Name     | Type      | Description                           |
    | -------- | --------- | ------------------------------------- |
    | `value`  | `String`  | The current value of the field        |
    | `this`   | `Element` | The form field                        |
    | `$field` | `jQuery`  | The form field as a jQuery collection |
    
    @selector [up-observe]
    @param {String} up-observe
      The code to run when the field's value changes.
    @param {String} up-delay
      The number of miliseconds to wait after a change before the code is run.
    @stable
     */
    up.compiler('[up-observe]', function($formOrField) {
      return observe($formOrField);
    });

    /**
    [Observes](/up.observe) this field or form and submits the form when a value changes.
    
    The form field will be assigned a CSS class [`up-active`](/up-active)
    while the autosubmitted form is processing.
    
    The programmatic variant of this is the [`up.autosubmit()`](/up.autosubmit) function.
    
    \#\#\# Example
    
    The following would submit the form whenever the
    text field value changes:
    
        <form method="GET" action="/search" up-autosubmit>
          <input type="search" name="query">
        </form>
    
    The following would submit the form only if the query was changed,
    but not if the checkbox was changed:
    
        <form method="GET" action="/search">
          <input type="search" name="query" up-autosubmit>
          <input type="checkbox"> Include archive
        </form>
    
    @selector [up-autosubmit]
    @param {String} up-delay
      The number of miliseconds to wait after the change before the form is submitted.
    @stable
     */
    up.compiler('[up-autosubmit]', function($formOrField) {
      return autosubmit($formOrField);
    });
    up.on('up:framework:reset', reset);
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      config: config,
      submit: submit,
      observe: observe,
      validate: validate,
      switchTargets: switchTargets,
      autosubmit: autosubmit
    };
  })(jQuery);

  up.submit = up.form.submit;

  up.observe = up.form.observe;

  up.autosubmit = up.form.autosubmit;

  up.validate = up.form.validate;

}).call(this);

/**
Pop-up overlays
===============

Instead of [linking to a page fragment](/up.link), you can choose
to show a fragment in a popup overlay that rolls down from an anchoring element.

To open a popup, add an [`up-popup` attribute](/up-popup) to a link:

    <a href="/options" up-popup=".menu">Show options</a>

When this link is clicked, Unpoly will request the path `/options` and extract
an element matching the selector `.menu` from the response. The matching element
will then be placed in the popup overlay.


\#\#\# Closing behavior

The popup closes when the user clicks anywhere outside the popup area.

The popup also closes *when a link within the popup changes a fragment behind the popup*.
This is useful to have the popup interact with the page that
opened it, e.g. by updating parts of a larger form.

To disable this behavior, give the opening link an [`up-sticky`](/up-popup#up-sticky) attribute.


\#\#\# Customizing the popup design

Popups have a minimal default design:

- Popup contents are displayed in a white box
- There is a a subtle box shadow around the popup
- The box will grow to fit the popup contents

The easiest way to change how the popup looks is to override the
[default CSS styles](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/up/popup.css.sass).

The HTML of a popup element is simply this:

    <div class="up-popup">
      ...
    </div>


@class up.popup
 */

(function() {
  up.popup = (function($) {
    var align, attachAsap, attachNow, autoclose, chain, closeAsap, closeNow, config, contains, createFrame, discardHistory, isOpen, reset, state, u;
    u = up.util;

    /**
    Sets default options for future popups.
    
    @property up.popup.config
    @param {String} [config.position='bottom-right']
      Defines where the popup is attached to the opening element.
    
      Valid values are `bottom-right`, `bottom-left`, `top-right` and `top-left`.
    @param {String} [config.history=false]
      Whether opening a popup will add a browser history entry.
    @param {String} [config.openAnimation='fade-in']
      The animation used to open a popup.
    @param {String} [config.closeAnimation='fade-out']
      The animation used to close a popup.
    @param {String} [config.openDuration]
      The duration of the open animation (in milliseconds).
    @param {String} [config.closeDuration]
      The duration of the close animation (in milliseconds).
    @param {String} [config.openEasing]
      The timing function controlling the acceleration of the opening animation.
    @param {String} [config.closeEasing]
      The timing function controlling the acceleration of the closing animation.
    @param {Boolean} [options.sticky=false]
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

    /**
    Returns the URL from which the current popup's contents were loaded.
    
    Returns `undefined` if no  popup is open.
    
    @function up.popup.url
    @return {String}
      the source URL
    @stable
     */

    /**
    Returns the URL of the page or modal behind the popup.
    
    @function up.popup.coveredUrl
    @return {String}
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
      var css, linkBox, popupBox;
      css = {};
      popupBox = u.measure(state.$popup);
      if (u.isFixed(state.$anchor)) {
        linkBox = state.$anchor.get(0).getBoundingClientRect();
        css['position'] = 'fixed';
      } else {
        linkBox = u.measure(state.$anchor);
      }
      switch (state.position) {
        case 'bottom-right':
          css['top'] = linkBox.top + linkBox.height;
          css['left'] = linkBox.left + linkBox.width - popupBox.width;
          break;
        case 'bottom-left':
          css['top'] = linkBox.top + linkBox.height;
          css['left'] = linkBox.left;
          break;
        case 'top-right':
          css['top'] = linkBox.top - popupBox.height;
          css['left'] = linkBox.left + linkBox.width - popupBox.width;
          break;
        case 'top-left':
          css['top'] = linkBox.top - popupBox.height;
          css['left'] = linkBox.left;
          break;
        default:
          up.fail("Unknown position option '%s'", state.position);
      }
      state.$popup.attr('up-position', state.position);
      return state.$popup.css(css);
    };
    discardHistory = function() {
      state.coveredTitle = null;
      return state.coveredUrl = null;
    };
    createFrame = function(target) {
      var $popup;
      $popup = u.$createElementFromSelector('.up-popup');
      u.$createPlaceholder(target, $popup);
      $popup.appendTo(document.body);
      return state.$popup = $popup;
    };

    /**
    Returns whether popup modal is currently open.
    
    @function up.popup.isOpen
    @return {Boolean}
    @stable
     */
    isOpen = function() {
      return state.phase === 'opened' || state.phase === 'opening';
    };

    /**
    Attaches a popup overlay to the given element or selector.
    
    Emits events [`up:popup:open`](/up:popup:open) and [`up:popup:opened`](/up:popup:opened).
    
    @function up.popup.attach
    @param {Element|jQuery|String} anchor
      The element to which the popup will be attached.
    @param {String} [options.url]
      The URL from which to fetch the popup contents.
    
      If omitted, the `href` or `up-href` attribute of the anchor element will be used.
    
      Will be ignored if `options.html` is given.
    @param {String} [options.target]
      A CSS selector that will be extracted from the response and placed into the popup.
    @param {String} [options.position='bottom-right']
      Defines where the popup is attached to the opening element.
    
      Valid values are `bottom-right`, `bottom-left`, `top-right` and `top-left`.
    @param {String} [options.html]
      A string of HTML from which to extract the popup contents. No network request will be made.
    @param {String} [options.confirm]
      A message that will be displayed in a cancelable confirmation dialog
      before the modal is being opened.
    @param {String} [options.animation]
      The animation to use when opening the popup.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate()`](/up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate()`](/up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate()`](/up.animate).
    @param {String} [options.method="GET"]
      Override the request method.
    @param {Boolean} [options.sticky=false]
      If set to `true`, the popup remains
      open even if the page changes in the background.
    @param {Object} [options.history=false]
    @return {Promise}
      A promise that will be resolved when the popup has been loaded and
      the opening animation has completed.
    @stable
     */
    attachAsap = function(elementOrSelector, options) {
      var curriedAttachNow;
      curriedAttachNow = function() {
        return attachNow(elementOrSelector, options);
      };
      if (isOpen()) {
        chain.asap(closeNow, curriedAttachNow);
      } else {
        chain.asap(curriedAttachNow);
      }
      return chain.promise();
    };
    attachNow = function(elementOrSelector, options) {
      var $anchor, animateOptions, html, position, target, url;
      $anchor = $(elementOrSelector);
      $anchor.length || up.fail('Cannot attach popup to non-existing element %o', elementOrSelector);
      options = u.options(options);
      url = u.option(u.pluckKey(options, 'url'), $anchor.attr('up-href'), $anchor.attr('href'));
      html = u.option(u.pluckKey(options, 'html'));
      target = u.option(u.pluckKey(options, 'target'), $anchor.attr('up-popup'), 'body');
      position = u.option(options.position, $anchor.attr('up-position'), config.position);
      options.animation = u.option(options.animation, $anchor.attr('up-animation'), config.openAnimation);
      options.sticky = u.option(options.sticky, u.castedAttr($anchor, 'up-sticky'), config.sticky);
      options.history = up.browser.canPushState() ? u.option(options.history, u.castedAttr($anchor, 'up-history'), config.history) : false;
      options.confirm = u.option(options.confirm, $anchor.attr('up-confirm'));
      options.method = up.link.followMethod($anchor, options);
      options.layer = 'popup';
      animateOptions = up.motion.animateOptions(options, $anchor, {
        duration: config.openDuration,
        easing: config.openEasing
      });
      return up.browser.whenConfirmed(options).then(function() {
        return up.bus.whenEmitted('up:popup:open', {
          url: url,
          message: 'Opening popup'
        }).then(function() {
          var extractOptions, promise;
          state.phase = 'opening';
          state.$anchor = $anchor;
          state.position = position;
          if (options.history) {
            state.coveredUrl = up.browser.url();
            state.coveredTitle = document.title;
          }
          state.sticky = options.sticky;
          options.provideTarget = function() {
            return createFrame(target);
          };
          extractOptions = u.merge(options, {
            animation: false
          });
          if (html) {
            promise = up.extract(target, html, extractOptions);
          } else {
            promise = up.replace(target, url, extractOptions);
          }
          promise = promise.then(function() {
            align();
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

    /**
    This event is [emitted](/up.emit) when a popup is starting to open.
    
    @event up:popup:open
    @param event.preventDefault()
      Event listeners may call this method to prevent the popup from opening.
    @stable
     */

    /**
    This event is [emitted](/up.emit) when a popup has finished opening.
    
    @event up:popup:opened
    @stable
     */

    /**
    Closes a currently opened popup overlay.
    
    Does nothing if no popup is currently open.
    
    Emits events [`up:popup:close`](/up:popup:close) and [`up:popup:closed`](/up:popup:closed).
    
    @function up.popup.close
    @param {Object} options
      See options for [`up.animate()`](/up.animate).
    @return {Promise}
      A promise that will be resolved once the modal's close
      animation has finished.
    @stable
     */
    closeAsap = function(options) {
      if (isOpen()) {
        chain.asap(function() {
          return closeNow(options);
        });
      }
      return chain.promise();
    };
    closeNow = function(options) {
      var animateOptions;
      if (!isOpen()) {
        return u.resolvedPromise();
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

    /**
    This event is [emitted](/up.emit) when a popup dialog
    is starting to [close](/up.popup.close).
    
    @event up:popup:close
    @param event.preventDefault()
      Event listeners may call this method to prevent the popup from closing.
    @stable
     */

    /**
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

    /**
    Returns whether the given element or selector is contained
    within the current popup.
    
    @methods up.popup.contains
    @param {String} elementOrSelector
      The element to test
    @return {Boolean}
    @stable
     */
    contains = function(elementOrSelector) {
      var $element;
      $element = $(elementOrSelector);
      return $element.closest('.up-popup').length > 0;
    };

    /**
    Opens this link's destination of in a popup overlay:
    
        <a href="/decks" up-popup=".deck_list">Switch deck</a>
    
    If the `up-sticky` attribute is set, the dialog does not auto-close
    if a page fragment behind the popup overlay updates:
    
        <a href="/decks" up-popup=".deck_list">Switch deck</a>
        <a href="/settings" up-popup=".options" up-sticky>Settings</a>
    
    @selector [up-popup]
    @param {String} up-popup
      The CSS selector that will be extracted from the response and
      displayed in a popup overlay.
    @param [up-position]
      Defines where the popup is attached to the opening element.
    
      Valid values are `bottom-right`, `bottom-left`, `top-right` and `top-left`.
    @param {String} [up-confirm]
      A message that will be displayed in a cancelable confirmation dialog
      before the popup is opened.
    @param {String} [up-method='GET']
      Override the request method.
    @param [up-sticky]
      If set to `true`, the popup remains
      open even if the page changes in the background.
    @param {String} [up-history='false']
      Whether to push an entry to the browser history for the popup's source URL.
    
      Set this to `'false'` to prevent the URL bar from being updated.
      Set this to a URL string to update the history with the given URL.
    
    @stable
     */
    up.link.onAction('[up-popup]', function($link) {
      if ($link.is('.up-current')) {
        return closeAsap();
      } else {
        return attachAsap($link);
      }
    });
    up.on('click up:action:consumed', function(event) {
      var $target;
      $target = $(event.target);
      if (!$target.closest('.up-popup, [up-popup]').length) {
        return closeAsap();
      }
    });
    up.on('up:fragment:inserted', function(event, $fragment) {
      var newSource;
      if (contains($fragment)) {
        if (newSource = $fragment.attr('up-source')) {
          return state.url = newSource;
        }
      } else if (contains(event.origin)) {
        return autoclose();
      }
    });
    up.bus.onEscape(closeAsap);

    /**
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
      closeAsap();
      return up.bus.consumeAction(event);
    });
    up.on('up:framework:reset', reset);
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
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

/**
Modal dialogs
=============

Instead of [linking to a page fragment](/up.link), you can choose to show a fragment
in a modal dialog. The existing page will remain open in the background.

To open a modal, add an [`up-modal`](/up-modal) attribute to a link:

    <a href="/blogs" up-modal=".blog-list">Switch blog</a>

When this link is clicked, Unpoly will request the path `/blogs` and extract
an element matching the selector `.blog-list` from the response. The matching element
will then be placed in a modal dialog.


\#\#\# Closing behavior

By default the dialog automatically closes
*when a link inside a modal changes a fragment behind the modal*.
This is useful to have the dialog interact with the page that
opened it, e.g. by updating parts of a larger form.

To disable this behavior, give the opening link an [`up-sticky`](/up-modal#up-sticky) attribute:


\#\#\# Customizing the dialog design

Dialogs have a minimal default design:

- Contents are displayed in a white box with a subtle box shadow
- The box will grow to fit the dialog contents, but never grow larger than the screen
- The box is placed over a semi-transparent backdrop to dim the rest of the page
- There is a button to close the dialog in the top-right corner

The easiest way to change how the dialog looks is to override the
[default CSS styles](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/up/modal.css.sass).

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
    var animate, autoclose, chain, closeAsap, closeNow, config, contains, createFrame, discardHistory, extractAsap, flavor, flavorDefault, flavorOverrides, flavors, followAsap, isOpen, markAsAnimating, openAsap, openNow, reset, shiftElements, state, templateHtml, u, unshiftElements, visitAsap;
    u = up.util;

    /**
    Sets default options for future modals.
    
    @property up.modal.config
    @param {String} [config.history=true]
      Whether opening a modal will add a browser history entry.
    @param {Number} [config.width]
      The width of the dialog as a CSS value like `'400px'` or `'50%'`.
    
      Defaults to `undefined`, meaning that the dialog will grow to fit its contents
      until it reaches `config.maxWidth`. Leaving this as `undefined` will
      also allow you to control the width using CSS on `.up-modal-dialog´.
    @param {Number} [config.maxWidth]
      The width of the dialog as a CSS value like `'400px'` or `50%`.
      You can set this to `undefined` to make the dialog fit its contents.
      Be aware however, that e.g. Bootstrap stretches input elements
      to `width: 100%`, meaning the dialog will also stretch to the full
      width of the screen.
    @param {Number} [config.height='auto']
      The height of the dialog in pixels.
      Defaults to `undefined`, meaning that the dialog will grow to fit its contents.
    @param {String|Function(config)} [config.template]
      A string containing the HTML structure of the modal.
      You can supply an alternative template string, but make sure that it
      defines tag with the classes `up-modal`, `up-modal-dialog` and  `up-modal-content`.
    
      You can also supply a function that returns a HTML string.
      The function will be called with the modal options (merged from these defaults
      and any per-open overrides) whenever a modal opens.
    @param {String} [config.closeLabel='×']
      The label of the button that closes the dialog.
    @param {Boolean} [config.closable=true]
      When `true`, the modal will render a close icon and close when the user
      clicks on the backdrop or presses Escape.
    
      When `false`, you need to either supply an element with `[up-close]` or
      close the modal manually with `up.modal.close()`.
    @param {String} [config.openAnimation='fade-in']
      The animation used to open the viewport around the dialog.
    @param {String} [config.closeAnimation='fade-out']
      The animation used to close the viewport the dialog.
    @param {String} [config.backdropOpenAnimation='fade-in']
      The animation used to open the backdrop that dims the page below the dialog.
    @param {String} [config.backdropCloseAnimation='fade-out']
      The animation used to close the backdrop that dims the page below the dialog.
    @param {Number} [config.openDuration]
      The duration of the open animation (in milliseconds).
    @param {Number} [config.closeDuration]
      The duration of the close animation (in milliseconds).
    @param {String} [config.openEasing]
      The timing function controlling the acceleration of the opening animation.
    @param {String} [config.closeEasing]
      The timing function controlling the acceleration of the closing animation.
    @param {Boolean} [options.sticky=false]
      If set to `true`, the modal remains
      open even it changes the page in the background.
    @param {String} [options.flavor='default']
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

    /**
    Define modal variants with their own default configuration, CSS or HTML template.
    
    \#\#\# Example
    
    Unpoly's [`[up-drawer]`](/up-drawer) is implemented as a modal flavor:
    
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

    /**
    Returns the source URL for the fragment displayed in the current modal overlay,
    or `undefined` if no modal is currently open.
    
    @function up.modal.url
    @return {String}
      the source URL
    @stable
     */

    /**
    Returns the URL of the page behind the modal overlay.
    
    @function up.modal.coveredUrl
    @return {String}
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
    createFrame = function(target, options) {
      var $content, $dialog, $modal;
      $modal = $(templateHtml());
      $modal.attr('up-flavor', state.flavor);
      if (u.isPresent(state.position)) {
        $modal.attr('up-position', state.position);
      }
      $dialog = $modal.find('.up-modal-dialog');
      if (u.isPresent(options.width)) {
        $dialog.css('width', options.width);
      }
      if (u.isPresent(options.maxWidth)) {
        $dialog.css('max-width', options.maxWidth);
      }
      if (u.isPresent(options.height)) {
        $dialog.css('height', options.height);
      }
      if (!state.closable) {
        $modal.find('.up-modal-close').remove();
      }
      $content = $modal.find('.up-modal-content');
      u.$createPlaceholder(target, $content);
      $modal.appendTo(document.body);
      return state.$modal = $modal;
    };
    shiftElements = function() {
      var $body, bodyRightPadding, bodyRightShift, scrollbarWidth, unshiftBody;
      if (u.documentHasVerticalScrollbar()) {
        $body = $('body');
        scrollbarWidth = u.scrollbarWidth();
        bodyRightPadding = parseFloat($body.css('padding-right'));
        bodyRightShift = scrollbarWidth + bodyRightPadding;
        unshiftBody = u.temporaryCss($body, {
          'padding-right': bodyRightShift + "px",
          'overflow-y': 'hidden'
        });
        state.unshifters.push(unshiftBody);
        return up.layout.anchoredRight().each(function() {
          var $element, elementRight, elementRightShift, unshifter;
          $element = $(this);
          elementRight = parseFloat($element.css('right'));
          elementRightShift = scrollbarWidth + elementRight;
          unshifter = u.temporaryCss($element, {
            'right': elementRightShift
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

    /**
    Returns whether a modal is currently open.
    
    This also returns `true` if the modal is in an opening or closing animation.
    
    @function up.modal.isOpen
    @return {Boolean}
    @stable
     */
    isOpen = function() {
      return state.phase === 'opened' || state.phase === 'opening';
    };

    /**
    Opens the given link's destination in a modal overlay:
    
        var $link = $('...');
        up.modal.follow($link);
    
    Any option attributes for [`a[up-modal]`](/a.up-modal) will be honored.
    
    Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).
    
    @function up.modal.follow
    @param {Element|jQuery|String} linkOrSelector
      The link to follow.
    @param {String} [options.target]
      The selector to extract from the response and open in a modal dialog.
    @param {Number} [options.width]
      The width of the dialog in pixels.
      By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {Number} [options.height]
      The width of the dialog in pixels.
      By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {Boolean} [options.sticky=false]
      If set to `true`, the modal remains
      open even it changes the page in the background.
    @param {Boolean} [config.closable=true]
      When `true`, the modal will render a close icon and close when the user
      clicks on the backdrop or presses Escape.
    
      When `false`, you need to either supply an element with `[up-close]` or
      close the modal manually with `up.modal.close()`.
    @param {String} [options.confirm]
      A message that will be displayed in a cancelable confirmation dialog
      before the modal is being opened.
    @param {String} [options.method="GET"]
      Override the request method.
    @param {Object} [options.history=true]
      Whether to add a browser history entry for the modal's source URL.
    @param {String} [options.animation]
      The animation to use when opening the modal.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate()`](/up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate()`](/up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate()`](/up.animate).
    @return {Promise}
      A promise that will be resolved when the modal has been loaded and
      the opening animation has completed.
    @stable
     */
    followAsap = function(linkOrSelector, options) {
      options = u.options(options);
      options.$link = $(linkOrSelector);
      return openAsap(options);
    };

    /**
    Opens a modal for the given URL.
    
    \#\#\# Example
    
        up.modal.visit('/foo', { target: '.list' });
    
    This will request `/foo`, extract the `.list` selector from the response
    and open the selected container in a modal dialog.
    
    Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).
    
    @function up.modal.visit
    @param {String} url
      The URL to load.
    @param {String} options.target
      The CSS selector to extract from the response.
      The extracted content will be placed into the dialog window.
    @param {Object} options
      See options for [`up.modal.follow()`](/up.modal.follow).
    @return {Promise}
      A promise that will be resolved when the modal has been loaded and the opening
      animation has completed.
    @stable
     */
    visitAsap = function(url, options) {
      options = u.options(options);
      options.url = url;
      return openAsap(options);
    };

    /**
    [Extracts](/up.extract) the given CSS selector from the given HTML string and
    opens the results in a modal.
    
    \#\#\# Example
    
        var html = 'before <div class="content">inner</div> after';
        up.modal.extract('.content', html);
    
    The would open a modal with the following contents:
    
        <div class="content">inner</div>
    
    Emits events [`up:modal:open`](/up:modal:open) and [`up:modal:opened`](/up:modal:opened).
    
    @function up.modal.extract
    @param {String} selector
      The CSS selector to extract from the HTML.
    @param {String} html
      The HTML containing the modal content.
    @param {Object} options
      See options for [`up.modal.follow()`](/up.modal.follow).
    @return {Promise}
      A promise that will be resolved when the modal has been opened and the opening
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
      var curriedOpenNow;
      curriedOpenNow = function() {
        return openNow(options);
      };
      if (isOpen()) {
        chain.asap(closeNow, curriedOpenNow);
      } else {
        chain.asap(curriedOpenNow);
      }
      return chain.promise();
    };
    openNow = function(options) {
      var $link, animateOptions, html, target, url;
      options = u.options(options);
      $link = u.option(u.pluckKey(options, '$link'), u.nullJQuery());
      url = u.option(u.pluckKey(options, 'url'), $link.attr('up-href'), $link.attr('href'));
      html = u.option(u.pluckKey(options, 'html'));
      target = u.option(u.pluckKey(options, 'target'), $link.attr('up-modal'), 'body');
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
      animateOptions = up.motion.animateOptions(options, $link, {
        duration: flavorDefault('openDuration', options.flavor),
        easing: flavorDefault('openEasing', options.flavor)
      });
      options.history = u.option(options.history, u.castedAttr($link, 'up-history'), flavorDefault('history', options.flavor));
      if (!up.browser.canPushState()) {
        options.history = false;
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
          options.provideTarget = function() {
            return createFrame(target, options);
          };
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

    /**
    This event is [emitted](/up.emit) when a modal dialog is starting to open.
    
    @event up:modal:open
    @param event.preventDefault()
      Event listeners may call this method to prevent the modal from opening.
    @stable
     */

    /**
    This event is [emitted](/up.emit) when a modal dialog has finished opening.
    
    @event up:modal:opened
    @stable
     */

    /**
    Closes a currently opened modal overlay.
    
    Does nothing if no modal is currently open.
    
    Emits events [`up:modal:close`](/up:modal:close) and [`up:modal:closed`](/up:modal:closed).
    
    @function up.modal.close
    @param {Object} options
      See options for [`up.animate()`](/up.animate)
    @return {Promise}
      A promise that will be resolved once the modal's close
      animation has finished.
    @stable
     */
    closeAsap = function(options) {
      if (isOpen()) {
        chain.asap(function() {
          return closeNow(options);
        });
      }
      return chain.promise();
    };
    closeNow = function(options) {
      var animateOptions, backdropCloseAnimation, destroyOptions, viewportCloseAnimation;
      if (!isOpen()) {
        return u.resolvedPromise();
      }
      options = u.options(options);
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
        return u.resolvedPromise();
      } else {
        markAsAnimating();
        promise = $.when(up.animate(state.$modal.find('.up-modal-viewport'), viewportAnimation, animateOptions), up.animate(state.$modal.find('.up-modal-backdrop'), backdropAnimation, animateOptions));
        promise = promise.then(function() {
          return markAsAnimating(false);
        });
        return promise;
      }
    };

    /**
    This event is [emitted](/up.emit) when a modal dialog
    is starting to [close](/up.modal.close).
    
    @event up:modal:close
    @param event.preventDefault()
      Event listeners may call this method to prevent the modal from closing.
    @stable
     */

    /**
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

    /**
    Returns whether the given element or selector is contained
    within the current modal.
    
    @function up.modal.contains
    @param {String} elementOrSelector
      The element to test
    @return {Boolean}
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
      up.log.warn('The up.modal.flavor function is deprecated. Use the up.modal.flavors property instead.');
      return u.assign(flavorOverrides(name), overrideConfig);
    };

    /**
    Returns a config object for the given flavor.
    Properties in that config should be preferred to the defaults in
    [`/up.modal.config`](/up.modal.config).
    
    @function flavorOverrides
    @internal
     */
    flavorOverrides = function(flavor) {
      return flavors[flavor] || (flavors[flavor] = {});
    };

    /**
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

    /**
    Clicking this link will load the destination via AJAX and open
    the given selector in a modal dialog.
    
    \#\#\# Example
    
        <a href="/blogs" up-modal=".blog-list">Switch blog</a>
    
    Clicking would request the path `/blog` and select `.blog-list` from
    the HTML response. Unpoly will dim the page
    and place the matching `.blog-list` tag will be placed in
    a modal dialog.
    
    @selector [up-modal]
    @param {String} up-modal
      The CSS selector that will be extracted from the response and displayed in a modal dialog.
    @param {String} [up-confirm]
      A message that will be displayed in a cancelable confirmation dialog
      before the modal is opened.
    @param {String} [up-method='GET']
      Override the request method.
    @param {String} [up-sticky]
      If set to `"true"`, the modal remains
      open even if the page changes in the background.
    @param {Boolean} [up-closable]
      When `true`, the modal will render a close icon and close when the user
      clicks on the backdrop or presses Escape.
    
      When `false`, you need to either supply an element with `[up-close]` or
      close the modal manually with `up.modal.close()`.
    @param {String} [up-animation]
      The animation to use when opening the viewport containing the dialog.
    @param {String} [up-backdrop-animation]
      The animation to use when opening the backdrop that dims the page below the dialog.
    @param {String} [up-height]
      The width of the dialog in pixels.
      By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {String} [up-width]
      The width of the dialog in pixels.
      By [default](/up.modal.config) the dialog will grow to fit its contents.
    @param {String} [up-history]
      Whether to push an entry to the browser history for the modal's source URL.
    
      Set this to `'false'` to prevent the URL bar from being updated.
      Set this to a URL string to update the history with the given URL.
    
    @stable
     */
    up.link.onAction('[up-modal]', function($link) {
      return followAsap($link);
    });
    up.on('click', function(event) {
      var $target;
      if (!state.closable) {
        return;
      }
      $target = $(event.target);
      if (!($target.closest('.up-modal-dialog').length || $target.closest('[up-modal]').length)) {
        up.bus.consumeAction(event);
        return closeAsap();
      }
    });
    up.on('up:fragment:inserted', function(event, $fragment) {
      var newSource;
      if (contains($fragment)) {
        if (newSource = $fragment.attr('up-source')) {
          return state.url = newSource;
        }
      } else if (contains(event.origin) && !up.popup.contains($fragment)) {
        return autoclose();
      }
    });
    up.bus.onEscape(function() {
      if (state.closable) {
        return closeAsap();
      }
    });

    /**
    When this element is clicked, closes a currently open dialog.
    
    Does nothing if no modal is currently open.
    
    To make a link that closes the current modal, but follows to
    a fallback destination if no modal is open:
    
        <a href="/fallback" up-close>Okay</a>
    
    @selector .up-modal [up-close]
    @stable
     */
    up.on('click', '.up-modal [up-close]', function(event, $element) {
      closeAsap();
      return up.bus.consumeAction(event);
    });

    /**
    Clicking this link will load the destination via AJAX and open
    the given selector in a modal drawer that slides in from the edge of the screen.
    
    You can configure drawers using the [`up.modal.flavors.drawer`](/up.modal.flavors.drawer) property.
    
    \#\#\# Example
    
        <a href="/blogs" up-drawer=".blog-list">Switch blog</a>
    
    Clicking would request the path `/blog` and select `.blog-list` from
    the HTML response. Unpoly will dim the page
    and place the matching `.blog-list` tag will be placed in
    a modal drawer.
    
    @selector [up-drawer]
    @param {String} up-drawer
      The CSS selector to extract from the response and open in the drawer.
    @param {String} [up-position='auto']
      The side from which the drawer slides in.
    
      Valid values are `'left'`, `'right'` and `'auto'`. If set to `'auto'`, the
      drawer will slide in from left if the opening link is on the left half of the screen.
      Otherwise it will slide in from the right.
    @stable
     */
    up.macro('[up-drawer]', function($link) {
      var target;
      target = $link.attr('up-drawer');
      return $link.attr({
        'up-modal': target,
        'up-flavor': 'drawer'
      });
    });

    /**
    Sets default options for future drawers.
    
    @property up.modal.flavors.drawer
    @param {Object} config
      Default options for future drawers.
    
      See [`up.modal.config`] for available options.
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
    up.on('up:framework:reset', reset);
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
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

/**
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

To change the styling, simply override the [CSS rules](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/up/tooltip.css.sass) for the `.up-tooltip` selector and its `:after`
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

    /**
    Sets default options for future tooltips.
    
    @property up.tooltip.config
    @param {String} [config.position]
      The default position of tooltips relative to the element.
      Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
    @param {String} [config.openAnimation='fade-in']
      The animation used to open a tooltip.
    @param {String} [config.closeAnimation='fade-out']
      The animation used to close a tooltip.
    @param {Number} [config.openDuration]
      The duration of the open animation (in milliseconds).
    @param {Number} [config.closeDuration]
      The duration of the close animation (in milliseconds).
    @param {String} [config.openEasing]
      The timing function controlling the acceleration of the opening animation.
    @param {String} [config.closeEasing]
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
      var css, linkBox, tooltipBox;
      css = {};
      tooltipBox = u.measure(state.$tooltip);
      if (u.isFixed(state.$anchor)) {
        linkBox = state.$anchor.get(0).getBoundingClientRect();
        css['position'] = 'fixed';
      } else {
        linkBox = u.measure(state.$anchor);
      }
      switch (state.position) {
        case 'top':
          css['top'] = linkBox.top - tooltipBox.height;
          css['left'] = linkBox.left + 0.5 * (linkBox.width - tooltipBox.width);
          break;
        case 'left':
          css['top'] = linkBox.top + 0.5 * (linkBox.height - tooltipBox.height);
          css['left'] = linkBox.left - tooltipBox.width;
          break;
        case 'right':
          css['top'] = linkBox.top + 0.5 * (linkBox.height - tooltipBox.height);
          css['left'] = linkBox.left + linkBox.width;
          break;
        case 'bottom':
          css['top'] = linkBox.top + linkBox.height;
          css['left'] = linkBox.left + 0.5 * (linkBox.width - tooltipBox.width);
          break;
        default:
          up.fail("Unknown position option '%s'", state.position);
      }
      state.$tooltip.attr('up-position', state.position);
      return state.$tooltip.css(css);
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

    /**
    Opens a tooltip over the given element.
    
        up.tooltip.attach('.help', {
          html: 'Enter multiple words or phrases'
        });
    
    @function up.tooltip.attach
    @param {Element|jQuery|String} elementOrSelector
    @param {String} [options.text]
      The text to display in the tooltip.
    
      Any HTML control characters will be escaped.
      If you need to use HTML formatting in the tooltip, use `options.html` instead.
    @param {String} [options.html]
      The HTML to display in the tooltip unescaped.
    
      Make sure to escape any user-provided text before passing it as this option,
      or use `options.text` (which automatically escapes).
    @param {String} [options.position='top']
      The position of the tooltip.
      Can be `'top'`, `'right'`, `'bottom'` or `'left'`.
    @param {String} [options.animation]
      The animation to use when opening the tooltip.
    @return {Promise}
      A promise that will be resolved when the tooltip's opening animation has finished.
    @stable
     */
    attachAsap = function(elementOrSelector, options) {
      var curriedAttachNow;
      if (options == null) {
        options = {};
      }
      curriedAttachNow = function() {
        return attachNow(elementOrSelector, options);
      };
      if (isOpen()) {
        chain.asap(closeNow, curriedAttachNow);
      } else {
        chain.asap(curriedAttachNow);
      }
      return chain.promise();
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

    /**
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
      if (isOpen()) {
        chain.asap(function() {
          return closeNow(options);
        });
      }
      return chain.promise();
    };
    closeNow = function(options) {
      var animateOptions;
      if (!isOpen()) {
        return u.resolvedPromise();
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

    /**
    Returns whether a tooltip is currently showing.
    
    @function up.tooltip.isOpen
    @stable
     */
    isOpen = function() {
      return state.phase === 'opening' || state.phase === 'opened';
    };

    /**
    Displays a tooltip with text content when hovering the mouse over this element:
    
        <a href="/decks" up-tooltip="Show all decks">Decks</a>
    
    To make the tooltip appear below the element instead of above the element,
    add an `up-position` attribute:
    
        <a href="/decks" up-tooltip="Show all decks" up-position="bottom">Decks</a>
    
    @selector [up-tooltip]
    @param {String} [up-animation]
      The animation used to open the tooltip.
      Defaults to [`up.tooltip.config.openAnimation`](/up.tooltip.config).
    @param {String} [up-position]
      The default position of tooltips relative to the element.
      Can be either `"top"` or `"bottom"`.
      Defaults to [`up.tooltip.config.position`](/up.tooltip.config).
    @stable
     */

    /**
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

/**
Navigation feedback
===================

Unpoly automatically adds CSS classes to links while they are
currently loading ([`.up-active`](/up-active)) or
pointing to the current location ([`.up-current`](/up-current)).

By styling these classes with CSS you can provide instant feedback to user interactions.
This improves the perceived speed of your interface.

\#\#\# Example

Let's say we have an navigation bar with two links, pointing to `/foo` and `/bar` respectively:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow>Bar</a>

If the current URL is `/foo`, the first link is automatically marked with an [`up-current`](/up-current) class:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow>Bar</a>

When the user clicks on the `/bar` link, the link will receive the [`up-active`](/up-active) class while it is waiting
for the server to respond:

    <a href="/foo" up-follow class="up-current">Foo</a>
    <a href="/bar" up-follow class="up-active">Bar</a>

Once the response is received the URL will change to `/bar` and the `up-active` class is removed:

    <a href="/foo" up-follow>Foo</a>
    <a href="/bar" up-follow class="up-current">Bar</a>


@class up.feedback
 */

(function() {
  up.feedback = (function($) {
    var CLASS_ACTIVE, SELECTOR_SECTION, config, currentClass, findActionableArea, locationChanged, normalizeUrl, reset, sectionUrls, start, stop, u, urlSet;
    u = up.util;

    /**
    Sets default options for this module.
    
    @property up.feedback.config
    @param {Number} [config.currentClasses]
      An array of classes to set on [links that point the current location](/up-current).
    @stable
     */
    config = u.config({
      currentClasses: ['up-current']
    });
    reset = function() {
      return config.reset();
    };
    currentClass = function() {
      var classes;
      classes = config.currentClasses;
      classes = classes.concat(['up-current']);
      classes = u.uniq(classes);
      return classes.join(' ');
    };
    CLASS_ACTIVE = 'up-active';
    SELECTOR_SECTION = 'a, [up-href]';
    normalizeUrl = function(url) {
      if (u.isPresent(url)) {
        return u.normalizeUrl(url);
      }
    };
    sectionUrls = function($section) {
      var attr, i, j, len, len1, ref, url, urls, value, values;
      urls = [];
      ref = ['href', 'up-href', 'up-alias'];
      for (i = 0, len = ref.length; i < len; i++) {
        attr = ref[i];
        if (value = u.presentAttr($section, attr)) {
          values = attr === 'up-alias' ? value.split(' ') : [value];
          for (j = 0, len1 = values.length; j < len1; j++) {
            url = values[j];
            if (url !== '#') {
              url = normalizeUrl(url);
              urls.push(url);
            }
          }
        }
      }
      return urls;
    };
    urlSet = function(urls) {
      var doesMatchFully, doesMatchPrefix, matches, matchesAny;
      urls = u.compact(urls);
      matches = function(testUrl) {
        if (testUrl.substr(-1) === '*') {
          return doesMatchPrefix(testUrl.slice(0, -1));
        } else {
          return doesMatchFully(testUrl);
        }
      };
      doesMatchFully = function(testUrl) {
        return u.contains(urls, testUrl);
      };
      doesMatchPrefix = function(prefix) {
        return u.detect(urls, function(url) {
          return url.indexOf(prefix) === 0;
        });
      };
      matchesAny = function(testUrls) {
        return u.detect(testUrls, matches);
      };
      return {
        matchesAny: matchesAny
      };
    };
    locationChanged = function() {
      var currentUrls, klass;
      currentUrls = urlSet([normalizeUrl(up.browser.url()), normalizeUrl(up.modal.url()), normalizeUrl(up.modal.coveredUrl()), normalizeUrl(up.popup.url()), normalizeUrl(up.popup.coveredUrl())]);
      klass = currentClass();
      return u.each($(SELECTOR_SECTION), function(section) {
        var $section, urls;
        $section = $(section);
        urls = sectionUrls($section);
        if (currentUrls.matchesAny(urls)) {
          return $section.addClass(klass);
        } else if ($section.hasClass(klass) && $section.closest('.up-destroying').length === 0) {
          return $section.removeClass(klass);
        }
      });
    };

    /**
    @function findActionableArea
    @param {String|Element|jQuery} elementOrSelector
    @internal
     */
    findActionableArea = function(elementOrSelector) {
      var $area;
      $area = $(elementOrSelector);
      if ($area.is(SELECTOR_SECTION)) {
        $area = u.presence($area.parent(SELECTOR_SECTION)) || $area;
      }
      return $area;
    };

    /**
    Marks the given element as currently loading, by assigning the CSS class [`up-active`](/up-active).
    
    This happens automatically when following links or submitting forms through the Unpoly API.
    Use this function if you make custom network calls from your own JavaScript code.
    
    If the given element is a link within an [expanded click area](/up-expand),
    the class will be assigned to the expanded area.
    
    \#\#\# Example
    
        var $button = $('button');
        $button.on('click', function() {
          up.feedback.start($button);
          up.ajax(...).always(function() {
            up.feedback.stop($button);
          });
        });
    
    Or shorter:
    
        var $button = $('button');
        $button.on('click', function() {
          up.feedback.start($button, function() {
            up.ajax(...);
          });
        });
    
    @method up.feedback.start
    @param {Element|jQuery|String} elementOrSelector
      The element to mark as active
    @param {Function} [action]
      An optional function to run while the element is marked as loading.
      The function must return a promise.
      Once the promise resolves, the element will be [marked as no longer loading](/up.feedback.stop).
    @internal
     */
    start = function(elementOrSelector, action) {
      var $element, promise;
      $element = findActionableArea(elementOrSelector);
      $element.addClass(CLASS_ACTIVE);
      if (action) {
        promise = action();
        if (u.isPromise(promise)) {
          promise.always(function() {
            return stop($element);
          });
        } else {
          up.warn('Expected block to return a promise, but got %o', promise);
        }
        return promise;
      }
    };

    /**
    Links that are currently loading are assigned the `up-active`
    class automatically. Style `.up-active` in your CSS to improve the
    perceived responsiveness of your user interface.
    
    The `up-active` class will be removed as soon as another
    page fragment is added or updated through Unpoly.
    
    \#\#\# Example
    
    We have a link:
    
        <a href="/foo" up-follow>Foo</a>
    
    The user clicks on the link. While the request is loading,
    the link has the `up-active` class:
    
        <a href="/foo" up-follow class="up-active">Foo</a>
    
    Once the link destination has loaded and rendered, the `up-active` class
    is removed and the [`up-current`](/up-current) class is added:
    
        <a href="/foo" up-follow class="up-current">Foo</a>
    
    @selector .up-active
    @stable
     */

    /**
    Marks the given element as no longer loading, by removing the CSS class [`up-active`](/up-active).
    
    This happens automatically when network requests initiated by the Unpoly API have completed.
    Use this function if you make custom network calls from your own JavaScript code.
    
    @function up.feedback.stop
    @param {jQuery} event.$element
      The link or form that has finished loading.
    @internal
     */
    stop = function(elementOrSelector) {
      var $element;
      $element = findActionableArea(elementOrSelector);
      return $element.removeClass(CLASS_ACTIVE);
    };

    /**
    Links that point to the current location are assigned
    the `up-current` class automatically.
    
    The use case for this is navigation bars:
    
        <nav>
          <a href="/foo">Foo</a>
          <a href="/bar">Bar</a>
        </nav>
    
    If the browser location changes to `/foo`, the markup changes to this:
    
        <nav>
          <a href="/foo" class="up-current">Foo</a>
          <a href="/bar">Bar</a>
        </nav>
    
    \#\#\# What's considered to be "current"?
    
    The current location is considered to be either:
    
    - the URL displayed in the browser window's location bar
    - the source URL of a currently opened [modal dialog](/up.modal)
    - the source URL of a currently opened [popup overlay](/up.popup)
    
    A link matches the current location (and is marked as `.up-current`) if it matches either:
    
    - the link's `href` attribute
    - the link's [`up-href`](#turn-any-element-into-a-link) attribute
    - a space-separated list of URLs in the link's `up-alias` attribute
    
    \#\#\# Matching URL by prefix
    
    You can mark a link as `.up-current` whenever the current URL matches a prefix.
    To do so, end the `up-alias` attribute in an asterisk (`*`).
    
    For instance, the following link is highlighted for both `/reports` and `/reports/123`:
    
        <a href="/reports" up-alias="/reports/*">Reports</a>
    
    @selector .up-current
    @stable
     */
    up.on('up:fragment:inserted', function() {
      return locationChanged();
    });
    up.on('up:fragment:destroyed', function(event, $fragment) {
      if ($fragment.is('.up-modal, .up-popup')) {
        return locationChanged();
      }
    });
    up.on('up:framework:reset', reset);
    return {
      config: config,
      start: start,
      stop: stop
    };
  })(jQuery);

  up.renamedModule('navigation', 'feedback');

}).call(this);

/**
Play nice with Rails UJS
========================
 */

(function() {
  up.rails = (function($) {
    var csrfField, isRails, u, willHandle;
    u = up.util;
    willHandle = function($element) {
      return $element.is('[up-follow], [up-target], [up-modal], [up-popup]');
    };
    isRails = function() {
      return u.isGiven($.rails);
    };
    u.each(['method', 'confirm'], function(feature) {
      var dataAttribute, upAttribute;
      dataAttribute = "data-" + feature;
      upAttribute = "up-" + feature;
      return up.compiler("[" + dataAttribute + "]", function($element) {
        var replacement;
        if (isRails() && willHandle($element)) {
          replacement = {};
          replacement[upAttribute] = $element.attr(dataAttribute);
          u.setMissingAttrs($element, replacement);
          return $element.removeAttr(dataAttribute);
        }
      });
    });
    csrfField = function() {
      if (isRails()) {
        return {
          name: $.rails.csrfParam(),
          value: $.rails.csrfToken()
        };
      }
    };
    return {
      csrfField: csrfField,
      isRails: isRails
    };
  })(jQuery);

}).call(this);
(function() {
  up.boot();

}).call(this);
