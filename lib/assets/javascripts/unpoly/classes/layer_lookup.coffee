u = up.util
e = up.element

class up.LayerLookup

  constructor: (@stack, args...) ->
    options = u.parseArgIntoOptions(args, 'layer')

    # Options normalization might change `options` relevant to the lookup:
    # (1) It will default { layer } to 'origin' if an { origin } element is given.
    # (2) It will also lookup a string { currentLayer }.
    # (3) It will set the default layer to 'current' if nothing matches.
    if options.normalizeLayerOptions != false
      up.layer.normalizeOptions(options)

    @values = u.splitValues(options.layer)

    @origin = options.origin
    @currentLayer = options.currentLayer || @stack.current

    if u.isString(@currentLayer)
      # The { currentLayer } option may itself be a string like "parent".
      # In this case we look it up using a new up.LayerLookup instance, using
      # up.layer.current as the { currentLayer } for that second lookup.
      recursiveOptions = u.merge(options, currentLayer: @stack.current, normalizeLayerOptions: false)
      @currentLayer = new @constructor(@stack, @currentLayer, recursiveOptions).first()

  originLayer: ->
    if @origin
      @forElement(@origin)

  first: ->
    @all()[0]

  all: ->
    results = u.flatMap @values, (value) => @resolveValue(value)
    results = u.compact(results)
    results = u.uniq(results) if @values.length > 1
    results

  forElement: (element) ->
    element = e.get(element) # unwrap jQuery
    u.find @stack.reversed(), (layer) -> layer.contains(element)

  forIndex: (value) ->
    return @stack[value]

  resolveValue: (value) ->
    if value instanceof up.Layer
      return value

    if u.isNumber(value)
      return @forIndex(value)

    if /^\d+$/.test(value)
      return @forIndex(Number(value))

    if u.isElementish(value)
      return @forElement(value)

    return switch value
      when 'any'
        # Return all layers, but prefer a layer that's either the current
        # layer, or closer to the front.
        u.uniq [@currentLayer, @stack.reversed()...]
      when 'current'
        @currentLayer
      when 'closest'
        @stack.selfAndAncestorsOf(@currentLayer)
      when 'parent'
        @currentLayer.parent
      when 'ancestor', 'ancestors'
        @currentLayer.ancestors
      when 'child'
        @currentLayer.child
      when 'descendant', 'descendants'
        @currentLayer.descendants
      when 'new'
        'new' # pass-through
      when 'root'
        @stack.root
      when 'overlay', 'overlays'
        u.reverse(@stack.overlays)
      when 'front'
        @stack.front
      when 'origin'
        @originLayer() || up.fail("Need { origin } option for { layer: 'origin' }")
      else
        up.fail("Unknown { layer } option: %o", value)
