#= require ./base

e = up.element
u = up.util

###**
Base class for all non-root layer modes

@class up.Layer.Overlay
###
class up.Layer.Overlay extends up.Layer

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
      'escapeDismissable',
      'outsideDismissable',
      'dismissLabel',
      'dismissAriaLabel',
      'onOpening',
      'onOpened',
      'onAccept',
      'onAccepting',
      'onAccepted',
      'onDismiss',
      'onDismissing',
      'onDismissed',
      'onContentAttached',
      'acceptEvent',
      'dismissEvent',
      'acceptLocation',
      'dismissLocation',
    ]

  defaults: (options) ->
    u.merge super(options),
      buttonDismissable: options.dismissable
      escapeDismissable: options.dismissable
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
    if fn = this[name]
      return (args...) =>
        @asCurrent =>
          fn.apply(this, args)

  # TODO: Rename openNow to something that doesn't have the sync/async connotation
  ###**
  @function up.Layer.Overlay#openNow
  @param {Element} options.parent
  @param {Element} options.content
  @param {string|Object|Function(element, options): Promise} [options.animation]
  @param {string|Object|Function(element, options): Promise} [options.backdropAnimation]
  @param {string} [options.easing]
  @param {number} [options.duration]
  @param {number} [options.delay]
  ###
  openNow: (options) ->
    throw up.error.notImplemented()

  # TODO: Rename closeNow to something that doesn't have the sync/async connotation
  ###**
  @function up.Layer.Overlay#closeNow
  @param {string|Object|Function(element, options): Promise} [options.animation]
  @param {string|Object|Function(element, options): Promise} [options.backdropAnimation]
  @param {string} [options.easing]
  @param {number} [options.duration]
  @param {number} [options.delay]
  ###
  closeNow: (options) ->
    throw up.error.notImplemented()

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
      'up-dismiss': ''
      'aria-label': @dismissAriaLabel
      'tabindex': '0'
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

    if @escapeDismissable
      @unbindEscapePressed = up.event.onEscape((event) => @onEscapePressed(event))

    # <a up-accept="value">OK</a>
    @registerClickCloser 'up-accept', (value, closeOptions) =>
      @accept(value, closeOptions)

    # <a up-dismiss="value">Cancel</a>
    @registerClickCloser 'up-dismiss', (value, closeOptions) =>
      @dismiss(value, closeOptions)

    # <a up-close>Close</a> (legacy close attribute)
    @registerClickCloser 'up-close', (value, closeOptions) =>
      up.legacy.deprecated('[up-close]', '[up-dismiss]')
      @dismiss(value, closeOptions)

    # let { userId } = await up.layer.open({ acceptEvent: 'user:show' })
    @registerEventCloser(@acceptEvent, @accept)
    @registerEventCloser(@dismissEvent, @dismiss)

  onOutsideClicked: (event, halt) ->
    if halt
      up.event.halt(event)
    u.muteRejection @dismiss()

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
      else if @escapeDismissable
        up.event.halt(event)
        u.muteRejection @dismiss()

  registerClickCloser: (attribute, closeFn) ->
    # Allow the fallbacks to be both vanilla links and Unpoly [up-target] links
    @on 'up:click', "[#{attribute}]", (event) ->
      origin = event.target
      value = e.jsonAttr(origin, attribute)
      closeOptions = { origin }
      parser = new up.OptionParser(closeOptions, origin, fail: false)
      parser.booleanOrString('animation')
      parser.string('easing')
      parser.number('duration')
      up.event.halt(event)
      u.muteRejection ->
        closeFn(value, closeOptions)

  registerEventCloser: (eventTypes, closeFn) ->
    return unless eventTypes
    @on eventTypes, (event) =>
      event.preventDefault()
      closeFn.call(this, event)

#  registerLocationCloser: (urlPattern, closeFn) ->
#    return unless urlPattern
#    urlPattern = new up.URLPattern(urlPattern)
#    @on 'up:layer:location:changed', (event) =>
#      console.debug("--- Received location:changed")
#      location = event.location
#      if resolution = urlPattern.recognize(location)
#        # resolution now contains named capture groups, e.g. when
#        # '/decks/:deckId/cards/:cardId' is matched against
#        # '/decks/123/cards/456' resolution is { deckId: 123, cardId: 456 }.
#        closeFn.call(this, u.merge(resolution, { location }))
#
#  acceptValueFromLocation: ->
#    @closeValueFromLocation(@acceptLocation)
#
#  dismissValueFromLocation: ->
#    @closeValueFromLocation(@dismissLocation)
#
#  closeValueFromLocation: (urlPattern) ->
#    return unless urlPattern
#
#    location = @location
#    if resolution = urlPattern.recognize(location)
#      # resolution now contains named capture groups, e.g. when
#      # '/decks/:deckId/cards/:cardId' is matched against
#      # '/decks/123/cards/456' resolution is { deckId: 123, cardId: 456 }.
#      return u.merge(resolution, { location })

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
      console.log("Calling closeFn %o with value %o", closeFn, closeValue)
      closeFn.call(this, closeValue)

  teardownHandlers: ->
    super()
    @unbindParentClicked?()
    @unbindEscapePressed?()
    @overlayFocus.teardown()

  destroyElements: (options) ->
    # Do not re-use options, or we would call startCloseAnimation(anination: startCloseAnimation)!
    destroyOptions = u.merge(options,
      animation: => @startCloseAnimation(options)
      log: false
    )

    up.destroy(@element, destroyOptions).then =>
      @onElementsDestroyed()

  onElementsDestroyed: ->
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

  accept: (value, options = {}) ->
    @executeCloseChange('accept', value, options)

  dismiss: (value, options = {}) ->
    @executeCloseChange('dismiss', value, options)

  executeCloseChange: (verb, value, options) ->
    options = u.merge(options, { verb, value, layer: this })
    return new up.Change.CloseLayer(options).executeAsync()
