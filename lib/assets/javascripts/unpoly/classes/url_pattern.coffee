u = up.util

class up.URLPattern

  constructor: (pattern, @normalizeURL = u.normalizeURL) ->
    @groupNames = []

    if u.isArray(pattern)
      pattern = pattern.join(' ')

    pattern = u.splitValues(pattern).map(@normalizeURL).map(u.escapeRegExp).join('|')
    pattern = pattern.replace /\\\*/g, '.*?'
    pattern = pattern.replace /\:([a-z][\w-]*)/ig, (match, name) =>
      @groupNames.push(name)
      return '([^/?#]+)'
    @regexp = new RegExp('^' + pattern + '$')

  matches: (url, doNormalize = true) ->
    url = @normalizeURL(url) if doNormalize
    return @regexp.test(url)

  recognize: (url, doNormalize = true) ->
    url = @normalizeURL(url) if doNormalize
    if match = @regexp.exec(url)
      resolution = {}
      @groupNames.forEach (groupName, groupIndex) =>
        if value = match[groupIndex + 1]
          resolution[groupName] = value
      return resolution
