#= require ./base

e = up.element
u = up.util

###**
@class up.Layer
###
class up.Layer.Overlay extends up.Layer

  ###**
  The link or form element that opened this overlay.

  @property up.Layer#origin
  @return {Element}
  @stable
  ###

  keys: ->
    super().concat [
      'position',
      'align',
      'size',
      'origin', # for tethered anchor element
      'class',
      'backdrop',
      'openAnimation',
      'closeAnimation',
      'openDuration',
      'closeDuration',
      'openEasing',
      'closeEasing',
      'backdropOpenAnimation',
      'backdropCloseAnimation',
      'buttonDismissable',
      'keyDismissable',
      'outsideDismissable',
      'dismissLabel',
      'dismissAriaLabel',
      'onOpened',
      'onAccept',
      'onAccepted',
      'onDismiss',
      'onDismissed',
      'acceptEvent',
      'dismissEvent',
      'acceptLocation',
      'dismissLocation',
    ]

  defaults: (options) ->
    u.merge super(options),
      buttonDismissable: options.dismissable
      keyDismissable: options.dismissable
      outsideDismissable: options.dismissable

  constructor: (options) ->
    super(options)

    if @acceptLocation
      @acceptLocation = new up.URLPattern(@acceptLocation)

    if @dismissLocation
      @dismissLocation = new up.URLPattern(@dismissLocation)

  callback: (name) ->
    # Only binds the callback to the layer instance.
    # Note if the callback was created by an UJS attribute like [up-on-accepted], the
    # callback is already bound to the origin element to mimic the behavior of built-in
    # handler attributes like [onclick]. In that case our additional bind() will have
    # no effect.
    #
    # The up.layer.current value within a callback is controlled by the event
    # emission in up.Change.OpenLayer and up.Change.CloseLayer
    if fn = this[name]
      return fn.bind(this)

  createElement: (parentElement) ->
    @nesting ||= @suggestVisualNesting()
    elementAttrs = u.compactObject({ @align, @position, @size, @class, @nesting })
    @element = @affixPart(parentElement, null, elementAttrs)

  createBackdropElement: (parentElement) ->
    @backdropElement = @affixPart(parentElement, 'backdrop')

  createViewportElement: (parentElement) ->
    # Give the viewport element an [up-viewport] attribute so it will be found
    # by up.viewport.get().
    @viewportElement = @affixPart(parentElement, 'viewport', 'up-viewport': '')

  createBoxElement: (parentElement) ->
    @boxElement = @affixPart(parentElement, 'box')

  createContentElement: (parentElement, content) ->
    @contentElement = @affixPart(parentElement, 'content')
    @contentElement.appendChild(content)

  createDismissElement: (parentElement) ->
    @dismissElement = @affixPart(parentElement, 'dismiss',
      'up-dismiss': '":button"' # value must be JSON
      'aria-label': @dismissAriaLabel
    )
    # Since the dismiss button already has an accessible [aria-label]
    # we hide the "X" label from screen readers.
    e.affix(@dismissElement, 'span[aria-hidden="true"]', text: @dismissLabel)

  affixPart: (parentElement, part, options = {}) ->
    return e.affix(parentElement, @selector(part), options)

  @selector: (part) ->
    u.compact(['up', @mode, part]).join('-')

  suggestVisualNesting: ->
    parent = @parent
    if @mode == parent.mode
      return 1 + parent.suggestVisualNesting()
    else
      return 0

  setupHandlers: ->
    super()

    @overlayFocus = new up.OverlayFocus(this)

    if @buttonDismissable
      @createDismissElement(@getBoxElement())

    if @outsideDismissable
      @unbindParentClicked = @parent.on 'up:click', (event, element) =>
        # When our origin is clicked again, halt the click event
        # We achieve this by halting the click event.
        originClicked = @origin && @origin.contains(element)
        @onOutsideClicked(event, originClicked)

      # If this overlay has its own viewport, a click outside the frame will hit
      # the viewport and not the parent element.
      if @viewportElement
        up.on @viewportElement, 'up:click', (event) =>
          # Don't react when a click into the overlay frame bubbles to the viewportElement
          if event.target == @viewportElement
            @onOutsideClicked(event, true)

    if @keyDismissable
      @unbindEscapePressed = up.event.onEscape((event) => @onEscapePressed(event))

    # <a up-accept="value">OK</a>
    @registerClickCloser 'up-accept', (value, closeOptions) =>
      @accept(value, closeOptions)

    # <a up-dismiss="value">Cancel</a>
    @registerClickCloser 'up-dismiss', (value, closeOptions) =>
      @dismiss(value, closeOptions)

    up.migrate.registerLayerCloser?(this)

    # let { userId } = await up.layer.open({ acceptEvent: 'user:show' })
    @registerEventCloser(@acceptEvent, @accept)
    @registerEventCloser(@dismissEvent, @dismiss)

  onOutsideClicked: (event, halt) ->
    if halt
      up.event.halt(event)
    up.log.muteRejection @dismiss(':outside')

  onEscapePressed: (event) ->
    # All overlays listen to the Escape key being pressed, but only the front layer
    # should react. Note that we're using the *front* layer, not the *current* layer.
    # The current layer might be in the visual background, e.g. if a fragment is being
    # compiled in a background layer.
    if @isFront()
      if field = up.form.focusedField()
        # Allow screen reader users to get back to a state where they can dismiss the
        # modal with escape.
        field.blur()
      else if @keyDismissable
        up.event.halt(event)
        up.log.muteRejection @dismiss(':key')

  registerClickCloser: (attribute, closeFn) ->
    # Allow the fallbacks to be both vanilla links and Unpoly [up-target] links
    @on 'up:click', "[#{attribute}]", (event) ->
      # Since we're defining this handler on up.Overlay, we will not prevent
      # a link from being followed on the root layer.
      up.event.halt(event)

      origin = event.target
      value = e.jsonAttr(origin, attribute)
      closeOptions = { origin }
      parser = new up.OptionsParser(closeOptions, origin)
      parser.booleanOrString('animation')
      parser.string('easing')
      parser.number('duration')

      up.log.muteRejection closeFn(value, closeOptions)

  registerEventCloser: (eventTypes, closeFn) ->
    return unless eventTypes
    @on eventTypes, (event) =>
      event.preventDefault()
      closeFn.call(this, event)

  tryAcceptForLocation: ->
    @tryCloseForLocation(@acceptLocation, @accept)

  tryDismissForLocation: ->
    @tryCloseForLocation(@dismissLocation, @dismiss)

  tryCloseForLocation: (urlPattern, closeFn) ->
    if urlPattern && (location = @location) && (resolution = urlPattern.recognize(location))
      # resolution now contains named capture groups, e.g. when
      # '/decks/:deckId/cards/:cardId' is matched against
      # '/decks/123/cards/456' resolution is { deckId: 123, cardId: 456 }.
      closeValue = u.merge(resolution, { location })
      closeFn.call(this, closeValue)

  teardownHandlers: ->
    super()
    @unbindParentClicked?()
    @unbindEscapePressed?()
    @overlayFocus.teardown()

  ###**
  Destroys the elements that make up this overlay.

  @function up.Layer.prototype.destroyElements
  @param {string|Function(Element, Object)} [options.animation=this.closeAnimation]
  @param {number} [options.duration=this.closeDuration]
  @param {string} [options.easing=this.closeEasing]
  @param {Function} [options.onFinished]
    A callback that will run when the elements have been removed from the DOM.
    If the destruction is animated, the callback will run after the animation has finished.
  @return {Promise}
    A resolved promise.
  @private
  ###
  destroyElements: (options) ->
    animation = =>
      @startCloseAnimation(options)

    onFinished = =>
      @onElementsRemoved()  # callback for layer implementations that need to clean up
      options.onFinished?() # callback for callers of up.layer.dismiss/accept()

    # Do not re-use `options`, or we would call startCloseAnimation(animation: startCloseAnimation)!
    destroyOptions = u.merge(options, { animation, onFinished, log: false })
    up.destroy(@element, destroyOptions)

  onElementsRemoved: ->
    # optional callback

  startAnimation: (options = {}) ->
    boxDone = up.animate(@getBoxElement(), options.boxAnimation, options)

    # If we don't animate the box, we don't animate the backdrop
    if @backdrop && !up.motion.isNone(options.boxAnimation)
      backdropDone = up.animate(@backdropElement, options.backdropAnimation, options)

    # Promise.all() ignores non-Thenables in the given array
    return Promise.all([boxDone, backdropDone])

  startOpenAnimation: (options = {}) ->
    @startAnimation(
      boxAnimation: options.animation ? @evalOption(@openAnimation),
      backdropAnimation: 'fade-in',
      easing: options.easing || @openEasing,
      duration: options.duration || @openDuration,
    ).then =>
      @wasEverVisible = true

  startCloseAnimation: (options = {}) ->
    boxAnimation = @wasEverVisible && (options.animation ? @evalOption(@closeAnimation))

    @startAnimation(
      boxAnimation: boxAnimation,
      backdropAnimation: 'fade-out',
      easing: options.easing || @closeEasing,
      duration: options.duration || @closeDuration,
    )

  accept: (value = null, options = {}) ->
    @executeCloseChange('accept', value, options)

  dismiss: (value = null, options = {}) ->
    @executeCloseChange('dismiss', value, options)

  executeCloseChange: (verb, value, options) ->
    options = u.merge(options, { verb, value, layer: this })
    return new up.Change.CloseLayer(options).executeAsync()

  getFirstSwappableElement: ->
    @getContentElement().children[0]
