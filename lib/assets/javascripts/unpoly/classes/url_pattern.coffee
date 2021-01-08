u = up.util

class up.URLPattern

  constructor: (fullPattern, @normalizeURL = u.normalizeURL) ->
    @groups = []

    positiveList = []
    negativeList = []

    u.splitValues(fullPattern).forEach (pattern) ->
      if pattern[0] == '-'
        negativeList.push(pattern.substring(1))
      else
        positiveList.push(pattern)

    @positiveRegexp = @buildRegexp(positiveList, true)
    @negativeRegexp = @buildRegexp(negativeList, false)

  buildRegexp: (list, capture) ->
    return unless list.length

    reCode = list.map(@normalizeURL).map(u.escapeRegExp).join('|')

    reCode = reCode.replace /\\\*/g, '.*?'

    reCode = reCode.replace /(\:|\\\$)([a-z][\w-]*)/ig, (match, type, name) =>
      # It's \\$ instead of $ because we do u.escapeRegExp above
      if type == '\\$'
        @groups.push({ name, cast: Number }) if capture
        return '(\\d+)'
      else
        @groups.push({ name, cast: String }) if capture
        return '([^/?#]+)'

    return new RegExp('^' + reCode + '$')

  # This method is performance-sensitive. It's called for every link in an [up-nav]
  # after every fragment update.
  test: (url, doNormalize = true) ->
    url = @normalizeURL(url) if doNormalize
    # Use RegExp#test() instead of RegExp#recognize() as building match groups is expensive,
    # and we only need to know whether the URL matches (true / false).
    return @positiveRegexp.test(url) && !@isExcluded(url)

  recognize: (url, doNormalize = true) ->
    url = @normalizeURL(url) if doNormalize
    if (match = @positiveRegexp.exec(url)) && !@isExcluded(url)
      resolution = {}
      @groups.forEach (group, groupIndex) =>
        if value = match[groupIndex + 1]
          resolution[group.name] = group.cast(value)
      return resolution

  isExcluded: (url) ->
    return @negativeRegexp?.test(url)
