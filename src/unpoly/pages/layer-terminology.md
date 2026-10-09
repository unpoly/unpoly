Layer terminology
=================

Unpoly stacks the current page and its overlays as *layers*.
The initial page is the *root layer*. Any layer that is not the root layer is an *overlay*.
Overlays can be stacked without limit, and the whole stack is available as `up.layer.stack`.

The kind of an overlay, like a modal dialog or a popup box, is called its *mode*.


Available modes {#available-modes}
---------------

The mode of the root layer is `root`.

For overlays, the following modes are available:

@include overlay-modes-table

When [opening an overlay](/opening-overlays), you can append the mode to the `[up-layer]` attribute:

```html
<a href="/users/new" up-layer="new drawer">Add user</a> <!-- mark: new drawer -->
```

When no mode is given, a `modal` overlay is opened. You can change the default in `up.layer.config.mode`.

Default attributes for each mode are configured in `up.layer.config`,
like `up.layer.config.drawer` for drawers or `up.layer.config.overlay` for all overlays.

See [[overlays]] for an introduction to overlays and [[layer-option]] for all ways to address a layer.


@page layer-terminology
