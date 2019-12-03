#= require ./base

u = up.util
e = up.element

class up.Layer.Root extends up.Layer

  @mode: 'root'

  constructor: (options) ->
    super(options)
    @history = true

  # Always return the current <body> instead of caching it,
  # since the developer might replace it with a new version.
  @getter 'element', ->
    document.body

  allElements: (selector) ->
    matches = e.all(selector)
    # Since our @element also contains all the other layers we need
    # to filter matches to exclude elements that belong to another layer.
    matches = u.filter(matches, @contains)
    return matches
