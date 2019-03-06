#= require ../../layer
#= require ./record
#= require ./config

class up.layer.Base extends up.Record

  @keys: ->
    keys = [
      'flavor',
      'context'
    ]
    configKeys = Object.keys(up.layer.Base.config)
    return keys.concat(configKeys)

  @defaults: ->
    u.merge(super.defaults?(), @config)

  @config: new up.Config ->
    history: false
    maxWidth: null
    width: null
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

  constructor: (@options) ->
    @flavor = @constructor.flavor or up.fail('Layer flavor must implement a static { flavor } property')

  defaultTargets: ->
    @constructor.defaults().targets

  open: (parentElement, innerContentElement) ->
    throw "implement me"

  close: ->
    throw "implement me"

  sync: ->
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


class up.layer.WithViewport extends up.layer.Base

  # It makes only sense to have a single body shifter
  @bodyShifter: new up.BodyShifter()

  open: (parentElement, initialInnerContent) ->
    @createElement(parentElement)
    @backdropElement = affix(@element, '.up-layer-backdrop')
    @viewportElement = affix(@element, '.up-layer-viewport')
    @frameInnerContent(@viewportElement, initialInnerContent)

    @shiftBody()
    return @startOpenAnimation()

  close: ->
    return @startCloseAnimation().then =>
      @destroyElement()
      @unshiftBody()

  startOpenAnimation: ->
    animateOptions = @openAnimateOptions()

    return Promise.all([
      up.animate(@viewportElement, @evalOption(@openAnimation), animateOptions),
      up.animate(@backdropElement, @evalOption(@backdropOpenAnimation), animateOptions),
    ])

  shiftBody: ->
    @constructor.bodyShifter.shift()

  unshiftBody: ->
    @constructor.bodyShifter.unshift()

  startCloseAnimation: ->
    animateOptions = @closeAnimateOptions()
    return Promise.all([
      up.animate(@viewportElement, @evalOption(@closeAnimation), animateOptions),
      up.animate(@backdropElement, @evalOption(@backdropCloseAnimation), animateOptions),
    ])



class up.layer.WithTether extends up.layer.Base

  open: (parentElement, initialInnerContent) ->
    @createElement(parentElement)
    @frameInnerContent(@element, initialInnerContent)
    @tether = new up.Tether(
      element: @frameElement
      anchor: @origin
      align: @align
      position: @position
    )
    return @startOpenAnimation()

  close: ->
    return @startCloseAnimation().then =>
      @tether.stop()
      @destroyElement()

  startOpenAnimation: ->
    return up.animate(@frameElement, @evalOption(@openAnimation), @openAnimateOptions())

  startCloseAnimation: ->
    return up.animate(@frameElement, @evalOption(@closeAnimation), @closeAnimateOptions())


class up.layer.Root extends up.layer.Base

  @config: new up.Config ->
    history: true
    targets: ['body'] # this replaces up.fragment.config.targets
    dismissable: false

  @flavor: 'root'

  constructor: (options) ->
    super(options)
    @element = document.documentElement

  open: ->
    throw new Error('Cannot open another root layer')

  close: ->
    throw new Error('Cannot close the root layer')


class up.layer.Modal extends up.layer.WithViewport

  @flavor: 'modal'

  @config: new up.Config


class up.layer.Drawer extends up.layer.WithViewport

  @flavor: 'drawer'

  @config: new up.Config ->
    position: 'right'


class up.layer.Fullscreen extends up.layer.WithViewport

  @flavor: 'fullscreen'

  @config: new up.Config


class up.layer.Popup extends up.layer.WithTether

  @flavor: 'popup'

  @config: new up.Config ->
    position: 'bottom'
    align: 'left'
