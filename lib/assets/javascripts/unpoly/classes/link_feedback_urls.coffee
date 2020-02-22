u = up.util

class up.LinkFeedbackURLs

  URL_ATTRS = ['href', 'up-href', 'up-alias']

  constructor: (link) ->
    # A link with an unsafe method will never be higlighted with .up-current.
    if up.link.isSafe(link)
      urls = URL_ATTRS.map (attr) -> link.getAttribute(attr)
      urls = u.filter urls, (url) -> url && url != '#'
      @urlPattern = new up.URLPattern(urls, up.feedback.normalizeURL)

  isCurrent: (normalizedLocation) ->
    # In this case it is actually important to return false instead of
    # a falsey value. up.feedback feeds the return value to element.toggleClass(),
    # which would use a default for undefined.
    !!@urlPattern?.matches(normalizedLocation, false)
