u = up.util

class up.UrlSet

  constructor: (@urls, options = {}) ->
    @normalizeUrl = options.normalizeUrl || u.normalizeUrl
    @urls = u.map(@urls, @normalizeUrl)
    @urls = u.compact(@urls)

  matches: (testUrl) =>
    if testUrl.indexOf('*') >= 0
      @doesMatchPattern(testUrl)
    else
      @doesMatchFully(testUrl)

  doesMatchFully: (testUrl) =>
    u.contains(@urls, testUrl)

  doesMatchPattern: (pattern) =>
    placeholder = "__ASTERISK__"
    pattern = pattern.replace(/\*/g, placeholder)
    pattern = u.escapeRegexp(pattern)
    pattern = pattern.replace(new RegExp(placeholder, 'g'), '.*?')
    pattern = new RegExp('^' + pattern + '$')

    u.detect @urls, (url) -> pattern.test(url)

  matchesAny: (testUrls) =>
    u.detect(testUrls, @matches)

  "#{u.isEqual.key}": (otherSet) =>
    u.isEqual(@urls, otherSet?.urls)
