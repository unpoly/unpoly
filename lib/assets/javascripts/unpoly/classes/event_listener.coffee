u = up.util
e = up.element

class up.EventListener

  constructor: (props, options) ->
    { @elements, @eventNames, @selector, @callback, @key } = props
    { @jQuery } = options
    @isDefault = up.framework.isBooting()

  bind: ->
    @changeSubscription('addEventListener')
    map = (@elements[0].upEventListeners ||= {})
    if map[@key]
      up.fail('up.on(): The %o callback %o cannot be registered more than once', @eventNames, @callback)
    map[@key] = this

  unbind: =>
    @changeSubscription('removeEventListener')
    if map = @elements[0].upEventListeners
      delete map[@key]

  changeSubscription: (method) ->
    for element in @elements
      for eventName in @eventNames
        element[method](eventName, @nativeCallback)

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

  @parseArgs = (args) ->
    args = u.copy(args)

    elements = [document]

    eventNames = u.splitValues(args.shift())
    eventNames = u.map(eventNames, up.legacy.fixEventName)

    callback = args.pop()
    callback.upUid ||= u.uid()

    selector = args.shift() # might be undefined

    key = [eventNames.join(' '), selector, callback.upUid].join('|')

    { elements, eventNames, selector, callback, key }

  @fromUnbindArgs: (unbindArgs) ->
    props = @parseArgs(unbindArgs)
    if map = props.elements[0].upEventListeners
      listener = map[props.key]

    listener or u.fail('up.off(): The %o callback %o was never registered through up.on()', props.eventNames, props.callback)

  @unbindNonDefault: (element) ->
    if map = element.upEventListeners
      listeners = u.values(map)
      listeners = u.reject(listeners, 'isDefault')
      for listener in listeners
        # this also removes the listener from upEventListeners
        listener.unbind()
