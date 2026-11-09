import { isArray, isBlank, isList, isObject, isString, matchURLs, normalizeURL, pick } from './util.js'
import { getRoot, setAttrPresence, setMissingAttrs } from './element.js'
import { muteUncriticalRejection } from './error.js'
import { build, emit, halt, isModified, on } from './event.js'
import { render } from './fragment.js'
import { layerStack } from './layer.js'
import { makeFollowable } from './link.js'
import { printToStandard, printUserEvent } from './log.js'
import { mockable } from './mockable.js'
import { initialRequestMethod } from './protocol.js'
import { registerMacro } from './script.js'
import { Config } from './util/config.js'
import type { ConfigWith } from './util/config.js'
import { FIFOCache } from './util/fifo_cache.js'
import { revealHash, revealHashFn, saveFocus, saveScroll } from './viewport.js'
import type { NormalizeURLOptions, PlainObject } from './util.js'
import type { RenderOptions } from './fragment/render/render_options.js'
import type { ClickEvent } from './link.js'

/**
Why the location changed. `'detect'` is only used internally: we tell `'hash'` from `'pop'` later.
*/
export type LocationChangeReason = 'push' | 'replace' | 'pop' | 'hash' | 'detect' | null

/**
What Unpoly can update in the browser history. See `up.history.config.enabled`.
*/
export type HistoryAspect = 'location' | 'title' | 'metaTags' | 'lang'

/**
How to report the next location change. See `up:location:changed`.
@internal
*/
export interface HistoryTrackOptions {
  reason?: LocationChangeReason
  // The change was made by Unpoly, which has already updated the page.
  alreadyHandled?: boolean
  // Ignore the next location change.
  pauseTracking?: boolean
}

/**
The `up:location:changed` event.
*/
export type LocationChangedEvent = Event & {
  reason: LocationChangeReason
  location: string
  previousLocation: string | undefined
  alreadyHandled: boolean
  willHandle: boolean
}

/**
The `up:location:restore` event.
*/
export type LocationRestoreEvent = Event & {
  location: string
  renderOptions: RenderOptions
}

/*-
Features to update the browser history and handle the Back button.

`up.history.location` is the current URL as Unpoly sees it, and `up:location:changed` is emitted whenever it changes, for example to track page views. When the user goes back, `up:location:restore` is emitted before Unpoly fetches the restored URL and renders it; listeners can prevent this to handle restoration themselves. An `[up-back]` link points to the previous URL. To change history from your own code, call `up.history.push()` or `up.history.replace()`.

@learn-ref history

@namespace up.history
*/


/**
The settings in `up.history.config`, described in its doc comment.
*/
export interface HistoryConfig {
  enabled: boolean | HistoryAspect[]
  restoreTargets: string[]
  metaTagSelectors: string[]
  noMetaTagSelectors: string[]
}

/*-
Configures behavior when the user goes back or forward in browser history.

@property up.history.config
@section History
  @param {Array} [config.restoreTargets=['body']]
    A list of possible CSS selectors to [replace](/api/up.render)
    when the user [goes back or forward in history](/learn/restoring-history).

    If more than one target is configured, the first selector matching both
    the current page and server response will be updated.

    If nothing is configured, the `<body>` element will be replaced.
  @param {boolean|Array<string>} [config.enabled=true]
    Configures which aspects of history [fragment updates](/api/up.render) can [update](/learn/updating-history).

    If set to `true`, Unpoly may change the browser URL, the window title,
    [meta tags](/learn/updating-history#history-state) and the `<html>` element's `[lang]` attribute.

    If set to `false`, Unpoly will never change any of these.

    To only update some aspects, set an array of the aspects Unpoly may update:

    | Aspect       | Updates |
    |--------------|---------|
    | `'location'` | The browser URL and history entries. |
    | `'title'`    | The window title. |
    | `'metaTags'` | [Meta tags](/api/up-meta) in the `<head>`. |
    | `'lang'`     | The `<html>` element's `[lang]` attribute. |

    For example, this configuration never changes the browser URL, but still updates the `[lang]` attribute
    when the user switches to another language:

    ```js
    up.history.config.enabled = ['lang']
    ```

    An empty array has the same effect as `false`.

    Render options can only narrow this setting, never update an aspect that it excludes.
    An overlay without [visible history](/learn/history-in-overlays) never updates history, regardless of this setting.

    See [Turning off history aspects](/learn/updating-history#disabling) for the consequences of excluding an aspect.

@section Meta tags
  @param {boolean} [config.updateMetaTags]
    Configures whether [history changes](/learn/updating-history) update
    [meta tags](/learn/updating-history#history-state) in addition
    to the document's title and URL.

    @deprecated
      Omit `'metaTags'` from an array of aspects in `up.history.config.enabled` instead.

  @param {Array<string>} [config.metaTagSelectors]
    An array of CSS selectors matching default [meta tags](/api/up-meta)
    that are updated during [history changes](/learn/updating-history).

    By default, the following elements are matched:

    - All `meta` elements
    - A `link[rel="alternate"]` element
    - A `link[rel="canonical"]` element
    - A `link[rel="icon"]` element
    - [JSON-LD](https://json-ld.org/) annotations

    You can [include additional elements](/api/up-meta#including-meta-tags) by assigning an `[up-meta]` attribute
    or by pushing their selector into this configuration array.

    Only elements in the `<head>` can be matched. Elements in the `<body>` are never considered,
    even if they match one of the configured selectors.

  @param {Array<string>} [config.noMetaTagSelectors]
    Exceptions to `up.history.config.metaTagSelectors`.

    Matching elements will *not* be considered [meta tags](/api/up-meta)
    even if they match `up.history.config.metaTagSelectors`.

@stable
*/
export const config = new Config('up.history.config', (): HistoryConfig => ({
  enabled: true,
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
})) as ConfigWith<HistoryConfig>

/*-
Returns a normalized URL for the previous history entry.

If no previous history entry is known, returns `undefined`.

@property up.history.previousLocation
@param {string} previousLocation
@stable
*/
export let previousLocation: string | undefined
let nextPreviousLocation: string | undefined
let nextTrackOptions: HistoryTrackOptions | undefined
let adoptedBases = new FIFOCache<string, boolean>({ capacity: 100, normalizeKey: getBase })

function reset(): void {
  previousLocation = undefined
  nextPreviousLocation = undefined
  nextTrackOptions = undefined
  adoptedBases.clear()
  trackCurrentLocation({ reason: null, alreadyHandled: true })
  adoptBase() // make sure we will process the current history entry
}

// Values we want to keep:
// - false (no update)
// - string (forced update)
// - list of elements (forced update of meta tags)
// Values we want to override:
// - true (do update with defaults)
export function refineOption(existingValue: any, newValue: any): any {
  if ((existingValue === false) || isString(existingValue) || isList(existingValue)) {
    return existingValue
  } else {
    return newValue
  }
}

/*-
Returns whether `up.history.config.enabled` allows Unpoly to update the given aspect of history.

@function up.history.isEnabled
@param {string} aspect
  One of `'location'`, `'title'`, `'metaTags'` or `'lang'`.
@return {boolean}
@internal
*/
export function isHistoryEnabled(aspect: HistoryAspect): boolean {
  let { enabled } = config
  return isArray(enabled) ? enabled.includes(aspect) : !!enabled
}

/*-
Returns whether this browser supports manipulation of the current URL
via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

When `pushState` is not supported (e.g. through [`up.follow()`](/api/up.follow)), Unpoly will gracefully
fall back to a full page load.

> [NOTE]
> Unpoly will not use `pushState` if the initial page was loaded with a request method other than GET.

@function up.browser.canPushState
@return {boolean}
@internal
*/
export const canPushState = mockable(function canPushState(): boolean {
  // We cannot use pushState if the initial request method is a POST for two reasons:
  //
  // 1. Unpoly replaces the initial state so it can handle the pop event when the
  //    user goes back to the initial URL later. If the initial request was a POST,
  //    Unpoly will wrongly assume that it can restore the state by reloading with GET.
  //
  // 2. Some browsers have a bug where the initial request method is used for all
  //    subsequently pushed states. That means if the user reloads the page on a later
  //    GET state, the browser will wrongly attempt a POST request.
  //    This issue affects Safari 9 and 10 (last tested in 2017-08).
  //    Modern Firefoxes, Chromes and IE10+ don't have this behavior.
  //
  // The way that we work around this is that we don't support pushState if the
  // initial request method was anything other than GET (but allow the rest of the
  // Unpoly framework to work). This way Unpoly will fall back to full page loads until
  // the framework was booted from a GET request.
  return initialRequestMethod() === 'GET'
})

export function historyOptions(options: PlainObject): PlainObject {
  return pick(options, [
    'location',
    'title',
    'metaTags',
    'lang'
  ])
}

/*-
Returns a normalized URL for the current browser location.

The returned URL is an absolute pathname like `"/path"` without a hostname or port.
It will include a `#hash` fragment and query string, if present.

> [NOTE]
> If the current [layer](/api/up.layer) does not have [visible history](/api/up.Layer.prototype.history),
> the browser's address bar will show the location of an ancestor layer.
> When `up.history.config.enabled` [turns off](/learn/updating-history#disabling) the `'location'` aspect,
> the address bar keeps its URL while layers render other locations.
> To get the location of the current layer, use `up.layer.location`.

@property up.history.location
@param {string} location
@stable
@signature
*/
export function currentLocation(): string {
  return normalizeURL(location.href)
}

function withTrackOptions(trackOptions: HistoryTrackOptions | undefined, fn: () => void): void {
  try {
    nextTrackOptions = trackOptions
    fn()
  } finally {
    nextTrackOptions = undefined
  }
}

/*-
Remembers the current URL so we can use `previousLocation` on pop.

@function trackCurrentLocation
@internal
*/
function trackCurrentLocation(trackOptions: HistoryTrackOptions): void {
  let { reason, alreadyHandled, pauseTracking } = nextTrackOptions || trackOptions
  if (pauseTracking) return

  // The currentLocation() function normalizes
  let location = currentLocation()

  if (isAdoptedState()) {
    // The user might have refreshed the page, making us lose adoptedBases.
    // However, we can still recognize the { up: true } marker from history.state.
    adoptBase(location)
  } else if (isAdoptedBase(location)) {
    // When the user navigates from an adopted base to a #hash, the browser pushes a history
    // entry with an empty state. We must mark that entry with an { up: true } state
    // so we can recognize it when the user reloads the page.
    adoptState()
  }

  if (nextPreviousLocation !== location) {
    previousLocation = nextPreviousLocation
    nextPreviousLocation = location

    if (reason === 'detect') {
      reason = (getBase(location) === getBase(previousLocation)) ? 'hash' : 'pop'
    }

    let willHandle = !alreadyHandled && isAdoptedBase(location)

    let locationChangedEvent = build('up:location:changed', {
      reason,
      location,
      previousLocation,
      alreadyHandled,
      willHandle,
      log: `New location is ${location}`
    }) as LocationChangedEvent

    up.migrate.prepareLocationChangedEvent?.(locationChangedEvent)

    if (reason) {
      emit(locationChangedEvent)
      reactToChange(locationChangedEvent)
    }
  }
}

/*-
This event is [emitted](/api/up.emit) after the browser's address bar has been updated with a new URL.

There may be several reasons why the browser location was changed:

- A fragment update changes history through [navigation](/learn/navigation-defaults) or rendering with `{ history: true }`.
- The user uses the back or forward buttons in their browser UI.
- Programmatic calls to functions like `up.history.push()` or `history.pushState()`.
- The user navigates to a different `#hash` within the page.

The `up:location:changed` event is *not* emitted when the page is loaded initially.
For this, observe `up:framework:booted`.

@learn-ref updating-history#observing

## Handling the change {#handling}

This event cannot be prevented, but you can mutate the `event.willHandle` property to decide whether
Unpoly should handle the change by restoring a location or revealing a fragment matching the location `#hash`.

## Location changes in overlays {#overlays}

Overlays can configure whether their history state is reflected in the browser's address bar.

When a [layer](/api/up.layer) has no [visible history](/api/up.Layer.prototype.history), no `up:location:changed` event will be emitted.
However, an `up:layer:location:changed` will be emitted even if the address bar did not change.

Also see [History in overlays](/learn/history-in-overlays).

@event up:location:changed
@section Change
  @param {string} event.location
    The new URL after the change.

    When this event is emitted, the [browser location](/api/up.history.location) has already been updated.
  @param {string} event.previousLocation
    The URL before the change.

    @experimental
  @param {string} event.reason
    The action that caused this change in history state.

    The value of this property is one of the following:

    | Value | Reason |
    |-------|--------|
    | `'hash'`    | The location was changed, but only the `#hash` changed from the [previous location](/api/up.history.previousLocation). |
    | `'push'`    | A new history entry was added via `up.history.push()` or `history.pushState()`.                |
    | `'replace'` | The current history entry was replaced via `up.history.replace()` or `history.replaceState()`. |
    | `'pop'`     | The user navigated back to the current location. |
@section Handling
  @param {boolean} event.alreadyHandled
    Whether Unpoly thinks this change has already been handled and requires no additional processing.

    For example, updating history by [navigating](/learn/navigation-defaults) or calling `history.pushState()` is
    considered to be already handled.

    @experimental
  @param {boolean} event.willHandle
    Whether Unpoly will handle this change.

    By default Unpoly handles changes to [owned locations](/learn/restoring-history#handled-entries)
    when the change has not [already been handled](#event.alreadyHandled).

    Listeners can tell Unpoly to *not* handle a change by setting `event.willHandle = false`.
    You can then handle the change with your own code.

    Listeners can tell Unpoly to handle a change it does not own by setting `event.willHandle = true`.
    Regardless of this, Unpoly will never handle a change that has [already been handled](#event.alreadyHandled).

    @experimental
@stable
@signature
*/

function splitLocation(location: string | undefined): string[] {
  return location?.split(/(?=#)/) || []
}

function getBase(location: string | undefined): string | undefined {
  return splitLocation(location)[0]
}

/*-
Returns whether the given URL matches the [current browser location](/api/up.history.location).

### Examples

```js
location.pathname // => '/path'

up.history.isLocation('/path') // result: true
up.history.isLocation('/other') // result: false
```

By default, a trailing `#hash` and a `?query` string are considered for the comparison.
To ignore the `#hash`, pass `{ hash: false }`:

```js
location.pathname // => '/path'

up.history.isLocation('/path#hash') // result: false
up.history.isLocation('/path#hash', { hash: false }) // result: true
up.history.isLocation('/path?query') // result: false
```

The given URL is [normalized](/api/up.util.normalizeURL), so any URL string pointing to the browser location
will match:

```js
location.hostname // result: 'current-host'
location.pathname // => '/foo'

up.history.isLocation('/foo') // result: true
up.history.isLocation('http://current-host/foo') // result: true
up.history.isLocation('http://other-host/foo') // result: false
```

@function up.history.isLocation
@param {string} url
  The URL to compare against the current browser location.

  This can be either an absolute pathname (`/path`), a relative filename (`index.html`), or a fully qualified URL (`https://...`).
@param {boolean} [options.hash=true]
  Whether to consider `#hash` fragments in the given or current URLs.

  When set to `false`, this function will consider the URLs `/foo#one` and `/foo#two` to be equal.
@return {boolean}
  Whether the browser is currently at the given location.
@stable
*/
export function isLocation(url: string, options?: NormalizeURLOptions): boolean {
  return matchURLs(url, location.href, { hash: true, ...options })
}

/*-
Replaces the current history entry and updates the browser's location bar.

## Restoration

The replaced history entry will be owned by Unpoly.
When the user navigates back to this history entry,
Unpoly will [restore the content](/learn/restoring-history) at that URL.

To replace a history entry that you want to restore yourself, use the browser's
[`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState) function
or handle the `up:location:changed` event.

## When history is turned off

This function does nothing when `up.history.config.enabled` excludes the `'location'` aspect.
See [Turning off history aspects](/learn/updating-history#disabling).

@function up.history.replace
@param {string} url
@experimental
*/
export function replace(location: string, trackOptions?: HistoryTrackOptions): void {
  placeAdoptedHistoryEntry('replaceState', location, trackOptions)
}

/*-
Adds a new history entry and updates the browser's address bar.

Does not add a history entry if the given URL is already the current browser location.
If the URL did change, an `up:location:changed` event is emitted.

When [navigating](/learn/navigation-defaults) (or rendering with [`{ history: true }`](/api/up.render#options.history)),
Unpoly will update the browser location for you. You only need to call `up.history.push()` to push
a new entry without rendering.

## Restoration

The new history entry will be owned by Unpoly.
When the user navigates back to this history entry,
Unpoly will [restore the content](/learn/restoring-history) at that URL.

To push a history entry that you want to restore yourself, use the browser's
[`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) function
or handle the `up:location:changed` event.

## When history is turned off

This function does nothing when `up.history.config.enabled` excludes the `'location'` aspect.
See [Turning off history aspects](/learn/updating-history#disabling).

@function up.history.push
@param {string} url
  The URL for the history entry to be added.
@experimental
*/
export function push(location: string, trackOptions?: HistoryTrackOptions): void {
  if (isLocation(location)) return
  placeAdoptedHistoryEntry('pushState', location, trackOptions)
}

function placeAdoptedHistoryEntry(method: 'pushState' | 'replaceState', location: string, trackOptions?: HistoryTrackOptions): void {
  // When up.history.config.enabled excludes 'location', we do nothing.
  // We don't adopt a URL that we never pushed.
  if (isHistoryEnabled('location')) {
    adoptBase(location)

    withTrackOptions(trackOptions, function() {
      // Call this instead of originalPushState in case someone else has patched history.pushState()
      // Our own tests do this to rate-limit the use of the history API.
      history[method]({ up: true }, '', location)
    })
  }
}

function isAdoptedBase(location: string): boolean {
  // We handle bases (path + query string) that were pushed or replaced via up.history methods.
  // All other bases we assume are pushed by external JS that wants to handle restoration itself.
  return !!adoptedBases.get(location)
}

function adoptBase(location: string = currentLocation()): void {
  location = normalizeURL(location)
  adoptedBases.set(location, true)
}

function isAdoptedState(): boolean {
  return history.state?.up
}

function adoptState(): void {
  let { state } = history

  // If we already have history.state.up, don't waste another replaceState() call.
  // We're on a throttling quota after all.
  if (isAdoptedState()) return

  // Add our { up } key to "don't care" states like "", null or {}, but not
  // to other values.
  if (isBlank(state) || isObject(state)) {
    withTrackOptions({ pauseTracking: true }, function() {
      history.replaceState({ ...state, up: true }, '')
    })
  }
}

function restoreLocation(location: string): void {

  // An up.Offline error (the server could not be reached) is critical and surfaces as an
  // unhandled rejection, while the page keeps its content. This is intentional: losing the
  // connection while restoring is worth reporting, unlike an error status, which we render.
  muteUncriticalRejection(render({
    guardEvent: build('up:location:restore', { location, log: `Restoring location ${location}` }),

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

function reactToChange(event: LocationChangedEvent): void {
  if (event.alreadyHandled) {
    return
  }

  if (!event.willHandle) {
    printToStandard('up.history', 'Ignoring history entry owned by foreign script')
    return
  }

  if (event.reason === 'pop') {
    saveFocus({ location: event.previousLocation })
    saveScroll({ location: event.previousLocation })
    restoreLocation(event.location)
  } else if (event.reason === 'hash') {
    // We handle every hashchange, since only we know reveal obstructions.
    revealHash(location.hash, { strong: true })
  }
}


/*-
This event is emitted when the user is [restoring a previous history entry](/learn/restoring-history),
usually by pressing the back button.

Listeners may prevent `up:location:restore` or mutate `event.renderOptions`
to [customize the restoration behavior](/learn/restoring-history#custom-behavior).

When this event is emitted, the [browser location](/api/up.history.location) has already been updated.

@learn-ref restoring-history

@event up:location:restore
@param {string} event.location
  The URL for the restored history entry.
@param {Object} event.renderOptions
  An object with [render options](/api/up.render#parameters) for the render pass
  that will restore content for this history entry.

  Listeners may inspect and modify these options.
  Modifying render options cannot stop the browser from restoring the URL in the address bar.
@param event.preventDefault()
  Prevents Unpoly from restoring content for this history entry.

  Preventing the event will *not* stop the browser from restoring the URL in the address bar.
@stable
*/

export function findMetaTags(head: ParentNode = document.head): NodeListOf<Element> {
  return head.querySelectorAll(config.selector('metaTagSelectors'))
}

/*-
Configures whether this `<head>` element is updated during [history changes](/learn/updating-history).

@learn-ref updating-history

### Default meta elements

By [default](/api/up.history.config#config.metaTagSelectors), popular `<meta>` and certain `<link>`
elements in the `<head>` are considered meta tags.
They will be updated when history is changed, in addition to the document's title and URL.

```html
<link rel="canonical" href="https://example.com/dresses/green-dresses"> <!-- mark-line -->
<meta name="description" content="About the AcmeCorp team"> <!-- mark-line -->
<meta property="og:image" content="https://app.com/og.jpg"> <!-- mark-line -->
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

To leave a `<head>` element unchanged during history changes, set an `[up-meta=false]` attribute:

```html
<meta charset="utf-8" up-meta="false">
```

To exclude elements by default, configure `up.history.config.noMetaTagSelectors`.

@selector [up-meta]
@stable
*/

export function updateMetaTags(newMetaTags: Iterable<Element>): void {
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

export function getLang(doc: Document = document): string | undefined {
  // return e.attr(doc.documentElement, 'lang')
  let { documentElement } = doc
  if (documentElement.matches('html')) {
    return doc.documentElement.lang
  }
}

export function updateLang(newLang: string | undefined): void {
  setAttrPresence(getRoot(), 'lang', newLang, !!newLang)
}

function patchHistoryAPI(): void {
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

function adoptInitialHistoryEntry(): void {
  // Unpoly replaces the initial page state so it can later restore it when the user
  // goes back to that initial URL. However, if the initial request was a POST,
  // Unpoly will wrongly assume that it can restore the state by reloading with GET.
  if (initialRequestMethod() === 'GET') {
    // Replace the vanilla state of the initial page load with an Unpoly-enabled state
    adoptState()

    // Adopt all #hash navigations to the same URL.
    adoptBase()
  }
}


function onJumpLinkClicked(event: ClickEvent, link: HTMLAnchorElement): void {
  // If other JavaScript already handled this click, do nothing.
  if (event.defaultPrevented) return

  // Don't handle clicks that would open a new tab.
  if (isModified(event)) return

  let [currentBase, currentHash] = splitLocation(layerStack.current.location)
  let [linkBase, linkHash] = splitLocation(normalizeURL(link))
  let verbatimHREF = link.getAttribute('href')

  // (1) If we're not scrolling the page, we must leave the event unprevented
  //     and allow the link to be followed, or handled by other JavaScript.
  // (2) currentBase may be undefined if we're on a layer that was opened from a string.
  let isJumpLink = (currentBase === linkBase) || verbatimHREF.startsWith('#')
  if (!isJumpLink) return

  // By default we will honor a { scroll-behavior } style from CSS.
  // This can be overridden by an [up-scroll-behavior] attribute.
  // Like the attribute for render options, its value is passed on unchecked.
  let behavior = (link.getAttribute('up-scroll-behavior') ?? 'auto') as ScrollBehavior

  // (1) Check if we recognize the link hash, because it matches a fragment or
  //     a well-known anchor like "#top".
  // (2) Scroll with { behavior: 'auto' } (instead of thew default { behavior: 'instant' }
  //     so it picks up any scroll-behavior CSS rule on the viewport element.
  let layer = layerStack.get(link)
  let revealFn = revealHashFn(linkHash, { layer, behavior, focus: true })

  if (revealFn) {
    // (1) Prevent the browser, Unpoly or other JavaScript from following the link.
    // (2) This means we will be responsible to change the hash in the address bar.
    halt(event)

    printUserEvent(event)

    // (1) Because we prevented the event, it is up to us to change the hash.
    // (2) We should not set the location if the layer shows no live location.
    if (linkHash !== currentHash && layer.showsLiveHistory('location')) {
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


/*-
Changes the link's destination so it points to the previous URL.

If no previous URL is known, the link will not be changed.

> [NOTE]
> Clicking an `[up-back]` link will *not* call [`history.back()`](https://developer.mozilla.org/en-US/docs/Web/API/History/back).
> Instead, the link will [navigate](/api/up.navigate) to the previous URL.

### Example

This link …

```html
<a href="/default" up-back>
  Go back
</a>
```

… will be transformed to:

```html
<a href="/default" up-follow up-href="/previous-page" up-scroll="restore">
  Go back
</a>
```

@learn-ref restoring-history#back-link

@selector [up-back]
@stable
@signature
*/

export function install(): void {
  // Wait until the framework is booted before we (1) patch window.history
  // and (2) replace the current history state.
  on('up:framework:boot', function({ mode }) {
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
      revealHash(location.hash, { strong: true, focus: true })
    }
  })

  on(window, 'hashchange, popstate', () => {
    // We do not detect the reason here because we're in  a state where
    // location and previousLocation are the same. This will be fixed by trackCurrentLocation().
    trackCurrentLocation({ reason: 'detect', alreadyHandled: false })
  })

  on('up:click', 'a[href*="#"]', onJumpLinkClicked)

  registerMacro('[up-back]', function(link) {
    if (previousLocation) {
      setMissingAttrs(link, {
        'up-href': previousLocation,
        'up-scroll': 'restore'
      })
      link.removeAttribute('up-back')
      makeFollowable(link)
    }
  })

  on('up:framework:reset', reset)
}

export const api = {
  history: {
    config,
    push,
    replace,
    get location() { return currentLocation() },
    get previousLocation() { return previousLocation },
    isLocation,
  },
}
