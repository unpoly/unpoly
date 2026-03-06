# Unpoly 3.13.0

## Animations

- Animations now use the **Web Animations API** instead of CSS transitions.
- This means Unpoly animations no longer pause existing CSS transitions on the animated element -- both play simultaneously.
- The `fade-out` animation now starts from the element's current opacity, rather than always starting from `1.0`.

## Focus

- The previous default of `{ focus: 'keep' }` for all render passes has been removed. You can restore the old behavior by setting `up.fragment.config.renderOptions.focus = 'keep'`.
- When appending/prepending, focus is now placed on the **leading element** instead of the old container element.
- When revealing a **`#hash` fragment** from the address bar or a hash link, Unpoly now also **focuses** the matching element (#787).
- Overlays are now **focused before the opening animation** starts, rather than after.

## Scrolling

- New **`{ scroll: 'keep' }`** option preserves scroll positions of all viewports around the swapped fragment. This also works when reloading or when the location changes. Note that this is different from `scroll: false`.
- New **`{ scroll: <number> }`** option scrolls viewports to an absolute pixel position. Positive values scroll from the top, negative values scroll from the bottom (e.g. `-0` scrolls to the very bottom). See [Scrolling to a pixel position](/scrolling#absolute-positions).
- New **`{ scrollMap }`** option allows controlling scroll behavior independently for each target in a multi-fragment update. For example: `{ scrollMap: { '#sidebar': 'target', '#main': 'top' } }`. The map also supports custom pseudo-selectors like `:main` and the `'*'` wildcard.
- Also Available as `[up-scroll-map]` attribute on links and forms.
- **`up.reload()` now keeps scroll positions by default.** When reloading, `{ scroll: 'keep' }` and `{ focus: 'keep' }` are now the defaults.

## Status effects

- `[up-nav]` links can now set `[up-alias]` from a [macro](/up.macro).
- Fragments are marked with an **`.up-revalidating`** CSS class while revalidating with the server after rendering from a stale cache entry. Additional classes can be configured in `up.status.config.revalidatingClasses`. Note that `.up-loading` and `.up-active` are *not* set during revalidation.

## Fragment rendering

- New default reload options can be configured in `up.fragment.config.reloadOptions`.
- The `up.RenderResult#target` property now reflects the **actual resolved target selector** used, rather than the originally requested one (e.g. resolving `:main` to the concrete selector).
- When an `[up-keep]` element is not targetable, Unpoly now prints a **warning** instead of crashing the render pass.
- Compiler's third `meta` argument now contains an `{ ok }` properties. It indicates if the fragment is being rendered from a successful response (`200 OK`). Rendering HTML from an existing string is always considered successful.
- 
- The `up:fragment:inserted` event now includes **meta properties**: `{ layer, revalidating, ok }`, matching what compilers receive.


## Mapping selectors to data

Links and forms can now use an [`[up-use-data-map]`](/up-follow#up-use-data) attribute or [`{ dataMap }`](/up.render#options.data) option to map selectors to data objects.
When a selector matches any element within an updated fragment, the matching element is compiled with the mapped data:

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

When rendering multiple fragments, any `[up-use-data]` attribute or `{ data }` option will only apply to the first fragment.
To apply data to multiple fragments, use a data map as shown above.


## Overlay peel intent

When a link or form from an overlay targets a background layer, the overlay will [dismiss](#intents) when the parent layer is updated. This behavior is called *peeling*.

By default, peeled overlays will be [dismissed](/closing-overlays#intents). You can now choose to [accept](/closing-overlays#intents) them instead, by setting an `[up-peel="accept"]` attribute
on the link or form that is targeting a background layer:

```html
<form method="post" action="/users" up-layer="parent" up-peel="accept"> <!-- mark: up-peel="accept" -->
  ...
</form>
```

When rendering from JavaScript, pass an [`{ peel: 'accept' }`](/up.render#options.peel`) option for the same effect.  


## Closing overlays when a fragment matches a selector

To open an overlay that closes once a fragment matching a selector is observed on the overlay, set an [`[up-accept-fragment]`](/up-layer-new#up-accept-event) attribute:

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


## Overlays

- The `X-Up-Open-Layer` response header can now include **callback strings** (like `onOpened`, `onDismissed`) when accompanied by a valid nonce.
- When a location-based or fragment-based close condition closes an overlay, Unpoly now **does not push a history entry** for the closing response, preventing phantom entries in the browser history.
- Fixed **duplicate scrollbars** when opening overlays on pages where `<html>` does not have `overflow-x: hidden`, particularly on Firefox (#795). The fix uses `overflow-y: clip` on `<body>` and `overflow-y: hidden` on `<html>` to properly hide the root scrollbar.
- Fixed **scrolling the overlay background in Safari** (#790, #795).
- When the global animation duration is set to zero, overlay open/close animations now correctly use the **overlay instance's configured duration**.


## Script security

- **Reworked script security model** with universal, configurable policies. The old `up.fragment.config.runScripts` option has been replaced by two new options in `up.script.config`:
  - **`up.script.config.scriptElementPolicy`**: Controls whether `<script>` elements in new fragments are executed. Values: `'auto'`, `'pass'`, `'block'`, `'nonce'`.
  - **`up.script.config.evalCallbackPolicy`**: Controls whether HTML attribute callbacks (like `[up-on-loaded]`) are evaluated. Values: `'auto'`, `'pass'`, `'block'`, `'nonce'`.
  - `'auto'` mode automatically resolves based on the detected CSP: With `strict-dynamic`, script elements require nonces. With a `<meta name="csp-nonce">`, callbacks require nonces.
- Renamed `up.protocol.config.cspNonce` to `up.script.config.cspNonce` (still defaults to reading `<meta name="csp-nonce">`).
- New **`up.script.config.cspWarnings`** option to control CSP-related warnings.

## Forms

- `[up-switch]` now works with disabled fields. 
- **Form-external submit buttons** (using the HTML `[form]` attribute) are now supported.
- Fixed duplicate validation requests when using `[up-validate][up-watch-event=input][up-keep]` to validate a field while the user is typing in it.
- Fixed `[up-switch]` effects not always running before validations**.

## Event utilities

- New experimental function `up.event.onClosest()`. Listens for an event on an element or its ancestors.
- New experimental function `up.fragment.onKept()`. Runs a callback when an element or its ancestors are kept during a render pass.

## Frontend assets

- The **`up:assets:changed`** event now exposes `{ response }` so users can implement custom nonce rewriting for non-script assets (like stylesheets).

## History

- **`up:location:changed`** event now exposes `{ previousLocation }` (experimental).

## Utilities

- New function `up.util.mapObject()`. It creates an object from a given array and mapping function. 
- Removed function `up.util.reverse()`. Use [`Array#toReversed()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed) instead.
- New experimental function `up.util.parseNumber()`. Parses a string as a number, supporting negative numbers, negative zero, underscores for digit grouping, and floats.

## Network

- New experimental method `up.Request#isSafe()`. It returns whether the request uses a safe HTTP method like `GET`.
- Fixed event message for `up:fragment:offline` showing `"undefined"` as the reason.

## Documentation fixes

- Fixed docs incorrectly describing `up.viewport.root` as a function, when it is really a property.
- Fix incorrect deprecation of up.Request#loadPage() (it was #navigate() that was deprecated)
- Cleaned up typos and wording everywhere.

## Rails UJS compatibility

For a long time Unpoly has migrated links with Rails UJS attributes (`[data-method]`, `[data-confirm]`) to their Unpoly counterparts.

This migration is now also applied to forms and submit buttons, not just links. 
