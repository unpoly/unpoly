#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    # Plan#target is required by FromContent#firstDefaultTarget
    @target = options.target
    @source = options.source
    @origin = options.origin
    @base = options.base

  requestAttributes: ->
    return {
      # We associate this request to our base layer. This way other { solo }
      # navigations on { base } will cancel this request to open a new layer.
      layer: @base
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

    unless @base.isOpen()
      throw @notApplicable('Parent layer was closed')

    up.puts("Opening element \"#{@target}\" in new layer")

    @layer = up.layer.build(@options)

    unless @emitOpenEvent().defaultPrevented
      # Make sure that the base layer doesn't already have a child layer.
      # Note that this cannot be prevented with { peel: false }!
      @base.peel()

      # A11Y: User agent should ignore the parent layer.
      @base.setInert(true)

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
      return up.error.aborted.async()

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

    @focus()

    @emitOpeningEvent()

  focus: ->
    # By default we focus the newly created layer, which is an A11Y recommendation.
    @options.focus ?= 'layer'

    # Since we're opening a new layer element, keeping the focus means not
    # changing the focus at all.
    if @options.focus == 'keep'
      @options.focus = false

    up.viewport.scrollAfterInsertFragment(@content, u.merge(@options, { @layer }))

  emitOpenEvent: ->
    # The initial up:layer:open event is emitted on the document, since the layer
    # element has not been attached yet and there is no obvious element it should
    # be emitted on. We don't want to emit it on @layer.parent.element since users
    # might confuse this with the event for @layer.parent itself opening.
    #
    # There is no @layer.onOpen() handler to accompany the DOM event.
    return up.emit(
      @buildEvent('up:layer:open'),
      base: @layer.parent # sets up.layer.current
    )

  emitOpeningEvent: ->
    return @layer.emit(
      @buildEvent('up:layer:opening'),
      callback: @layer.callback('onOpening')
    )

  emitOpenedEvent: ->
    return @layer.emit(
      @buildEvent('up:layer:opened'),
      callback: @layer.callback('onOpened')
    )

