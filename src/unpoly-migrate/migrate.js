const u = up.util

/*-
@module up.migrate
*/
up.migrate = (function() {

  const config = new up.Config(() => ({
    logLevel: 'warn'
  }))

  // function getPath(object, path) {
  //   for (let leg in path.split('.')) {
  //     object = object[leg]
  //   }
  //   return object
  // }
  //
  // function setPath(object, path, newValue) {
  //   let legs = path.split('.')
  //   u.each(legs, function(leg, i) {
  //     if (i === legs.length - 1) {
  //       object[leg] = newValue
  //     } else {
  //       object = object[leg]
  //     }
  //   })
  //   return newValue
  // }

  function renamedProperty(object, oldKey, newKey) {
    const warning = () => warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
    Object.defineProperty(object, oldKey, {
      get() {
        warning()
        return this[newKey]
      },
      set(newValue) {
        warning()
        this[newKey] = newValue
      }
    })
  }

  function removedProperty(object, key) {
    const warning = () => warn('Property { %s } has been removed without replacement (found in %o)', key, object)
    Object.defineProperty(object, key, {
      get() {
        warning()
        return this[key]
      },
      set(newValue) {
        warning()
        this[key] = newValue
      }
    })
  }

  function renamedAttribute(oldAttr, newAttr, { scope, mapValue } = {}) {
    // Scope may be a selector string OR a function
    let selector = scope || `[${oldAttr}]`
    up.macro(selector, { priority: -1000 }, function(element) {
      // If scope is given as a function it does not select for the attribute
      if (element.hasAttribute(oldAttr)) {
        warn('Attribute [%s] has been renamed to [%s] (found in %o)', oldAttr, newAttr, element)
        let value = element.getAttribute(oldAttr)
        if (mapValue) {
          value = mapValue(value)
        }
        element.setAttribute(newAttr, value)
        element.removeAttribute(oldAttr)
      }
    })
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

  // Maps old event type to new event type
  const removedEvents = {}

  function removedEvent(type, replacementExpression = null) {
    removedEvents[type] = replacementExpression
  }

  function fixEventType(eventType) {
    let newEventType = renamedEvents[eventType]
    if (newEventType) {
      warn(`Event ${eventType} has been renamed to ${newEventType}`)
      return newEventType
    } else if (eventType in removedEvents) {
      let message = `Event ${eventType} has been removed`
      let replacementExpression = removedEvents[eventType]
      if (replacementExpression) {
        message += `. Use ${replacementExpression} instead.`
      }
      warn(message)
      return eventType
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
    const formattedMessage = u.sprintf(message, ...args)
    if (!warnedMessages[formattedMessage]) {
      warnedMessages[formattedMessage] = true
      up.log[config.logLevel]('unpoly-migrate', message, ...args)
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
      warn(`${label} no longer returns a promise`)
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
    removedProperty,
    renamedAttribute,
    formerlyAsync,
    renamedEvent,
    removedEvent,
    fixEventTypes,
    fixKey,
    warn,
    loaded: true,
    config
  }
})()
