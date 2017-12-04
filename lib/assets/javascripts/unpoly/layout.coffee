###*
Application layout
==================

You can [make Unpoly aware](/up.layout.config) of fixed elements in your
layout, such as navigation bars or headers. Unpoly will respect these sticky
elements when [revealing elements](/up.reveal) or [opening a modal dialog](/a-up-modal).

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
    See [`[up-fixed="top"]`](/up-fixed-top) for details.
  @param {Array} [config.fixedBottom]
    An array of CSS selectors that find elements fixed to the
    bottom edge of the screen (using `position: fixed`).
    See [`[up-fixed="bottom"]`](/up-fixed-bottom) for details.
  @param {Array} [config.anchoredRight]
    An array of CSS selectors that find elements anchored to the
    right edge of the screen (using `right:0` with `position: fixed` or `position: absolute`).
    See [`[up-anchored="right"]`](/up-anchored-right) for details.
  @param {number} [config.duration=0]
    The duration of the scrolling animation in milliseconds.
    Setting this to `0` will disable scrolling animations.
  @param {string} [config.easing='swing']
    The timing function that controls the animation's acceleration.
    See [W3C documentation](http://www.w3.org/TR/css3-transitions/#transition-timing-function)
    for a list of pre-defined timing functions.
  @param {number} [config.snap=50]
    When [revealing](/up.reveal) elements, Unpoly will scroll an viewport
    to the top when the revealed element is closer to the top than `config.snap`.
  @param {number} [config.substance=150]
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

  lastScrollTops = new up.Cache
    size: 30,
    key: up.history.normalizeUrl

  scrollingTracker = new up.MotionTracker('scrolling')

  reset = ->
    config.reset()
    lastScrollTops.clear()
    scrollingTracker.finish()

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

  If the given viewport is already in a scroll animation when `up.scroll()`
  is called a second time, the previous animation will instantly jump to the
  last frame before the next animation is started.

  @function up.scroll
  @param {string|Element|jQuery} viewport
    The container element to scroll.
  @param {number} scrollPos
    The absolute number of pixels to set the scroll position to.
  @param {number}[options.duration]
    The number of miliseconds for the scrolling's animation.
  @param {string}[options.easing]
    The timing function that controls the acceleration for the scrolling's animation.
  @return {Promise}
    A promise that will be fulfilled when the scrolling ends.
  @experimental
  ###
  scroll = (viewport, scrollTop, options) ->
    $scrollable = scrollableElementForViewport(viewport)
    options = u.options(options)
    options.duration = u.option(options.duration, config.duration)
    options.easing = u.option(options.easing, config.easing)

    finishScrolling($scrollable).then ->
      if up.motion.isEnabled() && options.duration > 0
        scrollWithAnimateNow($scrollable, scrollTop, options)
      else
        scrollAbruptlyNow($scrollable, scrollTop)

  scrollableElementForViewport = (viewport) ->
    $viewport = $(viewport)
    if $viewport.get(0) == document
      $('html, body') # FML
    else
      $viewport

  scrollWithAnimateNow = ($scrollable, scrollTop, animateOptions) ->
    start = ->
      finish = ->
        # jQuery exposes a finish() method that completes all animations orchestrated through jQuery.
        # This will also resolve the promise returned by $element.animate(..).promise().
        $scrollable.finish()

      $scrollable.on(scrollingTracker.eventName, finish)
      scrollDone = $scrollable.animate({ scrollTop }, animateOptions).promise()
      scrollDone.then -> $scrollable.off(scrollingTracker.eventName)
      scrollDone

    # Tracker will either finish or wait for previous scrolling animations before starting the next
    scrollingTracker.claim($scrollable, start)

  scrollAbruptlyNow = ($scrollable, scrollTop) ->
    $scrollable.scrollTop(scrollTop)
    Promise.resolve()

  ###*
  Finishes scrolling animations in the given element, its ancestors or its descendants.

  @function up.layout.finishScrolling
  @param {string|Element|jQuery}
  @return {Promise}
  @internal
  ###
  finishScrolling = (element) ->
    $scrollable = scrollableElementForViewport(element)
    scrollingTracker.finish($scrollable)

  ###*
  @function up.layout.anchoredRight
  @internal
  ###
  anchoredRight = ->
    u.multiSelector(config.anchoredRight).select()

  ###*
  @function measureObstruction
  @return {Object}
  @internal
  ###
  measureObstruction = ->
    measurePosition = (obstructor, cssAttr) ->
      $obstructor = $(obstructor)
      anchorPosition = $obstructor.css(cssAttr)
      unless u.isPresent(anchorPosition)
        up.fail("Fixed element %o must have a CSS attribute %s", $obstructor.get(0), cssAttr)
      parseFloat(anchorPosition) + $obstructor.height()

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
  updating it with JavaScript functions like [`up.replace()`](/up.replace)
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

  You can make `up.reveal()` aware of these fixed elements
  so it can scroll the viewport far enough so the revealed element is fully visible.
  To make `up.reveal()` aware fixed elements you can either:

  - give the element an attribute [`up-fixed="top"`](/up-fixed-top) or [`up-fixed="bottom"`](up-fixed-bottom)
  - [configure default options](/up.layout.config) for `fixedTop` or `fixedBottom`

  @function up.reveal
  @param {string|Element|jQuery} element
  @param {number} [options.duration]
  @param {string} [options.easing]
  @param {string} [options.snap]
  @param {string|Element|jQuery} [options.viewport]
  @param {boolean} [options.top=false]
    Whether to scroll the viewport so that the first element row aligns
    with the top edge of the viewport.
  @return {Promise}
    A promise that fulfills when the element is revealed.
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

    elementDims = u.measure($element, relative: $viewport, includeMargin: true)
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
      Promise.resolve()

  ###*
  [Reveals](/up.reveal) an element matching the `#hash` in the current URL.

  Other than the default behavior found in browsers, `up.revealHash` works with
  [multiple viewports](/up-viewport) and honors [fixed elements](/up-fixed-top) obstructing the user's
  view of the viewport.

  This is called automatically when the page loads initially.

  @function up.layout.revealHash
  @return {Promise}
    A promise that is fulfilled when scroll position has changed to match the location hash.
  @experimental
  ###
  revealHash = ->
    if (hash = up.browser.hash()) && ($match = firstHashTarget(hash))
      reveal($match)
    else
      Promise.resolve()

  viewportSelector = ->
    u.multiSelector(config.viewports)

  ###*
  Returns the viewport for the given element.

  Throws an error if no viewport could be found.

  @function up.layout.viewportOf
  @param {string|Element|jQuery} selectorOrElement
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
  @param {string|Element|jQuery} selectorOrElement
  @return jQuery
  @internal
  ###
  viewportsWithin = (selectorOrElement) ->
    $element = $(selectorOrElement)
    viewportSelector().selectInSubtree($element)

  ###*
  Returns a jQuery collection of all the viewports on the screen.

  @function up.layout.viewports
  @internal
  ###
  viewports = ->
    viewportSelector().select()

  scrollTopKey = (viewport) ->
    $viewport = $(viewport)
    if $viewport.is(document)
      'document'
    else
      u.selectorForElement($viewport)

  ###*
  Returns a hash with scroll positions.

  Each key in the hash is a viewport selector. The corresponding
  value is the viewport's top scroll position:

      up.layout.scrollTops()
      => { '.main': 0, '.sidebar': 73 }

  @function up.layout.scrollTops
  @return Object<string, number>
  @internal
  ###
  scrollTops = ->
    topsBySelector = {}
    for group in config.viewports
      $(group).each ->
        $viewport = $(this)
        key = scrollTopKey($viewport)
        top = $viewport.scrollTop()
        topsBySelector[key] = top
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
  @param {string} [options.url]
  @param {Object<string, number>} [options.tops]
  @experimental
  ###
  saveScroll = (options = {}) ->
    url = u.option(options.url, up.history.url())
    tops = u.option(options.tops, scrollTops())
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
  @return {Promise}
    A promise that will be fulfilled once scroll positions have been restored.
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

    scrollTopsForUrl = lastScrollTops.get(url) || {}

    up.log.group 'Restoring scroll positions for URL %s to %o', url, scrollTopsForUrl, ->
      allScrollPromises = u.map $viewports, (viewport) ->
        key = scrollTopKey(viewport)
        scrollTop = scrollTopsForUrl[key] || 0
        scroll(viewport, scrollTop, duration: 0)

      Promise.all(allScrollPromises)

  ###*
  @function up.layout.revealOrRestoreScroll
  @param {boolean} [options.restoreScroll]
  @param {boolean|string} [options.reveal]
  @return {Promise}
    A promise that is fulfilled when the element is revealed or
    the scroll position is restored.
  @internal
  ###
  revealOrRestoreScroll = (selectorOrElement, options) ->
    $element = $(selectorOrElement)

    if options.restoreScroll
      return restoreScroll(around: $element)

    if options.reveal
      revealOptions = {}
      if u.isString(options.reveal)
        selector = revealSelector(options.reveal)
        $element = up.first(selector) || $element
        revealOptions.top = true
      return reveal($element, revealOptions)

    # If we didn't need to scroll above, just return a resolved promise
    # to fulfill this function's signature.
    return Promise.resolve()

  ###*
  @internal
  ###
  revealSelector = (selector, options) ->
    selector = up.dom.resolveSelector(selector, options)
    if selector[0] == '#'
      selector += ", a[name='#{selector}']"
    selector

  ###*
  Marks this element as a scrolling container ("viewport").

  Apply this attribute if your app uses a custom panel layout with fixed positioning
  instead of scrolling `<body>`. As an alternative you can also push a selector
  matching your custom viewport to the [`up.layout.config.viewports`](/up.layout.config) array.

  [`up.reveal()`](/up.reveal) will always try to scroll the viewport closest
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
  Marks this element as being fixed to the top edge of the screen
  using `position: fixed`.

  When [following a fragment link](/a-up-target), the viewport is scrolled
  so the targeted element becomes visible. By using this attribute you can make
  Unpoly aware of fixed elements that are obstructing the viewport contents.
  Unpoly will then scroll the viewport far enough that the revealed element is fully visible.

  Instead of using this attribute,
  you can also configure a selector in [`up.layout.config.fixedTop`](/up.layout.config#config.fixedTop).

  \#\#\# Example

      <div class="top-nav" up-fixed="top">...</div>

  @selector [up-fixed=top]
  @stable
  ###

  ###*
  Marks this element as being fixed to the bottom edge of the screen
  using `position: fixed`.

  When [following a fragment link](/a-up-target), the viewport is scrolled
  so the targeted element becomes visible. By using this attribute you can make
  Unpoly aware of fixed elements that are obstructing the viewport contents.
  Unpoly will then scroll the viewport far enough that the revealed element is fully visible.

  Instead of using this attribute,
  you can also configure a selector in [`up.layout.config.fixedBottom`](/up.layout.config#config.fixedBottom).

  \#\#\# Example

      <div class="bottom-nav" up-fixed="bottom">...</div>

  @selector [up-fixed=bottom]
  @stable
  ###


  ###*
  Marks this element as being anchored to the right edge of the screen,
  typically fixed navigation bars.

  Since [modal dialogs](/up.modal) hide the document scroll bar,
  elements anchored to the right appear to jump when the dialog opens or
  closes. Applying this attribute to anchored elements will make Unpoly
  aware of the issue and adjust the `right` property accordingly.

  You should give this attribute to layout elements
  with a CSS of `right: 0` with `position: fixed` or `position:absolute`.

  Instead of giving this attribute to any affected element,
  you can also configure a selector in [`up.layout.config.anchoredRight`](/up.layout.config#config.anchoredRight).

  \#\#\# Example

  Here is the CSS for a navigation bar that is anchored to the top edge of the screen:

      .top-nav {
         position: fixed;
         top: 0;
         left: 0;
         right: 0;
       }

  By adding an `up-anchored="right"` attribute to the element, we can prevent the
  `right` edge from jumping when a [modal dialog](/up.modal) opens or closes:

      <div class="top-nav" up-anchored="right">...</div>

  @selector [up-anchored=right]
  @stable
  ###

  ###*
  @function up.layout.firstHashTarget
  @internal
  ###
  firstHashTarget = (hash) ->
    if hash = up.browser.hash(hash)
      up.first("[id='#{hash}'], a[name='#{hash}']")

  up.on 'up:app:booted', revealHash

  up.on 'up:framework:reset', reset

  knife: eval(Knife?.point)
  reveal: reveal
  revealHash: revealHash
  firstHashTarget: firstHashTarget
  scroll: scroll
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
up.revealHash = up.layout.revealHash
