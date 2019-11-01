#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    # Plan#target is required by FromContent#firstDefaultTarget
    @target = options.target
    @source = options.source
    @origin = options.origin
    @currentLayer = options.currentLayer

  preflightLayer: ->
    'new'

  preflightTarget: ->
    # The target will always exist in the current page, since
    # we're opening a new layer that will always match the target.
    @target

  execute: ->
    # Selecting the content needs to happen sync, since our caller
    # might want catch up.Change.NOT_APPLICABLE.
    @content = @responseDoc.select(@target) or @notApplicable()

    unless @currentLayer.isOpen()
      @notApplicable('Could not open %o in new layer: Parent layer was closed', @target)

    @layer = up.layer.build(@options)

    unless @emitOpenEvent().defaultPrevented
      # Make sure that the ground layer doesn't already have a child layer.
      @currentLayer.peel()

      # Change the stack sync. Don't wait for peeling to finish.
      up.layer.push(@layer)
      promise = @layer.openNow({ @content, @onContentAttached })

      promise = promise.then =>
        @emitOpenedEvent()

        # don't delay `promise` until layer change requests have finished closing
        @handleLayerChangeRequests()

        # Resolve the promise with the layer instance, so callers can do:
        # layer = await up.layer.open(...)
        return @layer
    else
      return up.event.abortRejection()

  handleHistory: ->
    @layer.parent.saveHistory()

    # When the layer is opened, the { history } option defines whether the
    # layer enables handling of location and title in general.
    # When updating history, accept { history: false } as a shortcut to
    # neither change { title } nor { location }.
    historyOptions = u.except(@options, 'history')

    # If we cannot push state for some reason, we prefer disabling history for
    # child layers instead of blowing up the entire stack with a full page load.
    unless up.browser.canPushState()
      historyOptions.history = false

    @layer.updateHistory(historyOptions)

  buildEvent: (name) =>
    return up.event.build(name,
      layer: @layer
      origin: @origin
      log: true
    )

  onContentAttached: =>
    @handleHistory()
    up.fragment.setSource(@content, @source)

    # Event handlers for [up-target] etc. are registered to each layer instead of
    # only once to the document. See https://github.com/unpoly/unpoly/issues/79
    up.layer.applyHandlers(@layer)

    # Compile the new content and emit up:fragment:inserted.
    @responseDoc.activateElement(@content, { @layer, @origin })

    @emitOpeningEvent()

  emitOpenEvent: ->
    # The initial up:layer:open event is emitted on the document, since the layer
    # element has not been attached yet and there is no other element it should be
    # emitted on. We don't want to emit it on @layer.parent.element since developers
    # might confuse this with the event for @layer.parent itself opening.
    #
    # There is no @layer.onOpen() handler to accompany the DOM event.
    return up.emit(@buildEvent('up:layer:open'))

  emitOpeningEvent: ->
    openingEvent = @buildEvent('up:layer:opening')
    @layer.onOpening?(openingEvent)
    return @layer.emit(openingEvent)

  emitOpenedEvent: ->
    openedEvent = @buildEvent('up:layer:opened')
    @layer.emit(openedEvent)
    @layer.onOpened?(openedEvent)
