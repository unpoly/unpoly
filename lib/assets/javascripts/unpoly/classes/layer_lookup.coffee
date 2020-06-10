u = up.util
e = up.element

class up.LayerLookup

  constructor: (@stack, args...) ->
    options = u.parseArgIntoOptions(args, 'layer')

    # Options normalization might change `options` relevant to the lookup.
    # In particular it will default { layer } to 'origin' if an { origin } element is given.
    # It will also lookup options.currentLayer.
    if options.normalizeLayerOptions != false
      up.layer.normalizeOptions(options)

    @value = options.layer
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
      return @ofElement(@origin)

  ofElement: (element) ->
    element = e.get(element) # unwrap jQuery
    u.find @stack.allReversed, (layer) -> layer.contains(element)

  first: ->
    @all()[0]

  all: ->
    if @value instanceof up.Layer
      return [@value]

    if u.isNumber(@value)
      console.debug("isNumber: %o", @value)
      return u.compact [@stack.atIndex(@value)]

    if u.isElementish(@value)
      return [@ofElement(@value)]

    return switch (@value || 'any')
      when 'any'
        # Return all layers, but prefer a layer that's either the current
        # layer, or closer to the front.
        u.uniq [@currentLayer, @stack.allReversed...]
      when 'current'
        [@currentLayer]
      when 'closest'
        @stack.selfAndAncestorsOf(@currentLayer)
      when 'parent'
        u.compact [@currentLayer.parent]
      when 'ancestor', 'ancestors'
        @currentLayer.ancestors
      when 'child'
        u.compact [@currentLayer.child]
      when 'descendant', 'descendants'
        @currentLayer.descendants
      when 'new'
        ['new'] # pass-through
      when 'root'
        [@stack.root]
      when 'overlay', 'overlays'
        u.reverse(@stack.overlays)
      when 'front'
        [@stack.front]
      when 'origin'
        [@originLayer() || up.fail("Need { origin } option for { layer: 'origin' }")]
      else
        up.fail("Unknown { layer } option: %o", @value)
