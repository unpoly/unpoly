class up.HtmlWrapper

  constructor: (@tagName, options) ->
    openTag = "<#{@tagName}[^>]*>"
    closeTag = "<\/#{@tagName}>"
    innerHTML = "(.|\\s)*?"
    @pattern = new RegExp(openTag + innerHTML + closeTag, 'ig')
    @className = "up-wrapped-#{@tagName}"
    @guard = options.guard || @noGuard

  wrap: (html) ->
    return html.replace(@pattern, @wrapMatch)

  wrapMatch: (match) =>
    @didWrap = true
    "<div class='#{@className}' data-html='#{u.escapeHtml(match)}'></div>"

  unwrap: (element) ->
    return unless @didWrap
    for wrappedChild in element.querySelectorAll(".#{@tagName}")
      originalHtml = wrappedChild.getAttribute('data-html')
      restoredElement = e.createFromHtml(originalHtml)
      if @guard(restoredElement)
        e.replace(wrappedChild, restoredElement)
      else
        e.remove(restoredElement)

  noGuard: (element) ->
    true
