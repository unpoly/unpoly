const u = up.util
const CSS_HAS_SUFFIX_PATTERN = /:has\(([^)]+)\)$/

up.Selector = class Selector {

  constructor(selector, elementOrDocument, options = {}) {
    this._filters = []

    if (!options.destroying) {
      this._filters.push(up.fragment.isNotDestroying)
    }

    // If we're given an element that is detached *or* from another document
    // (think up.ResponseDoc) we are not filtering by element layer.
    let matchingInExternalDocument = elementOrDocument && !document.contains(elementOrDocument)

    let expandTargetLayer

    if (matchingInExternalDocument || options.layer === 'any') {
      expandTargetLayer = up.layer.root
    } else {
      // Some up.fragment function center around an element, like closest() or matches().
      options.layer ??= u.presence(elementOrDocument, u.isElement)
      this._layers = up.layer.getAll(options)

      if (!this._layers.length) throw new up.CannotMatch(["Unknown layer: %o", options.layer])

      this._filters.push(match => u.some(this._layers, layer => layer.contains(match)))
      expandTargetLayer = this._layers[0]

    }

    let expandedTargets = up.fragment.expandTargets(selector, {...options, layer: expandTargetLayer})

    this._selectors = expandedTargets.map((target) => {
      target = target.replace(CSS_HAS_SUFFIX_PATTERN, (match, descendantSelector) => {
        this._filters.push(element => element.querySelector(descendantSelector))
        return ''
      })
      return target || '*'
    })

    // If the user has set config.mainTargets = [] then a selector :main
    // will resolve to an empty array.
    this._unionSelector = this._selectors.join() || 'match-none'
  }

  matches(element) {
    return element.matches(this._unionSelector) && this._passesFilter(element)
  }

  closest(element) {
    let parentElement
    if (this.matches(element)) {
      return element
    } else if (parentElement = element.parentElement) {
      return this.closest(parentElement)
    }
  }

  _passesFilter(element) {
    return u.every(this._filters, filter => filter(element))
  }

  descendants(root = document) {
    // There's a requirement that prior selectors must match first.
    // The background here is that up.fragment.config.mainTargets may match multiple
    // elements in a layer (like .container and body), but up.fragment.get(':main') should
    // prefer to match .container.
    //
    // To respect this priority we do not join @selectors into a single, comma-separated
    // CSS selector, but rather make one query per selector and concatenate the results.
    const results = u.flatMap(this._selectors, selector => root.querySelectorAll(selector))
    return u.filter(results, element => this._passesFilter(element))
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
