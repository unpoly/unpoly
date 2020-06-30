#= require ../record

e = up.element
u = up.util

class up.Layer extends up.Record

  keys: ->
    [
      'stack',
      'history',
      'mode',
      'context',
      'origin', # the element that opened this layer
      'lastScrollTops'
    ]

  defaults: ->
    context: {}
    lastScrollTops: new up.Cache(size: 30, key: up.history.normalizeURL)

  constructor: (options = {}) ->
    super(options)

    unless @mode
      throw "missing { mode } option"

  setupHandlers: ->
    up.link.convertClicks(this)

  teardownHandlers: ->
    # no-op for overriding

  defaultTargets: ->
    up.layer.defaultTargets(@mode)

  # no-op so users can blindly sync without knowing the current mode
  sync: ->

  # no-op so users can blindly accept even though they might be on the root layer
  accept: u.asyncNoop

  # no-op so users can blindly dismiss even though they might be on the root layer
  dismiss: u.asyncNoop

  peel: (options) ->
    @stack.peel(this, options)

  evalOption: (option) ->
    u.evalOption(option, this)

  isCurrent: ->
    @stack.isCurrent(this)

  isFront: ->
    @stack.isFront(this)

  isRoot: ->
    @stack.isRoot(this)

  isOverlay: ->
    @stack.isOverlay(this)

  isOpen: ->
    @stack.isOpen(this)

  @getter 'parent', ->
    @stack.parentOf(this)

  @getter 'child', ->
    @stack.childOf(this)

  @getter 'ancestors', ->
    @stack.ancestorsOf(this)

  @getter 'descendants', ->
    @stack.descendantsOf(this)

  @getter 'index', ->
    @stack.indexOf(this)

  getContentElement: ->
    @contentElement || @element

  getBoxElement: ->
    @boxElement || @element

  contains: (element) =>
    # Test that the closest parent is the element and not another layer.
    e.closest(element, up.layer.anySelector()) == @element

  on: (args...) ->
    return @buildEventListenerGroup(args).bind()

  off: (args...) ->
    return @buildEventListenerGroup(args).unbind()

  buildEventListenerGroup: (args) ->
    return up.EventListenerGroup.fromBindArgs(args,
      guard: @containsEventTarget,
      elements: [@element]
    )

  containsEventTarget: (event) =>
    # Since the root layer will receive events emitted on descendant layers
    # we need to manually check whether the event target is contained
    # by this layer.
    @contains(event.target)

  wasHitByMouseEvent: (layer, mouseEvent) ->
    hittableElement = document.elementFromPoint(event.clientX, event.clientY)
    return !hittableElement || @contains(hittableElement)

  buildEventEmitter: (args) ->
    return up.EventEmitter.fromEmitArgs(args, layer: this)

  emit: (args...) ->
    return @buildEventEmitter(args).emit()

  whenEmitted: (args...) ->
    return @buildEventEmitter(args).whenEmitted()

  isOpen: ->
    @stack.isOpen(this)

  isDetached: ->
    e.isDetached(@element)

  saveHistory: ->
    return unless @hasHistory()

    @savedTitle = document.title
    @savedLocation = up.history.location

  restoreHistory: ->
    if @savedLocation
      up.history.push(@savedLocation)
      @savedLocation = null

    if @savedTitle
      document.title = @savedTitle
      @savedTitle = null

  asCurrent: (fn) ->
    @stack.asCurrent(this, fn)

  updateHistory: (options) ->
    # When the layer is opened, the { history } option defines whether the
    # layer enables handling of location and title in general.
    # When updating history, accept { history: false } as a shortcut to
    # neither change { title } nor { location }.
    return if options.history == false

    if title = options.title
      @title = title

    if location = options.location
      @location = location

  updateContext: (options) ->
    if context = options.context
      @context = context

  @accessor 'title',
    get: ->
      if @hasLiveHistory()
        # Allow Unpoly-unaware code to set the document title directly.
        # This will implicitey change the front layer's title.
        document.title
      else
        @savedTitle

    set: (title) ->
      @savedTitle = title

      if @hasLiveHistory()
        document.title = title

  @accessor 'location',
    get: ->
      if @hasLiveHistory()
        # Allow Unpoly-unaware code to use the pushState API directly.
        # This will implicitly change the front layer's location.
        up.history.location
      else
        @savedLocation

    set: (location) ->
      previousLocation = @savedLocation
      location = up.history.normalizeURL(location)

      if previousLocation != location
        @savedLocation = location
        @emit('up:layer:location:changed', { location })

        if @hasLiveHistory()
          up.history.push(location)

  hasHistory: ->
    history = @history

    # If an ancestor layer was opened with the wish to not affect history,
    # this child layer must not affect it either.
    if parent = @parent
      history &= parent.hasHistory()

    history

  hasLiveHistory: ->
    @hasHistory() && @isFront()

  selector: (part) ->
    @constructor.selector(part)

  @selector: (part) ->
    throw up.error.notImplemented()

  toString: ->
    "#{@mode} layer"

  affix: (args...) ->
    e.affix(@getContentElement(), args...)
