u = up.util

class up.UrlSet

  constructor: (@urls, options = {}) ->
    @normalizeUrl = options.normalizeUrl || u.normalizeUrl
    @urls = u.map(@urls, @normalizeUrl)
    @urls = u.compact(@urls)

  matches: (testUrl) =>
    if testUrl.substr(-1) == '*'
      @doesMatchPrefix(testUrl.slice(0, -1))
    else
      @doesMatchFully(testUrl)

  doesMatchFully: (testUrl) =>
    u.contains(@urls, testUrl)

  doesMatchPrefix: (prefix) =>
    u.detect @urls, (url) ->
      url.indexOf(prefix) == 0

  matchesAny: (testUrls) =>
    u.detect(testUrls, @matches)

  isEqual: (otherSet) =>
    u.isEqual(@urls, otherSet?.urls)
