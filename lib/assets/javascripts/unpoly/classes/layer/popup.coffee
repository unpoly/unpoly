#= require ./popup
#= require ./overlay_with_tether

class up.Layer.Popup extends up.Layer.OverlayWithTether

  @flavor: 'popup'

  @attr: 'up-popup'

  @config: new up.Config ->
    position: 'bottom'
    align: 'left'
