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

  closeEvent: null      # implement in child class

  closedEvent: null     # implement in child class

  closedCallback: null  # implement in child class

  execute: ->
    if @origin && u.isUndefined(value)
      value = e.jsonAttr(@origin, @valueAttr)

    eventProps =
      target: @layer.element
      layer: @layer
      value: value
      origin: @origin

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort(preflightLayer: this)

    # TODO: Is up.proxy.abort sync or async?

    if up.event.nobodyPrevents(@closeEvent, eventProps) || @preventable == false
      promise = Promise.resolve()

      unless @isOpen()
        return promise

      # Also close any child-layers we might have.
      promise = promise.then =>
        @layer.peel()
        @stack.remove(@layer)
        @stack.current.restoreHistory()
        return @closeNow()

      promise = promise.then =>
        # Wait for the callbacks until the closing animation ends, so events will be
        # fired at the same moment as our promise (or up.layer.ask()) resolves.
        # TODO: Reconsider whether changes should wait for animations to resolve
        @layer[@closedCallback](eventProps)
        up.emit(@closedEvent, eventProps)

      return promise

    else
      return up.event.abortRejection()
