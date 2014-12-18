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
          c++
        html = "<" + tag
        html += " class=\"" + classes.join(" ") + "\""  if classes.length
        html += " id=\"" + id + "\""  if id
        html += ">"
        $element = $(html)
        $element.appendTo $parent
      p++
    $element

  createBody = (html) ->
    createElement "body", html

  createElement = (tagName, html) ->
    element = document.createElement(tagName)
    element.innerHTML = html
    element

  error = (message) ->
    alert message
    throw message

  createSelectorFromElement = ($element) ->
    classes = $element.attr("class").split(" ")
    id = $element.attr("id")
    selector = $element.prop("tagName").toLowerCase()
    selector += "#" + id  if id
    for klass in classes
      selector += "." + klass
    selector

  # jQuery's implementation of $(...) cannot create elements that have
  # an <html> or <body> tag.
  $createElementFromHtml = (html) ->
    htmlElementPattern = /<html>((?:.|\n)*)<\/html>/i
    #    console.log("match", html.match(htmlElementPattern), htmlElementPattern, html)
    if match = html.match(htmlElementPattern)
      $(createElement('html', match[1]))
    else
      $(html)

  each = (collection, block) ->
    block(item) for item in collection

  createBody: createBody
  createElement: createElement
  normalizeUrl: normalizeUrl
  $createElementFromHtml: $createElementFromHtml
  $createElementFromSelector: $createElementFromSelector
  createSelectorFromElement: createSelectorFromElement
  get: get
  ajax: ajax
  extend: $.extend
  error: error
  each: each
)()
