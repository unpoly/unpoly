u = up.util
e = up.element

class up.LayerStack extends Array

  constructor: ->
    super()
    @currentOverrides = []
    @push(@buildRoot())

  buildRoot: ->
    return up.layer.build(mode: 'root', stack: this)

  remove: (layer) ->
    u.remove(this, layer)

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
    @currentOverrides = []
    @root.reset()

  isOpen: (layer) ->
    layer.index >= 0

  isClosed: (layer) ->
    !@isOpen(layer)

  parentOf: (layer) ->
    @[layer.index - 1]

  childOf: (layer) ->
    @[layer.index + 1]

  ancestorsOf: (layer) ->
    # Return closest ancestors first
    u.reverse(@slice(0, layer.index))

  selfAndAncestorsOf: (layer) ->
    # Order for layer.closest()
    [layer, layer.ancestors...]

  descendantsOf: (layer) ->
    @slice(layer.index + 1)

  isRoot: (layer) ->
    @[0] == layer

  isOverlay: (layer) ->
    !@isRoot(layer)

  isCurrent: (layer) ->
    @current == layer

  isFront: (layer) ->
    @front == layer

  get: (args...) ->
    @getAll(args...)[0]

  getAll: (args...) ->
    new up.LayerLookup(this, args...).all()

  sync: ->
    for layer in this
      layer.sync()

  asCurrent: (layer, fn) ->
    try
      @currentOverrides.push(layer)
      return fn()
    finally
      @currentOverrides.pop()

  reversed: ->
    u.reverse(this)

  # Used by up.util.reverse() and specs
  "#{u.copy.key}": ->
    return u.copyArrayLike(this)

  u.getter @prototype, 'root', ->
    @[0]

  u.getter @prototype, 'overlays', ->
    @root.descendants

  u.getter @prototype, 'current', ->
    # Event listeners and compilers will push into @currentOverrides
    # to temporarily set up.layer.current to the layer they operate in.
    u.last(@currentOverrides) || @front

  u.getter @prototype, 'front', ->
    u.last(@)
