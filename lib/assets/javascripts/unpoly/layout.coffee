###*
Application layout
==================

You can [make Unpoly aware](/up.layout.config) of fixed elements in your
layout, such as navigation bars or headers. Unpoly will respect these sticky
elements when [revealing elements](/up.reveal) or [opening a modal dialog](/up-modal).

This modules also contains functions to programmatically [scroll a viewport](/up.scroll)
or [reveal an element within its viewport](/up.reveal).

Bootstrap integration
---------------------

When using Bootstrap integration (`unpoly-bootstrap3.js` and `unpoly-bootstrap3.css`)
Unpoly will automatically be aware of sticky Bootstrap components such as
[fixed navbar](https://getbootstrap.com/examples/navbar-fixed-top/).

@class up.layout
###
up.layout = (($) ->

  u = up.util

  ###*
  Configures the application layout.

  @property up.layout.config
  @param {Array} [config.viewports]
    An array of CSS selectors that find viewports
    (containers that scroll their contents).
  @param {Array} [config.fixedTop]
    An array of CSS selectors that find elements fixed to the
    top edge of the screen (using `position: fixed`).
  @param {Array} [config.fixedBottom]
    An array of CSS selectors that find elements fixed to the
    bottom edge of the screen (using `position: fixed`).
  @param {Array} [config.anchoredRight]
    An array of CSS selectors that find elements anchored to the
    right edge of the screen (using `position: fixed` or `position: absolute`).
  @param {Number} [config.duration=0]
    The duration of the scrolling animation in milliseconds.
    Setting this to `0` will disable scrolling animations.
  @param {String} [config.easing='swing']
    The timing function that controls the animation's acceleration.
    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {Number} [config.snap=50]
    When [revealing](/up.reveal) elements, Unpoly will scroll an viewport
    to the top when the revealed element is closer to the top than `config.snap`.
  @param {Number} [config.substance=150]
    A number indicating how many top pixel rows of an element to [reveal](/up.reveal).
  @stable
  ###
  config = u.config
    duration: 0
    viewports: [document, '.up-modal-viewport', '[up-viewport]']
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

  \#\#\# Example

  This will scroll a `<div class="main">...</div>` to a Y-position of 100 pixels:

      up.scroll('.main', 100);

  \#\#\# Animating the scrolling motion

  The scrolling can (optionally) be animated.

      up.scroll('.main', 100, {
        easing: 'swing',
        duration: 250
      });

  If the given viewport is already in a scroll animation when `up.scroll`
  is called a second time, the previous animation will instantly jump to the
  last frame before the next animation is started.

  @function up.scroll
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
  @experimental
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
  @function up.layout.finishScrolling
  @param {String|Element|jQuery}
    The element that might currently be scrolling.
  @internal
  ###
  finishScrolling = (elementOrSelector) ->
    $(elementOrSelector).each ->
      if existingScrolling = $(this).data(SCROLL_PROMISE_KEY)
        existingScrolling.resolve()

  ###*
  @function up.layout.anchoredRight
  @internal
  ###
  anchoredRight = ->
    u.multiSelector(config.anchoredRight).select()

  measureObstruction = ->

    measurePosition = (obstructor, cssAttr) ->
      $obstructor = $(obstructor)
      anchorPosition = $obstructor.css(cssAttr)
      unless u.isPresent(anchorPosition)
        up.fail("Fixed element %o must have a CSS attribute %s", $obstructor.get(0), cssAttr)
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

  By default Unpoly will always reveal an element before
  updating it with JavaScript functions like [`up.replace`](/up.replace)
  or UJS behavior like [`[up-target]`](/a-up-target).

  \#\#\# How Unpoly finds the viewport

  The viewport (the container that is going to be scrolled)
  is the closest parent of the element that is either:

  - the currently open [modal](/up.modal)
  - an element with the attribute `[up-viewport]`
  - the `<body>` element
  - an element matching the selector you have configured using `up.layout.config.viewports.push('my-custom-selector')`

  \#\#\# Fixed elements obstruction the viewport

  Many applications have a navigation bar fixed to the top or bottom,
  obstructing the view on an element.

  You can make `up.reveal` aware of these fixed elements
  so it can scroll the viewport far enough so the revealed element is fully visible.
  To make `up.reveal` aware fixed elements you can either:

  - give the element an attribute [`up-fixed="top"`](/up-fixed-top) or [`up-fixed="bottom"`](up-fixed-bottom)
  - [configure default options](/up.layout.config) for `fixedTop` or `fixedBottom`

  @function up.reveal
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
  @stable
  ###
  reveal = (elementOrSelector, options) ->
    $element = $(elementOrSelector)
    up.puts 'Revealing fragment %o', elementOrSelector.get(0)
    options = u.options(options)
    $viewport = if options.viewport then $(options.viewport) else viewportOf($element)

    snap = u.option(options.snap, config.snap)

    viewportIsDocument = $viewport.is(document)
    viewportHeight = if viewportIsDocument then u.clientSize().height else $viewport.outerHeight()
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
      # with overflow-y: scroll, $.position returns the distance to the
      # viewport's currently visible top edge (instead of the distance to
      # the first row of the viewport's entire canvas buffer).
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

    if newScrollPos < snap && elementDims.top < (0.5 * viewportHeight)
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

  @function up.layout.viewportOf
  @param {String|Element|jQuery} selectorOrElement
  @internal
  ###
  viewportOf = (selectorOrElement, options = {}) ->
    $element = $(selectorOrElement)
    $viewport = viewportSelector().seekUp($element)
    if $viewport.length == 0 && options.strict isnt false
      up.fail("Could not find viewport for %o", $element)
    $viewport

  ###*
  Returns a jQuery collection of all the viewports contained within the
  given selector or element.

  @function up.layout.viewportsWithin
  @param {String|Element|jQuery} selectorOrElement
  @return jQuery
  @internal
  ###
  viewportsWithin = (selectorOrElement) ->
    $element = $(selectorOrElement)
    viewportSelector().findWithSelf($element)

  ###*
  Returns a jQuery collection of all the viewports on the screen.

  @function up.layout.viewports
  @internal
  ###
  viewports = ->
    viewportSelector().select()

  ###*
  Returns a hash with scroll positions.

  Each key in the hash is a viewport selector. The corresponding
  value is the viewport's top scroll position:

      up.layout.scrollTops()
      => { '.main': 0, '.sidebar': 73 }

  @function up.layout.scrollTops
  @return Object<String, Number>
  @internal
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
  @function up.layout.fixedChildren
  @internal
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
  viewports configured in [`up.layout.config.viewports`](/up.layout.config).

  The scroll positions will be associated with the current URL.
  They can later be restored by calling [`up.layout.restoreScroll()`](/up.layout.restoreScroll)
  at the same URL.

  Unpoly automatically saves scroll positions whenever a fragment was updated on the page.

  @function up.layout.saveScroll
  @param {String} [options.url]
  @param {Object<String, Number>} [options.tops]
  @experimental
  ###
  saveScroll = (options = {}) ->
    url = u.option(options.url, up.history.url())
    tops = u.option(options.tops, scrollTops())
    up.puts('Saving scroll positions for URL %s (%o)', url, tops)
    lastScrollTops.set(url, tops)

  ###*
  Restores [previously saved](/up.layout.saveScroll) scroll positions of viewports
  viewports configured in [`up.layout.config.viewports`](/up.layout.config).

  Unpoly automatically restores scroll positions when the user presses the back button.
  You can disable this behavior by setting [`up.history.config.restoreScroll = false`](/up.history.config).

  @function up.layout.restoreScroll
  @param {jQuery} [options.around]
    If set, only restores viewports that are either an ancestor
    or descendant of the given element.
  @experimental
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

    up.log.group 'Restoring scroll positions for URL %s to %o', url, tops, ->
      for key, scrollTop of tops
        right = if key == 'document' then document else key
        $matchingViewport = $viewports.filter(right)
        scroll($matchingViewport, scrollTop, duration: 0)

      # Since scrolling happens without animation, we don't need to
      # join promises from the up.scroll call above
      u.resolvedDeferred()

  ###*
  @function up.layout.revealOrRestoreScroll
  @return {Deferred}
    A promise for when the revealing or scroll restoration ends
  @internal
  ###
  revealOrRestoreScroll = (selectorOrElement, options) ->
    $element = $(selectorOrElement)
    if options.restoreScroll
      restoreScroll(around: $element)
    else if options.reveal
      revealOptions = {}
      if options.source
        parsed = u.parseUrl(options.source)
        if parsed.hash && parsed.hash != '#'
          id = parsed.hash.substr(1)
          $target = u.findWithSelf($element, "##{id}, a[name='#{id}']")
          if $target.length
            $element = $target
            revealOptions.top = true
      reveal($element, revealOptions)
    else
      u.resolvedDeferred()


  ###*
  Marks this element as a scrolling container ("viewport").

  Apply this attribute if your app uses a custom panel layout with fixed positioning
  instead of scrolling `<body>`. As an alternative you can also push a selector
  matching your custom viewport to the [`up.layout.config.viewports`](/up.layout.config) array.

  [`up.reveal`](/up.reveal) will always try to scroll the viewport closest
  to the element that is being revealed. By default this is the `<body>` element.

  \#\#\# Example

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

  @selector [up-viewport]
  @stable
  ###

  ###*
  Marks this element as a navigation fixed to the top edge of the screen
  using `position: fixed`.

  [`up.reveal`](/up.reveal) is aware of fixed elements and will scroll
  the viewport far enough so the revealed element is fully visible.

  \#\#\# Example

      <div class="top-nav" up-fixed="top">...</div>

  @selector [up-fixed=top]
  @stable
  ###

  ###*
  Marks this element as a navigation fixed to the bottom edge of the screen
  using `position: fixed`.

  [`up.reveal`](/up.reveal) is aware of fixed elements and will scroll
  the viewport far enough so the revealed element is fully visible.

  \#\#\# Example

      <div class="bottom-nav" up-fixed="bottom">...</div>

  @selector [up-fixed=bottom]
  @stable
  ###


  ###*
  Marks this element as a navigation anchored to the right edge of the screen
  using `position: fixed` or `position:absolute`.

  [`up.modal`](/up.modal) will move anchored elements to the left so they
  don't appear to move when a modal dialog is opened or closed.

  \#\#\# Example

      <div class="bottom-nav" up-fixed="bottom">...</div>

  @selector [up-anchored=right]
  @stable
  ###

  up.on 'up:framework:reset', reset

  knife: eval(Knife?.point)
  reveal: reveal
  scroll: scroll
  finishScrolling: finishScrolling
  config: config
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
