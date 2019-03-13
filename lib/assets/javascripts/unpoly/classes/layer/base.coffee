#= require ./record
#= require ./config

e = up.element
u = up.util

class up.Layer extends up.Record

  constructor: (options) ->
    if u.isGiven(options.closable)
      up.legacy.warn('Layer options { closable } has been renamed to { dismissable }')
      options.dismissable = options.closable

  @keys: ->
    keys = [
      'flavor',
      'context'
    ]
    configKeys = Object.keys(up.layer.config)
    return keys.concat(configKeys)

  @defaults: ->
    u.merge(super.defaults?(), @config)

  @config: new up.Config ->
    history: false
    location: null
    title: null
    origin: null
    position: null
    align: null
    size: null
    class: null
    targets: []
    openAnimation: 'fade-in'
    closeAnimation: 'fade-out'
    openDuration: null
    closeDuration: null
    openEasing: null
    closeEasing: null
    backdropOpenAnimation: 'fade-in'
    backdropCloseAnimation: 'fade-out'
    dismissLabel: '×'
    dismissAriaLabel: 'Dismiss dialog'
    dismissible: true
    onCreated: null
    onDismissed: null
    onConfirmed: null
    onContentAttached: null

  constructor: (@stack, options) ->
    super(options)
    @flavor = @constructor.flavor or up.fail('Layer flavor must implement a static { flavor } property')

  defaultTargets: ->
    @constructor.defaults().targets

  open: (parentElement, innerContentElement) ->
    throw "implement me"

  close: ->
    throw "implement me"

  sync: ->
    # no-op so users can blindly sync without knowing the current flavor

  createElement: (parentElement) ->
    @element = e.affix(parentElement, '.up-layer',
      'up-dismissable': @dismissable
      'up-flavor': @flavor
      'up-align': @align
      'up-position': @position,
      'up-size': @size,
    )
    @element.classList.add(@class) if @class

    throw "CSS styles that make .up-layer full height"

    e.on @element, 'mousedown', (event) ->
      if event.closest('.up-layer-frame')
        # User clicked inside the layer's frame. We will let the event bubble
        # up to the document where up.link handlers will process [up-follow][up-instant]
        # for a link inside the frame.
      else
        # User clicked outside the layer's frame. We prevent further bubbling
        # to not hit the body or the document. The user may also dismiss this layer by
        # clicking outside the frame, but that is handled an click, not mousedown.
        up.event.halt(event)

    e.on @element, 'click', (event) =>
      closePromise = if event.closest('.up-layer-frame')
        # User clicked inside the layer's frame.
        if dismisser = event.closest('[up-dismiss]')
          closePromise = up.layer.dismiss({ layer: this, origin: dismisser })
        else if confirmer = event.closest('[up-confirm]')
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

  frameInnerContent: (parentElement, innerContentElement) ->
    @frameElement = affix(parentElement, '.up-layer-frame')
    @contentElement = affix(@frameElement, '.up-layer-content')
    @contentElement.appendChild(innerContentElement)
    @createDismissElement(@frameElement)
    @onContentAttached?()

  openAnimateOptions: ->
    easing: @openEasing
    duration: @openDuration

  closeAnimateOptions: ->
    easing: @closeEasing
    duration: @closeDuration

  evalOption: (option) ->
    u.evalOption(option, this)

  destroyElement: ->
    e.remove(@element)

  confirm: (options) ->
    @closeVariant(u.merge(options,
      valueAttr: 'up-confirm'
      closeEvent: 'up:layer:confirm'
      closedEvent: 'up:layer:confirmed'
      closedCallback: @onConfirmed
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
        @close().then ->
          if emitEvents
            # Wait for the callbacks until the closing animation ends,
            # so user-provided code doesn't run too wildly out of order.

            if closedCallback = options.closedCallback
              # Callback option only gets the resolution value.
              # Also see up.layer.closeHandlerAttr()
              closedCallback.call(origin, options.value)

            # Global event gets the full event props
            up.emit(options.closedEvent, eventProps)
    else
      return up.event.abortRejection()

  firstElement: (selector) ->
    @allElements(selector)[0]

  allElements: (selector) ->
    e.all(@element, selector)

  sync: ->
    # no-op

