###**
Animation
=========
  
When you [update a page fragment](/up.link) you can animate the change.

You can add an attribute [`[up-transition]`](/a-up-transition) to your
links or forms to smoothly fade out the old element while fading in the new element:

```html
<a href="/users"
  up-target=".list"
  up-transition="cross-fade">
  Show users
</a>
```

\#\#\# Transitions vs. animations

When we morph between an old and a new element, we call it a *transition*.
In contrast, when we animate a new element without simultaneously removing an
old element, we call it an *animation*.

An example for an animation is opening a new overlay. We can animate the appearance
of the dialog by adding an [`[up-animation]`](/a-up-animation) attribute to the opening link:

```html
<a href="/users"
  up-target=".list"
  up-layer="new"
  up-animation="move-from-top">
  Show users
</a>
```

\#\#\# Which animations are available?

Unpoly ships with a number of [predefined transitions](/up.morph#named-transitions)
and [predefined animations](/up.animate#named-animations).

You can define custom animations using `up.transition()` and
`up.animation()`.

@see a[up-transition]
@see up.animation
@see up.transition

@module up.motion
###
up.motion = do ->
  
  u = up.util
  e = up.element

  namedAnimations = {}
  namedTransitions = {}

  motionController = new up.MotionController('motion')

  ###**
  Sets default options for animations and transitions.

  @property up.motion.config
  @param {number} [config.duration=175]
    The default duration for all animations and transitions (in milliseconds).
  @param {string} [config.easing='ease']
    The default timing function that controls the acceleration of animations and transitions.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {boolean} [config.enabled]
    Whether animation is enabled.

    By default animations are enabled, unless the user has configured their
    system to [minimize non-essential motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).

    Set this to `false` to disable animation globally.
    This can be useful in full-stack integration tests.
  @stable
  ###
  config = new up.Config ->
    duration: 175
    easing: 'ease'
    enabled: !matchMedia('(prefers-reduced-motion: reduce)').matches

  pickDefault = (registry) ->
    return u.pickBy registry, (value) -> value.isDefault

  reset = ->
    motionController.reset()
    namedAnimations = pickDefault(namedAnimations)
    namedTransitions = pickDefault(namedTransitions)
    config.reset()

  ###**
  Returns whether Unpoly will perform animations.

  Set [`up.motion.config.enabled = false`](/up.motion.config#config.enabled) in order to disable animations globally.

  @function up.motion.isEnabled
  @return {boolean}
  @stable
  ###
  isEnabled = ->
    config.enabled

  ###**
  Applies the given animation to the given element.

  \#\#\# Example

  ```js
  up.animate('.warning', 'fade-in')
  ```

  You can pass additional options:

  ```
  up.animate('.warning', 'fade-in', {
    delay: 1000,
    duration: 250,
    easing: 'linear'
  })
  ```

  \#\#\# Named animations

  The following animations are pre-defined:

  | `fade-in`          | Changes the element's opacity from 0% to 100% |
  | `fade-out`         | Changes the element's opacity from 100% to 0% |
  | `move-to-top`      | Moves the element upwards until it exits the screen at the top edge |
  | `move-from-top`    | Moves the element downwards from beyond the top edge of the screen until it reaches its current position |
  | `move-to-bottom`   | Moves the element downwards until it exits the screen at the bottom edge |
  | `move-from-bottom` | Moves the element upwards from beyond the bottom edge of the screen until it reaches its current position |
  | `move-to-left`     | Moves the element leftwards until it exists the screen at the left edge  |
  | `move-from-left`   | Moves the element rightwards from beyond the left edge of the screen until it reaches its current position |
  | `move-to-right`    | Moves the element rightwards until it exists the screen at the right edge  |
  | `move-from-right`  | Moves the element leftwards from beyond the right  edge of the screen until it reaches its current position |
  | `none`             | An animation that has no visible effect. Sounds useless at first, but can save you a lot of `if` statements. |

  You can define additional named animations using [`up.animation()`](/up.animation).

  \#\#\# Animating CSS properties directly

  By passing an object instead of an animation name, you can animate
  the CSS properties of the given element:

  ```
  var warning = document.querySelector('.warning')
  warning.style.opacity = 0
  up.animate(warning, { opacity: 1 })
  ```

  CSS properties must be given in `kebab-case`, not `camelCase`.

  \#\#\# Multiple animations on the same element

  Unpoly doesn't allow more than one concurrent animation on the same element.

  If you attempt to animate an element that is already being animated,
  the previous animation will instantly jump to its last frame before
  the new animation begins.

  @function up.animate
  @param {Element|jQuery|string} element
    The element to animate.
  @param {string|Function(element, options): Promise|Object} animation
    Can either be:

    - The animation's name
    - A function performing the animation
    - An object of CSS attributes describing the last frame of the animation (using kebeb-case property names)
  @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {string} [options.easing='ease']
    The timing function that controls the animation's acceleration.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @return {Promise}
    A promise for the animation's end.
  @stable
  ###
  animate = (element, animation, options) ->
    # If passed a selector, up.fragment.get() will prefer a match on the current layer.
    element = up.fragment.get(element)
    options = u.options(options)

    animationFn = findAnimationFn(animation)

    # willAnimate() also sets a default { duration } and { easing }.
    willRun = willAnimate(element, animation, options)

    if willRun
      # up.puts 'up.animate()', Animating %o with animation %o', element, animation
      runNow = -> animationFn(element, options)
      motionController.startFunction(element, runNow, options)
    else
      skipAnimate(element, animation)

  willAnimate = (element, animationOrTransition, options) ->
    applyConfig(options)
    isEnabled() && !isNone(animationOrTransition) && options.duration > 0 && !e.isSingleton(element)

  skipAnimate = (element, animation) ->
    if u.isOptions(animation)
      # If we are given the final animation frame as an object of CSS properties,
      # the best we can do is to set the final frame without animation.
      e.setStyle(element, animation)
    # Signal that the animation is already done.
    Promise.resolve()

  ###**
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
    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @return {Promise}
    A promise that fulfills when the animation ends.
  @internal
  ###
  animateNow = (element, lastFrame, options) ->
    options = u.merge(options, finishEvent: motionController.finishEvent)
    cssTransition = new up.CSSTransition(element, lastFrame, options)
    return cssTransition.start()

  applyConfig = (options) ->
    options.easing ||= config.easing
    options.duration ||= config.duration

  findNamedAnimation = (name) ->
    namedAnimations[name] or up.fail("Unknown animation %o", name)

  ###**
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
  ###
  finish = (element) ->
    motionController.finish(element)

  ###**
  This event is emitted on an [animating](/up.animating) element by `up.motion.finish()` to
  request the animation to instantly finish and skip to the last frame.

  Promises returned by now-finished animation functions are expected to settle.

  Animations started by `up.animate()` already handle this event.

  @event up:motion:finish
  @param {Element} event.target
    The animating element.
  @stable
  ###

  ###**
  Performs an animated transition between the `source` and `target` elements.

  Transitions are implement by performing two animations in parallel,
  causing `source` to disappear and the `target` to appear.

  - `target` is [inserted before](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore) `source`
  - `source` is removed from the [document flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Positioning) with `position: absolute`.
     It will be positioned over its original place in the flow that is now occupied by `target`.
  - Both `source` and `target` are animated in parallel
  - `source` is removed from the DOM

  \#\#\# Named transitions

  The following transitions are pre-defined:

  | `cross-fade` | Fades out the first element. Simultaneously fades in the second element. |
  | `move-up`    | Moves the first element upwards until it exits the screen at the top edge. Simultaneously moves the second element upwards from beyond the bottom edge of the screen until it reaches its current position. |
  | `move-down`  | Moves the first element downwards until it exits the screen at the bottom edge. Simultaneously moves the second element downwards from beyond the top edge of the screen until it reaches its current position. |
  | `move-left`  | Moves the first element leftwards until it exists the screen at the left edge. Simultaneously moves the second element leftwards from beyond the right  edge of the screen until it reaches its current position. |
  | `move-right` | Moves the first element rightwards until it exists the screen at the right edge. Simultaneously moves the second element rightwards from beyond the left edge of the screen until it reaches its current position. |
  | `none`       | A transition that has no visible effect. Sounds useless at first, but can save you a lot of `if` statements. |

  You can define additional named transitions using [`up.transition()`](/up.transition).
  
  You can also compose a transition from two [named animations](/named-animations).
  separated by a slash character (`/`):
  
  - `move-to-bottom/fade-in`
  - `move-to-left/move-from-top`

  \#\#\# Implementation details

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
  @param {Function(oldElement, newElement)|string} transition
  @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {string} [options.easing='ease']
    The timing function that controls the transition's acceleration.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {boolean} [options.reveal=false]
    Whether to reveal the new element by scrolling its parent viewport.
  @return {Promise}
    A promise that fulfills when the transition ends.
  @stable
  ###  
  morph = (oldElement, newElement, transitionObject, options) ->
    options = u.options(options)
    applyConfig(options)

    # If passed a selector, up.fragment.get() will prefer a match on the current layer.
    oldElement = up.fragment.get(oldElement)
    newElement = up.fragment.get(newElement)

    transitionFn = findTransitionFn(transitionObject)
    willMorph = willAnimate(oldElement, transitionFn, options)

    # Remove callbacks from our options hash in case transitionFn calls morph() recursively.
    # If we passed on these callbacks, we might call destructors, events, etc. multiple times.
    beforeStart = u.pluckKey(options, 'beforeStart') || u.noop
    afterInsert = u.pluckKey(options, 'afterInsert') || u.noop
    beforeDetach = u.pluckKey(options, 'beforeDetach') || u.noop
    afterDetach = u.pluckKey(options, 'afterDetach') || u.noop
    # Callback to scroll newElement into position before we start the enter animation.
    scrollNew = u.pluckKey(options, 'scrollNew') || u.asyncNoop

    beforeStart()

    if willMorph
      if motionController.isActive(oldElement) && options.trackMotion is false
        return transitionFn(oldElement, newElement, options)

      up.puts('up.morph()', 'Morphing %o to %o with transition %O', oldElement, newElement, transitionObject)

      viewport = up.viewport.get(oldElement)
      scrollTopBeforeReveal = viewport.scrollTop

      oldRemote = up.viewport.absolutize oldElement,
        # Because the insertion will shift elements visually, we must delay insertion
        # until absolutize() has measured the bounding box of the old element.
        afterMeasure: ->
          e.insertBefore(oldElement, newElement)
          afterInsert()

      trackable = ->
        # Scroll newElement into position before we start the enter animation.
        promise = scrollNew()

        promise = promise.then ->
          # Since we have scrolled the viewport (containing both oldElement and newElement),
          # we must shift the old copy so it looks like it it is still sitting
          # in the same position.
          scrollTopAfterReveal = viewport.scrollTop
          oldRemote.moveBounds(0, scrollTopAfterReveal - scrollTopBeforeReveal)

          transitionFn(oldElement, newElement, options)

        promise = promise.then ->
          beforeDetach()
          e.remove(oldRemote.bounds)
          afterDetach()

        return promise

      motionController.startFunction([oldElement, newElement], trackable, options)

    else
      beforeDetach()
      # Swapping the elements directly with replaceWith() will cause
      # jQuery to remove all data attributes, which we use to store destructors
      swapElementsDirectly(oldElement, newElement)
      afterInsert()
      afterDetach()
      promise = scrollNew()
      return promise

  findTransitionFn = (object) ->
    if isNone(object)
      undefined
    else if u.isFunction(object)
      object
    else if u.isArray(object)
      composeTransitionFn(object...)
    else if u.isString(object)
      if object.indexOf('/') >= 0 # Compose a transition from two animation names
        composeTransitionFn(object.split('/')...)
      else if namedTransition = namedTransitions[object]
        findTransitionFn(namedTransition)
    else
      up.fail("Unknown transition %o", object)

  composeTransitionFn = (oldAnimation, newAnimation) ->
    if isNone(oldAnimation) && isNone(oldAnimation)
      # A composition of two null-animations is a null-transform
      # and should be skipped.
      undefined
    else
      oldAnimationFn = findAnimationFn(oldAnimation) || u.asyncNoop
      newAnimationFn = findAnimationFn(newAnimation) || u.asyncNoop
      (oldElement, newElement, options) ->
        Promise.all([
          oldAnimationFn(oldElement, options),
          newAnimationFn(newElement, options)
        ])

  findAnimationFn = (object) ->
    if isNone(object)
      undefined
    else if u.isFunction(object)
      object
    else if u.isString(object)
      findNamedAnimation(object)
    else if u.isOptions(object)
      (element, options) -> animateNow(element, object, options)
    else
      up.fail('Unknown animation %o', object)

  # Have a separate function so we can mock it in specs.
  swapElementsDirectly = up.mockable (oldElement, newElement) ->
     e.replace(oldElement, newElement)

  ###**
  Defines a named transition that [morphs](/up.morph) from one element to another.

  \#\#\# Example

  Here is the definition of the pre-defined `cross-fade` animation:

  ```js
  up.transition('cross-fade', (oldElement, newElement, options) ->
    Promise.all([
      up.animate(oldElement, 'fade-out', options),
      up.animate(newElement, 'fade-in', options)
    ])
  )
  ```

  It is recommended that your transitions use [`up.animate()`](/up.animate),
  passing along the `options` that were passed to you.

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
  @param {Function(oldElement, newElement, options): Promise|Array} transition
  @stable
  ###
  registerTransition = (name, transition) ->
    fn = findTransitionFn(transition)
    fn.isDefault = up.framework.booting
    namedTransitions[name] = fn

  ###**
  Defines a named animation.

  Here is the definition of the pre-defined `fade-in` animation:

  ```js
  up.animation('fade-in', function(element, options) {
    element.style.opacity = 0
    up.animate(element, { opacity: 1 }, options)
  })
  ```

  It is recommended that your definitions always end by calling
  calling [`up.animate()`](/up.animate) with an object argument, passing along
  the `options` that were passed to you.

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
  ###
  registerAnimation = (name, animation) ->
    fn = findAnimationFn(animation)
    fn.isDefault = up.framework.booting
    namedAnimations[name] = fn

  warnIfDisabled = ->
    # Explain to the user why animations aren't working.
    # E.g. the user might have disabled animations in her OS.
    unless isEnabled()
      up.puts 'up.motion', 'Animations are disabled'

  ###**
  Returns whether the given animation option will cause the animation
  to be skipped.

  @function up.motion.isNone
  @internal
  ###
  isNone = (animationOrTransition) ->
    # false, undefined, '', null and the string "none" are all ways to skip animations
    !animationOrTransition || animationOrTransition == 'none'

  registerOpacityAnimation = (name, from, to) ->
    registerAnimation(name, (element, options) ->
      element.style.opacity = 0
      e.setStyle(element, { opacity: from })
      animateNow(element, { opacity: to }, options)
    )

  registerOpacityAnimation('fade-in', 0, 1)
  registerOpacityAnimation('fade-out', 1, 0)

  translateCSS = (dx, dy) ->
    return { transform: "translate(#{dx}px, #{dy}px)" }

  untranslatedBox = (element) ->
    e.setStyle(element, translateCSS(0, 0))
    return element.getBoundingClientRect()

  registerMoveAnimations = (direction, boxToTransform) ->
    animationToName = "move-to-#{direction}"
    animationFromName = "move-from-#{direction}"

    registerAnimation animationToName, (element, options) ->
      box = untranslatedBox(element)
      transform = boxToTransform(box)
      return animateNow(element, transform, options)

    registerAnimation animationFromName, (element, options) ->
      box = untranslatedBox(element)
      transform = boxToTransform(box)
      e.setStyle(element, transform)
      return animateNow(element, translateCSS(0, 0), options)

  registerMoveAnimations 'top', (box) ->
    travelDistance = box.top + box.height
    return translateCSS(0, -travelDistance)

  registerMoveAnimations 'bottom', (box) ->
    travelDistance = up.viewport.rootHeight() - box.top
    return translateCSS(0, travelDistance)

  registerMoveAnimations 'left', (box) ->
    travelDistance = box.left + box.width
    return translateCSS(-travelDistance, 0)

  registerMoveAnimations 'right', (box) ->
    travelDistance = up.viewport.rootWidth() - box.left
    return translateCSS(travelDistance, 0)

  registerTransition('cross-fade', ['fade-out', 'fade-in'])
  registerTransition('move-left', ['move-to-left', 'move-from-right'])
  registerTransition('move-right', ['move-to-right', 'move-from-left'])
  registerTransition('move-up', ['move-to-top', 'move-from-bottom'])
  registerTransition('move-down', ['move-to-bottom', 'move-from-top'])

  ###**
  [Follows](/a-up-follow) this link and swaps in the new fragment
  with an animated transition.

  Note that transitions are not possible when replacing the `body`
  element.

  \#\#\# Example

  ```html
  <a href="/page2"
    up-target=".story"
    up-transition="move-left">
    Next page
  </a>
  ```

  @selector a[up-transition]
  @params-note
    All attributes for `a[up-follow]` may also be used.
  @param [up-transition]
    The name of a [predefined transition](/up.morph#named-transitions).
  @param [up-fail-transition]
    The transition to use when the server responds with an error code.

    @see server-errors
  @stable
  ###

  ###**
  [Submits](/form-up-submit) this form and swaps in the new fragment
  with an animated transition.

  \#\#\# Example

  ```html
  <form action="/tasks"
    up-target=".content"
    up-transition="cross-fade">
    ...
  </form>
  ```

  @selector form[up-transition]
  @params-note
    All attributes for `form[up-submit]` may also be used.
  @param [up-transition]
    The name of a [predefined transition](/up.morph#named-transitions).
  @param [up-fail-transition]
    The transition to use when the server responds with an error code.

    @see server-errors
  @stable
  ###

  up.on 'up:framework:boot', warnIfDisabled
  up.on 'up:framework:reset', reset

  morph: morph
  animate: animate
  finish: finish
  finishCount: -> motionController.finishCount
  transition: registerTransition
  animation: registerAnimation
  config: config
  isEnabled: isEnabled
  isNone: isNone
  willAnimate: willAnimate
  swapElementsDirectly: swapElementsDirectly

up.transition = up.motion.transition
up.animation = up.motion.animation
up.morph = up.motion.morph
up.animate = up.motion.animate
