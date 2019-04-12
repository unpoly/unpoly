#= require ./base

e = up.element
u = up.util

# Base class for all non-root layer flavors
class up.Layer.Overlay extends up.Layer

  # TODO: Rename openNow to something that doesn't have the sync/async connotation
  openNow: (parentElement, innerContentElement, options) ->
    throw "implement me"

  # TODO: Rename closeNow to something that doesn't have the sync/async connotation
  closeNow: (options) ->
    throw "implement me"

  createElement: (parentElement) ->
    @element = e.affix(parentElement, '.up-layer',
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
    if target.closest('.up-layer-frame')
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
    closePromise = if target.closest('.up-layer-frame')
      # User clicked inside the layer's frame.
      if dismisser = @closestDismisser(target)
        closePromise = up.layer.dismiss({ layer: this, origin: dismisser })
      else if confirmer = target.closest('[up-confirm]')
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

  createDismissElement: (parentElement) ->
    if @dismissable
      @dismissElement = affix(parentElement, '.up-layer-dismiss[up-dismiss]',
        'aria-label': @dismissAriaLabel
      )
      affix(@dismissElement, 'span[aria-hidden="true"]', text: @dismissLabel)

  frameInnerContent: (parentElement, innerContentElement, options) ->
    @frameElement = affix(parentElement, '.up-layer-frame')
    @contentElement = affix(@frameElement, '.up-layer-content')
    @contentElement.appendChild(innerContentElement)
    @createDismissElement(@frameElement)
    options.onContentAttached?(layer, innerContentElement)

  openAnimateOptions: ->
    easing: @openEasing
    duration: @openDuration

  closeAnimateOptions: ->
    easing: @closeEasing
    duration: @closeDuration

  withAnimatingClass: (startAnimation) ->
    @markAsAnimating(true)
    return startAnimation.then => @markAsAnimating(false)

  markAsAnimating: (state) ->
    e.toggleClass(@element, 'up-layer-animating', state)

  allElements: (selector) ->
    e.all(@contentElement, selector)

  accept: (value, options) ->
    @closeVariant(value, u.merge(options,
      valueAttr: 'up-accept'
      closeEvent: 'up:layer:accept'
      closedEvent: 'up:layer:accepted'
      closedCallback: @onAccepted
    ))

  dismiss: (value, options) ->
    @closeVariant(value, u.merge(options,
      valueAttr: 'up-dismiss'
      closeEvent: 'up:layer:dismiss'
      closedEvent: 'up:layer:dismissed'
      closedCallback: @onDismissed
    ))

  closeVariant: (value, options) ->
    origin = options.origin

    if origin && u.isUndefined(value)
      value = e.jsonAttr(origin, options.valueAttr)

    eventProps =
      target: @element
      layer: this
      value: value
      origin: origin

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort(preflightLayer: this)

    if up.event.nobodyPrevents(options.closeEvent, eventProps) || options.preventable == false
      unless @isOpen()
        return Promise.resolve()

      @stack.remove(this)

      promise = @peel()

      promise = promise.then =>
        @parent.renderHistory()
        return @closeNow()

      promise = promise.then =>
        # Wait for the callbacks until the closing animation ends,
        # so user-provided code doesn't run too wildly out of order.
        if closedCallback = options.closedCallback
          # Also see up.layer.closeHandlerAttr()
          closedCallback(value, eventProps)

        up.emit(options.closedEvent, eventProps)

      return promise

    else
      return up.event.abortRejection()
