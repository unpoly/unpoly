u = up.util
e = up.element

CONTAINER_SELECTOR = '.up-layers'

class up.LayerStack extends up.Config

  constructor: (blueprintFn) ->
    super(blueprintFn)
    @all ||= []
    @queue = new up.TaskQueue()

  asap: (tasks...) ->
    @queue.asap(tasks...)

  isRoot: (layer = @current()) ->
    @all[0] == layer

  at: (i) ->
    @all[i]

  remove: (layer) ->
    u.remove(@all, layer)

  reset: ->
    super()
    @queue.reset()
    if c = @container()
      e.remove(c)

  push: (layer) ->
    @all.push(layer)

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

  lookupOne: (args...) ->
    @lookupAll(args...)[0]

  lookupAll: (options) ->
    value = options.layer

    unless value
      return [@current]

    if value instanceof up.Layer
      return [value]

    if u.isElement(value) || u.isJQuery(value)
      return [@forElement(value)]

    givenOriginLayer = ->
      if origin = options.origin
        @forElement(origin)
      else
        up.fail('Updating layer %s requires { origin } option', value)

    return switch value
      when 'root'
        [@root()]
      when 'page'
        up.legacy.warn('Layer "page" has been renamed to "root"')
        [@root]
      when 'current'
        [@current]
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

  dismissAll: ->
    @peel(@root)

  peel: ->
    throw "shouldn't peeling also change @all synchronously?"

    ancestors = u.reverse(@ancestors(this))
    dismissals = ancestors.map (ancestor) -> ancestor.dismiss()
    return @asap(dismissals...)
