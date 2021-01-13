#= require ./event_listener

u = up.util

class up.EventListenerGroup extends up.Record

  keys: ->
    [
      'elements',
      'eventTypes',
      'selector',
      'callback',
      'jQuery',
      'guard',
      'currentLayer',
      'passive',
    ]

  bind: ->
    unbindFns = []

    for element in @elements
      for eventType in @eventTypes
        listener = new up.EventListener(@listenerAttributes(element, eventType))
        listener.bind()
        unbindFns.push(listener.unbind)

    u.sequence(unbindFns)

  listenerAttributes: (element, eventType) ->
    u.merge(@attributes(), { element, eventType })

  unbind: ->
    for element in @elements
      for eventType in @eventTypes
        if listener = up.EventListener.fromElement(@listenerAttributes(element, eventType))
          listener.unbind()

  ###
  Constructs a new up.EventListenerGroup from arguments with many different combinations:

      [[elements], eventTypes, [selector], [options], callback]

  @function up.EventListenerGroup.fromBindArgs
  @internal
  ###
  @fromBindArgs: (args, defaults) ->
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
    eventTypes = u.splitValues(args.shift())
    if fixType = up.migrate.fixEventType
      eventTypes = u.map(eventTypes, fixType)

    options = u.extractOptions(args)

    # A selector is given if the user wants to delegate events.
    # It might be undefined.
    selector = args[0]

    attributes = u.merge({ elements, eventTypes, selector, callback }, options, defaults)
    new @(attributes)
