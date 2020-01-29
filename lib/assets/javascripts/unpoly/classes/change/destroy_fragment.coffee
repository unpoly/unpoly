#= require ./removal

e = up.element

class up.Change.DestroyFragment extends up.Change.Removal

  constructor: (options) ->
    super(options)
    @layer = up.layer.get(options)
    @element = @options.element
    @animation = @options.animation
    @log = @options.log

  execute: ->
    @layer.updateHistory(@options)
    up.fragment.markAsDestroying(@element)
    @animate().then(@wipe)

  animate: ->
    up.motion.animate(@element, @animation, @options)

  wipe: =>
    @layer.asCurrent =>
      # Save the parent so we can emit up:fragment:destroyed on it
      # after removing @element.
      parent = @element.parentNode
      up.syntax.clean(@element)
      e.remove(@element)
      up.fragment.emitDestroyed(@element, { parent, @log })
