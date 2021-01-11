DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

class up.FragmentFinder

  constructor: (@options) ->
    @origin = @options.origin
    @selector = @options.selector
    @layer = @options.layer

  find: ->
    return @findAroundOrigin() || @findInLayer()

  findAroundOrigin: ->
    if @origin && up.fragment.config.matchAroundOrigin && !up.element.isDetached(@origin)
      return @findClosest() || @findInVicinity()

  findClosest: ->
    return up.fragment.closest(@origin, @selector, @options)

  findInVicinity: ->
    if (parts = @selector.match(DESCENDANT_SELECTOR))
      if parent = up.fragment.closest(@origin, parts[1], @options)
        return up.fragment.first(parent, parts[2])

  findInLayer: ->
    return up.fragment.first(@selector, @options)
