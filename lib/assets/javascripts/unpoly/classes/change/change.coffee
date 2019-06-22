class up.Change extends up.Class

  constructor: (@options) ->
    @lock = @options.lock

  notApplicable: ->
    throw @constructor.NOT_APPLICABLE

  asap: (fn) ->
    up.layer.asap(@lock, fn)

  @NOT_APPLICABLE: 'n/a'
