u = up.util

class up.Change extends up.Class

  constructor: (@options) ->

  notApplicable: (reason) ->
    return up.error.notApplicable(this, reason)

  execute: ->
    throw up.error.notImplemented()

  onFinished: ->
    @options.onFinished?()

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

