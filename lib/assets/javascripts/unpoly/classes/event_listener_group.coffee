#= require ./event_listener

u = up.util

class up.EventListenerGroup extends up.Record

  @keys: ->
    [
      'elements',
      'eventNames',
      'selector',
      'callback',
      'jQuery',
      'guard'
    ]

  bind: ->
    unbindFns = []

    for element in @elements
      for eventName in @eventNames
        listener = new up.EventListener(@listenerAttributes(element, eventName))
        listener.bind()
        unbindFns.push(listener.unbind)

    u.sequence(unbindFns)

  listenerAttributes: (element, eventName) ->
    u.merge(@attributes(), { element, eventName })

  unbind: ->
    for element in @elements
      for eventName in @eventNames
        if listener = up.EventListener.fromElement(@listenerAttributes(element, eventName))
          listener.unbind()

  ###
  Constructs a new up.EventListenerGroup from the following arg variants:

  - [elements, eventNames, selector, callback]
  - [elements, eventNames,           callback]
  - [          eventNames, selector, callback]
  - [          eventNames,           callback]

  @function up.EventListenerGroup.fromBindArgs
  @internal
  ###
  @fromBindArgs: (args, options) ->
    args = u.copy(args)

    # A callback function is given in all arg variants.
    callback = args.pop()

    # The user can pass an element (or the document, or the window) as the
    # first argument. If omitted, the listener will bind to the document.
    if args[0].addEventListener
      elements = [args.shift()]
    else if u.isJQuery(args[0]) || (u.isList(args[0]) && args[0][0].addEventListener)
      elements = args.shift()
    else
      elements = [document]

    # Event names are given in all arg variants
    eventNames = u.splitValues(args.shift())
    eventNames = u.map(eventNames, up.legacy.fixEventName)

    # A selector is given if the user wants to delegate events.
    # It might be undefined.
    selector = args[0]

    attributes = u.merge({ elements, eventNames, selector, callback }, options)
    new @(attributes)
