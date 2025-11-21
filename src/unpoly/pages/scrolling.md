Scrolling
=========

When updating a fragment you may control how Unpoly scrolls the page by
setting an [`[up-scroll]`](/up-follow#up-scroll) attribute
or passing a [`{ scroll }`](/up.render#options.scroll) option.

When [navigating](/navigation) Unpoly will default to [`[up-scroll="auto"]`](#auto).


## Default scrolling strategy {#auto}

When [navigating](/navigation), Unpoly will try a sequence of scroll strategies that works for most cases:

- If the URL has a `#hash`, scroll to a fragment matching tht hash.
- If updating a [main target](/up-main), reset scroll positions.\
  The assumption being that we navigated to a new screen.
- Otherwise don't scroll.\
  The assumption being that we updated a minor fragment.

You may configure this sequence in `up.fragment.config.autoScroll`.

To apply the default scrolling strategy when not [navigating](/navigation), pass `{ scroll: 'auto' }`:

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

Set `[up-scroll="hash"]` to focus the element matching the `#hash` in the URL:

```html
<a href="/product/12#features" up-follow up-scroll="hash">Show features</a> <!-- mark: #features -->
```



### Revealing the layer {#layer}

Set `[up-scroll="layer"]` to reveal the container element of the updated [layer](/up.layer).

Most [layer modes](/layer-terminology) bring their own scrollbar, and will effectively be scrolled to the top.\
A [popup](/layer-terminology#available-modes) has no scrollbar, so its parent layer will scroll to reveal the popup frame.


### Revealing the main element {#main}

Set `[up-scroll="main"]` to reveal the updated layer's [main element](/up-main).


## Preserving scroll positions

### Don't scroll {#false}

If you don't want Unpoly to touch any scroll positions, set `[up-scroll=false]`.
For example, if you don't want to use the [default scrolling strategy](#auto)
when [navigating](/navigation), you can disable it like so:

```html
<a href="/details" up-follow up-scroll="false">Show more</a> <!-- mark: up-scroll="false" -->
```

When rendering without [navigation](/navigation), no scrolling will happen by default.

Note that if you swap a scrolled viewport, the new viewport element will be scrolled to the top.

### Preserving current scroll positions {#keep}

Pass `{ scroll: 'keep' }` to preserve the scroll positions of all [viewports](/up.viewport) that are ancestors or descendants of the updated fragment.

This is useful when you update viewports that may be scrolled.


### Restoring previous scroll positions {#restore}

Pass `{ scroll: 'restore' }` to restore the last known scroll positions for the updated layer's URL.

Unpoly will automatically save scroll positions before a fragment update.
You may disable this behavior with `{ saveScroll: false }`.



## Resetting scroll positions

### Scrolling to the top {#top}

Pass `{ scroll: 'top' }` to reset the scroll positions of all [viewports](/up.viewport) that are ancestors or descendants of the updated fragment.

### Scrolling to the bottom {#bottom}

Pass `{ scroll: 'bottom' }` scroll down all [viewports](/up.viewport) that are ancestors or descendants of the updated fragment.




## Sequence of scroll strategies {#sequence}

Pass an array of `{ scroll }` options and Unpoly will use the first applicable value.

E.g. `{ scroll: ['hash', 'reset'] }` will first try to an element mathing the `#hash` in the URL.
If the URL has no `#hash`, scroll positions will be reset.

In an `[up-scroll]` attribute you may separate scroll options with a comma:

```html
<a href="/path#section" up-follow up-scroll="hash, top">Link label</a>
```

## Scrolling multiple viewports {#multi-target}

```html
<a
  href="/dashboard"
  up-target="#left, #right"
  up-scroll-map="{ '#left': 'top', '#right': 'bottom' }"
>
  Link label
</a>
```



## Custom scrolling logic {#custom}

### Conditional strategies {#conditions}

To only scroll when a [main target](/up-main) is updated,
you may append `-if-main` to any of the string options in this list.

E.g. `{ scroll: 'top-if-main' }` will reset scroll positions, but only if a main target is updated.

To implement other conditions, [pass a function](#custom) instead.


### Scrolling function {#function}

To implement your custom scrolling logic, pass a function as `{ scroll }` option.

The function will be called with the updated fragment and is expected to either:

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

See [tuning the scroll behavior](/scroll-tuning) for additional scroll-related options.

@page scrolling
