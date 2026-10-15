Overlays
========

Unpoly can open any URL in an overlay, like a modal dialog or a drawer.
An overlay can show a single fragment or host an interaction that spans multiple pages.
When it closes, an overlay can pass a result value back to the layer that opened it.


Opening an overlay
------------------

Any link can open its destination in a new overlay:

```html
<a href="/users/new" up-layer="new">Add user</a> <!-- mark: up-layer="new" -->
```

The server renders `/users/new` as a full HTML page, the same way it would for
a regular page load. Unpoly extracts the page's [main element](/main) and shows it
in a modal dialog. The user can dismiss the dialog by pressing `Escape`,
by clicking outside the box, or with its close button.

The link stays a standard hyperlink. When the user opens it in a new tab,
or when JavaScript is unavailable, the browser loads `/users/new` as a full page.

Forms, your JavaScript and the server can open overlays too.

[[more: opening-overlays]]


Layers are isolated
-------------------

Links and forms always update fragments within their own layer.
A form in an overlay re-renders inside that overlay, even when the page
behind it contains an element with the same selector. JavaScript functions like
`up.fragment.get()` also match in the current layer only.

Because of this isolation, you can write a screen once and open it as a full
page or in an overlay, without the screen knowing the difference.

A link can still update another layer by targeting it explicitly.
For example, a link inside an overlay can update the root layer:

```html
<a href="/users" up-layer="root">Show all users</a> <!-- mark: up-layer="root" -->
```

See [[targeting-other-layers]] for all ways to address another layer.


Layer modes {#layer-modes}
-----------

The appearance and behavior of a layer is called its *mode*.
The root layer's mode is always `root`. For overlays, these modes are available:

@include overlay-modes-table

When no mode is given, a new overlay opens as a `modal`.
To choose a different mode, append it to the `[up-layer]` attribute:

```html
<a href="/menu" up-layer="new drawer">≡ Menu</a> <!-- mark: new drawer -->
```

You can change the default mode in `up.layer.config.mode`.


Closing overlays
----------------

There are many ways to close an overlay. The user can press `Escape`, click the backdrop
or use the close button. A button, link or form inside the overlay can close it,
and so can your JavaScript or the server.

Every close has an intent: an overlay is *accepted* when the user completed their task,
or *dismissed* when they canceled. An accepted overlay can pass a result value back to the
layer that opened it, like the ID of a newly created record:

```html
<button up-accept="{ id: 5 }">Choose user #5</button> <!-- mark: up-accept -->
```

[[more: closing-overlays]]


Subinteractions
---------------

The link that opens an overlay can also decide when the overlay's task is done,
like when it reaches a URL, emits an event or renders a fragment.
The overlay then closes automatically, and a callback on the link receives the result value.

With this, you can embed any existing screen as a step of a larger interaction.
A user filling in a project form can create a missing company in an overlay,
without leaving the half-completed form.
The project form opens the company form, waits for the new record, and selects it:

```html
<fieldset>
  <label for="company">Company</label>
  <select id="company" name="company">...</select>
</fieldset>

<a href="/companies/new"
  up-layer="new"
  up-accept-location="/companies/$id"
  up-on-accepted="up.validate('select', { params: { company: value.id } })"> <!-- mark: value.id -->
  New company
</a>
```

The company form has no idea it is part of a project form. It is the same
screen the user would see when creating a company on its own.

[[more: subinteractions]]


Changing an overlay's appearance
--------------------------------

Overlays ship with minimal styling. When opening an overlay, you can pick a size
and assign your own CSS classes to style it:

```html
<a href="/terms" up-layer="new" up-size="large" up-class="legal">Show terms</a> <!-- mark: up-size="large" up-class="legal" -->
```

Drawers and popups can be positioned, and opening and closing can be animated.

[[more: customizing-overlays]]


See also
--------

To address a layer other than the current one, like the page behind an overlay, see [[targeting-other-layers]].

To keep state for the lifetime of an overlay, like the record a reused screen is picking for, see [[layer-context]].

To control whether an overlay's location shows in the address bar, see [[history-in-overlays]].

@page overlays
@menu-title Overview
@signature
