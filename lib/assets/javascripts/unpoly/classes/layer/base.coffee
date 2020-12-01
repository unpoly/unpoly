#= require ../record

e = up.element
u = up.util

###**
Each layer has an `up.Layer` instance.

Most functions in the `up.layer` (lowercase) package interact with the [current layer](/up.layer.current).
E.g. `up.layer.dismiss()` is a shortcut for `up.layer.current.dismiss()`.

@class up.Layer
###
class up.Layer extends up.Record

  ###**
  This layer's outmost element.

  \#\#\# Example

      let rootLayer = up.layer.root
      let overlay = await up.layer.open()

      rootLayer.element // returns <body>
      overlay.element   // returns <up-modal>

  @property up.Layer#element
  @return {Element}
  @stable
  ###

  ###**
  This layer's mode which governs its appearance and behavior.

  Available layer modes are:

  - `'root'`
  - `'modal'`
  - `'popup'`
  - `'drawer'`
  - `'cover'`

  @property up.Layer#mode
  @return {string}
  @stable
  ###

  ###**
  Whether fragment updates within this layer will affect browser history and window title.

  @property up.Layer#history
  @return {boolean}
  ###

  ###**
  This layer's context object.

  Think of *context* as [session storage](/https://makandracards.com/makandra/32865), but specific to a [layer](/up.layer)
  rather than specific to an entire browser tab.

  You may access the context object's properties like a regular JavaScript object.

  \#\#\# Example

      let layer = up.layer.current
      layer.context.message = 'Please select a contact'
      console.log(layer.context) // logs "{ message: 'Please select a contact' }"

  \#\#\# Accessing the context from the server

  The context is is sent as an `X-Up-Context` header along with every
  [request](/up.request) to the server. The server may also update the updating
  layer's context by including an `X-Up-Context` header in its response.

  @property up.Layer#context
  @return {Object}
  @stable
  ###

  ###**
  Whether fragment updates within this layer will affect [browser history](/up.history).

  If a layer does not affect history, its desendant layers cannot affect history either.

  @property up.Layer#history
  @return {boolean}
  @stable
  ###

  keys: ->
    [
      'element'
      'stack',
      'history',
      'mode',
      'context',
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

  mainTargets: ->
    up.layer.mainTargets(@mode)

  ###**
  Synchronizes this layer with the rest of the page.

  For instance, a popup overlay will re-calculate its position arounds its anchoring element.

  You only need to call this method after DOM changes unknown to Unpoly have brought
  overlays out of alignment with the resr of the page.

  @function up.Layer#sync
  @experimental
  ###
  sync: ->
    # no-op so users can blindly sync without knowing the current mode

  ###**
  Closes this overlay with an accepting intent, e.g. when a change was confirmed or when a value was selected.

  To dismiss a layer without an accepting intent, use `up.Layer#dismiss()` instead.

  @function up.Layer#accept
  @param {any} value
    The acceptance value that will be passed to `{ onAccepted }` callbacks.
  @param {string|Function(Element, Object)} options.animation
    The [animation](/up.animate) to use for closing this layer.

    Defaults to the close animation configured for this layer mode.
  @param {number} options.duration
    The duration for the close animation in milliseconds.
  @param {number} options.easing
    The [timing function]((http://www.w3.org/TR/css3-transitions/#transition-timing-function))
    that controls the acceleration of the close animation.
  @param {Function} [options.onFinished]
    A callback that will run when the elements have been removed from the DOM.

    If the layer has a close animation, the callback will run after the animation has finished.
  @return {Promise}
    A promise that fulfills when this layer was removed from the [layer stack](/up.layer.stack).

    If the layer has a close animation, the animation will play out *after* the promise fulfills.
  @stable
  ###
  accept: ->
    throw up.error.notImplemented()

  ###**
  Closes this overlay without an accepting intent, e.g. when a "Cancel" button was clicked.

  To close an overlay with an accepting intent, use `up.Layer#accept()` instead.

  @function up.Layer#dismiss
  @param {any} value
    The acceptance value that will be passed to `{ onDismissed }` callbacks.
  @param {Object} options
    See options for `up.Layer#accept()`.
  @return {Promise}
    A promise that fulfills when this layer was removed from the [layer stack](/up.layer.stack).

    If the closing is animated, the animation will play out *after* the promise fulfills.
  @stable
  ###
  dismiss: ->
    throw up.error.notImplemented()

  ###**
  [Dismisses](/up.Layer#dismiss) all descendant overlays,
  making this layer the [frontmost layer](/up.layer.front) in the [layer stack](/up.layer.stack).

  Descendant overlays will be dismissed with value `':peel'`.

  @param {Object} options
    See options for `up.Layer#accept()`.
  @return {Promise}
    A promise that fulfills when descendant overlays were dismissed.
  @stable
  ###
  peel: (options) ->
    @stack.peel(this, options)

  evalOption: (option) ->
    u.evalOption(option, this)

  ###**
  Returns whether this layer is the [current layer](/up.layer.current).

  @function up.Layer#isCurrent
  @return {boolean}
  @stable
  ###
  isCurrent: ->
    @stack.isCurrent(this)

  ###**
  Returns whether this layer is the [frontmost layer](/up.layer.front).

  @function up.Layer#isFront
  @return {boolean}
  @stable
  ###
  isFront: ->
    @stack.isFront(this)

  ###**
  Returns whether this layer is the [root layer](/up.layer.root).

  @function up.Layer#isFront
  @return {boolean}
  @stable
  ###
  isRoot: ->
    @stack.isRoot(this)

  ###**
  Returns whether this layer is *not* the [root layer](/up.layer.root).

  @function up.Layer#isRoot
  @return {boolean}
  @stable
  ###
  isOverlay: ->
    @stack.isOverlay(this)

  ###**
  Returns whether this layer is still part of the [layer stack](/up.layer.stack).

  A layer is considered "closed" immediately after it has been [dismissed](/up.Layer.prototype.dismiss)
  or [accepted](/up.Layer.prototype.dismiss) If the closing is animated, a layer may be considered "closed" while
  closing animation is still playing.

  @function up.Layer#isOpen
  @return {boolean}
  @stable
  ###
  isOpen: ->
    @stack.isOpen(this)

  ###**
  Returns whether this layer is no longer part of the [layer stack](/up.layer.stack).

  A layer is considered "closed" immediately after it has been [dismissed](/up.Layer.prototype.dismiss)
  or [accepted](/up.Layer.prototype.dismiss) If the closing is animated, a layer may be considered "closed" while
  closing animation is still playing.

  @function up.Layer#isClosed
  @return {boolean}
  @stable
  ###
  isClosed: ->
    @stack.isClosed(this)

  ###**
  Returns this layer's parent layer.

  The parent layer is the layer that opened this layer. It is visually in the background of this layer.

  Returns `undefined` for the [root layer](/up.layer.root).

  @property up.Layer#parent
  @return {boolean}
  @stable
  ###
  @getter 'parent', ->
    @stack.parentOf(this)

  ###**
  Returns this layer's child layer.

  The child layer is the layer that was opened on top of this layer. It visually overlays this layer.

  Returns `undefined` if this layer has not opened a child layer.

  A layer can have at most one child layer. Opening an overlay on a layer with an exiisting child will
  first dismiss the existing child before replacing it with the new child.

  @property up.Layer#child
  @return {boolean}
  @stable
  ###
  @getter 'child', ->
    @stack.childOf(this)

  ###**
  Returns an array of this layer's ancestor layers.

  @property up.Layer#ancestors
  @return {boolean}
  @stable
  ###
  @getter 'ancestors', ->
    @stack.ancestorsOf(this)

  ###**
  Returns an array of this layer's descendant layers, with the closest descendants listed first.

  Descendant layers are all layers that visually overlay this layer.

  @property up.Layer#descendants
  @return {boolean}
  @stable
  ###
  @getter 'descendants', ->
    @stack.descendantsOf(this)

  ###**
  Returns the zero-based position of this layer in the [layer stack](/up.layer.stack).

  The [root layer](/up.layer.root) has an index of `0`, its child overlay has an index of `1`, and so on.

  @property up.Layer#index
  @return {boolean}
  @stable
  ###
  @getter 'index', ->
    @stack.indexOf(this)

  getContentElement: ->
    @contentElement || @element

  getBoxElement: ->
    @boxElement || @element

  getFirstSwappableElement: ->
    throw up.error.notImplemented()

  ###**
  Returns whether the given `element` is contained by this layer.

  Note that this will always return `false` for elements in [descendant](/up.Layer.prototype.descendants) overlays,
  even if the descendant overlay's element is nested into the DOM tree of this layer.

  @function up.Layer#contains
  @param {Element} element
  @return {boolean}
  @stable
  ###
  contains: (element) =>
    # Test that the closest parent is the element and not another layer with elements nested
    # into this layer's element.
    e.closest(element, up.layer.anySelector()) == @element

  ###**
  Listens to a ([DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events) that originated
  on an element [contained](/up.Layer.prototype.contains) by this layer.

  This will ignore events emitted on elements in [descendant](/up.Layer.prototype.descendants) overlays,
  even if the descendant overlay's element is nested into the DOM tree of this layer.

  The arguments for this function are the same as for `up.on()`.

  \#\#\# Example

      let rootLayer = up.layer.root
      let overlay = await up.layer.open()

      rootLayer.on('foo', (event) => console.log('Listener called'))

      rootLayer.emit('foo') // logs "Listener called"
      overlay.emit('foo')   // listener is not called

  \#\#\# Most Unpoly events have a layer reference

  Whenever possible Unpoly will emit its events on associated layers instead of `document`.
  This way you can listen to events on one layer without receiving events from other layers.

  E.g. to listen to all [requests](/up.request) originating from a given layer:

      let rootLayer = up.layer.root
      let rootLink = rootLayer.affix('a[href=/foo]')

      let overlay = await up.layer.open()
      let overlayLink = overlay.affix('a[href=/bar]')

      rootLayer.on('up:request:load', (event) => console.log('Listener called'))

      up.follow(rootLink)    // logs "Listener called"
      up.follow(overlayLink) // listener is not called

  @function up.Layer#on
  @param {string} types
    A space-separated list of event types to bind to.
  @param {string} [selector]
    The selector of an element on which the event must be triggered.

    Omit the selector to listen to all events of the given type, regardless
    of the event target.
  @param {boolean} [options.passive=false]
    Whether to register a [passive event listener](https://developers.google.com/web/updates/2016/06/passive-event-listeners).

    A passive event listener may not call `event.preventDefault()`.
    This in particular may improve the frame rate when registering
    `touchstart` and `touchmove` events.
  @param {Function(event, [element], [data])} listener
    The listener function that should be called.

    The function takes the affected element as the second argument.
    If the element has an [`up-data`](/up-data) attribute, its value is parsed as JSON
    and passed as a third argument.
  @return {Function()}
    A function that unbinds the event listeners when called.
  @stable
  ###
  on: (args...) ->
    return @buildEventListenerGroup(args).bind()

  ###**
  Unbinds an event listener previously bound with `up.Layer#on()`.

  @function up.Layer#off
  @param {Element|jQuery} [element=document]
  @param {string} events
  @param {string} [selector]
  @param {Function(event, [element], [data])} listener
    The listener function to unbind.

    Note that you must pass a reference to the exact same listener function
    that was passed to `up.Layer#on()` earlier.
  @stable
  ###
  off: (args...) ->
    return @buildEventListenerGroup(args).unbind()

  buildEventListenerGroup: (args) ->
    return up.EventListenerGroup.fromBindArgs(args,
      guard: @containsEventTarget,
      elements: [@element],
      currentLayer: this
    )

  containsEventTarget: (event) =>
    # Since the root layer will receive events emitted on descendant layers
    # we need to manually check whether the event target is contained
    # by this layer.
    @contains(event.target)

  wasHitByMouseEvent: (event) ->
    hittableElement = document.elementFromPoint(event.clientX, event.clientY)
    return !hittableElement || @contains(hittableElement)

  buildEventEmitter: (args) ->
    return up.EventEmitter.fromEmitArgs(args, layer: this)

  ###**
  [Emits](/up.emit) an event on [this layer's element](/up.Layer#element).

  The value of [up.layer.current](/up.layer.current) will be set to the this layer
  while event listeners are running.

  \#\#\# Example

      let rootLayer = up.layer.root
      let overlay = await up.layer.open()

      rootLayer.on('foo', (event) => console.log('Listener called'))

      rootLayer.emit('foo') // logs "Listener called"
      overlay.emit('foo')   // listener is not called

  @function up.Layer#emit
  @param {Element|jQuery} [target=this.element]
    The element on which the event is triggered.

    If omitted, the event will be emitted on the [this layer's element](/up.Layer#element).
  @param {string} eventType
    The event type, e.g. `my:event`.
  @param {Object} [props={}]
    A list of properties to become part of the event object that will be passed to listeners.
  @param {string|Array} [props.log]
    A message to print to the [log](/up.log) when the event is emitted.

    Pass `false` to not log this event emission.
  @param {Element|jQuery} [props.target=this.element]
    The element on which the event is triggered.

    Alternatively the target element may be passed as the first argument.
  @stable
  ###
  emit: (args...) ->
    return @buildEventEmitter(args).emit()

  whenEmitted: (args...) ->
    return @buildEventEmitter(args).whenEmitted()

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

  ###**
  Temporarily changes the [current layer](/up.layer.current) while the given
  function is running.

  Calls the given function and restores the original current layer when the function
  terminates.

  @param {Function()} fn
    The synchronous function to call.

    Async functions are not supported.
  @function up.Layer#asCurrent
  @experimental
  ###
  asCurrent: (fn) ->
    @stack.asCurrent(this, fn)

  updateHistory: (options) ->
    # When the layer is opened, the { history } option defines whether the
    # layer enables handling of location and title in general.
    # When updating history, accept { history: false } as a shortcut to
    # neither change { title } nor { location }.
    return if options.history == false
    
    if u.isString(options.title)
      @title = options.title

    if u.isString(options.location)
      @location = options.location

  ###**
  This layer's window title.

  If this layer does not [affect browser history](/up.Layer#history), this property will
  still return the string the layer would otherwise use.

  When this layer opens a child layer with history, the browser window will change to the child
  layer's title. When the child layer is closed, this layer's title will be restored.

  @property up.Layer#title
  @param {string} title
  @experimental
  ###
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


  ###**
  This layer's URL for the browser's address bar.

  If this layer does not [affect browser history](/up.Layer#history), this property will
  still return the URL the layer would otherwise use.

  When this layer opens a child layer with history, the browser URL will change to the child
  layer's location. When the child layer is closed, this layer's laytion will be restored.

  @property up.Layer#title
  @param {string} title
  @experimental
  ###
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
        @emit('up:layer:location:changed', { location, log: false })

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
    @hasHistory() && @isFront() && (up.history.config.enabled || @isRoot())

  selector: (part) ->
    @constructor.selector(part)

  @selector: (part) ->
    throw up.error.notImplemented()

  toString: ->
    "#{@mode} layer"

  affix: (args...) ->
    e.affix(@getFirstSwappableElement(), args...)
