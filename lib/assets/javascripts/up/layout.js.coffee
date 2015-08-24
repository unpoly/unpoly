###*
Viewport scrolling
==================

This modules contains functions to scroll the viewport and reveal contained elements.

By default Up.js will always scroll to an element before updating it.

The container that will be scrolled is the closest parent of the element that is either:

- The currently open [modal](/up.modal)
- An element with the attribute `[up-viewport]`
- The `<body>` element
- An element matching the selector you have configured using `up.viewport.defaults({ viewSelector: 'my-custom-selector' })`.

@class up.viewport  
###
up.layout = (->

  u = up.util

  ###*
  @method up.viewport.defaults
  @param {String} [options.viewport]
  @param {String} [options.fixedTop]
  @param {String} [options.fixedBottom]
  @param {Number} [options.duration]
  @param {String} [options.easing]
  ###
  config = u.config
    duration: 0
    viewport: 'body, .up-modal, [up-viewport]'
    fixedTop: '[up-fixed~=top]'
    fixedBottom: '[up-fixed~=bottom]'
    easing: 'swing'

  reset = ->
    config.reset()

  SCROLL_PROMISE_KEY = 'up-scroll-promise'

  ###*
  @method up.scroll
  @param {String|Element|jQuery} viewOrSelector
  @param {Number} scrollPos
  @param {String}[options.duration]
  @param {String}[options.easing]
  @return {Deferred}
  @protected 
  ###
  scroll = (viewOrSelector, scrollTop, options) ->
    $view = $(viewOrSelector)
    options = u.options(options)
    duration = u.option(options.duration, config.duration)
    easing = u.option(options.easing, config.easing)

    finishScrolling($view)

    if duration > 0
      deferred = $.Deferred()

      $view.data(SCROLL_PROMISE_KEY, deferred)
      deferred.then ->
        $view.removeData(SCROLL_PROMISE_KEY)
        # Since we're scrolling using #animate, #finish can be
        # used to jump to the last frame:
        # https://api.jquery.com/finish/
        $view.finish()

      targetProps =
        scrollTop: scrollTop

      $view.animate targetProps,
        duration: duration,
        easing: easing,
        complete: -> deferred.resolve()

      deferred
    else
      $view.scrollTop(scrollTop)
      u.resolvedDeferred()

  ###*
  @method up.viewport.finishScrolling
  @private
  ###
  finishScrolling = (elementOrSelector) ->
    $(elementOrSelector).each ->
      if existingScrolling = $(this).data(SCROLL_PROMISE_KEY)
        existingScrolling.resolve()

#  obstructionTop = ->
#    line = 0
#    if config.fixedSelector
#      for element in $(config.fixedSelector) ->
#        $element = $(this)
#        top = parseInt($element.css('top'))
#        if $element.css('top').match(/^\d/) && $element.css('bottom') == 'auto'
#
#    line

  measureObstruction = ->

    measurePosition = (obstructor, cssAttr) ->
      $obstructor = $(obstructor)
      anchorPosition = $obstructor.css(cssAttr)
      unless anchorPosition == '0' or u.endsWith(anchorPosition, 'px')
        u.error("Fixed element must have an anchor position in px, but was %o", anchorPosition)
      parseInt(anchorPosition) + $obstructor.height()

    fixedTopBottoms = for obstructor in $(config.fixedTop)
      measurePosition(obstructor, 'top')

    fixedBottomTops = for obstructor in $(config.fixedBottom)
      measurePosition(obstructor, 'bottom')

    top: Math.max(0, fixedTopBottoms...)
    bottom: Math.max(0, fixedBottomTops...)

  ###*
  @method up.reveal
  @param {String|Element|jQuery} element
  @param {String|Element|jQuery} [options.viewport]
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @return {Deferred}
  @protected
  ###
  reveal = (elementOrSelector, options) ->

    options = u.options(options)

    $element = $(elementOrSelector)
    $viewport = findViewport($element, options.viewport)
    viewportIsBody = $viewport.is('body')

    viewportHeight = if viewportIsBody then u.clientSize().height else $viewport.height()

    originalScrollPos = $viewport.scrollTop()
    newScrollPos = originalScrollPos

    offsetShift = undefined
    obstruction = undefined

    if viewportIsBody
      obstruction = measureObstruction()
      # Within the body, $.position will always return the distance
      # from the document top and *not* the distance of the viewport
      # top. This is what the calculations below expect, so don't shift.
      offsetShift = 0
    else
      obstruction = { top: 0, bottom: 0 }
      # When the scrolled element is not <body> but instead a container
      # with overflow-y: scroll, $.position returns the position the
      # viewport's top edge instead of the first row of  the canvas buffer.
      # http://codepen.io/anon/pen/jPojGE
      offsetShift = originalScrollPos

    predictFirstVisibleRow = -> newScrollPos + obstruction.top
    predictLastVisibleRow = -> newScrollPos + viewportHeight - obstruction.bottom - 1

    elementDims = u.measure($element, relative: true)
    firstElementRow = elementDims.top + offsetShift
    lastElementRow = firstElementRow + elementDims.height - 1

    if lastElementRow > predictLastVisibleRow()
      # Try to show the full height of the element
      newScrollPos += (lastElementRow - predictLastVisibleRow())

    if firstElementRow < predictFirstVisibleRow()
      # If the full element does not fit, scroll to the first row
      newScrollPos = firstElementRow - obstruction.top

    if newScrollPos != originalScrollPos
      scroll($viewport, newScrollPos, options)
    else
      u.resolvedDeferred()

  ###*
  @private
  @method up.viewport.findView
  ###
  findViewport = ($element, viewportSelectorOrElement) ->
    $viewport = undefined
    # If someone has handed as a jQuery element, that's the
    # view period.
    if u.isJQuery(viewportSelectorOrElement)
      $viewport = viewportSelectorOrElement
    else
      vieportSelector = u.presence(viewportSelectorOrElement) || config.viewport
      $viewport = $element.closest(vieportSelector)

    $viewport.length or u.error("Could not find viewport for %o", $element)
    $viewport

  ###*
  Marks this element as a scrolling container.
  Use this e.g. if your app uses a custom panel layout with fixed positioning
  instead of scrolling `<body>`.

  @method [up-viewport]
  ###

  up.bus.on 'framework:reset', reset

  reveal: reveal
  scroll: scroll
  finishScrolling: finishScrolling
  defaults: config.update

)()

up.scroll = up.layout.scroll
up.reveal = up.layout.reveal
