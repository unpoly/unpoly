u = up.util

class up.URLSet

  constructor: (@urls, options = {}) ->
    @normalizeURL = options.normalizeURL || u.normalizeURL
    @urls = u.map(@urls, @normalizeURL)
    @urls = u.compact(@urls)

  matches: (testURL) =>
    if testURL.indexOf('*') >= 0
      @doesMatchPattern(testURL)
    else
      @doesMatchFully(testURL)

  doesMatchFully: (testURL) =>
    u.contains(@urls, testURL)

  doesMatchPattern: (pattern) =>
    placeholder = "__ASTERISK__"
    pattern = pattern.replace(/\*/g, placeholder)
    pattern = u.escapeRegexp(pattern)
    pattern = pattern.replace(new RegExp(placeholder, 'g'), '.*?')
    pattern = new RegExp('^' + pattern + '$')

    u.find @urls, (url) -> pattern.test(url)

  matchesAny: (testURLs) =>
    u.find(testURLs, @matches)

  "#{u.isEqual.key}": (otherSet) =>
    u.isEqual(@urls, otherSet?.urls)
