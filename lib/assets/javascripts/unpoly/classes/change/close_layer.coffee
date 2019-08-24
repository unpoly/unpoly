#= require ./removal

u = up.util
e = up.element

class up.Change.CloseLayer extends up.Change.Removal

  constructor: (options) ->
    super(options)
    @layer = up.layer.lookup(options)
    @origin = options.origin
    @value = options.value
    @preventable = options.preventable

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

    eventProps =
      layer: @layer
      value: value
      origin: @origin

    closeEvent = up.event.build(@closeEventName, eventProps)
    closingEvent = up.event.build(@closingEventName, eventProps)
    closedEvent = up.event.build(@closedEventName, eventProps)

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort(preflightLayer: this)

    # TODO: Is up.proxy.abort sync or async?

    @layer[@closeCallbackName]?(closeEvent)
    @layer.emit(closeEvent) # will bubble up to document

    if !closeEvent.defaultPrevented || !@preventable

      unless @layer.isOpen()
        return Promise.resolve()

      # All changes that affect the layer stack should happen sync:

      # Close any child-layers we might have.
      @layer.peel()

      # Remove ourselves from the layer stack.
      @layer.stack.remove(@layer)

      # Restore the history of the parent layer we just uncovered.
      @layer.stack.current.restoreHistory()

      # Emit the "closing" event to indicate that the "close" event was not
      # prevented and the closing animation is about to start.
      @layer[@closingCallbackName]?(closingEvent)
      @layer.emit(closingEvent) # will bubble up to document

      promise = @layer.closeNow()

      promise = promise.then =>
        @layer[@closedCallbackName]?(closedEvent)
        @layer.emit(closedEvent)
        # Since @layer.element is now detached, the event will no longer bubble up to
        # the document where global event listeners can receive it. So we explicitely emit
        # the event a second time on the document.
        up.emit(closedEvent)

      return promise

    else
      return up.event.abortRejection()
