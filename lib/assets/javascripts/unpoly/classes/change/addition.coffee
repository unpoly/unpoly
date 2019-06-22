#= require ./change

class up.Change.Addition extends up.Change

  constructor: (options) ->
    super(options)
    @responseDoc = options.responseDoc

  handleLayerChangeRequests: ->
    # Since we're not passing a { lock } these changes will be queued.
    # They will be started after the current layer change has finished.
    if @acceptLayer
      up.layer.accept(value: @acceptLayer)
    else if @dismissLayer
      up.layer.dismiss(value: @dismissLayer)
