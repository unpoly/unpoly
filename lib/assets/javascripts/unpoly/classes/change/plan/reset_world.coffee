#= require ./base

u = up.util

class up.Change.Plan.ResetWorld extends up.Change.Plan.UpdateLayer

  preflightLayer: ->
    up.layer.root

  constructor: (options) ->
    options = u.merge(options,
      layer: @preflightLayer(),
      target: 'body',
      peel: true
      keep: false
      resetScroll: true
      acceptLayer: undefined
      dismissLayer: undefined
    )
    super(options)
