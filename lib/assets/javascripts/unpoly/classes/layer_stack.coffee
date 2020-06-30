u = up.util
e = up.element

class up.LayerStack extends up.Class

  constructor: ->
    @initialize()

  initialize: ->
    @currentOverrides = []

    # We must initialize @all before building the root layer, since building a layer
    # will attempt to push it into @all, which would be undefined.
    @all = []
    @all.push(@buildRoot())

  buildRoot: ->
    return up.layer.build(mode: 'root', stack: this)

  at: (i) ->
    @all[i]

  remove: (layer) ->
    u.remove(@all, layer)

  push: (layer) ->
    @all.push(layer)

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
    @all.indexOf(layer)

  atIndex: (index) ->
    @all[index]

  isOpen: (layer) ->
    layer.index >= 0

  parentOf: (layer) ->
    @all[layer.index - 1]

  childOf: (layer) ->
    @all[layer.index + 1]

  ancestorsOf: (layer) ->
    # Return closest ancestors first
    u.reverse(@all.slice(0, layer.index))

  selfAndAncestorsOf: (layer) ->
    # Order for layer.closest()
    [layer, layer.ancestors...]

  descendantsOf: (layer) ->
    @all.slice(layer.index + 1)

  @getter 'root', ->
    @all[0]

  isRoot: (layer) ->
    @all[0] == layer

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
    u.last(@all)

  isFront: (layer) ->
    @front == layer

  @getter 'allReversed', ->
    u.reverse(@all)

  get: (args...) ->
    @getAll(args...)[0]

  getAll: (args...) ->
    new up.LayerLookup(this, args...).all()

  sync: ->
    for layer in @all
      layer.sync()

  asCurrent: (layer, fn) ->
    try
      @currentOverrides.push(layer)
      return fn()
    finally
      @currentOverrides.pop()
