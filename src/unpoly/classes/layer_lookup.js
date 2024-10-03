const u = up.util
const e = up.element

up.LayerLookup = class LayerLookup {

  constructor(stack, options) {
    this._stack = stack

    // Options normalization might change `options` relevant to the lookup:
    // (1) It will default { layer } to 'origin' if an { origin } element is given.
    // (2) It will also lookup a string { baseLayer }.
    // (3) It will set the default layer to 'current' if nothing matches.
    if (options.normalizeLayerOptions !== false) {
      up.layer.normalizeOptions(options)
    }

    this._options = options
    this._values = u.parseTokens(options.layer)
  }

  all() {
    let results = u.flatMap(this._values, value => this._resolveValue(value))
    results = u.compact(results)
    results = u.uniq(results)
    return results
  }

  static all(stack, ...args) {
    const options = u.parseArgIntoOptions(args, 'layer')

    // We can process some very frequent calls like all(up.Layer)
    // without going through a full lookup, which would require layer options normalization etc.

    const { layer } = options

    if (layer instanceof up.Layer) {
      return [layer]
    }

    // We need a full lookup
    return new this(stack, options).all()
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
        return [this._getBaseLayer(), ...this._stack.reversed()]
      case 'current':
        return this._getBaseLayer()
      case 'closest':
        return this._stack.selfAndAncestorsOf(this._getBaseLayer())
      case 'parent':
        return this._getBaseLayer().parent
      case 'ancestor':
      case 'ancestors':
        return this._getBaseLayer().ancestors
      case 'child':
        return this._getBaseLayer().child
      case 'descendant':
      case 'descendants':
        return this._getBaseLayer().descendants
      case 'subtree':
        return this._getBaseLayer().subtree
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
        return this._getOriginLayer()
      default:
        return up.fail("Unknown { layer } option: %o", value)
    }
  }

  _getOriginLayer() {
    let { origin, originLayer } = this._options

    if (originLayer) {
      return originLayer
    }

    if (origin) {
      return this._forElement(origin)
    }
  }

  _getBaseLayer() {
    let { baseLayer } = this._options

    if (u.isString(baseLayer)) {
      // The { baseLayer } option may itself be a string like "parent".
      // In this case we look it up using a new up.LayerLookup instance, using
      // up.layer.current as the { baseLayer } for that second lookup.
      const recursiveOptions = { ...this._options, baseLayer: this._stack.current, normalizeLayerOptions: false, layer: baseLayer }
      return this.constructor.all(this._stack, recursiveOptions)[0]
    } else {
      return baseLayer || this._getOriginLayer() || this._stack.current
    }
  }

  static {
    u.memoizeMethod(this.prototype, {
      _getBaseLayer: true,
      _getOriginLayer: true,
    })
  }

}
