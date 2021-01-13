u = up.util

###**
@module up.migrate
###
up.migrate = do ->

  config = new up.Config ->
    logLevel: 'warn'

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

  renamedPackage = (oldName, newName) ->
    Object.defineProperty up, oldName, get: ->
      warn("up.#{oldName} has been renamed to up.#{newName}")
      up[newName]

  warnedMessages = {}

  warn = (message, args...) ->
    formattedMessage = u.sprintf(message, args...)
    unless warnedMessages[formattedMessage]
      warnedMessages[formattedMessage] = true
      up.log[config.logLevel]('DEPRECATION', message, args...)

  deprecated = (deprecatedExpression, replacementExpression) ->
    warn("#{deprecatedExpression} has been deprecated. Use #{replacementExpression} instead.")

  reset = ->
    config.reset()

  up.on 'up:framework:reset', reset

  deprecated: deprecated
  renamedPackage: renamedPackage
  renamedProperty: renamedProperty
#  removedProperty: removedProperty
  renamedEvent: renamedEvent
  fixEventType: fixEventType
  fixKey: fixKey
  warn: warn
  loaded: true

