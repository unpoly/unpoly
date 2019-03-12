#= require ./base

class up.Layer.Root extends up.Layer

  @config: new up.Config ->
    history: true
    targets: ['body'] # this replaces up.fragment.config.targets
    dismissable: false

  @flavor: 'root'

  constructor: (stack, options) ->
    super(stack, options)
    @element = document.documentElement

  open: ->
    throw new Error('Cannot open another root layer')

  close: ->
    throw new Error('Cannot close the root layer')

  allElements: (selector) ->
    matches = super(selector)
    matches = u.reject(matches, (match) -> e.closest(match, '.up-layer'))
    return matches
