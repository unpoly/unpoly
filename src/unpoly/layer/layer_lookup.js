import {
  compact, flatMap, getSimpleTokens, isElementLike, isNumber, isString, memoizeMethod,
  parseArgIntoOptions, uniq,
} from '../util.js'
import { getOne } from '../element.js'
import { fail } from '../error.js'
import { Layer } from './base.js'

export class LayerLookup {

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
    this._values = getSimpleTokens(options.layer)
  }

  all() {
    let results = flatMap(this._values, (value) => this._resolveValue(value))
    results = compact(results)
    results = uniq(results)
    return results
  }

  static all(stack, ...args) {
    const options = parseArgIntoOptions(args, 'layer')

    // We can process some very frequent calls like all(up.Layer)
    // without going through a full lookup, which would require layer options normalization etc.

    const { layer } = options

    if (layer instanceof Layer) {
      return [layer]
    }

    // We need a full lookup
    return new this(stack, options).all()
  }

  _forElement(element) {
    element = getOne(element) // unwrap jQuery
    return this._stack.layers.findLast((layer) => layer.contains(element))
  }

  _forIndex(value) {
    return this._stack.at(value)
  }

  _resolveValue(value) {
    if (value instanceof Layer) {
      return value
    }

    if (isNumber(value)) {
      return this._forIndex(value)
    }

    if (/^\d+$/.test(value)) {
      return this._forIndex(Number(value))
    }

    if (isElementLike(value)) {
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
        return this._stack.overlays.toReversed()
      case 'front':
        return this._stack.front
      case 'origin':
        return this._getOriginLayer()
      default:
        return fail("Unknown { layer } option: %o", value)
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

    if (isString(baseLayer)) {
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
    memoizeMethod(this.prototype, {
      _getBaseLayer: true,
      _getOriginLayer: true,
    })
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  LayerLookup,
}
