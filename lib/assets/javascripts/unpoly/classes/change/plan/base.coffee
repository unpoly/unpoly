#= require ../namespace

u = up.util
e = up.element

class up.Change.Plan extends up.Class

  @NOT_APPLICABLE: 'n/a'

  constructor: (@options) ->
    @responseDoc = @options.responseDoc

  notApplicable: ->
    throw up.Change.Plan.NOT_APPLICABLE

  handleLayerChangeRequests: ->
    # Since we're not passing a { lock } these changes will be queued.
    # They will be started after the current layer change has finished.
    if @acceptLayer
      up.layer.accept(value: @acceptLayer)
    else if @dismissLayer
      up.layer.dismiss(value: @dismissLayer)
