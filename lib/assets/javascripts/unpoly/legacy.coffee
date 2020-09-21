u = up.util

up.legacy = do ->

  renamedProperty = (object, oldKey, newKey) ->
    warning = -> warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
    Object.defineProperty object, oldKey,
      get: ->
        warning()
        @[newKey]
      set: (newValue) ->
        warning()
        @[newKey] = newValue

#  removedProperty = (object, key) ->
#    failure = -> up.fail('Deprecated: Property { %s } is no longer supported (found in %o)', key, object)
#    Object.defineProperty object, key,
#      get: failure
#      set: failure

  fixKey = (object, oldKey, newKey) ->
    if u.isDefined(object[oldKey])
      warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
      u.renameKey(object, oldKey, newKey)

  # Maps old event name to new event name
  renamedEvents = {}

  renamedEvent = (oldName, newName) ->
    renamedEvents[oldName] = newName

  fixEventType = (eventType) ->
    if newEventType = renamedEvents[eventType]
      warn("Event #{eventType} has been renamed to #{newEventType}")
      newEventType
    else
      eventType

  renamedModule = (oldName, newName) ->
    Object.defineProperty up, oldName, get: ->
      warn("up.#{oldName} has been renamed to up.#{newName}")
      up[newName]

  warnedMessages = {}

  warn = (message, args...) ->
    formattedMessage = u.sprintf(message, args...)
    unless warnedMessages[formattedMessage]
      warnedMessages[formattedMessage] = true
      up.warn('DEPRECATION', message, args...)

  deprecated = (deprecatedExpression, replacementExpression) ->
    warn("#{deprecatedExpression} has been deprecated. Use #{replacementExpression} instead.")

  deprecated: deprecated
  renamedModule: renamedModule
  renamedProperty: renamedProperty
#  removedProperty: removedProperty
  renamedEvent: renamedEvent
  fixEventType: fixEventType
  fixKey: fixKey
  warn: warn
