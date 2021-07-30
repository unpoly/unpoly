const u = up.util

up.EventListenerGroup = class EventListenerGroup extends up.Record {

  keys() {
    return [
      'elements',
      'eventTypes',
      'selector',
      'callback',
      'jQuery',
      'guard',
      'baseLayer',
      'passive',
      'once'
    ]
  }

  bind() {
    const unbindFns = []

    this.eachListenerAttributes(function(attrs) {
      const listener = new up.EventListener(attrs)
      listener.bind()
      return unbindFns.push(listener.unbind.bind(listener))
    })

    return u.sequence(unbindFns)
  }

  eachListenerAttributes(fn) {
    for (let element of this.elements) {
      for (let eventType of this.eventTypes) {
        fn(this.listenerAttributes(element, eventType))
      }
    }
  }

  listenerAttributes(element, eventType) {
    return { ...this.attributes(), element, eventType }
  }

  unbind() {
    this.eachListenerAttributes(function(attrs) {
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
    let eventTypes = u.splitValues(args.shift())
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
