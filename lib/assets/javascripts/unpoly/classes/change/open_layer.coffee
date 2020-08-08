#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    @target = options.target
    @mode = options.mode
    @origin = options.origin
    @currentLayer = options.currentLayer
    @source = options.source
    @focus = options.focus

  requestAttributes: ->
    return {
      # We associate this request to our current layer. This way other { solo }
      # navigations on { currentLayer } will cancel this request to open a new layer.
      layer: @currentLayer
      mode: @mode,
      context: @options.context
      # The target will always exist in the current page, since
      # we're opening a new layer that will match the target.
      target: @bestPreflightSelector(),
    }

  bestPreflightSelector: ->
    @getAlternatives()[0]

  toString: ->
    "Open \"#{@target}\" in new layer"

  getAlternatives: ->
    unless @alternatives
      @alternatives = []
      if @target.indexOf(':main') >= 0
        for mainSelector in up.layer.defaultTargets(@mode)
          @alternatives.push(@target.replace(/\:main\b/, mainSelector))
      else
        @alternatives.push(@target)

      # We cannot place <body> in a new overlay
      @alternatives = u.reject(@alternatives, up.fragment.targetsBody)

    unless @alternatives.length
      throw @notApplicable()

    return @alternatives

  execute: ->
    @content = u.findResult(@getAlternatives(), (alternative) => @responseDoc.select(alternative))

    if !@content || @currentLayer.isClosed()
      throw @notApplicable()

    up.puts('up.render()', "Opening element \"#{@target}\" in new layer")

    @layer = up.layer.build(@options)

    if @emitOpenEvent().defaultPrevented
      # We cannot use @abortWhenLayerClosed() here,
      # because the layer is not even in the stack yet.
      throw up.error.aborted('Open event was prevented')

    # Make sure that the currentLayer layer doesn't already have a child layer.
    # Note that this cannot be prevented with { peel: false }!
    # We don't wait for the peeling to finish.
    @currentLayer.peel()

    # If the server has provided an updated { context } object,
    # we set the layer's context to that object.
    @layer.updateContext(@options)

    # Change the stack sync. Don't wait for peeling to finish.
    up.layer.stack.push(@layer)

    @layer.createElements(@content)
    @layer.setupHandlers()

    # Change history before compilation, so new fragments see the new location.
    @handleHistory() # location event soll hier nicht mehr automatuisch fliegen

    # Remember where the content was loaded from, to support up.fragment.reload().
    up.fragment.setSource(@content, @source)

    # Compile the new content and emit up:fragment:inserted.
    @responseDoc.activateElement(@content, { @layer, @origin })

    # The server may trigger multiple signals that may cause the layer to close:
    #
    # - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    # - Emit an event with X-Up-Events, to which a listener may close the layer
    # - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    #   will close the layer.
    #
    # Note that @handleLayerChangeRequests() also calls @abortWhenLayerClosed()
    # if any of these options cause the layer to close.
    @handleLayerChangeRequests()

    @layer.startOpenAnimation().then =>
      # A11Y: Place the focus on the overlay element and setup a focus circle.
      # However, don't change focus if the layer has been closed while the animation was running.
      @handleFocus() if @layer.isOpen()
      @onAppeared()

    # Emit up:layer:opened to indicate that the layer was opened successfully.
    # This is a good time for listeners to manipulate the overlay optics.
    @emitOpenedEvent()

    # In case a listener immediately dimisses the new layer, reject the promise
    # returned by up.layer.open().
    @abortWhenLayerClosed()

    # Resolve the promise with the layer instance, so callers can do:
    # layer = await up.layer.open(...)
    return Promise.resolve(@layer)

  handleHistory: ->
    @layer.parent.saveHistory()

    # When the layer is opened, the { history } option defines whether the
    # layer enables handling of location and title in general.
    # When updating history, accept { history: false } as a shortcut to
    # neither change { title } nor { location }.
    historyOptions = u.omit(@options, ['history'])

    # If we cannot push state for some reason, we prefer disabling history for
    # child layers instead of blowing up the entire stack with a full page load.
    unless up.browser.canPushState()
      historyOptions.history = false

    @layer.updateHistory(historyOptions)

  handleFocus: ->
    @currentLayer.overlayFocus?.moveToBack()
    @layer.overlayFocus.moveToFront()

    fragmentFocus = new up.FragmentFocus(
      target: @content,
      layer: @layer,
      autoMeans: ['autofocus', 'layer']
    )
    fragmentFocus.process(@focus)

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
      currentLayer: @layer.parent, # sets up.layer.current
      log: "Opening new #{@layer}"
    )

  emitOpenedEvent: ->
    return @layer.emit(
      @buildEvent('up:layer:opened'),
      callback: @layer.callback('onOpened'),
      log: "Opened new #{@layer}"
    )

