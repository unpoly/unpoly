u = up.util
e = up.element

class up.ExtractPlan

  @NOT_APPLICABLE: 'n/a'

  constructor: (@options) ->

  notApplicable: ->
    throw up.ExtractPlan.NOT_APPLICABLE
