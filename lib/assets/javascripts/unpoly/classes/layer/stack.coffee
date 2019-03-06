#= require ./base

u = up.util

class up.Layer.Stack extends up.Config

  constructor: (blueprintFn) ->
    super(blueprintFn)
    @layers ||= []

  isRoot: (layer) ->
    @layers[0] == layer

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
