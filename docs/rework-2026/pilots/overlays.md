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
in a modal dialog. When the user opens the link in a new tab, or when JavaScript
is unavailable, the same route still works as a full page.

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
user's URL (like `/users/123`), the overlay closes automatically. The callback
then reloads the list behind the overlay. The user form needs no changes for
this, and it keeps working as a regular screen outside an overlay.


Layers are isolated
-------------------

Links and forms always update fragments within their own layer.
A form in an overlay will re-render inside that overlay, even when the page
behind it contains an element with the same selector. JavaScript functions like
`up.fragment.get()` also match in the current layer only.

Because of this isolation, you can write a screen once and open it as a full
page or in an overlay, without the screen knowing the difference.

A link can still update another layer by targeting it explicitly.
For example, a link inside an overlay can update the root layer:

```html
<a href="/users" up-layer="root">Show all users</a> <!-- mark: up-layer="root" -->
```

See [Targeting other layers](/layer-option) for all ways to address another layer.


Layer modes
-----------

The current page and its overlays form a stack of *layers*.
The initial page is called the *root layer*. An *overlay* is any layer
that is not the root layer. Overlays can be stacked without limit.

The appearance and behavior of an overlay is called its *mode*:

@include overlay-modes-table

When no mode is given, a new overlay opens as a `modal`.
You can choose a different mode by appending it to the `[up-layer]` attribute:

```html
<a href="/menu" up-layer="new drawer">≡ Menu</a> <!-- mark: new drawer -->
```

You can change the default mode in `up.layer.config.mode`.

You can also open overlays from a form submission, from your JavaScript,
or from the server through a response header.
See [Opening overlays](/opening-overlays) for details and examples.


Closing overlays with a result
------------------------------

An overlay can be *accepted* (the user completed their task) or *dismissed*
(the user canceled). When an overlay is accepted, it can pass a result value
back to the parent layer, like the ID of a newly created record.

This pattern lets you re-use existing screens as embedded subtasks,
like creating a missing option from within another form.

See [Closing overlays](/closing-overlays) for ways to close an overlay, and
[Subinteractions](/subinteractions) for working with result values.


Changing an overlay's appearance
--------------------------------

Overlays ship with minimal styling. You can pick a size, assign your own
CSS classes, position drawers and popups, or animate opening and closing:

```html
<a href="/terms" up-layer="new" up-size="large" up-class="legal">Show terms</a>
```

See [Customizing overlays](/customizing-overlays) for details and examples.


@page overlays
@menu-title Overview
