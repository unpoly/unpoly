###*
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
of the dialog by adding an [`up-animation`](/up-modal#up-animation) attribute to the opening link:

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

  animations = {}
  defaultAnimations = {}
  transitions = {}
  defaultTransitions = {}

  ###*
  Sets default options for animations and transitions.

  @property up.motion.config
  @param {Number} [config.duration=300]
    The default duration for all animations and transitions (in milliseconds).
  @param {Number} [config.delay=0]
    The default delay for all animations and transitions (in milliseconds).
  @param {String} [config.easing='ease']
    The default timing function that controls the acceleration of animations and transitions.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {Boolean} [config.enabled=true]
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
    animations = u.copy(defaultAnimations)
    transitions = u.copy(defaultTransitions)
    config.reset()

  ###*
  Returns whether Unpoly will perform animations.

  Set [`up.motion.config.enabled`](/up.motion.config) `false` in order to disable animations globally.

  @function up.motion.isEnabled
  @return {Boolean}
  @stable
  ###
  isEnabled = ->
    config.enabled

  ###*
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
  @param {Element|jQuery|String} elementOrSelector
    The element to animate.
  @param {String|Function|Object} animation
    Can either be:

    - The animation's name
    - A function performing the animation
    - An object of CSS attributes describing the last frame of the animation
  @param {Number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {Number} [options.delay=0]
    The delay before the animation starts, in milliseconds.
  @param {String} [options.easing='ease']
    The timing function that controls the animation's acceleration.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @return {Promise}
    A promise for the animation's end.
  @stable
  ###
  animate = (elementOrSelector, animation, options) ->
    $element = $(elementOrSelector)
    finish($element)
    options = animateOptions(options)
    if isNone(animation)
      none()
    else if u.isFunction(animation)
      assertIsDeferred(animation($element, options), animation)
    else if u.isString(animation)
      animate($element, findAnimation(animation), options)
    else if u.isHash(animation)
      if isEnabled()
        u.cssAnimate($element, animation, options)
      else
        # Directly set the last frame
        $element.css(animation)
        u.resolvedDeferred()
    else
      up.fail("Unknown animation type for %o", animation)

  ###*
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
    consolidatedOptions
      
  findAnimation = (name) ->
    animations[name] or up.fail("Unknown animation %o", name)

  GHOSTING_DEFERRED_KEY = 'up-ghosting-deferred'
  GHOSTING_CLASS = 'up-ghosting'

  withGhosts = ($old, $new, options, block) ->

    # Don't create ghosts of ghosts in case a transition function is itself calling `morph`
    if options.copy == false || $old.is('.up-ghost') || $new.is('.up-ghost')
      return block($old, $new)

    oldCopy = undefined
    newCopy = undefined
    oldScrollTop = undefined
    newScrollTop = undefined

    $viewport = up.layout.viewportOf($old)
    $both = $old.add($new)

    u.temporaryCss $new, display: 'none', ->
      # Within this block, $new is hidden but $old is visible
      oldCopy = prependCopy($old, $viewport)
      # Remember the previous scroll position in case we will reveal $new below.
      oldScrollTop = $viewport.scrollTop()
      # $viewport.scrollTop(oldScrollTop + 1)

    u.temporaryCss $old, display: 'none', ->
      # Within this block, $old is hidden but $new is visible
      up.layout.revealOrRestoreScroll($new, options)
      newCopy = prependCopy($new, $viewport)
      newScrollTop = $viewport.scrollTop()

    # Since we have scrolled the viewport (containing both $old and $new),
    # we must shift the old copy so it looks like it it is still sitting
    # in the same position.
    oldCopy.moveTop(newScrollTop - oldScrollTop)

    # Hide $old since we no longer need it.
    $old.hide()

    # We will let $new take up space in the element flow, but hide it.
    # The user will only see the two animated ghosts until the transition
    # is over.
    # Note that we must **not** use `visibility: hidden` to hide the new
    # element. This would delay browser painting until the element is
    # shown again, causing a flicker while the browser is painting.
    showNew = u.temporaryCss($new, opacity: '0')

    deferred = block(oldCopy.$ghost, newCopy.$ghost)

    # Make a way to look at $old and $new and see if an animation is
    # already in progress. If someone attempted a new animation on the
    # same elements, the stored promises would be resolved by the second
    # animation call, making the transition jump to the last frame instantly.
    $both.data(GHOSTING_DEFERRED_KEY, deferred)
    $both.addClass(GHOSTING_CLASS)

    deferred.then ->
      $both.removeData(GHOSTING_DEFERRED_KEY)
      $both.removeClass(GHOSTING_CLASS)
      # Now that the transition is over we show $new again.
      showNew()
      oldCopy.$bounds.remove()
      newCopy.$bounds.remove()

    deferred
      
  ###*
  Completes [animations](/up.animate) and [transitions](/up.morph).

  If called without arguments, all animations on the screen are completed.
  If given an element (or selector), animations on that element and its children
  are completed.

  Animations are completed by jumping to the last animation frame instantly.

  Does nothing if there are no animation to complete.
  
  @function up.motion.finish
  @param {Element|jQuery|String} [elementOrSelector]
  @stable
  ###
  finish = (elementOrSelector = '.up-animating') ->
    # We don't need to crawl through the DOM if we aren't animating anyway
    return unless isEnabled()

    $element = $(elementOrSelector)
    $animatingSubtree = u.findWithSelf($element, '.up-animating')
    u.finishCssAnimate($animatingSubtree)
    $ghostingSubtree = u.findWithSelf($element, ".#{GHOSTING_CLASS}")
    finishGhosting($ghostingSubtree)

  finishGhosting = ($collection) ->
    $collection.each ->
      $element = $(this)
      if existingGhosting = u.pluckData($element, GHOSTING_DEFERRED_KEY)
        existingGhosting.resolve()
      
  assertIsDeferred = (object, source) ->
    if u.isDeferred(object)
      object
    else
      up.fail("Did not return a promise with .then and .resolve methods: %o", source)

  ###*
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
  @param {Element|jQuery|String} source
  @param {Element|jQuery|String} target
  @param {Function|String} transitionOrName
  @param {Number} [options.duration=300]
    The duration of the animation, in milliseconds.
  @param {Number} [options.delay=0]
    The delay before the animation starts, in milliseconds.
  @param {String} [options.easing='ease']
    The timing function that controls the transition's acceleration.

    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {Boolean} [options.reveal=false]
    Whether to reveal the new element by scrolling its parent viewport.
  @return {Promise}
    A promise for the transition's end.
  @stable
  ###  
  morph = (source, target, transitionOrName, options) ->
    options = u.options(options)

    willMorph = isEnabled() && !isNone(transitionOrName)
    $old = $(source)
    $new = $(target)

    up.log.group ('Morphing %o to %o (using %s, %o)' if willMorph), $old.get(0), $new.get(0), transitionOrName, options, ->
      parsedOptions = u.only(options, 'reveal', 'restoreScroll', 'source')
      parsedOptions = u.assign(parsedOptions, animateOptions(options))

      finish($old)
      finish($new)

      if willMorph
        ensureMorphable($old)
        ensureMorphable($new)

        if animation = animations[transitionOrName]
          skipMorph($old, $new, parsedOptions)
          return animate($new, animation, parsedOptions)
        else if transition = (u.presence(transitionOrName, u.isFunction) || transitions[transitionOrName])
          return withGhosts $old, $new, parsedOptions, ($oldGhost, $newGhost) ->
            transitionPromise = transition($oldGhost, $newGhost, parsedOptions)
            assertIsDeferred(transitionPromise, transitionOrName)
        else if u.isString(transitionOrName) && transitionOrName.indexOf('/') >= 0
          parts = transitionOrName.split('/')
          transition = ($old, $new, options) ->
            resolvableWhen(
              animate($old, parts[0], options),
              animate($new, parts[1], options)
            )
          return morph($old, $new, transition, parsedOptions)
        else
          up.fail("Unknown transition %o", transitionOrName)
      else
        return skipMorph($old, $new, parsedOptions)

  ensureMorphable = ($element) ->
    if $element.parents('body').length == 0
      element = $element.get(0)
      up.fail("Can't morph a <%s> element (%o)", element.tagName, element)

  ###*
  This causes the side effects of a successful transition, but instantly.
  We use this to skip morphing for old browsers, or when the developer
  decides to only animate the new element (i.e. no real ghosting or transition)   .

  @internal
  ###
  skipMorph = ($old, $new, options) ->
    # Simply hide the old element, which would be the side effect of withGhosts(...) below.
    $old.hide()
    # Since we cannot rely on withGhosts to control the scroll position
    # in this branch, we need to do it ourselves.
    up.layout.revealOrRestoreScroll($new, options)

  ###*
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

  ###*
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

  1. It must honor the passed options `{ delay, duration, easing }` if present
  2. It must *not* remove any of the given elements from the DOM.
  3. It returns a promise that is resolved when the transition ends
  4. The returned promise responds to a `resolve()` function that
     instantly jumps to the last transition frame and resolves the promise.

  Calling [`up.animate()`](/up.animate) with an object argument
  will take care of all these points.

  @function up.transition
  @param {String} name
  @param {Function} transition
  @stable
  ###
  transition = (name, transition) ->
    transitions[name] = transition

  ###*
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

  1. It must honor the passed options `{ delay, duration, easing }` if present
  2. It must *not* remove the passed element from the DOM.
  3. It returns a promise that is resolved when the animation ends
  4. The returned promise responds to a `resolve()` function that
     instantly jumps to the last animation frame and resolves the promise.

  Calling [`up.animate()`](/up.animate) with an object argument
  will take care of all these points.

  @function up.animation
  @param {String} name
  @param {Function} animation
  @stable
  ###
  animation = (name, animation) ->
    animations[name] = animation

  snapshot = ->
    defaultAnimations = u.copy(animations)
    defaultTransitions = u.copy(transitions)

  ###*
  Returns a new deferred that resolves once all given deferreds have resolved.

  Other then [`$.when` from jQuery](https://api.jquery.com/jquery.when/),
  the combined deferred will have a `resolve` method. This `resolve` method
  will resolve all the wrapped deferreds.

  This is important when composing multiple existing animations into
  a [custom transition](/up.transition), since the transition function
  must return a deferred with a `resolve` function that fast-forwards
  the animation to its last frame.

  @function up.motion.when
  @param {Array<Deferred>} deferreds...
  @return {Deferred} A new deferred
  @experimental
  ###
  resolvableWhen = u.resolvableWhen

  ###*
  Returns a no-op animation or transition which has no visual effects
  and completes instantly.

  @function up.motion.none
  @return {Promise}
    A resolved promise
  @stable
  ###
  none = u.resolvedDeferred

  ###*
  Returns whether the given animation option will cause the animation
  to be skipped.

  @function up.motion.isNone
  @internal
  ###
  isNone = (animation) ->
    animation is false || animation is 'none' || u.isMissing(animation) || u.isResolvedPromise(animation)

  animation('none', none)

  animation('fade-in', ($ghost, options) ->
    $ghost.css(opacity: 0)
    animate($ghost, { opacity: 1 }, options)
  )

  animation('fade-out', ($ghost, options) ->
    $ghost.css(opacity: 1)
    animate($ghost, { opacity: 0 }, options)
  )

  translateCss = (x, y) ->
    { transform: "translate(#{x}px, #{y}px)" }

  animation('move-to-top', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.top + box.height
    $ghost.css(translateCss(0, 0))
    animate($ghost, translateCss(0, -travelDistance), options)
  )

  animation('move-from-top', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.top + box.height
    $ghost.css(translateCss(0, -travelDistance))
    animate($ghost, translateCss(0, 0), options)
  )

  animation('move-to-bottom', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().height - box.top
    $ghost.css(translateCss(0, 0))
    animate($ghost, translateCss(0, travelDistance), options)
  )

  animation('move-from-bottom', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().height - box.top
    $ghost.css(translateCss(0, travelDistance))
    animate($ghost, translateCss(0, 0), options)
  )

  animation('move-to-left', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.left + box.width
    $ghost.css(translateCss(0, 0))
    animate($ghost, translateCss(-travelDistance, 0), options)
  )

  animation('move-from-left', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.left + box.width
    $ghost.css(translateCss(-travelDistance, 0))
    animate($ghost, translateCss(0, 0), options)
  )

  animation('move-to-right', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().width - box.left
    $ghost.css(translateCss(0, 0))
    animate($ghost, translateCss(travelDistance, 0), options)
  )

  animation('move-from-right', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().width - box.left
    $ghost.css(translateCss(travelDistance, 0))
    animate($ghost, translateCss(0, 0), options)
  )

  animation('roll-down', ($ghost, options) ->
    fullHeight = $ghost.height()
    styleMemo = u.temporaryCss($ghost,
      height: '0px'
      overflow: 'hidden'
    )
    deferred = animate($ghost, { height: "#{fullHeight}px" }, options)
    deferred.then(styleMemo)
    deferred
  )

  transition('none', none)

  transition('move-left', ($old, $new, options) ->
    resolvableWhen(
      animate($old, 'move-to-left', options),
      animate($new, 'move-from-right', options)
    )
  )

  transition('move-right', ($old, $new, options) ->
    resolvableWhen(
      animate($old, 'move-to-right', options),
      animate($new, 'move-from-left', options)
    )
  )

  transition('move-up', ($old, $new, options) ->
    resolvableWhen(
      animate($old, 'move-to-top', options),
      animate($new, 'move-from-bottom', options)
    )
  )

  transition('move-down', ($old, $new, options) ->
    resolvableWhen(
      animate($old, 'move-to-bottom', options),
      animate($new, 'move-from-top', options)
    )
  )

  transition('cross-fade', ($old, $new, options) ->
    resolvableWhen(
      animate($old, 'fade-out', options),
      animate($new, 'fade-in', options)
    )
  )

  up.on 'up:framework:booted', snapshot
  up.on 'up:framework:reset', reset
    
  morph: morph
  animate: animate
  animateOptions: animateOptions
  finish: finish
  transition: transition
  animation: animation
  config: config
  isEnabled: isEnabled
  none: none
  when: resolvableWhen
  prependCopy: prependCopy
  isNone: isNone

)(jQuery)

up.transition = up.motion.transition
up.animation = up.motion.animation
up.morph = up.motion.morph
up.animate = up.motion.animate
