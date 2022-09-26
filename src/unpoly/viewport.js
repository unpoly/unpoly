require('./viewport.sass')

/*-
Scrolling
=========

The `up.viewport` module controls the scroll position and focus within scrollable containers ("viewports").

The default viewport for any web application is the main document. An application may
define additional viewports by giving the CSS property `{ overflow-y: scroll }` to any `<div>`.

Also see documentation for the [scroll option](/scroll-option) and [focus option](/focus-option).

@see scroll-option
@see scroll-tuning
@see focus-option

@see up.reveal
@see [up-fixed=top]

@module up.viewport
*/
up.viewport = (function() {

  const u = up.util
  const e = up.element
  const f = up.fragment

  /*-
  Configures defaults for scrolling.

  @property up.viewport.config
  @param {Array} [config.viewportSelectors]
    An array of CSS selectors that match viewports.
  @param {Array} [config.fixedTop]
    An array of CSS selectors that find elements fixed to the
    top edge of the screen (using `position: fixed`).

    See [`[up-fixed="top"]`](/up-fixed-top) for details.
  @param {Array} [config.fixedBottom]
    An array of CSS selectors that match elements fixed to the
    bottom edge of the screen (using `position: fixed`).

    See [`[up-fixed="bottom"]`](/up-fixed-bottom) for details.
  @param {Array} [config.anchoredRight]
    An array of CSS selectors that find elements anchored to the
    right edge of the screen (using `right:0` with `position: fixed` or `position: absolute`).

    See [`[up-anchored="right"]`](/up-anchored-right) for details.
  @param {number} [config.revealSnap]
    When [revealing](/up.reveal) elements, Unpoly will scroll an viewport
    to the top when the revealed element is closer to the viewport's top edge
    than `config.revealSnap`.

    Set to `0` to disable snapping.
  @param {number} [config.revealPadding]
    The desired padding between a [revealed](/up.reveal) element and the
    closest [viewport](/up.viewport) edge (in pixels).
  @param {number} [config.revealMax]
    A number indicating how many top pixel rows of a high element to [reveal](/up.reveal).

    Defaults to 50% of the available window height.

    You may set this to `false` to always reveal as much of the element as the viewport allows.

    You may also pass a function that receives an argument `{ viewportRect, elementRect }` and returns
    a maximum height in pixel. Each given rectangle has properties `{ top, right, buttom, left, width, height }`.
  @param {number} [config.revealTop=false]
    Whether to always scroll a [revealing](/up.reveal) element to the top.

    By default Unpoly will scroll as little as possible to make the element visible.
  @stable
  */
  const config = new up.Config(() => ({
    viewportSelectors: ['[up-viewport]', '[up-fixed]'],
    fixedTop: ['[up-fixed~=top]'],
    fixedBottom: ['[up-fixed~=bottom]'],
    anchoredRight: ['[up-anchored~=right]', '[up-fixed~=top]', '[up-fixed~=bottom]', '[up-fixed~=right]'],
    revealSnap: 200,
    revealPadding: 0,
    revealTop: false,
    revealMax() { return 0.5 * window.innerHeight; },
  }))

  function reset() {
    config.reset()
  }

  /*-
  @function up.viewport.anchoredRight
  @internal
  */
  function anchoredRight() {
    const selector = config.anchoredRight.join(',')
    return f.all(selector, { layer: 'root' })
  }

  /*-
  Scrolls the given element's viewport so the first rows of the
  element are visible for the user.

  ### Fixed elements obstructing the viewport

  Many applications have a navigation bar fixed to the top or bottom,
  obstructing the view on an element.

  You can make `up.reveal()` aware of these fixed elements
  so it can scroll the viewport far enough so the revealed element is fully visible.
  To make `up.reveal()` aware of fixed elements you can either:

  - give the element an attribute [`up-fixed="top"`](/up-fixed-top) or [`up-fixed="bottom"`](/up-fixed-bottom)
  - [configure default options](/up.viewport.config) for `fixedTop` or `fixedBottom`

  @function up.reveal

  @param {string|Element|jQuery} element
    The element to reveal.

  @param {string} [options.revealSnap]
    When the the revealed element would be closer to the viewport's top edge
    than this value, Unpoly will scroll the viewport to the top.

    Set to `0` to disable snapping.

    Defaults to `up.viewport.config.revealSnap`.

  @param {string|Element|jQuery} [options.viewport]
    The scrolling element to scroll.

    Defaults to the [given element's viewport](/up.viewport.get).

  @param {boolean} [options.top]
    Whether to scroll the viewport so that the first element row aligns
    with the top edge of the viewport.

    Defaults to `up.viewport.config.revealTop`.

  @param {string}[options.behavior='instant']
    When set to `'instant'`, this will immediately scroll to the new position.

    When set to `'smooth'`, this will scroll smoothly to the new position.

  @param {number}[options.speed]
    The speed of the scrolling motion when scrolling with `{ behavior: 'smooth' }`.

    Defaults to `up.viewport.config.scrollSpeed`.

  @param {number} [options.padding]
    The desired padding between the revealed element and the
    closest [viewport](/up.viewport) edge (in pixels).

    Defaults to `up.viewport.config.revealPadding`.

  @param {number|boolean} [options.snap]
    Whether to snap to the top of the viewport if the new scroll position
    after revealing the element is close to the top edge.

    Defaults to `up.viewport.config.revealSnap`.

  @return {Promise}
    A promise that fulfills when the element is revealed.

    When the scrolling is animated with `{ behavior: 'smooth' }`, the promise
    fulfills when the animation is finished.

    When the scrolling is not animated, the promise will fulfill
    in the next [microtask](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/).

  @stable
  */
  function reveal(element, options) {
    // copy options, since we will mutate it below (options.layer = ...).
    options = u.options(options)
    element = f.get(element, options)

    // Now that we have looked up the element with an option like { layer: 'any' },
    // the only layer relevant from here on is the element's layer.
    if (!(options.layer = up.layer.get(element))) {
      up.fail('Cannot reveal a detached element')
    }

    if (options.peel) { options.layer.peel(); }

    const motion = new up.RevealMotion(element, options)
    motion.start()

    return up.migrate.formerlyAsync?.('up.reveal()')
  }

  /*-
  Focuses the given element.

  Focusing an element will also [reveal](/up.reveal) it, unless `{ preventScroll: true }` is passed.

  @function up.focus

  @param {string|Element|jQuery} element
    The element to focus.

  @param {boolean} [options.preventScroll=false]
    Whether to prevent changes to the acroll position.

  @param {boolean} [options.force=false]
    Whether to force focus even if `element` would otherwise not be a focusable element.

  @experimental
  */
  function doFocus(element, options = {}) {
    if (options.force) {
      makeFocusable(element)
    }

    // First focus without scrolling, since we're going to use our custom scrolling logic below.
    element.focus({ preventScroll: true })

    if (!options.preventScroll) {
      // Use up.reveal() which scrolls far enough to ignore fixed nav bars
      // obstructing the focused element.
      return reveal(element)
    }
  }

  function tryFocus(element, options) {
    doFocus(element, options)
    return element === document.activeElement
  }

  function makeFocusable(element) {
    // (1) Element#tabIndex is -1 for all non-interactive elements,
    //     whether or not the element has an [tabindex=-1] attribute.
    // (2) Element#tabIndex is 0 for interactive elements, like links,
    //     inputs or buttons. [up-clickable] elements also get a [tabindex=0].
    //     to participate in the regular tab order.
    if (!element.hasAttribute('tabindex') && element.tabIndex === -1) {
      element.setAttribute('tabindex', '-1')

      // A11Y: OK to hide the focus ring of a non-interactive element.
      element.classList.add('up-focusable-content')
    }
  }

  /*-
  [Reveals](/up.reveal) an element matching the given `#hash` anchor.

  Other than the default behavior found in browsers, `up.revealHash()` works with
  [multiple viewports](/up-viewport) and honors [fixed elements](/up-fixed-top) obstructing the user's
  view of the viewport.

  When the page loads initially, this function is automatically called with the hash from
  the current URL.

  If no element matches the given `#hash` anchor, a resolved promise is returned.

  ### Example

      up.revealHash('#chapter2')

  @function up.viewport.revealHash
  @param {string} hash
  @internal
  */
  function revealHash(hash = location.hash, options) {
    let match = firstHashTarget(hash, options)
    if (match) {
      return up.reveal(match, { top: true })
    }
  }

  function allSelector() {
    // On Edge the document viewport can be changed from CSS
    return [rootSelector(), ...config.viewportSelectors].join(',')
  }

  /*-
  Returns the scrolling container for the given element.

  Returns the [document's scrolling element](/up.viewport.root)
  if no closer viewport exists.

  @function up.viewport.get
  @param {string|Element|jQuery} target
  @return {Element}
  @experimental
  */
  function closest(target, options = {}) {
    const element = f.get(target, options)
    // Use up.element.closest() which searches across layer boundaries.
    // It is OK to find a viewport in a parent layer. Layers without its
    // own viewport (like popups) are scrolled by the parent layer's viewport.
    return element.closest(allSelector())
  }

  /*-
  Returns a list of all the viewports contained within the
  given selector or element.

  If the given element is itself a viewport, the element is included
  in the returned list.

  @function up.viewport.subtree
  @param {string|Element|jQuery} target
  @param {Object} options
  @return List<Element>
  @internal
  */
  function getSubtree(element, options = {}) {
    element = f.get(element, options)
    return e.subtree(element, allSelector())
  }

  /*-
  Returns a list of all viewports that are either contained within
  the given element or that are ancestors of the given element.

  This is relevant when updating a fragment with `{ scroll: 'restore' | 'reset' }`.
  In tht case we restore / reset the scroll tops of all viewports around the fragment.

  @function up.viewport.around
  @param {string|Element|jQuery} element
  @param {Object} options
  @return List<Element>
  @internal
  */
  function getAround(element, options = {}) {
    element = f.get(element, options)
    return e.around(element, allSelector())
  }

  /*-
  Returns a list of all the viewports on the current layer.

  @function up.viewport.all
  @internal
  */
  function getAll(options = {}) {
    return f.all(allSelector(), options)
  }

  function rootSelector() {
    return getRoot().tagName
  }

  /*-
  Return the [scrolling element](https://developer.mozilla.org/en-US/docs/Web/API/document/scrollingElement)
  for the browser's main content area.

  @function up.viewport.root
  @return {Element}
  @experimental
  */
  function getRoot() {
    return document.scrollingElement
  }

  function rootWidth() {
    // This should happen on the <html> element, regardless of document.scrollingElement
    return e.root.clientWidth
  }

  function rootHeight() {
    // This should happen on the <html> element, regardless of document.scrollingElement
    return e.root.clientHeight
  }

  function isRoot(element) {
    return element === getRoot()
  }

  /*-
  Returns whether the root viewport is currently showing a vertical scrollbar.

  Note that this returns `false` if the root viewport scrolls vertically but the browser
  shows no visible scroll bar at rest, e.g. on mobile devices that only overlay a scroll
  indicator while scrolling.

  @function up.viewport.rootHasReducedWidthFromScrollbar
  @internal
  */
  function rootHasReducedWidthFromScrollbar() {
    // We could also check if scrollHeight > offsetHeight for the document viewport.
    // However, we would also need to check overflow-y for that element.
    // Also we have no control whether developers set the property on <body> or <html>.
    // https://tylercipriani.com/blog/2014/07/12/crossbrowser-javascript-scrollbar-detection/
    return window.innerWidth > document.documentElement.offsetWidth
  }

  /*-
  Returns the element that controls the `overflow-y` behavior for the
  [document viewport](/up.viewport.root()).

  @function up.viewport.rootOverflowElement
  @internal
  */
  function rootOverflowElement() {
    const { body } = document
    const html = document.documentElement

    const element = u.find([html, body], wasChosenAsOverflowingElement)
    return element || getRoot()
  }

  /*-
  Returns whether the given element was chosen as the overflowing
  element by the developer.

  We have no control whether developers set the property on <body> or
  <html>. The developer also won't know what is going to be the
  [scrolling element](/up.viewport.root) on the user's browser.

  @function wasChosenAsOverflowingElement
  @internal
  */
  function wasChosenAsOverflowingElement(element) {
    const overflowY = e.style(element, 'overflow-y')
    return overflowY === 'auto' || overflowY === 'scroll'
  }

  /*-
  Returns the width of a scrollbar.

  This only runs once per page load.

  @function up.viewport.scrollbarWidth
  @internal
  */
  const scrollbarWidth = u.memoize(function() {
    // This is how Bootstrap does it also:
    // https://github.com/twbs/bootstrap/blob/c591227602996c542b9fd0cb65cff3cc9519bdd5/dist/js/bootstrap.js#L1187
    const outerStyle = {
      position:  'absolute',
      top:       '0',
      left:      '0',
      width:     '100px',
      height:    '100px', // Firefox needs at least 100px to show a scrollbar
      overflowY: 'scroll'
    }
    const outer = up.element.affix(document.body, '[up-viewport]', { style: outerStyle })
    const width = outer.offsetWidth - outer.clientWidth
    outer.remove()
    return width
  })

  function scrollTopKey(viewport) {
    return up.fragment.tryToTarget(viewport)
  }

  /*-
  @function up.viewport.fixedElements
  @internal
  */
  function fixedElements(root = document) {
    const queryParts = ['[up-fixed]'].concat(config.fixedTop).concat(config.fixedBottom)
    return root.querySelectorAll(queryParts.join(','))
  }

  /*-
  Saves scroll positions for later restoration.

  The scroll positions will be associated with the current URL.
  They can later be restored by calling `up.viewport.restoreScroll()`
  at the same URL, or by following a link with an [`[up-scroll="restore"]`](/scroll-option#restoring-scroll-positions)
  attribute.

  Unpoly automatically saves scroll positions before [navigating](/navigation).

  @function up.viewport.saveScroll
  @param {Element|Array<Element>} [viewport]
    The viewports for which to save scroll positions.

    Defaults to all viewports within the given layer.
  @param {string} [options.location]
    The URL for which to save scroll positions.

    If omitted, the given [layer's location](/up.Layer.prototype.location) is used.
  @param {string} [options.layer = 'current']
    The layer for which to save scroll positions.

    If omitted, positions for the current layer will be saved.
  @experimental
  */
  function saveScroll(...args) {
    const [viewports, options] = parseOptions(args)
    const location = options.location || options.layer.location
    if (location) {
      const tops = getScrollTopsForSave(viewports)
      options.layer.lastScrollTops.set(location, tops)
    }
  }

  /*-
  Returns a hash with scroll positions.

  Each key in the hash is a viewport selector. The corresponding
  value is the viewport's top scroll position:

      getScrollTopsForSave()
      => { '.main': 0, '.sidebar': 73 }

  @function getScrollTopsForSave
  @return Object<string, number>
  @internal
  */
  function getScrollTopsForSave(viewports) {
    let tops = {}
    for (let viewport of viewports) {
      let key = scrollTopKey(viewport)
      if (key) {
        tops[key] = viewport.scrollTop
      } else {
        up.warn('up.viewport.saveScroll()', 'Cannot save scroll positions for untargetable viewport %o', viewport)
      }
    }
    return tops
  }

  /*-
  Restores [previously saved](/up.viewport.saveScroll) scroll positions.

  If no earlier scroll position is known, scroll positions are not changed
  and `false` is returned.

  Unpoly automatically restores scroll positions when the user presses the back button.

  @function up.viewport.restoreScroll
  @param {Element|Array<Element>} [viewport]
    The viewports for which to restore scroll positions.

    Defaults to all viewports within the given layer.
  @param {up.Layer|string} [options.layer='current']
    The layer on which to restore scroll positions.
  @param {string} [options.location]
    The URL for which to restore scroll positions.

    If omitted, the given [layer's location](/up.Layer.prototype.location) is used.
  @return {boolean}
    Returns whether if scroll positions could be restored.
  @experimental
  */
  function restoreScroll(...args) {
    const [viewports, options] = parseOptions(args)
    const { location } = options.layer
    const locationScrollTops = options.layer.lastScrollTops.get(location)
    if (locationScrollTops) {
      setScrollTops(viewports, locationScrollTops)
      up.puts('up.viewport.restoreScroll()', 'Restored scroll positions to %o', locationScrollTops)
      return true
    } else {
      return false
    }
  }

  /*-
  Saves focus-related state for later restoration.

  Saved state includes:

  - Which element is focused.
  - The cursor position within a focused input element.
  - The selection range within a focused input element.
  - The scroll position within a focused input element.

  State can only be preserved if the focused element is [targetable](/up.fragment.isTargetable).

  Saved state will be associated with the given layer's location.
  It can later be restored by calling `up.viewport.restoreScroll()`
  at the same location, or by following a link with an [`[up-focus="restore"]`](/focus-option#restoring-focus)
  attribute to that same location.

  Unpoly automatically saves focus-related state before [navigating](/navigation).

  @function up.viewport.saveFocus
  @param {Element|Array<Element>} [viewport]
    The viewports for which to save focus state.

    Defaults to all viewports within the given layer.
  @param {string} [options.location]
    The URL for which to save focus state.

    If omitted, the given [layer's location](/up.Layer.prototype.location) is used.
  @param {string} [options.layer = 'current']
    The layer for which to save scroll positions.

    If omitted, state for the current layer will be saved.
  @experimental
  */
  function saveFocus(options = {}) {
    const layer = up.layer.get(options)
    const location = options.location || layer.location
    if (location) {
      const focusCapsule = up.FocusCapsule.preserve(layer)
      // `focusCapsule` may be undefined if `layer` did not have focus.
      // In that case we nullify a previously known capsule for `location`.
      layer.lastFocusCapsules.set(location, focusCapsule)
    }
  }

  /*-
  Restores [previously saved](/up.viewport.saveFocus) focus-related state.

  Unpoly automatically restores focus-related state when the user presses the back button.

  @function up.viewport.restoreFocus
  @param {Element|Array<Element>} [viewport]
    The viewports for which to restore focus-related state..

    Defaults to all viewports within the given layer.
  @param {up.Layer|string} [options.layer='current']
    The layer on which to restore focus-related state.
  @param {string} [options.location]
    The URL for which to restore focus-related state.

    If omitted, the given [layer's location](/up.Layer.prototype.location) is used.
  @return {boolean}
    Returns whether focus state could be restored.
  @experimental
  */
  function restoreFocus(options = {}) {
    const layer = up.layer.get(options)
    const location = options.location || layer.location
    const locationCapsule = options.layer.lastFocusCapsules.get(location)
    // The capsule returns `true` if we could rediscover and focus the previous element.
    if (locationCapsule && locationCapsule.restore(layer)) {
      up.puts('up.viewport.restoreFocus()', 'Restored focus to "%s"', locationCapsule.target)
      return true
    } else {
      return false
    }
  }

  function newStateCache() {
    return new up.Cache({ size: 30, key: up.history.normalizeURL })
  }

  function parseOptions(args) {
    const options = u.copy(u.extractOptions(args))
    options.layer = up.layer.get(options)
    let viewports
    if (args[0]) {
      viewports = [closest(args[0], options)]
    } else if (options.around) {
      // This is relevant when updating a fragment with { scroll: 'restore' | 'reset' }.
      // In tht case we restore / reset the scroll tops of all viewports around the fragment.
      viewports = getAround(options.around, options)
    } else {
      viewports = getAll(options)
    }
    return [viewports, options]
  }

  function resetScroll(...args) {
    const [viewports, _options] = parseOptions(args)
    setScrollTops(viewports, {})
  }

  function setScrollTops(viewports, tops) {
    for (let viewport of viewports) {
      const key = scrollTopKey(viewport)
      viewport.scrollTop = tops[key] || 0
    }
  }

  function absolutize(element, options = {}) {
    const viewport = closest(element)

    const viewportRect = viewport.getBoundingClientRect()
    const originalRect = element.getBoundingClientRect()

    const boundsRect = new up.Rect({
      left: originalRect.left - viewportRect.left,
      top: originalRect.top - viewportRect.top,
      width: originalRect.width,
      height: originalRect.height
    })

    // Allow the caller to run code before we start shifting elements around.
    options.afterMeasure?.()

    e.setStyle(element, {
      // If the element had a layout context before, make sure the
      // ghost will have layout context as well (and vice versa).
      position: element.style.position === 'static' ? 'static' : 'relative',
      top:    'auto', // CSS default
      right:  'auto', // CSS default
      bottom: 'auto', // CSS default
      left:   'auto', // CSS default
      width:  '100%', // stretch to the <up-bounds> width we set below
      height: '100%'
    }
    ); // stretch to the <up-bounds> height we set below

    // Wrap the ghost in another container so its margin can expand
    // freely. If we would position the element directly (old implementation),
    // it would gain a layout context which cannot be crossed by margins.
    const bounds = e.createFromSelector('up-bounds')
    // Insert the bounds object before our element, then move element into it.
    e.insertBefore(element, bounds)
    bounds.appendChild(element)

    const moveBounds = function(diffX, diffY) {
      boundsRect.left += diffX
      boundsRect.top += diffY
      return e.setStyle(bounds, boundsRect)
    }

    // Position the bounds initially
    moveBounds(0, 0)

    // In theory, element should not have moved visually. However, element
    // (or a child of element) might collapse its margin against a previous
    // sibling element, and now that it is absolute it does not have the
    // same sibling. So we manually correct element's top position so it aligns
    // with the previous top position.
    const newElementRect = element.getBoundingClientRect()
    moveBounds(originalRect.left - newElementRect.left, originalRect.top - newElementRect.top)

    u.each(fixedElements(element), e.fixedToAbsolute)

    return {
      bounds,
      moveBounds
    }
  }

  /*-
  Marks this element as a scrolling container ("viewport").

  Apply this attribute if your app uses a custom panel layout with fixed positioning
  instead of scrolling `<body>`. As an alternative you can also push a selector
  matching your custom viewport to the `up.viewport.config.viewportSelectors` array.

  [`up.reveal()`](/up.reveal) will always try to scroll the viewport closest
  to the element that is being revealed. By default this is the `<body>` element.

  ### Example

  Here is an example for a layout for an e-mail client, showing a list of e-mails
  on the left side and the e-mail text on the right side:

  ```css
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
  ```

  This would be the HTML (notice the `up-viewport` attribute):

  ```html
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
  ```

  @selector [up-viewport]
  @stable
  */

  /*-
  Marks this element as being fixed to the top edge of the screen
  using `position: fixed`.

  When [following a fragment link](/a-up-follow), the viewport is scrolled
  so the targeted element becomes visible. By using this attribute you can make
  Unpoly aware of fixed elements that are obstructing the viewport contents.
  Unpoly will then scroll the viewport far enough that the revealed element is fully visible.

  Instead of using this attribute,
  you can also configure a selector in `up.viewport.config.fixedTop`.

  ### Example

      <div class="top-nav" up-fixed="top">...</div>

  @selector [up-fixed=top]
  @stable
  */

  /*-
  Marks this element as being fixed to the bottom edge of the screen
  using `position: fixed`.

  When [following a fragment link](/a-up-follow), the viewport is scrolled
  so the targeted element becomes visible. By using this attribute you can make
  Unpoly aware of fixed elements that are obstructing the viewport contents.
  Unpoly will then scroll the viewport far enough that the revealed element is fully visible.

  Instead of using this attribute,
  you can also configure a selector in `up.viewport.config.fixedBottom`.

  ### Example

      <div class="bottom-nav" up-fixed="bottom">...</div>

  @selector [up-fixed=bottom]
  @stable
  */


  /*-
  Marks this element as being anchored to the right edge of the screen,
  typically fixed navigation bars.

  Since [overlays](/up.layer) hide the document scroll bar,
  elements anchored to the right appear to jump when the dialog opens or
  closes. Applying this attribute to anchored elements will make Unpoly
  aware of the issue and adjust the `right` property accordingly.

  You should give this attribute to layout elements
  with a CSS of `right: 0` with `position: fixed` or `position:absolute`.

  Instead of giving this attribute to any affected element,
  you can also configure a selector in `up.viewport.config.anchoredRight`.

  ### Example

  Here is the CSS for a navigation bar that is anchored to the top edge of the screen:

  ```css
  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }
  ```

  By adding an `up-anchored="right"` attribute to the element, we can prevent the
  `right` edge from jumping when an [overlay](/up.layer) opens or closes:

  ```html
  <div class="top-nav" up-anchored="right">...</div>
  ```

  @selector [up-anchored=right]
  @stable
  */

  /*-
  @function up.viewport.firstHashTarget
  @internal
  */
  function firstHashTarget(hash, options = {}) {
    if (hash = pureHash(hash)) {
      const selector = [
        // Match an <* id="hash">
        e.attrSelector('id', hash),
        // Match an <a name="hash">
        'a' + e.attrSelector('name', hash)
      ].join(',')
      return f.get(selector, options)
    }
  }

  /*-
  Returns `'foo'` if the hash is `'#foo'`.

  @function pureHash
  @internal
  */
  function pureHash(value) {
    return value?.replace(/^#/, '')
  }

  function focusedElementWithin(scopeElement) {
    const focusedElement = document.activeElement
    if (e.isInSubtree(scopeElement, focusedElement)) {
      return focusedElement
    }
  }

  let userScrolled = false
  up.on('scroll', { once: true, beforeBoot: true }, () => userScrolled = true)

  up.on('up:framework:boot', function() {
    // When the initial URL contains an #anchor link, the browser will automatically
    // reveal a matching fragment. We want to override that behavior with our own,
    // so we can honor configured obstructions. Since we cannot disable the automatic
    // browser behavior we need to ensure our code runs after it.
    //
    // In Chrome, when reloading, the browser behavior happens before DOMContentLoaded.
    // However, when we follow a link with an #anchor URL, the browser
    // behavior happens *after* DOMContentLoaded. Hence we wait one more task.
    u.task(function () {
      // If the user has scrolled while the page was loading, we will
      // not reset their scroll position by revealing the #anchor fragment.
      if (!userScrolled) {
        return revealHash()
      }
    })
  })

  up.on(window, 'hashchange', () => revealHash())

  up.on('up:framework:reset', reset)

  return {
    reveal,
    revealHash,
    firstHashTarget,
    config,
    get: closest,
    subtree: getSubtree,
    around: getAround,
    get root() { return getRoot() },
    rootWidth,
    rootHeight,
    rootHasReducedWidthFromScrollbar,
    rootOverflowElement,
    isRoot,
    scrollbarWidth,
    saveScroll,
    restoreScroll,
    resetScroll,
    saveFocus,
    restoreFocus,
    anchoredRight,
    absolutize,
    focus: doFocus,
    tryFocus,
    makeFocusable,
    newStateCache,
    focusedElementWithin,
  }
})()

up.focus = up.viewport.focus
up.reveal = up.viewport.reveal
