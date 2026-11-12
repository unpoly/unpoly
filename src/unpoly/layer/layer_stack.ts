import * as u from '../util.js'
import { buildLayer } from '../layer.js'
import { LayerLookup } from './layer_lookup.js'
import type { LayerLookupArgs } from './layer_lookup.js'
import type { Layer, LayerCloseOptions, PeelOptions } from './base.js'

export class LayerStack {
  declare _currentOverrides: Layer[]
  declare layers: Layer[]
  declare _closingLayers: Layer[]

  constructor() {
    this._currentOverrides = []
    this.layers = [this._buildRoot()]
    this._closingLayers = []
  }

  _buildRoot(): Layer {
    return buildLayer({ mode: 'root', stack: this })
  }

  remove(layer: Layer): void {
    u.remove(this.layers, layer)
    // A closed overlay may keep its element for its exit animation. See attachedCount.
    this._closingLayers.push(layer)
  }

  peel(layer: Layer, options: PeelOptions = {}): void {
    // We will dismiss descendants closer to the front first to prevent
    // recursive calls of peel().
    const descendants = layer.descendants.toReversed()

    // (1) Callers expect the effects of peel() to manipulate the layer stack sync.
    //     Because of this we will dismiss all descendants sync rather than waiting
    //     for each descendant to finish its closing animation.
    // (2) Listeners cannot prevent peeling. Peeling happens after the server has responded,
    //     so keeping an overlay open could not undo the request, only hide its result.
    const closeOptions = { ...options, preventable: false }

    // We allow to dismiss using either { peel: 'dismiss' } (explicit) or { peel: true } (don't care).
    const closeMethod = options.intent === 'accept' ? 'accept' : 'dismiss'

    const closeValue = options.value ?? ':peel'

    for (let descendant of descendants) {
      descendant[closeMethod](closeValue, closeOptions)
    }
  }

  reset(): void {
    this.peel(this.root, { animation: false })
    this._currentOverrides = []
    this.root.reset()
  }

  parentOf(layer: Layer): Layer | undefined {
    return this.layers[layer.index - 1]
  }

  childOf(layer: Layer): Layer | undefined {
    return this.layers[layer.index + 1]
  }

  ancestorsOf(layer: Layer): Layer[] {
    // Return closest ancestors first
    return this.layers.slice(0, layer.index).toReversed()
  }

  selfAndAncestorsOf(layer: Layer): Layer[] {
    // Order for layer.closest()
    return [layer, ...layer.ancestors]
  }

  descendantsOf(layer: Layer): Layer[] {
    return this.layers.slice(layer.index + 1)
  }

  isRoot(layer: Layer): boolean {
    return this.root === layer
  }

  isOverlay(layer: Layer): boolean {
    return this.root !== layer
  }

  isCurrent(layer: Layer): boolean {
    return this.current === layer
  }

  isFront(layer: Layer): boolean {
    return this.front === layer
  }

  get(...args: LayerLookupArgs): Layer | undefined {
    return this.getAll(...args)[0]
  }

  getAll(...args: LayerLookupArgs): Layer[] {
    return LayerLookup.all(this, ...args)
  }

  sync(): void {
    for (let layer of this.layers) {
      layer.sync()
    }
  }

  asCurrent<T>(layer: Layer, fn: () => T): T {
    try {
      this._currentOverrides.push(layer)
      return fn()
    } finally {
      this._currentOverrides.pop()
    }
  }

  reversed(): Layer[] {
    return this.layers.toReversed()
  }

  dismissOverlays(value: any = null, options: LayerCloseOptions = {}): void {
    for (let overlay of this.overlays.toReversed()) {
      overlay.dismiss(value, options)
    }
  }

  at(index: number): Layer | undefined {
    return this.layers[index]
  }

  indexOf(layer: Layer): number {
    return this.layers.indexOf(layer)
  }

  get count(): number {
    return this.layers.length
  }

  // Layers whose elements are in the DOM: the open layers, plus closed overlays
  // that are still playing their exit animation.
  get attachedCount(): number {
    if (this._closingLayers.length) {
      this._closingLayers = this._closingLayers.filter((layer) => layer.element.isConnected)
    }
    return this.layers.length + this._closingLayers.length
  }

  get root(): Layer {
    return this.layers[0]
  }

  get overlays(): Layer[] {
    return this.root.descendants
  }

  get current(): Layer {
    // Event listeners and compilers will push into @currentOverrides
    // to temporarily set up.layer.current to the layer they operate in.
    return u.last(this._currentOverrides) || this.front
  }

  get front(): Layer {
    return u.last(this.layers)
  }

}
