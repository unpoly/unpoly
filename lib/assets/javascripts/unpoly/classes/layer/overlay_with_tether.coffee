#= require ./base
#= require ./overlay

class up.Layer.OverlayWithTether extends up.Layer.Overlay

  openNow: (options) ->
    @createElement()
    @element.classList.add('up-layer-with-tether')
    @frameInnerContent(@element, options)
    @tether = new up.Tether(
      element: @frameElement
      anchor: @origin
      align: @align
      position: @position
    )
    return @startOpenAnimation(options)

  closeNow: (options) ->
    return @startCloseAnimation(options).then =>
      @tether.stop()
      @destroyElement()

  sync: ->
    @tether.sync()

  startOpenAnimation: (options = {}) ->
    frameAnimation = options.animation ? @evalOption(@openAnimation)
    return @withAnimatingClass =>
      return up.animate(@frameElement, frameAnimation, @openAnimateOptions())

  startCloseAnimation: (options = {}) ->
    frameAnimation = options.animation ? @evalOption(@closeAnimation)
    return @withAnimatingClass =>
      return up.animate(@frameElement, frameAnimation, @closeAnimateOptions())
