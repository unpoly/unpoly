const u = up.util
const e = up.element

up.LayerLookup = class LayerLookup {

  constructor(stack, ...args) {
    this._stack = stack
    const options = u.parseArgIntoOptions(args, 'layer')

    // Options normalization might change `options` relevant to the lookup:
    // (1) It will default { layer } to 'origin' if an { origin } element is given.
    // (2) It will also lookup a string { baseLayer }.
    // (3) It will set the default layer to 'current' if nothing matches.
    if (options.normalizeLayerOptions !== false) {
      up.layer.normalizeOptions(options)
    }

    this._values = u.parseTokens(options.layer)

    this._origin = options.origin
    this._baseLayer = options.baseLayer || this._originLayer() || this._stack.current

    if (u.isString(this._baseLayer)) {
      // The { baseLayer } option may itself be a string like "parent".
      // In this case we look it up using a new up.LayerLookup instance, using
      // up.layer.current as the { baseLayer } for that second lookup.
      const recursiveOptions = { ...options, baseLayer: this._stack.current, normalizeLayerOptions: false }
      this._baseLayer = new this.constructor(this._stack, this._baseLayer, recursiveOptions).first()
    }
  }

  _originLayer() {
    if (this._origin) {
      return this._forElement(this._origin)
    }
  }

  first() {
    return this.all()[0]
  }

  all() {
    let results = u.flatMap(this._values, value => this._resolveValue(value))
    results = u.compact(results)
    results = u.uniq(results)
    return results
  }

  _forElement(element) {
    element = e.get(element) // unwrap jQuery
    return u.find(this._stack.reversed(), layer => layer.contains(element))
  }

  _forIndex(value) {
    return this._stack.at(value)
  }

  _resolveValue(value) {
    if (value instanceof up.Layer) {
      return value
    }

    if (u.isNumber(value)) {
      return this._forIndex(value)
    }

    if (/^\d+$/.test(value)) {
      return this._forIndex(Number(value))
    }

    if (u.isElementish(value)) {
      return this._forElement(value)
    }

    switch (value) {
      case 'any':
        // Return all layers, but prefer a layer that's either the current
        // layer, or closer to the front.
        return [this._baseLayer, ...this._stack.reversed()]
      case 'current':
        return this._baseLayer
      case 'closest':
        return this._stack.selfAndAncestorsOf(this._baseLayer)
      case 'parent':
        return this._baseLayer.parent
      case 'ancestor':
      case 'ancestors':
        return this._baseLayer.ancestors
      case 'child':
        return this._baseLayer.child
      case 'descendant':
      case 'descendants':
        return this._baseLayer.descendants
      case 'subtree':
        return this._baseLayer.subtree
      case 'new':
        return 'new' // pass-through
      case 'root':
        return this._stack.root
      case 'overlay':
      case 'overlays':
        return u.reverse(this._stack.overlays)
      case 'front':
        return this._stack.front
      case 'origin':
        return this._originLayer()
      default:
        return up.fail("Unknown { layer } option: %o", value)
    }
  }
}
