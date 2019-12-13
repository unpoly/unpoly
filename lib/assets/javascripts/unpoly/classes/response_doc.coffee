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
    @noscriptWrapper = new up.HTMLWrapper('noscript')

    # We wrap <script> tags into a <div> because <script> tags parsed by
    # HTMLParser will not execute their content once appended to the DOM.
    @scriptWrapper = new up.HTMLWrapper('script', guard: @isInlineScript)

    @parsedRoot =
      @parseOuterContent(options) ||
      @parseInnerContent(options) ||
      throw "must pass either { html } or { content }"

  parseOuterContent: (options) ->
    if html = options.html
      if u.isString(html)
        html = @wrapHTML(html)
        html = e.createDocumentFromHTML(html)
      return html

  parseInnerContent: (options) ->
    if content = options.content
      target = options.target or throw "must pass a { target } when passing { content }"
      if u.contains(target, ',')
        throw 'when passing { content } you must { target } a single element'
      matchingElement = e.createFromSelector(target)

      if u.isString(content)
        content = @wrapHTML(content)
        matchingElement.innerHTML = content
      else
        matchingElement.appendChild(content)

      return matchingElement

  wrapHTML: (html) ->
    html = @noscriptWrapper.wrap(html)
    html = @scriptWrapper.wrap(html)
    html

  title: ->
    @parsedRoot.querySelector("head title")?.textContent

  select: (selector) ->
    e.subtree(@parsedRoot, selector)[0]
    # e.first(@parsedRoot, selector)

  isInlineScript: (element) ->
    element.hasAttribute('src')

  activateElement: (element, options) ->
    # Restore <noscript> tags so they become available to compilers
    @noscriptWrapper.unwrap(element)

    # Compile the new fragment
    up.hello(element, options)

    # Run any <script> tags that were within the element
    @scriptWrapper.unwrap(element)
