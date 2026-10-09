Scrolling
=========

When updating a fragment, you control how Unpoly scrolls by setting an [`[up-scroll]`](/up-follow#up-scroll) attribute
or by passing a [`{ scroll }`](/up.render#options.scroll) option.
By default, following a link scrolls like a full page load would, and a minor update leaves all scroll positions alone.


## Default scrolling strategy {#auto}

When [navigating](/navigation), Unpoly tries a sequence of scroll strategies that works for most cases:

1. If the URL has a `#hash`, scroll to the element matching that hash.
2. If updating a [main target](/up-main), scroll the layer to the top.\
   The assumption is that we navigated to a new screen.
3. Otherwise don't scroll.\
   The assumption is that we updated a minor fragment.

You can change this sequence in `up.fragment.config.autoScroll`.

Following links and submitting forms are considered [navigation](/navigation), so the default strategy is applied without further configuration.
You can also enable it explicitly by setting `[up-scroll="auto"]`:

```html
<a href="/details" up-follow up-scroll="auto">Show more</a> <!-- mark: up-scroll="auto" -->
```

From JavaScript, pass `{ scroll: 'auto' }`:

```js
up.render({ url: '/path', scroll: 'auto' }) // mark: scroll: 'auto'
```

When rendering without navigation, e.g. with `up.render()` or `[up-validate]`, nothing is scrolled by default.
`up.reload()` [keeps the current scroll positions](#keep).


## Scrolling elements into view

We often want to draw attention to updated elements, by making sure they are visible in the viewport.
This is called *revealing* an element.

> [tip]
> When revealing an element, consider also [focusing it](/focus) to set the reading position
> for screen readers.

### Revealing the new fragment {#target}

To scroll to the updated fragment, set `[up-scroll="target"]`:

```html
<a href="/details" up-follow up-scroll="target">Show more</a> <!-- mark: up-scroll="target" -->
```

The fragment's viewport is scrolled as little as necessary to make the new fragment visible.
If the fragment is already visible, nothing scrolls.

You can control how far to scroll, how to handle large elements, or apply a scroll margin.\
See [[scroll-tuning]] for details.

### Revealing another element {#element}

To reveal a matching element, set `[up-scroll]` to any CSS selector string:

```html
<a href="/details" up-follow up-scroll="h1">Show more</a> <!-- mark: up-scroll="h1" -->
```

Unpoly prefers a match within the updated fragment, but the selector may match anywhere in the fragment's layer.

From JavaScript you can also pass the `Element` object that should be revealed:

```js
up.render({ url: '/path', scroll: document.body })
```

### Revealing the URL's `#hash` target {#hash}

To reveal the element matching the `#hash` in the updated URL, set `[up-scroll="hash"]`:

```html
<a href="/product/12#features" up-follow up-scroll="hash">Show features</a> <!-- mark: #features -->
```

This works like the browser's own hash scrolling, but honors [fixed layout elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport)
that would otherwise obstruct the revealed element. The element is aligned with the top edge of the viewport.

When the URL has no hash, or no element matches it, nothing scrolls.


### Revealing the layer {#layer}

To reveal the container element of the updated [layer](/up.layer), set `[up-scroll="layer"]`:

```html
<a href="/details" up-layer="new" up-scroll="layer">Show more</a> <!-- mark: up-scroll="layer" -->
```

Most [layer modes](/overlays#layer-modes) bring their own scrollbar, and will effectively be scrolled to the top.\
A [popup](/overlays#layer-modes) has no scrollbar, so its parent layer will scroll to reveal the popup frame.


### Revealing the main element {#main}

To reveal the updated layer's [main element](/up-main), set `[up-scroll="main"]`:

```html
<a href="/contact" up-follow up-scroll="main">Contact us</a> <!-- mark: up-scroll="main" -->
```


## Setting absolute scroll positions {#absolute-positions}

### Scrolling to the top {#top-position}

To reset scroll positions to the top, set `[up-scroll="top"]`:

```html
<a href="/list" up-follow up-scroll="top">Back to list</a> <!-- mark: up-scroll="top" -->
```

This affects all viewports that are ancestors or descendants of the updated fragment.

### Scrolling to the bottom {#bottom-position}

To scroll to the bottom, set `[up-scroll="bottom"]`:

```html
<a href="/chat" up-follow up-scroll="bottom">Open chat</a> <!-- mark: up-scroll="bottom" -->
```

This affects all viewports that are ancestors or descendants of the updated fragment.

### Scrolling to a pixel position {#pixel-position}

To scroll to a specific pixel position from the top, set a number value:

```html
<a href="/list" up-follow up-scroll="35">Back to list</a> <!-- mark: up-scroll="35" -->
```

To scroll to the bottom, but leave a margin of some pixels, set a *negative* number value:

```html
<a href="/messages" up-follow up-scroll="-40">Latest messages</a> <!-- mark: up-scroll="-40" -->
```


## Preserving scroll positions {#preserving}

### Don't scroll {#false}

If you don't want Unpoly to touch any scroll positions, set `[up-scroll="false"]`.
For example, this link opts out of the [default scrolling strategy](#auto) that
[navigation](/navigation) would apply:

```html
<a href="/details" up-follow up-scroll="false">Show more</a> <!-- mark: up-scroll="false" -->
```

> [note]
> DOM mutations may still cause scrolling, even when Unpoly does not touch scroll positions.\
> Set [`[up-scroll="keep"]`](#keep) to actively preserve scroll positions.


### Keeping current scroll positions {#keep}

Scroll positions reset when you insert a new viewport element (as opposed to updating a child element).
This is default browser behavior for newly inserted elements.

You can ask Unpoly to preserve the scroll positions of all [viewports](/up.viewport) around the updated fragment.
To do so, set `[up-scroll="keep"]`:

```html
<a href="/list" up-follow up-scroll="keep">Reload list</a> <!-- mark: up-scroll="keep" -->
```

Internally, Unpoly measures scroll positions before the update, and restores the same positions after the update.
For this to work, viewports must have a [derivable target selector](/target-derivation),
e.g. by setting an `[id]` attribute.

`up.reload()` uses this strategy by default, so a reloaded list stays where the user left it.


### Restoring previous scroll positions {#restore}

When revisiting an earlier page, you may want to restore the scroll positions from that visit.
Set `[up-scroll="restore"]` to restore the last known scroll positions for the updated URL:

```html
<a href="/list" up-follow up-scroll="restore">Back to list</a> <!-- mark: up-scroll="restore" -->
```

Before every fragment update, Unpoly saves the scroll positions for the current URL.\
You can prevent this by setting [`[up-save-scroll="false"]`](/up-follow#up-save-scroll).

When the user presses the back button, Unpoly restores scroll positions the same way.
See [[restoring-history]].


## Trying multiple strategies {#sequence}

To attempt multiple scroll strategies, separate options with a comma:

```html
<a href="/path#section" up-follow up-scroll="hash, top">Link label</a> <!-- mark: up-scroll="hash, top" -->
```

This first tries to reveal an element matching the URL's `#hash`.
If the URL has no hash (or if no element matches), the viewport is scrolled to the top.

In JavaScript you can pass an array of options:

```js
up.render({ url: '/path#section', scroll: ['hash', 'top'] }) // mark: scroll: ['hash', 'top']
```

The [default strategy](#auto) is such a sequence.


## Conditional strategies {#conditions}

To only scroll when a [main target](/up-main) is updated,
append `-if-main` to any string option on this page:

```html
<a href="/list" up-follow up-scroll="top-if-main">Back to list</a> <!-- mark: up-scroll="top-if-main" -->
```

This scrolls to the top, but only if the updated fragment contains a main element.
When a link targets a minor fragment, nothing scrolls.

To implement other conditions, [pass a function](#function) instead.


## Scrolling multiple viewports {#multiple-viewports}

Unpoly scrolls the [viewport](/up.viewport) closest to the updated fragment.
By default the only viewport is the document itself.
An app with its own scrolling panels marks each panel with an `[up-viewport]` attribute.

When [updating multiple fragments](/targeting-fragments#multiple), any `[up-scroll]` attribute (or `{ scroll }` option)
is only applied to the *first* fragment. This is what you want when you only have a single viewport,
and you don't want secondary fragments to influence the one scroll bar.

However, when you update fragments within multiple viewports, you can only scroll once that way:

```html
<a href="/dashboard" up-target="#fragment1, #fragment2" up-scroll="bottom"> <!-- mark: up-target="#fragment1, #fragment2" -->
  Update fragments
</a>

<div id="viewport1" up-viewport style="overflow-y: scroll">
  <!-- chip: ✔ Will be scrolled -->
  <div id="fragment1">…</div>
</div>

<div id="viewport2" up-viewport style="overflow-y: scroll">
  <!-- chip: ❌ Will not be scrolled -->
  <div id="fragment2">…</div>
</div>
```

To scroll multiple viewports, set an [`[up-scroll-map]`](/up-follow#up-scroll-map) attribute.\
Its value is a [relaxed JSON](/relaxed-json) object mapping selectors to scroll options:

```html
<a
  href="/dashboard"
  up-target="#fragment1, #fragment2"
  up-scroll-map="{ '#viewport1': 'bottom', '#viewport2': 'bottom' }"
>
  Update fragments
</a>
```

You can also select viewports by any contained fragment. The following two scroll maps have the same effect:

```html
<a … up-scroll-map="{ '#fragment1': 'bottom', '#fragment2': 'bottom' }">…</a>
<a … up-scroll-map="{ '#viewport1': 'bottom', '#viewport2': 'bottom' }">…</a>
```

In JavaScript you can pass an object as a [`{ scrollMap }`](/up.render#options.scrollMap) option:

```js
up.render({
  url: '/dashboard',
  target: '#fragment1, #fragment2',
  scrollMap: { '#viewport1': 'bottom', '#viewport2': 'bottom' }
})
```

When a scroll map is given, the `[up-scroll]` attribute or `{ scroll }` option is ignored.


## Custom scrolling logic {#custom}

### Scrolling function {#function}

To implement your own scrolling logic, pass a function as `{ scroll }` option.

The function is called with the updated fragment and is expected to **either**:

- Scroll the viewport to the desired position (without animation).
- Return one of the scroll options on this page.
- Do nothing.

Here is a scrolling function that scrolls to 15 pixels from the top:

```js
up.render({
  target: '#target',
  url: '/path',
  scroll: (fragment) => document.documentElement.scrollTop = 15 // mark-line
})
```

### Scrolling without a render pass {#reveal}

Outside a fragment update, call `up.reveal()` to scroll an element into view.
It uses the same logic as `[up-scroll="target"]`, including the handling of [fixed layout elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport):

```js
up.reveal('#comments')
```


## Tuning the scroll motion {#options}

You can animate the scroll motion, declare fixed navigation bars that obstruct the viewport,
limit how far a large element is revealed, apply a scroll margin, or snap to the screen edge.\
See [[scroll-tuning]] for details.

@page scrolling
