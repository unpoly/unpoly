#= require ./base

class up.Layer.WithTether extends up.Layer

  create: (parentElement, initialInnerContent, options = {}) ->
    @createElement(parentElement)
    @frameInnerContent(@element, initialInnerContent, options)
    @tether = new up.Tether(
      element: @frameElement
      anchor: @origin
      align: @align
      position: @position
    )
    return @startOpenAnimation(options)

  destroy: (options = {}) ->
    return @startCloseAnimation(options).then =>
      @tether.stop()
      @destroyElement()

  sync: ->
    @tether.sync()

  startOpenAnimation: (options = {}) ->
    frameAnimation = options.animation ? @evalOption(@openAnimation)
    return up.animate(@frameElement, frameAnimation, @openAnimateOptions())

  startCloseAnimation: (options = {}) ->
    frameAnimation = options.animation ? @evalOption(@closeAnimation)
    return up.animate(@frameElement, frameAnimation, @closeAnimateOptions())
