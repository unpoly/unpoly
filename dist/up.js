
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
    var $createElementFromSelector, ajax, castsToFalse, castsToTrue, clientSize, contains, copy, copyAttributes, createElement, createElementFromHtml, createSelectorFromElement, cssAnimate, detect, each, error, escapePressed, extend, findWithSelf, get, ifGiven, isArray, isBlank, isDefined, isFunction, isGiven, isHash, isJQuery, isMissing, isNull, isObject, isPresent, isPromise, isStandardPort, isString, isUndefined, last, measure, merge, nextFrame, normalizeUrl, option, options, prependGhost, presence, presentAttr, select, temporaryCss, unwrap;
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
      var anchor, normalized;
      anchor = isString(urlOrAnchor) ? $('<a>').attr({
        href: urlOrAnchor
      }).get(0) : unwrap(urlOrAnchor);
      normalized = anchor.protocol + "//" + anchor.hostname;
      if (!isStandardPort(anchor.protocol, anchor.port)) {
        normalized += ":" + anchor.port;
      }
      normalized += anchor.pathname;
      if ((options != null ? options.hash : void 0) === true) {
        normalized += anchor.hash;
      }
      if ((options != null ? options.search : void 0) !== false) {
        normalized += anchor.search;
      }
      return normalized;
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
      element.innerHTML = html;
      return element;
    };
    error = function() {
      var args, message;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      message = args.length === 1 && up.util.isString(args[0]) ? args[0] : JSON.stringify(args);
      console.log.apply(console, ["[UP] Error: " + message].concat(__slice.call(args)));
      alert(message);
      throw message;
    };
    createSelectorFromElement = function($element) {
      var classString, classes, id, klass, selector, _i, _len;
      console.log("Creating selector from element", $element);
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
      var htmlElementPattern, innerHtml, match;
      htmlElementPattern = /<html>((?:.|\n)*)<\/html>/i;
      innerHtml = void 0;
      if (match = html.match(htmlElementPattern)) {
        innerHtml = match[1];
      } else {
        innerHtml = "<html><body>" + html + "</body></html>";
      }
      return createElement('html', innerHtml);
    };
    extend = $.extend;
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
      return isMissing(object) || (object.length === 0);
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
    isJQuery = function(object) {
      return object instanceof jQuery;
    };
    isPromise = function(object) {
      return isFunction(object.then);
    };
    ifGiven = function(object) {
      if (isGiven(object)) {
        return object;
      }
    };
    isArray = Array.isArray;
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
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return detect(args, function(arg) {
        var value;
        value = arg;
        if (isFunction(value)) {
          value = value();
        }
        return isPresent(value);
      });
    };
    detect = function(array, tester) {
      var match;
      match = null;
      array.every(function(element) {
        if (tester(element)) {
          match = element;
          return false;
        } else {
          return true;
        }
      });
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
      oldCss = $element.css(Object.keys(css));
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

    /**
    Animates the given element's CSS properties using CSS transitions.
    
    @method up.util.cssAnimate
    @param {Element|jQuery|String} elementOrSelector
      The element to animate.
    @param {Object} lastFrame
      The CSS properties that should be transitioned to.
    @param {Number} [opts.duration=300]
      The duration of the animation, in milliseconds.
    @param {Number} [opts.delay=0]
      The delay before the animation starts, in milliseconds.
    @param {String} [opts.easing='ease']
      The timing function that controls the animation's acceleration.
      See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
      for a list of pre-defined timing functions.
    @return
      A promise for the animation's end.
     */
    cssAnimate = function(elementOrSelector, lastFrame, opts) {
      var $element, deferred, transition, withoutTransition;
      opts = options(opts, {
        duration: 300,
        delay: 0,
        easing: 'ease'
      });
      $element = $(elementOrSelector);
      deferred = $.Deferred();
      transition = {
        'transition-property': Object.keys(lastFrame).join(', '),
        'transition-duration': opts.duration + "ms",
        'transition-delay': opts.delay + "ms",
        'transition-timing-function': opts.easing
      };
      withoutTransition = temporaryCss($element, transition);
      $element.css(lastFrame);
      deferred.then(withoutTransition);
      setTimeout((function() {
        return deferred.resolve();
      }), opts.duration + opts.delay);
      return deferred.promise();
    };
    measure = function($element, options) {
      var box, offset, viewport;
      offset = $element.offset();
      box = {
        left: offset.left,
        top: offset.top,
        width: $element.outerWidth(),
        height: $element.outerHeight()
      };
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
      dimensions = measure($element);
      $ghost = $element.clone();
      $ghost.find('script').remove();
      $ghost.css({
        right: '',
        bottom: '',
        margin: 0,
        position: 'absolute'
      });
      $ghost.css(dimensions);
      $ghost.addClass('up-ghost');
      return $ghost.prependTo(document.body);
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
    return {
      presentAttr: presentAttr,
      createElement: createElement,
      normalizeUrl: normalizeUrl,
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
      isJQuery: isJQuery,
      isPromise: isPromise,
      isHash: isHash,
      ifGiven: ifGiven,
      unwrap: unwrap,
      nextFrame: nextFrame,
      measure: measure,
      temporaryCss: temporaryCss,
      cssAnimate: cssAnimate,
      prependGhost: prependGhost,
      escapePressed: escapePressed,
      copyAttributes: copyAttributes,
      findWithSelf: findWithSelf,
      contains: contains,
      isArray: isArray,
      castsToTrue: castsToTrue,
      castsToFalse: castsToFalse
    };
  })();

}).call(this);

/**
Browser interface
=================
  
@class up.browser
 */

(function() {
  up.browser = (function() {
    var url;
    url = function() {
      return location.href;
    };
    return {
      url: url
    };
  })();

}).call(this);

/**
Framework events
================
  
TODO: Write some documentation  

This class is kind-of internal and in flux.
This might eventually be rolled into regular document events.

- `app:ready`
- `fragment:ready` with arguments `($fragment)`
- `fragment:destroy` with arguments `($fragment)`

@class up.bus
 */

(function() {
  var __slice = [].slice;

  up.bus = (function() {
    var callbacksByEvent, callbacksFor, defaultCallbacksByEvent, emit, listen, reset, snapshot;
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
        _results.push(defaultCallbacksByEvent[event] = up.util.copy(callbacks));
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
      return callbacksByEvent = up.util.copy(defaultCallbacksByEvent);
    };

    /**
    Registers an event handler to be called when the given
    event is triggered.
    
    @method up.bus.listen
    @param {String} eventName
      The event name to match.
    @param {Function} handler
      The event handler to be called with the event arguments.
     */
    listen = function(eventName, handler) {
      return callbacksFor(eventName).push(handler);
    };

    /**
    Triggers an event.
    
    @method up.bus.emit
    @param {String} eventName
      The name of the event.
    @param {Anything...} args
      The arguments that describe the event.
     */
    emit = function() {
      var args, callbacks, eventName;
      eventName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      console.log("bus emitting", eventName, args);
      callbacks = callbacksFor(eventName);
      return up.util.each(callbacks, function(callback) {
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
Changing page fragments programmatically
========================================

TODO: Write some documentation


@class up.flow
 */

(function() {
  up.flow = (function() {
    var autofocus, destroy, elementsInserted, implant, implantSteps, reload, replace, reset, setSource, source, swapElements, u;
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
    @param {String} [options.title]
    @param {String|Boolean} [options.history=true]
      If a `String` is given, it is used as the URL the browser's location bar and history.
      If omitted or true, the `url` argument will be used.
      If set to `false`, the history will remain unchanged.
    @param {String|Boolean} [options.source=true]
    @param {String} [options.transition]
    @param {String} [options.historyMethod='push']
     */
    replace = function(selectorOrElement, url, options) {
      var selector;
      options = u.options(options);
      selector = u.presence(selectorOrElement) ? selectorOrElement : u.createSelectorFromElement($(selectorOrElement));
      if (u.isMissing(options.history) || u.castsToTrue(options.history)) {
        options.history = url;
      }
      if (u.isMissing(options.source) || u.castsToTrue(options.source)) {
        options.source = url;
      }
      return u.get(url, {
        selector: selector
      }).done(function(html) {
        return implant(selector, html, options);
      }).fail(u.error);
    };

    /**
    Replaces the given selector with the same selector from the given HTML string.
    
    @method up.flow.implant
    @protected
    @param {String} selector
    @param {String} html
    @param {String} [options.title]
    @param {String} [options.source]
    @param {Object} [options.transition]
    @param {String} [options.history]
    @param {String} [options.historyMethod='push']
     */
    implant = function(selector, html, options) {
      var $new, $old, fragment, htmlElement, step, _i, _len, _ref, _ref1, _results;
      options = u.options(options, {
        historyMethod: 'push'
      });
      htmlElement = u.createElementFromHtml(html);
      options.title || (options.title = (_ref = htmlElement.querySelector("title")) != null ? _ref.textContent : void 0);
      _ref1 = implantSteps(selector, options);
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        step = _ref1[_i];
        $old = u.presence($(".up-popup " + step.selector)) || u.presence($(".up-modal " + step.selector)) || u.presence($(step.selector));
        if (fragment = htmlElement.querySelector(step.selector)) {
          $new = $(fragment);
          _results.push(swapElements($old, $new, step.pseudoClass, step.transition, options));
        } else {
          _results.push(u.error("Could not find selector (" + step.selector + ") in response (" + html + ")"));
        }
      }
      return _results;
    };
    elementsInserted = function($new, options) {
      return $new.each(function() {
        var $element;
        $element = $(this);
        if (typeof options.insert === "function") {
          options.insert($element);
        }
        if (options.history) {
          if (options.title) {
            document.title = options.title;
          }
          up.history[options.historyMethod](options.history);
        }
        setSource($element, u.presence(options.source) || options.history);
        autofocus($element);
        return up.ready($element);
      });
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
        return up.animate($new, transition);
      } else {
        return destroy($old, {
          animation: function() {
            $new.insertAfter($old);
            elementsInserted($new, options);
            if ($old.is('body') && transition !== 'none') {
              u.error('Cannot apply transitions to body-elements', transition);
            }
            return up.morph($old, $new, transition);
          }
        });
      }
    };
    implantSteps = function(selector, options) {
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
    
    @method up.destroy
    @param {String|Element|jQuery} selectorOrElement 
    @param {String|Function|Object} [options.animation]
    @param {String} [options.url]
    @param {String} [options.title]
     */
    destroy = function(selectorOrElement, options) {
      var $element, animationPromise;
      $element = $(selectorOrElement);
      options = u.options(options, {
        animation: 'none'
      });
      $element.addClass('up-destroying');
      if (u.isPresent(options.url)) {
        up.history.push(options.url);
      }
      if (u.isPresent(options.title)) {
        document.title = options.title;
      }
      up.bus.emit('fragment:destroy', $element);
      animationPromise = u.presence(options.animation, u.isPromise) || up.motion.animate($element, options.animation);
      return animationPromise.then(function() {
        return $element.remove();
      });
    };

    /**
    Replaces the given selector or element with a fresh copy
    fetched from the server.
    
    @method up.reload
    @param {String|Element|jQuery} selectorOrElement
     */
    reload = function(selectorOrElement) {
      var sourceUrl;
      sourceUrl = source(selectorOrElement);
      return replace(selectorOrElement, sourceUrl);
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
  
TODO: Write some documentation  
  
@class up.magic
 */

(function() {
  up.magic = (function() {
    var DESTROYABLE_CLASS, DESTROYER_KEY, awaken, awakeners, compile, defaultAwakeners, defaultLiveDescriptions, destroy, live, liveDescriptions, onEscape, ready, reset, snapshot, util;
    util = up.util;
    DESTROYABLE_CLASS = 'up-destroyable';
    DESTROYER_KEY = 'up-destroyer';

    /**
    Binds an event handler to the document,
    which will be executed whenever the given event
    is triggered on the given selector.
    
    @method up.on
    @param {String} events
      A space-separated list of event names to bind.
    @param {String} selector
      The selector an on which the event must be triggered.
    @param {Function} behavior
      The handler that should be called.
     */
    liveDescriptions = [];
    defaultLiveDescriptions = null;
    live = function(events, selector, behavior) {
      var description, _ref;
      description = [
        events, selector, function(event) {
          return behavior.apply(this, [event, $(this)]);
        }
      ];
      liveDescriptions.push(description);
      return (_ref = $(document)).on.apply(_ref, description);
    };

    /**
    Registers a function to be called whenever an element with
    the given selector is inserted into the DOM through Up.js.
    
    @method up.awaken
    @param {String} selector
      The selector to match.
    @param {Function($element)} awakener
      The function to call when a matching element is inserted.
      The function takes the new element as the first argument (as a jQuery object).
    
      The function may return another function that destroys the awakened
      object when it is removed from the DOM, by clearing global state such as
      time-outs and event handlers bound to the document.
     */
    awakeners = [];
    defaultAwakeners = null;
    awaken = function(selector, awakener) {
      return awakeners.push({
        selector: selector,
        callback: awakener
      });
    };
    compile = function($fragment) {
      var awakener, _i, _len, _results;
      console.log("Compiling fragment", $fragment, "with", awakeners);
      _results = [];
      for (_i = 0, _len = awakeners.length; _i < _len; _i++) {
        awakener = awakeners[_i];
        console.log("running", awakener.selector, "on", $fragment);
        _results.push(util.findWithSelf($fragment, awakener.selector).each(function() {
          var $element, destroyer;
          $element = $(this);
          destroyer = awakener.callback.apply(this, [$element]);
          console.log("got destroyer", destroyer);
          if (util.isFunction(destroyer)) {
            $element.addClass(DESTROYABLE_CLASS);
            return $element.data(DESTROYER_KEY, destroyer);
          }
        }));
      }
      return _results;
    };
    destroy = function($fragment) {
      return util.findWithSelf($fragment, "." + DESTROYABLE_CLASS).each(function() {
        var $element, destroyer;
        $element = $(this);
        destroyer = $element.data(DESTROYER_KEY);
        return destroyer();
      });
    };

    /**
    Makes a snapshot of the currently registered event listeners,
    to later be restored through [`up.bus.reset`](/up.bus#up.bus.reset).
    
    @private
    @method up.magic.snapshot
     */
    snapshot = function() {
      defaultLiveDescriptions = util.copy(liveDescriptions);
      return defaultAwakeners = util.copy(awakeners);
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
        if (!util.contains(defaultLiveDescriptions, description)) {
          (_ref = $(document)).off.apply(_ref, description);
        }
      }
      liveDescriptions = util.copy(defaultLiveDescriptions);
      return awakeners = util.copy(defaultAwakeners);
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
        if (util.escapePressed(event)) {
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
      onEscape: onEscape
    };
  })();

  up.awaken = up.magic.awaken;

  up.on = up.magic.on;

  up.ready = up.magic.ready;

}).call(this);

/**
Manipulating the browser history
=======
  
TODO: Write some documentation
  
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
    replace = function(url) {
      if (!isCurrentUrl(url)) {
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
      method += "State";
      return window.history[method]({
        fromUp: true
      }, '', url);
    };
    pop = function(event) {
      var state;
      state = event.originalEvent.state;
      console.log("popping state", state);
      console.log("current href", up.browser.url());
      if (state != null ? state.fromUp : void 0) {
        return up.visit(up.browser.url(), {
          historyMethod: 'replace'
        });
      } else {
        return console.log("null state");
      }
    };
    setTimeout((function() {
      $(window).on("popstate", pop);
      return replace(up.browser.url());
    }), 200);
    return {
      push: push,
      replace: replace
    };
  })();

}).call(this);

/**
Animation and transitions
=========================
  
TODO: Write some documentation.
  
@class up.motion
 */

(function() {
  up.motion = (function() {
    var animate, animation, animations, assertIsPromise, defaultAnimations, defaultOptions, defaultTransitions, findAnimation, morph, none, reset, snapshot, transition, transitions, u, withGhosts;
    u = up.util;
    defaultOptions = {
      duration: 300,
      delay: 0,
      easing: 'ease'
    };
    animations = {};
    defaultAnimations = {};
    transitions = {};
    defaultTransitions = {};

    /**
    Animates an element.
    
    The following animations are pre-registered:
    
    - `fade-in`
    - `fade-out`
    - `move-to-top`
    - `move-from-top`
    - `move-to-bottom`
    - `move-from-bottom`
    - `move-to-left`
    - `move-from-left`
    - `move-to-right`
    - `move-from-right`
    - `none`
    
    @method up.animate
    @param {Element|jQuery|String} elementOrSelector
    @param {String|Function|Object} animation
    @param {Number} [options.duration]
    @param {String} [options.easing]
    @param {Number} [options.delay]
    @return {Promise}
      A promise for the animation's end.
     */
    animate = function(elementOrSelector, animation, options) {
      var $element;
      $element = $(elementOrSelector);
      options = u.options(options, defaultOptions);
      if (u.isFunction(animation)) {
        return assertIsPromise(animation($element, options), ["Animation did not return a Promise", animation]);
      } else if (u.isString(animation)) {
        return animate($element, findAnimation(animation), options);
      } else if (u.isHash(animation)) {
        return u.cssAnimate($element, animation, options);
      } else {
        return u.error("Unknown animation type", animation);
      }
    };
    findAnimation = function(name) {
      return animations[name] || u.error("Unknown animation", animation);
    };
    withGhosts = function($old, $new, block) {
      var $newGhost, $oldGhost, newCssMemo, promise;
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
      newCssMemo = u.temporaryCss($new, {
        display: 'none'
      });
      promise = block($oldGhost, $newGhost);
      return promise.then(function() {
        $oldGhost.remove();
        $newGhost.remove();
        $old.css({
          display: 'none'
        });
        return newCssMemo();
      });
    };
    assertIsPromise = function(object, messageParts) {
      u.isPromise(object) || u.error.apply(u, messageParts);
      return object;
    };

    /**
    Performs a transition between two elements.
    
    The following transitions  are pre-registered:
    
    - `cross-fade`
    - `move-top`
    - `move-bottom`
    - `move-left`
    - `move-right`
    - `none`
    
    You can also compose a transition from two animation names
    separated by a slash character (`/`):
    
    - `move-to-bottom/fade-in`
    - `move-to-left/move-from-top`
    
    @method up.morph
    @param {Element|jQuery|String} source
    @param {Element|jQuery|String} target
    @param {Function|String} transitionOrName
    @param {Number} [options.duration]
    @param {String} [options.easing]
    @param {Number} [options.delay]
    @return {Promise}
      A promise for the transition's end.
     */
    morph = function(source, target, transitionOrName, options) {
      var $new, $old, animation, parts, transition;
      options = u.options(defaultOptions);
      $old = $(source);
      $new = $(target);
      transition = u.presence(transitionOrName, u.isFunction) || transitions[transitionOrName];
      if (transition) {
        return withGhosts($old, $new, function($oldGhost, $newGhost) {
          return assertIsPromise(transition($oldGhost, $newGhost, options), ["Transition did not return a promise", transitionOrName]);
        });
      } else if (animation = animations[transitionOrName]) {
        $old.hide();
        return animate($new, animation, options);
      } else if (u.isString(transitionOrName) && transitionOrName.indexOf('/') >= 0) {
        parts = transitionOrName.split('/');
        transition = function($old, $new, options) {
          return $.when(animate($old, parts[0], options), animate($new, parts[1], options));
        };
        return morph($old, $new, transition, options);
      } else {
        return u.error("Unknown transition: " + transitionOrName);
      }
    };

    /**
    Defines a named transition.
    
    @method up.transition
    @param {String} name
    @param {Function} transition
     */
    transition = function(name, transition) {
      return transitions[name] = transition;
    };

    /**
    Defines a named animation.
    
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
    Returns a no-op animation or transition which has no visual effects
    and completes instantly.
    
    @method up.motion.none
    @return {Promise}
      A resolved promise
     */
    none = function() {
      var deferred;
      deferred = $.Deferred();
      deferred.resolve();
      return deferred.promise();
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
    animation('move-to-top', function($ghost, options) {
      $ghost.css({
        'margin-top': '0%'
      });
      return animate($ghost, {
        'margin-top': '-100%'
      }, options);
    });
    animation('move-from-top', function($ghost, options) {
      $ghost.css({
        'margin-top': '-100%'
      });
      return animate($ghost, {
        'margin-top': '0%'
      }, options);
    });
    animation('move-to-bottom', function($ghost, options) {
      $ghost.css({
        'margin-top': '0%'
      });
      return animate($ghost, {
        'margin-top': '100%'
      }, options);
    });
    animation('move-from-bottom', function($ghost, options) {
      $ghost.css({
        'margin-top': '100%'
      });
      return animate($ghost, {
        'margin-top': '0%'
      }, options);
    });
    animation('move-to-left', function($ghost, options) {
      $ghost.css({
        'margin-left': '0%'
      });
      return animate($ghost, {
        'margin-left': '-100%'
      }, options);
    });
    animation('move-from-left', function($ghost, options) {
      $ghost.css({
        'margin-left': '-100%'
      });
      return animate($ghost, {
        'margin-left': '0%'
      }, options);
    });
    animation('move-to-right', function($ghost, options) {
      $ghost.css({
        'margin-left': '0%'
      });
      return animate($ghost, {
        'margin-left': '100%'
      }, options);
    });
    animation('move-from-right', function($ghost, options) {
      $ghost.css({
        'margin-left': '100%'
      });
      return animate($ghost, {
        'margin-left': '0%'
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
      return $.when(animate($old, 'move-to-left', options), animate($new, 'move-from-right', options));
    });
    transition('move-right', function($old, $new, options) {
      return $.when(animate($old, 'move-to-right', options), animate($new, 'move-from-left', options));
    });
    transition('move-up', function($old, $new, options) {
      return $.when(animate($old, 'move-to-top', options), animate($new, 'move-from-bottom', options));
    });
    transition('move-down', function($old, $new, options) {
      return $.when(animate($old, 'move-to-bottom', options), animate($new, 'move-from-top', options));
    });
    transition('cross-fade', function($old, $new, options) {
      return $.when(animate($old, 'fade-out', options), animate($new, 'fade-in', options));
    });
    up.bus.on('framework:ready', snapshot);
    up.bus.on('framework:reset', reset);
    return {
      morph: morph,
      animate: animate,
      transition: transition,
      animation: animation,
      none: none
    };
  })();

  up.transition = up.motion.transition;

  up.animation = up.motion.animation;

  up.morph = up.motion.morph;

  up.animate = up.motion.animate;

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

Slow, full page loads. White flash during loading.


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
    var follow, resolve, resolveUrl, u, visit;
    u = up.util;

    /**
    Visits the given URL without a full page load.
    This is done by fetching `url` through an AJAX request
    and replacing the current `<body>` element with the response's `<body>` element.
    
    @method up.visit
    @param {String} url
      The URL to visit.
    @param {Object} options
      See options for [`up.replace`](/up.flow#up.replace)
    @example
        up.visit('/users')
     */
    visit = function(url, options) {
      console.log("up.visit", url);
      return up.replace('body', url, options);
    };

    /**
    Follows the given link via AJAX and replaces a CSS selector in the current page
    with corresponding elements from a new page fetched from the server.
    
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
     */
    follow = function(link, options) {
      var $link, selector, url;
      $link = $(link);
      options = u.options(options);
      url = u.option($link.attr('href'), $link.attr('up-follow'));
      selector = u.option(options.target, $link.attr('up-target'), 'body');
      options.transition = u.option(options.transition, $link.attr('up-transition'), $link.attr('up-animation'));
      options.history = u.option(options.history, $link.attr('up-history'));
      return up.replace(selector, url, options);
    };
    resolve = function(element) {
      var $element;
      $element = $(element);
      if ($element.is('a') || u.presentAttr($element, 'up-follow')) {
        return $element;
      } else {
        return $element.find('a:first');
      }
    };
    resolveUrl = function(element) {
      var $link;
      if ($link = resolve(element)) {
        return u.option($link.attr('href'), $link.attr('up-follow'));
      }
    };

    /**
    Follows this link via AJAX and replaces a CSS selector in the current page
    with corresponding elements from a new page fetched from the server.
    
        <a href="/users" up-target=".main">User list</a>
    
    @method a[up-target]
    @ujs
    @param {String} up-target
      The CSS selector to replace
     */
    up.on('click', 'a[up-target]', function(event, $link) {
      event.preventDefault();
      return follow($link);
    });

    /**
    If applied on a link, Follows this link via AJAX and replaces the
    current `<body>` element with the response's `<body>` element
    
        <a href="/users" up-follow>User list</a>
    
    You can also apply `[up-follow]` to any element that contains a link
    in order to enlarge the link's click area:
    
        <div class="notification" up-follow>
           Record was saved!
           <a href="/records">Close</a>
        </div>
    
    In the example above, clicking anywhere within `.notification` element
    would follow the `Close` link.
    
    @method [up-follow]
    @ujs
    @param {String} [up-follow]
     */
    up.on('click', '[up-follow]', function(event, $element) {
      var childLinkClicked;
      childLinkClicked = function() {
        var $target, $targetLink;
        $target = $(event.target);
        $targetLink = $target.closest('a, [up-follow]');
        return $targetLink.length && $element.find($targetLink).length;
      };
      if (!childLinkClicked()) {
        event.preventDefault();
        return follow(resolve($element));
      }
    });
    return {
      visit: visit,
      follow: follow,
      resolve: resolve,
      resolveUrl: resolveUrl
    };
  })();

  up.visit = up.link.visit;

  up.follow = up.link.follow;

}).call(this);

/**
Forms and controls
==================
  
TODO: Write some documentation
  
@class up.form
 */

(function() {
  up.form = (function() {
    var observe, submit, u;
    u = up.util;

    /**
    Submits a form using the Up.js flow:
    
        up.submit('form.new_user')
    
    @method up.submit
    @param {Element|jQuery|String} formOrSelector
      A reference or selector for the form to submit.
      If the argument points to an element that is not a form,
      Up.js will search its ancestors for the closest form.
    @param {String} [options.target]
    @param {String} [options.failTarget]
    @param {Boolean|String} [options.history=true]
      Successful form submissions will add a history entry and change the browser's
      location bar if the form either uses the `GET` method or the response redirected
      to another page (this requires the `upjs-rails` gem).
      If want to prevent history changes in any case, set this to `false`.
      If you pass a `String`, it is used as the URL for the browser history.
    @param {String} [options.transition]
    @param {String} [options.failTransition]
    @return {Promise}
      A promise for the AJAX response
     */
    submit = function(formOrSelector, options) {
      var $form, failureSelector, failureTransition, historyOption, request, successSelector, successTransition, successUrl, _ref;
      $form = $(formOrSelector).closest('form');
      options = u.options(options);
      successSelector = u.option(options.target, $form.attr('up-target'), 'body');
      failureSelector = u.option(options.failTarget, $form.attr('up-fail-target'), function() {
        return u.createSelectorFromElement($form);
      });
      historyOption = u.option(options.history, $form.attr('up-history'), true);
      successTransition = u.option(options.transition, $form.attr('up-transition'));
      failureTransition = u.option(options.failTransition, $form.attr('up-fail-transition'));
      $form.addClass('up-active');
      request = {
        url: $form.attr('action') || up.browser.url(),
        type: ((_ref = $form.attr('method')) != null ? _ref.toUpperCase() : void 0) || 'POST',
        data: $form.serialize(),
        selector: successSelector
      };
      successUrl = function(xhr) {
        var redirectLocation, url;
        url = historyOption ? u.isString(historyOption) ? historyOption : (redirectLocation = xhr.getResponseHeader('X-Up-Previous-Redirect-Location')) ? redirectLocation : request.type === 'GET' ? request.url + '?' + request.data : void 0 : void 0;
        return u.option(url, false);
      };
      return u.ajax(request).always(function() {
        return $form.removeClass('up-active');
      }).done(function(html, textStatus, xhr) {
        return up.flow.implant(successSelector, html, {
          history: successUrl(xhr),
          transition: successTransition
        });
      }).fail(function(xhr, textStatus, errorThrown) {
        var html;
        html = xhr.responseText;
        return up.flow.implant(failureSelector, html, {
          transition: failureTransition
        });
      });
    };

    /**
    Observes an input field by periodic polling its value.
    Executes code when the value changes.
    
        up.observe('input', { change: function(value, $input) {
          up.submit($input)
        } });
    
    This is useful for observing text fields while the user is typing,
    since browsers will only fire a `change` event once the user
    blurs the text field.
    
    @method up.observe
    @param {Element|jQuery|String} fieldOrSelector
    @param {Function(value, $field)|String} options.change
      The callback to execute when the field's value changes.
      If given as a function, it must take two arguments (`value`, `$field`).
      If given as a string, it will be evaled as Javascript code in a context where
      (`value`, `$field`) are set.
    @param {Number} [options.frequency=500]
     */
    observe = function(fieldOrSelector, options) {
      var $field, callback, check, clearTimer, codeOnChange, knownValue, resetTimer, startTimer, timer;
      $field = $(fieldOrSelector);
      options = u.options(options, {
        frequency: 500
      });
      knownValue = null;
      timer = null;
      callback = null;
      if (codeOnChange = $field.attr('up-observe')) {
        callback = function(value, $field) {
          return eval(codeOnChange);
        };
      } else if (options.change) {
        callback = options.change;
      } else {
        u.error('observe: No change callback given');
      }
      check = function() {
        var skipCallback, value;
        value = $field.val();
        skipCallback = _.isNull(knownValue);
        if (knownValue !== value) {
          knownValue = value;
          if (!skipCallback) {
            return callback.apply($field.get(0), [value, $field]);
          }
        }
      };
      resetTimer = function() {
        if (timer) {
          clearTimer();
          return startTimer();
        }
      };
      clearTimer = function() {
        clearInterval(timer);
        return timer = null;
      };
      startTimer = function() {
        return timer = setInterval(check, options.frequency);
      };
      $field.bind("keyup click mousemove", resetTimer);
      check();
      startTimer();
      return clearTimer;
    };

    /**
    Submits the form through AJAX, searches the response for the selector
    given in `up-target` and replaces the selector content in the current page:
    
        <form method="POST" action="/users" up-target=".main">
          ...
        </form>
    
    @method form[up-target]
    @ujs
    @param {String} up-target
    @param {String} [up-fail-target]
    @param {String} [up-history]
    @param {String} [up-transition]
    @param {String} [up-fail-transition]
     */
    up.on('submit', 'form[up-target]', function(event, $form) {
      event.preventDefault();
      return submit($form);
    });

    /**
    Observes this form control by periodically polling its value.
    Executes the given Javascript if the value changes:
    
        <form method="GET" action="/search">
          <input type="query" up-observe="up.form.submit(this)">
        </form>
    
    This is useful for observing text fields while the user is typing,
    since browsers will only fire a `change` event once the user
    blurs the text field.
    
    @method input[up-observe]
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
  
For modal dialogs see [up.modal](/up.modal).
  
@class up.popup
 */

(function() {
  up.popup = (function() {
    var autoclose, close, config, createHiddenPopup, defaults, ensureInViewport, open, position, source, u, updated;
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
            return u.error("Unknown origin", origin);
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
    createHiddenPopup = function($link, selector, sticky) {
      var $placeholder, $popup;
      $popup = u.$createElementFromSelector('.up-popup');
      if (sticky) {
        $popup.attr('up-sticky', '');
      }
      $popup.attr('up-previous-url', up.browser.url());
      $popup.attr('up-previous-title', document.title);
      $placeholder = u.$createElementFromSelector(selector);
      $placeholder.appendTo($popup);
      $popup.appendTo(document.body);
      $popup.hide();
      return $popup;
    };
    updated = function($link, $popup, origin, animation) {
      $popup.show();
      position($link, $popup, origin);
      return up.animate($popup, animation);
    };

    /**
    Opens a popup overlay.
    
    @method up.popup.open
    @param {Element|jQuery|String} elementOrSelector
    @param {String} [options.origin='bottom-right']
    @param {String} [options.animation]
    @param {Boolean} [options.sticky=false]
      If set to `true`, the popup remains
      open even if the page changes in the background.
    @param {Object} [options.history=false]
     */
    open = function(linkOrSelector, options) {
      var $link, $popup, animation, history, origin, selector, sticky, url;
      $link = $(linkOrSelector);
      options = u.options(options);
      url = u.option($link.attr('href'));
      selector = u.option(options.target, $link.attr('up-popup'), 'body');
      origin = u.option(options.origin, $link.attr('up-origin'), config.origin);
      animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation);
      sticky = u.option(options.sticky, $link.is('[up-sticky]'));
      history = u.option(options.history, $link.attr('up-history'), false);
      close();
      $popup = createHiddenPopup($link, selector, sticky);
      return up.replace(selector, url, {
        history: history,
        insert: function() {
          return updated($link, $popup, origin, animation);
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
    @param up-target
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

TODO: Write some documentation

@class up.modal
 */

(function() {
  up.modal = (function() {
    var autoclose, close, config, createHiddenModal, defaults, open, source, templateHtml, u, updated;
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
    @method up.modal.defaults
    @param {Number} options.width
    @param {Number} options.height
    @param {String|Function(config)} options.template
    @param {String} options.closeLabel
    @param {String} options.openAnimation
    @param {String} options.closeAnimation
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
      $modal.hide();
      return $modal;
    };
    updated = function($modal, animation) {
      $modal.show();
      return up.animate($modal, animation);
    };

    /**
    Opens a modal overlay.
    
    @method up.modal.open
    @param {Element|jQuery|String} elementOrSelector
    @param {Number} [options.width]
    @param {Number} [options.height]
    @param {String} [options.origin='bottom-right']
    @param {String} [options.animation]
    @param {Boolean} [options.sticky=false]
      If set to `true`, the modal remains
      open even if the page changes in the background.
    @param {Object} [options.history=true]
     */
    open = function(linkOrSelector, options) {
      var $link, $modal, animation, height, history, selector, sticky, url, width;
      $link = $(linkOrSelector);
      options = u.options(options);
      url = u.option($link.attr('href'));
      selector = u.option(options.target, $link.attr('up-modal'), 'body');
      width = u.option(options.width, $link.attr('up-width'), config.width);
      height = u.option(options.height, $link.attr('up-height'), config.height);
      animation = u.option(options.animation, $link.attr('up-animation'), config.openAnimation);
      sticky = u.option(options.sticky, $link.is('[up-sticky]'));
      history = u.option(options.history, $link.attr('up-history'), true);
      close();
      $modal = createHiddenModal(selector, width, height, sticky);
      return up.replace(selector, url, {
        history: history,
        insert: function() {
          return updated($modal, animation);
        }
      });
    };

    /**
    Returns the source URL for the fragment displayed
    in the current modal overlay, or `undefined` if no
    modal is open.
    
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
        return close();
      }
    };

    /**
    Opens the target of this link in a modal dialog:
    
        <a href="/decks" up-modal=".deck_list">Switch deck</a>
    
    If the `up-sticky` attribute is set, the dialog does not auto-close
    if a page fragment below the dialog updates:
    
        <a href="/settings" up-modal=".options" up-sticky>Settings</a>
    
    @method a[up-modal]
    @ujs
    @param up-target
    @param [up-sticky]
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
      if (!($target.closest('.up-dialog').length || $target.closest('[up-modal]').length)) {
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
    
    @method [up-close]
    @ujs
     */
    up.on('click', '[up-close]', function(event, $element) {
      if ($element.closest('.up-modal')) {
        return close();
      }
    });
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
  
TODO: Write some documentation.

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
            return u.error("Unknown origin", origin);
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
      html = u.option(options.html, $link.attr('up-tooltip'));
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
    var CLASS_ACTIVE, CLASS_CURRENT, SELECTOR_ACTIVE, SELECTOR_SECTION, enlargeClickArea, locationChanged, sectionClicked, unmarkActive;
    CLASS_ACTIVE = 'up-active';
    CLASS_CURRENT = 'up-current';
    SELECTOR_SECTION = 'a[href], a[up-target], [up-follow], [up-modal], [up-popup]';
    SELECTOR_ACTIVE = "." + CLASS_ACTIVE;
    locationChanged = function() {
      var modalLocation, popupLocation, windowLocation;
      windowLocation = up.util.normalizeUrl(up.browser.url(), {
        search: false
      });
      modalLocation = up.modal.source();
      popupLocation = up.popup.source();
      return up.util.each($(SELECTOR_SECTION), function(section) {
        var $section, url;
        $section = $(section);
        url = up.link.resolveUrl($section);
        url = up.util.normalizeUrl(url, {
          search: false
        });
        if (url === windowLocation || url === modalLocation || url === popupLocation) {
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
      return up.util.presence($section.parents(SELECTOR_SECTION)) || $section;
    };
    unmarkActive = function() {
      return $(SELECTOR_ACTIVE).removeClass(CLASS_ACTIVE);
    };
    up.on('click', SELECTOR_SECTION, function(event, $section) {
      return sectionClicked($section);
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
Markers
=======
  
TODO: Write some documentation
  
@class up.marker
 */

(function() {
  up.marker = (function() {
    var check, hasContent;
    hasContent = function($marker) {
      return $marker.html().trim() !== '';
    };
    check = function($element) {
      return up.util.findWithSelf($element, '[up-marker]').each(function() {
        var $marker;
        $marker = $(this);
        if (!hasContent($marker)) {
          return $marker.hide();
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
    
    @method [up-marker]
    @ujs
     */
    return up.bus.on('fragment:ready', check);
  })();

}).call(this);
(function() {
  up.bus.emit('framework:ready');

  $(document).on('ready', function() {
    return up.bus.emit('app:ready');
  });

}).call(this);
