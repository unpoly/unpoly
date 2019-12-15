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
    up.proxy.abort(layer: this)

    if !@emitCloseEvent().defaultPrevented || !@preventable
      # Remember the parent, which will no longer be accessible once we
      # remove @layer from the @stack.
      parent = @layer.parent

      unless @layer.isOpen()
        return Promise.resolve()

      # Close any child-layers we might have.
      # We don't wait for peeling to finish, since changes that affect the
      # layer stack should happen sync:
      @layer.peel()

      # Remove ourselves from the layer stack.
      @layer.stack.remove(@layer)

      # Restore the history of the parent layer we just uncovered.
      parent.restoreHistory()

      @emitClosingEvent()

      return @layer.closeNow().then(=> @emitClosedEvent(parent))
    else
      return up.event.abortRejection()

  emitCloseEvent: ->
    return @layer.emit(
      @buildEvent(@closeEventName),
      callback: @layer.callback(@closeCallbackName)
    )

  # Emit the "closing" event to indicate that the "close" event was not
  # prevented and the closing animation is about to start.
  emitClosingEvent: ->
    return @layer.emit(
      @buildEvent(@closingEventName),
      callback: @layer.callback(@closingCallbackName)
    )

  emitClosedEvent: (formerParent) ->
    return up.emit(
      @buildEvent(@closedEventName),
      # Emit the "closed" event on the detached layer so listeners bound to that will
      # receive the event. We do not want to emit it on the parent layer where users
      # might confuse it with an event for the parent layer itself. Since @layer.element
      # is now detached, the event will no longer bubble up to the document where global
      # event listeners can receive it. So we explicitely emit the event a second time
      # on the document.
      target: [@layer.element, document],
      # Set up.layer.current to the parent of the closed layer, which is now likely
      # to be the front layer.
      base: formerParent,
      callback: @layer.callback(@closedCallbackName)
    )

  buildEvent: (name) ->
    return up.event.build(name,
      layer: @layer
      value: @value
      origin: @origin
    )