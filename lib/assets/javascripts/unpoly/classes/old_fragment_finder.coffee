DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

class up.OldFragmentFinder

  constructor: (options) ->
    @origin = options.origin
    @selector = options.selector
    @layer = options.layer
    @layerOption = { @layer }

  find: ->
    return @findAroundOrigin() || @findInLayer()

  findAroundOrigin: ->
    if @origin && up.fragment.config.matchAroundOrigin
      return @findClosest() || @findInVicinity()

  findClosest: ->
    return up.fragment.closest(@origin, @selector, @layerOption)

  findInVicinity: ->
    if (parts = @selector.match(DESCENDANT_SELECTOR))
      if parent = up.fragment.closest(@origin, parts[1], @layerOption)
        return up.fragment.get(parent, parts[2])

  findInLayer: ->
    return up.fragment.get(@selector, @layerOption)
