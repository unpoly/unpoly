const u = up.util

up.EventListenerGroup = class EventListenerGroup extends up.Record {

  keys() {
    return [
      'elements',
      'eventTypes',

      'selector',
      'callback',
      'guard',
      'baseLayer',
      'passive',
      'once',
      'capture',
      'beforeBoot',
    ]
  }

  bind() {
    const cleaner = u.cleaner()

    this._eachListenerAttributes(function(attrs) {
      const listener = new up.EventListener(attrs)
      listener.bind()
      return cleaner(listener.unbind.bind(listener))
    })

    return cleaner.clean
  }

  _eachListenerAttributes(fn) {
    for (let element of this.elements) {
      for (let eventType of this.eventTypes) {
        fn(this._listenerAttributes(element, eventType))
      }
    }
  }

  _listenerAttributes(element, eventType) {
    return { ...this.attributes(), element, eventType }
  }

  unbind() {
    this._eachListenerAttributes(function(attrs) {
      let listener = up.EventListener.fromElement(attrs)
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
  static fromBindArgs(args, defaults) {
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

    const attributes = { elements, eventTypes, selector, callback, ...options, ...defaults }
    return new (this)(attributes)
  }
}
