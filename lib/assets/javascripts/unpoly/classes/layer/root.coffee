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

  create: ->
    throw new Error('Cannot create another root layer')

  destroy: ->
    throw new Error('Cannot destroy the root layer')

  allElements: (selector) ->
    matches = super(selector)
    matches = u.reject(matches, (match) -> e.closest(match, '.up-layer'))
    return matches
