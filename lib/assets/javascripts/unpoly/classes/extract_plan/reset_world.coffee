#= require ./base

u = up.util

class up.ExtractPlan.ResetWorld extends up.ExtractPlan.UpdateLayer

  preflightLayer: ->
    up.layer.root()

  constructor: (options) ->
    options = u.merge(options,
      layer: @preflightLayer(),
      target: 'body',
      peel: true
      keep: false
      resetScroll: true
    )
    super(options)
