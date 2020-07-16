u = up.util
e = up.element

class up.EventEmitter extends up.Record

  keys: ->
    [
      'target',
      'event',
      'currentLayer',
      'callback',
      'log',
      'ensureBubbles'
      # 'boundary'
    ]

  emit: ->
    @logEmission()
    # destroyBoundary = @createBoundary()
    if @currentLayer
      @currentLayer.asCurrent(=> @dispatchEvent())
    else
      @dispatchEvent()
#    if destroyBoundary
#      destroyBoundary()
#      # Even with a { boundary } we want event listeners bound to document
#      # to receive our event.
#      document.dispatchEvent(@event)
    return @event

  dispatchEvent: ->
    @target.dispatchEvent(@event)

    if @ensureBubbles && e.isDetached(@target)
      document.dispatchEvent(@event)

    @callback?(@event)

  whenEmitted: ->
    return new Promise (resolve, reject) =>
      event = @emit()
      if event.defaultPrevented
        reject(up.error.aborted("Event #{event.type} was prevented"))
      else
        resolve()

#  createBoundary: ->
#    if @boundary
#      uid = u.uid()
#      @eventProps.upUid = uid
#      stopEvent = (event) ->
#        if event.upUid == uid
#          event.stopPropagation()
#      return up.on(@boundary, @eventType, stopEvent)

  logEmission: ->
    return unless up.log.isEnabled()

    message = @log

    if u.isArray(message)
      [message, messageArgs...] = message
    else
      messageArgs = []

    type = @event.type

    if u.isString(message)
      up.puts(type, message, messageArgs...)
    else if message != false
      up.puts(type, "Event #{type}")

  @fromEmitArgs: (args, defaults = {}) ->
    # Event-emitting functions are crazy overloaded:
    #
    # - up.emit([target], eventType, [eventProps])
    # - up.emit([target], eventPlan) # eventPlan must contain { type } property
    # - up.emit([target], event, [emitDetails]) # emitDetails may contain options like { layer } or { callback }
    #
    # Hence the insane argument parsing logic seen below.
    #
    # We begin by removing an options hash from the end of the argument list.
    # This might be an object of event properties, which might or might contain a
    # { type } property for the event type. In case we are passed a pre-built
    # Event object, the hash will contain emission that options that cannot be
    # carried by the event object, such as { layer } or { callback }.
    options = u.extractOptions(args)

    # Event-emitting functions may instantiate their up.EventEmitter with preconfigured
    # defaults. E.g. up.Layer#emit() will set the default { layer: this }.
    options = u.merge(defaults, options)

    # If we are passed an element or layer as a first argument, this is the event
    # target. We remove it from the argument list and store it in options.
    if u.isElementish(args[0])
      options.target = e.get(args.shift())
    else if args[0] instanceof up.Layer
      options.layer = args.shift()

    # Setting a { layer } is a shorthand to (1) emit the event on the layer's
    # element and (2) to set up.layer.current to that layer during emission.
    if options.layer
      layer = up.layer.get(options.layer)
      options.target ?= layer.element
      options.currentLayer ?= layer

    # Setting { currentLayer } will fix up.layer.current to that layer during emission.
    # In case we get a layer name like 'root' (instead of an up.Layer object) we look
    # up the actual up.Layer object.
    if options.currentLayer
      options.currentLayer = up.layer.get(options.currentLayer)

    if u.isString(options.target)
      options.target = up.fragment.get(options.target, layer: options.layer)
    else if !options.target
      # If no element is given, we emit the event on the document.
      options.target = document

    if args[0]?.preventDefault
      # In this branch we receive an Event object that was already built:
      # up.emit([target], event, [emitOptions])
      options.event = args[0]
      options.log ?= args[0].log
    else if u.isString(args[0])
      # In this branch we receive an Event type and props object.
      # The props object may also include options for the emission, such as
      # { layer }, { target }, { currentLayer } or { log }.
      # up.emit([target], eventType, [eventPropsAndEmitOptions])
      options.event = up.event.build(args[0], options)
    else
      # In this branch we receive an object that contains the event type as a { type } property:
      # up.emit([target, { type: 'foo', prop: 'value' }
      options.event = up.event.build(options)

    new @(options)
