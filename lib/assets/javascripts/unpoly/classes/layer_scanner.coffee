u = up.util
e = up.element


class TargetSolution
  
  constructor: (@selector, @element) ->
  
  improve: ->
    return new @constructor(e.improveSelector(@selector), @element)

class up.LayerScanner

  constructor: (options) ->
    @layer = options.layer
    @origin = options.origin
    @originLayer = options.originLayer
    @solutionsBySelector = {}
    
  fixSelector: (selector) ->
    selector = e.resolveSelector(selector, @origin)

    # We cannot replace <html> with the current e.replace() implementation.
    if selector == 'html'
      selector = 'body'

    unless @isOriginLayerUpdate()
      selector = selector.replace(/\:(closest-)?zone\b/, ':main')
      
    return selector

  selectAlternatives: (selector) ->
    if solutions = @solutionsBySelector[selector]
      return solutions

    solutions = []

    if selector == ':main'
      for main in @getLayerMains()
        solutions.push(
          oldElement: main.element,
          selector: e.improveSelector(main.selector, main.element) # TODO: improveSelector
        )
    else if selector == ':zone'
      if zone = @getOriginZone()
        solutions.push({
          oldElement: zone.element,
          selector: e.improveSelector(zone.selector, main.element)
        })

    else if match = selector.match(/^\:zone (.+)$/)
      zoneDescendantSelector = match[1]
      if (zone = @originZone()) && (zoneDescendantMatch = up.fragment.get(zone.element, zoneDescendantSelector))
        solutions.push({
          oldElement: zoneDescendantMatch,
          # In this branch the user wants the zone to be part of the selector.
          selector: e.improveSelector(zone.selector, zone.element) + ' ' + e.improveSelector(zoneDescendantMatch, zoneDescendantSelector)
        })

    else if selector == ':closest-zone'
      for zone in @getOriginZones()
        solutions.push({
          oldElement: zone.element,
          selector: e.improveSelector(zone.selector, zone.element)
        })

    else if match = selector.match(/^\:closest-zone (.+)$/)
      for zone in @getOriginZones()
        if zoneDescendantMatch = up.fragment.get(zone.element, zoneDescendantSelector)
          solutions.push({
            oldElement: zoneDescendantMatch,
            # In this branch the user wants the zone to be part of the selector.
            selector: e.improveSelector(zone.selector, zone.element) + ' ' + e.improveSelector(zoneDescendantSelector, zoneDescendantMatch)
          })
    else
      # Now we have a regular selector like ".foo"

      if @isOriginLayerUpdate()
        # If we have an @origin we can be smarter about finding oldElement.
        # First, we check if @origin itself or one of its ancestors would match.
        if closestMatchInLayer = up.fragment.closest(@origin, selector)
          solutions.push({
            oldElement: closestMatchInLayer,
            selector: e.improveSelector(selector, closestMatchInLayer)
          })

        # Now we check if any zone around the element would match.
        for zone in @getOriginZones()
          if matchInZone = up.fragment.subtree(zone.element, selector)[0]
            solutions.push({
              oldElement: matchInZone,
              selector: e.improveSelector(selector, matchInZone)
            })

      if firstMatchInLayer = up.fragment.get(selector, { @layer })
        solutions.push({
          oldElement: firstMatchInLayer,
          selector: e.improveSelector(selector, firstMatchInLayer)
        })

    if @layer.isOverlay()
      solutions = u.reject solutions, (alternative) -> up.fragment.targetsBody(alternative.oldElement)

    @solutionsBySelector[selector] = solutions

    return solutions

  isOriginLayerUpdate: ->
    # originLayer was set by up.Change.FromContent.
    return @layer == @originLayer

  getLayerMains: ->
    unless @layerMains
      @layerMains = []

      for selector in @layer.defaultTargets() # TODO: Rename config.xxx.targets to config.xxx.mains, or mainSelectors
        # Select all mains in the configured order.
        # Note that if we would run a single select on mainSelectors.join(','),
        # the main closest to the root would be matched first. We wouldn't want this
        # if the user has configured e.g. ['.content', 'body'].
        if element = up.fragment.get(selector, { @layer })
          @layerMains.push({ selector, element })

    return @layerMains

  getOriginZone: ->
    return @originZones()[0]

  getOriginZones: ->
    if @origin && !@originZones
      @originZones = @getClosestOriginZones(@origin)
      @originZones.push(@getLayerMains()...)
      @originZones = u.uniqBy(@originZones, 'element')

    return @originZones

  getClosestOriginZones: (element) ->
    zones = []

    if selector = u.find(up.fragment.config.zones, (s) -> e.matches(element, s))
      zones.push({ element, selector })

    if !e.matches(element, up.layer.anySelector()) && (parent = element.parentElement)
      zones.push(@getClosestOriginZones(parent)...)

    return zones
