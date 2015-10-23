###*
Viewport scrolling
==================

This modules contains functions to scroll the viewport and reveal contained elements.

@class up.layout
###
up.layout = (($) ->

  u = up.util

  ###*
  Configures the application layout.

  @method up.layout.config
  @property
  @param {Array<String>} [config.viewports]
    An array of CSS selectors that find viewports
    (containers that scroll their contents).
  @param {Array<String>} [config.fixedTop]
    An array of CSS selectors that find elements fixed to the
    top edge of the screen (using `position: fixed`).
  @param {Array<String>} [config.fixedBottom]
    An array of CSS selectors that find elements fixed to the
    bottom edge of the screen (using `position: fixed`).
  @param {Array<String>} [config.anchoredRight]
    An array of CSS selectors that find elements anchored to the
    right edge of the screen (using `position: fixed` or `position: absolute`).
  @param {Number} [config.duration]
    The duration of the scrolling animation in milliseconds.
    Setting this to `0` will disable scrolling animations.
  @param {String} [config.easing]
    The timing function that controls the animation's acceleration.
    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {Number} [config.snap]
    When [revealing](#up.reveal) elements, Up.js will scroll an viewport
    to the top when the revealed element is closer to the top than `config.snap`.
  @param {Number} [config.substance]
    A number indicating how many top pixel rows of an element to [reveal](#up.reveal).
  ###
  config = u.config
    duration: 0
    viewports: [document, '.up-modal', '[up-viewport]']
    fixedTop: ['[up-fixed~=top]']
    fixedBottom: ['[up-fixed~=bottom]']
    anchoredRight: ['[up-anchored~=right]', '[up-fixed~=top]', '[up-fixed~=bottom]', '[up-fixed~=right]']
    snap: 50
    substance: 150
    easing: 'swing'

  lastScrollTops = u.cache
    size: 30,
    key: up.history.normalizeUrl

  reset = ->
    config.reset()
    lastScrollTops.clear()

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
    $viewport = $(viewport)
    options = u.options(options)
    duration = u.option(options.duration, config.duration)
    easing = u.option(options.easing, config.easing)

    finishScrolling($viewport)

    if duration > 0
      deferred = $.Deferred()

      $viewport.data(SCROLL_PROMISE_KEY, deferred)
      deferred.then ->
        $viewport.removeData(SCROLL_PROMISE_KEY)
        # Since we're scrolling using #animate, #finish can be
        # used to jump to the last frame:
        # https://api.jquery.com/finish/
        $viewport.finish()

      targetProps =
        scrollTop: scrollTop

      if $viewport.get(0) == document
        $viewport = $('html, body') # FML

      $viewport.animate targetProps,
        duration: duration,
        easing: easing,
        complete: -> deferred.resolve()

      deferred
    else
      $viewport.scrollTop(scrollTop)
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
  @method up.viewport.anchoredRight
  @private
  ###
  anchoredRight = ->
    u.multiSelector(config.anchoredRight).select()

  measureObstruction = ->

    measurePosition = (obstructor, cssAttr) ->
      $obstructor = $(obstructor)
      anchorPosition = $obstructor.css(cssAttr)
      unless u.isPresent(anchorPosition)
        u.error("Fixed element %o must have a CSS attribute %o", $obstructor, cssAttr)
      parseInt(anchorPosition) + $obstructor.height()

    fixedTopBottoms = for obstructor in $(config.fixedTop.join(', '))
      measurePosition(obstructor, 'top')

    fixedBottomTops = for obstructor in $(config.fixedBottom.join(', '))
      measurePosition(obstructor, 'bottom')

    top: Math.max(0, fixedTopBottoms...)
    bottom: Math.max(0, fixedBottomTops...)

  ###*
  Scroll's the given element's viewport so the first rows of the
  element are visible for the user.

  By default Up.js will always reveal an element before
  updating it with Javascript functions like [`up.replace`](/up.flow#up.replace)
  or UJS behavior like [`[up-target]`](/up.link#up-target).

  \#\#\#\# How Up.js finds the viewport

  The viewport (the container that is going to be scrolled)
  is the closest parent of the element that is either:

  - the currently open [modal](/up.modal)
  - an element with the attribute `[up-viewport]`
  - the `<body>` element
  - an element matching the selector you have configured using `up.viewport.config.viewports.push('my-custom-selector')`

  \#\#\#\# Fixed elements obstruction the viewport

  Many applications have a navigation bar fixed to the top or bottom,
  obstructing the view on an element.

  To make `up.aware` of these fixed elements you can either:

  - give the element an attribute [`up-fixed="top"`](#up-fixed-top) or [`up-fixed="bottom"`](up-fixed-bottom)
  - [configure default options](#up.layout.config) for `fixedTop` or `fixedBottom`

  @method up.reveal
  @param {String|Element|jQuery} element
  @param {Number} [options.duration]
  @param {String} [options.easing]
  @param {String} [options.snap]
  @param {String|Element|jQuery} [options.viewport]
  @param {Boolean} [options.top=false]
    Whether to scroll the viewport so that the first element row aligns
    with the top edge of the viewport.
  @return {Deferred}
    A promise that will be resolved when the element is revealed.
  ###
  reveal = (elementOrSelector, options) ->
    u.debug('Revealing %o', elementOrSelector)
    options = u.options(options)
    $element = $(elementOrSelector)
    $viewport = if options.viewport then $(options.viewport) else viewportOf($element)

    snap = u.option(options.snap, config.snap)

    viewportIsDocument = $viewport.is(document)
    viewportHeight = if viewportIsDocument then u.clientSize().height else $viewport.height()
    originalScrollPos = $viewport.scrollTop()
    newScrollPos = originalScrollPos

    offsetShift = undefined
    obstruction = undefined

    if viewportIsDocument
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

    elementDims = u.measure($element, relative: $viewport)
    firstElementRow = elementDims.top + offsetShift

    lastElementRow = firstElementRow + Math.min(elementDims.height, config.substance) - 1

    if lastElementRow > predictLastVisibleRow()
      # Try to show the full height of the element
      newScrollPos += (lastElementRow - predictLastVisibleRow())

    if firstElementRow < predictFirstVisibleRow() || options.top
      # If the full element does not fit, scroll to the first row
      newScrollPos = firstElementRow - obstruction.top

    if newScrollPos < snap
      newScrollPos = 0

    if newScrollPos != originalScrollPos
      scroll($viewport, newScrollPos, options)
    else
      u.resolvedDeferred()

  viewportSelector = ->
    u.multiSelector(config.viewports)

  ###*
  Returns the viewport for the given element.

  Throws an error if no viewport could be found.

  @protected
  @method up.layout.viewportOf
  @param {String|Element|jQuery} selectorOrElement
  ###
  viewportOf = (selectorOrElement) ->
    $element = $(selectorOrElement)
    $viewport = viewportSelector().seekUp($element)
    $viewport.length or u.error("Could not find viewport for %o", $element)
    $viewport

  ###*
  Returns a jQuery collection of all the viewports contained within the
  given selector or element.

  @protected
  @method up.layout.viewportsWithin
  @param {String|Element|jQuery} selectorOrElement
  @return jQuery
  ###
  viewportsWithin = (selectorOrElement) ->
    $element = $(selectorOrElement)
    viewportSelector().findWithSelf($element)

  ###*
  Returns a jQuery collection of all the viewports on the screen.

  @protected
  @method up.layout.viewports
  ###
  viewports = ->
    viewportSelector().select()

  ###*
  Returns a hash with scroll positions.

  Each key in the hash is a viewport selector. The corresponding
  value is the viewport's top scroll position:

      up.layout.scrollTops()
      => { '.main': 0, '.sidebar': 73 }

  @method up.layout.scrollTops
  @return Object<String, Number>
  @protected
  ###
  scrollTops = ->
    topsBySelector = {}
    for viewport in config.viewports
      $viewport = $(viewport)
      if $viewport.length
        key = viewport
        key = 'document' if viewport == document
        topsBySelector[key] = $viewport.scrollTop()
    topsBySelector

  ###*
  @method up.layout.fixedChildren
  @protected
  ###
  fixedChildren = (root = undefined) ->
    root ||= document.body
    $root = $(root)
    $elements = $root.find('[up-fixed]')
    $elements = $elements.add($root.find(config.fixedTop.join(', '))) if u.isPresent(config.fixedTop)
    $elements = $elements.add($root.find(config.fixedBottom.join(', '))) if u.isPresent(config.fixedBottom)
    $elements

  ###*
  Saves the top scroll positions of all the
  viewports configured in [`up.layout.config.viewports`](#up.layout.config).
  The saved scroll positions can be restored by calling
  [`up.layout.restoreScroll()`](#up.layout.restoreScroll).

  @method up.layout.saveScroll
  @param {String} [options.url]
  @param {Object<String, Number>} [options.tops]
  @protected
  ###
  saveScroll = (options = {}) ->
    url = u.option(options.url, up.history.url())
    tops = u.option(options.tops, scrollTops())
    u.debug('Saving scroll positions for URL %o: %o', url, tops)
    lastScrollTops.set(url, tops)

  ###*
  Restores the top scroll positions of all the
  viewports configured in [`up.layout.config.viewports`](#up.layout.config).

  @method up.layout.restoreScroll
  @param {jQuery} [options.around]
    If set, only restores viewports that are either an ancestor
    or descendant of the given element.
  @protected
  ###
  restoreScroll = (options = {}) ->

    url = up.history.url()

    $viewports = undefined

    if options.around
      $descendantViewports = viewportsWithin(options.around)
      $ancestorViewports = viewportOf(options.around)
      $viewports = $ancestorViewports.add($descendantViewports)
    else
      $viewports = viewports()

    tops = lastScrollTops.get(url)

    u.debug('Restoring scroll positions for URL %o (viewports are %o, saved tops are %o)', url, $viewports, tops)

    for key, scrollTop of tops
      right = if key == 'document' then document else key
      $matchingViewport = $viewports.filter(right)
      scroll($matchingViewport, scrollTop, duration: 0)

    # Since scrolling happens without animation, we don't need to
    # join promises from the up.scroll call above
    u.resolvedDeferred()

  ###*
  @protected
  @method up.layout.revealOrRestoreScroll
  @return {Deferred} A promise for when the revealing or scroll restauration ends
  ###
  revealOrRestoreScroll = (selectorOrElement, options) ->
    $element = $(selectorOrElement)
    if options.restoreScroll
      restoreScroll(around: $element)
    else if options.reveal
      reveal($element)
    else
      u.resolvedDeferred()


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

  up.on 'up:framework:reset', reset

  knife: eval(Knife?.point)
  reveal: reveal
  scroll: scroll
  finishScrolling: finishScrolling
  config: config
  defaults: -> u.error('up.layout.defaults(...) no longer exists. Set values on he up.layout.config property instead.')
  viewportOf: viewportOf
  viewportsWithin: viewportsWithin
  viewports: viewports
  scrollTops: scrollTops
  saveScroll: saveScroll
  restoreScroll: restoreScroll
  revealOrRestoreScroll: revealOrRestoreScroll
  anchoredRight: anchoredRight
  fixedChildren: fixedChildren

)(jQuery)

up.scroll = up.layout.scroll
up.reveal = up.layout.reveal
