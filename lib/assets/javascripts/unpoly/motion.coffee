###**
Animation
=========
  
Whenever you [update a page fragment](/up.link) you can animate the change.

Let's say you are using an [`up-target`](/a-up-target) link to update an element
with content from the server. You can add an attribute [`up-transition`](/a-up-target#up-transition)
to smoothly fade out the old element while fading in the new element:

    <a href="/users" up-target=".list" up-transition="cross-fade">Show users</a>

\#\#\# Transitions vs. animations

When we morph between an old and a new element, we call it a *transition*.
In contrast, when we animate a new element without simultaneously removing an
old element, we call it an *animation*.

An example for an animation is opening a new dialog. We can animate the appearance
of the dialog by adding an [`[up-animation]`](/a-up-modal#up-animation) attribute to the opening link:

    <a href="/users" up-modal=".list" up-animation="move-from-top">Show users</a>

\#\#\# Which animations are available?

Unpoly ships with a number of [predefined transitions](/up.morph#named-transitions)
and [predefined animations](/up.animate#named-animations).

You can define custom animations using [`up.transition()`](/up.transition) and
[`up.animation()`](/up.animation).

@class up.motion
###
up.motion = (($) ->
  
  u = up.util

  namedAnimations = {}
  defaultNamedAnimations = {}
  namedTransitions = {}
  defaultNamedTransitions = {}

  motionTracker = new up.MotionTracker('motion')

  ###**
  Sets default options for animations and transitions.

  @property up.motion.config
  @param {number} [config.duration=300]
    The default duration for all animations and transitions (in milliseconds).
  @param {number} [config.delay=0]
    The default delay for all animations and transitions (in milliseconds).
  @param {string} [config.easing='ease']
    The default timing function that controls the acceleration of animations and transitions.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {boolean} [config.enabled=true]
    Whether animation is enabled.

    Set this to `false` to disable animation globally.
    This can be useful in full-stack integration tests like a Selenium test suite.

    Regardless of this setting, all animations will be skipped on browsers
    that do not support [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions).
  @stable
  ###
  config = u.config
    duration: 300
    delay: 0
    easing: 'ease'
    enabled: true

  reset = ->
    finish()
    namedAnimations = u.copy(defaultNamedAnimations)
    namedTransitions = u.copy(defaultNamedTransitions)
    config.reset()

  ###**
  Returns whether Unpoly will perform animations.

  Set [`up.motion.config.enabled`](/up.motion.config) `false` in order to disable animations globally.

  @function up.motion.isEnabled
  @return {boolean}
  @stable
  ###
  isEnabled = ->
    config.enabled

  ###**
  Applies the given animation to the given element.

  \#\#\# Example

      up.animate('.warning', 'fade-in');

  You can pass additional options:

      up.animate('warning', '.fade-in', {
        delay: 1000,
        duration: 250,
        easing: 'linear'
      });

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

      var $warning = $('.warning');
      $warning.css({ opacity: 0 });
      up.animate($warning, { opacity: 1 });

  \#\#\# Multiple animations on the same element

  Unpoly doesn't allow more than one concurrent animation on the same element.

  If you attempt to animate an element that is already being animated,
  the previous animation will instantly jump to its last frame before
  the new animation begins.

  @function up.animate
  @param {Element|jQuery|string} elementOrSelector
    The element to animate.
  @param {string|Function|Object} animation
    Can either be:

    - The animation's name
    - A function performing the animation
    - An object of CSS attributes describing the last frame of the animation
  @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {number} [options.delay=0]
    The delay before the animation starts, in milliseconds.
  @param {string} [options.easing='ease']
    The timing function that controls the animation's acceleration.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @return {Promise}
    A promise for the animation's end.
  @stable
  ###
  animate = (elementOrSelector, animation, options) ->
    $element = $(elementOrSelector)
    options = animateOptions(options)

    finishOnce($element, options).then ->
      if !willAnimate($element, animation, options)
        skipAnimate($element, animation)
      else if u.isFunction(animation)
        animation($element, options)
      else if u.isString(animation)
        animate($element, findNamedAnimation(animation), options)
      else if u.isOptions(animation)
        animateWithCss($element, animation, options)
      else
        # Error will be converted to rejected promise in a then() callback
        up.fail('Animation must be a function, animation name or object of CSS properties, but it was %o', animation)

  willAnimate = ($elements, animationOrTransition, options) ->
    options = animateOptions(options)
    isEnabled() && !isNone(animationOrTransition) && options.duration > 0 && u.all($elements, u.isBodyDescendant)

  skipAnimate = ($element, animation) ->
    if u.isOptions(animation)
      # If we are given the final animation frame as an object of CSS properties,
      # the best we can do is to set the final frame without animation.
      $element.css(animation)
    # Signal that the animation is already done.
    Promise.resolve()

  ###**
  Animates the given element's CSS properties using CSS transitions.

  If the element is already being animated, the previous animation
  will instantly jump to its last frame before the new animation begins.

  To improve performance, the element will be forced into compositing for
  the duration of the animation.

  @function up.util.cssAnimate
  @param {Element|jQuery|string} elementOrSelector
    The element to animate.
  @param {Object} lastFrame
    The CSS properties that should be transitioned to.
  @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {number} [options.delay=0]
    The delay before the animation starts, in milliseconds.
  @param {string} [options.easing='ease']
    The timing function that controls the animation's acceleration.
    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @return {Promise}
    A promise that fulfills when the animation ends.
  @internal
  ###
  animateWithCss = ($element, lastFrame, options) ->
    startCssTransition = ->
      transitionProperties = Object.keys(lastFrame)
      transition =
        'transition-property': transitionProperties.join(', ')
        'transition-duration': "#{options.duration}ms"
        'transition-delay': "#{options.delay}ms"
        'transition-timing-function': options.easing
      oldTransition = $element.css(Object.keys(transition))
  
      deferred = u.newDeferred()
      # May not call this finish() since this would override the global finish()
      # function in this scope. We really need `let`, which CoffeeScript will never get.
      fulfill = -> deferred.resolve()
  
      onTransitionEnd = (event) ->
        # Check if the transitionend event was caused by our own transition,
        # and not by some other transition that happens to live on the same element.
        completedProperty = event.originalEvent.propertyName
        fulfill() if u.contains(transitionProperties, completedProperty)
  
      # Animating code is expected to listen to this event to enable external code
      # to fulfil the animation.
      onFinish = fulfill

      $element.on(motionTracker.finishEvent, onFinish)
  
      # Ideally, we want to fulfil when we receive the `transitionend` event
      $element.on('transitionend', onTransitionEnd)
  
      # The `transitionend` event might not fire reliably if other transitions
      # are interfering on the same element. This is why we register a fallback
      # timeout that forces the animation to fulfil a few ms later.
      transitionTimingTolerance = 5
      cancelFallbackTimer = u.setTimer(options.duration + transitionTimingTolerance, fulfill)

      # All clean-up is handled in the following then() handler.
      # This way it will be run both when the animation finishAnimatees naturally and
      # when it is finishAnimateed externally.
      deferred.then ->
        # Disable all three triggers that would fulfil the motion:
        $element.off(motionTracker.finishEvent, onFinish)
        $element.off('transitionend', onTransitionEnd)
        clearTimeout(cancelFallbackTimer)

        # Elements with compositing might look blurry, so undo that.
        undoCompositing()
  
        # To interrupt the running transition we *must* set it to 'none' exactly.
        # We cannot simply restore the old transition properties because browsers
        # would simply keep transitioning.
        $element.css('transition': 'none')
  
        # Restoring a previous transition involves forcing a repaint, so we only do it if
        # we know the element was transitioning before.
        # Note that the default transition for elements is actually "all 0s ease 0s"
        # instead of "none", although that has the same effect as "none".
        hadTransitionBefore = !(oldTransition['transition-property'] == 'none' || (oldTransition['transition-property'] == 'all' && oldTransition['transition-duration'][0] == '0'))
        if hadTransitionBefore
          # If there is no repaint between the "none" transition and restoring the previous
          # transition, the browser will simply keep transitioning. I'm sorry.
          u.forceRepaint($element)
          $element.css(oldTransition)

      # Push the element into its own compositing layer before we are going
      # to massively change the element against background.
      undoCompositing = u.forceCompositing($element)
  
      # CSS will start animating when we set the `transition-*` properties and then change
      # the animating properties to the last frame.
      $element.css(transition)
      $element.css(lastFrame)
  
      # Return a promise that fulfills when either the animation ends
      # or someone finishes the animation.
      deferred.promise()

    motionTracker.start($element, startCssTransition)

  ###**
  Extracts animation-related options from the given options hash.
  If `$element` is given, also inspects the element for animation-related
  attributes like `up-easing` or `up-duration`.

  @function up.motion.animateOptions
  @internal
  ###
  animateOptions = (args...) ->
    userOptions = args.shift() || {}
    $element = if u.isJQuery(args[0]) then args.shift() else u.nullJQuery()
    moduleDefaults = if u.isObject(args[0]) then args.shift() else {}
    consolidatedOptions = {}
    consolidatedOptions.easing = u.option(userOptions.easing, u.presentAttr($element, 'up-easing'), moduleDefaults.easing, config.easing)
    consolidatedOptions.duration = Number(u.option(userOptions.duration, u.presentAttr($element, 'up-duration'), moduleDefaults.duration, config.duration))
    consolidatedOptions.delay = Number(u.option(userOptions.delay, u.presentAttr($element, 'up-delay'), moduleDefaults.delay, config.delay))
    consolidatedOptions.finishedMotion = userOptions.finishedMotion # this is required by animate() and finishOnceBeforeMotion()
    consolidatedOptions
      
  findNamedAnimation = (name) ->
    namedAnimations[name] or up.fail("Unknown animation %o", name)

  ###**
  @function withGhosts
  @return {Promise}
  @internal
  ###
  withGhosts = ($old, $new, options, transitionFn) ->
    # Don't create ghosts of ghosts in case a transition function calling `morph` recursively.
    if options.copy == false || $old.is('.up-ghost') || $new.is('.up-ghost')
      return transitionFn($old, $new, options)

    oldCopy = undefined
    newCopy = undefined
    oldScrollTop = undefined
    newScrollTop = undefined

    $viewport = up.layout.viewportOf($old)

    # Right now $old and $new are visible siblings in the DOM.
    # Temporarily hide $new while we copy $old and take some measurements.
    u.temporaryCss $new, display: 'none', ->
      oldCopy = prependCopy($old, $viewport)
      # Remember the previous scroll position in case we will reveal $new below.
      oldScrollTop = $viewport.scrollTop()

    # Hide $old. We will never re-show it.
    # It's not our job to remove $old from the DOM.
    $old.hide()

    # Don't animate the scrolling.
    # We just want to scroll $new into position before we start the enter animation.
    scrollOptions = u.merge(options, { duration: 0})
    up.layout.revealOrRestoreScroll($new, scrollOptions).then ->
      newCopy = prependCopy($new, $viewport)
      newScrollTop = $viewport.scrollTop()

      # Since we have scrolled the viewport (containing both $old and $new),
      # we must shift the old copy so it looks like it it is still sitting
      # in the same position.
      oldCopy.moveTop(newScrollTop - oldScrollTop)

      # We will let $new take up space in the element flow, but hide it.
      # The user will only see the two animated ghosts until the transition
      # is over.
      # Note that we must **not** use `visibility: hidden` to hide the new
      # element. This would delay browser painting until the element is
      # shown again, causing a flicker while the browser is painting.
      restoreNewOpacity = u.temporaryCss($new, opacity: '0')

      # Perform the transition on the ghosts.
      transitionDone = transitionFn(oldCopy.$ghost, newCopy.$ghost, options)

      # The animations on both ghosts should finish if someone calls finish()
      # on either of the original elements.
      $bothGhosts = oldCopy.$ghost.add(newCopy.$ghost)
      $bothOriginals = $old.add($new)
      motionTracker.forwardFinishEvent($bothOriginals, $bothGhosts, transitionDone)

      transitionDone.then ->
        # This will be called when the transition in the block is either done
        # or when it is finished by triggering up:motion:finish on either element.
        restoreNewOpacity()
        oldCopy.$bounds.remove()
        newCopy.$bounds.remove()

  ###**
  Completes [animations](/up.animate) and [transitions](/up.morph).

  If called without arguments, all animations on the screen are completed.
  If given an element (or selector), animations on that element and its children
  are completed.

  Animations are completed by jumping to the last animation frame instantly.

  Does nothing if there are no animation to complete.
  
  @function up.motion.finish
  @param {Element|jQuery|string} [elementOrSelector]
  @return {Promise}
    A promise that fulfills when animations and transitions have finished.
  @stable
  ###
  finish = (elementOrSelector) ->
    motionTracker.finish(elementOrSelector)

  ###**
  Performs an animated transition between two elements.
  Transitions are implement by performing two animations in parallel,
  causing one element to disappear and the other to appear.

  Note that the transition does not remove any elements from the DOM.
  The first element will remain in the DOM, albeit hidden using `display: none`.

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
  @param {Function|string} transitionOrName
  @param {number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {number} [options.delay=0]
    The delay before the animation starts, in milliseconds.
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
  morph = (source, target, transitionObject, options) ->
    options = u.options(options)
    options = u.assign(options, animateOptions(options))

    $old = $(source)
    $new = $(target)
    $both = $old.add($new)

    transitionFn = findTransitionFn(transitionObject)
    willMorph = willAnimate($both, transitionFn, options)

    up.log.group ('Morphing %o to %o with transition %o' if willMorph), $old.get(0), $new.get(0), transitionObject, ->
      finishOnce($both, options).then ->
        if !willMorph
          skipMorph($old, $new, options)
        else if transitionFn
          withGhosts($old, $new, options, transitionFn)
        else
          # Exception will be converted to rejected Promise inside a then() handler
          up.fail("Unknown transition %o", transitionObject)

  finishOnce = ($elements, options) ->
    # Finish existing transitions, but only once in case morph() or animate() is called recursively.
    if options.finishedMotion
      Promise.resolve()
    else
      # Use options to persist that we have finished motion.
      options.finishedMotion = true
      finish($elements)

  findTransitionFn = (object) ->
    if isNone(object)
      undefined
    else if u.isFunction(object)
      object
    else if u.isArray(object)
      if isNone(object[0]) && isNone(object[1])
        # A composition of two "none" animations is again a "none" animation
        undefined
      else
        ($old, $new, options) -> Promise.all([
          animate($old, object[0], options),
          animate($new, object[1], options)
        ])
    else if u.isString(object)
      if object.indexOf('/') >= 0 # Compose a transition from two animation names
        findTransitionFn(object.split('/'))
      else if namedTransition = namedTransitions[object]
        findTransitionFn(namedTransition)

  ###**
  This instantly causes the side effects of a successful transition.
  We use this to skip morphing for old browsers, or when the developer
  decides to only animate the new element (i.e. no real ghosting or transition).

  @return {Promise}
  @internal
  ###
  skipMorph = ($old, $new, options) ->
    # Simply hide the old element, which would be the side effect of withGhosts(...) below.
    $old.hide()

    # Don't animate the scrolling.
    # We just want to scroll $new into position before we start the enter animation.
    scrollOptions = u.merge(options, { duration: 0})

    # Since we cannot rely on withGhosts to control the scroll position
    # in this branch, we need to do it ourselves.
    up.layout.revealOrRestoreScroll($new, scrollOptions)

  ###**
  @internal
  ###
  prependCopy = ($element, $viewport) ->
    elementDims = u.measure($element, relative: true, inner: true)

    $ghost = $element.clone()
    $ghost.find('script').remove()
    $ghost.css
      # If the element had a layout context before, make sure the
      # ghost will have layout context as well (and vice versa).
      position: if $element.css('position') == 'static' then 'static' else 'relative'
      top:    'auto'
      right:  'auto'
      bottom: 'auto'
      left:   'auto'
      width:  '100%'
      height: '100%'
    $ghost.addClass('up-ghost')

    # Wrap the ghost in another container so its margin can expand
    # freely. If we would position the element directly (old implementation),
    # it would gain a layout context which cannot be crossed by margins.
    $bounds = $('<div class="up-bounds"></div>')
    $bounds.css(position: 'absolute')
    $bounds.css(elementDims)

    top = elementDims.top

    moveTop = (diff) ->
      if diff != 0
        top += diff
        $bounds.css(top: top)

    $ghost.appendTo($bounds)
    $bounds.insertBefore($element)

    # In theory, $ghost should now sit over $element perfectly.
    # However, $element might collapse its margin against a previous sibling
    # element, and $ghost does not have the same sibling.
    # So we manually correct $ghost's top position so it aligns with $element.
    moveTop($element.offset().top - $ghost.offset().top)

    $fixedElements = up.layout.fixedChildren($ghost)
    for fixedElement in $fixedElements
      u.fixedToAbsolute(fixedElement, $viewport)

    $ghost: $ghost
    $bounds: $bounds
    moveTop: moveTop

  ###**
  Defines a named transition.

  Here is the definition of the pre-defined `cross-fade` animation:

      up.transition('cross-fade', ($old, $new, options) ->
        up.motion.when(
          up.animate($old, 'fade-out', options),
          up.animate($new, 'fade-in', options)
        )
      )

  It is recommended that your transitions use [`up.animate()`](/up.animate),
  passing along the `options` that were passed to you.

  If you choose to *not* use `up.animate()` and roll your own
  logic instead, your code must honor the following contract:

  1. It must honor the options `{ delay, duration, easing }` if given
  2. It must *not* remove any of the given elements from the DOM.
  3. It returns a promise that is fulfilled when the transition has ended
  4. If during the animation an event `up:motion:finish` is emitted on
     the given element, the transition instantly jumps to the last frame
     and resolves the returned promise.

  Calling [`up.animate()`](/up.animate) with an object argument
  will take care of all these points.

  @function up.transition
  @param {string} name
  @param {Function} transition
  @stable
  ###
  registerTransition = (name, transition) ->
    namedTransitions[name] = transition

  ###**
  Defines a named animation.

  Here is the definition of the pre-defined `fade-in` animation:

      up.animation('fade-in', function($element, options) {
        $element.css(opacity: 0);
        up.animate($ghost, { opacity: 1 }, options);
      })

  It is recommended that your definitions always end by calling
  calling [`up.animate()`](/up.animate) with an object argument, passing along
  the `options` that were passed to you.

  If you choose to *not* use `up.animate()` and roll your own
  animation code instead, your code must honor the following contract:

  1. It must honor the options `{ delay, duration, easing }` if given
  2. It must *not* remove any of the given elements from the DOM.
  3. It returns a promise that is fulfilled when the transition has ended
  4. If during the animation an event `up:motion:finish` is emitted on
     the given element, the transition instantly jumps to the last frame
     and resolves the returned promise.

  Calling [`up.animate()`](/up.animate) with an object argument
  will take care of all these points.

  @function up.animation
  @param {string} name
  @param {Function} animation
  @stable
  ###
  registerAnimation = (name, animation) ->
    namedAnimations[name] = animation

  snapshot = ->
    defaultNamedAnimations = u.copy(namedAnimations)
    defaultNamedTransitions = u.copy(namedTransitions)

  ###**
  Returns whether the given animation option will cause the animation
  to be skipped.

  @function up.motion.isNone
  @internal
  ###
  isNone = (animationOrTransition) ->
    # false, undefined, null and the string "none" are all ways to skip animations
    !animationOrTransition || animationOrTransition == 'none' || (u.isOptions(animationOrTransition) && u.isBlank(animationOrTransition))

  registerAnimation('fade-in', ($ghost, options) ->
    $ghost.css(opacity: 0)
    animate($ghost, { opacity: 1 }, options)
  )

  registerAnimation('fade-out', ($ghost, options) ->
    $ghost.css(opacity: 1)
    animate($ghost, { opacity: 0 }, options)
  )

  translateCss = (x, y) ->
    { transform: "translate(#{x}px, #{y}px)" }

  registerAnimation('move-to-top', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = box.top + box.height
    animate($ghost, translateCss(0, -travelDistance), options)
  )

  registerAnimation('move-from-top', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = box.top + box.height
    $ghost.css(translateCss(0, -travelDistance))
    animate($ghost, translateCss(0, 0), options)
  )

  registerAnimation('move-to-bottom', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = u.clientSize().height - box.top
    animate($ghost, translateCss(0, travelDistance), options)
  )

  registerAnimation('move-from-bottom', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = u.clientSize().height - box.top
    $ghost.css(translateCss(0, travelDistance))
    animate($ghost, translateCss(0, 0), options)
  )

  registerAnimation('move-to-left', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = box.left + box.width
    animate($ghost, translateCss(-travelDistance, 0), options)
  )

  registerAnimation('move-from-left', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = box.left + box.width
    $ghost.css(translateCss(-travelDistance, 0))
    animate($ghost, translateCss(0, 0), options)
  )

  registerAnimation('move-to-right', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = u.clientSize().width - box.left
    animate($ghost, translateCss(travelDistance, 0), options)
  )

  registerAnimation('move-from-right', ($ghost, options) ->
    $ghost.css(translateCss(0, 0))
    box = u.measure($ghost)
    travelDistance = u.clientSize().width - box.left
    $ghost.css(translateCss(travelDistance, 0))
    animate($ghost, translateCss(0, 0), options)
  )

  registerAnimation('roll-down', ($ghost, options) ->
    fullHeight = $ghost.height()
    styleMemo = u.temporaryCss($ghost,
      height: '0px'
      overflow: 'hidden'
    )
    deferred = animate($ghost, { height: "#{fullHeight}px" }, options)
    deferred.then(styleMemo)
    deferred
  )

  registerTransition('move-left', 'move-to-left/move-from-right')
  registerTransition('move-right', 'move-to-right/move-from-left')
  registerTransition('move-up', 'move-to-top/move-from-bottom')
  registerTransition('move-down', 'move-to-bottom/move-from-top')
  registerTransition('cross-fade', 'fade-out/fade-in')

  up.on 'up:framework:booted', snapshot
  up.on 'up:framework:reset', reset
    
  morph: morph
  animate: animate
  animateOptions: animateOptions
  willAnimate: willAnimate
  finish: finish
  transition: registerTransition
  animation: registerAnimation
  config: config
  isEnabled: isEnabled
  prependCopy: prependCopy
  isNone: isNone

)(jQuery)

up.transition = up.motion.transition
up.animation = up.motion.animation
up.morph = up.motion.morph
up.animate = up.motion.animate
