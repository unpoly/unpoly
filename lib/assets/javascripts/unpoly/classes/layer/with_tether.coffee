#= require ./base

class up.Layer.WithTether extends up.Layer

  open: (parentElement, initialInnerContent) ->
    @createElement(parentElement)
    @frameInnerContent(@element, initialInnerContent)
    @tether = new up.Tether(
      element: @frameElement
      anchor: @origin
      align: @align
      position: @position
    )
    return @startOpenAnimation()

  close: ->
    return @startCloseAnimation().then =>
      @tether.stop()
      @destroyElement()

  sync: ->
    @tether.sync()

  startOpenAnimation: ->
    return up.animate(@frameElement, @evalOption(@openAnimation), @openAnimateOptions())

  startCloseAnimation: ->
    return up.animate(@frameElement, @evalOption(@closeAnimation), @closeAnimateOptions())
