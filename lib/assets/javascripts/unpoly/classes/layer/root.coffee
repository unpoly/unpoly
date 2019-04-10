#= require ./base

class up.Layer.Root extends up.Layer

  @config: new up.Config ->
    history: true
    targets: ['body'] # this replaces up.fragment.config.targets
    dismissable: false

  @flavor: 'root'

  constructor: (stack, options) ->
    super(stack, options)
    @element = e.root

  contains: (element) =>
    # Test that the closest parent is the document and not another layer.
    e.closest(element, '.up-layer, html') == @element

  allElements: (selector) ->
    matches = e.all(selector)
    # Since our @element also contains all the other layers we need
    # to filter matches to exclude elements that belong to another layer.
    matches = u.select(matches, @contains)
    return matches
