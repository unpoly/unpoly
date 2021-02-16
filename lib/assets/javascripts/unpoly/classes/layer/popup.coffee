#= require ./popup
#= require ./overlay_with_tether

class up.Layer.Popup extends up.Layer.OverlayWithTether

  @mode: 'popup'

  constructor: (options) ->
    super(options)
    @buttonDismissable = false

