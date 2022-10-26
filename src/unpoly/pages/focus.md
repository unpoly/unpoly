Controlling focus
=================

When you update the page you should think about placing the [focus](https://en.wikipedia.org/wiki/Focus_(computing)).

Changing the focus will generally make a screen reader start reading from the focused position. Placing the focus on new content can help make your app accessible to users with vision or motor impairments, or to users that prefer the keyboard over the mouse.


Focus strategies
----------------

When updating a fragment you may control how Unpoly moves focus by passing
a `{ focus }` option or `[up-focus]` attribute.

### Defaults

When you don't pass a `{ focus }` option, Unpoly has some defaults:

- When rendering without navigation Unpoly will default to [`{ focus: 'keep' }`](#preserving-focus). This will preserve focus in updated fragments. 
- When [navigating](/navigation) Unpoly will default to [`{ focus: 'auto' }`](#automatic-focus-logic). In most cases this focuses the new fragment.

### Focusing the fragment

Pass `{ focus: 'target' }` to focus the new fragment.

### Focusing the current layer

Pass `{ focus: 'layer' }` to focus the [layer](/up.layer) of the updated fragment.

### Focusing another element

Pass a CSS selector string to focus a matching element:https://en.wikipedia.org/wiki/Focus_(computing)

```js
up.render({
  target: '.content',
  url: '/advanced-search',
  focus: 'input[type=search]'
})
```

From JavaScript you may also pass the `Element` object that should be focused.

If the element isn't already focusable, Unpoly will give it an `[tabindex=-1]` attribute.

### Preserving focus

Pass `{ focus: 'keep' }` to preserve focus-related state through a fragment update.

For instance, when a focused `<input>` element is swapped out with a new fragment,
`{ focus: 'keep' }` will cause the same input to be focused after the update.  

The following properties are preserved:

- Which element is focused.
- The cursor position within a focused input element.
- The selection range within a focused input element.
- The scroll position within a focused input element.

### Restoring focus

Pass `{ focus: 'restore' }` to restore an previously [saved focus state](/up.viewport.saveFocus)
for the updated layer's URL.

Unpoly will automatically save focus-related state before a fragment update.
You may disable this behavior with `{ saveFocus: false }`.

### Revealing the URL's `#hash` target

Pass `{ focus: 'hash' }` to focus the element matching the `#hash` in the URL.

### Revealing the main element

Pass `{ focus: 'main' }` to reveal the updated layer's [main element](/up-main).

### Don't focus

Pass `{ focus: false }` to not actively manipulate focus.

Note that even with `{ focus: false }` the focus may change during a fragment update. For instance, when a fragment contains focus and is then swapped, focus will revert to the `<body>` element.

To actively try and preserve focus, use [`{ focus: 'keep' }`](#preserving-focus) instead.

### Conditional focusing

To only focus when a [main target](/up-main) is updated,
you may append `-if-main` to any of the string options in this list.

E.g. `{ focus: 'reset-if-main' }` will reset focus positions, but only if a main target is updated.

To only focus when the focus was lost with the old fragment,
you may append `-if-lost` to any of the string options in this list.

E.g. `{ focus: 'target-if-lost' }` will focus the new fragment, but only if the update caused focus
to be lost.

To implement other conditions, [pass a function](#custom-focus-logic) instead.

### Attempt multiple focus strategies

Pass an array of focus option and Unpoly will use the first applicable value.

E.g. `{ focus: ['hash', 'reset'] }` will first try to an element mathing the `#hash` in the URL.
If the URL has no `#hash`, focus positions will be reset.

In an `[up-focus]` attribute you may separate scroll options with an `or`:

```html
<a href="/path#section" up-follow up-focus="hash or reset">Link label</a> 
```

### Automatic focus logic

Pass `{ focus: 'auto' }` to try a sequence of focus strategies that works for most cases.
This is the default when [navigating](/navigation).

- Focus a `#hash` in the URL.
- Focus an `[autofocus]` element in the new fragment.
- If updating a [main target](/up-main), focus the new fragment.
- If focus was lost with the old fragment, re-focus a [similar](/target-derivation) element.
- If focus was lost with the old fragment, focus the new fragment.

You may configure this logic in `up.fragment.config.autoFocus`.

### Custom focus logic

You may also pass a function with your custom focusing logic.

The function will be called with the updated fragment and an options object.
The function is expected to either:

- Focus the viewport to the desired position. Focusing must not change
  scroll positions, since scrolling is governed by a separate [`{ scroll }` option](/scrolling).
  Both [`Element#focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and `up.focus()`
  accept a `{ preventScroll: true }` option to prevent scrolling.
- Return one of the focus options in this list
- Do nothing


Focus in overlays
-----------------

### When an overlay is opened

When opening an [overlay](/up.layer) the first applicable strategy will be used:

- Focus an `[autofocus]` element in the new overlay.
- Focus the overlay element.


### Focus is trapped within an overlay

Moving the focus outside the overlay will immediately re-focus it. This prevents keyboard users from accidentally skipping to content from other layers.

Occasionally the focus trap may conflict with overlays opened by overlays opened by other JavaScript libraries. You can address this by configuring `up.layer.config.foreignOverlaySelectors`.


### When an overlay is updated

When updating a fragment within an existing overlay, all [focus strategies](#focus-strategies) above can be used. 


### When an overlay is closed

When an overlay is closed, the link that originally opened the overlay is re-focused.

Ihe layer was [opened programmatically](/up.layer.open) without an `{ origin }` option, the origin link is unknown. In that case the the parent layer is focused.


@page focus
