/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const u = up.util;
const e = up.element;

up.HTMLWrapper = class HTMLWrapper {

  constructor(tagName, options = {}) {
    this.wrapMatch = this.wrapMatch.bind(this);
    this.tagName = tagName;
    const openTag = `<${this.tagName}[^>]*>`;
    const closeTag = `<\/${this.tagName}>`;
    const innerHTML = "(.|\\s)*?";
    this.pattern = new RegExp(openTag + innerHTML + closeTag, 'ig');
    this.attrName = `up-wrapped-${this.tagName}`;
  }

  strip(html) {
    return html.replace(this.pattern, '');
  }

  wrap(html) {
    return html.replace(this.pattern, this.wrapMatch);
  }

  wrapMatch(match) {
    this.didWrap = true;

    // Use a tag that may exist in both <head> and <body>.
    // If we wrap a <head>-contained <script> tag in a <div>, Chrome will
    // move that <div> to the <body>.
    return '<meta name="' + this.attrName + '" value="' + u.escapeHTML(match) + '">';
  }

  unwrap(element) {
    if (!this.didWrap) { return; }
    return (() => {
      const result = [];
      for (let wrappedChild of element.querySelectorAll(`meta[name='${this.attrName}']`)) {
        const originalHTML = wrappedChild.getAttribute('value');
        const restoredElement = e.createFromHTML(originalHTML);
        result.push(e.replace(wrappedChild, restoredElement));
      }
      return result;
    })();
  }
};
