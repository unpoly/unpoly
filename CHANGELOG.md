Changelog
=========

Changes to this project will be documented in this file.

If you're upgrading from an older Unpoly version you should load [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading) to polyfill deprecated APIs.
Changes handled by `unpoly-migrate.js` are not considered breaking changes.

You may browse a formatted and hyperlinked version of this file at <https://unpoly.com/changes>.


Unreleased
----------

- Use native `:has()` [where available](https://developer.mozilla.org/en-US/docs/Web/CSS/:has).
- Improve performance of element lookups, by handling them via CSS selectors vs. JavaScript.
- Fix a bug where following a navigation item outside a main element would focus the `<body>` instead of the main element.
- Targeting `:main` will no longer match in the region of the interaction origin. It will always use the first matching selector in `up.fragment.config.mainTargets`.
- Fix a bug where pseudo selectors like `:main` or `:layer` could not be used in a compound target, e.g. `:main .child`.
- Fix a bug where `up:assets:changed` would be emitted for every response when configuring `up.fragment.config.runScripts = false`.
- `up.util.contains()` now works on `NodeList` objects.
- `up.form.isSubmittable()` returns `false` for forms with a cross-origin URL in their `[action]` attribute.
- Structured data in script[type="application/ld+json"] is considered meta tags that will be [updated with history changes](/updating-history#history-state).
- Preserve `script[type="application/ld+json"]` in new fragments with `up.fragment.config.runScripts = false`.
- You can now configure which elements are removed by `up.fragment.config.runScripts = false`. Use `up.script.config.scriptSelectors` and `up.script.config.noScriptSelectors`.


3.5.2
-----

Continuing our focus on stability, this release addresses some long-standing issues:

- Fix a bug where `<video>` and `<audio>` elements would render incorrectly in Safari ([#432](https://github.com/unpoly/unpoly/issues/432)).
- Fix a bug where `<script up-keep>` elements would re-run during subsequent render passes.
- Fix a bug where `<script>` elements would not run when [targeted](/targeting-fragments) directly.
- Fix a bug where `<noscript up-keep>` elements would not be persisted during fragment updated.
- Fix a bug where `<noscript>` elements would lose their text content when targeted directly.


3.5.1
-----

This releases fixes two regressions introduced by [3.5.0](https://unpoly.com/changes/3.5.0):

- Fix a bug where a [new overlay](/opening-overlays) would immediately close if the *parent* layer's location
  happened to match the overlay's location-based close condition.
- When a new overlay's initial location matches its [location-based close condition](/closing-overlays#closing-when-a-location-is-reached),
  the overlay again immediately closes without rendering its initial content.


3.5.0
-----

Unpoly 3.5 brings major quality-of-life improvements and addresses numerous edge cases in existing functionality.


### Notification flashes

You can now use an `[up-flashes]` element to render confirmations, alerts or warnings:

![A confirmation flash, an error flash and a warning flash](images/flashes.png){:width='480'}

To render a flash message, include an `[up-flashes]` element in your response.
The element's content should be the messages you want to render:

```html
<div up-flashes>
  <strong>User was updated!</strong> <!-- mark-line -->
</div>

<main>
  Main response content ...
</main>
```

An `[up-flashes]` element comes with useful default behavior for rendering notifications:

- Flashes will always be updated when rendering, even if they aren't targeted directly (like `[up-hungry]`).
- Flashes are kept until new messages are rendered. They will not be cleared by an empty `[up-flashes]` container.
  You can use a compiler to [clear messages after a delay](/flashes#clearing-after-delay). 
- You are free to place the flashes anywhere in your layout, inside or outside the [main](/main) element you're usually updating.
- You can have a single flashes container on your [root layer](/up.layer), or one on each layer.
- When a response [causes an overlay to close](/closing-overlays#close-conditions), the flashes from the discarded response
  will be shown on a parent layer.

See [notification flashes](/flashes) for more details and examples.


### Detection of changed scripts and styles

Unpoly now detects changes in your JavaScripts and stylesheets after deploying a new version of your application.
While rendering new content, Unpoly compares script and style elements in the `<head>` and emits an `up:assets:changed` event if anything changed.

It is up to you to handle new frontend code revisions, e.g. by [loading new assets](/handling-asset-changes#loading-new-assets) or [notifying the user](/handling-asset-changes#notifying-the-user):

![Notification for a new app version](images/assets-changed-notification.png){:width='305'}

See [handling asset changes](/handling-asset-changes) for more details and examples.


### Automatic update of meta tags {#meta-tags}

Render passes that update history [now synchronize meta tags](/updating-history#history-state) in the `<head>`, such as `meta[name=description]` or `link[rel=canonical]`.

In the document below, the highlighted elements will be updated when history is changed, in additional to the location URL:

```html
<head>
  <title>AcmeCorp</title> <!-- mark-line -->
  <link rel="canonical" href="https://example.com/dresses/green-dresses"> <!-- mark-line -->
  <meta name="description" content="About the AcmeCorp team"> <!-- mark-line -->
  <meta prop="og:image" content="https://app.com/og.jpg"> <!-- mark-line -->
  <script src="/assets/app.js"></script>
  <link rel="stylesheet" href="/assets/app.css">  
</head>
```

The linked JavaScript and stylesheet are *not* part of history state and will not be updated.


#### Consistent behavior in overlays

[Overlays with history](/updating-history#overlays) now update meta tags when opening. When the overlay closes the parent layer's meta tags are restored.


#### Deprecating `[up-hungry]` in the `<head>` 

Existing solutions using `[up-hungry]` to update meta tags can be removed from your application code.

Other than `[up-hungry]` the new implementation can deal with meta tags that only exist on some pages.


#### Opting in or out

See `[up-meta]` for ways to include or exclude head elements from synchronization.

You can disable the synchronization of meta tags [globally](/up.history.config#config.updateMetaTags) or [per render pass](/up.render#options.metaTags):

```js
up.render('.element', { url: '/path', history: true, metaTags: false }) // mark-phrase "metaTags"
```



### Forgiving error handling

In earlier versions, errors in user code would often crash Unpoly. This would sometimes leave the page in a corrupted state. For example,
a render pass would only update some fragments, fail to scroll, or fail to run destuctors.

This version changes how Unpoly handles exceptions thrown from user code, like compilers, transition functions or callbacks like `{ onAccepted }`.


#### User errors are no longer thrown

Starting with this version, Unpoly functions generally succeed despite exceptions from user code.

The code below will successfully [compile](/up.hello) an element despite a broken [compiler](/up.compiler):

```js
up.compiler('.element', () => { throw new Error('broken compiler') })
let element = up.element.affix(document.body, '.element')
up.hello(element) // no error is thrown
```

Instead an [`error` event on `window`](https://developer.mozilla.org/en-US/docs/Web/API/Window/error_event) is emitted:


```js
window.addEventListener('error', function(event) {
  alert("Got an error " + event.error.name)
})
```

This behavior is consistent with how the web platform handles [errors in event listeners](https://makandracards.com/makandra/481395-error-handling-in-dom-event-listeners)
and custom elements.

#### Debugging and testing

Exceptions in user code are also logged to the browser's [error console](https://developer.mozilla.org/en-US/docs/Web/API/console/error).
This way you can still access the stack trace or [detect JavaScript errors in E2E tests](https://makandracards.com/makandra/55056-raising-javascript-errors-in-ruby-e2e-tests-rspec-cucumber).

Some test runners like [Jasmine](https://jasmine.github.io/) already listen to the `error` event and fail your test if any uncaught exception is observed.
In Jasmine you may use [`jasmine.spyOnGlobalErrorsAsync()`](https://makandracards.com/makandra/559289-jasmine-prevent-unhandled-promise-rejection-from-failing-your-test) to make assertions on the unhandled error.



### Hungry elements

Element with an `[up-hungry]` attribute are updated whenever the server
sends a matching element, even if the element isn't [targeted](/targeting-fragments).
This release addresses many issues and requests concerning hungry elements: 


#### Conflict resolution

There is now defined behavior when multiple targets want to render the same new fragments from a server response:

- When both a [target selector](/targeting-fragments) and a hungry elements target the same fragment in the response, only the direct render target will be updated.
- Hungry elements can be be nested. The outer element will be updated. Note that we recommend to not over-use the hungry mechanism, and prefer to explicit render targets instead.

#### Rendering in multiple layers

Many edge cases have been addressed for render passes that affect multiple layers:

- When a server response reaches a [close condition](/closing-overlays#close-conditions) and causes an overlay to close,
  the discarded response can now be rendered into matching hungry elements on other layers.
- When hungry elements on different [layers](/up.layer) target the same fragment in the response,
  the layer closest to the rendering layer will be chosen.
- Hungry elements can use arbitrary [layer references](/layer-option) in [`[up-if-layer]`](/up-hungry#up-if-layer).
  For example, `[up-if-layer="current child"]` would only piggy-back on render passes for the current layer or its direct overlay.

#### More control over updates

You can now freely control when an hungry element is updated:

- Before a hungry element is added to a render pass, a new event `up:fragment:hungry` is now emitted on the element.
  The event has properties for the old and new element, and information about the current render pass.

  You may prevent this event to exclude the hungry element from the render pass. Use this to define arbitrary conditions
  for when an hungry element should be updated:

  ```js
  element.addEventListener('up:fragment:hungry', function(event) {
    if (event.newFragment.classList.contains('is-empty')) {
      console.log('Ignoring a fragment with an .is-empty class')
      event.preventDefault()
    }
  })
  ```
- Hungry elements can now set an `[up-on-hungry]` attribute. It contains a code snippet that receives an `up:fragment:hungry` event.
  Calling `event.preventDefault()` will prevent the hungry fragment from being updated.
- Deprecated the `[up-if-history]` modifier for hungry elements.

  This functionality is now covered by the more generic `[up-on-hungry]` attribute. Also its main use case was synchronizing meta tags,
  and that is now [supported out of the box](#meta-tags).


#### Animation

Some improvements have been to [hungry elements with animated transitions](/up-hungry#up-transition):

- Hungry elements can now control their transition using `[up-duration]` and `[up-easing]` attributes.
- Hungry elements with transitions now delay the [`up.render().finished`](/render-hooks#awaiting-postprocessing) promise.



### Polling

This release ships many improvements for the `[up-poll]` attribute.

#### Pausing and resuming

Unpoly has always paused [polling](/up-poll) when the user minimizes the window or switches to another tab.
This behavior has been improved by the following:

- When at least one poll interval was spent paused in the background and the user then returns to the tab, Unpoly will now immediately reload the fragment.

  You can use this to load recent data when the user returns to your app after working on something else for a while. For example, the following
  would reload your [main](/main) element after an absence of 5 minutes or more:

  ```html
  <main up-poll up-interval="300_000">
    ...
  </main>
   ```

- Polling now unschedules all JavaScript timers while polling is paused. This allows browser to keep the inactive window suspended, saving battery life.

Unpoly also pauses [polling](/up-poll) for fragments that are covered by an overlay. This behavior has been improved by the following:

- When at least one poll interval was spent paused on a background layer and the layer is then brought to the [front](/up.layer.front) again,
  Unpoly will now immediately reload the fragment.
- You can now keep polling on a background layer by setting an `[up-if-layer="any"]` attribute on an `[up-poll]` fragment.
- Fix a bug where polling on a background layer would not resume when the layer was brought to the [front](/up.layer.front) again.


#### Disabling polling

- The server can now stop polling by rendering a new fragment with `[up-poll=false]`. The previous method of omitting the `[up-poll]` attribute remains supported.
- Deprecated the configuration `up.radio.config.pollEnabled`. To disable polling, prevent the `up:fragment:poll` event instead.


### Rendering

Unpoly's rendering engine has been reworked to address many edge cases found in production use.

#### More practical callback order

- Compilers now see updated [navigation feedback](/up.feedback) for the current render pass. In particular `.up-current` classes are updated before compilers are called.
- Hungry elements on other layers are now updated *before* [`{ onAccepted }` and `{ onDismissed }` callbacks](/closing-overlays#callbacks) fire.
  This allows callbacks to observe all fragment changes made by a closing overlay.

#### Matching in destroyed elements

This release addresses many many errors when matching fragments in closed layers, detached elements or destroyed elements in their exit animation:

- Rendering successful responses no longer crashes if a `{ failTarget }` or `{ failLayer }` cannot be resolved.
- `up.fragment.toTarget()` no longer crashes when deriving targets for destroyed elements that are still in their exit animation.
- Fragment lookup functions now crash with a better error message when the given `{ layer }` does not exist or has been closed.
- [Revalidation](/caching#revalidation) now succeeds when the `{ failLayer }` is no longer open.

#### General improvements

- Unpoly now [logs](/up.log) when rendering was aborted or threw an internal error.
- [Cache revalidation](/caching#revalidation) now updates the correct element when the initial render pass matched in the [region of the clicked link](/targeting-fragments#resolving-ambiguous-selectors) and that link has since been detached.
- Rendering no longer forces a full page load when the initial page was loaded with non-GET, but the render pass does not change history.
  This allows to use `[up-validate]` in forms that are not [submitted through Unpoly](/form-up-submit).
- Updates for `[up-keep]` no longer need to also be `[up-keep]`. You can prevent keeping by setting `[up-keep=false]`. This allows you to set `[up-keep]` via a [macro](/up.macro).
- Fix a bug where reloading a fragment that was rendered from local content would be reloaded from path `"/true"` (sic).
- Fix a bug where, when revalidating a [fallback target](/targeting-fragments#providing-a-fallback-target), we would log that we're `"revalidating undefined"`


### Network quality is no longer measured

Previous versions of Unpoly adapted the behavior some features when it detected high latency or low network throughput.
Due to cross-browser support for the [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API),
measuring of network quality was removed:

- Unpoly no longer doubles [poll](/up-poll) intervals on slow connections. The configuration `up.radio.config.stretchPollInterval` was removed.
- Unpoly no longer prevents [preloading](/a-up-preload) on slow connections. The configuration `up.link.config.preloadEnabled = 'auto'` was removed.

  To disable preloading based on your own metrics, you can still prevent the `up:link:preload` event.
- The configuration `up.network.config.badDownlink` was removed.
- The configuration `up.network.config.badRTT` was removed.
- The function `up.network.shouldReduceRequests()` was removed.

Unpoly retains [all other functionality for dealing with network issues](/network-issues).


### Fragment API

#### More control over region-aware fragment matching

When [targeting fragments](/targeting-fragments), Unpoly will prefer to
[match fragments in the region of the user interaction](/targeting-fragments#resolving-ambiguous-selectors). For example, when
a link's `[up-target]` could match multiple fragments, the fragment closest to the link is updated.
In cases where you don't want this behavior, you now have more options:

- You can now disable region-aware fragment matching for individual function calls or elements:
  - Pass a `{ match: 'first' }` option to any function that matches or renders a fragment.
  - Set an `[up-match=first]` option on a link or form that matches or renders a fragment.
- The boolean configuration `up.fragment.config.matchAroundOrigin` has been replaced by `up.fragment.config.match`. Its values are `'region'` (default) and `'first'`.

#### General improvements

- New experimental function `up.fragment.contains()`. It returns whether the given `root` matches or contains the given selector or element.

  Other than `Element#contains()` it only matches fragments on the same layer. It also ignores destroyed fragments in an exit animation.
- The event `up:fragment:keep` received a new property `{ renderOptions }`. It contains the render options for the current render pass.
- The event `up:fragment:aborted` received new experimental property `{ newLayer }`. It returns whether the fragment was aborted by a [new overlay opening](/opening-overlays).
- Many functions in the fragment API now also support a `Document` as the search root:
  - `up.fragment.get()`
  - `up.fragment.all()`
  - `up.fragment.contains()`
- Passing an element to `up.fragment.get()` now returns that element unchanged.




### Scripting

- Destructors are now called with the element being destroyed.

  This allows you to [reuse the same destructor function](/up.destructor#reusing-destructor-functions) for multiple elements:

  ```js
  let fn = (element) => console.log('Element %o was destroyed', element)
  
  for (let element of document.querySelector('div')) {
    up.destructor(element, fn)
  }  
  ```
- Unpoly 3.0.0 introduced a [third `meta` argument for compilers](/up.compiler#accessing-information-about-the-render-pass)
  containing information about the current render pass:

  ```js
  up.compiler('.user', function(element, data, meta) {
    console.log(meta.response.text.length)        // => 160232
    console.log(meta.response.header('X-Course')) // => "advanced-ruby"
    console.log(meta.layer.mode)                  // => "root"
    console.log(meta.revalidating)                // => boolean
  })
  ```

  Unfortunately we realized that access to the response this would to bad patterns where fragments would compile
  differently for the initial page load vs. subsequent fragment updates.

  In Unpoly 3.5 compilers can no longer access the current response via the `{ response }` of that `meta` argument.
  The `{ layer }` and `{ revalidating }` property remains available.

- The `up.syntax` package has been renamed to `up.script`.


### Layers

- You may now use a new [layer reference](/layer-option) `subtree` in your `{ layer }` options or `[up-layer]` attributes.
  This matches fragments in either the current layer or its descendant overlays.
- `up.Layer` objects now support a new method [`#subtree()`](/up.Layer.prototype.subtree). It returns an array of `up.Layer` containing this layer and its descendant overlays.
- Fix a bug where the layer stack would sometimes be corrupted by after looking up ancestors or descendants.
- Fix a visual issue where, when [fixed elements](/up-fixed-top) were created after an overlay was opened, the fixed element would be position too far to the right.


### Links

- The `up:link:preload` event received a new property `{ renderOptions }`. It contains the render options for the current render pass.
- The [`[up-on-offline]`](/a-up-follow#up-on-offline) attribute now supports a [CSP nonce](/csp#nonceable-attributes).
- The function `up.link.followOptions()` now takes an `Object` as a second argument. It will override any options parsed from the link attributes.
- The configuration `up.link.config.preloadEnabled` was deprecated. To disable preloading, prevent `up:link:preload`.


### DOM helpers

- A new experimental function `up.element.isEmpty()` was added. It returns whether an element has neither child elements nor non-whitespace text.


### Viewports

- Renamed configuration `up.viewport.config.anchoredRight` to `up.viewport.config.anchoredRightSelectors`
- Renamed configuration `up.viewport.config.fixedTop` to `up.viewport.config.fixedTopSelectors`
- Renamed configuration `up.viewport.config.fixedBottom` to `up.viewport.config.fixedBottomSelectors`


### `unpoly-migrate.js`

- The polyfills for the `up.element.isAttached()` and `up.element.isDetached()` functions were changed so they behave
  like their implementation in Unpoly 2.x. In particular the functions now only consider attachment in `window.document`, but not to other `Document` instances.


### Build

- `unpoly.js` is now compiled using ES2021 (up from ES2020). The [ES6 build](/install#legacy-browsers) for legacy browsers remains available.
- Improve compression of minified builds. In particular private object properties are now prefixed with an underscore (`_`) [so they can be mangled safely](https://makandracards.com/makandra/608582-minifying-object-properties-in-javascript-files).

  If you are re-bundling the unminified build of Unpoly you can [configure your minifier](https://makandracards.com/makandra/608582-minifying-object-properties-in-javascript-files#section-mangling-private-properties)
  to do the same.


3.3.0
-----

Elements with an `[up-hungry]` attribute are updated whenever the server sends a matching element, even if the element isn't [targeted](/targeting-fragments) explicitly.

By default hungry elements only update from responses that target their own [layer](/up.layer). Unpoly 3.0 introduced a modifying attribute `[up-if-layer="any"]` that tells the element to also update from responses from *other* layers. Unpoly 3.3.0 addresses two edge cases:

- Hungry elements with `[up-if-layer="any"]` are also updated from responses that [open an overlay](/opening-overlays).
- Hungry elements with `[up-if-layer="any"]` are also updated from responses that cause [an overlay to close](/closing-overlays).


3.2.2
-----

- Fix a bug where rendering on the root layer while a focused overlay is closing would crash with an error like this:

  ```text
  up.Error: Must pass an up.Layer as { layer } option, but got undefined
  ```


3.2.1
-----

This is a bugfix release with many contributions from the community.

- Click event handlers added via `up.on()` no longer fire when clicking on a child of a disabled button. *By @adam12.*
- Fix a crash when [targeting](/targeting-fragments) elements with class names containing special characters, e.g. dynamic Tailwind CSS classes. *By @adam12.*
- Submit buttons [outside a form](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form) are now included in the request params. *By @mordae.*
- Documentation for [URL patterns](/url-patterns) has been expanded with many examples. *By @jmoppel.* 
- Fix a bug where forms with a field named `"contains"` could not be submitted. *By @adam12.*
- Fix a bug where the `{ location }` property of the `up:location:changed` would sometimes be `Location` object instead of a string. *By @triskweline.*
- When layers are closed during a fragment update, Unpoly no longer adds a history entry for the revealed layer. *By @triskweline.*
- Animations that fly in an element from the screen edge (`move-from-top`, `move-from-left`, etc.) no longer leave a `transform` style on the animated element. *By @triskweline.*
- New experimental option `{ history: false }` for all functions that close layers. This prevents Unpoly from restoring history from the revealed parent layer. *By @triskweline.*
- To help with future contributions to Unpoly, development dependencies were upgraded to Jasmine 5, TypeScript 5, and Node.js 20. *By @triskweline.*


3.2.0
-----

### Addressing an important caching issue

Unpoly 3.2.0 no longer cache responses with an empty body (fixes #497). In particular responses with `304 Not Modified` are no longer cached when using [conditional requests](/conditional-requests).

As this issue could cause errors when rendering, we recommend all Unpoly 3 users to upgrade.


### Using the server response that closed an overlay

When an overlay closes in reaction to a server response, no content from that response is rendered.

Sometimes you do need to access the discarded response, e.g. to render its content in another layer.
For this you can now access response via the `{ response }` property of the `up:layer:accepted` and `up:layer:dismissed` events.

For example, the link link opens an overlay with a form to create a new company (`/companies/new`).
After successful creation the form redirects to the list of companies (`/companies`). In that case
we can use the HTML from the response and render it into the parent layer:

```html
<a href="/companies/new"
   up-layer="new"
   up-accept-location="/companies"
   up-on-accepted="up.render('.companies', { response: event.response }"> <!-- mark-phrase "event.response" -->
  New company
</a>
```

The `{ response }` property is available whenever a server response causes an overlay to close:

- When a [server-sent event](/X-Up-Events) matches a [close condition](/closing-overlays#close-conditions).
- When the new location matches a [close condition](/closing-overlays#close-conditions).
- When the server [explicitly closes](/closing-overlays#closing-from-the-server) an overlay using an HTTP header.

### Rendering `up.Response` objects

If you have manually fetched content from the server, you can now pass an `up.Response` object as a `{ response }` option to render its contents:

```js
let response = await up.request('/path')
up.render({ target: '.target', response })
```

The various ways to provide HTML to rendering functions are now summarized on a [new documentation page](/render-content).


### Other changes

- You can now use `[up-href]` without also setting `[up-follow]` or `[up-target]` (fixes #489).
- Date inputs are again validated on `change` instead of `blur`.

  In Unpoly 3.0 this defaulted to `blur` because desktop date pickers emit a `change` event whenever the user changes a date component (day, month, year). Unfortunately this change caused issues with mobile date pickers as well as JavaScript date pickers (resolves #488, reverts #336).

  If you prefer validating on `blur`, you can restore the behavior of Unpoly 3.0 by configuring `up.form.config.watchChangeEvents`.
- Rendering functions now have a better error message when referring to detached elements or when referring to non-existing layers.
- The results of `up.Response#fragments` are no longer cached to preserve memory.


3.1.1
-----

This release contains more changes to [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading) to help upgrading from Unpoly 2 to 3:

- Deprecation warnings for renamed attributes now always mention the actual attribute name instead of the parsed render option.

  For example, the deprecation warning for `[up-reveal]` used to say:
  
  ```text
  Option { reveal: true } has been renamed to { scroll: "target" }
  ```
  
  This wasn't very helpful for tracking down affected code. The warning has been changed to this:
  
  ```text
  Attribute [up-reveal] was renamed to [up-scroll="target"].
  ```
- Using the deprecated `up.element.toggleClass()` now logs a deprecation warning.
- Using the deprecated `up.$compiler()` now logs a deprecation warning.
- Using the deprecated `up.$macro()` now logs a deprecation warning.
- Using the deprecated `up.$on()` now logs a deprecation warning.
- Using the deprecated `up.$off()` now logs a deprecation warning.
- Using the deprecated `up.scroll()` now logs a deprecation warning.
- `up.form.config.groupSelectors` now also removes the suffix `:has(&)` in addition to `:has(:origin)`.
- When disabling log formatting with `up.log.config.format = false` Unpoly no longer prints structured objects to the console. This makes it easier to [detected use of undeprecated APIs with automated tests](https://unpoly.com/changes/upgrading#detecting-deprecated-apis-with-tests).

There's also a small change to a utility function:

- `up.util.last()` also returns the last character of a string.


3.1.0
-----

This release addresses some issues when upgrading from Unpoly 2 to 3:

- Fix a bug where kept `[up-keep]` elements would call their destructors if the `<body>` element is swapped
- [Validation](/validation) now throw an exception if a validation target cannot be matched (fixes [#476](https://github.com/unpoly/unpoly/issues/476))
- Fix a bug where focused date inputs would trigger a validation when destroyed
- [Cache revalidation](/caching#revalidation) is now only the default when [navigating](/navigation). If you render cached content without navigating, you must opt into cache revalidation with `{ cache: 'auto', revalidate: 'auto' }`.

If also fixes some bugs in [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading):

- Fix a bug where the deprecated origin shorthand (`&`) in attribute selector values that contain both square brackets and ampersands (fixes [#478](https://github.com/unpoly/unpoly/issues/478))
- Fix a bug where `up.$on()` was not polyfilled properly
- Fix a bug where `up.$off()` was not polyfilled properly
- Fix a bug where `up.$compiler()` was not polyfilled properly
- Fix a bug where `up.$macro()` was not polyfilled properly

Finally this release publishes a small feature:

- Published a new attribute `[up-href]`. Using this attribute you can make any element behave like a hyperlink when clicked.


3.0.0
-----

### Overview

The main concern of Unpoly 3 is to **fix all the concurrency issues** arising from real-world production use:

- Forms where many fields depend on the value of other fields
- Multiple users working on the same backend data (stale caches)
- User clicking faster than the server can respond
- Multiple requests targeting the same fragment
- Responses arrives in different order than requests
- User losing connection while requests are in flight
- Lie-Fi (spotty Wi-Fi, EDGE, tunnel)

Unpoly 3 also ships numerous **quality of life improvements** based on community feedback:

- Optional targets
- Idempotent `up.hello()`
- More control over `[up-hungry]`
- HTML5 data attributes
- Extensive render callbacks
- Strict target derivation
- Cleaner logging
- Foreign overlays

In addition to this CHANGELOG, there is also a [slide deck](http://triskweline.de/unpoly3-slides/) explaining the most relevant changes in more detail.

Finally we have [reworked Unpoly's documentation](#reworked-documentation) in our ongoing efforts to evolve it an API reference to a long-form guide.


### Upgrade effort

- The upgrade from Unpoly 2 to 3 will be *much* smoother than going from Unpoly 1 to 2. We were able to upgrade multiple medium-sized apps in less than a day's work. As always, [YMMV](https://www.urbandictionary.com/define.php?term=ymmv).
- No changes were made in HTML or CSS provided by Unpoly.
- Most breaking changes are polyfilled by [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading), which automatically logs instructions for migrating affected code.
- If you're only looking for breaking changes that need manual review, look for the ⚠️ icon in this CHANGELOG.
- `unpoly-migrate.js` keeps polyfills for deprecated APIs going back to 2016.
  You may upgrade from v1 to v3 without going through v2 first.


### Fragments

#### Concurrent updates to the same fragment

When a user clicks faster than a server can respond, multiple concurrent requests may be [targeting](/targeting-fragments) the fragments. Over the years Unpoly has attempted different strategies to deal with this:

- Unpoly 1 did not limit concurrent updates. This would sometimes lead to race conditions where concurrent responses were updating fragments out of order.
- Unpoly 2 by default aborted *everything* on [navigation](/navigation). While this would guarantee the last update matching the user's last interaction, it sometimes killed background requests (e.g. the preloading of a large navigation menu).
- Unpoly 3 by default only aborts requests conflicting with your update. Requests targeting other fragments are not aborted. See a [visual example here](/aborting-requests#aborting-conflicting-requests).

That said, Unpoly 3 makes the following changes to the way conflicting fragment updates are handled:

- The render option `{ solo }` was replaced with a new option `{ abort }`.
- The HTML attribute `[up-solo]` was replaced with a new attribute `[up-abort]`.
- A new default render option is `{ abort: 'target' }`. This [aborts earlier requests](/aborting-reqeusts)
  targeting fragments within *your* targeted fragments.

  For instance, the following would abort all requests targeting `.region` (or a descendant of `.region`) when the link is clicked:

  ```html
  <a href="/path" up-target=".region">
  ```

  ⚠️ If your Unpoly 2 app uses a lot of `{ solo: false }` options or `[up-solo=false]` attributes, these may no longer   be necessary now that Unpoly 3 is more selective about what it aborts. 
- To programmatically abort all requests targeting fragments in a region, use `up.fragment.abort(selector)`.
- ⚠️ Unpoly now cancels timers and other async work when a fragment is aborted by being [targeted](/targeting-fragments):
  - [Polling](/up-poll) now stops when the fragment is aborted.
  - Pending [validations](/validation) are now aborted when an observed field is aborted.
  - When a fragment is destroyed or updated, pending requests targeting that fragment will always be aborted, regardless of the `{ abort }` option.
- Your own code may react to a fragment being aborted by being targeted. To so, listen to the new `up:fragment:aborted` event.
- To simplify observing an element and its ancestors for aborted requests, the function `up.fragment.onAborted()` is also provided. 
- Fragment updates may exempt their requests from being aborted by setting an `[up-abortable=false]` attribute on the updating link, or by passing an `{ abortable: false }` render option.
- Imperative preloading with `up.link.preload()` is no longer abortable by default.
  
  This makes it easy to eagerly preload links like this:
    
  ```js
  up.compiler('a[rel=next]', up.link.preload)
  ```
  
  You can make preload requests abortable again by passing an `{ abortable: true }` option.
- The option `up.request({ solo })` was removed. To abort existing requests, use `up.fragment.abort()` or `up.network.abort()`.

#### Optional targets

Target selectors can now mark optional fragments as `:maybe`.

For example, the following link will update the fragments `.content` (required) and `.details` (optional):

```html
<a href="/cards/5" up-target=".content, .details:maybe">...</a>
```

#### Strict target derivation

Unpoly often needs to [derive a target selector](/target-derivation) from an element, e.g. for `[up-hungry]`, `[up-poll]` or `up.reload(element)`. Unpoly 2 would sometimes guess the wrong target, causing the wrong fragment to be updated. This is why target derivation has been reworked to be more strict in Unpoly 3:

- ⚠️ A longer, but stricter list of possible patterns is used to [derive a target selector](/target-derivation).

  The following patterns are configured by default:

  ```js
  up.fragment.config.targetDerivers = [
    '[up-id]',        // [up-id="foo"]
    '[id]',           // #foo
    'html',           // html
    'head',           // head
    'body',           // body
    'main',           // main
    '[up-main]',      // [up-main="root"]
    'link[rel]',      // link[rel="canonical"]
    'meta[property]', // meta[property="og:image"]
    '*[name]',        // input[name="email"]
    'form[action]',   // form[action="/users"]
    'a[href]',        // a[href="/users/"]
    '[class]',        // .foo (filtered by up.fragment.config.badTargetClasses)
  ]
  ```
  
  Note that an element's tag name is no longer considered a useful target selector, except for unique elements like `<body>` or `<main>`.
- ⚠️ Before a target selector is used, Unpoly 3 will verify whether it would actually match the targeted element.
  
  If it matches another element, another target derivation pattern is attempted. If no pattern matches, an error `up.CannotTarget` is thrown.
  
  If you see an `up.CannotTarget` error while upgrading to Unpoly 3, this probably indicates a bug in your app concerning elements with ambiguous selectors. You should fix it by giving those elements a unique `[id]` attribute.
  
  Verification of derived targets may be disabled with `up.fragment.config.verifyDerivedTarget = false`.
- `[up-poll]` will only work on elements for which we can derive a good target selector.
- `[up-hungry]` will only work on elements for which we can derive a good target selector.
- Added a new function `up.fragment.isTargetable()`. It returns whether we can derive a good target selector for the given element.
- When `up.fragment.toTarget()` is called with a string, the string is now returned unchanged.

#### Keepable elements

- `[up-keep]` now preserves the playback state of started `<audio>` or `<video>` elements.
- You may now use `[up-keep]` within `[up-hungry]` elements (reported by @foobear).
- The event `up:fragment:kept` was removed. There is still `up:fragment:keep`.
- The render option `{ keep }` was renamed to `{ useKeep }`. An `[up-use-keep]` attribute for links and forms was added.
- Setting the value of `[up-keep]` to a selector for matching new content is no longer supported

#### Extensive render hooks

Unpoly 3 expands your options to [hook into specific stages](/render-hooks) of the rendering process in order to change the result or handle error cases:

- Rendering functions now accept a wide range of callback functions. Using a callback you may intervene at many points in the rendering lifecycle:

  ```js
  up.render({
    url: '/path',
    onLoaded(event)        { /* Content was loaded from cache or server */ },
    focus(fragment, opts)  { /* Set focus */ },
    scroll(fragment, opts) { /* Set scroll positions */ },
    onRendered(result)     { /* Fragment was updated */ },
    onFailRendered(result) { /* Fragment was updated from failed response */ },
    onRevalidated(result)  { /* Stale content was re-rendered */ },
    onFinished(result)     { /* All finished, including animation and revalidation */ }
    onOffline(event)       { /* Disconnection or timeout */ },
    onError(error)         { /* Any error */ }
  })
  ```
- Callbacks may also be passed as HTML attributes on links or forms, e.g. `[up-on-rendered]` or `[up-on-error]`.
- To run code after all DOM changes have concluded (including animation and revalidation), you may now `await up.render().finished`. The existing callback `{ onFinished }` remains available.
- The `up:fragment:loaded` event has new properties `{ revalidating, expiredRequest }`. This is useful to handle [revalidation](/caching#revalidation) requests.
- The `up:fragment:loaded` gets a new `event.skip()` which finishes the render pass without changes. Programmatic callers are fulfilled with an empty `up.RenderResult`.
  This is in contrast to `event.preventDefault()`m which aborts the render pass and rejects programmatic callers with an `up.AbortError`.
- You may use `up.fragment.config.skipResponse` to configure global rules for responses that should be skipped. By default Unpoly skips:
  - Responses without text in their body.

    Such responses occur when a [conditional request](/conditional-requests) in answered with HTTP status `304 Not Modified` or `204 No Content`.
  - When [revalidating](/caching#revalidation), if the expired response and fresh response have the exact same text.
- Callbacks to handle [failed responses](/failed-responses), now begin with the prefix `onFail`, e.g. `{ failOnFinished }` becomes `{ onFailFinished }`.


#### Various changes

- You may now target the origin origin using `:origin`. The previous shorthand `&` has been deprecated.
- ⚠️ When Unpoly uses the `{ origin }` to [resolve ambiguous selectors](/targeting-fragments#resolving-ambiguous-selectors), that origin is now also rediscovered in the server response. If the origin could be rediscovered, Unpoly prefers matching new content closest to that.
- Added a new property `up.RenderResult#fragment` which returns the first updated fragment.
- The property `up.RenderResult#fragments` now only contains newly rendered fragments. It will no longer contain:
  - [Kept](/up-keep) elements.
  - Existing fragments that got new content appended or prepended.
  - Existing fragments that had their inner HTML replaced (`{ content }`).
- New experimental function `up.fragment.matches()`. It returns whether the given element matches the given CSS selector or other element.
- The function `up.fragment.closest()` is now stable.
- Fix a memory leak where swapping an element did not [clear internal jQuery caches](https://makandracards.com/makandra/31325-how-to-create-memory-leaks-in-jquery).
- Support prepending/appending content when rendering from a string using `up.render({ content })` and `up.render({ fragment })`.
- When prepending/appending content you may now also target `::before` and `::after` pseudos (double colon) in addition to `:before` and `:after`.
- New fragments may now have HTML attributes containing the verbatim string `<script>` (fixes [#462](https://github.com/unpoly/unpoly/issues/462))



### Custom JavaScript

#### Attaching data to elements

Unpoly 3 makes it easier to work with [element data](/data):

- Simple data key/values can now be attached to an element using standard HTML5 `[data-*]` attributes (in addition to `[up-data]`).
- The data argument passed to a compiler is merged from both `[data-*]` and `[up-data]` attributes. These three elements produce the same compiler data:
   
  ```html 
  <div up-data='{ "foo": "one", "bar": "two" }'></div>
  <div data-foo='one' data-bar='two'></div>
  <div up-data='{ "foo": "one" }' data-bar='bar'></div>
  ```
- When reloading or validating, element data can now be forwarded with a `{ data }` option:
  - New option `up.render({ data })`
  - New option `up.reload({ data })`
  - New option `up.validate({ data })`
- When reloading or validating, element data can now be preserved with a `{ keepData }` option:
  - New option `up.reload({ keepData })`
  - New option `up.validate({ keepData })`
  - `[up-poll]` gets a new attribute `[up-keep-data]`

#### Compilers

- `up.hello()` is now idempotent.

  You can call `up.hello()` on the same element tree multiple times without the fear of side effects.
   
  Unpoly guarantees that each compiler only ever runs once for a matching elements.
- You can now register compilers after content was rendered.
 
  New compilers registered after booting automatically run on current elements.
  This makes it easier to split your compilers into multiple files that are then loaded as-needed.
  
  Note that compilers with a `{ priority }` will only be called for new content, but not for existing content.
- Compilers now accept an optional third argument with information about the current render pass:

  ```js
  up.compiler('.user', function(element, data, meta) {
    console.log(meta.response.text.length)        // => 160232
    console.log(meta.response.header('X-Course')) // => "advanced-ruby"
    console.log(meta.layer.mode)                  // => "root"
    console.log(meta.revalidating)                // => true
  })
  ```

#### Various changes

- ⚠️ Unpoly now executes `<script>` tags in new fragments.
  
  You may disable this behavior with `up.fragment.config.runScripts = false` (this was the default in Unpoly 2).
  
  Note if you include your application bundle in your `<body>` it may now be executed multiple times if you're swapping the `<body>` element with Unpoly. We recommend [moving your `<script>` tags into the head with `<script defer>`](https://makandracards.com/makandra/504104-you-should-probably-load-your-javascript-with-script-defer).
- When a compiler throws an error, rendering functions like `up.render()` or `up.submit()` now reject with an error.
- Fixed a bug where matching elements in the `<head>` were not compiled during the initial page load.



### Layers

#### Foreign overlays

The [overlays](https://unpoly.com/up.layer) of Unpoly 2 would sometimes clash with overlays from a third party library ("foreign overlay"). E.g. clicking a foreign overlay would closes an Unpoly overlay, or Unpoly would steal focus from a foreign overlay.

Unpoly 3 lets you configure selectors matching foreign overlays using `up.layer.config.foreignOverlaySelectors`. Within a foreign overlay Unpoly will no longer have opinions regarding layers or focus.


#### Various changes

- Fixed a bug where referring to the root layer by index (`up.fragment.get(selector, { layer: 0 })`) would always match in the current layer instead of the root layer.
- The `up:layer:location:changed` now has a property `{ layer }`. It returns the layer that had its location changed.




### Passive updates

#### Hungry elements

- You may now update `[up-hungry]` elements for updates of any layer by setting an `[up-if-layer=any]` attribute.
  
  A use case for this are notification flashes that are always rendered within the application layout on the root layer.
- You may now restrict updating of `[up-hungry]` elements for updates that change history by setting an `[up-if-history]` attribute.
  
  A use case is a `<link rel="canonical">` element that is related to the current history entry.
- The render option `{ hungry }` was renamed to `{ useHungry }`. An `[up-use-hungry]` attribute for links and forms was added.
- You may now use `[up-keep]` within `[up-hungry]` elements (reported by @foobear).


#### Polling

- Polling is no longer disabled on poor connections. Instead the polling frequency is halved. This can be figured in `up.radio.config.stretchPollInterval`.
- `[up-poll]` now prints fatal errors to the log.
- `[up-poll]` now logs a message when it skips polling, e.g. when the tab is hidden or a fragment is on a background layer.
- `[up-poll]` gets new attribute `[up-keep-data]` to preserve the [data](/data) of the polling fragment




### Navigation feedback

- Targeted fragments are now marked with an `.up-loading` class while a request is loading.
  
  By styling elements with this class you can highlight the part of the screen that's loading.
  
  Note that `.up-loading` is added in addition to the existing `.up-active` class, which is assigned to the link, form or field that triggered a request.


### Logging

- The log now shows which user interaction triggered an event chain.
- `up.emit()` now only prints user events when the user has enabled logging.
- Unpoly now logs when an event like `up:link:follow` or `up:form:submit` has prevented a render pass.
- Unpoly now logs when there was no new content to render.
- Unpoly now logs when we're rendering a [failed response](/failed-responses) using fail-prefixed options.



### History

- Unpoly now emits an event `up:location:restore` when the user is [restoring a previous history entry](/restoring-history), usually by pressing the back button.

  Listeners may prevent `up:location:restore` and substitute their own restoration behavior.
- Renamed `up:location:changed` event's `{ url }` property to `{ location }`.
- Fix a bug where clicking links twice would not update location when the browser history API is used in between (closes [#388](https://github.com/unpoly/unpoly/issues/388)).


### Scrolling

- Smooth scrolling with `{ behavior: 'smooth' }` now uses the browser's native smooth scrolling implementation.

  This gives us much better performance, at the expense of no longer being able to control the scroll speed, or the detect the end of the scrolling motion.
- ⚠️ Removed property `up.viewport.config.scrollSpeed` without replacement.
- ⚠️ Removed the option `{ scrollSpeed }` without replacement.
- ⚠️ `up.reveal()` no longer returns a promise for the end of a smooth scrolling animation.
- ⚠️ `up.viewport.restoreScroll()` no longer returns a promise for the end of a smooth scrolling animation. Instead if returns a boolean value indicating whether scroll positions could be restored
- Instant (non-smooth) scrolling is now activated using `{ behavior: 'instant' }` instead of `{ behavior: 'auto' }`.
- You may now attempt multiple [scrolling strategies](/scrolling) in an `[up-scroll]` attribute.
  
  The strategies can be separated by an `or` e.g. `[up-scroll="hash or :main"]`.  Unpoly will use the first applicable strategy.
- You may now pass alternate strategies when scroll position could not be restored.
  
  E.g. `{ scroll: ['restore', 'main' ] }` or `[up-scroll="restore or main"]`

- Fix a bug where when attempting to restore scroll positions that were never saved for the current URL, all scroll positions were reset to zero.
- When a render pass results in no new content, the `{ scroll }` option now is still processed.
- When [scrolling to a fragment](/scrolling#revealing-the-fragment), [obstructing elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport) that are hidden are now ignored.


### Focus

- You may now attempt multiple [focus strategies](/focus) in an `[up-focus]` attribute.

  The strategies can be separated by an `or` e.g. `[up-focus="hash or :main"]`. Unpoly will use the first applicable strategy.
- Focus is now saved and restored when navigating through history:
  - Saved state includes the cursor position, selection range and scroll position of the focused element.
  - To explicitly save focus for the current URL, use `up.viewport.saveFocus()`.
  - To opt out of the focus saving,  `up.render({ saveFocus: false })`
  - Th explicitly *restore* focus for the current URL, use `up.viewport.restoreFocus()`.
  - To opt out of the focus restoration, use `up.render({ focus: false })`.
- When rendering without navigation or an explicit [focus strategy](/focus), Unpoly will now preserve focus by default.
- Links with an `[up-instant]` attribute are now focused when being followed on `mousedown`. This is to mimic the behavior of standard links.
- When a render pass finishes [without new content](/skipping-rendering#rendering-nothing), the `{ focus }` option now is still processed.
- Fix a bug where focus loss was not detected when it occurred in a secondary fragment in a multi-fragment update.
- `<label for="id">` elements now always focus a matching field in the same layer, even when fields with the same IDs exist in other layers.


### Forms


#### Preventing concurrent form interaction

- Forms [can now be disabled](/disabling-forms) while they are submitting. To do so set an `[up-disable]` attribute to the `<form>` element or pass a `{ disable }` option to a render function.
  
  By default all fields and buttons in that forms are disabled.
  
  To only disable submit buttons, pass a selector like `[up-disable="button"]`.
  
  To only disable some fields or buttons, pass a selector that matches these fields or their container, e.g. `[up-disable=".money-fields"]`).
- Fields being observed with `[up-validate]` and `[up-watch]` may also disable form elements using an `[up-watch-disable]` attribute:
  ```html
  <select up-validate=".employees" up-watch-disable=".employees">
  ```


#### Batched validation for forms where everything depends on everything

Sometimes we don't want to disable forms while working, either because of optics (gray fields) or to not prevent user input.

Unpoly 3 has a <b>second</b> solution for forms with many `[up-validate]` dependencies that does not require disabling:

- ⚠️ Multiple elements targeted by `[up-validate]` are now batched into a single render pass with multiple targets. Duplicate or nested target elements are consolidated.

  This behavior cannot be disabled.
- Validation will only have a single concurrent request at a time. Additional validation passes while the request is in flight will be queued. 
- Form will eventually show a consistent state, regardless how fast the user clicks or how slow the network is.

See [Dependent fields](/dependent-fields) for a full example.


#### Watching fields for changes

Various changes make it easier to watch fields for changes: 

- The function `up.observe()` has been renamed to `up.watch()`.
- The attribute `[up-observe]` has been renamed to `[up-watch]`.
- Added [many options](/watch-options) to control [watching](/up-watch), [validation](/validation) and [auto-submission](/up-autosubmit):
  - You can now control which events are observed by setting an `[up-watch-event]` attribute or by passing a `{ watch }` option.
  - You can now control whether to show [navigation feedback](/up.feedback) while an async callback is working by setting an `[up-watch-feedback]` attribute or by passing a `{ feedback }` option.
  - You can now debounce callbacks by setting an `[up-watch-delay]` attribute or by passing a `{ delay }` option.
  - You can now [disable form fields](/watch-options#disabling-fields-while-working) while an async callback is working by setting an `[up-watch-deisable]` attribute or by passing a `{ disable }` option.
  - All these options can be used on individual fields or [set as default for multiple fields](/watch-options#setting-options-for-multiple-fields) or entire forms.  
- Delayed callbacks no longer run when the watched field was *removed* from the DOM during the delay (e.g. by the user navigating away)
- Delayed callbacks no longer run when the watched field was *aborted* during the delay (e.g. by the user submitting the containing form)
- Sometimes fields emit non-standard events instead of `change` and `input`. You may now use `up.form.config.watchInputEvents` and `up.form.config.watchCangeEvents` to normalize field events so they become observable as `change` or `input`.
- Date inputs (`<input type="date">`) are now (by default) validated on `blur` rather than on `change` (fixes [#336](https://github.com/unpoly/unpoly/issues/336)).
- The configuration `up.form.config.observeDelay` has been renamed to `up.form.config.watchInputDelay`.
- The `this` in an `[up-watch]` callback is now always bound to the element that has the attribute (fixes [#442](https://github.com/unpoly/unpoly/issues/442)).
- ⚠️ The `up.watch()` function (formerly `up.observe()`) no longer accepts an array of elements. It only accepts a single field, or an element containing multiple fields. 


#### Various changes

- ⚠️ The `up.validate()` function now rejects when the server responds with an error code.
- The `up:form:validate` event has a new property `{ params }`. Listeners may inspect or mutate params before they are sent.
- New function `up.form.submitButtons(form)` that returns a list of submit buttons in the given form.
- New function `up.form.group(input)` that returns the form group (tuples of label, input, error, hint) for the given input element.
- ⚠️ Replaced `[up-fieldset]` with `[up-form-group]`.
- Replaced `up.form.config.validateTargets` with `up.form.config.groupSelectors`. Configured selectors must no longer contain a `:has(:origin)` suffix, as this is now added automatically when required.
- All functions with a `{ params }` option now also accept a `FormData` value.
- The `[up-show-for]` and `[up-hide-for]` attributes now accept values with spaces. Such values must be encoded as a JSON array, e.g. `<element up-show-for='["John Doe", "Jane Doe"]'>`. Fixes [#78](https://github.com/unpoly/unpoly/issues/78).
- ⚠️ When submitting a form, `{ origin }` is now the element that triggered the submission:
  - When a form is submitted, the `:origin` is now the submit button (instead of the `<form>` element)
  - When a form is submitted by pressing `Enter` within a focused field sets that field as the `{ origin }`, the `:origin` is now the focused field (instead of the `<form>` element)
  - When a form is watched or validated, the `:origin` is now the field that was changed (instead of the `<form>` element)
  - To select an active form with CSS, select `form.up-active, form:has(.up-active) { ... }`.
- Fix `up.watch()` (formerly `up.observe()`) crashing when passed an input outside a form.


### Network requests

#### Cache revalidation

In Unpoly 3, [cache](/caching) entries are only considered *fresh* for 15 seconds. When rendering older cache content, Unpoly automatically reloads the fragment to ensure that the user never sees expired content. This process is called [cache revalidation](/caching#revalidation).

When re-visiting pages, Unpoly now often renders twice:

- An initial render pass from the cache (which may be expired)
- A second render pass from the server (which is always fresh)

This caching technique allows for longer cache times (90 minutes by default) while ensuring that users always see the latest content.

Servers may observe [conditional request headers](#conditional-requests) to skip the second render pass if the underlying data has not changed, making revalidation requests very inexpensive.

That said, the following changes were made:

- ⚠️ After rendering stale content from the cache, Unpoly now automatically renders a second time with fresh content from the server (*revalidation*).

  To disable cache revalidation, set `up.fragment.config.navigateOptions.revalidate = false`.
- The cache now distinguishes between *expiration* (marking cache entries as stale) and *eviction* (completely erasing cache entries).
- The old concept of *clearing* has been replaced with *expiring* the cache:
  - The configuration `up.network.config.clearCache` has been renamed to `up.network.config.expireCache`.
  
    It can be used to configure which requests should expire existing cache entries.

    By default Unpoly will expire the entire cache after a request with an [unsafe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) HTTP method.
  - The configuration `up.network.config.cacheExpiry` has been renamed to `up.network.config.cacheExpireAge`.
  - The default for `up.network.config.expireCacheAge` is now 15 seconds (down from 5 minutes in Unpoly 2).
    
    ⚠️ If you have previously configured a custom value for `up.network.config.clearCache` (now `.expireCache`) to
      prevent the display of stale content, check if that configuration is still needed with [revalidation](/caching#revalidation).
  - The response header `X-Up-Clear-Cache` has been renamed to `X-Up-Expire-Cache`.
  - The option to keep a cache entry through `X-Up-Clear-Clache: false` has been removed.
  - The function `up.cache.clear(pattern)` has been renamed to `up.cache.expire(pattern)`.
  - The attribute `[up-clear-cache]` has been renamed to `[up-expire-cache]`.
  - The option `up.render({ clearCache })` has been renamed to `{ expireCache }`.
  - The option `up.request({ clearCache })` has been renamed to `{ expireCache }`.
- Features have been added to evict cache entries:
  - New configuration `up.network.config.expireCache` lets you define which requests evict existing cache entries. 
  - ⚠️ By default Unpoly will expire, but not evict any cache entries when a request is made.

    To restore Unpoly 2's behavior of evicting the entire cache after a request with an [unsafe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) HTTP method, configure the following:

    ```js
    up.network.config.evictCache = (request) => !request.isSafe()
    ```
  - New configuration `up.network.config.cacheEvictAge` (default is 90 minutes).
  - Added response header `X-Up-Evict-Cache`.
  - Added function `up.cache.evict(pattern)`.
  - Added configuration `up.network`
- Cache revalidation happens after `up.render()` settles.

  To run code once all render passes have finished, pass an `{ onFinished }` callback or `await up.render(..).finished`.
- Cache revalidation can be controlled through a render option `{ revalidate }` or
  a link attribute `[up-revalidate]`.
  
  The default option value is `{ revalidate: 'auto' }`, which revalidates if `up.fragment.config.autoRevalidate(response)` returns `true`. By default this configuration returns `true` if a response is older than `up.network.config.expireAge`.


#### Conditional requests

- Unpoly now supports [conditional requests](/conditional-requests). This allows your server to skip rendering and send an empty response if the underlying data has not changed. 

  Common use cases for conditional requests are [polling](/#up-poll) or [cache revalidation](#cache-revalidation). 
- Unpoly now remembers the standard `Last-Modified` and `E-Tag` headers a fragment was delivered with.
  
  Header values are set as `[up-time]` and `[up-etag]` attributes on updated fragment. Users can also set these attributes manually in their views, to use different ETags for individually reloadable fragments.
- When a fragment is reloaded (or polled), these properties are sent as `If-Modified-Since` or `If-None-Match` request headers.
- Server can render nothing by sending status `304 Not Modified` or status `204 No Content`.
- Reloading is effectively free with conditional request support.
- ⚠️ The header `X-Up-Reload-From-Time` was deprecated in favor of the standard `If-Modified-Since`.



#### Handling connection loss

Unpoly lets you handle many types of [connection problems](/network-issues). The objective is to keep your application accessible as the user's connection becomes slow, [flaky](/network-issues#flaky-connections) or [goes away entirely](/network-issues#disconnects).

Unpoly 3 lets you handle [connection loss](/network-issues#connection-loss) with an `{ onOffline }` or `[up-on-offline]` callback:

```html
<a href="..." up-on-offline="if (confirm('You are offline. Retry?')) event.retry()">Post bid</a>
```

You may also configure a global handler by listening to `up:request:offline` (renamed from `up:request:fatal`):
:

```js
up.on('up:fragment:offline', function(event) {
  if (confirm('You are offline. Retry?')) event.retry()
})
```

You may also do something other than retrying, like substituting content:

```js
up.on('up:fragment:offline', function(event) {
  up.render(event.renderOptions.target, { content: "You are offline." })
})
```

#### Handling ["Lie-Fi"](https://www.urbandictionary.com/define.php?term=lie-fi)

Often our device reports a connection, but we're *effectively offline*:

- Smartphone in EDGE cell
- Car drives into tunnel
- Overcrowded Wi-fi with massive packet loss

Unpoly 3 handles Lie-Fi with timeouts:

- ⚠️ All requests now have a default timeout of 90 seconds (`up.network.config.timeout`).
- Timeouts will now trigger `onOffline()` and use your offline handling.
- Customize timeouts per-request by passing a `{ timeout }` option or setting an `[up-timeout]` attribute.



#### Expired pages remain accessible while offline

With Unpoly 3, apps remain partially accessible when the user loses their connection: 

- Cached content will remain navigatable for 90 minutes.
- Revalidation will fail, but not change the page and trigger `onOffline()`.
- Clicking uncached content will not change the page and trigger `onOffline()`.

While Unpoly 3 lets you handle disconnects, it's not full "offline" support:

- To fill up the cache the device must be online for the first part of the session (warm start)
- The cache is still in-memory and dies with the browser tab

For a comprehensive offline experience (cold start) we recommend a [service worker](https://web.dev/offline-fallback-page/) or a canned solution like [UpUp](https://www.talater.com/upup/) (no relation to Unpoly).


#### More control about the progress bar

- You may now demote requests to the background by using `{ background: true }` or `[up-background]` when rendering or making a request
  
  Background requests are de-prioritized when the network connection is [saturated](/up.network.config#config.concurrency).
  
  Background requests don't trigger `up:network:late` or show the progress bar.
- [Polling](/up-poll) requests are demoted to the background automatically.
- [Preload](/up-preload) requests are demoted to the background automatically.
- You may now set a custom response times over which a request is considered late by using `{ badResponseTime }` or `[up-bad-response-time]` when rendering or making a request
  
  This allows you to delay the `up:network:late` event or show the progress bar later or earlier.
  
  The default `up.network.config.badResponseTime` can now also be a `Function(up.Request): number` instead of a constant number value.


#### Caching of optimizing responses

Unpoly has always allowed server-side code to inspect [request headers](/up.protocol) to [customize or shorten responses](/optimizing-responses), e.g. by omitting content that isn't [targeted](/targeting-fragments). Unpoly makes some changes how optimized responses are [cached](/caching):

- ⚠️ Requests with the same URL and HTTP method, but different header values (e.g. `X-Up-Target`) now share the same cache entry.
- ⚠️ If a server optimizes its response, all request headers that influenced the response should be listed in a `Vary` response header.

  A `Vary` header tells Unpoly to partition its [cache](/caching) for that URL so that each request header value gets a separate cache entries.

  You can set a `Vary` header manually from your server-side code. You may also be using a library like [unpoly-rails](https://github.com/unpoly/unpoly-rails) that sets the `Vary` header automatically.
- Sending `Vary` headers also prevents browsers from using an optimized response for full page loads.
- The configuration `up.network.config.requestMetaKeys` has been removed.


#### Support for Unicode characters in HTTP headers

- When Unpoly writes JSON into HTTP request headers, high ASCII characters are now escaped. This is due to a limitation in HTTP where only 7-bit characters can be transported safely through headers.
- The header `X-Up-Title` is now a JSON-encoded string, surrounded by JSON quotes. 

#### Detecting failure when the server sends wrong HTTP status

Unpoly requires servers to send an HTTP error code to signal failure. E.g. an invalid form should render with HTTP 422 (Unprocessable Entity).

However, Misconfigured server endpoints may send HTTP 200 (OK) for everything. This is not always easy to fix, e.g. when screens are rendered by libraries outside your control. Unpoly 3 addresses this with the following changes:

- Listeners to `up:fragment:loaded` can now can force failure by setting `event.renderOptions.fail = true`.
- You may use `up.network.config.fail` to configure a global rule for when a response is considered to have failed.

#### Various changes

- You may now pass `FormData` values to all functions that also accept an `up.Params` object.
- When a request is scheduled and aborted within the same microtask, it no longer touches the network.
- `up.network.config.concurrency` now defaults to 6 (3 while reducing requests)
- ⚠️ When calling `up.request()` manually, the request is now only associated with the current layer if either `{ origin, layer, target }` option was passed.

  If neither of these options are given, the request will send no headers like `X-Up-Target` or `X-Up-Mode`.
  Also, since the request is no longer associated with the layer, it will not be aborted if the layer closes.
- The `up.network.isIdle()` function has been deprecated. Use `!up.network.isBusy()` instead.
- The events `up:request:late` and `up:request:recover` were renamed to `up:network:late` and `up:network:recover` respectively. We may eventually re-introduce `up:request:late` and `up:request:recover` to support tracking individual requests (but not now).
- New method `up.Request#header()` to access a given header.
- The method `up.Response#getHeader()` was renamed to `up.Response#header()`. It is now stable.
- The property `up.Response.prototype.request` is now internal API and should no longer be used.
- Disabling the cache with `up.network.config.cacheSize = 0` is no longer supported. To disable automatic caching during navigation, set `up.fragment.config.navigateOptions.cache = false` instead.



### Utility functions

#### Support for [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) objects

- `up.util.map()` now accepts any iterable object.
- `up.util.each()` now accepts any iterable object.
- `up.util.filter()` now accepts any iterable object.
- `up.util.every()` now accepts any iterable object.
- `up.util.findResult()` now accepts any iterable object.
- `up.util.flatMap()` now accepts any iterable object.

#### Deprecated functions in favor of native browser API

- Deprecated `up.util.assign()`. Use `Object.assign()` instead.
- Deprecated `up.util.values()`. Use `Object.values()` instead.



### DOM helpers

#### Deprecated functions in favor of native browser API

- Deprecated `up.element.remove()`. Use `Element#remove()` instead.
- Deprecated `up.element.matches()`. Use `Element#matches()` instead.
- Deprecated `up.element.closest()`. Use `Element#closest()` instead.
- Deprecated `up.element.replace()`. Use `Element#replaceWith()` instead.
- Deprecated `up.element.all()`. Use `document.querySelectorAll()` or `Element#querySelectorAll()` instead.
- Deprecated `up.element.toggleClass()`. Use `Element#classList.toggle()` instead.
- Deprecated `up.element.isDetached()`. Use `!Element#isConnected` instead.

#### Various changes

- ⚠️ `up.element.booleanAttr()` now returns `true` for a attribute value that is present but non-boolean.

  For example, the attribut value `[up-instant='up-instant']` is now considered `true`.

  Previously it returned `undefined`.



### Animation

- ⚠️ [Custom animation](/up.animation) and [transition](/up.transition) functions must now settle synchronously when observing `up:motion:finish`.


### Reworked documentation

In our ongoing efforts to evolve Unpoly's documentation from an API reference to a guide, we have added several documentation pages:

- [Targeting fragments](/targeting-fragments)
- [Target derivation](/target-derivation)
- [Skipping unnecessary rendering](/skipping-rendering)
- [Render hooks](/render-hooks)
- [Aborting requests](/aborting-requests)
- [Handling failed responses](/failed-responses)
- [Attaching data to elements](/data)
- [Optimizing responses](/optimizing-responses)
- [Controlling focus](/focus)
- [Validating forms](/validation)
- [Disabling forms while working](/disabling-forms)
- [Dependent fields](/dependent-fields)
- [Watch options](/watch-options)
- [Caching](/caching)
- [Handling network issues](/network-issues)
- [Conditional requests](/conditional-requests)
- [Loading indicators](/loading-indicators)
- [Tracking page views](/analytics)
- [Updating history](/updating-history)
- [Restoring history](/restoring-history)
- [Predefined animations](/predefined-animations)
- [Predefined transitions](/predefined-transitions)

All existing documentation pages from Unpoly 2 remain available:

- [Handling all links and forms](/handling-everything)
- [Tuning the scroll behavior](/scroll-tuning)
- [Migrating legacy JavaScripts](/legacy-scripts)
- [Scrolling](/scrolling)
- [Navigation](/navigation)
- [Layer terminology](/layer-terminology)
- [Layer option](/layer-option)
- [Opening overlays](/opening-overlays)
- [Subinteractions](/subinteractions)
- [Closing overlays](/closing-overlays)
- [Customizing overlays](/customizing-overlays)
- [Layer context](/context)
- [Motion tuning](/motion-tuning)
- [URL patterns](/url-patterns)
- [Working with strict Content Security Policies](/csp)


### Migration polyfills

- New polyfills for almost all functionality that was deprecated in this version 3.0.0. 
- When [`unpoly-migrate.js`](/changes/upgrading) migrates a renamed attribute, the old attribute is now removed.
- Fix a up where `unpoly-migrate.js` would not rewrite the deprecated `{ reveal }` option when navigating.
- ⚠️ The legacy option `up.render({ data })` and `up.request({ data })` is no longer renamed to `{ params }` (renamed in Unpoly 0.57).

  Unpoly now uses the `{ data }` option to [preserve element data through reloads](/data#preserving-data-through-reloads).

### Framework

- A new experimental event `up:framework:booted` is emitted when the framework has booted and the initial page has been compiled.
- All errors thrown by Unpoly now inherit from `up.Error`.
  
  This makes it easier to detect the type of exception in a `catch()` clause:

  ```js
  try {
    await up.render('main', { url: '/foo' })
  } catch (exception) {
    if (exception instanceof up.Error) {
      // handle Unpoly exception
    } else {
      // re-throw unhandled exception
      throw exception
    }
  }

### Dropped support for legacy technologies

#### Dropped support for IE11 and legacy Edge

⚠️ Unpoly 3 drops support for Internet Explorer 11 and [legacy Edge (EdgeHTML)](https://en.wikipedia.org/wiki/EdgeHTML).

Unlike other breaking changes, support cannot be restored through [`unpoly-migrate.js`](/changes/upgrading). If you need to support IE11, use [Unpoly 2](https://v2.unpoly.com).

The new compatibility targets for Unpoly 3 are major [evergreen](https://stephenweiss.dev/evergreen-browsers) browsers (Chrome, Firefox, Edge) as well as last two major versions of Safari / Mobile Safari.


#### ES5 build has been replaced with an ES6 build

⚠️ Unpoly no longer ships with an version transpiled down to ES5 (`unpoly.es5.js`). Instead there is now a ES6 version (`unpoly.es6.js`).

Since most modern browsers now have great JavaScript support, we encourage you to try out the untranspiled distribution (`unpoly.js`), which has the smallest file size.


#### jQuery helpers are deprecated

jQuery helper functions have been moved to [`unpoly-migrate.js`](/changes/upgrading):

- The function `up.$compiler()` was deprecated.
- The function `up.$macro()` was deprecated.
- The function `up.$on()` was deprecated.


#### Unpoly 2 maintenance is ending

- With the release of Unpoly we're ending maintenance of Unpoly 2. Expect little to no changes to Unpoly 2 in the future.
- GitHub issues that have been fixed in Unpoly 3 will be closed.
- The legacy documentation for Unpoly 2.x has been archived to [v2.unpoly.com](https://v2.unpoly.com).
- The code for Unpoly 2 can be found in the [`2.x-stable`](https://github.com/unpoly/unpoly/tree/2.x-stable) branch.



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
  - The `{ value }` property is the [overlay result value](/closing-overlays#overlay-result-values).
  - The `{ origin }` property is the element that caused the element to close.
- When an overlay is [closed](/closing-overlays) its [result value](/closing-overlays#overlay-result-values) is now [logged](/up.log) for easier debugging.
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

- Fix a bug where the value was lost when clicking on a descendant element of an `a[up-accept]` or `a[up-dismiss]`.


2.5.0
-----

This is a maintenance release while we're working on the next major feature update.

- The event `up:form:submit` has a new property `{ submitButton }`. It points to the `<button>` or `<input>` element used to submit the form, if the form was submitted with a button.
- The event `up:form:submit` has a new property `{ params }`. It points to an editable `up.Params` object for the form's data payload.
- Fix a bug where `[up-validate]` would use form attributes intended for the final form submission, like `[up-scroll]` or `[up-confirm]`.
- Fix a bug where an [`.up-current`](/a.up-current) class would sometimes match an `[up-alias]` pattern in the middle of the current URL. This happened when `[up-alias]` contained multiple patterns and the last pattern is a prefix (e.g. `/foo/*`).
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

When your [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) disallows `eval()`, Unpoly cannot directly run JavaScript code in HTML attributes. This affects `[up-on-...]` attributes like [`[up-on-loaded]`](/a-up-follow#up-on-loaded) or [`[up-on-accepted]`](/a-up-layer-new#up-on-accepted).

Unpoly 2.3 lets your work around this by prefixing your callback with a [CSP nonce](https://content-security-policy.com/nonce/):

```html
<a href="/path" up-follow up-on-loaded="nonce-kO52Iphm8B alert()">Click me</a>
```

Users of the [unpoly-rails](https://github.com/unpoly/unpoly-rails) gem can insert the nonce using the `up.safe_callback` helper:

```erb
<a href="/path" up-follow up-on-loaded="<%= up.safe_callback('alert()') %>">Click me</a>
```

Also see our new [guide to working with strict Content Security Policies](/csp).

### New options for existing features

- `a[up-follow]` links may now pass the fragment's new [inner HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) using an `[up-content]` attribute. To pass the outer HTML, use the `[up-fragment]` attribute.
- New option `{ solo }` for `up.render()` and `up.request()` lets you quickly abort all previous requests before making the new request. This is a default [navigation option](/navigation).
- New attribute `[up-solo]` for `a[up-follow]` lets you quickly abort all previous requests before making the new request. This is a default [navigation option](/navigation).
- The `{ clearCache }` option for `up.render()` and `up.request()` now accepts a boolean value, a [URL pattern](/url-patterns) or a function.


### New properties for request-related events

Request-related events now expose additional context about the event. This affects the events `up:fragment:loaded`, `up:request:load`, `up:request:loaded`, `up:request:aborted`, `up:request:fatal`.

The link or form element that caused the request can now be access through `event.origin`.

The layer associated with the request can now be accessed through `event.layer`. If the request is intended to update an existing fragment, this is that fragment's layer. If the request is intended to [open an overlay](/opening-overlays), the associated layer is the future overlay's parent layer.


### Various changes

- Fix a bug with [`a[up-back]`](/a-up-back) where Unpoly would follow the link's default `[href]` instead of visiting the previous URL.
- Fix a bug where the [URL pattern](/url-patterns) `*` would not match most URLs when the current location is multiple directories deep.
- When a target cannot be found and a fallback target is used, Unpoly now [logs](/up.log) a message.
- When a [compiler](/up.compiler) is registered after [booting](/up.boot), Unpoly now explains in the log that the compiler will only run for fragments inserted in the future.
- `up.observe()` and `input[up-observe]` now [log](/up.log) a warning when trying to observe a field without a `[name]` attribute.
- `up.browser.loadPage()` has been renamed to `up.network.loadPage()`.
- `up.browser.isSupported()` has been renamed to `up.framework.isSupported()`.


1.0.3
-----

This maintenance release addresses two issues that were introduced in version 1.0.0:

- Unpoly can now be loaded with `<script defer>`. This can be used to load your scripts without blocking the DOM parser.
- Unpoly can now be loaded with `<script type="module">`. This can be used deliver a modern JS build to modern browsers only.


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
- Links with an [`[up-instant]`](/a-up-instant) attribute are now followed automatically, even if they don't also have an [`[up-follow]`](/a-up-follow) attribute.


1.0.1
-----

This is a maintenance release for Unpoly 1. Expect little to no additional changes for this legacy version. New features will only be added to Unpoly 2.

- `up.request()` will now send Unpoly's version number as an `X-Up-Version` request header. Since `X-Up-Target` is optional in Unpoly 2, server-side integration libraries can look for `X-Up-Version` to reliably detect a fragment update for both Unpoly 1 and 2.
- Fix a bug where the Unpoly banner would still be printed to the development console when `up.log.config.banner = false` is set. (fix by @adam12)


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



1.0.0
-----

For six years Unpoly has been released under a 0.x version number. To establish the maturity and stability of the project, we're releasing today's version as 1.0.0.

There are only three changes from 0.62.1:

- Fix a bug where `up.util.escapeHTML()`` would not escape single quotes.
- Unpoly will no longer wait a JavaScript execution task to boot after `DOMContentLoaded`. This may improve the stability of test suites that previously interacted with the page too soon.
- You may now disable the Unpoly banner in the development console with `up.log.config.banner = false`. (change by @hfjallemark).

This is the last release of the 0.x API line. We're tracking its code in the [`1.x-stable`](https://github.com/unpoly/unpoly/tree/1.x-stable), but expect little to no changes in the future.

The next release will be [Unpoly 2](https://triskweline.de/unpoly2-slides). It will include major (but mostly backwards compatible) renovations to its API, unlocking many use cases that were not possible with Unpoly 1.


0.62.1
------

This is another maintenance release while we're finishing [the next major version of Unpoly](https://groups.google.com/forum/#!topic/unpoly/FDdVjxbjNLg).

Community members were involved in every change of this release:

- [`up.submit()`](/up.submit) has a new options `{ params }`. It may be used to pass extra form [parameters](/up.Params) that will be submitted in addition to the parameters from the form. (fix by @robinvdvleuten)
- [`a[up-modal]`](/a-up-modal) will now honor an [`[up-cache]`](/a-up-target#up-cache) attribute on the same link. (fix by @adam12)
- Prevent destructor function from being called twice if [`up.destroy()`](/up.destroy) is called twice with the same element (reported by @kratob)
- On devices that don't show a vertical scrollbar, users can no longer scroll the underlying page while a [modal overlay](/up.modal) is open. (reported by @msurdi)


0.62.0
------

This release backports a number of accessibility improvements from [the next major version of Unpoly](https://groups.google.com/forum/#!topic/unpoly/FDdVjxbjNLg).
We encourage everyone to upgrade to this release in order to better support users with visual impairments.

The following changes are included:

- Links with an [`[up-instant]`](/a-up-instant) attribute can now be followed with the keyboard.
- Fragments that are being [destroyed](/up.destroy) now get an [`[aria-hidden=true]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_aria-hidden_attribute)
  attribute while its disappearance is being animated. When a fragment is being swapped with a new version, the old fragment version is also
  given `[aria-hidden=true]` while it's disappearing.
- [Modal dialogs](/up.modal) now get an [`[aria-modal=true]`](https://a11ysupport.io/tech/aria/aria-modal_attribute) attribute.

The next major version of Unpoly will include additional accessibility improvements. In particular the
new modal ("layer") implementation will implement all best practices for accessible dialogs.


0.61.1
------

This is a maintenance release while we're getting ready for [the next major version of Unpoly](https://groups.google.com/forum/#!topic/unpoly/FDdVjxbjNLg).

- Fix a bug where [`up.destroy()`](/up.destroy) wouldn't clean up the global jQuery cache. This is only relevant when using Unpoly together with jQuery.
- Fields outside a `<form>` are now recognized when they have a matching [form] attribute (fixes #85)
- [`up.form.fields()`](/up.form.fields) now accepts a jQuery collection as a first argument, as was already documented.


0.61.0
------

This release makes it easier to migrate to a recent version of Unpoly when your app still depends on jQuery.
Unpoly dropped its jQuery dependency with version 0.60.0, but retains optional jQuery support through functions like
[`up.$compiler()`](/up.$compiler) and [`up.$on()`](/up.$on). All Unpoly functions that take a native element as an
argument may also be called with a jQuery collection as an argument.

The following changes to the optional jQuery support were implemented:

- In an ES6 build pipeline, Unpoly's jQuery support no longer requires `window.jQuery` to be defined before
  Unpoly is imported into the build. You still need to define `window.jQuery`, but you may do so at any time in your
  scripts, regardless of load order.
- jQuery support functions like [`up.$compiler()`](/up.$compiler) now fail with a helpful message if the developer
  forgets to define `window.jQuery`.

This release also exposes some convenience functions and selectors:

- New experimental function [`up.event.halt()`](/up.event.halt). It prevents the event from bubbling up the DOM.
  It also prevents other event handlers bound on the same element. It also prevents the event's default action.
- New experimental function [`up.form.fields()`](/up.form.fields).  It returns a list of form fields within the given element.
- The selector [`form[up-validate]`](/up-validate) is now supported. It performs
  [server-side validation](/up-validate) when any fieldset within this form changes. Previously only the variant
  `input[up-validate]` was supported.


0.60.3
------

[`[up-validate]`](/up-validate) again recognizes the `[up-fieldset]` attribute to find the form fragment
that should be replaced with validation results.

In the example below, changing the `email` input would only validate the first fieldset:

```html
<form action="/users" id="registration">

  <div up-fieldset>
    Validation message
    <input type="text" name="email" up-validate />
  </div>

  <div up-fieldset>
    Validation message
    <input type="password" name="password" up-validate />
  </div>

</form>
```


0.60.2
------

- When [submitting](/up-form) a form with a GET method, any query parameters in the form's `[action]` URL are now discarded.
  This matches the standard browser behavior when submitting a form without Unpoly.
- When [submitting](/up-form) a form with a POST method, any query parameters in the form's `[action]` URL are now kept in the
  URL, instead of being merged into the form's data payload.
  This matches the standard browser behavior when submitting a form without Unpoly.
- New experimental function [`up.Params.stripURL(url)`](/up.Params.stripURL).
  It returns the given URL without its [query string](https://en.wikipedia.org/wiki/Query_string).


0.60.1
------

- When user does not confirm an [`[up-confirm]`](/a-up-target#up-confirm) link,
  the link's `.up-active` class is now removed (fixes #89)


0.60.0
------

This is a major update with some breaking changes.

### Highlights

- jQuery is no longer required! Unpoly now has zero dependencies.
- New `up.element` helpers to complement [native `Element` methods](https://www.w3schools.com/jsref/dom_obj_all.asp). You might not even miss jQuery anymore.
- Vastly improved performance on slow devices.
- Utility functions that work with arrays and array-like values have been greatly improved.
- The `up.util` module now plug the worst emissions in JavaScript's standard library: Equality-by-value, empty-by-value and shallow-copy. Your own objects may hook into those protocols.
- You may define a padding when [revealing](/up.reveal).
- Smooth [scrolling](/up.scroll) now mimics [native scroll behavior](https://hospodarets.com/native_smooth_scrolling).
- Fixed many positioning issues with [popups](/up.popup) and [tooltips](/up.tooltip).
- Several modules have been renamed to match the pattern `up.thing.verb()`. `up.dom` is now `up.fragment`, `up.bus` is now `up.event`, `up.layout` is now `up.viewport`.

Details below.


### jQuery is no longer required

jQuery no longer required to use Unpoly. That means Unpoly no longer has any dependencies!

Due to its use of native DOM APIs, Unpoly is now a lot faster. Like, a **lot**. Ditching jQuery also saves you 30 KB of gzipped bundle size and speeds up your own code.

#### Migrating apps that use jQuery

Effort has been made to ensure that migrating to this version is smooth for existing apps that use jQuery.

All Unpoly functions that accept element arguments will accept both native elements and jQuery collections.

You will need to prefix some function calls with `$` to have your callbacks called with jQuery collections instead of native elements:

- The `up.compiler()` callback now receives a [native element](https://developer.mozilla.org/en-US/docs/Web/API/Element) instead of a jQuery collection. For the old behavior, use `up.$compiler()`.
- The `up.macro()` callback now received a [native element](https://developer.mozilla.org/en-US/docs/Web/API/Element) instead of a jQuery collection. For the old behavior, use `up.$macro()`.
- The event handler passed to `up.on()` now receives an element instead of a jQuery collection. For the old behavior, use `up.$on()`.

Finally, all Unpoly events (`up:*`) are now triggered as native events that can be received with [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener). You may continue to use jQuery's [`jQuery#on()`](http://api.jquery.com/on/) to listen to Unpoly events, but you need to access custom properties through `event.originalEvent`.

Also know that if you use jQuery's `$.fn.trigger()` to emit events, these events are not received by native event listeners (including Unpoly). Use `up.emit()` instead to trigger an event that can be received by both native listeners and jQuery listeners.

See below for detailed changes.


### New DOM helpers

A new, experimental `up.element` module offers convience functions for DOM manipulation and traversal.

It complements [native `Element` methods](https://www.w3schools.com/jsref/dom_obj_all.asp) and works across all [supported browsers](/up.browser) without polyfills.

| `up.element.first()` |  Returns the first descendant element matching the given selector.|
| `up.element.all()` |  Returns all descendant elements matching the given selector.|
| `up.element.subtree()` |  Returns a list of the given parent's descendants matching the given selector. The list will also include the parent element if it matches the selector itself.|
| `up.element.closest()` |  Returns the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.|
| `up.element.matches()` |  Matches all elements that have a descendant matching the given selector.|
| `up.element.get()` |  Casts the given value to a native [Element](https://developer.mozilla.org/en-US/docs/Web/API/Element).|
| `up.element.toggle()` |  Display or hide the given element, depending on its current visibility.|
| `up.element.toggleClass()` |  Adds or removes the given class from the given element.|
| `up.element.hide()` |  Hides the given element.|
| `up.element.show()` |  Shows the given element.|
| `up.element.remove()` |  Removes the given element from the DOM tree.|
| `up.element.replace()` |  Replaces the given old element with the given new element.|
| `up.element.setAttrs()` |  Sets all key/values from the given object as attributes on the given element.|
| `up.element.affix()` |  Creates an element matching the given CSS selector and attaches it to the given parent element.|
| `up.element.createFromSelector()` |  Creates an element matching the given CSS selector.|
| `up.element.createFromHtml()` |  Creates an element from the given HTML fragment.|
| `up.element.toSelector()` |  Returns a CSS selector that matches the given element as good as possible.|
| `up.element.setAttrs()` |  Sets all key/values from the given object as attributes on the given element.|
| `up.element.booleanAttr()` |  Returns the value of the given attribute on the given element, cast as a boolean value.|
| `up.element.numberAttr()` |  Returns the value of the given attribute on the given element, cast to a number.|
| `up.element.jsonAttr()` |  Reads the given attribute from the element, parsed as [JSON](https://www.json.org/).|
| `up.element.style()` |  Receives [computed CSS styles](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle) for the given element.|
| `up.element.styleNumber()` |  Receives a [computed CSS property value](https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle) for the given element, casted as a number.|
| `up.element.setStyle()` |  Sets the given CSS properties as inline styles on the given element.|
| `up.element.isVisible()` |  Returns whether the given element is currently visible.|
| `:has()` |  A non-standard [pseudo-class](https://developer.mozilla.org/en-US/docs/Learn/CSS/Introduction_to_CSS/Pseudo-classes_and_pseudo-elements) that matches all elements that have a descendant matching the given selector. |

### Events

- The `up.bus` module has been renamed to `up.event`. We want to normalize Unpoly's API to the pattern `up.thing.verb()` in the future.
- All Unpoly events (`up:*`) are now triggered as native events that can be received with [`Element#addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener). You may continue to use jQuery's [`jQuery#on()`](http://api.jquery.com/on/) to listen to Unpoly events, but you need to access custom properties from `event.originalEvent`.
- Properties named `event.$target` and `event.$element` have been removed from *all* Unpoly events.
  Use the standard `event.target` to retrieve the element on which the element was [emitted](/up.emit).
- `up.on()` may now bind to a given element by passing it as an (optional) first argument:

  ```
  up.on(element, '.button', 'click', (event) => { ... })
  ```

  You may use this for [event delegation](https://davidwalsh.name/event-delegate).
- The event handler passed to `up.on()` now receives an element instead of a jQuery collection:

  ```
  up.on('click', (event, element) => {
    alert("Clicked on an " + element.tagName)
  })
  ```

  For the old behavior, use `up.$on()`.
- `up.emit()` may now trigger an event on a given element by passing the element as an (optional) first argument:

  ```
  up.emit(element, 'app:user:login', { email: 'foo@example.com' })
  ```
- `up.emit()` option `{ message }` is now `{ log }`.
- `up.emit()` no longer logs by default. You can enable the old efault message with `{ log: true }`.
- `up.event.nobodyPrevents()` option `{ message }` is now `{ log }`.
- The experimental function `up.reset()` was removed without replacement.
- The experimental event `up:framework:reset` was removed without replacement.



### Custom JavaScript

- [Compilers](/up.compiler) may again return an array of destructor functions. The previous deprecation was removed.
- The `up.compiler()` callback now receives a [native element](https://developer.mozilla.org/en-US/docs/Web/API/Element) instead of a jQuery collection:

  ```
  up.compiler('.button', function(button) {
    alert("We have a new button with class " + button.className)
  })
  ```

  For the old behavior, use `up.$compiler()`.
- The `up.macro()` callback now received a [native element](https://developer.mozilla.org/en-US/docs/Web/API/Element) instead of a jQuery collection:

  ```
  up.compiler('a.fast-link', function(element) {
    element.setAttribute('up-preload', 'up-preload')
    element.setAttribute('up-instant', 'up-instant')
  })
  ```

  For the old behavior, use `up.$macro()`.



### Forms

- `up:form:submit` no longer has a `{ $form }` property. The event is now [emitted](/up.emit)
  on the form that is being submitted.
- `up.observe()` now accepts a single form field, multiple fields,
  a `<form>` or any container that contains form fields.
  The callback is called once for each change in any of the given elements.
- The callback for `up.observe()` now receives the arguments `(value, name)`, where
  `value` is the changed field value and `name` is the `[name]` of the field element:

  ```
  up.observe('form', function(value, name) {
    console.log('The value of %o is now %o', name, value);
  });
  ```

  The second argument was previously the observed input element as a jQuery collection.
- `up.observe()` now accepts a `{ batch: true }` option to receive all changes
  since the last callback in a single object:

  ```
  up.observe('form', { batch: true }, function(diff) {
    console.log('Observed one or more changes: %o', diff);
  });
  ```
- The default `up.form.config.validateTargets` no longer includes the
  selector `'[up-fieldset]'`.


### Animation

- CSS property names for custom [animations](/up.animation) and [transitions](/up.transition) must be given in `kebab-case`.
  `camelCase` properties are no longer supported.


### Fragment update API

- The module `up.dom` has been renamed to `up.fragment`. We want to normalize Unpoly's API to the pattern `up.thing.verb()` in the future.
- The experimental function `up.all()` has been removed without replacement
- The function `up.first()` has been renamed to `up.fragment.first()` to not be confused
  with the low-level `up.element.first()`.
- The event `up:fragment:destroy` has been removed without replacement. This event was previously emitted before a fragment was removed. The event [`up:fragment:destroyed`](/up:fragment:destroyed) (emitted after a fragment was removed), remains in the API.
- The `up:fragment:destroyed` event no longer has a `{ $element }` property. It now has a `{ fragment }` property that contains the detached element. Like before, it is emitted on the former parent of the destroyed element.
- The properties for the `up:fragment:keep` event have been renamed.
- The properties for the `up:fragment:kept` event have been renamed.
- The properties for the `up:fragment:inserted` event have been renamed.
- The properties for the `up:fragment:destroyed` event have been renamed.


### Utility functions

The `up.util` module now plug the worst emissions in JavaScript's standard library: Equality-by-value, empty-by-value, shallow copy:

- New experimental function `up.util.isEqual()`. It returns whether the given arguments are equal by value.
- New experimental property `up.util.isEqual.key`.
  This property contains the name of a method that user-defined classes
  may implement to hook into the `up.util.isEqual()` protocol.
- `up.util.isBlank()` now returns false for objects with a constructor.
- New experimental property `up.util.isBlank.key`. This property contains the name of a method that user-defined classes may implement to hook into the `up.util.isBlank()` protocol.
- New experimental property `up.util.copy.key`. This property contains the name of a method that user-defined classes may implement to hook into the `up.util.copy()` protocol.

More utility functions to have been added to work with lists:

- New experimental function `up.util.findResult()`.
  It consecutively calls the given function which each element in the given list and
  returns the first truthy return value.
- New experimental function `up.util.flatten()`. This flattens the given list a single level deep.
- New experimental function `up.util.flatMap()`. This maps each element using a mapping function, then flattens the result into a new array.

Some list functions have been renamed to names used in the standard `Array` API:

- `up.util.all()` was renamed to `up.util.every()` to match the standard [`Array#every()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every), and to be less confusing with `up.element.all()`.
- `up.util.any()` was renamed to `up.util.some()` to match the standard
  [`Array#some()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some).
- `up.util.select()` was renamed to `up.util.filter()` to match the standard
  [`Array#filter()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter).
- `up.util.detect()` was renamed to `up.util.find()` to match the standard
  [`Array#find()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find).

All functions that worked for arrays now also work for array-like values:

- New experimental function `up.util.isList()`. It returns whether the given argument is an array-like value, like an `Array` or a
  [`NodeList`](https://developer.mozilla.org/en-US/docs/Web/API/NodeList).
- `up.util.reject()` now works for all [array-like values](/up.util.isList), not just arrays.
- `up.util.filter()` now works for all [array-like values](/up.util.isList), not just arrays.
- `up.util.find()` now works for all [array-like values](/up.util.isList), not just arrays.
- `up.util.some()` now works for all [array-like values](/up.util.isList), not just arrays.
- `up.util.every()` now works for all [array-like values](/up.util.isList), not just arrays.

And some minor changes:

- `up.util.nextFrame()` has been renamed to `up.util.task()`.
- `up.util.setTimer()` has been renamed to `up.util.timer()`.
- `up.util.toArray() now returns its unchanged argument if the argument is already an array.
- `up.util.copy()` now works with `Date` objects.
- `up.util.isBoolean()` is now stable
- `up.util.escapeHtml()` is now stable
- `up.util.isJQuery()` now returns `false` if no jQuery is loaded into the `window.jQuery` global
- `up.util.unresolvablePromise()` was removed without replacement.
- `up.util.trim()` has been removed without replacement. Use the standard
  [`String#trim()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim) instead.
- `up.util.parseUrl()` now returns the correct `{ hostname }`, `{ protocol }` and `{ pathname }` properties on IE11.
- `up.util.selectorForElement()` is now `up.element.toSelector()`


### Scrolling Viewports

- The `up.layout` module has been renamed to `up.viewport`. We want to normalize Unpoly's API to the pattern `up.thing.verb()` in the future.
- Smooth [scrolling](/up.scroll) now mimics [native scroll behavior](https://hospodarets.com/native_smooth_scrolling):
  - `up.scroll()` no longer takes a `{ duration }` or `{ easing }` option.
  - `up.scroll()` now takes a `{ behavior }` option. Valid values are `auto` (no animation) and `smooth` (animates the scroll motion).
  - You may control the pace of `{ behavior: 'smooth' }` by also passing a `{ speed }` option`.
  - New config property `up.viewport.scrollSpeed`. This sets the default speed for smooth scrolling. The default value (`1`) roughly corresponds to the default speed of Chrome's native smooth scrolling.
- Options for `up.reveal()` have been changed:
  - Options `{ duration }` and `{ easing }` have been removed.
  - New option `{ padding }` to pass the desired padding between the revealed element and the closest [viewport](/up.viewport) edge (in pixels).
  - New option `{ snap }`. It can be `true`, `false` or a pixel number.
  - New option `{ behavior }`
  - New option `{ speed }`. Defaults to `up.viewport.scrollSpeed`.
  - Config property `up.layout.config.snap` has been renamed to `up.viewport.config.revealSnap`.
  - New config option `up.viewport.revealPadding`.
- New experimental function `up.viewport.root()`. It return the [scrolling element](https://developer.mozilla.org/en-US/docs/Web/API/document/scrollingElement)
  for the browser's main content area.
- New experimental function `up.viewport.closest()`. It returns the scrolling container for the given element.
- When a `#hash` anchor is [revealed](/up.reveal) during the initial page load, Unpoly will look for an `[up-id=hash]` before looking for `[id=hash]` and `a[name=hash]`.
- Fix issues with restoring scroll positions when going back on some browsers.


### Navigation feedback

- [`[up-alias]`](/up-nav#matching-url-by-pattern) now accepts one or more asterisks (`*`) anywhere in the pattern.
   It was previously limited to match URLs with a given prefix.


### Performance

- Use of native browser APIs has improved performance drastically.
- `[up-preload]` and `[up-instant]` links no longer bind to the `touchstart` event, increasing frame rate while scrolling.


### Request parameters

The experimental `up.params` module has been replaced with the `up.Params` class.
Wrap any type of parameter representation into `up.Params` to get consistent API for reading
and manipulation.

The following types of parameter representation are supported:

1. An object like `{ email: 'foo@bar.com' }`
2. A query string like `'email=foo%40bar.com'`
3. An array of `{ name, value }` objects like `[{ name: 'email', value: 'foo@bar.com' }]`
4. A [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.
   On IE 11 and Edge, `FormData` payloads require a [polyfill for `FormData#entries()`](https://github.com/jimmywarting/FormData).

Supported methods are:

| `new up.Params()` | Constructor. |
| `up.Params#add()` | Adds a new entry with the given `name` and `value`. |
| `up.Params#addAll()` | Adds all entries from the given list of params. |
| `up.Params#addField()` | Adds params from the given [HTML form field](https://www.w3schools.com/html/html_form_elements.asp). |
| `up.Params#delete()` | Deletes all entries with the given `name`. |
| `up.Params#get()` | Returns the first param value with the given `name` from the given `params`. |
| `up.Params#set()` |  Sets the `value` for the entry with given `name`. |
| `up.Params#toArray()` | Returns an array representation of this `up.Params` instance. |
| `up.Params#toFormData()` | Returns a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) representation of this `up.Params` instance. |
| `up.Params#toObject()` | Returns an object representation of this `up.Params` instance. |
| `up.Params#toQuery()` | Returns an [query string](https://en.wikipedia.org/wiki/Query_string) for this `up.Params` instance. |
| `up.Params#toURL()` | Builds an URL string from the given base URL and this `up.Params` instance as a [query string](/up.Params.toString). |
| `up.Params.fromFields()` | Constructs a new `up.Params` instance from one or more [HTML form field](https://www.w3schools.com/html/html_form_elements.asp). |
| `up.Params.fromForm()` | Constructs a new `up.Params` instance from the given `<form>`. |
| `up.Params.fromURL()` | Constructs a new `up.Params` instance from the given URL's [query string](https://en.wikipedia.org/wiki/Query_string). |


### Popups

- The HTML markup for a popup has been changed to make it easier to style with CSS.
  The new structure is:

  ```
  <div class="up-popup">
    <div class="up-popup-content">
      Fragment content here
    </div>
  </div>
  ```
- The default CSS styles for `.up-popup` has been changed. If you have customized popup styles,
  you should check if your modifications still work with the new defaults.
- Popups now update their position when the screen is resized.
- Popups now follow scrolling when placed within [viewports](/up.viewport) other than the main document.
- The `[up-position]` attribute has been split into two attributes `[up-position]` and `[up-align]`.
  Similarly the `{ position }` option has been split into two options `{ position }` and `{ align }`:
  - `{ position }` defines on which side of the opening element the popup is attached. Valid values are `'top'`, `'right'`, `'bottom'` and `'left'`.
  - `{ align }` defines the alignment of the popup along its side.
  - When the popup's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
  - When the popup's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
- New experimental function `up.popup.sync()`. It forces the popup to update its position when a
  layout change is not detected automatically.
- popup elements are now appended to the respective viewport of the anchor element.
  They were previously always appended to the end of the `<body>`.
- The events `up:popup:open`,`up:popup:opened`, `up:popup:close` and `up:popup:closed` have an `{ anchor }` property.
  It references the element that the popup was [attached](/up.popup.attach()) to.


### Tooltips

- The HTML markup for a popup has been changed to make it easier to style with CSS.
  The new structure is:

  ```
  <div class="up-tooltip">
    <div class="up-tooltip-content">
      Tooltip text here
    </div>
  </div>
  ```
- The default CSS styles for `.up-tooltip` have been changed. If you have customized tooltip styles,
  you should check if your modifications still work with the new defaults.
- Tooltips now update their position when the screen is resized.
- Tooltips now follow scrolling when placed within [viewports](/up.viewport) other than the main document.
- The `[up-position]` attribute has been split into two attributes `[up-position]` and `[up-align]`. Similarly the `{ position }` option has been split into two options `{ position }` and `{ align }`:
  - `{ position }` defines on which side of the opening element the popup is attached. Valid values are `'top'`, `'right'`, `'bottom'` and `'left'`.
  - `{ align }` defines the alignment of the popup along its side.
  - When the tooltip's `{ position }` is `'top'` or `'bottom'`, valid `{ align }` values are `'left'`, `center'` and `'right'`.
  - When the tooltip's `{ position }` is `'left'` or `'right'`, valid `{ align }` values are `top'`, `center'` and `bottom'`.
- New experimental function `up.tooltip.sync()`. It forces the popup to update its position when a
  layout change is not detected automatically.
- Tooltip elements are now appended to the respective viewport of the anchor element.
  They were previously always appended to the end of the `<body>`.


### Ruby on Rails integration

- Unpoly is now compatible with the jQuery-less UJS adapter (now [part of Action View](https://github.com/rails/rails/tree/master/actionview/app/assets/javascripts)).


### AJAX acceleration

- The properties for the `up:link:preload` event have been renamed.


### Modal dialogs

- Opening/closing a modal will now manipulate the `{ overflow-y }` style on the same element
  that was chosen by the CSS author ([nasty details](https://makandracards.com/makandra/55801-does-html-or-body-scroll-the-page)).


### Various

- Renamed some files so they won't be blocked by over-eager ad blockers on developer PCs.
- Deprecation warnings are only printed once per environment.




0.57.0
------

### Request parameters

To prevent confusion with [`[up-data]`](/up-data), Unpoly now uses the word "params" when talking about form values or request parameters:

- [`up.request()`](/up.request) option `{ data }` has been renamed to `{ params }`.
- [`up.replace()`](/up.replace) option `{ data }` has been renamed to `{ params }`.

Parameters may be passed in one of the following types:

1. an object like `{ email: 'foo@bar.com' }`
2. a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object
3. a query string like `email=foo%40bar.com`
4. an array of `{ name, value }` objects like `[{ name: 'email', value: 'foo@bar.com' }]`

To help working with form values and request parameters, an experimental module [`up.params`](/up.params) has been added. It offers a consistent API to manipulate request parameters independent of their type.

- [`up.params.fromForm()`](/up.params.fromForm) - serialize a `<form>`
- [`up.params.fromURL()`](/up.params.fromURL) - extract params from a URL's query string
- [`up.params.toArray()`](/up.params.toArray) - convert any params type to an array of `{ name, value }` elements
- [`up.params.toObject()`](/up.params.toObject) - convert any params type to an object
- [`up.params.toQuery()`](/up.params.toQuery) - convert any params type to a query string
- [`up.params.toFormData()`](/up.params.toFormData) - convert any params type to a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object
- [`up.params.buildURL()`](/up.params.buildURL) - composes a URL with query section from a base URL and a params value of any type
- [`up.params.get()`](/up.params.get) - retrieve the value for the given params key
- [`up.params.add()`](/up.params.add) - adds a single key/value to a params value of any type
- [`up.params.assign()`](/up.params.assign) - adds the params to another params
- [`up.params.merge()`](/up.params.merge) - [merges](/up.util.merge) two params


### Application layout

- When Unpoly cannot find the [viewport](/up.layout.config#config.viewports) of an element, it now uses the scrolling root element. This is either `<body>` or `<html>`, depending on the browser.
- Fix a bug where linking back and forth between multiple `#anchor` hashes of the same URL would always reveal the first anchor.
- Revealing elements below [fixed navigation bars](/up-fixed-top) now honors the navigation bar's `padding`, `border`, `margin`, `top` and `bottom` properties.
- Fix a bug where revealing elements [fixed navigation bars](/up-fixed-top) would scroll 1 pixel too short.
- [`up.layout.revealHash()`](/up.layout.revealHash) no longer retrieves the hash anchor from the current URL. You need to pass in a `#hash` value as a first argument.
- Fix a bug where a `#hash` anchor would not be revealed if it included non-word characters like spaces or dots.


### Compilers

- To improve performance, Unpoly no longer parses [`[up-data]`](/up-data) attributes when a [compiler function](/up.compiler) does not require a second `data` argument.
- Compilers that return [destructor functions](/up.compiler#destructor) now run slightly faster.
- [Compilers](/up.compiler) with `{ batch: true }` now receive an array of [`[up-data]`](/up-data) objects as their second `data` argument.
- [Compilers](/up.compiler) with `{ batch: true }` can no longer return destructor functions. Previously the behavior of batch destructors was undefined, now it throws an error.
- Returning an array of [destructor functions](/up.compiler#destructor) from [`up.compiler()`](/up.compiler) is now deprecated. Please return a single destructor function instead.
- [`up.syntax.data()`](/up.syntax.data) now returns `undefined` if the given object has no (or an empty) [`[up-data]`](/up-data) attribute. It previously returned an empty object.


### Event listeners

- To improve performance, Unpoly no longer parses [`[up-data]`](/up-data) attributes when an [`up.on()`](/up.on) listener does not require a third `data` argument.
- [`up.on()`](/up.on) now throws an error when the same callback function is registered multiple times.


### Fragment update API

- New experimental function [`up.all()`](/up.all), which returns all elements matching the given selector. Like [`up.first()`](/up.first) it ignores elements that are being [destroyed](/up.destroy) or [transitioned](/up.morph).


### Various

- New experimental function [`up.util.isBoolean()`](/up.util.isBoolean).
- [`up.follow()`](/up.follow) now accepts a `{ url }` option. It can be used to override the given link's `[href]` attribute.
- New configuration option [`up.form.config.submitButtons`](/up.form.config#config.submitButtons)
- [`up.preload()`](/up.preload) now accepts an options hash that will be passed on to the function making the preload request.
- New experimental function [`up.Response#getHeader()`](/up.Response.prototype.getHeader). It looks up the header value for the given name in the HTTP response header.



0.56.7
------

- Calling `event.preventDefault()` on [`up:modal:close`](/up:modal:close) and [`up:popup:close`](/up:popup:close) events no longer prints `Uncaught (in promise)` to the error console. You still need to catch rejected promises in your own code when it calls Unpoly functions and that function is prevented by an event handler.


0.56.6
------

- Fix a regression where the contents of `<noscript>` tags were parsed into DOM elements (instead of text) when a fragment contained more than one `<noscript>` element. Thanks to [@foobear](https://github.com/foobear) for helping with this.


0.56.5
------

- Fix a bug where loading a page with both a ?query string and a #fragment hash would throw an error


0.56.4
------

- Improve performance of HTML parsing.


0.56.3
------

- Fix a bug where the Bootstrap 3 integration failed to load. Thanks [@dastra-mak](https://github.com/dastra-mak)!


0.56.2
------

- Fix a bug where [`up.util.reject()`](/up.util.reject) would stop working after an animation.


0.56.1
------

- New stable selector [`.up-destroying`](/up-destroying). This CSS class is assigned to elements before they are [destroyed](/up.destroy) or while they are being removed by a [transition](/up.morph).
- Fix a bug where [`up.first()`](/up.first) would sometimes find an element that is being destroyed.


0.56.0
------

This release includes major performance improvements and a new animation engine.

Beware of the breaking change with [`.up-current`](/up-nav-a.up-current)!


### Navigation feedback

Maintaining the [`.up-current`](/up-nav-a.up-current) on all links turned out to be a major performance bottleneck, so we had to make some breaking changes:

- The [`.up-current`](/up-nav-a.up-current) class is now only assigned to links with an [`[up-nav]`](/up-nav) attribute, or to links within a container with an [`[up-nav]`](/up-nav) attribute. You should assign the [`[up-nav]`](/up-nav) attribute to all navigational elements that rely on `.up-current` for styling`.
- You can also globally configure selectors for your navigational elements in `up.feedback.config.navs`:

      up.feedback.config.navs.push('.my-nav-bar')
- The normalized URLs of [`[up-nav]`](/up-nav) links are now cached for performance reasons.
- [`[up-nav]`](/up-nav) links are only updated once when multiple fragments are updated in a single [replacement](/a-up-target).


### Animation

- When performing an [animated page transition](/up.motion) Unpoly will no longer create copies of the old and new fragment versions. The animation will instead be performed on the fragment elements themselves.
- When animating an element with an existing [CSS transition](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions), Unpoly will now pause the CSS transition in its current state, perform the animation, then resume the CSS transition.
- Unpoly now does less work when animation is disabled globally through `up.motion.config.enabled = false`.
- [`up.morph()`](/up.morph) will now expect the new fragment version to be detached from the DOM before morphing.
- [`up.morph()`](/up.morph) will now detach the old fragment version from the DOM after morphing.
- The [`up.morph()`](/up.morph) function has been demoted from *stable* to *experimental*.
- [`up.motion.finish()`](/up.motion.finish) now longer queries the DOM when there are no active animations.


### Application layout

- When Unpoly cannot find the viewport of an element, it will now always considers `document` to be the viewport.


### Fragment updates

- The [`up:fragment:destroyed`](/up:fragment:destroyed) event is now emitted after the fragment has been removed from the DOM. The event is emitted on the former parent of the removed fragment.


### Utility functions

- Fix a bug where [`up.util.isBlank()`](/up.util.isBlank) returned `true` for a function value
- Fix a bug where [`up.util.only()`](/up.util.only) did not copy properties inherited from a prototype


### General

- Partially remove jQuery from internal code for performance reasons. We want to eventually remove jQuery as a dependency.
- Cache the results of feature detection for performance reasons.
- Unpoly is now more efficient when selecting elements from the DOM.
- Unpoly is now more efficient when reacting to mouse events.



0.55.1
------

This release restores support for Internet Explorer 11, which we accidentally broke in 0.55.0.

Thanks to [@foobear](https://github.com/foobear) for helping with this.


0.55.0
------

### Fragment updates

- Unpoly now detects when an [`[up-target]`](/up-target) with multiple selectors would [replace](/up.replace) the same element multiple times. In such a case the target selector will be shortened to contain the element once.
- Unpoly now detects when an [`[up-target]`](/up-target) with multiple selectors contains nested elements. In such a case the target selector will be shortened to only contain the outmost element.


### Utility functions

- [`up.util.uniq()`](/up.util.uniq) now works on DOM elements and other object references.
- New experimental function [`up.util.uniqBy()`](/up.util.uniqBy). This function is like [`uniq`](/up.util.uniq), accept that the given function is invoked for each element to generate the value for which uniquness is computed.
- Changes to [utility functions](/up.util) that work on lists ([`up.util.each()`](/up.util.each), [`up.util.map()`](/up.util.map), [`up.util.all()`](/up.util.all), [`up.util.any()`](/up.util.any), [`up.util.select()`](/up.util.select), [`up.util.reject()`](/up.util.reject)):
  - List functions now accept a property name instead of a mapping function:

    ```
    users = [{ name: 'foo' }, { name: 'bar' }]
    up.util.map(users, 'name') // ['foo', 'bar']
    ```
  - List functions now pass the iteration index as a second argument to the given function:

    ```
    users = [{ name: 'foo' }, { name: 'bar' }]
    up.util.map(users, function(user, index) { return index }) // [0, 1]
    ```

0.54.1
------

This release contains no new features, but will help you when using tools like Babel or Webpack:

- Unpoly now ship without any uses of [`eval()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) in its JavaScript sources. Use of `eval()` had previously prevented minifiers from shortening local variables in some files.
- Documentation in Unpoly's JavaScript sources can no longer be confused with [JSDoc](http://usejsdoc.org/) comments. Unpoly does not use JSDoc, but some build pipelines eagerly look for JSDoc comments to generate type information.


0.54.0
------

### Passive updates

- [`[up-hungry]`](/up-hungry) elements will now also be updated when the server responds with an error code. This helps when `[up-hungry]` is used to display error messages.

### Forms

- When a [form is submitted](/form-up-target) you can now consistently refer to that form element as `&` in CSS selectors ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).

  E.g. to reveal the first error message within a failed form submission:

  ```
  <form id="my-form" up-target=".page" up-fail-reveal="& .error">
    ...
  </form>
  ```

  In this case `& .error` will be replaced with `#my-form .error` before submission.

  This affects CSS selectors in the following HTML attributes:

  - `form[up-target]`
  - `form[up-fail-target]`
  - `form[up-reveal]`
  - `form[up-fail-reveal]`


### Linking to fragments

* When a [link is followed](/a-up-target) you can now consistently refer to that link element as `&` in CSS selectors ([like in Sass](https://sass-lang.com/documentation/file.SASS_REFERENCE.html#parent-selector)).

  This affects CSS selectors in the following HTML attributes:

  - `a[up-target]`
  - `a[up-fail-target]`
  - `a[up-reveal]`
  - `a[up-fail-reveal]`


### Fragment update API

- New option for [`up.replace()`](/up.replace): `{ keep: false }` will disable preservation of [`[up-keep]`](/up-keep) elements.
- New option for [`up.replace()`](/up.replace): `{ hungry: false }` will disable updates of [`[up-hungry]`](/up-hungry) elements.



0.53.4
------

### Passive updates

- Updates for [`[up-hungry]`](/up-hungry) elements will no longer auto-close a [modal dialog](/up.modal).
- Updates for [`[up-hungry]`](/up-hungry) elements will no longer auto-close a [popup overlay](/up.popup).
- CSRF-related `<meta>` tags are no longer updated automatically with every request. This is to prevent unnecessary DOM jitter in applications that don't rotate CSRF tokens.

### Popup overlays

- Calling `up.popup.attach()` without a target selector will now throw an error.


0.53.2
------

### General

- Failed requests in event handlers of CSS selectors like `form[up-target]` no longer print `Uncaught (in promise)` to the error console. You still need to catch and handle rejected promises in your own code when it calls Unpoly functions.

### Animated transitions

- Fix a bug where a page transition would flicker if [revealing](/up.reveal) was animated globally by setting `up.layout.config.duration`.

### Preloading

- Fix a bug where [preloading](/a-up-target) would not always be aborted when stopping to hover before [`up.proxy.config.preloadDelay`](/up.proxy.config#config.preloadDelay).


0.53.1
------

### General

- Fix a bug where replacing the first element on the page (in DOM order) would shift the scroll position if animation is disabled.
- Fix a bug where query params would be lost when Unpoly would fall back to a full page load.

### Optional server protocol

- The optional cookie the server can send to [signal the initial request method](/up.protocol#signaling-the-initial-request-method) will now be removed as soon as Unpoly has booted.

### Animations

- Fix a bug where the animation `move-from-top` would finish instantly after animating with `move-to-top`.
- Fix a bug where the animation `move-from-right` would finish instantly  after animating with `move-to-right`.
- Fix a bug where the animation `move-from-bottom` would finish instantly after animating with `move-to-bottom`.
- Fix a bug where the animation `move-from-left` would finish instantly  after animating with `move-to-left`


0.53.0
------

### New module: Passive updates

The work-in-progress package [`up.radio`](/up.radio) will contain functionality to
passively receive updates from the server. Currently the following functionality is implemented:

- Elements with an [`[up-hungry]`](/up-hungry) attribute are [updated](/up.replace) whenever there is a matching element found in a successful response. The element is replaced even when it isn't [targeted](/a-up-target) directly.

  Use cases for this are unread message counters or notification flashes. Such elements often live in the layout, outside of the content area that is being replaced.
- When a reserver response contains a `<meta name="csrf-param">` or `<meta name="csrf-token">` element, it is automatically updated in the current page.


### General

- Changes when generating CSS selectors for elements:
  - `[aria-label]` attributes are used if no better attributes exist (like `[id]` or `[up-id]` attributes).
  - Attribute values with quotes are now escaped if they appear in an attribute selector.
  - Attribute selectors now use double quotes instead of single quotes.
  - When a `[name]` attribute is used, the tag name is also used. E.g. `meta[name="csrf-token"]`.
  - Element IDs that contain non-word characters (e.g. slashes, spaces, dots), will now generate an attribute selector like `[id="foo/bar"]`.

### Forms

- You can give forms an `[up-fail-reveal]` attribute to indicate which element should be [revealed](/up.reveal) when the server responds with an error. You may use this, for example, to reveal the first validation error message:
  ```
  <form up-target=".content" up-fail-reveal=".error">
    ...
  </form>
  ```
- Forms with an `[up-reveal]` attribute will now only honor the attribute when the form submission was successful.
- Forms with an `[up-restore-scroll]` attribute will now only honor the attribute when the form submission was successful.
- Forms with an `[up-reveal="css-selector"]` attribute will no longer crash when the selector could not be found.
- Fix a bug where you couldn't submit a form if it's ID contains a slash character ([#46](https://github.com/unpoly/unpoly/issues/46)).

### Links

- You can give links an `[up-fail-reveal]` attribute to indicate which element should be [revealed](/up.reveal) when the server responds with an error
- Links with an `[up-reveal]` attribute will now only honor the attribute when the link could be followed successfully.
- Links with an `[up-restore-scroll]` attribute will now only honor the attribute when the link could be followed successfully.
- Links with an `[up-reveal="css-selector"]` attribute will no longer crash when the selector could not be found.

### Animations

- When [replacing](/up.replace) multiple elements, it is no longer possible to use different [transitions](/up.morph) for each element. The same transition is always applied to all elements.



0.52.0
------

### Browser support

- No longer prints an error to console when registering a [macro](/up.macro) on an unsupported browser.

### AJAX requests

- Unpoly can now detect the final URL of a redirect response without the [optional server protocol](/up.protocol).
  The server protocol is still needed to detect redirects on Internet Explorer 11.
- When making HTTP requests Unpoly will now always merge params in the URL's query section with params from the `{ data }` option.

### Forms

- [Following](/up.follow) a link now emits an [`up:link:follow`](/up:link:follow) event. The event can be prevented.

### Forms

- [Submitting](/up.submit) a form through Unpoly now emits an [`up:form:submit`](/up:form:submit) event. The event can be prevented.


0.51.1
------

### Fragment updates

- Fix a bug where Unpoly would crash when replacing a fragment with a `<script>` tag with a later sibling element.


0.51.0
------

### Fragment updates

- `<script>` tags that were inserted by a fragment update are no longer executed. They are still executed during the initial page load. If you need a fragment update to call JavaScript code, call it from a compiler ([Google Analytics example](https://makandracards.com/makandra/41488-using-google-analytics-with-unpoly)).
- The configuration option `up.dom.config.runInlineScripts` has been removed without replacement.
- The configuration option `up.dom.config.runLinkedScripts` has been removed without replacement.
- Fix a bug where the contents of `<noscript>` tags were parsed into DOM elements (instead of a single verbatim text node). This was confusing libraries that work with `<noscript>` tags, such as [lazysizes](https://github.com/aFarkas/lazysizes).
- Work around a [bug in IE11 and Edge](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12453464/) where `<noscript>` tags that were inserted by a fragment update could not be found with jQuery or `document.querySelectorAll()`.


0.50.2
------

### Fragment updates

- Updating fragments is now much faster when no [`[up-keep]`](/up-keep) elements are involved.

### Scrolling

- [`up.reveal()`](/up.reveal) no longer crashes when called with a CSS selector or non-jQuery element.
- [`up.reveal()`](/up.reveal) now returns a rejected promise when no viewport could be found for the given element.

### Links

- [`[up-expand]`](/up-expand) now ignores clicks on [form fields](/up.form.config#config.fields). This is useful e.g. when `up-expand`ing a table row that contains both links and form fields.

### Network

- [`a[up-preload]`](/a-up-preload) will no longer preload a link when the user holds the Shift, Ctrl or Meta key while hovering.


0.50.1
------

### General

- Boolean HTML attributes are now also considered `true` if their values equal the attribute name, e.g. `up-keep="up-keep"` ([#36](https://github.com/unpoly/unpoly/issues/36))

### AJAX

- [`up.request()`](/up.request) now sends an `X-Requested-With: XMLHttpRequest` headers. This header is used by many server-side frameworks to detect an AJAX request. ([#42](https://github.com/unpoly/unpoly/issues/42))


0.50.0
------

This is a major update with some breaking changes. Expect a few more updates like this as we move closer to our 1.0 release in 2018.

### General

- jQuery 3 is now supported in addition to jQuery 1.9+ and jQuery 2.
- Unpoly now uses [native Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) instead of jQuery deferreds.
- You can now help improve Unpoly's documentation by clicking an *Edit this page* link on any [unpoly.com](https://unpoly.com/) subpage (like [`a[up-target]`](/a-up-target)).

### Browser support

- To enable support for Internet Explorer 11 you need to install a Polyfill for `Promise`. We recommend [ES6-promise](https://github.com/stefanpenner/es6-promise) (2.4 KB gzipped).
- Fix a bug where Unpoly would not boot on Safari 9 and 10 if the initial page was loaded with a `POST` method.

### AJAX

- Unpoly now uses [native XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) instead of `jQuery.ajax()`. If you have been hacking into Unpoly's networking through `jQuery.ajaxPrefilter()`, you must now use the [`up:proxy:load`](/up:proxy:load) event.
- [`up.ajax()`](/up.ajax) has been deprecated since its signature is incompatible with native promises. Please use [`up.request()`](/up.request) instead, whose promise fulfills with an [`up.Response`](/up.Response) object.
- The `up:proxy:received` event has been renamed to [`up:proxy:loaded`](/up:proxy:loaded).
- The [`up:proxy:load`](/up:proxy:load) event properties have changed. You can now access request properties through a key `{ request }`, e.g. `event.request.url`.
- The [`up:proxy:load`](/up:proxy:load) event can now be prevented to prevent a request from being sent to the network.
-  The [`up:proxy:load`](/up:proxy:load) event now allows listeners to change request headers by manipulating the `event.request.headers` object.
- A new event [`up:proxy:fatal`](/up:proxy:fatal) will be [emitted](/up.emit) when an [AJAX request](/up.request) encounters fatal error like a timeout or loss of network connectivity.

### Links

- Links with unsafe HTTP methods like `POST` are no longer marked as [`.up-current`](/a.up-current), even if their `[href]` matches the current URL.
- New experimental function [`up.link.isSafe()`](/up.link.isSafe). It returns whether the given link has a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1) HTTP method like `GET`.

### Fragment updates

- When a selector was not found in the response, the error notification now offers a link to show the unexpected response.
- The event [`up:fragment:destroy`](/up:fragment:destroy) can no longer be prevented.

### History

- Clicking a link with an [`[up-restore-scroll]`](/a-up-target#up-restore-scroll) attribute will no longer crash if no previous scroll position for given URL is known ([#25](https://github.com/unpoly/unpoly/issues/25))
- Fix a bug where going back in history would sometimes not call destructors ([#24](https://github.com/unpoly/unpoly/issues/24))

### Forms

- [`up.observe()`](/up.observe) no longer sends multiple callbacks when a previous callback was slow to respond.

### Tooltips

- Fix a bug where tooltips would sometimes stay open when many tooltips are opened and closed concurrently.

### Server protocol

- When the server [signals a redirect with a `X-Up-Location` header](/up.protocol#redirect-detection), sending a `X-Up-Method` header is now optional. If it is missing, `GET` is assumed.
- Unpoly will often update a different selector in case the request fails. This second selector is now sent to the server as a `X-Up-Fail-Target` header.
- You can now [configure how CSRF tokens are sent your server-side framework](/up.protocol.config).
- CSRF tokens are no longer sent for cross-domain requests.

### Animation

- `up.motion.none()` has been removed without replacement. Just pass `false` or the string `'none'` to indicate a animation or transition which has no visual effects and completes instantly.
- [`up.motion.finish()`](/up.motion.finish) is now async. It returns a promise that fulfills when all animations are finished.
- [`up.motion.finish()`](/up.motion.finish) now also finishes animations in ancestors of the given element.

### Modals

- [`up.follow()`](/up.follow) will now open a modal if the given link has an [`[up-modal]`](/a-up-modal) attribute
- [`a[up-modal]`](/a-up-modal) links can now have an `[up-fail-target]` attribute to indicate which selector to replace for an non-200 response
- Fix a bug where preloading an up-modal link would create an invisible .up-modal container in the DOM.

### Popups

- [`up.follow()`](/up.follow) will now open a popup if the given link has [`[up-popup]`](/a-up-popup) attribute
- up-popup links can now have an up-fail-target attribute to indicate which selector to replace for an non-200 response
- Fix a bug where preloading an up-popup link would create an invisible .up-popup container in the DOM.
- [`up.popup.attach()`](/up.popup.attach) now throws an error if neither `{ url }` nor `{ html }` options are given.

### Events

- When async functions emit an event and that event is prevented, the async function now rejects with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).
- When async functions are called wth `{ confirm: true }` and the user denies confirmation, the async function now rejects with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error).

### Utility functions

- [`up.util.setTimer()`](/up.util.setTimer) is now always async, even when called with a delay of `0` (zero). The function is now stable.
- `up.util.isHash()` has been removed without replacement. In your code you can replace `up.util.isHash(x)` with `up.util.isObject(x) && !up.util.isFunction(x)`.
- `up.util.resolvedDeferred()` has been removed without replacement. Use `Promise.resolve()` instead.
- `up.util.resolvedPromise()` has been removed without replacement. Use `Promise.resolve(`) instead.
- `up.util.rejectedPromise()` has been removed without replacement. Use `Promise.reject()` instead.
- `up.util.unresolvableDeferred()` has been removed without replacement. Use `new Promise(function() {})` instead.
- `up.motion.when()` has been removed without replacement. Use `Promise.all()` instead.
- [`up.util.isString()`](/up.util.isString) now also returns true for `String` instances (in addition to string literals)
- [`up.util.isNumber()`](/up.util.isNumber()) now also returns true for `Number` instances (in addition to number literals)

### Ruby on Rails bindings

- New method `up.fail_target` available in controllers, helpers and views. It returns the selector targeted for a failed response.
- New method `up.fail_target?(target)` available in controllers, helpers and views. It returns whether the given selector is targeted for a failed response.
- New method `up.any_target?(target)` available in controllers, helpers and views. It returns whether the given selector is targeted for a either a successful or failed response.



0.37.0
------

### Compatible changes

- Fix a bug where [replacing](/up.replace) the `<body>` element would not trigger [destructor functions](/up.compiler#destructor) in the old `<body>`.
- Fix a bug where [`[up-layer]`](/up-layer) attributes or `{ layer }` options were ignored.
- [`a[up-target]`](/a-up-target) and [`form[up-target]`] get a new modifying attribute `[up-fail-layer]`.
  Use it to set the layer to update if the server sends a non-200 status code. Valid values are `auto`, `page`, `modal` and `popup`.
- JavaScript functions like [`up.replace()`](/up.replace) or [`up.submit()`](/up.submit) now have a `{ failLayer }` option.


0.36.2
------

### Compatible changes

- [Validating forms](/up-validate) will no longer change the scroll position.


0.36.1
------

### Compatible changes

- [npm package](/install/npm) now expresses Unpoly's dependency on `jquery`.
- [Modals](/up.modal) no longer close when clicking an element that exists outside the modal's DOM hierarchy.
- Fix a bug on IE11 where modals would immediately close after opening if the opening link had an [`[up-instant]`](/a-up-instant) attribute and the destination page was already cached.


0.36.0
------

### Compatible changes

- The `[up-observe]` attribute can now be set on a `<form>` to run a function if any
  contained input field changes.
- Fix a bug where `[up-autosubmit]` didn't honor an `[up-delay]` attribute if
  used on a form.
- When [submitting a form](/form-up-target), the `name` and `value` of the submit button is now included with the form parameters.
- [Going back in history](/up.history) after a [fragment update](/up.link) now always restores elements the page layer, never a selector in [modals](/up.modal) or [popups](/up.popup).
- [Going back in history](/up.history) now always closes a [modal](/up.modal) or [popup](/up.popup).
- Switch to [unpkg](https://unpkg.com) as our [CDN](/install/cdn).


0.35.2
------

### Compatible changes

- `unpoly-rails` now supports Rails 5


0.35.1
------

### Compatible changes

- Fix a bug where an Unpoly app would crash when embedded as an `<iframe>` if the user blocks third-party cookies and site data
- Fix a bug where the `up` global wasn't registered on `window` when using Webpack


0.35.0
------

### Compatible changes

- Remove a use of global `$` that prevented Unpoly from being used with with [`jQuery.noConflict()`](https://api.jquery.com/jquery.noconflict/).
- Fix a bug where replacing the `<body>` element would lose the body class and other attributes
- Fix a bug where Unpoly would set the document title to a `<title>` tag of an inline SVG image.


### Incompatible changes

- Drop support for IE 9, which hasn't been supported on any platform since January 2016.
- Drop support for IE 10, which hasn't been supported since January 2016 on any platform except
  Windows Vista, and Vista is end-of-life in April 2017.


0.34.2
------

### Compatible changes

- The scroll positions of two [viewports](/up-viewport) with the same selector is now restored correctly when going back in history.
- Fix a bug where new modals and popups would sometime flash at full opacity before starting their opening animation.


0.34.1
------

### Compatible changes

- Elements with `up-show-for` and `up-hide-for` attributes
  can now be inserted dynamically after its controlling `[up-switch]` field has been
  compiled.
- Unpoly no longer strips a trailing slash in the current URL during startup


0.34.0
------

### Compatible changes

- During the initial page load Unpoly now [reveals](/up.reveal) an element matching the
  `#hash` in the current URL.

  Other than the default behavior found in browsers, `up.revealHash` works with
  [multiple viewports](/up-viewport) and honors [fixed elements](/up-fixed-top) obstructing the user's
  view of the viewport.
- New experimental function [`up.layout.revealHash()`](/up.layout.revealHash).
- The optional server protocol is now [documented](/up.protocol).
  The protocol is already implemented by the [`unpoly-rails`](https://rubygems.org/gems/unpoly-rails) Ruby gem.
- New experimental property [`up.protocol.config`](/up.protocol.config).
- [`up.browser.isSupported()`](/up.browser.isSupported) has been promoted from experimental to stable API


### Breaking changes

- `up.proxy.config.wrapMethodParam` is now [`up.protocol.config.methodParam`](/up.protocol.config#config.methodParam).
- The event [`up:history:restored`](/up:history:restored) is no longer emitted when a history state
  was not created by Unpoly.


0.33.0
------

### Compatible changes

- When a fragment updates cannot find the requested element, you can now define a fallback selector to use instead.

  A `{ fallback }` option has been added to all JavaScript functions that update fragments, like [`up.replace()`](/up.replace).

  Also an `[up-fallback]` attribute has been added to all CSS selectors that update fragments, like for [`a[up-target]`](/a-up-target).

  You can also define fallbacks globally using the [`up.dom.config`](/up.dom.config) property.
- Unpoly no longer crashes when a request fails due to a timeout or network problem. In such cases, async functions (like [`up.replace()`](/up.replace)) will leave the page unchanged and  reject the returned promise.
- Functions that make a request (like [`up.replace()`](/up.replace) or like [`up.ajax()`](/up.ajax)) now accept a new option `{ timeout }`.
- [Modals](/up.modal) no longer create an `.up-modal` element when the server returns a non-200 status and the `{ failTarget }` is replaced instead
- [Popups](/up.popup) no longer create an `.up-popup` element when the server returns a non-200 status and the `{ failTarget }` is replaced instead
- Improve performance when updating fragments without transitions
- When updating the `<body>` element with a transition, that transition is now silently ignored instead of throwing an error.
- [`up.util.resolvedPromise()`](/up.util.resolvedPromise) now accepts arguments which will become the resolution values.
- [`up.util.resolvedDeferred()`](/up.util.resolvedDeferred) now accepts arguments which will become the resolution values.
- New utility method [`up.util.rejectedPromise()`](/up.util.rejectedPromise).
- [`up.first()`](/up.first) has new option `{ origin }`. You can use it provide a second element or selector that can be referenced as `&` in the first selector:

      $input = $('input.email');
      up.first('.field:has(&)', $input); // returns the .field containing $input
- Fix a bug where the document title wasn't restored when the user uses the back button
- When [revealing a page fragment](/up.reveal), Unpoly will include the element's top and bottom margin in the area that should be revealed.


### Breaking changes

- [`up.replace()`](/up.replace) now returns a rejected promise if the server returns a non-200 status code.
- `up.util.merge()` has been replaced with [`up.util.assign()`](/up.util.assign), which no longer makes exceptions for `null` and `undefined` property values. This behaves like [`Object.assign`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
- The `up.flow` module has been renamed to [`up.dom`](/up.dom).
- The `up.navigation` module has been renamed to [`up.feedback`](/up.feedback).
- Functions that measure position, dimensions or margin now return floats instead of rounded integers.


0.32.0
------

### Compatible changes

- Fix a bug where morphing an [`[up-keep]`](/up-keep) element with a destructor would throw an error.
- Fix a bug where an [`[up-keep]`](/up-keep) element would lose its jQuery event handlers when it was kept.
- Fix a bug where [`up.log.disable()`](/up.log.disable) did not persist through page reloads.
- Fix a bug where [`up.reveal()`](/up.reveal) would scroll too far if the viewport has a `padding-top`.
- Fix a bug where [`up.reveal()`](/up.reveal) would not scroll to an element at the bottom edge of the visible area
  if [`up.layout.config.snap`](/up.layout.config) is set.
- Several features have been promoted from experimental API to stable API:
  - [`[up-drawer]`](/a-up-drawer)
  - [`up.syntax.data()`](/up.syntax.data)
  - [`up.extract()`](/up.extract)
- When [targeting](/up-target) an URL with a #hash, the viewport will now scroll to the first row of an element
  with that ID, rather than scrolling as little as possible.


### Breaking changes

- [Modals](/up.modal) can no longer grow wider than the screen
- The spacing around a modal dialog is longer implemented as a `margin` of `.up-modal-dialog`.
  It is now a padding of `.up-modal-viewport`. This makes it easier to set the `width` or `max-width` of the dialog box.

  If your project has custom Unpoly styles, you should grep your CSS files for changes to the `margin`
  of `.up-modal-dialog` and set it as a `padding` on `.up-modal-viewport[flavor=default]` instead.


0.31.2
------

### Compatible changes

- Unpoly can now be installed as an npm module called `unpoly`.


0.31.0
------

### Compatible changes

- Drawers are now a built-in modal flavor! Use the [`[up-drawer]`](/a-up-drawer) attribute to open page fragements
  in a modal drawer that slides in from the edge of the screen.


### Breaking changes

- The [`up.modal.flavor()`](/up.modal.flavor) function was deprecated. Set values on the
  [`up.modal.flavors`](/up.modal.flavors) property instead.


0.30.1
------

### Compatible changes

- Fix [`up.observe()`](/up.observe) not honoring `{ delay }` option
- Fix [`[up-observe]`](/up-observe) not honoring `[up-delay]` modifier
- Fix many issues with concurrency and slow server responses for [`up.observe()`](/up.observe) and [`[up-observe]`](/up-observe)



0.30.0
------

### Breaking changes

- If you are using Unpoly's Boostrap integration, you now need to include `unpoly-bootstrap3.js` *after* you include the Bootstrap CSS.
- Fix some issues when using Unpoly together with Bootstrap modals.



0.29.0
------

### Compatible changes

- [`up.popup.attach()`](/up.popup.attach) now has a `{ html }` option. This allows you to extract popup contents
  from a HTML string without making a network request.
- [`up.tooltip.attach()`](/up.tooltip.attach) now has a `{ text }` option which automatically escapes the given string.
- Fix a bug on Firefox where the page width would jump by the scrollbar width when opening a modal.
- Fix a bug where modals would close when following a link to a cached destination.

### Breaking changes

- Events handled by Unpoly selectors will no longer bubble up the DOM.


0.28.1
------

### Compatible changes

- [`up.tooltip.attach()`](/up.tooltip.attach) now has a `{ text }` option which automatically escapes the given string.
- Fix a bug where Unpoly would hang when parsing a page with a `<head>` but without a `<title>`


0.28.0
------

### Compatible changes

- The error notification is now easier to read and can be closed.
- When a target selector was not found in the response, the error notification now offers a link to re-request the response for inspection.
- [Compilers](/up.compiler) can now return an array of functions that will *all* be called when the element is destroyed.
- [`up.observe()`](/up.observe) now works on checkboxes and radio buttons.
- [`up.observe()`](/up.observe) can now be called with multiple form fields, or any container that contains form fields.
- When opening a [modal](/up.modal) you can now pass an option `{ closable: false }` or set an `up-closable='false'` attribute
  This lets you disable the default methods to close a modal (close button, clicking on the backdrop, pressing ESC).
  You can also configure this globally by setting [`up.modal.config.closable`](/up.modal.config).
- Fix a bug where [`up.observe(form, options)`](/up.observe) would not respect options.
- Fix a bug where [`up.autosubmit(form)`](/up.autosubmit) was not published.
- Fix a bug where falling back to non-AJAX page loads on old browsers would not work

### Breaking changes

- `up.error()` has been renamed to [`up.fail()`](/up.fail) in order to prevent confusion with [`up.log.error()`](/up.log.error).


0.27.3
------

### Compatible changes

- [Popups](/up.popup) and [modals](/up.modal) will no longer try to restore a covered document title
  and URL if they were opened without pushing a history entry.
- When fragments are [replaced](/up.replace) without pushing a new history entry,
  the document title will no longer be changed by default.


### Breaking changes

- The `{ url }` option for [`up.destroy()`](/up.destroy) has been renamed to `{ history }` to be more
  in line with [`up.replace()`](/up.replace).


0.27.2
------

### Compatible changes

- Fix a bug where the back button would not work if the document contained carriage returns (`\r`).
- Fix a bug where auto-closed modals and popups would overwrite a changed
  browser location with their cached "covered URL"


### Breaking changes

- Links with [`up-target`](/up.target) now prefer to update elements within their own layer (page, modal, or popup).
  Only when the target element doesn't exist within the link's layer, Unpoly will look through all layers
  from top to bottom.



0.27.1
------

### Compatible changes

- Fix a bug where absolutely positioned elements would be offset incorrectly during transitions
- Fix a bug where inserted elements were not revealed within their viewport
- When [validating](/up-validate) a form with transitions, transitions are no longer applied


### Breaking changes

- When [replacing](/up.replace) multiple page fragments at once, only the first fragment is revealed within its viewport


0.27.0
------

### Compatible changes

- Calling [`up.log.enable()`](/up.log.enable) will now keep logging enabled for the remainder of this
  browser session (and persist through page reloads).
- Added experimental events to observe history changes: [`up:history:push`](/up:history:push) (preventable), [`up:history:pushed`](/up:history:pushed) and [`up:history:restored`](/up:history:restored)
- Fix a bug where prepending or appending multiple elements with `:before` / `:after` pseudo-classes
  would not work correctly in tables.
- Fix a bug where calling [`up.animate()`](/up.animate) with `{ duration: 0 }` would return a promise
  that never resolved.
- A click on the page body now closes the popup on `mousedown` instead of `click`.
  This fixes the case where an `[up-instant]` link removes its parent and thus a `click` event never bubbles up to the body.
- When opening a modal, elements behind the dialog can now be moved correctly when scrollbars have custom styles on `::-webkit-scrollbar`.
  To take advantage of this, make sure to also style scrollbars on elements with an [`[up-viewport]`](/up-viewport) attribute.
- Fix a bug where [`up.tooltip.config`](/up.tooltip.config) was not publicly acccessible.
- Fix a bug where [`up.tooltip.isOpen()`](/up.tooltip.isOpen) was not publicly acccessible.
- New [tooltip configuration options](/up.tooltip.config): `config.openDuration`, `config.closeDuration`, `config.openEasing`, `config.closeEasing`
- Opening/closing many tooltips concurrently now behaves deterministically.
- Opening/closing many popups concurrently now behaves deterministically.
- Opening/closing many modals concurrently now behaves deterministically.
- IE9 fixes: Polyfill `window.console` and several properties (`log`, `debug`, `info`, `warn`, `error`, `group`, `groupCollapsed`, `groupEnd`)


### Breaking changes

- Tooltips now open and close much quicker.
- Popups now open and close much quicker.
- [`.up-current`](/a.up-current) now considers two URLs different if they have different query strings.



0.26.2
------

### Compatible changes

- Popups anchored to fixed elements are now positioned correctly if the document is scrolled
- Tooltips can now be anchored to fixed elements
- [`up-modal`](/a-up-modal) and [`up-popup`](/a-up-popup) now support an `up-method` modifier.



0.26.1
------

### Breaking changes

- When inserting a page fragment with a `<script src="...">` tag, the linked JavaScript is no longer loaded and executed. Inline scripts will still be executed. You can configure this behavior using the new [`up.flow.config`](/up.flow.config) property.



0.26.0
------

### Compatible changes

- [Popups](/up.popup) no longer scroll with the document if they are attached to an element with `position: fixed`
- [Tooltips](/up.tooltip) no longer flicker if an [`[up-tooltip]`](/up-tooltip) elements has children
- [Tooltips](/up.tooltip) no longer flicker if the user moves the mouse too close to the tooltip triangle
- Before [compiling](/up.compile) the body, Unpoly now explicitly waits until user-provided compiles have been registered and the DOM is ready.
- Debugging messages in the developer console are now disabled by default. Call [`up.log.enable()`](/up.log.enable) to get them back.
- New configuration options in [`up.log.config`](/up.log.config): `up.log.config.enabled`, `up.log.config.collapse` and
  `up.log.config.prefix`.
- Improve formatting of error messages.
- New experimental utility function [`up.util.escapeHtml()`](/up.util.escapeHtml).
- If an error is thrown before the document is ready, Unpoly now waits until the document is ready before showing the red error box.



0.25.2
------

### Compatible changes

- Fix a bug where [submitting a form](/form-up-target) with file uploads would throw an error `"Cannot convert FormData into a query string"`



0.25.1
------

### Compatible changes

- Fix a bug where [`up.ajax()`](/up.ajax) would incorrectly re-use form responses even if the form data differed
- Fix a bug with the [`up-observe`](/up-observe) UJS attribute throwing an error when used
- Fix a bug where if multiple compilers with [destructors](/up.compiler#destructor)
  are applied to the same element and the element is removed, only the last destructor was called.


0.25.0
------

### Compatible changes

- New modal default [`up.modal.config.sticky`](/up.modal.config)
- New experimental function [`up.modal.flavor()`](/up.modal.flavor) to register modal variants (like drawers).
- Fix a bug where [compilers](/up.compiler) and [macros](/up.macro) with higher priorities were executed last (instead of first like it says in the docs).
- Fix a bug that would occur if two compiled elements, that were nested within each other, would raise an error if the outer element was destroyed and both compilers have destructor functions.
- Fix a bug where replacing the `<body>` element would raise an error if any element in the old `<body>` had a destructor function.
- The promise returned by [`up.replace()`](/up.replace) now waits for transitions to complete before resolving
- Fix a bug where an error would be shown when opening a modal while another modal was still loading
- Fix a bug where two popups would be shown when opening a popup while another popup was still loading
- New options for [up.popup.config](/up.popup.config):
  - `up.popup.config.openDuration`
  - `up.popup.config.closeDuration`
  - `up.popup.config.openEasing`
  - `up.popup.config.closeEasing`
- Modals now longer addsa right padding to the `<body>` if the document has no vertical scroll bars
- Animations now wait until the browser signals completion of the CSS transition. Previously
  animations were canceled after its duration, which might or might not have matched to the actual
  last animation frame.

### Breaking changes

- When opening a modal while another modal is open, the first modal will be closed (with animation) before the second modal opens (with animation)
- When opening a popup while another popup is open, the first popup will be closed (with animation) before the second popup opens (with animation)
- User-defined macros are now always run *before* built-in macros.
  This way you can set [`a[up-dash]`](/a-up-dash) and [`[up-expand]`](/up-expand) from your own macros.


0.24.1
------

### Compatible changes

- Fix a bug that would stop transitions from working.


0.24.0
------

### Compatible changes

- New function [`up.modal.extract()`](/up.modal.extract) to open a modal from an
  existing HTML string.
- [`up.ajax()`](/up.ajax) now also accepts the URL as a first string argument.
- [Expanded](/up.expand) links to modals or popups now get a pointer cursor via CSS
- New options for [up.modal.config](/up.modal.config):
  - `up.modal.config.openDuration`
  - `up.modal.config.closeDuration`
  - `up.modal.config.openEasing`
  - `up.modal.config.closeEasing`
  - `up.modal.config.backdropOpenAnimation`
  - `up.modal.config.backdropCloseAnimation`
  - Also see the breaking changes regarding modal structure below.
- Calling [`up.motion.finish()`](/up.motion.finish) without arguments will now
  complete all animations and transitions on the screen.
- Fix a bug where [`up.motion.finish()`](/up.motion.finish) would not cancel CSS transitions that were still in progress.
- Fix a bug where `.up-active` classes where not removed from links when the destination
  was already [preloaded](/up.preload).


### Breaking changes

- Animations when opening or closing a [modal](/up.modal) now only affect the viewport around the dialog.
  The backdrop is animated separately. This allows animations like "zoom in", which would look strange if
  the backdrop would zoom in together with the dialog.
- The modal's HTML structure has been changed to include a `.up-modal-backdrop` element:

  ```
  <div class="up-modal">
  <div class="up-modal-backdrop">
  <div class="up-modal-viewport">
    <div class="up-modal-dialog">
      <div class="up-modal-content">
        ...
      </div>
      <div class="up-modal-close" up-close>X</div>
    </div>
  </div>
  </div>
  ```

- The `z-index` properties for modal elements have been [changed](https://github.com/unpoly/unpoly/blob/master/lib/assets/stylesheets/unpoly/modal.css.sass).
  They might change again in the future.
- The modal will now take over the document's scrollbars after the open animation has finished.
  In earlier versions the modal took over as soon as the animation had started.
- Calling [`up.motion.finish()`](/up.motion.finish) with an element will now also
  complete animations/transitions on children of the given element.


0.23.1
------

### Compatible changes

- [Animations](/up.motion) `move-to-*` and `move-from-*` now use CSS transforms instead of manipulating the
  bounding box margins.
- Fix [`up.util.trim()`](/up.util.trim) not working properly.
- [`up.morph()`](/up.morph) no longer throws an error if called without an `options` object
- Custom transitions can now call [`up.morph()`](/up.morph) to refer to other transitions
- Fix a bug where following a link to a [preloaded](/a-up-preload) destination would keep the
  link marked with a [up-active](/a.up-active) class forever.


0.23.0
------

### Compatible changes

- Unpoly forms can now [submit](/up.submit) file uploads via AJAX.
- You can now position [tooltips](/up-tooltip) on the left or right side of an element.


### Breaking changes

- Tooltips have a darker background color.
- The tooltip CSS has been changed to be easier to override.


0.22.1
------

### Compatible changes

- Fix a bug where the document title wasn't restored when using the back
  and forward buttons
- Fix a bug where links would be followed multiple times if the link
  had an [`up-dash`](/a-up-dash) attribute without a value and also an `up-target` attribute.
- Fix a bug where a link would be followed multiple times if the link's
  click area was expanded using [`[up-expand]`](/up-expand) and if the
  link also had an [`up-dash`](/a-up-dash) attribute.
- [`up.destroy()`](/up.destroy) now returns a resolved deferred if the given selector or jQuery collection does not exist


0.22.0
------

### Compatible changes

- Fix a bug where using the `up-confirm` attribute would result in an infinite loop
- Unpoly no longer displays confirmation dialogs when [preloading](/a-up-preload) a link that
  has both [`up-preload`](/a-up-preload) and `up-confirm` attributes.


### Breaking changes

- `up.proxy.idle()` is now [`up.proxy.isIdle()`](/up.proxy.isIdle)
- `up.proxy.busy()` is now [`up.proxy.isBusy()`](/up.proxy.isBusy)
- Event `up:proxy:busy` is now [`up:proxy:slow`](/up:proxy:slow)
- Event `up:proxy:idle` is now [`up:proxy:idle`](/up:proxy:recover)


0.21.0
------

### Compatible changes

- New function `up.macro()`. This registers a [compiler](/up.compiler) that is run before all other compilers.
- [`up.compiler()`](/up.compiler) has a new options `{ priority }`. Compilers with higher priorities are run first.
- Fix a bug where trying to apply another transition on an element could throw a *Maximum call stack exceeded*
    error if the element was already transitioning.

### Breaking changes

- `up-toggle` has been renamed to `up-switch`


0.20.0
------

- The project has been renamed to *Unpoly*.
- All functions remain in the `up` namespace, so e.g. `up.replace()` is still called `up.replace()`.
- All UJS functionality remains unchanged, so e.g. `up-target` is still called `up-target`.
- The Bower package has been renamed to `unpoly`.
- The Ruby gem for the Rails bindings has been renamed to `unpoly-rails`.
- The new JavaScript and stylesheet assets are:
  - [`unpoly.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.js)
  - [`unpoly.min.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.min.js)
  - [`unpoly.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.css)
  - [`unpoly.min.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly.min.css)
- If you're using the Bootstrap integration the new assets are:
  - [`unpoly-bootstrap3.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.js)
  - [`unpoly-bootstrap3.min.js`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.min.js)
  - [`unpoly-bootstrap3.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.css)
  - [`unpoly-bootstrap3.min.css`](https://raw.githubusercontent.com/unpoly/unpoly/master/dist/unpoly-bootstrap3.min.css)


0.19.0
------

### Compatible changes

- Elements can now be persisted during page updates using the [`up-keep`](/up-keep) attribute.
- `up.proxy.ajax()` is now available as [`up.ajax()`](/up.ajax).
- `up.ajax()` can now handle nested objects as `{ data }` option (used to pass form parameters).

### Breaking changes

- `up.implant()` has been renamed to [`up.extract()`](/up.extract).


0.18.1
------

### Compatible changes

- The logging output to the developer console is now much quieter and more useful


0.18.0
------

### Compatible changes

- New UJS attribute [`[up-toggle]`](/up-toggle) to show or hide part of a form if certain options are selected or boxes are checked.
- Links can now have an optional `up-confirm` attribute. This opens a confirmation dialog with the given message
  before the link is followed or the modal/popup is opened.
- New function [`up.off()`](/up.off). This unregisters an event listener previously bound with [`up.on()`](/up.on).
- If a container contains more than one link, you can now set the value of the [`up-expand`](/up-expand)
  attribute to a CSS selector to define which link should be expanded.
- You can now configure a list of safe HTTP methods in [`up.proxy.config.safeMethods`](/up.proxy.config).
  The proxy cache will only cache safe requests and will clear the entire
  cache after a unsafe request.
- Loading modals and popups will now open if there is a fragment update between the modal/popup's
  request and response.
- [`up.follow()`](/up.follow) and [`up.replace()`](/up.replace) now have an option `{ failTarget }`.
  Use it to define the selector to replace if the server responds with an error.
- [`[up-target]`](/a-up-target) and [`up-follow`](/a-up-follow) now have a modifying attribute `up-fail-target`.
  Use it to define the selector to replace if the server responds with an error.
- New utility method [`up.util.reject()`](/up.util.reject)
- New utility method [`up.util.only()`](/up.util.only)
- New utility method [`up.util.except()`](/up.util.except)
- Fix a bug where modals could no longer be opened on some browsers
- When preventing an event emitted by an async function, that function now rejects its promise.
- Async functions that encounter an error now prefer to reject promises with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object (instead of a string with the error message)

### Breaking changes

- By default Unpoly now converts `PUT`, `PATCH` and `DELETE` requests to `POST` requests
  that carry their original method in a form parameter named `_method`.
  This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

  Web frameworks like Ruby on Rails or Sinatra are aware of the `_method` parameter and use
  its value as the method for routing.

  You can configure this behavior in [`up.proxy.config.wrapMethods`](/up.proxy.config)
  and [`up.proxy.config.wrapMethodParam`](/up.proxy.config).
- The requested selector is now sent to the server as a request header `X-Up-Target`
  (this used to be `X-Up-Selector`). If you are using `unpoly-rails`, you can access it
  through `up.target` (this used to be `up.selector`).


0.17.0
------

### Compatible changes

- When used with the [Ruby on Rails unobtrusive scripting adapter](https://github.com/rails/jquery-ujs) (`rails_ujs.js`),
  now prevents duplicate form submission when Unpoly attributes are mixed with `data-method` attributes.
- [`a[up-instant]`](/a-up-instant) now works with modals and popups
- [`[up-expand]`](/up-expand) now works with modals and popups

### Breaking changes

- When [`up.observe()`](/up.observe) is used with a delay of zero, the callback is invoked instantly (instead of
  being invoked in the next animation frame).


0.16.0
------

### Compatible changes

- You can now configure [`up.proxy.config.maxRequests`](/up.proxy.config) to limit
  the maximum number of concurrent requests. Additional
  requests are queued. This currently ignores preloading requests.

  You might find it useful to set this to `1` in full-stack integration
  tests (e.g. Selenium).
- Allow to disable animations globally with `up.motion.enabled = false`.
  This can be useful in full-stack integration tests like a Selenium test suite.
- New function [`up.motion.isEnabled`](/up.motion.isEnabled) to check if animations will be performed.
- [`up.popup.attach()`](/up.popup.attach) now throws a helpful error when trying to attach a popup to a non-existing element
- New option [`up.modal.config.history`](/up.modal.config) to configure if modals change the browser URL (defaults to `true`)
- New option [`up.popup.config.history`](/up.popup.config) to configure if popup change the browser URL (defaults to `false`).
- Fix CSS for popups with a position of `"bottom-left"`.

### Breaking changes

- Popups and modals used to close automatically whenever an element behind the overlay was replaced.
  This behavior is still in effect, but only if the replacement was triggered by a link or element from
  within the popup or modal.
- Popups and modals no longer raise an error if their (hidden) overlay was closed before the
  response was received.
- Popups and modals are now compiled before they are animated.


0.15.1
------

### Compatible changes

- Fix an error where `up.form.config` was not published. This caused `unpoly-bootstrap3.js` to throw an error.


0.15.0
------

### Compatible changes

- New function [`up.autosubmit()`](/up.autosubmit) and selector [`[up-autosubmit]`](/form-up-autosubmit) to
  observe a form or field and submit the form when a value changes.
- [`up.observe()`](/up.observe) and [`[up-observe]`](/up-observe) can now be applied
  to `<form>` tags. The callback is run when any field in the form changes.
- New function [`up.browser.canPushState()`](/up.browser.canPushState) to detect
  if the browser supports `history.pushState`.
- New function [`up.browser.canCssTransition()`](/up.browser.canCssTransition) to
  detect if the browser supports animation with CSS transitions.
- New function [`up.browser.canInputEvent()`](/up.browser.canInputEvent) to
  detect if the browser supports the `input` event.
- Allow to [configure a default delay](/up.form.config) for [`up.observe()`](/up.observe).
- [Popups](/up.popup) now have events [`up:popup:open`](/up:popup:open),
  [`up:popup:opened`](/up:popup:opened), [`up:popup:close`](/up:popup:close)
  and [`up:popup:closed`](/up:popup:closed).
- The destructor returned by [`up.observe()`](/up.observe) now properly unregisters
  event listeners.

### Breaking changes

- [`up.observe()`](/up.observe) now takes the callback function as a last argument.
  The callback can now longer be passed as a `.change` option.


0.14.0
------

### Compatible changes

- Published the [up.util](/up.util) module.
  This might save you from loading something like [Underscore.js](http://underscorejs.org/).


0.13.0
------

### Compatible changes

- Support for server-side live validation of forms
  using the [`[up-validate]`](/up-validate) selector.
- Support for [non-standard CSS selectors from jQuery](https://api.jquery.com/category/selectors/),
  such as [`:has`](http://api.jquery.com/has-selector/) or [`:visible`](http://api.jquery.com/visible-selector/).
- Allow to refer to the current element as `&` in target selectors. This is useful
  to reference containers that contain the triggering element, e.g.
  `<a href="/path" up-target=".container:has(&)">`
- Improve automatic generation of selectors for elements when no
  explicit selector is given.
- Forms with `file` inputs will now cause forms to fall back to a standard submission without AJAX.
  In a future release we will be able to submit file inputs via AJAX.
- The [request cache](/up.proxy) now reuses responses for `<body>` and `<html>` when asked for other selectors.
- Server responses can now change the document title by including an `X-Up-Title` header.


0.12.5
------

### Compatible changes

- `a[up-target]` and `up.follow` now scroll to a #hash in the link's destination URL
- When up.replace cannot make a change in old browsers, return an unresolved promise instead of a resolved promise.


0.12.4
------

### Compatible changes

- When [morphing](/up.morph), prevent flickering caused by long repaint frames
- When [morphing](/up.morph) don't un-highlight current navigation sections in the element that is being destroyed. This makes for a smoother transition.
- Fix a bug where compositing wasn't forced properly during an animation


0.12.3
------

Refactored internals. No API changes.


0.12.2
------

### Compatible changes

- When marking links as `.up-current`, also consider the URL behind a current modal or popup to
  be the "current" URL.


### Breaking changes

- `up.bus.emit()` is now [`up.emit()`](/up.emit)
- When `up.first()` finds no match, return `undefined` instead of `null`.


0.12.1
------

### Compatible changes

- `up.on()` now returns a function that unbinds the events when called
- Fixed a bug where restoring previous scroll positions was not worked
  in situations where the same operation would also reveal the replaced element.
- Various bugfixes


0.12.0
------

### Compatible changes

- Unpoly can now be used with [`jQuery.noConflict()`](https://api.jquery.com/jquery.noconflict/).


### Breaking changes

- Remove `up.slot`, which was poorly implemented, untested, and not much better than the `:empty` pseudo-selector
  which has great browser support
- Replaced the `up.bus.on(...)` event registry with vanilla DOM events bound to `document`. Also renamed
  events in the process.

  Instead of the old ...

      up.bus.on('fragment:ready', function($fragment) {
        ...
      };

  ... you now need to write ...

      $(document).on('up:fragment:inserted', function(event) {
        var $fragment = $(this);
        ...
      };

  ... or shorter:

      up.on('up:fragment:inserted', function(event, $fragment) {
         ...
      };
- Renamed `up.ready()` to `up.hello()`. This will emit an `up:event:inserted` event for the given element,
  causing it to be compiled etc.
- `up.popup.open()` has been renamed to `up.popup.attach()`.
- `up.modal.open()` has been split into two methods `up.modal.visit(url)` and `up.modal.follow($link)`.
- `up.tooltip.open()` has been renamed to `up.tooltip.attach()`.
- Tooltips now escape HTML by default; To use HTML content, use an `[up-tooltip-html]` attribute instead.
- Module configurations are now simple properties like `up.layout.config` instead of methods like `up.layout.defaults(...)`.

  Instead of the old ...

      up.layout.defaults({ snap: 100 });

  ... you now need to write:

      up.layout.config.snap = 100;


0.11.1
------

### Compatible changes

- Fix a bug where browsers without CSS animation support would crash after an animation call
- Expose `up.error()` as public API. This prints an error message to the error console and throws a new `Error` with that message.
- Fix a million bugs related to compatibility with IE9 and IE10


0.11.0
------

### Compatible changes

- Rework the scrolling implementation so we don't need to scroll elements to the top before replacing them.
- `up.ajax()` now only caches responses with a status code of `200 OK`
- When a link with an `[up-close]` attribute is clicked, the link's default action will only be prevented
  if the link was actually within a modal or popup.
- When revealing an element, Up will now compute the correct element position if there are
  additional positioning contexts between the viewport and the element
- New option "top" for `up.reveal()`: Whether to scroll the viewport so that the first element row aligns with
  the top edge of the viewport. Without this option, `up.reveal()` scrolls as little as possible.
- Allow to animate scrolling when the `document` is the viewport.
- New `up.layout` setting `fixedRight` that contains selectors for elements that are anchored to
  the right edge of the screen. When opening a modal, these elements will be prevented from jumping
  around. If you're using `unpoly-bootstrap3.js`, this will default to `['.navbar-fixed-top', '.navbar-fixed-bottom', '.footer']`.
- Fix a bug in `unpoly-rails` where the gem would fail to `include` itself in some versions
  of Ruby and Rails.


### Breaking changes

- Interactions that would result in an URL change ("pushState") now fall back to a full page load
  if Unpoly was booted from a non-GET request. [More information about the reasons for this](https://github.com/unpoly/unpoly/commit/d81d9007aa3bfae0fca8c55a71d180d1044acae5).

  This currently works out of the box if you're using Unpoly via the `unpoly-rails` Rubygem.
  If you're integrating Unpoly with Bower or manually, you need to have your server app
  set an `_up_request_method` cookie with the current request method on every request.


0.10.5
------

### Compatible changes

- Fix a bug where the proxy would remain busy forever if a response failed.


0.10.4
------

### Compatible changes

- Fix a bug where hovering multiple times over the same [up-preload] link would
  not trigger a new request after the cache expired


0.10.3
------

### Compatible changes

- The default viewport is now `document` instead of the `<body>` element.


0.10.2
------

### Breaking changes

- While following links and submitting forms will still reveal elements by default,
  direct calls of [`up.replace()`](/up.replace) no longer do.
  This behavior can be activated using the `{ reveal: true }` option.

### Compatible changes

- Options to control scrolling and cache use for
  [`up.submit()`](/up.submit),
  [`up.follow()`](/up.follow),
  [`up.visit()`](/up.visit),
  [`form[up-target]`](/form-up-target) and
  [`a[up-target]`](/a-up-target).


0.10.1
------

### Breaking changes

- [`up.reveal()`](/up.reveal) now only reveals the first 150 pixels of an element.


0.10.0
-------

### Compatible changes

- Viewport scroll positions are saved when the URL changes and restored when the user hits the back/forward button
- Allow to link to the previous page using [`[up-back]`](/a-up-back)
- Allow to restore previous scroll state using [`[up-restore-scroll]`](/a-up-target)
- Instead of saying `<tag up-something="true">` you can now simply say `<tag up-something>`.
- Create this Changelog.

### Breaking changes

- The option `options.scroll` and attribute `up-scroll` have been removed. Instead you can use the
  boolean option `options.reveal` or `up-reveal` to indicate whether an element should be revealed
  within the viewport before replacement.
- The string `up.history.defaults('popTarget')` is now an array of selectors `up.history.defaults('popTargets')`


0.9.1
-----

### Compatible changes

- Change transition implementation so child elements with collapsing margins don't reposition within the animated element


0.9.0
-----

### Compatible changes

- Elements are now being [revealed](/up.reveal) within their viewport before they are updated
- Elements that are prepended or appended using `:before` or `:after` pseudo-selectors are now scrolled into view after insertion.
- New option `up.layout.defaults('snap')` lets you define a number of pixels under which Unpoly will snap to the top edge of the viewport when revealing an element
- You can now make [`up.reveal()`](/up.reveal) aware of fixed navigation bars blocking the viewport by setting new options `up.layout.defaults('fixedTop')` and `up.layout.defaults('fixedBottom')`.


0.8.2
-----

### Compatible changes

- [`up.reveal()`](/up.reveal) can now reveal content in modals and containers with `overflow-y: scroll`.
- Changing the default configuration of an Unpoly module now raises an error if a config key is unknown.
- Links linking to `"#"` are now never marked as `.up-current`.


0.8.1
-----

### Compatible chanes

- You can now include `unpoly-bootstrap3.js` and `unpoly-bootstrap3.css` to configure Unpoly to play nice with Bootstrap 3.


### Breaking changes

- Like Bootstrap, the Unpoly modal will now scroll the main document viewport instead of the modal dialog box.



0.8.0
-----

### Compatible changes

- Unpoly will now emit [events](/up.bus) `proxy:busy` and `proxy:idle` whenever it is loading or is done loading content over HTTP.
- Add an option `up.proxy.defaults('busyDelay')` to delay the `proxy:busy` event in order to prevent flickering of loading spinners.


0.7.8
------

### Compatible changes

- Now longer throws an error if the current location does not match an `up-alias` wildcard (bugfix).


0.7.7
-----

### Compatible changes

- Allow `up-alias` to match URLs by prefix (`up-alias="prefix*"`).


0.7.6
-----

### Compatible changes

- Fix what Unpoly considers the current URL of a modal or popup if multiple updates change different parts of the modal or popup.
- Don't replace elements within a container that matches `.up-destroying` or `.up-ghost` (which are cloned elements for animation purposes).


0.7.5
-----

### Compatible changes

- Make sure that an expanded link will be considered a link by adding an `up-follow` attribute if it doesn't already have an `up-target` attribute.


0.7.4
-----

### Compatible changes

- Correctly position tooltips when the user has scrolled the main document viewports.
- Allow popups within modal dialogs.


0.7.3
-----

### Compatible changes

- Use [up.proxy](/up.proxy) when submitting a form.


0.7.2
-----

### Compatible changes

- When marking links as `.up-current`, allow to additionally match on a space-separated list of URLs in an  `up-alias` attribute.


0.7.1
-----

### Compatible changes

- Bugfix: Don't consider forms with an `up-target` attribute to be a link.


0.7.0
-----

### Compatible changes

- New selector [`[up-expand]`](/up-expand) to enlarge click areas


0.6.5
-----

### Compatible changes

- Animation options for `up.tooltip.open`
- Consider the left mouse button clicked when `event.button` is undefined (as happens with `.click()``)

### Breaking changes

- Rename option `.origin` to `.position` in `up.popup` and `up.tooltip`


0.6.4
-----

### Compatible changes

- Don't follow links while CTRL, Meta or Shift keys are pressed


0.6.3
-----

### Compatible changes

- Show backtraces for Unpoly errors

### Breaking changes

- Rename method `up.awaken()` to `up.compiler()`


0.6.2
-----

### Compatible changes

- Option to have a custom HTTP method for `up.follow()`
- No longer preloads links with unsafe HTTP methods


