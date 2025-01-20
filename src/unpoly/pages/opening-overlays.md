Opening overlays
================

Fragment updates will render within the [current layer](/up.layer.current) by default.

Use an [`[up-layer=new]`](/up-layer-new) attribute to open the fragment in a new overlay instead:

```html
<a href="/users/new/" up-layer="new">
```

Overlay modes {#modes}
-------------

The overlay will open with the default [mode](/layer-terminology) (a modal dialog).
To use a different mode, like `popup` or `drawer`, use an `[up-mode]` attribute:

```html
<a href="/users/new/" up-layer="new" up-mode="drawer">
```

You can change the default layer mode in `up.layer.config.mode`.

As a **shorthand** you may also append the layer mode to the `[up-layer=new]` attribute:

```html
<a href="/users/new/" up-layer="new drawer">
```

Close conditions {#close-conditions}
----------------

When opening an overlay, you may define a *condition* when the overlay interaction ends.
When the condition occurs, the overlay is automatically closed and a callback is run.

See [close conditions](/closing-overlays#close-conditions) for details.


Replacing existing overlays {#replacing-existing-overlays}
---------------------------

By default the new overlay will be stacked on top of the current layer. There is no limit for the number of stacked layers.

You can pass an option `[up-layer="swap"]` or `[up-layer="shatter"]` to replace existing overlays:

| Option     | Description                                                            |
| ---------- | ---------------------------------------------------------------------- |
| `new`      | Stacks a new overlay over the current layer.                           |
| `swap`     | Replaces the current overlay. If no overlay is open, opens an overlay. |
| `shatter`  | Closes all overlays and opens a new overlay.                           |


Opening overlays from local content {#string}
------------------------------------

The [`[up-content]`](/up-follow#up-content) attribute lets you open an overlay without going through the server:

```html
<a up-layer="new popup" up-content="<p>Helpful instructions here</p>"> <!-- mark-phrase "up-content" -->
  Help
</a>
```

Since we didn't provide an `[up-target]` selector, it will be wrapped in a container matching the overlay's [main target](/main).

Instead of embedding an HTML string, you can also refer to a [template](/templates):

```html
<a up-layer="new popup" up-content="#help"> <!-- mark-phrase "up-content" -->
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

```
let layer = await up.layer.open({ url: '/users/new' })
```

Choose a different layer mode by passing a `{ mode }` option.

@page opening-overlays
