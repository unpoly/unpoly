#= require ./base

e = up.element
u = up.util

class up.Layer.Overlay extends up.Layer

  openNow: (parentElement, innerContentElement, options) ->
    throw "implement me"

  closeNow: (options) ->
    throw "implement me"

  createElement: (parentElement) ->
    @element = e.affix(parentElement, '.up-layer',
      'up-dismissable': @dismissable
      'up-flavor': @flavor
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
      if dismisser = target.closest('[up-dismiss]')
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

  accept: (options) ->
    @closeVariant(u.merge(options,
      valueAttr: 'up-accept'
      closeEvent: 'up:layer:accept'
      closedEvent: 'up:layer:accepted'
      closedCallback: @onAccepted
    ))

  dismiss: (options) ->
    @closeVariant(u.merge(options,
      valueAttr: 'up-dismiss'
      closeEvent: 'up:layer:dismiss'
      closedEvent: 'up:layer:dismissed'
      closedCallback: @onDismissed
    ))

  closeVariant: (options) ->
    origin = options.origin
    emitEvents = options.emitEvents ? true

    if origin
      options.value ?= e.jsonAttr(origin, options.valueAttr)

    eventProps =
      target: @element
      layer: this
      value: options.value
      origin: origin

    # Abort all pending requests targeting the layer we're now closing.
    up.proxy.abort(preflightLayer: this)

    if !emitEvents || up.event.nobodyPrevents(options.closeEvent, eventProps)
      # Synchronously remove the layer from the stack so other sync calls
      # immediately see the updated stack. Everything after that is just optics.
      @stack.remove(this)

      return @stack.asap ->
        @closeNow().then ->
          if emitEvents
            # Wait for the callbacks until the closing animation ends,
            # so user-provided code doesn't run too wildly out of order.

            if closedCallback = options.closedCallback
              # Callback option only gets the resolution value.
              # Also see up.layer.closeHandlerAttr()
              closedCallback.call(origin, options.value, eventProps)

            # Global event gets the full event props
            up.emit(options.closedEvent, eventProps)
    else
      return up.event.abortRejection()
