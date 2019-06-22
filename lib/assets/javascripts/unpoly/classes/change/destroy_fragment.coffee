#= require ./removal

e = up.element

class up.Change.DestroyFragment extends up.Change.Removal

  constructor: (options) ->
    super(options)
    @layer = @options.layer
    @element = @options.element
    @animation = @options.animation
    @log = @options.log

  execute: ->
    @layer.updateHistory(@options)
    up.fragment.markAsDestroying(@element)
    @animate().then(@wipe)

  animate: ->
    animateOptions = up.motion.animateOptions(@options)
    up.motion.animate(@element, @animation, animateOptions)

  wipe: =>
    # Save the parent so we can emit up:fragment:destroyed on it
    # after removing @element.
    parent = @element.parentNode
    up.syntax.clean(@element)
    e.remove(@element)
    up.fragment.emitDestroyed(@element, { parent, @log })
