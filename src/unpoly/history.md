# up.history

Features to update the browser history and handle the Back button.

`up.history.location` is the current URL as Unpoly sees it, and `up:location:changed` is emitted whenever it changes, for example to track page views. When the user goes back, `up:location:restore` is emitted before Unpoly fetches the restored URL and renders it; listeners can prevent this to handle restoration themselves. An `[up-back]` link points to the previous URL. To change history from your own code, call `up.history.push()` or `up.history.replace()`.

@learn-ref history

@namespace up.history

-----

# up.history.config

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

-----

# up.history.previousLocation

Returns a normalized URL for the previous history entry.

If no previous history entry is known, returns `undefined`.

@property up.history.previousLocation
@param {string} previousLocation
@stable

-----

# up.history.isEnabled()

Returns whether `up.history.config.enabled` allows Unpoly to update the given aspect of history.

@function up.history.isEnabled
@param {string} aspect
  One of `'location'`, `'title'`, `'metaTags'` or `'lang'`.
@return {boolean}
@internal

-----

# up.browser.canPushState()

Returns whether this browser supports manipulation of the current URL
via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

When `pushState` is not supported (e.g. through [`up.follow()`](/api/up.follow)), Unpoly will gracefully
fall back to a full page load.

> [NOTE]
> Unpoly will not use `pushState` if the initial page was loaded with a request method other than GET.

@function up.browser.canPushState
@return {boolean}
@internal

-----

# up.history.location

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

-----

# trackCurrentLocation()

Remembers the current URL so we can use `previousLocation` on pop.

@function trackCurrentLocation
@internal

-----

# up:location:changed

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

-----

# up.history.isLocation()

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

-----

# up.history.replace()

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

-----

# up.history.push()

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

-----

# up:location:restore

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

-----

# [up-meta]

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

-----

# [up-back]

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
