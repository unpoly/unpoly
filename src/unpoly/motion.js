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

  let namedAnimations = {}
  let namedTransitions = {}

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

    By default animations are enabled, unless the user has configured their
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

  function pickDefault(registry) {
    return u.pickBy(registry, 'isDefault')
  }

  function reset() {
    motionController.reset()
    namedAnimations = pickDefault(namedAnimations)
    namedTransitions = pickDefault(namedTransitions)
  }

  /*-
  Returns whether Unpoly will perform animations.

  Set [`up.motion.config.enabled = false`](/up.motion.config#config.enabled) in order to disable animations globally.

  @function up.motion.isEnabled
  @return {boolean}
  @stable
  */
  function isEnabled() {
    return config.enabled
  }

  /*-
  Applies the given animation to the given element.

  ### Example

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

  ### Named animations

  Unpoly ships with a number of [predefined animations](/predefined-animations)

  You can define additional named animations using [`up.animation()`](/up.animation).

  ### Animating CSS properties directly

  By passing an object instead of an animation name, you can animate
  the CSS properties of the given element:

  ```js
  var warning = document.querySelector('.warning')
  warning.style.opacity = 0
  up.animate(warning, { opacity: 1 })
  ```

  CSS properties must be given using `kebab-case` keys.

  ### Multiple animations on the same element

  Unpoly doesn't allow more than one concurrent animation on the same element.

  If you attempt to animate an element that is already being animated,
  the previous animation will instantly jump to its last frame before
  the new animation begins.

  @function up.animate
  @param {Element|jQuery|string} element
    The element to animate.
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
  function animate(element, animation, options) {
    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    element = up.fragment.get(element)
    options = u.options(options)

    let animationFn = findAnimationFn(animation)
    // willAnimate() also sets a default { duration } and { easing }.
    const willRun = willAnimate(element, animation, options)
    animationFn = up.error.guardFn(animationFn)

    if (willRun) {
      // up.puts 'up.animate()', Animating %o with animation %o', element, animation
      const runNow = () => animationFn(element, options)
      return motionController.startFunction(element, runNow, options)
    } else {
      return skipAnimate(element, animation)
    }
  }

  function willAnimate(element, animationOrTransition, options) {
    applyConfig(options)
    return isEnabled() && !isNone(animationOrTransition) && (options.duration > 0) && !e.isSingleton(element)
  }

  function skipAnimate(element, animation) {
    if (u.isOptions(animation)) {
      // If we are given the final animation frame as an object of CSS properties,
      // the best we can do is to set the final frame without animation.
      e.setStyle(element, animation)
    }
    // Signal that the animation is already done.
    return Promise.resolve()
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
    if (up.migrate.loaded) lastFrame = up.migrate.fixStyleProps(lastFrame)
    options = { ...options, finishEvent: motionController.finishEvent }
    const cssTransition = new up.CSSTransition(element, lastFrame, options)
    return cssTransition.start()
  }

  function applyConfig(options) {
    options.easing ??= config.easing
    options.duration ??= config.duration
  }

  function findNamedAnimation(name) {
    return namedAnimations[name] || up.fail("Unknown animation %o", name)
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
  > For this see [awaiting postprocessing](/render-lifecycle#awaiting-postprocessing).

  @event up:motion:finish
  @param {Element} event.target
    The animating element.
  @stable
  */

  /*-
  Performs an animated transition between the `source` and `target` elements.

  Transitions are implement by performing two animations in parallel,
  causing `source` to disappear and the `target` to appear.

  - `target` is [inserted before](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore) `source`
  - `source` is removed from the [document flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Positioning) with `position: absolute`.
     It will be positioned over its original place in the flow that is now occupied by `target`.
  - Both `source` and `target` are animated in parallel
  - `source` is removed from the DOM

  ### Named transitions

  Unpoly ships with a number of [predefined transitions](/predefined-transitions).

  You can define additional named transitions using [`up.transition()`](/up.transition).


  ### Implementation details

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
  @param {Element|jQuery|string} source
  @param {Element|jQuery|string} target
    The target element that will remain in the DOM once the transition finished.

    It should be detached before calling `up.morph()`.
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
  @param {boolean} [options.reveal=false]
    Whether to reveal the new element by scrolling its parent viewport.
  @return {Promise}
    A promise that fulfills when the transition ends.
  @stable
  */
  function morph(oldElement, newElement, transitionObject, options) {
    options = u.options(options)
    applyConfig(options)

    // If passed a selector, up.fragment.get() will prefer a match on the current layer.
    // This also unwraps jQuery collections.
    oldElement = up.fragment.get(oldElement)
    newElement = up.fragment.get(newElement)

    let transitionFn = findTransitionFn(transitionObject)
    // willAnimate() also sets a default { duration } and { easing }.
    const willMorph = willAnimate(oldElement, transitionFn, options)
    transitionFn = up.error.guardFn(transitionFn)

    // Remove callbacks from our options hash in case transitionFn calls morph() recursively.
    // If we passed on these callbacks, we might call destructors, events, etc. multiple times.
    const beforeStart = u.pluckKey(options, 'beforeStart') || u.noop
    const afterInsert = u.pluckKey(options, 'afterInsert') || u.noop
    const beforeDetach = u.pluckKey(options, 'beforeDetach') || u.noop
    const afterDetach = u.pluckKey(options, 'afterDetach') || u.noop
    // Callback to scroll newElement into position before we start the enter animation.
    const scrollNew = u.pluckKey(options, 'scrollNew') || u.noop

    beforeStart()

    if (willMorph) {
      // If morph() is called from inside a transition function we
      // (1) don't want to track it again and
      // (2) don't want to create additional absolutized bounds
      if (motionController.isActive(oldElement) && (options.trackMotion === false)) {
        return transitionFn(oldElement, newElement, options)
      }

      up.puts('up.morph()', 'Morphing %o to %o with transition %O over %d ms', oldElement, newElement, transitionObject, options.duration)

      const viewport = up.viewport.get(oldElement)
      const scrollTopBeforeReveal = viewport.scrollTop

      const oldRemote = up.viewport.absolutize(oldElement, {
        // Because the insertion will shift elements visually, we must delay insertion
        // until absolutize() has measured the bounding box of the old element.
        //
        // After up.viewport.absolutize() the DOM tree will look like this:
        //
        //     <new-element></new-element>
        //     <up-bounds>
        //        <old-element><old-element>
        //     </up-bounds>
        afterMeasure() {
          e.insertBefore(oldElement, newElement)
          afterInsert()
        }
      })

      const trackable = async function() {
        // Scroll newElement into position before we start the enter animation.
        scrollNew()

        // Since we have scrolled the viewport (containing both oldElement and newElement),
        // we must shift the old copy so it looks like it it is still sitting
        // in the same position.
        const scrollTopAfterReveal = viewport.scrollTop
        oldRemote.moveBounds(0, scrollTopAfterReveal - scrollTopBeforeReveal)

        await transitionFn(oldElement, newElement, options)

        beforeDetach()
        oldRemote.bounds.remove()
        afterDetach()
      }

      return motionController.startFunction([oldElement, newElement], trackable, options)

    } else {
      beforeDetach()
      // Swapping the elements directly with replaceWith() will cause
      // jQuery to remove all data attributes, which we use to store destructors
      swapElementsDirectly(oldElement, newElement)
      afterInsert()
      afterDetach()
      scrollNew()

      // Satisfy our signature as an async function.
      return Promise.resolve()
    }
  }

  function findTransitionFn(object) {
    if (isNone(object)) {
      return undefined
    } else if (u.isFunction(object)) {
      return object
    } else if (u.isArray(object)) {
      return composeTransitionFn(...object)
    } else if (u.isString(object)) {
      let namedTransition
      if (object.indexOf('/') >= 0) { // Compose a transition from two animation names
        return composeTransitionFn(...object.split('/'))
      } else if (namedTransition = namedTransitions[object]) {
        return findTransitionFn(namedTransition)
      }
    } else {
      up.fail("Unknown transition %o", object)
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

  function findAnimationFn(object) {
    if (isNone(object)) {
      return undefined
    } else if (u.isFunction(object)) {
      return object
    } else if (u.isString(object)) {
      return findNamedAnimation(object)
    } else if (u.isOptions(object)) {
      return (element, options) => animateNow(element, object, options)
    } else {
      up.fail('Unknown animation %o', object)
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

  /*-
  Defines a named transition that [morphs](/up.morph) from one element to another.

  ### Example

  Here is the definition of the pre-defined `cross-fade` animation:

  ```js
  up.transition('cross-fade', function(oldElement, newElement, options) {
    return Promise.all([
      up.animate(oldElement, 'fade-out', options),
      up.animate(newElement, 'fade-in', options)
    ])
  })
  ```

  ### Callback contract

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
  @param {Function(oldElement, newElement, options): Promise} transition
  @stable
  */
  function registerTransition(name, transition) {
    const fn = findTransitionFn(transition)
    fn.isDefault = up.framework.evaling
    namedTransitions[name] = fn
  }

  /*-
  Defines a named animation.

  ### Example

  Here is the definition of the pre-defined `fade-in` animation:

  ```js
  up.animation('fade-in', function(element, options) {
    element.style.opacity = 0
    return up.animate(element, { opacity: 1 }, options)
  })
  ```

  ### Callback contract

  For animations that can be expressed through [CSS transitions](https://www.w3schools.com/css/css3_transitions.asp),
  we recomend that your definitions end by calling calling [`up.animate()`](/up.animate) with an object argument,
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
  @param {Function(element, options): Promise} animation
  @stable
  */
  function registerAnimation(name, animation) {
    const fn = findAnimationFn(animation)
    fn.isDefault = up.framework.evaling
    namedAnimations[name] = fn
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
    registerAnimation(name, function(element, options) {
      element.style.opacity = 0
      e.setStyle(element, { opacity: from })
      return animateNow(element, { opacity: to }, options)
    })
  }

  registerOpacityAnimation('fade-in', 0, 1)
  registerOpacityAnimation('fade-out', 1, 0)

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

    registerAnimation(animationToName, function(element, options) {
      const box = untranslatedBox(element)
      const transform = boxToTransform(box)
      return animateNow(element, transform, options)
    })

    registerAnimation(animationFromName, function(element, options) {
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

  registerTransition('cross-fade', ['fade-out', 'fade-in'])
  registerTransition('move-left', ['move-to-left', 'move-from-right'])
  registerTransition('move-right', ['move-to-right', 'move-from-left'])
  registerTransition('move-up', ['move-to-top', 'move-from-bottom'])
  registerTransition('move-down', ['move-to-bottom', 'move-from-top'])

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
    All attributes for `[up-follow]` (links) or `[up-submit]` forms may also be used.
  @param [up-transition]
    The [name of a transition](/predefined-transitions).
  @param [up-fail-transition]
    The transition to use when the server responds with an error code.

    @see failed-responses
  @stable
  */

  up.on('up:framework:reset', reset)

  return {
    morph,
    animate,
    finish,
    finishCount() { return motionController.finishCount },
    transition: registerTransition,
    animation: registerAnimation,
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
