u = up.util
e = up.element

class up.LayerStack extends up.Class

  constructor: ->
    @initialize()

  initialize: ->
    @currentOverrides = []
    @layers = []
    @layers.push(@buildRoot())

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

  peel: (layer, options) ->
    # We will dismiss descendants closer to the front first.
    descendants = u.reverse(@descendantsOf(layer))

    # Callers expect the effects of peel() to manipulate the layer stack sync.
    # Because of this we will dismiss alle descendants sync rather than waiting
    # for each descendant to finish its closing animation.
    dismissOptions = u.merge(options, preventable: false)
    dismissDescendant = (descendant) -> descendant.dismiss(null, dismissOptions)
    promises = u.map(descendants, dismissDescendant)

    # In case a caller wants to know when all (concurrent) closing animations
    # have finished, we return a promise.
    Promise.all(promises)

  reset: ->
    @peel(@root, animation: false)
    @initialize()

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
