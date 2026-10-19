const u = up.util
const e = up.element

up.Selector = class Selector {

  constructor(selector, elementOrDocument, options = {}) {
    // If we're given an element that is detached *or* from another document
    // (think up.ResponseDoc), it has no layer and no destroying ancestors.
    let externalDocument = elementOrDocument && !document.contains(elementOrDocument)
    this._filters = (externalDocument || options.destroying) ? [] : [up.fragment.isNotDestroying]

    // Some up.fragment functions center around an element, like up.fragment.closest(element, selector).
    // In this case up.fragment passes us that element, and we search the element's layer unless told otherwise.
    options.layer ??= u.presence(elementOrDocument, u.isElement)

    // With a single layer in the DOM, every element belongs to it and we can skip the layer lookup.
    let noLayers = externalDocument || options.layer === 'any' || up.layer.count === 1

    // Also normalizes options: a missing { layer } with an { origin } becomes 'origin'.
    let layers = options.layer !== 'new' && !noLayers && up.layer.getAll(options)
    let expandTargetLayer

    if (options.layer === 'new') {
      // (1) A layer that is about to open does not exist yet, so we cannot filter by it.
      //     Expand layer-specific selectors like `:main` for the new layer's { mode }.
      expandTargetLayer = 'new'
    } else if (noLayers) {
      // (2) There is no layer to tell matches apart by.
      //     Use the root layer to expand layer-specific selectors like `:main` or `:layer`.
      expandTargetLayer = up.layer.root
    } else if (layers.length) {
      // (3) Only match within the given layers. Earlier layers are preferred.
      //     Use the first layer to expand layer-specific selectors like `:main` or `:layer`.
      this._layers = layers
      this._filters.push((match) => u.some(layers, (layer) => layer.contains(match)))
      expandTargetLayer = layers[0]
    } else if (u.isElementLike(options.layer) || (options.layer === 'origin' && options.origin)) {
      // (4) The layer of the given element-like value (root, { layer } or { origin }) has closed.
      //     Its elements may still be in the DOM, playing their exit animation,
      //     but nothing in a closed layer can match.
      this._selectors = []
    } else {
      // (5) A named layer that doesn't exist, e.g. { layer: 'child' } without a child.
      throw new up.CannotMatch(["Unknown layer: %o", options.layer])
    }

    this._selectors ??= up.fragment.expandTargets(selector, { ...options, layer: expandTargetLayer })

    // No selectors match nothing: in case (4), or when the user has set config.mainTargets = []
    // and we got a :main selector.
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
    } else if (!this._layers) {
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
