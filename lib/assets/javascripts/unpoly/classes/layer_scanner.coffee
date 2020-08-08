class up.LayerScanner

  constructor: (options) ->
    @layer = options.layer
    @origin = options.origin
    @originLayer = options.originLayer
    @alternativesBySelector = {}
    
  fixSelector: (selector) ->
    # We cannot replace <html> with the current e.replace() implementation.
    if selector == 'html'
      selector = 'body'

    unless @isOriginLayerUpdate()
      selector = selector.replace(/\:(closest-)?zone\b/, ':main')
      
    return selector

  scan: (selector) ->
    if alternatives = @alternativesBySelector[selector]
      return alternatives

    alternatives = []

    if selector == ':main'
      for main in @getLayerMains()
        alternatives.push(
          oldElement: main,
          selector: e.toSelector(main)
        )
    else if selector == ':zone'
      if zone = @getOriginZone()
        alternatives.push({
          oldElement: zone,
          selector: e.toSelector(zone)
        })

    else if match = selector.match(/^\:zone (.+)$/)
      zoneDescendantSelector = match[1]
      if (zone = @originZone()) && (zoneDescendantMatch = up.fragment.get(zone, zoneDescendantSelector))
        alternatives.push({
          oldElement: zoneDescendantMatch,
          # In this branch the user wants the zone to be part of the selector.
          selector: e.toSelector(zone) + ' ' + e.toSelector(zoneDescendantMatch)
        })

    else if selector == ':closest-zone'
      for zone in @getOriginZones()
        alternatives.push({
          oldElement: zone,
          selector: e.toSelector(zone)
        })

    else if match = selector.match(/^\:closest-zone (.+)$/)
      for zone in @getOriginZones()
        if zoneDescendantMatch = up.fragment.get(zone, zoneDescendantSelector)
          alternatives.push({
            oldElement: zoneDescendantMatch,
            # In this branch the user wants the zone to be part of the selector.
            selector: e.toSelector(zone) + ' ' + e.toSelector(zoneDescendantMatch)
          })
    else
      if @isOriginLayerUpdate()
        # If we have an @origin we can be smarter about finding oldElement.
        # First, we check if @origin itself or one of its ancestors would match.
        if closestMatchInLayer = up.fragment.closest(@origin, selector)
          alternatives.push({
            oldElement: closestMatchInLayer,
            selector: e.toSelector(closestMatchInLayer)
          })

        # Now we check if any zone around the element would match.
        for zone in @getOriginZones()
          if matchInZone = up.fragment.subtree(zone, selector)[0]
            alternatives.push({
              oldElement: matchInZone,
              selector: e.toSelector(matchInZone)
            })
      else if firstMatchInLayer = up.fragment.get(selector, @options)
        alternatives.push({
          oldElement: firstMatchInLayer,
          selector: e.toSelector(firstMatchInLayer)
        })

  if @layer.isOverlay()
    alternatives = u.reject(alternatives, up.fragment.targetsBody)
    
  @alternativesBySelector[selector] = alternatives

  return alternatives

  isOriginLayerUpdate: ->
    # originLayer was set by up.Change.FromContent.
    return @layer == @options.originLayer

  getLayerMains: ->
    unless @layerMains
      mainSelectors = @layer.defaultTargets() # TODO: Rename config.xxx.targets to config.xxx.mains, or mainSelectors

      if @origin
        # If we have an origin we can try closer mains first.
        mainElements = up.fragment.ancestorsWithSelf(@origin, mainSelectors)
      else
        # If we don't have an origin we select all mains in the configured order.
        # Note that if we would run a single select on mainSelectors.join(','),
        # the main closest to the root would be matched first. We wouldn't want this
        # if the user has configured e.g. ['.content', 'body'].
        mainElements = u.flatMap mainSelectors, (mainSelector) => up.fragment.all(mainSelector, @options)

      # We always consider the content element's first child to be a "main".
      mainElements.push(@layer.getFirstContentChildElement())

      @layerMains = u.uniq(mainElements)

    return @layerMains

  getOriginZone: ->
    return @originZones()[0]

  getOriginZones: ->
    if @origin && !@originZones
      zoneSelector = up.fragment.config.zones.join(',')
      zoneElements = up.fragment.ancestorsWithSelf(@origin, zoneSelector)
      zoneElements.push(@getLayerMains()...)
      @originZones = u.uniq(zoneElements)

    return @originZones