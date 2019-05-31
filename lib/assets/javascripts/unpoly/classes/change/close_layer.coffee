#= require ./removal

u = up.util
e = up.element

class up.Change.CloseLayer extends up.Change.Removal

constructor: (options) ->
  @layer = options.layer
  @lock = options.lock
  @origin = options.origin
  @value = options.value
  @preventable = options.preventable

execute: ->
  up.layer.asap @lock, (lock) =>
    origin = @origin

    if origin && u.isUndefined(value)
      value = e.jsonAttr(origin, @valueAttr)

    eventProps =
      target: @layer.element
      layer: this
      value: value
      origin: origin

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort(preflightLayer: this)

    if up.event.nobodyPrevents(@closeEvent, eventProps) || @preventable == false
      unless @isOpen()
        return Promise.resolve()

      # Also close any child-layers we might have.
      promise = @peel({ lock })

      promise = promise.then =>
        @stack.remove(this, { lock })
        @stack.syncHistory()
        return @closeNow()

      promise = promise.then =>
        # Wait for the callbacks until the closing animation ends,
        # so user-provided code doesn't run too wildly out of order.
        @layer[@closedCallback](eventProps)

        up.emit(@closedEvent, eventProps)

      return promise

    else
      return up.event.abortRejection()
