#= require ./base

e = up.element
u = up.util

###**
Base class for all non-root layer flavors

@class up.Layer.Overlay
###
class up.Layer.Overlay extends up.Layer

  keys: ->
    super.concat [
      'position',
      'align',
      'size',
      'origin', # for tethered anchor element
      'class',
      'openAnimation',
      'closeAnimation',
      'openDuration',
      'closeDuration',
      'openEasing',
      'closeEasing',
      'backdropOpenAnimation',
      'backdropCloseAnimation',
      'dismissLabel',
      'dismissAriaLabel',
      'dismissable',
      'onAccepted',
      'onDismissed',
      'onContentAttached',
      'onOpened'
    ]

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
    throw "implement me"

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
    throw "implement me"

  createElement: (parentElement = @stack.overlayContainer) ->
    attrs = u.compactObject
      'up-dismissable': @dismissable
      'up-flavor': @constructor.flavor
      'up-align': @align
      'up-position': @position,
      'up-size': @size,
    @element = e.affix(parentElement, '.up-overlay', attrs)
    @element.classList.add(@class) if @class

  destroyElement: (options) ->
    up.destroy(@element, options)

  createDismissElement: (parentElement) ->
    if @dismissable
      @dismissElement = e.affix(parentElement, '.up-overlay-dismiss[up-dismiss]',
        'aria-label': @dismissAriaLabel
      )
      e.affix(@dismissElement, 'span[aria-hidden="true"]', text: @dismissLabel)

  frameInnerContent: (parentElement, options) ->
    content = options.content
    @frameElement = e.affix(parentElement, '.up-overlay-frame')
    @contentElement = e.affix(@frameElement, '.up-overlay-content')
    @contentElement.appendChild(content)
    @createDismissElement(@frameElement)
    options.onContentAttached?({ layer: this, content })

  openAnimateOptions: ->
    easing: @openEasing
    duration: @openDuration

  closeAnimateOptions: ->
    easing: @closeEasing
    duration: @closeDuration

  allElements: (selector) ->
    e.all(@contentElement, selector)

  accept: (value, options = {}) ->
    new up.Change.AcceptLayer(u.merge(options, { value: value, layer: this })).executeAsync()

  dismiss: (value, options = {}) ->
    new up.Change.DismissLayer(u.merge(options, { value: value, layer: this })).executeAsync()
