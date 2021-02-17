u = up.util
e = up.element

class up.HTMLWrapper

  constructor: (@tagName, options = {}) ->
    openTag = "<#{@tagName}[^>]*>"
    closeTag = "<\/#{@tagName}>"
    innerHTML = "(.|\\s)*?"
    @pattern = new RegExp(openTag + innerHTML + closeTag, 'ig')
    @attrName = "up-wrapped-#{@tagName}"

  strip: (html) ->
    return html.replace(@pattern, '')

  wrap: (html) ->
    return html.replace(@pattern, @wrapMatch)

  wrapMatch: (match) =>
    @didWrap = true

    # Use a tag that may exist in both <head> and <body>.
    # If we wrap a <head>-contained <script> tag in a <div>, Chrome will
    # move that <div> to the <body>.
    '<meta name="' + @attrName + '" value="' + u.escapeHTML(match) + '">'

  unwrap: (element) ->
    return unless @didWrap
    for wrappedChild in element.querySelectorAll("meta[name='#{@attrName}']")
      originalHTML = wrappedChild.getAttribute('value')
      restoredElement = e.createFromHTML(originalHTML)
      e.replace(wrappedChild, restoredElement)
