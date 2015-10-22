###*
Utility functions
=================
  
All methods in this module are for internal use by the Up.js framework
and will frequently change between releases.
  
If you use them in your own code, you will get hurt.  
  
@protected
@class up.util
###
up.util = (($) ->

  memoize = (func) ->
    cache = undefined
    cached = false
    (args...) ->
      if cached
        cache
      else
        cached = true
        cache = func(args...)

  ajax = (request) ->
    request = copy(request)
    if request.selector
      request.headers = {
        "X-Up-Selector": request.selector
      }
    # Delegate to jQuery
    $.ajax(request)

  ###*
  @method up.util.isStandardPort
  @private
  ###  
  isStandardPort = (protocol, port) ->
    ((port == "" || port == "80") && protocol == 'http:') || (port == "443" && protocol == 'https:')

  ###*
  Normalizes URLs, relative paths and absolute paths to a full URL
  that can be checked for equality with other normalized URL.
  
  By default hashes are ignored, search queries are included.
  
  @method up.util.normalizeUrl
  @param {Boolean} [options.hash=false]
  @param {Boolean} [options.search=true]
  @protected
  ###
  normalizeUrl = (urlOrAnchor, options) ->
    anchor = null
    if isString(urlOrAnchor)
      anchor = $('<a>').attr(href: urlOrAnchor).get(0)
      # In IE11 the #hostname and #port properties of such a link are empty
      # strings. However, we can fix this by assigning the anchor its own
      # href because computer:
      # https://gist.github.com/jlong/2428561#comment-1461205
      anchor.href = anchor.href if isBlank(anchor.hostname)
    else
      anchor = unJquery(urlOrAnchor)
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
  @method up.util.normalizeMethod
  @protected
  ###
  normalizeMethod = (method) ->
    if method
      method.toUpperCase()
    else
      'GET'

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
  @method up.debug
  @protected
  ###
  debug = (message, args...) ->
    message = "[UP] #{message}"
    up.browser.puts('debug', message, args...)

  ###*
  @method up.warn
  @protected
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

  @method up.error
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

  createSelectorFromElement = ($element) ->
    debug("Creating selector from element %o", $element)
    classes = if classString = $element.attr("class") then classString.split(" ") else []
    id = $element.attr("id")
    selector = $element.prop("tagName").toLowerCase()
    selector += "#" + id  if id
    for klass in classes
      selector += "." + klass
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

  extend = $.extend
  
  trim = $.trim
  
  each = (collection, block) ->
    block(item, index) for item, index in collection

  map = each

  identity = (x) -> x

  times = (count, block) ->
    block(iteration) for iteration in [0..(count - 1)]

  isNull = (object) ->
    object == null

  isUndefined = (object) ->
    object == `void(0)`
    
  isDefined = (object) ->
    !isUndefined(object)
    
  isMissing = (object) ->
    isUndefined(object) || isNull(object)

  isGiven = (object) ->
    !isMissing(object)
    
  isBlank = (object) ->
    isMissing(object) ||                  # null or undefined
    (isObject(object) && Object.keys(object).length == 0) ||
    (object.length == 0)                  # String, Array, jQuery
  
  presence = (object, checker = isPresent) ->
    if checker(object) then object else null
  
  isPresent = (object) ->
    !isBlank(object)

  isFunction = (object) ->
    typeof(object) == 'function'

  isString = (object) ->
    typeof(object) == 'string'

  isNumber = (object) ->
    typeof(object) == 'number'

  isHash = (object) ->
    typeof(object) == 'object' && !!object

  isObject = (object) ->
    isHash(object) || (typeof object == 'function')

  isElement = (object) ->
    !!(object && object.nodeType == 1)

  isJQuery = (object) ->
    object instanceof jQuery

  isPromise = (object) ->
    isObject(object) && isFunction(object.then)

  isDeferred = (object) ->
    isPromise(object) && isFunction(object.resolve)

  ifGiven = (object) ->
    object if isGiven(object)

  # https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  isArray = Array.isArray || 
      (object) -> Object.prototype.toString.call(object) == '[object Array]'
        
  toArray = (object) ->
    Array.prototype.slice.call(object)

  copy = (object)  ->
    if isArray(object)
      object.slice()
    else
      extend({}, object)

  unJquery = (object) ->
    if isJQuery(object)
      object.get(0)
    else
      object

  # Non-destructive extend
  merge = (object, otherObject) ->
    extend(copy(object), otherObject)

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
  
  @method up.util.option
  @param {Array} args...
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

  detect = (array, tester) ->
    match = undefined
    for element in array
      if tester(element)
        match = element
        break
    match

  any = (array, tester) ->
    match = detect(array, tester)
    isDefined(match)

  compact = (array) ->
    select array, isGiven

  uniq = (array) ->
    seen = {}
    select array, (element) ->
      if seen.hasOwnProperty(element)
        false
      else
        seen[element] = true

  select = (array, tester) ->
    matches = []
    each array, (element) ->
      if tester(element)
        matches.push(element)
    matches

  presentAttr = ($element, attrNames...) ->
    values = ($element.attr(attrName) for attrName in attrNames)
    detect(values, isPresent)
    
  nextFrame = (block) ->
    setTimeout(block, 0)
    
  last = (array) ->
    array[array.length - 1]
    
  clientSize = ->
    element = document.documentElement
    width: element.clientWidth
    height: element.clientHeight

  # This is how Bootstrap does it also:
  # https://github.com/twbs/bootstrap/blob/c591227602996c542b9fd0cb65cff3cc9519bdd5/dist/js/bootstrap.js#L1187
  scrollbarWidth = memoize ->
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

  @method up.util.once
  @private
  ###
  once = (fun) ->
    result = undefined
    ->
      result = fun() if fun?
      fun = undefined
      result

  ###*
  # Temporarily sets the CSS for the given element.
  #
  # @method up.util.temporaryCss
  # @param {jQuery} $element
  # @param {Object} css
  # @param {Function} [block]
  #   If given, the CSS is set, the block is called and
  #   the old CSS is restored.
  # @private
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
      
  forceCompositing = ($element) ->
    oldTransforms = $element.css(['transform', '-webkit-transform'])
    if isBlank(oldTransforms)
      memo = -> $element.css(oldTransforms)
      $element.css
        'transform': 'translateZ(0)'
        '-webkit-transform': 'translateZ(0)' # Safari
    else
      memo = ->
    memo
      
      
  ###*
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
  
  Also see [`up.motion.finish`](/up.motion#up.motion.finish).
  
  @method up.util.finishCssAnimate
  @protected
  @param {Element|jQuery|String} elementOrSelector
  ###
  finishCssAnimate = (elementOrSelector) ->
    $(elementOrSelector).each ->
      if existingAnimation = $(this).data(ANIMATION_PROMISE_KEY)
        existingAnimation.resolve()

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
    
  copyAttributes = ($source, $target) ->
    for attr in $source.get(0).attributes
      if attr.specified
        $target.attr(attr.name, attr.value)

  findWithSelf = ($element, selector) ->
    $element.find(selector).addBack(selector)

  escapePressed = (event) ->
    event.keyCode == 27

  startsWith = (string, element) ->
    string.indexOf(element) == 0

  endsWith = (string, element) ->
    string.indexOf(element) == string.length - element.length

  contains = (stringOrArray, element) ->
    stringOrArray.indexOf(element) >= 0

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
    
  locationFromXhr = (xhr) ->
    xhr.getResponseHeader('X-Up-Location')
    
  methodFromXhr = (xhr) ->
    xhr.getResponseHeader('X-Up-Method')
    
#  willChangeHistory = (historyOption) ->
#    isPresent(historyOption) && !castsToFalse(historyOption)
    
  only = (object, keys...) ->
    filtered = {}
    for key in keys
      if object.hasOwnProperty(key)
        filtered[key] = object[key]
    filtered

  isUnmodifiedKeyEvent = (event) ->
    not (event.metaKey or event.shiftKey or event.ctrlKey)

  isUnmodifiedMouseEvent = (event) ->
    isLeftButton = isUndefined(event.button) || event.button == 0
    isLeftButton && isUnmodifiedKeyEvent(event)

  resolvedDeferred = ->
    deferred = $.Deferred()
    deferred.resolve()
    deferred

  resolvedPromise = ->
    resolvedDeferred().promise()

  nullJquery = ->
    is: -> false
    attr: ->
    find: -> []

  resolvableWhen = (deferreds...) ->
    joined = $.when(deferreds...)
    joined.resolve = ->
      each deferreds, (deferred) -> deferred.resolve?()
    joined
    
  setMissingAttrs = ($element, attrs) ->
    for key, value of attrs
      if isMissing($element.attr(key))
        $element.attr(key, value)

  remove = (array, element) ->
    index = array.indexOf(element)
    if index >= 0
      array.splice(index, 1)
      element

  emptyJQuery = ->
    $([])

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
      $result = emptyJQuery()
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
      $result || emptyJQuery()

    obj

  ###*
  @method up.util.cache
  @param {Number|Function} [config.size]
    Maximum number of cache entries.
    Set to `undefined` to not limit the cache size.
  @param {Number|Function} [config.expiry]
    The number of milliseconds after which a cache entry
    will be discarded.
  @param {String} [config.log]
    A prefix for log entries printed by this cache object.
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

  config = (factoryOptions = {}) ->
    hash = {}
    hash.reset = -> extend(hash, factoryOptions)
    hash.reset()
    Object.preventExtensions(hash)
    hash

  unwrapElement = (wrapper) ->
    wrapper = unJquery(wrapper)
    parent = wrapper.parentNode;
    wrappedNodes = toArray(wrapper.childNodes)
    each wrappedNodes, (wrappedNode) ->
      parent.insertBefore(wrappedNode, wrapper)
    parent.removeChild(wrapper)

  offsetParent = ($element) ->
    $match = undefined
    while ($element = $element.parent()) && $element.length
      position = $element.css('position')
      if position == 'absolute' || position == 'relative' || $element.is('body')
        $match = $element
        break
    $match

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

  argNames = (fun) ->
    code = fun.toString()
    pattern = new RegExp('\\(([^\\)]*)\\)')
    if match = code.match(pattern)
      match[1].split(/\s*,\s*/)
    else
      error('Could not parse argument names of %o', fun)

  argNames: argNames
  offsetParent: offsetParent
  fixedToAbsolute: fixedToAbsolute
  presentAttr: presentAttr
  createElement: createElement
  normalizeUrl: normalizeUrl
  normalizeMethod: normalizeMethod
  createElementFromHtml: createElementFromHtml
  $createElementFromSelector: $createElementFromSelector
  createSelectorFromElement: createSelectorFromElement
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
  identity: identity
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
  ifGiven: ifGiven
  isUnmodifiedKeyEvent: isUnmodifiedKeyEvent
  isUnmodifiedMouseEvent: isUnmodifiedMouseEvent
  nullJquery: nullJquery
  unJquery: unJquery
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
  startsWith: startsWith
  endsWith: endsWith
  isArray: isArray
  toArray: toArray
#  castsToTrue: castsToTrue
#  castsToFalse: castsToFalse
  castedAttr: castedAttr
  locationFromXhr: locationFromXhr
  methodFromXhr: methodFromXhr
  clientSize: clientSize
  only: only
  trim: trim
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
  emptyJQuery: emptyJQuery
  evalConsoleTemplate: evalConsoleTemplate

)($)

up.error = up.util.error
up.warn = up.util.warn
up.debug = up.util.debug
