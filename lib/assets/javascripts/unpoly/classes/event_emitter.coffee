u = up.util
e = up.element

class up.EventEmitter extends up.Record

  keys: ->
    [
      'target',
      'event',
      'base',
      'callback',
      'log',
      # 'boundary'
    ]

  emit: ->
    @logEmission()
    # destroyBoundary = @createBoundary()
    if @base
      @base.asCurrent(=> @dispatchEvent())
    else
      @dispatchEvent()
#    if destroyBoundary
#      destroyBoundary()
#      # Even with a { boundary } we want event listeners bound to document
#      # to receive our event.
#      document.dispatchEvent(@event)
    return @event

  dispatchEvent: ->
    u.wrapArray(@target).forEach (target) => target.dispatchEvent(@event)
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
#      return up.on(@boundary, @eventName, stopEvent)

  logEmission: ->
    return unless up.log.isEnabled()

    message = @log

    if u.isArray(message)
      [message, messageArgs...] = message
    else
      messageArgs = []

    name = @event.type

    if u.isString(message)
      up.puts("#{message} (%s (%o))", messageArgs..., name, @event)
    else if message == true
      up.puts('Event %s (%o)', name, @event)

  @fromEmitArgs: (args, defaults) ->
    options = u.extractOptions(args)

    if u.isElementish(args[0])
      options.target = args.shift()
    else if args[0] instanceof up.Layer
      options.layer = args.shift()

    # Setting a { layer } is a shorthand to (1) emit the event on the layer's
    # element and (2) to set up.layer.current to that layer during emission.
    if options.layer
      layer = up.layer.get(options.layer)
      options.base ?= layer
      options.target ?= layer.element

    # Setting { base } will fix up.layer.current to that layer during emission.
    if options.base
      options.base = up.layer.get(options.base)

    # If no element is given, we emit the event on the document.
    options.target ||= document

    if args[0].preventDefault
      # In this branch we receive an Event object that was already built:
      # up.emit([target], event, [emitOptions])
      options.event = args[0]

    else
      # In this branch we receive an Event name and props object.
      # The props object may also include options for the emission, such as
      # { layer }, { target }, { base } or { log }.
      # up.emit([target], eventName, [eventPropsAndEmitOptions])
      options.event = up.event.build(args[0], u.except(options, 'target'))

    new @(u.merge(defaults, options))
