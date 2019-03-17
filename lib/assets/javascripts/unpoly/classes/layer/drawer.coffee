#= require './base'

class up.Layer.Drawer extends up.Layer.WithViewport

  @flavor: 'drawer'

  @attr: 'up-drawer'

  @config: new up.Config ->
    position: 'left'
    openAnimation: (layer) ->
      switch layer.position
        when 'left' then 'move-from-left'
        when 'right' then 'move-from-right'
    closeAnimation: (layer) ->
      switch layer.position
        when 'left' then 'move-to-left'
        when 'right' then 'move-to-right'
