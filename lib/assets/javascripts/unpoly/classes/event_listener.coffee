u = up.util
e = up.element

class up.EventListener

  constructor: (props, options) ->
    { @element, @eventNames, @selector, @callback, @key } = props
    { @jQuery } = options
    @isDefault = up.framework.isBooting()

  bind: ->
    @changeSubscription('addEventListener')
    map = (@element.upEventListeners ||= {})
    if map[@key]
      up.fail('up.on(): The %o callback %o cannot be registered more than once', @eventNames, @callback)
    map[@key] = this

  unbind: =>
    @changeSubscription('removeEventListener')
    if map = @element.upEventListeners
      delete map[@key]

  changeSubscription: (method) ->
    for eventName in @eventNames
      @element[method](eventName, @nativeCallback)

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

  @fromBindArgs: (bindArgs, options = {}) ->
    props = @parseArgs(bindArgs)
    new @(props, options)

  ###
  Parses the following arg variants into an object:

  - [element, eventNames, selector, callback]
  - [element, eventNames,           callback]
  - [         eventNames, selector, callback]
  - [         eventNames,           callback]

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

    # The user can pass an element as the first argument.
    # If omitted, the listener will bind to the document.
    if u.isElement(args[0])
      element = args.shift()
    else if u.isJQuery(args[0])
      element = e.get(args.shift())
    else
      element = document

    # Event names are given in all arg variants
    eventNames = u.splitValues(args.shift())
    # eventNames = u.map(eventNames, up.legacy.fixEventName)

    # A selector is given if the user wants to delegate events.
    # It might be undefined.
    selector = args[0]

    # Build a key so up.off() can map an Unpoly callback function to the
    # native event listener that we passed to element.addEventListener()
    key = [eventNames.join(' '), selector, callback.upUid].join('|')

    { element, eventNames, selector, callback, key }

  @fromUnbindArgs: (unbindArgs) ->
    props = @parseArgs(unbindArgs)
    if map = props.element.upEventListeners
      listener = map[props.key]

    listener or u.fail('up.off(): The %o callback %o was never registered through up.on()', props.eventNames, props.callback)

  @unbindNonDefault: (element) ->
    if map = element.upEventListeners
      listeners = u.values(map)
      listeners = u.reject(listeners, 'isDefault')
      for listener in listeners
        # Calling unbind() also removes the listener from element.upEventListeners
        listener.unbind()
