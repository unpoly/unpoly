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

    @closeEventName = "up:layer:#{verb}"
    @closeCallbackName = "on#{u.upperCaseFirst(verb)}"

    @closingEventName = "up:layer:#{verbGerund}"
    @closingCallbackName = "on#{u.upperCaseFirst(verbGerund)}"

    @closedEventName = "up:layer:#{verbPast}"
    @closedCallbackName = "on#{u.upperCaseFirst(verbPast)}"

    @layer = up.layer.get(options)
    @origin = options.origin
    @value = options.value
    @preventable = options.preventable ? true

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

      # A11Y: User agent should un-ignore the parent layer
      parent.setInert(false)

      # A11Y: Focus the element that originally opened this layer.
      (@layer.origin || parent.element).focus()

      # Restore the history of the parent layer we just uncovered.
      parent.restoreHistory()

      # Emit the "closing" event to indicate that the "close" event was not
      # prevented and the closing animation is about to start.
      @emitClosingEvent()

      return @layer.closeNow().then(=> @emitClosedEvent(parent))
    else
      return up.error.aborted.async()

  emitCloseEvent: ->
    return @layer.emit(
      @buildEvent(@closeEventName),
      callback: @layer.callback(@closeCallbackName)
    )

  emitClosingEvent: ->
    return @layer.emit(
      @buildEvent(@closingEventName),
      callback: @layer.callback(@closingCallbackName)
    )

  emitClosedEvent: (formerParent) ->
    # layer.emit({ ensureBubbles: true }) will automatically emit a second event on document
    # because the layer is detached. We do not want to emit it on the parent layer where users
    # might confuse it with an event for the parent layer itself. Since @layer.element
    # is now detached, the event will no longer bubble up to the document where global
    # event listeners can receive it. So we explicitely emit the event a second time
    # on the document.
    return @up.layer.emit(
      @buildEvent(@closedEventName),
      # Set up.layer.current to the parent of the closed layer, which is now likely
      # to be the front layer.
      base: formerParent,
      callback: @layer.callback(@closedCallbackName),
      ensureBubbles: true
    )

  buildEvent: (name) ->
    return up.event.build(name,
      layer: @layer
      value: @value
      origin: @origin
    )