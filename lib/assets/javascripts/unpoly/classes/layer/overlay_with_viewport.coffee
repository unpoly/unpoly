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
    @createElement(document.body)
    @createBackdropElement(@element) if @backdrop
    @createViewportElement(@element)
    @createBoxElement(@viewportElement)
    @createContentElement(@boxElement)
    @setInnerContent(@contentElement, options)
    @setupClosing()
    @shiftBody()
    return @startOpenAnimation(options)

  closeNow: (options) ->
    @teardownClosing()
    animation = => @startCloseAnimation(options)
    @destroyElement({ animation }).then =>
      @unshiftBody()

  shiftBody: ->
    @constructor.bodyShifter.shift()

  unshiftBody: ->
    @constructor.bodyShifter.unshift()

  repair: ->
    if @isDetached()
      document.body.appendChild(@element)
