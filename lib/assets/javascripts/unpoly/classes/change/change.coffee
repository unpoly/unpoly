class up.Change extends up.Class

  constructor: (@options) ->

  notApplicable: ->
    throw @constructor.NOT_APPLICABLE

  @NOT_APPLICABLE: 'n/a'
