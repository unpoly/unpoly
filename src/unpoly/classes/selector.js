const e = up.element
const u = up.util

up.Selector = class Selector {

  constructor(selectors, filters = []) {
    this.selectors = selectors
    this.filters = filters

    // If the user has set config.mainTargets = [] then a selector :main
    // will resolve to an empty array.
    this.unionSelector = this.selectors.join(',') || 'match-none'
  }

  matches(element) {
    return element.matches(this.unionSelector) && this.passesFilter(element)
  }

  closest(element) {
    let parentElement
    if (this.matches(element)) {
      return element
    } else if (parentElement = element.parentElement) {
      return this.closest(parentElement)
    }
  }

  passesFilter(element) {
    return u.every(this.filters, filter => filter(element))
  }

  descendants(root) {
    // There's a requirement that prior selectors must match first.
    // The background here is that up.fragment.config.mainTargets may match multiple
    // elements in a layer (like .container and body), but up.fragment.get(':main') should
    // prefer to match .container.
    //
    // To respect this priority we do not join @selectors into a single, comma-separated
    // CSS selector, but rather make one query per selector and concatenate the results.
    const results = u.flatMap(this.selectors, selector => root.querySelectorAll(selector))
    return u.filter(results, element => this.passesFilter(element))
  }

  subtree(root) {
    const results = []

    if (!(root instanceof Document) && this.matches(root)) {
      results.push(root)
    }
    results.push(...this.descendants(root))
    return results
  }
}
