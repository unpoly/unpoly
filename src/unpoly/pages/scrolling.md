Scrolling
=========

When updating a fragment you may control how Unpoly scrolls the page by passing
a `{ scroll }` option or `[up-scroll]` attribute.

When [navigating](/navigation) Unpoly will default to
[`{ scroll: 'auto' }`](#auto).

### Revealing the fragment {#target}

To [reveal](/up.reveal) the new fragment, pass `{ scroll: 'target' }`.

The viewport will be scrolled so the new fragment is visible.

See [tuning the scroll behavior](/scroll-tuning) for additional options.

### Revealing another element {#element}

To [reveal](/up.reveal) a matching element, pass a CSS selector string as `{ scroll }` option.

From JavaScript you may also pass the `Element` object that should be revealed.

### Revealing the layer {#layer}

Pass `{ scroll: 'layer' }` to reveal the container element of the updated [layer](/up.layer).

### Revealing the main element {#main}

Pass `{ scroll: 'main' }` to reveal the updated layer's [main element](/up-main).

### Don't scroll {#false}

Pass `{ scroll: false }` to keep all scroll positions.

### Scrolling to the top {#top}

Pass `{ scroll: 'top' }` to reset the scroll positions of all [viewports](/up.viewport) that are ancestors or descendants of the updated fragment.

### Scrolling to the bottom {#bottom}

Pass `{ scroll: 'bottom' }` scroll down all [viewports](/up.viewport) that are ancestors or descendants of the updated fragment.

### Restoring scroll positions {#restore}

Pass `{ scroll: 'restore' }` to restore the last known scroll positions for the updated layer's URL.

Unpoly will automatically save scroll positions before a fragment update.
You may disable this behavior with `{ saveScroll: false }`.

### Revealing the URL's `#hash` target {#hash}

Pass `{ scroll: 'hash' }` to focus the element matching the `#hash` in the URL.

### Conditional scrolling {#conditions}

To only scroll when a [main target](/up-main) is updated,
you may append `-if-main` to any of the string options in this list.

E.g. `{ scroll: 'top-if-main' }` will reset scroll positions, but only if a main target is updated.

To implement other conditions, [pass a function](#custom) instead.

### Attempt multiple scroll strategies {#multiple}

Pass an array of `{ scroll }` options and Unpoly will use the first applicable value.

E.g. `{ scroll: ['hash', 'reset'] }` will first try to an element mathing the `#hash` in the URL.
If the URL has no `#hash`, scroll positions will be reset.

In an `[up-scroll]` attribute you may separate scroll options with a comma:

```html
<a href="/path#section" up-follow up-scroll="hash, top">Link label</a>
```

### Automatic scrolling logic {#auto}

Pass `{ scroll: 'auto' }` to try a sequence of scroll strategies that works for most cases.
This is the default when [navigating](/navigation).

- If the URL has a `#hash`, scroll to the hash.
- If updating a [main target](/up-main), reset scroll positions.
  The assumption is that we navigated to a new screen.
- Otherwise don't scroll.

You may configure this logic in `up.fragment.config.autoScroll`.

### Custom scrolling logic {#custom}

To implement your custom scrolling logic, pass a function as `{ scroll }` option.

The function will be called with the updated fragment and an options object.
The function is expected to either:

- Scroll the viewport to the desired position (without animation).
- Return one of the scroll options in this list.
- Do nothing.

### Tuning the scroll behavior {#options}

See [tuning the scroll behavior](/scroll-tuning) for additional scroll-related options.

@page scrolling
