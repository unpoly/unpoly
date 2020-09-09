u = up.util

class up.Change extends up.Class

  constructor: (@options) ->

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

  # Values we want to keep:
  # - false (no update)
  # - string (forced update)
  # Values we want to override:
  # - true (do update with defaults)
  improveHistoryValue: (existingValue, newValue) ->
    if existingValue == false || u.isString(existingValue)
      existingValue
    else
      newValue
