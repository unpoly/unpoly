#= require ./base
#= require ./overlay

class up.Layer.OverlayWithTether extends up.Layer.Overlay

  open: (options) ->
    @createElement()
    @frameInnerContent(@element, options)
    @tether = new up.Tether(
      element: @frameElement
      anchor: @origin
      align: @align
      position: @position
    )
    return @startOpenAnimation(options)

  close: (options) ->
    animation = => @startCloseAnimation(options)
    @destroyElement({ animation }).then =>
      @tether.stop()

  sync: ->
    @tether.sync()

  startOpenAnimation: (options = {}) ->
    frameAnimation = options.animation ? @evalOption(@openAnimation)
    return up.animate(@frameElement, frameAnimation, @openAnimateOptions())

  startCloseAnimation: (options = {}) ->
    frameAnimation = options.animation ? @evalOption(@closeAnimation)
    up.animate(@frameElement, frameAnimation, @closeAnimateOptions())
