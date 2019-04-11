u = up.util
e = up.element

CONTAINER_SELECTOR = '.up-layers'

class up.LayerStack extends up.Config

  @ensureOrdered: (fn) ->
    return (args...) ->
      unless @queue.ordered
        up.fail('...')
      return fn.apply(this, args)

  constructor: (blueprintFn) ->
    super(blueprintFn)
    @all ||= []
    @queue = new up.TaskQueue()

  ensureOrdered: ->
    unless @queue.ordered
      up.fail('...')

  asap: (args...) ->
    @queue.asap(args...)

  isRoot: (layer = @current()) ->
    @all[0] == layer

  at: (i) ->
    @all[i]

  remove: (layer) ->
    @ensureOrdered()
    u.remove(@all, layer)

  reset: ->
    super()
    @queue.reset()
    if c = @container()
      e.remove(c)

  push: (layer) ->
    @ensureOrdered()
    @all.push(layer)

  indexOf: (layer) ->
    @all.indexOf(layer)

  isOpen: (layer) ->
    @indexOf(layer) >= 0

  parent: (layer) ->
    layerIndex = @indexOf(layer)
    @all[layerIndex - 1]

  selfAndAncestors: (layer) ->
    layerIndex = @indexOf(layer)
    @all.slice(0, layerIndex + 1)

  ancestors: (layer) ->
    layerIndex = @indexOf(layer)
    @all.slice(0, layerIndex)

  allReversed: ->
    u.reverse(@all())

  @getter 'root', ->
    @all[0]

  @getter 'current', ->
    u.last(@all)

  @getter 'container', ->
    unless @containerElement
      @containerElement = e.createFromSelector(CONTAINER_SELECTOR)
      @attachContainer()
    @containerElement

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

  peel: (layer) ->
    @ensureOrdered()
    promise = Promise.resolve()
    for ancestor in u.reverse(@ancestors(layer))
      promise = u.always promise, ->
        ancestor.dismiss(preventable: false)
    return promise
