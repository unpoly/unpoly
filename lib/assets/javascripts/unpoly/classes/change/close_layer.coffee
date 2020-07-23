#= require ./removal

u = up.util
e = up.element

class up.Change.CloseLayer extends up.Change.Removal

  constructor: (options) ->
    super(options)

    @verb = options.verb
    @layer = up.layer.get(options)
    @origin = options.origin
    @value = options.value
    @preventable = options.preventable ? true

  execute: ->
    if @origin && u.isUndefined(value)
      value = e.jsonAttr(@origin, "up-#{@verb}")

    unless @layer.isOpen()
      return Promise.resolve()

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort (request) => request.layer == @layer

    if @emitCloseEvent().defaultPrevented && @preventable
      throw up.error.aborted('Close event was prevented')

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

    @handleFocus(parent)

    @layer.teardownHandlers()
    @layer.destroyElements(@options) # this will also pass the { onRemoved } option

    @emitClosedEvent(parent)

    return Promise.resolve()

  emitCloseEvent: ->
    # The close event is emitted on the layer that is about to close.
    return @layer.emit(
      @buildEvent("up:layer:#{@verb}"),
      callback: @layer.callback("on#{u.upperCaseFirst(@verb)}"),
      log: "Will #{@verb} #{@layer}"
    )

  emitClosedEvent: (formerParent) ->
    verbPast = "#{@verb}ed"
    verbPastUpperCaseFirst = u.upperCaseFirst(verbPast)

    # layer.emit({ ensureBubbles: true }) will automatically emit a second event on document
    # because the layer is detached. We do not want to emit it on the parent layer where users
    # might confuse it with an event for the parent layer itself. Since @layer.element
    # is now detached, the event will no longer bubble up to the document where global
    # event listeners can receive it. So we explicitely emit the event a second time
    # on the document.
    return @layer.emit(
      @buildEvent("up:layer:#{verbPast}"),
      # Set up.layer.current to the parent of the closed layer, which is now likely
      # to be the front layer.
      currentLayer: formerParent,
      callback: @layer.callback("on#{verbPastUpperCaseFirst}"),
      ensureBubbles: true,
      log: "#{verbPastUpperCaseFirst} #{@layer}"
    )

  buildEvent: (name) ->
    return up.event.build(name,
      layer: @layer
      value: @value
      origin: @origin
    )

  handleFocus: (formerParent) ->
    # A11Y: Stop trapping focus in the layer that's about to close
    @layer.overlayFocus.teardown()
    # A11Y: Start trapping focus in the parent layer that is being promoted to front.
    formerParent.overlayFocus?.moveToFront()
    # A11Y: Focus the element that originally opened this layer.
    (@layer.origin || formerParent.element).focus(preventScroll: true)
