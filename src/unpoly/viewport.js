require('./viewport.sass')

/*-
Scrolling and focus
===================

The `up.viewport` module controls [scrolling](/scrolling)
and [focus](/focus) within scrollable containers ("viewports").

The default viewport for any web application is the
[document's scrolling element](https://developer.mozilla.org/en-US/docs/Web/API/Document/scrollingElement).
An application may define additional viewports by giving the CSS property `{ overflow-y: scroll }` to any block element.

@see scrolling
@see scroll-tuning
@see focus
@see focus-visibility
@see infinite-scrolling

@see [up-viewport]
@see [up-fixed=top]
@see up.reveal

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

    By default this contains the `[up-viewport]` attribute.

    Matching elements must have a [derivable target selector](/target-derivation).

  @param {Array} [config.fixedTopSelectors]
    An array of CSS selectors that find elements fixed to the
    top edge of the screen (using `position: fixed`).

    See [`[up-fixed="top"]`](/up-fixed-top) for details.
  @param {Array} [config.fixedBottomSelectors]
    An array of CSS selectors that match elements fixed to the
    bottom edge of the screen (using `position: fixed`).

    See [`[up-fixed="bottom"]`](/up-fixed-bottom) for details.
  @param {Array} [config.anchoredRightSelectors]
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

    @experimental
  @param {number} [config.revealTop=false]
    Whether to always scroll a [revealing](/up.reveal) element to the top.

    By default Unpoly will scroll as little as possible to make the element visible.
  @param {Function(Object): boolean} [config.autoFocusVisible]
    Whether elements focused by Unpoly should have a [visible focus ring](/focus-visibility).

    By default the focus ring will be visible if either the user [interacted with the keyboard](/up.event.inputDevice)
    or the focused element is a [form field](/up.form.config#config.fieldSelectors).

    The value is a function that accepts an object with `{ element, inputDevice }` properties and returns
    a boolean. The `{ element }` property is the focused element. The `{ inputDevice }` property is a string
    denoting the [interaction's input device](/up.event.inputDevice).

    The default configuration is implemented like this:

    ```js
    up.viewport.config.autoFocusVisible = ({ element, inputDevice }) =>
      inputDevice === 'key' || up.form.isField(element)
    ```

    @experimental
  @stable
  */
  const config = new up.Config(() => ({
    viewportSelectors: ['[up-viewport]', '[up-fixed]'],
    fixedTopSelectors: ['[up-fixed~=top]'],
    fixedBottomSelectors: ['[up-fixed~=bottom]'],
    anchoredRightSelectors: ['[up-anchored~=right]', '[up-fixed~=top]', '[up-fixed~=bottom]', '[up-fixed~=right]'],
    revealSnap: 200,
    revealPadding: 0,
    revealTop: false,
    revealMax() { return 0.5 * window.innerHeight },
    autoFocusVisible({ element, inputDevice }) { return inputDevice === 'key' || up.form.isField(element) }
  }))

  const bodyShifter = new up.BodyShifter()

  up.compiler(config.selectorFn('anchoredRightSelectors'), function(element) {
    return bodyShifter.onAnchoredElementInserted(element)
  })

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
  - [configure default options](/up.viewport.config) for `{ fixedTopSelectors }` or `{ fixedBottomSelectors }`

  @function up.reveal

  @param {string|Element|jQuery} element
    The element to reveal.

  @param {string} [options.snap]
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

    When set to `'auto'`, the behavior is determined by the CSS property
    [`scroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior) of the viewport element.

  @param {number} [options.padding]
    The desired padding between the revealed element and the
    closest [viewport](/up.viewport) edge (in pixels).

    Defaults to `up.viewport.config.revealPadding`.

  @return {undefined}

  @stable
  */
  const reveal = up.mockable(function(element, options) {
    // copy options, since we will mutate it below (options.layer = ...).
    options = u.options(options)
    element = f.get(element, options)

    // Now that we have looked up the element with an option like { layer: 'any' },
    // the only layer relevant from here on is the element's layer.
    if (!(options.layer = up.layer.get(element))) {
      up.fail('Cannot reveal a detached element')
    }

    if (options.peel) { options.layer.peel() }

    const motion = new up.RevealMotion(element, options)
    motion.start()

    return up.migrate.formerlyAsync?.('up.reveal()') || true
  })

  /*-
  Focuses the given element.

  Focusing an element will also [reveal](/up.reveal) it, unless `{ preventScroll: true }` is passed.

  @function up.focus

  @param {string|Element|jQuery} element
    The element to focus.

  @param {boolean} [options.preventScroll=false]
    Whether to prevent changes to the scroll position.

  @param {string} [options.inputDevice]
    The [input device](/up.event.inputDevice) used for the current interaction.

    Accepts values `'key'`, `'pointer'` and `'unknown'`.

    Defaults to the [current input device](up.event.inputDevice).

    @internal

  @param {boolean|string} [options.focusVisible='auto']
    Whether the focused element should have a [visible focus ring](/focus-visibility).

    If set to `true` the element will be assigned the `.up-focus-visible` class.

    If set to `false` the element will be assigned the `.up-focus-hidden` class.

    If set to `'auto'` (the default), focus will be visible if `up.viewport.config.autoFocusVisible()`
    returns `true` for the given element and [current input device](/up.event.inputDevice).

    The [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) pseudo-class will
    also be set or removed accordingly on [supporting browsers](https://caniuse.com/mdn-api_htmlelement_focus_options_focusvisible_parameter).

    @experimental

  @param {boolean} [options.force=false]
    Whether to force focus even if `element` would otherwise not be a focusable element.

    @experimental

  @experimental
  */
  function doFocus(element, { preventScroll, force, inputDevice, focusVisible } = {}) {
    if (force) {
      // (1) Element#tabIndex is -1 for all non-interactive elements,
      //     whether or not the element has an [tabindex=-1] attribute.
      // (2) Element#tabIndex is 0 for interactive elements, like links,
      //     inputs or buttons. [up-clickable] elements also get a [tabindex=0].
      //     to participate in the regular tab order.
      if (!element.hasAttribute('tabindex') && element.tabIndex === -1) {
        element.setAttribute('tabindex', '-1')
      }
    }

    inputDevice ??= up.event.inputDevice
    focusVisible ??= 'auto'
    focusVisible = u.evalAutoOption(focusVisible, config.autoFocusVisible, { element, inputDevice })

    element.focus({
      preventScroll: true, // Focus without scrolling, since we're going to use our custom scrolling logic below.
      focusVisible,        // Control native :focus-visible for browsers that support this option
    })

    // Don't rely on the `focusin` listener below to remove our focus classes, to cover
    // an edge case where the element focused multiple times with different focus devices.
    removeFocusClasses(element)
    element.classList.add(focusVisible ? 'up-focus-visible' : 'up-focus-hidden')

    if (!preventScroll) {
      // Use up.reveal() which scrolls far enough to ignore fixed nav bars
      // obstructing the focused element.
      return reveal(element)
    }
  }

  function removeFocusClasses(element) {
    element?.classList.remove('up-focus-hidden', 'up-focus-visible')
  }

  // Wait until another element is focused. Otherwise we would lose .up-focus-hidden
  // when the user switches to another window, then returns to the app window (where
  // a content element might still be :focus-visible).
  up.on('focusin', function({ relatedTarget }) {
    removeFocusClasses(relatedTarget)
  })


  /*-
  This class is assigned to elements that were [focused by Unpoly](/focus) but should not
  have a [visible focus ring](/focus-visibility).

  You can use this class to [remove an unwanted focus outline](#example).

  ## Relation to `:focus-visible`

  Unpoly will try to unset `:focus-visible` whenever it sets `.up-focus-visible`, but can only do so
  in [some browsers](https://caniuse.com/mdn-api_htmlelement_focus_options_focusvisible_parameter).
  Because of this the `.up-focus-hidden` class may be set on elements that the browser considers to be
  [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible).

  ## Example

  @include focus-ring-hide-example

  @selector .up-focus-hidden
  @experimental
  */

  /*-
  This class is assigned to elements that were [focused by Unpoly](/focus) and should
  have a [visible focus ring](/focus-visibility).

  You can use this class to [give a new component a focus ring](#example) for keyboard users,
  while not rendering a focus ring for mouse or touch users.

  ## Relation to `:focus-visible`

  Unpoly will try to force `:focus-visible` whenever it sets `.up-focus-visible`, but can only do so
  in [some browsers](https://caniuse.com/mdn-api_htmlelement_focus_options_focusvisible_parameter).
  Because of this the `.up-focus-visible` class may be set on elements that the browser considers to *not* be
  [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible).

  ## Example

  @include focus-ring-show-example

  @selector .up-focus-visible
  @experimental
  */

  function tryFocus(element, options) {
    doFocus(element, options)
    return element === document.activeElement
  }

  /*-
  [Reveals](/up.reveal) an element matching the given `#hash` anchor.

  Other than the default behavior found in browsers, `up.viewport.revealHash()` works with
  [multiple viewports](/up-viewport) and honors [fixed elements](/up-fixed-top) obstructing the user's
  view of the viewport.

  When the page loads initially, this function is automatically called with the hash from
  the current URL.

  If no element matches the given `#hash` anchor, a falsy value is returned.

  ### Example

  ```js
  up.viewport.revealHash('#chapter2')
  ```

  @function up.viewport.revealHash
  @param {string} hash
  @internal
  */
  function revealHash(hash = location.hash, options = {}) {
    if (!hash) return

    let match = firstHashTarget(hash, options)
    let setLocation = () => { if (options.setLocation) location.hash = hash }

    if (match) {
      setLocation()
      let doReveal = () => reveal(match, { top: true })
      if (options.strong) u.fastTask(doReveal)
      return doReveal()
    } else if (hash === '#top' || hash === '#') {
      setLocation()
      return scrollTo(0, options)
    }
  }

  function allSelector() {
    // On Edge the document viewport can be changed from CSS
    return [rootSelector(), ...config.viewportSelectors].join()
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
  @return {List<Element>}
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
  @return {List<Element>}
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

  function rootScrollbarWidth() {
    return window.innerWidth - rootWidth()
  }

  function scrollTopKey(viewport) {
    return up.fragment.tryToTarget(viewport)
  }

  /*-
  @function up.viewport.fixedElements
  @internal
  */
  function fixedElements(root = document) {
    const queryParts = ['[up-fixed]'].concat(config.fixedTopSelectors).concat(config.fixedBottomSelectors)
    return root.querySelectorAll(queryParts.join())
  }

  /*-
  Saves scroll positions for later restoration.

  The scroll positions will be associated with the current URL.
  They can later be restored by calling `up.viewport.restoreScroll()`
  at the same URL, or by following a link with an [`[up-scroll="restore"]`](/scrolling#restoring-scroll-positions)
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
  @return {Object<string, number>}
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

  Unpoly automatically restores scroll positions when the user [presses the back button](/restoring-history).

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
    Returns whether scroll positions could be restored.
  @experimental
  */
  function restoreScroll(...args) {
    const [viewports, options] = parseOptions(args)
    const { location } = options.layer
    const locationScrollTops = options.layer.lastScrollTops.get(location)
    if (locationScrollTops) {
      setScrollPositions(viewports, locationScrollTops, 0)
      up.puts('up.viewport.restoreScroll()', 'Restored scroll positions to %o', locationScrollTops)
      return true
    } else {
      return false
    }
  }

  /*-
  Saves focus-related state for later restoration.

  Saved state includes:

  @include focus-state

  State can only be preserved if the focused element is [targetable](/up.fragment.isTargetable).

  Saved state will be associated with the given layer's location.
  It can later be restored by calling `up.viewport.restoreScroll()`
  at the same location, or by following a link with an [`[up-focus="restore"]`](/focus#restoring-focus)
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

  Unpoly automatically restores focus-related state when the user [presses the back button](/restoring-history).

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
    return new up.FIFOCache({ capacity: 30, normalizeKey: u.matchableURL })
  }

  function parseOptions(args) {
    const [reference, options] = u.args(args, 'val', 'options')

    options.layer = up.layer.get(options)

    let viewports
    if (reference) {
      viewports = [closest(reference, options)]
    } else if (options.around) {
      // This is relevant when updating a fragment with { scroll: 'restore' | 'reset' }.
      // In tht case we restore / reset the scroll tops of all viewports around the fragment.
      viewports = getAround(options.around, options)
    } else {
      viewports = getAll(options)
    }
    return [viewports, options]
  }

  function scrollTo(position, ...args) {
    const [viewports, _options] = parseOptions(args)
    setScrollPositions(viewports, {}, position)
    return true
  }

  function setScrollPositions(viewports, tops, defaultTop) {
    for (let viewport of viewports) {
      const key = scrollTopKey(viewport)
      viewport.scrollTop = tops[key] || defaultTop
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
    }) // stretch to the <up-bounds> height we set below

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
      return e.setStyle(bounds, boundsRect, 'px')
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
  instead of scrolling the `<body>` element. As an alternative you can also push a selector
  matching your custom viewport to the `up.viewport.config.viewportSelectors` array.

  When [scrolling](/scrolling) Unpoly will always scroll the viewport closest
  to the updated element. By default this is the `<body>` element.

  Elements with the `[up-viewport]` attribute must also have a [derivable target selector](/target-derivation).

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

  When [following a fragment link](/up-follow), the viewport is scrolled
  so the targeted element becomes visible. By using this attribute you can make
  Unpoly aware of fixed elements that are obstructing the viewport contents.
  Unpoly will then scroll the viewport far enough that the revealed element is fully visible.

  Instead of using this attribute,
  you can also configure a selector in `up.viewport.config.fixedTopSelectors`.

  ### Example

  ```html
  <div class="top-nav" up-fixed="top">...</div>
  ```

  @selector [up-fixed=top]
  @stable
  */

  /*-
  Marks this element as being fixed to the bottom edge of the screen
  using `position: fixed`.

  When [following a fragment link](/up-follow), the viewport is scrolled
  so the targeted element becomes visible. By using this attribute you can make
  Unpoly aware of fixed elements that are obstructing the viewport contents.
  Unpoly will then scroll the viewport far enough that the revealed element is fully visible.

  Instead of using this attribute,
  you can also configure a selector in `up.viewport.config.fixedBottomSelectors`.

  ### Example

  ```html
  <div class="bottom-nav" up-fixed="bottom">...</div>
  ```

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
  You may customize this behavior by styling the `.up-scrollbar-away` class.

  Instead of giving this attribute to any affected element,
  you can also configure a selector in `up.viewport.config.anchoredRightSelectors`.

  > [note]
  > Elements with `[up-fixed=top]` or `[up-fixed=bottom]` are also considered to be right-anchored.

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
  This class is assigned to the `<body>` and [right-anchored](/up-anchored-right)
  elements while an [overlay](/up.layer) with a scrolling viewport is open.

  Overlays temporarily hide the document's main scroll bar, to prevent multiple scrollbars from being rendered.
  Without a scrollbar, the `<body>` becomes wider. This may cause elements to jump in width as the overlay opens and
  closes. Elements can use this class to compensate by setting a larger `right` or `margin-right` style in their CSS.

  ### Default styles

  Unpoly sets some default styles for `.up-scrollbar-away` that will usually stabilize
  the width of absolutely positioned elements without additional CSS:

  - The right padding of the `<body>` element is increased by the scrollbar width
  - The `right` property of [right-anchored](/up-anchored-right) elements is increased by the scrollbar width.

  You can inspect the default styles
  in [`viewport.sass`](https://github.com/unpoly/unpoly/blob/master/src/unpoly/viewport.sass).

  ### Customizing styles

  A chat support box is fixed to the bottom-right part of the screen, keeping a distance of 20 pixels from the window corner:

  ```css
  .chat {
    position: fixed;
    bottom: 20px;
    right: 20px;
    right: 20px;
  }
  ```

  While a scrolling overlay is open we want to add the scrollbar width to the `right`
  so it position remains stable:

  ```css
  .chat.up-scrollbar-away {
    right: calc(20px + var(--up-scrollbar-width)) !important
  }
  ```

  The `var(--up-scrollbar-width)` property is provided by Unpoly. It contains the width of the main document scrollbar
  that is now hidden, e.g. `15px`.

  @selector .up-scrollbar-away
  @experimental
  */

  /*-
  @function up.viewport.firstHashTarget
  @internal
  */
  function firstHashTarget(hash, options = {}) {
    hash = pureHash(hash)
    if (hash) {
      const selector = [
        // Match an <* id="hash">
        e.idSelector(hash),
        // Match an <a name="hash">
        'a' + e.attrSelector('name', hash)
      ].join()
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
    if (up.fragment.contains(scopeElement, focusedElement)) {
      return focusedElement
    }
  }

  const CURSOR_PROPS = ['selectionStart', 'selectionEnd', 'scrollLeft', 'scrollTop']

  function copyCursorProps(from, to = {}) {
    for (let key of CURSOR_PROPS) {
      try {
        to[key] = from[key]
      } catch (error) {
        // Safari throws a TypeError when accessing { selectionStart }
        // from a focused <input type="submit">. We ignore it.
      }
    }
    return to
  }

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
    isRoot,
    rootScrollbarWidth,
    saveScroll,
    restoreScroll,
    scrollTo,
    saveFocus,
    restoreFocus,
    absolutize,
    focus: doFocus,
    tryFocus,
    newStateCache,
    focusedElementWithin,
    copyCursorProps,
    bodyShifter,
  }
})()

up.focus = up.viewport.focus
up.reveal = up.viewport.reveal
