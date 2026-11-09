import { escapeRegExp, flatMap, getSimpleTokens, matchableURL, matchableURLPatternAtom } from '../util.js'

/**
A named placeholder in a URL pattern (`:name` or `$name`), and how to cast its value.
@internal
*/
export interface URLPatternGroup {
  name: string
  cast: (value: string) => string | number
}

// A class expression, so the binding doesn't shadow the browser's `URLPattern` here or in importers.
// The class is internal (`up.internal.UpURLPattern`), so unpoly.ts doesn't give it a public name.
export const UpURLPattern = class URLPattern {
  declare _groups: URLPatternGroup[]
  declare _positiveRegexp: RegExp
  declare _negativeRegexp: RegExp | undefined

  // Takes a space-separated string of patterns, or an array of patterns.
  // Patterns prefixed with a minus (`-/admin/*`) exclude URLs.
  constructor(fullPattern: string | string[]) {
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

    // TODO: A pattern without positive atoms (like "-/admin") has no positive regexp, and
    // test() and recognize() throw.
    this._positiveRegexp = this._buildRegexp(positiveList, true)!
    this._negativeRegexp = this._buildRegexp(negativeList, false)
  }

  _buildRegexp(list: string[], capture: boolean): RegExp | undefined {
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
  test(url: string, doNormalize = true): boolean {
    // matchableURL() only returns undefined for an empty URL.
    if (doNormalize) { url = matchableURL(url)! }
    // Use RegExp#test() instead of RegExp#recognize() as building match groups is expensive,
    // and we only need to know whether the URL matches (true / false).
    return this._positiveRegexp.test(url) && !this._isExcluded(url)
  }

  recognize(url: string, doNormalize = true): Record<string, string | number> | undefined {
    if (doNormalize) { url = matchableURL(url)! }
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

/**
An instance of `up.internal.UpURLPattern`.
@internal
*/
export type UpURLPattern = InstanceType<typeof UpURLPattern>
