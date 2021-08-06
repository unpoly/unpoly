const u = up.util
const e = up.element

up.HTMLWrapper = class HTMLWrapper {

  constructor(tagName) {
    this.tagName = tagName
    const openTag = `<${this.tagName}[^>]*>`
    const closeTag = `</${this.tagName}>`
    const innerHTML = "(.|\\s)*?"
    this.pattern = new RegExp(openTag + innerHTML + closeTag, 'ig')
    this.attrName = `up-wrapped-${this.tagName}`
  }

  strip(html) {
    return html.replace(this.pattern, '')
  }

  wrap(html) {
    return html.replace(this.pattern, this.wrapMatch.bind(this))
  }

  wrapMatch(match) {
    this.didWrap = true

    // Use a tag that may exist in both <head> and <body>.
    // If we wrap a <head>-contained <script> tag in a <div>, Chrome will
    // move that <div> to the <body>.
    return '<meta name="' + this.attrName + '" value="' + u.escapeHTML(match) + '">'
  }

  unwrap(element) {
    if (!this.didWrap) { return }

    for (let wrappedChild of element.querySelectorAll(`meta[name='${this.attrName}']`)) {
      const originalHTML = wrappedChild.getAttribute('value')
      const restoredElement = e.createFromHTML(originalHTML)
      e.replace(wrappedChild, restoredElement)
    }
  }
}
