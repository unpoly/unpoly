u = up.util
e = up.element

class up.LayerLookup

  constructor: (@stack, args...) ->
    options = u.parseArgIntoOptions(args, 'layer')
    up.layer.normalizeOptions(options)
    @value = options.layer
    @base = options.base
    @origin = options.origin

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
        u.uniq [@base, @stack.allReversed()...]
      when 'closest'
        @stack.selfAndAncestorsOf(@base)
      when 'current'
        [@base]
      when 'parent'
        u.compact [@stack.parentOf(@base)]
      when 'new'
        ['new'] # pass-through
      when 'root'
        [@stack.root]
      when 'front'
        [@stack.front]
      when 'origin'
        [@originLayer() || up.fail("Need { origin } option for { layer: 'origin' }")]
      when 'ancestor'
        @stack.ancestorsOf(@base)
      else
        up.fail("Unknown { layer } option: %o", @value)

  first: ->
    @all()[0]
