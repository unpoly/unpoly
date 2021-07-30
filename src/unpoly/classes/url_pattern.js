const u = up.util

up.URLPattern = class URLPattern {

  constructor(fullPattern, normalizeURL = u.normalizeURL) {
    this.normalizeURL = normalizeURL
    this.groups = []

    const positiveList = []
    const negativeList = []

    for (let pattern of u.splitValues(fullPattern)) {
      if (pattern[0] === '-') {
        negativeList.push(pattern.substring(1))
      } else {
        positiveList.push(pattern)
      }
    }

    this.positiveRegexp = this.buildRegexp(positiveList, true)
    this.negativeRegexp = this.buildRegexp(negativeList, false)
  }

  buildRegexp(list, capture) {
    if (!list.length) { return; }

    let reCode = list.map(this.normalizeURL).map(u.escapeRegExp).join('|')

    reCode = reCode.replace(/\\\*/g, '.*?')

    reCode = reCode.replace(/(\:|\\\$)([a-z][\w-]*)/ig, (match, type, name) => {
      // It's \\$ instead of $ because we do u.escapeRegExp above
      if (type === '\\$') {
        if (capture) { this.groups.push({ name, cast: Number }); }
        return '(\\d+)'
      } else {
        if (capture) { this.groups.push({ name, cast: String }); }
        return '([^/?#]+)'
      }
    })

    return new RegExp('^' + reCode + '$')
  }

  // This method is performance-sensitive. It's called for every link in an [up-nav]
  // after every fragment update.
  test(url, doNormalize = true) {
    if (doNormalize) { url = this.normalizeURL(url); }
    // Use RegExp#test() instead of RegExp#recognize() as building match groups is expensive,
    // and we only need to know whether the URL matches (true / false).
    return this.positiveRegexp.test(url) && !this.isExcluded(url)
  }

  recognize(url, doNormalize = true) {
    if (doNormalize) { url = this.normalizeURL(url); }
    let match = this.positiveRegexp.exec(url)
    if (match && !this.isExcluded(url)) {
      const resolution = {}
      this.groups.forEach((group, groupIndex) => {
        let value = match[groupIndex + 1]
        if (value) {
          return resolution[group.name] = group.cast(value)
        }
      })
      return resolution
    }
  }

  isExcluded(url) {
    return this.negativeRegexp?.test(url)
  }
}
