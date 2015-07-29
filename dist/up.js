
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
  var __slice = [].slice;

  up.util = (function() {
    var $createElementFromSelector, ANIMATION_PROMISE_KEY, CONSOLE_PLACEHOLDERS, ajax, castsToFalse, castsToTrue, clientSize, contains, copy, copyAttributes, createElement, createElementFromHtml, createSelectorFromElement, cssAnimate, debug, detect, each, error, escapePressed, extend, findWithSelf, finishCssAnimate, forceCompositing, get, ifGiven, isArray, isBlank, isDeferred, isDefined, isElement, isFunction, isGiven, isHash, isJQuery, isMissing, isNull, isObject, isPresent, isPromise, isStandardPort, isString, isUndefined, isUnmodifiedKeyEvent, isUnmodifiedMouseEvent, keys, last, locationFromXhr, measure, merge, methodFromXhr, nextFrame, normalizeMethod, normalizeUrl, nullJquery, only, option, options, prependGhost, presence, presentAttr, resolvableWhen, resolvedDeferred, resolvedPromise, select, setMissingAttrs, stringSet, stringifyConsoleArgs, temporaryCss, toArray, trim, unwrap;
    get = function(url, options) {
      options = options || {};
      options.url = url;
      return ajax(options);
    };
    ajax = function(options) {
      if (options.selector) {
        options.headers = {
          "X-Up-Selector": options.selector
        };
      }
      return $.ajax(options);
    };

    /**
    @method up.util.isStandardPort
    @private
     */
    isStandardPort = function(protocol, port) {
      return ((port === "" || port === "80") && protocol === 'http:') || (port === "443" && protocol === 'https:');
    };

    /**
    Normalizes URLs, relative paths and absolute paths to a full URL
    that can be checked for equality with other normalized URL.
    
    By default hashes are ignored, search queries are included.
    
    @method up.util.normalizeUrl
    @param {Boolean} [options.hash=false]
    @param {Boolean} [options.search=true]
    @protected
     */
    normalizeUrl = function(urlOrAnchor, options) {
      var anchor, normalized, pathname;
      anchor = null;
      if (isString(urlOrAnchor)) {
        anchor = $('<a>').attr({
          href: urlOrAnchor
        }).get(0);
        if (isBlank(anchor.hostname)) {
          anchor.href = anchor.href;
        }
      } else {
        anchor = unwrap(urlOrAnchor);
      }
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
    @method up.util.normalizeMethod
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
      var $element, $parent, $root, classes, conjunction, depthSelector, expression, html, id, iteration, path, tag, _i, _j, _len, _len1;
      path = selector.split(/[ >]/);
      $root = null;
      for (iteration = _i = 0, _len = path.length; _i < _len; iteration = ++_i) {
        depthSelector = path[iteration];
        conjunction = depthSelector.match(/(^|\.|\#)[A-Za-z0-9\-_]+/g);
        tag = "div";
        classes = [];
        id = null;
        for (_j = 0, _len1 = conjunction.length; _j < _len1; _j++) {
          expression = conjunction[_j];
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
    debug = function() {
      var args, group, message, placeHolderCount, value, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      args = toArray(args);
      message = args.shift();
      message = "[UP] " + message;
      placeHolderCount = ((_ref = message.match(CONSOLE_PLACEHOLDERS)) != null ? _ref.length : void 0) || 0;
      if (isFunction(last(args)) && placeHolderCount < args.length) {
        group = args.pop();
      }
      value = console.debug.apply(console, [message].concat(__slice.call(args)));
      if (group) {
        console.groupCollapsed();
        try {
          value = group();
        } finally {
          console.groupEnd();
        }
      }
      return value;
    };
    error = function() {
      var $error, args, asString;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      args[0] = "[UP] " + args[0];
      console.error.apply(console, args);
      asString = stringifyConsoleArgs(args);
      $error = presence($('.up-error')) || $('<div class="up-error"></div>').prependTo('body');
      $error.addClass('up-error');
      $error.text(asString);
      throw asString;
    };
    CONSOLE_PLACEHOLDERS = /\%[odisf]/g;
    stringifyConsoleArgs = function(args) {
      var i, maxLength, message;
      message = args[0];
      i = 0;
      maxLength = 30;
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
          return "\"" + arg + "\"";
        } else if (argType === 'number') {
          return arg.toString();
        } else {
          return "(" + argType + ")";
        }
      });
    };
    createSelectorFromElement = function($element) {
      var classString, classes, id, klass, selector, _i, _len;
      debug("Creating selector from element %o", $element);
      classes = (classString = $element.attr("class")) ? classString.split(" ") : [];
      id = $element.attr("id");
      selector = $element.prop("tagName").toLowerCase();
      if (id) {
        selector += "#" + id;
      }
      for (_i = 0, _len = classes.length; _i < _len; _i++) {
        klass = classes[_i];
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
    keys = Object.keys || function(object) {
      var key, result, _i, _len;
      result = [];
      for (_i = 0, _len = object.length; _i < _len; _i++) {
        key = object[_i];
        if (object.hasOwnProperty(key)) {
          result.push(key);
        }
      }
      return result;
    };
    each = function(collection, block) {
      var index, item, _i, _len, _results;
      _results = [];
      for (index = _i = 0, _len = collection.length; _i < _len; index = ++_i) {
        item = collection[index];
        _results.push(block(item, index));
      }
      return _results;
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
      return isMissing(object) || (isObject(object) && keys(object).length === 0) || (object.length === 0);
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
    unwrap = function(object) {
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
    
    @method up.util.option
    @param {Array} args...
     */
    option = function() {
      var arg, args, match, value, _i, _len;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      match = null;
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        arg = args[_i];
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
      var element, match, _i, _len;
      match = null;
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        element = array[_i];
        if (tester(element)) {
          match = element;
          break;
        }
      }
      return match;
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
      $element = arguments[0], attrNames = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      values = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = attrNames.length; _i < _len; _i++) {
          attrName = attrNames[_i];
          _results.push($element.attr(attrName));
        }
        return _results;
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
    temporaryCss = function($element, css, block) {
      var memo, oldCss;
      oldCss = $element.css(keys(css));
      $element.css(css);
      memo = function() {
        return $element.css(oldCss);
      };
      if (block) {
        block();
        return memo();
      } else {
        return memo;
      }
    };
    forceCompositing = function($element) {
      var memo, oldTransforms;
      oldTransforms = $element.css(['transform', '-webkit-transform']);
      if (isBlank(oldTransforms)) {
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
    
    @method up.util.cssAnimate
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
          'transition-property': keys(lastFrame).join(', '),
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
        return resolvedPromise();
      }
    };
    ANIMATION_PROMISE_KEY = 'up-animation-promise';

    /**
    Completes the animation for  the given element by jumping
    to the last frame instantly. All callbacks chained to
    the original animation's promise will be called.
    
    Does nothing if the given element is not currently animating.
    
    Also see [`up.motion.finish`](/up.motion#up.motion.finish).
    
    @method up.util.finishCssAnimate
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
    measure = function($element, options) {
      var box, coordinates, viewport;
      coordinates = (options != null ? options.relative : void 0) ? $element.position() : $element.offset();
      box = {
        left: coordinates.left,
        top: coordinates.top
      };
      if (options != null ? options.inner : void 0) {
        box.width = $element.width();
        box.height = $element.height();
      } else {
        box.width = $element.outerWidth();
        box.height = $element.outerHeight();
      }
      if (options != null ? options.full : void 0) {
        viewport = clientSize();
        box.right = viewport.width - (box.left + box.width);
        box.bottom = viewport.height - (box.top + box.height);
      }
      return box;
    };
    copyAttributes = function($source, $target) {
      var attr, _i, _len, _ref, _results;
      _ref = $source.get(0).attributes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        if (attr.specified) {
          _results.push($target.attr(attr.name, attr.value));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    prependGhost = function($element) {
      var $ghost, dimensions;
      dimensions = measure($element, {
        relative: true,
        inner: true
      });
      $ghost = $element.clone();
      $ghost.find('script').remove();
      $ghost.css({
        right: '',
        bottom: '',
        position: 'absolute'
      });
      $ghost.css(dimensions);
      $ghost.addClass('up-ghost');
      return $ghost.insertBefore($element);
    };
    findWithSelf = function($element, selector) {
      return $element.find(selector).addBack(selector);
    };
    escapePressed = function(event) {
      return event.keyCode === 27;
    };
    contains = function(array, element) {
      return array.indexOf(element) >= 0;
    };
    castsToTrue = function(object) {
      return String(object) === "true";
    };
    castsToFalse = function(object) {
      return String(object) === "false";
    };
    locationFromXhr = function(xhr) {
      return xhr.getResponseHeader('X-Up-Location');
    };
    methodFromXhr = function(xhr) {
      return xhr.getResponseHeader('X-Up-Method');
    };
    only = function() {
      var filtered, key, keys, object, _i, _len;
      object = arguments[0], keys = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      filtered = {};
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
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
      return event.button === 0 && isUnmodifiedKeyEvent(event);
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
      deferreds = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      joined = $.when.apply($, deferreds);
      joined.resolve = function() {
        return each(deferreds, function(deferred) {
          return typeof deferred.resolve === "function" ? deferred.resolve() : void 0;
        });
      };
      return joined;
    };
    setMissingAttrs = function($element, attrs) {
      var key, value, _results;
      _results = [];
      for (key in attrs) {
        value = attrs[key];
        if (isMissing($element.attr(key))) {
          _results.push($element.attr(key, value));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    stringSet = function(array) {
      var includes, includesAny, key, put, set, string, _i, _len;
      set = {};
      includes = function(string) {
        return set[key(string)];
      };
      includesAny = function(strings) {
        return detect(strings, includes);
      };
      put = function(string) {
        return set[key(string)] = true;
      };
      key = function(string) {
        return "_" + string;
      };
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        string = array[_i];
        put(string);
      }
      return {
        put: put,
        includes: includes,
        includesAny: includesAny
      };
    };
    return {
      presentAttr: presentAttr,
      createElement: createElement,
      normalizeUrl: normalizeUrl,
      normalizeMethod: normalizeMethod,
      createElementFromHtml: createElementFromHtml,
      $createElementFromSelector: $createElementFromSelector,
      createSelectorFromElement: createSelectorFromElement,
      get: get,
      ajax: ajax,
      extend: extend,
      copy: copy,
      merge: merge,
      options: options,
      option: option,
      error: error,
      debug: debug,
      each: each,
      detect: detect,
      select: select,
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
      unwrap: unwrap,
      nextFrame: nextFrame,
      measure: measure,
      temporaryCss: temporaryCss,
      cssAnimate: cssAnimate,
      finishCssAnimate: finishCssAnimate,
      forceCompositing: forceCompositing,
      prependGhost: prependGhost,
      escapePressed: escapePressed,
      copyAttributes: copyAttributes,
      findWithSelf: findWithSelf,
      contains: contains,
      isArray: isArray,
      toArray: toArray,
      castsToTrue: castsToTrue,
      castsToFalse: castsToFalse,
      locationFromXhr: locationFromXhr,
      methodFromXhr: methodFromXhr,
      clientSize: clientSize,
      only: only,
      trim: trim,
      keys: keys,
      resolvedPromise: resolvedPromise,
      resolvedDeferred: resolvedDeferred,
      resolvableWhen: resolvableWhen,
      setMissingAttrs: setMissingAttrs,
      stringSet: stringSet
    };
  })();

}).call(this);

/**
Browser interface
=================

Some browser-interfacing methods and switches that we can't currently get rid off.

@protected
@class up.browser
 */

(function() {
  var __slice = [].slice;

  up.browser = (function() {
    var canCssAnimation, canInputEvent, canPushState, ensureConsoleExists, ensureRecentJquery, isSupported, loadPage, memoize, u, url;
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
    url = function() {
      return location.href;
    };
    ensureConsoleExists = function() {
      var noop, _base, _base1, _base2, _base3, _base4, _base5, _base6;
      window.console || (window.console = {});
      noop = function() {};
      (_base = window.console).log || (_base.log = noop);
      (_base1 = window.console).info || (_base1.info = noop);
      (_base2 = window.console).error || (_base2.error = noop);
      (_base3 = window.console).debug || (_base3.debug = noop);
      (_base4 = window.console).group || (_base4.group = noop);
      (_base5 = window.console).groupCollapsed || (_base5.groupCollapsed = noop);
      return (_base6 = window.console).groupEnd || (_base6.groupEnd = noop);
    };
    memoize = function(func) {
      var cache, cached;
      cache = void 0;
      cached = false;
      return function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (cached) {
          return cache;
        } else {
          cached = true;
          return cache = func.apply(null, args);
        }
      };
    };
    canPushState = memoize(function() {
      return u.isDefined(history.pushState);
    });
    canCssAnimation = memoize(function() {
      return 'transition' in document.documentElement.style;
    });
    canInputEvent = memoize(function() {
      return 'oninput' in document.createElement('input');
    });
    ensureRecentJquery = function() {
      var compatible, major, minor, parts, version;
      version = $.fn.jquery;
      parts = version.split('.');
      major = parseInt(parts[0]);
      minor = parseInt(parts[1]);
      compatible = major >= 2 || (major === 1 && minor >= 9);
      return compatible || u.error("jQuery %o found, but Up.js requires 1.9+", version);
    };
    isSupported = memoize(function() {
      return u.isDefined(document.addEventListener);
    });
    return {
      url: url,
      ensureConsoleExists: ensureConsoleExists,
      loadPage: loadPage,
      canPushState: canPushState,
      canCssAnimation: canCssAnimation,
      canInputEvent: canInputEvent,
      isSupported: isSupported,
      ensureRecentJquery: ensureRecentJquery
    };
  })();

}).call(this);

/**
Framework events
================

Up.js uses an internal event bus that you can use to hook into lifecycle events like "an HTML fragment into the DOM".
  
This internal event bus might eventually be rolled into regular events that we trigger on `document`.

\#\#\# `fragment:ready` event

This event is triggered after Up.js has inserted an HTML fragment into the DOM through mechanisms like [`[up-target]`](/up.flow#up-target) or [`up.replace`](/up.flow#up.replace):

    up.bus.on('fragment:ready', function($fragment) {
      console.log("Looks like we have a new %o!", $fragment);
    });

The event is triggered *before* Up has compiled the fragment with your [custom behavior](/up.magic).
Upon receiving the event, Up.js will start compilation.


\#\#\# `fragment:destroy` event

This event is triggered when Up.js is destroying an HTML fragment, e.g. because it's being replaced
with a new version or because someone explicitly called [`up.destroy`](/up.flow#up.destroy):

    up.bus.on('fragment:destroy', function($fragment) {
      console.log("Looks like we lost %o!", $fragment);
    });

After triggering this event, Up.js will remove the fragment from the DOM.
In case the fragment destruction is animated, Up.js will complete the
animation before removing the fragment from the DOM.


\#\#\# Incomplete documentation!
  
We need to work on this page:

- Decide whether to refactor this into document events
- Decide whether `fragment:enter` and `fragment:leave` would be better names

  
@class up.bus
 */

(function() {
  var __slice = [].slice;

  up.bus = (function() {
    var callbacksByEvent, callbacksFor, defaultCallbacksByEvent, emit, listen, reset, snapshot, u;
    u = up.util;
    callbacksByEvent = {};
    defaultCallbacksByEvent = {};
    callbacksFor = function(event) {
      return callbacksByEvent[event] || (callbacksByEvent[event] = []);
    };

    /**
    Makes a snapshot of the currently registered bus listeners,
    to later be restored through [`up.bus.reset`](/up.bus#up.bus.reset)
    
    @private
    @method up.bus.snapshot
     */
    snapshot = function() {
      var callbacks, event, _results;
      defaultCallbacksByEvent = {};
      _results = [];
      for (event in callbacksByEvent) {
        callbacks = callbacksByEvent[event];
        _results.push(defaultCallbacksByEvent[event] = u.copy(callbacks));
      }
      return _results;
    };

    /**
    Resets the list of registered event listeners to the
    moment when the framework was booted.
    
    @private
    @method up.bus.reset
     */
    reset = function() {
      return callbacksByEvent = u.copy(defaultCallbacksByEvent);
    };

    /**
    Registers an event handler to be called when the given
    event is triggered.
    
    @method up.bus.on
    @param {String} eventName
      The event name to match.
    @param {Function} handler
      The event handler to be called with the event arguments.
     */
    listen = function(eventName, handler) {
      return callbacksFor(eventName).push(handler);
    };

    /**
    Triggers an event over the framework bus.
    
    All arguments will be passed as arguments to event listeners:
    
        up.bus.on('foo:bar', function(x, y) {
          console.log("Value of x is " + x);
          console.log("Value of y is " + y);
        });
    
        up.bus.emit('foo:bar', 'arg1', 'arg2')
    
        // This prints to the console:
        //
        //   Value of x is arg1
        //   Value of y is arg2
    
    @method up.bus.emit
    @param {String} eventName
      The name of the event.
    @param args...
      The arguments that describe the event.
     */
    emit = function() {
      var args, callbacks, eventName;
      eventName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      u.debug("Emitting event %o with args %o", eventName, args);
      callbacks = callbacksFor(eventName);
      return u.each(callbacks, function(callback) {
        return callback.apply(null, args);
      });
    };
    listen('framework:ready', snapshot);
    listen('framework:reset', reset);
    return {
      on: listen,
      emit: emit
    };
  })();

}).call(this);

/**
Viewport scrolling
==================

This modules contains functions to scroll the viewport and reveal contained elements.

By default Up.js will always scroll to an element before updating it.

@class up.viewport
 */

(function() {
  up.viewport = (function() {
    var SCROLL_PROMISE_KEY, config, defaults, finishScrolling, reveal, scroll, u;
    u = up.util;
    config = {
      duration: 0,
      view: 'body',
      easing: 'swing'
    };

    /**
    @method up.viewport.defaults
    @param {Number} [options.duration]
    @param {String} [options.easing]
    @param {Number} [options.padding]
    @param {String|Element|jQuery} [options.view]
     */
    defaults = function(options) {
      return u.extend(config, options);
    };
    SCROLL_PROMISE_KEY = 'up-scroll-promise';

    /**
    @method up.scroll
    @param {String|Element|jQuery} viewOrSelector
    @param {Number} scrollPos
    @param {String}[options.duration]
    @param {String}[options.easing]
    @return {Deferred}
    @protected
     */
    scroll = function(viewOrSelector, scrollPos, options) {
      var $view, deferred, duration, easing, targetProps;
      $view = $(viewOrSelector);
      options = u.options(options);
      duration = u.option(options.duration, config.duration);
      easing = u.option(options.easing, config.easing);
      finishScrolling($view);
      if (duration > 0) {
        deferred = $.Deferred();
        $view.data(SCROLL_PROMISE_KEY, deferred);
        deferred.then(function() {
          $view.removeData(SCROLL_PROMISE_KEY);
          return $view.finish();
        });
        targetProps = {
          scrollTop: scrollPos
        };
        $view.animate(targetProps, {
          duration: duration,
          easing: easing,
          complete: function() {
            return deferred.resolve();
          }
        });
        return deferred;
      } else {
        $view.scrollTop(scrollPos);
        return u.resolvedDeferred();
      }
    };

    /**
    @method up.viewport.finishScrolling
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
    @method up.reveal
    @param {String|Element|jQuery} element
    @param {String|Element|jQuery} [options.view]
    @param {Number} [options.duration]
    @param {String} [options.easing]
    @param {Number} [options.padding]
    @return {Deferred}
    @protected
     */
    reveal = function(elementOrSelector, options) {
      var $element, $view, elementTooHigh, elementTooLow, elementTop, firstVisibleRow, lastVisibleRow, padding, scrollPos, view, viewHeight;
      options = u.options(options);
      view = u.option(options.view, config.view);
      padding = u.option(options.padding, config.padding);
      $element = $(elementOrSelector);
      $view = $(view);
      viewHeight = $view.height();
      scrollPos = $view.scrollTop();
      firstVisibleRow = scrollPos;
      lastVisibleRow = scrollPos + viewHeight;
      elementTop = $element.position().top;
      elementTooHigh = elementTop - padding < firstVisibleRow;
      elementTooLow = elementTop > lastVisibleRow - padding;
      if (elementTooHigh || elementTooLow) {
        scrollPos = elementTop - padding;
        scrollPos = Math.max(scrollPos, 0);
        scrollPos = Math.min(scrollPos, viewHeight - 1);
        return scroll($view, scrollPos, options);
      } else {
        return u.resolvedDeferred();
      }
    };
    return {
      reveal: reveal,
      scroll: scroll,
      finishScrolling: finishScrolling,
      defaults: defaults
    };
  })();

  up.scroll = up.viewport.scroll;

  up.reveal = up.viewport.reveal;

}).call(this);

/**
Changing page fragments programmatically
========================================
  
This module contains Up's core functions to insert, change
or destroy page fragments.

\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Explain the UJS approach vs. pragmatic approach
- Examples
  
  
@class up.flow
 */

(function() {
  up.flow = (function() {
    var autofocus, destroy, elementsInserted, findOldFragment, implant, parseImplantSteps, parseResponse, prepareForReplacement, reload, replace, reset, reveal, setSource, source, swapElements, u;
    u = up.util;
    setSource = function(element, sourceUrl) {
      var $element;
      $element = $(element);
      if (u.isPresent(sourceUrl)) {
        sourceUrl = u.normalizeUrl(sourceUrl);
      }
      return $element.attr("up-source", sourceUrl);
    };
    source = function(element) {
      var $element;
      $element = $(element).closest("[up-source]");
      return u.presence($element.attr("up-source")) || up.browser.url();
    };

    /**
    Replaces elements on the current page with corresponding elements
    from a new page fetched from the server.
    
    The current and new elements must have the same CSS selector.
    
    @method up.replace
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
    @param {String} [options.scroll='body']
    @param {Boolean} [options.cache]
      Whether to use a [cached response](/up.proxy) if available.
    @param {String} [options.historyMethod='push']
    @return {Promise}
      A promise that will be resolved when the page has been updated.
     */
    replace = function(selectorOrElement, url, options) {
      var promise, request, selector;
      options = u.options(options);
      selector = u.presence(selectorOrElement) ? selectorOrElement : u.createSelectorFromElement($(selectorOrElement));
      if (!up.browser.canPushState() && !u.castsToFalse(options.history)) {
        if (!options.preload) {
          up.browser.loadPage(url, u.only(options, 'method'));
        }
        return;
      }
      request = {
        url: url,
        method: options.method,
        selector: selector,
        cache: options.cache
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
        if (u.isMissing(options.history) || u.castsToTrue(options.history)) {
          options.history = url;
        }
        if (u.isMissing(options.source) || u.castsToTrue(options.source)) {
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
    Replaces the given selector with the same CSS selector from the given HTML string.
    
    @method up.flow.implant
    @protected
    @param {String} selector
    @param {String} html
    @param {String} [options.title]
    @param {String} [options.source]
    @param {Object} [options.transition]
    @param {String} [options.scroll='body']
    @param {String} [options.history]
    @param {String} [options.historyMethod='push']
     */
    implant = function(selector, html, options) {
      var $new, $old, response, step, _i, _len, _ref, _results;
      options = u.options(options, {
        historyMethod: 'push'
      });
      if (u.castsToFalse(options.history)) {
        options.history = null;
      }
      if (u.castsToFalse(options.scroll)) {
        options.scroll = null;
      }
      options.source = u.option(options.source, options.history);
      response = parseResponse(html);
      options.title || (options.title = response.title());
      _ref = parseImplantSteps(selector, options);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        step = _ref[_i];
        $old = findOldFragment(step.selector);
        $new = response.find(step.selector);
        _results.push(prepareForReplacement($old, options).then(function() {
          return swapElements($old, $new, step.pseudoClass, step.transition, options);
        }));
      }
      return _results;
    };
    findOldFragment = function(selector) {
      var selectorWithExcludes;
      selectorWithExcludes = selector + ":not(.up-ghost, .up-destroying)";
      return u.presence($(".up-popup " + selectorWithExcludes)) || u.presence($(".up-modal " + selectorWithExcludes)) || u.presence($(selectorWithExcludes)) || u.error('Could not find selector %o in current body HTML', selector);
    };
    parseResponse = function(html) {
      var htmlElement;
      htmlElement = u.createElementFromHtml(html);
      return {
        title: function() {
          var _ref;
          return (_ref = htmlElement.querySelector("title")) != null ? _ref.textContent : void 0;
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
    prepareForReplacement = function($element, options) {
      up.motion.finish($element);
      return reveal($element, options.scroll);
    };
    reveal = function($element, view) {
      if (view) {
        return up.reveal($element, {
          view: view
        });
      } else {
        return u.resolvedDeferred();
      }
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
      setSource($new, options.source);
      autofocus($new);
      return up.ready($new);
    };
    swapElements = function($old, $new, pseudoClass, transition, options) {
      var $addedChildren, insertionMethod;
      transition || (transition = 'none');
      if (pseudoClass) {
        insertionMethod = pseudoClass === 'before' ? 'prepend' : 'append';
        $addedChildren = $new.children();
        $old[insertionMethod]($new.contents());
        u.copyAttributes($new, $old);
        elementsInserted($addedChildren, options);
        return up.animate($new, transition, options);
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
      var comma, disjunction, i, selectorAtom, selectorParts, transition, transitionString, transitions, _i, _len, _results;
      transitionString = options.transition || options.animation || 'none';
      comma = /\ *,\ */;
      disjunction = selector.split(comma);
      if (u.isPresent(transitionString)) {
        transitions = transitionString.split(comma);
      }
      _results = [];
      for (i = _i = 0, _len = disjunction.length; _i < _len; i = ++_i) {
        selectorAtom = disjunction[i];
        selectorParts = selectorAtom.match(/^(.+?)(?:\:(before|after))?$/);
        transition = transitions[i] || u.last(transitions);
        _results.push({
          selector: selectorParts[1],
          pseudoClass: selectorParts[2],
          transition: transition
        });
      }
      return _results;
    };
    autofocus = function($element) {
      var $control, selector;
      selector = '[autofocus]:last';
      $control = u.findWithSelf($element, selector);
      if ($control.length && $control.get(0) !== document.activeElement) {
        return $control.focus();
      }
    };

    /**
    Destroys the given element or selector.
    Takes care that all destructors, if any, are called.
    The element is removed from the DOM.
    
    @method up.destroy
    @param {String|Element|jQuery} selectorOrElement 
    @param {String} [options.url]
    @param {String} [options.title]
    @param {String} [options.animation='none']
      The animation to use before the element is removed from the DOM.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate`](/up.motion#up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate`](/up.motion#up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate`](/up.motion#up.animate).
     */
    destroy = function(selectorOrElement, options) {
      var $element, animateOptions, animationPromise;
      $element = $(selectorOrElement);
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
      up.bus.emit('fragment:destroy', $element);
      animationPromise = u.presence(options.animation, u.isPromise) || up.motion.animate($element, options.animation, animateOptions);
      return animationPromise.then(function() {
        return $element.remove();
      });
    };

    /**
    Replaces the given selector or element with a fresh copy
    fetched from the server.
    
    Up.js remembers the URL from which a fragment was loaded, so you
    don't usually need to give an URL when reloading.
    
    @method up.reload
    @param {String|Element|jQuery} selectorOrElement
    @param {Object} [options]
      See options for [`up.replace`](#up.replace)
     */
    reload = function(selectorOrElement, options) {
      var sourceUrl;
      options = u.options(options, {
        cache: false
      });
      sourceUrl = options.url || source(selectorOrElement);
      return replace(selectorOrElement, sourceUrl, options);
    };

    /**
    Resets Up.js to the state when it was booted.
    All custom event handlers, animations, etc. that have been registered
    will be discarded.
    
    This is an internal method for to enable unit testing.
    Don't use this in production.
    
    @protected
    @method up.reset
     */
    reset = function() {
      return up.bus.emit('framework:reset');
    };
    up.bus.on('app:ready', function() {
      return setSource(document.body, up.browser.url());
    });
    return {
      replace: replace,
      reload: reload,
      destroy: destroy,
      implant: implant,
      reset: reset
    };
  })();

  up.replace = up.flow.replace;

  up.reload = up.flow.reload;

  up.destroy = up.flow.destroy;

  up.reset = up.flow.reset;

}).call(this);

/**
Registering behavior and custom elements
========================================
  
Up.js keeps a persistent Javascript environment during page transitions.
To prevent memory leaks it is important to cleanly set up and tear down
event handlers and custom elements.

\#\#\# Incomplete documentation!

We need to work on this page:

- Better class-level introduction for this module

@class up.magic
 */

(function() {
  var __slice = [].slice;

  up.magic = (function() {
    var DESTROYABLE_CLASS, DESTROYER_KEY, applyAwakener, awaken, awakeners, compile, data, defaultAwakeners, defaultLiveDescriptions, destroy, live, liveDescriptions, onEscape, ready, reset, snapshot, u;
    u = up.util;
    DESTROYABLE_CLASS = 'up-destroyable';
    DESTROYER_KEY = 'up-destroyer';

    /**
    Binds an event handler to the document, which will be executed whenever the
    given event is triggered on the given selector:
    
        up.on('click', '.button', function(event, $element) {
          console.log("Someone clicked the button %o", $element);
        });
    
    This is roughly equivalent to binding a jQuery element to `document`.
    
    
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
    
    
    @method up.on
    @param {String} events
      A space-separated list of event names to bind.
    @param {String} selector
      The selector an on which the event must be triggered.
    @param {Function(event, $element, data)} behavior
      The handler that should be called.
      The function takes the affected element as the first argument (as a jQuery object).
      If the element has an `up-data` attribute, its value is parsed as JSON
      and passed as a second argument.
     */
    liveDescriptions = [];
    defaultLiveDescriptions = null;
    live = function(events, selector, behavior) {
      var description, _ref;
      if (!up.browser.isSupported()) {
        return;
      }
      description = [
        events, selector, function(event) {
          return behavior.apply(this, [event, $(this), data(this)]);
        }
      ];
      liveDescriptions.push(description);
      return (_ref = $(document)).on.apply(_ref, description);
    };

    /**
    Registers a function to be called whenever an element with
    the given selector is inserted into the DOM through Up.js.
    
    This is a great way to integrate jQuery plugins.
    Let's say your Javascript plugin wants you to call `lightboxify()`
    on links that should open a lightbox. You decide to
    do this for all links with an `[rel=lightbox]` attribute:
    
        <a href="river.png" rel="lightbox">River</a>
        <a href="ocean.png" rel="lightbox">Ocean</a>
    
    This Javascript will do exactly that:
    
        up.awaken('a[rel=lightbox]', function($element) {
          $element.lightboxify();
        });
    
    Note that within the awakener, Up.js will bind `this` to the
    native DOM element to help you migrate your existing jQuery code to
    this new syntax.
    
    
    \#\#\#\# Custom elements
    
    You can also use `up.awaken` to implement custom elements like this:
    
        <current-time></current-time>
    
    Here is the Javascript that inserts the current time into to these elements:
    
        up.awaken('current-time', function($element) {
          var now = new Date();
          $element.text(now.toString()));
        });
    
    
    \#\#\#\# Cleaning up after yourself
    
    If your awakener returns a function, Up.js will use this as a *destructor* to
    clean up if the element leaves the DOM. Note that in Up.js the same DOM ad Javascript environment
    will persist through many page loads, so it's important to not create
    [memory leaks](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).
    
    You should clean up after yourself whenever your awakeners have global
    side effects, like a [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setInterval)
    or event handlers bound to the document root.
    
    Here is a version of `<current-time>` that updates
    the time every second, and cleans up once it's done:
    
        up.awaken('current-time', function($element) {
    
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
    of `<current-time>` elements.
    
    
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
    
        up.awaken('.google-map', function($element, pins) {
    
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
    
    
    \#\#\#\# Migrating jQuery event handlers to `up.on`
    
    Within the awakener, Up.js will bind `this` to the
    native DOM element to help you migrate your existing jQuery code to
    this new syntax.
    
    
    @method up.awaken
    @param {String} selector
      The selector to match.
    @param {Boolean} [options.batch=false]
      If set to `true` and a fragment insertion contains multiple
      elements matching the selector, `awakener` is only called once
      with a jQuery collection containing all matching elements. 
    @param {Function($element, data)} awakener
      The function to call when a matching element is inserted.
      The function takes the new element as the first argument (as a jQuery object).
      If the element has an `up-data` attribute, its value is parsed as JSON
      and passed as a second argument.
    
      The function may return another function that destroys the awakened
      object when it is removed from the DOM, by clearing global state such as
      time-outs and event handlers bound to the document.
     */
    awakeners = [];
    defaultAwakeners = null;
    awaken = function() {
      var args, awakener, options, selector;
      selector = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!up.browser.isSupported()) {
        return;
      }
      awakener = args.pop();
      options = u.options(args[0], {
        batch: false
      });
      return awakeners.push({
        selector: selector,
        callback: awakener,
        batch: options.batch
      });
    };
    applyAwakener = function(awakener, $jqueryElement, nativeElement) {
      var destroyer;
      u.debug("Applying awakener %o on %o", awakener.selector, nativeElement);
      destroyer = awakener.callback.apply(nativeElement, [$jqueryElement, data($jqueryElement)]);
      if (u.isFunction(destroyer)) {
        $jqueryElement.addClass(DESTROYABLE_CLASS);
        return $jqueryElement.data(DESTROYER_KEY, destroyer);
      }
    };
    compile = function($fragment) {
      var $matches, awakener, _i, _len, _results;
      u.debug("Compiling fragment %o", $fragment);
      _results = [];
      for (_i = 0, _len = awakeners.length; _i < _len; _i++) {
        awakener = awakeners[_i];
        $matches = u.findWithSelf($fragment, awakener.selector);
        if ($matches.length) {
          if (awakener.batch) {
            _results.push(applyAwakener(awakener, $matches, $matches.get()));
          } else {
            _results.push($matches.each(function() {
              return applyAwakener(awakener, $(this), this);
            }));
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    destroy = function($fragment) {
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
    @method up.magic.data
    @param {String|Element|jQuery} elementOrSelector
     */

    /*
    Stores a JSON-string with the element.
    
    If an element annotated with [`up-data`] is inserted into the DOM,
    Up will parse the JSON and pass the resulting object to any matching
    [`up.awaken`](/up.magic#up.magic.awaken) handlers.
    
    Similarly, when an event is triggered on an element annotated with
    [`up-data`], the parsed object will be passed to any matching
    [`up.on`](/up.magic#up.on) handlers.
    
    @ujs
    @method [up-data]
    @param {JSON} [up-data]
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
    to later be restored through [`up.bus.reset`](/up.bus#up.bus.reset).
    
    @private
    @method up.magic.snapshot
     */
    snapshot = function() {
      defaultLiveDescriptions = u.copy(liveDescriptions);
      return defaultAwakeners = u.copy(awakeners);
    };

    /**
    Resets the list of registered event listeners to the
    moment when the framework was booted.
    
    @private
    @method up.magic.reset
     */
    reset = function() {
      var description, _i, _len, _ref;
      for (_i = 0, _len = liveDescriptions.length; _i < _len; _i++) {
        description = liveDescriptions[_i];
        if (!u.contains(defaultLiveDescriptions, description)) {
          (_ref = $(document)).off.apply(_ref, description);
        }
      }
      liveDescriptions = u.copy(defaultLiveDescriptions);
      return awakeners = u.copy(defaultAwakeners);
    };

    /**
    Sends a notification that the given element has been inserted
    into the DOM. This causes Up.js to compile the fragment (apply
    event listeners, etc.).
    
    This method is called automatically if you change elements through
    other Up.js methods. You will only need to call this if you
    manipulate the DOM without going through Up.js.
    
    @method up.ready
    @param {String|Element|jQuery} selectorOrFragment
     */
    ready = function(selectorOrFragment) {
      var $fragment;
      $fragment = $(selectorOrFragment);
      up.bus.emit('fragment:ready', $fragment);
      return $fragment;
    };
    onEscape = function(handler) {
      return live('keydown', 'body', function(event) {
        if (u.escapePressed(event)) {
          return handler(event);
        }
      });
    };
    up.bus.on('app:ready', (function() {
      return ready(document.body);
    }));
    up.bus.on('fragment:ready', compile);
    up.bus.on('fragment:destroy', destroy);
    up.bus.on('framework:ready', snapshot);
    up.bus.on('framework:reset', reset);
    return {
      awaken: awaken,
      on: live,
      ready: ready,
      onEscape: onEscape,
      data: data
    };
  })();

  up.awaken = up.magic.awaken;

  up.on = up.magic.on;

  up.ready = up.magic.ready;

}).call(this);

/**
Manipulating the browser history
=======
  
\#\#\# Incomplete documentation!
  
We need to work on this page:

- Explain how the other modules manipulate history
- Decide whether we want to expose these methods as public API
- Document methods and parameters

@class up.history
 */

(function() {
  up.history = (function() {
    var isCurrentUrl, manipulate, pop, push, replace, u;
    u = up.util;
    isCurrentUrl = function(url) {
      return u.normalizeUrl(url, {
        hash: true
      }) === u.normalizeUrl(up.browser.url(), {
        hash: true
      });
    };

    /**
    @method up.history.replace
    @param {String} url
    @protected
     */
    replace = function(url, options) {
      options = u.options(options, {
        force: false
      });
      if (options.force || !isCurrentUrl(url)) {
        return manipulate("replace", url);
      }
    };

    /**
    @method up.history.push  
    @param {String} url
    @protected
     */
    push = function(url) {
      if (!isCurrentUrl(url)) {
        return manipulate("push", url);
      }
    };
    manipulate = function(method, url) {
      if (up.browser.canPushState()) {
        method += "State";
        return window.history[method]({
          fromUp: true
        }, '', url);
      } else {
        return u.error("This browser doesn't support history.pushState");
      }
    };
    pop = function(event) {
      var state;
      state = event.originalEvent.state;
      if (state != null ? state.fromUp : void 0) {
        u.debug("Restoring state %o (now on " + (up.browser.url()) + ")", state);
        return up.visit(up.browser.url(), {
          historyMethod: 'replace'
        });
      } else {
        return u.debug('Discarding unknown state %o', state);
      }
    };
    if (up.browser.canPushState()) {
      setTimeout((function() {
        $(window).on("popstate", pop);
        return replace(up.browser.url(), {
          force: true
        });
      }), 200);
    }
    return {
      push: push,
      replace: replace
    };
  })();

}).call(this);

/**
Animation and transitions
=========================
  
Any fragment change in Up.js can be animated.

    <a href="/users" data-target=".list" up-transition="cross-fade">Show users</a>

Or a dialog open:

    <a href="/users" up-modal=".list" up-animation="move-from-top">Show users</a>

Up.js ships with a number of predefined animations and transitions,
and you can easily define your own using Javascript or CSS. 
  
  
\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Explain the difference between transitions and animations
- Demo the built-in animations and transitions
- Explain ghosting

  
@class up.motion
 */

(function() {
  up.motion = (function() {
    var GHOSTING_PROMISE_KEY, animate, animateOptions, animation, animations, assertIsDeferred, config, defaultAnimations, defaultTransitions, defaults, findAnimation, finish, finishGhosting, morph, none, reset, resolvableWhen, snapshot, transition, transitions, u, withGhosts;
    u = up.util;
    animations = {};
    defaultAnimations = {};
    transitions = {};
    defaultTransitions = {};
    config = {
      duration: 300,
      delay: 0,
      easing: 'ease'
    };

    /**
    @method up.motion.defaults
    @param {Number} [options.duration=300]
    @param {Number} [options.delay=0]
    @param {String} [options.easing='ease']
     */
    defaults = function(options) {
      return u.extend(config, options);
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
    
    You can define additional named animations using [`up.animation`](#up.animation).
    
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
    
    @method up.animate
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
    @method up.motion.animateOptions
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
      return animations[name] || u.error("Unknown animation %o", animation);
    };
    GHOSTING_PROMISE_KEY = 'up-ghosting-promise';
    withGhosts = function($old, $new, block) {
      var $newGhost, $oldGhost, promise, showNew;
      $oldGhost = null;
      $newGhost = null;
      u.temporaryCss($new, {
        display: 'none'
      }, function() {
        return $oldGhost = u.prependGhost($old).addClass('up-destroying');
      });
      u.temporaryCss($old, {
        display: 'none'
      }, function() {
        return $newGhost = u.prependGhost($new);
      });
      $old.css({
        visibility: 'hidden'
      });
      showNew = u.temporaryCss($new, {
        display: 'none'
      });
      promise = block($oldGhost, $newGhost);
      $old.data(GHOSTING_PROMISE_KEY, promise);
      $new.data(GHOSTING_PROMISE_KEY, promise);
      promise.then(function() {
        $old.removeData(GHOSTING_PROMISE_KEY);
        $new.removeData(GHOSTING_PROMISE_KEY);
        $oldGhost.remove();
        $newGhost.remove();
        $old.css({
          display: 'none'
        });
        return showNew();
      });
      return promise;
    };

    /**
    Completes all animations and transitions for the given element
    by jumping to the last animation frame instantly. All callbacks chained to
    the original animation's promise will be called.
    
    Does nothing if the given element is not currently animating.
    
    @method up.motion.finish
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
    assertIsDeferred = function(object, origin) {
      if (u.isDeferred(object)) {
        return object;
      } else {
        return u.error("Did not return a promise with .then and .resolve methods: %o", origin);
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
    
    You can define additional named transitions using [`up.transition`](#up.transition).
    
    You can also compose a transition from two [named animations](#named-animations).
    separated by a slash character (`/`):
    
    - `move-to-bottom/fade-in`
    - `move-to-left/move-from-top`
    
    @method up.morph
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
    @return {Promise}
      A promise for the transition's end.
     */
    morph = function(source, target, transitionOrName, options) {
      var $new, $old, animation, parts, transition;
      if (up.browser.canCssAnimation()) {
        options = animateOptions(options);
        $old = $(source);
        $new = $(target);
        finish($old);
        finish($new);
        if (transitionOrName === 'none') {
          return none();
        } else if (transition = u.presence(transitionOrName, u.isFunction) || transitions[transitionOrName]) {
          return withGhosts($old, $new, function($oldGhost, $newGhost) {
            return assertIsDeferred(transition($oldGhost, $newGhost, options), transitionOrName);
          });
        } else if (animation = animations[transitionOrName]) {
          $old.hide();
          return animate($new, animation, options);
        } else if (u.isString(transitionOrName) && transitionOrName.indexOf('/') >= 0) {
          parts = transitionOrName.split('/');
          transition = function($old, $new, options) {
            return resolvableWhen(animate($old, parts[0], options), animate($new, parts[1], options));
          };
          return morph($old, $new, transition, options);
        } else {
          return u.error("Unknown transition %o", transitionOrName);
        }
      } else {
        return u.resolvedDeferred();
      }
    };

    /**
    Defines a named transition.
    
    Here is the definition of the pre-defined `cross-fade` animation:
    
        up.transition('cross-fade', ($old, $new, options) ->
          up.motion.when(
            animate($old, 'fade-out', options),
            animate($new, 'fade-in', options)
          )
        )
    
    It is recommended that your transitions use [`up.animate`](#up.animate),
    passing along the `options` that were passed to you.
    
    If you choose to *not* use `up.animate` and roll your own
    logic instead, your code must honor the following contract:
    
    1. It must honor the passed options.
    2. It must *not* remove any of the given elements from the DOM.
    3. It returns a promise that is resolved when the transition ends
    4. The returned promise responds to a `resolve()` function that
       instantly jumps to the last transition frame and resolves the promise.
    
    Calling [`up.animate`](#up.animate) with an object argument
    will take care of all these points.
    
    @method up.transition
    @param {String} name
    @param {Function} transition
     */
    transition = function(name, transition) {
      return transitions[name] = transition;
    };

    /**
    Defines a named animation.
    
    Here is the definition of the pre-defined `fade-in` animation:
    
        up.animation('fade-in', ($ghost, options) ->
          $ghost.css(opacity: 0)
          animate($ghost, { opacity: 1 }, options)
        )
    
    It is recommended that your definitions always end by calling
    calling [`up.animate`](#up.animate) with an object argument, passing along
    the `options` that were passed to you.
    
    If you choose to *not* use `up.animate` and roll your own
    animation code instead, your code must honor the following contract:
    
    1. It must honor the passed options.
    2. It must *not* remove the passed element from the DOM.
    3. It returns a promise that is resolved when the animation ends
    4. The returned promise responds to a `resolve()` function that
       instantly jumps to the last animation frame and resolves the promise.
    
    Calling [`up.animate`](#up.animate) with an object argument
    will take care of all these points.
    
    @method up.animation
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
    reset = function() {
      animations = u.copy(defaultAnimations);
      return transitions = u.copy(defaultTransitions);
    };

    /**
    Returns a new promise that resolves once all promises in arguments resolve.
    
    Other then [`$.when` from jQuery](https://api.jquery.com/jquery.when/),
    the combined promise will have a `resolve` method.
    
    @method up.motion.when
    @param promises...
    @return A new promise.
     */
    resolvableWhen = u.resolvableWhen;

    /**
    Returns a no-op animation or transition which has no visual effects
    and completes instantly.
    
    @method up.motion.none
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
    up.bus.on('framework:ready', snapshot);
    up.bus.on('framework:reset', reset);
    return {
      morph: morph,
      animate: animate,
      animateOptions: animateOptions,
      finish: finish,
      transition: transition,
      animation: animation,
      defaults: defaults,
      none: none,
      when: resolvableWhen
    };
  })();

  up.transition = up.motion.transition;

  up.animation = up.motion.animation;

  up.morph = up.motion.morph;

  up.animate = up.motion.animate;

}).call(this);

/**
Caching and preloading
======================

All HTTP requests go through the Up.js proxy.
It caches a [limited](/up.proxy#up.proxy.defaults) number of server responses
  for a [limited](/up.proxy#up.proxy.defaults) amount of time,
making requests to these URLs return insantly.
  
The cache is cleared whenever the user makes a non-`GET` request
(like `POST`, `PUT` or `DELETE`).

The proxy can also used to speed up reaction times by preloading
links when the user hovers over the click area (or puts the mouse/finger
down before releasing). This way the
response will already be cached when the user performs the click.   

@class up.proxy
 */

(function() {
  up.proxy = (function() {
    var $waitingLink, SAFE_HTTP_METHODS, ajax, alias, cache, cacheKey, cancelDelay, checkPreload, clear, config, defaults, delayTimer, ensureIsIdempotent, get, isFresh, isIdempotent, normalizeRequest, preload, remove, reset, set, startDelay, timestamp, trim, u;
    config = {
      preloadDelay: 75,
      cacheSize: 70,
      cacheExpiry: 1000 * 60 * 5
    };

    /**
    @method up.proxy.defaults
    @param {Number} [options.preloadDelay=75]
      The number of milliseconds to wait before [`[up-preload]`](#up-preload)
      starts preloading.
    @param {Number} [options.cacheSize=70]
      The maximum number of responses to cache.
      If the size is exceeded, the oldest items will be dropped from the cache.
    @param {Number} [options.cacheExpiry=300000]
      The number of milliseconds until a cache entry expires.
      Defaults to 5 minutes.
     */
    defaults = function(options) {
      return u.extend(config, options);
    };
    cache = {};
    u = up.util;
    $waitingLink = null;
    delayTimer = null;
    cacheKey = function(request) {
      normalizeRequest(request);
      return [request.url, request.method, request.selector].join('|');
    };
    trim = function() {
      var keys, oldestKey, oldestTimestamp;
      keys = u.keys(cache);
      if (keys.length > config.cacheSize) {
        oldestKey = null;
        oldestTimestamp = null;
        u.each(keys, function(key) {
          var promise, timestamp;
          promise = cache[key];
          timestamp = promise.timestamp;
          if (!oldestTimestamp || oldestTimestamp > timestamp) {
            oldestKey = key;
            return oldestTimestamp = timestamp;
          }
        });
        if (oldestKey) {
          return delete cache[oldestKey];
        }
      }
    };
    timestamp = function() {
      return (new Date()).valueOf();
    };
    normalizeRequest = function(request) {
      if (!u.isHash(request)) {
        debugger;
      }
      if (!request._requestNormalized) {
        request.method = u.normalizeMethod(request.method);
        if (request.url) {
          request.url = u.normalizeUrl(request.url);
        }
        request.selector || (request.selector = 'body');
        request._requestNormalized = true;
      }
      return request;
    };
    alias = function(oldRequest, newRequest) {
      var promise;
      u.debug("Aliasing %o to %o", oldRequest, newRequest);
      if (promise = get(oldRequest)) {
        return set(newRequest, promise);
      }
    };

    /**
    Makes a request to the given URL and caches the response.
    If the response was already cached, returns the HTML instantly.
    
    If requesting a URL that is not read-only, the response will
    not be cached and the entire cache will be cleared.
    Only requests with a method of `GET`, `OPTIONS` and `HEAD`
    are considered to be read-only.
    
    @method up.proxy.ajax
    @param {String} request.url
    @param {String} [request.method='GET']
    @param {String} [request.selector]
    @param {Boolean} [request.cache]
      Whether to use a cached response, if available.
      If set to `false` a network connection will always be attempted.
     */
    ajax = function(options) {
      var forceCache, ignoreCache, promise, request;
      forceCache = u.castsToTrue(options.cache);
      ignoreCache = u.castsToFalse(options.cache);
      request = u.only(options, 'url', 'method', 'selector');
      if (!isIdempotent(request) && !forceCache) {
        clear();
        promise = u.ajax(request);
      } else if ((promise = get(request)) && !ignoreCache) {
        promise;
      } else {
        promise = u.ajax(request);
        set(request, promise);
      }
      return promise;
    };
    SAFE_HTTP_METHODS = ['GET', 'OPTIONS', 'HEAD'];
    isIdempotent = function(request) {
      normalizeRequest(request);
      return u.contains(SAFE_HTTP_METHODS, request.method);
    };
    ensureIsIdempotent = function(request) {
      return isIdempotent(request) || u.error("Won't preload non-GET request %o", request);
    };
    isFresh = function(promise) {
      var timeSinceTouch;
      timeSinceTouch = timestamp() - promise.timestamp;
      return timeSinceTouch < config.cacheExpiry;
    };
    get = function(request) {
      var key, promise;
      key = cacheKey(request);
      if (promise = cache[key]) {
        if (!isFresh(promise)) {
          u.debug("Discarding stale cache entry for %o (%o)", request.url, request);
          remove(request);
          return void 0;
        } else {
          u.debug("Cache hit for %o (%o)", request.url, request);
          return promise;
        }
      } else {
        u.debug("Cache miss for %o (%o)", request.url, request);
        return void 0;
      }
    };
    set = function(request, promise) {
      var key;
      trim();
      key = cacheKey(request);
      promise.timestamp = timestamp();
      cache[key] = promise;
      return promise;
    };
    remove = function(request) {
      var key;
      key = cacheKey(request);
      return delete cache[key];
    };
    clear = function() {
      return cache = {};
    };
    checkPreload = function($link) {
      var curriedPreload, delay;
      delay = parseInt(u.presentAttr($link, 'up-delay')) || config.preloadDelay;
      if (!$link.is($waitingLink)) {
        $waitingLink = $link;
        cancelDelay();
        curriedPreload = function() {
          return preload($link);
        };
        return startDelay(curriedPreload, delay);
      }
    };
    startDelay = function(block, delay) {
      return delayTimer = setTimeout(block, delay);
    };
    cancelDelay = function() {
      clearTimeout(delayTimer);
      return delayTimer = null;
    };
    preload = function(link, options) {
      options = u.options();
      ensureIsIdempotent(options);
      u.debug("Preloading %o", link);
      options.preload = true;
      return up.link.follow(link, options);
    };
    reset = function() {
      cancelDelay();
      return cache = {};
    };
    up.bus.on('framework:reset', reset);

    /**
    Links with an `up-preload` attribute will silently fetch their target
    when the user hovers over the click area, or when the user puts her
    mouse/finger down (before releasing). This way the
    response will already be cached when the user performs the click,
    making the interaction feel instant.   
    
    @method [up-preload]
    @param [[up-delay]=50]
      The number of milliseconds to wait between hovering
      and preloading. Increasing this will lower the load in your server,
      but will also make the interaction feel less instant.
    @ujs
     */
    up.on('mouseover mousedown touchstart', '[up-preload]', function(event, $element) {
      if (!up.link.childClicked(event, $element)) {
        return checkPreload(up.link.resolve($element));
      }
    });
    return {
      preload: preload,
      ajax: ajax,
      get: get,
      set: set,
      alias: alias,
      clear: clear,
      remove: remove,
      defaults: defaults
    };
  })();

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
- [Defining custom tags and event handlers](/up.magic)

  
@class up.link
 */

(function() {
  up.link = (function() {
    var activeInstantLink, childClicked, follow, resolve, u, visit;
    u = up.util;

    /**
    Visits the given URL without a full page load.
    This is done by fetching `url` through an AJAX request
    and replacing the current `<body>` element with the response's `<body>` element.
    
    For example, this would fetch the `/users` URL:
    
        up.visit('/users')
    
    @method up.visit
    @param {String} url
      The URL to visit.
    @param {Object} options
      See options for [`up.replace`](/up.flow#up.replace)
     */
    visit = function(url, options) {
      u.debug("Visiting " + url);
      return up.replace('body', url, options);
    };

    /**
    Follows the given link via AJAX and replaces a CSS selector in the current page
    with corresponding elements from a new page fetched from the server.
    
    Any Up.js UJS attributes on the given link will be honored. E. g. you have this link:
    
        <a href="/users" up-target=".main">Users</a>
    
    You can update the page's `.main` selector with the `.main` from `/users` like this:
    
        var $link = $('a:first'); // select link with jQuery
        up.follow($link);
    
    @method up.follow
    @param {Element|jQuery|String} link
      An element or selector which resolves to an `<a>` tag
      or any element that is marked up with an `up-follow` attribute.
    @param {String} [options.target]
      The selector to replace.
      Defaults to the `up-target` attribute on `link`,
      or to `body` if such an attribute does not exist.
    @param {Function|String} [options.transition]
      A transition function or name.
    @param {Element|jQuery|String} [options.scroll]
      An element or selector that will be scrolled to the top in
      case the replaced element is not visible in the viewport.
    @param {Number} [options.duration]
      The duration of the transition. See [`up.morph`](/up.motion#up.morph).
    @param {Number} [options.delay]
      The delay before the transition starts. See [`up.morph`](/up.motion#up.morph).
    @param {String} [options.easing]
      The timing function that controls the transition's acceleration. [`up.morph`](/up.motion#up.morph).
     */
    follow = function(link, options) {
      var $link, selector, url;
      $link = $(link);
      options = u.options(options);
      url = u.option($link.attr('href'), $link.attr('up-follow'));
      selector = u.option(options.target, $link.attr('up-target'), 'body');
      options.transition = u.option(options.transition, $link.attr('up-transition'), $link.attr('up-animation'));
      options.history = u.option(options.history, $link.attr('up-history'));
      options.scroll = u.option(options.scroll, $link.attr('up-scroll'), 'body');
      options.cache = u.option(options.cache, $link.attr('up-cache'));
      options = u.merge(options, up.motion.animateOptions(options, $link));
      return up.replace(selector, url, options);
    };
    resolve = function(element) {
      var $element, followAttr;
      $element = $(element);
      followAttr = $element.attr('up-follow');
      if ($element.is('a') || (u.isPresent(followAttr) && !u.castsToTrue(followAttr))) {
        return $element;
      } else {
        return $element.find('a:first');
      }
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
    
    \#\#\#\# Following on mousedown
    
    By also adding an `up-instant` attribute, the page will be fetched
    on `mousedown` instead of `click`, making the interaction even faster:
    
        <a href="/users" up-target=".main" up-instant>User list</a>
    
    Note that using `[up-instant]` will prevent a user from canceling a link
    click by moving the mouse away from the interaction area. However, for
    navigation actions this isn't needed. E.g. popular operation
    systems switch tabs on `mousedown`.
    
    @method a[up-target]
    @ujs
    @param {String} up-target
      The CSS selector to replace
    @param up-instant
      If set, fetches the element on `mousedown` instead of `click`.
      This makes the interaction faster.
     */
    up.on('click', 'a[up-target]', function(event, $link) {
      event.preventDefault();
      if (!$link.is('[up-instant]')) {
        return follow($link);
      }
    });
    up.on('mousedown', 'a[up-target][up-instant]', function(event, $link) {
      if (activeInstantLink(event, $link)) {
        event.preventDefault();
        return up.follow($link);
      }
    });

    /**
    @method up.link.childClicked
    @private
     */
    childClicked = function(event, $link) {
      var $target, $targetLink;
      $target = $(event.target);
      $targetLink = $target.closest('a, [up-follow]');
      return $targetLink.length && $link.find($targetLink).length;
    };
    activeInstantLink = function(event, $link) {
      return u.isUnmodifiedMouseEvent(event) && !childClicked(event, $link);
    };

    /**
    If applied on a link, Follows this link via AJAX and replaces the
    current `<body>` element with the response's `<body>` element
    
        <a href="/users" up-follow>User list</a>
    
    \#\#\#\# Following on mousedown
    
    By also adding an `up-instant` attribute, the page will be fetched
    on `mousedown` instead of `click`, making the interaction even faster:
    
        <a href="/users" up-follow up-instant>User list</a>
    
    Note that using `[up-instant]` will prevent a user from canceling a link
    click by moving the mouse away from the interaction area. However, for
    navigation actions this isn't needed. E.g. popular operation
    systems switch tabs on `mousedown`.
    
    \#\#\#\# Enlarging the click area
    
    You can also apply `[up-follow]` to any element that contains a link
    in order to enlarge the link's click area:
    
        <div class="notification" up-follow>
           Record was saved!
           <a href="/records">Close</a>
        </div>
    
    In the example above, clicking anywhere within `.notification` element
    would follow the *Close* link.
    
    @method [up-follow]
    @ujs
    @param {String} [up-follow]
    @param up-instant
      If set, fetches the element on `mousedown` instead of `click`.
     */
    up.on('click', '[up-follow]', function(event, $link) {
      if (!childClicked(event, $link)) {
        event.preventDefault();
        if (!$link.is('[up-instant]')) {
          return follow(resolve($link));
        }
      }
    });
    up.on('mousedown', '[up-follow][up-instant]', function(event, $link) {
      if (activeInstantLink(event, $link)) {
        event.preventDefault();
        return up.follow(resolve($link));
      }
    });

    /**
    Marks up the current link to be followed *as fast as possible*.
    This is done by:
    
    - [Following the link through AJAX](/up.link#up-target) instead of a full page load
    - [Preloading the link's destination URL](/up.proxy#up-preload)
    - [Triggering the link on `mousedown`](/up.link#up-instant) instead of on `click`
    
    Use `up-dash` like this:
    
        <a href="/users" up-dash=".main">User list</a>
    
    Note that this is shorthand for:
    
        <a href="/users" up-target=".main" up-instant up-preload>User list</a>  
    
    You can also apply `[up-dash]` to any element that contains a link
    in order to enlarge the link's click area:
    
        <div class="notification" up-dash>
           Record was saved!
           <a href="/records" up-dash='.main'>Close</a>
        </div>
    
    @method [up-dash]
    @ujs
     */
    up.awaken('[up-dash]', function($element) {
      var newAttrs, target;
      target = $element.attr('up-dash');
      newAttrs = {
        'up-preload': 'true',
        'up-instant': 'true'
      };
      if (u.isBlank(target) || u.castsToTrue(target)) {
        newAttrs['up-follow'] = '';
      } else {
        newAttrs['up-target'] = target;
      }
      u.setMissingAttrs($element, newAttrs);
      return $element.removeAttr('up-dash');
    });
    return {
      visit: visit,
      follow: follow,
      resolve: resolve,
      childClicked: childClicked
    };
  })();

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
  up.form = (function() {
    var observe, submit, u;
    u = up.util;

    /**
    Submits a form using the Up.js flow:
    
        up.submit('form.new_user')
    
    Instead of loading a new page, the form is submitted via AJAX.
    The response is parsed for a CSS selector and the matching elements will
    replace corresponding elements on the current page.
    
    @method up.submit
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
      The duration of the transition. See [`up.morph`](/up.motion#up.morph).
    @param {Number} [options.delay]
      The delay before the transition starts. See [`up.morph`](/up.motion#up.morph).
    @param {String} [options.easing]
      The timing function that controls the transition's acceleration. [`up.morph`](/up.motion#up.morph).
    @param {Boolean} [options.cache]
      Whether to accept a cached response.
    @return {Promise}
      A promise for the AJAX response
     */
    submit = function(formOrSelector, options) {
      var $form, animateOptions, failureSelector, failureTransition, historyOption, httpMethod, request, successSelector, successTransition, successUrl, url, useCache;
      $form = $(formOrSelector).closest('form');
      options = u.options(options);
      successSelector = u.option(options.target, $form.attr('up-target'), 'body');
      failureSelector = u.option(options.failTarget, $form.attr('up-fail-target'), function() {
        return u.createSelectorFromElement($form);
      });
      historyOption = u.option(options.history, $form.attr('up-history'), true);
      successTransition = u.option(options.transition, $form.attr('up-transition'));
      failureTransition = u.option(options.failTransition, $form.attr('up-fail-transition'), successTransition);
      httpMethod = u.option(options.method, $form.attr('up-method'), $form.attr('data-method'), $form.attr('method'), 'post').toUpperCase();
      animateOptions = up.motion.animateOptions(options, $form);
      useCache = u.option(options.cache, $form.attr('up-cache'));
      url = u.option(options.url, $form.attr('action'), up.browser.url());
      $form.addClass('up-active');
      if (!up.browser.canPushState() && !u.castsToFalse(historyOption)) {
        $form.get(0).submit();
        return;
      }
      request = {
        url: url,
        type: httpMethod,
        data: $form.serialize(),
        selector: successSelector,
        cache: useCache
      };
      successUrl = function(xhr) {
        var currentLocation;
        url = historyOption ? u.castsToFalse(historyOption) ? false : u.isString(historyOption) ? historyOption : (currentLocation = u.locationFromXhr(xhr)) ? currentLocation : request.type === 'GET' ? request.url + '?' + request.data : void 0 : void 0;
        return u.option(url, false);
      };
      return u.ajax(request).always(function() {
        return $form.removeClass('up-active');
      }).done(function(html, textStatus, xhr) {
        var successOptions;
        successOptions = u.merge(animateOptions, {
          history: successUrl(xhr),
          transition: successTransition
        });
        return up.flow.implant(successSelector, html, successOptions);
      }).fail(function(xhr, textStatus, errorThrown) {
        var failureOptions, html;
        html = xhr.responseText;
        failureOptions = u.merge(animateOptions, {
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
    
        up.observe('input', { change: function(value, $input) {
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
    load on your server, you can use a `delay` option to wait before
    executing the callback:
    
        up.observe('input', {
          delay: 100,
          change: function(value, $input) { up.submit($input) }
        });
    
    
    @method up.observe
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
    given in `up-target` and replaces the selector content in the current page:
    
        <form method="post" action="/users" up-target=".main">
          ...
        </form>
    
    @method form[up-target]
    @ujs
    @param {String} up-target
      The selector to replace if the form submission is successful (200 status code).
    @param {String} [up-fail-target]
    @param {String} [up-transition]
    @param {String} [up-fail-transition]
    @param {String} [up-history]
    @param {String} [up-method]
      The HTTP method to be used to submit the form (`get`, `post`, `put`, `delete`, `patch`).
      Alternately you can use an attribute `data-method`
      ([Rails UJS](https://github.com/rails/jquery-ujs/wiki/Unobtrusive-scripting-support-for-jQuery))
      or `method` (vanilla HTML) for the same purpose.
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
    
    @method input[up-observe]
      The code to run when the field's value changes.
    @ujs
    @param {String} up-observe
     */
    up.awaken('[up-observe]', function($field) {
      return observe($field);
    });
    return {
      submit: submit,
      observe: observe
    };
  })();

  up.submit = up.form.submit;

  up.observe = up.form.observe;

}).call(this);

/**
Pop-up overlays
===============

Instead of linking to another page fragment, you can also choose
to "roll up" any target CSS selector in a popup overlay. 
Popup overlays close themselves if the user clicks somewhere outside the
popup area. 
  
For modal dialogs see [up.modal](/up.modal) instead.
  
\#\#\# Incomplete documentation!
  
We need to work on this page:

- Show the HTML structure of the popup elements, and how to style them via CSS
- Explain how to position popup using `up-origin`
- Explain how dialogs auto-close themselves when a fragment changes behind the popup layer
- Document method parameters
  
  
@class up.popup
 */

(function() {
  up.popup = (function() {
    var autoclose, close, config, createHiddenPopup, defaults, discardHistory, ensureInViewport, open, position, rememberHistory, source, u, updated;
    u = up.util;
    config = {
      openAnimation: 'fade-in',
      closeAnimation: 'fade-out',
      origin: 'bottom-right'
    };

    /**
    @method up.popup.defaults
    @param {String} options.animation
    @param {String} options.origin
     */
    defaults = function(options) {
      return u.extend(config, options);
    };
    position = function($link, $popup, origin) {
      var css, linkBox;
      linkBox = u.measure($link, {
        full: true
      });
      css = (function() {
        switch (origin) {
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
            return u.error("Unknown origin %o", origin);
        }
      })();
      $popup.attr('up-origin', origin);
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
      $popup.attr('up-previous-url', up.browser.url());
      return $popup.attr('up-previous-title', document.title);
    };
    discardHistory = function() {
      var $popup;
      $popup = $('.up-popup');
      $popup.removeAttr('up-previous-url');
      return $popup.removeAttr('up-previous-title');
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
    updated = function($link, $popup, origin, animation, animateOptions) {
      $popup.show();
      position($link, $popup, origin);
      return up.animate($popup, animation, animateOptions);
    };

    /**
    Opens a popup overlay.
    
    @method up.popup.open
    @param {Element|jQuery|String} elementOrSelector
    @param {String} [options.url]
    @param {String} [options.origin='bottom-right']
    @param {String} [options.animation]
      The animation to use when opening the popup.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate`](/up.motion#up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate`](/up.motion#up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate`](/up.motion#up.animate).
    @param {Boolean} [options.sticky=false]
      If set to `true`, the popup remains
      open even if the page changes in the background.
    @param {Object} [options.history=false]
     */
    open = function(linkOrSelector, options) {
      var $link, $popup, animateOptions, animation, history, origin, selector, sticky, url;
      $link = $(linkOrSelector);
      options = u.options(options);
      url = u.option(options.url, $link.attr('href'));
      selector = u.option(options.target, $link.attr('up-popup'), 'body');
      origin = u.option(options.origin, $link.attr('up-origin'), config.origin);
      animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation);
      sticky = u.option(options.sticky, $link.is('[up-sticky]'));
      history = up.browser.canPushState() ? u.option(options.history, $link.attr('up-history'), false) : false;
      animateOptions = up.motion.animateOptions(options, $link);
      close();
      $popup = createHiddenPopup($link, selector, sticky);
      return up.replace(selector, url, {
        history: history,
        insert: function() {
          return updated($link, $popup, origin, animation, animateOptions);
        }
      });
    };

    /**
    Returns the source URL for the fragment displayed
    in the current popup overlay, or `undefined` if no
    popup is open.
    
    @method up.popup.source
    @return {String}
      the source URL
     */
    source = function() {
      var $popup;
      $popup = $('.up-popup');
      if (!$popup.is('.up-destroying')) {
        return $popup.find('[up-source]').attr('up-source');
      }
    };

    /**
    Closes a currently opened popup overlay.
    Does nothing if no popup is currently open.
    
    @method up.popup.close
    @param {Object} options
      See options for [`up.animate`](/up.motion#up.animate).
     */
    close = function(options) {
      var $popup;
      $popup = $('.up-popup');
      if ($popup.length) {
        options = u.options(options, {
          animation: config.closeAnimation,
          url: $popup.attr('up-previous-url'),
          title: $popup.attr('up-previous-title')
        });
        return up.destroy($popup, options);
      }
    };
    autoclose = function() {
      if (!$('.up-popup').is('[up-sticky]')) {
        return close();
      }
    };

    /**
    Opens the target of this link in a popup overlay:
    
        <a href="/decks" up-modal=".deck_list">Switch deck</a>
    
    If the `up-sticky` attribute is set, the dialog does not auto-close
    if a page fragment below the popup overlay updates:
    
        <a href="/decks" up-popup=".deck_list">Switch deck</a>
        <a href="/settings" up-popup=".options" up-sticky>Settings</a>
    
    @method a[up-popup]
    @ujs
    @param [up-sticky]
    @param [up-origin]
     */
    up.on('click', 'a[up-popup]', function(event, $link) {
      event.preventDefault();
      if ($link.is('.up-current')) {
        return close();
      } else {
        return open($link);
      }
    });
    up.on('click', 'body', function(event, $body) {
      var $target;
      $target = $(event.target);
      if (!($target.closest('.up-popup').length || $target.closest('[up-popup]').length)) {
        return close();
      }
    });
    up.bus.on('fragment:ready', function($fragment) {
      if (!$fragment.closest('.up-popup').length) {
        discardHistory();
        return autoclose();
      }
    });
    up.magic.onEscape(function() {
      return close();
    });

    /**
    When an element with this attribute is clicked,
    a currently open popup is closed. 
    
    @method [up-close]
    @ujs
     */
    up.on('click', '[up-close]', function(event, $element) {
      if ($element.closest('.up-popup')) {
        return close();
      }
    });
    up.bus.on('framework:reset', close);
    return {
      open: open,
      close: close,
      source: source,
      defaults: defaults
    };
  })();

}).call(this);

/**
Modal dialogs
=============

Instead of linking to another page fragment, you can also choose
to open any target CSS selector in a modal dialog.
  
For small popup overlays ("dropdowns") see [up.popup](/up.popup) instead.

@class up.modal
 */

(function() {
  var __slice = [].slice;

  up.modal = (function() {
    var autoclose, close, config, createHiddenModal, defaults, discardHistory, open, rememberHistory, source, templateHtml, u, updated;
    u = up.util;
    config = {
      width: 'auto',
      height: 'auto',
      openAnimation: 'fade-in',
      closeAnimation: 'fade-out',
      closeLabel: 'X',
      template: function(config) {
        return "<div class=\"up-modal\">\n  <div class=\"up-modal-dialog\">\n    <div class=\"up-modal-close\" up-close>" + config.closeLabel + "</div>\n    <div class=\"up-modal-content\"></div>\n  </div>\n</div>";
      }
    };

    /**
    Sets default options for future modals.
    
    @method up.modal.defaults
    @param {Number} [options.width='auto']
      The width of the dialog in pixels.
      Defaults to `'auto'`, meaning that the dialog will grow to fit its contents.
    @param {Number} [options.height='auto']
      The height of the dialog in pixels.
      Defaults to `'auto'`, meaning that the dialog will grow to fit its contents.
    @param {String|Function(config)} [options.template]
      A string containing the HTML structure of the modal.
      You can supply an alternative template string, but make sure that it
      contains tags with the classes `up-modal`, `up-modal-dialog` and `up-modal-content`.
    
      You can also supply a function that returns a HTML string.
      The function will be called with the modal options (merged from these defaults
      and any per-open overrides) whenever a modal opens.
    @param {String} [options.closeLabel='X']
      The label of the button that closes the dialog.
    @param {String} [options.openAnimation='fade-in']
      The animation used to open the modal. The animation will be applied
      to both the dialog box and the overlay dimming the page.
    @param {String} [options.closeAnimation='fade-out']
      The animation used to close the modal. The animation will be applied
      to both the dialog box and the overlay dimming the page.
     */
    defaults = function(options) {
      return u.extend(config, options);
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
      var $popup;
      $popup = $('.up-modal');
      $popup.attr('up-previous-url', up.browser.url());
      return $popup.attr('up-previous-title', document.title);
    };
    discardHistory = function() {
      var $popup;
      $popup = $('.up-modal');
      $popup.removeAttr('up-previous-url');
      return $popup.removeAttr('up-previous-title');
    };
    createHiddenModal = function(selector, width, height, sticky) {
      var $content, $dialog, $modal, $placeholder;
      $modal = $(templateHtml());
      if (sticky) {
        $modal.attr('up-sticky', '');
      }
      $modal.attr('up-previous-url', up.browser.url());
      $modal.attr('up-previous-title', document.title);
      $dialog = $modal.find('.up-modal-dialog');
      if (u.isPresent(width)) {
        $dialog.css('width', width);
      }
      if (u.isPresent(height)) {
        $dialog.css('height', height);
      }
      $content = $dialog.find('.up-modal-content');
      $placeholder = u.$createElementFromSelector(selector);
      $placeholder.appendTo($content);
      $modal.appendTo(document.body);
      rememberHistory();
      $modal.hide();
      return $modal;
    };
    updated = function($modal, animation, animateOptions) {
      $modal.show();
      return up.animate($modal, animation, animateOptions);
    };

    /**
    Opens the given link's destination in a modal overlay:
    
        var $link = $('...');
        up.modal.open($link);
    
    Any option attributes for [`a[up-modal]`](#a.up-modal) will be honored.
    
    You can also open a URL directly like this:
    
        up.modal.open({ url: '/foo', target: '.list' })
    
    This will request `/foo`, extract the `.list` selector from the response
    and open the selected container in a modal dialog.
    
    @method up.modal.open
    @param {Element|jQuery|String} [elementOrSelector]
      The link to follow.
      Can be omitted if you give `options.url` instead.
    @param {String} [options.url]
      The URL to open.
      Can be omitted if you give `elementOrSelector` instead.
    @param {String} [options.target]
      The selector to extract from the response and open in a modal dialog.
    @param {Number} [options.width]
      The width of the dialog in pixels.
      By [default](#up.modal.defaults) the dialog will grow to fit its contents.
    @param {Number} [options.height]
      The width of the dialog in pixels.
      By [default](#up.modal.defaults) the dialog will grow to fit its contents.
    @param {Boolean} [options.sticky=false]
      If set to `true`, the modal remains
      open even if the page changes in the background.
    @param {Object} [options.history=true]
      Whether to add a browser history entry for the modal's source URL.
    @param {String} [options.animation]
      The animation to use when opening the modal.
    @param {Number} [options.duration]
      The duration of the animation. See [`up.animate`](/up.motion#up.animate).
    @param {Number} [options.delay]
      The delay before the animation starts. See [`up.animate`](/up.motion#up.animate).
    @param {String} [options.easing]
      The timing function that controls the animation's acceleration. [`up.animate`](/up.motion#up.animate).
    @return {Promise}
      A promise that will be resolved when the modal has finished loading.
     */
    open = function() {
      var $link, $modal, animateOptions, animation, args, height, history, options, selector, sticky, url, width;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (u.isObject(args[0]) && !u.isElement(args[0]) && !u.isJQuery(args[0])) {
        $link = u.nullJquery();
        options = args[0];
      } else {
        $link = $(args[0]);
        options = args[1];
      }
      options = u.options(options);
      url = u.option(options.url, $link.attr('href'), $link.attr('up-href'));
      selector = u.option(options.target, $link.attr('up-modal'), 'body');
      width = u.option(options.width, $link.attr('up-width'), config.width);
      height = u.option(options.height, $link.attr('up-height'), config.height);
      animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation);
      sticky = u.option(options.sticky, $link.is('[up-sticky]'));
      history = up.browser.canPushState() ? u.option(options.history, $link.attr('up-history'), true) : false;
      animateOptions = up.motion.animateOptions(options, $link);
      close();
      $modal = createHiddenModal(selector, width, height, sticky);
      return up.replace(selector, url, {
        history: history,
        insert: function() {
          return updated($modal, animation, animateOptions);
        }
      });
    };

    /**
    Returns the source URL for the fragment displayed in the current modal overlay,
    or `undefined` if no modal is currently open.
    
    @method up.modal.source
    @return {String}
      the source URL
     */
    source = function() {
      var $modal;
      $modal = $('.up-modal');
      if (!$modal.is('.up-destroying')) {
        return $modal.find('[up-source]').attr('up-source');
      }
    };

    /**
    Closes a currently opened modal overlay.
    Does nothing if no modal is currently open.
    
    @method up.modal.close
    @param {Object} options
      See options for [`up.animate`](/up.motion#up.animate)
     */
    close = function(options) {
      var $modal;
      $modal = $('.up-modal');
      if ($modal.length) {
        options = u.options(options, {
          animation: config.closeAnimation,
          url: $modal.attr('up-previous-url'),
          title: $modal.attr('up-previous-title')
        });
        return up.destroy($modal, options);
      }
    };
    autoclose = function() {
      if (!$('.up-modal').is('[up-sticky]')) {
        discardHistory();
        return close();
      }
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
    
    
    \#\#\#\# Customizing the dialog design
    
    Loading the Up.js stylesheet will give you a minimal dialog design:
    
    - Dialog contents are displayed in a white box that is centered vertically and horizontally.
    - There is a a subtle box shadow around the dialog
    - The box will grow to fit the dialog contents, but never grow larger than the screen
    - The box is placed over a semi-transparent background to dim the rest of the page
    - There is a button to close the dialog in the top-right corner
    
    The easiest way to change how the dialog looks is by overriding the [default CSS styles](https://github.com/makandra/upjs/blob/master/lib/assets/stylesheets/up/modal.css.sass).
    
    By default the dialog uses the following DOM structure (continuing the blog-switcher example from above):
    
        <div class="up-modal">
          <div class="up-modal-dialog">
            <div class="up-modal-close" up-close>X</div>
            <div class="up-modal-content">
              <ul class="blog-list">
                ...
              </ul>
            </div>
          </div>
        </div>
    
    If you want to change the design beyond CSS, you can
    configure Up.js to [use a different HTML structure](#up.modal.defaults).
    
    
    \#\#\#\# Closing behavior
    
    By default the dialog automatically closes
    *whenever a page fragment below the dialog is updated*.
    This is useful to have the dialog interact with the page that
    opened it, e.g. by updating parts of a larger form or by signing in a user
    and revealing additional information.
    
    To disable this behavior, give the opening link an `up-sticky` attribute:
    
        <a href="/settings" up-modal=".options" up-sticky>Settings</a>
    
    
    @method a[up-modal]
    @ujs
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
        return open($link);
      }
    });
    up.on('click', 'body', function(event, $body) {
      var $target;
      $target = $(event.target);
      if (!($target.closest('.up-modal-dialog').length || $target.closest('[up-modal]').length)) {
        return close();
      }
    });
    up.bus.on('fragment:ready', function($fragment) {
      if (!$fragment.closest('.up-modal').length) {
        return autoclose();
      }
    });
    up.magic.onEscape(function() {
      return close();
    });

    /**
    When this element is clicked, closes a currently open dialog.
    Does nothing if no modal is currently open.
    
    @method [up-close]
    @ujs
     */
    up.on('click', '[up-close]', function(event, $element) {
      if ($element.closest('.up-modal')) {
        return close();
      }
    });
    up.bus.on('framework:reset', close);
    return {
      open: open,
      close: close,
      source: source,
      defaults: defaults
    };
  })();

}).call(this);

/**
Tooltips
========
  
Elements that have an `up-tooltip` attribute will show the attribute
value in a tooltip when a user hovers over the element. 
  
\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Show the tooltip's HTML structure and how to style the elements
- Explain how to position tooltips using `up-origin`
- We should have a position about tooltips that contain HTML.
  

@class up.tooltip
 */

(function() {
  up.tooltip = (function() {
    var close, createElement, open, position, u;
    u = up.util;
    position = function($link, $tooltip, origin) {
      var css, linkBox, tooltipBox;
      linkBox = u.measure($link);
      tooltipBox = u.measure($tooltip);
      css = (function() {
        switch (origin) {
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
            return u.error("Unknown origin %o", origin);
        }
      })();
      $tooltip.attr('up-origin', origin);
      return $tooltip.css(css);
    };
    createElement = function(html) {
      return u.$createElementFromSelector('.up-tooltip').html(html).appendTo(document.body);
    };

    /**
    Opens a tooltip.
    
    @method up.tooltip.open
    @param {Element|jQuery|String} elementOrSelector
    @param {String} html
    @param {String} [options.origin='top']
    @param {String} [options.animation]
     */
    open = function(linkOrSelector, options) {
      var $link, $tooltip, animation, html, origin;
      if (options == null) {
        options = {};
      }
      $link = $(linkOrSelector);
      html = u.option(options.html, $link.attr('up-tooltip'), $link.attr('title'));
      origin = u.option(options.origin, $link.attr('up-origin'), 'top');
      animation = u.option(options.animation, $link.attr('up-animation'), 'fade-in');
      close();
      $tooltip = createElement(html);
      position($link, $tooltip, origin);
      return up.animate($tooltip, animation, options);
    };

    /**
    Closes a currently shown tooltip.
    Does nothing if no tooltip is currently shown.
    
    @method up.tooltip.close
    @param {Object} options
      See options for See options for [`up.animate`](/up.motion#up.animate).
     */
    close = function(options) {
      var $tooltip;
      $tooltip = $('.up-tooltip');
      if ($tooltip.length) {
        options = u.options(options, {
          animation: 'fade-out'
        });
        return up.destroy($tooltip, options);
      }
    };

    /**
    Displays a tooltip when hovering the mouse over this element:
    
        <a href="/decks" up-tooltip="Show all decks">Decks</a>
    
    You can also make an existing `title` attribute appear as a tooltip:
    
        <a href="/decks" title="Show all decks" up-tooltip>Decks</a>
    
    @method [up-tooltip]
    @ujs
     */
    up.awaken('[up-tooltip]', function($link) {
      $link.on('mouseover', function() {
        return open($link);
      });
      return $link.on('mouseout', function() {
        return close();
      });
    });
    up.on('click', 'body', function(event, $body) {
      return close();
    });
    up.bus.on('framework:reset', close);
    up.magic.onEscape(function() {
      return close();
    });
    return {
      open: open,
      close: close
    };
  })();

}).call(this);

/**
Fast interaction feedback
=========================
  
This module marks up link elements with classes indicating that
they are currently loading (class `up-active`) or linking
to the current location (class `up-current`).

This dramatically improves the perceived speed of your user interface
by providing instant feedback for user interactions.

The classes are added and removed automatically whenever
a page fragment is added, changed or destroyed through Up.js.

How Up.js computes the current location
---------------------------------------

From Up's point of view the "current" location is either:
  
- the URL displayed in the browser window's location bar
- the source URL of a currently opened [modal dialog](/up.modal)
- the source URL of a currently opened [popup overlay](/up.popup)

@class up.navigation
 */

(function() {
  up.navigation = (function() {
    var CLASS_ACTIVE, CLASS_CURRENT, SELECTORS_SECTION, SELECTOR_ACTIVE, SELECTOR_SECTION, SELECTOR_SECTION_INSTANT, enlargeClickArea, locationChanged, normalizeUrl, sectionClicked, sectionUrls, selector, u, unmarkActive;
    u = up.util;
    CLASS_ACTIVE = 'up-active';
    CLASS_CURRENT = 'up-current';
    SELECTORS_SECTION = ['a[href]', 'a[up-target]', '[up-follow]', '[up-modal]', '[up-popup]', '[up-href]'];
    SELECTOR_SECTION = SELECTORS_SECTION.join(', ');
    SELECTOR_SECTION_INSTANT = ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = SELECTORS_SECTION.length; _i < _len; _i++) {
        selector = SELECTORS_SECTION[_i];
        _results.push(selector + "[up-instant]");
      }
      return _results;
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
      var $link, attr, url, urls, _i, _len, _ref;
      urls = [];
      if ($link = up.link.resolve($section)) {
        _ref = ['href', 'up-follow', 'up-href'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attr = _ref[_i];
          if (url = u.presentAttr($link, attr)) {
            url = normalizeUrl(url);
            urls.push(url);
          }
        }
      }
      return urls;
    };
    locationChanged = function() {
      var currentUrls;
      currentUrls = u.stringSet([normalizeUrl(up.browser.url()), normalizeUrl(up.modal.source()), normalizeUrl(up.popup.source())]);
      return u.each($(SELECTOR_SECTION), function(section) {
        var $section, urls;
        $section = $(section);
        urls = sectionUrls($section);
        if (currentUrls.includesAny(urls)) {
          return $section.addClass(CLASS_CURRENT);
        } else {
          return $section.removeClass(CLASS_CURRENT);
        }
      });
    };
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
      if (!$section.is('[up-instant]')) {
        return sectionClicked($section);
      }
    });
    up.on('mousedown', SELECTOR_SECTION_INSTANT, function(event, $section) {
      if (u.isUnmodifiedMouseEvent(event)) {
        return sectionClicked($section);
      }
    });
    up.bus.on('fragment:ready', function() {
      unmarkActive();
      return locationChanged();
    });
    return up.bus.on('fragment:destroy', function($fragment) {
      if ($fragment.is('.up-modal, .up-popup')) {
        return locationChanged();
      }
    });
  })();

}).call(this);

/**
Content slots
=============

It can be useful to mark "slots" in your page layout where you expect
content to appear in the future.

For example, you might have

    <div up-slot class="alerts"></div>

    <script>
      up.awaken('.alerts', function ($element) {

        RELOAD SHOULD NOT CACHE

        setInterval(3000, function() { up.reload('.alerts') });
      });
    </script>

Seeing that the `.alerts` container is empty, Up.js will hide it:

    <div class="alerts" up-slot style="display: none"></div>

As soon as you

    <div class="alerts" up-slot>
      Meeting at 11:30 AM
    </div>


TODO: Write some documentation
  
@class up.slot
 */

(function() {
  up.slot = (function() {
    var check, hasContent, u;
    u = up.util;
    hasContent = function($slot) {
      return u.trim($slot.html()) !== '';
    };
    check = function($element) {
      return u.findWithSelf($element, '[up-slot]').each(function() {
        var $slot;
        $slot = $(this);
        if (!hasContent($slot)) {
          return $slot.hide();
        }
      });
    };

    /**
    Use this attribute to mark up empty element containers that
    you plan to update with content in the future.
    
    An element with this attribute is automatically hidden
    if it has no content, and is re-shown if it is updated with
    content.
    
    This is useful to prevent the element from applying unwanted
    margins to the surrounding page flow.
    
    @method [up-slot]
    @ujs
     */
    return up.bus.on('fragment:ready', check);
  })();

}).call(this);
(function() {
  up.browser.ensureRecentJquery();

  if (up.browser.isSupported()) {
    up.browser.ensureConsoleExists();
    up.bus.emit('framework:ready');
    $(document).on('ready', function() {
      return up.bus.emit('app:ready');
    });
  }

}).call(this);
