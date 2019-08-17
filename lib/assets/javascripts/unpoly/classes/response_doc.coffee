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

    if page = options.document
      @parsedRoot = @retrieveRoot(page, e.createDocumentFromHtml)

    else if content = options.content
      # TODO: Instead of up.ResponseDoc wrapping content, maybe the extract plans can deal with both { content } or { responseDoc }. Or a different implementation of up.ResponseDoc.
      # If given { content } we will wrap it in a <div> that always matches the given { target }
      target = options.target or throw "must pass a { target } when passing { content }"

      if u.contains(target, ',')
        throw 'when passing { content } you must { target } a single element'

      # TODO: @retrieveRoot is not a good abstraction anymore if we also need these lines of codes, u.wrapList, etc.
      @parsedRoot = document.createElement('div')

      contentRoot = e.affix(@parsedRoot, target)

      contentNodes = @retrieveRoot(content, @parseMixedHTML)
      console.debug("contentNodes are %o", contentNodes)
      for contentNode in u.wrapList(contentNodes)
        contentRoot.appendChild(contentNode)

    else
      throw "must pass either { document } or { content }"

  retrieveRoot: (content, stringParser) ->
    if u.isString(content)
      content = @wrapHTML(content)
      content = stringParser(content)
    content

  wrapHTML: (html) ->
    html = @noscriptWrapper.wrap(html)
    html = @scriptWrapper.wrap(html)
    html

  parseMixedHTML: (html) ->
    mother = document.createElement('div')
    mother.innerHTML = html
    return mother.childNodes

  title: ->
    @parsedRoot.querySelector("head title")?.textContent

  first: (selector) ->
    e.first(@parsedRoot, selector)

  isInlineScript: (element) ->
    element.hasAttribute('src')

  activateElement: (element, options) ->
    # Restore <noscript> tags so they become available to compilers
    @noscriptWrapper.unwrap(element)

    # Compile the new fragment
    up.hello(element, options)

    # Run any <script> tags that were within the element
    @scriptWrapper.unwrap(element)
