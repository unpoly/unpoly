Unreleased
----------

### Custom form fields

Unpoly now builds a form's request params with the browser's own [form-data algorithm](https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData), instead of walking the form's fields itself.

- [Form-associated custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#form-associated_custom_elements) are now submitted, without any configuration. (by @kmmbvnr)
- Values appended by a [`formdata`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/formdata_event) event listener are now submitted. (by @kmmbvnr)
- A form-associated custom element is now also [watched](/up.watch), [validated](/validation), [switched](/switching-form-state) and [disabled](/disabling-forms), if it [exposes its state to a script](/custom-form-fields#contract).
- A new guide explains the [patterns for building a custom form field](/custom-form-fields).
- A `formdata` listener affects what Unpoly *sends*, not what it *watches*. See [`formdata` listeners](/custom-form-fields#formdata).
- A form-associated custom element that never calls `setFormValue()` submits no value, even when it is listed in `up.form.config.fieldSelectors`.
- ⚠️ A form containing an `<input type="file">` is now submitted as `multipart/form-data` even when no file is selected, because the browser's form-data algorithm produces an entry for every file input.
- ⚠️ An `<input type="image">` used as the submit button now contributes its `name.x` and `name.y` coordinates rather than its `[value]`, matching a native form submission.
- ⚠️ A `<button type="reset">` or `<input type="reset">` with a `[name]` is no longer treated as a form field, so it contributes no param to submissions, validations or watched values — matching a native form submission. It is still disabled by [`[up-disable]`](/up-submit#up-disable).
- When an overlay is closed by submitting a form with `[up-accept]` or `[up-dismiss]`, the [result value](/closing-overlays#result-values) now also contains the `[name]` and `[value]` of the submit button the user pressed. Formerly it contained only the form's fields.
- ⚠️ `up.Params.fromForm()` now requires a `<form>` element. It used to accept any container, which `up.Params.fromContainer()` does.
- ⚠️ Params now arrive in the order the browser produces them: the form's own fields in tree order, then values appended by a `formdata` listener, then controls that only Unpoly knows about (custom elements listed in `up.form.config.fieldSelectors`). In particular a submit button's `[name]` and `[value]` now appear at the button's position in the form, rather than after the form's `[up-params]`.
- `up.Params.fromForm()` now takes a `{ submitButton }` option, and assumes the form's first submit button when it is omitted. Pass `false` to submit no button at all. A button that the browser associates with a different form is ignored rather than crashing.
- `up.Params.fromForm()` ignores an `{ includeDisabled }` option. The browser's algorithm never includes a disabled control. The option still works with `up.Params.fromContainer()`, which is what form watching uses.
- ⚠️ Unpoly now throws an error when a field uses a `[form]` attribute to associate with a form in another [layer](/up.layer). The browser resolves such an attribute by document order and ignores layers, so it would submit one layer's field with another layer's form. If you render the same page into an overlay and it uses `[form]`, either give the form a unique `[id]` per layer, or move the field inside the form. Two forms sharing an `[id]` within a single layer are unaffected.
- ⚠️ A field inside a `<fieldset disabled>` is no longer submitted or validated, matching a native form submission. It is still reported by [watchers](/up.watch) and [`[up-switch]`](/switching-form-state).
- A custom control that exposes a `{ name }` but no readable `{ value }` no longer contributes an `undefined` param when watched.
- [Disabling a form](/disabling-forms) now also disables a form-associated custom element.
- The requirements for a [custom form field](/custom-form-fields#contract) are relaxed. A `value` getter is the only thing a custom control must provide.
- ⚠️ When Unpoly disables a custom control that exposes no `{ disabled }` property, it now sets the control's `[disabled]` attribute instead of assigning the property.
- ⚠️ A validation request no longer sends the params of the form's first submit button, and no longer honors that button's `[formaction]`, `[formmethod]`, `[up-params]` or `[up-headers]`. Nothing pressed the button, so only the `<form>` element decides where a validation goes.
- ⚠️ A `click` event dispatched by a script is no longer passed to [`up.on()`](/up.on) callbacks when the element carries a `[disabled]` attribute, even if the platform cannot disable that kind of element. Formerly only a `{ disabled }` property had this effect.
- ⚠️ When Unpoly [focuses](/focus) a form-associated custom element, it now assigns `.up-focus-visible` instead of `.up-focus-hidden`, even when the user interacted with a mouse or touch. `up.viewport.config.autoFocusVisible` shows a [focus ring](/focus-visibility) for every [field](/up.form.config#config.fieldSelectors), and such an element is now a field.
- `up.form.config.genericButtonSelectors` was renamed to `up.form.config.anyButtonSelectors` and now matches every kind of button, including submit and reset buttons. Unpoly uses it to disable a form's buttons while the form is submitting. The old name still works with [`unpoly-migrate.js`](/changes/upgrading).


3.14.3
------

- [Revalidation of expired content](/caching#revalidation) will now preserve the scroll positions of any viewports contained in the revalidated area.


3.14.2
------

You can now use `:has()` selectors with Unpoly-specific suffixes like `:maybe`, [`:before`](/targeting-fragments#appending-or-prepending) and [`:after`](/targeting-fragments#appending-or-prepending).

For example, this target selector is now valid:

```css
.container:has(.child):maybe
```


3.14.1
------

- Source maps for minified are now included in the npm package.


3.14.0
------

This release delivers many requested features while filing off some long-standing sharp edges throughout the framework.

Breaking changes are marked with a ⚠️ emoji and polyfilled by [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading).

> [note]
> Our sponsor [makandra](https://makandra.de/en) funded this release ❤️\
> You can hire makandra for [Unpoly support](https://unpoly.com/support).



### Global scripting policies

This version introduces settings to globally control whether Unpoly will execute JavaScript on your page.


#### Script elements

The boolean `up.fragment.config.runScripts` has been replaced with a more flexible setting `up.script.config.scriptElementPolicy`. This lets you control whether to run scripts in new fragments:

```html
<div id="fragment">
  <script>
    <!-- chip: ❓ Will this script run? -->
  </script>
</div>
```

⚠️ By default Unpoly will now run any `<script>` that passes your CSP checks, but requires a nonce for viral CSPs with `strict-dynamic`.

You can configure `up.script.config.scriptElementPolicy` to block all script elements, or to only allow [scripts with a valid `[nonce]` attribute](/script-security#script-element-nonces):

| `scriptElementPolicy` | Runs without CSP?  | Runs with CSP?     | Runs with `strict-dynamic` CSP? |
|-----------------------|--------------------|--------------------|---------------------------------|
| `auto` (default)      | Always             | If passes CSP      | With allowed nonce              |
| `pass`                | Always             | If passes CSP      | 🔥 Always                       |
| `block`               | Never              | Never              | Never                           |
| `nonce`               | With allowed nonce | With allowed nonce | With allowed nonce              |


See [Security for script elements](/script-security#script-elements).


#### Callbacks

Added a new setting `up.script.config.callbackPolicy`. This lets you control whether Unpoly will execute string callbacks in attributes or response headers:

```html
<a
  href="/path"
  up-follow
  up-on-loaded="console.log('Will this callback run?')"> <!-- mark: up-on-loaded -->
  Click link
</>

<form>
  <input
    type="text"
    name="title"
    up-watch="console.log('Will this callback run?')"> <!-- mark: up-watch -->
</form>
```

⚠️ By default Unpoly will parse and execute callbacks, but require a nonce once you set a `<meta name="csp-nonce">` in your `<head>`.

You can configure `up.script.config.callbackPolicy` to block all callbacks, or to only allow [callbacks with a valid nonce](/script-security#callback-nonces):

| `evalCallbackPolicy` | Runs without CSP?  | Runs with CSP?        | Runs with CSP and [`<meta name="csp-nonce">`](/script-security#meta-csp-nonce)? |
|----------------------|--------------------|-----------------------|----------------------------------------------------------------------------------|
| `auto` (default)     | Always             | 🔥 With `unsafe-eval` | With allowed nonce                                                               |
| `pass`               | Always             | 🔥 With `unsafe-eval` | 🔥 With `unsafe-eval`                                                            |
| `block`              | Never              | Never                 | Never                                                                            |
| `nonce`              | With allowed nonce | With allowed nonce    | With allowed nonce                                                               |

See [Security for callbacks](/script-security#callbacks).



#### Warnings for dangerous settings

Unpoly will now log warnings for configurations or CSP headers it considers overly permissive (marked with 🔥 above).


```text
An 'unsafe-eval' CSP allows arbitrary [up-on...] callbacks. Consider setting up.script.config.callbackPolicy = 'nonce'.
```

You can disable these warnings with `up.script.config.cspWarnings = false`.


#### Other changes

⚠️ Renamed `up.protocol.config.cspNonce` to `up.script.config.cspNonce`.\
It still defaults to reading `<meta name="csp-nonce">`.



### Closing overlays when a fragment matches a selector

You can now auto-close an overlay once it reaches a fragment that matches a CSS selector. This is an alternative close condition similar to observing [events](/closing-overlays#event-condition) or [locations](/closing-overlays#location-condition).

To wait for a fragment, set an [`[up-accept-fragment]`](/up-layer-new#up-accept-fragment) attribute on the link that opens an overlay:

```html
<a href="/users/new"
  up-layer="new"
  up-accept-fragment=".user-profile"
  up-on-accepted="alert('Hello user #' + value.id)">
  Add a user
</a>
```

When an element in the new overlay matches the `.user-profile` selector, the overlay is closed automatically. The fragment's [data](/data) becomes the overlay's acceptance value:

```html
<div class="user-profile" data-id="123">
  ...
</div>
```

See [Closing when a fragment is detected](/closing-overlays#fragment-condition).




### Overlay peel intent

When a link or form from an overlay targets a background layer, the overlay will [dismiss](/closing-overlays#intents) when the parent layer is updated. This behavior is called *peeling*.

By default, peeled overlays will be [dismissed](/closing-overlays#intents). You can now choose to [accept](/closing-overlays#intents) them instead, by setting an `[up-peel="accept"]` attribute
on the link or form that is targeting a background layer:

```html
<form method="post" action="/users" up-layer="parent" up-peel="accept"> <!-- mark: up-peel="accept" -->
  ...
</form>
```

When rendering from JavaScript, pass an [`{ peel: 'accept' }`](/up.render#options.peel) option for the same effect.



### Setting overlay callbacks from the server

Servers can send an `X-Up-Open-Layer` response header to force its response to [open a new overlay](/opening-overlays).

Callbacks like `{ onAccepted }` or `{ onDismissed }` can now be passed as a string of JavaScript:

```http
Content-Type: text/html
X-Up-Open-Layer: { onAccepted: 'up.reload("#users-list")' }
```

With a strict CSP you can [prefix your callback with a nonce](/script-security#callback-nonces):

```http
Content-Type: text/html
X-Up-Open-Layer: { onAccepted: 'nonce-secret123 up.reload("#users-list")' }
```


### Source maps

The minified source files (like `unpoly.min.js`) are now shipped with source maps for easier debugging.




### Styling revalidating fragments

When rendering content from a stale [cache](/caching) entry, Unpoly [automatically reloads the fragment](/caching#revalidation) to ensure that the user never sees expired content.

Unpoly will now assign revalidating fragments the `.up-revalidating` class while the revalidation request is in flight:

```html
<div id="target" class="up-revalidating"> <!-- mark: class="up-revalidating" -->
  Possibly stale content
</div>
```

You can style revalidating fragments to convey that content might be stale:

```css
.up-revalidating {
  filter: grayscale(80%);
  opacity: 0.5;
}
```

Note that the `.up-loading` and `.up-active` classes are *not* set during cache revalidation.

You can configure custom revalidation classes in `up.status.config.revalidatingClasses`.





### Setting URL aliases from macros

`[up-nav]` links can now set `[up-alias]` from a [macro](/up.macro).

This can be useful to link nested navigation trees programmatically.\
Let's say we have a main navigation linking to two sections:

```html
<nav class="main-nav">
  <a href="/companies" data-section="companies"> <!-- mark: data-section="companies"-->
  <a href="/users" data-section="users"> <!-- mark: data-section="users"-->
</nav>
```

We also have a sub-navigation for each section:

```html
<nav class="sub-nav" data-section="companies"> <!-- mark: data-section="companies"-->
  <a href="/companies">All companies</a>
  <a href="/companies/sync">Sync CRM</a>
  <a href="/companies/export">Export</a>
</nav>

<nav class="sub-nav" data-section="users"> <!-- mark: data-section="users"-->
  <a href="/users">All users</a>
  <a href="/users/online">Now online</a>
  <a href="/users/profile">Your profile</a>
</nav>
```

We want the main navigation section to be `.up-current` for any sub-section URL.
We can do that with a macro that finds the respective sub-navigation, and sets an `[up-alias]` attribute at the main navigation link:

```js
up.macro('.main-nav a', function(link, { section }) {
  let subLinks = document.querySelectorAll(`.sub-nav[data-section="${section}"]`)
  let subURLs = up.util.map(subLinks, 'href')
  link.setAttribute('up-alias', subURLs.join())
})
```





### Setting data for multiple fragments

Links and forms can now use an [`[up-use-data-map]`](/up-follow#up-use-data) attribute or [`{ dataMap }`](/up.render#options.data) option to map selectors to data objects. When a selector matches any element within an updated fragment, the matching element is compiled with the mapped data:

```html
<a
  href="/score"
  up-target="#stats"
  up-use-data-map="{ '#score': { startScore: 1500 }, '#message': { max: 3 } }"> <!-- mark: up-use-data-map="{ '#score': { startScore: 1500 }, '#message': { max: 3 } }" -->
  Load score
</a>

<div id="stats">
  <div id="score">
    <!-- chip: Will compile with data { startScore: 1500 } -->
  </div>
  
  <div id="message">
    <!-- chip: Will compile with data { max: 3 } -->
  </div>
</div>
```

⚠️ When rendering multiple fragments, any `[up-use-data]` attribute or `{ data }` option will only apply to the first fragment.
To apply data to multiple fragments, use a data map as shown above.



### Keeping current scroll positions

Scroll positions will reset when you insert a new viewport element (as opposed to updating a child element). This is default browser behavior for newly inserted elements.

You can now ask Unpoly to preserve the scroll positions of all [viewports](/up.viewport) around the updated fragment. To do so, set `[up-scroll="keep"]`:

```html
<a href="/list" up-follow up-scroll="keep">Reload list</a> <!-- mark: up-scroll="keep" -->
```

Internally, Unpoly will measure scroll positions before the update, and restore the same positions after the update.

`up.reload()` now uses this feature to preserve scroll positions by default.


See [Keeping current scroll positions](/scrolling#keep).



### Scrolling multiple viewports

You can now scroll multiple viewports with a single render pass, by using an [`[up-scroll-map]`](/up-follow#up-scroll-map) attribute or `{ scrollMap }` option. Its value is an object mapping selectors to [scroll options](/scrolling):


```html
<a
  href="/dashboard"
  up-target="#viewport1, #viewport2"
  up-scroll-map="{ '#viewport1': 'top', '#viewport2': 'bottom' }"
>
  Update fragments
</a>

<div id="viewport1" up-viewport>
  <!-- chip: ✔ Will be scrolled to the top -->
</div>


<div id="viewport2" up-viewport>
  <!-- chip: ✔ Will be scrolled to the bottom -->
</div>
```


### Scrolling to a pixel position

To scroll a specific pixel position from the top, you can now use a number value for the `[up-scroll]` attribute or `{ scroll }` option:

```html
<a href="/list" up-follow up-scroll="35">Back to list</a> <!-- mark: up-scroll="35" -->
```

To scroll to the bottom, but leave a margin of some pixels, set a <i>negative</i> number value:

```html
<a href="/messages" up-follow up-scroll="-40">Latest messages</a> <!-- mark: up-scroll="-40" -->
```

See [Scrolling to a pixel position](/scrolling#pixel-position).



### Detecting success or failure from a compiler or event

[Compilers](/enhancing-elements) now receive a `meta.ok` argument. It indicates if the fragment is being rendered from a successful response (`200 OK`).

```js
up.compiler('#result', function(element, data, meta) { // mark: meta
  if (meta.ok) { // mark: meta.ok
    console.log("Rendering from successful response")
  } else {
    console.log("Rendering from failed response")
  }
})
```

The `up:fragment:inserted` event now includes `{ layer, revalidating, ok }` properties, matching what compilers receive as `meta`:

```js
up.on('up:fragment:inserted', function(event) {
  console.log(event.layer)
  console.log(event.revalidating)
  console.log(event.ok)
})
```

[Rendering HTML from a string](/providing-html#string) is always considered successful.


### Animations

- Unpoly [animations and transitions](/up.motion) now use the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) internally (instead of CSS transitions). The public API did not change.
- Unpoly animations no longer pause existing CSS transitions on the animated element. Both play simultaneously.
- ⚠️ The `fade-out` animation now starts from the element's current opacity, rather than always starting from `1.0`.
- ⚠️ The function `up.motion.isEnabled()` has been deprecated. Use `up.motion.config.enabled` instead.
- When [motion is disabled](/up.motion.config#config.enabled), all animations and transitions now instantly jump to the last frame (instead of doing nothing). This makes it easier to reason about the effects of animations, independent on the user's preferences.



### Fragment rendering

- New default reload options can be configured in `up.fragment.config.reloadOptions`.
- The `up.RenderResult#target` property now reflects the **actual resolved target selector** used, rather than the originally requested one (e.g. resolving `:main` to the concrete selector).
- When an `[up-keep]` element is not targetable, Unpoly now prints a warning instead of crashing the render pass.


### Focus and accessibility

- When revealing a `#hash` fragment from the address bar or a link, Unpoly now also focuses the matching element (#787).
- When [appending or prepending](/targeting-fragments#appending-or-prepending), focus is now placed on the first new element instead of the container element.
- Overlays are now focused before the opening animation starts, rather than after.
- Unpoly will no longer try to [preserve focus](/focus#keep) when calling the low-level `up.render()` function. Unpoly will still [be smart about setting focus](/focus#auto) when [navigating](/navigation). You can restore the old behavior by setting `up.fragment.config.renderOptions.focus = 'keep'`.


### Overlays

- Fixed duplicate scrollbars when opening overlays on pages where `<html>` does not have `overflow-x: hidden`, particularly on Firefox (#795).
- Fixed scrolling the overlay background in Safari (#790, #795).
- When the [global animation duration](/up.motion.config#config.duration) is set to zero, overlay animations now correctly use the duration configured at the overlay.
- ⚠️ The option `{ dismissable }` has been renamed to `{ dismissible }`.
- ⚠️ The attribute `[up-dismissable]` has been renamed to `[up-dismissible]`.


### Forms

- `[up-switch]` now switches disabled fields. This is useful when you re-use your (disabled) forms as read-only views, but also rely on `[up-switch]` to control dependent form sections.
- `[up-switch]` effects are now consistently applied before `[up-validate]` requests.
- Unpoly no longer sends duplicate validation requests when using `[up-validate][up-watch-event=input][up-keep]` to validate a field while the user is typing in it.
- Form-external submit buttons (using the HTML `[form]` attribute) are now supported consistently.
- Fix a race condition where, when the same form field was both watched and changed by compilers in the same render pass, that change wasn't always detected. This affected features like `[up-switch]` or `up.watch()` when another compiler changed the initial value of the observed field.


### Event utilities

- New experimental function `up.event.onClosest()`. This runs a callback when an event is observed on an element or its ancestors.
- New experimental function `up.fragment.onKept()`. This runs a callback when an element or its ancestors are [kept](/preserving-elements) during a render pass.


### Frontend assets

- The `up:assets:changed` event now has a `{ response }` property. This is the `up.Response` that contained [new asset versions](/handling-asset-changes) not found on the current page. 


### History

- When an overlay [close condition](/closing-overlays#close-conditions) is reached, Unpoly no longer pushes a history entry for the closing response, preventing phantom entries in the browser history.
- The `up:location:changed` event now has a `{ previousLocation }` property.


### Utilities

- New function `up.util.mapObject()`. It creates an object from a given array and mapping function. 
- Removed function `up.util.reverse()`. Use [`Array#toReversed()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed) instead.
- New experimental function `up.util.parseNumber()`. Parses a string as a number, supporting negative numbers, negative zero, underscores for digit grouping, and floats.


### Network

- New experimental method `up.Request#isSafe()`. It returns whether the request uses a safe HTTP method like `GET`.
- Fixed event message for `up:fragment:offline` showing `"undefined"` as the reason.


### Documentation improvements

- Cleaned up typos and wording everywhere.
- New guide: [Script security](/script-security).
- Fixed docs incorrectly describing `up.viewport.root` as a function, when it is really a property.
- Fix incorrect deprecation of `up.Request#loadPage()` (it was `#navigate()` that was deprecated)


### Rails UJS compatibility

For a long time Unpoly has migrated links with Rails UJS attributes (`[data-method]`, `[data-confirm]`) to their Unpoly counterparts.\
This migration is now also applied to forms and submit buttons, not just links. 


3.12.1
------

- Fix a bug where Unpoly did not [rewrite CSP nonces within new fragments](https://unpoly.com/csp#nonce-rewriting).


3.12.0
------

This release adds [asynchronous compilers](/up.compiler#async) and many other features requested by the community.\
We also fixed a number of [performance regressions](#performance-fixes) introduced by Unpoly [3.11](/changes/3.11.0).

Breaking changes are marked with a ⚠️ emoji and polyfilled by [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading).

> [note]
> Our sponsor [makandra](https://makandra.de/en) funded this release ❤️\
> Please consider hiring makandra for [Unpoly support](https://unpoly.com/support).


### Asynchronous compilers

Compiler functions can now be [`async`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). This is useful when a compiler needs to fetch network  resources, or when calling a library with an asynchronous API:

```js
up.compiler('textarea.wysiwyg', async function(textarea) { // mark: async
  let editor = await import('wysiwyg-editor') // mark: await
  editor.init(textarea) // mark: await
})
```

You can also use this to split up expensive tasks, giving the browser a chance to render and process user input:


```js
up.compiler('.element', async function(element) {
  doRenderBlockingWork(element)
  await scheduler.yield() // mark-line
  doUserVisibleWork(element)
})
```

#### Cleaning up async work {#async-destructors}

Like synchronous compilers, async compiler functions can return a [destructor function](#destructor):

```js
up.compiler('textarea.wysiwyg', async function(textarea) {
  let editor = await import('wysiwyg-editor')
  editor.init(textarea) // mark: await
  return () => editor.destroy(textarea) // mark-line
})
```

Unpoly guarantees that the destructor is called, even if the element gets destroyed before the compiler function terminates.

#### Timing render-blocking mutations {#async-timing}

Unpoly will run the first [task](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) of every compiler function before allowing the browser to render DOM changes. If an async compiler function runs for multiple tasks, the browser will render between tasks. If you have render-blocking mutations that should be hidden from the user, these must happen in the first task.

![Timing of compiler tasks and browser render frames](images/compiler-tasks.svg){:width='670'}

Async compilers will not delay the promise returned by rendering functions `up.render()` or `up.layer.open()`.\
Async compilers *will* delay the promise returned by [`up.render().finished`](/render-lifecycle#postprocessing)
and `up.hello()`.


#### `up.hello()` is now async

⚠️ The `up.hello()` function now returns a promise that fulfills when all synchronous and asynchronous compilers have terminated:

```js
let textarea = up.element.createFromHTML('<textarea class="wysiwyg"></textarea>')
await up.hello(textarea) // mark: await
// chip: WYISWYG editor is now initialized
```

The fulfillment value is the same element that was passed as an argument:

```js
let html = '<textarea class="wysiwyg"></textarea>'
let textarea = await up.hello(up.element.createFromHTML(html))
```



### Performance fixes

Unpoly 3.11 introduced a number of performance regressions that would be very noticable on pages with many elements, or many forms. To address this, this release includes a number of performance fixes:

- Fix a performance regression where Unpoly would track the DOM for dynamically inserted `[up-validate]` fields for every form. Now fields are only tracked for forms that use `[up-validate]`.
- Features that need to track the insertion or removal of elements now only sync with the DOM once after a render pass.
- Watching a single field no longer tracks dynamically inserted fields.
- Improved the performance of internal form lookups.


### HTML content-type required

⚠️ Unpoly now requires server responses with an HTML content-type, like `text/html` or `application/xhtml+xml`. Trying to render responses with a different type will throw an error, even if the response body contains HTML markup.

Restricting content types is a security precaution. It protects in a hypothetical scenario where an attacker can both upload a file *and* can use an existing XSS vulnerability to cause Unpoly to render that file. It doesn't affect applications that reliably escape user input.

You can configure which responses Unpoly will process by configuring a function in `up.fragment.config.renderableResponse`. To render *any* response regardless of content-type, configure a function that always returns true`:
    
```js
up.fragment.config.renderableResponse = (response) => true
```

### New guides

The [documentation](https://unpoly.com/api) has been extended with new guides:

- [Enhancing elements with JavaScript](/enhancing-elements) teaches everything you need to know about compilers, destructors and preventing memory leaks.
- [Submitting forms in-place](/submitting-forms) shows how to have Unpoly handle forms from HTML or JavaScript.
- [Notification flashes](/flashes) now contains guidance for [suppressing flashes in cached responses](/flashes#caching).


### Submit buttons can override form attributes

Submit buttons can now supplement or override most Unpoly attributes from the form:

```html
<form method="post" action="/proposal/accept" up-submit>
  <button type="submit" up-target="#success">Accept</button>
  <button type="submit" up-target="#failure" up-confirm="Really reject?">Reject</button> <!-- mark: up-confirm="Really reject?" -->
</form>
```

Individual submit buttons can now opt for a full page load, by setting an `[up-submit="false"]` attribute:

```html
<form method="post" action="/report/update" up-submit>
  <button type="submit" name="command" value="save">Save report</button>
  <button type="submit" name="command" value="download" up-submit="false">Download PDF</button> <!-- mark: up-submit="false" -->
</form>
```


See [`[up-submit]`](/up-submit#attributes) for a list of overridable attributes 


### Sticky layout elements

When scrolling to reveal a target element, Unpoly will ensure that layout elements with [`[up-fixed=top]`](/up-fixed-top) are not covering the revealed content.

You can now use `[up-fixed]` on elements with [`position: sticky`](https://www.w3schools.com/howto/howto_css_sticky_element.asp). Unpoly will measure sticky element like permanently fixed elements. The current scroll position is not taken into account.


### Support partial tables responses

In the past Unpoly didn't allow a server to [optimize its response](/optimizing-responses) when the result was a single table row (or cell) without an enclosing `<table>`:

```http
Content-type: text/html

<tr>
  <td>...</td>
</tr>
```

Unpoly can now parse responses that only contain a `<tr>`, `<td>` or `<th>` element, without an enclosing `<table>` (issue #91).


### Expanding click areas

Unpoly lets you enlarge a link's click area using the `[up-expand]` attribute. This version addresses inconsistent (or impractical) assignment of the `.up-active` [feedback class](/feedback-classes) when an expanded link is clicked.

When either the `[up-expand]` container or the first link is clicked, the `.up-active` class
is now assigned to both elements:

```html
<div up-expand class="up-active"> <!-- mark: class="up-active" -->
  <a href="/foo" class="up-active">Foo</a> <!-- mark: class="up-active" -->
  <a href="/bar">Bar</a>
</div>
```

When a non-expanded link is clicked, now only that link becomes `.up-active`:

```html
<div up-expand>
  <a href="/foo">Foo</a> <!-- chip: not active -->
  <a href="/bar" class="up-active">Bar</a> <!-- mark: class="up-active" -->
</div>
```




### Preserving fragments

Two changes were made to [preserving elements](/preserving-elements) using the `[up-keep]` attribute:

- Added an experimental event `up:fragment:kept`. This event is emitted after all [keep conditions](/preserving-elements#conditions) are evaluated and preservation can no longer be prevented. A listener can be sure that the element is going to be kept.
- Fragments with both `[up-poll]` and `[up-keep]` now continue polling when the element is kept (fixes #763)


### Closing overlays

- When an overlay is [closed](/closing-overlays), the overlay now remains in the [layer stack](/up.layer.stack) until all destructors have run. This way destructor functions can still look up elements in their layer.
- ⚠️ The method `up.Layer#isOpen()` has been deprecated. Use `up.Layer#isAlive() instead`.
- ⚠️ The method `up.Layer#isClosed()` has been deprecated. Use `!up.Layer#isAlive() instead`.
- When [closing an overlay](/closing-overlays) that is already closed, Unpoly now throws an `AbortError` instead of doing nothing.
- Fix a crash when an `[up-switch]` input without a containing form is placed in an overlay, and that overlay is closed.



### Manual booting

- ⚠️ To boot manually, the `[up-boot=manual]` must now be set on the `<html>` element instead of on the `<script>` loading Unpoly.
- Unpoly now supports [manual booting](/up-boot-manual) when Unpoly is loaded as a `<script type="module">`.


### Fragment API

- The `up.fragment.get()` function now has a `{ destroying: true }` option. This allows to find destroyed elements that are still playing out their exit animation. Note that all `up.fragment` functions normally ignore elements in an exit animation.
- Added an experimental function `up.fragment.isAlive()`. It returns whether an element is both attached to the DOM and also not in an exit animation.


### Smaller fixes and changes

- Reverted the implementation of `up.util.task()` to again queue macrotasks using `setTimeout()` instead of `postMessage()`. Unpoly 3.11 only recently switched to `postMessage()` because of its tighter scheduling. Unfortunately message order is erratic with `postMessage()` in Safari, making it hard to reason about the sequence of asynchronous callbacks.
- Fix a bug where Unpoly would no longer restore history entries after the page is reloaded (issue #773).
- Added an experimental method `up.Response#isHTML()`. It returns whether the response has a [content-type](/up.Response.prototype.contentType) of `text/html` or `application/xml+html`. It doesn't test if the response body actual contains a valid HTML document.
- Fix a crash when `up.render({ response })` is called while another request is in flight.
- When rendering, and request with the same [`{ failTarget }`](/failed-responses#fail-options) was made while waiting for the network, and the first request responded with an error status and updates , the second request is now aborted.




3.11.0
------

This is a big release, shipping many features and quality-of-life improvements requested by the community. Highlights include a complete overhaul of [history handling](#history-handling), [form state switching](/switching-form-state) and the [preservation of `[up-keep]` elements](/preserving-elements). We also [reworked major parts of the documentation](#reworked-documentation) and [stabilized 89 experimental features](#stabilization-of-experimental-features).

We had to make some breaking changes, which are marked with a ⚠️ emoji in this CHANGELOG.\
Most incompatibilities are polyfilled by [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading).


> [note]
> Our sponsor [makandra](https://makandra.de/en) funded this release ❤️\
> Please take a minute to check out [makandra's services](https://makandra.de/en/services-2) for web development, DevOps or UI/UX.



### Professional support options

We're introducing [optional commercial support](https://unpoly.com/support) for businesses that depend on Unpoly. You can now sponsor bug fixes, commission new features, or get direct help from Unpoly’s core developers.

Support commissions will fund Unpoly’s ongoing development while keeping it fully open source for everyone.\
**The [Discussions board](https://github.com/unpoly/unpoly/discussions) remains available for free community support**, and the maintainers will also remain active there.

Learn more about support options at [unpoly.com/support](https://unpoly.com/support).


### History handling

#### Improved history restoration

When pressing the back button, Unpoly used to only restore history entries that it created itself. This sometimes caused the back button to do nothing when a state was pushed by a user interacting with the browser UI, or when an external script replaced an entry.

Starting with this version, Unpoly will handle restoration for most history entries:

- Unpoly will now restore history entries created by clicking an in-page link to another `#hash`. Going back to such an entry will now reveal a matching fragment, scrolling far enough to ignore any [obstructing elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport) in the layout.
- Unpoly will now restore history entries created by the user changing the `#hash` in the browser's address bar (without also changing the path or search query).
- Unpoly will now restore its own history entries that were later replaced by external scripts (through [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState)).

When an external script pushes a history entry with a new path unknown to Unpoly, that external script is still responsible for restoration.

Listeners to `up:location:changed` can now inspect and control which history changes Unpoly should handle:

- A new experimental property `{ willHandle }` shows if Unpoly thinks it is responsible for restoring the new location state.
- A new experimental property `{ alreadyHandled }` shows if Unpoly thinks the change has already been handled (e.g. after calls to `history.pushState()`).


#### Complete handling of `#hash` links

Unpoly now handles most clicks on a link to a `#hash` within the current page, taking great care to emulate the browser's native scrolling behavior:

- Hash links will now honor the viewport's [`scroll-behavior: smooth`](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior) style.
- Hash links can now override their scroll behavior using an `[up-scroll-behavior]` attribute. Valid values are `instant`, `smooth` and `auto` (uses CSS behavior).
- Hash links will now always scroll to a fragment in link's layer, ignoring matching fragments in other layers.
- Hash links will no longer scroll when another script prevented the `click` event.
- Hash links that are [followable](/up.link.isFollowable) will now scroll the page without re-rendering.
- Hash links will now reliably scroll far enough to ignore any [obstructing elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport) in the layout.


#### Every location change is now tracked

`up:location:changed` (and `up:layer:location:changed`) used to only be emitted when history changed during rendering.\
⚠️ These events are now emitted when the URL changes for *any* reason, including:

- When a script calls `history.pushState()` or `up.history.push()`.
- When a script calls `history.replaceState()` or `up.history.replace()`.
- When the user presses the  back or forward button in the browser UI.
- When the user changes the `#hash` in the browser's address bar.
- When the user clicks on a `#hash` link.

Reacting to `#hash` changes usually involves scrolling, not rendering. To better signal this case, the `{ reason }` property of `up:location:changed` can now be the string `'hash'` if only the location `#hash` was changed from the previous location.


#### Other improvements to history handling

- The [log](/up.log) now shows a purple event badge when the user navigates within history. This helps to correlate e.g. a `popstate` event with the logging output from a subsequent history restoration.
- When a fragment update closes an overlay and then navigates the parent layer to a new location, Unpoly will no longer push a redundant history entry of the parent layer's location before navigating.
- Published an experimental function `up.history.replace()` to change the URL of the current history state.
- The `up:layer:location:changed` event now has a `{ previousLocation }` property.
- Fix a bug where history wasn't updated when a response contains comments before the `<!DOCTYPE>` or `<html>` tag (issue #726)




### Watching fields for changes

When watching fields using `[up-watch]`, `[up-autosubmit]`, `[up-switch]` or `[up-validate]`, the following cases are now addressed:

- Fixed all cases where a watched field with `[up-keep]` is transported to a new `<form>` element by a fragment update.
- Fixed all cases where a watched field outside its form (with [`[form]`](https://www.w3schools.com/tags/att_form.asp) attribute) is added or removed dynamically.
- When a watched field runs a callback, a purple event badge is now [logged](/up.log) to help correlating cause and effect.
- If a watched field with `[up-watch-delay]` was detached by an external script during the delay, watchers will no longer fire callbacks or send requests.
- ⚠️ Watching an individual radio button will now throw an error. Watch a container for the entire radio group instead.
- Directly watching a field without a `[name]` will now throw an error explaining that this attribute is required. In earlier versions callbacks were simply never called.


### Switching form state

The `[up-switch]` attribute has been reworked to be more powerful and flexible.

Also see our new guide [Switching form state](/switching-form-state).

#### Disabling or enabling fields

You can now disable dependent fields using the new `[up-disable-for]` and `[up-enable-for]` attributes. 

Let's say you have a `<select>` for a user role. Its selected value should enable or disable other. You begin by setting an `[up-switch]` attribute with an selector targeting the controlled fields:

```html
<select name="role" up-switch=".role-dependent"> <!-- mark: up-switch -->
  <option value="trainee">Trainee</option>
  <option value="manager">Manager</option>
</select>
```

The target elements can use [`[up-enable-for]`](/up-enable-for) and [`[up-disable-for]`](/up-disable-for)
attributes to indicate for which values they should be shown or hidden:

```html
<!-- The department field is only shown for managers -->
<input class="role-dependent" name="department" up-enable-for="manager"> <!-- mark: up-enable-for -->

<!-- The mentor field is only shown for trainees -->
<input class="role-dependent" name="mentor" up-disable-for="manager"> <!-- mark: up-disable-for -->
```

See [Disabling or enabling fields](/switching-form-state#disable).


#### Custom switching effects

You can now implement custom, client-side switching effects by listening to the `up:form:switch` event on any element targeted by `[up-switch]`.

For example, we want a custom `[highlight-for]` attribute. It draws a bright
outline around the department field when the manager role is selected:

```html
<select name="role" up-switch=".role-dependent">
  <option value="trainee">Trainee</option>
  <option value="manager">Manager</option>
</select>

<input class="role-dependent" name="department" highlight-for="manager"> <!-- mark: highlight-for -->
```

When the role select changes, an `up:form:switch` event is emitted on all elements matching `.role-dependent`.
We can use this event to implement our custom `[highlight-for]` effect:

```js
up.on('up:form:switch', '[highlight-for]', (event) => {
  let highlightedValue = event.target.getAttribute('highlight-for')
  let isHighlighted = (event.field.value === highlightedValue)
  event.target.style.highlight = isHighlighted ? '2px solid orange' : ''
})
```

See [Custom switching effects](/switching-form-state#custom-effects).


#### New switching modifiers

The `[up-switch]` attribute itself has been reworked with new modifiying attributes:

- A new `[up-switch-region]` attribute allows to [expand or narrow the region](/switching-form-state#region) where elements are switched.
- `[up-switch]` can now [react to other events](/switching-form-state#reacting-to-different-events), by setting an `[up-watch-event]` attribute.
- `[up-switch]` can now debounce their switching effects with an `[up-watch-delay]` attribute.


#### More `[up-switch]` changes

- Using `[up-switch]` on a text field will now switch while the user is typing (as opposed to when the field is blurred).
- `[up-switch]` now works on a [container for a radio button group](/switching-form-state#radio-buttons).
- `[up-switch]` now works on a [container of multiple checkboxes](/switching-form-state#checkboxes) for a single array param, like `category[]`.
- ⚠️ Setting `[up-switch]` on an individual radio button will now throw an error. Watch a container for the entire radio group instead.
- ⚠️ Fields with `[up-switch]` now require a `[name]` attribute.
- ⚠️ Unpoly will no longer un-hide elements targeted by `[up-switch]` when that element has neither `[up-show-for]` nor `[up-hide-for]` attributes. This was an undocumented side effect of the old implementation.


### Form validation

The `[up-validate]` attribute has been reworked.

#### Validating against other URLs

By default Unpoly will submit validation requests to the form's `[action]` attribute, setting an additional `X-Up-Validate` header to allow the server distinguish a validation request from a regular form submission.

Unpoly can now [validate forms against other URLs](/up-validate#urls). You can do so with the new [`[up-validate-url]`](/up-validate#up-validate-url) and [`[up-validate-method]`](/up-validate#up-validate-params) attributes on individudal fields or on entire forms:

```html
<form method="post" action="/order" up-validate-url="/validate-order"> <!-- mark: up-validate-url -->
  ...
</form>
```

To have individual fields validate against different URLs, you can also set `[up-validate-url]` on a field:

```html
<form method="post" action="/register">
  <input name="email" up-validate-url="/validate-email"> <!-- mark: /validate-email -->
  <input name="password" up-validate-url="/validate-password"> <!-- mark: /validate-password -->
</form>
```

Even with multiple URLs, Unpoly still guarantees eventual consistency in a form with many concurrent validations. This is done by [separating request batches by URL](/up.validate#batching-multiple-urls) and ensuring that only a single validation request per form will be in flight at the same time.

For instance, let's assume the following four validations:

```js
up.validate('.foo', { url: '/path1' })
up.validate('.bar', { url: '/path2' })
up.validate('.baz', { url: '/path1' })
up.validate('.qux', { url: '/path2' })
```

This will send a sequence of two requests:

1. A request to `/path` targeting `.foo, .baz`. The other validations are queued.
2. Once that request finishes, a second request to `/path2` targeting `.bar, .qux`.


#### Other validation changes

- You can now disable [validation batching](/up.validate#batching) globally with `up.form.config.batchValidate = false`, or for individual forms or fields with an `[up-validate-batch="false"]` attribute.
- Fields or forms can add additional params to the validation request using the [`[up-validate-params]`](/up-validate#up-validate-params) attribute.
- Fields or forms can add additional headers to the validation request using the [`[up-validate-headers]`](/up-validate#up-validate-headers) attribute.
- Validation targets can now refer to the changed field with `:origin`. This was possible before, but was never documented.
- `[up-validate]` can now be set on any container of fields, not just an individual field or an entire form. This was possible before, but never documented.


### Layers

#### Opening overlays from the server

The server can now force its response to open an overlay using an `X-Up-Open-Layer: { ...options }` response header:

```http
Content-Type: text/html
X-Up-Open-Layer: { target: '#menu', mode: 'drawer', animation: 'move-to-right' }

<div id="menu">
  Overlay content
</div>
```

See [Opening overlays from the server](/opening-overlays#server).

#### Closing overlays from forms

Forms can now have an `[up-dismiss]` or `[up-accept]` attribute to [close their overlay when submitted](/closing-overlays#on-submit).
This will immediately close the overlay on submission, without making a network request:

```html
<form up-accept> <!-- mark: up-accept -->
  <input name="email" value="foo@bar.de">
  <input type="submit">
</form>
```

The form's field values become the overlay's [result value](/closing-overlays#result-values), encoded as an `up.Params` instance:

```js
up.layer.open({
  url: '/form',
  onAccepted: ({ value }) => {
    console.log(value.get('email')) // result: "foo@bar.de"
  }
})
```

See [Closing when a form is submitted](/closing-overlays#on-submit).


#### Detecting the origin layer

The server can now detect if an interaction (e.g. clicking a link or submitting a form) [originated](/origin) from an overlay, by using the `X-Up-Origin-Mode` request header. This is opposed to the *targeted* layer, which is still sent as an `X-Up-Mode` header.

For example, we have the following link in a modal overlay. The link targets the root layer:

```html
<!-- label: Link within an overlay -->
<a href="/" up-follow up-layer="root">Click me</a> <!-- mark: up-layer -->
```

When the link is clicked, the following request headers are sent:

```http
X-Up-Mode: root
X-Up-Origin-Mode: modal
```



#### Other layer changes

- Fix a bug where overlays allowed scrolling of a background layer.


### Script security

This version revises mechanisms to prevent cross-site scripting and handle strict [content security policies](/script-security).

#### Scripts in fragments are no longer executed

⚠️ Unpoly no longer executes `<script>` elements in new fragments.\
This default can by changed by configuring `up.fragment.config.runScripts`.

Unfortunately our the default for this setting has changed a few times now. It took us a while to find the right balance between secure defaults and compatibility with legacy apps.
We have finally decided to err on the side of caution here.

See [Migrating legacy JavaScripts](/legacy-scripts) for techniques to remove inline `<script>` elements.


#### Mandatory nonces for `script-dynamic` CSP

A CSP with [`strict-dynamic`](https://content-security-policy.com/strict-dynamic/) allows any allowed script to load additional scripts. Because Unpoly is already an allowed script, this would allow *any* Unpoly-rendered script to execute.

To prevent this, Unpoly requires [matching CSP nonces](/script-security#script-element-nonces) in any response with a `strict-dynamic` CSP, even with `runScripts = true`.

If you cannot use nonces for some reasons, you can configure `up.fragment.config.runScripts` to a function
that returns `true` for allowed scripts only:

```js
up.fragment.config.runScripts = (script) => {
  return script.src.startsWith('https://myhost.com/')
}
```

#### Other CSP changes

- Unpoly now uses CSP nonces from a `default-src` directive if no `script-src` directive is found in the policy.
- ⚠️ Unpoly now ignores CSP nonces from the `script-src-elem` directive. Since nonces are used to allow [attribute callbacks](/script-security#callback-nonces), using `script-src-elem` is not appropriate.
- Fix a bug where `<script>` elements in new fragments would lose their `[nonce]` attribute. That attribute is now rewritten to the current page's nonce *if* it matches a nonce from the response that inserted the fragment.
- When `up:assets:changed` listeners inspect `event.newAssets`, any asset nonces are now already rewritten to the current page's nonce *if* they a nonce from the response that caused the event.


### Reworked documentation

#### Parameters are organized into sections

It was sometimes hard to find documentation for a given parameter (or attribute) for features with many options. To address this, options have now been organized in sections like *Request* or *Animation*:

<img src="images/docs/param-sections.png" alt="Parameters organized into sections" width="520">

#### Inherited parameters are documented

You may discover that functions and attributes have a lot more documented options now.

This is because most features end up calling `up.render()`, inheriting most available render options in the process. We used to document this with a note like *"Other `up.render()` options may also be used"*, which was often overlooked.

Now most inherited options are now explicitly documented with the inheriting feature.


#### New guides

A number of guides have been added or overhauled:

- [Preserving elements](/preserving-elements)
- [Polling](/polling)
- [Switching form state](/switching-form-state)
- [Reactive server forms](/reactive-server-forms)

#### Guide links

When there is a guide with more context, the documentation for attributes or functions now show a link to that guide:

<img src="images/docs/guide-link.png" alt="Link to guide with more context" width="440">


### Caching



- When a POST request redirects to a GET route, that final GET request is now cached.
- `up.reload()` can now restore a fragment to a previously cached state using an `{ cache: true }` option. This was possible before, but was never documented.
- ⚠️ Any `[up-expire-cache]` and `[up-evict-cache]` attributes are now executed *before* the request is sent. In previous version, the cache was only changed after a response was loaded. This change allows the combined use of `[up-evict-cache]` and `[up-cache]` to clear and re-populate the cache with a single render pass.
- ⚠️ The server can no longer prevent expiration with an `X-Up-Expire-Cache: false` response header.
- Requests now clear out their `{ bindLayer }` property after loading, allowing layer objects to be garbage-collected while the request is cached.
- Links with both `[up-hungry]` and `[up-preload]` no longer throw an error after rendering cached, but expired content.

### Navigation bars

[Navigational containers](/navigation-bars) can now match the current location of other layers by setting an `[up-layer]` attribute.
The `.up-current` class will be set when the matching layer is already at the link's `[href]`.

For example, this navigation bar in an overlay will highlight links whose URL matches the location of *any* layer:

```html
<!-- label: Navigation bar in an overlay -->
<nav up-layer="any"> <!-- mark: any -->
  <a href="/users" up-layer="root">Users</a>
  <a href="/posts" up-layer="root">Posts</a>
  <a href="/sitemap" up-layer="current">Full sitemap</a>
</nav>
```


See [Matching the location of other layers](/navigation-bars#layers).

### Preserving elements

The `[up-keep]` element now gives you more control over how long an element is kept.

Also see our new guide [Preserving elements](/preserving-elements).


#### Keeping an element until its HTML changes {#same-html}

To preserve an element as long as its [outer HTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML) remains the same, set an `[up-keep="same-html"]` attribute. Only when the element's attributes or children changes between versions, it is replaced by the new version.

The example below uses a JavaScript-based `<select>` replacement like [Tom Select](https://tom-select.js.org/). Because initialization is expensive, we want to preserve the element as long is possible. We *do* want to update it when the server renders a different value, different options, or a validation error. We can achieve this by setting `[up-keep="same-html"]` on a container that contains the select and eventual error messages:

```html
<fieldset id="department-group" up-keep="same-html"> <!-- mark: same-html -->
  <label for="department">Department</label>
  <select id="department" name="department" value="IT">
    <option>IT</option>
    <option>Sales</option>
    <option>Production</option>
    <option>Accounting</option>
  </select>
  <!-- Eventual errors go here -->
</fieldset>
```

Unpoly will compare the element's **initial HTML** as it is rendered by the server.\
Client-side changes to the element (e.g. by a [compiler](/up.compiler)) are ignored.

#### Keeping an element until its data changes {#same-data}

To preserve an element as long as its [data](/data) remains the same, set an `[up-keep="same-data"]` attribute. Only when the element's `[up-data]` attribute changes between versions, it is replaced by the new version. Changes in other attributes or its children are ignored.

The example below uses a [compiler](/up.compiler) to render an interactive map into elements with a `.map` class. The initial map location is passed as an `[up-data]` attribute. Because we don't want to lose client-side state (like pan or zoom  ettings), we want to keep the map widget as long as possible. Only when the map's initial location changes, we want to re-render the map centered around the new location. We can achieve this by setting an `[up-keep="same-data"]` attribute on the map container:

```html
<div class="map" up-data="{ location: 'Hofbräuhaus Munich' }" up-keep="same-data"></div> <!-- mark: same-data -->
```

Instead of `[up-data]` we can also use HTML5 [`[data-*]` attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes):

```html
<div class="map" data-location="Hofbräuhaus Munich" up-keep="same-data"></div> <!-- mark: data-location -->
```

Unpoly will compare the element's **initial data** as it is rendered by the server.\
Client-side changes to the data object (e.g. by a [compiler](/up.compiler)) are ignored.

#### Custom keep conditions

We're providing `[up-keep="same-html"]` and `[up-keep="same-data"]` as shortcuts for common keep constraints.

You can still implement [arbitrary keep conditions](/preserving-elements#custom-keep-condition) by listening to the `up:fragment:keep` event or setting an [`[up-on-keep]`](/up-keep#up-on-keep) attribute.



### Form data handling

- ⚠️ Submitting or validating a form with a `{ params }` option now overrides existing params with the same name. Formerly, a new param with the same name was added. This made it impossible to override array fields (like `name[]`).
- You can now configure which params are treated as an array with multiple values, by setting `up.form.config.arrayParam`. By default, only field names ending in `"[]"` are treated as arrays. (by @apollo13)
- Calling `up.network.loadPage()` will now remove binary values (from file inputs) from a given `{ params }` option. JavaScript cannot make a full page load with binary params.
- Fix the method `up.Params#getAll()` not returning the correct results or causing a stack overflow.


### Focus ring visibility

You can now override [focus ring visibility](/focus-visibility) for individual links or forms, by setting an `[up-focus-visible]` attribute or by passing a `{ focusVisible }` render option.

For global visibility rules, use the existing `up.viewport.config.autoFocusVisible` configuration.


### Scrolling to the top or bottom

This release adds a new [scroll option](/scrolling) `[up-scroll='bottom']`. This scrolls viewports around the targeted fragment to the *bottom*.

⚠️ For symmetry, the option `[up-scroll='reset']` was changed to `[up-scroll='top']`.


### Instant links on iOS

Long-pressing an `[up-instant]` link (to open the context menu) will no longer follow the link on iOS (issue #271).

Also long-pressing an instant link will no longer emit an `up:click` event.


### Utility functions

- Fixed an error with [relaxed JSON](/relaxed-json) parsing when the input string contains a section reference (like `"§1"`) (#752).
- ⚠️ The `up.util.task()` implementation now uses `postMessage()` instead of `setTimeout()`. This causes the new task to be scheduled earlier, ideally before the browser renders the next frame. The task is still guaranteed to run after all microtasks, such as settled promise callbacks.
- ⚠️ The experimental function `up.util.pickBy()` no longer passes the entire object as a third argument to the callback function.
- `up.element.subtree()` now prevents redundant array allocations.


### Accessibility

Unpoly now prevents interactions with elements that are being destroyed (and playing out their exit animation).\
To achieve this, destroying elements are marked as [`[inert]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert).


### Polling

An `[up-poll]` fragment now stops polling if an external script detaches the element.


### Animation

Fixed a bug where [prepending or appending](/targeting-fragments#appending-or-prepending) an insertion could not be animated using an `{ animate }` option or `[up-animate]` option. In earlier versions, Unpoly wrongly expected animations in a `{ transition }` option or `[up-transition]` attribute.


### JavaScript rendering API

- Added a property `up.RenderResult#ok`. It indicated whether the render pass has rendered a [successful response](/failed-responses).
- Added a property `up.RenderResult#renderOptions`. It contains the effective render options used to produce this result.
- ⚠️ Renamed the property `up.RenderJob#options` to `up.RenderJob#renderOptions`
- When `up.hello()` is called on an element that has been compiled before, `up:fragment:inserted` is no longer emitted a second time.
- It is now guaranteed that `up:fragment:inserted` is emitted *after* compilation.


### Network requests

Listeners to `up:request:load` can now [inspect or mutate request options](/up:request:load#changing-requests) before it is sent:

```js
up.on('up:request:load', (event) => {
  if (event.request.url === '/stocks') {
    event.request.headers['X-Client-Time'] = Date.now().toString()
    event.request.timeout = 10_000
  }
})
```

This was possible before, but was never documented.


### Developer experience

We modernized the codebase so that contributing to Unpoly is now simpler:

- You can now run headless tests (without a browser window) by running `npm run test`.
- CI: Tests now [run automatically](https://github.com/unpoly/unpoly/actions) for every pull request.
- All remaining CoffeeScript has been hosed off the test suite.
- All tests now use `async` / `await` instead of our legacy `asyncSpec()` helper.
- The release process was migrated from Ruby to Node.js.
- The CI setup now automatically runs tests against various integration styles, such as using an ES6 build, the migration polyfills or various CSP settings.


### Stabilization of experimental features

Many experimental features have now been declared as stable:

- `up.deferred.load()` function
- `up:deferred:load` event
- `up.event.build()` function
- `up.form.fields()` function
- `up.fragment.config.skipResponse` configuration
- `[up-etag]` attribute
- `up.fragment.etag()` function
- `[up-time]` attribute
- `up.fragment.time()` function
- `event.skip()` method for `up:fragment:loaded` event
- `up:fragment:offline` event
- `up.fragment.subtree()` function 
- `up.fragment.isTargetable()` function
- `:layer` selector
- `up.fragment.matches()` function
- `up.fragment.abort()` function
- `up:fragment:aborted` event
- `up.template.clone()` function
- `up:template:clone` event
- `up.history.location` property
- `up.history.previousLocation` property
- `up.history.isLocation()` function
- `up:layer:location:changed` event
- `event.response` property for `up:layer:accept`, `up:layer:dismiss`, `up:layer:accepted` and `up:layer:dismissed` events
- `[up-defer]` attribute
- `up.network.config.lateDelay` configuration
- `{ lateDelay }` option for `up.request()`
- `up.network.loadPage()` function
- `up:request:aborted` event
- `up:fragment:hungry` event
- `{ ifLayer }` option for `up.radio.startPolling()`
- `[up-if-layer]` modifier for `[up-poll]`
- `up:fragment:poll` event
- `up.script.config.scriptSelectors` and `up.script.config.noScriptSelectors` configuration
- `event.preventDefault()` for `up:assets:changed` event
- `up.util.noop()` function
- `up.util.normalizeURL()` function
- `up.util.isBlank.key` property
- `up.util.wrapList()` function
- `up.util.copy.key` property
- `up.util.findResult()` function
- `up.util.every()` function
- `up.util.evalOption()` function
- `up.util.pluckKey()` function
- `up.util.flatten()` function
- `up.util.flatMap()` function
- `up.util.isEqual()` function
- `up.util.isEqual.key` property
- `up.focus()` function
- `up.viewport.get()` function
- `up.viewport.root` property
- `up.viewport.saveScroll()` function
- `up.viewport.restoreScroll()` function
- `up.viewport.saveFocus()` function
- `up.viewport.restoreFocus()` function
- `new up.Params` constructor
- `up.Params#clear()` method
- `up.Params#toFormData()` method
- `up.Params#toQuery()` method
- `up.Params#add()` method
- `up.Params#addAll()` method
- `up.Params#set()` method
- `up.Params#delete()` method
- `up.Params#get()` method
- `up.Params.fromForm()` static method
- `up.Params.fromURL()` static method
- `up.RenderResult#none` property
- `up.RenderResult#ok` property
- `up.Request#layer` property
- `up.Request#failLayer` property
- `up.Request#origin` property
- `up.Request#background` property
- `up.Request#lateDelay` property
- `up.Request#fragments` property
- `up.Request#fragment` property
- `up.Request#loadPage()` function
- `up.Request#abort()` function
- `up.Request#ended` property
- `up.Response#contentType` property
- `up.Response#lastModified` property
- `up.Response#etag` property
- `up.Response#age` property
- `up.Response#expired` proprty
- `{ response }` option for `up.Layer#accept()` method and `up.layer.accept()` funciton
- `up.Layer#asCurrent()`
- `up.layer.location` and `up.Layer#location` properties
- `[up-abortable]` attribute for `[up-follow]` links
- `[up-late-delay]` attribute for `[up-follow]` links
- `{ lateDelay }` option for `up.render()`


### Migration polyfills

- [`unpoly-migrate`](https://unpoly.com/changes/upgrading) now allows to disable all deprecation warnings with `up.migrate.config.logLevel = 'none'`. This allows to keep polyfills installed without noise in the console.
- Fix a bug in `unpoly-migrate.js` where a `{ style }` string passed to `up.element.affix()` or `up.element.createFromSelector()` would sometimes be transformed incorrectly.
- Added polyfills for most breaking changes in this 3.11.0 release.



3.10.2
------

- Fix a bug where Unpoly would sometimes reset the cursor position of inputs outside the rendering fragment
- When a popup is dismissed by clicking on a focusable element in the background, focus that element instead of the popup opener (issue #706).
- Fix an inconsistency where `up.layer.accept()` and `up.layer.dismiss()` would return a fulfilled promise, despite both being sync functions.


3.10.1
------

This release fixes an error in the minified Javascript (`unpoly.min.js`) (issue #703).


3.10.0
------

Unpoly 3.10 is a major feature relase, adding support for [client-side templates](/templates), [arbitrary loading state](/loading-state) and [optimistic rendering](/optimistic-rendering). It also contains many bug fixes and quality-of-life improvements, like [Relaxed JSON](/relaxed-json).

This release contains some minor breaking changes, which are marked with the ❌ emoji in this CHANGELOG. All breaking changes are polyfilled by [`unpoly-migrate.js`](https://unpoly.com/changes/upgrading).

### Arbitrary loading state with previews

[Previews](/previews) are temporary page changes while waiting for a network request. They signal that the app is working, or provide clues for how the page will ultimately look. Because previews immediately appear after a user interaction, their use increases the perceived responsiveness of your application.

When the request ends for [any reason](/previews#ending), all preview changes will be reverted before the server response is processed. This ensures a consistent screen state in cases when a request is aborted, or when we end up updating a different fragment.

You can use previews to implement arbitrary [loading state](/loading-state). Two common applications of previews are [placeholders](/placeholders) and [optimistic rendering](/optimistic-rendering).


### Placeholders

[Placeholders](/placeholders) are temporary spinners or UI skeletons shown while a fragment is loading:

<video src="images/placeholders.webm" controls width="600" aria-label="UI skeletons are shown while screens are loading"></video>

To show a placeholder while a link is loading, set an `[up-placeholder]` attribute with the placeholder's HTML as its value:

```html
<a href="/path" up-follow up-placeholder="<p>Loading…</p>">Show story</a> <!-- mark: up-placeholder -->
```

When the link is clicked, the targeted fragment's content is replaced by the placeholder markup temporarily. When the request ends for [any reason](/previews#ending), the placeholder is removed and the original page state restored.

Instead of passing the placeholder HTML directly, you can also refer to any [template](/templates) by its CSS selector:

```html
<a href="/path" up-follow up-placeholder="#loading-template">Show story</a> <!-- mark: #loading-message -->

<template id="loading-template">
  <p>
    Loading…
  </p>
</template>
```

### Optimistic rendering

Unpoly 3.10 supports [optimistic rendering](/optimistic-rendering) as an application of previews and templates. This is a pattern where we update the page without waiting for the server. When the server eventually does respond, the optimistic change is reverted and replaced by the server-confirmed content.

For example, this is the [*Tasks* tab](https://demo.unpoly.com/tasks) in the official [demo app](https://demo.unpoly.com) running with 1000 ms latency. Note how the UI updates instantly, without waiting for the server:

<video src="images/optimistic-rendering-demo.mp4" controls width="600" aria-label="The demo app reacting instantly under high latency"></video>

Since optimistic rendering requires additional code, we recommend to use it for interactions where the duplication is low, or where the extra effort adds ignificant value for the user. Some suitable use cases include:

- Forms with few or simple validations (e.g. adding a todo)
- Forms where users would expect an immediate effect (e.g. submitting a chat message)
- Re-ordering items with drag'n'drop (because most logic is already on the client)
- High-value screens where every conversion matters

To limit the duplication of view logic, you may [use templates](#client-side-templating). By embedding templates into your responses, the server stays in control of HTML rendering.


### Client-side templating

While Unpoly apps render on the server primarily, having client-side templates can be useful
for [placeholders](/placeholders), small [overlays](/opening-overlays), or [optimistic rendering](/optimistic-rendering).

Unpoly 3.10 allows your server to embed templates into your responses. Your frontend can then clone new fragments from these templates, without making another server request.

To refer to a template, pass its CSS selector to any attribute or option that accepts HTML:


```html
<a href="#" up-target=".target" up-document="#my-template">Click me</a> <!-- mark: #my-template -->

<div class="target">
  Old content
</div>

<template id="my-template"> <!-- mark: my-template -->
  <div class="target">
    New content
  </div>
</template>
```

#### Template variables

Sometimes we want to clone a template, but with variations. For example, we may want to change a piece of text, or vary the size of a component.

Unpoly 3.10 offers many methods to implement [dynamic templates with variables](/templates#dynamic).
You can even [integrate template engines](/templates#template-engine) like [Mustache.js](https://github.com/janl/mustache.js) or [Handlebars](https://handlebarsjs.com/):

```html
<script id="results-template" type="text/mustache"> <!-- mark: text/mustache -->
  <div id="game-results">
    <h1>Results of game {{gameCount}}</h1>

    {{#players}}
      <p>{{name}} has scored {{score}} points.</p>
    {{/players}}
  </div>>
</script>
```


### Relaxed JSON

Unpoly now supports [relaxed JSON](/relaxed-json) in all attributes and options where it also accepts JSON. Relaxed JSON is a JSON dialect that that aims to be easier to write by humans. It supports syntactic sugar that you enjoy with JavaScript [object literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer):

- Unquoted property names
- Single-quoted strings
- Trailing commas

For example, you can now write `[up-data]` like this:

```html
<span class="user" up-data="{ name: 'Bob', age: 18 }">Bob</span>
```

When Unpoly outputs HTML (e.g. for the `X-Up-Context` header) it always produces regular JSON.


### Progress bar

Improvements have been made to the [global progress bar](/progress-bar), which appears when requests are tooking long to load:

- The progress bar will no longer restart its animation when a request is immediately followed by another request.
 
  For example, when a user changes an `[up-autosubmit]` form that is already waiting for a request, a second request is sent after the first request has loaded. The progress bar will now show one uninterrupted animation until all requests have loaded.

- Old versions have used a "bad response time" setting to define the delay until the [progress bar](/progress-bar) is shown.
  This setting has been renamed to "late delay" everywhere:

  | Old name | New name |
  |----------|----------|
  | ❌ `[up-bad-response-time]` | ✅  `[up-late-delay]` |
  | ❌ `{ badResponseTime }` | ✅  `{ lateDelay }` |
  | ❌ `up.network.config.badResponseTime` | ✅  `up.network.config.lateDelay` |
  | ❌ `up.Request.prototype.badResponseTime` | ✅  `up.Request.prototype.lateDelay` |
  
  
- Foreground requests can now opt out of the progress bar (and `up:network:late` events) by setting `[up-late-delay="false"]` or `{ lateDelay: false }`.





### Disabling form fields

Unpoly 3.0 has added the `[up-disable]` attribute to [disable forms while working](/disabling-forms). This release adds the following features:

- When fields are [disabled](/disabling-forms) during a render pass, and a field loses its focus, that field is now re-focused when the field is re-renabled afterwards.
- You can now [disable form fields when the user activates a hyperlink](/disabling-forms#from-link).
- Disabling now also disable non-submit buttons, like an `button[type=button]` or `input[type=button]`.
- New configuration `up.form.config.genericButtonSelectors`.
- The `{ disable }` option now also accepts an `Element` (or an array of elements) to disable.
- Fix a bug where rendering with `up.render({ disable })` would crash unless an `{ origin }` was also passed.


### Tokens are separated by comma

When a string contains multiple tokens, Unpoly used to separate those tokens with a space character.
While this is still possible, the new canonical way is to separate tokens with a comma:

| Old form (still valid) | New form |
|------------|-----------|
| ✅ `[up-layer="parent root"]` | ✅ `[up-parent="parent, root"]` |
| ✅ `[up-show-for="value1 value2"]` | ✅ `[up-show-for="value1, value2"]` |
| ✅ `[up-alias="/foo /bar"]` | ✅ `[up-alias="/foo, /bar"]` |
| ✅`up.on('event1 event2', fn)` | ✅ `up.on('event1, event2', fn)` |

In some cases tokens used to be separated by an `or` operator. This is no longer supported.
Use a comma instead:

| Old form (now invalid) | New form |
|------------|-----------|
| ❌ `[up-scroll="target or main"]` | ✅ `[up-scroll="target, main"]` |
| ❌ `[up-focus="target or main"]` | ✅ `[up-scroll="target, main"]` |



### Feedback classes

Unpoly assigns the `.up-active` class to clicked links and submit buttons, and `.up-loading` to targeted fragments that are loading new content.

These [feedback classes](/feedback-classes) have been reworked to make it easier to select working elements from CSS and JavaScript:

- `.up-active` and `.up-loading` are now always enabled by default (even when not [navigating](/navigation)). They can still disabled explicitly with an `[up-feedback=false]` attribute or a `{ feedback: false }` option.
- When submitting a form, the `<form>` element now also receives the `.up-active` class (in addition to the submit button).
- When submitting a form from a focused field, the default submit button now also receives the `.up-active` class (in addition to the field and the `<form>`).
- Added a configuration `up.status.config.activeClasses`. This allows to set custom CSS classes for working links and forms.
- Added a configuration `up.status.config.loadingClasses`. This allows to set custom CSS classes for targeted fragments that are loading new content.




### Better selector parsing

Unpoly 3.10 is smarter when parsing values with structured grammar, and no longer relies
on magic strings to split complex expressions.

For example, Unpoly can now process more complex target selectors.
Selectors like `.foo:has(.bar, .baz)` or `.foo[attr="one, two"]` used to cause   quirky behavior, but are now parsed correctly.


### Native `:has()` selector

For almost 10 years Unpoly has polyfilled the [`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) pseudo-selector for all browsers. Since then the selector has been standardized and has received [great browser support](https://caniuse.com/css-has).

Starting with this release, Unpoly will no longer include a polyfill and use the browser's native `:has()` support. Unpoly will no longer boot on old browsers that don't support `:has()` natively.


### Watching fields for changes

Unpoly has several methods to detect and process changes in form fields, most notably `[up-watch]`, `[up-autosubmit]` and `[up-validate]`. This release includes the following changes:

- The `[up-watch]` callback can now use an `options` argument. It contains an object of all [watch options](/watch-options) parsed from that field, e.g. `{ disable, preview, placeholder }`.
- The watch options `{ event, delay }` will no longer be passed to callbacks of `up.watch()` and `[up-watch]`, as these options have already been processed by Unpoly.
- ❌ `up.watch()` and `[up-watch]` will no longer process an `[up-watch-disable]` attribute. Instead the attribute is only parsed and passed to the callback as a `{ disable }` option. It is up to the callback to forward the option it to any rendering function that supports `{ disable }`.
- Fix a bug where `up.autosubmit()` options did not override options parsed from `[up-watch-...]` prefixed attributes. It is convention in Unpoly that JavaScript options [always take precedence](/attributes-and-options#options) over HTML attributes.


### Target derivation

[Target derivation](/target-derivation#derivation-patterns) is the process of finding a discriminating CSS selector for an element.
This release includes the following changes:

- `up.fragment.toTarget()` now supports a `{ strong: true }` option. This produces a more unique selector by only considering the element's `[id]` and `[up-id]` attributes. Weaker [derivation patterns](/target-derivation#derivation-patterns), like the element's class, are not considered in strong mode. The element's tag name is only considered for singleton elements like `<html>` or `<body>`.
- `up.fragment.toTarget()` can now skip [target verifcation](/target-derivation#verification) by passing a `{ verify: false }` option.
- When a [validated](/validation#validating-after-changing-a-field) field wants to update its form group, that form group is no longer targeted by its `[class]`, which would often be ambigous. Instead the form group is only targeted by its `[id]` or `[up-id]` attribute. If the form group doesn't have an `[id]` or `[up-id]` attribute, it is targeted with a `.has()` selector referencing the changed field, e.g. `fieldset:has(#changed-field)`.




### [Fragment API](/up.fragment)

- You can now [update element's inner HTML](/targeting-fragments#content) using the `.element:content` pseudo-selector. This swaps all children of `.element`, while preserving the element itself. This feature was previously documented, but didn't work yet.
- New configuration `up.fragment.config.renderOptions`. This is an object of default render options to always apply, even when not [navigating](/navigation).
- When calling `up.fragment.get()` with multiple search layers (e.g. `{ layer: "current, parent"}`), Unpoly will now search those layers in the given order.
- Calling `up.fragment.get()` with an `Element`, that element is returned without further lookups.
- New `[up-use-data]` attribute allows to [override data](/data#override) for the targeted fragment. The corresponding render options is `{ data }`.
- The render option `{ useHungry }` has been renamed to `{ hungry }`, but `{ useHungry }` is still accepted as an alias. The corresponding HTML attribute remains `[up-use-hungry]` as to not conflict with a link's or form's own `[up-hungry]` modifier.
- The render option `{ useKeep }` has been renamed to `{ keep }`, but `{ useKeep }` is still accepted as an alias. The corresponding HTML attribute remains `[up-use-keep]` as to not conflict with a link's or form's own `[up-keep]` modifier.


### [Layers](/up.layer)

- Opening a new overlay with only a `{ mode }` option has been deprecated. Always pass a `{ layer: 'new' }` option in addition to `{ mode }`.
- The layer option `{ dismissAriaLabel }` has been renamed to `{ dismissARIALabel }`
- When opening a new layer with `[up-use-data]` or `{ data }`, that data is now applied to the topmost swappable element (instead of to the overlay container). For example, `up.layer.open({ target: '#target', url: '/path', data: { ... }})` will apply the data object to the `#target` element.
- When [opening an overlay](/opening-overlays), the property `Request#layer` is now set to `'new'` (instead of to the parent layer). Also the `#fragments` property is now set to `[]` (instead of to the parent layer's main element)


### Working with node lists

Many Unpoly functions have traditionally expected content with a single DOM element at its root.
Unpoly 3.10 makes it easier to render lists of mixed `Text` and `Element` nodes:

- `[up-content]` now also accepts multiple elements, or a mix of `Text` and `Element` siblings.
- `{ content }` now accepts any `List<Node>`, e.g. the `NodeList` returned by `querySelectorAll()`.
- New experimental function `up.element.createNodesFromHTML()`. This parses a [list](/List) of [nodes](https://developer.mozilla.org/en-US/docs/Web/API/Node) from a string of HTML. Unlike `up.element.createFromHTML()`, this new function does not require a single root element in the HTML. It can parse `Text` nodes, or a mixed list of `Text` and `Element` siblings.


### Bootstrap plugin

- Clicked links and submit buttons now receive the `.active` class.


### `up.feedback` is now `up.status`

The `up.feedback` package has been renamed to `up.status`. This package exposed no public JavaScript functions, but does have some configuration settings you need to rename:

| Old name | New name |
|------------|-----------|
| ❌ `up.feedback.config.currentClasses` | ✅ `up.status.config.currentClasses` |
| ❌ `up.feedback.config.navSelectors` | ✅ `up.status.config.navSelectors` |
| ❌ `up.feedback.config.noNavSelectors` | ✅ `up.status.config.noNavSelectors` |


### Other changes

- You can now [embed CSP nonces](/script-security#callback-nonces) into the attribute callbacks `[up-on-keep]`, `[up-on-hungry]` and `[up-on-opened]`.
- New property `up.Request#ended` indicates whether this request is no longer waiting for the network for any reason. It is `true` when the server has responded or when the request
  [failed](/failed-responses) or was [aborted](/aborting-requests).
- The attribute `[up-flashes]` is now stable (discussion #679)
- Clicking a link with a page-local `#hash` in the `[href]` will now honor [fixed layout obstructions](/up-fixed-top) if the browser location is already on that `#hash`.
- Fix a bug where a link with `[up-confirm]` would show the confirmation dialog before [preloading](/preloading).
- Fix a crash with `up.submit({ submitButton: false })`.
- Fix a bug where rendering with `{ focus: 'keep' }` would sometimes re-focus elements that never lost focus.
- Fix a bug where opening an overlay would stop infinite scrolling (discussion #694).
- Fix a bug where Unpoly would create duplicate cache entries when the server redirects to a fully qualified URL (with protocol and hostname).
- Fix a bug where when a link with `[up-preload]` renders expired content from the cache, unhovering the link would abort the revalidation request.



3.9.5
-----

This is another maintenance release that addresses some bugs while we're working on the next major feature update.

### Changes

- Fix a bug where targeted fragments would show the default [focus outline](/focus-visibility) on Safari. Regression introduced in 3.9.4.
- Fix a bug where an overlay would show double scrollbars if `<html>` was chosen as the overflow element. Regression introduced in 3.8.0.
- Prevent Unpoly from following or preloading links with the `tel:` scheme when Unpoly is configured to [handle all links](/handling-everything) (by @begerdom). 


3.9.4
-----

- Fix `.up-focus-hidden` style from causing flickering outlines when there is a `transition` on `outline-color` (by @foobear).


3.9.3
-----

This is a maintenance release that addresses some bugs while we're working on the next major feature update.

### Changes

- Fix an error being thrown when a caching request is tracking an existing request to the same URL, and that existing request responds with an [error status](/failed-responses) (issue #676).
- Fix a bug where a modal overlay could not be closed when a child popup would be open below the screen fold.
- Focus is no longer trapped in popup overlays. Focus remains trapped in all other overlay modes, but this can be disabled by setting `up.layer.config.overlay.trapFocus = false`.
- The dismiss button in overlays now has a hand cursor (by @apollo13).
- Fix a bug where links with relative URLs were sometimes [revalidated](/caching#revalidation) against the wrong base URL (issue #669).


3.9.2
-----

- Fix a bug where `up:fragment:loaded` listeners could not open a new layer by setting `event.renderOptions.layer = "new"`.


3.9.1
-----

- Fix a bug where any `form[up-target]` would receive a `[role=button]` attribute (issue #668).


3.9.0
-----

This release brings many fixes and quality-of-life improvements that were requested by the community.

The vast majority of these changes are backward compatible. One breaking change can be found with [making links followable](#making-links-followable). Existing usage is polyfilled by [`unpoly-migrate.js`](/changes/upgrading).


### Emitting events on buttons

- You can now use `[up-emit]` to emit an event when any element is clicked. In particular this works with a `<button>` or any [faux-interactive element](/faux-interactive-elements) (issue #416).


### Improvements to faux-interactive elements

Sometimes you need to add a `click` listener to non-interactive elements (like `<span>`). Unpoly helps you [prevent accessibility issues](/faux-interactive-elements#accessibility) with such "faux-interactive" elements, by offering the `[up-clickable]` attribute and `up.link.config.clickableSelectors` configuration.
Unpoly also leverages this for its own faux-interactive elements, such as `[up-emit]` or `[up-dismiss]`. 
This release improves the handling of faux-interactive elements:

- A new documentation guide [Clicking non-interactive elements](/faux-interactive-elements) details all the methods to emulate interactivity on non-interactive elements like `<span>` or `<div>`.
- You can now define exceptions to `up.link.config.clickableSelectors`, by setting an `[up-clickable=false]` attribute or configuring `up.link.config.noClickableSelectors`.
- Adjusted the handling of keyboard input to better match the behavior of real buttons and links. In particular, faux-interactive elements with a [button role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role) (default) can be activated with both `Space` and `Enter` keys. Faux-interactive elements with a `[role=link]` can only be activated with the `Enter` key.
- Faux-interactive elements that also have the `[up-follow]` attribute now default to `[role=link]` (instead of the default `[role=button]`).
- Faux-interactive elements with a button role no longer have the "hand" (or "pointer") cursor.
- Fix a bug where faux-interactive elements inside popups could not be activated with the keyboard (#653).


### Making links followable

- Links with only an `[up-href]` attribute are no longer followable by default. They also require an `[up-follow]` attribute or a match in `up.link.config.followSelectors`. This change was made to remove confusion with other features that use `[up-href]`, such as `[up-defer]` and (since this release) `[up-poll]`.
- Links with only an `[up-instant]` attribute are no longer followable by default. They also require an `[up-follow]` attribute or a match in `up.link.config.followSelectors`. This change was made to remove confusion with other features that use `[up-instant]`, in particular `up:click` on [faux-interactive elements](/faux-interactive-elements).



### Polling

- Listeners to the `up:fragment:poll` event can now inspect or mutate `event.renderOptions`. This allows more control over the polling request and sub-sequent render passes.
- `[up-poll]` elements can now use the `[up-href]` attribute to poll from a different URL. By default Unpoly will poll the URL from which the element was originally loaded. The old method over overriding `[up-source]` is still supported, but `[up-href]` is the preferred way of doing this going forward.
- `[up-poll]` elements can now use the `[up-method]` attribute to choose a different HTTP method for polling requests.
- `[up-poll]` elements can now use the `[up-params]` attribute to add custom params to polling requests.
- `[up-poll]` elements can now use the `[up-headers]` attribute to add custom headers to polling requests.


### Forms

- Focus is now preserved when submitting a form by pressing `Enter` from a focused field ([discussion #658](https://github.com/unpoly/unpoly/discussions/658)).
- The `up.submit()` now includes the `[name]` and `[value]` of the default submit button in the submitted params. By default the form's first submit button will be assumed. You can prevent this with `{ submitButton: false }`, or pass a different button element as `{ submitButton }`.
- Fix an interop issue with the [Shoelace](https://shoelace.style/) web component library, where a failed response could not be processed when the form was submitted with an `<sl-button>` ([discussion #643](https://github.com/unpoly/unpoly/discussions/643)).



### Smooth scrolling

- Support [smooth scrolling](/scroll-tuning#animating-the-scroll-motion) when swapping a fragment.
- Fix smooth scrolling when [prepending or appending](/targeting-fragments#appending-or-prepending) content.


### Various

- Fix: up-alias not matching URL query string with asterix after shash (#542)
- Fix a bug where an overlay with viewport would not correctly shift multiple right-fixed elements
- `[up-defer]` elements no longer have a hand cursor
- Events like `up:link:follow` can now [open a layer with a given mode](/opening-overlays#modes) using the shorthand notation `event.renderOptions.layer = "new drawer"`.
- Avoid logging `Uncaught AbortError` when the user presses the back button, but a script prevents the `up:location:restore` event.
- Avoid logging `Uncaught AbortError` when the user closes the overlay, but a script prevents the `up:layer:dismiss` or `up:layer:accept` event.
- Reduce the number of [layer lookups](/up.layer.get) during a render pass.



3.8.0
-----

This release brings many improvements that were requested by the community.

The vast majority of these changes are backward compatible. Some breaking changes can be found with the [Reworked style helpers](#reworked-style-helpers). Existing calls are polyfilled by [`unpoly-migrate.js`](/changes/upgrading).


### Lazy loading content

You can now [lazy load additional fragments](/lazy-loading) when a placeholder enters the DOM or viewport. By deferring the loading of non-[critical](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path) fragments with a separate URL, you can paint important content earlier.

For example, you may have a large navigation menu that only appears once the user clicks a menu icon:

```html
<div id="menu">
  Hundreds of links here
</div>
```

To remove the menu from the initial render pass, extract its contents to its own route, like `/menu`.

In the initial view, only leave a placeholder element and mark it with an `[up-defer]` attribute. Also set an `[up-href]` attribute with the URL from which to load the deferred content:

```html
<div id="menu" up-defer up-href="/menu"> <!-- mark: up-defer -->
  Loading...
</div>
```

When the `[up-defer]` placeholder is rendered, it will immediately make a request to fetch its content from `/menu`. You may also delay the request until the placeholder is [scrolled into the viewport](/lazy-loading#on-reveal) or [control the timing from JavaScript](/lazy-loading#scripted).

See [lazy loading content](/lazy-loading) for a full example and more details.



### Preloading links eagerly or lazily

For many years Unpoly has supported the `[up-preload]` attribute. This would preload a link when the user [hovers](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event) over it:

```html
<a href="/path" up-preload>Hover over me to preload my content</a>
 ```

You can now preload a link *as soon as it appears in the DOM*, by setting an [`[up-preload="insert"]`](/up-preload#up-preload) attribute. This is useful for links with a high probability of being clicked, like a navigation menu:

```html
<a href="/menu" up-layer="new drawer" up-preload="insert">≡ Menu</a> <!-- mark: insert -->
```

To "lazy preload" a link when it is scrolled into the [viewport](/up-viewport), you can now set an [`[up-preload="reveal"]`](/up-preload#up-preload) attribute. This is useful when an element is [below the fold](https://www.optimizely.com/optimization-glossary/below-the-fold/) and is unlikely to be clicked until the the user scrolls:

```html
<a href="/stories/106" up-preload="reveal">Full story</a> <!-- mark: reveal -->
```


### Infinite scrolling

[Deferred fragments](/lazy-loading) that [load when revealed](/lazy-loading#on-reveal) can implement [infinite scrolling](/infinite-scrolling) without custom JavaScript.

All you need is an HTML structure like this:

```html
<div id="pages">
  <div class="page">items for page 1</div>
</div>

<a id="next-page" href="/items?page=2" up-defer="reveal" up-target="#next-page, #pages:after">
  load next page
</div>
```

See [infinite scrolling](/infinite-scrolling) for a full example and more details.


### Enabling or disabling Unpoly features with boolean attributes

Most Unpoly attributes can now be enabled with a value `"true"` and be disabled with a value `"false"`:

```html
<a href="/path" up-follow="true">Click for single-page navigation</a> <!-- mark: true -->
<a href="/path" up-follow="false">Click for full page load</a> <!-- mark: false -->
```

Instead of setting a `true` you can also set an empty value:

```html
<a href="/path" up-follow>Click for single-page navigation</a>
<a href="/path" up-follow="">Click for single-page navigation</a>
<a href="/path" up-follow="true">Click for single-page navigation</a>
```

Boolean values can be helpful with a server-side templating language like ERB, Liquid or Haml, when the attribute value is set from a boolean variable:

```erb
<a href="/path" up-follow="<%= is_signed_in %>">Click me</a> <%# mark: is_signed_in %>
```

This can also help when you're generating HTML from a different programming language and want to pass a `true` literal as an attribute value:

```ruby
link_to 'Click me', '/path', 'up-follow': true
```

This behavior is available for most attributes:

- `[up-follow]`
- `[up-submit]`
- `[up-instant]`
- `[up-preload]`
- `[up-nav]`
- `[up-expand]`
- `[up-keep]`
- `[up-hungry]`
- `[up-poll]`
- `[up-defer]`
- `[up-validate]`
- `[up-autosubmit]`
- `[up-watch]`


### Request batching

When queueing multiple requests to the same URL, Unpoly will now send a single request with a [merged `X-Up-Target` header](/X-Up-Target#merging).

For example, these two render passes render different selectors from `/path`:

```js
up.render('.foo', { url: '/path', cache: true })
up.render('.bar', { url: '/path', cache: true })
```

Unpoly will send a single request with both targets:

```http
GET /path HTTP/1.1
X-Up-Target: .foo, .bar
```

This allows you to have multiple [deferred placeholders](/lazy-loading#loading-multiple-fragments-from-the-same-url) that load from the same URL efficiently.


### More cache hits for tailored responses

The following is a change for server routes that use the `Vary` header to optimize their responses to only include the requested `X-Up-Target`. 

When requests [target multiple fragments](/targeting-fragments#multiple) and the server responds with a `Vary` header, that response is now a cache hit for each individual selector:

<table>
  <tr>
    <th class="split-table-head">
    </th>
    <th align="left">
      🠦 <code>X-Up-Target: .foo, .bar</code><br>
      🠤 <code>Vary: X-Up-Target</code>
    </th>
  </tr>  
  <tr>
    <th align="left">🠦 <code>X-Up-Target: .foo</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th align="left">🠦 <code>X-Up-Target: .bar</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th align="left">🠦 <code>X-Up-Target: .foo, .bar</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th align="left">🠦 <code>X-Up-Target: .bar, .foo</code></th>
    <td>✔️ cache hit</td>
  </tr>
  <tr>
    <th align="left">🠦 <code>X-Up-Target: .baz</code></th>
    <td>❌ cache miss</td>
  </tr>
  <tr>
    <th align="left">🠦 <code>X-Up-Target: .foo, .baz</code></th>
    <td>❌ cache miss</td>
  </tr>
  <tr>
    <th align="left">🠦 <i>No <code autolink="false">X-Up-Target</code></i></th>
    <td>❌ cache miss</td>
  </tr>
</table>


See [how cache entries are matched](/caching#how-cache-entries-are-matched) for a detailed example.


### Cached content is retained while offline

This release fixes some long-standing issues where the cache was evicted when a request failed due to [network issues](/network-issues), or when the server responds with an empty response.

This fix restores the indented behavior that, even without a connection, [cached content](/caching) will remain navigatable for [90 minutes](/up.network.config#config.cacheEvictAge). This means that an offline user can instantly access pages that they already visited this session.


### Quick access to the form element in form events

Form-related events like `up:form:submit` and `up:form:validate` are emitted on the element that caused the event. For example, `up:form:submit` is emitted on the submit button that was pressed.

This made it somewhat inconvenient to access the form element:

```js
up.on('up:form:submit', function(event) {
  let form = event.target.closest('form')
  console.log("form is", form)
})
```

You can now access the form element through a `{ form }` property on the event object: 

```js
up.on('up:form:submit', function({ form }) {
  console.log("form is", form)
})
```

### Improvements to history restoration

Several improvements have been made to the way Unpoly [handles the browser's "back" button](/restoring-history).


#### Ensuring fresh content

In earlier versions, when the user pressed the back button, Unpoly would sometimes restore the page with stale content.

Starting with 3.8.0, restored content is now [revalidated](/caching#revalidation) with the server. This ensures that content is shown with the most recent data.


#### Custom restoration behavior

Listeners to `up:location:restore` may now mutate the `event.renderOptions` event to customize the render pass that is about to restore content:

```js
up.on('up:location:restore', function(event) {
  // Update a different fragment when restoring /special-path  
  if (event.location === '/special-path') {
    event.renderOptions.target = '#other'
  }
})
```

As a reminder, you can also completely substitute Unpoly's render pass with your own restoration behavior, by preventing `up:location:restore`. This will prevent Unpoly from changing any element. Your event handler can then restore the page with your own custom code:

```js
up.on('up:location:restore', function(event) {
  // Stop Unpoly from rendering anything
  event.preventDefault()
  
  // We will render ourselves
  document.body.innerText = `Restored content for ${event.location}!`
})
```


### Reworked style helpers

This release reworks all functions that work with CSS properties: 

- `up.element.setStyle(element, props)`
- `up.element.styleNumber(element, prop)`
- `up.element.style(element, propOrProps)`
- `up.element.createFromSelector(selector, { style })`
- `up.element.affix(container, selector, { style })`
- `up.animate(element, lastFrameProps)`


#### Support for custom properties

All functions that work with CSS properties now also support [custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) ("CSS variables"):

```js
// Returns the computed value of the `--custom-prop` property.
up.element.style(div, '--custom-prop')

// Sets the `--custom-prop` property as an inline `[style]` attribute
up.element.setStyle(div, { '--custom-prop': 'value' })
```

#### Property names must be in kebab-case

In earlier versions Unpoly functions accepted property names in either [camelCase](https://developer.mozilla.org/en-US/docs/Glossary/Camel_case) or [kebab-case](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case).

As custom properties don't have a camelCase equivalent, now only kebab-case is supported:

```js
// ❌ camelCase property names are no longer supported
up.element.setStyle(div, { backgroundColor: 'red' })

// ✔️ Property names must now be in kebab-case
up.element.setStyle(div, { 'background-color': 'red' })
```

To help with upgrading, [`unpoly-migrate.js`](/changes/upgrading) Unpoly will rename camelCase keys for you.


#### Length values must have a unit

CSS requires length values (like `width`, `top` or `margin`) to have a unit, e.g. `width: 200px`. In earlier versions Unpoly silently added a `px` unit to length values that were missing a unit.

This approach required Unpoly to keep a list of CSS properties that denote lengths, which was unsustainable. You now always need to pass length values with a unit: 

```js
// ❌ Length values without unit is uo longer supported
up.element.setStyle(div, { height: 50 })

// ✔️ Length values now require a unit
up.element.setStyle(div, { height: '50px' })
```

To help with upgrading, [`unpoly-migrate.js`](/changes/upgrading) Unpoly will add `px` units to unit-less length values.



### Rebrushed unpoly.com

The design of [unpoly.com](https://unpoly.com) was reworked with fresh colors, better spacing and clearer fonts.

All documentation pages now have a table of contents to quickly find the section you're looking for.

Several new guides were also added:

- [Attributes and options](/attributes-and-options)
- [Preloading](/preloading)
- [Lazy loading](/lazy-loading)
- [Infinite scrolling](/infinite-scrolling)



### Other changes

- `up.element.numberAttr()` now parses negative numbers.
- When [updating history](/updating-history), the `html[lang]` is now also updated. This can be prevented by setting an `[up-lang=false]` attribute or passing a `{ lang: false }` option.
- The function `up.util.microtask()` was deprecated. Use the browser's built-in [`queueMicrotask()`](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask) instead.
- [Right-anchored](/up-anchored-right) can now control their appearance while a scrolling overlay is open, by styling the `.up-scrollbar-away` class.
- Fix a bug where the back button did not work after following a link that contains an anchor starting with a number (issue #603).
- Clickable elements now get an ARIA role of `button`. In earlier versions these elements received a link `link` role.
- Fix a bug where animating with `{ duration: 0 }` would apply the default duration instead of skipping the animation (issue #588).
- You can now exclude navigational containers from applying `.up-current` by adding a selector to `up.status.config.noNavSelectors`.



3.7.3
-----

- Fix a bug where, when rendering multiple fragments from a [cached](/caching) response, the new fragments would not be [revalidated](/caching#revalidation).
  This also affected render passes with `[up-hungry]` fragments.
- [Targeting sibling elements](/targeting-fragments#targeting-a-sibling-element) now supports union selectors like `.parent .foo, .parent .bar`.


3.7.2
-----

### Validation

This change addresses multiple edge cases with concurrent user input during [form validations](/validation):

- It is now possible to queue a validation for a fragment while a validation request for the same target is still loading.
- Validations no longer throw an error if a targeted fragment is destroyed while a validation request is loading. Instead Unpoly will only update the fragments that are still present on the page (if any).
- Validations are now aborted if the entire `<form>` element is [aborted](/aborting-requests). Previously individual validations were aborted when their target was aborted.
- `up.validate()` now rejects with an `up.Aborted` error if a debounce delay was aborted (by aborting the `<form>` element).
- When a new validation is queued while a previous validation request is still loading, the full debounce delay of the new validation is now honored.


### Autosubmit fixes

This change fixes two more regressions for `[up-autosubmit]`, introduced by [3.7.0](https://unpoly.com/changes/3.7.0):

- When the user changes a form field while a previous autosubmission is still loading, prevent that new change from being lost.
- A debounce delay is now aborted if the entire `<form>` element is aborted. It no longer aborts the delay when the form's target is aborted.

### Fragment API

- [Optional target selectors](/targeting-fragments#optional-targets) (with `:maybe` suffix) are now included in the `X-Up-Target` header if they match in the current page. Previously optional selector parts were always omitted from `X-Up-Target`.
- The event `up:fragment:aborted` now has a new `{ reason }` property. Its a value is a string describing the reason for the fragment being aborted.


3.7.1
-----

This change fixes two regressions for form field watchers, introduced by [3.7.0](https://unpoly.com/changes/3.7.0):

- When a change is detected while waiting for an async callback, prevent the new callback from crashing with `Cannot destructure property { disable } of null`.
- When a change is detected while waiting for an async callback, the full debounce delay of that new change is honored.


3.7.0
-----

### Focus ring visibility

You can now control whether a focused fragment shows a [visible focus ring](/focus-visibility).

Because Unpoly [often focuses new content](/focus#auto), you may see focus outline appear in unexpected places.
Focus rings are important for users of keyboards and screen readers to be able to orient themselves
as the focus moves on the page. However, mouse and touch users often dislike the visual effect of a focus ring.

To help your CSS show or hide focus rings in the right situation, Unpoly assigns CSS classes
to the elements it focuses:

- If the user [interacted with the keyboard](/up.event.inputDevice) or if the focused element is a [form field](/up.form.config#config.fieldSelectors), Unpoly will set
  an `.up-focus-visible` class.
- If the user interacted with
  via mouse, touch or stylus, Unpoly will set an `.up-focus-hidden` class instead.

You can use these classes to [hide unwanted focus rings](/focus-visibility#hide), or [style focus rings on new components](/focus-visibility#show).

The following supporting changes have also been made:

- You can set `up.viewport.config.autoFocusVisible` to a function that decides if an element should get a `.up-focus-visible` or `.up-focus-hidden` class.
- Added a new property `up.event.inputDevice`. Its value is a string describing the class of input device used for the current task.
- Unpoly will try to force or unset [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) as it sets focus classes, but can only do so in [some browsers](https://caniuse.com/mdn-api_htmlelement_focus_options_focusvisible_parameter).
- The `up.focus()` function accepts a new `{ focusVisible }` option to control whether `.up-focus-hidden` or `.up-focus-visible` is set on a focused element.

See [Focus ring visibility](/focus-visibility) for more details and examples.


### Reacting to form changes

This release addresses many edge cases with features that watch form fields for changes, in particular `[up-watch]`, `[up-autosubmit]` and `up.watch()`:

- Watchers now detect changes in fields that were inserted dynamically later. This regression was introduced by Unpoly 3.0.
- Watchers now detect changes when the form is [reset](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/reset).
- Fix an issue where `[up-autosubmit]` would not work on forms that also have [dependent fields](/reactive-server-forms) using `[up-validate]`.
- Watchers no longer run callbacks if the form was [aborted](/aborting-requests) or detached while [waiting for a previous async callback](/up-watch#async-callbacks).
- Watchers now abort their [debounce delay](/watch-options#debouncing) if the entire form is aborted. Previously it would abort the delay if any watched field was aborted.
- `[up-autosubmit]` now aborts a debounce delay if either the form element or the [form's target](/up-submit#up-target) are aborted. It no longer aborts the delay if any watched field is aborted.


### Other changes

- `up.on()` takes a `{ capture: true }` option to register a listener that runs before the event is emitted on the element.
- Scrolling now defaults to `{ behavior: 'instant' }` to prevent picking up a `scroll-behavior` CSS property. To do pick up the property, pass `{ behavior: 'auto' }`.
- New function `up.form.isField()`. It returns whether the given element is a [form field](/up.form.config#config.fieldSelectors). 


3.6.1
-----

- Fix a bug where [new overlays](/opening-overlays) would not have history if the initial fragment matches a [layer-specific main target](https://unpoly.com/up-main#overlays) like `[up-main=modal]`.


3.6.0
-----

### Targeting fragments

- Unpoly-specific pseudo selectors like `:main` or `:layer` can now be used in a compound target, e.g. `:main .child`.
- Targeting `:main` will no longer [match in the region of the interaction origin](/targeting-fragments#ambiguous-selectors)). It will now always use the first matching selector in `up.fragment.config.mainTargets`.
- Fix a bug where following a navigation item outside a [main](/main) element would focus the `<body>` instead of the main element.

### Performance improvements

- Unpoy now uses the native `:has()` selector [where available](https://developer.mozilla.org/en-US/docs/Web/CSS/:has). Unpoly's polyfill for `:has()` will remain included for the time being. It will be removed as Firefox' `:has()` support has reached the majority of users (available on Nightly now). 
- Improve performance of many element lookups, by finding elements via CSS selectors (vs. filtering lists with JavaScript).

### Support for [structured data markup](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

- Structured data in `script[type="application/ld+json"]` elements is considered a meta tag that will be [updated with history changes](/updating-history#history-state).
- `script[type="application/ld+json"]` elements in are now preserved in new fragments with `up.fragment.config.runScripts = false`.

### Bugfixes and minor improvements

- CSP nonces [embedded into attribute callbacks](https://unpoly.com/csp#nonceable-attributes) now work with [`Content-Security-Policy-Report-Only`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only).
- When the `X-Up-Validate` header value exceeds 2048 characters, it is now set to `:unknown`.
  This is to prevent web infrastructure from rejecting an overly long request line with an `413 Entity Too Large` error.
- Fix a bug where `up:assets:changed` would be emitted for every response when configuring `up.fragment.config.runScripts = false`.
- `up.form.isSubmittable()` now returns `false` for forms with a cross-origin URL in their `[action]` attribute.
- `up.util.contains()` now works on `NodeList` objects.
- You can now [configure](/up.script.config#config.scriptSelectors) which elements are removed by `up.fragment.config.runScripts = false`.




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
- When a new overlay's initial location matches its [location-based close condition](/closing-overlays#location-condition),
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

[Overlays with history](/history-in-overlays) now update meta tags when opening. When the overlay closes the parent layer's meta tags are restored.


#### Deprecating `[up-hungry]` in the `<head>` 

Existing solutions using `[up-hungry]` to update meta tags can be removed from your application code.

Other than `[up-hungry]` the new implementation can deal with meta tags that only exist on some pages.


#### Opting in or out

See `[up-meta]` for ways to include or exclude head elements from synchronization.

You can disable the synchronization of meta tags [globally](/up.history.config#config.updateMetaTags) or [per render pass](/up.render#options.metaTags):

```js
up.render('.element', { url: '/path', history: true, metaTags: false }) // mark: metaTags
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
- Hungry elements with transitions now delay the [`up.render().finished`](/render-lifecycle#postprocessing) promise.



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

- Compilers now see updated [feedback classes](/feedback-classes) for the current render pass. In particular `.up-current` classes are updated before compilers are called.
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
- [Cache revalidation](/caching#revalidation) now updates the correct element when the initial render pass matched in the [region of the clicked link](/targeting-fragments#ambiguous-selectors) and that link has since been detached.
- Rendering no longer forces a full page load when the initial page was loaded with non-GET, but the render pass does not change history.
  This allows to use `[up-validate]` in forms that are not [submitted through Unpoly](/submitting-forms).
- Updates for `[up-keep]` no longer need to also be `[up-keep]`. You can prevent keeping by setting `[up-keep=false]`. This allows you to set `[up-keep]` via a [macro](/up.macro).
- Fix a bug where reloading a fragment that was rendered from local content would be reloaded from path `"/true"` (sic).
- Fix a bug where, when revalidating a [fallback target](/targeting-fragments#providing-a-fallback-target), we would log that we're `"revalidating undefined"`


### Network quality is no longer measured

Previous versions of Unpoly adapted the behavior some features when it detected high latency or low network throughput.
Due to cross-browser support for the [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API),
measuring of network quality was removed:

- Unpoly no longer doubles [poll](/up-poll) intervals on slow connections. The configuration `up.radio.config.stretchPollInterval` was removed.
- Unpoly no longer prevents [preloading](/preloading) on slow connections. The configuration `up.link.config.preloadEnabled = 'auto'` was removed.

  To disable preloading based on your own metrics, you can still prevent the `up:link:preload` event.
- The configuration `up.network.config.badDownlink` was removed.
- The configuration `up.network.config.badRTT` was removed.
- The function `up.network.shouldReduceRequests()` was removed.

Unpoly retains [all other functionality for dealing with network issues](/network-issues).


### Fragment API

#### More control over region-aware fragment matching

When [targeting fragments](/targeting-fragments), Unpoly will prefer to
[match fragments in the region of the user interaction](/targeting-fragments#ambiguous-selectors). For example, when
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
- Unpoly 3.0.0 introduced a [third `meta` argument for compilers](/enhancing-elements#meta)
  containing information about the current render pass:

  ```js
  up.compiler('.user', function(element, data, meta) {
    console.log(meta.response.text.length)        // result: 160232
    console.log(meta.response.header('X-Course')) // result: "advanced-ruby"
    console.log(meta.layer.mode)                  // result: "root"
    console.log(meta.revalidating)                // result: false
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
- The [`[up-on-offline]`](/up-follow#up-on-offline) attribute now supports a [CSP nonce](/script-security#callback-nonces).
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

- `unpoly.js` is now compiled using ES2021 (up from ES2020). The [ES6 build](/install/legacy-browsers) for legacy browsers remains available.
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
   up-on-accepted="up.render('.companies', { response: event.response }"> <!-- mark: event.response -->
  New company
</a>
```

The `{ response }` property is available whenever a server response causes an overlay to close:

- When a [server-sent event](/X-Up-Events) matches a [close condition](/closing-overlays#close-conditions).
- When the new location matches a [close condition](/closing-overlays#close-conditions).
- When the server [explicitly closes](/closing-overlays#from-server) an overlay using an HTTP header.

### Rendering `up.Response` objects

If you have manually fetched content from the server, you can now pass an `up.Response` object as a `{ response }` option to render its contents:

```js
let response = await up.request('/path')
up.render({ target: '.target', response })
```

The various ways to provide HTML to rendering functions are now summarized on a [new documentation page](/providing-html).


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
- A new default render option is `{ abort: 'target' }`. This [aborts earlier requests](/aborting-requests)
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

Unpoly 3 expands your options to [hook into specific stages](/render-lifecycle) of the rendering process in order to change the result or handle error cases:

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
- ⚠️ When Unpoly uses the `{ origin }` to [resolve ambiguous selectors](/targeting-fragments#ambiguous-selectors), that origin is now also rediscovered in the server response. If the origin could be rediscovered, Unpoly prefers matching new content closest to that.
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
    console.log(meta.response.text.length)        // result: 160232
    console.log(meta.response.header('X-Course')) // result: "advanced-ruby"
    console.log(meta.layer.mode)                  // result: "root"
    console.log(meta.revalidating)                // result: true
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
- When [scrolling to a fragment](/scrolling#target), [obstructing elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport) that are hidden are now ignored.


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

See [Reactive server forms](/reactive-server-forms) for a full example.


#### Watching fields for changes

Various changes make it easier to watch fields for changes: 

- The function `up.observe()` has been renamed to `up.watch()`.
- The attribute `[up-observe]` has been renamed to `[up-watch]`.
- Added [many options](/watch-options) to control [watching](/up-watch), [validation](/validation) and [auto-submission](/up-autosubmit):
  - You can now control which events are observed by setting an `[up-watch-event]` attribute or by passing a `{ watch }` option.
  - You can now control whether to show [navigation feedback](/up.status) while an async callback is working by setting an `[up-watch-feedback]` attribute or by passing a `{ feedback }` option.
  - You can now debounce callbacks by setting an `[up-watch-delay]` attribute or by passing a `{ delay }` option.
  - You can now [disable form fields](/watch-options#disabling) while an async callback is working by setting an `[up-watch-deisable]` attribute or by passing a `{ disable }` option.
  - All these options can be used on individual fields or [set as default for multiple fields](/watch-options#multiple-fields) or entire forms.  
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

  Common use cases for conditional requests are [polling](/up-poll) or [cache revalidation](/caching#revalidation). 
- Unpoly now remembers the standard `Last-Modified` and `E-Tag` headers a fragment was delivered with.
  
  Header values are set as `[up-time]` and `[up-etag]` attributes on updated fragment. Users can also set these attributes manually in their views, to use different ETags for individually reloadable fragments.
- When a fragment is reloaded (or polled), these properties are sent as `If-Modified-Since` or `If-None-Match` request headers.
- Server can render nothing by sending status `304 Not Modified` or status `204 No Content`.
- Reloading is effectively free with conditional request support.
- ⚠️ The header `X-Up-Reload-From-Time` was deprecated in favor of the standard `If-Modified-Since`.



#### Handling connection loss

Unpoly lets you handle many types of [connection problems](/network-issues). The objective is to keep your application accessible as the user's connection becomes slow, [flaky](/network-issues#flaky-connections) or [goes away entirely](/network-issues#disconnects).

Unpoly 3 lets you handle [connection loss](/network-issues#disconnects) with an `{ onOffline }` or `[up-on-offline]` callback:

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
- [Render hooks](/render-lifecycle)
- [Aborting requests](/aborting-requests)
- [Handling failed responses](/failed-responses)
- [Attaching data to elements](/data)
- [Optimizing responses](/optimizing-responses)
- [Controlling focus](/focus)
- [Validating forms](/validation)
- [Disabling forms while working](/disabling-forms)
- [Reactive server forms](/reactive-server-forms)
- [Watch options](/watch-options)
- [Caching](/caching)
- [Handling network issues](/network-issues)
- [Conditional requests](/conditional-requests)
- [Progress bar](/progress-bar)
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
- Working with strict Content Security Policies


### Migration polyfills

- New polyfills for almost all functionality that was deprecated in this version 3.0.0. 
- When [`unpoly-migrate.js`](/changes/upgrading) migrates a renamed attribute, the old attribute is now removed.
- Fix a up where `unpoly-migrate.js` would not rewrite the deprecated `{ reveal }` option when navigating.
- ⚠️ The legacy option `up.render({ data })` and `up.request({ data })` is no longer renamed to `{ params }` (renamed in Unpoly 0.57).

  Unpoly now uses the `{ data }` option to [preserve element data through reloads](/data#preserving).

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



