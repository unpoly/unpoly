Focus option
=============

When updating a fragment you may control how Unpoly moves focus by passing
a `{ focus }` option or `[up-focus]` attribute.

Changing the focus will make a screen reader start reading from the focused position.

When [navigating](/navigation) Unpoly will default to
[`{ focus: 'auto' }`](#automatic-focus-logic).

### Focusing the fragment

Pass `{ focus: 'target' }` to focus the new fragment.

### Focusing the current layer

Pass `{ focus: 'layer' }` to focus the [layer](/up.layer) of the updated fragment.

### Focusing another element

Pass a CSS selector string to focus a matching element.

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

### Restoring scroll positions

Pass `{ focus: 'restore' }` to restore an previously [saved focus state](/up.viewport.saveFocus)
for the updated layer's URL.

Unpoly will automatically save focus-related state before a fragment update.
You may disable this behavior with `{ saveFocus: false }`.

### Resetting focus to the layer

Pass `'layer'` to focus the container element of the updated [layer](/up.layer).

### Restoring focus positions

Pass `'reset'` to restore the last known focus positions for the updated layer's URL.

Unpoly will automatically save focus positions before a fragment update.
You may disable this behavior with `{ saveFocus: false }`.

### Revealing the URL's `#hash` target

Pass `'hash'` to focus the element matching the `#hash` in the URL.

### Revealing the main element

Pass `'main'` to reveal the updated layer's [main element](/up-main).

### Don't focus

Pass `false` to keep all focus positions.

### Conditional focusing

To only focus when a [main target](/up-main) is updated,
you may append `-if-main` to any of the string options in this list.

E.g. `'reset-if-main'` will reset focus positions, but only if a main target is updated.

To only focus when the focus was lost with the old fragment,
you may append `-if-list` to any of the string options in this list.

E.g. `'target-if-lost'` will focus the new fragment, but only if the update caused focus
to be lost.

To implement other conditions, [pass a function](#custom-focus-logic) instead.

### Attempt multiple focus strategies

Pass an array of focus option and Unpoly will use the first applicable value.

E.g. `['hash', 'reset']` will first try to an element mathing the `#hash` in the URL.
If the URL has no `#hash`, focus positions will be reset.

In an `[up-focus]` attribute you may separate scroll options with an `or`:

```html
<a href="/path#section" up-follow up-focus="hash or reset">Link label</a> 
```

### Automatic focus logic

Pass `'auto'` to try a sequence of focus strategies that works for most cases.
This is the default when [navigating](/navigation).

- Focus a `#hash` in the URL.
- Focus an `[autofocus]` element in the new fragment.
- If focus was lost with the old fragment, focus the new fragment.
- If updating a [main target](/up-main), focus the new fragment.

You may configure this logic in `up.fragment.config.autoFocus`.

### Custom focus logic

You may also pass a function with your custom focusing logic.

The function will be called with the updated fragment and an options object.
The function is expected to either:

- Focus the viewport to the desired position. Focusing must not change
  scroll positions, since scrolling is governed by a separate `{ scroll }` option.
  Both `Element#focus()` and `up.focus()` accept a `{ preventScroll: true }` option
  to prevent scrolling.
- Return one of the focus options in this list
- Do nothing

@page focus-option
