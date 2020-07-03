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
    if u.isDefined(@acceptLayer)
      # Even if acceptance has no value, the server will send
      # X-Up-Accept-Layer: null
      @layer.accept(@acceptLayer)

  tryDismissLayerFromServer: ->
    if u.isDefined(@dismissLayer)
      # Even if acceptance has no value, the server will send
      # X-Up-Accept-Layer: null
      @layer.accept(@dismissLayer)

  abortWhenLayerClosed: ->
    if @layer.isClosed()
      # Wind up the call stack. Whoever has closed the layer will also clean up
      # elements, handlers, etc.
      throw up.error.aborted('Layer was closed')
