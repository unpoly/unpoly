#= require ./change

class up.Change.Addition extends up.Change

  constructor: (options) ->
    super(options)
    @responseDoc = options.responseDoc
    @acceptLayer = options.acceptLayer
    @dismissLayer = options.dismissLayer
    @event = options.event
    @layerEvent = options.layerEvent

  handleLayerChangeRequests: ->
    if @acceptLayer
      up.layer.accept(value: @acceptLayer)
    else if @dismissLayer
      up.layer.dismiss(value: @dismissLayer)

    if @event
      up.emit(@event)

    if @layerEvent
      up.layer.emit(@layerEvent)
