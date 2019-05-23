#= require ./namespace

class up.Change.Addition extends up.Class

  constructor: (@options) ->
    @responseDoc = @options.responseDoc

  notApplicable: ->
    throw up.Change.NOT_APPLICABLE

  handleLayerChangeRequests: ->
    # Since we're not passing a { lock } these changes will be queued.
    # They will be started after the current layer change has finished.
    if @acceptLayer
      up.layer.accept(value: @acceptLayer)
    else if @dismissLayer
      up.layer.dismiss(value: @dismissLayer)
