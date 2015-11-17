
/**
@module up
 */

(function() {
  window.up = {};

}).call(this);

/**
Utility functions
=================
  
All methods in this module are for internal use by the Up.js framework
and will frequently change between releases.
  
If you use them in your own code, you will get hurt.  
  
@protected
@class up.util
 */

(function() {
  var slice = [].slice;

  up.util = (function($) {
    var $createElementFromSelector, ANIMATION_PROMISE_KEY, CONSOLE_PLACEHOLDERS, ajax, any, cache, castedAttr, clientSize, compact, config, contains, copy, copyAttributes, createElement, createElementFromHtml, createSelectorFromElement, cssAnimate, debug, detect, each, emptyJQuery, endsWith, error, escapePressed, evalConsoleTemplate, extend, findWithSelf, finishCssAnimate, fixedToAbsolute, forceCompositing, identity, ifGiven, isArray, isBlank, isDeferred, isDefined, isElement, isFunction, isGiven, isHash, isJQuery, isMissing, isNull, isNumber, isObject, isPresent, isPromise, isStandardPort, isString, isUndefined, isUnmodifiedKeyEvent, isUnmodifiedMouseEvent, last, locationFromXhr, map, measure, memoize, merge, methodFromXhr, multiSelector, nextFrame, normalizeMethod, normalizeUrl, nullJquery, offsetParent, once, only, option, options, parseUrl, presence, presentAttr, remove, resolvableWhen, resolvedDeferred, resolvedPromise, scrollbarWidth, select, setMissingAttrs, startsWith, temporaryCss, times, toArray, trim, unJquery, uniq, unresolvablePromise, unwrapElement, warn;
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
    ajax = function(request) {
      request = copy(request);
      if (request.selector) {
        request.headers = {
          "X-Up-Selector": request.selector
        };
      }
      return $.ajax(request);
    };

    /**
    @function up.util.isStandardPort
    @private
     */
    isStandardPort = function(protocol, port) {
      return ((port === "" || port === "80") && protocol === 'http:') || (port === "443" && protocol === 'https:');
    };

    /**
    Normalizes URLs, relative paths and absolute paths to a full URL
    that can be checked for equality with other normalized URL.
    
    By default hashes are ignored, search queries are included.
    
    @function up.util.normalizeUrl
    @param {Boolean} [options.hash=false]
      Whether to include an `#hash` anchor in the normalized URL
    @param {Boolean} [options.search=true]
      Whether to include a `?query` string in the normalized URL
    @param {Boolean} [options.stripTrailingSlash=false]
      Whether to strip a trailing slash from the pathname
    @protected
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
      if ((options != null ? options.stripTrailingSlash : void 0) === true) {
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
    @function up.util.parseUrl
    @private
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
        anchor = unJquery(urlOrAnchor);
      }
      return anchor;
    };

    /**
    @function up.util.normalizeMethod
    @protected
     */
    normalizeMethod = function(method) {
      if (method) {
        return method.toUpperCase();
      } else {
        return 'GET';
      }
    };
    $createElementFromSelector = function(selector) {
      var $element, $parent, $root, classes, conjunction, depthSelector, expression, html, id, iteration, j, k, len, len1, path, tag;
      path = selector.split(/[ >]/);
      $root = null;
      for (iteration = j = 0, len = path.length; j < len; iteration = ++j) {
        depthSelector = path[iteration];
        conjunction = depthSelector.match(/(^|\.|\#)[A-Za-z0-9\-_]+/g);
        tag = "div";
        classes = [];
        id = null;
        for (k = 0, len1 = conjunction.length; k < len1; k++) {
          expression = conjunction[k];
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
    @function up.debug
    @protected
     */
    debug = function() {
      var args, message, ref;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      message = "[UP] " + message;
      return (ref = up.browser).puts.apply(ref, ['debug', message].concat(slice.call(args)));
    };

    /**
    @function up.warn
    @protected
     */
    warn = function() {
      var args, message, ref;
      message = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      message = "[UP] " + message;
      return (ref = up.browser).puts.apply(ref, ['warn', message].concat(slice.call(args)));
    };

    /**
    Throws a fatal error with the given message.
    
    - The error will be printed to the [error console](https://developer.mozilla.org/en-US/docs/Web/API/Console/error)
    - An [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) (exception) will be thrown, unwinding the current call stack
    - The error message will be printed in a corner of the screen
    
    \#\#\#\# Examples
    
        up.error('Division by zero')
        up.error('Unexpected result %o', result)
    
    @function up.error
     */
    error = function() {
      var $error, args, asString, ref;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      args[0] = "[UP] " + args[0];
      (ref = up.browser).puts.apply(ref, ['error'].concat(slice.call(args)));
      asString = evalConsoleTemplate.apply(null, args);
      $error = presence($('.up-error')) || $('<div class="up-error"></div>').prependTo('body');
      $error.addClass('up-error');
      $error.text(asString);
      throw new Error(asString);
    };
    CONSOLE_PLACEHOLDERS = /\%[odisf]/g;
    evalConsoleTemplate = function() {
      var args, i, maxLength, message;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      message = args[0];
      i = 0;
      maxLength = 80;
      return message.replace(CONSOLE_PLACEHOLDERS, function() {
        var arg, argType;
        i += 1;
        arg = args[i];
        argType = typeof arg;
        if (argType === 'string') {
          arg = arg.replace(/\s+/g, ' ');
          if (arg.length > maxLength) {
            arg = (arg.substr(0, maxLength)) + "…";
          }
          arg = "\"" + arg + "\"";
        } else if (argType === 'undefined') {
          arg = 'undefined';
        } else if (argType === 'number' || argType === 'function') {
          arg = arg.toString();
        } else {
          arg = JSON.stringify(arg);
        }
        if (arg.length > maxLength) {
          arg = (arg.substr(0, maxLength)) + " …";
          if (argType === 'object' || argType === 'function') {
            arg += " }";
          }
        }
        return arg;
      });
    };
    createSelectorFromElement = function($element) {
      var classString, classes, id, j, klass, len, selector;
      debug("Creating selector from element %o", $element);
      classes = (classString = $element.attr("class")) ? classString.split(" ") : [];
      id = $element.attr("id");
      selector = $element.prop("tagName").toLowerCase();
      if (id) {
        selector += "#" + id;
      }
      for (j = 0, len = classes.length; j < len; j++) {
        klass = classes[j];
        selector += "." + klass;
      }
      return selector;
    };
    createElementFromHtml = function(html) {
      var anything, bodyElement, bodyMatch, bodyPattern, capture, closeTag, headElement, htmlElement, openTag, titleElement, titleMatch, titlePattern;
      openTag = function(tag) {
        return "<" + tag + "(?: [^>]*)?>";
      };
      closeTag = function(tag) {
        return "</" + tag + ">";
      };
      anything = '(?:.|\\n)*?';
      capture = function(pattern) {
        return "(" + pattern + ")";
      };
      titlePattern = new RegExp(openTag('head') + anything + openTag('title') + capture(anything) + closeTag('title') + anything + closeTag('body'), 'i');
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
    extend = $.extend;
    trim = $.trim;
    each = function(collection, block) {
      var index, item, j, len, results;
      results = [];
      for (index = j = 0, len = collection.length; j < len; index = ++j) {
        item = collection[index];
        results.push(block(item, index));
      }
      return results;
    };
    map = each;
    identity = function(x) {
      return x;
    };
    times = function(count, block) {
      var iteration, j, ref, results;
      results = [];
      for (iteration = j = 0, ref = count - 1; 0 <= ref ? j <= ref : j >= ref; iteration = 0 <= ref ? ++j : --j) {
        results.push(block(iteration));
      }
      return results;
    };
    isNull = function(object) {
      return object === null;
    };
    isUndefined = function(object) {
      return object === void(0);
    };
    isDefined = function(object) {
      return !isUndefined(object);
    };
    isMissing = function(object) {
      return isUndefined(object) || isNull(object);
    };
    isGiven = function(object) {
      return !isMissing(object);
    };
    isBlank = function(object) {
      return isMissing(object) || (isObject(object) && Object.keys(object).length === 0) || (object.length === 0);
    };
    presence = function(object, checker) {
      if (checker == null) {
        checker = isPresent;
      }
      if (checker(object)) {
        return object;
      } else {
        return null;
      }
    };
    isPresent = function(object) {
      return !isBlank(object);
    };
    isFunction = function(object) {
      return typeof object === 'function';
    };
    isString = function(object) {
      return typeof object === 'string';
    };
    isNumber = function(object) {
      return typeof object === 'number';
    };
    isHash = function(object) {
      return typeof object === 'object' && !!object;
    };
    isObject = function(object) {
      return isHash(object) || (typeof object === 'function');
    };
    isElement = function(object) {
      return !!(object && object.nodeType === 1);
    };
    isJQuery = function(object) {
      return object instanceof jQuery;
    };
    isPromise = function(object) {
      return isObject(object) && isFunction(object.then);
    };
    isDeferred = function(object) {
      return isPromise(object) && isFunction(object.resolve);
    };
    ifGiven = function(object) {
      if (isGiven(object)) {
        return object;
      }
    };
    isArray = Array.isArray || function(object) {
      return Object.prototype.toString.call(object) === '[object Array]';
    };
    toArray = function(object) {
      return Array.prototype.slice.call(object);
    };
    copy = function(object) {
      if (isArray(object)) {
        return object.slice();
      } else {
        return extend({}, object);
      }
    };
    unJquery = function(object) {
      if (isJQuery(object)) {
        return object.get(0);
      } else {
        return object;
      }
    };
    merge = function(object, otherObject) {
      return extend(copy(object), otherObject);
    };
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
    Returns the first argument that is considered present.
    If an argument is a function, it is called and the value is checked for presence.
    
    This function is useful when you have multiple option sources and the value can be boolean.
    In that case you cannot change the sources with a `||` operator
    (since that doesn't short-circuit at `false`).
    
    @function up.util.option
    @param {Array} args...
     */
    option = function() {
      var arg, args, j, len, match, value;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      match = void 0;
      for (j = 0, len = args.length; j < len; j++) {
        arg = args[j];
        value = arg;
        if (isFunction(value)) {
          value = value();
        }
        if (isGiven(value)) {
          match = value;
          break;
        }
      }
      return match;
    };
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
    any = function(array, tester) {
      var match;
      match = detect(array, tester);
      return isDefined(match);
    };
    compact = function(array) {
      return select(array, isGiven);
    };
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
    nextFrame = function(block) {
      return setTimeout(block, 0);
    };
    last = function(array) {
      return array[array.length - 1];
    };
    clientSize = function() {
      var element;
      element = document.documentElement;
      return {
        width: element.clientWidth,
        height: element.clientHeight
      };
    };
    scrollbarWidth = memoize(function() {
      var $outer, outer, width;
      $outer = $('<div>').css({
        position: 'absolute',
        top: '0',
        left: '0',
        width: '50px',
        height: '50px',
        overflowY: 'scroll'
      });
      $outer.appendTo(document.body);
      outer = $outer.get(0);
      width = outer.offsetWidth - outer.clientWidth;
      $outer.remove();
      return width;
    });

    /**
    Modifies the given function so it only runs once.
    Subsequent calls will return the previous return value.
    
    @function up.util.once
    @private
     */
    once = function(fun) {
      var result;
      result = void 0;
      return function() {
        if (fun != null) {
          result = fun();
        }
        fun = void 0;
        return result;
      };
    };

    /**
     * Temporarily sets the CSS for the given element.
    #
     * @function up.util.temporaryCss
     * @param {jQuery} $element
     * @param {Object} css
     * @param {Function} [block]
     *   If given, the CSS is set, the block is called and
     *   the old CSS is restored.
     * @private
     */
    temporaryCss = function($element, css, block) {
      var memo, oldCss;
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
    @return
      A promise for the animation's end.
     */
    cssAnimate = function(elementOrSelector, lastFrame, opts) {
      var $element, deferred, endTimeout, transition, withoutCompositing, withoutTransition;
      $element = $(elementOrSelector);
      if (up.browser.canCssAnimation()) {
        opts = options(opts, {
          duration: 300,
          delay: 0,
          easing: 'ease'
        });
        deferred = $.Deferred();
        transition = {
          'transition-property': Object.keys(lastFrame).join(', '),
          'transition-duration': opts.duration + "ms",
          'transition-delay': opts.delay + "ms",
          'transition-timing-function': opts.easing
        };
        withoutCompositing = forceCompositing($element);
        withoutTransition = temporaryCss($element, transition);
        $element.css(lastFrame);
        deferred.then(withoutCompositing);
        deferred.then(withoutTransition);
        $element.data(ANIMATION_PROMISE_KEY, deferred);
        deferred.then(function() {
          return $element.removeData(ANIMATION_PROMISE_KEY);
        });
        endTimeout = setTimeout((function() {
          return deferred.resolve();
        }), opts.duration + opts.delay);
        deferred.then(function() {
          return clearTimeout(endTimeout);
        });
        return deferred;
      } else {
        $element.css(lastFrame);
        return resolvedDeferred();
      }
    };
    ANIMATION_PROMISE_KEY = 'up-animation-promise';

    /**
    Completes the animation for  the given element by jumping
    to the last frame instantly. All callbacks chained to
    the original animation's promise will be called.
    
    Does nothing if the given element is not currently animating.
    
    Also see [`up.motion.finish`](/up.motion.finish).
    
    @function up.util.finishCssAnimate
    @protected
    @param {Element|jQuery|String} elementOrSelector
     */
    finishCssAnimate = function(elementOrSelector) {
      return $(elementOrSelector).each(function() {
        var existingAnimation;
        if (existingAnimation = $(this).data(ANIMATION_PROMISE_KEY)) {
          return existingAnimation.resolve();
        }
      });
    };
    measure = function($element, opts) {
      var $context, box, contextCoords, coordinates, elementCoords, viewport;
      opts = options(opts, {
        relative: false,
        inner: false,
        full: false
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
      if (opts.full) {
        viewport = clientSize();
        box.right = viewport.width - (box.left + box.width);
        box.bottom = viewport.height - (box.top + box.height);
      }
      return box;
    };
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
    findWithSelf = function($element, selector) {
      return $element.find(selector).addBack(selector);
    };
    escapePressed = function(event) {
      return event.keyCode === 27;
    };
    startsWith = function(string, element) {
      return string.indexOf(element) === 0;
    };
    endsWith = function(string, element) {
      return string.indexOf(element) === string.length - element.length;
    };
    contains = function(stringOrArray, element) {
      return stringOrArray.indexOf(element) >= 0;
    };
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
    locationFromXhr = function(xhr) {
      return xhr.getResponseHeader('X-Up-Location');
    };
    methodFromXhr = function(xhr) {
      return xhr.getResponseHeader('X-Up-Method');
    };
    only = function() {
      var filtered, j, key, keys, len, object;
      object = arguments[0], keys = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      filtered = {};
      for (j = 0, len = keys.length; j < len; j++) {
        key = keys[j];
        if (object.hasOwnProperty(key)) {
          filtered[key] = object[key];
        }
      }
      return filtered;
    };
    isUnmodifiedKeyEvent = function(event) {
      return !(event.metaKey || event.shiftKey || event.ctrlKey);
    };
    isUnmodifiedMouseEvent = function(event) {
      var isLeftButton;
      isLeftButton = isUndefined(event.button) || event.button === 0;
      return isLeftButton && isUnmodifiedKeyEvent(event);
    };
    resolvedDeferred = function() {
      var deferred;
      deferred = $.Deferred();
      deferred.resolve();
      return deferred;
    };
    resolvedPromise = function() {
      return resolvedDeferred().promise();
    };
    unresolvablePromise = function() {
      return $.Deferred().promise();
    };
    nullJquery = function() {
      return {
        is: function() {
          return false;
        },
        attr: function() {},
        find: function() {
          return [];
        }
      };
    };
    resolvableWhen = function() {
      var deferreds, joined;
      deferreds = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      joined = $.when.apply($, deferreds);
      joined.resolve = function() {
        return each(deferreds, function(deferred) {
          return typeof deferred.resolve === "function" ? deferred.resolve() : void 0;
        });
      };
      return joined;
    };
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
    remove = function(array, element) {
      var index;
      index = array.indexOf(element);
      if (index >= 0) {
        array.splice(index, 1);
        return element;
      }
    };
    emptyJQuery = function() {
      return $([]);
    };
    multiSelector = function(parts) {
      var combinedSelector, elements, j, len, obj, part, selectors;
      obj = {};
      selectors = [];
      elements = [];
      for (j = 0, len = parts.length; j < len; j++) {
        part = parts[j];
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
        var $matches, $result, k, len1, ref, selector;
        $result = emptyJQuery();
        ref = obj.parsed;
        for (k = 0, len1 = ref.length; k < len1; k++) {
          selector = ref[k];
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
        return $result || emptyJQuery();
      };
      return obj;
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
     */
    cache = function(config) {
      var alias, clear, expiryMilis, get, isFresh, keys, log, maxSize, normalizeStoreKey, set, store, timestamp;
      if (config == null) {
        config = {};
      }
      store = void 0;
      clear = function() {
        return store = {};
      };
      clear();
      log = function() {
        var args;
        args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        if (config.log) {
          args[0] = "[" + config.log + "] " + args[0];
          return debug.apply(null, args);
        }
      };
      keys = function() {
        return Object.keys(store);
      };
      maxSize = function() {
        if (isMissing(config.size)) {
          return void 0;
        } else if (isFunction(config.size)) {
          return config.size();
        } else if (isNumber(config.size)) {
          return config.size;
        } else {
          return error("Invalid size config: %o", config.size);
        }
      };
      expiryMilis = function() {
        if (isMissing(config.expiry)) {
          return void 0;
        } else if (isFunction(config.expiry)) {
          return config.expiry();
        } else if (isNumber(config.expiry)) {
          return config.expiry;
        } else {
          return error("Invalid expiry config: %o", config.expiry);
        }
      };
      normalizeStoreKey = function(key) {
        if (config.key) {
          return config.key(key);
        } else {
          return key.toString();
        }
      };
      trim = function() {
        var oldestKey, oldestTimestamp, size, storeKeys;
        storeKeys = copy(keys());
        size = maxSize();
        if (size && storeKeys.length > size) {
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
        value = get(oldKey);
        if (isDefined(value)) {
          return set(newKey, value);
        }
      };
      timestamp = function() {
        return (new Date()).valueOf();
      };
      set = function(key, value) {
        var storeKey;
        storeKey = normalizeStoreKey(key);
        return store[storeKey] = {
          timestamp: timestamp(),
          value: value
        };
      };
      remove = function(key) {
        var storeKey;
        storeKey = normalizeStoreKey(key);
        return delete store[storeKey];
      };
      isFresh = function(entry) {
        var expiry, timeSinceTouch;
        expiry = expiryMilis();
        if (expiry) {
          timeSinceTouch = timestamp() - entry.timestamp;
          return timeSinceTouch < expiryMilis();
        } else {
          return true;
        }
      };
      get = function(key, fallback) {
        var entry, storeKey;
        if (fallback == null) {
          fallback = void 0;
        }
        storeKey = normalizeStoreKey(key);
        if (entry = store[storeKey]) {
          if (isFresh(entry)) {
            log("Cache hit for %o", key);
            return entry.value;
          } else {
            log("Discarding stale cache entry for %o", key);
            remove(key);
            return fallback;
          }
        } else {
          log("Cache miss for %o", key);
          return fallback;
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
    config = function(factoryOptions) {
      var hash;
      if (factoryOptions == null) {
        factoryOptions = {};
      }
      hash = {};
      hash.reset = function() {
        return extend(hash, factoryOptions);
      };
      hash.reset();
      Object.preventExtensions(hash);
      return hash;
    };
    unwrapElement = function(wrapper) {
      var parent, wrappedNodes;
      wrapper = unJquery(wrapper);
      parent = wrapper.parentNode;
      wrappedNodes = toArray(wrapper.childNodes);
      each(wrappedNodes, function(wrappedNode) {
        return parent.insertBefore(wrappedNode, wrapper);
      });
      return parent.removeChild(wrapper);
    };
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
    return {
      offsetParent: offsetParent,
      fixedToAbsolute: fixedToAbsolute,
      presentAttr: presentAttr,
      createElement: createElement,
      parseUrl: parseUrl,
      normalizeUrl: normalizeUrl,
      normalizeMethod: normalizeMethod,
      createElementFromHtml: createElementFromHtml,
      $createElementFromSelector: $createElementFromSelector,
      createSelectorFromElement: createSelectorFromElement,
      ajax: ajax,
      extend: extend,
      copy: copy,
      merge: merge,
      options: options,
      option: option,
      error: error,
      debug: debug,
      warn: warn,
      each: each,
      map: map,
      identity: identity,
      times: times,
      any: any,
      detect: detect,
      select: select,
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
      isElement: isElement,
      isJQuery: isJQuery,
      isPromise: isPromise,
      isDeferred: isDeferred,
      isHash: isHash,
      ifGiven: ifGiven,
      isUnmodifiedKeyEvent: isUnmodifiedKeyEvent,
      isUnmodifiedMouseEvent: isUnmodifiedMouseEvent,
      nullJquery: nullJquery,
      unJquery: unJquery,
      nextFrame: nextFrame,
      measure: measure,
      temporaryCss: temporaryCss,
      cssAnimate: cssAnimate,
      finishCssAnimate: finishCssAnimate,
      forceCompositing: forceCompositing,
      escapePressed: escapePressed,
      copyAttributes: copyAttributes,
      findWithSelf: findWithSelf,
      contains: contains,
      startsWith: startsWith,
      endsWith: endsWith,
      isArray: isArray,
      toArray: toArray,
      castedAttr: castedAttr,
      locationFromXhr: locationFromXhr,
      methodFromXhr: methodFromXhr,
      clientSize: clientSize,
      only: only,
      trim: trim,
      unresolvablePromise: unresolvablePromise,
      resolvedPromise: resolvedPromise,
      resolvedDeferred: resolvedDeferred,
      resolvableWhen: resolvableWhen,
      setMissingAttrs: setMissingAttrs,
      remove: remove,
      memoize: memoize,
      scrollbarWidth: scrollbarWidth,
      config: config,
      cache: cache,
      unwrapElement: unwrapElement,
      multiSelector: multiSelector,
      emptyJQuery: emptyJQuery,
      evalConsoleTemplate: evalConsoleTemplate
    };
  })($);

  up.error = up.util.error;

  up.warn = up.util.warn;

  up.debug = up.util.debug;

}).call(this);

/**
Browser interface
=================

Some browser-interfacing methods and switches that
we can't currently get rid off.

@protected
@class up.browser
 */

(function() {
  var slice = [].slice;

  up.browser = (function($) {
    var canCssAnimation, canInputEvent, canLogSubstitution, canPushState, initialRequestMethod, isIE8OrWorse, isIE9OrWorse, isRecentJQuery, isSupported, loadPage, popCookie, puts, u, url;
    u = up.util;
    loadPage = function(url, options) {
      var $form, csrfParam, csrfToken, metadataInput, method, target;
      if (options == null) {
        options = {};
      }
      method = u.option(options.method, 'get').toLowerCase();
      if (method === 'get') {
        return location.href = url;
      } else if ($.rails) {
        target = options.target;
        csrfToken = $.rails.csrfToken();
        csrfParam = $.rails.csrfParam();
        $form = $("<form method='post' action='" + url + "'></form>");
        metadataInput = "<input name='_method' value='" + method + "' type='hidden' />";
        if (u.isDefined(csrfParam) && u.isDefined(csrfToken)) {
          metadataInput += "<input name='" + csrfParam + "' value='" + csrfToken + "' type='hidden' />";
        }
        if (target) {
          $form.attr('target', target);
        }
        $form.hide().append(metadataInput).appendTo('body');
        return $form.submit();
      } else {
        return error("Can't fake a " + (method.toUpperCase()) + " request without Rails UJS");
      }
    };

    /**
    A cross-browser way to interact with `console.log`, `console.error`, etc.
    
    This function falls back to `console.log` if the output stream is not implemented.
    It also prints substitution strings (e.g. `console.log("From %o to %o", "a", "b")`)
    as a single string if the browser console does not support substitution strings.
    
    @function up.browser.puts
    @protected
     */
    puts = function() {
      var args, message, stream;
      stream = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      u.isDefined(console[stream]) || (stream = 'log');
      if (canLogSubstitution()) {
        return console[stream].apply(console, args);
      } else {
        message = u.evalConsoleTemplate.apply(u, args);
        return console[stream](message);
      }
    };
    url = function() {
      return location.href;
    };
    canPushState = u.memoize(function() {
      return u.isDefined(history.pushState) && initialRequestMethod() === 'get';
    });
    isIE8OrWorse = u.memoize(function() {
      return u.isUndefined(document.addEventListener);
    });
    isIE9OrWorse = u.memoize(function() {
      return isIE8OrWorse() || navigator.appVersion.indexOf('MSIE 9.') !== -1;
    });
    canCssAnimation = u.memoize(function() {
      return 'transition' in document.documentElement.style;
    });
    canInputEvent = u.memoize(function() {
      return 'oninput' in document.createElement('input');
    });
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
    initialRequestMethod = u.memoize(function() {
      return (popCookie('_up_request_method') || 'get').toLowerCase();
    });

    /**
    Returns whether Up.js supports the current browser.
    
    Currently Up.js supports IE9 with jQuery 1.9+.
    On older browsers Up.js will prevent itself from [booting](/up.boot),
    leaving you with a classic server-side application.
    
    @function up.browser.isSupported
     */
    isSupported = function() {
      return (!isIE8OrWorse()) && isRecentJQuery();
    };
    return {
      url: url,
      loadPage: loadPage,
      canPushState: canPushState,
      canCssAnimation: canCssAnimation,
      canInputEvent: canInputEvent,
      canLogSubstitution: canLogSubstitution,
      isSupported: isSupported,
      puts: puts
    };
  })(jQuery);

}).call(this);

/**
Events
======

Up.js has a convenient way to [listen to DOM events](/up.on):

    up.on('click', 'button', function(event, $button) {
      // $button is a jQuery collection containing
      // the clicked <button> element
    });

This is roughly equivalent to binding an event listener to `document`
using jQuery's [`on`](http://api.jquery.com/on/).

- Event listeners on [unsupported browsers](/up.browser.isSupported) are silently discarded,
  leaving you with an application without Javascript. This is typically preferable to
  a soup of randomly broken Javascript in ancient browsers.
- A jQuery object with the target element is automatically passed to the event handler.
- You can [attach structured data](/up.on#attaching-structured-data) to observed elements.
- The call is shorter.

Many Up.js interactions also emit DOM events that are prefixed with `up:`.

    up.on('up:modal:opened', function(event) {
      console.log('A new modal has just opened!');
    });

Events often have both present (`up:modal:open`) and past forms (`up:modal:opened`).
You can usually prevent an action by listening to the present form
and call `preventDefault()` on the `event` object:

    up.on('up:modal:open', function(event) {
      if (event.url == '/evil') {
        // Prevent the modal from opening
        event.preventDefault();
      }
    });

@class up.bus
 */

(function() {
  var slice = [].slice;

  up.bus = (function($) {
    var boot, defaultLiveDescriptions, emit, emitReset, live, liveDescriptions, nobodyPrevents, onEscape, restoreSnapshot, snapshot, u, upListenerToJqueryListener;
    u = up.util;
    liveDescriptions = [];
    defaultLiveDescriptions = null;

    /**
     * Convert an Up.js style listener (second argument is the event target
     * as a jQuery collection) to a vanilla jQuery listener
     */
    upListenerToJqueryListener = function(upListener) {
      return function(event) {
        var $me;
        $me = event.$element || $(this);
        return upListener.apply($me.get(0), [event, $me, up.syntax.data($me)]);
      };
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
    
    Other than jQuery, Up.js will silently discard event listeners
    on [unsupported browsers](/up.browser.isSupported).
    
    
    \#\#\#\# Attaching structured data
    
    In case you want to attach structured data to the event you're observing,
    you can serialize the data to JSON and put it into an `[up-data]` attribute:
    
        <span class="person" up-data="{ age: 18, name: 'Bob' }">Bob</span>
        <span class="person" up-data="{ age: 22, name: 'Jim' }">Jim</span>
    
    The JSON will parsed and handed to your event handler as a third argument:
    
        up.on('click', '.person', function(event, $element, data) {
          console.log("This is %o who is %o years old", data.name, data.age);
        });
    
    
    \#\#\#\# Migrating jQuery event handlers to `up.on`
    
    Within the event handler, Up.js will bind `this` to the
    native DOM element to help you migrate your existing jQuery code to
    this new syntax.
    
    So if you had this before:
    
        $(document).on('click', '.button', function() {
          $(this).something();
        });
    
    ... you can simply copy the event handler to `up.on`:
    
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
      If the element has an `up-data` attribute, its value is parsed as JSON
      and passed as a second argument.
    @return {Function}
      A function that unbinds the event listeners when called.
     */
    live = function() {
      var $document, args, behavior, description, lastIndex;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (!up.browser.isSupported()) {
        return (function() {});
      }
      description = u.copy(args);
      lastIndex = description.length - 1;
      behavior = description[lastIndex];
      description[lastIndex] = upListenerToJqueryListener(behavior);
      liveDescriptions.push(description);
      $document = $(document);
      $document.on.apply($document, description);
      return function() {
        return $document.off.apply($document, description);
      };
    };

    /**
    Emits an event with the given name and properties.
    
    \#\#\#\# Example
    
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
      The element on which the event is trigered.
    @protected
     */
    emit = function(eventName, eventProps) {
      var $target, event;
      if (eventProps == null) {
        eventProps = {};
      }
      event = $.Event(eventName, eventProps);
      $target = eventProps.$element || $(document);
      u.debug("Emitting %o on %o with props %o", eventName, $target, eventProps);
      $target.trigger(event);
      return event;
    };

    /**
    [Emits an event](/up.emit) and returns whether any listener
    has prevented the default action.
    
    @function up.bus.nobodyPrevents
    @param {String} eventName
    @param {Object} eventProps
    @protected
     */
    nobodyPrevents = function() {
      var args, event;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      event = emit.apply(null, args);
      return !event.isDefaultPrevented();
    };

    /**
    Registers an event listener to be called when the user
    presses the `Escape` key.
    
    @function up.bus.onEscape
    @param {Function} listener
      The listener function to register.
    @return {Function}
      A function that unbinds the event listeners when called.
    @protected
     */
    onEscape = function(listener) {
      return live('keydown', 'body', function(event) {
        if (u.escapePressed(event)) {
          return listener(event);
        }
      });
    };

    /**
    Makes a snapshot of the currently registered event listeners,
    to later be restored through [`up.bus.reset`](/up.bus.reset).
    
    @private
     */
    snapshot = function() {
      return defaultLiveDescriptions = u.copy(liveDescriptions);
    };

    /**
    Resets the list of registered event listeners to the
    moment when the framework was booted.
    
    @private
     */
    restoreSnapshot = function() {
      var description, i, len, ref;
      for (i = 0, len = liveDescriptions.length; i < len; i++) {
        description = liveDescriptions[i];
        if (!u.contains(defaultLiveDescriptions, description)) {
          (ref = $(document)).off.apply(ref, description);
        }
      }
      return liveDescriptions = u.copy(defaultLiveDescriptions);
    };

    /**
    Resets Up.js to the state when it was booted.
    All custom event handlers, animations, etc. that have been registered
    will be discarded.
    
    This is an internal method for to enable unit testing.
    Don't use this in production.
    
    @protected
    @function up.reset
     */
    emitReset = function() {
      return up.emit('up:framework:reset');
    };

    /**
    This event is [emitted](/up.emit) when Up.js is [reset](/up.reset) during unit tests.
    
    @protected
    @event up:framework:reset
     */

    /**
    Boots the Up.js framework.
    This is done automatically by including the Up.js Javascript.
    
    Does nothing if the current browser is [not supported](/up.browser.isSupported).
    
    Emits the [`up:framework:boot`](/up:framework:boot) event.
    
    @protected
    @function up.boot
     */
    boot = function() {
      if (up.browser.isSupported()) {
        return up.emit('up:framework:boot');
      }
    };

    /**
    This event is [emitted](/up.emit) when Up.js [boots](/up.boot).
    
    @event up:framework:boot
    @protected
     */
    live('up:framework:boot', snapshot);
    live('up:framework:reset', restoreSnapshot);
    return {
      on: live,
      emit: emit,
      nobodyPrevents: nobodyPrevents,
      onEscape: onEscape,
      emitReset: emitReset,
      boot: boot
    };
  })(jQuery);

  up.on = up.bus.on;

  up.emit = up.bus.emit;

  up.reset = up.bus.emitReset;

  up.boot = up.bus.boot;

}).call(this);

/**
Custom elements
===============
  
Up.js keeps a persistent Javascript environment during page transitions.
To prevent memory leaks it is important to cleanly set up and tear down
event handlers and custom elements.

\#\#\# Incomplete documentation!

We need to work on this page:

- Better class-level introduction for this module

@class up.syntax
 */

(function() {
  var slice = [].slice;

  up.syntax = (function($) {
    var DESTROYABLE_CLASS, DESTROYER_KEY, applyCompiler, compile, compiler, compilers, data, defaultCompilers, hello, reset, runDestroyers, snapshot, u;
    u = up.util;
    DESTROYABLE_CLASS = 'up-destroyable';
    DESTROYER_KEY = 'up-destroyer';

    /**
    Registers a function to be called whenever an element with
    the given selector is inserted into the DOM.
    
        $('.action').compiler(function($element) {
          // your code here
        });
    
    Compiler functions will be called on matching elements when
    the page loads, or whenever a matching fragment is [updated through Up.js](/up.replace)
    later.
    
    If you have used Angular.js before, this resembles [Angular directives](https://docs.angularjs.org/guide/directive).
    
    
    \#\#\#\# Integrating jQuery plugins
    
    `up.compiler` is a great way to integrate jQuery plugins.
    Let's say your Javascript plugin wants you to call `lightboxify()`
    on links that should open a lightbox. You decide to
    do this for all links with an `[rel=lightbox]` attribute:
    
        <a href="river.png" rel="lightbox">River</a>
        <a href="ocean.png" rel="lightbox">Ocean</a>
    
    This Javascript will do exactly that:
    
        up.compiler('a[rel=lightbox]', function($element) {
          $element.lightboxify();
        });
    
    
    \#\#\#\# Custom elements
    
    You can use `up.compiler` to implement custom elements like this:
    
        <clock></clock>
    
    Here is the Javascript that inserts the current time into to these elements:
    
        up.compiler('clock', function($element) {
          var now = new Date();
          $element.text(now.toString()));
        });
    
    
    \#\#\#\# Cleaning up after yourself
    
    If your compiler returns a function, Up.js will use this as a *destructor* to
    clean up if the element leaves the DOM. Note that in Up.js the same DOM ad Javascript environment
    will persist through many page loads, so it's important to not create
    [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).
    
    You should clean up after yourself whenever your compilers have global
    side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
    or event handlers bound to the document root.
    
    Here is a version of `<clock>` that updates
    the time every second, and cleans up once it's done:
    
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
    
    
    \#\#\#\# Attaching structured data
    
    In case you want to attach structured data to the event you're observing,
    you can serialize the data to JSON and put it into an `[up-data]` attribute.
    For instance, a container for a [Google Map](https://developers.google.com/maps/documentation/javascript/tutorial)
    might attach the location and names of its marker pins:
    
        <div class="google-map" up-data="[
          { lat: 48.36, lng: 10.99, title: 'Friedberg' },
          { lat: 48.75, lng: 11.45, title: 'Ingolstadt' }
        ]"></div>
    
    The JSON will parsed and handed to your event handler as a second argument:
    
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
    
    
    \#\#\#\# Migrating jQuery event handlers to `up.compiler`
    
    Within the compiler, Up.js will bind `this` to the
    native DOM element to help you migrate your existing jQuery code to
    this new syntax.
    
    So if you had this before:
    
        $(function() {
          $('.action').on('click', function() {
            $(this).something();
          });
        });
    
    ... you can reuse the event handler like this:
    
        $('.action').compiler(function($element) {
          $element.on('click', function() {
            $(this).something();
          });
        });
    
    
    @function up.compiler
    @param {String} selector
      The selector to match.
    @param {Boolean} [options.batch=false]
      If set to `true` and a fragment insertion contains multiple
      elements matching the selector, `compiler` is only called once
      with a jQuery collection containing all matching elements. 
    @param {Function($element, data)} compiler
      The function to call when a matching element is inserted.
      The function takes the new element as the first argument (as a jQuery object).
      If the element has an `up-data` attribute, its value is parsed as JSON
      and passed as a second argument.
    
      The function may return a destructor function that destroys the compiled
      object before it is removed from the DOM. The destructor is supposed to
      clear global state such as time-outs and event handlers bound to the document.
      The destructor is *not* expected to remove the element from the DOM, which
      is already handled by [`up.destroy`](/up.destroy).
     */
    compilers = [];
    defaultCompilers = null;
    compiler = function() {
      var args, options, selector;
      selector = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!up.browser.isSupported()) {
        return;
      }
      compiler = args.pop();
      options = u.options(args[0], {
        batch: false
      });
      return compilers.push({
        selector: selector,
        callback: compiler,
        batch: options.batch
      });
    };
    applyCompiler = function(compiler, $jqueryElement, nativeElement) {
      var destroyer;
      u.debug("Applying compiler %o on %o", compiler.selector, nativeElement);
      destroyer = compiler.callback.apply(nativeElement, [$jqueryElement, data($jqueryElement)]);
      if (u.isFunction(destroyer)) {
        $jqueryElement.addClass(DESTROYABLE_CLASS);
        return $jqueryElement.data(DESTROYER_KEY, destroyer);
      }
    };
    compile = function($fragment) {
      var $matches, i, len, results;
      u.debug("Compiling fragment %o", $fragment);
      results = [];
      for (i = 0, len = compilers.length; i < len; i++) {
        compiler = compilers[i];
        $matches = u.findWithSelf($fragment, compiler.selector);
        if ($matches.length) {
          if (compiler.batch) {
            results.push(applyCompiler(compiler, $matches, $matches.get()));
          } else {
            results.push($matches.each(function() {
              return applyCompiler(compiler, $(this), this);
            }));
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    runDestroyers = function($fragment) {
      return u.findWithSelf($fragment, "." + DESTROYABLE_CLASS).each(function() {
        var $element, destroyer;
        $element = $(this);
        destroyer = $element.data(DESTROYER_KEY);
        return destroyer();
      });
    };

    /**
    Checks if the given element has an `up-data` attribute.
    If yes, parses the attribute value as JSON and returns the parsed object.
    
    Returns an empty object if the element has no `up-data` attribute.
    
    The API of this method is likely to change in the future, so
    we can support getting or setting individual keys.
    
    @protected
    @function up.syntax.data
    @param {String|Element|jQuery} elementOrSelector
    @return
      The JSON-decoded value of the `up-data` attribute.
    
      Returns an empty object (`{}`) if the element has no (or an empty) `up-data` attribute.
     */

    /*
    If an element annotated with [`up-data`] is inserted into the DOM,
    Up will parse the JSON and pass the resulting object to any matching
    [`up.compiler`](/up.syntax.compiler) handlers.
    
    Similarly, when an event is triggered on an element annotated with
    [`up-data`], the parsed object will be passed to any matching
    [`up.on`](/up.on) handlers.
    
    @selector [up-data]
    @param {JSON} up-data
      A serialized JSON string
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
    
    @private
     */
    snapshot = function() {
      return defaultCompilers = u.copy(compilers);
    };

    /**
    Resets the list of registered compiler directives to the
    moment when the framework was booted.
    
    @private
     */
    reset = function() {
      return compilers = u.copy(defaultCompilers);
    };

    /**
    Sends a notification that the given element has been inserted
    into the DOM. This causes Up.js to compile the fragment (apply
    event listeners, etc.).
    
    **As long as you manipulate the DOM using Up.js, you will never
    need to call this method.** You only need to use `up.hello` if the
    DOM is manipulated without Up.js' involvement, e.g. by plugin code that
    is not aware of Up.js:
    
        // Add an element with naked jQuery, without going through Upjs:
        $element = $('<div>...</div>').appendTo(document.body);
        up.hello($element);
    
    This function emits the [`up:fragment:inserted`](/up:fragment:inserted)
    event.
    
    @function up.hello
    @param {String|Element|jQuery} selectorOrElement
     */
    hello = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement);
      up.emit('up:fragment:inserted', {
        $element: $element
      });
      return $element;
    };

    /**
    When a page fragment has been [inserted or updated](/up.replace),
    this event is [emitted](/up.emit) on the fragment.
    
    \#\#\#\# Example
    
        up.on('up:fragment:inserted', function(event, $fragment) {
          console.log("Looks like we have a new %o!", $fragment);
        });
    
    @event up:fragment:inserted
    @param {jQuery} event.$element
      The fragment that has been inserted or updated.
     */
    up.on('ready', (function() {
      return hello(document.body);
    }));
    up.on('up:fragment:inserted', function(event) {
      return compile(event.$element);
    });
    up.on('up:fragment:destroy', function(event) {
      return runDestroyers(event.$element);
    });
    up.on('up:framework:boot', snapshot);
    up.on('up:framework:reset', reset);
    return {
      compiler: compiler,
      hello: hello,
      data: data
    };
  })(jQuery);

  up.compiler = up.syntax.compiler;

  up.hello = up.syntax.hello;

  up.ready = function() {
    return up.util.error('up.ready no longer exists. Please use up.hello instead.');
  };

  up.awaken = function() {
    return up.util.error('up.awaken no longer exists. Please use up.compiler instead.');
  };

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
    @param {Array<String>} [config.popTargets=['body']]
      An array of CSS selectors to replace when the user goes
      back in history.
    @param {Boolean} [config.restoreScroll=true]
      Whether to restore the known scroll positions
      when the user goes back or forward in history.
     */
    config = u.config({
      popTargets: ['body'],
      restoreScroll: true
    });

    /**
    Returns the previous URL in the browser history.
    
    Note that this will only work reliably for history changes that
    were applied by [`up.history.push`](/up.history.replace) or
    [`up.history.replace`](/up.history.replace).
    
    @function up.history.previousUrl
    @protected
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
    @protected
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
    @function up.history.replace
    @param {String} url
    @param {Boolean} [options.force=false]
    @protected
     */
    replace = function(url, options) {
      return manipulate('replace', url, options);
    };

    /**
    @function up.history.push
    @param {String} url
    @protected
     */
    push = function(url, options) {
      return manipulate('push', url, options);
    };
    manipulate = function(method, url, options) {
      var fullMethod, state;
      options = u.options(options, {
        force: false
      });
      if (options.force || !isCurrentUrl(url)) {
        if (up.browser.canPushState()) {
          fullMethod = method + "State";
          state = buildState();
          u.debug("Changing history to URL %o (%o)", url, method);
          window.history[fullMethod](state, '', url);
          return observeNewUrl(currentUrl());
        } else {
          return u.error("This browser doesn't support history.pushState");
        }
      }
    };
    buildState = function() {
      return {
        fromUp: true
      };
    };
    restoreStateOnPop = function(state) {
      var popSelector, url;
      url = currentUrl();
      u.debug("Restoring state %o (now on " + url + ")", state);
      popSelector = config.popTargets.join(', ');
      return up.replace(popSelector, url, {
        history: false,
        reveal: false,
        transition: 'none',
        saveScroll: false,
        restoreScroll: config.restoreScroll
      });
    };
    pop = function(event) {
      var state;
      u.debug("History state popped to URL %o", currentUrl());
      observeNewUrl(currentUrl());
      up.layout.saveScroll({
        url: previousUrl
      });
      state = event.originalEvent.state;
      if (state != null ? state.fromUp : void 0) {
        return restoreStateOnPop(state);
      } else {
        return u.debug('Discarding unknown state %o', state);
      }
    };
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
    
    \#\#\#\# Under the hood
    
    This link ...
    
        <a href="/default" up-back>
          Go back
        </a>
    
    ... will be transformed to:
    
        <a href="/default" up-href="/previous-page" up-restore-scroll up-follow>
          Goback
        </a>
    
    @selector [up-back]
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
      defaults: function() {
        return u.error('up.history.defaults(...) no longer exists. Set values on he up.history.config property instead.');
      },
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

This modules contains functions to scroll the viewport and reveal contained elements.

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
    @param {Array<String>} [config.viewports]
      An array of CSS selectors that find viewports
      (containers that scroll their contents).
    @param {Array<String>} [config.fixedTop]
      An array of CSS selectors that find elements fixed to the
      top edge of the screen (using `position: fixed`).
    @param {Array<String>} [config.fixedBottom]
      An array of CSS selectors that find elements fixed to the
      bottom edge of the screen (using `position: fixed`).
    @param {Array<String>} [config.anchoredRight]
      An array of CSS selectors that find elements anchored to the
      right edge of the screen (using `position: fixed` or `position: absolute`).
    @param {Number} [config.duration]
      The duration of the scrolling animation in milliseconds.
      Setting this to `0` will disable scrolling animations.
    @param {String} [config.easing]
      The timing function that controls the animation's acceleration.
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @param {Number} [config.snap]
      When [revealing](/up.reveal) elements, Up.js will scroll an viewport
      to the top when the revealed element is closer to the top than `config.snap`.
    @param {Number} [config.substance]
      A number indicating how many top pixel rows of an element to [reveal](/up.reveal).
     */
    config = u.config({
      duration: 0,
      viewports: [document, '.up-modal', '[up-viewport]'],
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
    
    \#\#\#\# Example
    
    This will scroll a `<div class="main">...</div>` to a Y-position of 100 pixels:
    
        up.scroll('.main', 100);
    
    \#\#\#\# Animating the scrolling motion
    
    The scrolling can (optionally) be animated.
    
        up.scroll('.main', 100, {
          easing: 'swing',
          duration: 250
        });
    
    If the given viewport is already in a scroll animation when `up.scroll`
    is called a second time, the previous animation will instantly jump to the
    last frame before the next animation is started.
    
    @protected
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
    @private
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
    @private
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
          u.error("Fixed element %o must have a CSS attribute %o", $obstructor, cssAttr);
        }
        return parseInt(anchorPosition) + $obstructor.height();
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
    
    By default Up.js will always reveal an element before
    updating it with Javascript functions like [`up.replace`](/up.replace)
    or UJS behavior like [`[up-target]`](/up-target).
    
    \#\#\#\# How Up.js finds the viewport
    
    The viewport (the container that is going to be scrolled)
    is the closest parent of the element that is either:
    
    - the currently open [modal](/up.modal)
    - an element with the attribute `[up-viewport]`
    - the `<body>` element
    - an element matching the selector you have configured using `up.layout.config.viewports.push('my-custom-selector')`
    
    \#\#\#\# Fixed elements obstruction the viewport
    
    Many applications have a navigation bar fixed to the top or bottom,
    obstructing the view on an element.
    
    To make `up.aware` of these fixed elements you can either:
    
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
     */
    reveal = function(elementOrSelector, options) {
      var $element, $viewport, elementDims, firstElementRow, lastElementRow, newScrollPos, obstruction, offsetShift, originalScrollPos, predictFirstVisibleRow, predictLastVisibleRow, snap, viewportHeight, viewportIsDocument;
      u.debug('Revealing %o', elementOrSelector);
      options = u.options(options);
      $element = $(elementOrSelector);
      $viewport = options.viewport ? $(options.viewport) : viewportOf($element);
      snap = u.option(options.snap, config.snap);
      viewportIsDocument = $viewport.is(document);
      viewportHeight = viewportIsDocument ? u.clientSize().height : $viewport.height();
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
        relative: $viewport
      });
      firstElementRow = elementDims.top + offsetShift;
      lastElementRow = firstElementRow + Math.min(elementDims.height, config.substance) - 1;
      if (lastElementRow > predictLastVisibleRow()) {
        newScrollPos += lastElementRow - predictLastVisibleRow();
      }
      if (firstElementRow < predictFirstVisibleRow() || options.top) {
        newScrollPos = firstElementRow - obstruction.top;
      }
      if (newScrollPos < snap) {
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
    
    @protected
    @function up.layout.viewportOf
    @param {String|Element|jQuery} selectorOrElement
     */
    viewportOf = function(selectorOrElement) {
      var $element, $viewport;
      $element = $(selectorOrElement);
      $viewport = viewportSelector().seekUp($element);
      $viewport.length || u.error("Could not find viewport for %o", $element);
      return $viewport;
    };

    /**
    Returns a jQuery collection of all the viewports contained within the
    given selector or element.
    
    @protected
    @function up.layout.viewportsWithin
    @param {String|Element|jQuery} selectorOrElement
    @return jQuery
     */
    viewportsWithin = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement);
      return viewportSelector().findWithSelf($element);
    };

    /**
    Returns a jQuery collection of all the viewports on the screen.
    
    @protected
    @function up.layout.viewports
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
    @protected
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
    @protected
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
    
    Up.js automatically saves scroll positions whenever a fragment was updated on the page.
    
    @function up.layout.saveScroll
    @param {String} [options.url]
    @param {Object<String, Number>} [options.tops]
    @protected
     */
    saveScroll = function(options) {
      var tops, url;
      if (options == null) {
        options = {};
      }
      url = u.option(options.url, up.history.url());
      tops = u.option(options.tops, scrollTops());
      u.debug('Saving scroll positions for URL %o: %o', url, tops);
      return lastScrollTops.set(url, tops);
    };

    /**
    Restores [previously saved](/up.layout.saveScroll) scroll positions of viewports
    viewports configured in [`up.layout.config.viewports`](/up.layout.config).
    
    Up.js automatically restores scroll positions when the user presses the back button.
    You can disable this behavior by setting [`up.history.config.restoreScroll = false`](/up.history.config).
    
    @function up.layout.restoreScroll
    @param {jQuery} [options.around]
      If set, only restores viewports that are either an ancestor
      or descendant of the given element.
    @protected
     */
    restoreScroll = function(options) {
      var $ancestorViewports, $descendantViewports, $matchingViewport, $viewports, key, right, scrollTop, tops, url;
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
      u.debug('Restoring scroll positions for URL %o (viewports are %o, saved tops are %o)', url, $viewports, tops);
      for (key in tops) {
        scrollTop = tops[key];
        right = key === 'document' ? document : key;
        $matchingViewport = $viewports.filter(right);
        scroll($matchingViewport, scrollTop, {
          duration: 0
        });
      }
      return u.resolvedDeferred();
    };

    /**
    @protected
    @function up.layout.revealOrRestoreScroll
    @return {Deferred} A promise for when the revealing or scroll restauration ends
     */
    revealOrRestoreScroll = function(selectorOrElement, options) {
      var $element, $target, id, parsed;
      $element = $(selectorOrElement);
      if (options.restoreScroll) {
        return restoreScroll({
          around: $element
        });
      } else if (options.reveal) {
        if (options.source) {
          parsed = u.parseUrl(options.source);
          if (parsed.hash && parsed.hash !== '#') {
            id = parsed.hash.substr(1);
            $target = u.findWithSelf($element, "#" + id + ", a[name='" + id + "']");
            if ($target.length) {
              $element = $target;
            }
          }
        }
        return reveal($element);
      } else {
        return u.resolvedDeferred();
      }
    };

    /**
    Marks this element as a scrolling container ("viewport").
    
    Apply this attribute if your app uses a custom panel layout with fixed positioning
    instead of scrolling `<body>`. As an alternative you can also push a selector
    matching your custom viewport to the [`up.layout.config.viewports`](/up.layout.config) array.
    
    [`up.reveal`](/up.reveal) will always try to scroll the viewport closest
    to the element that is being revealed. By default this is the `<body>` element.
    
    \#\#\#\# Example
    
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
     */

    /**
    Marks this element as a navigation fixed to the top edge of the screen
    using `position: fixed`.
    
    [`up.reveal`](/up.reveal) is aware of fixed elements and will scroll
    the viewport far enough so the revealed element is fully visible.
    
    Example:
    
        <div class="top-nav" up-fixed="top">...</div>
    
    @selector [up-fixed=top]
     */

    /**
    Marks this element as a navigation fixed to the bottom edge of the screen
    using `position: fixed`.
    
    [`up.reveal`](/up.reveal) is aware of fixed elements and will scroll
    the viewport far enough so the revealed element is fully visible.
    
    Example:
    
        <div class="bottom-nav" up-fixed="bottom">...</div>
    
    @selector [up-fixed=bottom]
     */
    up.on('up:framework:reset', reset);
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      reveal: reveal,
      scroll: scroll,
      finishScrolling: finishScrolling,
      config: config,
      defaults: function() {
        return u.error('up.layout.defaults(...) no longer exists. Set values on he up.layout.config property instead.');
      },
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
Changing page fragments programmatically
========================================
  
This module contains Up.js's core functions to [change](/up.replace) or [destroy](/up.destroy)
  page fragments via Javascript.

All the other Up.js modules (like [`up.link`](/up.link) or [`up.modal`](/up.modal))
are based on this module.
  
@class up.flow
 */

(function() {
  up.flow = (function($) {
    var autofocus, destroy, elementsInserted, findOldFragment, first, fragmentNotFound, implant, isRealElement, parseImplantSteps, parseResponse, reload, replace, setSource, source, swapElements, u;
    u = up.util;
    setSource = function(element, sourceUrl) {
      var $element;
      $element = $(element);
      if (u.isPresent(sourceUrl)) {
        sourceUrl = u.normalizeUrl(sourceUrl);
      }
      return $element.attr("up-source", sourceUrl);
    };
    source = function(selectorOrElement) {
      var $element;
      $element = $(selectorOrElement).closest('[up-source]');
      return u.presence($element.attr("up-source")) || up.browser.url();
    };

    /**
    Replaces elements on the current page with corresponding elements
    from a new page fetched from the server.
    
    The current and new elements must have the same CSS selector.
    
    \#\#\#\# Example
    
    Let's say your curent HTML looks like this:
    
        <div class="one">old one</div>
        <div class="two">old two</div>
    
    We now replace the second `<div>`:
    
        up.replace('.two', '/new');
    
    The server renders a response for `/new`:
    
        <div class="one">new one</div>
        <div class="two">new two</div>
    
    Up.js looks for the selector `.two` in the response and [implants](/up.implant) it into
    the current page. The current page now looks like this:
    
        <div class="one">old one</div>
        <div class="two">new two</div>
    
    Note how only `.two` has changed. The update for `.one` was
    discarded, since it didn't match the selector.
    
    \#\#\#\# Events
    
    Up.js will emit [`up:fragment:destroyed`](/up:fragment:destroyed) on the element
    that was replaced and [`up:fragment:inserted`](/up:fragment:inserted) on the new
    element that replaces it.
    
    @function up.replace
    @param {String|Element|jQuery} selectorOrElement
      The CSS selector to update. You can also pass a DOM element or jQuery element
      here, in which case a selector will be inferred from the element's class and ID.
    @param {String} url
      The URL to fetch from the server.
    @param {String} [options.method='get']
    @param {String} [options.title]
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
      If set to true, Up.js will try to restore the scroll position
      of all the viewports around or below the updated element. The position
      will be reset to the last known top position before a previous
      history change for the current URL.
    @param {Boolean} [options.cache]
      Whether to use a [cached response](/up.proxy) if available.
    @param {String} [options.historyMethod='push']
    @return {Promise}
      A promise that will be resolved when the page has been updated.
     */
    replace = function(selectorOrElement, url, options) {
      var promise, request, selector;
      u.debug("Replace %o with %o (options %o)", selectorOrElement, url, options);
      options = u.options(options);
      selector = u.presence(selectorOrElement) ? selectorOrElement : u.createSelectorFromElement($(selectorOrElement));
      if (!up.browser.canPushState() && options.history !== false) {
        if (!options.preload) {
          up.browser.loadPage(url, u.only(options, 'method'));
        }
        return u.unresolvablePromise();
      }
      request = {
        url: url,
        method: options.method,
        selector: selector,
        cache: options.cache,
        preload: options.preload
      };
      promise = up.proxy.ajax(request);
      promise.done(function(html, textStatus, xhr) {
        var currentLocation, newRequest;
        if (currentLocation = u.locationFromXhr(xhr)) {
          u.debug('Location from server: %o', currentLocation);
          newRequest = {
            url: currentLocation,
            method: u.methodFromXhr(xhr),
            selector: selector
          };
          up.proxy.alias(request, newRequest);
          url = currentLocation;
        }
        if (options.history !== false) {
          options.history = url;
        }
        if (options.source !== false) {
          options.source = url;
        }
        if (!options.preload) {
          return implant(selector, html, options);
        }
      });
      promise.fail(u.error);
      return promise;
    };

    /**
    Updates a selector on the current page with the
    same selector from the given HTML string.
    
    \#\#\#\# Example
    
    Let's say your curent HTML looks like this:
    
        <div class="one">old one</div>
        <div class="two">old two</div>
    
    We now replace the second `<div>`, using an HTML string
    as the source:
    
        html = '<div class="one">new one</div>' +
               '<div class="two">new two</div>';
    
        up.flow.implant('.two', html);
    
    Up.js looks for the selector `.two` in the strings and updates its
    contents in the current page. The current page now looks like this:
    
        <div class="one">old one</div>
        <div class="two">new two</div>
    
    Note how only `.two` has changed. The update for `.one` was
    discarded, since it didn't match the selector.
    
    @function up.flow.implant
    @protected
    @param {String} selector
    @param {String} html
    @param {Object} [options]
      See options for [`up.replace`](/up.replace).
     */
    implant = function(selector, html, options) {
      var $new, $old, j, len, ref, response, results, step;
      options = u.options(options, {
        historyMethod: 'push'
      });
      options.source = u.option(options.source, options.history);
      response = parseResponse(html);
      options.title || (options.title = response.title());
      if (options.saveScroll !== false) {
        up.layout.saveScroll();
      }
      ref = parseImplantSteps(selector, options);
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        step = ref[j];
        $old = findOldFragment(step.selector);
        $new = response.find(step.selector).first();
        results.push(swapElements($old, $new, step.pseudoClass, step.transition, options));
      }
      return results;
    };
    findOldFragment = function(selector) {
      return first(".up-popup " + selector) || first(".up-modal " + selector) || first(selector) || fragmentNotFound(selector);
    };
    fragmentNotFound = function(selector) {
      var message;
      message = 'Could not find selector %o in current body HTML';
      if (message[0] === '#') {
        message += ' (avoid using IDs)';
      }
      return u.error(message, selector);
    };
    parseResponse = function(html) {
      var htmlElement;
      htmlElement = u.createElementFromHtml(html);
      return {
        title: function() {
          var ref;
          return (ref = htmlElement.querySelector("title")) != null ? ref.textContent : void 0;
        },
        find: function(selector) {
          var child;
          if (child = htmlElement.querySelector(selector)) {
            return $(child);
          } else {
            return u.error("Could not find selector %o in response %o", selector, html);
          }
        }
      };
    };
    elementsInserted = function($new, options) {
      if (typeof options.insert === "function") {
        options.insert($new);
      }
      if (options.history) {
        if (options.title) {
          document.title = options.title;
        }
        up.history[options.historyMethod](options.history);
      }
      if (options.source !== false) {
        setSource($new, options.source);
      }
      autofocus($new);
      return up.hello($new);
    };
    swapElements = function($old, $new, pseudoClass, transition, options) {
      var $wrapper, insertionMethod;
      transition || (transition = 'none');
      up.motion.finish($old);
      if (pseudoClass) {
        insertionMethod = pseudoClass === 'before' ? 'prepend' : 'append';
        $wrapper = $new.contents().wrap('<span class="up-insertion"></span>').parent();
        $old[insertionMethod]($wrapper);
        u.copyAttributes($new, $old);
        elementsInserted($wrapper.children(), options);
        return up.layout.revealOrRestoreScroll($wrapper, options).then(function() {
          return up.animate($wrapper, transition, options);
        }).then(function() {
          u.unwrapElement($wrapper);
        });
      } else {
        return destroy($old, {
          animation: function() {
            $new.insertBefore($old);
            elementsInserted($new, options);
            if ($old.is('body') && transition !== 'none') {
              u.error('Cannot apply transitions to body-elements (%o)', transition);
            }
            return up.morph($old, $new, transition, options);
          }
        });
      }
    };
    parseImplantSteps = function(selector, options) {
      var comma, disjunction, i, j, len, results, selectorAtom, selectorParts, transition, transitionString, transitions;
      transitionString = options.transition || options.animation || 'none';
      comma = /\ *,\ */;
      disjunction = selector.split(comma);
      if (u.isPresent(transitionString)) {
        transitions = transitionString.split(comma);
      }
      results = [];
      for (i = j = 0, len = disjunction.length; j < len; i = ++j) {
        selectorAtom = disjunction[i];
        selectorParts = selectorAtom.match(/^(.+?)(?:\:(before|after))?$/);
        transition = transitions[i] || u.last(transitions);
        results.push({
          selector: selectorParts[1],
          pseudoClass: selectorParts[2],
          transition: transition
        });
      }
      return results;
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
    Returns the first element matching the given selector.
    
    Excludes elements that also match `.up-ghost` or `.up-destroying`
    or that are children of elements with these selectors.
    
    Returns `undefined` if no element matches these conditions.
    
    @protected
    @function up.first
    @param {String} selector
     */
    first = function(selector) {
      var $element, $match, element, elements, j, len;
      elements = $(selector).get();
      $match = void 0;
      for (j = 0, len = elements.length; j < len; j++) {
        element = elements[j];
        $element = $(element);
        if (isRealElement($element)) {
          $match = $element;
          break;
        }
      }
      return $match;
    };

    /**
    Destroys the given element or selector.
    
    Takes care that all [`up.compiler`](/up.compiler) destructors, if any, are called.
    
    The element is removed from the DOM.
    Note that if you choose to animate the element removal using `options.animate`,
    the element won't be removed until after the animation has completed.
    
    Emits events [`up:fragment:destroy`](/up:fragment:destroy) and [`up:fragment:destroyed`](/up:fragment:destroyed).
    
    @function up.destroy
    @param {String|Element|jQuery} selectorOrElement 
    @param {String} [options.url]
    @param {String} [options.title]
    @param {String|Function} [options.animation='none']
      The animation to use before the element is removed from the DOM.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate`](/up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate`](/up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate`](/up.animate).
    @return {Deferred}
      A promise that will be resolved once the element has been removed from the DOM.
     */
    destroy = function(selectorOrElement, options) {
      var $element, animateOptions, animationDeferred;
      $element = $(selectorOrElement);
      if (up.bus.nobodyPrevents('up:fragment:destroy', {
        $element: $element
      })) {
        options = u.options(options, {
          animation: 'none'
        });
        animateOptions = up.motion.animateOptions(options);
        $element.addClass('up-destroying');
        if (u.isPresent(options.url)) {
          up.history.push(options.url);
        }
        if (u.isPresent(options.title)) {
          document.title = options.title;
        }
        animationDeferred = u.presence(options.animation, u.isDeferred) || up.motion.animate($element, options.animation, animateOptions);
        animationDeferred.then(function() {
          up.emit('up:fragment:destroyed', {
            $element: $element
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
     */

    /**
    This event is [emitted](/up.emit) right before a [destroyed](/up.destroy)
    page fragment is removed from the DOM.
    
    If the destruction is animated, this event is emitted after
    the animation has ended.
    
    @event up:fragment:destroyed
    @param {jQuery} event.$element
      The page fragment that is about to be removed from the DOM.
     */

    /**
    Replaces the given element with a fresh copy fetched from the server.
    
    \#\#\#\# Example
    
        up.on('new-mail', function() {
          up.reload('.inbox');
        });
    
    Up.js remembers the URL from which a fragment was loaded, so you
    don't usually need to give an URL when reloading.
    
    @function up.reload
    @param {String|Element|jQuery} selectorOrElement
    @param {Object} [options]
      See options for [`up.replace`](/up.replace)
    @param {String} [options.url]
      The URL from which to reload the fragment.
      This defaults to the URL from which the fragment was originally loaded.
     */
    reload = function(selectorOrElement, options) {
      var sourceUrl;
      options = u.options(options, {
        cache: false
      });
      sourceUrl = options.url || source(selectorOrElement);
      return replace(selectorOrElement, sourceUrl, options);
    };
    up.on('ready', function() {
      return setSource(document.body, up.browser.url());
    });
    return {
      replace: replace,
      reload: reload,
      destroy: destroy,
      implant: implant,
      first: first
    };
  })(jQuery);

  up.replace = up.flow.replace;

  up.reload = up.flow.reload;

  up.destroy = up.flow.destroy;

  up.first = up.flow.first;

}).call(this);

/**
Animation
=========
  
Whenever you change a page fragment (through methods like
[`up.replace`](/up.replace) or UJS attributes like [`up-target`](/up-target))
you can animate the change.

For instance, when you replace a selector `.list` with a new `.list`
from the server, you can add an `up-transition="cross-fade"` attribute
to smoothly fade out the old `.list` while fading in the new `.list`:

    <a href="/users" up-target=".list" up-transition="cross-fade">Show users</a>

When we morph between an old an new element, we call it a *transition*.
In contrast, when we animate a new element without simultaneously removing an
old element, we call it an *animation*.

An example for an animation is opening a new dialog, which we can animate
using the `up-animation` attribute:

    <a href="/users" up-modal=".list" up-animation="move-from-top">Show users</a>

Up.js ships with a number of predefined [animations](/up.animate#named-animation)
and [transitions](/up.morph#named-animation).
You can also easily [define your own animations](/up.animation)
or [transitions](/up.transition) using Javascript or CSS.

  
@class up.motion
 */

(function() {
  up.motion = (function($) {
    var GHOSTING_PROMISE_KEY, animate, animateOptions, animation, animations, assertIsDeferred, config, defaultAnimations, defaultTransitions, findAnimation, finish, finishGhosting, morph, none, prependCopy, reset, resolvableWhen, skipMorph, snapshot, transition, transitions, u, withGhosts;
    u = up.util;
    animations = {};
    defaultAnimations = {};
    transitions = {};
    defaultTransitions = {};

    /**
    Sets default options for animations and transitions.
    
    @property up.motion.config
    @param {Number} [config.duration=300]
    @param {Number} [config.delay=0]
    @param {String} [config.easing='ease']
     */
    config = u.config({
      duration: 300,
      delay: 0,
      easing: 'ease'
    });
    reset = function() {
      animations = u.copy(defaultAnimations);
      transitions = u.copy(defaultTransitions);
      return config.reset();
    };

    /**
    Applies the given animation to the given element:
    
        up.animate('.warning', 'fade-in');
    
    You can pass additional options:
    
        up.animate('warning', '.fade-in', {
          delay: 1000,
          duration: 250,
          easing: 'linear'
        });
    
    \#\#\#\# Named animations
    
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
    
    You can define additional named animations using [`up.animation`](/up.animation).
    
    \#\#\#\# Animating CSS properties directly
    
    By passing an object instead of an animation name, you can animate
    the CSS properties of the given element:
    
        var $warning = $('.warning');
        $warning.css({ opacity: 0 });
        up.animate($warning, { opacity: 1 });
    
    \#\#\#\# Multiple animations on the same element
    
    Up.js doesn't allow more than one concurrent animation on the same element.
    
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
     */
    animate = function(elementOrSelector, animation, options) {
      var $element;
      $element = $(elementOrSelector);
      finish($element);
      options = animateOptions(options);
      if (animation === 'none' || animation === false) {
        none();
      }
      if (u.isFunction(animation)) {
        return assertIsDeferred(animation($element, options), animation);
      } else if (u.isString(animation)) {
        return animate($element, findAnimation(animation), options);
      } else if (u.isHash(animation)) {
        return u.cssAnimate($element, animation, options);
      } else {
        return u.error("Unknown animation type %o", animation);
      }
    };

    /**
    Extracts animation-related options from the given options hash.
    If `$element` is given, also inspects the element for animation-related
    attributes like `up-easing` or `up-duration`.
    
    @protected
    @function up.motion.animateOptions
     */
    animateOptions = function(allOptions, $element) {
      var options;
      if ($element == null) {
        $element = null;
      }
      allOptions = u.options(allOptions);
      options = {};
      options.easing = u.option(allOptions.easing, $element != null ? $element.attr('up-easing') : void 0, config.easing);
      options.duration = Number(u.option(allOptions.duration, $element != null ? $element.attr('up-duration') : void 0, config.duration));
      options.delay = Number(u.option(allOptions.delay, $element != null ? $element.attr('up-delay') : void 0, config.delay));
      return options;
    };
    findAnimation = function(name) {
      return animations[name] || u.error("Unknown animation %o", name);
    };
    GHOSTING_PROMISE_KEY = 'up-ghosting-promise';
    withGhosts = function($old, $new, options, block) {
      var $viewport, newCopy, newScrollTop, oldCopy, oldScrollTop, promise, showNew;
      oldCopy = void 0;
      newCopy = void 0;
      oldScrollTop = void 0;
      newScrollTop = void 0;
      $viewport = up.layout.viewportOf($old);
      u.temporaryCss($new, {
        display: 'none'
      }, function() {
        oldCopy = prependCopy($old, $viewport);
        oldCopy.$ghost.addClass('up-destroying');
        oldCopy.$bounds.addClass('up-destroying');
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
      promise = block(oldCopy.$ghost, newCopy.$ghost);
      $old.data(GHOSTING_PROMISE_KEY, promise);
      $new.data(GHOSTING_PROMISE_KEY, promise);
      promise.then(function() {
        $old.removeData(GHOSTING_PROMISE_KEY);
        $new.removeData(GHOSTING_PROMISE_KEY);
        showNew();
        oldCopy.$bounds.remove();
        return newCopy.$bounds.remove();
      });
      return promise;
    };

    /**
    Completes all animations and transitions for the given element
    by jumping to the last animation frame instantly. All callbacks chained to
    the original animation's promise will be called.
    
    Does nothing if the given element is not currently animating.
    
    @function up.motion.finish
    @param {Element|jQuery|String} elementOrSelector
     */
    finish = function(elementOrSelector) {
      return $(elementOrSelector).each(function() {
        var $element;
        $element = $(this);
        u.finishCssAnimate($element);
        return finishGhosting($element);
      });
    };
    finishGhosting = function($element) {
      var existingGhosting;
      if (existingGhosting = $element.data(GHOSTING_PROMISE_KEY)) {
        u.debug('Canceling existing ghosting on %o', $element);
        return typeof existingGhosting.resolve === "function" ? existingGhosting.resolve() : void 0;
      }
    };
    assertIsDeferred = function(object, source) {
      if (u.isDeferred(object)) {
        return object;
      } else {
        return u.error("Did not return a promise with .then and .resolve methods: %o", source);
      }
    };

    /**
    Performs an animated transition between two elements.
    Transitions are implement by performing two animations in parallel,
    causing one element to disappear and the other to appear.
    
    Note that the transition does not remove any elements from the DOM.
    The first element will remain in the DOM, albeit hidden using `display: none`.
    
    \#\#\#\# Named transitions
    
    The following transitions are pre-defined:
    
    | `cross-fade` | Fades out the first element. Simultaneously fades in the second element. |
    | `move-up`    | Moves the first element upwards until it exits the screen at the top edge. Simultaneously moves the second element upwards from beyond the bottom edge of the screen until it reaches its current position. |
    | `move-down`  | Moves the first element downwards until it exits the screen at the bottom edge. Simultaneously moves the second element downwards from beyond the top edge of the screen until it reaches its current position. |
    | `move-left`  | Moves the first element leftwards until it exists the screen at the left edge. Simultaneously moves the second element leftwards from beyond the right  edge of the screen until it reaches its current position. |
    | `move-right` | Moves the first element rightwards until it exists the screen at the right edge. Simultaneously moves the second element rightwards from beyond the left edge of the screen until it reaches its current position. |
    | `none`       | A transition that has no visible effect. Sounds useless at first, but can save you a lot of `if` statements. |
    
    You can define additional named transitions using [`up.transition`](/up.transition).
    
    You can also compose a transition from two [named animations](/named-animations).
    separated by a slash character (`/`):
    
    - `move-to-bottom/fade-in`
    - `move-to-left/move-from-top`
    
    \#\#\#\# Implementation details
    
    During a transition both the old and new element occupy
    the same position on the screen.
    
    Since the CSS layout flow will usually not allow two elements to
    overlay the same space, Up.js:
    
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
     */
    morph = function(source, target, transitionOrName, options) {
      var $new, $old, animation, deferred, parsedOptions, parts, transition;
      u.debug('Morphing %o to %o (using %o)', source, target, transitionOrName);
      $old = $(source);
      $new = $(target);
      parsedOptions = u.only(options, 'reveal', 'restoreScroll', 'source');
      parsedOptions = u.extend(parsedOptions, animateOptions(options));
      if (up.browser.canCssAnimation()) {
        finish($old);
        finish($new);
        if (transitionOrName === 'none' || transitionOrName === false || (animation = animations[transitionOrName])) {
          deferred = skipMorph($old, $new, parsedOptions);
          deferred.then(function() {
            return animate($new, animation || 'none', options);
          });
          return deferred;
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
          return u.error("Unknown transition %o", transitionOrName);
        }
      } else {
        return skipMorph($old, $new, parsedOptions);
      }
    };

    /**
    This causes the side effects of a successful transition, but instantly.
    We use this to skip morphing for old browsers, or when the developer
    decides to only animate the new element (i.e. no real ghosting or transition)   .
    
    @private
     */
    skipMorph = function($old, $new, options) {
      $old.hide();
      return up.layout.revealOrRestoreScroll($new, options);
    };

    /**
    @private
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
        top: '',
        right: '',
        bottom: '',
        left: '',
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
    
    It is recommended that your transitions use [`up.animate`](/up.animate),
    passing along the `options` that were passed to you.
    
    If you choose to *not* use `up.animate` and roll your own
    logic instead, your code must honor the following contract:
    
    1. It must honor the passed options.
    2. It must *not* remove any of the given elements from the DOM.
    3. It returns a promise that is resolved when the transition ends
    4. The returned promise responds to a `resolve()` function that
       instantly jumps to the last transition frame and resolves the promise.
    
    Calling [`up.animate`](/up.animate) with an object argument
    will take care of all these points.
    
    @function up.transition
    @param {String} name
    @param {Function} transition
     */
    transition = function(name, transition) {
      return transitions[name] = transition;
    };

    /**
    Defines a named animation.
    
    Here is the definition of the pre-defined `fade-in` animation:
    
        up.animation('fade-in', function($ghost, options) {
          $ghost.css(opacity: 0);
          up.animate($ghost, { opacity: 1 }, options);
        })
    
    It is recommended that your definitions always end by calling
    calling [`up.animate`](/up.animate) with an object argument, passing along
    the `options` that were passed to you.
    
    If you choose to *not* use `up.animate` and roll your own
    animation code instead, your code must honor the following contract:
    
    1. It must honor the passed options.
    2. It must *not* remove the passed element from the DOM.
    3. It returns a promise that is resolved when the animation ends
    4. The returned promise responds to a `resolve()` function that
       instantly jumps to the last animation frame and resolves the promise.
    
    Calling [`up.animate`](/up.animate) with an object argument
    will take care of all these points.
    
    @function up.animation
    @param {String} name
    @param {Function} animation
     */
    animation = function(name, animation) {
      return animations[name] = animation;
    };
    snapshot = function() {
      defaultAnimations = u.copy(animations);
      return defaultTransitions = u.copy(transitions);
    };

    /**
    Returns a new promise that resolves once all promises in arguments resolve.
    
    Other then [`$.when` from jQuery](https://api.jquery.com/jquery.when/),
    the combined promise will have a `resolve` method. This `resolve` method
    will resolve all the wrapped promises.
    
    @function up.motion.when
    @param promises...
    @return A new promise.
     */
    resolvableWhen = u.resolvableWhen;

    /**
    Returns a no-op animation or transition which has no visual effects
    and completes instantly.
    
    @function up.motion.none
    @return {Promise}
      A resolved promise
     */
    none = u.resolvedDeferred;
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
    animation('move-to-top', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.top + box.height;
      $ghost.css({
        'margin-top': '0px'
      });
      return animate($ghost, {
        'margin-top': "-" + travelDistance + "px"
      }, options);
    });
    animation('move-from-top', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.top + box.height;
      $ghost.css({
        'margin-top': "-" + travelDistance + "px"
      });
      return animate($ghost, {
        'margin-top': '0px'
      }, options);
    });
    animation('move-to-bottom', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().height - box.top;
      $ghost.css({
        'margin-top': '0px'
      });
      return animate($ghost, {
        'margin-top': travelDistance + "px"
      }, options);
    });
    animation('move-from-bottom', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().height - box.top;
      $ghost.css({
        'margin-top': travelDistance + "px"
      });
      return animate($ghost, {
        'margin-top': '0px'
      }, options);
    });
    animation('move-to-left', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.left + box.width;
      $ghost.css({
        'margin-left': '0px'
      });
      return animate($ghost, {
        'margin-left': "-" + travelDistance + "px"
      }, options);
    });
    animation('move-from-left', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = box.left + box.width;
      $ghost.css({
        'margin-left': "-" + travelDistance + "px"
      });
      return animate($ghost, {
        'margin-left': '0px'
      }, options);
    });
    animation('move-to-right', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().width - box.left;
      $ghost.css({
        'margin-left': '0px'
      });
      return animate($ghost, {
        'margin-left': travelDistance + "px"
      }, options);
    });
    animation('move-from-right', function($ghost, options) {
      var box, travelDistance;
      box = u.measure($ghost);
      travelDistance = u.clientSize().width - box.left;
      $ghost.css({
        'margin-left': travelDistance + "px"
      });
      return animate($ghost, {
        'margin-left': '0px'
      }, options);
    });
    animation('roll-down', function($ghost, options) {
      var fullHeight, styleMemo;
      fullHeight = $ghost.height();
      styleMemo = u.temporaryCss($ghost, {
        height: '0px',
        overflow: 'hidden'
      });
      return animate($ghost, {
        height: fullHeight + "px"
      }, options).then(styleMemo);
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
    up.on('up:framework:boot', snapshot);
    up.on('up:framework:reset', reset);
    return {
      morph: morph,
      animate: animate,
      animateOptions: animateOptions,
      finish: finish,
      transition: transition,
      animation: animation,
      config: config,
      defaults: function() {
        return u.error('up.motion.defaults(...) no longer exists. Set values on he up.motion.config property instead.');
      },
      none: none,
      when: resolvableWhen,
      prependCopy: prependCopy
    };
  })(jQuery);

  up.transition = up.motion.transition;

  up.animation = up.motion.animation;

  up.morph = up.motion.morph;

  up.animate = up.motion.animate;

}).call(this);

/**
Caching and preloading
======================

All HTTP requests go through the Up.js proxy.
It caches a [limited](/up.proxy.config) number of server responses
for a [limited](/up.proxy.config) amount of time,
making requests to these URLs return insantly.
  
The cache is cleared whenever the user makes a non-`GET` request
(like `POST`, `PUT` or `DELETE`).

The proxy can also used to speed up reaction times by [preloading
links when the user hovers over the click area](/up-preload) (or puts the mouse/finger
down before releasing). This way the response will already be cached when
the user performs the click.

Spinners
--------

You can [listen](/up.on) to the [`up:proxy:busy`](/up:proxy:busy)
and [`up:proxy:idle`](/up:proxy:idle) events  to implement a spinner
that appears during a long-running request,
and disappears once the response has been received:

    <div class="spinner">Please wait!</div>

Here is the Javascript to make it alive:

    up.compiler('.spinner', function($element) {

      show = function() { $element.show() };
      hide = function() { $element.hide() };

      showOff = up.on('up:proxy:busy', show);
      hideOff = up.on('up:proxy:idle', hide);

      hide();

      // Clean up when the element is removed from the DOM
      return function() {
        showOff();
        hideOff();
      };

    });

The `up:proxy:busy` event will be emitted after a delay of 300 ms
to prevent the spinner from flickering on and off.
You can change (or remove) this delay by [configuring `up.proxy`](/up.proxy.config) like this:

    up.proxy.config.busyDelay = 150;

@class up.proxy
 */

(function() {
  up.proxy = (function($) {
    var $waitingLink, SAFE_HTTP_METHODS, ajax, alias, busy, busyDelayTimer, busyEventEmitted, cache, cacheKey, cancelBusyDelay, cancelPreloadDelay, checkPreload, clear, config, get, idle, isIdempotent, load, loadEnded, loadStarted, normalizeRequest, pendingCount, preload, preloadDelayTimer, remove, reset, set, startPreloadDelay, u;
    u = up.util;
    $waitingLink = void 0;
    preloadDelayTimer = void 0;
    busyDelayTimer = void 0;
    pendingCount = void 0;
    busyEventEmitted = void 0;

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
    @param {Number} [config.busyDelay=300]
      How long the proxy waits until emitting the `proxy:busy` [event](/up.bus).
      Use this to prevent flickering of spinners.
     */
    config = u.config({
      busyDelay: 300,
      preloadDelay: 75,
      cacheSize: 70,
      cacheExpiry: 1000 * 60 * 5
    });
    cacheKey = function(request) {
      normalizeRequest(request);
      return [request.url, request.method, request.data, request.selector].join('|');
    };
    cache = u.cache({
      size: function() {
        return config.cacheSize;
      },
      expiry: function() {
        return config.cacheExpiry;
      },
      key: cacheKey,
      log: 'up.proxy'
    });

    /**
    @protected
    @function up.proxy.get
     */
    get = cache.get;

    /**
    @protected
    @function up.proxy.set
     */
    set = cache.set;

    /**
    @protected
    @function up.proxy.remove
     */
    remove = cache.remove;

    /**
    Removes all cache entries.
    
    @function up.proxy.clear
     */
    clear = cache.clear;
    cancelPreloadDelay = function() {
      clearTimeout(preloadDelayTimer);
      return preloadDelayTimer = null;
    };
    cancelBusyDelay = function() {
      clearTimeout(busyDelayTimer);
      return busyDelayTimer = null;
    };
    reset = function() {
      $waitingLink = null;
      cancelPreloadDelay();
      cancelBusyDelay();
      pendingCount = 0;
      config.reset();
      busyEventEmitted = false;
      return cache.clear();
    };
    reset();
    alias = cache.alias;
    normalizeRequest = function(request) {
      if (!request._normalized) {
        request.method = u.normalizeMethod(request.method);
        if (request.url) {
          request.url = u.normalizeUrl(request.url);
        }
        request.selector || (request.selector = 'body');
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
    
    If a network connection is attempted, the proxy will emit
    a `proxy:load` event with the `request` as its argument.
    Once the response is received, a `proxy:receive` event will
    be emitted.
    
    @function up.proxy.ajax
    @param {String} request.url
    @param {String} [request.method='GET']
    @param {String} [request.selector]
    @param {Boolean} [request.cache]
      Whether to use a cached response, if available.
      If set to `false` a network connection will always be attempted.
     */
    ajax = function(options) {
      var forceCache, ignoreCache, pending, promise, request;
      forceCache = options.cache === true;
      ignoreCache = options.cache === false;
      request = u.only(options, 'url', 'method', 'data', 'selector', '_normalized');
      pending = true;
      if (!isIdempotent(request) && !forceCache) {
        clear();
        promise = load(request);
      } else if ((promise = get(request)) && !ignoreCache) {
        pending = promise.state() === 'pending';
      } else {
        promise = load(request);
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
    SAFE_HTTP_METHODS = ['GET', 'OPTIONS', 'HEAD'];

    /**
    Returns `true` if the proxy is not currently waiting
    for a request to finish. Returns `false` otherwise.
    
    The proxy will also emit an `proxy:idle` [event](/up.bus) if it
    used to busy, but is now idle.
    
    @function up.proxy.idle
    @return {Boolean} Whether the proxy is idle
     */
    idle = function() {
      return pendingCount === 0;
    };

    /**
    Returns `true` if the proxy is currently waiting
    for a request to finish. Returns `false` otherwise.
    
    The proxy will also emit an `proxy:busy` [event](/up.bus) if it
    used to idle, but is now busy.
    
    @function up.proxy.busy
    @return {Boolean} Whether the proxy is busy
     */
    busy = function() {
      return pendingCount > 0;
    };
    loadStarted = function() {
      var emission, wasIdle;
      wasIdle = idle();
      pendingCount += 1;
      if (wasIdle) {
        emission = function() {
          if (busy()) {
            up.emit('up:proxy:busy');
            return busyEventEmitted = true;
          }
        };
        if (config.busyDelay > 0) {
          return busyDelayTimer = setTimeout(emission, config.busyDelay);
        } else {
          return emission();
        }
      }
    };

    /**
    This event is [emitted]/(up.emit) when [AJAX requests](/up.proxy.ajax)
    are taking long to finish.
    
    By default Up.js will wait 300 ms for an AJAX request to finish
    before emitting `up:proxy:busy`. You can configure this time like this:
    
        up.proxy.config.busyDelay = 150;
    
    Once all responses have been received, an [`up:proxy:idle`](/up:proxy:idle)
    will be emitted.
    
    Note that if additional requests are made while Up.js is already busy
    waiting, **no** additional `up:proxy:busy` events will be triggered.
    
    @event up:proxy:busy
     */
    loadEnded = function() {
      pendingCount -= 1;
      if (idle() && busyEventEmitted) {
        up.emit('up:proxy:idle');
        return busyEventEmitted = false;
      }
    };

    /**
    This event is [emitted]/(up.emit) when [AJAX requests](/up.proxy.ajax)
    have [taken long to finish](/up:proxy:busy), but have finished now.
    
    @event up:proxy:busy
     */
    load = function(request) {
      var promise;
      u.debug('Loading URL %o', request.url);
      up.emit('up:proxy:load', request);
      promise = u.ajax(request);
      promise.always(function() {
        return up.emit('up:proxy:received', request);
      });
      return promise;
    };

    /**
    This event is [emitted]/(up.emit) before an [AJAX request](/up.proxy.ajax)
    is starting to load.
    
    @event up:proxy:load
    @protected
    @param event.url
    @param event.method
    @param event.selector
     */

    /**
    This event is [emitted]/(up.emit) when the response to an [AJAX request](/up.proxy.ajax)
    has been received.
    
    @event up:proxy:received
    @protected
    @param event.url
    @param event.method
    @param event.selector
     */
    isIdempotent = function(request) {
      normalizeRequest(request);
      return u.contains(SAFE_HTTP_METHODS, request.method);
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
    @protected
    @function up.proxy.preload
    @param {String|Element|jQuery}
      The element whose destination should be preloaded.
    @return
      A promise that will be resolved when the request was loaded and cached
     */
    preload = function(linkOrSelector, options) {
      var $link, method;
      $link = $(linkOrSelector);
      options = u.options(options);
      method = up.link.followMethod($link, options);
      if (isIdempotent({
        method: method
      })) {
        u.debug("Preloading %o", $link);
        options.preload = true;
        return up.follow($link, options);
      } else {
        u.debug("Won't preload %o due to unsafe method %o", $link, method);
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
      idle: idle,
      busy: busy,
      config: config,
      defaults: function() {
        return u.error('up.proxy.defaults(...) no longer exists. Set values on he up.proxy.config property instead.');
      }
    };
  })(jQuery);

}).call(this);

/**
Linking to page fragments
=========================

Just like in a classical web application, an Up.js app renders a series of *full HTML pages* on the server.

Let's say we are rendering three pages with a tabbed navigation to switch between screens:

```
  /pages/a                /pages/b                /pages/c

+---+---+---+           +---+---+---+           +---+---+---+
| A | B | C |           | A | B | C |           | A | B | C |
|   +--------  (click)  +---+   +----  (click)  +---+---+   |
|           |  ======>  |           |  ======>  |           |
|  Page A   |           |  Page B   |           |  Page C   |
|           |           |           |           |           |
+-----------|           +-----------|           +-----------|
```

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

Using this document-oriented way of navigating between pages
is not a good fit for modern applications, for a multitude of reasons:

- State changes caused by AJAX updates get lost during the page transition.
- Unsaved form changes get lost during the page transition.
- The Javascript VM is reset during the page transition.
- If the page layout is composed from multiple srollable containers
  (e.g. a pane view), the scroll positions get lost during the page transition.
- The user sees a "flash" as the browser loads and renders the new page,
  even if large portions of the old and new page are the same (navigation, layout, etc.).


Smoother flow by updating fragments
-----------------------------------

In Up.js you annotate navigation links with an `up-target` attribute.
The value of this attribute is a CSS selector that indicates which page
fragment to update.

Since we only want to update the `<article>` tag, we will use `up-target="article"`:


```
<nav>
  <a href="/pages/a" up-target="article">A</a>
  <a href="/pages/b" up-target="article">B</a>
  <a href="/pages/b" up-target="article">C</a>
</nav>
```

Instead of `article` you can use any other CSS selector (e. g.  `#main .article`).

With these `up-target` annotations Up.js only updates the targeted part of the screen.
Javascript will not be reloaded, no white flash during a full page reload.


Read on
-------
- You can [animate page transitions](/up.motion) by definining animations for fragments as they enter or leave the screen.
- The `up-target` mechanism also works with [forms](/up.form).
- As you switch through pages, Up.js will [update your browser's location bar and history](/up.history)
- You can [open fragments in popups or modal dialogs](/up.modal).
- You can give users [immediate feedback](/up.navigation) when a link is clicked or becomes current, without waiting for the server.
- [Controlling Up.js pragmatically through Javascript](/up.flow)
- [Defining custom tags](/up.syntax)

  
@class up.link
 */

(function() {
  up.link = (function($) {
    var childClicked, follow, followMethod, makeFollowable, shouldProcessLinkEvent, u, visit;
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
    @param {Object} options
      See options for [`up.replace`](/up.replace)
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
    
    Any Up.js UJS attributes on the given link will be honored. E. g. you have this link:
    
        <a href="/users" up-target=".main">Users</a>
    
    You can update the page's `.main` selector with the `.main` from `/users` like this:
    
        var $link = $('a:first'); // select link with jQuery
        up.follow($link);
    
    @function up.follow
    @param {Element|jQuery|String} linkOrSelector
      An element or selector which resolves to an `<a>` tag
      or any element that is marked up with an `up-href` attribute.
    @param {String} [options.target]
      The selector to replace.
      Defaults to the `up-target` attribute on `link`,
      or to `body` if such an attribute does not exist.
    @param {Function|String} [options.transition]
      A transition function or name.
    @param {Number} [options.duration]
      The duration of the transition. See [`up.morph`](/up.morph).
    @param {Number} [options.delay]
      The delay before the transition starts. See [`up.morph`](/up.morph).
    @param {String} [options.easing]
      The timing function that controls the transition's acceleration. [`up.morph`](/up.morph).
    @param {Element|jQuery|String} [options.reveal]
      Whether to reveal the target  element within its viewport before updating.
    @param {Boolean} [options.restoreScroll]
      If set to `true`, this will attempt to [`restore scroll positions`](/up.restoreScroll)
      previously seen on the destination URL.
    @param {Boolean} [options.cache]
      Whether to force the use of a cached response (`true`)
      or never use the cache (`false`)
      or make an educated guess (`undefined`).
     */
    follow = function(linkOrSelector, options) {
      var $link, selector, url;
      $link = $(linkOrSelector);
      options = u.options(options);
      url = u.option($link.attr('up-href'), $link.attr('href'));
      selector = u.option(options.target, $link.attr('up-target'), 'body');
      options.transition = u.option(options.transition, u.castedAttr($link, 'up-transition'), u.castedAttr($link, 'up-animation'));
      options.history = u.option(options.history, u.castedAttr($link, 'up-history'));
      options.reveal = u.option(options.reveal, u.castedAttr($link, 'up-reveal'), true);
      options.cache = u.option(options.cache, u.castedAttr($link, 'up-cache'));
      options.restoreScroll = u.option(options.restoreScroll, u.castedAttr($link, 'up-restore-scroll'));
      options.method = followMethod($link, options);
      options = u.merge(options, up.motion.animateOptions(options, $link));
      return up.replace(selector, url, options);
    };

    /**
    Returns the HTTP method that should be used when following the given link.
    
    Looks at the link's `up-method` or `data-method` attribute.
    Defaults to `get`.
    
    @protected
    @function up.link.followMethod
    @param linkOrSelector
    @param options.method {String}
     */
    followMethod = function(linkOrSelector, options) {
      var $link;
      $link = $(linkOrSelector);
      options = u.options(options);
      return u.option(options.method, $link.attr('up-method'), $link.attr('data-method'), 'get').toUpperCase();
    };

    /**
    Follows this link via AJAX and replaces a CSS selector in the current page
    with corresponding elements from a new page fetched from the server:
    
        <a href="/posts/5" up-target=".main">Read post</a>
    
    \#\#\#\# Updating multiple fragments
    
    You can update multiple fragments from a single request by separating
    separators with a comma (like in CSS). E.g. if opening a post should
    also update a bubble showing the number of unread posts, you might
    do this:
    
        <a href="/posts/5" up-target=".main, .unread-count">Read post</a>
    
    \#\#\#\# Appending or prepending instead of replacing
    
    By default Up.js will replace the given selector with the same
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
    
    \#\#\#\# Following elements that are no links
    
    You can also use `[up-target]` to turn an arbitrary element into a link.
    In this case, put the link's destination into the `up-href` attribute:
    
        <button up-target=".main" up-href="/foo/bar">Go</button>
    
    Note that using any element other than `<a>` will prevent users from
    opening the destination in a new tab.
    
    @selector a[up-target]
    @param {String} up-target
      The CSS selector to replace
    @param {String} [up-href]
      The destination URL to follow.
      If omitted, the the link's `href` attribute will be used.
    @param {String} [up-reveal='true']
      Whether to reveal the target element within its viewport before updating.
    @param {String} [up-restore-scroll='false']
      Whether to restore previously known scroll position of all viewports
      within the target selector.
    @param {String} [up-cache]
      Whether to force the use of a cached response (`true`)
      or never use the cache (`false`)
      or make an educated guess (`undefined`).
     */
    up.on('click', 'a[up-target], [up-href][up-target]', function(event, $link) {
      if (shouldProcessLinkEvent(event, $link)) {
        if ($link.is('[up-instant]')) {
          return event.preventDefault();
        } else {
          event.preventDefault();
          return follow($link);
        }
      }
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
    
    @selector a[up-instant]
     */
    up.on('mousedown', 'a[up-instant], [up-href][up-instant]', function(event, $link) {
      if (shouldProcessLinkEvent(event, $link)) {
        event.preventDefault();
        return follow($link);
      }
    });

    /**
    @function up.link.childClicked
    @private
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

    /**
    Makes sure that the given link is handled by Up.js.
    
    This is done by giving the link an `up-follow` attribute
    if it doesn't already have it an `up-target` or `up-follow` attribute.
    
    @function up.link.makeFollowable
    @protected
     */
    makeFollowable = function(link) {
      var $link;
      $link = $(link);
      if (u.isMissing($link.attr('up-target')) && u.isMissing($link.attr('up-follow'))) {
        return $link.attr('up-follow', '');
      }
    };

    /**
    If applied on a link, Follows this link via AJAX and replaces the
    current `<body>` element with the response's `<body>` element.
    
    Example:
    
        <a href="/users" up-follow>User list</a>
    
    To only update a fragment instead of the entire page,
    see [`up-target`](/up-target).
    
    \#\#\#\# Turn any element into a link
    
    You can also use `[up-follow]` to turn an arbitrary element into a link.
    In this case, put the link's destination into the `up-href` attribute:
    
        <span up-follow up-href="/foo/bar">Go</span>
    
    Note that using any element other than `<a>` will prevent users from
    opening the destination in a new tab.
    
    @selector a[up-follow]
    @param [up-href]
      The destination URL to follow.
      If omitted, the the link's `href` attribute will be used.
    @param [up-restore-scroll='false']
      Whether to restore the scroll position of all viewports
      within the response.
     */
    up.on('click', 'a[up-follow], [up-href][up-follow]', function(event, $link) {
      if (shouldProcessLinkEvent(event, $link)) {
        if ($link.is('[up-instant]')) {
          return event.preventDefault();
        } else {
          event.preventDefault();
          return follow($link);
        }
      }
    });

    /**
    Add an `up-expand` class to any element that contains a link
    in order to enlarge the link's click area:
    
        <div class="notification" up-expand>
          Record was saved!
          <a href="/records">Close</a>
        </div>
    
    In the example above, clicking anywhere within `.notification` element
    would [follow](/up.follow) the *Close* link.
    
    `up-expand` honors all the UJS behavior in expanded links
    (`up-target`, `up-instant`, `up-preload`, etc.).
    
    @selector [up-expand]
     */
    up.compiler('[up-expand]', function($area) {
      var attribute, i, len, link, name, newAttrs, ref, upAttributePattern;
      link = $area.find('a, [up-href]').get(0);
      link || u.error('No link to expand within %o', $area);
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
    });

    /**
    Marks up the current link to be followed *as fast as possible*.
    This is done by:
    
    - [Following the link through AJAX](/up-target) instead of a full page load
    - [Preloading the link's destination URL](/up-preload)
    - [Triggering the link on `mousedown`](/up-instant) instead of on `click`
    
    Use `up-dash` like this:
    
        <a href="/users" up-dash=".main">User list</a>
    
    Note that this is shorthand for:
    
        <a href="/users" up-target=".main" up-instant up-preload>User list</a>  
    
    @selector [up-dash]
     */
    up.compiler('[up-dash]', function($element) {
      var newAttrs, target;
      target = u.castedAttr($element, 'up-dash');
      newAttrs = {
        'up-preload': 'true',
        'up-instant': 'true'
      };
      if (target === true) {
        newAttrs['up-follow'] = '';
      } else {
        newAttrs['up-target'] = target;
      }
      u.setMissingAttrs($element, newAttrs);
      return $element.removeAttr('up-dash');
    });
    return {
      knife: eval(typeof Knife !== "undefined" && Knife !== null ? Knife.point : void 0),
      visit: visit,
      follow: follow,
      makeFollowable: makeFollowable,
      childClicked: childClicked,
      followMethod: followMethod
    };
  })(jQuery);

  up.visit = up.link.visit;

  up.follow = up.link.follow;

}).call(this);

/**
Forms and controls
==================
  
Up.js comes with functionality to submit forms without
leaving the current page. This means you can replace page fragments,
open dialogs with sub-forms, etc. all without losing form state.
  
\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Explain how to display form errors
- Explain that the server needs to send 2xx or 5xx status codes so
  Up.js can decide whether the form submission was successful
- Explain that the server needs to send `X-Up-Location` and `X-Up-Method` headers
  if an successful form submission resulted in a redirect
- Examples

@class up.form
 */

(function() {
  up.form = (function($) {
    var observe, submit, u;
    u = up.util;

    /**
    Submits a form using the Up.js flow:
    
        up.submit('form.new_user')
    
    Instead of loading a new page, the form is submitted via AJAX.
    The response is parsed for a CSS selector and the matching elements will
    replace corresponding elements on the current page.
    
    @function up.submit
    @param {Element|jQuery|String} formOrSelector
      A reference or selector for the form to submit.
      If the argument points to an element that is not a form,
      Up.js will search its ancestors for the closest form.
    @param {String} [options.url]
      The URL where to submit the form.
      Defaults to the form's `action` attribute, or to the current URL of the browser window.
    @param {String} [options.method]
      The HTTP method used for the form submission.
      Defaults to the form's `up-method`, `data-method` or `method` attribute, or to `'post'`
      if none of these attributes are given.
    @param {String} [options.target]
      The selector to update when the form submission succeeds (server responds with status 200).
      Defaults to the form's `up-target` attribute, or to `'body'`.
    @param {String} [options.failTarget]
      The selector to update when the form submission fails (server responds with non-200 status).
      Defaults to the form's `up-fail-target` attribute, or to an auto-generated
      selector that matches the form itself.
    @param {Boolean|String} [options.history=true]
      Successful form submissions will add a history entry and change the browser's
      location bar if the form either uses the `GET` method or the response redirected
      to another page (this requires the `upjs-rails` gem).
      If want to prevent history changes in any case, set this to `false`.
      If you pass a `String`, it is used as the URL for the browser history.
    @param {String} [options.transition='none']
      The transition to use when a successful form submission updates the `options.target` selector.
      Defaults to the form's `up-transition` attribute, or to `'none'`.
    @param {String} [options.failTransition='none']
      The transition to use when a failed form submission updates the `options.failTarget` selector.
      Defaults to the form's `up-fail-transition` attribute, or to `options.transition`, or to `'none'`.
    @param {Number} [options.duration]
      The duration of the transition. See [`up.morph`](/up.morph).
    @param {Number} [options.delay]
      The delay before the transition starts. See [`up.morph`](/up.morph).
    @param {String} [options.easing]
      The timing function that controls the transition's acceleration. [`up.morph`](/up.morph).
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
    @return {Promise}
      A promise for the successful form submission.
     */
    submit = function(formOrSelector, options) {
      var $form, failureSelector, failureTransition, historyOption, httpMethod, implantOptions, request, successSelector, successTransition, successUrl, url, useCache;
      $form = $(formOrSelector).closest('form');
      options = u.options(options);
      successSelector = u.option(options.target, $form.attr('up-target'), 'body');
      failureSelector = u.option(options.failTarget, $form.attr('up-fail-target'), function() {
        return u.createSelectorFromElement($form);
      });
      historyOption = u.option(options.history, u.castedAttr($form, 'up-history'), true);
      successTransition = u.option(options.transition, u.castedAttr($form, 'up-transition'));
      failureTransition = u.option(options.failTransition, u.castedAttr($form, 'up-fail-transition'), successTransition);
      httpMethod = u.option(options.method, $form.attr('up-method'), $form.attr('data-method'), $form.attr('method'), 'post').toUpperCase();
      implantOptions = {};
      implantOptions.reveal = u.option(options.reveal, u.castedAttr($form, 'up-reveal'), true);
      implantOptions.cache = u.option(options.cache, u.castedAttr($form, 'up-cache'));
      implantOptions.restoreScroll = u.option(options.restoreScroll, u.castedAttr($form, 'up-restore-scroll'));
      implantOptions = u.extend(implantOptions, up.motion.animateOptions(options, $form));
      useCache = u.option(options.cache, u.castedAttr($form, 'up-cache'));
      url = u.option(options.url, $form.attr('action'), up.browser.url());
      $form.addClass('up-active');
      if (!up.browser.canPushState() && historyOption !== false) {
        $form.get(0).submit();
        return;
      }
      request = {
        url: url,
        method: httpMethod,
        data: $form.serialize(),
        selector: successSelector,
        cache: useCache
      };
      successUrl = function(xhr) {
        var currentLocation;
        url = void 0;
        if (u.isGiven(historyOption)) {
          if (historyOption === false || u.isString(historyOption)) {
            url = historyOption;
          } else if (currentLocation = u.locationFromXhr(xhr)) {
            url = currentLocation;
          } else if (request.type === 'GET') {
            url = request.url + '?' + request.data;
          }
        }
        return u.option(url, false);
      };
      return up.proxy.ajax(request).always(function() {
        return $form.removeClass('up-active');
      }).done(function(html, textStatus, xhr) {
        var successOptions;
        successOptions = u.merge(implantOptions, {
          history: successUrl(xhr),
          transition: successTransition
        });
        return up.flow.implant(successSelector, html, successOptions);
      }).fail(function(xhr, textStatus, errorThrown) {
        var failureOptions, html;
        html = xhr.responseText;
        failureOptions = u.merge(implantOptions, {
          transition: failureTransition
        });
        return up.flow.implant(failureSelector, html, failureOptions);
      });
    };

    /**
    Observes a form field and runs a callback when its value changes.
    This is useful for observing text fields while the user is typing.
    
    For instance, the following would submit the form whenever the
    text field value changes:
    
        up.observe('input[name=query]', { change: function(value, $input) {
          up.submit($input)
        } });
    
    \#\#\#\# Preventing concurrency
    
    Firing asynchronous code after a form field can cause
    [concurrency issues](https://makandracards.com/makandra/961-concurrency-issues-with-find-as-you-type-boxes).
    
    To mitigate this, `up.observe` will try to never run a callback
    before the previous callback has completed.
    To take advantage of this, your callback code must return a promise.
    Note that all asynchronous Up.js functions return promises.
    
    \#\#\#\# Throttling
    
    If you are concerned about fast typists causing too much
    load on your server, you can use a `delay` option to wait
    a few miliseconds before executing the callback:
    
        up.observe('input', {
          delay: 100,
          change: function(value, $input) { up.submit($input) }
        });
    
    
    @function up.observe
    @param {Element|jQuery|String} fieldOrSelector
    @param {Function(value, $field)|String} options.change
      The callback to execute when the field's value changes.
      If given as a function, it must take two arguments (`value`, `$field`).
      If given as a string, it will be evaled as Javascript code in a context where
      (`value`, `$field`) are set.
    @param {Number} [options.delay=0]
      The number of miliseconds to wait before executing the callback
      after the input value changes. Use this to limit how often the callback
      will be invoked for a fast typist.
     */
    observe = function(fieldOrSelector, options) {
      var $field, callback, callbackPromise, callbackTimer, changeEvents, check, clearTimer, codeOnChange, delay, knownValue, nextCallback, runNextCallback;
      $field = $(fieldOrSelector);
      options = u.options(options);
      delay = u.option($field.attr('up-delay'), options.delay, 0);
      delay = parseInt(delay);
      knownValue = null;
      callback = null;
      callbackTimer = null;
      if (codeOnChange = $field.attr('up-observe')) {
        callback = function(value, $field) {
          return eval(codeOnChange);
        };
      } else if (options.change) {
        callback = options.change;
      } else {
        u.error('up.observe: No change callback given');
      }
      callbackPromise = u.resolvedPromise();
      nextCallback = null;
      runNextCallback = function() {
        var returnValue;
        if (nextCallback) {
          returnValue = nextCallback();
          nextCallback = null;
          return returnValue;
        }
      };
      check = function() {
        var skipCallback, value;
        value = $field.val();
        skipCallback = u.isNull(knownValue);
        if (knownValue !== value) {
          knownValue = value;
          if (!skipCallback) {
            clearTimer();
            nextCallback = function() {
              return callback.apply($field.get(0), [value, $field]);
            };
            return callbackTimer = setTimeout(function() {
              return callbackPromise.then(function() {
                var returnValue;
                returnValue = runNextCallback();
                if (u.isPromise(returnValue)) {
                  return callbackPromise = returnValue;
                } else {
                  return callbackPromise = u.resolvedPromise();
                }
              });
            }, delay);
          }
        }
      };
      clearTimer = function() {
        return clearTimeout(callbackTimer);
      };
      changeEvents = up.browser.canInputEvent() ? 'input change' : 'input change keypress paste cut click propertychange';
      $field.on(changeEvents, check);
      check();
      return clearTimer;
    };

    /**
    Submits the form through AJAX, searches the response for the selector
    given in `up-target` and [replaces](/up.replace) the selector content in the current page:
    
        <form method="post" action="/users" up-target=".main">
          ...
        </form>
    
    @selector form[up-target]
    @param {String} up-target
      The selector to [replace](/up.replace) if the form submission is successful (200 status code).
    @param {String} [up-fail-target]
      The selector to [replace](/up.replace) if the form submission is not successful (non-200 status code).
      If omitted, Up.js will replace the `<form>` tag itself, assuming that the
      server has echoed the form with validation errors.
    @param {String} [up-transition]
      The animation to use when the form is replaced after a successful submission.
    @param {String} [up-fail-transition]
      The animation to use when the form is replaced after a failed submission.
    @param {String} [up-history='true']
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
     */
    up.on('submit', 'form[up-target]', function(event, $form) {
      event.preventDefault();
      return submit($form);
    });

    /**
    Observes this form field and runs the given script
    when its value changes. This is useful for observing text fields
    while the user is typing.
    
    For instance, the following would submit the form whenever the
    text field value changes:
    
        <form method="GET" action="/search">
          <input type="query" up-observe="up.form.submit(this)">
        </form>
    
    The script given with `up-observe` runs with the following context:
    
    | Name     | Type      | Description                           |
    | -------- | --------- | ------------------------------------- |
    | `value`  | `String`  | The current value of the field        |
    | `this`   | `Element` | The form field                        |
    | `$field` | `jQuery`  | The form field as a jQuery collection |
    
    See up.observe.
    
    @selector input[up-observe]
      The code to run when the field's value changes.
    @param {String} up-observe
     */
    up.compiler('[up-observe]', function($field) {
      return observe($field);
    });
    return {
      submit: submit,
      observe: observe
    };
  })(jQuery);

  up.submit = up.form.submit;

  up.observe = up.form.observe;

}).call(this);

/**
Pop-up overlays
===============

Instead of [linking to a page fragment](/up.link), you can choose
to show a fragment in a popup overlay.

To open a popup, add an [`up-popup` attribute](/a-up-popup) to a link,
or call the Javascript function [`up.popup.attach`](/up.popup.attach).

For modal dialogs see [up.modal](/up.modal) instead.


\#\#\#\# Customizing the popup design

Loading the Up.js stylesheet will give you a minimal popup design:

- Popup contents are displayed in a white box
- There is a a subtle box shadow around the popup
- The box will grow to fit the popup contents

The easiest way to change how the popup looks is by overriding the [default CSS styles](https://github.com/makandra/upjs/blob/master/lib/assets/stylesheets/up/popup.css.sass).

By default the popup uses the following DOM structure:

    <div class="up-popup">
      ...
    </div>


\#\#\#\# Closing behavior

The popup closes when the user clicks anywhere outside the popup area.

By default the popup also closes
*whenever a page fragment below the popup is updated*.
This is useful to have the popup interact with the page that
opened it, e.g. by updating parts of a larger form or by signing in a user
and revealing additional information.

To disable this behavior, give the opening link an `up-sticky` attribute:

    <a href="/settings" up-popup=".options" up-sticky>Settings</a>

  
@class up.popup
 */

(function() {
  up.popup = (function($) {
    var attach, autoclose, close, config, contains, coveredUrl, createHiddenPopup, currentUrl, discardHistory, ensureInViewport, rememberHistory, reset, setPosition, u, updated;
    u = up.util;

    /**
    Returns the source URL for the fragment displayed
    in the current popup, or `undefined` if no  popup is open.
    
    @function up.popup.url
    @return {String}
      the source URL
     */
    currentUrl = void 0;

    /**
    Returns the URL of the page or modal below the popup.
    
    @function up.popup.coveredUrl
    @return {String}
    @protected
     */
    coveredUrl = function() {
      var $popup;
      $popup = $('.up-popup');
      return $popup.attr('up-covered-url');
    };

    /**
    Sets default options for future popups.
    
    @property up.popup.config
    @param {String} [config.openAnimation='fade-in']
      The animation used to open a popup.
    @param {String} [config.closeAnimation='fade-out']
      The animation used to close a popup.
    @param {String} [config.position='bottom-right']
      Defines where the popup is attached to the opening element.
    
      Valid values are `bottom-right`, `bottom-left`, `top-right` and `top-left`.
     */
    config = u.config({
      openAnimation: 'fade-in',
      closeAnimation: 'fade-out',
      position: 'bottom-right'
    });
    reset = function() {
      close();
      return config.reset();
    };
    setPosition = function($link, $popup, position) {
      var css, linkBox;
      linkBox = u.measure($link, {
        full: true
      });
      css = (function() {
        switch (position) {
          case "bottom-right":
            return {
              right: linkBox.right,
              top: linkBox.top + linkBox.height
            };
          case "bottom-left":
            return {
              left: linkBox.left,
              top: linkBox.bottom + linkBox.height
            };
          case "top-right":
            return {
              right: linkBox.right,
              bottom: linkBox.top
            };
          case "top-left":
            return {
              left: linkBox.left,
              bottom: linkBox.top
            };
          default:
            return u.error("Unknown position %o", position);
        }
      })();
      $popup.attr('up-position', position);
      $popup.css(css);
      return ensureInViewport($popup);
    };
    ensureInViewport = function($popup) {
      var bottom, box, errorX, errorY, left, right, top;
      box = u.measure($popup, {
        full: true
      });
      errorX = null;
      errorY = null;
      if (box.right < 0) {
        errorX = -box.right;
      }
      if (box.bottom < 0) {
        errorY = -box.bottom;
      }
      if (box.left < 0) {
        errorX = box.left;
      }
      if (box.top < 0) {
        errorY = box.top;
      }
      if (errorX) {
        if (left = parseInt($popup.css('left'))) {
          $popup.css('left', left - errorX);
        } else if (right = parseInt($popup.css('right'))) {
          $popup.css('right', right + errorX);
        }
      }
      if (errorY) {
        if (top = parseInt($popup.css('top'))) {
          return $popup.css('top', top - errorY);
        } else if (bottom = parseInt($popup.css('bottom'))) {
          return $popup.css('bottom', bottom + errorY);
        }
      }
    };
    rememberHistory = function() {
      var $popup;
      $popup = $('.up-popup');
      $popup.attr('up-covered-url', up.browser.url());
      return $popup.attr('up-covered-title', document.title);
    };
    discardHistory = function() {
      var $popup;
      $popup = $('.up-popup');
      $popup.removeAttr('up-covered-url');
      return $popup.removeAttr('up-covered-title');
    };
    createHiddenPopup = function($link, selector, sticky) {
      var $placeholder, $popup;
      $popup = u.$createElementFromSelector('.up-popup');
      if (sticky) {
        $popup.attr('up-sticky', '');
      }
      $placeholder = u.$createElementFromSelector(selector);
      $placeholder.appendTo($popup);
      $popup.appendTo(document.body);
      rememberHistory();
      $popup.hide();
      return $popup;
    };
    updated = function($link, $popup, position, animation, animateOptions) {
      $popup.show();
      setPosition($link, $popup, position);
      return up.animate($popup, animation, animateOptions);
    };

    /**
    Attaches a popup overlay to the given element or selector.
    
    @function up.popup.attach
    @param {Element|jQuery|String} elementOrSelector
    @param {String} [options.url]
    @param {String} [options.position='bottom-right']
    @param {String} [options.animation]
      The animation to use when opening the popup.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate`](/up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate`](/up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate`](/up.animate).
    @param {Boolean} [options.sticky=false]
      If set to `true`, the popup remains
      open even if the page changes in the background.
    @param {Object} [options.history=false]
     */
    attach = function(linkOrSelector, options) {
      var $link, $popup, animateOptions, animation, history, position, selector, sticky, url;
      $link = $(linkOrSelector);
      options = u.options(options);
      url = u.option(options.url, $link.attr('href'));
      selector = u.option(options.target, $link.attr('up-popup'), 'body');
      position = u.option(options.position, $link.attr('up-position'), config.position);
      animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation);
      sticky = u.option(options.sticky, u.castedAttr($link, 'up-sticky'));
      history = up.browser.canPushState() ? u.option(options.history, u.castedAttr($link, 'up-history'), false) : false;
      animateOptions = up.motion.animateOptions(options, $link);
      close();
      $popup = createHiddenPopup($link, selector, sticky);
      return up.replace(selector, url, {
        history: history,
        insert: function() {
          return updated($link, $popup, position, animation, animateOptions);
        }
      });
    };

    /**
    Closes a currently opened popup overlay.
    Does nothing if no popup is currently open.
    
    @function up.popup.close
    @param {Object} options
      See options for [`up.animate`](/up.animate).
     */
    close = function(options) {
      var $popup;
      $popup = $('.up-popup');
      if ($popup.length) {
        options = u.options(options, {
          animation: config.closeAnimation,
          url: $popup.attr('up-covered-url'),
          title: $popup.attr('up-covered-title')
        });
        currentUrl = void 0;
        return up.destroy($popup, options);
      } else {
        return u.resolvedPromise();
      }
    };
    autoclose = function() {
      if (!$('.up-popup').is('[up-sticky]')) {
        discardHistory();
        return close();
      }
    };

    /**
    Returns whether the given element or selector is contained
    within the current popup.
    
    @methods up.popup.contains
    @param {String} elementOrSelector
    @protected
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
    if a page fragment below the popup overlay updates:
    
        <a href="/decks" up-popup=".deck_list">Switch deck</a>
        <a href="/settings" up-popup=".options" up-sticky>Settings</a>
    
    @selector a[up-popup]
    @param [up-sticky]
    @param [up-position]
     */
    up.on('click', 'a[up-popup]', function(event, $link) {
      event.preventDefault();
      if ($link.is('.up-current')) {
        return close();
      } else {
        return attach($link);
      }
    });
    up.on('click', 'body', function(event, $body) {
      var $target;
      $target = $(event.target);
      if (!($target.closest('.up-popup').length || $target.closest('[up-popup]').length)) {
        return close();
      }
    });
    up.on('up:fragment:inserted', function(event, $fragment) {
      var newSource;
      if (contains($fragment)) {
        if (newSource = $fragment.attr('up-source')) {
          return currentUrl = newSource;
        }
      } else {
        return autoclose();
      }
    });
    up.bus.onEscape(function() {
      return close();
    });

    /**
    When an element with this attribute is clicked,
    a currently open popup is closed. 
    
    @selector [up-close]
     */
    up.on('click', '[up-close]', function(event, $element) {
      if ($element.closest('.up-popup').length) {
        close();
        return event.preventDefault();
      }
    });
    up.on('up:framework:reset', reset);
    return {
      attach: attach,
      close: close,
      url: function() {
        return currentUrl;
      },
      coveredUrl: coveredUrl,
      config: config,
      defaults: function() {
        return u.error('up.popup.defaults(...) no longer exists. Set values on he up.popup.config property instead.');
      },
      contains: contains,
      open: function() {
        return up.error('up.popup.open no longer exists. Please use up.popup.attach instead.');
      },
      source: function() {
        return up.error('up.popup.source no longer exists. Please use up.popup.url instead.');
      }
    };
  })(jQuery);

}).call(this);

/**
Modal dialogs
=============

Instead of [linking to a page fragment](/up.link), you can choose
to show a fragment in a modal dialog.

To open a modal, add an [`up-modal` attribute](/a-up-modal) to a link,
or call the Javascript functions [`up.modal.follow`](/up.modal.follow)
and [`up.modal.visit`](/up.modal.visit).
  
For smaller popup overlays ("dropdowns") see [up.popup](/up.popup) instead.


\#\#\#\# Customizing the dialog design

Loading the Up.js stylesheet will give you a minimal dialog design:

- Dialog contents are displayed in a white box that is centered vertically and horizontally.
- There is a a subtle box shadow around the dialog
- The box will grow to fit the dialog contents, but never grow larger than the screen
- The box is placed over a semi-transparent background to dim the rest of the page
- There is a button to close the dialog in the top-right corner

The easiest way to change how the dialog looks is by overriding the [default CSS styles](https://github.com/makandra/upjs/blob/master/lib/assets/stylesheets/up/modal.css.sass).

By default the dialog uses the following DOM structure:

    <div class="up-modal">
      <div class="up-modal-dialog">
        <div class="up-modal-close" up-close>X</div>
        <div class="up-modal-content">
          ...
        </div>
      </div>
    </div>

If you want to change the design beyond CSS, you can
configure Up.js to [use a different HTML structure](/up.modal.config).


\#\#\#\# Closing behavior

By default the dialog automatically closes
*whenever a page fragment below the dialog is updated*.
This is useful to have the dialog interact with the page that
opened it, e.g. by updating parts of a larger form or by signing in a user
and revealing additional information.

To disable this behavior, give the opening link an `up-sticky` attribute:

    <a href="/settings" up-modal=".options" up-sticky>Settings</a>


@class up.modal
 */

(function() {
  up.modal = (function($) {
    var autoclose, close, config, contains, coveredUrl, createHiddenModal, currentUrl, discardHistory, follow, open, rememberHistory, reset, shiftElements, templateHtml, u, unshiftElements, updated, visit;
    u = up.util;

    /**
    Sets default options for future modals.
    
    @property up.modal.config
    @param {Number} [config.width]
      The width of the dialog as a CSS value like `'400px'` or `50%`.
    
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
    @param {String} [config.closeLabel='X']
      The label of the button that closes the dialog.
    @param {String} [config.openAnimation='fade-in']
      The animation used to open the modal. The animation will be applied
      to both the dialog box and the overlay dimming the page.
    @param {String} [config.closeAnimation='fade-out']
      The animation used to close the modal. The animation will be applied
      to both the dialog box and the overlay dimming the page.
     */
    config = u.config({
      maxWidth: null,
      minWidth: null,
      width: null,
      height: null,
      openAnimation: 'fade-in',
      closeAnimation: 'fade-out',
      closeLabel: '×',
      template: function(config) {
        return "<div class=\"up-modal\">\n  <div class=\"up-modal-dialog\">\n    <div class=\"up-modal-close\" up-close>" + config.closeLabel + "</div>\n    <div class=\"up-modal-content\"></div>\n  </div>\n</div>";
      }
    });

    /**
    Returns the source URL for the fragment displayed in the current modal overlay,
    or `undefined` if no modal is currently open.
    
    @function up.modal.url
    @return {String}
      the source URL
     */
    currentUrl = void 0;

    /**
    Returns the URL of the page below the modal overlay.
    
    @function up.modal.coveredUrl
    @return {String}
    @protected
     */
    coveredUrl = function() {
      var $modal;
      $modal = $('.up-modal');
      return $modal.attr('up-covered-url');
    };
    reset = function() {
      close();
      currentUrl = void 0;
      return config.reset();
    };
    templateHtml = function() {
      var template;
      template = config.template;
      if (u.isFunction(template)) {
        return template(config);
      } else {
        return template;
      }
    };
    rememberHistory = function() {
      var $modal;
      $modal = $('.up-modal');
      $modal.attr('up-covered-url', up.browser.url());
      return $modal.attr('up-covered-title', document.title);
    };
    discardHistory = function() {
      var $modal;
      $modal = $('.up-modal');
      $modal.removeAttr('up-covered-url');
      return $modal.removeAttr('up-covered-title');
    };
    createHiddenModal = function(options) {
      var $content, $dialog, $modal, $placeholder;
      $modal = $(templateHtml());
      if (options.sticky) {
        $modal.attr('up-sticky', '');
      }
      $modal.attr('up-covered-url', up.browser.url());
      $modal.attr('up-covered-title', document.title);
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
      $content = $modal.find('.up-modal-content');
      $placeholder = u.$createElementFromSelector(options.selector);
      $placeholder.appendTo($content);
      $modal.appendTo(document.body);
      rememberHistory();
      $modal.hide();
      return $modal;
    };
    unshiftElements = [];
    shiftElements = function() {
      var bodyRightPadding, bodyRightShift, scrollbarWidth, unshiftBody;
      scrollbarWidth = u.scrollbarWidth();
      bodyRightPadding = parseInt($('body').css('padding-right'));
      bodyRightShift = scrollbarWidth + bodyRightPadding;
      unshiftBody = u.temporaryCss($('body'), {
        'padding-right': bodyRightShift + "px",
        'overflow-y': 'hidden'
      });
      unshiftElements.push(unshiftBody);
      return up.layout.anchoredRight().each(function() {
        var $element, elementRight, elementRightShift, unshiftElement;
        $element = $(this);
        elementRight = parseInt($element.css('right'));
        elementRightShift = scrollbarWidth + elementRight;
        unshiftElement = u.temporaryCss($element, {
          'right': elementRightShift
        });
        return unshiftElements.push(unshiftElement);
      });
    };
    updated = function($modal, animation, animateOptions) {
      var deferred;
      shiftElements();
      $modal.show();
      deferred = up.animate($modal, animation, animateOptions);
      return deferred.then(function() {
        return up.emit('up:modal:opened');
      });
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
      open even if the page changes in the background.
    @param {Object} [options.history=true]
      Whether to add a browser history entry for the modal's source URL.
    @param {String} [options.animation]
      The animation to use when opening the modal.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate`](/up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate`](/up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate`](/up.animate).
    @return {Promise}
      A promise that will be resolved when the modal has finished loading.
     */
    follow = function(linkOrSelector, options) {
      options = u.options(options);
      options.$link = $(linkOrSelector);
      return open(options);
    };

    /**
    Opens a modal for the given URL.
    
    Example:
    
        up.modal.visit('/foo', { target: '.list' })
    
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
      See options for [previous `up.modal.open` variant](/up.modal.open).
     */
    visit = function(url, options) {
      options = u.options(options);
      options.url = url;
      return open(options);
    };

    /**
    @function up.modal.open
    @private
     */
    open = function(options) {
      var $link, $modal, animateOptions, animation, height, history, maxWidth, selector, sticky, url, width;
      options = u.options(options);
      $link = u.option(options.$link, u.nullJquery());
      url = u.option(options.url, $link.attr('up-href'), $link.attr('href'));
      selector = u.option(options.target, $link.attr('up-modal'), 'body');
      width = u.option(options.width, $link.attr('up-width'), config.width);
      maxWidth = u.option(options.maxWidth, $link.attr('up-max-width'), config.maxWidth);
      height = u.option(options.height, $link.attr('up-height'), config.height);
      animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation);
      sticky = u.option(options.sticky, u.castedAttr($link, 'up-sticky'));
      history = up.browser.canPushState() ? u.option(options.history, u.castedAttr($link, 'up-history'), true) : false;
      animateOptions = up.motion.animateOptions(options, $link);
      close();
      if (up.bus.nobodyPrevents('up:modal:open', {
        url: url
      })) {
        $modal = createHiddenModal({
          selector: selector,
          width: width,
          maxWidth: maxWidth,
          height: height,
          sticky: sticky
        });
        return up.replace(selector, url, {
          history: history,
          insert: function() {
            return updated($modal, animation, animateOptions);
          }
        });
      } else {
        return $.Deferred();
      }
    };

    /**
    This event is [emitted](/up.emit) when a modal dialog is starting to open.
    
    @event up:modal:open
    @param event.preventDefault()
      Event listeners may call this method to prevent the modal from opening.
     */

    /**
    This event is [emitted](/up.emit) when a modal dialog has finished opening.
    
    @event up:modal:opened
     */

    /**
    Closes a currently opened modal overlay.
    Does nothing if no modal is currently open.
    
    Emits events [`up:modal:close`](/up:modal:close) and [`up:modal:closed`](/up:modal:closed).
    
    @function up.modal.close
    @param {Object} options
      See options for [`up.animate`](/up.animate)
     */
    close = function(options) {
      var $modal, deferred;
      $modal = $('.up-modal');
      if ($modal.length) {
        if (up.bus.nobodyPrevents('up:modal:close', {
          $element: $modal
        })) {
          options = u.options(options, {
            animation: config.closeAnimation,
            url: $modal.attr('up-covered-url'),
            title: $modal.attr('up-covered-title')
          });
          currentUrl = void 0;
          deferred = up.destroy($modal, options);
          deferred.then(function() {
            var unshifter;
            while (unshifter = unshiftElements.pop()) {
              unshifter();
            }
            return up.emit('up:modal:closed');
          });
          return deferred;
        } else {
          return $.Deferred();
        }
      } else {
        return u.resolvedDeferred();
      }
    };

    /**
    This event is [emitted](/up.emit) when a modal dialog
    is starting to [close](/up.modal.close).
    
    @event up:modal:close
    @param event.preventDefault()
      Event listeners may call this method to prevent the modal from closing.
     */

    /**
    This event is [emitted](/up.emit) when a modal dialog
    is done [closing](/up.modal.close).
    
    @event up:modal:closed
     */
    autoclose = function() {
      if (!$('.up-modal').is('[up-sticky]')) {
        discardHistory();
        return close();
      }
    };

    /**
    Returns whether the given element or selector is contained
    within the current modal.
    
    @function up.modal.contains
    @param {String} elementOrSelector
    @protected
     */
    contains = function(elementOrSelector) {
      var $element;
      $element = $(elementOrSelector);
      return $element.closest('.up-modal').length > 0;
    };

    /**
    Clicking this link will load the destination via AJAX and open
    the given selector in a modal dialog.
    
    Example:
    
        <a href="/blogs" up-modal=".blog-list">Switch blog</a>
    
    Clicking would request the path `/blog` and select `.blog-list` from
    the HTML response. Up.js will dim the page with an overlay
    and place the matching `.blog-list` tag will be placed in
    a modal dialog.
    
    @selector a[up-modal]
    @param [up-sticky]
    @param [up-animation]
    @param [up-height]
    @param [up-width]
    @param [up-history]
     */
    up.on('click', 'a[up-modal]', function(event, $link) {
      event.preventDefault();
      if ($link.is('.up-current')) {
        return close();
      } else {
        return follow($link);
      }
    });
    up.on('click', 'body', function(event, $body) {
      var $target;
      $target = $(event.target);
      if (!($target.closest('.up-modal-dialog').length || $target.closest('[up-modal]').length)) {
        return close();
      }
    });
    up.on('up:fragment:inserted', function(event, $fragment) {
      var newSource;
      if (contains($fragment)) {
        if (newSource = $fragment.attr('up-source')) {
          return currentUrl = newSource;
        }
      } else if (!up.popup.contains($fragment)) {
        return autoclose();
      }
    });
    up.bus.onEscape(function() {
      return close();
    });

    /**
    When this element is clicked, closes a currently open dialog.
    Does nothing if no modal is currently open.
    
    @selector [up-close]
     */
    up.on('click', '[up-close]', function(event, $element) {
      if ($element.closest('.up-modal').length) {
        close();
        return event.preventDefault();
      }
    });
    up.on('up:framework:reset', reset);
    return {
      visit: visit,
      follow: follow,
      open: function() {
        return up.error('up.modal.open no longer exists. Please use either up.modal.follow or up.modal.visit.');
      },
      close: close,
      url: function() {
        return currentUrl;
      },
      coveredUrl: coveredUrl,
      config: config,
      defaults: function() {
        return u.error('up.modal.defaults(...) no longer exists. Set values on he up.modal.config property instead.');
      },
      contains: contains,
      source: function() {
        return up.error('up.popup.source no longer exists. Please use up.popup.url instead.');
      }
    };
  })(jQuery);

}).call(this);

/**
Tooltips
========

Up.js comes with a basic tooltip implementation.

You can an [`up-tooltip`](/up-tooltip) attribute to any HTML tag to show a tooltip whenever
  the user hovers over the element:

      <a href="/decks" up-tooltip="Show all decks">Decks</a>


\#\#\#\# Styling

The [default styles](https://github.com/makandra/upjs/blob/master/lib/assets/stylesheets/up/tooltip.css.sass)
show a simple tooltip with white text on a gray background.
A gray triangle points to the element.

To change the styling, simply override CSS rules for the `.up-tooltip` selector and its `:after`
selector that is used the triangle.

The HTML of a tooltip element is simply this:

    <div class="up-tooltip">
      Show all decks
    </div>

The tooltip element is appended to the end of `<body>`.

@class up.tooltip
 */

(function() {
  up.tooltip = (function($) {
    var attach, close, config, createElement, reset, setPosition, u;
    u = up.util;

    /**
    Sets default options for future tooltips.
    
    @property up.tooltip.config
    @param {String} [config.position]
      The default position of tooltips relative to the element.
      Can be either `"top"` or `"bottom"`.
    @param {String} [config.openAnimation='fade-in']
      The animation used to open a tooltip.
    @param {String} [config.closeAnimation='fade-out']
      The animation used to close a tooltip.
     */
    config = u.config({
      position: 'top',
      openAnimation: 'fade-in',
      closeAnimation: 'fade-out'
    });
    reset = function() {
      return config.reset();
    };
    setPosition = function($link, $tooltip, position) {
      var css, linkBox, tooltipBox;
      linkBox = u.measure($link);
      tooltipBox = u.measure($tooltip);
      css = (function() {
        switch (position) {
          case "top":
            return {
              left: linkBox.left + 0.5 * (linkBox.width - tooltipBox.width),
              top: linkBox.top - tooltipBox.height
            };
          case "bottom":
            return {
              left: linkBox.left + 0.5 * (linkBox.width - tooltipBox.width),
              top: linkBox.top + linkBox.height
            };
          default:
            return u.error("Unknown position %o", position);
        }
      })();
      $tooltip.attr('up-position', position);
      return $tooltip.css(css);
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
      return $element;
    };

    /**
    Opens a tooltip over the given element.
    
        up.tooltip.attach('.help', {
          html: 'Enter multiple words or phrases'
        });
    
    @function up.tooltip.attach
    @param {Element|jQuery|String} elementOrSelector
    @param {String} [options.html]
      The HTML to display in the tooltip.
    @param {String} [options.position='top']
      The position of the tooltip. Known values are `top` and `bottom`.
    @param {String} [options.animation]
      The animation to use when opening the tooltip.
     */
    attach = function(linkOrSelector, options) {
      var $link, $tooltip, animateOptions, animation, html, position, text;
      if (options == null) {
        options = {};
      }
      $link = $(linkOrSelector);
      html = u.option(options.html, $link.attr('up-tooltip-html'));
      text = u.option(options.text, $link.attr('up-tooltip'));
      position = u.option(options.position, $link.attr('up-position'), config.position);
      animation = u.option(options.animation, u.castedAttr($link, 'up-animation'), config.openAnimation);
      animateOptions = up.motion.animateOptions(options, $link);
      close();
      $tooltip = createElement({
        text: text,
        html: html
      });
      setPosition($link, $tooltip, position);
      return up.animate($tooltip, animation, animateOptions);
    };

    /**
    Closes a currently shown tooltip.
    Does nothing if no tooltip is currently shown.
    
    @function up.tooltip.close
    @param {Object} options
      See options for [`up.animate`](/up.animate).
     */
    close = function(options) {
      var $tooltip;
      $tooltip = $('.up-tooltip');
      if ($tooltip.length) {
        options = u.options(options, {
          animation: config.closeAnimation
        });
        options = u.merge(options, up.motion.animateOptions(options));
        return up.destroy($tooltip, options);
      }
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
     */

    /**
    Displays a tooltip with HTML content when hovering the mouse over this element:
    
        <a href="/decks" up-tooltip="Show &lt;b&gt;all&lt;/b&gt; decks">Decks</a>
    
    @selector [up-tooltip-html]
     */
    up.compiler('[up-tooltip], [up-tooltip-html]', function($link) {
      $link.on('mouseover', function() {
        return attach($link);
      });
      return $link.on('mouseout', function() {
        return close();
      });
    });
    up.on('click', 'body', function(event, $body) {
      return close();
    });
    up.on('up:framework:reset', close);
    up.bus.onEscape(function() {
      return close();
    });
    up.on('up:framework:reset', reset);
    return {
      attach: attach,
      close: close,
      open: function() {
        return u.error('up.tooltip.open no longer exists. Use up.tooltip.attach instead.');
      }
    };
  })(jQuery);

}).call(this);

/**
Fast interaction feedback
=========================
  
This module marks up link elements with classes indicating that
they are currently loading (class `up-active`) or linking
to the current location (class `up-current`).

This dramatically improves the perceived speed of your user interface
by providing instant feedback for user interactions.

@class up.navigation
 */

(function() {
  up.navigation = (function($) {
    var CLASS_ACTIVE, SELECTORS_SECTION, SELECTOR_ACTIVE, SELECTOR_SECTION, SELECTOR_SECTION_INSTANT, config, currentClass, enlargeClickArea, locationChanged, normalizeUrl, reset, sectionClicked, sectionUrls, selector, u, unmarkActive, urlSet;
    u = up.util;

    /**
    Sets default options for this module.
    
    @property up.navigation.config
    @param {Number} [config.currentClasses]
      An array of classes to set on [links that point the current location](/up-current).
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
    SELECTORS_SECTION = ['a', '[up-href]', '[up-alias]'];
    SELECTOR_SECTION = SELECTORS_SECTION.join(', ');
    SELECTOR_SECTION_INSTANT = ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = SELECTORS_SECTION.length; i < len; i++) {
        selector = SELECTORS_SECTION[i];
        results.push(selector + "[up-instant]");
      }
      return results;
    })()).join(', ');
    SELECTOR_ACTIVE = "." + CLASS_ACTIVE;
    normalizeUrl = function(url) {
      if (u.isPresent(url)) {
        return u.normalizeUrl(url, {
          search: false,
          stripTrailingSlash: true
        });
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
    Links that are currently loading are assigned the `up-active`
    class automatically. Style `.up-active` in your CSS to improve the
    perceived responsiveness of your user interface.
    
    The `up-active` class will be removed as soon as another
    page fragment is added or updated through Up.js.
    
    \#\#\#\# Example
    
    We have a link:
    
        <a href="/foo" up-follow>Foo</a>
    
    The user clicks on the link. While the request is loading,
    the link has the `up-active` class:
    
        <a href="/foo" up-follow up-active>Foo</a>
    
    Once the fragment is loaded the browser's location bar is updated
    to `http://yourhost/foo` via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history#Adding_and_modifying_history_entries):
    
        <a href="/foo" up-follow up-current>Foo</a>
    
    @selector [up-active]
     */
    sectionClicked = function($section) {
      unmarkActive();
      $section = enlargeClickArea($section);
      return $section.addClass(CLASS_ACTIVE);
    };
    enlargeClickArea = function($section) {
      return u.presence($section.parents(SELECTOR_SECTION)) || $section;
    };
    unmarkActive = function() {
      return $(SELECTOR_ACTIVE).removeClass(CLASS_ACTIVE);
    };
    up.on('click', SELECTOR_SECTION, function(event, $section) {
      if (u.isUnmodifiedMouseEvent(event) && !$section.is('[up-instant]')) {
        return sectionClicked($section);
      }
    });
    up.on('mousedown', SELECTOR_SECTION_INSTANT, function(event, $section) {
      if (u.isUnmodifiedMouseEvent(event)) {
        return sectionClicked($section);
      }
    });

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
          <a href="/foo" up-current>Foo</a>
          <a href="/bar">Bar</a>
        </nav>
    
    \#\#\#\# What's considered to be "current"?
    
    The current location is considered to be either:
    
    - the URL displayed in the browser window's location bar
    - the source URL of a currently opened [modal dialog](/up.modal)
    - the source URL of a currently opened [popup overlay](/up.popup)
    
    A link matches the current location (and is marked as `.up-current`) if it matches either:
    
    - the link's `href` attribute
    - the link's [`up-href`](#turn-any-element-into-a-link) attribute
    - a space-separated list of URLs in the link's `up-alias` attribute
    
    \#\#\#\# Matching URL by prefix
    
    You can mark a link as `.up-current` whenever the current URL matches a prefix.
    To do so, end the `up-alias` attribute in an asterisk (`*`).
    
    For instance, the following link is highlighted for both `/reports` and `/reports/123`:
    
        <a href="/reports" up-alias="/reports/*">Reports</a>
    
    @selector [up-current]
     */
    up.on('up:fragment:inserted', function() {
      unmarkActive();
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
      defaults: function() {
        return u.error('up.navigation.defaults(...) no longer exists. Set values on he up.navigation.config property instead.');
      }
    };
  })(jQuery);

}).call(this);
(function() {
  up.boot();

}).call(this);
