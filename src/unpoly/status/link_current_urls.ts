import * as u from '../util.js'
import { UpURLPattern } from '../util/url_pattern.js'
import { isSafe } from '../link.js'

export class LinkCurrentURLs {
  declare _isSafe: boolean
  declare _href: string | undefined
  declare _upHREF: string | undefined
  declare _aliasPattern: UpURLPattern | undefined

  constructor(link: Element) {
    // A link with an unsafe method will never be highlighted with .up-current.
    this._isSafe = isSafe(link)

    if (this._isSafe) {
      const href = link.getAttribute('href')
      if (href && (href !== '#')) {
        this._href = u.matchableURL(href)
      }

      const upHREF = link.getAttribute('up-href')
      if (upHREF) {
        this._upHREF = u.matchableURL(upHREF)
      }

      const alias = link.getAttribute('up-alias')
      if (alias) {
        this._aliasPattern = new UpURLPattern(alias)
      }
    }
  }

  isCurrent(normalizedLocation: string | undefined): boolean {
    // In overlays without history no link is considered current.
    if (!normalizedLocation) {
      return false
    }

    // It is important to return false instead of a falsey value.
    // up.status feeds the return value to element.classList.toggle(),
    // which would use a default for undefined.
    return !!(
      this._href === normalizedLocation ||
      this._upHREF === normalizedLocation ||
      this._aliasPattern?.test?.(normalizedLocation, false)
    )
  }

  isAnyCurrent(normalizedLocations: string[]): boolean {
    // It is important to return false instead of a falsey value.
    // up.status feeds the return value to element.classList.toggle(),
    // which would use a default for undefined.
    return normalizedLocations.some((normalizedLocation) => (
      this._href === normalizedLocation ||
      this._upHREF === normalizedLocation ||
      this._aliasPattern?.test?.(normalizedLocation, false)
    ))
  }
}
