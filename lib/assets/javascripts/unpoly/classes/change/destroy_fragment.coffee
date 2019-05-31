#= require ./removal

e = up.element

class up.Change.DestroyFragment extends up.Change.Removal

  constructor: (@options) ->
    @layer = @options.layer
    @element = @options.element

  execute: ->
    @layer.updateHistory(@options)
    up.fragment.markAsDestroying(@element)
    @animate().then(@wipe)

  animate: ->
    animateOptions = up.motion.animateOptions(@options)
    up.motion.animate(@element, @options.animation, animateOptions)

  wipe: =>
    parent = @element.parentNode
    up.syntax.clean(@element)
    e.remove(@element)
    up.fragment.emitDestroyed(@element, { parent, log: @options.log })

