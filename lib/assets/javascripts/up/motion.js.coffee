###*
Animation and transition effects.
  
@class up.motion
###
up.motion = (->

  animations = {}
  transitions = {}
  
  ###*
  Animates an element.
  
  @method up.animate
  @param {Element|jQuery|String} elementOrSelector
  @param {String|Function} animationOrName
  @param {Number} [options.duration]
  @param {String} [options.easing]
  ###
  animate = (elementOrSelector, animationOrName, options) ->
    $element = $(elementOrSelector)
    console.log("animate", animationOrName)
    options = up.util.options(options, easing: 'swing', duration: 300)
    anim = if up.util.isFunction(animationOrName)
      animationOrName
    else
      animations[animationOrName] or up.util.error("Unknown animation", animationName)
    promise = anim($element, options)
    up.util.isPromise(promise) or up.util.error("Animation did not return a Promise: #{animationName}")
    promise
  
  ###*
  Performs a transition between two elements.
  
  @method up.morph
  @param {Element|jQuery|String} source
  @param {Element|jQuery|String} target
  @param {String} transitionName
  @param {Number} [options.duration]
  @param {String} [options.easing]
  ###  
  morph = (source, target, transitionName, options) ->
    $old = $(source)
    $new = $(target)
    if transition = transitions[transitionName]
      promise = transition($old, $new, options)
      up.util.isPromise(promise) or up.util.error("Transition did not return a Promise: #{transitionName}")
      promise
    else if animation = animations[transitionName]
      $old.hide()
      animate($new, animation, options)
    else if transitionName.indexOf('/') >= 0
      parts = transitionName.split('/')
      transition = ($old, $new, options) ->
        $.when(
          animate($old, parts[0], options),
          animate($new, parts[1], options)
        )
    else
      up.util.error("Unknown transition: #{transitionName}")

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
  @return {Promise} A resolved promise  
  ###
  none = ->
    deferred = $.Deferred()
    deferred.resolve()
    deferred.promise()
    
  animation('none', none)

  animation('fade-in', ($element, options) ->
    $element.css(opacity: 0)
    $element.animate({ opacity: 1 }, options)
    $element.promise()
  )
  
  animation('fade-out', ($element, options) ->
    $element.css(opacity: 1)
    $element.animate({ opacity: 0 }, options)
    $element.promise()
  )
  
  animation('move-to-bottom', ($element, options) ->
    $element.css(top: '0%')
    $element.animate({ top: '100%' }, options)
    $element.promise()
  )
  
  animation('move-to-left', ($element, options) ->
    $element.css(left: '0%')
    $element.animate({ left: '-100%' }, options)
    $element.promise()
  )
  
  animation('move-from-left', ($element, options) ->
    $element.css(left: '-100%')
    $element.animate({ left: '0%' }, options)
    $element.promise()
  )
  
  animation('move-to-right', ($element, options) ->
    $element.css(left: '0%')
    $element.animate({ left: '100%' }, options)
    $element.promise()
  )
  
  animation('move-from-right', ($element, options) ->
    $element.css(left: '100%')
    $element.animate({ left: '0%' }, options)
    $element.promise()
  )
  
  animation('roll-down', ($element, options) ->
    fullHeight = $element.height()
    oldStyle =
      height: $element.css('height')
      overflow: $element.css('overflow')
    $element.css(
      height: '0px'
      overflow: 'hidden'
    )
    $element.animate({ height: "#{fullHeight}px" }, options)
    $element.promise().then(-> $element.css(oldStyle))
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
