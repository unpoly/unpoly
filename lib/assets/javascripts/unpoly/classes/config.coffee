u = up.util

class up.Config

  constructor: (@blueprintFn = (-> {})) ->
    @reset()

  reset: (options = {}) ->
    u.assign(@, @blueprintFn())
    if options.deep
      for value in u.values(@)
        if value instanceof up.Config
          value.reset()
