#= require ./base
#= require ./overlay_with_viewport

class up.Layer.Cover extends up.Layer.OverlayWithViewport

  @flavor: 'cover'

  @attr: 'up-cover'

  # Override the inherited @config property so changing it
  # won't affect the superclass
  @config: new up.Config
