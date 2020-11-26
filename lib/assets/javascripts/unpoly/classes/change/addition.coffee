#= require ./change

u = up.util

class up.Change.Addition extends up.Change

  constructor: (options) ->
    super(options)
    @responseDoc = options.responseDoc
    @acceptLayer = options.acceptLayer
    @dismissLayer = options.dismissLayer
    @eventPlans = options.eventPlans || []

  handleLayerChangeRequests: ->
    if @layer.isOverlay()
      # The server may send an HTTP header `X-Up-Accept-Layer: value`
      @tryAcceptLayerFromServer()
      @abortWhenLayerClosed()

      # A close condition { acceptLocation: '/path' } might have been
      # set when the layer was opened.
      @layer.tryAcceptForLocation()
      @abortWhenLayerClosed()

      # The server may send an HTTP header `X-Up-Dismiss-Layer: value`
      @tryDismissLayerFromServer()
      @abortWhenLayerClosed()

      # A close condition { dismissLocation: '/path' } might have been
      # set when the layer was opened.
      @layer.tryDismissForLocation()
      @abortWhenLayerClosed()

    # On the server we support up.layer.emit('foo'), which sends:
    #
    #     X-Up-Events: [{ layer: 'current', type: 'foo'}]
    #
    # We must set the current layer to @layer so { layer: 'current' } will emit on
    # the layer that is being updated, instead of the front layer.
    #
    # A listener to such a server-sent event might also close the layer.
    @layer.asCurrent =>
      for eventPlan in @eventPlans
        up.emit(eventPlan)
        @abortWhenLayerClosed()

  tryAcceptLayerFromServer: ->
    # When accepting without a value, the server will send X-Up-Accept-Layer: null
    if u.isDefined(@acceptLayer) && @layer.isOverlay()
      @layer.accept(@acceptLayer)

  tryDismissLayerFromServer: ->
    # When dismissing without a value, the server will send X-Up-Dismiss-Layer: null
    if u.isDefined(@dismissLayer) && @layer.isOverlay()
      @layer.dismiss(@dismissLayer)

  abortWhenLayerClosed: ->
    if @layer.isClosed()
      # Wind up the call stack. Whoever has closed the layer will also clean up
      # elements, handlers, etc.
      throw up.error.aborted('Layer was closed')

  setSource: ({ oldElement, newElement, source }) ->
    # When the server responds with an error, or when the request method is not
    # reloadable (not GET), we keep the same source as before.
    if source == 'keep'
      source = oldElement && up.fragment.source(oldElement)

    # Don't set a source if { false } is passed.
    # Don't set a source if someone tries to 'keep' when opening a new layer
    # Don't set a source if the element HTML already has an [up-source] attribute.
    if source && !newElement.getAttribute('up-source')
      # Remember where the element came from in case someone needs to up.reload(element) later.
      up.fragment.setSource(newElement, source)
