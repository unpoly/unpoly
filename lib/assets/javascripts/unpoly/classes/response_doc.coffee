u = up.util
e = up.element

class up.ResponseDoc

  constructor: (options) ->
    if document = options.document
      @parsedRoot = @retrieveElement(document, e.createDocumentFromHtml)

    else if content = options.content
      content = @retrieveElement(content, e.createFromHtml)
      target = options.target or throw "must pass a { target }"
      @parsedRoot = e.createFromSelector(target)
      @parsedRoot.appendChild(content)

    else
      throw "must pass either { document } or { content }"

  retrieveElement: (element, parser) ->
    if u.isString(element)
      element = @wrapNoscriptInHtml(element)
      element = parser(element)
    element

  constructor: (@html) ->
    @wrapNoscriptInHtml()
    @parsedRoot = e.createDocumentFromHtml(@html)

  title: ->
    @parsedRoot.querySelector("head title")?.textContent

  has: (selector) ->
    !!@first(selector)

  selectForInsertion: (selector) ->
    if element = @first(selector)
      @prepareForInsertion(element)
      element

  first: (selector) ->
    e.first(@parsedRoot, selector)

  prepareForInsertion: (element) ->
    @unwrapNoscriptInElement(element)

  wrapNoscriptInHtml: (html) ->
    # We wrap <noscript> tags into a <div> for two reasons:
    #
    # (1) IE11 and Edge cannot find <noscript> tags with jQuery or querySelector() or
    #     getElementsByTagName() when the tag was created by DOMParser. This is a bug.
    #     https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12453464/
    #
    # (2) The children of a <nonscript> tag are expected to be a verbatim text node
    #     in a scripting-capable browser. However, due to rules in the DOMParser spec,
    #     the children are parsed into actual DOM nodes. This confuses libraries that
    #     work with <noscript> tags, such as lazysizes.
    #     http://w3c.github.io/DOM-Parsing/#dom-domparser-parsefromstring
    #
    # We will unwrap the wrapped <noscript> tags when a fragment is requested with
    # #first(), and only in the requested fragment.
    noscriptPattern = /<noscript[^>]*>((.|\s)*?)<\/noscript>/ig
    return html.replace noscriptPattern, (match, content) =>
      @didWrapNoscript = true
      '<div class="up-noscript" data-html="' + u.escapeHtml(content) + '"></div>'

  unwrapNoscriptInElement: (element) ->
    return unless @didWrapNoscript
    wrappedNoscripts = element.querySelectorAll('.up-noscript')
    for wrappedNoscript in wrappedNoscripts
      wrappedContent = wrappedNoscript.getAttribute('data-html')
      noscript = document.createElement('noscript')
      noscript.textContent = wrappedContent
      wrappedNoscript.parentNode.replaceChild(noscript, wrappedNoscript)
