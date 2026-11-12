import { type UpEvent } from '../event.js'
import { type RenderOptions } from '../fragment.js'

/**
The `up:link:follow` event.
*/
export interface LinkFollowEvent extends UpEvent {
  target: Element
  renderOptions: RenderOptions
}

/**
The `up:link:preload` event.
*/
export interface LinkPreloadEvent extends UpEvent {
  target: Element
  renderOptions: RenderOptions
}

/**
The `up:click` event.
*/
// It also has the properties that forkEventAsUpClick() copies from the original event.
// They are undefined when the original event has no such property, like the { button } of a keyboard event.
export interface ClickEvent extends UpEvent {
  target: Element
  originalEvent: MouseEvent | KeyboardEvent
  clientX: number
  clientY: number
  button: number
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

/**
The `up:deferred:load` event.
*/
export interface DeferredLoadEvent extends UpEvent {
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
Preloads a link or loads a deferred placeholder, once its condition is met (like `'hover'` or `'reveal'`).
A `LinkFollowIntent` passes render options with an `{ onRequestKnown }` callback, so it can abort
the request when the user moves away.
@internal
*/
export type FollowCallback = (options?: RenderOptions) => void

declare module '../event.js' {
  interface UpEventMap {
    'up:click': ClickEvent
    'up:deferred:load': DeferredLoadEvent
    'up:link:follow': LinkFollowEvent
    'up:link:preload': LinkPreloadEvent
  }
}
