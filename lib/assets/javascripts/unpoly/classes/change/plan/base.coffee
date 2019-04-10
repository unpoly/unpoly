#= require ../namespace

u = up.util
e = up.element

class up.Change.Plan

  @NOT_APPLICABLE: 'n/a'

  constructor: (@options) ->
    @responseDoc = @options.responseDoc

  notApplicable: ->
    throw up.Change.Plan.NOT_APPLICABLE

  handleLayerChangeRequests: ->
    if @acceptLayer
      up.layer.accept(value: @acceptLayer)
    else if @dismissLayer
      up.layer.dismiss(value: @dismissLayer)
