#= require ../record
#= require ../config

e = up.element
u = up.util

class up.Layer extends up.Record

  constructor: (@stack, options) ->
    if u.isGiven(options.closable)
      up.legacy.warn('Layer options { closable } has been renamed to { dismissable }')
      options.dismissable = options.closable

    @flavor = @constructor.flavor or up.fail('Layer flavor must implement a static { flavor } property')

  @keys: ->
    keys = [
      'flavor',
      'context'
    ]
    configKeys = Object.keys(up.layer.config)
    return keys.concat(configKeys)

  @defaults: ->
    u.merge(super.defaults?(), @config)

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

  peel: ->
    @stack.peel(this)
