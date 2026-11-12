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


const motionController = new MotionController('motion')

export const motionConfig = newConfig('up.motion.config', (): t.MotionConfig => ({
  duration: 175,
  easing: 'ease',
  enabled: !matchMedia('(prefers-reduced-motion: reduce)').matches
}))

export let namedAnimations = new Registry<t.AnimationFn>('animation', findAnimationFn)

export let namedTransitions = new Registry<t.TransitionFn>('transition', findTransitionFn)

function reset(): void {
  motionController.reset()
}

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

function effectiveTimingOptions({ duration, easing }: { duration?: number, easing?: string }): t.TimingOptions {
  return {
    duration: motionConfig.enabled ? (duration ?? motionConfig.duration) : 0,
    easing: easing ?? motionConfig.easing,
  }
}

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

export function finish(element?: e.ElementOrSelector): Promise<void> | undefined {
  // Without an element, getSmart() returns undefined, and we finish all animations.
  element = getSmart(element as e.ElementOrSelector)
  motionController.finish(element)
  // Finishing is synchronous. With unpoly-migrate, we return a promise that warns when awaited.
  return up.migrate.formerlyAsync?.('up.motion.finish()')
}

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
export function swap(oldElement: HTMLElement, newElement: HTMLElement, transitionValue?: t.TransitionValue, { duration, easing, beforeRemove, afterRemove }: t.SwapOptions = {}): () => Promise<any> {
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

function findTransitionFn(value?: t.TransitionValue): t.TransitionFn | undefined {
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
