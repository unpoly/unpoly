const u = up.util

up.LinkFeedbackURLs = class LinkFeedbackURLs {

  constructor(link) {
    // A link with an unsafe method will never be higlighted with .up-current.
    this._isSafe = up.link.isSafe(link)

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
        this._aliasPattern = new up.URLPattern(alias)
      }
    }
  }

  isCurrent(normalizedLocation) {
    // In overlays without history no link is considered current.
    if (!normalizedLocation) {
      return false
    }

    // It is important to return false instead of a falsey value.
    // up.feedback feeds the return value to element.classList.toggle(),
    // which would use a default for undefined.
    return !!(
      this._href === normalizedLocation ||
      this._upHREF === normalizedLocation ||
      this._aliasPattern?.test?.(normalizedLocation, false)
    )
  }
}
