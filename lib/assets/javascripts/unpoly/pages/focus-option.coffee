###**
Focus option
=============

When updating a fragment you may control how Unpoly focuss the page by passing
a `{ focus }` option or `[up-focus]` attribute.

Changing the focus will make a screen reader start reading from the focused position.

\#\#\# Focusing the fragment

Pass `'target`' to focus the new fragment.

\#\#\# Focusing the current layer

Pass `'layer`' to focus the [layer](/up.layer) of the updated fragment.

\#\#\# Focusing another element

Pass a CSS selector string to focus a matching element.

From JavaScript you may also pass the `Element` object that should be focused.

\#\#\# Preserving focus

Pass `'keep'` to preserve focus-related element properties.

When the focused fragment is rediscovered in the new content, the following properties are preserved:

- Cursor position ("Caret")
- Selection range
- Scroll position (X/Y)

\#\#\# Resetting focus to the layer

Pass `'layer'` to focus the container element of the updated [layer](/up.layer).

\#\#\# Restoring focus positions

Pass `'reset'` to restore the last known focus positions for the updated layer's URL.

Unpoly will automatically save focus positions before a fragment update.
You may disable this behavior with `{ saveFocus: false }`.

\#\#\# Revealing the URL's `#hash` target

Pass `'hash'` to focus the element matching the `#hash` in the URL.

\#\#\# Revealing the main element

Pass `'main'` to reveal the updated layer's [main element](/main).

\#\#\# Don't focus

Pass `false` to keep all focus positions.

\#\#\# Conditional focusing

To only focus when a [main target](/main) is updated,
you may append `-if-main` to any of the string options in this list.

E.g. `'reset-if-main'` will reset focus positions, but only if a main target is updated.

To only focus when the focus was lost with the old fragment,
you may append `-if-list` to any of the string options in this list.

E.g. `'target-if-lost'` will focus the new fragment, but only if the update caused focus
to be lost.

To implement other conditions, [pass a function](#custom-focus-logic) instead.

\#\#\# Attempt multiple focus strategies

Pass an array of focus option and Unpoly will use the first applicable value.

E.g. `['hash', 'reset']` will first try to an element mathing the `#hash` in the URL.
If the URL has no `#hash`, focus positions will be reset.

\#\#\# Automatic focus logic

Pass `'auto'` to try a sequence of focus strategies that works for most cases.
This is the default when [navigating](/navigation).

- Focus a `#hash` in the URL.
- Focus an `[autofocus]` element in the new fragment.
- If focus was lost with the old fragment, focus the new fragment.
- If updating a [main target](/main), focus the new fragment.

You may configure this logic in `up.fragment.config.autoFocus`.

\#\#\# Custom focus logic

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
###
