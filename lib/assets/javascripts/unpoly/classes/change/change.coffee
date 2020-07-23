u = up.util

class up.Change extends up.Class

  constructor: (options) ->
    if u.isString(options.history)
      up.legacy.warn("Passing a URL as { history } option is deprecated. Pass it as { location } instead.")
      options.location = options.history
      delete options.history

    @options = options

  onAppeared: ->
    @options.onAppeared?()

  onRemoved: ->
    @options.onRemoved?()

  notApplicable: (reason) ->
    return up.error.notApplicable(this, reason)

  ###**
  The `execute()` method has a somewhat weird signature:

  - If it is not applicable, it throws a sync error right away.
    This makes it practicable for internal calls.
  - If it IS applicable, it returns a promise (which might succeed or fail)

  For the purposes of our public API we never want an async function to
  throw a sync error. So we offer this `executeAsync()` methid, which never
  throws a sync error.
  ###
  executeAsync: ->
    u.rejectOnError => @execute()
