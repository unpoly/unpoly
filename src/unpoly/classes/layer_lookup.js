const u = up.util
const e = up.element

up.LayerLookup = class LayerLookup {

  constructor(stack, ...args) {
    this.stack = stack
    const options = u.parseArgIntoOptions(args, 'layer')

    // Options normalization might change `options` relevant to the lookup:
    // (1) It will default { layer } to 'origin' if an { origin } element is given.
    // (2) It will also lookup a string { baseLayer }.
    // (3) It will set the default layer to 'current' if nothing matches.
    if (options.normalizeLayerOptions !== false) {
      up.layer.normalizeOptions(options)
    }

    this.values = u.splitValues(options.layer)

    this.origin = options.origin
    this.baseLayer = options.baseLayer || this.stack.current

    if (u.isString(this.baseLayer)) {
      // The { baseLayer } option may itself be a string like "parent".
      // In this case we look it up using a new up.LayerLookup instance, using
      // up.layer.current as the { baseLayer } for that second lookup.
      const recursiveOptions = { ...options, baseLayer: this.stack.current, normalizeLayerOptions: false }
      this.baseLayer = new this.constructor(this.stack, this.baseLayer, recursiveOptions).first()
    }
  }

  originLayer() {
    if (this.origin) {
      return this.forElement(this.origin)
    }
  }

  first() {
    return this.all()[0]
  }

  all() {
    let results = u.flatMap(this.values, value => this.resolveValue(value))
    results = u.compact(results)
    results = u.uniq(results)
    return results
  }

  forElement(element) {
    element = e.get(element); // unwrap jQuery
    return u.find(this.stack.reversed(), layer => layer.contains(element))
  }

  forIndex(value) {
    return this.stack[value]
  }

  resolveValue(value) {
    if (value instanceof up.Layer) {
      return value
    }

    if (u.isNumber(value)) {
      return this.forIndex(value)
    }

    if (/^\d+$/.test(value)) {
      return this.forIndex(Number(value))
    }

    if (u.isElementish(value)) {
      return this.forElement(value)
    }

    switch (value) {
      case 'any':
        // Return all layers, but prefer a layer that's either the current
        // layer, or closer to the front.
        return [this.baseLayer, ...this.stack.reversed()]
      case 'current':
        return this.baseLayer
      case 'closest':
        return this.stack.selfAndAncestorsOf(this.baseLayer)
      case 'parent':
        return this.baseLayer.parent
      case 'ancestor':
      case 'ancestors':
        return this.baseLayer.ancestors
      case 'child':
        return this.baseLayer.child
      case 'descendant':
      case 'descendants':
        return this.baseLayer.descendants
      case 'new':
        return 'new'; // pass-through
      case 'root':
        return this.stack.root
      case 'overlay':
      case 'overlays':
        return u.reverse(this.stack.overlays)
      case 'front':
        return this.stack.front
      case 'origin':
        return this.originLayer()
      default:
        return up.fail("Unknown { layer } option: %o", value)
    }
  }
}
