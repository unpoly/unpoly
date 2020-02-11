#= require ./base
#= require ./overlay

e = up.element

class up.Layer.OverlayWithViewport extends up.Layer.Overlay

  # Since there is only one <body>, we share a single BodyShifter
  # between all overlay instances.
  @bodyShifter: new up.BodyShifter()

  ###**
  @function up.Layer.OverlayWithViewport#openNow
  @param {Element} options.content
  @param {Function} options.onContentAttached
  ###
  openNow: (options) ->
    @createElement()
    # @backdropElement = e.affix(@element, 'up-overlay-backdrop')
    @viewportElement = e.affix(@element, 'up-overlay-viewport')
    @frameInnerContent(@viewportElement, options)

    @shiftBody()
    return @startOpenAnimation(options)

  closeNow: (options) ->
    animation = => @startCloseAnimation(options)
    @destroyElement({ animation }).then =>
      @unshiftBody()

  shiftBody: ->
    @constructor.bodyShifter.shift()

  unshiftBody: ->
    @constructor.bodyShifter.unshift()
