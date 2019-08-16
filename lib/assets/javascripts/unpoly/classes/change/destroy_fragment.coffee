#= require ./removal

e = up.element

class up.Change.DestroyFragment extends up.Change.Removal

  constructor: (options) ->
    super(options)
    @layer = up.layer.lookup(options)
    @element = @options.element
    @animation = @options.animation
    @log = @options.log

  execute: ->
    @layer.updateHistory(@options)
    up.fragment.markAsDestroying(@element)

    if up.motion.isNone(@animation)
      # If possible we remove the fragment sync.
      @wipe()
    else
      # If there is motion we need to wait for the animation to end
      # before we remove the fragment async.
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
