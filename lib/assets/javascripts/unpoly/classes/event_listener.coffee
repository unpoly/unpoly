u = up.util
e = up.element

nextId = 0

class up.EventListener

  constructor: ({ @eventNames, @selector, @callback, @jQuery }) ->
    @id = nextId++

  bind: ->
    if @callback.upEventListener
      up.fail('up.on(): The callback %o cannot be registered more than once', @callback)
    else
      # Allow to retrieve this listener from the @callback function
      # since we need to unbind the same @nativeCallback reference later.
      @callback.upEventListener = this

    @buildNativeCallback()
    e.on(document, @eventNames, @nativeCallback)

  unbind: =>
    e.off(document, @eventNames, @nativeCallback)
    @callback.upEventListener = undefined

  buildNativeCallback: ->
    @nativeCallback = (event) =>
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
    bindArgs = u.copy(bindArgs)

    jQuery = options.jQuery

    eventNames = u.splitValues(bindArgs.shift())
    eventNames = u.map(eventNames, up.legacy.fixEventName)

    callback = bindArgs.pop()
    selector = bindArgs.shift() # might be undefined

    new @({ eventNames, selector, callback, jQuery })

  @fromUnbindArgs: (unbindArgs) ->
    callback = u.last(unbindArgs)
    callback.upEventListener or u.fail('up.off(): The callback %o was never registered through up.on()', callback)
