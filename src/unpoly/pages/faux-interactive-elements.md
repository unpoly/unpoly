Elements that act like links or buttons
=======================================

Unpoly can make any element act like a link or a button: a table row that follows the link in it,
a `<span>` that navigates, or a card that emits an event when clicked.
Unlike a naive `click` listener, these elements stay usable with the keyboard and with screen readers.


Making a row or card follow its link {#expanding}
------------------------------------

A table row or a card often contains a link to a details page. Set an `[up-expand]` attribute
to make a click anywhere in the row follow that link:

```html
<tr up-expand> <!-- mark: up-expand -->
  <td><a href="/users/5" up-follow>Alice</a></td>
  <td>alice@example.com</td>
  <td>Admin</td>
</tr>
```

A click on the email address does what a click on *Alice* does. It follows the link to `/users/5`.

HTML doesn't let you wrap a `<tr>` in an `<a>` element, so `[up-expand]` is the way to make a whole row clickable.
For a card, you can also wrap the whole card in an `<a>` element.
[It's OK to put block elements inside a link](https://makandracards.com/makandra/43549-it-s-ok-to-put-block-elements-inside-an-a-tag),
and only a real link lets users open the card in a new tab with a middle click or from the context menu.
In an `[up-expand]` area, only the link itself offers that.


### Choosing the link

By default the area follows its first link. When a row contains several links,
set `[up-expand]` to a selector for the one to follow:

```html
<tr up-expand=".details"> <!-- mark: .details -->
  <td><a href="/companies/3" up-follow>Acme Inc.</a></td>
  <td><a href="/users/5" class="details" up-follow>Alice</a></td> <!-- mark: class="details" -->
  <td>alice@example.com</td>
</tr>
```

A click on *Acme Inc.* follows that link. A click anywhere else in the row follows *Alice*.


### Links that Unpoly doesn't follow

When Unpoly doesn't follow the link, a click on the area clicks the link.
A plain link makes a full page load, a `[download]` link downloads its file, and a `[target=_blank]` link opens a new tab:

```html
<tr up-expand>
  <td><a href="/invoices/7.pdf" download>Invoice #7</a></td> <!-- mark: download -->
  <td>€ 120.00</td>
</tr>
```

A click on the amount downloads the PDF.

To update a fragment instead, give the link an `[up-follow]` attribute, or [follow all links](/learn/handling-all-links).


### The area takes over the link's attributes

When Unpoly follows the link, the area takes over the link's Unpoly attributes:

```html
<tr up-expand>
  <td><a href="/users/5" up-layer="new" up-preload>Alice</a></td> <!-- mark: up-layer="new" up-preload -->
  <td>alice@example.com</td>
</tr>
```

A click anywhere in this row opens Alice in an [overlay](/learn/overlays), and hovering over the row [preloads](/learn/preloading) her page.
Attributes that your own [macros](/api/up.macro) set on the link are taken over as well.

A click on the area follows the link itself. Events like `up:link:follow` are emitted on the link,
and the link is the [origin](/learn/targeting-fragments#referring-to-the-origin-element) of the fragment update.
The link's `[data-method]` and `[data-confirm]` attributes from Rails also apply, e.g. for a delete link that asks for confirmation.


Acting like a hyperlink
-----------------------

When there is no link to expand, set an `[up-follow]` attribute on any element to make it behave like a link.
Set the destination URL as an `[up-href]` attribute:

```html
<span up-follow up-href="/details">Read more</span> <!-- mark: up-href="/details" -->
```

A click on the `<span>` [follows](/learn/following-links) the URL `/details`.
The element works with any link feature, like `[up-target]`, `[up-instant]`, `[up-preload]` or `up.follow()`.

Prefer a real `<a>` element where you can, or an `[up-expand]` area around one.
Only a real link lets users open its destination in a new tab, works without JavaScript and is followed by search engines.
Use a faux link when you want to avoid exactly that, e.g. to keep a link from being opened in a new tab
or from being followed by crawlers.


Emitting an event on click
--------------------------

Set an `[up-emit]` attribute on any element to have it emit an event when clicked:

```html
<span up-emit="user:select" up-emit-props="{ id: 5 }"> <!-- mark: up-emit="user:select" -->
  Alice
</span>
```

This can be a good solution for letting widely distributed elements communicate with each other.

Like a faux link, the `[up-emit]` element works with the keyboard and with screen readers.
See [Accessibility](#accessibility).


Arbitrary click effects
-----------------------

Set an `[up-clickable]` attribute on any non-interactive element to make it behave like a button:

```html
<span id="faux-button" up-clickable>Click me</span> <!-- mark: up-clickable -->
```

It's up to you to make the element appear interactive visually, e.g. by assigning a `.button` class from your design system.

To react to the element being activated, handle the `up:click` event:

```js
let button = document.querySelector('#faux-button')

button.addEventListener('up:click', function(event) {
  console.log('Click on faux button!')
})
```

To make elements clickable without an explicit `[up-clickable]` attribute, configure `up.link.config.clickableSelectors`.


Controls inside clickable elements {#controls}
----------------------------------

A clickable row often has controls of its own, like a checkbox to select the row or a button to archive it.
Inside an `[up-expand]` area or an `[up-follow][up-href]` element, these controls keep their clicks:

```html
<tr up-expand>
  <td><input type="checkbox" name="user_ids[]" value="5"></td> <!-- mark: input -->
  <td><a href="/users/5" up-follow>Alice</a></td>
  <td>
    <form method="post" action="/users/5/archive" up-submit>
      <button>Archive</button> <!-- mark: button -->
    </form>
  </td>
</tr>
```

A click on the checkbox toggles it, and a click on *Archive* submits the form.
Only a click elsewhere in the row follows the link to `/users/5`.
The same goes for other links, form fields, labels and `<summary>` elements within the area.

Elements with `[up-emit]` or `[up-clickable]` don't make this distinction. They react to a click anywhere within them.


### Your own widgets

When an element in the area handles clicks with your own JavaScript, prevent its `up:click` event,
so the area doesn't also follow its link.
This `<check-cell>` element toggles its checkbox when the user clicks anywhere in the cell:

```html
<tr up-expand>
  <td><check-cell><input type="checkbox" name="user_ids[]" value="5"></check-cell></td> <!-- mark: check-cell -->
  <td><a href="/users/5" up-follow>Alice</a></td>
</tr>
```

```js
class CheckCell extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('up:click', (event) => {
      let checkbox = this.querySelector('input[type=checkbox]')
      // A click on the checkbox already toggles it
      if (event.target === checkbox) return
      event.preventDefault() // mark-line
      checkbox.click()
    })
  }
}

customElements.define('check-cell', CheckCell)
```

Preventing `up:click` also prevents the underlying `click` event.
That's why the listener leaves clicks on the checkbox itself alone.


### Inside a link

Inside an `<a>` element, buttons and labels belong to the link, so a click on them follows it.
HTML doesn't allow controls within a link anyway. When a clickable area needs controls, use `[up-expand]` instead.


Acting on press {#instant}
---------------

Set an `[up-instant]` attribute to activate an element on `mousedown` instead of `click`:

```html
<span up-emit="menu:open" up-instant>Menu</span> <!-- mark: up-instant -->
```

This works for faux links, `[up-emit]` and `[up-clickable]` elements, and for `[up-expand]` areas,
which copy `[up-instant]` from their link.

A press on a control within the element, like a checkbox, still waits for the `click`, so the control works as usual.
The same goes for a press whose `mousedown` event was prevented by another script, e.g. to keep the focus in a search field.
In both cases Unpoly emits `up:click` on `click` instead of `mousedown`.

See [Acting on press](/learn/following-links#instant) for when `[up-instant]` makes sense.


Accessibility
-------------

Naively adding a `click` listener to a non-interactive element causes [accessibility issues](https://keepinguptodate.com/pages/2019/04/accessible-javascript-click-handlers/):
the element cannot be focused, keyboard users cannot activate it, and screen readers won't announce it as interactive.

To prevent these issues, Unpoly adds the following behaviors to elements with `[up-follow][up-href]`, `[up-emit]` or `[up-clickable]`:

- The element is given a [`[role=link]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/link_role)
  or [`[role=button]`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role)
  attribute so screen readers announce it as an interactive element. To override Unpoly's choice of role, set a `[role]` attribute manually.
- Link-like elements show a [`pointer`](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) cursor when hovered over.
- The element gets a [`[tabindex=0]`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) attribute so it can be focused with the keyboard. An existing `[tabindex]` attribute will be preserved.
- Pressing Enter activates the element. An element with a button role also activates with the Space key.
- The element emits an `up:click` event when activated, by mouse or by keyboard.

> [note]
> No additional behaviors will be added to `<a>` or `<button>` elements, as these are accessible by default.

An `[up-expand]` area only gets a pointer cursor. It gets no role and no `[tabindex]`, since the link inside it is already
focusable and announced as a link. Keyboard and screen reader users use that link, and making the area a link as well
would announce the same destination twice.


@page faux-interactive-elements
@menu-title Custom links and buttons
