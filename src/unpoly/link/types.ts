import type { ModifierKey } from '../event.js'
import type { RenderOptions } from '../fragment.js'
import type { UpRequest } from '../network.js'

/**
The `up:link:follow` event.
*/
export type LinkFollowEvent = Event & {
  target: Element
  renderOptions: RenderOptions
}

/**
The `up:link:preload` event.
*/
export type LinkPreloadEvent = Event & {
  target: Element
  renderOptions: RenderOptions
}

/**
The `up:click` event.
*/
// It also has the properties that forkEventAsUpClick() copies from the original event.
// They are undefined when the original event has no such property, like the { button } of a keyboard event.
export type ClickEvent = Event & Pick<MouseEvent, 'clientX' | 'clientY' | 'button' | ModifierKey> & {
  target: Element
  originalEvent: MouseEvent | KeyboardEvent
}

/**
The `up:deferred:load` event.
*/
export type DeferredLoadEvent = Event & {
  target: Element
  renderOptions: RenderOptions
}

/**
The settings in `up.link.config`, described in its doc comment.
*/
export interface LinkConfig {
  followSelectors: string[]
  noFollowSelectors: string[]
  instantSelectors: string[]
  noInstantSelectors: string[]
  preloadSelectors: string[]
  noPreloadSelectors: string[]
  clickableSelectors: string[]
  noClickableSelectors: string[]
  preloadDelay: number
}

/**
Called when the user shows an intent to follow a link, e.g. by hovering over it.
It reports the request it makes, so the intent can abort it when the user moves away.
@internal
*/
export type FollowIntentCallback = (options: { onRequestKnown: (request: UpRequest) => void }) => void
