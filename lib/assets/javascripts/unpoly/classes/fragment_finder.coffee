DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

class up.OldFragmentFinder

  constructor: (@options) ->
    @origin = @options.origin
    @selector = @options.selector
    @layer = @options.layer

  find: ->
    # TODO: Should not be named OldFragmentFinder
    return @findAroundOrigin() || @findInLayer()

  findAroundOrigin: ->
    console.log("O is %o", @origin)
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
