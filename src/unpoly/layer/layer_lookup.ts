import * as u from '../util.js'
import * as e from '../element.js'
import { fail } from '../error.js'
import { normalizeLayerOptions } from '../layer.js'
import type * as t from './types.js'
import { Layer } from './layer.js'
import type { LayerStack } from './layer_stack.js'

// A single value of a { layer } option, like a layer, an element, an index or a name.
type LayerValue = Layer | Element | number | string

export class LayerLookup {
  declare _stack: LayerStack
  declare _options: t.LayerLookupOptions
  declare _values: LayerValue[]

  constructor(stack: LayerStack, options: t.LayerLookupOptions) {
    this._stack = stack

    // Options normalization might change `options` relevant to the lookup:
    // (1) It will default { layer } to 'origin' if an { origin } element is given.
    // (2) It will also lookup a string { baseLayer }.
    // (3) It will set the default layer to 'current' if nothing matches.
    if (options.normalizeLayerOptions !== false) {
      normalizeLayerOptions(options)
    }

    this._options = options
    this._values = u.getSimpleTokens<LayerValue>(options.layer)
  }

  // A { layer: 'new' } option resolves to the string 'new'. We type the result as layers,
  // like the documentation of up.layer.getAll() does.
  all(): Layer[] {
    let results = u.flatMap(this._values, (value) => this._resolveValue(value))
    return u.uniq(u.compact(results)) as Layer[]
  }

  static all(stack: LayerStack, ...args: t.LayerLookupArgs): Layer[] {
    const options = u.parseArgIntoOptions(args, 'layer')

    // We can process some very frequent calls like all(up.Layer)
    // without going through a full lookup, which would require layer options normalization etc.

    const { layer } = options

    if (layer instanceof Layer) {
      return [layer]
    }

    // We need a full lookup
    return new this(stack, options).all()
  }

  _forElement(element: Element): Layer | undefined {
    element = e.getOne(element) // unwrap jQuery
    return this._stack.layers.findLast((layer) => layer.contains(element))
  }

  _forIndex(value: number): Layer | undefined {
    return this._stack.at(value)
  }

  // The name 'new' passes through as a string, for the render options that open a new overlay.
  _resolveValue(value: LayerValue): Layer | Layer[] | 'new' | undefined {
    if (value instanceof Layer) {
      return value
    }

    if (u.isNumber(value)) {
      return this._forIndex(value)
    }

    // isElementLike() rejects strings, so only an element (or a jQuery collection) gets here.
    if (u.isElementLike(value)) {
      return this._forElement(value as Element)
    }

    // Only strings are left.
    if (/^\d+$/.test(value as string)) {
      return this._forIndex(Number(value))
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

  _getOriginLayer(): Layer | undefined {
    let { origin, originLayer } = this._options

    if (originLayer) {
      return originLayer
    }

    if (origin) {
      return this._forElement(origin)
    }
  }

  _getBaseLayer(): Layer {
    let { baseLayer } = this._options

    if (u.isString(baseLayer)) {
      // The { baseLayer } option may itself be a string like "parent".
      // In this case we look it up using a new up.LayerLookup instance, using
      // up.layer.current as the { baseLayer } for that second lookup.
      const recursiveOptions = {
        ...this._options,
        baseLayer: this._stack.current,
        normalizeLayerOptions: false,
        layer: baseLayer as t.LayerReference,
      }
      return LayerLookup.all(this._stack, recursiveOptions)[0]
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
