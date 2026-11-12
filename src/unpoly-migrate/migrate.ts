const u = up.util

type Up = import('../unpoly.js').Up
type PlainObject = import('../unpoly/util.js').PlainObject
type AttributeTransformer = import('./migrate/types.js').AttributeTransformer
type FixKeyOptions = import('./migrate/types.js').FixKeyOptions
type MigrateConfig = import('./migrate/types.js').MigrateConfig
type PropertyWarningOptions = import('./migrate/types.js').PropertyWarningOptions
type RemovedAttributeOptions = import('./migrate/types.js').RemovedAttributeOptions
type RemovedPropertyOptions<T> = import('./migrate/types.js').RemovedPropertyOptions<T>
type RenamedAttributeOptions = import('./migrate/types.js').RenamedAttributeOptions
type TransformAttributeOptions = import('./migrate/types.js').TransformAttributeOptions

up.migrate = (function() {

  const config = up.internal.newConfig('up.migrate.config', (): MigrateConfig => ({
    logLevel: 'error'
  }))

  // Pass a { label } like 'up.form.config' to name the object in the warning.
  // Without a label we print the object itself.
  function renamedProperty(object: object, oldKey: string, newKey: string, { label, warning }: PropertyWarningOptions = {}): void {
    // We memoize the warning to prevent infinite recursion. The `found in %o` will access the getter
    // to print the object, which will call the warning, which will access the getter, etc.
    const doWarn = up.internal.memoize(function() {
      if (warning) {
        warn(warning)
      } else if (label) {
        warn('Property %s.%s has been renamed to %s.%s', label, oldKey, label, newKey)
      } else {
        warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
      }
    })

    Object.defineProperty(object, oldKey, {
      configurable: true,
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

  // Pass a { label } like 'up.form.config' to name the object in the warning.
  // Without a label we print the object itself.
  //
  // Pass a { value } to set an initial value without a warning.
  // It is restored when up.framework.reset() runs the config patch again.
  function removedProperty<T>(object: object, key: string, { label, warning, value }: RemovedPropertyOptions<T> = {}): [T] {
    // We memoize the warning to prevent infinite recursion. The `found in %o` will access the getter
    // to print the object, which will call the warning, which will access the getter, etc.
    const doWarn = up.internal.memoize(function() {
      if (warning) {
        warn(warning)
      } else if (label) {
        warn('Property %s.%s has been removed without replacement', label, key)
      } else {
        warn('Property { %s } has been removed without replacement (found in %o)', key, object)
      }
    })

    // We only keep an existing data value. When up.framework.reset() runs a config patch again,
    // reading object[key] would call the getter from the previous definition, which warns and keeps the old value.
    // We return the reference so a polyfill can honor a value that the app sets.
    let valueRef: [T] = [value ?? Object.getOwnPropertyDescriptor(object, key)?.value]

    Object.defineProperty(object, key, {
      configurable: true,
      // The key usually exists as an enumerable data property, and redefining it would keep it enumerable.
      // Then any script that enumerates the object would trigger the warning, e.g. when we print
      // the object with %o in another warning, or an analytics script walking window.up.
      enumerable: false,
      get() {
        doWarn()
        return valueRef[0]
      },
      set(newValue) {
        doWarn()
        valueRef[0] = newValue
      }
    })

    return valueRef
  }

  function transformAttribute(oldAttr: string, transformer: AttributeTransformer): void
  function transformAttribute(oldAttr: string, options: TransformAttributeOptions, transformer: AttributeTransformer): void
  function transformAttribute(oldAttr: string, ...args: any[]): void {
    let transformer: AttributeTransformer = up.internal.extractCallback(args)
    let { scope }: TransformAttributeOptions = up.internal.extractOptions(args)

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

  function renamedAttribute(oldAttr: string, newAttr: string, { scope, mapValue }: RenamedAttributeOptions = {}): void {
    transformAttribute(oldAttr, { scope }, function(element, value) {
      warn('Attribute [%s] has been renamed to [%s] (found in %o)', oldAttr, newAttr, element)
      if (mapValue) {
        value = u.evalOption(mapValue, value)
      }
      element.setAttribute(newAttr, value)
    })
  }

  function removedAttribute(oldAttr: string, { scope, replacement }: RemovedAttributeOptions = {}): void {
    transformAttribute(oldAttr, { scope }, function(element, _value) {
      if (replacement) {
        warn('Attribute [%s] has been removed (found in %o). Use %s instead.', oldAttr, element, replacement)
      } else {
        warn('Attribute [%s] has been removed without replacement (found in %o)', oldAttr, element)
      }
    })
  }

  // Pass a { label } like 'up.layer.config.modal' or 'render options' to name the object in the warning.
  // Without a label we print the object itself, which is hard to read for large or circular objects.
  // A labeled warning also has the same text for every object, so we only print it once.
  //
  // Pass a { detail } like an origin element or URL to name the call site, e.g. 'render options for <a href="/foo">'.
  // Since warnings are deduplicated by their text, this prints the warning once per call site.
  function fixKey(object: PlainObject, oldKey: string, newKey: string, { label, detail }: FixKeyOptions = {}): void {
    if (u.isDefined(object[oldKey])) {
      if (label && detail) {
        warn('Property { %s } has been renamed to { %s } (found in %s for %o)', oldKey, newKey, label, detail)
      } else if (label) {
        warn('Property { %s } has been renamed to { %s } (found in %s)', oldKey, newKey, label)
      } else {
        warn('Property { %s } has been renamed to { %s } (found in %o)', oldKey, newKey, object)
      }
      up.internal.renameKey(object, oldKey, newKey)
    }
  }

  // Maps old event type to new event type
  const renamedEvents: Record<string, string> = {}

  function renamedEvent(oldType: string, newType: string): void {
    renamedEvents[oldType] = newType
  }

  // Maps old event type to new event type
  const removedEvents: Record<string, string | null> = {}

  function removedEvent(type: string, replacementExpression: string | null = null): void {
    removedEvents[type] = replacementExpression
  }

  function fixEventType(eventType: string): string {
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

  function fixEventTypes(eventTypes: string[]): string[] {
    // Remove duplicates as e.g. up:history:pushed and up:history:replaced
    // both map to up:location:changed.
    return u.uniq(u.map(eventTypes, fixEventType))
  }

  function renamedNamespace(oldName: string, newName: keyof Up): void {
    Object.defineProperty(up, oldName, {
      configurable: true,
      get() {
        warn(`up.${oldName} has been renamed to up.${newName}`)
        return up[newName]
      }
    })
  }

  let warnedMessages: Record<string, boolean> = {}

  function reset(): void {
    warnedMessages = {}
  }

  const warn = up.internal.mockable((message: string, ...args: unknown[]) => {
    const formattedMessage = up.internal.sprintf(message, ...args)
    const logLevel = config.logLevel
    if (logLevel !== 'none' && !warnedMessages[formattedMessage]) {
      warnedMessages[formattedMessage] = true
      const log = (logLevel === 'warn') ? up.internal.printToWarn : up.internal.printToError
      log('unpoly-migrate', message, ...args)
    }
  })

  function deprecated(deprecatedExpression: string, replacementExpression: string): void {
    warn(`${deprecatedExpression} has been deprecated. Use ${replacementExpression} instead.`)
  }

  // Returns a resolved promise that prints a warning when #then() is called.
  function formerlyAsync(label: string): Promise<void> {
    const promise = Promise.resolve()
    const oldThen = promise.then
    promise.then = function() {
      warn(`${label} is now sync and no longer returns a promise`)
      return oldThen.apply(this, arguments)
    }
    return promise
  }

  const CSS_LENGTH_PROPS = [
    'top', 'right', 'bottom', 'left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'width', 'height',
    'max-width', 'max-height',
    'min-width', 'min-height',
  ]

  function fixStylePropName(prop: string): string {
    if (/[A-Z]/.test(prop)) {
      warn(`CSS property names must be in kebab-case, but got camelCase "${prop}"`)
      return up.internal.camelToKebabCase(prop)
    } else {
      return prop
    }
  }

  function fixStylePropValue(prop: string, value: any, unit?: string): any {
    if (!unit && CSS_LENGTH_PROPS.includes(prop) && /^[\d.]+$/.test(value)) {
      warn(`CSS length values must have a unit, but got "${prop}: ${value}". Use "${prop}: ${value}px" instead.`)
      return value + "px"
    } else {
      return value
    }
  }

  // Takes a key or an array of keys.
  function fixGetStyleProps(keyOrKeys: string | string[]): string | string[] {
    let transformed

    if (u.isString(keyOrKeys)) {
      transformed = fixStylePropName(keyOrKeys)
    } else if (u.isArray(keyOrKeys)) {
      transformed = keyOrKeys.map(fixStylePropName)
    } else {
      // Unsupported case. Behave neutrally.
      transformed = keyOrKeys
    }

    return transformed
  }

  // Takes an object of props or a string. Typed any because u.isObject() isn't a type predicate, so it doesn't narrow.
  function fixSetStyleProps(props: any, unit?: string): any {
    let transformed

    if (u.isObject(props)) {
      transformed = {}
      for (let name in props) {
        let value = props[name]
        name = fixStylePropName(name)
        value = fixStylePropValue(name, value, unit)
        transformed[name] = value
      }
    } else {
      // Leave a string unchanged
      transformed = props
    }

    return transformed
  }

  function defineThrowingProps(object: object, forbiddenPrototype: object, errorMessage: string): void {
    let complain = () => { throw new TypeError(errorMessage) }

    for (const propName of Object.getOwnPropertyNames(forbiddenPrototype)) {
      if (!(propName in object)) {
        Object.defineProperty(object, propName, {
          get: complain,
          set: complain,
          enumerable: false,
          configurable: false,
        })
      }
    }
  }

  up.on('up:framework:reset', reset)

  // Core reads loaded, formerlyAsync(), fixEventTypes(), fixGetStyleProps() and fixSetStyleProps().
  // It calls more hooks that other files add to up.migrate (look for "Core calls this hook").
  return {
    deprecated,
    renamedNamespace,
    renamedProperty,
    removedProperty,
    defineThrowingProps,
    transformAttribute,
    renamedAttribute,
    removedAttribute,
    formerlyAsync,
    renamedEvent,
    removedEvent,
    fixGetStyleProps,
    fixSetStyleProps,
    fixEventTypes,
    fixKey,
    warn,
    loaded: true,
    config,
  }
})()
