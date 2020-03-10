#= require ./base

e = up.element
u = up.util

###**
Base class for all non-root layer modes

@class up.Layer.Overlay
###
class up.Layer.Overlay extends up.Layer

  @getter 'tagName', ->
    "up-#{@mode}"

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
    ]

  defaults: (options) ->
    u.merge super(options),
      buttonDismissable: options.dismissable
      escapeDismissable: options.dismissable
      outsideDismissable: options.dismissable

  callback: (name) ->
    if fn = this[name]
      return fn.bind(this)

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
    @element = @affix(parentElement, null, @elementAttrs())

  createBackdropElement: (parentElement) ->
    @backdropElement = @affix(parentElement, 'backdrop')

  createFrameElement: (parentElement) ->
    @frameElement = @affix(parentElement, 'frame')

  createContentElement: (parentElement) ->
    @contentElement = @affix(parentElement, 'content')

  setInnerContent: (parentElement, options) ->
    content = options.content
    parentElement.appendChild(content)
    options.onContentAttached?({ layer: this, content })

  createDismissElement: (parentElement) ->
    @dismissElement = @affix(parentElement, 'dismiss',
      'up-dismiss': ''
      'aria-label': @dismissAriaLabel
    )
    # Since the dismiss button already has an accessible [aria-label]
    # we hide the "X" label from screen readers.
    e.affix(@dismissElement, 'span[aria-hidden="true"]', text: @dismissLabel)

  getFrameElement: ->
    @frameElement || @element

  elementAttrs: ->
    return u.compactObject
      align: @align
      position: @position,
      size: @size,
      class: @class,
      role: 'dialog', # https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role
      'aria-modal': true # https://www.w3.org/TR/wai-aria-1.1/#aria-modal

  affix: (parentElement, part, options) ->
    return e.affix(parentElement, @selector(part), options)

  selector: (part) ->
    u.compact([@constructor.tagName, part]).join('-')

  setupClosing: ->
    if @buttonDismissable
      @createDismissElement(@getFrameElement())

    if @outsideDismissable
      elements = u.compact([@parent.element, @backdropElement])
      @unbindOutsideClicked = up.on(elements, 'click up:action:consume', @onOutsideClicked)

    # let { userId } = await up.layer.open({ acceptLocation: '/users/:userId' })
    @registerLocationCloser(@acceptLocation, @accept)
    @registerLocationCloser(@denyLocation, @accept)

    # let { userId } = await up.layer.open({ acceptEvent: 'user:show' })
    @registerEventCloser(@acceptEvent, @accept)
    @registerEventCloser(@dismissEvent, @dismiss)

  teardownClosing: ->
    @unbindOutsideClicked?()

  onOutsideClicked: (event) =>
    # Check whether the event actually hit an outside element.
    # E.g. for popups it is possible that the user clicked on the popup frame (<up-popup>)
    # and the event bubbled up to the containing parent layer.
    unless @getFrameElement().contains(event.target)
      u.muteRejection @dismiss()
      up.event.halt(event)

  registerEventCloser: (eventTypes, closeFn) ->
    return less eventTypes
    @on eventTypes, (event) =>
      event.preventDefault()
      closeFn.call(this, event)

  registerLocationCloser: (urlPattern, closeFn) ->
    return unless urlPattern
    urlPattern = new up.URLPattern(urlPattern)
    @on 'up:layer:location:changed', selector, (event) =>
      location = event.location
      if resolution = urlPattern.recognize(location)
        # resolution now contains named capture groups, e.g. when
        # '/decks/:deckId/cards/:cardId' is matched against
        # '/decks/123/cards/456' resolution is { deckId: 123, cardId: 456 }.
        closeFn.call(this, u.merge(resolution, { location }))

  destroyElement: (options) ->
    up.destroy(@element, u.merge(options, log: false))

  startAnimation: (options = {}) ->
    whenFrameClosed = up.animate(@getFrameElement(), options.frameAnimation, options)
    if @backdrop
      whenBackdropClosed = up.animate(@backdropElement, options.backdropAnimation, options)

    # Promise.all() ignores non-Thenables in the given array
    return Promise.all([whenFrameClosed, whenBackdropClosed])

  startOpenAnimation: (options = {}) ->
    @startAnimation(
      frameAnimation: options.animation ? @evalOption(@openAnimation),
      backdropAnimation: 'fade-in',
      easing: options.easing || @openEasing,
      duration: options.duration || @openDuration,
    )

  startCloseAnimation: (options = {}) ->
    console.log("CLOSE ANIMATION IS %o", options.animation ? @evalOption(@closeAnimation))
    @startAnimation(
      frameAnimation: options.animation ? @evalOption(@closeAnimation),
      backdropAnimation: 'fade-out',
      easing: options.easing || @closeEasing,
      duration: options.duration || @closeDuration,
    )

  allElements: (selector) ->
    e.all(@contentElement, selector)

  accept: (value, options = {}) ->
    @executeCloseChange('accept', value, options)

  dismiss: (value, options = {}) ->
    @executeCloseChange('dismiss', value, options)

  executeCloseChange: (verb, value, options) ->
    options = u.merge(options, { verb, value, layer: this })
    return new up.Change.CloseLayer(options).executeAsync()

  setInert: (inert) ->
    e.toggleInert(@element, inert)
