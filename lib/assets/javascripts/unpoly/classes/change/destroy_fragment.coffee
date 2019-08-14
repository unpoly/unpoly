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
    console.debug("Change.DestroyFragment: updating history()")
    @layer.updateHistory(@options)
    console.debug("Change.DestroyFragment: marking as destroying")
    up.fragment.markAsDestroying(@element)
    console.debug("Change.DestroyFragment: animate then wipe")
    @animate().then(@wipe)

  animate: ->
    animateOptions = up.motion.animateOptions(@options)
    up.motion.animate(@element, @animation, animateOptions)

  wipe: =>
    # Save the parent so we can emit up:fragment:destroyed on it
    # after removing @element.
    parent = @element.parentNode
    console.debug("Change.DestroyFragment: cleaning element")
    up.syntax.clean(@element)
    console.debug("Change.DestroyFragment: removing element")
    e.remove(@element)
    up.fragment.emitDestroyed(@element, { parent, @log })
