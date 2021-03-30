  ###**
  Opening overlays
  ================

  Fragment updates will render within the [current layer](/up.layer.current) by default.

  Use an [`[up-layer=new]`](/a-up-layer-new) attribute to open the fragment in a new overlay instead:

  ```html
  <a href="/users/new/" up-layer="new">
  ```

  Overlay modes
  -------------

  The overlay will open with the default [mode](/layer-terminology) (a modal dialog).
  To use a different mode, like `popup` or `drawer`, use an `[up-mode]` attribute:

  ```html
  <a href="/users/new/" up-layer="new" up-mode="drawer">
  ```

  You can change the default layer mode in `up.layer.config.mode`.

  As a **shorthand** you may also pass the layer mode directly as `[up-layer]` attribute:

  ```html
  <a href="/users/new/" up-layer="drawer">
  ```

  Close conditions
  ----------------

  When opening an overlay, you may define a *condition* when the overlay interaction ends.
  When the condition occurs, the overlay is automatically closed and a callback is run.

  See [close conditions](/closing-overlays#close-conditions) for details.


  Replacing existing overlays
  ---------------------------

  By default the new overlay will be stacked on top of the current layer. There is no limit for the number of stacked layers.

  You can pass an option `[up-layer="swap]` or `[up-layer="shatter"]` to replace existing overlays:

  | Option     | Description                                                            |
  | ---------- | ---------------------------------------------------------------------- |
  | `new`      | Stacks a new overlay over the current layer.                           |
  | `swap`     | Replaces the current overlay. If no overlay is open, opens an overlay. |
  | `shatter`  | Closes all overlays and opens a new overlay.                           |


  Opening layers from JavaScript
  ------------------------------

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
  ###
