#= require ../record
#= require ../config

e = up.element
u = up.util

class up.Layer extends up.Record

  constructor: (@stack, options) ->
    if u.isGiven(options.closable)
      up.legacy.warn('Layer options { closable } has been renamed to { dismissable }')
      options.dismissable = options.closable

    super(options)

    # Make sure that we have a new context object for each layer instance.
    # This will end up as the up.layer.context property.
    @context ?= {}

  @defaults: ->
    defaults = @config
    # Reverse-merge @config with the config property of our inheritance
    # chain. We need to do this manually, super() does not help us here.
    if (proto = Object.getPrototypeOf(this)) && proto.defaults
      defaults = u.merge(proto.defaults(), defaults)
    defaults

  @config: new up.Config ->
    history: false
    location: null
    title: null
    origin: null
    position: null
    align: null
    size: null
    class: null
    targets: []
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    openDuration: null
    closeDuration: null
    openEasing: null
    closeEasing: null
    backdropOpenAnimation: 'fade-in'
    backdropCloseAnimation: 'fade-out'
    dismissLabel: '×'
    dismissAriaLabel: 'Dismiss dialog'
    dismissible: true
    onCreated: null
    onAccepted: null
    onDismissed: null
    onContentAttached: null

  isCurrent: ->
    @stack.current() == this

  isRoot: ->
    @stack.isRoot(this)

  defaultTargets: ->
    @constructor.defaults().targets

  sync: ->
    # no-op so users can blindly sync without knowing the current flavor

  accept: ->
    # no-op so users can blindly accept even though they might be on the root layer

  dismiss: ->
    # no-op so users can blindly dismiss even though they might be on the root layer

  peel: ->
    @stack.peel(this)

  evalOption: (option) ->
    u.evalOption(option, this)

  firstElement: (selector) ->
    @allElements(selector)[0]

  updateHistory: (options) ->
    if newTitle = options.title
      @title = newTitle
      @titleChanged()

    if newLocation = options.location
      @location = newLocation
      @locationChanged()

  affectsGlobalHistory: ->
    @history && @isCurrent()

  locationChanged: ->
    if @affectsGlobalHistory()
      up.history.push(@location)

  titleChanged: ->
    if @affectsGlobalHistory()
      document.title = @title
