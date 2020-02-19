u = up.util

class up.UrlPattern

  constructor: (pattern, normalizeUrl) ->
    @normalizeUrlFn = normalizeUrl
    @groupNames = []
    pattern = @normalizeUrl(pattern)
    pattern = u.escapeRegexp(pattern)
    pattern = pattern.replace /\\\*/g, '.*?'
    pattern = pattern.replace /\:([\w-]+)/ig, (match, name) =>
      @groupNames.push(name)
      return '([^/?#]+)'
    @pattern = new RegExp('^' + pattern + '$')

  normalizeUrl: (url) ->
    @normalizeUrlFn?(url) || url

  matches: (url) ->
    url = @normalizeUrl(url)
    return @pattern.test(url)

  recognize: (url) ->
    url = @normalizeUrl(url)
    if match = @pattern.exec(url)
      u.mapObject @groupNames, (groupName, groupIndex) ->
        [groupName, match[groupIndex + 1]]
