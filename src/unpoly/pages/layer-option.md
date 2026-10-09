Targeting other layers
======================

Links, forms and JavaScript functions work within their own layer by default: a form in an overlay
re-renders inside that overlay, and `up.fragment.get()` only sees elements in the current layer.
An `[up-layer]` attribute or `{ layer }` option lets you address another layer instead,
like the page behind an overlay or the root layer.


Updating another layer {#rendering}
----------------------

A link inside an overlay updates that overlay. To update the layer behind it instead,
set an `[up-layer]` attribute:

```html
<a href="/users" up-layer="parent" up-target=".user-list">Show all users</a> <!-- mark: up-layer="parent" -->
```

Unpoly fetches `/users` and swaps the `.user-list` element in the parent layer.
Because the overlay now obstructs the updated content, it is closed once the
parent layer was updated. This is called [peeling](/closing-overlays#peeling).
To keep the overlay open, set an `[up-peel="false"]` attribute.

Forms work the same way. This form in an overlay creates a user, then updates the root layer:

```html
<form method="post" action="/users" up-submit up-layer="root" up-target=".user-list"> <!-- mark: up-layer="root" -->
  ...
</form>
```

When rendering from JavaScript, pass a `{ layer }` option:

```js
up.render({ url: '/users', target: '.user-list', layer: 'parent' }) // mark: layer: 'parent'
```

An `[up-layer]` attribute already implies `[up-follow]` or `[up-submit]`, so you don't need to set both.


Layer names {#layer-names}
-----------

The attribute or option accepts these names. Most are relative to the [current layer](#current-vs-front),
which is usually the layer of the link or form:

| Name         | Matches                                                                       |
|--------------|-------------------------------------------------------------------------------|
| `current`    | The current layer. This is the default.                                       |
| `parent`     | The layer that opened the current layer                                       |
| `root`       | The root layer, which holds the initial page                                  |
| `front`      | The frontmost layer, which directly faces the user                            |
| `closest`    | The current layer or any ancestor, preferring closer layers                   |
| `ancestor`   | Any ancestor of the current layer, preferring closer layers                   |
| `child`      | The overlay opened from the current layer                                     |
| `descendant` | Any overlay opened from the current layer, directly or indirectly             |
| `subtree`    | The current layer and its descendants                                         |
| `overlay`    | Any overlay, preferring layers closer to the front                            |
| `any`        | Any layer, preferring the current layer, then layers closer to the front      |
| `origin`     | The layer of the element passed as `{ origin }`                               |
| `new`        | Opens a [new overlay](/opening-overlays) instead of updating an existing layer |

Passing `any` disables layer isolation for that call.

To replace existing overlays instead of stacking a new one on top, use `swap` or `shatter`.
See [replacing existing overlays](/opening-overlays#replacing-existing-overlays).


The default layer {#default}
-----------------

When no layer is given, Unpoly matches and renders in the layer the interaction started in:

- A link or form updates its own layer. Clicking an Unpoly-enabled link or submitting a form
  sets that element as the `{ origin }`, and the origin's layer is used.
- When an `Element` is passed as `{ target }` or `{ origin }` to a JavaScript function,
  that element's layer is used.
- Otherwise the [current layer](#current-vs-front) is used.


Trying multiple layers {#multiple}
----------------------

You can list several layer names, separated by a space or comma. Unpoly tries them in the given order:

```html
<a href="/users" up-layer="parent, root" up-target=".user-list">Show all users</a> <!-- mark: up-layer="parent, root" -->
```

Names that match no layer are skipped. Clicked in the root layer, the link above has no parent layer,
so it updates the root layer.

When rendering, the target is sought in each listed layer, and the first layer containing it is updated.
From JavaScript, you can also pass an array:

```js
up.render({ url: '/users', target: '.user-list', layer: ['parent', 'root'] })
```


Addressing a layer by index {#index}
---------------------------

Layers are numbered from the root layer upwards. Pass a number to address a layer by its position
in the [layer stack](/up.layer.stack):

```js
up.render({ url: '/users', target: '.user-list', layer: 0 }) // updates the root layer
```

Here `0` is the root layer and `1` the first overlay.


Passing a layer object {#layer-object}
----------------------

Functions like `up.layer.get()` return an `up.Layer` object, and `up.layer.current`
or `up.layer.root` are such objects, too. Any of them can be passed as a `{ layer }` option.

This is useful in async code, where the current layer may have changed by the time
your callback runs:

```js
let layer = up.layer.current // mark: up.layer.current

setTimeout(function() {
  // Ten seconds later, up.layer.current may be a different layer.
  let headline = up.fragment.get('h1', { layer }) // mark: { layer }
  console.log('Headline is', headline)
}, 10000)
```


Looking up elements in another layer {#lookups}
------------------------------------

Lookup functions like `up.fragment.get()` and `up.fragment.all()` only see the current layer by default.
To match elsewhere, pass the same `{ layer }` option:

```js
up.fragment.get('.user-list', { layer: 'root' }) // mark: layer: 'root'
up.fragment.all('.flash', { layer: 'any' })      // mark: layer: 'any'
```

To get the `up.Layer` object for a layer name, use `up.layer.get()`.
When a name matches several layers, `up.layer.getAll()` returns them all:

```js
up.layer.get('parent')      // result: the parent layer, or undefined on the root layer
up.layer.getAll('ancestor') // result: all ancestors, closest first
```

Other features that take a layer option include:

- A [navigation bar](/navigation-bars#layers) with an `[up-layer]` attribute highlights
  links that point to another layer's location.
- An `[up-hungry]` element with an `[up-if-layer]` attribute is updated by responses
  that were rendered into other layers.
- `up.fragment.abort()` can abort the requests of a given layer.


Current layer vs. frontmost layer {#current-vs-front}
---------------------------------

Most of the time, the *current* layer (`up.layer.current`) and the *frontmost* layer (`up.layer.front`)
are the same: the last layer in the stack. There are cases where the current layer is a layer in the background:

- While an element in a background layer is being [compiled](/enhancing-elements).
- While an Unpoly event like `up:request:loaded` is being emitted from a background layer.
- While an event listener bound to a background layer with `up.Layer#on()` is being called.

In these cases `{ layer: 'current' }` and relative names like `parent` resolve from that background layer,
which is what you usually want. To address the layer facing the user regardless, pass `{ layer: 'front' }`.
To temporarily change the current layer in your own code, use `up.Layer#asCurrent()`.


Rendering failed responses in another layer {#fail-layer}
-------------------------------------------

Like most render options, `[up-layer]` only applies when the server responds successfully.
When the server [responds with an error code](/failed-responses), like a form with validation errors,
the response is rendered in the link's or form's own layer.

To render failed responses in another layer, set an `[up-fail-layer]` attribute or pass a `{ failLayer }` option.


@page layer-option
