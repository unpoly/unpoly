#= require ./removal

u = up.util
e = up.element

class up.Change.CloseLayer extends up.Change.Removal

  constructor: (options) ->
    super(options)
    @layer = up.layer.get(options)
    @origin = options.origin
    @value = options.value
    @preventable = options.preventable ? true

  valueAttr: null       # implement in child class

  closeEventName: null      # implement in child class
  closeCallbackName: null   # implement in child class

  closingEventName: null    # implement in child class
  closingCallbackName: null # implement in child class

  closedEventName: null     # implement in child class
  closedCallbackName: null  # implement in child class

  execute: ->
    if @origin && u.isUndefined(value)
      value = e.jsonAttr(@origin, @valueAttr)

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort(preflightLayer: this)

    if !@emitCloseEvent().defaultPrevented || !@preventable
      unless @layer.isOpen()
        return Promise.resolve()

      # Close any child-layers we might have.
      # We don't wait for peeling to finish, since changes that affect the
      # layer stack should happen sync:
      @layer.peel()

      # Remove ourselves from the layer stack.
      @layer.stack.remove(@layer)

      # Restore the history of the parent layer we just uncovered.
      @layer.stack.current.restoreHistory()

      @emitClosingEvent()

      return @layer.closeNow().then(=> @emitClosedEvent())
    else
      return up.event.abortRejection()

  emitCloseEvent: ->
    closeEvent = @buildEvent(@closeEventName)
    @layer[@closeCallbackName]?(closeEvent)
    return @layer.emit(closeEvent) # will bubble up to document

  emitClosingEvent: ->
    # Emit the "closing" event to indicate that the "close" event was not
    # prevented and the closing animation is about to start.
    @layer[@closingCallbackName]?(closingEvent)
    return @layer.emit(closingEvent) # will bubble up to document

  emitClosedEvent: ->
    closedEvent = @buildEvent(@closedEventName)
    @layer[@closedCallbackName]?(closedEvent)
    @layer.emit(closedEvent)
    # Since @layer.element is now detached, the event will no longer bubble up to
    # the document where global event listeners can receive it. So we explicitely emit
    # the event a second time on the document.
    return up.emit(closedEvent)

  buildEvent: (name) ->
    return up.event.build(name,
      layer: @layer
      value: value
      origin: @origin
    )