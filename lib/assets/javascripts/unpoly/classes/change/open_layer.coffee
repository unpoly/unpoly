#= require ./addition

u = up.util

class up.Change.OpenLayer extends up.Change.Addition

  preflightLayer: ->
    'new'

  preflightTarget: ->
    # The target will always exist in the current page, since
    # we're opening a new layer that will always match the target.
    @options.target

  execute: ->
    # Selecting the content needs to happen sync, since our caller
    # might want catch up.Change.NOT_APPLICABLE.
    content = @responseDoc.first(@options.target) or @notApplicable()

    return up.layer.asap @options, (lock) =>
      @executeNow(content, lock)

  executeNow: (content, lock) ->
    unless @options.currentLayer.isOpen()
      return up.asyncFail('Could not open %o in new layer: Parent layer was closed', @options.target)

    layer = up.layer.build(@options)

    promise = up.event.whenEmitted('up:layer:open', { layer, log: 'Opening layer' })

    promise = promise.then =>
      # Make sure that the ground layer doesn't already have a child layer.
      @options.currentLayer.peel({ lock })

    promise = promise.then =>
      up.layer.push(layer, { lock })
      layer.openNow({ content, @onContentAttached })

    promise = promise.then =>
      openedEvent = up.emit('up:layer:opened', { layer, log: 'Layer opened' })
      layer.onOpened?(openedEvent)
      @handleLayerChangeRequests()
      # don't delay `promise` until layer change requests have finished closing
      return undefined

    promise

  onContentAttached: (event) =>
    up.fragment.setSource(event.content, @options.source)

    # If we cannot push state for some reason, we prefer disabling history for
    # child layers instead of blowing up the entire stack with a full page load.
    unless up.browser.canPushState()
      @options.history = false

    # Call updateHistory() with the original options so it contains
    # non-layer keys like { title } or { location }
    @updateHistory(@options)

    # Compile the new content and emit up:fragment:inserted.
    @responseDoc.activateElement(content, @options)
