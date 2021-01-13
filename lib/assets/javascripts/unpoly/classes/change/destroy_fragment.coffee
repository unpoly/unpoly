#= require ./removal

e = up.element

class up.Change.DestroyFragment extends up.Change.Removal

  constructor: (options) ->
    super(options)
    @layer = up.layer.get(options) || up.layer.current
    @element = @options.element
    @animation = @options.animation
    @log = @options.log

  execute: ->
    # A variant of the logic below can also be found in up.Change.UpdateLayer.
    # Updating (swapping) a fragment also involves destroying the old version,
    # but the logic needs to be interwoven with the insertion logic for the new
    # version.

    up.migrate.handleHistoryOption?(@options)
    @layer.updateHistory(@options)

    # Save the parent because we sometimes emit up:fragment:destroyed
    # after removing @element.
    @parent = @element.parentNode

    up.fragment.markAsDestroying(@element)

    if up.motion.willAnimate(@element, @animation, @options)
      # If we're animating, we resolve *before* removing the element.
      # The destroy animation will then play out, but the destroying
      # element is ignored by all up.fragment.* functions.
      @emitDestroyed()
      @animate().then(@wipe).then(=> @onFinished())
    else
      # If we're not animating, we can remove the element and then resolve.
      @wipe()
      @emitDestroyed()
      @onFinished()

    # Don't wait for the animation to end.
    return Promise.resolve()

  animate: ->
    up.motion.animate(@element, @animation, @options)

  wipe: =>
    @layer.asCurrent =>
      up.syntax.clean(@element, { @layer })

      if up.browser.canJQuery()
        # jQuery elements store internal attributes in a global cache.
        # We need to remove the element via jQuery or we will leak memory.
        # See https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery
        jQuery(@element).remove()
      else
        e.remove(@element)

  emitDestroyed: ->
    up.fragment.emitDestroyed(@element, { @parent, @log })
