#= require './base'

class up.Layer.Drawer extends up.Layer.WithViewport

  @flavor: 'drawer'

  @attr: 'up-drawer'

  @config: new up.Config ->
    position: 'right'
