u = up.util
e = up.element

class up.ResponseDoc

  constructor: (options) ->
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
    @noscriptWrapper = new up.HtmlWrapper('noscript')

    # We wrap <script> tags into a <div> because <script> tags parsed by
    # HTMLParser will not execute their content once appended to the DOM.
    @scriptWrapper = new up.HtmlWrapper('script', guard: @isInlineScript)

    if document = options.document
      @parsedRoot = @retrieveRoot(document, e.createDocumentFromHtml)

    else if content = options.content
      # TODO: Instead of up.ResponseDoc wrapping content, maybe the extract plans can deal with both { content } or { responseDoc }. Or a different implementation of up.ResponseDoc.
      content = @retrieveRoot(content, e.createFromHtml)
      # If given { content } we will wrap it in a <div> that always matches the given { target }
      target = options.target or throw "must pass a { target } when passing { content }"
      @parsedRoot = e.createFromSelector(target)
      @parsedRoot.appendChild(content)

    else
      throw "must pass either { document } or { content }"

  retrieveRoot: (element, stringParser) ->
    if u.isString(element)
      element = @noscriptWrapper.wrap(element)
      element = @scriptWrapper.wrap(element)
      element = stringParser(element)
    element

  title: ->
    @parsedRoot.querySelector("head title")?.textContent

  first: (selector) ->
    e.first(@parsedRoot, selector)

  unwrapNoscripts: (element) ->
    @noscriptWrapper.unwrap(element)

  unwrapScripts: (element) ->
    @scriptWrapper.unwrap(element)

  isInlineScript: (element) ->
    element.hasAttribute('src')
