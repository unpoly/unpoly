  ###**
  Layer option
  ============

  Unpoly lets you stack multiple screens in [layers](/up.layer).
  Layers are *isolated*, meaning that you cannot accidentally match a fragment in another layer.

  Must Unpoly features accept a `{ layer }` option or `[up-layer]` attribute to indicate
  the layer in which a fragment should be rendered or in which a CSS selector should match elements.
  Elements in other layers are ignored.

  \#\#\# The default

  When no `{ layer }` option or `[up-layer]` attribute is given, Unpoly will generally
  match in the [current layer](/up.layer.current).

  The one exception is that when a DOM element is passed as `{ target }` or `{ origin }` option,
  Unpoly will use that element's layer. Clicking an Unpoly-enabled [link](/a[up-follow]) or
  [form](/form[up-follow]) will automatically set that link or form as the `{ origin }`.

  \#\#\# Disabling layer isolation

  To disable layer isolation and match elements in *any* layer, pass `{ layer: 'any' }`.

  \#\#\# Opening new layers



  When opening an overlay, you may define a *condition* when the overlay interaction ends.
  When the condition occurs, the overlay is automatically closed and a callback is run.
  See [closing overlays](/closing-overlays) for details.

  \#\#\# Matching the root layer

  To match within the [root layer](/up.layer.root), pass `{ layer: 'root' }`.

  \#\#\# Matching any overlay

  To match within any layer that is not the root layer, pass `{ pass: 'overlay' }`.

  \#\#\# Matching the current or frontmost layer

  To match within the [current layer](/up.layer.current),
  either omit the `{ layer }` option or explictely pass `{ layer: 'current' }`.

  You may also explicitely target the [frontmost layer](/up.layer.front) by passing `{ layer: 'front' }`.

  Most of the time, the *current* and *frontmost* layer both refer to the last layer
  in the layer stack. There are however some cases where the current layer is a layer in the background:

  - While an element in a background layer is [compiled](/up.compiler).
  - While an Unpoly event like `up:request:loaded` is being triggered from a background layer.
  - While a running event listener was bound to a background layer using `up.Layer#on()`.

  \#\#\# Matching relative to the current layer

  You may use common tree terminology to match a layer relative to the current layer:

  | Option           | Description                                                  |
  | ---------------- | ------------------------------------------------------------ |
  | `parent`         | The layer that opened the current layer                      |
  | `closest`        | The current layer or any ancestor, preferring closer layers  |
  | `overlay`        | Any overlay                                                  |
  | `ancestor`       | Any ancestor layer of the current layer                      |
  | `child`          | The child layer of the current layer                         |
  | `descendant`     | Any descendant of the current layer                          |

  \#\#\# Use the layer of a given element

  When a DOM element is passed as `{ target }` or `{ origin }` option,
  Unpoly will use that element's layer.

  Clicking an Unpoly-enabled [link](/a[up-follow]) or
  [form](/form[up-follow]) will automatically set that link or form as the `{ origin }`.

  \#\#\# Use a layer by index

  Pass a number to match within a layer with that index.

  Layers are counted from the root layer upwards. Therefore `{ layer: 0 }` matches
  within the root layer. `{ layer: 1 }` would match within the first overlay.

  \#\#\# Use a layer reference

  Functions like `up.layer.get()` or `up.layer.current` return an `up.Layer` instance
  that you can later pass as a `{ layer }` option.

  This is useful for async code where the "current" layer may change over time:

  ```js
  // Store an up.Layer reference to what is now the current layer.
  let layerReference = up.layer.current

  // Run a function in 10 seconds layer.
  setTimeout(function() {
    // Pass the saved layer reference since the current layer
    // may have changed in the last 10 seconds..
    let headlines = up.fragment.get('h1', { layer: layerReference })
    console.log("Headlines are ", headlines)
  }, 10000)
  ```

  \#\#\# Match in multiple layers

  You can pass more than one layer reference as an array of options.
  Alternatively you may pass a a space-separated string of layer names.

  For example `'current parent'` would match in either the current layer or the parent layer.

  If layers in the given list don't exist they will be ignored. For example, `'parent root'` would try
  to match within a parent layer. If there is no parent layer (because we're already in the root layer),
  Unpoly will match within the root layer.

  @page layer-option
  ###