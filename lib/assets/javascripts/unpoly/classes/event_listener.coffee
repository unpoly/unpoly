u = up.util
e = up.element

class up.EventListener

  constructor: (@element, @eventName, @selector, @callback, options) ->
    { @jQuery } = options
    @key = @constructor.key(@eventName, @selector, @callback)
    @isDefault = up.framework.isBooting()

  bind: ->
    map = (@element.upEventListeners ||= {})
    if map[@key]
      up.fail('up.on(): The %o callback %o cannot be registered more than once', @eventName, @callback)
    map[@key] = this
    @element.addEventListener(@eventName, @nativeCallback)

  unbind: =>
    if map = @element.upEventListeners
      delete map[@key]
    @element.removeEventListener(@eventName, @nativeCallback)

  nativeCallback: (event) =>
    # 1. Since we're listing on `document`, event.currentTarget is now `document`.
    # 2. event.target is the element that received an event, which might be a
    #    child of `selector`.
    # 3. There is only a single event bubbling up the DOM, so we are only called once.

    element = event.target
    element = e.closest(element, @selector) if @selector

    if element
      elementArg = if @jQuery then jQuery(element) else element
      args = [event, elementArg]

      # Do not retrieve and parse [up-data] unless the listener function
      # expects a third argument. Note that we must pass data for an argument
      # count of 0, since then the function might take varargs.
      expectedArgCount = @callback.length

      unless expectedArgCount == 1 || expectedArgCount == 2
        data = up.syntax.data(element)
        args.push(data)

      @callback.apply(element, args)

  ###
  Parses the following arg variants into an object:

  - [elements, eventNames, selector, callback]
  - [elements, eventNames,           callback]
  - [          eventNames, selector, callback]
  - [          eventNames,           callback]

  @function up.EventListener#parseArgs
  @internal
  ###
  @parseArgs = (args) ->
    args = u.copy(args)

    # A callback function is given in all arg variants.
    callback = args.pop()
    # Give the callback function a numeric identifier so it
    # can become part of the upEventListeners key.
    callback.upUid ||= u.uid()

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
    # eventNames = u.map(eventNames, up.legacy.fixEventName)

    # A selector is given if the user wants to delegate events.
    # It might be undefined.
    selector = args[0]

    { elements, eventNames, selector, callback }

  @bind: (args, options = {}) ->
    parsed = @parseArgs(args)
    unbindFns = []

    for element in parsed.elements
      for eventName in parsed.eventNames
        listener = new @(element, eventName, parsed.selector, parsed.callback, options)
        listener.bind()
        unbindFns.push(listener.unbind)

    u.sequence(unbindFns)

  @key: (eventName, selector, callback) ->
    [eventName, selector, callback.upUid].join('|')

  @unbind: (args) ->
    parsed = @parseArgs(args)
    for element in parsed.elements
      map = element.upEventListeners
      for eventName in parsed.eventNames
        key = @key(eventName, parsed.selector, parsed.callback)
        if map && (listener = map[key])
          listener.unbind()

  @unbindNonDefault: (element) ->
    if map = element.upEventListeners
      listeners = u.values(map)
      for listener in listeners
        # Calling unbind() also removes the listener from element.upEventListeners
        unless listener.isDefault
          listener.unbind()
