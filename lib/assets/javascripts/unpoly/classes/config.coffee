u = up.util

class up.Config

  constructor: (@blueprintFn = (-> {})) ->
    @reset()

  reset: ->
    u.assign(@, @blueprintFn())
