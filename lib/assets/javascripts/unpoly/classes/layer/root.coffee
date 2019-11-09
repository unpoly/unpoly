#= require ./base

u = up.util
e = up.element

class up.Layer.Root extends up.Layer

  @mode: 'root'

  constructor: (options) ->
    super(options)
    @history = true

  # Always return the current documentElement, since the developer
  # might replace it with a new version.
  @getter 'element', ->
    e.root

#  # Since the developer cannot instantiate the root layer herself and set
#  # the { targets } property, we dynamically retrieve the configured targets
#  # at runtime. We we set it in the constructor it might be reconfigured
#  # by the developer afterwards.
#  @getter 'targets', ->
#    up.layer.config.root.targets

  allElements: (selector) ->
    matches = e.all(selector)
    # Since our @element also contains all the other layers we need
    # to filter matches to exclude elements that belong to another layer.
    matches = u.filter(matches, @contains)
    return matches
