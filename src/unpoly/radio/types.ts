import { type ElementEvent } from '../event.js'
import { type GuardEvent, type RenderOptions, type RenderStep } from '../fragment.js'

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
export interface FragmentHungryEvent extends ElementEvent {
  newFragment: Element
  renderOptions: RenderOptions
}

/**
The `up:fragment:poll` event.
*/
export interface FragmentPollEvent extends GuardEvent {}

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

declare module '../event.js' {
  interface UpEventMap {
    'up:fragment:hungry': FragmentHungryEvent
    'up:fragment:poll': FragmentPollEvent
  }
}
