Controlling focus
=================

When updating a fragment, you control where Unpoly places the [focus](https://en.wikipedia.org/wiki/Focus_(computing))
by setting an [`[up-focus]`](/up-follow#up-focus) attribute or by passing a [`{ focus }`](/up.render#options.focus) option.
By default, following a link focuses the new content like a full page load would, and a minor update keeps the focus where it is.

Placing the focus matters for accessibility. A screen reader starts reading from the focused position,
and keyboard users continue tabbing from there. Without focus management, a user who activated a link
would be left somewhere in the old content, unaware that the page has changed.


## Default focus strategy {#auto}

When [navigating](/navigation-defaults), Unpoly tries a sequence of focus strategies that works for most cases:

1. If the URL has a `#hash`, focus the element matching that hash.
2. Focus an `[autofocus]` element in the new fragment.
3. If updating a [main target](/up-main), focus the main element.
4. If focus was lost with the old fragment, re-focus a [similar](/target-derivation) element in the new content.
5. If focus was lost with the old fragment, and no similar element was found, focus the new fragment.

You can change this sequence in `up.fragment.config.autoFocus`.

Following links and submitting forms are considered [navigation](/navigation-defaults), so the default strategy is applied without further configuration.
You can also enable it explicitly by setting `[up-focus="auto"]`:

```html
<a href="/details" up-follow up-focus="auto">Show more</a> <!-- mark: up-focus="auto" -->
```

From JavaScript, pass `{ focus: 'auto' }`:

```js
up.render({ url: '/path', focus: 'auto' }) // mark: focus: 'auto'
```

When rendering without navigation, e.g. with `up.render()` or `[up-validate]`, focus is not changed by default.
`up.reload()` [keeps the current focus](#keep).


## Focusing the new fragment {#target}

To focus the updated fragment, set `[up-focus="target"]`:

```html
<a href="/details" up-target="#details" up-focus="target">Show more</a> <!-- mark: up-focus="target" -->
```

If the fragment isn't focusable by itself, Unpoly gives it a `[tabindex="-1"]` attribute.
This makes it focusable from JavaScript without adding it to the keyboard's tab sequence.

Focusing an element does not scroll it into view. To also reveal the fragment, set [`[up-scroll="target"]`](/scrolling#target).


## Focusing another element {#selector}

To focus a matching element, set `[up-focus]` to any CSS selector string:

```html
<a href="/advanced-search" up-target=".content" up-focus="input[type=search]">Advanced search</a> <!-- mark: up-focus="input[type=search]" -->
```

Unpoly prefers a match within the updated fragment, but the selector may match anywhere in the fragment's layer.

From JavaScript you can also pass the `Element` object that should be focused:

```js
up.render({ target: '.content', url: '/advanced-search', focus: searchField })
```


## Focusing the URL's `#hash` target {#hash}

To focus the element matching the `#hash` in the updated URL, set `[up-focus="hash"]`:

```html
<a href="/product/12#features" up-follow up-focus="hash">Show features</a> <!-- mark: #features -->
```

When the URL has no hash, or no element matches it, focus is not changed.


## Focusing the main element {#main}

To focus the updated layer's [main element](/up-main), set `[up-focus="main"]`:

```html
<a href="/contact" up-follow up-focus="main">Contact us</a> <!-- mark: up-focus="main" -->
```


## Focusing the layer {#layer}

To focus the container element of the updated [layer](/up.layer), set `[up-focus="layer"]`:

```html
<a href="/details" up-follow up-focus="layer">Show more</a> <!-- mark: up-focus="layer" -->
```

In an [overlay](/overlays), this focuses the overlay element,
which screen readers announce as a dialog.


## Preserving focus {#keep}

To preserve focus-related state through a fragment update, set `[up-focus="keep"]`:

```html
<a href="/list" up-follow up-focus="keep">Reload list</a> <!-- mark: up-focus="keep" -->
```

For instance, when a focused `<input>` element is swapped out with a new fragment,
`[up-focus="keep"]` causes the same input to be focused after the update.
The following properties are preserved:

@include focus-state

Focus can only be preserved when the focused element has a [derivable target selector](/target-derivation),
e.g. by setting an `[id]` or `[name]` attribute.

`up.reload()` uses this strategy by default.


## Restoring focus {#restore}

When revisiting an earlier page, you may want to restore the focus from that visit.
Set `[up-focus="restore"]` to restore the last known focus state for the updated URL:

```html
<a href="/list" up-follow up-focus="restore">Back to list</a> <!-- mark: up-focus="restore" -->
```

Before every fragment update, Unpoly [saves focus-related state](/up.viewport.saveFocus) for the current URL.\
You can prevent this by setting [`[up-save-focus="false"]`](/up-follow#up-save-focus).

When the user presses the back button, Unpoly restores focus the same way.
See [[restoring-history]].


## Don't focus {#false}

If you don't want Unpoly to touch the focus, set `[up-focus="false"]`.
For example, this link opts out of the [default focus strategy](#auto) that
[navigation](/navigation-defaults) would apply:

```html
<a href="/details" up-follow up-focus="false">Show more</a> <!-- mark: up-focus="false" -->
```

Note that even with `[up-focus="false"]` the focus may change during a fragment update.
For instance, when a fragment contains focus and is then swapped, focus reverts to the `<body>` element.

To actively preserve focus, use [`[up-focus="keep"]`](#keep) instead.


## Trying multiple strategies {#multiple-strategies}

To attempt multiple focus strategies, separate options with a comma.
Unpoly uses the first strategy that finds an element to focus:

```html
<a href="/path#section" up-follow up-focus="hash, target">Link label</a> <!-- mark: up-focus="hash, target" -->
```

This first tries to focus an element matching the URL's `#hash`.
If the URL has no hash (or if no element matches), the new fragment is focused.

In JavaScript you can pass an array of options:

```js
up.render({ url: '/path#section', focus: ['hash', 'target'] }) // mark: focus: ['hash', 'target']
```

The [default strategy](#auto) is such a sequence.


## Conditional focusing {#condition}

To only focus when a [main target](/up-main) is updated,
append `-if-main` to any string option on this page:

```html
<a href="/details" up-follow up-focus="target-if-main">Show more</a> <!-- mark: up-focus="target-if-main" -->
```

To only focus when the focus was lost with the old fragment, append `-if-lost` instead:

```html
<a href="/list" up-follow up-focus="target-if-lost">Reload list</a> <!-- mark: up-focus="target-if-lost" -->
```

This focuses the new fragment, but only if the update removed the previously focused element.
When the user is typing in a field outside the updated fragment, their focus is left alone.

To implement other conditions, [pass a function](#function) instead.


## Custom focus logic {#function}

To implement your own focus logic, pass a function as `{ focus }` option.

The function is called with the updated fragment and an options object.
The function is expected to either:

- Focus an element. Focusing must not change scroll positions,
  since scrolling is governed by a separate [`{ scroll }` option](/scrolling).
  Both [`Element#focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and `up.focus()`
  accept a `{ preventScroll: true }` option to prevent scrolling.
- Return one of the focus options on this page.
- Do nothing.

Here is a focus function that focuses the first field in the new fragment:

```js
up.render({
  target: 'form',
  url: '/users/new',
  focus: (fragment) => {
    let field = fragment.querySelector('input')
    if (field) up.focus(field, { preventScroll: true }) // mark-line
  }
})
```


## Focusing without a render pass {#js}

Outside a fragment update, call `up.focus()` to focus any element.
Unlike `Element#focus()`, it also [reveals](/scrolling#target) the element,
honoring [fixed layout elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport),
and assigns the [focus visibility classes](/focus-visibility) that your CSS can style:

```js
let field = document.querySelector('input[type=search]')
up.focus(field)
```


## Styling focus states {#focus-visibility}

Because Unpoly often focuses new content, focus rings may appear in places where you don't expect them.
Unpoly lets you control whether a focused fragment shows a visible focus ring.
See [[focus-visibility]].


## Focus in overlays {#overlays}

### When an overlay is opened

When [opening an overlay](/opening-overlays), the first applicable strategy is used:

- Focus an `[autofocus]` element in the new overlay.
- Focus the overlay element.

To focus something else, set an `[up-focus]` attribute on the opening link:

```html
<a href="/users/new" up-layer="new" up-focus="input[name=email]">Add user</a> <!-- mark: up-focus="input[name=email]" -->
```


### Focus is trapped within an overlay {#overlay-focus-trap}

By default focus is trapped for all overlays except [popups](/overlays#layer-modes).
Moving a trapped focus outside the overlay will immediately re-focus it.
This prevents keyboard users from accidentally tabbing into content from other layers.

Occasionally the focus trap conflicts with overlays opened by other JavaScript libraries.
You can address this by configuring `up.layer.config.foreignOverlaySelectors`.

To disable focus trapping entirely, configure `up.layer.config.overlay.trapFocus = false`
or open the overlay with `{ trapFocus: false }`.


### When an overlay is updated

When updating a fragment within an existing overlay, all focus strategies on this page can be used.


### When an overlay is closed

When a closed overlay had focus, the link that originally opened the overlay is re-focused.

If the overlay was [opened programmatically](/up.layer.open) without an `{ origin }` option, the opening link is unknown.
In that case, the parent layer is focused.


@page focus
