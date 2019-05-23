#= require ./addition

u = up.util

class up.Change.ResetWorld extends up.Change.Addition

  preflightLayer: ->
    # The root layer always exists.
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
