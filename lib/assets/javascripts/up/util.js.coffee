###*
Utility functions
=================
  
Up.js comes with a number of utility functions
that might save you from loading something like [Underscore.js](http://underscorejs.org/).

@class up.util
###
up.util = (($) ->

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
  @function up.util.ajax
  @internal
  ###
  ajax = (request) ->
    request = copy(request)
    if request.selector
      request.headers ||= {}
      request.headers['X-Up-Selector'] = request.selector
    # Delegate to jQuery
    $.ajax(request)

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
  @param {Boolean} [options.stripTrailingSlash=false]
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
    pathname = pathname.replace(/\/$/, '') if options?.stripTrailingSlash == true
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
  Prints a debugging message to the browser console.

  @function up.debug
  @param {String} message
  @param {Array} args...
  @internal
  ###
  debug = (message, args...) ->
    message = "[UP] #{message}"
    up.browser.puts('debug', message, args...)

  ###*
  @function up.warn
  @internal
  ###
  warn = (message, args...) ->
    message = "[UP] #{message}"
    up.browser.puts('warn', message, args...)

  ###*
  Throws a fatal error with the given message.

  - The error will be printed to the [error console](https://developer.mozilla.org/en-US/docs/Web/API/Console/error)
  - An [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) (exception) will be thrown, unwinding the current call stack
  - The error message will be printed in a corner of the screen

  \#\#\#\# Examples

      up.error('Division by zero')
      up.error('Unexpected result %o', result)

  @function up.error
  @internal
  ###
  error = (args...) ->
    args[0] = "[UP] #{args[0]}"
    up.browser.puts('error', args...)
    asString = evalConsoleTemplate(args...)
    $error = presence($('.up-error')) || $('<div class="up-error"></div>').prependTo('body')
    $error.addClass('up-error')
    $error.text(asString)
    throw new Error(asString)

  CONSOLE_PLACEHOLDERS = /\%[odisf]/g
    
  evalConsoleTemplate = (args...) ->
    message = args[0]
    i = 0
    maxLength = 80
    message.replace CONSOLE_PLACEHOLDERS, ->
      i += 1
      arg = args[i]
      argType = (typeof arg)
      if argType == 'string'
        arg = arg.replace(/\s+/g, ' ')
        arg = "#{arg.substr(0, maxLength)}…" if arg.length > maxLength
        arg = "\"#{arg}\""
      else if argType == 'undefined'
        # JSON.stringify(undefined) is actually undefined
        arg = 'undefined'
      else if argType == 'number' || argType == 'function'
        arg = arg.toString()
      else
        arg = JSON.stringify(arg)
      if arg.length > maxLength
        arg = "#{arg.substr(0, maxLength)} …"
        # For truncated objects or functions, add a trailing brace so
        # long log lines are easier to parse visually
        if argType == 'object' || argType == 'function'
          arg += " }"
      arg

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

    debug("Creating selector from element %o", $element.get(0))

    if upId = presence($element.attr("up-id"))
      selector = "[up-id='#{upId}']"
    else if id = presence($element.attr("id"))
      selector = "##{id}"
    else if name = presence($element.attr("name"))
      selector = "[name='#{name}']"
    else if classString = presence($element.attr("class"))
      classes = classString.split(' ')
      selector = ''
      for klass in classes
        selector += ".#{klass}"
    else
      selector = $element.prop('tagName').toLowerCase()
    selector

  # jQuery's implementation of $(...) cannot create elements that have
  # an <html> or <body> tag. So we're using native elements.
  # Also IE9 cannot set innerHTML on a <html> or <head> element.
  createElementFromHtml = (html) ->

    openTag = (tag) -> "<#{tag}(?: [^>]*)?>"
    closeTag = (tag) -> "</#{tag}>"
    anything = '(?:.|\\n)*?'
    capture = (pattern) -> "(#{pattern})"
    
    titlePattern = new RegExp(
      openTag('head') + 
        anything + 
        openTag('title') + 
          capture(anything) + 
        closeTag('title') + 
        anything + 
      closeTag('body'), 
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
    isUndefined(object) || isNull(object)

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

  This also returns `true` for functions, which may behave like objects in Javascript.
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
  Converts the given array-like argument into an array.

  Returns the array.

  @function up.util.isDeferred
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
    else
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
  Returns the first argument that is considered present.
  If an argument is a function, it is called and the value is checked for presence.
  
  This function is useful when you have multiple option sources and the value can be boolean.
  In that case you cannot change the sources with a `||` operator
  (since that doesn't short-circuit at `false`).
  
  @function up.util.option
  @param {Array} args...
  @internal
  ###
  option = (args...) ->
    # This behavior is subtly different from detect!
    match = undefined
    for arg in args
      value = arg
      value = value() if isFunction(value)
      if isGiven(value)
        match = value
        break
    match    

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
  Returns the first [present](/up.util.isPresent) element attribute
  among the given list of attribute names.

  @function up.util.presentAttr
  @internal
  ###
  presentAttr = ($element, attrNames...) ->
    values = ($element.attr(attrName) for attrName in attrNames)
    detect(values, isPresent)

  ###*
  Schedules the given function to be called in the
  next Javascript execution frame.

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
    $outer = $('<div>').css
      position:  'absolute'
      top:       '0'
      left:      '0'
      width:     '50px'
      height:    '50px'
      overflowY: 'scroll'
    $outer.appendTo(document.body)
    outer = $outer.get(0)
    width = outer.offsetWidth - outer.clientWidth
    $outer.remove()
    width

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
  temporaryCss = ($element, css, block) ->
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
  @internal
  ###
  cssAnimate = (elementOrSelector, lastFrame, opts) ->
    $element = $(elementOrSelector)
    if up.browser.canCssAnimation()
      opts = options(opts, 
        duration: 300, 
        delay: 0, 
        easing: 'ease'
      )
      # We don't finish an existing animation here, since
      # the public API `up.motion.animate` already does this.
      deferred = $.Deferred()
      transition =
        'transition-property': Object.keys(lastFrame).join(', ')
        'transition-duration': "#{opts.duration}ms"
        'transition-delay': "#{opts.delay}ms"
        'transition-timing-function': opts.easing
      withoutCompositing = forceCompositing($element)
      withoutTransition = temporaryCss($element, transition)
      $element.css(lastFrame)
      deferred.then(withoutCompositing)
      deferred.then(withoutTransition)
      $element.data(ANIMATION_PROMISE_KEY, deferred)
      deferred.then(-> $element.removeData(ANIMATION_PROMISE_KEY))
      endTimeout = setTimeout((-> deferred.resolve()), opts.duration + opts.delay)
      deferred.then(-> clearTimeout(endTimeout)) # clean up in case we're canceled
      # Return the whole deferred and not just return a thenable.
      # Other code will need the possibility to cancel the animation
      # by resolving the deferred.
      deferred
    else
      $element.css(lastFrame)
      resolvedDeferred()
      
  ANIMATION_PROMISE_KEY = 'up-animation-promise'

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
      if existingAnimation = $(this).data(ANIMATION_PROMISE_KEY)
        existingAnimation.resolve()

  ###*
  Measures the given element.

  @function up.util.measure
  @internal
  ###
  measure = ($element, opts) ->
    opts = options(opts, relative: false, inner: false, full: false)

    if opts.relative
      if opts.relative == true
        coordinates = $element.position()
      else
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
      
    if opts.full
      viewport = clientSize()
      box.right = viewport.width - (box.left + box.width)
      box.bottom = viewport.height - (box.top + box.height)
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
    joined = $.when(deferreds...)
    joined.resolve = ->
      each deferreds, (deferred) -> deferred.resolve?()
    joined
    
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

    clear = ->
      store = {}

    clear()

    log = (args...) ->
      if config.log
        args[0] = "[#{config.log}] #{args[0]}"
        debug(args...)

    keys = ->
      Object.keys(store)

    maxSize = ->
      if isMissing(config.size)
        undefined
      else if isFunction(config.size)
        config.size()
      else if isNumber(config.size)
        config.size
      else
        error("Invalid size config: %o", config.size)

    expiryMilis = ->
      if isMissing(config.expiry)
        undefined
      else if isFunction(config.expiry)
        config.expiry()
      else if isNumber(config.expiry)
        config.expiry
      else
        error("Invalid expiry config: %o", config.expiry)

    normalizeStoreKey = (key) ->
      if config.key
        config.key(key)
      else
        key.toString()

    trim = ->
      storeKeys = copy(keys())
      size = maxSize()
      if size && storeKeys.length > size
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
      value = get(oldKey)
      if isDefined(value)
        set(newKey, value)

    timestamp = ->
      (new Date()).valueOf()

    set = (key, value) ->
      storeKey = normalizeStoreKey(key)
      store[storeKey] =
        timestamp: timestamp()
        value: value

    remove = (key) ->
      storeKey = normalizeStoreKey(key)
      delete store[storeKey]

    isFresh = (entry) ->
      expiry = expiryMilis()
      if expiry
        timeSinceTouch = timestamp() - entry.timestamp
        timeSinceTouch < expiryMilis()
      else
        true

    get = (key, fallback = undefined) ->
      storeKey = normalizeStoreKey(key)
      if entry = store[storeKey]
        if isFresh(entry)
          log("Cache hit for %o", key)
          entry.value
        else
          log("Discarding stale cache entry for %o", key)
          remove(key)
          fallback
      else
        log("Cache miss for %o", key)
        fallback

    alias: alias
    get: get
    set: set
    remove: remove
    clear: clear
    keys: keys

  ###*
  @function up.util.config
  @internal
  ###
  config = (factoryOptions = {}) ->
    hash = {}
    hash.reset = -> extend(hash, factoryOptions)
    hash.reset()
    Object.preventExtensions(hash)
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

  offsetParent: offsetParent
  fixedToAbsolute: fixedToAbsolute
  presentAttr: presentAttr
  createElement: createElement
  parseUrl: parseUrl
  normalizeUrl: normalizeUrl
  normalizeMethod: normalizeMethod
  createElementFromHtml: createElementFromHtml
  $createElementFromSelector: $createElementFromSelector
  selectorForElement: selectorForElement
  ajax: ajax
  extend: extend
  copy: copy
  merge: merge
  options: options
  option: option
  error: error
  debug: debug
  warn: warn
  each: each
  map: map
  times: times
  any: any
  detect: detect
  select: select
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
  isElement: isElement
  isJQuery: isJQuery
  isPromise: isPromise
  isDeferred: isDeferred
  isHash: isHash
  isUnmodifiedKeyEvent: isUnmodifiedKeyEvent
  isUnmodifiedMouseEvent: isUnmodifiedMouseEvent
  nullJQuery: nullJQuery
  unJQuery: unJQuery
  nextFrame: nextFrame
  measure: measure
  temporaryCss: temporaryCss
  cssAnimate: cssAnimate
  finishCssAnimate: finishCssAnimate
  forceCompositing: forceCompositing
  escapePressed: escapePressed
  copyAttributes: copyAttributes
  findWithSelf: findWithSelf
  contains: contains
  isArray: isArray
  toArray: toArray
#  castsToTrue: castsToTrue
#  castsToFalse: castsToFalse
  castedAttr: castedAttr
  locationFromXhr: locationFromXhr
  titleFromXhr: titleFromXhr
  methodFromXhr: methodFromXhr
  clientSize: clientSize
  only: only
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
  config: config
  cache: cache
  unwrapElement: unwrapElement
  multiSelector: multiSelector
  evalConsoleTemplate: evalConsoleTemplate

)($)

up.error = up.util.error
up.warn = up.util.warn
up.debug = up.util.debug
