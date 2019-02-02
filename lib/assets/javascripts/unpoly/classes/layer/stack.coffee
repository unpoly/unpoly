u = up.util

class up.layer.Stack extends up.Config

  constructor: (blueprintFn) ->
    super(blueprintFn)
    @layers ||= []

  isCurrentRoot: ->
    @layers.length == 1

  size: ->
    @layers.length

  at: (i) ->
    @layers[i]

  remove: (layer) ->
    u.remove(@layers, layer)

  removeDescendants: (layer) ->
    @layers = selfAndAncestors(layer)

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
