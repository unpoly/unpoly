You may see unwanted focus rings that you inherited from a [user agent stylesheet](https://bitsofco.de/a-look-at-css-resets-in-2018/) or from
a CSS framework like Bootstrap. You can remove these outlines for most mouse and touch interactions, using CSS like this:

```css
:focus:not(:focus-visible, .up-focus-visible),
.up-focus-hidden {
  outline: none !important;
}
```

By default Unpoly removes an `outline` CSS property from elements with an `.up-focus-hidden` class.

> [tip]
> CSS frameworks might render focus rings using properties other than `outline`. For example,
> Bootstrap uses a `box-shadow` to produce a blurred outline.

@partial focus-ring-hide-example
