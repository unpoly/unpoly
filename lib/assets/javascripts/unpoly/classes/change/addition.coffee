#= require ./change

class up.Change.Addition extends up.Change

  constructor: (options) ->
    super(options)
    @responseDoc = options.responseDoc
    @acceptLayer = options.acceptLayer
    @dismissLayer = options.dismissLayer
    @events = options.events

  handleLayerChangeRequests: ->
    if @acceptLayer
      up.layer.accept(value: @acceptLayer)
    else if @dismissLayer
      up.layer.dismiss(value: @dismissLayer)

    if @events
      @events.forEach(up.emit)
