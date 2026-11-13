import * as u from '../util.js'

/**
A named placeholder in a URL pattern (`:name` or `$name`), and how to cast its value.
@internal
*/
interface URLPatternGroup {
  name: string
  cast: (value: string) => string | number
}

// Prefixed, so the binding doesn't shadow the browser's `URLPattern` here or in importers.
// The class is internal (`up.internal.UpURLPattern`), so unpoly.ts doesn't give it a public name.
export class UpURLPattern {
  declare _groups: URLPatternGroup[]
  declare _positiveRegexp: RegExp
  declare _negativeRegexp?: RegExp

  // Takes a space-separated string of patterns, or an array of patterns.
  // Patterns prefixed with a minus (`-/admin/*`) exclude URLs.
  constructor(fullPattern: string | string[]) {
    this._groups = []

    const positiveList = []
    const negativeList = []

    for (let pattern of u.getSimpleTokens(fullPattern)) {
      if (pattern[0] === '-') {
        negativeList.push(pattern.substring(1))
      } else {
        positiveList.push(pattern)
      }
    }

    // A pattern with only exclusions, like "-/admin/*", matches every other URL.
    if (!positiveList.length) positiveList.push('*')

    this._positiveRegexp = this._buildRegexp(positiveList, true)!
    this._negativeRegexp = this._buildRegexp(negativeList, false)
  }

  _buildRegexp(list: string[], capture: boolean): RegExp | undefined {
    if (!list.length) { return }

    list = u.flatMap(list, u.matchableURLPatternAtom)
    list = list.map(u.escapeRegExp)

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
  test(url: string, doNormalize = true): boolean {
    // matchableURL() only returns undefined for an empty URL.
    if (doNormalize) { url = u.matchableURL(url)! }
    // Use RegExp#test() instead of RegExp#recognize() as building match groups is expensive,
    // and we only need to know whether the URL matches (true / false).
    return this._positiveRegexp.test(url) && !this._isExcluded(url)
  }

  recognize(url: string, doNormalize = true): Record<string, string | number> | undefined {
    if (doNormalize) { url = u.matchableURL(url)! }
    let match = this._positiveRegexp.exec(url)
    if (match && !this._isExcluded(url)) {
      const resolution: Record<string, string | number> = {}
      this._groups.forEach((group, groupIndex) => {
        let value = match[groupIndex + 1]
        if (value) {
          return resolution[group.name] = group.cast(value)
        }
      })
      return resolution
    }
  }

  _isExcluded(url: string): boolean | undefined {
    return this._negativeRegexp?.test(url)
  }
}
