#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  constructor: (options) ->
    if u.isGiven(options.closable)
      up.legacy.warn('Layer option { closable } has been renamed to { dismissable }')
      options.dismissable = options.closable

    if u.isGiven(options.flavor)
      up.legacy.warn('Layer option { flavor } has been renamed to { mode }')
      options.mode = options.flavor

    # Allow to whitelist the ways how the overlay will be dismissable,
    # but still allow to enable/disable all ways with { dismissable }.
    options.buttonDismissable ?= options.dismissable
    options.escapeDismissable ?= options.dismissable
    options.outsideDismissable ?= options.dismissable

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
    # we're opening a new layer that will match the target.
    @target

  toString: ->
    "Open \"#{@target}\" in new layer"

  execute: ->
    @content = @responseDoc.select(@target)

    unless @content
      throw @notApplicable("Could not find element \"#{@target}\" in server response")

    unless @currentLayer.isOpen()
      throw @notApplicable('Parent layer was closed')

    up.puts("Opening \"#{@target}\" in new layer")

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
