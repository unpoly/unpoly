###*
Animation and transition effects.
  
@class up.motion
###
up.motion = (->

  animations = {}
  transitions = {}
  
  ###*
  Animates an element.
  
  The following animations are pre-registered:
  
  - `fade-in`
  - `fade-out`
  - `move-to-top`
  - `move-from-top`
  - `move-to-bottom`
  - `move-from-bottom`
  - `move-to-left`
  - `move-from-left`
  - `move-to-right`
  - `move-from-right`
  - `none`
  
  @method up.animate
  @param {Element|jQuery|String} elementOrSelector
  @param {String|Function} animationOrName
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @return {Promise}
    A promise for the animation's end.
  ###
  animate = (elementOrSelector, animationOrName, options) ->
    $element = $(elementOrSelector)
    console.log("animate", animationOrName)
    options = up.util.options(options, easing: 'swing', duration: 300)
    anim = if up.util.isFunction(animationOrName)
      animationOrName
    else
      animations[animationOrName] or up.util.error("Unknown animation", animationName)
    assertIsPromise(
      anim($element, options),
      ["Animation did not return a Promise", animationOrName]
    )
    
  withGhosts = ($old, $new, block) ->
    $oldGhost = null
    $newGhost = null
    up.util.temporaryCss $new, display: 'none', ->
      $oldGhost = up.util.prependGhost($old)
    up.util.temporaryCss $old, display: 'none', ->
      $newGhost = up.util.prependGhost($new)
    # $old should take up space in the page flow until the transition ends
    $old.css(visibility: 'hidden')
    newCssMemo = up.util.temporaryCss($new, display: 'none')
    promise = block($oldGhost, $newGhost)
    promise.then ->
      $oldGhost.remove()
      $newGhost.remove()
      # Now that the transition is over we show $new again.
      # Since we expect $old to be removed in a heartblink,
      # $new should take up space
      $old.css(display: 'none')
      newCssMemo()
      
  assertIsPromise = (object, messageParts) ->
    up.util.isPromise(object) or up.util.error(messageParts...)
    object
  
  ###*
  Performs a transition between two elements.
  
  The following transitions  are pre-registered:
  
  - `cross-fade`
  - `move-top`
  - `move-bottom`
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
  @return {Promise}
    A promise for the transition's end.
  ###  
  morph = (source, target, transitionOrName, options) ->
    $old = $(source)
    $new = $(target)
    transition = up.util.presence(transitionOrName, up.util.isFunction) || transitions[transitionOrName]
    if transition
      withGhosts $old, $new, ($oldGhost, $newGhost) ->
        assertIsPromise(
          transition($oldGhost, $newGhost, options),
          ["Transition did not return a promise", transitionOrName]
        )
    else if animation = animations[transitionOrName]
      $old.hide()
      animate($new, animation, options)
    else if up.util.isString(transitionOrName) && transitionOrName.indexOf('/') >= 0
      parts = transitionOrName.split('/')
      transition = ($old, $new, options) ->
        $.when(
          animate($old, parts[0], options),
          animate($new, parts[1], options)
        )
      morph($old, $new, transition, options)
    else
      up.util.error("Unknown transition: #{transitionOrName}")

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
  
  @method up.animation
  @param {String} name
  @param {Function} animation
  ###
  animation = (name, animation) ->
    animations[name] = animation
  
  ###*
  Returns a no-op animation or transition which has no visual effects
  and completes instantly.
  
  @method up.motion.none
  @return {Promise}
    A resolved promise  
  ###
  none = ->
    deferred = $.Deferred()
    deferred.resolve()
    deferred.promise()
    
  animation('none', none)

  animation('fade-in', ($ghost, options) ->
    $ghost.css(opacity: 0)
    $ghost.animate({ opacity: 1 }, options)
    $ghost.promise()
  )
  
  animation('fade-out', ($ghost, options) ->
    $ghost.css(opacity: 1)
    $ghost.animate({ opacity: 0 }, options)
    $ghost.promise()
  )
  
  animation('move-to-top', ($ghost, options) ->
    $ghost.css('margin-top': '0%')
    $ghost.animate({ 'margin-top': '-100%' }, options)
    $ghost.promise()
  )
  
  animation('move-from-top', ($ghost, options) ->
    $ghost.css('margin-top': '-100%')
    $ghost.animate({ 'margin-top': '0%' }, options)
    $ghost.promise()
  )
    
  animation('move-to-bottom', ($ghost, options) ->
    $ghost.css('margin-top': '0%')
    $ghost.animate({ 'margin-top': '100%' }, options)
    $ghost.promise()
  )
  
  animation('move-from-bottom', ($ghost, options) ->
    $ghost.css('margin-top': '100%')
    $ghost.animate({ 'margin-top': '0%' }, options)
    $ghost.promise()
  )
  
  animation('move-to-left', ($ghost, options) ->
    $ghost.css('margin-left': '0%')
    $ghost.animate({ 'margin-left': '-100%' }, options)
    $ghost.promise()
  )
  
  animation('move-from-left', ($ghost, options) ->
    $ghost.css('margin-left': '-100%')
    $ghost.animate({ 'margin-left': '0%' }, options)
    $ghost.promise()
  )
  
  animation('move-to-right', ($ghost, options) ->
    $ghost.css('margin-left': '0%')
    $ghost.animate({ 'margin-left': '100%' }, options)
    $ghost.promise()
  )
  
  animation('move-from-right', ($ghost, options) ->
    $ghost.css('margin-left': '100%')
    $ghost.animate({ 'margin-left': '0%' }, options)
    $ghost.promise()
  )
  
  animation('roll-down', ($ghost, options) ->
    fullHeight = $ghost.height()
    oldStyle =
      height: $ghost.css('height')
      overflow: $ghost.css('overflow')
    $ghost.css(
      height: '0px'
      overflow: 'hidden'
    )
    $ghost.animate({ height: "#{fullHeight}px" }, options)
    $ghost.promise().then(-> $ghost.css(oldStyle))
  )
  
  transition('none', none)
  
  transition('move-left', ($old, $new, options) ->
    $.when(
      animate($old, 'move-to-left', options),
      animate($new, 'move-from-right', options)
    )
  )
  
  transition('move-right', ($old, $new, options) ->
    $.when(
      animate($old, 'move-to-right', options),
      animate($new, 'move-from-left', options)
    )
  )
  
  transition('move-top', ($old, $new, options) ->
    $.when(
      animate($old, 'move-to-top', options),
      animate($new, 'move-from-bottom', options)
    )
  )
  
  transition('move-bottom', ($old, $new, options) ->
    $.when(
      animate($old, 'move-to-bottom', options),
      animate($new, 'move-from-top', options)
    )
  )
  
  transition('cross-fade', ($old, $new, options) ->
    $.when(
      animate($old, 'fade-out', options),
      animate($new, 'fade-in', options)
    )
  )
    
  morph: morph
  animate: animate
  transition: transition
  animation: animation
  none: none

)()

up.transition = up.motion.transition
up.animation = up.motion.animation
up.morph = up.motion.morph
up.animate = up.motion.animate
