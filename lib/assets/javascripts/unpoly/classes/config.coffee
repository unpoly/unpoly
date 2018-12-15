class up.Config

  constructor: (@blueprint) ->
    @reset()

  reset: ->
    u.assign(@, u.deepCopy(@blueprint))
