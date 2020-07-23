#= require ./base
#= require ./overlay

e = up.element

class up.Layer.OverlayWithTether extends up.Layer.Overlay

  createElements: (content) ->
    unless @origin
      up.fail('Missing { origin } option')

    # We first construct an un-started Tether object so we can
    # ask for its parent element.
    @tether = new up.Tether(
      anchor: @origin
      align: @align
      position: @position
    )
    @createElement(@tether.parent)
    @createContentElement(@element, content)
    @tether.start(@element)

  onElementsRemoved: ->
    @tether.stop()

  sync: ->
    # Check if a fragment update might have removed us from the DOM tree.
    if @isDetached() || e.isDetached(@tether.parent) || e.isDetached(@tether.anchor)
      # If our tether parent and anchor is gone, the best thing we can
      # do now is to dismiss ourselves and have a consistent layer stack.
      @dismiss(null,
        animation: false   # no need to animate since we're already hidden
        preventable: false # since we're cleaning up a broken stack, don't allow user intervention
      )
    else
      # The fragment update might have moved elements around.
      # This is a good moment to sync our position relative to the anchor.
      @tether.sync()

  sync: ->
    # In case some async code calls #sync() on a layer that was already closed,
    # don't run the code below that might re-attach the overlay.
    if @isOpen()

      if @isDetached() || @tether.isDetached()
        # If our tether parent and anchor is gone, the best thing we can
        # do now is to dismiss ourselves and have a consistent layer stack.
        @dismiss(
          null,              # no dismiss value
          animation: false   # no need to animate since we're already hidden
          preventable: false # since we're cleaning up a broken stack, don't allow user intervention
        )
      else
        # The fragment update might have moved elements around.
        # This is a good moment to sync our position relative to the anchor.
        @tether.sync()
