u = up.util

class up.Change extends up.Class

  constructor: (@options) ->

  notApplicable: ->
    throw @constructor.NOT_APPLICABLE

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

  @NOT_APPLICABLE: 'n/a'
