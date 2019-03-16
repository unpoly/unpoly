#= require ./base

u = up.util

class up.ExtractPlan.OpenLayer extends up.ExtractPlan

  preflightLayer: ->
    undefined

  preflightTarget: ->
    # The target will always "exist" in the current page, since
    # we're opening a new layer just for that.
    @options.target

  execute: ->
    newLayerContent = @responseDoc.selectForInsertion(@options.target) or @notApplicable()
    @setSource(newLayerContent, @options.source)

    historyOptions = u.only(@options, 'history', 'title', 'location')

    onContentAttached = ->
      # Calling up.hello() will compile the new content
      # and emit an up:fragment:inserted event.
      up.hello(newLayerContent, u.only(this, 'origin'))

      # Call updateHistory() with the original options, not the layer.
      @updateHistory(historyOptions)

    openOptions = u.merge(@options, { onContentAttached, content: newLayerContent })

    unless up.browser.canPushState()
      openOptions.history = false

    return up.layer.open(openOptions)

