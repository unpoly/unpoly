#= require './base'

class up.Layer.Drawer extends up.Layer.WithViewport

  @flavor: 'drawer'

  @config: new up.Config ->
    position: 'right'
