const e = up.element
const u = up.util

/*-
Each layer has an `up.Layer` instance.

Most functions in the `up.layer` package interact with the [current layer](/up.layer.current).
For example, `up.layer.dismiss()` is a shortcut for `up.layer.current.dismiss()`.

`up.layer.current` is set to the right layer in compilers and most events,
even if that layer is not the frontmost layer. E.g. if you're compiling a fragment for a background layer, `up.layer.current` will be
the background layer during compilation.

@class up.Layer
@parent up.layer
*/
up.Layer = class Layer extends up.Record {

  /*-
  This layer's outmost container element.

  ### Example

  ```js
  let rootLayer = up.layer.root
  let overlay = await up.layer.open()

  rootLayer.element // returns <body>
  overlay.element   // returns <up-modal>
  ```

  @property up.Layer#element
  @param {Element} element
    The layer's container element.
  @stable
  */

  /*-
  Whether fragment updates within this layer can affect browser history and window title.

  If a layer does not have visible history, its desendant layers cannot have history either.

  @property up.Layer#history
  @param {boolean} history
    Whether this layer renders history.
  @stable
  */

  /*-
  This layer's mode which governs its appearance and behavior.

  @see layer-terminology

  @property up.Layer#mode
  @param {string} mode
    The layer mode.
  @stable
  */

  /*-
  This layer's [context](/context).

  ### Example

  You may access the context properties like a regular JavaScript object.

  ```js
  let layer = up.layer.current
  layer.context.message = 'Please select a contact'
  console.log(layer.context) // logs "{ message: 'Please select a contact' }"
  ```

  @property up.Layer#context
  @param {Object} context
    The context object.

    If no context has been set an empty object is returned.
  @experimental
  */

  keys() {
    return [
      'element',
      'stack',
      'history',
      'mode',
      'context',
      'lastScrollTops',
      'lastFocusCapsules',
    ]
  }

  defaults() {
    return {
      context: {}, // To reset root
      lastScrollTops: up.viewport.newStateCache(),
      lastFocusCapsules: up.viewport.newStateCache()
    }
  }

  constructor(options = {}) {
    super(options)
    u.assert(this.mode)
  }

  setupHandlers() {
    up.link.convertClicks(this)
    this._unbindLocationChanged = up.on('up:location:changed', (event) => this._onBrowserLocationChanged(event))
  }

  teardownHandlers() {
    this._unbindLocationChanged?.()
  }

  mainTargets() {
    return up.layer.mainTargets(this.mode)
  }

  /*-
  Synchronizes this layer with the rest of the page.

  For instance, a popup overlay will re-calculate its position arounds its anchoring element.

  You only need to call this method after DOM changes unknown to Unpoly have brought
  overlays out of alignment with the rest of the page.

  @function up.Layer#sync
  @experimental
  */
  sync() {
    // no-op so users can blindly sync without knowing the current mode
  }

  /*-
  [Closes this overlay](/closing-overlays) with an accepting intent,
  e.g. when a change was confirmed or when a value was selected.

  To dismiss a layer *without* an accepting intent, use `up.Layer#dismiss()` instead.

  @function up.Layer#accept
  @section Acceptance
    @param {any} [value]
      The [acceptance value](/closing-overlays#acceptance-values) that will be passed to `{ onAccepted }` callbacks.

      If there isn't an acceptance value, omit this argument.
      If you need to pass options without an acceptance value, pass `null`:

      ```js
      up.layer.accept(null, { animation: 'move-to-bottom' })
      ```
    @param {string} [options.confirm]
      A message the user needs to confirm before the overlay is closed.

    @param {boolean} [options.preventable=true]
      Whether the closing can be prevented by an event listener.

      @internal

    @param {up.Response} [options.response]
      The server response that caused this overlay to close.

      May be left blank if the overlay was not closed in reaction to a server response.

      @experimental

  @section Animation
    @param {string|Function(Element, Object)} [options.animation]
      The [animation](/up.animate) to use for closing this layer.

      Defaults to the close animation configured for this layer mode.
    @param {number} [options.duration]
      The duration for the close animation in milliseconds.
    @param {number} [options.easing]
      The [timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
      that controls the acceleration of the close animation.
    @param {Function} [options.onFinished]
      A callback that will run when the elements have been removed from the DOM.

      If the layer has a close animation, the callback will run after the animation has finished.

  @section History
    @param {number} [options.history=true]
      Whether to restore the the parent layer's [history state](/updating-history#history-state)
      in the browser's address bar.

      @experimental
  @stable
  */
  accept() {
    throw new up.NotImplemented()
  }

  /*-
  [Closes this overlay](/closing-overlays) *without* an accepting intent,
  e.g. when a "Cancel" button was clicked.

  To close an overlay with an accepting intent, use `up.Layer#accept()` instead.

  @function up.Layer#dismiss
  @param {any} [value]
    The dismissal value that will be passed to `{ onDismissed }` callbacks.

    If there isn't an acceptance value, omit this argument.
    If you need to pass options without a dismissal value, pass `null`:

    ```js
    up.layer.dismiss(null, { animation: 'move-to-bottom' })
    ```
  @param {Object} [options]
    See options for `up.Layer#accept()`.
  @stable
  */
  dismiss() {
    throw new up.NotImplemented()
  }

  /*-
  [Dismisses](/up.Layer.prototype.dismiss) all descendant overlays,
  making this layer the [frontmost layer](/up.layer.front) in the [layer stack](/up.layer.stack).

  Descendant overlays will be dismissed with value `':peel'`.

  @function up.Layer#peel
  @param {Object} options
    See options for `up.Layer#accept()`.
  @stable
  */
  peel(options) {
    this.stack.peel(this, options)
  }

  evalOption(option) {
    return u.evalOption(option, this)
  }

  /*-
  Returns whether this layer is the [current layer](/up.layer.current).

  @function up.Layer#isCurrent
  @return {boolean}
    Whether this layer is the current layer.
  @stable
  */
  isCurrent() {
    return this.stack.isCurrent(this)
  }

  /*-
  Returns whether this layer is the [frontmost layer](/up.layer.front).

  @function up.Layer#isFront
    Whether this layer is the front layer.
  @return {boolean}
  @stable
  */
  isFront() {
    return this.stack.isFront(this)
  }

  /*-
  Returns whether this layer is the [root layer](/up.layer.root).

  @function up.Layer#isRoot
  @return {boolean}
    Whether this layer is the root layer.
  @stable
  */
  isRoot() {
    return this.stack.isRoot(this)
  }

  /*-
  Returns whether this layer is *not* the [root layer](/up.layer.root).

  @function up.Layer#isOverlay
  @return {boolean}
  @stable
  */
  isOverlay() {
    return this.stack.isOverlay(this)
  }

  /*-
  Returns whether this layer is still part of the [layer stack](/up.layer.stack).

  A layer is considered "closed" immediately after it has been [dismissed](/up.Layer.prototype.dismiss)
  or [accepted](/up.Layer.prototype.dismiss). If the closing is animated, a layer may be considered "closed" while
  closing animation is still playing.

  @function up.Layer#isOpen
  @return {boolean}
    Whether this layer is still open.
  @stable
  */
  isOpen() {
    return this.stack.isOpen(this)
  }

  /*-
  Returns whether this layer is no longer part of the [layer stack](/up.layer.stack).

  A layer is considered "closed" immediately after it has been [dismissed](/up.Layer.prototype.dismiss)
  or [accepted](/up.Layer.prototype.dismiss). If the closing is animated, a layer may be considered "closed" while
  closing animation is still playing.

  @function up.Layer#isClosed
  @return {boolean}
    Whether this layer has been closed..
  @stable
  */
  isClosed() {
    return this.stack.isClosed(this)
  }

  /*-
  Returns this layer's parent layer.

  The parent layer is the layer that opened this layer. It is visually in the background of this layer.

  Returns `undefined` for the [root layer](/up.layer.root).

  ## Example

  ```js
  up.layer.open()

  up.layer.parent // returns up.Layer.Root
  ```

  @property up.Layer#parent
  @param {up.Layer} parent
    This layer's parent layer.
  @stable
  */
  get parent() {
    return this.stack.parentOf(this)
  }

  /*-
  Returns this layer's child layer.

  The child layer is the layer that was opened on top of this layer. It visually overlays this layer.

  Returns `undefined` if this layer has not opened a child layer.

  A layer can have at most one child layer. Opening an overlay on a layer with an existing child will
  first dismiss the existing child before replacing it with the new child.

  @property up.Layer#child
  @return {up.Layer} child
    This layer's direct child overlay.
  @stable
  */
  get child() {
    return this.stack.childOf(this)
  }

  /*-
  Returns an array of this layer's ancestor layers.

  The array elements are ordered by distance to this layer.
  The first element is this layer's direct parent. The last element
  is the [root layer](/up.layer.root).

  ## Example

  ```js
  // Open two overlays
  up.layer.open({ mode: 'drawer' })
  up.layer.open({ mode: 'modal' })

  up.layer.parent // returns [up.Layer.Drawer, up.Layer.Root]
  ```

  @property up.Layer#ancestors
  @return {Array<up.Layer>} ancestors
    This layer's ancestors.
  @stable
  */
  get ancestors() {
    return this.stack.ancestorsOf(this)
  }

  /*-
  Returns an array of this layer's descendant layers, with the closest descendants listed first.

  Descendant layers are all layers that visually overlay this layer.

  The array elements are ordered by distance to this layer.
  The first element is this layer's direct child. The last element
  is the [frontmost layer](/up.layer.front).

  ## Example

  ```js
  up.layer.open()
  up.layer.current              // returns up.Layer.Modal
  up.layer.current.descendants  // returns []
  up.layer.root.descendants     // returns [up.Layer.Modal]
  ```


  @property up.Layer#descendants
  @return {Array<up.Layer>} descendants
    This layer's descendants.
  @stable
  */
  get descendants() {
    return this.stack.descendantsOf(this)
  }

  /*-
  Returns an array of this layer and its descendant layers, with the closest descendants listed first.

  Descendant layers are all layers that visually overlay this layer.

  The array elements are ordered by distance to this layer.
  The first element is this layer.
  The second element is this layer's direct child. The last element
  is the [frontmost layer](/up.layer.front).

  @property up.Layer#subtree
  @return {Array<up.Layer>} subtree
    An array of this layer and its descendants.
  @experimental
  */
  get subtree() {
    return [this, ...this.descendants]
  }

  /*-
  Returns the zero-based position of this layer in the [layer stack](/up.layer.stack).

  The [root layer](/up.layer.root) has an index of `0`, its child overlay has an index of `1`, and so on.

  This property has no defined behavior for [closed](/up.Layer.prototype.isClosed) layers.

  @property up.Layer#index
  @return {number} index
    The position of this layer in the stack.
  @stable
  */
  get index() {
    return this._index ??= this.stack.indexOf(this)
  }

  getContentElement() {
    return this.contentElement || this.element
  }

  getBoxElement() {
    return this.boxElement || this.element
  }

  getFocusElement() {
    return this.getBoxElement()
  }

  getFirstSwappableElement() {
    throw new up.NotImplemented()
  }

  /*-
  Returns whether the given `element` is contained by this layer.

  This function will always return `false` for elements in [descendant](/up.Layer.prototype.descendants) overlays,
  even if the descendant overlay's element is nested into the DOM tree of this layer.

  @function up.Layer#contains
  @param {Element} element
    The element to test.
  @return {boolean}
    Whether the layer contains the element.
  @stable
  */
  contains(element) {
    // Test that the closest parent is the element and not another layer with elements nested
    // into this layer's element.
    return element.closest(up.layer.anySelector()) === this.element
  }

  /*-
  Listens to a [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events) that originated
  on an element [contained](/up.Layer.prototype.contains) by this layer.

  This will ignore events emitted on elements in [descendant](/up.Layer.prototype.descendants) overlays,
  even if the descendant overlay's element is nested into the DOM tree of this layer.

  The arguments for this function are the same as for `up.on()`.

  ### Example

  ```js
  let rootLayer = up.layer.root
  let overlay = await up.layer.open()

  rootLayer.on('foo', (event) => console.log('Listener called'))

  rootLayer.emit('foo') // logs "Listener called"
  overlay.emit('foo')   // listener is not called
  ```

  ### Most Unpoly events have a layer reference

  Whenever possible Unpoly will emit its events on associated layers instead of `document`.
  This way you can listen to events on one layer without receiving events from other layers.

  E.g. to listen to all [requests](/up.request) originating from a given layer:

  ```js
  let rootLayer = up.layer.root
  let rootLink = rootLayer.affix('a[href=/foo]')

  let overlay = await up.layer.open()
  let overlayLink = overlay.affix('a[href=/bar]')

  rootLayer.on('up:request:load', (event) => console.log('Listener called'))

  up.follow(rootLink)    // logs "Listener called"
  up.follow(overlayLink) // listener is not called
  ```

  @function up.Layer#on
  @include up.on/after-element
  @stable
  */
  on(...args) {
    return this._buildEventListenerGroup(args).bind()
  }

  /*-
  Unbinds an event listener previously bound with `up.Layer#on()`.

  @function up.Layer#off
  @include up.off/after-element
  @stable
  */
  off(...args) {
    return this._buildEventListenerGroup(args).unbind()
  }

  _buildEventListenerGroup(args) {
    return up.EventListenerGroup.fromBindArgs(args, {
      guard: (event) => this._containsEventTarget(event),
      elements: [this.element],
      baseLayer: this
    })
  }

  _containsEventTarget(event) {
    // Since the root layer will receive events emitted on descendant layers
    // we need to manually check whether the event target is contained
    // by this layer.
    return this.contains(event.target)
  }

  wasHitByMouseEvent({ clientX, clientY }) {
    const hittableElement = document.elementFromPoint(clientX, clientY)
    return !hittableElement || this.contains(hittableElement)
  }

  _buildEventEmitter(args) {
    return up.EventEmitter.fromEmitArgs(args, { layer: this })
  }

  /*-
  [Emits](/up.emit) an event on [this layer's element](/up.Layer.prototype.element).

  The value of [up.layer.current](/up.layer.current) will be set to the this layer
  while event listeners are running.

  ## Example

  ```js
  let rootLayer = up.layer.root
  let overlay = await up.layer.open()

  rootLayer.on('foo', (event) => console.log('Listener called'))

  rootLayer.emit('foo') // logs "Listener called"
  overlay.emit('foo')   // listener is not called
  ```

  @function up.Layer#emit
  @param eventType
    @like up.emit
  @param props
    @like up.emit
  @param props.log
    @like up.emit
  @return
    @like up.emit
  @stable
  */
  emit(...args) {
    return this._buildEventEmitter(args).emit()
  }

  isDetached() {
    return !this.element.isConnected
  }

  saveHistory() {
    // (1) showsLiveHistory() would always return false unless we're the front layer
    // (2) Getters like this.title would always return this.savedTitle unless we're the front layer
    u.assert(this.isFront())

    // If we're not rendering history, don't save history state of a background layer.
    if (!this.showsLiveHistory()) return

    this.savedTitle = this.title
    this.savedMetaTags = this.metaTags
    this.savedLocation = this.location // synced except on the root layer before the initial location change
    this.savedLang = this.lang
  }

  restoreHistory() {
    if (!this.showsLiveHistory()) return

    // We may not have a #savedLocation when we were opened from an HTML string instead of a URL.
    if (this.savedLocation) {
      // We cannot use the `this.title` setter as that does not
      // push a state if `newLocation === this.savedLocation`.
      up.history.push(this.savedLocation)
    }

    if (this.savedTitle) {
      document.title = this.savedTitle
    }

    if (this.savedMetaTags) {
      up.history.updateMetaTags(this.savedMetaTags)
    }

    if (u.isString(this.savedLang)) {
      up.history.updateLang(this.savedLang)
    }
  }

  /*-
  Temporarily changes the [current layer](/up.layer.current) while the given
  function is running.

  Calls the given function and restores the original current layer when the function
  terminates.

  ## Example

  ```js
  up.layer.current // returns up.Layer.Root

  up.layer.open() // open an overlay
  up.layer.current // returns up.Layer.Modal

  up.layer.parent.asCurrent(function() {
    up.layer.current // returns up.layer.Root
  })

  up.layer.current // returns up.Layer.Modal
  ```

  @param {Function()} fn
    The synchronous function to call.

    Async functions are not supported.
  @function up.Layer#asCurrent
  @experimental
  */
  asCurrent(fn) {
    return this.stack.asCurrent(this, fn)
  }

  updateHistory(options) {
    // Set unless { location: false }
    if (u.isString(options.location)) {
      this._updateLocation(options.location, { push: true })
    }

    // Set unless { metaTags: false }
    if (up.history.config.updateMetaTags && u.isList(options.metaTags)) {
      up.migrate?.warnOfHungryMetaTags?.(options.metaTags)
      this._updateMetaTags(options.metaTags)
    }

    // Set unless { title: false }
    if (u.isString(options.title)) {
      this._updateTitle(options.title)
    }

    // Set unless { lang: false }
    if (u.isString(options.lang)) {
      this._updateLang(options.lang)
    }
  }

  showsLiveHistory() {
    return this.history && this.isFront() // && (up.history.config.enabled || this.isRoot())
  }

  _onBrowserLocationChanged({ location }) {
    if (this.showsLiveHistory()) {
      this._updateLocation(location, { push: false })
    }
  }

  /*-
  This layer's window title.

  If the [frontmost layer](/up.layer.front) does not have [visible history](/up.Layer.prototype.history),
  the browser window will show the title of an ancestor layer.
  This property will return the title the layer would use if it had visible history.

  If this layer does not [affect browser history](/up.Layer.prototype.history), this property will
  still return the title the layer would otherwise use.

  When this layer opens a child layer with visible history, the browser window will change to the child
  layer's title. When the child layer is closed, this layer's title will be restored.

  @property up.Layer#title
  @param {string} title
    This layer's title.
  @experimental
  */
  get title() {
    if (this.showsLiveHistory()) {
      // Allow Unpoly-unaware code to set the document title directly.
      // This will implicitey change the front layer's title.
      return document.title
    } else {
      return this.savedTitle
    }
  }

  _updateTitle(title) {
    this.savedTitle = title

    if (this.showsLiveHistory()) {
      document.title = title
    }
  }

  get metaTags() {
    if (this.showsLiveHistory()) {
      return up.history.findMetaTags()
    } else {
      return this.savedMetaTags
    }
  }

  _updateMetaTags(metaTags) {
    this.savedMetaTags = metaTags

    if (this.showsLiveHistory()) {
      up.history.updateMetaTags(metaTags)
    }
  }

  get lang() {
    if (this.showsLiveHistory()) {
      return up.history.getLang()
    } else {
      return this.savedLang
    }
  }

  _updateLang(lang) {
    this.savedLang = lang

    if (this.showsLiveHistory()) {
      up.history.updateLang(lang)
    }
  }

  /*-
  This layer's location URL.

  If the layer has [no visible history](/up.Layer.prototype.history), this property
  still returns the URL of the content in the overlay. In this case
  the browser's address bar will show the location of an ancestor layer.

  When this layer opens a child layer with visible history, the browser URL will change to the child
  layer's location. When the child layer is closed, this layer's location will be restored.

  @property up.Layer#location
  @param {string} location
    The layer's current location.
  @experimental
  */
  get location() {
    // TODO: Maybe we can always return savedLocation now
    if (this.showsLiveHistory()) {
      // Allow Unpoly-unaware code to use the pushState API directly.
      // This will implicitly change the front layer's location.
      return up.history.location
    } else {
      return this.savedLocation
    }
  }

  _updateLocation(location, { push }) {
    location = u.normalizeURL(location)
    let previousLocation = this.savedLocation

    if (location !== previousLocation) {
      this.savedLocation = location

      if (this.showsLiveHistory() && push) {
        up.history.push(location)
      }

      // (1) The up:layer:location:changed event signals a location change for history-less overlays.
      // (2) When opening we never emit up:layer:location:changed.
      if (!this.opening) {
        this.emit('up:layer:location:changed', { location, previousLocation, log: false })
      }
    }
  }

  selector(part) {
    return this.constructor.selector(part)
  }

  static selector(_part) {
    throw new up.NotImplemented()
  }

  toString() {
    throw new up.NotImplemented()
  }

  /*-
  Creates an element with the given `selector` and appends it to this layer's
  [outmost element](/up.Layer.prototype.element).

  Also see `up.element.affix()`.

  ### Example

  ```js
  layer = up.layer.open()
  element = layer.affix(.klass')
  element.parentElement // returns 'main'
  element.className // returns 'klass'
  ```

  @function up.Layer#affix
  @include up.element.createFromSelector/all
  @experimental
  */
  affix(...args) {
    return e.affix(this.getFirstSwappableElement(), ...args)
  }

  [u.isEqual.key](other) {
    return (this.constructor === other.constructor) && (this.element === other.element)
  }

  hasFocus() {
    let focusedElement = document.activeElement
    return focusedElement !== document.body && this.element.contains(focusedElement)
  }

  reset() {
    // Re-assigning defaults will also reset context as well as
    // caches for scroll positions and focus.
    Object.assign(this, this.defaults())
  }

}

