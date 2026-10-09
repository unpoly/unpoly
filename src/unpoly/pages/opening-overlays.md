Opening overlays
================

Instead of updating the current page, a link, a form or your JavaScript can open
content in a new overlay, like a modal dialog or a drawer. The linked screen stays
a regular page on your server, and the page behind the overlay keeps its state.


Opening an overlay from a link {#link}
------------------------------

To open a link's destination in a modal overlay, set an `[up-layer=new]` attribute:

```html
<a href="/menu" up-layer="new">Open menu</a> <!-- mark: up-layer="new" -->
```

When the user clicks, Unpoly fetches `/menu` in the background.
The server renders a full HTML page, the same way it would for a regular page load.
Unpoly extracts the response's [main element](/main) and shows it in the overlay.

The link stays a standard hyperlink. When the user opens it in a new tab,
or when JavaScript is unavailable, the browser loads `/menu` as a full page.

To show a different fragment in the overlay, add an [`[up-target]`](/up-layer-new#up-target) attribute with a CSS selector:

```html
<a href="/menu" up-layer="new" up-target=".menu-items">Open menu</a> <!-- mark: up-target=".menu-items" -->
```

Unpoly then extracts the `.menu-items` element from the response and places it in the overlay.
The overlay's [main target](/up-main#overlays) can be configured per [mode](#modes).


### Choosing the overlay mode {#modes}

By default the overlay opens as a modal dialog. To use a different [mode](/overlays#layer-modes),
like a `popup` or `drawer`, set an `[up-mode]` attribute:

```html
<a href="/menu" up-layer="new" up-mode="drawer">Open menu</a> <!-- mark: up-mode="drawer" -->
```

As a shorthand, you can append the mode to the `[up-layer=new]` attribute:

```html
<a href="/menu" up-layer="new drawer">Open menu</a> <!-- mark: up-layer="new drawer" -->
```

These modes are available:

@include overlay-modes-table

You can change the default mode in `up.layer.config.mode`.


Opening an overlay from a form {#form}
------------------------------

To show the response to a successful form submission in an overlay, set an `[up-layer=new]` attribute on the form:

```html
<form method="post" action="/subscribers" up-layer="new"> <!-- mark: up-layer="new" -->
  ...
</form>
```

To only use an overlay for error messages from a [failed submission](/failed-responses),
set an `[up-fail-layer=new]` attribute instead:

```html
<form method="post" action="/subscribers" up-fail-layer="new"> <!-- mark: up-fail-layer="new" -->
  ...
</form>
```


Opening overlays from local content {#string}
-----------------------------------

The [`[up-content]`](/up-follow#up-content) attribute opens an overlay without going through the server:

```html
<a up-layer="new popup" up-content="<p>Helpful instructions here</p>"> <!-- mark: up-content="<p>Helpful instructions here</p>" -->
  Help
</a>
```

Since no `[up-target]` selector is given, the content is wrapped in a container matching the overlay's [main target](/main).

Instead of embedding an HTML string, you can also refer to a [template](/templates):

```html
<a up-layer="new popup" up-content="#help"> <!-- mark: up-content="#help" -->
  Help
</a>

<template id="help"> <!-- mark: id="help" -->
  <p>Helpful instructions here</p>
</template>
```


Opening overlays from JavaScript {#scripted}
--------------------------------

When rendering from JavaScript, pass `{ layer: 'new' }` to open the fragment in a new overlay:

```js
up.navigate({ url: '/users/new', layer: 'new' }) // mark: layer: 'new'
```

Instead of `up.navigate()` or `up.render()` you can also call `up.layer.open()`.
It returns a promise for the new `up.Layer` instance:

```js
let layer = await up.layer.open({ url: '/users/new' })
```

Choose a different layer mode by passing a `{ mode }` option:

```js
up.layer.open({ url: '/menu', mode: 'drawer' }) // mark: mode: 'drawer'
```

To get a promise for the overlay's [result value](/closing-overlays#result-values) instead,
use `up.layer.ask()`:

```js
let address = await up.layer.ask({ url: '/address-picker' })
```

The promise fulfills when the overlay is accepted, and rejects when it is dismissed.
See [[subinteractions#awaiting-subinteractions-from-javascript]].


Opening overlays from the server {#server}
--------------------------------

The server can force its response to open an overlay by sending an `X-Up-Open-Layer: {}` response header.

This opens an overlay with the [default mode](/up.layer.config#config.mode), selects a [main target](/main)
and uses [default navigation options](/up.fragment.config#config.navigateOptions):

```http
Content-Type: text/html
X-Up-Open-Layer: {}

<html>
  <main>
    Overlay content
  </main>
</html>
```

To customize the target and appearance of the new overlay, set the header value to a [relaxed JSON](/relaxed-json) string
with render options:

```http
Content-Type: text/html
X-Up-Open-Layer: { target: '#menu', mode: 'drawer', animation: 'move-to-right' }

<div id="menu">
  Overlay content
</div>
```

Many options from `up.layer.open()` are supported. [Callbacks can be passed as strings](/X-Up-Open-Layer#callbacks).


Close conditions {#close-conditions}
----------------

When opening an overlay, you can define a *condition* for when the overlay's task is done.
When the condition occurs, the overlay closes automatically and a callback runs:

```html
<a href="/users/new"
  up-layer="new"
  up-accept-location="/users/$id"
  up-on-accepted="up.reload('.user-list')"> <!-- mark: up-accept-location="/users/$id" -->
  Add user
</a>
```

When the overlay reaches a URL like `/users/123`, it closes and the list behind it is reloaded.

See [[closing-overlays#close-conditions]] for all conditions and how to use the result value.


Replacing existing overlays {#replacing-existing-overlays}
---------------------------

By default the new overlay is stacked on top of the current layer. There is no limit to the number of stacked layers.

To replace existing overlays instead, pass `[up-layer="swap"]` or `[up-layer="shatter"]`:

@include new-overlay-placement-table


@page opening-overlays
@signature
