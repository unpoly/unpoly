import * as u from './util.js'
import * as e from './element.js'
import { OptionsParser } from './element/options_parser.js'
import { newConfig } from './util/config.js'
import { guardFn } from './error.js'
import { on, type UnbindFn } from './event.js'
import { getSmart } from './fragment.js'
// Not through framework.js, which may not be evaluated yet when we create a Registry below.
import { Registry } from './framework/registry.js'
import { printToStandard } from './log.js'
import { mockable } from './mockable.js'
import { absolutize, closest, rootHeight, rootWidth } from './viewport.js'
import type * as t from './motion/types.js'
export type * from './motion/types.js'
import { MotionController } from './motion/motion_controller.js'
export { MotionController }

/*-
Features to animate fragment updates.

A *transition* morphs an old element into its new version. Set an `[up-transition]` attribute on a link or form, or pass a `{ transition }` option to `up.render()`. An *animation* shows or hides a single element without a counterpart, for example when an overlay opens with an [`[up-animation]`](/api/up-layer-new#up-animation) attribute, or when `up.destroy()` removes a fragment.

Unpoly ships with [predefined transitions](/api/up.morph#named-transitions) and [predefined animations](/api/up.animate#named-animations). Define your own with `up.transition()` and `up.animation()`. To play an effect outside a render pass, call `up.animate()` or `up.morph()` directly.

@learn-ref motion

@namespace up.motion
*/


const motionController = new MotionController('motion')

/*-
Sets default options for animations and transitions.

@property up.motion.config
@param {number} [config.duration=175]
  The default duration for all animations and transitions (in milliseconds).
@param {string} [config.easing='ease']
  The default timing function that controls the acceleration of animations and transitions.

  See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
  for a list of pre-defined timing functions.
@param {boolean} [config.enabled]
  Whether animation is enabled.

  By default, animations are enabled, unless the user has configured their
  system to [minimize non-essential motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).

  Set this to `false` to disable animation globally.
  This can be useful in full-stack integration tests.
@stable
*/
export const motionConfig = newConfig('up.motion.config', (): t.MotionConfig => ({
  duration: 175,
  easing: 'ease',
  enabled: !matchMedia('(prefers-reduced-motion: reduce)').matches
}))

export let namedAnimations = new Registry<t.AnimationFn>('animation', findAnimationFn)

/*-
Defines a named animation.

## Example

Here is the definition of the pre-defined `fade-in` animation:

```js
up.animation('fade-in', function(element, options) {
  element.style.opacity = 0
  return up.animate(element, { opacity: 1 }, options)
})
```

## Callback contract

For animations that can be expressed through [CSS transitions](https://www.w3schools.com/css/css3_transitions.asp),
we recommend that your definitions end by calling [`up.animate()`](/api/up.animate) with an object argument,
passing along your `options` and returning the result.

If you choose to *not* use `up.animate()` and roll your own
animation code instead, your code must honor the following contract:

1. It must honor the options `{ duration, easing }`, if given.
2. It must *not* remove any of the given elements from the DOM.
3. It returns a promise that is fulfilled when the animation has ended.
4. If during the animation an event `up:motion:finish` is emitted on
   the given element, the animation instantly jumps to the last frame
   and resolves the returned promise.

Calling [`up.animate()`](/api/up.animate) with an object argument
will take care of all these points.

@function up.animation
@param {string} name
  The name of the new animation.
@param {Function(element, options): Promise} animation
  The callback function that executes the animation.
@stable
@signature
*/

export let namedTransitions = new Registry<t.TransitionFn>('transition', findTransitionFn)

/*-
Defines a named transition that [morphs](/api/up.morph) from one element to another.

## Example

Here is the definition of the pre-defined `cross-fade` transition:

```js
up.transition('cross-fade', function(oldElement, newElement, options) {
  return Promise.all([
    up.animate(oldElement, 'fade-out', options),
    up.animate(newElement, 'fade-in', options)
  ])
})
```

## Callback contract

For animations that can be expressed through [CSS transitions](https://www.w3schools.com/css/css3_transitions.asp),
we recommend that your definitions end by calling [`up.animate()`](/api/up.animate) with an object argument,
passing along your `options` and returning the result.

If you choose to *not* use `up.animate()` and roll your own
logic instead, your code must honor the following contract:

1. It must honor the options `{ duration, easing }` if given.
2. It must *not* remove any of the given elements from the DOM.
3. It returns a promise that is fulfilled when the transition has ended.
4. If during the transition an event `up:motion:finish` is emitted on
   either element, the transition instantly jumps to the last frame
   and resolves the returned promise.

Calling [`up.animate()`](/api/up.animate) with an object argument
will take care of all these points.

@function up.transition
@param {string} name
  The name of the new transition.
@param {Function(oldElement, newElement, options): Promise} transition
  The callback function that executes the transition.
@stable
@signature
*/

function reset(): void {
  motionController.reset()
}

/*-
Applies the given animation to the given element.

## Example

```js
up.animate('.warning', 'fade-in')
```

You can pass additional options:

```js
up.animate('.warning', 'fade-in', {
  duration: 250,
  easing: 'linear'
})
```

## Named animations

Unpoly ships with a number of [predefined animations](/learn/animations#available-animations)

You can define additional named animations using [`up.animation()`](/api/up.animation).

## Animating CSS properties directly

By passing an object instead of an animation name, you can animate
the CSS properties of the given element:

```js
let warning = document.querySelector('.warning')
warning.style.opacity = 0
up.animate(warning, { opacity: 1 })
```

CSS properties must be given using `kebab-case` keys.

## Multiple animations on the same element

Unpoly doesn't allow more than one concurrent animation on the same element.

If you attempt to animate an element that is already being animated,
the previous animation will instantly jump to its last frame before
the new animation begins.

@function up.animate
@section Element
  @param {Element|jQuery|string} element
    The element to animate.
@section Animation
  @param {string|Function(element, options): Promise|Object} animation
    Can either be:

    - The name of a [registered](/api/up.animation) animation
    - A function performing the animation (same contract as a function passed to `up.animation()`)
    - An object of CSS properties describing the last frame of the animation (using kebab-case property names)
  @param {number} [options.duration=175]
    The duration of the animation, in milliseconds.
  @param {string} [options.easing='ease']
    The timing function that controls the animation's acceleration.

    See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    for a list of pre-defined timing functions.
@return {Promise}
  A promise for the animation's end.
@stable
*/
// The element may also be a selector.
export const animate = mockable(async function animate(element: any, animationValue: t.AnimationValue | undefined, { duration, easing, onFinished }: t.AnimateOptions = {}): Promise<void> {
  // If passed a selector, up.fragment.get() will prefer a match on the current layer.
  element = getSmart(element)

  // Finish a previous animation, unless we're called from an animation or transition function.
  if (!motionController.nested) motionController.finish(element)

  // Convert the given animation value to a function we can call.
  // This returns undefined for values like `undefined`, `false`, `[null, null]` etc.
  const animationFn = guardFn(findAnimationFn(animationValue))

  // (A) Apply defaults.
  // (B) Set zero duration if motion is disabled.
  // (C) Leave out our callbacks, so a nested call from the motion function won't call them again.
  const timingOptions = effectiveTimingOptions({ duration, easing })

  let trackable = async function(): Promise<void> {
    if (animationFn && canAnimateElement(element)) {
      try {
        await animationFn(element, timingOptions)
      } finally {
        onFinished?.()
      }
    } else {
      // Behave like a sync function. Don't delay changes by a microtask.
      onFinished?.()
    }
  }

  await motionController.startFunction([element], trackable)
})

function canAnimateElement(element: Element): boolean {
  return !e.isSingleton(element)
}

/*-
This function will:

- Apply the configured default easing
- Apply the configured default duration
- Set a duration of 0 if motion is disabled. This causes animations to instantly jump to the last frame.

@function effectiveTimingOptions
@internal
*/
function effectiveTimingOptions({ duration, easing }: { duration?: number, easing?: string }): t.TimingOptions {
  return {
    duration: motionConfig.enabled ? (duration ?? motionConfig.duration) : 0,
    easing: easing ?? motionConfig.easing,
  }
}

/*-
Animates the given element's CSS properties using CSS transitions.

Does not track the animation, nor does it finish existing animations
(use `up.motion.animate()` for that). It does, however, listen to the motionController's
finish event.

@function animateNow
@param {Element|jQuery|string} element
  The element to animate.
@param {Object} lastFrame
  The CSS properties that should be transitioned to.
@param {number} [options.duration=175]
  The duration of the animation, in milliseconds.
@param {string} [options.easing='ease']
  The timing function that controls the animation's acceleration.
  See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
  for a list of pre-defined timing functions.
@param {Object} [finishedFrame=lastFrame]
  The CSS properties to set when the animation has finished.
@return {Promise}
  A promise that fulfills when the animation ends.
@internal
*/
async function animateNow(element: HTMLElement, lastFrame: e.StyleProps, { duration, easing }: t.TimingOptions, finishedFrame?: e.StyleProps): Promise<void> {
  // There is also Animation#commitStyles(), but that has two issues:
  // (A) Throws on detached elements
  // (B) Can't set an empty last frame property, e.g. when we're transforming towards { transform: '' }
  let applyFinishedFrame = (): void => e.setInlineStyle(element, finishedFrame ?? lastFrame)

  // A Web Animation with a duration of 0 (e.g. with disabled motion) would only finish
  // on the next animation frame. We don't want to depend on the rendering loop when nothing moves.
  if (!duration) return applyFinishedFrame()

  // if (up.migrate.loaded) lastFrame = up.migrate.fixSetStyleProps(lastFrame)
  // TODO: We could accepting camelCase everywhere we now run fixSetStyleProps or fixStyleProps
  let camelizedLastFrame = u.withRenamedKeys(lastFrame, u.kebabToCamelCase)
  let animation = element.animate([ camelizedLastFrame ], { duration, easing, fill: 'forwards' })
  let offFinish: UnbindFn
  let conclude = (): void => {
    animation.finish()
    applyFinishedFrame()
    animation.cancel()
    offFinish()
  }
  offFinish = on(element, 'up:motion:finish', conclude)
  await animation.finished
  conclude()
}

/*-
Completes [animations](/api/up.animate) and [transitions](/api/up.morph).

If called without arguments, all animations on the screen are completed.
If given an element (or selector), animations on that element and its children
are completed.

Animations are completed by jumping to the last animation frame instantly.
Promises returned by animation and transition functions instantly settle.

Emits the `up:motion:finish` event that is handled by `up.animate()`.

Does nothing if there are no animations to complete.

@function up.motion.finish
@param {Element|jQuery|string} [element]
  The element around which to finish all animations.
@return {Promise}
  A promise that fulfills when animations and transitions have finished.
@stable
*/
export function finish(element?: e.ElementOrSelector): Promise<void> | undefined {
  // Without an element, getSmart() returns undefined, and we finish all animations.
  element = getSmart(element as e.ElementOrSelector)
  motionController.finish(element)
  // Finishing is synchronous. With unpoly-migrate, we return a promise that warns when awaited.
  return up.migrate.formerlyAsync?.('up.motion.finish()')
}

/*-
This event is emitted on an animating element by `up.motion.finish()` to
request the animation to instantly finish and skip to the last frame.

@learn-ref controlling-motion#finishing-running-animations

Custom [animation](/api/up.animation) and [transition](/api/up.transition) functions are expected
to instantly settle their promises when this event is observed on the
animating element.

> [IMPORTANT]
> The `up:motion:finish` event does **not** signal the end of an animation.
> For this see [awaiting postprocessing](/learn/render-lifecycle#postprocessing).

@event up:motion:finish
@param {Element} event.target
  The animating element.
@stable
*/

/*-
Performs an animated transition between two elements.

Transitions are implemented by performing two animations in parallel,
causing `oldElement` to disappear and `newElement` to appear.

- `newElement` is [inserted before](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore) `oldElement`
- `oldElement` is removed from the [document flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Positioning) with `position: absolute`.
  It will be positioned over its original place in the flow that is now occupied by `newElement`.
- Both `oldElement` and `newElement` are animated in parallel
- `oldElement` is removed from the DOM

## Named transitions

Unpoly ships with a number of [predefined transitions](/learn/transitions#available-transitions).

You can define additional named transitions using [`up.transition()`](/api/up.transition).


@function up.morph
@section Elements
  @param {Element|jQuery|string} oldElement
    The old element to transition away from.

    It will be removed from the DOM when the transition finishes.
  @param {Element|jQuery|string} newElement
    The new element that will remain in the DOM once the transition finishes.

    It should be detached before calling `up.morph()`.
@section Transition
  @param {Function(oldElement, newElement, options)|string} transition
    Can either be:

    - The name of a [registered](/api/up.transition) transition
    - A function performing the transition (same contract as a function passed to `up.transition()`)
  @param {number} [options.duration=175]
    The duration of the transition, in milliseconds.
  @param {string} [options.easing='ease']
    The timing function that controls the transition's acceleration.

    See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    for a list of pre-defined timing functions.
@return {Promise}
  A promise that fulfills when the transition ends.
@stable
*/
export function morph(oldElement: e.ElementOrSelector, newElement: e.ElementOrSelector, transitionValue: t.TransitionValue, options?: t.SwapOptions): Promise<void>
// The elements are resolved in place. The implementation can't take the resolved type: with
// strictFunctionTypes, a function's overload must be assignable to it (TS2394).
export async function morph(oldElement: any, newElement: any, transitionValue: t.TransitionValue, options?: t.SwapOptions): Promise<void> {
  // (A) If passed a selector, up.fragment.get() will prefer a match on the current layer.
  // (B) This also unwraps jQuery collections.
  oldElement = getSmart(oldElement)
  newElement = getSmart(newElement)

  await swap(oldElement, newElement, transitionValue, options)()
}

// Inserts newElement now: before the absolutized oldElement when transitioning, in place of it otherwise.
// Returns a function that starts the transition and removes oldElement.
//
// Between the two calls a render pass compiles, focuses and scrolls:
//
// (A) Compilers may change newElement's size or position.
// (B) Compilers capture an [up-keep] identity before a transition adds inline styles.
// (C) We scroll newElement into position before we start the enter animation.
export function swap(oldElement: HTMLElement, newElement: HTMLElement, transitionValue: t.TransitionValue, { duration, easing, beforeRemove, afterRemove }: t.SwapOptions = {}): () => Promise<any> {
  // Convert the given transition value to a function we can call.
  // This returns undefined for values like `undefined`, `false`, `[null, null]` etc.
  const transitionFn = guardFn(findTransitionFn(transitionValue))

  // (A) Apply defaults.
  // (B) Set zero duration if motion is disabled.
  // (C) Leave out our callbacks, so a nested call from the motion function won't call them again.
  const timingOptions = effectiveTimingOptions({ duration, easing })

  const cluster = [newElement, oldElement]
  const { nested } = motionController
  let play: (() => Promise<void> | void) | undefined

  // Finish previous transitions before we measure or replace elements.
  if (!nested) cluster.forEach((element) => motionController.finish(element))

  if (transitionFn && canAnimateElement(oldElement)) {
    if (nested) {
      // If morph() is called inside a transition function, we don't want to create additional absolutized bounds.
      play = () => transitionFn(oldElement, newElement, timingOptions)
    } else {
      const viewport = closest(oldElement)
      const scrollTopBeforeScroll = viewport.scrollTop

      const oldRemote = absolutize(oldElement, {
        afterMeasure: () => e.insertBefore(oldElement, newElement)
      })

      play = async () => {
        // Since our caller may have scrolled the viewport (containing both oldElement and newElement),
        // we must shift the old copy so it looks like it is still sitting in the same position.
        oldRemote.moveBounds(0, viewport.scrollTop - scrollTopBeforeScroll)

        await transitionFn(oldElement, newElement, timingOptions)

        beforeRemove?.()
        // TODO: Don't expose { bounds }, why not remove()?
        oldRemote.bounds.remove()
        afterRemove?.()
      }
    }
  } else {
    beforeRemove?.()
    swapElementsDirectly(oldElement, newElement)
    // Nothing to animate. We only report the removal when the motion would start.
    play = afterRemove
  }

  return () => motionController.startFunction(cluster, async () => play?.())
}

function findTransitionFn(value: t.TransitionValue): t.TransitionFn | undefined {
  if (isNone(value)) {
    return undefined
  } else if (u.isFunction(value)) {
    return value
  } else if (u.isArray(value)) {
    return composeTransitionFn(...value)
  } else if (u.isString(value) && value.includes('/')) {
    return composeTransitionFn(...value.split('/') as [string, string])
  } else {
    return namedTransitions.get(value as string)
  }
}

function composeTransitionFn(oldAnimation: t.AnimationValue, newAnimation: t.AnimationValue): t.TransitionFn | undefined {
  // A composition of two null-animations is a null-transform
  // and should be skipped. If only one half is a null-animation, we animate the other half.
  if (!isNone(oldAnimation) || !isNone(newAnimation)) {
    const oldAnimationFn = findAnimationFn(oldAnimation) || u.asyncNoop
    const newAnimationFn = findAnimationFn(newAnimation) || u.asyncNoop
    return (oldElement, newElement, options) => Promise.all([
      oldAnimationFn(oldElement, options),
      newAnimationFn(newElement, options)
    ])
  }
}

function findAnimationFn(value: t.AnimationValue | undefined): t.AnimationFn | undefined {
  if (isNone(value)) {
    return undefined
  } else if (u.isFunction(value)) {
    return value
  } else if (u.isOptions(value)) {
    return (element, options) => animateNow(element, value, options)
  } else {
    return namedAnimations.get(value as string)
  }
}

// Have a separate function so we can mock it in specs.
export const swapElementsDirectly = mockable(function(oldElement: Element, newElement: Element): void {
  oldElement.replaceWith(newElement)
})

export function motionOptions(element: Element, options?: u.PlainObject, parserOptions?: e.OptionsParserOptions): u.PlainObject {
  options = u.newOptions(options)
  let parser = new OptionsParser(element, options, parserOptions)

  parser.booleanOrString('animation')
  parser.booleanOrString('transition')
  parser.string('easing')
  parser.number('duration')

  return options
}


/*-
Returns whether the given animation option will cause the animation
to be skipped.

@function up.motion.isNone
@internal
*/
export function isNone(motionValue: any): boolean {
  // false, undefined, '', null, the string "none" and an empty object of CSS properties are all ways to skip animations
  return !motionValue || motionValue === 'none' || (u.isOptions(motionValue) && u.isBlank(motionValue))
}

// From is an opacity or a function that reads it from the element.
function registerOpacityAnimation(name: string, from: any, to: number): void {
  namedAnimations.put(name, function(element: HTMLElement, options: t.TimingOptions) {
    element.style.opacity = u.evalOption(from, element)
    return animateNow(element, { opacity: to }, options)
  })
}

function currentOpacity(element: Element): string {
  return e.computedStyle(element, 'opacity')
}


function translateCSS(dx: number, dy: number): e.StyleProps {
  return { transform: `translate(${dx}px, ${dy}px)` }
}

function zeroTranslateCSS(): e.StyleProps {
  return { transform: 'translate(0, 0)' }
}

function untranslatedBox(element: HTMLElement): DOMRect {
  e.setInlineStyle(element, zeroTranslateCSS())
  return element.getBoundingClientRect()
}

function registerMoveAnimations(direction: string, boxToTransform: (box: DOMRect) => e.StyleProps): void {
  const animationToName = `move-to-${direction}`
  const animationFromName = `move-from-${direction}`

  namedAnimations.put(animationToName, function(element: HTMLElement, options: t.TimingOptions) {
    const box = untranslatedBox(element)
    const transform = boxToTransform(box)
    return animateNow(element, transform, options)
  })

  namedAnimations.put(animationFromName, function(element: HTMLElement, options: t.TimingOptions) {
    const box = untranslatedBox(element)
    const transform = boxToTransform(box)
    e.setInlineStyle(element, transform)
    return animateNow(element, zeroTranslateCSS(), options, { transform: '' })
  })
}


/*-
Swaps a fragment with an animated transition.

You can use a [predefined transition](/learn/transitions#available-transitions) or [define your own](/api/up.transition).

> [NOTE]
> Transitions are not possible when replacing the `<body>` element.
> To transition the entire page, wrap it in a container element.

@learn-ref transitions

## Following a link with animation

The link will load the fragment `#story` from the URL `/page2`.
Once the response is received, the old fragment version will fly out to the left, while the new
version will fly in from the right.

```html
<a href="/page2"
  up-target="#story"
  up-transition="move-left">
  Next page
</a>
```

## Submitting a form with animation

The form will load the fragment `.content` from the URL `/tasks`.
Once the response is received, the old fragment version will fade out, while the new
version will fade in.

```html
<form action="/tasks"
  up-target=".content"
  up-transition="cross-fade">
  ...
</form>
```

@selector [up-transition]
@params-note
  All modifying attributes for `[up-follow]` (links) or `[up-submit]` (forms) may also be used.
@param [up-transition]
  The [name of a transition](/learn/transitions#available-transitions).
@param [up-duration]
    The duration of the transition in milliseconds.
@param [up-easing]
    The [timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    that controls the acceleration of the transition.
@param [up-fail-transition]
  The transition to use when the server responds with an error code.

  See [[error-responses]].
@stable
@signature
*/

export function install(): void {
  on('up:framework:boot', function() {
    // Explain to the user why animations aren't working.
    // E.g. the user might have disabled animations in her OS.
    if (!motionConfig.enabled) {
      printToStandard('up.motion', 'Animations are disabled')
    }
  })

  registerOpacityAnimation('fade-in', 0, 1)

  registerOpacityAnimation('fade-out', currentOpacity, 0)

  registerMoveAnimations('top', function(box) {
    const travelDistance = box.top + box.height
    return translateCSS(0, -travelDistance)
  })

  registerMoveAnimations('bottom', function(box) {
    const travelDistance = rootHeight() - box.top
    return translateCSS(0, travelDistance)
  })

  registerMoveAnimations('left', function(box) {
    const travelDistance = box.left + box.width
    return translateCSS(-travelDistance, 0)
  })

  registerMoveAnimations('right', function(box) {
    const travelDistance = rootWidth() - box.left
    return translateCSS(travelDistance, 0)
  })

  namedTransitions.put('cross-fade', ['fade-out', 'fade-in'])

  namedTransitions.put('move-left', ['move-to-left', 'move-from-right'])

  namedTransitions.put('move-right', ['move-to-right', 'move-from-left'])

  namedTransitions.put('move-up', ['move-to-top', 'move-from-bottom'])

  namedTransitions.put('move-down', ['move-to-bottom', 'move-from-top'])

  on('up:framework:reset', reset)
}

export const api = {
  motion: {
    morph,
    animate,
    finish,
    transition: namedTransitions.put,
    animation: namedAnimations.put,
    config: motionConfig,
  },
  transition: namedTransitions.put,
  animation: namedAnimations.put,
  morph,
  animate,
}
