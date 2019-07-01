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
      'dismissible',
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

  createElement: (parentElement = @stack.container) ->
    @element = e.affix(parentElement, '.up-overlay',
      'up-dismissable': @dismissable
      'up-flavor': @constructor.flavor
      'up-align': @align
      'up-position': @position,
      'up-size': @size,
    )
    @element.classList.add(@class) if @class
    @element.addEventListener 'mousedown', @onElementMouseDown
    @element.addEventListener 'click', @onElementClick

  destroyElement: ->
    up.destroy(@element)

  onElementMouseDown: (event) =>
    target = event.target
    if target.closest('.up-overlay-frame')
      # User clicked inside the layer's frame. We will let the event bubble
      # up to the document where up.link handlers will process [up-follow][up-instant]
      # for a link inside the frame.
    else
      # User clicked outside the layer's frame. We prevent further bubbling
      # to not hit the body or the document. The user may also dismiss this layer by
      # clicking outside the frame, but that is handled an click, not mousedown.
      up.event.halt(event)

  onElementClick: (event) =>
    target = event.target
    closePromise = if target.closest('.up-overlay-frame')
      # User clicked inside the layer's frame.
      if dismisser = @closestDismisser(target)
        closePromise = up.layer.dismiss({ layer: this, origin: dismisser })
      else if confirmer = @closestConfirmer(target)
        closePromise = up.layer.confirm({ layer: this, origin: confirmer })
      else
        # User clicked inside the layer's frame, but not on a link that would
        # close this modal. We will let the event bubble up to the document where
        # up.link handlers will process [up-follow] for a link inside the frame.
    else
      # User clicked outside the layer's frame.
      if @dismissable
        closePromise = up.layer.dismiss({ layer: this, origin: @element })

    if closePromise
      u.muteRejection(closePromise)
      up.event.halt(event)

  closestDismisser: (element) ->
    dismisser = element.closest('[up-dismiss], [up-close]')
    if e.matches(dismisser, '[up-close]')
      up.legacy.deprecated('[up-close]', '[up-dismiss]')
    return dismisser

  closestConfirmer: (element) ->
    return element.closest('[up-confirm]')

  createDismissElement: (parentElement) ->
    if @dismissable
      @dismissElement = affix(parentElement, '.up-overlay-dismiss[up-dismiss]',
        'aria-label': @dismissAriaLabel
      )
      affix(@dismissElement, 'span[aria-hidden="true"]', text: @dismissLabel)

  frameInnerContent: (parentElement, options) ->
    content = options.content
    @frameElement = affix(parentElement, '.up-overlay-frame')
    @contentElement = affix(@frameElement, '.up-overlay-content')
    @contentElement.appendChild(content)
    @createDismissElement(@frameElement)
    options.onContentAttached?({ layer, content })

  openAnimateOptions: ->
    easing: @openEasing
    duration: @openDuration

  closeAnimateOptions: ->
    easing: @closeEasing
    duration: @closeDuration

  withAnimatingClass: (startAnimation) ->
    @markAsAnimating(true)
    return startAnimation.then => @markAsAnimating(false)

  markAsDestroying: ->
    up.fragment.markAsDestroying(@element)

  markAsAnimating: (state) ->
    e.toggleClass(@element, 'up-layer-animating', state)

  allElements: (selector) ->
    e.all(@contentElement, selector)

  accept: (value, options = {}) ->
    new up.Change.AcceptLayer(u.merge(options, { value })).executeAsync()

  dismiss: (value, options = {}) ->
    new up.Change.DismissLayer(u.merge(options, { value })).executeAsync()
