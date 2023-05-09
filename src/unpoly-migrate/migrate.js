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

  function renamedProperty(object, oldKey, newKey, warning) {
    // We memoize the warning to prevent infinite recursion. The `found in %o` will access the getter
    // to print the object, which will call the warning, which will access the getter, etc.
    const doWarn = u.memoize(() => warning ? warn(warning) : warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object))

    Object.defineProperty(object, oldKey, {
      get() {
        doWarn()
        return this[newKey]
      },
      set(newValue) {
        doWarn()
        this[newKey] = newValue
      }
    })
  }

  function removedProperty(object, key, warning) {
    // We memoize the warning to prevent infinite recursion. The `found in %o` will access the getter
    // to print the object, which will call the warning, which will access the getter, etc.
    const doWarn = u.memoize(() => warning ? warn(warning) : warn('Property { %s } has been removed without replacement (found in %o)', key, object))

    let value = object[key]

    Object.defineProperty(object, key, {
      get() {
        doWarn()
        return value
      },
      set(newValue) {
        doWarn()
        value = newValue
      }
    })
  }

  function forbiddenPropertyValue(object, key, forbiddenValue, errorMessage) {
    let value = object[key]

    Object.defineProperty(object, key, {
      get() {
        return value
      },
      set(newValue) {
        if (newValue === forbiddenValue) {
          throw new Error(errorMessage)
        }
        value = newValue
      }
    })
  }

  function transformAttribute(oldAttr, ...args) {
    let transformer = u.extractCallback(args)
    let { scope } = u.extractOptions(args)

    // Scope may be a selector string OR a function
    let selector = scope || `[${oldAttr}]`
    up.macro(selector, { priority: -1000 }, function(element) {
      // If scope is given as a function it does not select for the attribute
      if (element.hasAttribute(oldAttr)) {
        let value = element.getAttribute(oldAttr)
        transformer(element, value)
      }
    })
  }

  function renamedAttribute(oldAttr, newAttr, { scope, mapValue } = {}) {
    transformAttribute(oldAttr, { scope }, function(element, value) {
      warn('Attribute [%s] has been renamed to [%s] (found in %o)', oldAttr, newAttr, element)
      if (mapValue) {
        value = u.evalOption(mapValue, value)
      }
      element.setAttribute(newAttr, value)
    })
  }

  function removedAttribute(oldAttr, { scope, replacement } = {}) {
    transformAttribute(oldAttr, { scope }, function(element, _value) {
      if (replacement) {
        warn('Attribute [%s] has been removed (found in %o). Use %s instead.', oldAttr, element, replacement)
      } else {
        warn('Attribute [%s] has been removed without replacement (found in %o)', oldAttr, element)
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
    forbiddenPropertyValue,
    transformAttribute,
    renamedAttribute,
    removedAttribute,
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
