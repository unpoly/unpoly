#= require ../record
#= require ../config

e = up.element
u = up.util

class up.Layer extends up.Record

  keys: ->
    [
      'history'
      'flavor',
      'context'
    ]

  defaults: ->
    context: {}

  constructor: (@stack, options = {}) ->
    if u.isGiven(options.closable)
      up.legacy.warn('Layer options { closable } has been renamed to { dismissable }')
      options.dismissable = options.closable

    super(options)

    unless @flavor
      throw "missing { flavor } option"

    # If an ancestor layer was opened with the wish to not affect history,
    # this child layer should not affect it either.
    if parent = @parent
      @history &&= parent.history

#  @defaults: ->
#    return @config

#    defaults = @config
#    # Reverse-merge @config with the config property of our inheritance
#    # chain. We need to do this manually, super() does not help us here.
#    throw "i don't think that even works. there is no way to get the superclass of a JS class"
#    if (proto = Object.getPrototypeOf(this)) && proto.defaults
#      defaults = u.merge(proto.defaults(), defaults)
#    defaults

  isCurrent: ->
    @stack.current == this

  isRoot: ->
    @stack.root == this

  defaultTargets: ->
    up.layer.defaultTargets({ @flavor })

  sync: ->
    # no-op so users can blindly sync without knowing the current flavor

  accept: ->
    # no-op so users can blindly accept even though they might be on the root layer

  dismiss: ->
    # no-op so users can blindly dismiss even though they might be on the root layer

  peel: (options) ->
    @stack.peel(this, options)

  evalOption: (option) ->
    u.evalOption(option, this)

  firstElement: (selector) ->
    @allElements(selector)[0]

  @getter 'parent', ->
    @stack.parentOf(this)

  contains: (element) =>
    # Test that the closest parent is the element and not another layer.
    e.closest(element, '.up-overlay, html') == @element

  on: (args...) ->
    return @buildEventListenerGroup(args).bind()

  off: (args...) ->
    return @buildEventListenerGroup(args).unbind()

  buildEventListenerGroup: (args) ->
    group = up.EventListenerGroup.fromBindArgs(args)
    group.guard = @eventGuard
    group.element = @element
    group

  emit: (args...) ->
    emitter = up.EventEmitter.fromEmitArgs(args)
    emitter.element ?= @element
    emitter.boundary = @element
    return emitter.emit()

  eventGuard: (event) =>
    @contains(event.target)

  isOpen: ->
    @stack.isOpen(this)

  saveHistory: ->
    return unless @history

    @savedTitle = document.title
    @savedLocation = up.history.location

  restoreHistory: ->
    if @savedLocation
      up.history.push(@savedLocation)
      @savedLocation = null

    if @savedTitle
      document.title = @savedTitle
      @savedTitle = null

  updateHistory: (change) ->
    return unless @history

    if @isCurrent()
      if change.location
        up.history.push(change.location)
      if change.title
        document.title = change.title
    else
      # Only if this layer is overshadowed by a child layer, we store location
      # and title for later calls of @restoreHistory().
      if change.location
        @savedLocation = change.location
      if change.title
        @savedTitle = change.title
