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

  contains: (element) =>
    # Test that the closest parent is the document and not another layer.
    e.closest(element, '.up-layer, html') == e.root()

  allElements: (selector) ->
    matches = super(selector)
    matches = u.select(matches, @contains)
    return matches
