import { cleaner as utilCleaner, copy, extractOptions, getSimpleTokens, isJQuery, isList } from '../util.js'
import { EventListener } from './event_listener.js'

export class EventListenerGroup {

  constructor({ elements, eventTypes, ...listenerAttributes }) {
    this.elements = elements
    this.eventTypes = eventTypes
    // The other attributes (selector, callback, options) are for the EventListener we build
    // for each element and event type. It picks the ones it knows.
    this._listenerAttributes = listenerAttributes
  }

  bind() {
    const cleaner = utilCleaner()

    this._eachListenerAttributes(function(attrs) {
      const listener = new EventListener(attrs)
      listener.bind()
      return cleaner(listener.unbind.bind(listener))
    })

    return cleaner.clean
  }

  _eachListenerAttributes(fn) {
    for (let element of this.elements) {
      for (let eventType of this.eventTypes) {
        fn({ ...this._listenerAttributes, element, eventType })
      }
    }
  }

  unbind() {
    this._eachListenerAttributes(function(attrs) {
      let listener = EventListener.fromElement(attrs)
      if (listener) {
        listener.unbind()
      }
    })
  }

  /*
  Constructs a new up.EventListenerGroup from arguments with many different combinations:

      [[elements], eventTypes, [selector], [options], callback]

  @function up.EventListenerGroup.fromBindArgs
  @internal
  */
  static fromBindArgs(args, overrides) {
    args = copy(args)

    // A callback function is given in all arg variants.
    const callback = args.pop()

    // The user can pass an element (or the document, or the window) as the
    // first argument. If omitted, the listener will bind to the document.
    let elements
    if (args[0].addEventListener) {
      elements = [args.shift()]
    } else if (isJQuery(args[0]) || (isList(args[0]) && args[0][0].addEventListener)) {
      elements = args.shift()
    } else {
      elements = [document]
    }

    // Event names are given in all arg variants
    let eventTypes = getSimpleTokens(args.shift())
    let fixTypes = up.migrate.fixEventTypes
    if (fixTypes) {
      eventTypes = fixTypes(eventTypes)
    }

    const options = extractOptions(args)

    // A selector is given if the user wants to delegate events.
    // It might be undefined.
    const selector = args[0]

    const attributes = { elements, eventTypes, selector, callback, ...options, ...overrides }
    return new (this)(attributes)
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  EventListenerGroup,
}
