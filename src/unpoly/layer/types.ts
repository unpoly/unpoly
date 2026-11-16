import type * as u from '../util.js'
import type { UpEvent } from '../event.js'
import type { RenderOptions } from '../fragment.js'
import type { AnimateOptions, AnimationValue } from '../motion.js'
import type { UpResponse } from '../network.js'
import type { Layer } from './layer.js'
import type { LayerStack } from './layer_stack.js'

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
The options that an overlay copies onto itself. The layer config has defaults for most of them.
@internal
*/
export interface OverlayProps {
  class?: string
  backdrop: boolean
  dismissLabel: string
  dismissARIALabel: string
  openAnimation: LayerAnimation
  openDuration: number
  openEasing: string
  closeAnimation: LayerAnimation
  closeDuration: number
  closeEasing: string
  trapFocus: boolean
  onOpened?: (event: LayerOpenedEvent) => any
  onAccept?: (event: LayerAcceptEvent) => any
  onAccepted?: (event: LayerAcceptedEvent) => any
  onDismiss?: (event: LayerDismissEvent) => any
  onDismissed?: (event: LayerDismissedEvent) => any
  onAcceptedReload?: string
  onDismissedReload?: string
  acceptEvent?: string
  dismissEvent?: string
  acceptFragment?: string
  dismissFragment?: string
}

/**
Defaults for new overlays, like `up.layer.config.overlay` or `up.layer.config.modal`.
*/
export interface OverlayDefaults extends LayerDefaults, Partial<OverlayProps> {
  dismissible?: boolean | string | string[]
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
export interface CloseLayerOptions extends LayerAnimationOptions {
  confirm?: string | boolean
  // Whether a listener may prevent the overlay from closing.
  /** @internal */
  preventable?: boolean
  response?: UpResponse
  // Whether to restore the parent layer's history.
  history?: boolean
  /** @internal */
  origin?: Element
}

/**
How an overlay closes: by accepting or by dismissing it.
*/
export type CloseVerb = 'accept' | 'dismiss'

/**
Options for `up.Layer#peel()`.
*/
export interface PeelOptions extends CloseLayerOptions {
  value?: any
  intent?: CloseVerb
}

// Not exported (not even internally): a building block for LayerReference only.
type LayerKeyword = 'current' | 'closest' | 'parent' | 'ancestor' | 'ancestors' | 'child'
  | 'descendant' | 'descendants' | 'subtree' | 'root' | 'overlay' | 'overlays' | 'front' | 'origin' | 'any'

// Several alternatives in one string ('parent, root'), as documented for up.layer.get().
// Only the first keyword is checked; the rest stays free, so autocomplete lists only the keywords.
type LayerAlternativeSeparator = ' ' | ', ' | ','

/** A layer to look up: the layer itself, an element in it, its index, or a keyword like 'parent'. */
export type LayerReference = Layer | Element | number | `${number}`
  | LayerKeyword | `${LayerKeyword}${LayerAlternativeSeparator}${string}`

/** A way to ask for a new overlay, optionally with its mode: 'new', 'swap modal', 'shatter'… */
export type NewLayer = 'new' | 'swap' | 'shatter' | `${'new' | 'swap' | 'shatter'} ${OverlayMode}`

/**
Options for looking up layers with `up.layer.get()` or `up.layer.getAll()`.
*/
export interface LayerLookupOptions {
  layer?: LayerReference | NewLayer
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
The arguments of `layerStack.get()` and `layerStack.getAll()`: a layer value, lookup options, or both.
`up.layer.get()` and `up.layer.getAll()` take the same, but only a `LayerReference` as the value.
@internal
*/
export type LayerLookupArgs = [value?: Layer | Element | number | string | null | LayerLookupOptions, options?: LayerLookupOptions]

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
The properties of the `up:layer:accept`, `up:layer:accepted`, `up:layer:dismiss` and `up:layer:dismissed` events.
*/
export interface LayerCloseEvent extends UpEvent {
  layer: Layer
  value?: any
  origin?: Element
  response?: UpResponse
}

/** The `up:layer:accept` event. */
export interface LayerAcceptEvent extends LayerCloseEvent {}

/** The `up:layer:accepted` event. */
export interface LayerAcceptedEvent extends LayerCloseEvent {}

/** The `up:layer:dismiss` event. */
export interface LayerDismissEvent extends LayerCloseEvent {}

/** The `up:layer:dismissed` event. */
export interface LayerDismissedEvent extends LayerCloseEvent {}

declare module '../event.js' {
  interface UpEventMap {
    'up:layer:accept': LayerAcceptEvent
    'up:layer:accepted': LayerAcceptedEvent
    'up:layer:dismiss': LayerDismissEvent
    'up:layer:dismissed': LayerDismissedEvent
    'up:layer:location:changed': LayerLocationChangedEvent
    'up:layer:open': LayerOpenEvent
    'up:layer:opened': LayerOpenedEvent
  }
}
