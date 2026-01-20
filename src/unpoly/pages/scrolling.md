Scrolling
=========

When updating a fragment you may control how Unpoly scrolls the page by
setting an [`[up-scroll]`](/up-follow#up-scroll) attribute,
or by passing a [`{ scroll }`](/up.render#options.scroll) option.


## Default scrolling strategy {#auto}

When [navigating](/navigation), Unpoly will try a **sequence of scroll strategies** that works for most cases:

1. If the URL has a `#hash`, scroll to a fragment matching that hash.
2. If updating a [main target](/up-main), [scroll to the top](#top-position) of its viewport.
   The assumption being that we navigated to a new screen.
3. Otherwise don't scroll.\
   The assumption being that we updated a minor fragment.

You may configure this sequence in `up.fragment.config.autoScroll`.

Because following links and submitting forms are considered [navigation](/navigation), is the default scrolling strategy is applied automatically.
You can explicitly enable the strategy by setting `[up-scroll="auto"]`:

```html
<a href="/details" up-follow up-scroll="auto">Show more</a> <!-- mark: up-scroll="auto" -->
```

To apply the default scrolling strategy from JavaScripts, pass `{ scroll: 'auto' }`:

```js
up.render({ url: '/path', scroll: 'auto' }) // mark: scroll: 'auto'
```


## Scrolling elements into view

We often want to draw attention to updated elements, by making sure they are visible in the viewport.
This is called <i>revealing</i> an element.

> [tip]
> When revealing an element, consider also [focusing it](/focus) to set the reading position
> for screen readers.

### Revealing the new fragment {#target}

To scroll an updated fragment, set `[up-scroll="target"]`:

```html
<a href="/details" up-follow up-scroll="target">Show more</a> <!-- mark: up-scroll="target" -->
```

The fragment's viewport will be scrolled so the new fragment is visible.

You can control how far to scroll, how to handle large elements, or apply a scroll margin.\
See [tuning the scroll behavior](/scroll-tuning) for details.

### Revealing another element {#element}

To reveal a matching element, set `[up-scroll]` to any CSS selector string:

```html
<a href="/details" up-follow up-scroll="h1">Show more</a> <!-- mark: up-scroll="h1" -->
```

The selector can to match anywhere in the page, even outside the updated region.

From JavaScript you may also pass the `Element` object that should be revealed:

```js
up.render({ url: '/path', scroll: document.body })
```


### Revealing the URL's `#hash` target {#hash}

To focus the element matching the `#hash` in the updated URL, set `[up-scroll="hash"]`:

```html
<a href="/product/12#features" up-follow up-scroll="hash">Show features</a> <!-- mark: #features -->
```



### Revealing the layer {#layer}

To reveal the container element of the updated [layer](/up.layer), set `[up-scroll="layer"]`:

```html
<a href="/details" up-layer="new" up-scroll="layer">Show more</a> <!-- mark: up-scroll="layer" -->
```

Most [layer modes](/layer-terminology) bring their own scrollbar, and will effectively be scrolled to the top.\
A [popup](/layer-terminology#available-modes) has no scrollbar, so its parent layer will scroll to reveal the popup frame.


### Revealing the main element {#main}

To reveal the updated layer's [main element](/up-main), set `[up-scroll="main"]`:

```html
<a href="/contact" up-follow up-scroll="main">Contact us</a> <!-- mark: up-scroll="main" -->
```





## Setting absolute scroll positions {#absolute-positions}

### Scrolling to the top {#top-position}

The reset scroll positions to the top, set `[up-scroll="top"]`:

```html
<a href="/list" up-follow up-scroll="top">Back to list</a> <!-- mark: up-scroll="top" -->
```

This affects all viewports that are ancestors or descendants of the updated fragment.

### Scrolling to the bottom {#bottom-position}

The scroll to the bottom, set `[up-scroll="bottom"]`:

```html
<a href="/chat" up-follow up-scroll="bottom">Open chat</a> <!-- mark: up-scroll="bottom" -->
```

This affects all viewports that are ancestors or descendants of the updated fragment.

### Scrolling to a pixel position {#pixel-position}

To scroll a specific pixel position from the top, set a number value:

```html
<a href="/list" up-follow up-scroll="35">Back to list</a> <!-- mark: up-scroll="35" -->
```

To scroll to the bottom, but leave a margin of some pixels, set a <i>negative</i> number value:


```html
<a href="/messages" up-follow up-scroll="-40">Latest messages</a> <!-- mark: up-scroll="-40" -->
```

## Preserving scroll positions {#preserving}

### Don't scroll {#false}

If you don't want Unpoly to touch any scroll positions, set `[up-scroll=false]`.
For example, if you don't want to use the [default scrolling strategy](#auto)
when [navigating](/navigation), you can disable it like so:

```html
<a href="/details" up-follow up-scroll="false">Show more</a> <!-- mark: up-scroll="false" -->
```

When rendering without [navigation](/navigation), no scrolling will happen by default.

> [note]
> DOM mutations may still cause scrolling, even when Unpoly does not touch scroll positions.\
> Set [`[up-scroll="keep"]`](#keep) to force the preservation of scroll positions.  


### Keeping current scroll positions {#keep}

Scroll positions will reset when you insert a new viewport element (as opposed to updating a child element).
This is default browser behavior for newly inserted elements.

You can ask Unpoly to preserve the scroll positions of all [viewports](/up.viewport) around the updated fragment. 
To do so, set `[up-scroll="keep"]`:

```html
<a href="/list" up-follow up-scroll="keep">Reload list</a> <!-- mark: up-scroll="keep" -->
```

Internally, Unpoly will measure scroll positions before the update, and restore the same positions after the update.
For this to work, viewports must have a [derivable target selector](/target-derivation),
e.g. by setting an `[id]` attribute.


### Restoring previous scroll positions {#restore}

When revisiting an earlier page, you may want to restore the previous scroll position.
Set `[up-scroll="restore"]` to restore the last known scroll positions for the updated URL:

```html
<a href="/list" up-follow up-scroll="restore">Back to list</a> <!-- mark: up-scroll="restore" -->
```

Before a fragment update, Unpoly will save the scroll position for the current URL.\
You can prevent this by setting [`[up-save-scroll="false"]`](/up-follow#up-save-scroll).


## Sequence of scroll strategies {#sequence}

To attempt multiple scroll strategies, separate options with a comma:

```html
<a href="/path#section" up-follow up-scroll="hash, top">Link label</a> <!-- mark: up-scroll"hash, top" -->
```

This would first try to reveal an element matching the URL's `#hash`.
If the URL has no hash (or if no element matches), the viewport will be scrolled to the top.

In JavaScript you can pass an array of options:

```js
up.render({ url: '/path#section', scroll: ['hash', 'top'] }) // mark: scroll: ['hash', 'top']
```


## Scrolling multiple viewports {#multiple-viewports}

When [updating multiple fragments](/targeting-fragments#multiple), any `[up-scroll]` attribute (or `{ scroll }` option)
will only be applied to the *first* fragment. This is the behavior desired when you only have a single viewport,
and you don't want secondary fragments to influence the one scroll bar.

However, when you update fragments within multiple viewports, you can only scroll once that way:

```html
<a href="/dashboard" up-target="#fragment1, #fragment2" up-scroll="bottom"> <!-- mark: up-target="#left, #right" -->
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
Its value is a [relaxed JSON](relaxed-json) object mapping selectors to scroll options:

```html
<a
  href="/dashboard"
  up-target="#fragment1, fragment2"
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


## Custom scrolling logic {#custom}

### Conditional strategies {#conditions}

To only scroll when a [main target](/up-main) is updated,
you may append `-if-main` to any of the string options in this list.

E.g. `{ scroll: 'top-if-main' }` will reset scroll positions, but only if a main target is updated.

To implement other conditions, [pass a function](#custom) instead.


### Scrolling function {#function}

To implement your custom scrolling logic, pass a function as `{ scroll }` option.

The function will be called with the updated fragment and is expected to **either**:

- Scroll the viewport to the desired position (without animation).
- Return one of the scroll options in this list.
- Do nothing.

Here is a scrolling function that scrolls to 15 pixels from the top:

```js
up.render({
  target: '#target',
  url: '/path',
  scroll: (fragment) => document.documentElement.scrollTop = 15 // mark-line
})
```

## Tuning the scroll behavior {#options}

You can control how to handle large elements, apply a scroll margin or snap to screen edges.\
See [tuning the scroll behavior](/scroll-tuning) for details.

@page scrolling
