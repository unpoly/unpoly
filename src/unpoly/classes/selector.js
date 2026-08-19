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

      this._filters.push((match) => u.some(this._layers, (layer) => layer.contains(match)))

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
    // Note that we query per expanded selector, not once for their union: when
    // `up.fragment.config.mainTargets` matches both .container and body, up.fragment.get(':main')
    // must prefer .container even though body comes first in the document.
    //
    // An *element* root is searched directly. The layer filter in this._filters is what
    // keeps matches inside the requested layers, and it must: a root like <body> contains
    // other layers' elements, since an overlay is appended to <body>.
    //
    // A Document root narrows nothing, so it is not a root for our purposes. Treating it
    // as one would search the whole document and let the layer filter (which accepts a
    // match in *any* requested layer) pick, losing the layer preference below.
    if (u.isElement(root)) {
      return this._firstSelectorMatch((selector) => root.querySelectorAll(selector))
    } else if (this._ignoreLayers) {
      // With layers out of the picture the container is a whole document: the one we were
      // given (up.ResponseDoc passes its own), or ours.
      return this._firstSelectorMatch((selector) => (root || document).querySelectorAll(selector))
    } else {
      // Earlier layers win, so u.findResult() tries one layer at a time. E.g.
      // up.fragment.get('main', { layer: 'current root' }) may match in both layers, but
      // must return the match in 'current'. A layer element may itself be the match, as in
      // up.fragment.get('body'), hence e.subtree().
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
    return element && u.every(this._filters, (filter) => filter(element))
  }

  _filterOne(element) {
    return u.presence(element, this._passesFilter.bind(this))
  }

  _filterMany(elements) {
    return u.filter(elements, this._passesFilter.bind(this))
  }

}
