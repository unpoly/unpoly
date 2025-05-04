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
  @param {Array} [config.restoreTargets=['body']]
    A list of possible CSS selectors to [replace](/up.render)
    when the user [goes back or forward in history](/restoring-history).

    If more than one target is configured, the first selector matching both
    the current page and server response will be updated.

    If nothing is configured, the `<body>` element will be replaced.
  @param {boolean} [config.enabled=true]
    Configures whether [fragment updates](/up.render) can [update history](/updating-history).

    If set to `false` Unpoly will never change history.

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
    preserveLayers: true,
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

  // Users who are not using layers will prefer settings restore targets
  // as up.history.config.restoreTargets instead of up.layer.config.any.restoreTargets.
  u.delegate(config, ['restoreTargets'], () => up.layer.config.any)

  /*-
  Returns a normalized URL for the previous history entry.

  Only history entries added by Unpoly functions will be considered.

  @property up.history.previousLocation
  @param {string} previousLocation
  @experimental
  */
  let previousLocation
  let nextPreviousLocation
  let nextTrackOptions

  let adoptedBases = new up.FIFOCache({ capacity: 100, normalizeKey: getBase })

  function isAdopted(location) {
    // We handle bases (path + query string) that were pushed or replaced via up.history methods.
    // All other bases we assume are pushed by external JS that wants to handle restoration itself.
    return !!adoptedBases.get(location)
  }

  function reset() {
    previousLocation = undefined
    nextPreviousLocation = undefined
    nextTrackOptions = undefined
    adoptedBases.clear()
    trackCurrentLocation({ reason: null, alreadyHandled: true })
    adopt() // make sure we will process the current history entry
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
  @experimental
  */
  function currentLocation() {
    return u.normalizeURL(location.href)
  }

  function currentLayerProfiles() {
    // history.state can only store JSON-serializable values.
    let serializableKeys = ['uid', 'location', ...up.Layer.Overlay.VISUAL_KEYS]
    return up.layer.stack.map((layer) => u.pick(layer, (layer) => u.pick(layer, serializableKeys)))
  }

  /*-
  Remembers the current URL so we can use previousLocation on pop.

  @function trackCurrentLocation
  @internal
  */
  function trackCurrentLocation(trackOptions) {
    let { reason, alreadyHandled } = nextTrackOptions || trackOptions

    // currentLocation() normalizes
    let location = currentLocation()

    if (nextPreviousLocation !== location) {
      previousLocation = nextPreviousLocation
      nextPreviousLocation = location

      if (reason === 'detect') {
        reason = (getBase(location) === getBase(previousLocation)) ? 'hash' : 'pop'
      }

      // When a user jumps from an adopted entry to a #hash,
      // this will push a new entry that is missing the { up } state
      // we need for restoration.
      if (reason === 'hash') {
        ensureAdoptedEntryHasState()
      }

      let willHandle = !alreadyHandled && isAdopted(location)

      // TODO: Document new up:location:changed properties
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
  - Programmatic calls to `up.history.push()`.
  - The user navigates to a different `#hash` within the page.

  When a [layer](/up.layer) has no [visible history](/up.Layer.prototype.history), following a link
  will not cause the browser's address bar to be updated. In this case no `up:location:changed` event will be emitted.
  However, an `up:layer:location:changed` will be emitted even if the address bar did not change.

  The `up:location:changed` event is *not* emitted when the page is loaded initially.
  For this observe `up:framework:booted`.

  This event cannot be prevented, but you can mutate the `event.willHandle` property to decide whether
  Unpoly should handle the change by restoring a location or revealing a fragment matching the location `#hash`.

  @event up:location:changed
  @param {string} event.location
    The URL for the history entry after the change.
  @param {string} event.reason
    The action that caused this change in history state.

    The value of this property is either `'push'`, `'pop'`, `'hash'` or `'replace'`.
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

  up.history.isLocation('/path') // => true
  up.history.isLocation('/other') // => false
  ```

  By default, a trailing `#hash` will be ignored for the comparison. A `?query` string will not:

  ```js
  location.hostname // => '/path'

  up.history.isLocation('/path#hash') // => true
  up.history.isLocation('/path?query') // => false
  ```

  The given URL is [normalized](/up.util.normalizeURL), so any URL string pointing to the browser location
  will match:

  ```js
  location.hostname // => '/current-host'
  location.pathname // => '/foo'

  up.history.isLocation('/foo') // => true
  up.history.isLocation('http://current-host/foo') // => true
  up.history.isLocation('http://otgher-host/foo') // => false
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
  @experimental
  */
  function isLocation(url, options) {
    return u.matchURLs(url, location.href, { hash: true, ...options })
  }

  /*-
  Replaces the current history entry and updates the browser's location bar with the given URL.

  When the user navigates to the replaced history entry at a later time,
  Unpoly will update the `<body>` element with the `<body>` fetched from the restored URL.

  To update a fragment other than body, configure `up.history.config.restoreTargets`.

  > [TIP]
  > [Navigating](/navigation) functions like `up.follow()` or `up.submit()`
  > will automatically update the browser's location bar for you. This can be disabled with
  > an [`{ history: false }`](/up.render#options.history) option.

  TODO: Document that the new state will be owned and restored by Unpoly. For custom state, use window.history.pushState().

  @function up.history.replace
  @param {string} url
  @internal
  */
  function replaceWithAdoptedEntry(location, trackOptions) {
    placeAdoptedEntry('replaceState', location, trackOptions)
  }

  /*-
  Adds a new history entry and updates the browser's
  address bar with the given URL.

  When the user restores the new history entry later,
  Unpoly will replace a selector from `up.history.config.restoreTargets` with the body from that URL.

  Note that [fragment navigation](/navigation) will automatically update the
  browser's location bar for you.

  Does not add a history entry if the the given URL is already the current browser location.

  Emits event `up:location:changed`.

  TODO: Document that the new state will be owned and restored by Unpoly. For custom state, use window.history.pushState().

  @function up.history.push
  @param {string} url
    The URL for the history entry to be added.
  @experimental
  */
  function pushAdoptedEntry(location, trackOptions) {
    placeAdoptedEntry('pushState', location, trackOptions)
  }

  function placeAdoptedEntry(method, location, trackOptions) {
    adopt(location)

    if (config.enabled) {
      nextTrackOptions = trackOptions
      let state = { up: { layerUIDs: currentLayerProfiles() } }
      // Call this instead of originalPushState in case someone else has patched history.pushState()
      history[method](state, '', location)
      nextTrackOptions = undefined
    }
  }

  function ensureAdoptedEntryHasState() {
    let location = currentLocation()

    if (isAdopted(location) && !history.state.up) {
      replaceWithAdoptedEntry(currentLocation(), { reason: null, alreadyHandled: true })
    }
  }

  /*-
  @function up.history.adopt
  @internal
  */
  function adopt(location = currentLocation()) {
    location = u.normalizeURL(location)
    adoptedBases.set(location, true)
  }

  function restoreCurrentHistoryEntry() {
    // Nothing was changed yet

    let location = currentLocation()

    // This cannot be a guardEvent, as in one branch we only peel() and don't render().
    if (up.emit('up:location:restore', { location, log: `Restoring location ${location}` }).defaultPrevented) {
      return
    }

    let targetLayerProfiles = history.state.up?.layerProfiles
    let unrestoredLayerProfiles = currentLayerProfiles()

    if (!targetLayerProfiles || !config.preserveLayers) {
      // Someone messed with our state for an adopted location.
      return resetLocation(location)
    }

    // Compare { uid } as the { location } may have changed since the entry was pushed
    let unrestoredLayerUIDs = u.map(unrestoredLayerProfiles, 'uid')
    let targetLayerUIDs = u.map(targetLayerProfiles, 'uid')
    let samePrefix = u.isEqual(targetLayerUIDs, unrestoredLayerUIDs.slice(0, targetLayerUIDs.length))

    if (samePrefix) {
      let frontTargetLayerUID = u.last(targetLayerUIDs)
      let targetLayer = up.layer.get(frontTargetLayerUID)

      if (targetLayer.location === location) {
        targetLayer.peel({ history: false })
      } else {
        resetLocation(location, targetLayer)
      }
    } else {
      // The target layer is no longer in the stack. We would need to re-open a layer.
      return resetLocation(location)
    }
  }

  function resetLocation(location, layer = up.layer.root) {
    up.error.muteUncriticalRejection(
      up.render({
        // The browser has already restored the URL, but hasn't changed content
        // four our synthetic history state. We're now fetching the content for the restored URL.
        url: location,
        target: config.restoreTargets,

        // The browser won't let us prevent the state restoration, so we're
        // rendering whatever the server sends us.
        fail: false,

        // Restore title and meta tags.
        history: true,
        // The browser has already restored the earlier location.
        // We don't want to push another history entry.
        location: false,

        // Don't replace elements in a modal that might still be open
        // We will close all overlays and update the root layer.
        peel: true,
        layer,

        // We won't usually have a cache hit for config.restoreTargets ('body')
        // since most earlier cache entries are for a main target. But it doesn't hurt to try.
        cache: 'auto',
        revalidate: 'auto',

        // We already saved view state in reactToChange()
        saveScroll: false,
        scroll: ['restore', 'auto'],
        saveFocus: false,
        focus: ['restore', 'auto'],
      })
    )
  }

  /*-
  This event is emitted when the user is [restoring a previous history entry](/restoring-history),
  usually by pressing the back button.

  Listeners may prevent `up:location:restore` or mutate `event.renderOptions`
  to [customize the restoration behavior](/restoring-history#custom-restoration-behavior).

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

  function reactToChange(event) {
    if (event.alreadyHandled) {
      return
    }

    if (!event.willHandle) {
      up.puts('up.history', 'Ignoring history entry owned by foreign script')
      return
    }

    up.viewport.saveFocus({ location: event.previousLocation })
    up.viewport.saveScroll({ location: event.previousLocation })

    if (event.reason === 'pop') {
      restoreCurrentHistoryEntry()
    } else if (event.reason === 'hash') {
      // We handle every hashchange, since only we know reveal obstructions.
      up.viewport.revealHash(event.hash, { strong: true })
    }
  }

  function findMetaTags(head = document.head) {
    return head.querySelectorAll(config.selector('metaTagSelectors'))
  }

  /*-
  Configures whether this `<head>` element is updated during [history changes](/updating-history).

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
      adopt()
    }
  }

  // Wait until the framework is booted before we (1) patch window.history
  // and (2) replace the current history state.
  up.on('up:framework:boot', function() {
    trackCurrentLocation({ reason: null, alreadyHandled: true }) // no event is emitted while booting
    patchHistoryAPI()
    adoptInitialHistoryEntry()
  })

  // Honor obstructions when the initial URL contains a #hash.
  up.on('DOMContentLoaded', function() {
    // (1) When reloading, Chrome's default scrolling behavior
    //     happens *before* DOMContentLoaded. We fix that as soon as possible.
    // (2) When following a link to another URL with a #hash URL, Chrome's default
    //     scrolling behavior happens *after* DOMContentLoaded. We wait one more task to
    //     fix the scroll position after the browser did its thing.
    up.viewport.revealHash({ strong: true })

    u.task(up.viewport.revealHash)
  })

  up.on(window, 'hashchange, popstate', () => {
    // We do not detect the reason here because we're in a state where
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
        pushAdoptedEntry(newHREF, { reason: 'hash', alreadyHandled: true })
      }

      revealFn()
    } else {
      // (1) At this point revealHash() could not find a matching fragment.
      //     The hash also isn't '#top', which would also have been handled by revealHash().
      // (2) We might be looking at a <a href="#"> that wants to be handled be a script
      //     that is called after this click listener.
    }
  }

  // TODO: Support [up-scroll-behavior]
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
    push: pushAdoptedEntry,
    replace: replaceWithAdoptedEntry,
    get location() { return currentLocation() },
    get previousLocation() { return previousLocation },
    isLocation,
    findMetaTags,
    updateMetaTags,
    getLang,
    updateLang,
  }
})()
