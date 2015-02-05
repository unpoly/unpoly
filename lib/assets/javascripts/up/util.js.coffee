###*
Utility functions
=================
  
All methods in this module are for internal use by the Up.js framework
and will frequently change between releases.
  
If you use them in your own code, you will get hurt.  
  
@protected
@class up.util
###
up.util = (->

  get = (url, options) ->
    options = options or {}
    options.url = url
    ajax options

  ajax = (options) ->
    if options.selector
      options.headers = {
        "X-Up-Selector": options.selector
      }
    $.ajax options

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
    anchor = if isString(urlOrAnchor) 
      $('<a>').attr(href: urlOrAnchor).get(0)
    else 
      unwrap(urlOrAnchor)
    normalized = anchor.protocol + "//" + anchor.hostname
    normalized += ":#{anchor.port}" unless isStandardPort(anchor.protocol, anchor.port)  
    normalized += anchor.pathname
    normalized += anchor.hash if options?.hash == true
    normalized += anchor.search unless options?.search == false
    normalized

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
    element.innerHTML = html
    element

  error = (args...) ->
    message = if args.length == 1 && up.util.isString(args[0]) then args[0] else JSON.stringify(args)
    console.log("[UP] Error: #{message}", args...)
    alert message
    throw message

  createSelectorFromElement = ($element) ->
    console.log("Creating selector from element", $element)
    classes = if classString = $element.attr("class") then classString.split(" ") else []
    id = $element.attr("id")
    selector = $element.prop("tagName").toLowerCase()
    selector += "#" + id  if id
    for klass in classes
      selector += "." + klass
    selector

  # jQuery's implementation of $(...) cannot create elements that have
  # an <html> or <body> tag. So we're using native elements.
  createElementFromHtml = (html) ->
    htmlElementPattern = /<html>((?:.|\n)*)<\/html>/i
    innerHtml = undefined
    if match = html.match(htmlElementPattern)
      innerHtml = match[1]
    else
      innerHtml = "<html><body>#{html}</body></html>"
    createElement('html', innerHtml)

  extend = $.extend

  each = (collection, block) ->
    block(item, index) for item, index in collection

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
#    (isString(object) && object == "") || # String
    (object.length == 0)                  # String, Array, jQuery
  
  presence = (object, checker = isPresent) ->
    if checker(object) then object else null
  
  isPresent = (object) ->
    !isBlank(object)

  isFunction = (object) ->
    typeof(object) == 'function'

  isString = (object) ->
    typeof(object) == 'string'
    
  isHash = (object) ->
    typeof(object) == 'object' && !!object

  isObject = (object) ->
    isHash(object) || (typeof object == 'function')

  isJQuery = (object) ->
    object instanceof jQuery

  isPromise = (object) ->
    isFunction(object.then)
    
  ifGiven = (object) ->
    object if isGiven(object)

  # https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  isArray = Array.isArray

  copy = (object)  ->
    if isArray(object)
      object.slice()
    else
      extend({}, object)

  unwrap = (object) ->
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
    detect(args, (arg) ->
      value = arg
      value = value() if isFunction(value)
      isPresent(value)
    )

  detect = (array, tester) ->
    match = null
    array.every (element) ->
      if tester(element)
        match = element
        false
      else
        true
    match
    
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
    
  temporaryCss = ($element, css, block) ->
    
    oldCss = $element.css(Object.keys(css))
#    oldCss = {}
#    for property of css
#      oldCss[property] = $element.css(property)
    $element.css(css)
    memo = -> $element.css(oldCss)
    if block
      block()
      memo()
    else
      memo

  ###*
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

  ###
  cssAnimate = (elementOrSelector, lastFrame, opts) ->
    opts = options(opts, 
      duration: 300, 
      delay: 0, 
      easing: 'ease'
    )
    $element = $(elementOrSelector)
    deferred = $.Deferred()
    transition =
      'transition-property': Object.keys(lastFrame).join(', ')
      'transition-duration': "#{opts.duration}ms"
      'transition-delay': "#{opts.delay}ms"
      'transition-timing-function': opts.easing
    withoutTransition = temporaryCss($element, transition)
    $element.css(lastFrame)
    deferred.then(withoutTransition)
    setTimeout((-> deferred.resolve()), opts.duration + opts.delay)
    deferred.promise()
    
  measure = ($element, options) ->
    offset = $element.offset()
    box = 
      left: offset.left
      top: offset.top
      width: $element.outerWidth()
      height: $element.outerHeight()
    if options?.full
      viewport = clientSize()
      box.right = viewport.width - (box.left + box.width)
      box.bottom = viewport.height - (box.top + box.height)
    box
    
  copyAttributes = ($source, $target) ->
    for attr in $source.get(0).attributes
      if attr.specified
        $target.attr(attr.name, attr.value)

  prependGhost = ($element) ->
    dimensions = measure($element)
    $ghost = $element.clone()
    $ghost.find('script').remove()
    $ghost.css
      right: ''
      bottom: ''
      margin: 0
      position: 'absolute'
    $ghost.css(dimensions)
    $ghost.addClass('up-ghost')
    $ghost.prependTo(document.body)

  findWithSelf = ($element, selector) ->
    $element.find(selector).addBack(selector)

  escapePressed = (event) ->
    event.keyCode == 27
    
  contains = (array, element) ->
    array.indexOf(element) >= 0
    
  castsToTrue = (object) ->
    String(object) == "true"
    
  castsToFalse = (object) ->
    String(object) == "false"

#  memoArray = ->
#    array = []
#    defaults = []
#    array.snapshot = ->
#      defaults = copy(array)
#    array.reset = (destroyer) ->
#      if destroyer
#        for element in array
#          unless contains(defaults, element)
#            destroyer()
#      replaceInPlace(array, defaults)
#    array
#  
#  replaceInPlace = (array, replacement) ->
#    array.splice(0, array.length, replacement...)    
    
  presentAttr: presentAttr
  createElement: createElement
  normalizeUrl: normalizeUrl
  createElementFromHtml: createElementFromHtml
  $createElementFromSelector: $createElementFromSelector
  createSelectorFromElement: createSelectorFromElement
  get: get
  ajax: ajax
  extend: extend
  copy: copy
  merge: merge
  options: options
  option: option
  error: error
  each: each
  detect: detect
  select: select
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
  isJQuery: isJQuery
  isPromise: isPromise
  isHash: isHash
  ifGiven: ifGiven
  unwrap: unwrap
  nextFrame: nextFrame
  measure: measure
  temporaryCss: temporaryCss
  cssAnimate: cssAnimate
  prependGhost: prependGhost
  escapePressed: escapePressed
  copyAttributes: copyAttributes
  findWithSelf: findWithSelf
  contains: contains
  isArray: isArray
  castsToTrue: castsToTrue
  castsToFalse: castsToFalse
#  memoArray: memoArray
#  replaceInPlace: replaceInPlace

)()
