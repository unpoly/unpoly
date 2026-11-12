import type * as e from '../element.js'
import type { UpEvent } from '../event.js'

/**
The duration and easing of an animation, after applying the defaults from `up.motion.config`.
*/
export interface TimingOptions {
  duration: number
  easing: string
}

/**
A function that animates an element. See `up.animation()`.
*/
export type AnimationFn = (element: HTMLElement, options: TimingOptions) => Promise<any>

/**
A function that animates the transition from an old to a new element. See `up.transition()`.
*/
export type TransitionFn = (oldElement: HTMLElement, newElement: HTMLElement, options: TimingOptions) => Promise<any>

/**
An animation: the name of a registered animation, the CSS properties of the last frame,
a function, or `false` or `'none'` for no animation.
*/
export type AnimationValue = string | e.StyleProps | AnimationFn | false

/**
A transition: the name of a registered transition, a pair of animations (also as `'old/new'`),
a function, or `false` or `'none'` for no transition.
*/
export type TransitionValue = string | [AnimationValue, AnimationValue] | TransitionFn | false

/**
Options for `up.animate()`.
*/
export interface AnimateOptions {
  duration?: number
  easing?: string
  onFinished?: () => void
}

/**
Options for `up.morph()` and `up.motion.swap()`.
*/
export interface SwapOptions {
  duration?: number
  easing?: string
  beforeRemove?: () => void
  afterRemove?: () => void
}

/**
The `up:motion:finish` event.
*/
export interface MotionFinishEvent extends UpEvent {
  target: Element
}

/**
The settings in `up.motion.config`, described in its doc comment.
*/
export interface MotionConfig {
  duration: number
  easing: string
  enabled: boolean
}
