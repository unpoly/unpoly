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

    @values = @parseValues(options.layer)
    @origin = options.origin
    @currentLayer = options.currentLayer || @stack.current

    if u.isString(@currentLayer)
      # The { currentLayer } option may itself be a string like "parent".
      # In this case we look it up using a new up.LayerLookup instance, using
      # up.layer.current as the { currentLayer } for that second lookup.
      recursiveOptions = u.merge(options, currentLayer: @stack.current, normalizeLayerOptions: false)
      @currentLayer = new @constructor(@stack, @currentLayer, recursiveOptions).first()

  parseValues: (givenValues) ->
    if u.isString(givenValues)
      return u.splitValues(givenValues)
    else
      return u.wrapList(givenValues)

  originLayer: ->
    if @origin
      return @ofElement(@origin)

  ofElement: (element) ->
    element = e.get(element) # unwrap jQuery
    u.find @stack.reversed(), (layer) -> layer.contains(element)

  first: ->
    @all()[0]

  all: ->
    results = u.flatMap(@values, @resolveValue.bind(this))
    results = u.uniq(results) if @values.length > 1
    results

  forIndex: (value) ->
    return u.compact [@stack[value]]

  resolveValue: (value) ->
    if value instanceof up.Layer
      return [value]

    if u.isNumber(value)
      return @forIndex(value)

    if value =~ /^\d+$/
      return @forIndex(Number(value))

    if u.isElementish(value)
      return [@ofElement(value)]

    return switch (value || 'any')
      when 'any'
        # Return all layers, but prefer a layer that's either the current
        # layer, or closer to the front.
        u.uniq [@currentLayer, @stack.reversed()...]
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
        up.fail("Unknown { layer } option: %o", value)
