#= require ./base

class up.Layer.Root extends up.Layer

  @config: new up.Config ->
    history: true
    targets: ['body'] # this replaces up.fragment.config.targets
    dismissable: false

  @flavor: 'root'

  constructor: (options) ->
    super(options)
    @element = document.documentElement

  open: ->
    throw new Error('Cannot open another root layer')

  close: ->
    throw new Error('Cannot close the root layer')
