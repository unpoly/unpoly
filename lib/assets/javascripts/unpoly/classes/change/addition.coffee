#= require ./change

class up.Change.Addition extends up.Change

  constructor: (options) ->
    super(options)
    @responseDoc = options.responseDoc
    @acceptLayer = options.acceptLayer
    @dismissLayer = options.dismissLayer
    @eventPlans = options.eventPlans

  handleLayerChangeRequests: ->
    if @acceptLayer
      up.layer.accept(@acceptLayer)
    else if @dismissLayer
      up.layer.dismiss(@dismissLayer)

    @eventPlans?.forEach(up.emit)

