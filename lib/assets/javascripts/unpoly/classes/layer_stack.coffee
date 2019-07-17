u = up.util
e = up.element

OVERLAY_CONTAINER_SELECTOR = '.up-overlays'

class up.LayerStack extends up.Class

  constructor: ->
    @reset()

  isRoot: (layer = @current()) ->
    @layers[0] == layer

  at: (i) ->
    @layers[i]

  remove: (layer) ->
    u.remove(@layers, layer)

  push: (layer) ->
    @layers.push(layer)

  peel: (layer) ->
    for ancestor in u.reverse(@ancestorsOf(layer))
        ancestor.dismiss(preventable: false)

  reset: ->
    up.Layer.OverlayWithViewport.bodyShifter.unshift()

    @resetLayers()

    @currentOverrides = []

    if c = @_overlayContainer
      e.remove(c)

  resetLayers: ->
    @layers = []
    rootLayer = up.layer.build(flavor: 'root', stack: this)
    @layers.push(rootLayer)

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
    @layers.slice(0, layerIndex)

  allReversed: ->
    u.reverse(@layers)

  @getter 'root', ->
    @layers[0]

  @getter 'current', ->
    u.last(@currentOverrides) || @leaf

  @getter 'leaf', ->
    u.last(@layers)

  @getter 'parent', ->
    @parentOf(@current)

  @getter 'overlayContainer', ->
    unless @_overlayContainer
      @_overlayContainer = e.createFromSelector(OVERLAY_CONTAINER_SELECTOR)
      @attachOverlayContainer()
    @_overlayContainer

  ###**
  Attaches the overlay container to the body.

  Also re-attaches the container to the body in case it was detached
  by swapping the body element.
  ###
  attachOverlayContainer: ->
    if @_overlayContainer
      document.body.appendChild(@_overlayContainer)

  lookupOne: (args...) ->
    new up.LayerLookup(this, args...).first()

  lookupAll: (args...) ->
    new up.LayerLookup(this, args...).all()

  of: (element) ->
    element = e.get(element)
    u.find @allReversed(), (layer) ->
      layer.contains(element)

  asCurrent: (layer, fn) ->
    try
      @currentOverrides.push(layer)
      return fn()
    finally
      @currentOverrides.pop()
