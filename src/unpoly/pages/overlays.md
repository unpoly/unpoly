Overlays
========

Unpoly can open any page in an overlay, like a modal dialog or a drawer.
Overlays let users branch off into a subtask, then return to their original screen
without losing unsaved changes or scroll positions.


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

<p class="read-more"><a href="/opening-overlays">Read more: Opening overlays</a></p>


Layers are isolated
-------------------

The current page and its overlays form a stack of *layers*.
The initial page is called the *root layer*. An *overlay* is any layer
that is not the root layer. Overlays can be stacked without limit,
and the whole stack is available as `up.layer.stack`.

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

See [[layer-option]] for all ways to address another layer.


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
Defaults for each mode are configured in `up.layer.config`,
like `up.layer.config.drawer` for drawers or `up.layer.config.overlay` for all overlays.


Closing with a result
---------------------

An overlay can be *accepted* (the user completed their task) or *dismissed*
(the user canceled). When an overlay is accepted, it can pass a result value
back to the layer that opened it, like the ID of a newly created record.

Users usually open an overlay to complete a small task. You can give the link a
*close condition* for when that task is done:

```html
<a href="/users/new"
  up-layer="new"
  up-accept-location="/users/$id"
  up-on-accepted="up.reload('.user-list')"> <!-- mark: up-on-accepted -->
  Add user
</a>
```

When the user submits the form and the server redirects to the new
user's URL (like `/users/123`), the overlay is accepted automatically. The callback
then reloads the list behind the overlay. The user form needs no changes for
this, and it keeps working as a regular screen outside an overlay.

<p class="read-more"><a href="/closing-overlays">Read more: Closing overlays</a></p>


Subinteractions
---------------

With close conditions and result values, you can embed any existing screen as a step
of a larger interaction. A user filling in a project form can create a missing
company in an overlay, without leaving the half-completed form.
The project form opens the company form, waits for the new record, and selects it:

```html
<select name="company">...</select>

<a href="/companies/new"
  up-layer="new"
  up-accept-location="/companies/$id"
  up-on-accepted="up.validate('select', { params: { company: value.id } })"> <!-- mark: value.id -->
  New company
</a>
```

The company form has no idea it is part of a project form. It is the same
screen the user would see when creating a company on its own.

<p class="read-more"><a href="/subinteractions">Read more: Subinteractions</a></p>


Changing an overlay's appearance
--------------------------------

Overlays ship with minimal styling. When opening an overlay, you can pick a size
and assign your own CSS classes to style it:

```html
<a href="/terms" up-layer="new" up-size="large" up-class="legal">Show terms</a> <!-- mark: up-size="large" up-class="legal" -->
```

Drawers and popups can be positioned, and opening and closing can be animated.

<p class="read-more"><a href="/customizing-overlays">Read more: Customizing overlays</a></p>


Also in this topic
------------------

To address a layer other than the current one, like the page behind an overlay, see [[layer-option]].

To keep state for the lifetime of an overlay, like the record a reused screen is picking for, see [[context]].

To control whether an overlay's location shows in the address bar, see [[history-in-overlays]].

@page overlays
@menu-title Overview
@signature
