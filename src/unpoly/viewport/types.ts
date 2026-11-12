import * as u from '../util.js'
import { type InputDevice } from '../event.js'
import { type LayerReference } from '../fragment.js'

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
Options for revealing the element that a URL #hash points to.
@internal
*/
export interface RevealHashOptions {
  // Reveal the target again after the browser had a chance to scroll.
  strong?: boolean
  layer?: LayerReference
  origin?: Element
  behavior?: ScrollBehavior
  focus?: boolean
}

/**
What `up.internal.absolutize()` returns: the `<up-bounds>` element that now wraps the element,
and a function that moves it.
@internal
*/
export interface Absolutization {
  bounds: HTMLElement
  moveBounds(diffX: number, diffY: number): void
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
