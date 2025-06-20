Opening overlays
================

Fragment updates will render within the [current layer](/up.layer.current) by default.


Opening an overlay from a link {#link}
------------------------------

To open the response to a hyperlink in a modal overlay, set an `[up-layer=new]` attribute:

```html
<a href="/menu" up-layer="new">Open menu</a> <!-- mark: up-layer -->
```

### Chosing the overlay mode {#modes}

The overlay will open with the default [mode](/layer-terminology) (a modal dialog).
To use a different mode, like `popup` or `drawer`, use an `[up-mode]` attribute:

```html
<a href="/menu" up-layer="new" up-mode="drawer"> <!-- mark: up-mode -->
```

As a **shorthand** you may also append the layer mode to the `[up-layer=new]` attribute:

```html
<a href="/menu" up-layer="new drawer"> <!-- mark: new drawer -->
```

You can change the default layer mode in `up.layer.config.mode`.


Opening an overlay from a form {#form}
------------------------------

To show the response to a successful form submission within an overlay, set an `[up-layer=new]` attribute: 

```html
<form action="/submit" up-layer="new"> <!-- mark: up-layer -->
  ...
</form>
```


To only use an overlay for error messages from a [failed submission](/failed-responses), set an `[up-fail-layer=new]` attribute:

```html
<form action="/submit" up-fail-layer="new"> <!-- mark: up-fail-layer -->
  ...
</form>
```




Opening overlays from local content {#string}
------------------------------------

The [`[up-content]`](/up-follow#up-content) attribute lets you open an overlay without going through the server:

```html
<a up-layer="new popup" up-content="<p>Helpful instructions here</p>"> <!-- mark: up-content -->
  Help
</a>
```

Since we didn't provide an `[up-target]` selector, it will be wrapped in a container matching the overlay's [main target](/main).

Instead of embedding an HTML string, you can also refer to a [template](/templates):

```html
<a up-layer="new popup" up-content="#help"> <!-- mark: up-content -->
  Help
</a>

<template id="help">
  <p>Helpful instructions here</p>
</template>
```



Opening overlays from JavaScript {#scripted}
--------------------------------

When rendering fragments from JavaScript, you can pass `{ layer: 'new' }` to open the fragment in a new overlay:

```js
up.navigate({ url: '/users/new', layer: 'new' })
```

Instead of `up.navigate()` or `up.render()` you may also open layers with `up.layer.open()`.
It returns a promise for the new `up.Layer` instance:

```js
let layer = await up.layer.open({ url: '/users/new' })
```

Choose a different layer mode by passing a `{ mode }` option.

To get a promise for an overlay's [acceptance value](/closing-overlays#overlay-result-values),
use `up.layer.ask()`:

```js
let address = await up.layer.ask({ url: '/address-picker' })
```


Opening overlay from the server {#server}
-------------------------------

The server can force its response to open an overlay, by sending an `X-Up-Open-Layer: {}` response header.

This will open an overlay with the [default mode](/up.modal.config#config.mode), select a [main target](/main)
and use [default navigation options](/up.fragment.config#config.navigateOptions):

```http
Content-Type: text/html
X-Up-Open-Layer: {}

<html>
  <main>
    Overlay content
  </main>
</html>
```

You can customize the target and appearance of the new overlay, by setting the header value to a [relaxed JSON](/relaxed-json) string
with render options:

```http
Content-Type: text/html
X-Up-Open-Layer: { target: '#menu', mode: 'drawer', animation: 'move-to-right' }

<div id="menu">
  Overlay content
</div>
```

Many options from `up.layer.open()` are supported. Options must be JSON-serializable.


Close conditions {#close-conditions}
----------------

When opening an overlay, you may define a *condition* when the overlay interaction ends.
When the condition occurs, the overlay is automatically closed and a callback is run.

See [close conditions](/closing-overlays#close-conditions) for details.


Replacing existing overlays {#replacing-existing-overlays}
---------------------------

By default the new overlay will be stacked on top of the current layer. There is no limit for the number of stacked layers.

You can pass an option `[up-layer="swap"]` or `[up-layer="shatter"]` to replace existing overlays:

@include new-overlay-placement-table


@page opening-overlays
