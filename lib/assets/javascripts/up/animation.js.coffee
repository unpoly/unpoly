up.animation = (->

  animations = {}
  transitions = {}

  animate = ($element, animationName, options) ->
    console.log("animate", animationName)
    options = up.util.options(options, easing: 'swing', duration: 300)
    animation = animations[animationName] or up.util.error("Unknown animation", animationName)
    promise = animation($element, options)
    up.util.isPromise(promise) or up.util.error("Animation did not return a Promise: #{animationName}")
    promise

  morph = ($old, $new, transitionName, options) ->
    parts = transitionName.split('/')
    if parts.length == 2
      transition = ($old, $new, options) ->
        $.when(
          animate($old, parts[0], options),
          animate($new, parts[1], options)
        )
    else
      transition = transitions[transitionName] or up.util.error("Unknown transition: #{transitionName}")
    promise = transition($old, $new, options)
    up.util.isPromise(promise) or up.util.error("Transition did not return a Promise: #{transitionName}")
    promise

  transition = (name, transition) ->
    transitions[name] = transition

  animation = (name, animation) ->
    animations[name] = animation

  morph: morph
  animate: animate
  transition: transition
  animation: animation

)()

up.transition = up.animation.transition
up.animate = up.animation.animate


up.util.extend(up, up.animation)

up.animation('fade-in', ($element, options) ->
  $element.css(opacity: 0)
  $element.animate({ opacity: 1 }, options)
  $element.promise()
)

up.animation('fade-out', ($element, options) ->
  $element.css(opacity: 1)
  $element.animate({ opacity: 0 }, options)
  $element.promise()
)

up.animation('move-to-bottom', ($element, options) ->
  $element.css(top: '0%')
  $element.animate({ top: '100%' }, options)
  $element.promise()
)

up.animation('move-to-left', ($element, options) ->
  $element.css(left: '0%')
  $element.animate({ left: '-100%' }, options)
  $element.promise()
)

up.animation('move-from-left', ($element, options) ->
#  firstFrame = { left: '-100%' }
#  firstFrame.right = ''
#  lastFrame = { left: '0%' }
  $element.css(left: '-100%')
  $element.animate({ left: '0%' }, options)
  $element.promise()
)

up.animation('move-to-right', ($element, options) ->
  $element.css(left: '0%')
  $element.animate({ left: '100%' }, options)
  $element.promise()
)

up.animation('move-from-right', ($element, options) ->
  $element.css(left: '100%')
  $element.animate({ left: '0%' }, options)
  $element.promise()
)

#up.animation('zoom-in', ($element, options) ->
#  $element.css(scale: '0.5', opacity: 1)
#  $element.animate({ scale: '1', opacity: 1 }, options)
#  $element.promise()
#)

up.transition('move-left', ($old, $new, options) ->
  $.when(
    up.animate($old, 'move-to-left', options),
    up.animate($new, 'move-from-right', options)
  )
)

up.transition('move-right', ($old, $new, options) ->
  $.when(
    up.animate($old, 'move-to-right', options),
    up.animate($new, 'move-from-left', options)
  )
)

up.transition('cross-fade', ($old, $new, options) ->
  $.when(
    up.animate($old, 'fade-out', options),
    up.animate($new, 'fade-in', options)
  )
)
