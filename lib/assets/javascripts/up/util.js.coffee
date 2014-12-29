up.util = (->

  #    function createDocument(html) {
  #      var doc = document.documentElement.cloneNode();
  #      doc.innerHTML = html;
  #//    doc.head = doc.querySelector('head');
  #      doc.body = doc.querySelector('body');
  #      return doc;
  #    }
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

  normalizeUrl = (string) ->
    anchor = $("<a>").attr(href: string)[0]
    anchor.protocol + "//" + anchor.hostname + ":" + anchor.port + anchor.pathname + anchor.search

  $createElementFromSelector = (selector) ->
    path = selector.split(/[ >]/)
    $element = undefined
    for depthSelector in path
      $parent = $element or $(document.body)
      $element = $parent.find(depthSelector)
      if $element.length is 0
        conjunction = depthSelector.match(/(^|\.|\#)\w+/g)
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
        $element.appendTo $parent
    $element

  createElement = (tagName, html) ->
    element = document.createElement(tagName)
    element.innerHTML = html
    element

  error = (object) ->
    message = if up.util.isObject(object) then JSON.stringify(object) else object
    console.log("[UP] Error: #{message}", object)
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

#  # jQuery's implementation of $(...) cannot create elements that have
#  # an <html> or <body> tag.
#  $createElementFromHtml = (html) ->
#    htmlElementPattern = /<html>((?:.|\n)*)<\/html>/i
#    #    console.log("match", html.match(htmlElementPattern), htmlElementPattern, html)
#    if match = html.match(htmlElementPattern)
##      console.log("creating element from string", match[1])
##      console.log("got element", createElement('html', match[1]))
##      window.LAST_ELEMENT = createElement('html', match[1])
#      $(createElement('html', match[1]))
#    else
#      $(html)

  extend = $.extend

  each = (collection, block) ->
    block(item) for item in collection

  isNull = (object) ->
    object == null

  isUndefined = (object) ->
    object == `void(0)`

  isGiven = (object) ->
    !isUndefined(object) && !isNull(object)

  isFunction = (object) ->
    typeof(object) == 'function'

  isObject = (object) ->
    type = typeof object
    type == 'function' || type == 'object' && !!object

  isJQuery = (object) ->
    object instanceof jQuery

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
        if isObject(defaultValue)
          merged[key] = options(value, defaultValue)
        else if not isGiven(value)
          merged[key] = defaultValue
    merged

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
  isNull: isNull
  isUndefined: isUndefined
  isGiven: isGiven
  isObject: isObject
  isFunction: isFunction
  isJQuery: isJQuery
  unwrap: unwrap

)()
