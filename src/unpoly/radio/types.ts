import type { UpEvent } from '../event.js'
import type { RenderOptions, RenderStep } from '../fragment.js'

/**
The render steps for hungry elements, on the targeted layer and on other layers.
@internal
*/
export interface HungrySteps {
  current: RenderStep[]
  other: RenderStep[]
}

/**
The `up:fragment:hungry` event.
*/
export interface FragmentHungryEvent extends UpEvent {
  target: Element
  newFragment: Element
  renderOptions: RenderOptions
}

/**
The `up:fragment:poll` event.
*/
export interface FragmentPollEvent extends UpEvent {
  target: Element
  renderOptions: RenderOptions
}

/**
The settings in `up.radio.config`, described in its doc comment.
*/
export interface RadioConfig {
  hungrySelectors: string[]
  noHungrySelectors: string[]
  pollInterval: number
}

/**
Options for polling a fragment: render options for reloading it, and when to reload.
See `up.radio.startPolling()`.
*/
export interface PollOptions extends RenderOptions {
  interval?: number
  ifLayer?: 'front' | 'any'
}
