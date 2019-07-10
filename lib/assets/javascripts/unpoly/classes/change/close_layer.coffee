#= require ./removal

u = up.util
e = up.element

class up.Change.CloseLayer extends up.Change.Removal

  constructor: (options) ->
    super(options)
    @layer = options.layer
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
      target: @layer.element
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
    throw """
      Where should we emit close-related events?"
      - This is really only relevant for global event handlers that are not passed to the open() method
      - We emit open-related events on the parent, so there is some symmetry to also open close-related events there
        - If we reversed this (emit close-related events on the closing layer)
          AND a parent layer is interested in their child closing, it could bind to the newly opened layer.
      - What about an layer that does not want to be dismissed if it has changes?
        - That can use up.on('up:layer:close')
      - Or should up.layer.emit events bubble up the layer hierarchy?
        - That kinda breaks the abstraction that layers are isolated
      - A lot of other options are controlled from the view of the parent layer
      - Or should we nest layer elements for this one reason?
        - Would not be great for accessibility, it's easier to hide individual layers as it is now
        - Would again break isolation
      - At least the closed event needs to be emitted on the parent! Since the layer is no longer there
      - What's your expectation for up.layer.on('up:layer:close', fn) ?
    """
    @layer.parent.emit(closeEvent)

    if !@closeEvent.defaultPrevented || !@preventable
      promise = Promise.resolve()

      unless @isOpen()
        return promise

      promise = promise.then =>
        # Also close any child-layers we might have.
        @layer.peel()
        @stack.remove(@layer)
        @stack.current.restoreHistory()
        @layer[@closingCallbackName]?(closingEvent)
        @layer.parent.emit(closingEvent)
        return @closeNow()

      promise = promise.then =>
        # Wait for the callbacks until the closing animation ends, so events will be
        # fired at the same moment as our promise (or up.layer.ask()) resolves.
        # TODO: Reconsider whether changes should wait for animations to resolve
        @layer[@closedCallbackName](closedEvent)
        @layer.parent.emit(closedEvent)

      return promise

    else
      return up.event.abortRejection()
