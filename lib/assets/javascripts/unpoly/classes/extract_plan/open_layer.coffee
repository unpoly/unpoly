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

    navigateOptions = u.copy(@options)
    # If a { history } option was given, it was meant for the layer, not its initial content.
    # We accept another option { navigateLocation } to set give a location for the initial
    # content.
    navigateOptions.history = navigateOptions.navigateLocation

    onContentAttached = ->
      # Calling up.hello() will compile the new content
      # and emit an up:fragment:inserted event.
      up.hello(newLayerContent, u.only(this, 'origin'))

      # Call updateHistory() with the original options, not the layer.
      @updateHistory(navigateOptions)

    openOptions = u.options(@options, { onContentAttached, content: newLayerContent })
    openOptions.history = openOptions.layerHistory ? openOptions.history
    if openOptions.layerHistory == 'default'
      # Take the default from the layer config
      delete openOptions.history

    throw "up.fragment / processResponse always sets options.history to the URL, overriding any boolean history config of the layer itself"

    return up.layer.open(openOptions)

