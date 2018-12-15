u = up.util

up.legacy = do ->

  renamedProperty = (object, oldKey, newKey) ->
    warning = -> up.warn('Deprecated: Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
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

  # Maps old event name to new event name
  renamedEvents = {}

  renamedEvent = (oldName, newName) ->
    renamedEvents[oldName] = newName

  fixEventName = (event) ->
    if newEvent = renamedEvents[event]
      up.warn("Deprecated: Event #{event} has been renamed to #{newEvent}")
      newEvent
    else
      event

  renamedModule = (oldName, newName) ->
    Object.defineProperty up, oldName, get: ->
      up.warn("Deprecated: up.#{oldName} has been renamed to up.#{newName}")
      up[newName]

  renamedModule: renamedModule
  renamedProperty: renamedProperty
#  removedProperty: removedProperty
  renamedEvent: renamedEvent
  fixEventName: fixEventName
