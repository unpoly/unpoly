Open overlays
=============

Any link can open its destination in an overlay, like a modal dialog.
The linked screen needs no changes for this: it stays a regular page
on your server.


Opening a modal
---------------

Add an `[up-layer=new]` attribute to a link:

```html
<a href="/users/new" up-layer="new">Add user</a> <!-- mark: up-layer="new" -->
```

When clicked, Unpoly fetches `/users/new`, extracts the response's
[main element](/main) and shows it in a modal overlay. The page behind
the overlay keeps its state, including unsaved form fields and scroll positions.

The user can dismiss the overlay by pressing `Escape`, by clicking outside
the dialog, or with its close button.


One screen, two contexts
------------------------

`/users/new` remains a working route. When the user opens it directly,
or in a new tab, it renders as a full page. The same screen works embedded
in an overlay and standing on its own, without knowing the difference.

Overlays can do a lot more: they can close automatically when the user
completes their task, pass a result value to the page behind them, or
open as drawers and popups.

<p class="read-more"><a href="/overlays">Read more: Overlays</a></p>


@page start/overlays
@signature
