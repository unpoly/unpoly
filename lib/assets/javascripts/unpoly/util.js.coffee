###*
Utility functions
=================
  
Unpoly comes with a number of utility functions
that might save you from loading something like [Underscore.js](http://underscorejs.org/).

@class up.util
###
up.util = (($) ->

  ###*
  A function that does nothing.

  @function up.util.noop
  @experimental
  ###
  noop = $.noop

  ###*
  @function up.util.memoize
  @internal
  ###
  memoize = (func) ->
    cache = undefined
    cached = false
    (args...) ->
      if cached
        cache
      else
        cached = true
        cache = func(args...)

  ###*
  Returns if the given port is the default port for the given protocol.

  @function up.util.isStandardPort
  @internal
  ###  
  isStandardPort = (protocol, port) ->
    port = port.toString()
    ((port == "" || port == "80") && protocol == 'http:') || (port == "443" && protocol == 'https:')

  ###*
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
  ###
  normalizeUrl = (urlOrAnchor, options) ->
    anchor = parseUrl(urlOrAnchor)
    normalized = anchor.protocol + "//" + anchor.hostname
    normalized += ":#{anchor.port}" unless isStandardPort(anchor.protocol, anchor.port)
    pathname = anchor.pathname
    # Some IEs don't include a leading slash in the #pathname property.
    # We have seen this in IE11 and W3Schools claims it happens in IE9 or earlier
    # http://www.w3schools.com/jsref/prop_anchor_pathname.asp
    pathname = "/#{pathname}" unless pathname[0] == '/'
    pathname = pathname.replace(/\/$/, '') unless options?.stripTrailingSlash == false
    normalized += pathname
    normalized += anchor.hash if options?.hash == true
    normalized += anchor.search unless options?.search == false
    normalized

  ###*
  Parses the given URL into components such as hostname and path.

  If the given URL is not fully qualified, it is assumed to be relative
  to the current page.

  @function up.util.parseUrl
  @return {Object}
    The parsed URL as an object with
    `protocol`, `hostname`, `port`, `pathname`, `search` and `hash`
    properties.
  @experimental
  ###
  parseUrl = (urlOrAnchor) ->
    anchor = null
    if isString(urlOrAnchor)
      anchor = $('<a>').attr(href: urlOrAnchor).get(0)
      # In IE11 the #hostname and #port properties of such a link are empty
      # strings. However, we can fix this by assigning the anchor its own
      # href because computer:
      # https://gist.github.com/jlong/2428561#comment-1461205
      anchor.href = anchor.href if isBlank(anchor.hostname)
    else
      anchor = unJQuery(urlOrAnchor)
    anchor

  ###*
  @function up.util.normalizeMethod
  @internal
  ###
  normalizeMethod = (method) ->
    if method
      method.toUpperCase()
    else
      'GET'

  ###*
  @function $createElementFromSelector
  @internal
  ###
  $createElementFromSelector = (selector) ->
    path = selector.split(/[ >]/)
    $root = null
    for depthSelector, iteration in path
      conjunction = depthSelector.match(/(^|\.|\#)[A-Za-z0-9\-_]+/g)
      tag = "div"
      classes = []
      id = null
      for expression in conjunction
        switch expression[0]
          when "."
            classes.push expression.substr(1)
          when "#"
            id = expression.substr(1)
          else
            tag = expression
      html = "<" + tag
      html += " class=\"" + classes.join(" ") + "\""  if classes.length
      html += " id=\"" + id + "\""  if id
      html += ">"
      $element = $(html)
      $element.appendTo($parent) if $parent
      $root = $element if iteration == 0
      $parent = $element
    $root

  createElement = (tagName, html) ->
    element = document.createElement(tagName)
    element.innerHTML = html if isPresent(html)
    element

  ###*
  @function $create
  ###
  $createPlaceholder = (selector, container = document.body) ->
    $placeholder = $createElementFromSelector(selector)
    $placeholder.addClass('up-placeholder')
    $placeholder.appendTo(container)
    $placeholder

  ###*
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
  ###
  selectorForElement = (element) ->
    $element = $(element)
    selector = undefined

    up.puts("Creating selector from element %o", $element.get(0))

    if upId = presence($element.attr("up-id"))
      selector = "[up-id='#{upId}']"
    else if id = presence($element.attr("id"))
      selector = "##{id}"
    else if name = presence($element.attr("name"))
      selector = "[name='#{name}']"
    else if classes = presence(nonUpClasses($element))
      selector = ''
      for klass in classes
        selector += ".#{klass}"
    else
      selector = $element.prop('tagName').toLowerCase()
    selector

  nonUpClasses = ($element) ->
    classString = $element.attr('class') || ''
    classes = classString.split(' ')
    select classes, (klass) -> isPresent(klass) && !klass.match(/^up-/)

  # jQuery's implementation of $(...) cannot create elements that have
  # an <html> or <body> tag. So we're using native elements.
  # Also IE9 cannot set innerHTML on a <html> or <head> element.
  createElementFromHtml = (html) ->

    openTag = (tag) -> "<#{tag}(?: [^>]*)?>"
    closeTag = (tag) -> "</#{tag}>"
    anything = '(?:.|\\s)*?'
    capture = (pattern) -> "(#{pattern})"
    
    titlePattern = new RegExp(
      openTag('title') +
        capture(anything) +
      closeTag('title'),
    'i')
    
    bodyPattern = new RegExp(
      openTag('body') + 
        capture(anything) + 
      closeTag('body'), 
    'i')
    
    if bodyMatch = html.match(bodyPattern)

      htmlElement = document.createElement('html')
      bodyElement = createElement('body', bodyMatch[1])
      htmlElement.appendChild(bodyElement)

      if titleMatch = html.match(titlePattern)
        headElement = createElement('head')
        htmlElement.appendChild(headElement)
        titleElement = createElement('title', titleMatch[1])
        headElement.appendChild(titleElement)
        
      htmlElement
        
    else
      
      # we possibly received a layout-less fragment
      createElement('div', html)

  ###*
  Merge the contents of two or more objects together into the first object.

  @function up.util.extend
  @param {Object} target
  @param {Array<Object>} sources...
  @stable
  ###
  extend = $.extend

  ###*
  Returns a new string with whitespace removed from the beginning
  and end of the given string.

  @param {String}
    A string that might have whitespace at the beginning and end.
  @return {String}
    The trimmed string.
  @stable
  ###
  trim = $.trim

  ###*
  Calls the given function for each element (and, optional, index)
  of the given array.

  @function up.util.each
  @param {Array} array
  @param {Function<Object, Number>} block
    A function that will be called with each element and (optional) iteration index.
  @stable
  ###
  each = (array, block) ->
    block(item, index) for item, index in array

  ###*
  Translate all items in an array to new array of items.

  @function up.util.map
  @param {Array} array
  @param {Function<Object, Number>} block
    A function that will be called with each element and (optional) iteration index.
  @return {Array}
    A new array containing the result of each function call.
  @stable
  ###
  map = each

  ###*
  Calls the given function for the given number of times.

  @function up.util.times
  @param {Number} count
  @param {Function} block
  @stable
  ###
  times = (count, block) ->
    block(iteration) for iteration in [0..(count - 1)]

  ###*
  Returns whether the given argument is `null`.

  @function up.util.isNull
  @param object
  @return {Boolean}
  @stable
  ###
  isNull = (object) ->
    object == null

  ###*
  Returns whether the given argument is `undefined`.

  @function up.util.isUndefined
  @param object
  @return {Boolean}
  @stable
  ###
  isUndefined = (object) ->
    object == `void(0)`

  ###*
  Returns whether the given argument is not `undefined`.

  @function up.util.isDefined
  @param object
  @return {Boolean}
  @stable
  ###
  isDefined = (object) ->
    !isUndefined(object)

  ###*
  Returns whether the given argument is either `undefined` or `null`.

  Note that empty strings or zero are *not* considered to be "missing".

  For the opposite of `up.util.isMissing` see [`up.util.isGiven`](/up.util.isGiven).

  @function up.util.isMissing
  @param object
  @return {Boolean}
  @stable
  ###
  isMissing = (object) ->
    isUndefined(object) || isNull(object) # || isNaN(object)

  ###*
  Returns whether the given argument is neither `undefined` nor `null`.

  Note that empty strings or zero *are* considered to be "given".

  For the opposite of `up.util.isGiven` see [`up.util.isMissing`](/up.util.isMissing).

  @function up.util.isGiven
  @param object
  @return {Boolean}
  @stable
  ###
  isGiven = (object) ->
    !isMissing(object)

  # isNan = (object) ->
  #   isNumber(value) && value != +value

  ###*
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
  ###
  isBlank = (object) ->
    isMissing(object) ||                  # null or undefined
    (isObject(object) && Object.keys(object).length == 0) ||
    (object.length == 0)                  # String, Array, jQuery

  ###*
  Returns the given argument if the argument is [present](/up.util.isPresent),
  otherwise returns `undefined`.

  @function up.util.presence
  @param object
  @param {Function<T>} [tester=up.util.isPresent]
    The function that will be used to test whether the argument is present.
  @return {T|Undefined}
  @stable
  ###
  presence = (object, tester = isPresent) ->
    if tester(object) then object else undefined

  ###*
  Returns whether the given argument is not [blank](/up.util.isBlank).

  @function up.util.isPresent
  @param object
  @return {Boolean}
  @stable
  ###
  isPresent = (object) ->
    !isBlank(object)

  ###*
  Returns whether the given argument is a function.

  @function up.util.isFunction
  @param object
  @return {Boolean}
  @stable
  ###
  isFunction = (object) ->
    typeof(object) == 'function'

  ###*
  Returns whether the given argument is a string.

  @function up.util.isString
  @param object
  @return {Boolean}
  @stable
  ###
  isString = (object) ->
    typeof(object) == 'string'

  ###*
  Returns whether the given argument is a number.

  Note that this will check the argument's *type*.
  It will return `false` for a string like `"123"`.

  @function up.util.isNumber
  @param object
  @return {Boolean}
  @stable
  ###
  isNumber = (object) ->
    typeof(object) == 'number'

  ###*
  Returns whether the given argument is an object, but not a function.

  @function up.util.isHash
  @param object
  @return {Boolean}
  @stable
  ###
  isHash = (object) ->
    typeof(object) == 'object' && !!object

  ###*
  Returns whether the given argument is an object.

  This also returns `true` for functions, which may behave like objects in JavaScript.
  For an alternative that returns `false` for functions, see [`up.util.isHash`](/up.util.isHash).

  @function up.util.isObject
  @param object
  @return {Boolean}
  @stable
  ###
  isObject = (object) ->
    isHash(object) || (typeof object == 'function')

  ###*
  Returns whether the given argument is a DOM element.

  @function up.util.isElement
  @param object
  @return {Boolean}
  @stable
  ###
  isElement = (object) ->
    !!(object && object.nodeType == 1)

  ###*
  Returns whether the given argument is a jQuery collection.

  @function up.util.isJQuery
  @param object
  @return {Boolean}
  @stable
  ###
  isJQuery = (object) ->
    object instanceof jQuery

  ###*
  Returns whether the given argument is an object with a `then` method.

  @function up.util.isPromise
  @param object
  @return {Boolean}
  @stable
  ###
  isPromise = (object) ->
    isObject(object) && isFunction(object.then)

  ###*
  Returns whether the given argument is an object with `then` and `resolve` methods.

  @function up.util.isDeferred
  @param object
  @return {Boolean}
  @stable
  ###
  isDeferred = (object) ->
    isPromise(object) && isFunction(object.resolve)

  ###*
  Returns whether the given argument is an array.

  @function up.util.isArray
  @param object
  @return {Boolean}
  @stable
  ###
  # https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  isArray = Array.isArray || 
      (object) -> Object.prototype.toString.call(object) == '[object Array]'

  ###*
  Returns whether the given argument is a `FormData` instance.

  Always returns `false` in browsers that don't support `FormData`.

  @function up.util.isFormData
  @param object
  @return {Boolean}
  @internal
  ###
  isFormData = (object) ->
    up.browser.canFormData() && object instanceof FormData

  ###*
  Converts the given array-like argument into an array.

  Returns the array.

  @function up.util.toArray
  @param object
  @return {Array}
  @stable
  ###
  toArray = (object) ->
    Array.prototype.slice.call(object)

  ###*
  Shallow-copies the given array or object into a new array or object.

  Returns the new array or object.

  @function up.util.copy
  @param {Object|Array} object
  @return {Object|Array}
  @stable
  ###
  copy = (object)  ->
    if isArray(object)
      object.slice()
    else if isHash(object)
      extend({}, object)

  ###*
  If given a jQuery collection, returns the underlying array of DOM element.
  If given any other argument, returns the argument unchanged.

  @function up.util.unJQuery
  @param object
  @internal
  ###
  unJQuery = (object) ->
    if isJQuery(object)
      object.get(0)
    else
      object

  ###*
  Creates a new object by merging together the properties from the given objects.

  @function up.util.merge
  @param {Array<Object>} sources...
  @return Object
  @stable
  ###
  merge = (sources...) ->
    extend({}, sources...)

  ###*
  Creates an options hash from the given argument and some defaults.

  The semantics of this function are confusing.
  We want to get rid of this in the future.

  @function up.util.options
  @param {Object} object
  @param {Object} [defaults]
  @return {Object}
  @internal
  ###
  options = (object, defaults) ->
    merged = if object then copy(object) else {}
    if defaults
      for key, defaultValue of defaults
        value = merged[key]
        if !isGiven(value)
          merged[key] = defaultValue
        else if isObject(defaultValue) && isObject(value)
          merged[key] = options(value, defaultValue)
    merged

  ###*
  Returns the first argument that is considered [given](/up.util.isGiven).

  This function is useful when you have multiple option sources and the value can be boolean.
  In that case you cannot change the sources with a `||` operator
  (since that doesn't short-circuit at `false`).
  
  @function up.util.option
  @param {Array} args...
  @internal
  ###
  option = (args...) ->
    detect(args, isGiven)

  ###*
  Passes each element in the given array to the given function.
  Returns the first element for which the function returns a truthy value.

  If no object matches, returns `undefined`.

  @function up.util.detect
  @param {Array<T>} array
  @param {Function<T>} tester
  @return {T|Undefined}
  @stable
  ###
  detect = (array, tester) ->
    match = undefined
    for element in array
      if tester(element)
        match = element
        break
    match

  ###*
  Returns whether the given function returns a truthy value
  for any element in the given array.

  @function up.util.any
  @param {Array<T>} array
  @param {Function<T>} tester
  @return {Boolean}
  @experimental
  ###
  any = (array, tester) ->
    match = false
    for element in array
      if tester(element)
        match = true
        break
    match

  ###*
  Returns whether the given function returns a truthy value
  for all elements in the given array.

  @function up.util.all
  @param {Array<T>} array
  @param {Function<T>} tester
  @return {Boolean}
  @experimental
  ###
  all = (array, tester) ->
    match = true
    for element in array
      unless tester(element)
        match = false
        break
    match

  ###*
  Returns all elements from the given array that are
  neither `null` or `undefined`.

  @function up.util.compact
  @param {Array<T>} array
  @return {Array<T>}
  @stable
  ###
  compact = (array) ->
    select array, isGiven

  ###*
  Returns the given array without duplicates.

  @function up.util.uniq
  @param {Array<T>} array
  @return {Array<T>}
  @stable
  ###
  uniq = (array) ->
    seen = {}
    select array, (element) ->
      if seen.hasOwnProperty(element)
        false
      else
        seen[element] = true

  ###*
  Returns all elements from the given array that return
  a truthy value when passed to the given function.

  @function up.util.select
  @param {Array<T>} array
  @return {Array<T>}
  @stable
  ###
  select = (array, tester) ->
    matches = []
    each array, (element) ->
      if tester(element)
        matches.push(element)
    matches

  ###*
  Returns all elements from the given array that do not return
  a truthy value when passed to the given function.

  @function up.util.reject
  @param {Array<T>} array
  @return {Array<T>}
  @stable
  ###
  reject = (array, tester) ->
    select(array, (element) -> !tester(element))

  ###*
  Returns the intersection of the given two arrays.

  Implementation is not optimized. Don't use it for large arrays.

  @function up.util.intersect
  @internal
  ###
  intersect = (array1, array2) ->
    select array1, (element) ->
      contains(array2, element)

  ###*
  Returns the first [present](/up.util.isPresent) element attribute
  among the given list of attribute names.

  @function up.util.presentAttr
  @internal
  ###
  presentAttr = ($element, attrNames...) ->
    values = ($element.attr(attrName) for attrName in attrNames)
    detect(values, isPresent)

  ###*
  Waits for the given number of milliseconds, the nruns the given callback.

  If the number of milliseconds is zero, the callback is run in the current execution frame.
  See [`up.util.nextFrame`] for running a function in the next executation frame.

  @function up.util.setTimer
  @param {Number} millis
  @param {Function} callback
  @experimental
  ###
  setTimer = (millis, callback) ->
    if millis > 0
      setTimeout(callback, millis)
    else
      callback()
      undefined


  ###*
  Schedules the given function to be called in the
  next JavaScript execution frame.

  @function up.util.nextFrame
  @param {Function} block
  @stable
  ###
  nextFrame = (block) ->
    setTimeout(block, 0)

  ###*
  Returns the last element of the given array.

  @function up.util.last
  @param {Array<T>} array
  @return {T}
  ###
  last = (array) ->
    array[array.length - 1]

  ###*
  Measures the drawable area of the document.

  @function up.util.clientSize
  @internal
  ###
  clientSize = ->
    element = document.documentElement
    width: element.clientWidth
    height: element.clientHeight

  ###*
  Returns the width of a scrollbar.

  This only runs once per page load.

  @function up.util.scrollbarWidth
  @internal
  ###
  scrollbarWidth = memoize ->
    # This is how Bootstrap does it also:
    # https://github.com/twbs/bootstrap/blob/c591227602996c542b9fd0cb65cff3cc9519bdd5/dist/js/bootstrap.js#L1187
    $outer = $('<div>')
    $outer.attr('up-viewport', '')
    $outer.css
      position:  'absolute'
      top:       '0'
      left:      '0'
      width:     '100px'
      height:    '100px' # Firefox needs at least 100px to show a scrollbar
      overflowY: 'scroll'
    $outer.appendTo(document.body)
    outer = $outer.get(0)
    width = outer.offsetWidth - outer.clientWidth
    $outer.remove()
    width

  ###*
  Returns whether the given element is currently showing a vertical scrollbar.

  @function up.util.documentHasVerticalScrollbar
  @internal
  ###
  documentHasVerticalScrollbar = ->
    body = document.body
    $body = $(body)
    html = document.documentElement

    bodyOverflow = $body.css('overflow-y')

    forcedScroll = (bodyOverflow == 'scroll')
    forcedHidden = (bodyOverflow == 'hidden')

    forcedScroll || (!forcedHidden && html.scrollHeight > html.clientHeight)

  ###*
  Modifies the given function so it only runs once.
  Subsequent calls will return the previous return value.

  @function up.util.once
  @param {Function} fun
  @experimental
  ###
  once = (fun) ->
    result = undefined
    (args...) ->
      result = fun(args...) if fun?
      fun = undefined
      result

  ###*
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
  ###
  temporaryCss = (elementOrSelector, css, block) ->
    $element = $(elementOrSelector)
    oldCss = $element.css(Object.keys(css))
    $element.css(css)
    memo = -> $element.css(oldCss)
    if block
      block()
      memo()
    else
      once(memo)

  ###*
  Forces the given jQuery element into an accelerated compositing layer.

  @function up.util.forceCompositing
  @internal
  ###
  forceCompositing = ($element) ->
    oldTransforms = $element.css(['transform', '-webkit-transform'])
    if isBlank(oldTransforms) || oldTransforms['transform'] == 'none'
      memo = -> $element.css(oldTransforms)
      $element.css
        'transform': 'translateZ(0)'
        '-webkit-transform': 'translateZ(0)' # Safari
    else
      # Since the element already has a transform, it is already
      # drawn using compositing. Do nothing.
      memo = ->
    memo

  ###*
  Forces a repaint of the given element.

  @function up.util.forceRepaint
  @internal
  ###
  forceRepaint = (element) ->
    element = unJQuery(element)
    element.offsetHeight

  ###*
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
  ###
  cssAnimate = (elementOrSelector, lastFrame, opts) ->
    $element = $(elementOrSelector)

    # Don't name the local variable `options` since that would override
    # the `options` function in our scope. We really need `let` :(
    opts = options(opts,
      duration: 300,
      delay: 0,
      easing: 'ease'
    )

    if opts.duration == 0
      # In case the duration is zero we 1) spare ourselves all the trouble below,
      # and 2) return a deferred that actually resolve, since a CSS transition with
      # a zero duration never fires a transitionEnd event.
      $element.css(lastFrame)
      return resolvedDeferred()

    # We don't finish an existing animation here, since the public API
    # we expose as `up.motion.animate` already does this.
    deferred = $.Deferred()

    transitionProperties = Object.keys(lastFrame)
    transition =
      'transition-property': transitionProperties.join(', ')
      'transition-duration': "#{opts.duration}ms"
      'transition-delay': "#{opts.delay}ms"
      'transition-timing-function': opts.easing
    oldTransition = $element.css(Object.keys(transition))

    onTransitionEnd = (event) ->
      completedProperty = event.originalEvent.propertyName
      # Check if the transitionend event was caused by our own transition,
      # and not by some other transition that happens to live on the same element.
      if contains(transitionProperties, completedProperty)
        deferred.resolve() # unless isDetached($element)

    $element.on('transitionend', onTransitionEnd)

    deferred.then ->
      $element.removeClass('up-animating')
      $element.off('transitionend', onTransitionEnd)

      $element.removeData(ANIMATION_DEFERRED_KEY)
      withoutCompositing()

      # To interrupt the running transition we *must* set it to 'none' exactly.
      # We cannot simply restore the old transition properties because browsers
      # would simply keep transitioning.
      $element.css('transition': 'none')

      # Restoring a previous transition involves forcing a repaint, so we only do it if
      # we know the element was transitioning before.
      # Note that the default transition for elements is actually "all 0s ease 0s"
      # instead of "none", although that has the same effect as "none".
      hadTransitionBefore = !(oldTransition['transition-property'] == 'none' || (oldTransition['transition-property'] == 'all' && oldTransition['transition-duration'][0] == '0'))
      if hadTransitionBefore
        # If there is no repaint between the "none" transition and restoring
        # the previous transition, the browser will simply keep transitioning.
        forceRepaint($element) # :(
        $element.css(oldTransition)

    $element.addClass('up-animating')
    withoutCompositing = forceCompositing($element)
    $element.css(transition)
    $element.data(ANIMATION_DEFERRED_KEY, deferred)
    $element.css(lastFrame)

    # Return the whole deferred and not just return a thenable.
    # Other code will need the possibility to cancel the animation
    # by resolving the deferred.
    deferred

  ANIMATION_DEFERRED_KEY = 'up-animation-deferred'

  ###*
  Completes the animation for  the given element by jumping
  to the last frame instantly. All callbacks chained to
  the original animation's promise will be called.
  
  Does nothing if the given element is not currently animating.
  
  Also see [`up.motion.finish`](/up.motion.finish).
  
  @function up.util.finishCssAnimate
  @param {Element|jQuery|String} elementOrSelector
  @internal
  ###
  finishCssAnimate = (elementOrSelector) ->
    $(elementOrSelector).each ->
      if existingAnimation = pluckData(this, ANIMATION_DEFERRED_KEY)
        existingAnimation.resolve()

  ###*
  Measures the given element.

  @function up.util.measure
  @internal
  ###
  measure = ($element, opts) ->
    opts = options(opts, relative: false, inner: false)

    if opts.relative
      if opts.relative == true
        coordinates = $element.position()
      else
        # A relative context element is given
        $context = $(opts.relative)
        elementCoords = $element.offset()
        if $context.is(document)
          # The document is always at the origin
          coordinates = elementCoords
        else
          contextCoords = $context.offset()
          coordinates =
            left: elementCoords.left - contextCoords.left
            top: elementCoords.top - contextCoords.top
    else
      coordinates = $element.offset()
    
    box = 
      left: coordinates.left
      top: coordinates.top

    if opts.inner
      box.width = $element.width()
      box.height = $element.height()
    else
      box.width = $element.outerWidth()
      box.height = $element.outerHeight()

    box

  ###*
  Copies all attributes from the source element to the target element.

  @function up.util.copyAttributes
  @internal
  ###
  copyAttributes = ($source, $target) ->
    for attr in $source.get(0).attributes
      if attr.specified
        $target.attr(attr.name, attr.value)

  ###*
  Looks for the given selector in the element and its descendants.

  @function up.util.findWithSelf
  @internal
  ###
  findWithSelf = ($element, selector) ->
    $element.find(selector).addBack(selector)

  ###*
  Returns whether the given keyboard event involved the ESC key.

  @function up.util.escapePressed
  @internal
  ###
  escapePressed = (event) ->
    event.keyCode == 27

  ###*
  Returns whether the given array or string contains the given element or substring.

  @function up.util.contains
  @param {Array|String} arrayOrString
  @param elementOrSubstring
  @stable
  ###
  contains = (arrayOrString, elementOrSubstring) ->
    arrayOrString.indexOf(elementOrSubstring) >= 0

  ###*
  @function up.util.castedAttr
  @internal
  ###
  castedAttr = ($element, attrName) ->
    value = $element.attr(attrName)
    switch value
      when 'false'  then false
      when 'true'   then true
      when ''       then true
      else value # other strings, undefined, null, ...

#  castsToTrue = (object) ->
#    String(object) == "true"
#
#  castsToFalse = (object) ->
#    String(object) == "false"

  ###*
  @function up.util.locationFromXhr
  @internal
  ###
  locationFromXhr = (xhr) ->
    xhr.getResponseHeader('X-Up-Location')

  ###*
  @function up.util.titleFromXhr
  @internal
  ###
  titleFromXhr = (xhr) ->
    xhr.getResponseHeader('X-Up-Title')

  ###*
  @function up.util.methodFromXhr
  @internal
  ###
  methodFromXhr = (xhr) ->
    xhr.getResponseHeader('X-Up-Method')

  ###*
  Returns a copy of the given object that only contains
  the given properties.

  @function up.util.only
  @param {Object} object
  @param {Array} keys...
  @stable
  ###
  only = (object, properties...) ->
    filtered = {}
    for property in properties
      if object.hasOwnProperty(property)
        filtered[property] = object[property]
    filtered

  ###*
  Returns a copy of the given object that contains all except
  the given properties.

  @function up.util.except
  @param {Object} object
  @param {Array} keys...
  @stable
  ###
  except = (object, properties...) ->
    filtered = copy(object)
    for property in properties
      delete filtered[property]
    filtered

  ###*
  @function up.util.isUnmodifiedKeyEvent
  @internal
  ###
  isUnmodifiedKeyEvent = (event) ->
    not (event.metaKey or event.shiftKey or event.ctrlKey)

  ###*
  @function up.util.isUnmodifiedMouseEvent
  @internal
  ###
  isUnmodifiedMouseEvent = (event) ->
    isLeftButton = isUndefined(event.button) || event.button == 0
    isLeftButton && isUnmodifiedKeyEvent(event)

  ###*
  Returns a [Deferred object](https://api.jquery.com/category/deferred-object/) that is
  already resolved.

  @function up.util.resolvedDeferred
  @return {Deferred}
  @stable
  ###
  resolvedDeferred = ->
    deferred = $.Deferred()
    deferred.resolve()
    deferred

  ###*
  Returns a promise that is already resolved.

  @function up.util.resolvedPromise
  @return {Promise}
  @stable
  ###
  resolvedPromise = ->
    resolvedDeferred().promise()

  ###*
  Returns a [Deferred object](https://api.jquery.com/category/deferred-object/) that will never be resolved.

  @function up.util.unresolvableDeferred
  @return {Deferred}
  @experimental
  ###
  unresolvableDeferred = ->
    $.Deferred()

  ###*
  Returns a promise that will never be resolved.

  @function up.util.unresolvablePromise
  @experimental
  ###
  unresolvablePromise = ->
    unresolvableDeferred().promise()

  ###*
  Returns an empty jQuery collection.

  @function up.util.nullJQuery
  @internal
  ###
  nullJQuery = ->
    $()

  ###*
  Returns a new promise that resolves once all promises in arguments resolve.

  Other then [`$.when` from jQuery](https://api.jquery.com/jquery.when/),
  the combined promise will have a `resolve` method. This `resolve` method
  will resolve all the wrapped promises.

  @function up.util.resolvableWhen
  @internal
  ###
  resolvableWhen = (deferreds...) ->
    # Pass an additional resolved deferred to $.when so $.when  will
    # not return the given deferred if only one deferred is passed.
    joined = $.when(resolvedDeferred(), deferreds...)
    joined.resolve = memoize(->
      each deferreds, (deferred) ->
        deferred.resolve()
    )
    joined

#  resolvableSequence = (first, callbacks...) ->
#    sequence = $.Deferred().promise()
#    values = [first]
#    current = first
#    for callback in callbacks
#      current = current.then ->
#        value = callback()
#        values.push(value) if u.isPromise(value)
#        value
#    sequence.resolve = ->
#      each values, (deferred) -> deferred.resolve?()
#    sequence

  ###*
  On the given element, set attributes that are still missing.

  @function up.util.setMissingAttrs
  @internal
  ###
  setMissingAttrs = ($element, attrs) ->
    for key, value of attrs
      if isMissing($element.attr(key))
        $element.attr(key, value)

  ###*
  Removes the given element from the given array.

  This changes the given array.

  @function up.util.remove
  @param {Array<T>} array
  @param {T} element
  @stable
  ###
  remove = (array, element) ->
    index = array.indexOf(element)
    if index >= 0
      array.splice(index, 1)
      element

  ###*
  @function up.util.multiSelector
  @internal
  ###
  multiSelector = (parts) ->

    obj = {}
    selectors = []
    elements = []

    for part in parts
      if isString(part)
        selectors.push(part)
      else
        elements.push(part)

    obj.parsed = elements

    if selectors.length
      # Although other methods would work with an array of
      # selectors, we combine them to a single separator for
      # performance reasons.
      combinedSelector = selectors.join(', ')
      obj.parsed.push(combinedSelector)

    obj.select = ->
      obj.find(undefined)

    obj.find = ($root) ->
      $result = nullJQuery()
      for selector in obj.parsed
        $matches = if $root then $root.find(selector) else $(selector)
        $result = $result.add($matches)
      $result

    obj.findWithSelf = ($start) ->
      $matches = obj.find($start)
      $matches = $matches.add($start) if obj.doesMatch($start)
      $matches

    obj.doesMatch = (element) ->
      $element = $(element)
      any obj.parsed, (selector) -> $element.is(selector)

    obj.seekUp = (start) ->
      $start = $(start)
      $element = $start
      $result = undefined
      while $element.length
        if obj.doesMatch($element)
          $result = $element
          break
        $element = $element.parent()
      $result || nullJQuery()

    obj

  ###*
  If the given `value` is a function, calls the function with the given `args`.
  Otherwise it just returns `value`.

  @function up.util.evalOption
  @internal
  ###
  evalOption = (value, args...) ->
    if isFunction(value)
      value(args...)
    else
      value

  ###*
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
  ###
  cache = (config = {}) ->

    store = undefined

    maxKeys = -> evalOption(config.size)
    expiryMillis = -> evalOption(config.expiry)

    normalizeStoreKey = (key) ->
      if config.key
        config.key(key)
      else
        key.toString()

    isEnabled = ->
      maxKeys() isnt 0 && expiryMillis() isnt 0

    clear = ->
      store = {}

    clear()

    log = (args...) ->
      if config.logPrefix
        args[0] = "[#{config.logPrefix}] #{args[0]}"
        up.puts(args...)

    keys = ->
      Object.keys(store)

    makeRoomForAnotherKey = ->
      storeKeys = copy(keys())
      max = maxKeys()
      if max && storeKeys.length >= max
        oldestKey = null
        oldestTimestamp = null
        each storeKeys, (key) ->
          promise = store[key] # we don't need to call cacheKey here
          timestamp = promise.timestamp
          if !oldestTimestamp || oldestTimestamp > timestamp
            oldestKey = key
            oldestTimestamp = timestamp
        delete store[oldestKey] if oldestKey

    alias = (oldKey, newKey) ->
      value = get(oldKey, silent: true)
      if isDefined(value)
        set(newKey, value)

    timestamp = ->
      (new Date()).valueOf()

    set = (key, value) ->
      if isEnabled()
        makeRoomForAnotherKey()
        storeKey = normalizeStoreKey(key)
        store[storeKey] =
          timestamp: timestamp()
          value: value

    remove = (key) ->
      storeKey = normalizeStoreKey(key)
      delete store[storeKey]

    isFresh = (entry) ->
      millis = expiryMillis()
      if millis
        timeSinceTouch = timestamp() - entry.timestamp
        timeSinceTouch < millis
      else
        true

    get = (key, options = {}) ->
      storeKey = normalizeStoreKey(key)
      if entry = store[storeKey]
        if isFresh(entry)
          log("Cache hit for '%s'", key) unless options.silent
          entry.value
        else
          log("Discarding stale cache entry for '%s'", key) unless options.silent
          remove(key)
          undefined
      else
        log("Cache miss for '%s'", key) unless options.silent
        undefined

    alias: alias
    get: get
    set: set
    remove: remove
    clear: clear
    keys: keys

  ###*
  @function up.util.config
  @param {Object|Function} blueprint
    Default configuration options.
    Will be restored by calling `reset` on the returned object.
  @return {Object}
    An object with a `reset` function.
  @internal
  ###
  config = (blueprint) ->
    hash = openConfig(blueprint)
    Object.preventExtensions(hash)
    hash

  ###*
  @function up.util.openConfig
  @internal
  ###
  openConfig = (blueprint = {}) ->
    hash = {}
    hash.reset = ->
      newOptions = blueprint
      newOptions = newOptions() if isFunction(newOptions)
      extend(hash, newOptions)
    hash.reset()
    hash

  ###*
  @function up.util.unwrapElement
  @internal
  ###
  unwrapElement = (wrapper) ->
    wrapper = unJQuery(wrapper)
    parent = wrapper.parentNode;
    wrappedNodes = toArray(wrapper.childNodes)
    each wrappedNodes, (wrappedNode) ->
      parent.insertBefore(wrappedNode, wrapper)
    parent.removeChild(wrapper)

  ###*
  @function up.util.offsetParent
  @internal
  ###
  offsetParent = ($element) ->
    $match = undefined
    while ($element = $element.parent()) && $element.length
      position = $element.css('position')
      if position == 'absolute' || position == 'relative' || $element.is('body')
        $match = $element
        break
    $match

  ###*
  Returns if the given element has a `fixed` position.

  @function up.util.isFixed
  @internal
  ###
  isFixed = (element) ->
    $element = $(element)
    loop
      position = $element.css('position')
      if position == 'fixed'
        return true
      else
        $element = $element.parent()
        if $element.length == 0 || $element.is(document)
          return false

  ###*
  @function up.util.fixedToAbsolute
  @internal
  ###
  fixedToAbsolute = (element, $viewport) ->
    $element = $(element)
    $futureOffsetParent = offsetParent($element)
    # To get a fixed elements distance from the edge of the screen,
    # use position(), not offset(). offset() would include the current
    # scrollTop of the viewport.
    elementCoords = $element.position()
    futureParentCoords = $futureOffsetParent.offset()
    $element.css
      position: 'absolute'
      left: elementCoords.left - futureParentCoords.left
      top: elementCoords.top - futureParentCoords.top + $viewport.scrollTop()
      right: ''
      bottom: ''

#  argNames = (fun) ->
#    code = fun.toString()
#    pattern = new RegExp('\\(([^\\)]*)\\)')
#    if match = code.match(pattern)
#      match[1].split(/\s*,\s*/)
#    else
#      error('Could not parse argument names of %o', fun)

  ###*
  Normalizes the given params object to the form returned by
  [`jQuery.serializeArray`](https://api.jquery.com/serializeArray/).

  @function up.util.requestDataAsArray
  @param {Object|Array|Undefined|Null} data
  @internal
  ###
  requestDataAsArray = (data) ->
    if isFormData(data)
      # Until FormData#entries is implemented in all major browsers
      # we must give up here
      up.fail('Cannot convert FormData into an array')
    else
      query = requestDataAsQuery(data)
      array = []
      for part in query.split('&')
        if isPresent(part)
          pair = part.split('=')
          array.push
            name: decodeURIComponent(pair[0])
            value: decodeURIComponent(pair[1])
      array

  ###*
  Returns an URL-encoded query string for the given params object.

  @function up.util.requestDataAsQuery
  @param {Object|Array|Undefined|Null} data
  @internal
  ###
  requestDataAsQuery = (data) ->
    if isFormData(data)
      # Until FormData#entries is implemented in all major browsers
      # we must give up here
      up.fail('Cannot convert FormData into a query string')
    else if isPresent(data)
      query = $.param(data)
      query = query.replace(/\+/g, '%20')
      query
    else
      ""

  ###*
  Serializes the given form into a request data representation.

  @function up.util.requestDataFromForm
  @return {Array|FormData}
  @internal
  ###
  requestDataFromForm = (form) ->
    $form = $(form)
    hasFileInputs = $form.find('input[type=file]').length
    if hasFileInputs && up.browser.canFormData()
      new FormData($form.get(0))
    else
      $form.serializeArray()

  ###*
  Adds a key/value pair to the given request data representation.

  This mutates the given `data` if `data` is a `FormData`, an object
  or an array. When `data` is `String` a new string with the appended key/value
  pair is returned.

  @function up.util.appendRequestData
  @param {FormData|Object|Array|Undefined|Null} data
  @param {String} key
  @param {String|Blob|File} value
  @internal
  ###
  appendRequestData = (data, name, value) ->
    if isFormData(data)
      data.append(name, value)
    else if isArray(data)
      data.push(name: name, value: value)
    else if isObject(data)
      data[name] = value
    else if isString(data) || isMissing(data)
      newPair = requestDataAsQuery([ name: name, value: value ])
      if isPresent(data)
        data = [data, newPair].join('&')
      else
        data = newPair
    data

  ###*
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
  ###
  fail = (args...) ->
    if isArray(args[0])
      messageArgs = args[0]
      toastOptions = args[1] || {}
    else
      messageArgs = args
      toastOptions = {}

    up.log.error(messageArgs...)

    whenReady().then -> up.toast.open(messageArgs, toastOptions)

    asString = up.browser.sprintf(messageArgs...)
    throw new Error(asString)

  ESCAPE_HTML_ENTITY_MAP =
    "&": "&amp;"
    "<": "&lt;"
    ">": "&gt;"
    '"': '&quot;'

  ###*
  Escapes the given string of HTML by replacing control chars with their HTML entities.

  @function up.util.escapeHtml
  @param {String} string
    The text that should be escaped
  @experimental
  ###
  escapeHtml = (string) ->
    string.replace /[&<>"]/g, (char) -> ESCAPE_HTML_ENTITY_MAP[char]

  pluckKey = (object, key) ->
    value = object[key]
    delete object[key]
    value

  pluckData = (elementOrSelector, key) ->
    $element = $(elementOrSelector)
    value = $element.data(key)
    $element.removeData(key)
    value

  extractOptions = (args) ->
    lastArg = last(args)
    if isHash(lastArg) && !isJQuery(lastArg)
      args.pop()
    else
      {}

  opacity = (element) ->
    rawOpacity = $(element).css('opacity')
    if isGiven(rawOpacity)
      parseFloat(rawOpacity)
    else
      undefined

  whenReady = memoize ->
    if $.isReady
      resolvedPromise()
    else
      deferred = $.Deferred()
      $ -> deferred.resolve()
      deferred.promise()

  identity = (arg) -> arg

  ###*
  Returns whether the given element has been detached from the DOM
  (or whether it was never attached).

  @function up.util.isDetached
  @internal
  ###
  isDetached = (element) ->
    element = unJQuery(element)
    # This is by far the fastest way to do this
    not jQuery.contains(document.documentElement, element)

  ###*
  Given a function that will return a promise, returns a proxy function
  with an additional `.promise` attribute.

  When the proxy is called, the inner function is called.
  The proxy's `.promise` attribute is available even before the function is called
  and will resolve when the inner function's returned promise resolves.

  If the inner function does not return a promise, the proxy's `.promise` attribute
  will resolve as soon as the inner function returns.

  @function up.util.previewable
  @internal
  ###
  previewable = (fun) ->
    deferred = $.Deferred()
    preview = (args...) ->
      funValue = fun(args...)
      if isPromise(funValue)
        funValue.then -> deferred.resolve(funValue)
      else
        deferred.resolve(funValue)
      funValue
    preview.promise = deferred.promise()
    preview

  ###*
  A linear task queue whose (2..n)th tasks can be changed at any time.

  @function up.util.DivertibleChain
  @internal
  ###
  class DivertibleChain

    constructor: ->
      @reset()

    reset: =>
      @queue = []
      @currentTask = undefined

    promise: =>
      promises = map @allTasks(), (task) -> task.promise
      $.when(promises...)

    allTasks: =>
      tasks = []
      tasks.push(@currentTask) if @currentTask
      tasks = tasks.concat(@queue)
      tasks

    poke: =>
      unless @currentTask # don't start a new task while we're still running one
        if @currentTask = @queue.shift()
          promise = @currentTask()
          promise.always =>
            @currentTask = undefined
            @poke()

    asap: (newTasks...) =>
      @queue = map(newTasks, previewable)
      @poke()

  ###*
  @function up.util.submittedValue
  @internal
  ###
  submittedValue = (fieldOrSelector) ->
    $field = $(fieldOrSelector)
    if $field.is('[type=checkbox], [type=radio]') && !$field.is(':checked')
      undefined
    else
      $field.val()

  ###*
  @function up.util.sequence
  @internal
  ###
  sequence = (functions...) ->
    ->
      map functions, (f) -> f()

#  ###*
#  @function up.util.race
#  @internal
#  ###
#  race = (promises...) ->
#    raceDone = $.Deferred()
#    each promises, (promise) ->
#      promise.then -> raceDone.resolve()
#    raceDone.promise()

  ###*
  @function up.util.promiseTimer
  @internal
  ###
  promiseTimer = (ms) ->
    deferred = $.Deferred()
    timeout = setTimer ms, ->
      deferred.resolve()
    deferred.cancel = -> clearTimeout(timeout)
    deferred

  ###*
  Returns `'left'` if the center of the given element is in the left 50% of the screen.
  Otherwise returns `'right'`.

  @function up.util.horizontalScreenHalf
  @internal
  ###
  horizontalScreenHalf = ($element) ->
    elementDims = measure($element)
    screenDims = clientSize()
    elementMid = elementDims.left + 0.5 * elementDims.width
    screenMid = 0.5 * screenDims.width
    if elementMid < screenMid
      'left'
    else
      'right'

  ###*
  Like `$old.replaceWith($new)`, but keeps event handlers bound to `$old`.

  Note that this is a memory leak unless you re-attach `$new` to the DOM aferwards.

  @function up.util.detachWith
  @internal
  ###
  detachWith = ($old, $new) ->
    $insertion = $('<div></div>')
    $insertion.insertAfter($old)
    $old.detach()
    $insertion.replaceWith($new)
    $old

  isDetached: isDetached
  requestDataAsArray: requestDataAsArray
  requestDataAsQuery: requestDataAsQuery
  appendRequestData: appendRequestData
  requestDataFromForm: requestDataFromForm
  offsetParent: offsetParent
  fixedToAbsolute: fixedToAbsolute
  isFixed: isFixed
  presentAttr: presentAttr
  createElement: createElement
  parseUrl: parseUrl
  normalizeUrl: normalizeUrl
  normalizeMethod: normalizeMethod
  createElementFromHtml: createElementFromHtml
  $createElementFromSelector: $createElementFromSelector
  $createPlaceholder: $createPlaceholder
  selectorForElement: selectorForElement
  extend: extend
  copy: copy
  merge: merge
  options: options
  option: option
  fail: fail
  each: each
  map: map
  times: times
  any: any
  all: all
  detect: detect
  select: select
  reject: reject
  intersect: intersect
  compact: compact
  uniq: uniq
  last: last
  isNull: isNull
  isDefined: isDefined
  isUndefined: isUndefined
  isGiven: isGiven
  isMissing: isMissing
  isPresent: isPresent
  isBlank: isBlank
  presence: presence
  isObject: isObject
  isFunction: isFunction
  isString: isString
  isNumber: isNumber
  isElement: isElement
  isJQuery: isJQuery
  isPromise: isPromise
  isDeferred: isDeferred
  isHash: isHash
  isArray: isArray
  isFormData: isFormData
  isUnmodifiedKeyEvent: isUnmodifiedKeyEvent
  isUnmodifiedMouseEvent: isUnmodifiedMouseEvent
  nullJQuery: nullJQuery
  unJQuery: unJQuery
  setTimer: setTimer
  nextFrame: nextFrame
  measure: measure
  temporaryCss: temporaryCss
  cssAnimate: cssAnimate
  finishCssAnimate: finishCssAnimate
  forceCompositing: forceCompositing
  forceRepaint: forceRepaint
  escapePressed: escapePressed
  copyAttributes: copyAttributes
  findWithSelf: findWithSelf
  contains: contains
  toArray: toArray
#  castsToTrue: castsToTrue
#  castsToFalse: castsToFalse
  castedAttr: castedAttr
  locationFromXhr: locationFromXhr
  titleFromXhr: titleFromXhr
  methodFromXhr: methodFromXhr
  clientSize: clientSize
  only: only
  except: except
  trim: trim
  unresolvableDeferred: unresolvableDeferred
  unresolvablePromise: unresolvablePromise
  resolvedPromise: resolvedPromise
  resolvedDeferred: resolvedDeferred
  resolvableWhen: resolvableWhen
  setMissingAttrs: setMissingAttrs
  remove: remove
  memoize: memoize
  scrollbarWidth: scrollbarWidth
  documentHasVerticalScrollbar: documentHasVerticalScrollbar
  config: config
  openConfig: openConfig
  cache: cache
  unwrapElement: unwrapElement
  multiSelector: multiSelector
  error: fail
  pluckData: pluckData
  pluckKey: pluckKey
  extractOptions: extractOptions
  isDetached: isDetached
  noop: noop
  opacity: opacity
  whenReady: whenReady
  identity: identity
  escapeHtml: escapeHtml
  DivertibleChain: DivertibleChain
  submittedValue: submittedValue
  sequence: sequence
  promiseTimer: promiseTimer
  previewable: previewable
  evalOption: evalOption
  horizontalScreenHalf: horizontalScreenHalf
  detachWith: detachWith

)($)

up.fail = up.util.fail
