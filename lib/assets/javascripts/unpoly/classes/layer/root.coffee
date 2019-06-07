#= require ./base

u = up.util
e = up.element

class up.Layer.Root extends up.Layer

  @config: new up.Config ->
    history: true
    dismissable: false

  @flavor: 'root'

  constructor: (stack, options) ->
    super(stack, options)
    @element = e.root
    @location = up.browser.location
    @title = document.title

  allElements: (selector) ->
    matches = e.all(selector)
    # Since our @element also contains all the other layers we need
    # to filter matches to exclude elements that belong to another layer.
    matches = u.select(matches, @contains)
    return matches
