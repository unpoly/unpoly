When the element is not an `<a>` or `<button>`, it gains the following behaviors to make it more accessible:

- The element is given an [`[role=link]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/link_role)
  attribute so screen readers announce it as link.
- The element shows [`pointer`](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) cursor when hovered over.
- The element can be focused with the keyboard.
- The element emits an `up:click` event when activated.
- You may also assign an [`[up-instant]`](/a-up-instant) attribute to make the element
  activate on `mousedown` instead of `click`.

@partial clickable-behaviors
