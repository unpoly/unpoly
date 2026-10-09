Focus ring visibility
=====================

Unpoly lets you control whether a [focused](/focus) fragment shows a visible focus ring.
Elements focused by Unpoly get a CSS class that says whether a ring is wanted,
so your stylesheet can show rings for keyboard users and hide them for mouse and touch users.

Because Unpoly [often focuses new content](/focus#auto), you may see focus outlines appear in unexpected places.
Try to resist an initial instinct to just remove focus rings globally using CSS.
Focus rings are important for users of keyboards and screen readers to orient themselves
as the focus moves on the page. However, mouse and touch users often dislike the visual effect of a focus ring.


Visibility classes {#classes}
------------------

To help your CSS show or hide focus rings in the right situation, Unpoly assigns CSS classes
to the elements it focuses:

- If the user [interacted with the keyboard](/up.event.inputDevice), or if the focused element is a [form field](/up.form.config#config.fieldSelectors),
  Unpoly sets an `.up-focus-visible` class.
- If the user interacted via mouse, touch or stylus, Unpoly sets an `.up-focus-hidden` class instead.

```html
<main class="up-focus-hidden" tabindex="-1"> <!-- mark: class="up-focus-hidden" -->
  Content focused after a mouse click
</main>
```

> [note]
> The web platform uses the [`:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
> pseudo-class to indicate focus ring visibility.
> However, browsers often incorrectly apply `:focus-visible` during script-driven navigations like Unpoly.
>
> Unpoly tries to force or unset `:focus-visible` whenever it sets a visibility class, but can only do so
> in [some browsers](https://caniuse.com/mdn-api_htmlelement_focus_options_focusvisible_parameter).


## Hiding unwanted focus rings with CSS {#hide}

@include focus-ring-hide-example


## Styling focus rings on a new component {#show}

@include focus-ring-show-example


Customizing focus ring visibility {#visibility-config}
---------------------------------

Instead of [hiding unwanted focus rings with CSS](#hide), you can configure the `up.viewport.config.autoFocusVisible` function.
This function decides whether a given element gets an `.up-focus-visible` or `.up-focus-hidden` class.

The default strategy is implemented like this:

```js
up.viewport.config.autoFocusVisible = ({ element, inputDevice }) =>
  inputDevice === 'key' || up.form.isField(element)
```

See `up.event.inputDevice` for a list of values for the `{ inputDevice }` property.

You can replace or extend the default strategy. For example, the following configuration
keeps the default strategy, but never shows a focus ring on [main elements](/main):

```js
let defaultVisible = up.viewport.config.autoFocusVisible
up.viewport.config.autoFocusVisible = (options) =>
  defaultVisible(options) && !up.fragment.matches(options.element, ':main')
```


## Overriding visibility for a single interaction {#per-interaction}

If you are happy with your default strategy, but want to override it for a single interaction,
set an [`[up-focus-visible]`](/up-follow#up-focus-visible) attribute on any link or form:

```html
<a href="/path" up-follow up-focus="main" up-focus-visible="false">Click me</a> <!-- mark: up-focus-visible="false" -->
```

When rendering from JavaScript, pass a `{ focusVisible }` option:

```js
up.navigate({
  url: '/path',
  focus: 'main',
  focusVisible: false // mark: focusVisible: false
})
```

The same option is accepted by `up.focus()`.


@page focus-visibility
