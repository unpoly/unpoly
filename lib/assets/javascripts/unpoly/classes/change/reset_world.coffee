#= require ./addition

u = up.util

class up.Change.ResetWorld extends up.Change.Addition

  preflightLayer: ->
    # The root layer always exists.
    up.layer.root

  preflightTarget: ->
    @options.target

  constructor: (options) ->
    throw "Do I really want this default step instead of <body> as root's default target?"
    throw "Replace up.layer.config.all with up.layer.config.overlay"
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
