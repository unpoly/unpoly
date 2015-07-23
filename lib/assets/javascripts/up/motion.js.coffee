###*
Animation and transitions
=========================
  
Any fragment change in Up.js can be animated.
Up.js ships with a number of predefined animations and transitions,
and you can easily define your own using Javascript or CSS. 
  
  
\#\#\# Incomplete documentation!
  
We need to work on this page:
  
- Explain the difference between transitions and animations
- Demo the built-in animations and transitions
- Examples for defining your own animations and transitions
- Explain ghosting
- Explain how many elements accept arguments for animation.

  
@class up.motion
###
up.motion = (->
  
  u = up.util

  animations = {}
  defaultAnimations = {}
  transitions = {}
  defaultTransitions = {}

  config =
    duration: 300
    delay: 0
    easing: 'ease'

  ###*
  @method up.modal.defaults
  @param {Number} [options.duration]
  @param {Number} [options.delay]
  @param {String} [options.easing]
  ###
  defaults = (options) ->
    u.extend(config, options)
  
  ###*
  Applies the given animation to the given element:

      up.animate('.warning', 'fade-in');

  You can pass additional options:

      up.animate('warning', '.fade-in', {
        delay: 1000,
        duration: 250,
        easing: 'linear'
      });

  \#\#\#\# Named animations

  The following animations come pre-defined:

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

  You can define additional named animations using [`up.animation`](#up.animation).

  \#\#\#\# Animating CSS properties directly

  By passing an object instead of an animation name, you can animate
  the CSS properties of the given element:

      var $warning = $('.warning');
      $warning.css({ opacity: 0 });
      up.animate($warning, { opacity: 1 });

  \#\#\#\# Multiple animations on the same element

  Up.js doesn't allow more than one concurrent animation on the same element.

  If you attempt to animate an element that is already being animated,
  the previous animation will instantly jump to its last frame before
  the new animation begins.

  @method up.animate
  @param {Element|jQuery|String} elementOrSelector
  @param {String|Function|Object} animation
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {Number} [options.delay]
  @return {Promise}
    A promise for the animation's end.
  ###
  animate = (elementOrSelector, animation, options) ->
    $element = $(elementOrSelector)
    finish($element)
    options = u.options(options, config)
    if u.isFunction(animation)
      assertIsDeferred(animation($element, options), animation)
    else if u.isString(animation)
      animate($element, findAnimation(animation), options)
    else if u.isHash(animation)
      u.cssAnimate($element, animation, options)
    else
      u.error("Unknown animation type %o", animation)
      
  findAnimation = (name) ->
    animations[name] or u.error("Unknown animation %o", animation)
    
  GHOSTING_PROMISE_KEY = 'up-ghosting-promise'

  withGhosts = ($old, $new, block) ->
    $oldGhost = null
    $newGhost = null
    u.temporaryCss $new, display: 'none', ->
      $oldGhost = u.prependGhost($old).addClass('up-destroying')
    u.temporaryCss $old, display: 'none', ->
      $newGhost = u.prependGhost($new)
    # $old should take up space in the page flow until the transition ends
    $old.css(visibility: 'hidden')
    
    newCssMemo = u.temporaryCss($new, display: 'none')
    promise = block($oldGhost, $newGhost)
    $old.data(GHOSTING_PROMISE_KEY, promise)
    $new.data(GHOSTING_PROMISE_KEY, promise)
    
    promise.then ->
      $old.removeData(GHOSTING_PROMISE_KEY)
      $new.removeData(GHOSTING_PROMISE_KEY)
      $oldGhost.remove()
      $newGhost.remove()
      # Now that the transition is over we show $new again.
      # Since we expect $old to be removed in a heartbeat,
      # $new should take up space
      $old.css(display: 'none')
      newCssMemo()

    promise
      
  ###*
  Completes all animations and transitions for the given element
  by jumping to the last animation frame instantly. All callbacks chained to
  the original animation's promise will be called.
  
  Does nothing if the given element is not currently animating.
  
  @method up.motion.finish
  @param {Element|jQuery|String} elementOrSelector
  ###
  finish = (elementOrSelector) ->
    $(elementOrSelector).each ->
      $element = $(this)
      u.finishCssAnimate($element)
      finishGhosting($element)
  
  finishGhosting = ($element) ->
    if existingGhosting = $element.data(GHOSTING_PROMISE_KEY)
      u.debug('Canceling existing ghosting on %o', $element)
      existingGhosting.resolve?()
      
  assertIsDeferred = (object, origin) ->
    if u.isDeferred(object)
      object
    else
      u.error("Did not return a promise with .then and .resolve methods: %o", origin)

  ###*
  Performs a transition between two elements.
  
  The following transitions  are pre-registered:
  
  - `cross-fade`
  - `move-up`
  - `move-down`
  - `move-left`
  - `move-right`
  - `none`
  
  You can also compose a transition from two animation names
  separated by a slash character (`/`):
  
  - `move-to-bottom/fade-in`
  - `move-to-left/move-from-top`
  
  @method up.morph
  @param {Element|jQuery|String} source
  @param {Element|jQuery|String} target
  @param {Function|String} transitionOrName
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {Number} [options.delay]
  @return {Promise}
    A promise for the transition's end.
  ###  
  morph = (source, target, transitionOrName, options) ->
    if up.browser.canCssAnimation()
      options = u.options(config)
      $old = $(source)
      $new = $(target)
      finish($old)
      finish($new)
      if transitionOrName == 'none'
        # don't create ghosts if we aren't really transitioning
        none()
      else if transition = u.presence(transitionOrName, u.isFunction) || transitions[transitionOrName]
        withGhosts $old, $new, ($oldGhost, $newGhost) ->
          assertIsDeferred(transition($oldGhost, $newGhost, options), transitionOrName)
      else if animation = animations[transitionOrName]
        $old.hide()
        animate($new, animation, options)
      else if u.isString(transitionOrName) && transitionOrName.indexOf('/') >= 0
        parts = transitionOrName.split('/')
        transition = ($old, $new, options) ->
          resolvableWhen(
            animate($old, parts[0], options),
            animate($new, parts[1], options)
          )
        morph($old, $new, transition, options)
      else
        u.error("Unknown transition %o", transitionOrName)
    else
      # Skip ghosting and all the other stuff that can go wrong
      # in ancient browsers
      u.resolvedDeferred()

  ###*
  Defines a named transition.

  @method up.transition
  @param {String} name
  @param {Function} transition
  ###
  transition = (name, transition) ->
    transitions[name] = transition

  ###*
  Defines a named animation.

  Here is the definition of the pre-defined `fade-in` animation:

      animation('fade-in', ($ghost, options) ->
        $ghost.css(opacity: 0)
        animate($ghost, { opacity: 1 }, options)
      )

  It is recommended that your definitions always end by calling
  calling [`up.animate`](#up.animate) with an object argument, passing along
  the `options` that were passed to you.

  If you choose to *not* use `up.animate` and roll your own
  animation code instead, your code must honor the following contract:

  1. It must honor the passed options.
  2. It must not remove the passed element from the DOM.
  3. It returns a promise that is resolved when the animation ends
  4. The returned promise responds to a `resolve()` function that
     instantly jumps to the last animation frame and resolves the promise.

  Calling [`up.animate`](#up.animate) with an object argument
  will take care of all these points.

  @method up.animation
  @param {String} name
  @param {Function} animation
  ###
  animation = (name, animation) ->
    animations[name] = animation

  snapshot = ->
    defaultAnimations = u.copy(animations)
    defaultTransitions = u.copy(transitions)

  reset = ->
    animations = u.copy(defaultAnimations)
    transitions = u.copy(defaultTransitions)

  ###*
  Returns a new promise that resolves once all promises in the given array resolve.
  Other then e.g. `$.then`, the combined promise will have a `resolve` method.

  @method up.motion.when
  @param promises...
  ###
  resolvableWhen = u.resolvableWhen

  ###*
  Returns a no-op animation or transition which has no visual effects
  and completes instantly.

  @method up.motion.none
  @return {Promise}
    A resolved promise
  ###
  none = u.resolvedDeferred

  animation('none', none)

  animation('fade-in', ($ghost, options) ->
    $ghost.css(opacity: 0)
    animate($ghost, { opacity: 1 }, options)
  )

  animation('fade-out', ($ghost, options) ->
    $ghost.css(opacity: 1)
    animate($ghost, { opacity: 0 }, options)
  )

  animation('move-to-top', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.top + box.height
    $ghost.css('margin-top': '0px')
    animate($ghost, { 'margin-top': "-#{travelDistance}px" }, options)
  )

  animation('move-from-top', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.top + box.height
    $ghost.css('margin-top': "-#{travelDistance}px")
    animate($ghost, { 'margin-top': '0px' }, options)
  )

  animation('move-to-bottom', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().height - box.top
    $ghost.css('margin-top': '0px')
    animate($ghost, { 'margin-top': "#{travelDistance}px" }, options)
  )

  animation('move-from-bottom', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().height - box.top
    $ghost.css('margin-top': "#{travelDistance}px")
    animate($ghost, { 'margin-top': '0px' }, options)
  )

  animation('move-to-left', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.left + box.width
    $ghost.css('margin-left': '0px')
    animate($ghost, { 'margin-left': "-#{travelDistance}px" }, options)
  )

  animation('move-from-left', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = box.left + box.width
    $ghost.css('margin-left': "-#{travelDistance}px")
    animate($ghost, { 'margin-left': '0px' }, options)
  )

  animation('move-to-right', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().width - box.left
    $ghost.css('margin-left': '0px')
    animate($ghost, { 'margin-left': "#{travelDistance}px" }, options)
  )

  animation('move-from-right', ($ghost, options) ->
    box = u.measure($ghost)
    travelDistance = u.clientSize().width - box.left
    $ghost.css('margin-left': "#{travelDistance}px")
    animate($ghost, { 'margin-left': '0px' }, options)
  )

  animation('roll-down', ($ghost, options) ->
    fullHeight = $ghost.height()
    styleMemo = u.temporaryCss($ghost,
      height: '0px'
      overflow: 'hidden'
    )
    animate($ghost, { height: "#{fullHeight}px" }, options).then(styleMemo)
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
  
  up.bus.on 'framework:ready', snapshot
  up.bus.on 'framework:reset', reset
    
  morph: morph
  animate: animate
  finish: finish
  transition: transition
  animation: animation
  defaults: defaults
  none: none
  when: resolvableWhen

)()

up.transition = up.motion.transition
up.animation = up.motion.animation
up.morph = up.motion.morph
up.animate = up.motion.animate
