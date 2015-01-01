up.animation = (->

  animations = {}
  transitions = {}

  animate = ($element, animationName, options) ->
    options = up.util.options(options, easing: 'swing', duration: 250)
    animation = animations[animationName] or up.util.error("Unknown animation: #{animationName}")
    promise = animation($element, options)
    up.util.isPromise(promise) or up.util.error("Animation did not return a Promise: #{animationName}")
    promise

  transition = ($old, $new, transitionName, options) ->
    transition = transitions[transitionName] or up.util.error("Unknown transition: #{transitionName}")
    $.when(
      animate($old, transition.oldAnimationName, options),
      animate($new, transition.newAnimationName, options)
    )

  defineTransition = (name, oldAnimationName, newAnimationName) ->
    transitions[name] = {
      oldAnimationName: oldAnimationName,
      newAnimationName: newAnimationName
    }

  defineAnimation = (name, animation) ->
    animations[name] = animation

  transition: transition
  animate: animate
  defineTransition: defineTransition
  defineAnimation: defineAnimation

)()

up.transition = up.animation.transition
up.animate = up.animation.animate


up.util.extend(up, up.animation)

up.defineAnimation('fade-in', ($element, options) ->
  $element.css(opacity: 0)
  $element.animate({ opacity: 1 }, options)
  $element.promise()
)

up.defineAnimation('fade-out', ($element, options) ->
  $element.css(opacity: 1)
  $element.animate({ opacity: 0 }, options)
  $element.promise()
)

up.defineAnimation('move-to-left', ($element, options) ->
  $element.css(left: '0%')
  $element.animate({ left: '-100%' }, options)
  $element.promise()
)

up.defineAnimation('move-from-left', ($element, options) ->
  $element.css(left: '-100%')
  $element.animate({ left: '0%' }, options)
  $element.promise()
)

up.defineAnimation('move-to-right', ($element, options) ->
  $element.css(left: '0%')
  $element.animate({ left: '100%' }, options)
  $element.promise()
)

up.defineAnimation('move-from-right', ($element, options) ->
  $element.css(left: '100%')
  $element.animate({ left: '0%' }, options)
  $element.promise()
)

up.defineTransition('move-left', 'move-to-left', 'move-from-right')
up.defineTransition('move-right', 'move-to-right', 'move-from-left')
up.defineTransition('cross-fade', 'fade-out', 'fade-in')
