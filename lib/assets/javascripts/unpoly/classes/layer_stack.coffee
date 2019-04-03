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

  size: ->
    @layers.length

  at: (i) ->
    @layers[i]

  remove: (layer) ->
    u.remove(@layers, layer)

  reset: ->
    super()
    @queue.reset()
    if c = @container()
      e.remove(c)

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

  allReversed: ->
    u.reverse(@all())

  current: ->
    u.last(@layers)

  container: ->
    e.first(CONTAINER_SELECTOR) || e.affix(document.body, CONTAINER_SELECTOR)

  lookupOne: (args...) ->
    @lookupAll(args...)[0]

  lookupAll: (options) ->
    value = options.layer

    unless value
      return [@current()]

    if value instanceof up.Layer
      return [value]

    if u.isElement(value) || u.isJQuery(value)
      return [@forElement(value)]

    givenOriginLayer = ->
      if origin = nameOrOptions.origin
        @forElement(origin)
      else
        up.fail('Updating layer %s requires { origin } option', value)

    return switch value
      when 'root'
        [@root()]
      when 'page'
        up.legacy.warn('Layer "page" has been renamed to "root"')
        [@root()]
      when 'current'
        [@current()]
      when 'any'
        @allReversed()
      when 'origin'
        [givenOriginLayer()]
      when 'parent'
        [@parent(givenOriginLayer())]
      when 'ancestors'
        @ancestors(givenOriginLayer())
      when 'closest'
        @selfAndAncestors(givenOriginLayer())

  forElement: (element) ->
    element = e.get(element)

    for layer in @allReversed()
      if layer.contains(element)
        return element

  peel: ->
    ancestors = u.reverse(@ancestors(this))
    dismissals = ancestors.map (ancestor) -> ancestor.dismiss(emitEvents: false)
    return @asap(dismissals...)
