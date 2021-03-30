u = up.util
e = up.element

class up.LayerLookup

  constructor: (@stack, args...) ->
    options = u.parseArgIntoOptions(args, 'layer')

    # Options normalization might change `options` relevant to the lookup:
    # (1) It will default { layer } to 'origin' if an { origin } element is given.
    # (2) It will also lookup a string { baseLayer }.
    # (3) It will set the default layer to 'current' if nothing matches.
    if options.normalizeLayerOptions != false
      up.layer.normalizeOptions(options)

    @values = u.splitValues(options.layer)

    @origin = options.origin
    @baseLayer = options.baseLayer || @stack.current

    if u.isString(@baseLayer)
      # The { baseLayer } option may itself be a string like "parent".
      # In this case we look it up using a new up.LayerLookup instance, using
      # up.layer.current as the { baseLayer } for that second lookup.
      recursiveOptions = u.merge(options, baseLayer: @stack.current, normalizeLayerOptions: false)
      @baseLayer = new @constructor(@stack, @baseLayer, recursiveOptions).first()

  originLayer: ->
    if @origin
      @forElement(@origin)

  first: ->
    @all()[0]

  all: ->
    results = u.flatMap @values, (value) => @resolveValue(value)
    results = u.compact(results)
    results = u.uniq(results)
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
        [@baseLayer, @stack.reversed()...]
      when 'current'
        @baseLayer
      when 'closest'
        @stack.selfAndAncestorsOf(@baseLayer)
      when 'parent'
        @baseLayer.parent
      when 'ancestor', 'ancestors'
        @baseLayer.ancestors
      when 'child'
        @baseLayer.child
      when 'descendant', 'descendants'
        @baseLayer.descendants
      when 'new'
        'new' # pass-through
      when 'root'
        @stack.root
      when 'overlay', 'overlays'
        u.reverse(@stack.overlays)
      when 'front'
        @stack.front
      when 'origin'
        @originLayer()
      else
        up.fail("Unknown { layer } option: %o", value)
