#= require ./base
#= require ./overlay

e = up.element

class up.Layer.OverlayWithTether extends up.Layer.Overlay

  openNow: (options) ->
    # We first construct an un-started Tether object so we can
    # ask for its parent element.
    @tether = new up.Tether(
      anchor: @origin
      align: @align
      position: @position
    )
    @createElement(@tether.parent)
    @createBoxElement(@element)
    @createContentElement(@boxElement, @element)
    @setInnerContent(@contentElement, options)
    @setupHandlers()
    @tether.start(@boxElement)
    return @startOpenAnimation(options)

  closeNow: (options) ->
    @teardownHandlers()
    animation = => @startCloseAnimation(options)
    @destroyElement({ animation }).then =>
      @tether.stop()

  # Update the element's position relative to the anchor.
  sync: ->
    @tether.sync()

  repair: ->
    # Check if a fragment update might have removed us from the DOM tree.
    if @isDetached()
      if e.isDetached(@tether.parent) || u.isDetached(@tether.anchor)
        # If our tether parent and anchor is gone, the best thing we can
        # do now is to dismiss ourselves and have a consistent layer stack.
        @dismiss(null,
          animation: false   # no need to animate since we're already hidden
          preventable: false # since we're cleaning up a broken stack, don't allow user intervention
        )
      else
        # We we're detached but our tether parent and anchor are still in the DOM,
        # we can re-attach our element and keep the layer stack unchanged.
        @tether.parent.appendChild(@element)

    # The fragment update might have moved elements around.
    # In case we could repair ourselves, it's a good moment to sync our position
    # relative to the anchor.
    unless @isDetached()
      @sync()
