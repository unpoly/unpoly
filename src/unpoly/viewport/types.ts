import type * as u from '../util.js'
import type { InputDevice } from '../event.js'
import type { LookupOptions } from '../fragment.js'
import type { LayerReference } from '../layer.js'

/**
Options for focusing an element.
@internal
*/
export interface DoFocusOptions {
  preventScroll?: boolean
  // Focus an element that isn't focusable, by giving it [tabindex=-1].
  force?: boolean
  inputDevice?: InputDevice
  focusVisible?: boolean | 'auto'
}

/**
The settings in `up.viewport.config`, described in its doc comment.
*/
export interface ViewportConfig {
  viewportSelectors: string[]
  fixedTopSelectors: string[]
  fixedBottomSelectors: string[]
  anchoredRightSelectors: string[]
  revealSnap: number
  revealPadding: number
  revealMax: number | false | ((element: Element) => number)
  revealTop: boolean
  autoFocusVisible: (props: { element: Element, inputDevice: InputDevice }) => boolean
}

/**
Options for `up.reveal()`. Each `reveal*` option is an alias used by render options.
@internal
*/
export interface RevealOptions {
  viewport?: Element | string
  behavior?: ScrollBehavior
  snap?: number
  revealSnap?: number
  padding?: number
  revealPadding?: number
  top?: boolean
  revealTop?: boolean
  max?: u.ValueOrFunction<number>
  revealMax?: u.ValueOrFunction<number>
  // Also focus the element.
  focus?: boolean
  // For looking up the element. After the lookup, `up.reveal()` sets the element's layer.
  layer?: LayerReference
  origin?: Element
}

/**
Options for `up.viewport.saveScroll()` and `up.viewport.restoreScroll()`.
*/
export interface ScrollPositionOptions extends LookupOptions {
  location?: string
  // Use the viewports around this element instead of all viewports in the layer.
  /** @internal */
  around?: Element | null
  // Restore these positions instead of the saved ones.
  /** @internal */
  scrollTops?: Record<string, number>
}
