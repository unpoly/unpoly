#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  constructor: (options) ->
    super(options)
    @target = options.target
    @source = options.source
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
    @content = @responseDoc.first(@target) or @notApplicable()

    unless @currentLayer.isOpen()
      @notApplicable('Could not open %o in new layer: Parent layer was closed', @target)

    @layer = up.layer.build(@options)

    promise = up.event.whenEmitted('up:layer:open', { layer, log: 'Opening layer' })

    promise = promise.then =>
      # Make sure that the ground layer doesn't already have a child layer.
      @currentLayer.peel()
      # Don't wait for peeling to finish.
      up.layer.push(layer)
      @handleHistory()
      return @layer.openNow({ @content, @onContentAttached })

    promise = promise.then =>
      openedEvent = up.emit('up:layer:opened', { layer, log: 'Layer opened' })
      @layer.onOpened?(openedEvent)
      # don't delay `promise` until layer close callbacks have finished
      @handleLayerChangeRequests()
      # don't delay `promise` until layer change requests have finished closing
      return undefined

    promise

  handleHistory: ->
    @layer.parent.saveHistory()

    # If we cannot push state for some reason, we prefer disabling history for
    # child layers instead of blowing up the entire stack with a full page load.
    unless up.browser.canPushState()
      @options.history = false

    @layer.updateHistory(@options)

  onContentAttached: =>
    up.fragment.setSource(@content, @source)

    # Compile the new content and emit up:fragment:inserted.
    @responseDoc.activateElement(@content, @options)
