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

  createElement: ->
    attrs = u.compactObject
      'up-mode': @constructor.mode
      'up-align': @align
      'up-position': @position,
      'up-size': @size,
      role: 'dialog',
      'aria-modal': true
    @element = e.affix(document.body, '.up-overlay', attrs)

    if @backdrop
      @backdropElement = e.affix(@element, '.up-overlay-backdrop')

    if @class
      @element.classList.add(@class)

    if @outsideDismissable
      @element.addEventListener 'click', (event) =>
        unless e.closest(event.target, '.up-overlay-frame')
          u.muteRejection @dismiss()
          up.event.halt(event)

    @registerCloser(@acceptOn, @accept)
    @registerCloser(@dismissOn, @dismiss)

  registerCloser: (closer, close) ->
    if closer
      [eventType, selector] = closer.match(/^([^ ]+)(?: (.*))?$/)
      @on(@eventType, selector, close.bind(this))

  destroyElement: (options) ->
    up.destroy(@element, options)

  createDismissElement: (parentElement) ->
    if @buttonDismissable
      @dismissElement = e.affix(parentElement, '.up-overlay-dismiss[up-dismiss]',
        'aria-label': @dismissAriaLabel
      )
      # Since the dismiss button already has an accessible [aria-label]
      # we hide the "X" label from screen readers.
      e.affix(@dismissElement, 'span[aria-hidden="true"]', text: @dismissLabel)

  frameInnerContent: (parentElement, options) ->
    content = options.content
    @frameElement = e.affix(parentElement, '.up-overlay-frame')
    @contentElement = e.affix(@frameElement, '.up-overlay-content')
    @contentElement.appendChild(content)
    @createDismissElement(@frameElement)
    options.onContentAttached?({ layer: this, content })

  startAnimation: (options = {}) ->
    whenFrameClosed = up.animate(@frameElement, options.frameAnimation, options)
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
    @startAnimation(
      frameAnimation: options.animation ? @evalOption(@openAnimation),
      backdropAnimation: 'fade-out',
      easing: options.easing || @closeEasing,
      duration: options.duration || @closeDuration,
    )

  allElements: (selector) ->
    e.all(@contentElement, selector)

  executeCloseChange: (verb, value, options) ->
    options = u.merge(options, { verb, value, layer: this })
    return new up.Change.CloseLayer(options).executeAsync()

  accept: (value, options = {}) ->
    @executeCloseChange('accept', value, options)

  dismiss: (value, options = {}) ->
    @executeCloseChange('dismiss', value, options)

  setInert: (inert) ->
    e.toggleInert(@element, inert)
