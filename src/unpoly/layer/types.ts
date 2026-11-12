import type * as u from '../util.js'
import { type UpEvent } from '../event.js'
import { type RenderOptions } from '../fragment.js'
import { type AnimateOptions, type AnimationValue } from '../motion.js'
import { type UpResponse } from '../network.js'
import { type Layer } from './base.js'
import { type LayerStack } from './layer_stack.js'

/**
The settings in `up.layer.config`, described in its doc comment.

Besides a few settings of its own, the config has an object of defaults for all layers (`any`),
for all overlays (`overlay`) and for each layer mode, so `config[mode]` is typed for every `LayerMode`.
*/
export interface LayerConfig {
  mode: OverlayMode
  any: LayerDefaults
  root: LayerDefaults
  overlay: OverlayDefaults
  modal: OverlayDefaults
  drawer: DrawerDefaults
  popup: OverlayDefaults
  cover: OverlayDefaults
  foreignOverlaySelectors: string[]
}

/**
Defaults for new layers, like `up.layer.config.any` or `up.layer.config.root`.

Each object only holds the defaults set at its own level. `up.layer.open()` merges the levels
(`any`, then `overlay`, then the mode). E.g. `up.layer.config.modal.openAnimation` is `undefined`
until an app sets it, but modals open with the animation from `up.layer.config.overlay`.
*/
export interface LayerDefaults {
  mainTargets: string[]
  history?: boolean | 'auto'
  // Any option for up.layer.open() can have a default, render options included.
  // TODO(types): Extend the options of up.layer.open() instead, so a misspelled key is an error.
  [option: string]: any
}

/**
Defaults for new overlays, like `up.layer.config.overlay` or `up.layer.config.modal`.
*/
export interface OverlayDefaults extends LayerDefaults {
  openAnimation?: LayerAnimation
  openDuration?: number
  openEasing?: string
  closeAnimation?: LayerAnimation
  closeDuration?: number
  closeEasing?: string
  dismissible?: boolean | string | string[]
  dismissLabel?: string
  dismissARIALabel?: string
  trapFocus?: boolean
  backdrop?: boolean
  class?: string
  size?: 'small' | 'medium' | 'large' | 'full' | 'grow'
  // Popups take any position, drawers only 'left' or 'right' (see DrawerDefaults).
  position?: 'top' | 'bottom' | 'left' | 'right'
  // Only popups have an alignment.
  align?: 'left' | 'right' | 'center' | 'top' | 'bottom'
}

/**
Defaults for new drawers, like `up.layer.config.drawer`.
*/
export interface DrawerDefaults extends OverlayDefaults {
  position?: 'left' | 'right'
}

/**
The animation for opening or closing an overlay. A function receives the overlay and returns the animation.
*/
export type LayerAnimation = AnimationValue | ((layer: Layer) => AnimationValue)

/**
A layer mode. The root layer has the mode `'root'`, an overlay has one of the other modes.
*/
export type LayerMode = 'root' | OverlayMode

/**
A layer mode that opens an overlay. All modes except `'root'`.
*/
export type OverlayMode = 'modal' | 'drawer' | 'popup' | 'cover'

/**
Where an overlay is in its life cycle. The root layer has no state.
@internal
*/
export type LayerState = 'opening' | 'opened' | 'closing' | 'closed'

/**
The options a layer is constructed with. `up.layer.build()` merges them from the
layer config and the options for `up.layer.open()`.
@internal
*/
export interface LayerOptions {
  mode?: LayerMode
  stack?: LayerStack
  history?: boolean | 'auto'
  context?: u.PlainObject
  lastScrollTops?: u.FIFOCache<string, any>
  lastFocusCapsules?: u.FIFOCache<string, any>
  [key: string]: any
}

/**
How an overlay animates as it opens or closes.
*/
export interface LayerAnimationOptions extends AnimateOptions {
  animation?: AnimationValue
}

/**
Options for closing an overlay with `up.Layer#accept()` or `up.Layer#dismiss()`.
*/
export interface LayerCloseOptions extends LayerAnimationOptions {
  confirm?: string | boolean
  /** @internal */
  preventable?: boolean
  response?: UpResponse
  history?: boolean
  /** @internal */
  origin?: Element
}

/**
Options for `up.Layer#peel()`.
*/
export interface PeelOptions extends LayerCloseOptions {
  value?: any
  intent?: 'accept' | 'dismiss'
}

/**
A value for the `{ layer }` option: an `up.Layer`, its index in the layer stack, an element in the layer,
or a [layer name](/learn/targeting-other-layers) like `'current'` or `'parent'`.
A string may contain several names, separated by spaces or commas.
*/
export type LayerOption = Layer | number | Element | string

/**
Options for looking up layers with `up.layer.get()` or `up.layer.getAll()`.
*/
export interface LayerLookupOptions {
  layer?: LayerOption
  /**
  The layer that relative names like `'parent'` or `'current'` refer to.
  */
  baseLayer?: Layer | string
  /**
  An element in the layer that the `'origin'` name refers to.
  */
  origin?: Element
  /** @internal */
  originLayer?: Layer
  /** @internal */
  normalizeLayerOptions?: boolean
  // Lookups often receive the render options, which have many more keys.
  [key: string]: any
}

/**
The arguments of `up.layer.get()` and `up.layer.getAll()`: a layer value, lookup options, or both.
*/
export type LayerLookupArgs = [value?: LayerOption | LayerLookupOptions, options?: LayerLookupOptions]

/**
The `up:layer:open` event. It is emitted on the document, since the overlay has no element yet.
*/
export interface LayerOpenEvent extends UpEvent {
  layerOptions: RenderOptions
  // Missing when the overlay is opened from JavaScript.
  origin?: Element
}

/**
The `up:layer:opened` event, emitted on the new overlay's element.
*/
export interface LayerOpenedEvent extends UpEvent {
  target: Element
  // Missing when the overlay was opened from JavaScript.
  origin?: Element
  layer: Layer
}

/**
The `up:layer:location:changed` event, emitted on the layer's element.
*/
export interface LayerLocationChangedEvent extends UpEvent {
  target: Element
  location: string
  previousLocation?: string
  layer: Layer
}

/**
The `up:layer:accept`, `up:layer:accepted`, `up:layer:dismiss` and `up:layer:dismissed` events.
*/
export interface LayerCloseEvent extends UpEvent {
  layer: Layer
  value?: any
  origin?: Element
  response?: UpResponse
}
