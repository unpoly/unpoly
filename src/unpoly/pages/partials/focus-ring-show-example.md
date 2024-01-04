When creating a new interactive component, you should make it focusable using the keyboard's `Tab` key
by assigning a [`[tabindex]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) attribute:

```html
<span class="my-button" tabindex="0">
  ...
</span>
```

To show a focus ring for keyboard users only, use CSS like this:

```css
.my-button {
  &:focus-visible:not(.up-focus-hidden),
  &.up-focus-visible {
    outline: 1px solid royalblue;
  }
}
```

@partial focus-ring-show-example
