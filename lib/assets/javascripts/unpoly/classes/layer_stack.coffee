u = up.util
e = up.element

class up.LayerStack extends up.Class

  constructor: ->
    @initialize()

  initialize: ->
    @currentOverrides = []

    # We must initialize @layers before building the root layer, since building a layer
    # will attempt to push it into @layers, which would be undefined.
    @layers = []
    @layers.push(@buildRoot())

  buildRoot: ->
    return up.layer.build(mode: 'root', stack: this)

  at: (i) ->
    @layers[i]

  remove: (layer) ->
    u.remove(@layers, layer)

  push: (layer) ->
    @layers.push(layer)

  peel: (layer, options) ->
    # We will dismiss descendants closer to the front first to prevent
    # recursive calls of peel().
    descendants = u.reverse(layer.descendants)

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

  atIndex: (index) ->
    @layers[index]

  isOpen: (layer) ->
    layer.index >= 0

  parentOf: (layer) ->
    @layers[layer.index - 1]

  childOf: (layer) ->
    @layers[layer.index + 1]

  ancestorsOf: (layer) ->
    # Return closest ancestors first
    u.reverse(@layers.slice(0, layer.index))

  selfAndAncestorsOf: (layer) ->
    # Order for layer.closest()
    [layer, layer.ancestors...]

  descendantsOf: (layer) ->
    @layers.slice(layer.index + 1)

  @getter 'root', ->
    @layers[0]

  isRoot: (layer) ->
    @layers[0] == layer

  @getter 'overlays', ->
    @root.descendants

  isOverlay: (layer) ->
    !@isRoot(layer)

  @getter 'current', ->
    # Event listeners and compilers will push into @currentOverrides
    # to temporarily set up.layer.current to the layer they operate in.
    u.last(@currentOverrides) || @front

  isCurrent: (layer) ->
    @current == layer

  @getter 'front', ->
    u.last(@layers)

  isFront: (layer) ->
    @front == layer

  @getter 'reversedLayers', ->
    u.reverse(@layers)

  get: (args...) ->
    new up.LayerLookup(this, args...).first()

  all: (args...) ->
    if args.length == 0
      @layers
    else
      new up.LayerLookup(this, args...).all()

  asCurrent: (layer, fn) ->
    try
      @currentOverrides.push(layer)
      return fn()
    finally
      @currentOverrides.pop()
