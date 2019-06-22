#= require ./removal

u = up.util
e = up.element

class up.Change.CloseLayer extends up.Change.Removal

constructor: (options) ->
  super(options)
  @layer = options.layer
  @lock = options.lock
  @origin = options.origin
  @value = options.value
  @preventable = options.preventable

valueAttr: null       # implement in child class
closeEvent: null      # implement in child class
closedEvent: null     # implement in child class
closedCallback: null  # implement in child class

execute: ->
  @asap(@executeNow)

executeNow: (lock) =>
  if @origin && u.isUndefined(value)
    value = e.jsonAttr(@origin, @valueAttr)

  eventProps =
    target: @layer.element
    layer: @layer
    value: value
    origin: @origin
    lock: @lock

  # Abort all pending requests targeting the layer we're now closing.
  up.proxy.abort(preflightLayer: this)

  # TODO: Is up.proxy.abort sync or async?

  if up.event.nobodyPrevents(@closeEvent, eventProps) || @preventable == false
    unless @isOpen()
      return Promise.resolve()

    # Also close any child-layers we might have.
    promise = @peel({ lock })

    promise = promise.then =>
      @stack.remove(this, { lock })

    promise = promise.then =>
      @stack.current.restoreHistory()
      return @closeNow()

    promise = promise.then =>
      # Wait for the callbacks until the closing animation ends,
      # so user-provided code doesn't run too wildly out of order.
      # However, we won't delay our own promise to prevent deadlocking
      # on the layer queue.
      @layer[@closedCallback](eventProps)

      up.emit(@closedEvent, eventProps)

    return promise

  else
    return up.event.abortRejection()
