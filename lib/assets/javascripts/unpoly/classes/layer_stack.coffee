u = up.util
e = up.element

OVERLAY_CONTAINER_SELECTOR = '.up-overlays'

class up.LayerStack extends up.Class

  constructor: ->
    @resetAll()

  isRoot: (layer = @current()) ->
    @all[0] == layer

  at: (i) ->
    @all[i]

  remove: (layer) ->
    u.remove(@all, layer)

  push: (layer) ->
    @all.push(layer)

  peel: (layer) ->
    for ancestor in u.reverse(@ancestorsOf(layer))
        ancestor.dismiss(preventable: false)

  reset: ->
    @resetAll()

    if c = @_overlayContainer
      e.remove(c)

  resetAll: ->
    @all = []
    @all.push(new up.Layer.Root(this))

  indexOf: (layer) ->
    @all.indexOf(layer)

  isOpen: (layer) ->
    @indexOf(layer) >= 0

  parentOf: (layer) ->
    layerIndex = @indexOf(layer)
    @all[layerIndex - 1]

  selfAndAncestorsOf: (layer) ->
    layerIndex = @indexOf(layer)
    @all.slice(0, layerIndex + 1)

  ancestorsOf: (layer) ->
    layerIndex = @indexOf(layer)
    @all.slice(0, layerIndex)

  allReversed: ->
    u.reverse(@all)

  @getter 'root', ->
    @all[0]

  @getter 'current', ->
    u.last(@all)

  @getter 'parent', ->
    @parentOf(@current)

  @getter 'overlayContainer', ->
    unless @_overlayContainer
      @_overlayContainer = e.createFromSelector(OVERLAY_CONTAINER_SELECTOR)
      @attachOverlayContainer()
    @_overlayContainer

  attachOverlayContainer: ->
    if @_overlayContainer
      document.body.appendChild(@_overlayContainer)

  lookupOne: (args...) ->
    new up.LayerLookup(this, args...).first()

  lookupAll: (args...) ->
    new up.LayerLookup(this, args...).all()

  forElement: (element) ->
    element = e.get(element)
    u.find @allReversed(), (layer) ->
      layer.contains(element)
