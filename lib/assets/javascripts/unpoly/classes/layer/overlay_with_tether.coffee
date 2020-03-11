#= require ./base
#= require ./overlay

class up.Layer.OverlayWithTether extends up.Layer.Overlay

  openNow: (options) ->
    # We first construct an un-started Tether object so we can
    # ask for its parent element.
    @tether = new up.Tether(
      anchor: @origin
      align: @align
      position: @position
    )
    @createElement(@tether.parent)
    @createContentElement(@element)
    @setInnerContent(@contentElement, options)
    @tether.start(@element)
    @setupClosing()
    return @startOpenAnimation(options)

  closeNow: (options) ->
    @teardownClosing()
    animation = => @startCloseAnimation(options)
    @destroyElement({ animation }).then =>
      @tether.stop()

  sync: ->
    @tether.sync()
