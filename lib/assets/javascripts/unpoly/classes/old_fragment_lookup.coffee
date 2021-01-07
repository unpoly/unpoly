DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

class up.OldFragmentLookup

  constructor: (options) ->
    @origin = options.origin
    @selector = options.selector
    @layer = options.layer
    @layerOption = { @layer }

  find: ->
    @findClosest() || @findInVicinity() || @findInLayer()

  findClosest: ->
    return @origin && up.fragment.closest(@origin, @selector, @layerOption)

  findInVicinity: ->
    if @origin && (parts = @selector.match(DESCENDANT_SELECTOR))
      if parent = up.fragment.closest(@origin, parts[1], @layerOption)
        return up.fragment.get(parent, parts[2])

  findInLayer: ->
    return up.fragment.get(@selector, @layerOption)
