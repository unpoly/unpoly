Focus ring visibility
=====================

Unpoly lets you control when a [focused](/focus) fragment shows a visible focus ring.

Because Unpoly [often focuses new content](/focus#default-strategy), you may see focus outline appear in unexpected places.
Try to resist an initial instinct to just remove focus rings globally using CSS.
Focus rings are important for users of keyboards and screen readers to be able to orient themselves
as the focus moves on the page. However, mouse and touch users don't want focus rings most of the time.



Styling
-------

To help your CSS show or hide focus rings in the right situation, Unpoly assigns CSS classes
to the elements it focuses:

- If the user [interacted with the keyboard](/up.event.inputDevice) or if the focused element is a [form field](/up.form.config#config.fieldSelectors), Unpoly will set
  an `.up-focus-visible` class. 
- If the user interacted with
  via mouse, touch or stylus, Unpoly will set an `.up-focus-hidden` class instead.

> [note]
> The web platform uses the `:focus-visible` pseudo-class to indicate focus ring visibility.
> However browsers often incorrectly apply `:focus-visible` during script-driven navigations like Unpoly.
> 
> Unpoly will try to force `:focus-visible` whenever it sets `.up-focus-visible`, but can only do so 
> in [some browsers](https://caniuse.com/mdn-api_htmlelement_focus_options_focusvisible_parameter).


### Hiding unwanted focus rings

@include focus-ring-hide-example


### Styling focus rings on new component

@include focus-ring-show-example


Customizing focus ring visibility
---------------------------------

You can set `up.viewport.config.autoFocusVisible` to a function that decides if a given element should
get a `.up-focus-visible` or `.up-focus-hidden` class.

The default strategy is implemented like this:

```js
up.viewport.config.autoFocusVisible = ({ element, inputDevice }) =>
  inputDevice === 'key' || up.form.isField(element)
```

See `up.event.inputDevice` for a list of values for the `{ inputDevice }` property.

You can replace or extend the default strategy. For example, this would generally use the default strategy, but also never show a focus ring on [main elements](/main):

```js
let defaultVisible = up.viewport.config.autoFocusVisible
up.viewport.config.autoFocusVisible = (options) =>
  defaultVisible(options) && !up.fragment.matches(options.element, ':main')
```

@page focus-visibility
