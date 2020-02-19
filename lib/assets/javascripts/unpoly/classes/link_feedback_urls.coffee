u = up.util

class up.LinkFeedbackURLs

  constructor: (link, @normalizeURL) ->
    @urls = []

    # A link with an unsafe method will never be higlighted with .up-current.
    if up.link.isSafe(link)
      for attr in ['href', 'up-href', 'up-alias']
        @addURL(link.getAttribute(attr))

  addURL: (value) ->
    if value
      # Allow to include multiple space-separated URLs in [up-alias]
      for url in u.splitValues(value)
        unless url == '#'
          url = @normalizeURL(url)
          if u.contains(url, '*')
            url = @regExpFromPattern(url)
          @urls.push(url)

  isCurrent: (normalizedLocation) ->
    u.some @urls, (url) ->
      if u.isString(url)
        return url == normalizedLocation
      else
        return url.test(normalizedLocation)

  regExpFromPattern: (pattern) ->
    placeholder = "__ASTERISK__"
    pattern = pattern.replace(/\*/g, placeholder)
    pattern = u.escapeRegExp(pattern)
    pattern = pattern.replace(new RegExp(placeholder, 'g'), '.*?')
    pattern = new RegExp('^' + pattern + '$')
