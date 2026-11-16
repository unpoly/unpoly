import type { EmitProps, UnbindFunction } from '../unpoly/event.js'
import type { AnyFunction } from '../unpoly/util.js'

// A deprecated alias has the type of the namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    event: CoreApi['event'] & {
      nobodyPrevents(eventType: string, eventProps?: EmitProps): boolean
    }
    // The listener takes a jQuery collection instead of an element.
    $on(...args: unknown[]): UnbindFunction
    $off(...args: unknown[]): void
    readonly bus: Up['event']
  }
}

up.migrate.renamedNamespace('bus', 'event')

up.event.nobodyPrevents = function(...args) {
  up.migrate.deprecated('up.event.nobodyPrevents(type)', '!up.emit(type).defaultPrevented')
  const event = up.emit(...args)
  return !event.defaultPrevented
}

// A listener for up.$on(). It remembers the listener that up.on() registered for it.
type JQueryListener = AnyFunction & { upNativeCallback?: AnyFunction }

up.$on = function(...definitionArgs) {
  up.migrate.warn('up.$on() has been deprecated. Instead use up.on() with a callback that wraps the given native element in a jQuery collection.')
  let callback = definitionArgs.pop() as JQueryListener

  callback.upNativeCallback = function(event: Event, element: Element, data: unknown) {
    let $element = jQuery(element)
    callback.call($element, event, $element, data)
  }
  return (up.on as AnyFunction)(...definitionArgs, callback.upNativeCallback)
}

up.$off = function(...definitionArgs) {
  up.migrate.deprecated('up.$off()', 'up.off()')
  let $callback = definitionArgs.pop() as JQueryListener
  let nativeCallback = $callback.upNativeCallback

  if (!nativeCallback) {
    up.internal.fail('The callback passed to up.$off() was never registered with up.$on()')
  }

  return (up.off as AnyFunction)(...definitionArgs, nativeCallback)
}
