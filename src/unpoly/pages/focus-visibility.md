Focus ring visibility
=====================

Unpoly lets you control when a [focused](/focus) fragment has a visible focus ring (outline).

Focus rings are especially important for users of keyboards and screen readers.
Mouse and touch users don't want focus rings most of the time.


Default strategy
----------------

By default the focus ring will be visible if either the user [interacted with the keyboard](/up.event.inputDevice)
or the focused element is a [form field](/up.form.config#config.fieldSelectors). If the user interacted with
via mouse, touch or stylus, the focus ring will be hidden.


### Customizing the default strategy

You can set `up.viewport.config.autoFocusVisible` to a function that decides if a given element should have a visible
focus ring when interacted with a given [input device class](/up.event.inputDevice).

The default strategy is implemented like this:

```js
up.viewport.config.autoFocusVisible = ({ element, inputDevice }) =>
  inputDevice === 'key' || up.form.isField(element)
```


Styling
-------

In the web platform is `:focus-visible`. This causes `:focus-visible` to be set a in script-driven solutions like Unpoly.

Until [browsers support scripts to control `:focus-visible`](https://caniuse.com/mdn-api_htmlelement_focus_options_focusvisible_parameter), Unpoly sets `.up-focus-visible` and `.up-focus-hidden` classes
to help you show or hide focus rings using CSS.


### Hiding unwanted focus rings

When Unpoly focuses an element that should not have an evident focus, an `.up-focus-visible` is set.

You can use this class to remove an unwanted focus outline that you inherited
from a [user agent stylesheet](https://bitsofco.de/a-look-at-css-resets-in-2018/) or from
a CSS framework like Bootstrap:

```css
:focus:not(:focus-visible, .up-focus-visible), .up-focus-hidden {
  outline: none;
}
```

Bye default Unpoly removes an `outline` CSS property from elements with an `.up-focus-hidden` class.

Note that CSS frameworks might render focus rings using properties other than `outline`. For example,
Bootstrap uses a `box-shadow` to produce a blurred outline.



### Showing focus rings

When Unpoly focuses an element that should make their focus evident, an `.up-focus-visible` is set.

To only set a focus ring on elements that should have evident focus, use CSS like this:

```css
:focus-visible:not(.up-focus-hidden), .up-focus-visible {
  outline: 1px solid royalblue;
}
```




@page focus-visibility
