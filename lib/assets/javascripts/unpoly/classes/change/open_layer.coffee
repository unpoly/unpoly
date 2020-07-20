#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    # Plan#target is required by FromContent#firstDefaultTarget
    @target = options.target
    @source = options.source
    @origin = options.origin
    @focus = options.focus
    @currentLayer = options.currentLayer

  requestAttributes: ->
    return {
      # We associate this request to our current layer. This way other { solo }
      # navigations on { currentLayer } will cancel this request to open a new layer.
      layer: @currentLayer
      mode: @options.mode,
      context: @options.context
      # The target will always exist in the current page, since
      # we're opening a new layer that will match the target.
      target: @target,
    }

  toString: ->
    "Open \"#{@target}\" in new layer"

  execute: ->
    if up.fragment.targetsBody(@target)
      throw @notApplicable("Cannot place element \"#{@target}\" in an overlay")

    @content = @responseDoc.select(@target)

    unless @content
      throw @notApplicable("Could not find element \"#{@target}\" in server response")

    if @currentLayer.isClosed()
      throw @notApplicable('Parent layer was closed')

    up.puts('up.render()', "Will open element \"#{@target}\" in new layer")

    @layer = up.layer.build(@options)

    if @emitOpenEvent().defaultPrevented
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

    # Emit up:layer:opening to indicate that the open event was not prevented
    # and the the opening animation is about to start. This is a good time for
    # listeners to manipulate the overlay optics.
    # In case a listener dimisses the opening layer, abort the process.
    @emitOpeningEvent()
    @abortWhenLayerClosed()

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

    return @layer.startOpenAnimation().then =>
      # In case an async operation closed the layer while the opening animation
      # was running, abort the process.
      @abortWhenLayerClosed()

      # A11Y: Place the focus on the overlay element and setup a focus circle.
      @handleFocus()

      # Emit up:layer:opened to indicate that the layer was opened successfully.
      # In case a listener dimisses the opening layer, reject the promise
      # returned by up.layer.open().
      @emitOpenedEvent()
      @abortWhenLayerClosed()

      # Resolve the promise with the layer instance, so callers can do:
      # layer = await up.layer.open(...)
      return @layer

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
      log: "Will open new #{@layer}"
    )

  emitOpeningEvent: ->
    return @layer.emit(
      @buildEvent('up:layer:opening'),
      callback: @layer.callback('onOpening')
      log: "Opening new #{@layer}"
    )

  emitOpenedEvent: ->
    return @layer.emit(
      @buildEvent('up:layer:opened'),
      callback: @layer.callback('onOpened'),
      log: "Opened new #{@layer}"
    )

