u = up.util
e = up.element

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

  selectSolutions: (selector) ->
    if solutions = @solutionsBySelector[selector]
      return solutions

    if selector == ':main'
      solutions = @getLayerMains()

    else if selector == ':zone'
      if zone = @getOriginZone()
        solutions = [zone]

    else if match = selector.match(/^\:zone (.+)$/)
      zoneDescendantSelector = match[1]
      if (zoneSolution = @originZone()) && (zoneDescendantMatch = up.fragment.get(zoneSolution.element, zoneDescendantSelector))
        descendantSolution = new up.TargetSolution(zoneDescendantSelector, zoneDescendantMatch)
        # In this branch the user wants the zone to be part of the selector.
        solutions = [descendantSolution.within(zoneSolution)]

    else if selector == ':closest-zone'
      solutions = @getOriginZones()

    else if match = selector.match(/^\:closest-zone (.+)$/)
      for zoneSolution in @getOriginZones()
        if zoneDescendantMatch = up.fragment.get(zoneSolution.element, zoneDescendantSelector)
          descendantSolution = new up.TargetSolution(zoneDescendantSelector, zoneDescendantMatch)
          # In this branch the user wants the zone to be part of the selector.
          solutions = [descendantSolution.within(zoneSolution)]

    else
      # Now we have a regular selector like ".foo"

      solutions = []

      if @isOriginLayerUpdate()
        # If we have an @origin we can be smarter about finding oldElement.
        # First, we check if @origin itself or one of its ancestors would match.
        if closestMatchInLayer = up.fragment.closest(@origin, selector)
          solutions.push(new up.TargetSolution(selector, closestMatchInLayer))

        # Now we check if any zone around the element would match.
        for zone in @getOriginZones()
          if matchInZone = up.fragment.subtree(zone.element, selector)[0]
            solutions.push(new up.TargetSolution(selector, matchInZone))

      if firstMatchInLayer = up.fragment.get(selector, { @layer })
        solutions.push(new up.TargetSolution(selector, firstMatchInLayer))

        solutions.push({
          element: firstMatchInLayer,
          selector: up.fragment.improveTarget(selector, firstMatchInLayer)
        })

    # Cannot place <body> in an overlay
    if @layer.isOverlay() || @layer == 'new'
      solutions = u.reject solutions, (solution) -> e.isSingleton(solution.element)

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
          @layerMains.push(new up.TargetSolution(selector, element))

    return @layerMains

  getOriginZone: ->
    return @originZones()[0]

  getOriginZones: ->
    if @origin && !@originZones
      @originZones = @getClosestOriginZones(@origin)
      @originZones.push(@getLayerMains()...)
      # @originZones = u.uniqBy(@originZones, 'element')

    return @originZones

  getClosestOriginZones: (element) ->
    solutions = []

    if selector = u.find(up.fragment.config.zones, (s) -> e.matches(element, s))
      solutions.push(new up.TargetSolution(selector, element))

    if !e.matches(element, up.layer.anySelector()) && (parent = element.parentElement)
      solutions.push(@getClosestOriginZones(parent)...)

    return solutions
