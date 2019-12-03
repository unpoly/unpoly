u = up.util
e = up.element

class up.LayerLookup

  constructor: (@stack, args...) ->
    options = u.parseArgIntoOptions(args, 'layer')
    @value = options.layer
    @customCurrent = options.base
    @origin = options.origin

  givenCurrentLayer: ->
    @customCurrent || @stack.current

  givenOriginLayer: ->
    if @origin
      return @ofElement(@origin)

  ofElement: (element) ->
    element = e.get(element)
    u.find @stack.allReversed(), (layer) ->
      layer.contains(element)

  givenBaseLayer: ->
    @customCurrent || @givenOriginLayer() || @stack.current

  all: ->
    if !@value
      return [@givenBaseLayer()]

    if @value instanceof up.Layer
      return [@value]

    if u.isElement(@value) || u.isJQuery(@value)
      return [@ofElement(@value)]

    return switch @value
      when 'new'
        ['new'] # pass-through
      when 'root'
        [@stack.root]
      when 'page'
        up.legacy.warn('Layer "page" has been renamed to "root"')
        [@stack.root]
      when 'current'
        [@givenCurrentLayer()]
      when 'leaf'
        [@stack.leaf]
      when 'any'
        # Return all layers, but prefer a layer closer to the leaf.
        @stack.allReversed()
      when 'origin'
        [@givenOriginLayer() || up.fail("Need { origin } option for { layer: 'origin' }")]
      when 'parent'
        u.compact [@stack.parentOf(@givenBaseLayer())]
      when 'ancestor'
        @stack.ancestorsOf(@givenBaseLayer())
      when 'closest'
        @stack.selfAndAncestorsOf(@givenBaseLayer())
      else
        up.fail("Unknown { layer } option: %o", @value)

  first: ->
    @all()[0]
