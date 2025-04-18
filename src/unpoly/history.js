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

  Only history entries added by Unpoly functions will be considered.

  @property up.history.previousLocation
  @param {string} previousLocation
  @experimental
  */
  let previousLocation
  let nextPreviousLocation

  function reset() {
    previousLocation = undefined
    nextPreviousLocation = undefined
    trackCurrentLocation()
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

  /*-
  Remembers the current URL so we can use previousURL on pop.

  @function trackCurrentLocation
  @internal
  */
  function trackCurrentLocation() {
    const url = currentLocation()

    if (nextPreviousLocation !== url) {
      previousLocation = nextPreviousLocation
      nextPreviousLocation = url
    }
  }

  trackCurrentLocation()

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

  @function up.history.replace
  @param {string} url
  @internal
  */
  function replace(location, options = {}) {
    location = u.normalizeURL(location)
    if (manipulate('replaceState', location) && (options.event !== false)) {
      emitLocationChanged({ location, reason: 'replace', log: `Replaced state for ${location}` })
    }
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

  @function up.history.push
  @param {string} url
    The URL for the history entry to be added.
  @experimental
  */
  function push(location) {
    location = u.normalizeURL(location)
    if (!isLocation(location) && manipulate('pushState', location)) {
      emitLocationChanged({ location, reason: 'push', log: `Advanced to location ${location}` })
    }
  }

  function emitLocationChanged(props) {
    let event = up.event.build('up:location:changed', props)
    up.migrate?.renamedProperty?.(event, 'url', 'location')
    up.emit(event)
  }

  /*-
  This event is [emitted](/up.emit) after the browser's address bar was updated with a new URL.

  There may be several reasons why the browser location was changed:

  - A fragment update changes history through [navigation](/navigation) or rendering with `{ history: true }`.
  - The user uses the back or forward buttons in their browser UI.
  - Programmatic calls to `up.history.push()`.

  When a [layer](/up.layer) has no [visible history](/up.Layer.prototype.history), following a link
  will not cause the browser's address bar to be updated. In this case no `up:location:changed` event will be emitted.
  However, a `up:layer:location:changed` will be emitted even if the address bar did not change.

  The `up:location:changed` event is *not* emitted when the page is loaded initially.
  For this observe `up:framework:booted`.

  @event up:location:changed
  @param {string} event.location
    The URL for the history entry after the change.
  @param {string} event.reason
    The action that caused this change in [history state](https://developer.mozilla.org/en-US/docs/Web/API/History/state).

    The value of this property is either `'push'`, `'pop'` or `'replace'`.

    @experimental
  @stable
  */

  function manipulate(method, url) {
    if (config.enabled) {
      const state = buildState()
      window.history[method](state, '', url)
      trackCurrentLocation()
      // Signal that manipulation was successful
      return true
    }
  }

  function buildState() {
    return { up: {} }
  }

  function restoreStateOnPop(state) {
    if (!state?.up) {
      up.puts('popstate', 'Ignoring a history state not owned by Unpoly')
      return
    }

    let location = currentLocation()

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

      // We won't usually have a cache hit for config.restoreTargets ('body')
      // since most earlier cache entries are for a main target. But it doesn't hurt to try.
      cache: 'auto',
      revalidate: 'auto',

      // We already saved view state in onPop()
      saveScroll: false,
      scroll: ['restore', 'auto'],
      saveFocus: false,
      focus: ['restore', 'auto'],
    }))
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

  function onPop(event) {
    up.log.putsEvent(event)

    // The earlier URL has now been restored by the browser. This cannot be prevented.
    trackCurrentLocation()
    let location = currentLocation()
    emitLocationChanged({ location, reason: 'pop', log: `Navigated to history entry ${location}` })

    up.viewport.saveFocus({ location: previousLocation })
    up.viewport.saveScroll({ location: previousLocation })

    restoreStateOnPop(event.state)
  }

  function register() {
    window.addEventListener('popstate', onPop)

    // Unpoly replaces the initial page state so it can later restore it when the user
    // goes back to that initial URL. However, if the initial request was a POST,
    // Unpoly will wrongly assume that it can restore the state by reloading with GET.
    if (up.protocol.initialRequestMethod() === 'GET') {
      // Replace the vanilla state of the initial page load with an Unpoly-enabled state
      replace(currentLocation(), { event: false })
    }
  }

  up.on('up:framework:boot', function() {
    if ('jasmine' in window) {
      // Can't delay this in tests.
      register()
    } else {
      // Defeat an unnecessary popstate that some browsers trigger
      // on pageload (Safari, Chrome < 34).
      // We should check in 2023 if we can remove this.
      setTimeout(register, 100)
    }
  })

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
