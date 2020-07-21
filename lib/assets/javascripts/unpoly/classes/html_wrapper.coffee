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
    "<div #{@attrName}='#{u.escapeHTML(match)}'></div>"

  unwrap: (element) ->
    return unless @didWrap
    for wrappedChild in element.querySelectorAll("[#{@attrName}]")
      originalHTML = wrappedChild.getAttribute(@attrName)
      restoredElement = e.createFromHTML(originalHTML)
      e.replace(wrappedChild, restoredElement)
