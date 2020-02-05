u = up.util
e = up.element

class up.EventListener extends up.Record

  keys: ->
    [
      'element',
      'eventType',
      'selector',
      'callback',
      'jQuery',
      'guard'
    ]

  constructor: (attributes) ->
    super(attributes)
    @key = @constructor.buildKey(attributes)
    @isDefault = up.framework.isBooting()

  bind: ->
    map = (@element.upEventListeners ||= {})
    if map[@key]
      up.fail('up.on(): The %o callback %o cannot be registered more than once', @eventType, @callback)
    map[@key] = this
    @element.addEventListener(@eventType, @nativeCallback)

  unbind: =>
    if map = @element.upEventListeners
      delete map[@key]
    @element.removeEventListener(@eventType, @nativeCallback)

  nativeCallback: (event) =>
    # 1. Since we're listing on `document`, event.currentTarget is now `document`.
    # 2. event.target is the element that received an event, which might be a
    #    child of `selector`.
    # 3. There is only a single event bubbling up the DOM, so we are only called once.
    element = event.target
    if @selector
      element = e.closest(element, u.evalOption(@selector))

    if @guard && !@guard(event)
      return

    if element
      elementArg = if @jQuery then up.browser.jQuery(element) else element
      args = [event, elementArg]

      # Do not retrieve and parse [up-data] unless the listener function
      # expects a third argument. Note that we must pass data for an argument
      # count of 0, since then the function might take varargs.
      expectedArgCount = @callback.length

      unless expectedArgCount == 1 || expectedArgCount == 2
        data = up.syntax.data(element)
        args.push(data)

      @callback.apply(element, args)

  @fromElement: (attributes) ->
    if map = attributes.element.upEventListeners
      key = @buildKey(attributes)
      return map[key]

  @buildKey: (attributes) ->
    # Give the callback function a numeric identifier so it
    # can become part of the upEventListeners key.
    attributes.callback.upUid ||= u.uid()

    return [
      attributes.eventType,
      attributes.selector,
      attributes.callback.upUid
    ].join('|')

  @unbindNonDefault: (element) ->
    if map = element.upEventListeners
      listeners = u.values(map)
      for listener in listeners
        unless listener.isDefault
          # Calling unbind() also removes the listener from element.upEventListeners
          listener.unbind()
