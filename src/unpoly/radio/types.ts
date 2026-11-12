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
export type FragmentHungryEvent = Event & {
  target: Element
  newFragment: Element
  renderOptions: RenderOptions
}

/**
The `up:fragment:poll` event.
*/
export type FragmentPollEvent = Event & {
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
