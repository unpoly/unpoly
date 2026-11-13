# up.Layer

Each layer has an `up.Layer` instance.

Most functions in the `up.layer` namespace interact with the [current layer](/api/up.layer.current).
For example, `up.layer.dismiss()` is a shortcut for `up.layer.current.dismiss()`.

`up.layer.current` is set to the right layer in compilers and most events,
even if that layer is not the frontmost layer. E.g. if you're compiling a fragment for a background layer, `up.layer.current` will be
the background layer during compilation.

@class up.Layer
@parent up.layer

-----

# up.Layer#element

This layer's outmost container element.

### Example

```js
let rootLayer = up.layer.root
let overlay = await up.layer.open()

rootLayer.element // returns <body>
overlay.element   // returns <up-modal>
```

@property up.Layer#element
@param {Element} element
  The layer's container element.
@stable

-----

# up.Layer#history

Whether this layer has [visible history](/learn/history-in-overlays).

When it does, fragment updates within this layer can change the browser's address bar and window title.
If a layer does not have visible history, its descendant layers cannot have visible history either.

@learn-ref history-in-overlays

@property up.Layer#history
@param {boolean} history
  Whether this layer has visible history.
@stable

-----

# up.Layer#mode

This layer's mode which governs its appearance and behavior.

Requests targeting this layer will send the mode value as an `X-Up-Mode` header.

@learn-ref customizing-overlays

@property up.Layer#mode
@param {string} mode
  The layer mode.
@stable

-----

# up.Layer#context

This layer's [context](/learn/layer-context).

### Example

You may access the context properties like a regular JavaScript object.

```js
let layer = up.layer.current
layer.context.message = 'Please select a contact'
console.log(layer.context) // logs "{ message: 'Please select a contact' }"
```

@learn-ref layer-context

@property up.Layer#context
@param {Object} context
  The context object.

  If no context has been set an empty object is returned.
@experimental

-----

# up.Layer#sync()

Synchronizes this layer with the rest of the page.

For instance, a popup overlay will re-calculate its position arounds its anchoring element.

You only need to call this method after DOM changes unknown to Unpoly have brought
overlays out of alignment with the rest of the page.

@function up.Layer#sync
@experimental

-----

# up.Layer#accept()

[Closes this overlay](/learn/closing-overlays) with an accepting intent,
e.g. when a change was confirmed or when a value was selected.

To dismiss a layer *without* an accepting intent, use `up.Layer#dismiss()` instead.

@learn-ref closing-overlays

@function up.Layer#accept
@section Acceptance
  @param {any} [value]
    The [acceptance value](/learn/closing-overlays#acceptance-values) that will be passed to `{ onAccepted }` callbacks.

    If there isn't an acceptance value, omit this argument.
    If you need to pass options without an acceptance value, pass `null`:

    ```js
    up.layer.accept(null, { animation: 'move-to-bottom' })
    ```
  @param {string} [options.confirm]
    A message the user needs to confirm before the overlay is closed.

    See [[confirmation-dialogs#overlays]].

  @param {boolean} [options.preventable=true]
    Whether the closing can be prevented by an event listener.

    @internal

  @param {up.Response} [options.response]
    The server response that caused this overlay to close.

    May be left blank if the overlay was not closed in reaction to a server response.

    See [Using the discarded response](/learn/closing-overlays#using-the-discarded-response).

@section Animation
  @param {string|Function(Element, Object)} [options.animation]
    The [animation](/api/up.animate) to use for closing this layer.

    Defaults to the close animation [configured](/api/up.layer.config) for this layer mode.
  @param {number} [options.duration]
    The duration for the close animation in milliseconds.
  @param {string} [options.easing]
    The [timing function](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function)
    that controls the acceleration of the close animation.
  @param {Function} [options.onFinished]
    A callback that will run when the elements have been removed from the DOM.

    If the layer has a close animation, the callback will run after the animation has finished.

@section History
  @param {boolean} [options.history=true]
    Whether to restore the parent layer's [history state](/learn/updating-history#history-state)
    in the browser's address bar.

    @experimental
@stable

-----

# up.Layer#dismiss()

[Closes this overlay](/learn/closing-overlays) *without* an accepting intent,
e.g. when a "Cancel" button was clicked.

To close an overlay with an accepting intent, use `up.Layer#accept()` instead.

@learn-ref closing-overlays

@function up.Layer#dismiss
@param {any} [value]
  The [dismissal value](/learn/closing-overlays#dismissal-values) that will be passed to `{ onDismissed }` callbacks.

  If there isn't a dismissal value, omit this argument.
  If you need to pass options without a dismissal value, pass `null`:

  ```js
  up.layer.dismiss(null, { animation: 'move-to-bottom' })
  ```
@param {Object} [options]
  See options for `up.Layer#accept()`.
@stable

-----

# up.Layer#peel()

[Dismisses](/api/up.Layer.prototype.dismiss) all descendant overlays,
making this layer the [frontmost layer](/api/up.layer.front) in the [layer stack](/api/up.layer.stack).

Descendant overlays will be dismissed with value `':peel'`.

Listeners to `up:layer:dismiss` or `up:layer:accept` cannot keep a descendant overlay open.

@function up.Layer#peel
@section Closing
  @param {any} [options.value=":peel"]
    The [result value](/learn/closing-overlays#result-values) for the descendant overlays.

  @param {string} [options.intent="dismiss"]
    The [close intent](/learn/closing-overlays#intents) for the descendant overlays.

    By default descendant overlays will be dismissed.\
    You can pass `{ intent: "accept" }` to
    accept them instead.

@section Animation
  @param {string|Function(Element, Object)} [options.animation]
    The [animation](/api/up.animate) to use for closing descendant overlays.

    Defaults to the close animation [configured](/api/up.layer.config) for the respective layer modes.

  @param [options.duration]
    @like up.Layer#accept

  @param [options.easing]
    @like up.Layer#accept

@stable

-----

# up.Layer#isCurrent()

Returns whether this layer is the [current layer](/api/up.layer.current).

@function up.Layer#isCurrent
@return {boolean}
  Whether this layer is the current layer.
@stable

-----

# up.Layer#isFront()

Returns whether this layer is the [frontmost layer](/api/up.layer.front).

@function up.Layer#isFront
  Whether this layer is the front layer.
@return {boolean}
@stable

-----

# up.Layer#isRoot()

Returns whether this layer is the [root layer](/api/up.layer.root).

@function up.Layer#isRoot
@return {boolean}
  Whether this layer is the root layer.
@stable

-----

# up.Layer#isOverlay()

Returns whether this layer is *not* the [root layer](/api/up.layer.root).

@function up.Layer#isOverlay
@return {boolean}
@stable

-----

# up.Layer#isAlive()

Returns whether this layer is part of the [layer stack](/api/up.layer.stack) and can be interacted with.

## When a layer is alive

A layer that is alive can be [targeted](/learn/targeting-fragments) with fragment changes, or [queried](/api/up.fragment.get) for containing elements.

The [root layer](/learn/overlays#layer-modes) is always alive.
An overlay is alive as soon as it enters the DOM, even when it is still playing its opening animation.

An overlay stops being alive as soon as it starts [closing](/learn/closing-overlays),
even while its closing animation is still playing.

| Overlay state             | `up.Layer#isAlive()` |
|---------------------------|----------------------|
| Entered DOM               | `true`               |
| Opening animation playing | `true`               |
| Opened                    | `true`               |
| Closing animation playing | `false`              |
| Removed from DOM          | `false`              |

## See also

- The `.up-destroying` class is automatically assigned to elements in their exit animation.
- All `up.fragment` functions (like `up.fragment.get()`) ignore elements in their exit animation.
- The `up.fragment.isAlive()` function checks if an element is attached to the DOM and also not in an exit animation.

@function up.Layer#isAlive
@return {boolean}
  Whether this layer is considered alive.
@stable

-----

# up.Layer#parent

Returns this layer's parent layer.

The parent layer is the layer that opened this layer. It is visually in the background of this layer.

Returns `undefined` for the [root layer](/api/up.layer.root).

## Example

```js
up.layer.open()

up.layer.parent // returns the root layer
```

@property up.Layer#parent
@param {up.Layer} parent
  This layer's parent layer.
@stable

-----

# up.Layer#child

Returns this layer's child layer.

The child layer is the layer that was opened on top of this layer. It visually overlays this layer.

Returns `undefined` if this layer has not opened a child layer.

A layer can have at most one child layer. Opening an overlay on a layer with an existing child will
first dismiss the existing child before replacing it with the new child.

@property up.Layer#child
@return {up.Layer} child
  This layer's direct child overlay.
@stable

-----

# up.Layer#ancestors

Returns an array of this layer's ancestor layers.

The array elements are ordered by distance to this layer.
The first element is this layer's direct parent. The last element
is the [root layer](/api/up.layer.root).

## Example

```js
// Open two overlays
up.layer.open({ mode: 'drawer' })
up.layer.open({ mode: 'modal' })

up.layer.current.ancestors // returns [drawer overlay, root layer]
```

@property up.Layer#ancestors
@return {Array<up.Layer>} ancestors
  This layer's ancestors.
@stable

-----

# up.Layer#descendants

Returns an array of this layer's descendant layers, with the closest descendants listed first.

Descendant layers are all layers that visually overlay this layer.

The array elements are ordered by distance to this layer.
The first element is this layer's direct child. The last element
is the [frontmost layer](/api/up.layer.front).

## Example

```js
up.layer.open()
up.layer.current              // returns the modal overlay
up.layer.current.descendants  // returns []
up.layer.root.descendants     // returns [modal overlay]
```


@property up.Layer#descendants
@return {Array<up.Layer>} descendants
  This layer's descendants.
@stable

-----

# up.Layer#subtree

Returns an array of this layer and its descendant layers, with the closest descendants listed first.

Descendant layers are all layers that visually overlay this layer.

The array elements are ordered by distance to this layer.
The first element is this layer.
The second element is this layer's direct child. The last element
is the [frontmost layer](/api/up.layer.front).

@property up.Layer#subtree
@return {Array<up.Layer>} subtree
  An array of this layer and its descendants.
@experimental

-----

# up.Layer#index

Returns the zero-based position of this layer in the [layer stack](/api/up.layer.stack).

The [root layer](/api/up.layer.root) has an index of `0`, its child overlay has an index of `1`, and so on.

This property has no defined behavior for layers that are [closed or are being closed](/api/up.Layer.prototype.isAlive).

@property up.Layer#index
@return {number} index
  The position of this layer in the stack.
@stable

-----

# up.Layer#contains()

Returns whether the given `element` is contained by this layer.

This function will always return `false` for elements in [descendant](/api/up.Layer.prototype.descendants) overlays,
even if the descendant overlay's element is nested into the DOM tree of this layer.

@function up.Layer#contains
@param {Element} element
  The element to test.
@return {boolean}
  Whether the layer contains the element.
@stable

-----

# up.Layer#on()

Listens to a [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events) that originated
on an element [contained](/api/up.Layer.prototype.contains) by this layer.

This will ignore events emitted on elements in [descendant](/api/up.Layer.prototype.descendants) overlays,
even if the descendant overlay's element is nested into the DOM tree of this layer.

The arguments for this function are the same as for `up.on()`.

### Example

```js
let rootLayer = up.layer.root
let overlay = await up.layer.open()

rootLayer.on('foo', (event) => console.log('Listener called'))

rootLayer.emit('foo') // logs "Listener called"
overlay.emit('foo')   // listener is not called
```

### Most Unpoly events have a layer reference

Whenever possible Unpoly will emit its events on associated layers instead of `document`.
This way you can listen to events on one layer without receiving events from other layers.

E.g. to listen to all [requests](/api/up.request) originating from a given layer:

```js
let rootLayer = up.layer.root
let rootLink = rootLayer.affix('a[href=/foo]')

let overlay = await up.layer.open()
let overlayLink = overlay.affix('a[href=/bar]')

rootLayer.on('up:request:load', (event) => console.log('Listener called'))

up.follow(rootLink)    // logs "Listener called"
up.follow(overlayLink) // listener is not called
```

@function up.Layer#on
@include up.on/after-element
@stable

-----

# up.Layer#off()

Unbinds an event listener previously bound with `up.Layer#on()`.

@function up.Layer#off
@include up.off/after-element
@stable

-----

# up.Layer#emit()

[Emits](/api/up.emit) an event on [this layer's element](/api/up.Layer.prototype.element).

The value of [up.layer.current](/api/up.layer.current) will be set to this layer
while event listeners are running.

## Example

```js
let rootLayer = up.layer.root
let overlay = await up.layer.open()

rootLayer.on('foo', (event) => console.log('Listener called'))

rootLayer.emit('foo') // logs "Listener called"
overlay.emit('foo')   // listener is not called
```

@function up.Layer#emit
@param eventType
  @like up.emit
@param props
  @like up.emit
@param props.log
  @like up.emit
@return
  @like up.emit
@stable

-----

# up.Layer#asCurrent()

Temporarily changes the [current layer](/api/up.layer.current) while the given
function is running.

Calls the given function and restores the original current layer when the function
terminates.

## Example

```js
up.layer.current // returns the root layer

up.layer.open() // open an overlay
up.layer.current // returns the modal overlay

up.layer.parent.asCurrent(function() {
  up.layer.current // returns the root layer
})

up.layer.current // returns the modal overlay
```

@param {Function()} fn
  The synchronous function to call.

  Async functions are not supported.
@function up.Layer#asCurrent
@stable

-----

# up.Layer#title

This layer's window title.

If this layer does not have [visible history](/api/up.Layer.prototype.history),
the browser window shows the title of an ancestor layer.
This property still returns the title the layer would use if it had visible history.
The same applies when `up.history.config.enabled` [turns off](/learn/updating-history#disabling)
the `'title'` aspect.

@learn-ref history-in-overlays

@property up.Layer#title
@param {string} title
  This layer's title.
@experimental

-----

# up.Layer#location

This layer's location URL.

If the layer has [no visible history](/api/up.Layer.prototype.history), this property
still returns the URL of the content in the overlay. In this case
the browser's address bar will show the location of an ancestor layer.

When `up.history.config.enabled` [turns off](/learn/updating-history#disabling) the `'location'` aspect,
this property returns the URL of the rendered content, while the address bar keeps its URL.

@learn-ref history-in-overlays

@property up.Layer#location
@param {string} location
  The layer's current location.
@experimental

-----

# up.Layer#affix()

Creates an element with the given `selector` and appends it to this layer's content.

For the [root layer](/api/up.layer.root) the element is appended to the `<body>`.
For an overlay it is appended to the overlay's top-level content element, like its `<main>`.

Also see `up.element.affix()`.

### Example

```js
layer = await up.layer.open({ content: '<main></main>' })
element = layer.affix('.klass')
element.parentElement // returns the <main> element
element.className // returns 'klass'
```

@function up.Layer#affix
@include up.element.createFromSelector/all
@experimental
