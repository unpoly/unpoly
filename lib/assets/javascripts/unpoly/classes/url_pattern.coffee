u = up.util

class up.URLPattern

  constructor: (pattern, @normalizeURL = u.normalizeURL) ->
    @groups = []

    pattern = u.splitValues(pattern).map(@normalizeURL).map(u.escapeRegExp).join('|')

    pattern = pattern.replace /\\\*/g, '.*?'

    pattern = pattern.replace /(\:|\\\$)([a-z][\w-]*)/ig, (match, type, name) =>
      # It's \\$ instead of $ because we do u.escapeRegExp above
      if type == '\\$'
        @groups.push({ name, cast: Number })
        return '(\\d+)'
      else
        @groups.push({ name, cast: String })
        return '([^/?#]+)'
    @regexp = new RegExp('^' + pattern + '$')

  matches: (url, doNormalize = true) ->
    url = @normalizeURL(url) if doNormalize
    return @regexp.test(url)

  recognize: (url, doNormalize = true) ->
    url = @normalizeURL(url) if doNormalize
    if match = @regexp.exec(url)
      resolution = {}
      @groups.forEach (group, groupIndex) =>
        if value = match[groupIndex + 1]
          resolution[group.name] = group.cast(value)
      return resolution
