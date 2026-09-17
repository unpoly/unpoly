2.7.2
-----

This is a maintenance release to bridge the time until [Unpoly 3](https://github.com/unpoly/unpoly/discussions/407) is completed. This release includes the following changes:

- When pushing a history state, don't mutate the previous history state.
- Fix a bug where the `[up-animation]` attribute could not be used to control a new overlay's opening animation.
- The NPM package is now 800KB smaller.

This is the last release with support for Internet Explorer 11. Future releases will support Chrome, Firefox, Edge and the last two majors of Safari.


2.7.1
-----

This is a maintenance release to bridge the time until [Unpoly 3](https://github.com/unpoly/unpoly/discussions/407) is completed. This release includes the following changes:

- When a fragment is [revealed](/#revealing-the-fragment), [fixed elements](https://unpoly.com/up-fixed-bottom) obstructing the viewport are now ignored while the fixed element is hidden.
- Listeners to `up:request:load` may now access the unopened `XMLHttpRequest` instance through `event.xhr`. This lets you track upload progress through [`event.xhr.upload`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload). (Thanks @iaddict!)
- Listeners to `up:layer:accept` may change the layer's acceptance value by setting or mutating `event.value`. 
- Listeners to `up:layer:dismiss` may change the layer's dismissal value by setting or mutating `event.value`. 
- Fix a bug where right-aligned popups would have right-aligned text
- Fix a bug where clicking links twice will not update location when the browser history API is used in between (#388)


2.6.1
-----

This is a maintenance release including two changes:

- `[up-switch]` and `up.element.hide()` now hides elements using an `[hidden]` attribute instead of setting an inline style. Users can override the CSS for `[hidden]` to hide an element in a different way, e.g. by giving it a zero height.
- Fix a bug where, with a popup overlay already open, the user clicked on a preloaded, popup-opening link in the background layer, the second popup would not open.


2.6.0
-----

This is a final maintenance release before Unpoly's next major feature drop in a few weeks.

### Polling

The [polling](/up-poll) implementation was rewritten to fix many issues and edge cases:

- Fix a bug with `[up-poll]` reloading very fast when the server responds with an [`X-Up-Target: :none`](/X-Up-Target) header (fixes #377).
- Polling fragments now emit an `up:fragment:poll` event before every update. Listeners may prevent this event to skip the update.
- Programmatically starting to poll with `up.radio.startPolling()` no longer requires the server to respond with an `[up-poll]` attribute.
- The function `up.radio.startPolling()` no longer causes duplicate requests when an element is already polling.
- Fix a memory leak where polling elements would sometimes continue to maintain a timer (but not send requests) after they were removed from the DOM.
- The server can now stop a polling element by sending a matching element without an `[up-poll]` attribute.
- The server can now change the polling interval by sending a matching element with a different `[up-interval]` attribute.
- The server can now change the URL from which to poll by sending a matching element with a different `[up-source]` attribute.

### Overlays

- Events for [closing overlays](/closing-overlays) (`up:layer:dismiss`, `up:layer:dismissed`, `up:layer:accept`, `up:layer:accepted`) have gained new useful properties:
  - The `{ value }` property is the [overlay result value](/closing-overlays#result-values).
  - The `{ origin }` property is the element that caused the element to close.
- When an overlay is [closed](/closing-overlays) its [result value](/closing-overlays#result-values) is now [logged](/up.log) for easier debugging.
- Fix many issues where clicking into foreign overlays constructed other libraries would close an underlying Unpoly modal. In many cases this is no longer necessary. There are some remaining cases where Unpoly would steal focus from a foreign overlay. These can be fixed by attaching the foreign overlay to the Unpoly overlay's element. The next Unpoly version will ship a more comprehensive solution for this.
- Published a configuration option `up.layer.config.overlay.class`. It can be used to configure a default HTML class for an overlay's container element.

### Scrolling

- Viewports within a `[up-keep]` fragment now retain their scroll positions during a fragment update.
- The option for [revealing](/up.reveal) a fragment without animation is now `{ behavior: 'instant' }` instead of `{ behavior: 'auto' }`.
- Fix an issue where Unpoly would prevent the browser's restoration of scroll positions when the the page was reloaded (closes #366 #65).

### Various changes

- `up.element.createFromSelector()` and `up.element.affix()` now also accept a `{ style }` option with a string value. It previously only accepted an object of camelCased CSS properties.
- `up.request()` will automatically choose a layer based on a given `{ origin }`.
- Remove duplicate logging of exceptions to the error consoles.
- The experimental function `up.fail()` has been removed from public API.
- Documentation fixes.


2.5.3
-----

This maintenance release contains a single fix:

- Fix a bug where modal overlays would not adjust its height to the height of its content.


2.5.2
-----

This maintenance release contains two fixes:

- Unpoly no longer aborts a smooth scrolling animation when the user scrolls manually while the animation is running.
- Fix a bug where drawer [overlays](/up.layer) would show a small bottom margin that causes unnecessary scrollbars.


2.5.1
-----

This maintenance release contains a single fix:

- Fix a bug where the value was lost when clicking on a descendant element of an `[up-accept]` or `[up-dismiss]` button.


2.5.0
-----

This is a maintenance release while we're working on the next major feature update.

- The event `up:form:submit` has a new property `{ submitButton }`. It points to the `<button>` or `<input>` element used to submit the form, if the form was submitted with a button.
- The event `up:form:submit` has a new property `{ params }`. It points to an editable `up.Params` object for the form's data payload.
- Fix a bug where `[up-validate]` would use form attributes intended for the final form submission, like `[up-scroll]` or `[up-confirm]`.
- Fix a bug where an `.up-current` class would sometimes match an `[up-alias]` pattern in the middle of the current URL. This happened when `[up-alias]` contained multiple patterns and the last pattern is a prefix (e.g. `/foo/*`).
- New option `up.log.config.format` lets you disable colors from log messages (thanks @stefanfisk!).
- Elements with `[up-keep]` are now preserved when going back/forward in history (#293).
- The function `up.element.createFromHTML()` now creates an element if the given HTML string begins with whitespace.
- The function `up.element.createFromHTML()` now throws an error if the given HTML string contains more than one element on the root depth.
- Elements matching `up.link.config.clickableSelectors` now get a `cursor: pointer` style through CSS.
- Published new events to observe [closing overlay](/closing-overlays) (`up:layer:dismiss`, `up:layer:dismissed`, `up:layer:accept`, `up:layer:accepted`). These events were implemented since Unpoly 2.0, but never documented.
- Fix a bug where loading Unpoly would save a key called `"undefined"` to sessionStorage (#300).


2.4.1
-----

- Fix a bug where closing an overlay would render the location URL of a parent layer when the parent layer does not render history.


2.4.0
-----

- New experimental function `up.history.isLocation()`. It returns whether the given URL matches the [current browser location](/up.history.location).
- New experimental function `up.util.normalizeURL()`. It returns a normalized version of the given URL string. Two URLs that point to the same resource should normalize to the same string.
- Fix a bug where an `[up-nav]` link to the root path (`/`) would never receive the `.up-current` class (#280).
- Fix a bug where an `[up-nav]` link would never receive the `.up-current` class if the current URL contains a `#hash` fragment (#284).
- Unpoly now prints a [log entry](/up.log) when a [request](/up.request) or [fragment update](/up.render) with `{ solo: true }` abort all other requests.
- All API functions that work with URL now document how they handle `#hash` fragments.


2.3.0
-----

### More control over loading Unpoly

- Unpoly can now be loaded with `<script defer>`. This can be used to load your scripts without blocking the DOM parser.
- Unpoly can now be loaded with `<script type="module">`. This can be used deliver a modern JS build to modern browsers only.
- Unpoly can now be [booted manually](/up.boot) at a time of your choice. By default Unpoly boots automatically once the initial DOM is parsed.
- Event listeners registered with `up.on()` will no longer be called before Unpoly was [booted](/up.boot). Like with [compilers](/up.compiler), this lets you register behavior that is only active on [supported browsers](/up.framework.isSupported).
- Unpoly no longer boots on Edge 18 or lower. Edge 18 was the last version of Edge to use Microsoft's custom rendering engine. Later versions use Chromium.


### Compatibility with strict Content Security Policies (CSP)

When your [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) disallows `eval()`, Unpoly cannot directly run JavaScript code in HTML attributes. This affects `[up-on-...]` attributes like [`[up-on-loaded]`](/up-follow#up-on-loaded) or [`[up-on-accepted]`](/up-layer-new#up-on-accepted).

Unpoly 2.3 lets your work around this by prefixing your callback with a [CSP nonce](https://content-security-policy.com/nonce/):

```html
<a href="/path" up-follow up-on-loaded="nonce-kO52Iphm8B alert()">Click me</a>
```

Users of the [unpoly-rails](https://github.com/unpoly/unpoly-rails) gem can insert the nonce using the `up.safe_callback` helper:

```erb
<a href="/path" up-follow up-on-loaded="<%= up.safe_callback('alert()') %>">Click me</a>
```

### New options for existing features

- `[up-follow]` links may now pass the fragment's new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) using an `[up-content]` attribute. To pass the outer HTML, use the `[up-fragment]` attribute.
- New option `{ solo }` for `up.render()` and `up.request()` lets you quickly abort all previous requests before making the new request. This is a default [navigation option](/navigation).
- New attribute `[up-solo]` for `[up-follow]` lets you quickly abort all previous requests before making the new request. This is a default [navigation option](/navigation).
- The `{ clearCache }` option for `up.render()` and `up.request()` now accepts a boolean value, a [URL pattern](/url-patterns) or a function.


### New properties for request-related events

Request-related events now expose additional context about the event. This affects the events `up:fragment:loaded`, `up:request:load`, `up:request:loaded`, `up:request:aborted`, `up:request:fatal`.

The link or form element that caused the request can now be access through `event.origin`.

The layer associated with the request can now be accessed through `event.layer`. If the request is intended to update an existing fragment, this is that fragment's layer. If the request is intended to [open an overlay](/opening-overlays), the associated layer is the future overlay's parent layer.


### Various changes

- Fix a bug with `[up-back]` where Unpoly would follow the link's default `[href]` instead of visiting the previous URL.
- Fix a bug where the [URL pattern](/url-patterns) `*` would not match most URLs when the current location is multiple directories deep.
- When a target cannot be found and a fallback target is used, Unpoly now [logs](/up.log) a message.
- When a [compiler](/up.compiler) is registered after [booting](/up.boot), Unpoly now explains in the log that the compiler will only run for fragments inserted in the future.
- `up.observe()` and `input[up-observe]` now [log](/up.log) a warning when trying to observe a field without a `[name]` attribute.
- `up.browser.loadPage()` has been renamed to `up.network.loadPage()`.
- `up.browser.isSupported()` has been renamed to `up.framework.isSupported()`.


2.2.1
-----

- Cleaned up build files with [eslint](https://eslint.org/).
- Fix [progress bar](https://unpoly.com/up.network.config#config.progressBar) no longer progressing after 80%.
- Fix deprecated function `up.util.any()` not being forwarded to `up.util.some()` with `unpoly-migrate.js`.


2.2.0
-----

### Reduced file size

The size of [`unpoly.js`](https://unpoly.com/install) has been reduced significantly. It now weighs 41.6 KB (minified and gzipped).

To achieve this `unpoly.js` is now compiled with modern JavaScript syntax that works across all modern browsers (Chrome, Firefox, Edge, Safari, Mobile Chrome, Mobile Safari).

### ES5 build for legacy browsers

If you need support for Internet Explorer 11 you can either use a transpiler like [Babel](https://babeljs.io/) **or** use Unpoly's ES5 build. To use the ES5 build, load `unpoly.es5.js` instead of `unpoly.js`. There is also a minified version `unpoly.es5.min.js`.

Like in earlier versions of Unpoly, supporting IE11 requires a polyfill for the `Promise` API. No additional polyfills are required by this version.

### The future of IE11 support

Microsoft is going to retire IE11 in [June 2022](https://blogs.windows.com/windowsexperience/2021/05/19/the-future-of-internet-explorer-on-windows-10-is-in-microsoft-edge/).

After that date Unpoly will remove support for IE11 and no longer provide ES5 builds. It may be possible to keep supporting IE11 through polyfills and transpilation, but the Unpoly maintainers will no longer support or test with IE11.

This step will allow Unpoly to use modern web APIs and reduce its bundle size even further.

### Other changes

- When going back in history, Unpoly reloads the `<body>` instead of the `:main` element. You can customize this behavior in `up.history.config.restoreTargets`.
- The function `up.util.times()` has been deprecated. Use a classic [`for`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for) statement instead.
- The function `up.Params.wrap()` has been removed without replacement.
- Unpoly no longer loads when the browser is in quirks mode.
- When Unpoly cannot load, it prints a reason to the error log.


2.1.0
-----

- Unpoly now shows a [progress bar](/up.network.config#config.progressBar) that appears for [late requests](/up:request:late).
  The progress bar is enabled by default. If you're using [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading), the progress bar is disabled if you have an `up:request:late` listener, assuming that you have built a custom loading indicator.
- For new layers, the `[up-history-visible]` and `[up-history]` options have been unified into a single `[up-history]` option. This reverts to the old behavior of Unpoly 1.0. The separation into two options was introduced in Unpoly 2.0, but turned out to be confusing to users.
- [Layer configuration](/up.layer.config) may now set mode-specific defaults for [`{ scroll }`](/scrolling) and [`{ focus }`](/focus). These take precendence to defaults in [`up.fragment.config.navigateOptions`](/up.fragment.config#config.navigateOptions).
- Links with an `[up-instant]` attribute are now followed automatically, even if they don't also have an [`[up-follow]`](/up-follow) attribute.


2.0.1
-----

This bugfix release addresses some issues user reported when upgrading to Unpoly 2:

- Fix a bug where [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading) would crash when loaded.
- Fix a bug where transitions would crash when some { scroll } options were also used (#187)
- Users can now now change the spacing between a popup overlay and the opening link by giving `<up-popup>` a CSS margin.


2.0.0
-----

Unpoly 2 ships with many new features and API improvements, unlocking many use cases that were not possible with Unpoly 1.

For an in-depth guide to all changes, see our [Unpoly 2 presentation](http://triskweline.de/unpoly2-slides/) (150 slides).

If you're upgrading from an older Unpoly version you should load [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading) to enable deprecated APIs. Also see below for an [overview of breaking changes](#overview-of-breaking-changes).

### Change overview

#### Less need for boilerplate configuration

- Fragment links often replace the primary content element of your application layout. For this purpose you can now define [default targets](/up-main) that are automatically updated when no target selector is given.
- Unpoly can be configured to [handle all links and forms](/handling-everything), without any `[up-...]` attributes.
- We have examined many real-world Unpoly apps for repetitive configuration and made these options the new default.

#### New Layer API

- A new [layer API](/up.layer) replaces modals and popups.
- Layers can be stacked infinitely.
- Layers are fully isolated, meaning a screen in one layer will not accidentally see elements or events from another layer. For instance, [fragment links](/up.link) will only update elements from the [current layer](/up.layer.current) unless you [explicitly target another layer](/layer-option).
- A variety of [overlay modes](/layer-terminology) are supported, such as modal dialogs, popup overlays or drawers. You may [customize their appearance and behavior](/customizing-overlays).

#### Subinteractions

- Overlays allow you to break up a complex screen into [subinteractions](/subinteractions).
- Subinteractions take place in overlays and may span one or many pages. The original screen remains open in the background.
- Once the subinteraction is *done*, the overlay is [closed](/closing-overlays) and a result value is communicated back to the parent layer.

#### Navigation intent

- You can now define whether a framgent update constitutes a user navigation. Switching screens needs other defaults than updating a tiny box.
- User navigation aborts earlier requests, fixing race conditions on slow connections.

#### Accessibility

- New overlays are focused automatically and trap focus in a cycle. Closing the overlay re-focuses the link that opened it.
- Focus is automatically managed when rendering major new content. A new [`[up-focus]` attribute](/focus) allows
  you to explicitly move the user's focus as you update fragments.
- Keyboard navigation is supported everywhere.
- Focus, selection and scroll positions are preserved within an updated fragment.

#### Reworked Bootstrap integration

- The Bootstrap integration is now minimal and as unopinionated as possible. Little to no Bootstrap CSS is overridden.
- Bootstrap versions 3, 4 and 5 are now supported.

#### Quality of live improvements

- Unpoly now ships with a bandwidth-friendly [polling implementation](/up-poll) that handles many edge cases.
- The position of a clicked link is considered when deciding which element to replace. If possible, Unpoly will update an selector in the region of the link that triggered the fragment update. This helps with multiple self-contained components (with the same selector) on the same page.
- The [log](/up.log) output is more much more compact and has a calmer formatting.
- New fragments are no longer revealed by default. Instead Unpoly scrolls to the top when the [main target](/up-main) has changed, but does not scroll otherwise.
- History is no longer changed by default. Instead Unpoly updates history only when a [main target](/up-main) has changed.
- All scroll-related options have been unified in a single [`[up-scroll]` attribute](/scrolling).
- Many optimizations have been made to preserve bandwidth on slow connections. For example, Unpoly stops [preloading](/up-preload) and [polling](/up-poll) whenthe connection has high latency or low throughput.
- The client-side cache can be carefully managed by both the client and server.
- Unpoly 1 had many functions for updating fragments (`up.replace()`, `up.extract()`, `up.modal.extract()`, etc.). Unpoly 2 has unified these into a single function `up.render()`.
- Event handlers to `up:link:follow`, `up:form:submit` etc. may change the render options for the coming fragment update.
- Added more options to handle [unexpected server responses](/failed-responses), including the new `up:fragment:loaded` event.

#### Extended server protocol

The optional server protocol has been extended with additional headers that the server may use to interact with the frontend. For example:

- The server may [emit events on the frontend](/X-Up-Events).
- The server may [close overlays](/X-Up-Accept).
- The server may [change the render target](/X-Up-Target) for a fragment update.

See `up.protocol` for a full list of features.

If you are using Ruby on Rails, the new protocol is already implemented by the [`unpoly-rails`](https://rubygems.org/gems/unpoly-rails) gem.

If you are using Elixir / Phoenix, the new protocol is already implemented by the [`ex_unpoly`](https://hex.pm/packages/ex_unpoly) package.


### Overview of breaking changes

Please use [`unpoly-migrate.js`](/changes/upgrading) for a very smooth upgrade process from Unpoly 0.x or 1.x to Unpoly 2.0.

By loading `<code>unpoly-migrate.js</code>`, calls to most old APIs will be forwarded to the new version. A deprecation notice will be logged to your browser console. This way you can upgrade Unpoly, revive your application with a few changes, then replace deprecated API calls under green tests.

There's a short list of changes that we cannot fix with aliases.

#### Overlays (modals, popups) have different HTML

But it's similar. E.g. `<div class="modal">` becomes `<up-modal>`.

#### Unpoly only sees the current layer

You can target other layers with `{ layer: 'any' }`.

#### Async functions no longer wait for animations

You might or might not notice. In cases where you absolutely do need to wait, an `{ onFinished }` callback can be used.

#### Tooltips are no longer built-in

But there are a million better libraries.


### Unpoly 1 maintenance

- With the release of Unpoly we're ending maintenance of Unpoly 1. Expect little to no changes to Unpoly 1 in the future.
- GitHub issues that have been fixed in Unpoly 2 will be closed.
- The documentation for Unpoly 1 has been archived to <https://v1.unpoly.com>.
- The code for Unpoly 1 can be found in the [`1.x-stable`](https://github.com/unpoly/unpoly/tree/1.x-stable) branch.



