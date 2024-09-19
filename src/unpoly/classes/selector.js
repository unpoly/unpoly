const u = up.util
const e = up.element

up.Selector = class Selector {

  constructor(selector, elementOrDocument, options = {}) {
    this._filters = []

    if (!options.destroying) {
      this._filters.push(up.fragment.isNotDestroying)
    }

    // If we're given an element that is detached *or* from another document
    // (think up.ResponseDoc) we are not filtering by element layer.
    this._matchingInExternalDocument = elementOrDocument && !document.contains(elementOrDocument)

    let expandTargetLayer

    if (this._matchingInExternalDocument || options.layer === 'any') {
      expandTargetLayer = up.layer.root
    } else {
      // Some up.fragment function center around an element, like up.fragment.closest(element, selector).
      // In this case up.fragment passes us that element and we can auto-pick the layer based on that.
      options.layer ??= u.presence(elementOrDocument, u.isElement)

      this._layers = up.layer.getAll(options)

      if (!this._layers.length) throw new up.CannotMatch(["Unknown layer: %o", options.layer])

      if (up.layer.count > 1) {
        this._filters.push(match => u.some(this._layers, layer => layer.contains(match)))
      }

      expandTargetLayer = this._layers[0]
    }

    this._selectors = up.fragment.expandTargets(selector, {...options, layer: expandTargetLayer})

    // If the user has set config.mainTargets = [] then a selector :main
    // will resolve to an empty array.
    this._unionSelector = this._selectors.join() || 'match-none'
  }

  matches(element) {
    return u.isElement(element) && element.matches(this._unionSelector) && this._passesFilter(element)
  }

  closest(element) {
    return this._filterOne(element.closest(this._unionSelector))
  }

  descendants(root = document) {
    return this._filterMany(root.querySelectorAll(this._unionSelector))
  }

  firstDescendant(root) {
    if (root || this._matchingInExternalDocument) {
      root ||= document
      // We don't need to filter in an external document:
      // (1) An external document will not have layers.
      // (2) An external document will not have .up-destroying classes.
      return u.findResult(this._selectors, (selector) => {
        return this._filterMany(
          root.querySelectorAll(selector)
        )[0]
      })
    } else {
      // We make multiple queries here:
      //
      // (1) When we expand a selector into multiple native selectors, earlier selectors should match first.
      //    E.g. `up.fragment.config.mainTargets` may match multiple elements in a layer
      //    (like .container and body), but up.fragment.get(':main') should prefer to match .container.
      //
      // (2) When we match within multiple layers, earlier layers should match first.
      //     E.g. `up.fragment.get('main', { layer: 'current root' }` may match a main element in both
      //    layers, but we should return the match in `'current'`.
      return u.findResult(this._layers, (layer) => {
        return u.findResult(this._selectors, (selector) => {
          return this._filterMany(
            e.subtree(layer.element, selector)
          )[0]
        })
      })
    }
  }

  subtree(root) {
    return this._filterMany(e.subtree(root, this._unionSelector))
  }

  _passesFilter(element) {
    return element && u.every(this._filters, filter => filter(element))
  }

  _filterOne(element) {
    return u.presence(element, this._passesFilter.bind(this))
  }

  _filterMany(elements) {
    return u.filter(elements, this._passesFilter.bind(this))
  }

}
