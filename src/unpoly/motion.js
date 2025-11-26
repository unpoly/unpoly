/*-
Animation
=========

When you [update a page fragment](/up.link) you can animate the change.

## Transitions

When we morph between an old and a new element, we call it a *transition*.

For instance, you may add an `[up-transition]` attribute to your
links or forms to smoothly fade out the old element while fading in the new element:

```html
<a href="/users"
  up-target=".list"
  up-transition="cross-fade">
  Show users
</a>
```

## Animations

In contrast, when we animate a new element without simultaneously removing an
old element, we call it an *animation*.

An example for an animation is opening a new overlay. We can animate the appearance
of the dialog by adding an [`[up-animation]`](/up-layer-new#up-animation) attribute to the opening link:

```html
<a href="/users"
  up-target=".list"
  up-layer="new"
  up-animation="move-from-top">
  Show users
</a>
```

## Which animations are available?

Unpoly ships with a number of [predefined transitions](/up.morph#named-transitions)
and [predefined animations](/up.animate#named-animations).

You can define custom animations using `up.transition()` and
`up.animation()`.


@see predefined-animations
@see predefined-transitions
@see motion-tuning

@see [up-transition]
@see up.animation
@see up.transition

@module up.motion
*/
up.motion = (function() {

  const u = up.util
  const e = up.element

  const motionController = new up.MotionController('motion')

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
  const config = new up.Config(() => ({
    duration: 175,
    easing: 'ease',
    enabled: !matchMedia('(prefers-reduced-motion: reduce)').matches
  }))

  let namedAnimations = new up.Registry('animation', findAnimationFn)

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
  we recommend that your definitions end by calling calling [`up.animate()`](/up.animate) with an object argument,
  passing along your `options` and returning the result.

  If you choose to *not* use `up.animate()` and roll your own
  animation code instead, your code must honor the following contract:

  1. It must honor the options `{ duration, easing }`, if given.
  2. It must *not* remove any of the given elements from the DOM.
  3. It returns a promise that is fulfilled when the transition has ended
  4. If during the animation an event `up:motion:finish` is emitted on
     the given element, the transition instantly jumps to the last frame
     and resolves the returned promise.

  Calling [`up.animate()`](/up.animate) with an object argument
  will take care of all these points.

  @function up.animation
  @param {string} name
    The name of the new animation.
  @param {Function(element, options): Promise} animation
    The callback function that executes the animation.
  @stable
  */

  let namedTransitions = new up.Registry('transition', findTransitionFn)

  /*-
  Defines a named transition that [morphs](/up.morph) from one element to another.

  ## Example

  Here is the definition of the pre-defined `cross-fade` animation:

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
  we recomend that your definitions end by calling [`up.animate()`](/up.animate) with an object argument,
  passing along your `options` and returning the result.

  If you choose to *not* use `up.animate()` and roll your own
  logic instead, your code must honor the following contract:

  1. It must honor the options `{ duration, easing }` if given.
  2. It must *not* remove any of the given elements from the DOM.
  3. It returns a promise that is fulfilled when the transition has ended.
  4. If during the animation an event `up:motion:finish` is emitted on
     either element, the transition instantly jumps to the last frame
     and resolves the returned promise.

  Calling [`up.animate()`](/up.animate) with an object argument
  will take care of all these points.

  @function up.transition
  @param {string} name
    The name of the new transition.
  @param {Function(oldElement, newElement, options): Promise} transition
    The callback function that executes the transition.
  @stable
  */

  function reset() {
    motionController.reset()
  }

  /*-
  Returns whether Unpoly will perform animations and transitions.

  Set [`up.motion.config.enabled = false`](/up.motion.config#config.enabled) in order to disable animations globally.

  @function up.motion.isEnabled
  @return {boolean}
    Whether animation is enabled.
  @stable
  */
  function isEnabled() {
    return config.enabled
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

  Unpoly ships with a number of [predefined animations](/predefined-animations)

  You can define additional named animations using [`up.animation()`](/up.animation).

  ## Animating CSS properties directly

  By passing an object instead of an animation name, you can animate
  the CSS properties of the given element:

  ```js
  var warning = document.querySelector('.warning')
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

      - The name of a [registered](/up.animation) animation
      - A function performing the animation (same contract as a function passed to `up.animation()`)
      - An object of CSS attributes describing the last frame of the animation (using kebeb-case property names)
    @param {number} [options.duration=300]
      The duration of the animation, in milliseconds.
    @param {string} [options.easing='ease']
      The timing function that controls the animation's acceleration.

      See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
      for a list of pre-defined timing functions.
  @return {Promise}
    A promise for the animation's end.
  @stable
  */
  async function animate(element, animation, options = {}) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    element = up.fragment.get(element)

    const onFinished = options.onFinished ?? u.noop

    // willAnimate() also sets a default { duration } and { easing }.
    const willRun = willAnimate(element, animation, options)

    if (willRun) {
      let animationFn = up.error.guardFn(findAnimationFn(animation))
      let fnOptions = u.pick(options, ['duration', 'easing', 'trackMotion'])
      const runNow = () => animationFn(element, fnOptions).finally(onFinished)
      await motionController.startFunction(element, runNow, fnOptions)
    } else {
      if (u.isOptions(animation)) {
        // If we are given the final animation frame as an object of CSS properties,
        // the best we can do is to set the final frame without animation.
        e.setStyle(element, animation)
      }
      onFinished()
    }
  }

  function willAnimate(element, animationOrTransition, options) {
    applyConfig(options)
    return isEnabled() && !isNone(animationOrTransition) && (options.duration > 0) && !e.isSingleton(element)
  }

  /*-
  Animates the given element's CSS properties using CSS transitions.

  Does not track the animation, nor does it finishes existing animations
  (use `up.motion.animate()` for that). It does, however, listen to the motionController's
  finish event.

  @function animateNow
  @param {Element|jQuery|string} element
    The element to animate.
  @param {Object} lastFrame
    The CSS properties that should be transitioned to.
  @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {string} [options.easing='ease']
    The timing function that controls the animation's acceleration.
    See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    for a list of pre-defined timing functions.
  @return {Promise}
    A promise that fulfills when the animation ends.
  @internal
  */
  function animateNow(element, lastFrame, options) {
    if (up.migrate.loaded) lastFrame = up.migrate.fixSetStyleProps(lastFrame)
    options = { ...options, finishEvent: motionController.finishEvent }
    const cssTransition = new up.CSSTransition(element, lastFrame, options)
    return cssTransition.start()
  }

  function applyConfig(options) {
    options.easing ??= config.easing
    options.duration ??= config.duration
  }

  /*-
  Completes [animations](/up.animate) and [transitions](/up.morph).

  If called without arguments, all animations on the screen are completed.
  If given an element (or selector), animations on that element and its children
  are completed.

  Animations are completed by jumping to the last animation frame instantly.
  Promises returned by animation and transition functions instantly settle.

  Emits the `up:motion:finish` event that is handled by `up.animate()`.

  Does nothing if there are no animation to complete.

  @function up.motion.finish
  @param {Element|jQuery|string} [element]
    The element around which to finish all animations.
  @return {Promise}
    A promise that fulfills when animations and transitions have finished.
  @stable
  */
  function finish(element) {
    return motionController.finish(element)
  }

  /*-
  This event is emitted on an animating element by `up.motion.finish()` to
  request the animation to instantly finish and skip to the last frame.

  Custom [animation](/up.animation) and [transition](/up.transition) functions are expected
  to instantly settle their promises when this event is observed on the
  animating element.

  > [IMPORTANT]
  > The `up:motion:finish` event does **not** signal the end of an animation.
  > For this see [awaiting postprocessing](/render-lifecycle#postprocessing).

  @event up:motion:finish
  @param {Element} event.target
    The animating element.
  @stable
  */

  /*-
  Performs an animated transition between two elements.

  Transitions are implement by performing two animations in parallel,
  causing `oldElement` to disappear and the `newElement` to appear.

  - `newElement` is [inserted before](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore) `oldElement`
  - `oldElement` is removed from the [document flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Positioning) with `position: absolute`.
     It will be positioned over its original place in the flow that is now occupied by `newElement`.
  - Both `oldElement` and `newElement` are animated in parallel
  - `oldElement` is removed from the DOM

  ## Named transitions

  Unpoly ships with a number of [predefined transitions](/predefined-transitions).

  You can define additional named transitions using [`up.transition()`](/up.transition).


  ## Implementation details

  During a transition both the old and new element occupy
  the same position on the screen.

  Since the CSS layout flow will usually not allow two elements to
  overlay the same space, Unpoly:

  - The old and new elements are cloned
  - The old element is removed from the layout flow using `display: hidden`
  - The new element is hidden, but still leaves space in the layout flow by setting `visibility: hidden`
  - The clones are [absolutely positioned](https://developer.mozilla.org/en-US/docs/Web/CSS/position#Absolute_positioning)
    over the original elements.
  - The transition is applied to the cloned elements.
    At no point will the hidden, original elements be animated.
  - When the transition has finished, the clones are removed from the DOM and the new element is shown.
    The old element remains hidden in the DOM.

  @function up.morph
  @section Elements
    @param {Element|jQuery|string} oldElement
      The old element to transition away from.

      It will remain attached when the transition finished, but may be hidden our
      be located outside the visible viewport.
    @param {Element|jQuery|string} newElement
      The new element that will remain in the DOM once the transition finished.

      It should be detached before calling `up.morph()`.
  @section Transition
    @param {Function(oldElement, newElement, options)|string} transition
      Can either be:

      - The name of a [registered](/up.transition) transition
      - A function performing the transition (same contract as a function passed to `up.transition()`)
    @param {number} [options.duration=300]
      The duration of the animation, in milliseconds.
    @param {string} [options.easing='ease']
      The timing function that controls the transition's acceleration.

      See [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
      for a list of pre-defined timing functions.
  @return {Promise}
    A promise that fulfills when the transition ends.
  @stable
  */
  function morph(...args) {
    return phasedMorph(...args).postprocess()
  }

  function phasedMorph(oldElement, newElement, transitionObject, options) {
    options = u.options(options)

    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    // This also unwraps jQuery collections.
    oldElement = up.fragment.get(oldElement)
    newElement = up.fragment.get(newElement)

    let transitionFn = findTransitionFn(transitionObject)
    const willMorph = willAnimate(oldElement, transitionFn, options)
    transitionFn = up.error.guardFn(transitionFn)

    // Remove callbacks from our options hash in case transitionFn calls morph() recursively.
    const scrollNew = u.pluckKey(options, 'scrollNew') || u.noop
    const beforeRemove = u.pluckKey(options, 'beforeRemove') || u.noop
    const afterRemove = u.pluckKey(options, 'afterRemove') || u.noop

    if (willMorph) {
      // If morph() is called from inside a transition function we
      // (1) don't want to track it again and
      // (2) don't want to create additional absolutized bounds
      if (motionController.isActive(oldElement) && (options.trackMotion === false)) {
        return {
          postprocess: () => transitionFn(oldElement, newElement, options)
        }
      }

      up.puts('up.morph()', 'Morphing %o to %o with transition %O over %d ms', oldElement, newElement, transitionObject, options.duration)

      const viewport = up.viewport.get(oldElement)
      const scrollTopBeforeScroll = viewport.scrollTop

      const oldRemote = up.viewport.absolutize(oldElement, {
        afterMeasure: () => e.insertBefore(oldElement, newElement)
      })

      return {
        async postprocess() {
          const trackable = async function() {
            // Scroll newElement into position before we start the enter animation.
            scrollNew()

            // Since we have scrolled the viewport (containing both oldElement and newElement),
            // we must shift the old copy so it looks like it it is still sitting
            // in the same position.
            const scrollTopAfterScroll = viewport.scrollTop
            oldRemote.moveBounds(0, scrollTopAfterScroll - scrollTopBeforeScroll)

            await transitionFn(oldElement, newElement, options)

            beforeRemove()
            oldRemote.bounds.remove()
            afterRemove()
          }

          await motionController.startFunction([oldElement, newElement], trackable, options)
        }
      }
    } else {
      beforeRemove()
      swapElementsDirectly(oldElement, newElement)

      return {
        async postprocess() {
          scrollNew()
          afterRemove()
        }
      }
    }
  }

  function findTransitionFn(value) {
    if (isNone(value)) {
      return undefined
    } else if (u.isFunction(value)) {
      return value
    } else if (u.isArray(value)) {
      return composeTransitionFn(...value)
    } else if (u.isString(value) && value.includes('/')) {
      return composeTransitionFn(...value.split('/'))
    } else {
      return namedTransitions.get(value)
    }
  }

  function composeTransitionFn(oldAnimation, newAnimation) {
    // A composition of two null-animations is a null-transform
    // and should be skipped.
    if (!isNone(oldAnimation) && !isNone(newAnimation)) {
      const oldAnimationFn = findAnimationFn(oldAnimation) || u.asyncNoop
      const newAnimationFn = findAnimationFn(newAnimation) || u.asyncNoop
      return (oldElement, newElement, options) => Promise.all([
        oldAnimationFn(oldElement, options),
        newAnimationFn(newElement, options)
      ])
    }
  }

  function findAnimationFn(value) {
    if (isNone(value)) {
      return undefined
    } else if (u.isFunction(value)) {
      return value
    } else if (u.isOptions(value)) {
      return (element, options) => animateNow(element, value, options)
    } else {
      return namedAnimations.get(value)
    }
  }

  // Have a separate function so we can mock it in specs.
  const swapElementsDirectly = up.mockable(function(oldElement, newElement) {
    oldElement.replaceWith(newElement)
  })

  function motionOptions(element, options, parserOptions) {
    options = u.options(options)
    let parser = new up.OptionsParser(element, options, parserOptions)

    parser.booleanOrString('animation')
    parser.booleanOrString('transition')
    parser.string('easing')
    parser.number('duration')

    return options
  }

  up.on('up:framework:boot', function() {
    // Explain to the user why animations aren't working.
    // E.g. the user might have disabled animations in her OS.
    if (!isEnabled()) {
      up.puts('up.motion', 'Animations are disabled')
    }
  })

  /*-
  Returns whether the given animation option will cause the animation
  to be skipped.

  @function up.motion.isNone
  @internal
  */
  function isNone(animationOrTransition) {
    // false, undefined, '', null and the string "none" are all ways to skip animations
    return !animationOrTransition || animationOrTransition === 'none'
  }

  function registerOpacityAnimation(name, from, to) {
    namedAnimations.put(name, function(element, options) {
      element.style.opacity = u.evalOption(from, element)
      return animateNow(element, { opacity: to }, options)
    })
  }

  function currentOpacity(element) {
    return e.style(element, 'opacity')
  }

  registerOpacityAnimation('fade-in', 0, 1)
  registerOpacityAnimation('fade-out', currentOpacity, 0)

  function translateCSS(dx, dy) {
    return { transform: `translate(${dx}px, ${dy}px)` }
  }

  function noTranslateCSS() {
    return { transform: '' }
  }

  function untranslatedBox(element) {
    e.setStyle(element, noTranslateCSS())
    return element.getBoundingClientRect()
  }

  function registerMoveAnimations(direction, boxToTransform) {
    const animationToName = `move-to-${direction}`
    const animationFromName = `move-from-${direction}`

    namedAnimations.put(animationToName, function(element, options) {
      const box = untranslatedBox(element)
      const transform = boxToTransform(box)
      return animateNow(element, transform, options)
    })

    namedAnimations.put(animationFromName, function(element, options) {
      const box = untranslatedBox(element)
      const transform = boxToTransform(box)
      e.setStyle(element, transform)
      return animateNow(element, noTranslateCSS(), options)
    })
  }

  registerMoveAnimations('top', function(box) {
    const travelDistance = box.top + box.height
    return translateCSS(0, -travelDistance)
  })

  registerMoveAnimations('bottom', function(box) {
    const travelDistance = up.viewport.rootHeight() - box.top
    return translateCSS(0, travelDistance)
  })

  registerMoveAnimations('left', function(box) {
    const travelDistance = box.left + box.width
    return translateCSS(-travelDistance, 0)
  })

  registerMoveAnimations('right', function(box) {
    const travelDistance = up.viewport.rootWidth() - box.left
    return translateCSS(travelDistance, 0)
  })

  namedTransitions.put('cross-fade', ['fade-out', 'fade-in'])
  namedTransitions.put('move-left', ['move-to-left', 'move-from-right'])
  namedTransitions.put('move-right', ['move-to-right', 'move-from-left'])
  namedTransitions.put('move-up', ['move-to-top', 'move-from-bottom'])
  namedTransitions.put('move-down', ['move-to-bottom', 'move-from-top'])

  /*-
  Swaps a fragment with an animated transition.

  You can use a [predefined transition](/predefined-transitions) or [define your own](/up.transition).

  > [NOTE]
  > Transitions are not possible when replacing the `<body>` element.
  > To transition the entire page, wrap it in a container element.

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
    The [name of a transition](/predefined-transitions).
  @param [up-duration]
      The duration of the transition in milliseconds.
  @param [up-easing]
      The [timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
      that controls the acceleration of the transition.
  @param [up-fail-transition]
    The transition to use when the server responds with an error code.

    @see failed-responses
  @stable
  */

  up.on('up:framework:reset', reset)

  return {
    morph,
    phasedMorph,
    animate,
    finish,
    finishCount() { return motionController.finishCount },
    transition: namedTransitions.put,
    animation: namedAnimations.put,
    config,
    isEnabled,
    isNone,
    willAnimate,
    swapElementsDirectly,
    motionOptions,
  }
})()

up.transition = up.motion.transition
up.animation = up.motion.animation
up.morph = up.motion.morph
up.animate = up.motion.animate
