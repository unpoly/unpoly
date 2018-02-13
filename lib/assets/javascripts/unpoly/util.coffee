###*
Utility functions
=================
  
Unpoly comes with a number of utility functions
that might save you from loading something like [Lodash](https://lodash.com/).

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
  Ensures that the given function can only be called a single time.
  Subsequent calls will return the return value of the first call.

  Note that this is a simple implementation that
  doesn't distinguish between argument lists.

  @function up.util.memoize
  @internal
  ###
  memoize = (func) ->
    cachedValue = undefined
    cached = false
    (args...) ->
      if cached
        cachedValue
      else
        cached = true
        cachedValue = func(args...)

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
  @param {boolean} [options.hash=false]
    Whether to include an `#hash` anchor in the normalized URL
  @param {boolean} [options.search=true]
    Whether to include a `?query` string in the normalized URL
  @param {boolean} [options.stripTrailingSlash=false]
    Whether to strip a trailing slash from the pathname
  @internal
  ###
  normalizeUrl = (urlOrAnchor, options) ->
    parts = parseUrl(urlOrAnchor)
    normalized = parts.protocol + "//" + parts.hostname
    normalized += ":#{parts.port}" unless isStandardPort(parts.protocol, parts.port)
    pathname = parts.pathname
    # Some IEs don't include a leading slash in the #pathname property.
    # We have seen this in IE11 and W3Schools claims it happens in IE9 or earlier
    # http://www.w3schools.com/jsref/prop_anchor_pathname.asp
    pathname = "/#{pathname}" unless pathname[0] == '/'
    pathname = pathname.replace(/\/$/, '') if options?.stripTrailingSlash == true
    normalized += pathname
    normalized += parts.hash if options?.hash == true
    normalized += parts.search unless options?.search == false
    normalized

  isCrossDomain = (targetUrl) ->
    currentUrl = parseUrl(location.href)
    targetUrl = parseUrl(targetUrl)
    currentUrl.protocol != targetUrl.protocol || currentUrl.host != targetUrl.host

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
    # In case someone passed us a $link, unwrap it
    urlOrAnchor = unJQuery(urlOrAnchor)

    # If we are handed a parsed URL, just return it
    if urlOrAnchor.pathname
      return urlOrAnchor

    anchor = $('<a>').attr(href: urlOrAnchor).get(0)
    # In IE11 the #hostname and #port properties of such a link are empty
    # strings. However, we can fix this by assigning the anchor its own
    # href because computer:
    # https://gist.github.com/jlong/2428561#comment-1461205
    anchor.href = anchor.href if isBlank(anchor.hostname)
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
  @function up.util.methodAllowsPayload
  @internal
  ###
  methodAllowsPayload = (method) ->
    method != 'GET' && method != 'HEAD'

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
  @param {string|Element|jQuery}
    The element for which to create a selector.
  @experimental
  ###
  selectorForElement = (element) ->
    $element = $(element)
    selector = undefined

    tagName = $element.prop('tagName').toLowerCase()

    if upId = presence($element.attr("up-id"))
      selector = attributeSelector('up-id', upId)
    else if id = presence($element.attr("id"))
      if id.match(/^[a-z0-9\-_]+$/i)
        selector = "##{id}"
      else
        selector = attributeSelector('id', id)
    else if name = presence($element.attr("name"))
      selector = tagName + attributeSelector('name', name)
    else if classes = presence(nonUpClasses($element))
      selector = ''
      for klass in classes
        selector += ".#{klass}"
    else if ariaLabel = presence($element.attr("aria-label"))
      selector = attributeSelector('aria-label', ariaLabel)
    else
      selector = tagName
    selector

  attributeSelector = (attribute, value) ->
    value = value.replace(/"/g, '\\"')
    "[#{attribute}=\"#{value}\"]"

  nonUpClasses = ($element) ->
    classString = $element.attr('class') || ''
    classes = classString.split(' ')
    select classes, (klass) -> isPresent(klass) && !klass.match(/^up-/)

  # jQuery's implementation of $(...) cannot create elements that have
  # an <html> or <body> tag. So we're using native elements.
  # Also IE9 cannot set innerHTML on a <html> or <head> element.
  createElementFromHtml = (html) ->
    parser = new DOMParser()
    parser.parseFromString(html, 'text/html')

  assignPolyfill = (target, sources...) ->
    for source in sources
      for own key, value of source
        target[key] = value
    target

  ###*
  Merge the own properties of one or more `sources` into the `target` object.

  @function up.util.assign
  @param {Object} target
  @param {Array<Object>} sources...
  @stable
  ###
  assign = Object.assign || assignPolyfill

  ###*
  Returns a new string with whitespace removed from the beginning
  and end of the given string.

  @param {string}
    A string that might have whitespace at the beginning and end.
  @return {string}
    The trimmed string.
  @stable
  ###
  trim = $.trim

  ###*
  Calls the given function for each element (and, optional, index)
  of the given array.

  @function up.util.each
  @param {Array<T>} array
  @param {Function(T, number)} block
    A function that will be called with each element and (optional) iteration index.
  @stable
  ###
  each = (array, block) ->
    block(item, index) for item, index in array

  ###*
  Translate all items in an array to new array of items.

  @function up.util.map
  @param {Array<T>} array
  @param {Function(T, number): any} block
    A function that will be called with each element and (optional) iteration index.
  @return {Array}
    A new array containing the result of each function call.
  @stable
  ###
  map = each

  ###*
  Calls the given function for the given number of times.

  @function up.util.times
  @param {number} count
  @param {Function} block
  @stable
  ###
  times = (count, block) ->
    block(iteration) for iteration in [0..(count - 1)]

  ###*
  Returns whether the given argument is `null`.

  @function up.util.isNull
  @param object
  @return {boolean}
  @stable
  ###
  isNull = (object) ->
    object == null

  ###*
  Returns whether the given argument is `undefined`.

  @function up.util.isUndefined
  @param object
  @return {boolean}
  @stable
  ###
  isUndefined = (object) ->
    object == undefined

  ###*
  Returns whether the given argument is not `undefined`.

  @function up.util.isDefined
  @param object
  @return {boolean}
  @stable
  ###
  isDefined = (object) ->
    !isUndefined(object)

  ###*
  Returns whether the given argument is either `undefined` or `null`.

  Note that empty strings or zero are *not* considered to be "missing".

  For the opposite of `up.util.isMissing()` see [`up.util.isGiven()`](/up.util.isGiven).

  @function up.util.isMissing
  @param object
  @return {boolean}
  @stable
  ###
  isMissing = (object) ->
    isUndefined(object) || isNull(object) # || isNaN(object)

  ###*
  Returns whether the given argument is neither `undefined` nor `null`.

  Note that empty strings or zero *are* considered to be "given".

  For the opposite of `up.util.isGiven()` see [`up.util.isMissing()`](/up.util.isMissing).

  @function up.util.isGiven
  @param object
  @return {boolean}
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
  @return {boolean}
  @stable
  ###
  isBlank = (object) ->
    isMissing(object) ||                  # null or undefined
    (isObject(object) && Object.keys(object).length == 0) ||
    (object.length == 0)                  # string, Array, jQuery

  ###*
  Returns the given argument if the argument is [present](/up.util.isPresent),
  otherwise returns `undefined`.

  @function up.util.presence
  @param object
  @param {Function(T): boolean} [tester=up.util.isPresent]
    The function that will be used to test whether the argument is present.
  @return {T|undefined}
  @stable
  ###
  presence = (object, tester = isPresent) ->
    if tester(object) then object else undefined

  ###*
  Returns whether the given argument is not [blank](/up.util.isBlank).

  @function up.util.isPresent
  @param object
  @return {boolean}
  @stable
  ###
  isPresent = (object) ->
    !isBlank(object)

  ###*
  Returns whether the given argument is a function.

  @function up.util.isFunction
  @param object
  @return {boolean}
  @stable
  ###
  isFunction = (object) ->
    typeof(object) == 'function'

  ###*
  Returns whether the given argument is a string.

  @function up.util.isString
  @param object
  @return {boolean}
  @stable
  ###
  isString = (object) ->
    typeof(object) == 'string' || object instanceof String

  ###*
  Returns whether the given argument is a number.

  Note that this will check the argument's *type*.
  It will return `false` for a string like `"123"`.

  @function up.util.isNumber
  @param object
  @return {boolean}
  @stable
  ###
  isNumber = (object) ->
    typeof(object) == 'number' || object instanceof Number

  ###*
  Returns whether the given argument is an options hash,

  Differently from [`up.util.isObject()`], this returns false for
  functions, jQuery collections, promises, `FormData` instances and arrays.

  @function up.util.isOptions
  @param object
  @return {boolean}
  @internal
  ###
  isOptions = (object) ->
    typeof(object) == 'object' && !isNull(object) && !isJQuery(object) && !isPromise(object) && !isFormData(object) && !isArray(object)

  ###*
  Returns whether the given argument is an object.

  This also returns `true` for functions, which may behave like objects in JavaScript.

  @function up.util.isObject
  @param object
  @return {boolean}
  @stable
  ###
  isObject = (object) ->
    typeOfResult = typeof(object)
    (typeOfResult == 'object' && !isNull(object)) || typeOfResult == 'function'

  ###*
  Returns whether the given argument is a DOM element.

  @function up.util.isElement
  @param object
  @return {boolean}
  @stable
  ###
  isElement = (object) ->
    !!(object && object.nodeType == 1)

  ###*
  Returns whether the given argument is a jQuery collection.

  @function up.util.isJQuery
  @param object
  @return {boolean}
  @stable
  ###
  isJQuery = (object) ->
    object instanceof jQuery

  ###*
  Returns whether the given argument is an object with a `then` method.

  @function up.util.isPromise
  @param object
  @return {boolean}
  @stable
  ###
  isPromise = (object) ->
    isObject(object) && isFunction(object.then)

  ###*
  Returns whether the given argument is an array.

  @function up.util.isArray
  @param object
  @return {boolean}
  @stable
  ###
  # https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
  isArray = Array.isArray

  ###*
  Returns whether the given argument is a `FormData` instance.

  Always returns `false` in browsers that don't support `FormData`.

  @function up.util.isFormData
  @param object
  @return {boolean}
  @internal
  ###
  isFormData = (object) ->
    object instanceof FormData

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
  Returns a shallow copy of the given array or object.

  @function up.util.copy
  @param {Object|Array} object
  @return {Object|Array}
  @stable
  ###
  copy = (object)  ->
    if isArray(object)
      object = object.slice()
    else if isObject(object) && !isFunction(object)
      object = assign({}, object)
    else
      up.fail('Cannot copy %o', object)
    object

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
    assign({}, sources...)

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
  @param {Function(T): boolean} tester
  @return {T|undefined}
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
  @param {Function(T): boolean} tester
  @return {boolean}
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
  @param {Function(T): boolean} tester
  @return {boolean}
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
  Waits for the given number of milliseconds, the runs the given callback.

  Instead of `up.util.setTimer(0, fn)` you can also use [`up.util.nextFrame(fn)`](/up.util.nextFrame).

  @function up.util.setTimer
  @param {number} millis
  @param {Function} callback
  @stable
  ###
  setTimer = (millis, callback) ->
    setTimeout(callback, millis)

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
  Queue a function to be executed in the next microtask.

  @function up.util.queueMicrotask
  @param {Function} task
  @internal
  ###
  microtask = (task) ->
    Promise.resolve().then(task)

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

  cssAnimate = (elementOrSelector, lastFrame, opts) ->

  ###*
  @internal
  ###
  margins = (selectorOrElement) ->
    $element = $(selectorOrElement)
    withUnits = $element.css(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])
    top:    parseFloat(withUnits['margin-top'])
    right:  parseFloat(withUnits['margin-right'])
    bottom: parseFloat(withUnits['margin-bottom'])
    left:   parseFloat(withUnits['margin-left'])

  ###*
  Measures the given element.

  @function up.util.measure
  @internal
  ###
  measure = ($element, opts) ->
    opts = options(opts, relative: false, inner: false, includeMargin: false)

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

    if opts.includeMargin
      mgs = margins($element)
      box.left -= mgs.left
      box.top -= mgs.top
      box.height += mgs.top + mgs.bottom
      box.width += mgs.left + mgs.right

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

  @function up.util.selectInSubtree
  @internal
  ###
  selectInSubtree = ($element, selector) ->
    $element.find(selector).addBack(selector)

  ###*
  Looks for the given selector in the element, its descendants and its ancestors.

  @function up.util.selectInDynasty
  @internal
  ###
  selectInDynasty = ($element, selector) ->
    $subtree = selectInSubtree($element, selector)
    $ancestors = $element.parents(selector)
    $subtree.add($ancestors)

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
  @param {Array|string} arrayOrString
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
      when 'false' then false
      when 'true', '', attrName then true
      else value # other strings, undefined, null, ...

#  castsToTrue = (object) ->
#    String(object) == "true"
#
#  castsToFalse = (object) ->
#    String(object) == "false"

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
  Returns a promise that will never be resolved.

  @function up.util.unresolvablePromise
  @experimental
  ###
  unresolvablePromise = ->
    new Promise(noop)

  ###*
  Returns an empty jQuery collection.

  @function up.util.nullJQuery
  @internal
  ###
  nullJQuery = ->
    $()

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

    obj.selectInSubtree = ($start) ->
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
      assign(hash, newOptions)
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
  @param {Object|Array|undefined|null} data
  @internal
  ###
  requestDataAsArray = (data) ->
    if isArray(data)
      data
    if isFormData(data)
      # Until FormData#entries is implemented in all major browsers we must give up here.
      # However, up.form will prefer to serialize forms as arrays, so we should be good
      # in most cases. We only use FormData for forms with file inputs.
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

  The returned string does **not** include a leading `?` character.

  @function up.util.requestDataAsQuery
  @param {Object|Array|undefined|null} data
  @internal
  ###
  requestDataAsQuery = (data, opts) ->
    opts = options(opts, purpose: 'url')

    if isString(data)
      data.replace(/^\?/, '')
    else if isFormData(data)
      # Until FormData#entries is implemented in all major browsers we must give up here.
      # However, up.form will prefer to serialize forms as arrays, so we should be good
      # in most cases. We only use FormData for forms with file inputs.
      up.fail('Cannot convert FormData into a query string')
    else if isPresent(data)
      query = $.param(data)
      switch opts.purpose
        when 'url'
          query = query.replace(/\+/g, '%20')
        when 'form'
          query = query.replace(/\%20/g, '+')
        else
          up.fail('Unknown purpose %o', opts.purpose)
      query
    else
      ""

  $submittingButton = ($form) ->
    submitButtonSelector = 'input[type=submit], button[type=submit], button:not([type])'
    $activeElement = $(document.activeElement)
    if $activeElement.is(submitButtonSelector) && $form.has($activeElement)
      $activeElement
    else
      $form.find(submitButtonSelector).first()

  ###*
  Serializes the given form into a request data representation.

  @function up.util.requestDataFromForm
  @return {Array|FormData}
  @internal
  ###
  requestDataFromForm = (form) ->
    $form = $(form)
    hasFileInputs = $form.find('input[type=file]').length

    $button = $submittingButton($form)
    buttonName = $button.attr('name')
    buttonValue = $button.val()

    # We try to stick with an array representation, whose contents we can inspect.
    # We cannot inspect FormData on IE11 because it has no support for `FormData.entries`.
    # Inspection is needed to generate a cache key (see `up.proxy`) and to make
    # vanilla requests when `pushState` is unavailable (see `up.browser.navigate`).
    data = if hasFileInputs then new FormData($form.get(0)) else $form.serializeArray()
    appendRequestData(data, buttonName, buttonValue) if isPresent(buttonName)
    data


  ###*
  Adds a key/value pair to the given request data representation.

  This mutates the given `data` if `data` is a `FormData`, an object
  or an array. When `data` is a string a new string with the appended key/value
  pair is returned.

  @function up.util.appendRequestData
  @param {FormData|Object|Array|undefined|null} data
  @param {string} key
  @param {string|Blob|File} value
  @internal
  ###
  appendRequestData = (data, name, value, opts) ->
    data ||= []

    if isArray(data)
      data.push(name: name, value: value)
    else if isFormData(data)
      data.append(name, value)
    else if isObject(data)
      data[name] = value
    else if isString(data)
      newPair = requestDataAsQuery([ name: name, value: value ], opts)
      data = [data, newPair].join('&')
    data

  ###*
  Merges the request data in `source` into `target`.
  Will modify the passed-in `target`.

  @return
    The merged form data.
  ###
  mergeRequestData = (target, source) ->
    each requestDataAsArray(source), (field) ->
      target = appendRequestData(target, field.name, field.value)
    target

  ###*
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
  @param {string} string
    The text that should be escaped
  @experimental
  ###
  escapeHtml = (string) ->
    string.replace /[&<>"]/g, (char) -> ESCAPE_HTML_ENTITY_MAP[char]

  pluckKey = (object, key) ->
    value = object[key]
    delete object[key]
    value

  renameKey = (object, oldKey, newKey) ->
    object[newKey] = pluckKey(object, oldKey)

  pluckData = (elementOrSelector, key) ->
    $element = $(elementOrSelector)
    value = $element.data(key)
    $element.removeData(key)
    value

  extractOptions = (args) ->
    lastArg = last(args)
    if isOptions(lastArg)
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
      Promise.resolve()
    else
      new Promise (resolve) -> $(resolve)

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
    deferred = newDeferred()
    preview = (args...) ->
      funValue = fun(args...)
      # If funValue is again a Promise, it will defer resolution of `deferred`
      # until `funValue` is resolved.
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
      lastTask = last(@allTasks())
      lastTask?.promise || Promise.resolve()

    allTasks: =>
      tasks = []
      tasks.push(@currentTask) if @currentTask
      tasks = tasks.concat(@queue)
      tasks

    poke: =>
      unless @currentTask # don't start a new task while we're still running one
        if @currentTask = @queue.shift()
          # console.debug('[DivertibleChain.poke] currentTask is now %o', @currentTask)
          promise = @currentTask()
          always promise, =>
            @currentTask = undefined
            @poke()

    asap: (newTasks...) =>
      @queue = map(newTasks, previewable)
      @poke()
      @promise()

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
  @param {Array<Function>} functions...
  @return {Function}
    A function that will call all `functions` if called.

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
#    raceDone = newDeferred()
#    each promises, (promise) ->
#      promise.then -> raceDone.resolve()
#    raceDone.promise()

  ###*
  @function up.util.promiseTimer
  @internal
  ###
  promiseTimer = (ms) ->
    timeout = undefined
    promise = new Promise (resolve, reject) ->
      timeout = setTimer(ms, resolve)
    promise.cancel = -> clearTimeout(timeout)
    promise

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

  Note that this is a memory leak unless you re-attach `$old` to the DOM aferwards.

  @function up.util.detachWith
  @internal
  ###
  detachWith = ($old, $new) ->
    $insertion = $('<div></div>')
    $insertion.insertAfter($old)
    $old.detach()
    $insertion.replaceWith($new)
    $old

  ###*
  Flattens the given `array` a single level deep.

  @function up.util.flatten
  @param {Array} array
    An array which might contain other arrays
  @return {Array}
    The flattened array
  @internal
  ###
  flatten = (array) ->
    flattened = []
    for object in array
      if isArray(object)
        flattened = flattened.concat(object)
      else
        flattened.push(object)
    flattened

  ###*
  Returns whether the given value is truthy.

  @function up.util.isTruthy
  @internal
  ###
  isTruthy = (object) ->
    !!object

  ###*
  Sets the given callback as both fulfillment and rejection handler for the given promise.

  @function up.util.always
  @internal
  ###
  always = (promise, callback) ->
    promise.then(callback, callback)

  ###*
  @function up.util.newDeferred
  @internal
  ###
  newDeferred = ->
    resolve = undefined
    reject = undefined
    nativePromise = new Promise (givenResolve, givenReject) ->
      resolve = givenResolve
      reject = givenReject
    nativePromise.resolve = resolve
    nativePromise.reject = reject
    nativePromise.promise = -> nativePromise # just return self
    nativePromise

  ###*
  Calls the given block. If the block throws an exception,
  a rejected promise is returned instead.

  @function up.util.rejectOnError
  @internal
  ###
  rejectOnError = (block) ->
    try
      block()
    catch error
      Promise.reject(error)

  ###*
  Returns whether the given element is a descendant of the `<body>` element.

  @function up.util.isBodyDescendant
  @internal
  ###
  isBodyDescendant = (element) ->
    $(element).parents('body').length > 0

  requestDataAsArray: requestDataAsArray
  requestDataAsQuery: requestDataAsQuery
  appendRequestData: appendRequestData
  mergeRequestData:  mergeRequestData
  requestDataFromForm: requestDataFromForm
  offsetParent: offsetParent
  fixedToAbsolute: fixedToAbsolute
  isFixed: isFixed
  presentAttr: presentAttr
  parseUrl: parseUrl
  normalizeUrl: normalizeUrl
  normalizeMethod: normalizeMethod
  methodAllowsPayload: methodAllowsPayload
  createElementFromHtml: createElementFromHtml
  $createElementFromSelector: $createElementFromSelector
  $createPlaceholder: $createPlaceholder
  selectorForElement: selectorForElement
  assign: assign
  assignPolyfill: assignPolyfill
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
  isOptions: isOptions
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
  forceCompositing: forceCompositing
  forceRepaint: forceRepaint
  escapePressed: escapePressed
  copyAttributes: copyAttributes
  selectInSubtree: selectInSubtree
  selectInDynasty: selectInDynasty
  contains: contains
  toArray: toArray
  castedAttr: castedAttr
  clientSize: clientSize
  only: only
  except: except
  trim: trim
  unresolvablePromise: unresolvablePromise
  setMissingAttrs: setMissingAttrs
  remove: remove
  memoize: memoize
  scrollbarWidth: scrollbarWidth
  documentHasVerticalScrollbar: documentHasVerticalScrollbar
  config: config
  openConfig: openConfig
  unwrapElement: unwrapElement
  multiSelector: multiSelector
  error: fail
  pluckData: pluckData
  pluckKey: pluckKey
  renameKey: renameKey
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
  flatten: flatten
  isTruthy: isTruthy
  newDeferred: newDeferred
  always: always
  rejectOnError: rejectOnError
  isBodyDescendant: isBodyDescendant
  isCrossDomain: isCrossDomain
  microtask: microtask


)(jQuery)

up.fail = up.util.fail
