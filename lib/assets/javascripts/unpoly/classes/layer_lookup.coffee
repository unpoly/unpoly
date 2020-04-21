u = up.util
e = up.element

class up.LayerLookup

  constructor: (@stack, args...) ->
    options = u.parseArgIntoOptions(args, 'layer')
    if options.normalizeLayerOptions != false
      up.layer.normalizeOptions(options)

    @value = options.layer
    @origin = options.origin
    @currentLayer = options.currentLayer || @originLayer() || @stack.current
    if u.isString(@currentLayer)
      @currentLayer = new @constructor(@stack, @currentLayer, u.merge(options, currentLayer: @stack.current)).first()

  originLayer: ->
    if @origin
      return @ofElement(@origin)

  ofElement: (element) ->
    element = e.get(element)
    u.find @stack.allReversed(), (layer) -> layer.contains(element)

  all: ->
    if @value instanceof up.Layer
      return [@value]

    if u.isElementish(@value)
      return [@ofElement(@value)]

    return switch (@value || 'any')
      when 'any'
        # Return all layers, but prefer a layer that's either the current
        # layer, or closer to the front.
        u.uniq [@currentLayer, @stack.allReversed()...]
      when 'current'
        [@currentLayer]
      when 'closest'
        @stack.selfAndAncestorsOf(@currentLayer)
      when 'parent'
        u.compact [@stack.parentOf(@currentLayer)]
      when 'new'
        ['new'] # pass-through
      when 'root'
        [@stack.root]
      when 'front'
        [@stack.front]
      when 'origin'
        [@originLayer() || up.fail("Need { origin } option for { layer: 'origin' }")]
      when 'ancestor'
        @stack.ancestorsOf(@currentLayer)
      else
        up.fail("Unknown { layer } option: %o", @value)

  first: ->
    @all()[0]
