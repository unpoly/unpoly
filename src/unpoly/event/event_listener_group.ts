import * as u from '../util.js'
import type * as t from './types.js'
import { UpEventListener } from './event_listener.js'

export function bindListeners(group: t.ListenerGroup): t.UnbindFn {
  const cleaner = u.cleaner()

  eachListenerAttributes(group, function(attrs) {
    const listener = new UpEventListener(attrs)
    listener.bind()
    return cleaner(listener.unbind.bind(listener))
  })

  return cleaner.clean
}

function eachListenerAttributes(group: t.ListenerGroup, fn: (attributes: t.EventListenerAttributes) => void): void {
  for (let element of group.elements) {
    for (let eventType of group.eventTypes) {
      // The other attributes (selector, callback, options) are for the UpEventListener we build
      // for each element and event type. It picks the ones it knows, so we don't need to omit
      // { elements } and { eventTypes }.
      fn({ ...group, element, eventType })
    }
  }
}

export function unbindListeners(group: t.ListenerGroup): void {
  eachListenerAttributes(group, function(attrs) {
    let listener = UpEventListener.fromElement(attrs)
    if (listener) {
      listener.unbind()
    }
  })
}

/*
Parses the arguments of up.on() and up.off(), which come in many different combinations:

    [[elements], eventTypes, [selector], [options], callback]

@function parseBindArgs
@internal
*/
export function parseBindArgs(args: any[], overrides?: u.PlainObject): t.ListenerGroup {
  args = u.copy(args)

  // A callback function is given in all arg variants.
  const callback = args.pop()

  // The user can pass an element (or the document, or the window) as the
  // first argument. If omitted, the listener will bind to the document.
  let elements
  if (args[0].addEventListener) {
    elements = [args.shift()]
  } else if (u.isJQuery(args[0]) || (u.isList(args[0]) && args[0][0].addEventListener)) {
    elements = args.shift()
  } else {
    elements = [document]
  }

  // Event names are given in all arg variants
  let eventTypes = u.getSimpleTokens(args.shift())
  let fixTypes = up.migrate.fixEventTypes
  if (fixTypes) {
    eventTypes = fixTypes(eventTypes)
  }

  const options = u.extractOptions(args)

  // A selector is given if the user wants to delegate events.
  // It might be undefined.
  const selector = args[0]

  return { elements, eventTypes, selector, callback, ...options, ...overrides }
}
