Clicking non-interactive elements
=================================

Sometimes you need to add a `click` listener to non-interactive elements (like `<span>`). Unpoly ships with some tools to prevent [accessibility issues](#accessibility)
when emulating interactivity on non-interactive elements.


## Acting like a hyperlink

Add an `[up-follow]` attribute on any non-interactive element to make it behave like a hyperlink.
The element will support keyboard navigation and many other [behaviors for accessibility](#accessibility).

The link's destination URL can be set as an `[up-href]` attribute.
For example, the following `<span>` element will [navigate](/a-up-follow) to `/details` when clicked:

```html
<span up-follow up-href="/details">Read more</span>
```



The `[up-follow]` element can be used with any hyperlink-related functionality, such as `[up-instant]`, `[up-preload]` or `up.follow()`. 


### Prefer regular hyperlinks

In general you should prefer using regular hyperlinks (`a[href]`) over elements with `[up-href]`:

- Only regular links allow the user to open the destination in a new tab
- Regular links still work when JavaScript is unavailable.
- Regular links can be followed from crawlers like Google
- Although `<a>` is an inline element, it may [contain block elements](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag). Hence you can use `<a>` to make a large area clickable.

There are also some use cases for `[up-href]`:

- When you want to *prevent* the user from opening a link in a new tab.
- When the element cannot be wrapped in an `<a>`, e.g. a `<tr>`.
- When you want a link to not be followed by crawlers like Google.


## Emitting an event on click

You can use `[up-emit]` on any element to have it emit an event when clicked:

```html
<span up-emit='user:select' up-emit-props='{ "user_id": 5 }'>
  Alice
</span>
```

This can be a good solution to let widely distributed elements communicate with each other.

The `[up-emit]` element will support keyboard navigation and many other [behaviors for accessibility](#accessibility).


## Arbitrary click effects

Add an `[up-clickable]` attribute on any non-interactive element to make it behave like a button:

```html
<span id="faux-button" up-clickable>Click me</span>
```

This will enable keyboard navigation and many other [behaviors for accessibility](#accessibility).
It's up to you make the element appear interactive visually, e.g. by assigning a `.button` class from your design system.

To react to the element being activated, handle the `up:click` event:

```js
let button = document.querySelector('#faux-button')

button.addEventListener('up:click', function(event) {
  console.log('Click on faux button!')
})
```

To make elements clickable without an explicit `[up-clickable]` attribute, configure `up.link.config.clickableSelectors`.


## Accessibility

Naively adding a `click` handler on a non-interactive element will cause [accessibility issues](https://keepinguptodate.com/pages/2019/04/accessible-javascript-click-handlers/).

To prevent this, Unpoly adds the following behaviors to elements with `[up-follow][up-href]`, `[up-emit]` or `[up-clickable]`:

- The element is given an [`[role=link]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/link_role)
  or [`[role=button]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role)
  attribute so screen readers announce it as an interactive element. To override Unpoly's choice of role, set a `[role]` attribute manually.
- Link-like elements show a [`pointer`](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) cursor when hovered over.
- The element gets a [`[tabindex=0]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) attribute so it can be focused with the keyboard. An existing `[tabindex]` attribute will be preserved.
- The element emits an `up:click` event when activated.
- You may also assign an `[up-instant]` attribute to make the element activate on `mousedown` instead of `click` ("Act on press").

> [note]
> No additional behaviors will be added to `<a>` or `<button>` elements, as these are accessible by default.


@page faux-interactive-elements
