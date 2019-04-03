#= require ./base

class up.Layer.Modal extends up.Layer.OverlayWithViewport

  @flavor: 'modal'

  @attr: 'up-modal'

# Override the inherited @config property so changing it
# won't affect the superclass
  @config: new up.Config
