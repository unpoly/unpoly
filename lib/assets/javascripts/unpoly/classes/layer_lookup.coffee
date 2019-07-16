u = up.util

class up.LayerLookup

  constructor: (@stack, args...) ->
    options = u.parseArgAndOptions(args, 'layer')
    @value = options.layer
    @customCurrent = options.currentLayer
    @origin = options.origin

  givenCurrentLayer: ->
    @customCurrent || @stack.current

  givenOriginLayer: ->
    if @origin
      return @stack.of(@origin)

  givenBaseLayer: ->
    @customCurrent || @givenOriginLayer() || @stack.current

  all: ->
    if !@value
      return [@givenBaseLayer()]

    if @value instanceof up.Layer
      return [@value]

    if u.isElement(@value) || u.isJQuery(@value)
      return [@of(@value)]

    return switch @value
      when 'root'
        [@stack.root]
      when 'page'
        up.legacy.warn('Layer "page" has been renamed to "root"')
        [@stack.root]
      when 'current'
        [@givenCurrentLayer()]
      when 'any'
        @stack.allReversed()
      when 'origin'
        [@givenOriginLayer() || up.fail("Need { origin } option for { layer: 'origin' }")]
      when 'parent'
        [@stack.parentOf(@givenBaseLayer())]
      when 'ancestors'
        @stack.ancestorsOf(@givenBaseLayer())
      when 'closest'
        @stack.selfAndAncestorsOf(@givenBaseLayer())

  first: ->
    @all()[0]
