u = up.util
e = up.element

class up.EventEmitter extends up.Record

  keys: ->
    [
      'element',
      'event',
      'layer'
      # 'boundary'
    ]

  emit: ->
    @logEmission()
    # destroyBoundary = @createBoundary()
    if @layer
      @layer.asCurrent(=> @dispatchEvent())
    else
      @dispatchEvent()
#    if destroyBoundary
#      destroyBoundary()
#      # Even with a { boundary } we want event listeners bound to document
#      # to receive our event.
#      document.dispatchEvent(@event)
    return @event

  dispatchEvent: ->
    @element.dispatchEvent(@event)

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

    message = u.pluckKey(@event, 'log')

    if u.isArray(message)
      [message, messageArgs...] = message
    else
      messageArgs = []

    name = @event.type

    if u.isString(message)
      up.puts("#{message} (%s (%o))", messageArgs..., name, @event)
    else if message == true
      up.puts('Event %s (%o)', name, @event)

  @fromEmitArgs: (args, emitterOptions) ->
    if args[0].addEventListener
      element = args.shift()
    else if u.isJQuery(args[0])
      element = e.get(args.shift())

    if args[0].preventDefault
      event = args[0]
    else
      eventName = args[0]
      eventProps = args[1] || {}
      element ||= u.pluckKey(eventProps, 'target')
      event = up.event.build(eventName, eventProps)

    element ||= document

    attributes = u.merge({ element, event }, emitterOptions)
    new @(attributes)
