#= require ./popup

class up.Layer.Popup extends up.Layer.WithTether

  @flavor: 'popup'

  @config: new up.Config ->
    position: 'bottom'
    align: 'left'
