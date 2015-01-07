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
    
  isStandardPort = (protocol, port) ->
    (port == 80 && protocol == 'http') || (port == 443 && protocol == 'https')

  normalizeUrl = (urlOrAnchor, options) ->
    anchor = if isString(urlOrAnchor) 
      $('<a>').attr(href: urlOrAnchor).get(0)
    else 
      unwrap(urlOrAnchor)
    normalized = anchor.protocol + "//" + anchor.hostname
    normalized += ":#{anchor.port}" unless isStandardPort(anchor.protocol, anchor.port)  
    normalized += anchor.pathname
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

  isObject = (object) ->
    type = typeof object
    type == 'function' || (type == 'object' && !!object)

  isJQuery = (object) ->
    object instanceof jQuery

  isPromise = (object) ->
    isFunction(object.then)
    
  ifGiven = (object) ->
    object if isGiven(object)

  copy = (object)  ->
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

  cssAnimate = ($element, lastFrame, opts) ->
    opts = options(opts, duration: 300, easing: 'ease')
    deferred = $.Deferred()
    # This should really be "one" instead of "on".
    # We only want this event to be called once, then clean up after ourselves.
    # $element.one(up.browser.transitionEndEvent(), -> deferred.resolve())
    transition =
      'transition-property': Object.keys(lastFrame).join(', ')
      'transition-duration': "#{opts.duration}ms"
      'transition-timing-function': opts.easing
    console.log("CSS transition with", transition)
    withoutTransition = temporaryCss($element, transition)
    $element.css(lastFrame)
    deferred.then(withoutTransition)
    setTimeout((-> deferred.resolve()), opts.duration)
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

  prependGhost = ($element) ->
    dimensions = measure($element)
    $ghost = $element.clone()
    $ghost.css
      right: ''
      bottom: ''
      margin: 0
      position: 'fixed'
    $ghost.css(dimensions)
    $ghost.addClass('up-ghost')
    $ghost.prependTo(document.body)

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
  ifGiven: ifGiven
  unwrap: unwrap
  nextFrame: nextFrame
  measure: measure
  temporaryCss: temporaryCss
  cssAnimate: cssAnimate
  prependGhost: prependGhost

)()
