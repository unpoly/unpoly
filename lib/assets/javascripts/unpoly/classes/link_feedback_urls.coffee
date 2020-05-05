u = up.util

class up.LinkFeedbackURLs

  constructor: (link) ->
    normalize = up.feedback.normalizeURL

    # A link with an unsafe method will never be higlighted with .up-current.
    @isSafe = up.link.isSafe(link)

    if @isSafe
      href = link.getAttribute('href')
      if href && href != '#'
        @href = normalize(href)

      upHREF = link.getAttribute('up-href')
      if upHREF
        @upHREF = normalize(upHREF)

      alias = link.getAttribute('up-alias')
      if alias
        @aliasPattern = new up.URLPattern(alias, normalize)

  isCurrent: (normalizedLocation) ->
    # It is important to return false instead of a falsey value.
    # up.feedback feeds the return value to element.toggleClass(), which would use a default for undefined.
    return @isSafe && !!(
      (@href && @href == normalizedLocation) ||
      (@upHREF && @upHREF == normalizedLocation) ||
      (@aliasPattern && @aliasPattern.matches(normalizedLocation, false))
    )
