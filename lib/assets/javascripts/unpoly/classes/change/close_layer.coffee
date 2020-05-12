#= require ./removal

u = up.util
e = up.element

class up.Change.CloseLayer extends up.Change.Removal

  constructor: (options) ->
    super(options)

    verb = options.verb
    verbGerund = "#{verb}ing"
    verbPast = "#{verb}ed"
    @valueAttr = "up-#{verb}"

    @closeEventType = "up:layer:#{verb}"
    @closeCallbackName = "on#{u.upperCaseFirst(verb)}"

    @closingEventType = "up:layer:#{verbGerund}"
    @closingCallbackName = "on#{u.upperCaseFirst(verbGerund)}"

    @closedEventType = "up:layer:#{verbPast}"
    @closedCallbackName = "on#{u.upperCaseFirst(verbPast)}"

    @layer = up.layer.get(options)
    @origin = options.origin
    @value = options.value
    @preventable = options.preventable ? true

  execute: ->
    if @origin && u.isUndefined(value)
      value = e.jsonAttr(@origin, @valueAttr)

    unless @layer.isOpen()
      return Promise.resolve()

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort (request) => request.layer == @layer

    if !@emitCloseEvent().defaultPrevented || !@preventable
      # Remember the parent, which will no longer be accessible once we
      # remove @layer from the @stack.
      parent = @layer.parent

      # Close any child-layers we might have.
      # We don't wait for peeling to finish, since changes that affect the
      # layer stack should happen sync:
      @layer.peel()

      # Remove ourselves from the layer stack.
      @layer.stack.remove(@layer)

      # Restore the history of the parent layer we just uncovered.
      parent.restoreHistory()

      # Emit the "closing" event to indicate that the "close" event was not
      # prevented and the closing animation is about to start.
      @emitClosingEvent()

      # A11Y: Stop trapping focus in the layer that's about to close
      @layer.overlayFocus.teardown()
      # A11Y: Start trapping focus in the parent layer that is being promoted to front.
      parent.overlayFocus?.moveToFront()
      # A11Y: Focus the element that originally opened this layer.
      (@layer.origin || parent.element).focus()

      promise =  @layer.closeNow(@options)
      promise = promise.then =>
        @emitClosedEvent(parent)

      return promise
    else
      return up.error.aborted.async()

  emitCloseEvent: ->
    return @layer.emit(
      @buildEvent(@closeEventType),
      callback: @layer.callback(@closeCallbackName),
      log: "Will close #{@layer}"
    )

  emitClosingEvent: ->
    return @layer.emit(
      @buildEvent(@closingEventType),
      callback: @layer.callback(@closingCallbackName),
      log: "Closing #{@layer}"
    )

  emitClosedEvent: (formerParent) ->
    # layer.emit({ ensureBubbles: true }) will automatically emit a second event on document
    # because the layer is detached. We do not want to emit it on the parent layer where users
    # might confuse it with an event for the parent layer itself. Since @layer.element
    # is now detached, the event will no longer bubble up to the document where global
    # event listeners can receive it. So we explicitely emit the event a second time
    # on the document.
    return @layer.emit(
      @buildEvent(@closedEventType),
      # Set up.layer.current to the parent of the closed layer, which is now likely
      # to be the front layer.
      currentLayer: formerParent,
      callback: @layer.callback(@closedCallbackName),
      ensureBubbles: true,
      log: "Closed #{@layer}"
    )

  buildEvent: (name) ->
    return up.event.build(name,
      layer: @layer
      value: @value
      origin: @origin
    )