
Scroll option
=============

When updating a fragment you may control how Unpoly scrolls the page by passing
a `{ scroll }` option or `[up-scroll]` attribute.

When [navigating](/navigation) Unpoly will default to
[`{ scroll: 'auto' }`](#automatic-scrolling-logic).

### Revealing the fragment

To [reveal](/up.reveal) the new fragment, pass `{ scroll: 'target' }`.

The viewport will be scrolled so the new fragment is visible.

See [tuning the scroll behavior](/scroll-tuning) for additional options.

### Revealing another element

To [reveal](/up.reveal) a matching element, pass a CSS selector string as `{ scroll }` option.

From JavaScript you may also pass the `Element` object that should be revealed.

### Revealing the layer

Pass `{ scroll: 'layer' }` to reveal the container element of the updated [layer](/up.layer).

### Revealing the main element

Pass `{ scroll: 'main' }` to reveal the updated layer's [main element](/up-main).

### Don't scroll

Pass `{ scroll: false }` to keep all scroll positions.

### Resetting scroll positions

Pass `{ scroll: 'reset' }` to reset the scroll positions of all
[viewports](/up.viewport) that are ancestors or descendants of the updated fragment.

### Restoring scroll positions

Pass `{ scroll: 'restore' }` to restore the last known scroll positions for the updated layer's URL.

Unpoly will automatically save scroll positions before a fragment update.
You may disable this behavior with `{ saveScroll: false }`.

### Revealing the URL's `#hash` target

Pass `{ scroll: 'hash' }` to focus the element matching the `#hash` in the URL.

### Conditional scrolling

To only scroll when a [main target](/up-main) is updated,
you may append `-if-main` to any of the string options in this list.

E.g. `{ scroll: 'reset-if-main' }` will reset scroll positions, but only if a main target is updated.

To implement other conditions, [pass a function](#custom-scrolling-logic) instead.

### Attempt multiple scroll strategies

Pass an array of `{ scroll }` options and Unpoly will use the first applicable value.

E.g. `{ scroll: ['hash', 'reset'] }` will first try to an element mathing the `#hash` in the URL.
If the URL has no `#hash`, scroll positions will be reset.

### Automatic scrolling logic

Pass `{ scroll: 'auto' }` to try a sequence of scroll strategies that works for most cases.
This is the default when [navigating](/navigation).

- If the URL has a `#hash`, scroll to the hash.
- If updating a [main target](/up-main), reset scroll positions.
  The assumption is that we navigated to a new screen.
- Otherwise don't scroll.

You may configure this logic in `up.fragment.config.autoScroll`.

### Custom scrolling logic

To implement your custom scrolling logic, pass a function as `{ scroll }` option.

The function will be called with the updated fragment and an options object.
The function is expected to either:

- Scroll the viewport to the desired position (without animation).
- Return one of the scroll options in this list.
- Do nothing.

### Tuning the scroll behavior

See [tuning the scroll behavior](/scroll-tuning) for additional scroll-related options.

@page scroll-option
