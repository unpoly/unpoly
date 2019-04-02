u = up.util
e = up.element

CONTAINER_SELECTOR = '.up-layers'

class up.LayerStack extends up.Config

  constructor: (blueprintFn) ->
    super(blueprintFn)
    @layers ||= []
    @queue = new up.TaskQueue()

  asap: (tasks...) ->
    @queue.asap(tasks...)

  isRoot: (layer) ->
    @layers[0] == layer

#  isCurrentRoot: ->
#    @layers.length == 1

  size: ->
    @layers.length

  at: (i) ->
    @layers[i]

  remove: (layer) ->
    u.remove(@layers, layer)

  reset: ->
    @queue.reset()
    if c = @container()
      e.remove(c)

#  removeDescendants: (layer) ->
#    @layers = selfAndAncestors(layer)

  push: (layer) ->
    @layers.push(layer)

  root: ->
    @layers[0]

  parent: (layer) ->
    layerIndex = @indexOf(layer)
    @layers[layerIndex - 1]

  selfAndAncestors: (layer) ->
    layerIndex = @indexOf(layer)
    @layers.slice(0, layerIndex + 1)

  ancestors: (layer) ->
    layerIndex = @indexOf(layer)
    @layers.slice(0, layerIndex)

  all: ->
    @layers

  current: ->
    u.last(@layers)

  container: ->
    e.first(CONTAINER_SELECTOR) || e.affix(document.body, CONTAINER_SELECTOR)
