/*-
History
========

The `up.history` module helps you work with the browser history.

@see up.history.location
@see up:location:changed
@see [up-back]

@see updating-history
@see restoring-history
@see history-in-overlays
@see analytics

@module up.history
*/
up.history = (function() {

  const u = up.util
  const e = up.element

  /*-
  Configures behavior when the user goes back or forward in browser history.

  @property up.history.config
  @section History
    @param {Array} [config.restoreTargets=['body']]
      A list of possible CSS selectors to [replace](/up.render)
      when the user [goes back or forward in history](/restoring-history).

      If more than one target is configured, the first selector matching both
      the current page and server response will be updated.

      If nothing is configured, the `<body>` element will be replaced.
    @param {boolean} [config.enabled=true]
      Configures whether [fragment updates](/up.render) can [update history](/updating-history).

      If set to `false` Unpoly will never change history.

  @section Meta tags
    @param {boolean} [config.updateMetaTags=true]
      Configures whether [history changes](/updating-history) update
      [meta tags](/updating-history#history-state) in addition
      to the document's title and URL.

      Instead of disabling meta tag synchronization globally you may also disable it
      per render pass. To do so pass a [`{ metaTags: false }`](/up.render#options.metaTags) option
      or set an [`[up-meta-tags="false"]`](/up-follow#up-meta-tags) attribute
      on a link.

    @param {Array<string>} [config.metaTagSelectors]
      An array of CSS selectors matching default [meta tags](/up-meta)
      that are be updated during [history changes](/updating-history).

      By default popular `<meta>` and certain `<link>` elements are considered meta tags.

      Because of the [large number of `[rel]` attribute values](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel)
      Unpoly the most common `link[rel]` elements are matched by default.
      You can [include additional elements](/up-meta#including-meta-tags) by assigning an `[up-meta]` attribute
      or by pushing their selector into this configuration array.

      Only elements in the `<head>` can be matched. Elements in the `<body>` are never considered,
      even if they match one of the configured selectors.

    @param {Array<string>} [config.noMetaTagSelectors]
      Exceptions to `up.history.config.metaTagSelectors`.

      Matching elements will *not* be considered [meta tags](/up-meta)
      even if they match `up.history.config.metaTagSelectors`.

  @stable
  */
  const config = new up.Config(() => ({
    enabled: true,
    updateMetaTags: true,
    // Prefer restoring the body instead of :main, in case the last fragment update
    // changed the page layout. See https://github.com/unpoly/unpoly/issues/237.
    restoreTargets: ['body'],
    metaTagSelectors: [
      'meta',
      'link[rel=alternate]',
      'link[rel=canonical]',
      'link[rel=icon]',
      '[up-meta]',
      'script[type="application/ld+json"]',
    ],
    noMetaTagSelectors: [
      'meta[http-equiv]',
      '[up-meta=false]',
      // Do not invalidate existing nonced callbacks.
      // New nonced callbacks from the response will validates and then rewritten to match the existing nonce.
      'meta[name=csp-nonce]',
    ],
  }))

  /*-
  Returns a normalized URL for the previous history entry.

  If no previous history entry is known, returns `undefined`.

  @property up.history.previousLocation
  @param {string} previousLocation
  @stable
  */
  let previousLocation
  let nextPreviousLocation
  let nextTrackOptions
  let locationTrackingActive = true
  let adoptedBases = new up.FIFOCache({ capacity: 100, normalizeKey: getBase })

  function reset() {
    previousLocation = undefined
    nextPreviousLocation = undefined
    nextTrackOptions = undefined
    locationTrackingActive = true
    adoptedBases.clear()
    trackCurrentLocation({ reason: null, alreadyHandled: true })
    adoptBase() // make sure we will process the current history entry
  }

  /*-
  Returns a normalized URL for the current browser location.

  The returned URL is an absolute pathname like `"/path"` without a hostname or port.
  It will include a `#hash` fragment and query string, if present.

  > [NOTE]
  > If the current [layer](/up.layer) does not have [visible history](/up.Layer.prototype.history),
  > the browser's address bar will show the location of an ancestor layer.
  > To get the location of the current layer, use `up.layer.location`.

  @property up.history.location
  @param {string} location
  @stable
  */
  function currentLocation() {
    return u.normalizeURL(location.href)
  }

  /*-
  Remembers the current URL so we can use previousLocation on pop.

  @function trackCurrentLocation
  @internal
  */
  function trackCurrentLocation(trackOptions) {
    // TODO: locationTractingActive can be part of nextTrackOptions
    //       withTrackOptions({ disableTracking: true }, fn)
    if (!locationTrackingActive) return
    let { reason, alreadyHandled } = nextTrackOptions || trackOptions

    // The currentLocation() function normalizes
    let location = currentLocation()

    if (isAdoptedState()) {
      // The user might have refreshed the page, making us lose adoptedBases.
      adoptBase(location)
    } else if (isAdoptedBase(location)) {
      // The user might
      adoptState()
    }

    if (nextPreviousLocation !== location) {
      previousLocation = nextPreviousLocation
      nextPreviousLocation = location

      if (reason === 'detect') {
        reason = (getBase(location) === getBase(previousLocation)) ? 'hash' : 'pop'
      }

      let willHandle = !alreadyHandled && isAdoptedBase(location)

      let locationChangedEvent = up.event.build('up:location:changed', {
        reason,
        location,
        previousLocation,
        alreadyHandled,
        willHandle,
        log: `New location is ${location}`
      })

      up.migrate.prepareLocationChangedEvent?.(locationChangedEvent)

      if (reason) {
        up.emit(locationChangedEvent)
        reactToChange(locationChangedEvent)
      }
    }
  }

  /*-
  This event is [emitted](/up.emit) after the browser's address bar was updated with a new URL.

  There may be several reasons why the browser location was changed:

  - A fragment update changes history through [navigation](/navigation) or rendering with `{ history: true }`.
  - The user uses the back or forward buttons in their browser UI.
  - Programmatic calls to functions like `up.history.push()` or `history.pushState()`.
  - The user navigates to a different `#hash` within the page.

  The `up:location:changed` event is *not* emitted when the page is loaded initially.
  For this observe `up:framework:booted`.

  ## Handling the change {#handling}

  This event cannot be prevented, but you can mutate the `event.willHandle` property to decide whether
  Unpoly should handle the change by restoring a location or revealing a fragment matching the location `#hash`.

  ## Location changes in overlays {#overlays}

  Overlays can configure whether their history state is reflected the browser's address bar.

  When a [layer](/up.layer) has no [visible history](/up.Layer.prototype.history), no `up:location:changed` event will be emitted.
  However, an `up:layer:location:changed` will be emitted even if the address bar did not change.

  Also see [History in overlays](/history-in-overlays).

  @event up:location:changed
  @section Change
    @param {string} event.location
      The new URL after the change.

      When this event is emitted, the [browser location](/up.history.location) has already been updated.
    @param {string} event.reason
      The action that caused this change in history state.

      The value of this property is one of the following:

      | Value | Reason |
      |-------|--------|
      | `'hash'`    | The location was changed, but only the `#hash` changed from the [previous location](/up.history.previousLocation). |
      | `'push'`    | A new history entry was added via `up.history.push()` or `history.pushState()`.                |
      | `'replace'` | The current history update was changed via `up.history.replace()` or `history.replaceState()`. |
      | `'pop'`     | The user navigated back to the current location. |
  @section Handling
    @param {boolean} event.alreadyHandled
      Whether Unpoly thinks this change has already been handled and requires no additional processing.

      For example, updating history by [navigating](/navigation) or calling `history.pushState()` is
      considered to be already handled.

      @experimental
    @param {boolean} event.willHandle
      Whether Unpoly thinks it is responsible for handling this change.

      By default Unpoly feels responsible for [owned locations](/restoring-history#handled-entries)
      when the change has not [already been handled](#event.alreadyHandled).

      Listeners can tell Unpoly to *not* handle a change by setting `event.willHandle = false`.
      You can then handle the change with your own code.

      Listeners can tell Unpoly to handle a change it does not own by setting `event.willHandle = true`.
      Regardless of this Unpoly will never handle a change that [already been handled](#event.alreadyHandled).

      @experimental
  @stable
  */

  function splitLocation(location) {
    return location?.split(/(?=#)/) || []
  }

  function getBase(location) {
    return splitLocation(location)[0]
  }

  /*-
  Returns whether the given URL matches the [current browser location](/up.history.location).

  ### Examples

  ```js
  location.hostname // => '/path'

  up.history.isLocation('/path') // result: true
  up.history.isLocation('/other') // result: false
  ```

  By default, a trailing `#hash` will be ignored for the comparison. A `?query` string will not:

  ```js
  location.hostname // => '/path'

  up.history.isLocation('/path#hash') // result: true
  up.history.isLocation('/path?query') // result: false
  ```

  The given URL is [normalized](/up.util.normalizeURL), so any URL string pointing to the browser location
  will match:

  ```js
  location.hostname // result: '/current-host'
  location.pathname // => '/foo'

  up.history.isLocation('/foo') // result: true
  up.history.isLocation('http://current-host/foo') // result: true
  up.history.isLocation('http://otgher-host/foo') // result: false
  ```

  @function up.history.isLocation
  @param {string} url
    The URL to compare against the current browser location.

    This can be a either an absolute pathname (`/path`), a relative filename (`index.html`) or a fully qualified URL (`https://...`).
  @param {boolean} [options.hash=true]
    Whether to consider `#hash` fragments in the given or current URLs.

    When set to `false` this function will consider the URLs `/foo#one` and `/foo#two` to be equal.
  @return {boolean}
    Whether the browser is currently at the given location.
  @stable
  */
  function isLocation(url, options) {
    return u.matchURLs(url, location.href, { hash: true, ...options })
  }

  /*-
  Replaces the current history entry and updates the browser's location bar.

  ## Restoration

  The replaced history entry will be owned by Unpoly.
  When the user navigates back to this history entry,
  Unpoly will [restore the content](/restoring-history) at that URL.

  To replace a history entry that you want to restore yourself, use the browser's
  [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState) function,
  or handle the `up:location:changed` event.

  @function up.history.replace
  @param {string} url
  @experimental
  */
  function replace(location, trackOptions) {
    placeAdoptedHistoryEntry('replaceState', location, trackOptions)
  }

  /*-
  Adds a new history entry and updates the browser's
  address bar.

  Does not add a history entry if the given URL is already the current browser location.
  If the URL did change, an event `up:location:changed` is emitted.

  When [navigating](/navigation) (or rendering with [`{ history: true }`](/up.render#options.history))
  Unpoly will update the browser location for you. You only need to call `up.history.push()` to push
  a new entry without rendering.

  ## Restoration

  The new history entry will be owned by Unpoly.
  When the user navigates back to this history entry,
  Unpoly will [restore the content](/restoring-history) at that URL.

  To push a history entry that you want to restore yourself, use the browser's
  [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) function,
  or handle the `up:location:changed` event.

  @function up.history.push
  @param {string} url
    The URL for the history entry to be added.
  @experimental
  */
  function push(location, trackOptions) {
    if (isLocation(location)) return
    placeAdoptedHistoryEntry('pushState', location, trackOptions)
  }

  function placeAdoptedHistoryEntry(method, location, trackOptions) {
    adoptBase(location)

    if (config.enabled) {
      nextTrackOptions = trackOptions
      // Call this instead of originalPushState in case someone else has patched history.pushState()
      // Our own tests do this to rate-limit the use of the history API.
      history[method](null, { up: true }, location)
      nextTrackOptions = undefined
    }
  }

  function isAdoptedBase(location) {
    // We handle bases (path + query string) that were pushed or replaced via up.history methods.
    // All other bases we assume are pushed by external JS that wants to handle restoration itself.
    return !!adoptedBases.get(location)
  }

  function adoptBase(location = currentLocation()) {
    location = u.normalizeURL(location)
    adoptedBases.set(location, true)
  }

  function isAdoptedState() {
    return history.state?.up
  }

  function adoptState() {
    let { state } = history

    // If we already have history.state.up, don't waste another replaceState() call.
    if (isAdoptedState()) return

    if (u.isBlank(state) || u.isObject(state)) {
      locationTrackingActive = false
      history.replaceState({ ...state, up: true }, '')
      locationTrackingActive = true
    }
  }

  function restoreLocation(location) {

    up.error.muteUncriticalRejection(up.render({
      guardEvent: up.event.build('up:location:restore', { location, log: `Restoring location ${location}` }),

      // The browser has already restored the URL, but hasn't changed content
      // four our synthetic history state. We're now fetching the content for the restored URL.
      url: location,
      target: config.restoreTargets,

      // The browser won't let us prevent the state restoration, so we're
      // rendering whatever the server sends us.
      fail: false,

      history: true,
      // (1) While the browser has already restored the earlier URL, we must still
      //     pass it to render() so the current layer can track the new URL.
      // (2) Since we're passing the current URL, up.history.push() will not add another state.
      // (2) Pass the current URL to ensure that this exact URL is being rendered
      //     and not something derived from the up.Response.
      location,

      // Don't replace elements in a modal that might still be open
      // We will close all overlays and update the root layer.
      peel: true,
      layer: 'root',

      cache: 'auto',
      revalidate: 'auto',

      // We already saved view state in onPop()
      saveScroll: false,
      scroll: ['restore', 'auto'],
      saveFocus: false,
      focus: ['restore', 'auto'],
    }))
  }

  function reactToChange(event) {
    if (event.alreadyHandled) {
      return
    }

    if (!event.willHandle) {
      up.puts('up.history', 'Ignoring history entry owned by foreign script')
      return
    }

    if (event.reason === 'pop') {
      up.viewport.saveFocus({ location: event.previousLocation })
      up.viewport.saveScroll({ location: event.previousLocation })
      restoreLocation(event.location)
    } else if (event.reason === 'hash') {
      // We handle every hashchange, since only we know reveal obstructions.
      up.viewport.revealHash(location.hash, { strong: true })
    }
  }


  /*-
  This event is emitted when the user is [restoring a previous history entry](/restoring-history),
  usually by pressing the back button.

  Listeners may prevent `up:location:restore` or mutate `event.renderOptions`
  to [customize the restoration behavior](/restoring-history#custom-behavior).

  When this event is emitted, the [browser location](/up.history.location) has already been updated.

  [Restoring history](/restoring-history){:.article-ref}

  @event up:location:restore
  @param {string} event.location
    The URL for the restored history entry.
  @param {Object} event.renderOptions
    An object with [render options](/up.render#parameters) for the render pass
    that will restore content for this history entry.

    Listeners may inspect and modify these options.
    Render options cannot stop the browser from restoring the URL in the address bar.
  @param event.preventDefault()
    Prevent Unpoly from restoring content for this history entry.

    Preventing the event will *not* stop the browser from restoring the URL in the address bar.
  @stable
  */

  function findMetaTags(head = document.head) {
    return head.querySelectorAll(config.selector('metaTagSelectors'))
  }

  /*-
  Configures whether this `<head>` element is updated during [history changes](/updating-history).

  [Updating history](/updating-history){:.article-ref}

  ### Default meta elements

  By [default](/up.history.config#config.metaTagSelectors) popular `<meta>` and certain `<link>`
  elements in the `<head>` are considered meta tags.
  They will be updated when history is changed, in addition to the document's title and URL.

  ```html
  <link rel="canonical" href="https://example.com/dresses/green-dresses"> <!-- mark-line -->
  <meta name="description" content="About the AcmeCorp team"> <!-- mark-line -->
  <meta prop="og:image" content="https://app.com/og.jpg"> <!-- mark-line -->
  <script src="/assets/app.js"></script>
  <link rel="stylesheet" href="/assets/app.css">
  ```

  The linked JavaScript and stylesheet are *not* part of history state and will not be updated
  during history changes.

  ### Including additional elements {#including-meta-tags}

  To update additional `<head>` elements during history changes, mark them with an `[up-meta]` attribute:

  ```html
  <link rel="license" href="https://opensource.org/license/mit/" up-meta>
  ```

  Only elements in the `<head>` can be matched this way.

  To include additional elements by default, configure `up.history.config.metaTagSelectors`.

  ### Excluding elements {#excluding-meta-tags}

  To preserve a `<head>` element during history, changes, set an `[up-meta=false]` attribute:

  ```html
  <meta charset="utf-8" up-meta="false">
  ```

  To exclude elements by default, configure `up.history.config.noMetaTagSelectors`.

  @selector [up-meta]
  @stable
  */

  function updateMetaTags(newMetaTags) {
    let oldMetaTags = findMetaTags()
    for (let oldMetaTag of oldMetaTags) {
      // We do not use up.destroy() as meta tags may be inserted/removed
      // multiple times as we open and close an overlay.
      oldMetaTag.remove()
    }

    for (let newMetaTag of newMetaTags) {
      document.head.append(newMetaTag)
    }
  }

  function getLang(doc = document) {
    // return e.attr(doc.documentElement, 'lang')
    let { documentElement } = doc
    if (documentElement.matches('html')) {
      return doc.documentElement.lang
    }
  }

  function updateLang(newLang) {
    e.setAttrPresence(e.root, 'lang', newLang, !!newLang)
  }

  function patchHistoryAPI() {
    const originalPushState = history.pushState
    history.pushState = function(...args) {
      originalPushState.apply(this, args)
      trackCurrentLocation({ reason: 'push', alreadyHandled: true })
    }

    const originalReplaceState = history.replaceState
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args)
      trackCurrentLocation({ reason: 'replace', alreadyHandled: true })
    }
  }

  function adoptInitialHistoryEntry() {
    // Unpoly replaces the initial page state so it can later restore it when the user
    // goes back to that initial URL. However, if the initial request was a POST,
    // Unpoly will wrongly assume that it can restore the state by reloading with GET.
    if (up.protocol.initialRequestMethod() === 'GET') {
      // Replace the vanilla state of the initial page load with an Unpoly-enabled state
      adoptState()

      // Adopt all #hash navigations to the same URL.
      adoptBase()
    }
  }

  // Wait until the framework is booted before we (1) patch window.history
  // and (2) replace the current history state.
  up.on('up:framework:boot', function({ mode }) {
    trackCurrentLocation({ reason: null, alreadyHandled: true }) // no event is emitted while booting
    patchHistoryAPI()
    adoptInitialHistoryEntry()

    // (1) Honor obstructions when the initial URL contains a #hash.
    // (2) Wait until booting because the developer might choose not to boot Unpoly.
    // (3) Don't scroll when the user manually boots later, as the user might already have scrolled elsewhere.
    if (mode === 'auto') {
      // (1) When reloading, Chrome's default scrolling behavior
      //     happens *before* DOMContentLoaded. We fix that as soon as possible.
      // (2) When following a link to another URL with a #hash URL, Chrome's default
      //     scrolling behavior happens *after* DOMContentLoaded. We wait one more task to
      //     fix the scroll position after the browser did its thing.
      up.viewport.revealHash(location.hash, { strong: true })
    }
  })

  up.on(window, 'hashchange, popstate', () => {
    // We do not detect the reason here because we're in  a state where
    // location and previousLocation are the same. This will be fixed by trackCurrentLocation().
    trackCurrentLocation({ reason: 'detect', alreadyHandled: false })
  })

  function onJumpLinkClicked(event, link) {
    // If other JavaScript already handled this click, do nothing.
    if (event.defaultPrevented) return

    // Don't handle clicks that would open a new tab.
    if (up.event.isModified(event)) return

    let [currentBase, currentHash] = splitLocation(up.layer.current.location)
    let [linkBase, linkHash] = splitLocation(u.normalizeURL(link))
    let verbatimHREF = link.getAttribute('href')

    // (1) If we're not scrolling the page, we must leave the event unprevented
    //     and allow the link to be followed, or handled by other JavaScript.
    // (2) currentBase may be undefined if we're on a layer that was opened from a string.
    let isJumpLink = (currentBase === linkBase) || verbatimHREF.startsWith('#')
    if (!isJumpLink) return

    // By default we will honor a { scroll-behavior } style from CSS.
    // This can be overridden by an [up-scroll-behavior] attribute.
    let behavior = link.getAttribute('up-scroll-behavior') ?? 'auto'

    // (1) Check if we recognize the link hash, because it matches a fragment or
    //     a well-known anchor like "#top".
    // (2) Scroll with { behavior: 'auto' } (instead of thew default { behavior: 'instant' }
    //     so it picks up any scroll-behavior CSS rule on the viewport element.
    let layer = up.layer.get(link)
    let revealFn = up.viewport.revealHashFn(linkHash, { layer, behavior })

    if (revealFn) {
      // (1) Prevent the browser, Unpoly or other JavaScript from following the link.
      // (2) This means we will be responsible to change the hash in the address bar.
      up.event.halt(event)

      up.log.putsEvent(event)

      // (1) Because we prevented the event, it is up to us to change the hash.
      // (2) We should not set the location if the layer shows no live history.
      if (linkHash !== currentHash && layer.showsLiveHistory()) {
        // We use pushState() instead of setting location.hash so we don't trigger
        // a hashchange event or cause browser scrolling.
        let newHREF = currentBase + linkHash
        push(newHREF, { reason: 'hash', alreadyHandled: true })
      }

      revealFn()
    } else {
      // (1) At this point revealHash() could not find a matching fragment.
      //     The hash also isn't '#top', which would also have been handled by revealHash().
      // (2) We might be looking at a <a href="#"> that wants to be handled be a script
      //     that is called after this click listener.
    }
  }

  up.on('up:click', 'a[href*="#"]', onJumpLinkClicked)

  /*-
  Changes the link's destination so it points to the previous URL.

  If no previous URL is known, the link will not be changed.

  > [NOTE]
  > Clicking an `[up-back]` link will *not* call [`history.back()`](https://developer.mozilla.org/en-US/docs/Web/API/History/back).
  > Instead the link will [navigate](/up.navigate) to the previous URL.

  ### Example

  This link ...

  ```html
  <a href="/default" up-back>
    Go back
  </a>
  ```

  ... will be transformed to:

  ```html
  <a href="/default" up-follow up-href="/previous-page" up-scroll="restore" up-follow>
    Go back
  </a>
  ```

  @selector [up-back]
  @stable
  */
  up.macro('[up-back]', function(link) {
    if (previousLocation) {
      e.setMissingAttrs(link, {
        'up-href': previousLocation,
        'up-scroll': 'restore'
      })
      link.removeAttribute('up-back')
      up.link.makeFollowable(link)
    }
  })

  up.on('up:framework:reset', reset)

  return {
    config,
    push,
    replace,
    get location() { return currentLocation() },
    get previousLocation() { return previousLocation },
    isLocation,
    findMetaTags,
    updateMetaTags,
    getLang,
    updateLang,
  }
})()
