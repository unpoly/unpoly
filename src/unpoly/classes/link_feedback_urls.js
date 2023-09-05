up.LinkFeedbackURLs = class LinkFeedbackURLs {

  constructor(link) {
    const normalize = up.feedback.normalizeURL

    // A link with an unsafe method will never be higlighted with .up-current.
    this._isSafe = up.link.isSafe(link)

    if (this._isSafe) {
      const href = link.getAttribute('href')
      if (href && (href !== '#')) {
        this.href = normalize(href)
      }

      const upHREF = link.getAttribute('up-href')
      if (upHREF) {
        this._upHREF = normalize(upHREF)
      }

      const alias = link.getAttribute('up-alias')
      if (alias) {
        this._aliasPattern = new up.URLPattern(alias, normalize)
      }
    }
  }

  isCurrent(normalizedLocation) {
    // It is important to return false instead of a falsey value.
    // up.feedback feeds the return value to element.classList.toggle(),
    // which would use a default for undefined.
    return this._isSafe && !!(
      this.href === normalizedLocation ||
      this._upHREF === normalizedLocation ||
      this._aliasPattern?.test?.(normalizedLocation, false)
    )
  }
}
