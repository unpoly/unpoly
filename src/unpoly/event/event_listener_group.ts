import * as u from '../util.js'
import type * as t from './types.js'
import { UpEventListener } from './event_listener.js'

export class EventListenerGroup {
  declare elements: u.List<t.ListenerTarget>
  declare eventTypes: string[]
  declare _listenerAttributes: t.SharedListenerAttributes

  constructor({ elements, eventTypes, ...listenerAttributes }: t.EventListenerGroupAttributes) {
    this.elements = elements
    this.eventTypes = eventTypes
    // The other attributes (selector, callback, options) are for the UpEventListener we build
    // for each element and event type. It picks the ones it knows.
    this._listenerAttributes = listenerAttributes
  }

  bind(): t.UnbindFn {
    const cleaner = u.cleaner()

    this._eachListenerAttributes(function(attrs) {
      const listener = new UpEventListener(attrs)
      listener.bind()
      return cleaner(listener.unbind.bind(listener))
    })

    return cleaner.clean
  }

  _eachListenerAttributes(fn: (attributes: t.EventListenerAttributes) => void): void {
    for (let element of this.elements) {
      for (let eventType of this.eventTypes) {
        fn({ ...this._listenerAttributes, element, eventType })
      }
    }
  }

  unbind(): void {
    this._eachListenerAttributes(function(attrs) {
      let listener = UpEventListener.fromElement(attrs)
      if (listener) {
        listener.unbind()
      }
    })
  }

  /*
  Constructs a new EventListenerGroup from arguments with many different combinations:

      [[elements], eventTypes, [selector], [options], callback]

  @function up.EventListenerGroup.fromBindArgs
  @internal
  */
  static fromBindArgs(args: any[], overrides?: u.PlainObject): EventListenerGroup {
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

    const attributes = { elements, eventTypes, selector, callback, ...options, ...overrides }
    return new (this)(attributes)
  }
}
