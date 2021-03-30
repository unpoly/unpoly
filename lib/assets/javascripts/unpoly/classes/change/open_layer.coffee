#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    @target = options.target
    @mode = options.mode
    @origin = options.origin
    @baseLayer = options.baseLayer
    @source = options.source
    @focus = options.focus
    @scroll = options.scroll
    @history = options.history

  preflightProps: ->
    # We assume that the server will respond with our target.
    # Hence this change will always be applicable.

    return {
      # We associate this request to our current layer so up:request events
      # may be emitted on something more specific than the document.
      layer: @baseLayer
      mode: @mode,
      context: @buildLayer().context
      # The target will always exist in the current page, since
      # we're opening a new layer that will match the target.
      target: @target
    }

  bestPreflightSelector: ->
    # We assume that the server will respond with our target.
    return @target

  toString: ->
    "Open \"#{@target}\" in new layer"

  execute: (responseDoc) ->
    if @target == ':none'
      @content = document.createElement('up-none')
    else
      @content = responseDoc.select(@target)

    if !@content || @baseLayer.isClosed()
      throw @notApplicable()

    up.puts('up.render()', "Opening element \"#{@target}\" in new layer")

    @options.title = @improveHistoryValue(@options.title, responseDoc.getTitle())

    @layer = @buildLayer()

    if @emitOpenEvent().defaultPrevented
      # We cannot use @abortWhenLayerClosed() here,
      # because the layer is not even in the stack yet.
      throw up.error.aborted('Open event was prevented')

    # Make sure that the baseLayer layer doesn't already have a child layer.
    # Note that this cannot be prevented with { peel: false }!
    # We don't wait for the peeling to finish.
    @baseLayer.peel()

    # Change the stack sync. Don't wait for peeling to finish.
    up.layer.stack.push(@layer)

    @layer.createElements(@content)
    @layer.setupHandlers()

    # Change history before compilation, so new fragments see the new location.
    @handleHistory() # location event soll hier nicht mehr automatuisch fliegen

    # Remember where the element came from to support up.reload(element).
    @setSource({ newElement: @content, @source })

    # Unwrap <noscript> tags
    responseDoc.finalizeElement(@content)

    # Compile the entire layer, not just the user content.
    # E.g. [up-dismiss] in the layer elements needs to go through a macro.
    up.hello(@layer.element, { @layer, @origin })

    # The server may trigger multiple signals that may cause the layer to close:
    #
    # - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    # - Emit an event with X-Up-Events, to which a listener may close the layer
    # - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    #   will close the layer.
    #
    # Note that @handleLayerChangeRequests() also calls throws an up.error.aborted
    # if any of these options cause the layer to close.
    @handleLayerChangeRequests()

    # Don't wait for the open animation to finish.
    # Otherwise a popup would start to open and only reveal itself after the animation.
    @handleScroll()

    @layer.startOpenAnimation().then =>
      # A11Y: Place the focus on the overlay element and setup a focus circle.
      # However, don't change focus if the layer has been closed while the animation was running.
      if @layer.isOpen()
        @handleFocus()

      # Run callbacks for callers that need to know when animations are done.
      @onFinished()

    # Emit up:layer:opened to indicate that the layer was opened successfully.
    # This is a good time for listeners to manipulate the overlay optics.
    @layer.opening = false
    @emitOpenedEvent()

    # In case a listener to up:layer:opened immediately dimisses the new layer,
    # reject the promise returned by up.layer.open().
    @abortWhenLayerClosed()

    # Resolve the promise with the layer instance, so callers can do:
    #
    #     layer = await up.layer.open(...)
    #
    # Don't wait to animations to finish:
    return @layer

  buildLayer: ->
    # We build the layer with the default { history } setting from config.mode.history.
    # Both this change's options and the layer mode defaults can set { history: 'auto' } and
    # must be resolved to a boolean. This is done in @resolveAutoHistoryForLayer().
    return up.layer.build(u.merge(@options, history: undefined, opening: true))

  resolveAutoHistoryForLayer: ->
    # Both this change's options and the layer mode defaults can set { history: 'auto' }.
    # We use the table below to resolve this to either true or false:
    #
    # | options.history | config.mode.history | layer has history?                         |
    # |-----------------|---------------------|--------------------------------------------|
    # | auto            | auto                | iff initial content is auto-history target |
    # | auto            | true                | yes                                        |
    # | auto            | false               | no                                         |
    # | true            | *                   | yes                                        |
    # | false           | *                   | no                                         |
    changeHistory = @history
    defaultHistory = @layer.history

    if u.isBoolean(changeHistory)
      # If up.layer.open() was called with a boolean { history } option,
      # we will use that option regardless of the mode default.
      @layer.history = changeHistory

    else if changeHistory == 'auto' && defaultHistory == 'auto'
      # Enable history IFF @content matches an auto-history target.
      unless @layer.history = u.evalOption(up.fragment.config.autoHistory, @content)
        up.puts('up.layer.open()', "Opening layer without history as up.fragment.config.autoHistory(fragment) returned false")

    else
      # Keep the boolean value already in layer.history (set by config.mode.history).
      # This empty else-branch will be removed by the minifier.

  handleHistory: ->
    @resolveAutoHistoryForLayer()

    @layer.parent.saveHistory()

    # options.history dictates whether or not the overlay renders history to the address bar.
    # Even if the layer has a { history: false } property we want to set the initial
    # layer.location to the fragment to support .up-current.
    @layer.updateHistory(u.merge(@options, history: true))

  handleFocus: ->
    @baseLayer.overlayFocus?.moveToBack()
    @layer.overlayFocus.moveToFront()

    fragmentFocus = new up.FragmentFocus(
      fragment: @content,
      layer: @layer,
      autoMeans: ['autofocus', 'layer'],
    )
    fragmentFocus.process(@focus)

  handleScroll: ->
    scrollingOptions = u.merge(@options, {
      fragment: @content,
      layer: @layer,
      autoMeans: ['hash', 'layer']
    })
    scrolling = new up.FragmentScrolling(scrollingOptions)
    return scrolling.process(@scroll)

  buildEvent: (name) =>
    return up.event.build(name,
      layer: @layer
      origin: @origin
      log: true
    )

  emitOpenEvent: ->
    # The initial up:layer:open event is emitted on the document, since the layer
    # element has not been attached yet and there is no obvious element it should
    # be emitted on. We don't want to emit it on @layer.parent.element since users
    # might confuse this with the event for @layer.parent itself opening.
    #
    # There is no @layer.onOpen() handler to accompany the DOM event.
    return up.emit(
      @buildEvent('up:layer:open'),
      baseLayer: @layer.parent, # sets up.layer.current
      log: "Opening new #{@layer}"
    )

  emitOpenedEvent: ->
    return @layer.emit(
      @buildEvent('up:layer:opened'),
      callback: @layer.callback('onOpened'),
      log: "Opened new #{@layer}"
    )
