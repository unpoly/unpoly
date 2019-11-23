up.error = do ->

  u = up.util

  build = (name, message, props = {}) ->
    if u.isArray(message)
      message = u.sprintf(message...)
    error = new Error(message)
    u.assign(error, props)
    error.name = name
    return error

#  errorInterface = (name) ->
#    fn = (args...) -> build(name, args...)
#    fn.is = (error) -> error.name == name
#    return fn

  failure = (message) ->
    build('up.Failure', message)

  notApplicable = (change, reason) ->
    build('up.NotApplicable', "Cannot apply change: #{change} (#{reason}")

  notImplemented = ->
    build('up.NotImplemented')

  {
    build,
    failure,
    notApplicable,
    notImplemented,
  }

#  build: build
#  failure: errorInterface('up.Fatal')
#  notApplicable: errorInterface('up.NotApplicable')
