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
up.viewport = (->

  u = up.util

  ###*
  @method up.viewport.defaults
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {String} [options.viewSelector]
  ###
  config = u.config
    duration: 0
    viewSelector: 'body, .up-modal, [up-viewport]'
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

  ###*
  @method up.reveal
  @param {String|Element|jQuery} element
  @param {String|Element|jQuery} [options.view]
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @return {Deferred}
  @protected
  ###
  reveal = (elementOrSelector, options) ->

    options = u.options(options)

    $element = $(elementOrSelector)
    $view = findView($element, options.view)
    viewIsBody = $view.is('body')

    viewHeight = if viewIsBody then u.clientSize().height else $view.height()

    originalScrollPos = $view.scrollTop()
    newScrollPos = originalScrollPos

    # When the scrolled element is not <body> but instead a container
    # with overflow-y: scroll, $.position returns the position the
    # the first row of the client area instead of the first row of
    # the canvas buffer.
    # http://codepen.io/anon/pen/jPojGE
    offsetShift = if viewIsBody then 0 else originalScrollPos

    firstVisibleRow = -> newScrollPos
    lastVisibleRow = -> newScrollPos + viewHeight - 1

    elementDims = u.measure($element, relative: true)
    firstElementRow = elementDims.top + offsetShift
    lastElementRow = firstElementRow + elementDims.height - 1

    if lastElementRow > lastVisibleRow()
      # Try to show the full height of the element
      newScrollPos += (lastElementRow - lastVisibleRow())

    if firstElementRow < firstVisibleRow()
      # If the full element does not fit, scroll to the first row
      newScrollPos = firstElementRow

    if newScrollPos != originalScrollPos
      scroll($view, newScrollPos, options)
    else
      u.resolvedDeferred()

  ###*
  @private
  @method up.viewport.findView
  ###
  findView = ($element, viewSelectorOrElement) ->
    $view = undefined
    # If someone has handed as a jQuery element, that's the
    # view period.
    if u.isJQuery(viewSelectorOrElement)
      $view = viewSelectorOrElement
    else
      # If we have been given
      viewSelector = u.presence(viewSelectorOrElement) || config.viewSelector
      $view = $element.closest(viewSelector)

    $view.length or u.error("Could not find view to scroll for %o (tried selectors %o)", $element, viewSelectors)
    $view


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

up.scroll = up.viewport.scroll
up.reveal = up.viewport.reveal
