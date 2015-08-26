###*
Viewport scrolling
==================

This modules contains functions to scroll the viewport and reveal contained elements.

@class up.layout
###
up.layout = (->

  u = up.util

  ###*


  @method up.layout.defaults
  @param {String} [options.viewport]
  @param {String} [options.fixedTop]
  @param {String} [options.fixedBottom]
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {Number} [options.snap]
  ###
  config = u.config
    duration: 0
    viewport: 'body, .up-modal, [up-viewport]'
    fixedTop: '[up-fixed~=top]'
    fixedBottom: '[up-fixed~=bottom]'
    snap: 50
    easing: 'swing'

  reset = ->
    config.reset()

  SCROLL_PROMISE_KEY = 'up-scroll-promise'

  ###*
  Scrolls the given viewport to the given Y-position.

  A "viewport" is an element that has scrollbars, e.g. `<body>` or
  a container with `overflow-x: scroll`.

  \#\#\#\# Example

  This will scroll a `<div class="main">...</div>` to a Y-position of 100 pixels:

      up.scoll('.main', 100);

  \#\#\#\# Animating the scrolling motion

  The scrolling can (optionally) be animated.

    up.scoll('.main', 100, {
      easing: 'swing',
      duration: 250
    });

  If the given viewport is already in a scroll animation when `up.scroll`
  is called a second time, the previous animation will instantly jump to the
  last frame before the next animation is started.

  @protected
  @method up.scroll
  @param {String|Element|jQuery} viewport
    The container element to scroll.
  @param {Number} scrollPos
    The absolute number of pixels to set the scroll position to.
  @param {Number}[options.duration]
    The number of miliseconds for the scrolling's animation.
  @param {String}[options.easing]
    The timing function that controls the acceleration for the scrolling's animation.
  @return {Deferred}
    A promise that will be resolved when the scrolling ends.
  ###
  scroll = (viewport, scrollTop, options) ->
    $view = $(viewport)
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
  Scroll's the given element's viewport so the element
  is visible for the user.

  By default Up.js will always reveal an element before
  updating it with Javascript functions like [`up.replace`](/up.flow#up.replace)
  or UJS behavior like [`[up-target]`](/up.link#up-target).

  \#\#\#\# How Up.js finds the viewport

  The viewport (the container that is going to be scrolled)
  is the closest parent of the element that is either:

  - the currently open [modal](/up.modal)
  - an element with the attribute `[up-viewport]`
  - the `<body>` element
  - an element matching the selector you have configured using `up.viewport.defaults({ viewSelector: 'my-custom-selector' })`

  \#\#\#\# Fixed elements obstruction the viewport

  Many applications have a navigation bar fixed to the top or bottom,
  obstructing the view on an element.

  To make `up.aware` of these fixed elements you can either:

  - give the element an attribute [`up-fixed="top"`](#up-fixed-top) or [`up-fixed="bottom"`](up-fixed-bottom)
  - [configure default options](#up.layout.defaults) for `fixedTop` or `fixedBottom`

  @method up.reveal
  @param {String|Element|jQuery} element
  @param {String|Element|jQuery} [options.viewport]
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {String} [options.snap]
  @return {Deferred}
    A promise that will be resolved when the element is revealed.
  ###
  reveal = (elementOrSelector, options) ->
    options = u.options(options)
    $element = $(elementOrSelector)
    $viewport = findViewport($element, options.viewport)

    snap = u.option(options.snap, config.snap)

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

    if newScrollPos < snap
      newScrollPos = 0

    if newScrollPos != originalScrollPos
      scroll($viewport, newScrollPos, options)
    else
      u.resolvedDeferred()

  ###*
  @private
  @method up.viewport.findViewport
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
  Marks this element as a scrolling container. Apply this ttribute if your app uses
  a custom panel layout with fixed positioning instead of scrolling `<body>`.

  [`up.reveal`](/up.reveal) will always try to scroll the viewport closest
  to the element that is being revealed. By default this is the `<body>` element.

  \#\#\#\# Example

  Here is an example for a layout for an e-mail client, showing a list of e-mails
  on the left side and the e-mail text on the right side:

      .side {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        width: 100px;
        overflow-y: scroll;
      }

      .main {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 100px;
        right: 0;
        overflow-y: scroll;
      }

  This would be the HTML (notice the `up-viewport` attribute):

      <div class=".side" up-viewport>
        <a href="/emails/5001" up-target=".main">Re: Your invoice</a>
        <a href="/emails/2023" up-target=".main">Quote for services</a>
        <a href="/emails/9002" up-target=".main">Fwd: Room reservation</a>
      </div>

      <div class="main" up-viewport>
        <h1>Re: Your Invoice</h1>
        <p>
          Lorem ipsum dolor sit amet, consetetur sadipscing elitr.
          Stet clita kasd gubergren, no sea takimata sanctus est.
        </p>
      </div>

  @method [up-viewport]
  @ujs
  ###

  ###*
  Marks this element as a navigation fixed to the top edge of the screen
  using `position: fixed`.

  [`up.reveal`](/up.reveal) is aware of fixed elements and will scroll
  the viewport far enough so the revealed element is fully visible.

  Example:

      <div class="top-nav" up-fixed="top">...</div>

  @method [up-fixed=top]
  @ujs
  ###

  ###*
  Marks this element as a navigation fixed to the bottom edge of the screen
  using `position: fixed`.

  [`up.reveal`](/up.reveal) is aware of fixed elements and will scroll
  the viewport far enough so the revealed element is fully visible.

  Example:

      <div class="bottom-nav" up-fixed="bottom">...</div>

  @method [up-fixed=bottom]
  @ujs
  ###

  up.bus.on 'framework:reset', reset

  reveal: reveal
  scroll: scroll
  finishScrolling: finishScrolling
  defaults: config.update

)()

up.scroll = up.layout.scroll
up.reveal = up.layout.reveal
