const u = up.util

/***
@module up.migrate
*/
up.migrate = (function() {

  const config = new up.Config(() => ({
    logLevel: 'warn'
  }))

  function renamedProperty(object, oldKey, newKey) {
    const warning = () => warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
    return Object.defineProperty(object, oldKey, {
      get() {
        warning()
        return this[newKey]
      },
      set(newValue) {
        warning()
        this[newKey] = newValue
      }
    }
    )
  }

  function fixKey(object, oldKey, newKey) {
    if (u.isDefined(object[oldKey])) {
      warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
      u.renameKey(object, oldKey, newKey)
    }
  }

  // Maps old event type to new event type
  const renamedEvents = {}

  function renamedEvent(oldType, newType) {
    renamedEvents[oldType] = newType
  }

  function fixEventType(eventType) {
    let newEventType = renamedEvents[eventType]
    if (newEventType) {
      warn(`Event ${eventType} has been renamed to ${newEventType}`)
      return newEventType
    } else {
      return eventType
    }
  }

  function fixEventTypes(eventTypes) {
    // Remove duplicates as e.g. up:history:pushed and up:history:replaced
    // both map to up:location:changed.
    return u.uniq(u.map(eventTypes, fixEventType))
  }

  function renamedPackage(oldName, newName) {
    Object.defineProperty(up, oldName, {
      get() {
        warn(`up.${oldName} has been renamed to up.${newName}`)
        return up[newName]
      }
    })
  }

  const warnedMessages = {}

  function warn(message, ...args) {
    const formattedMessage = u.sprintf(message, ...Array.from(args))
    if (!warnedMessages[formattedMessage]) {
      warnedMessages[formattedMessage] = true
      up.log[config.logLevel]('unpoly-migrate', message, ...Array.from(args))
    }
  }

  function deprecated(deprecatedExpression, replacementExpression) {
    warn(`${deprecatedExpression} has been deprecated. Use ${replacementExpression} instead.`)
  }

  // Returns a resolved promise that prints a warning when #then() is called.
  function formerlyAsync(label) {
    const promise = Promise.resolve()
    const oldThen = promise.then
    promise.then = function() {
      warn(`${label} is now a sync function`)
      return oldThen.apply(this, arguments)
    }
    return promise
  }

  function reset() {
    config.reset()
  }

  up.on('up:framework:reset', reset)

  return {
    deprecated,
    renamedPackage,
    renamedProperty,
    formerlyAsync,
    renamedEvent,
    fixEventTypes,
    fixKey,
    warn,
    loaded: true,
    config
  }
})()
