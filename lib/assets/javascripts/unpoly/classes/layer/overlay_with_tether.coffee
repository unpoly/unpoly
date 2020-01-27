#= require ./base
#= require ./overlay

class up.Layer.OverlayWithTether extends up.Layer.Overlay

  openNow: (options) ->
    @createElement()
    @frameInnerContent(@element, options)
    @tether = new up.Tether(
      element: @frameElement
      anchor: @origin
      align: @align
      position: @position
    )
    return @startOpenAnimation(options)

  closeNow: (options) ->
    animation = => @startCloseAnimation(options)
    @destroyElement({ animation }).then =>
      @tether.stop()

  sync: ->
    @tether.sync()
