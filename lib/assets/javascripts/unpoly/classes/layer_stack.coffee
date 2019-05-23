u = up.util
e = up.element

CONTAINER_SELECTOR = '.up-layers'

class up.LayerStack extends up.Config

  constructor: (blueprintFn) ->
    super(blueprintFn)
    @all ||= []
    @queue = new up.TaskQueue2()

  asap: (args...) ->
    @queue.asap(args...)

  isRoot: (layer = @current()) ->
    @all[0] == layer

  at: (i) ->
    @all[i]

  remove: (layer, options) ->
    @asap options, ->
      u.remove(@all, layer)

  push: (layer, options) ->
    @asap options, ->
      @all.push(layer)

  peel: (layer, options = {}) ->
    @asap options, (lock) ->
      promise = Promise.resolve()
      for ancestor in u.reverse(@ancestors(layer))
        promise = promise.then ->
          ancestor.dismiss(preventable: false, { lock })
      return promise

  reset: ->
    super()
    @queue.reset()
    if c = @container()
      e.remove(c)

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

  @getter 'container', ->
    unless @containerElement
      @containerElement = e.createFromSelector(CONTAINER_SELECTOR)
      @attachContainer()
    @containerElement

  syncHistory: ->
    historyLayers = u.filter(@allReversed(), 'history')
    location = u.findResult(historyLayers, 'location')
    title = u.findResult(historyLayers, 'title')
    document.title = title
    # up.history.push() only adds a history entry if we are not already at the given URL
    up.history.push(location)

  attachContainer: ->
    if @containerElement
      document.body.appendChild(@containerElement)

  lookupOne: (options) ->
    new up.LayerLookup(this, options).first()

  lookupAll: (options) ->
    new up.LayerLookup(this, options).all()

  forElement: (element) ->
    element = e.get(element)
    u.find @allReversed(), (layer) ->
      layer.contains(element)

