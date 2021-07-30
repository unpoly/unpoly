const u = up.util

up.LinkFeedbackURLs = class LinkFeedbackURLs {

  constructor(link) {
    const normalize = up.feedback.normalizeURL

    // A link with an unsafe method will never be higlighted with .up-current.
    this.isSafe = up.link.isSafe(link)

    if (this.isSafe) {
      const href = link.getAttribute('href')
      if (href && (href !== '#')) {
        this.href = normalize(href)
      }

      const upHREF = link.getAttribute('up-href')
      if (upHREF) {
        this.upHREF = normalize(upHREF)
      }

      const alias = link.getAttribute('up-alias')
      if (alias) {
        this.aliasPattern = new up.URLPattern(alias, normalize)
      }
    }
  }

  isCurrent(normalizedLocation) {
    // It is important to return false instead of a falsey value.
    // up.feedback feeds the return value to element.toggleClass(), which would use a default for undefined.
    return this.isSafe && !!(
      (this.href && (this.href === normalizedLocation)) ||
      (this.upHREF && (this.upHREF === normalizedLocation)) ||
      (this.aliasPattern && this.aliasPattern.test(normalizedLocation, false))
    )
  }
}
