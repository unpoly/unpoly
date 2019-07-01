u = up.util

class up.Config extends up.Class

  constructor: (@blueprintFn = (-> {})) ->
    @reset()

  reset: ->
    u.assign(@, @blueprintFn())
#    if options.deep
#      for value in u.values(@)
#        if value instanceof up.Config
#          value.reset()
