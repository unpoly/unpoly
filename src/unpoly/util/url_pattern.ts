import { escapeRegExp, flatMap, getSimpleTokens, matchableURL, matchableURLPatternAtom } from '../util.js'

// A class expression, so the class is still named `URLPattern` at runtime, while the binding
// doesn't shadow the browser's `URLPattern` here or in importers.
export const UpURLPattern = class URLPattern {

  constructor(fullPattern) {
    this._groups = []

    const positiveList = []
    const negativeList = []

    for (let pattern of getSimpleTokens(fullPattern)) {
      if (pattern[0] === '-') {
        negativeList.push(pattern.substring(1))
      } else {
        positiveList.push(pattern)
      }
    }

    this._positiveRegexp = this._buildRegexp(positiveList, true)
    this._negativeRegexp = this._buildRegexp(negativeList, false)
  }

  _buildRegexp(list, capture) {
    if (!list.length) { return }

    list = flatMap(list, matchableURLPatternAtom)
    list = list.map(escapeRegExp)

    let reCode = list.join('|')

    // Wildcards (*)
    reCode = reCode.replace(/\\\*/g, '.*?')

    // Placeholders (:string or $digit)
    reCode = reCode.replace(/(:|\\\$)([a-z][\w-]*)/ig, (match, type, name) => {
      // It's \\$ instead of $ because we do u.escapeRegExp above
      if (type === '\\$') {
        if (capture) { this._groups.push({ name, cast: Number }) }
        return '(\\d+)'
      } else {
        if (capture) { this._groups.push({ name, cast: String }) }
        return '([^/?#]+)'
      }
    })

    return new RegExp('^(?:' + reCode + ')$')
  }

  // This method is performance-sensitive. It's called for every link in an [up-nav]
  // after every fragment update.
  test(url, doNormalize = true) {
    if (doNormalize) { url = matchableURL(url) }
    // Use RegExp#test() instead of RegExp#recognize() as building match groups is expensive,
    // and we only need to know whether the URL matches (true / false).
    return this._positiveRegexp.test(url) && !this._isExcluded(url)
  }

  recognize(url, doNormalize = true) {
    if (doNormalize) { url = matchableURL(url) }
    let match = this._positiveRegexp.exec(url)
    if (match && !this._isExcluded(url)) {
      const resolution = {}
      this._groups.forEach((group, groupIndex) => {
        let value = match[groupIndex + 1]
        if (value) {
          return resolution[group.name] = group.cast(value)
        }
      })
      return resolution
    }
  }

  _isExcluded(url) {
    return this._negativeRegexp?.test(url)
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  URLPattern: UpURLPattern,
}
