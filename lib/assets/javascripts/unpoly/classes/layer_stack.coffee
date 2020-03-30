u = up.util
e = up.element

class up.LayerStack extends up.Class

  constructor: ->
    @layers = []
    rootLayer = @buildRoot()
    @layers.push(rootLayer)
    @currentOverrides = []

  buildRoot: ->
    return up.layer.build(mode: 'root', stack: this)

  isRoot: (layer = @current) ->
    @layers[0] == layer

  isOverlay: (layer) ->
    !@isRoot(layer)

  isFront: (layer = @current) ->
    @front == layer

  at: (i) ->
    @layers[i]

  remove: (layer) ->
    u.remove(@layers, layer)

  push: (layer) ->
    @layers.push(layer)

  peel: (layer) ->
    for descendant in @descendantsOf(layer)
      descendant.dismiss(preventable: false)

  reset: ->
    up.Layer.OverlayWithViewport.bodyShifter.reset()
    @overlays.forEach (layer) -> e.remove(layer.element)
    @layers = [@root]
    @currentOverrides = []
    @root.reset()

  indexOf: (layer) ->
    @layers.indexOf(layer)

  isOpen: (layer) ->
    @indexOf(layer) >= 0

  parentOf: (layer) ->
    layerIndex = @indexOf(layer)
    @layers[layerIndex - 1]

  selfAndAncestorsOf: (layer) ->
    layerIndex = @indexOf(layer)
    @layers.slice(0, layerIndex + 1)

  ancestorsOf: (layer) ->
    layerIndex = @indexOf(layer)
    u.reverse(@layers.slice(0, layerIndex))

  descendantsOf: (layer) ->
    layerIndex = @indexOf(layer)
    @layers.slice(layerIndex + 1)

  allReversed: ->
    u.reverse(@layers)

  @getter 'root', ->
    @layers[0]

  @getter 'overlays', ->
    @layers.slice(1)

  @getter 'current', ->
    u.last(@currentOverrides) || @front

  @getter 'front', ->
    u.last(@layers)

  @getter 'parent', ->
    @parentOf(@current)

  get: (args...) ->
    new up.LayerLookup(this, args...).first()

  list: (args...) ->
    new up.LayerLookup(this, args...).all()

  asCurrent: (layer, fn) ->
    try
      @currentOverrides.push(layer)
      return fn()
    finally
      @currentOverrides.pop()
