type EmitProps = import('../unpoly/event.js').EmitProps
type UnbindFn = import('../unpoly/event.js').UnbindFn

// A deprecated alias has the type of the namespace that replaces it.
declare module '../unpoly.js' {
  interface Up {
    event: CoreApi['event'] & {
      nobodyPrevents(eventType: string, eventProps?: EmitProps): boolean
    }
    // The listener takes a jQuery collection instead of an element.
    $on(...args: any[]): UnbindFn
    $off(...args: any[]): void
    readonly bus: Up['event']
  }
}

up.migrate.renamedNamespace('bus', 'event')

up.event.nobodyPrevents = function(...args) {
  up.migrate.deprecated('up.event.nobodyPrevents(type)', '!up.emit(type).defaultPrevented')
  const event = up.emit(...args)
  return !event.defaultPrevented
}

up.$on = function(...definitionArgs) {
  up.migrate.warn('up.$on() has been deprecated. Instead use up.on() with a callback that wraps the given native element in a jQuery collection.')
  let callback = definitionArgs.pop()

  callback.upNativeCallback = function(event: Event, element: Element, data: any) {
    let $element = jQuery(element)
    callback.call($element, event, $element, data)
  }
  return (up.on as any)(...definitionArgs, callback.upNativeCallback)
}

up.$off = function(...definitionArgs) {
  up.migrate.deprecated('up.$off()', 'up.off()')
  let $callback = definitionArgs.pop()
  let nativeCallback = $callback.upNativeCallback

  if (!nativeCallback) {
    up.internal.fail('The callback passed to up.$off() was never registered with up.$on()')
  }

  return (up.off as any)(...definitionArgs, nativeCallback)
}
