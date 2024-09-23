const u = up.util
const e = up.element

up.Selector = class Selector {

  constructor(selector, elementOrDocument, options = {}) {
    this._filters = []

    // If we're given an element that is detached *or* from another document
    // (think up.ResponseDoc) we are not filtering by element layer.
    let matchingInExternalDocument = elementOrDocument && !document.contains(elementOrDocument)

    if (!matchingInExternalDocument && !options.destroying) {
      this._filters.push(up.fragment.isNotDestroying)
    }

    this._ignoreLayers = matchingInExternalDocument || options.layer === 'any' || up.layer.count === 1

    let expandTargetLayer

    if (this._ignoreLayers) {
      // Use the root layer to expand layer-specific selectors like `:main` or `:layer`
      expandTargetLayer = up.layer.root
    } else {
      // Some up.fragment function center around an element, like up.fragment.closest(element, selector).
      // In this case up.fragment passes us that element and we can auto-pick the layer based on that.
      options.layer ??= u.presence(elementOrDocument, u.isElement)

      this._layers = up.layer.getAll(options)
      if (!this._layers.length) throw new up.CannotMatch(["Unknown layer: %o", options.layer])

      this._filters.push(match => u.some(this._layers, layer => layer.contains(match)))

      // Use the first layer to expand layer-specific selectors like `:main` or `:layer`
      expandTargetLayer = this._layers[0]
    }

    this._selectors = up.fragment.expandTargets(selector, { ...options, layer: expandTargetLayer })

    // If the user has set config.mainTargets = [] then a selector :main
    // will resolve to an empty array.
    this._unionSelector = this._selectors.join() || 'match-none'
  }

  matches(element) {
    return e.elementLikeMatches(element, this._unionSelector) && this._passesFilter(element)
  }

  closest(element) {
    return this._filterOne(element.closest(this._unionSelector))
  }

  descendants(root = document) {
    return this._filterMany(root.querySelectorAll(this._unionSelector))
  }

  firstDescendant(root) {
    // We make multiple queries here:
    //
    // (1) When we expand a selector into multiple native selectors, earlier selectors should match first.
    //    E.g. `up.fragment.config.mainTargets` may match multiple elements in a layer
    //    (like .container and body), but up.fragment.get(':main') should prefer to match .container.
    //
    // (2) When we match within multiple layers, earlier layers should match first.
    //     E.g. `up.fragment.get('main', { layer: 'current root' }` may match a main element in both
    //    layers, but we should return the match in `'current'`.
    if (this._ignoreLayers) {
      root ||= document
      return this._firstSelectorMatch((selector) => root.querySelectorAll(selector))
    } else {
      return u.findResult(this._layers, (layer) => {
        return this._firstSelectorMatch((selector) => e.subtree(layer.element, selector))
      })
    }
  }

  subtree(root) {
    return this._filterMany(e.subtree(root, this._unionSelector))
  }

  _firstSelectorMatch(fn) {
    return u.findResult(this._selectors, (selector) => {
      return this._filterMany(fn(selector))[0]
    })
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
