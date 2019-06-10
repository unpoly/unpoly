u = up.util
e = up.element

class up.EventEmitter extends up.Record

  keys: ->
    [
      'element',
      'eventName',
      'eventProps',
      'boundary'
    ]

  emit: ->
    @logEmission()
    destroyBoundary = @createBoundary()
    event = @buildEvent()
    @element.dispatchEvent(event)
    destroyBoundary?()
    return event

  createBoundary: ->
    if @boundary
      uid = u.uid()
      @eventProps.upUid = uid
      stopEvent = (event) ->
        if event.upUid == uid
          event.stopPropagation()
      return up.on(@boundary, @eventName, stopEvent)

  buildEvent: ->
    event = document.createEvent('Event')
    event.initEvent(@eventName, true, true) # name, bubbles, cancelable
    u.assign(event, @eventProps)

    # IE11 does not set { defaultPrevented: true } after #preventDefault()
    # was called on a custom event.
    # See discussion here: https://stackoverflow.com/questions/23349191
    if up.browser.isIE11()
      event.preventDefault = ->
        u.getter(event, 'defaultPrevented', get: -> true)

    return event

  logEmission: ->
    return unless up.log.isEnabled()

    message = u.pluckKey(@eventProps, 'log')

    if u.isArray(message)
      [message, messageArgs...] = message
    else
      messageArgs = []

    if u.isString(message)
      if u.isPresent(@eventProps)
        up.puts("#{message} (%s (%o))", messageArgs..., @eventName, @eventProps)
      else
        up.puts("#{message} (%s)", messageArgs..., @eventName)
    else if message == true
      if u.isPresent(@eventProps)
        up.puts('Event %s (%o)', @eventName, @eventProps)
      else
        up.puts('Event %s', @eventName)

  @fromEmitArgs: (args) ->
    if args[0].addEventListener
      element = args.shift()
    else if u.isJQuery(args[0])
      element = e.get(args.shift())

    eventName = args[0]
    eventProps = args[1] || {}

    if elementFromProps = u.pluckKey(eventProps, 'target')
      element = elementFromProps
    element ?= document

    new @({ element, eventName, eventProps })
