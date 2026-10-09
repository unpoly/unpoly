Following links
===============

Any link can update a fragment of the current page, instead of loading a full new document.
When Unpoly handles a link's click this way, we say the link is *followed*.


Following a link
----------------

To have Unpoly handle a link, set an `[up-follow]` attribute:

```html
<a href="/posts/5" up-follow>Read post</a> <!-- mark: up-follow -->
```

When the user clicks, Unpoly requests `/posts/5` in the background.
The server responds with a full HTML page, the same way it would for any browser request.
Unpoly extracts the response's [main element](/main) and replaces the main element
on the current page. The rest of the page stays untouched: scroll positions, focus
and unsaved form fields all survive.

The link remains a standard hyperlink. When the user opens it in a new tab,
or when JavaScript is unavailable, the browser loads the destination as a full page.

> [tip]
> Instead of annotating individual links, you can also configure Unpoly
> to [follow all links on the page](/handling-all-links).


Updating a specific fragment {#targeting}
----------------------------

To update an element other than the main element, set an [`[up-target]`](/up-follow#up-target)
attribute with a CSS selector:

```html
<a href="/posts/5" up-target=".content">Read post</a> <!-- mark: up-target=".content" -->

<div class="content">
  Old content
</div>
```

Unpoly finds the `.content` element in the server response and swaps it into the current page.

An `[up-target]` attribute already implies `[up-follow]`, so you don't need to set both.
The same goes for other rendering attributes like `[up-layer]` or `[up-transition]`.

A target can also address multiple fragments, append to an existing element,
or resolve relative to the clicked link. See [[targeting-fragments]] for everything
a target selector can express.


Navigation defaults
-------------------

Following a link is considered [navigation](/navigation-defaults) by default.
When a link updates the layer's main element, Unpoly behaves like a full page load would:
the browser URL and history are updated, and the new content is scrolled into view.
Focus moves to the new fragment.

See [[navigation-defaults]] for all navigation defaults and how to customize them.


Acting on press {#instant}
---------------

A standard link activates on `click`, when the mouse button is released.
Set an `[up-instant]` attribute to act on `mousedown` instead:

```html
<a href="/users" up-follow up-instant>User list</a> <!-- mark: up-instant -->
```

This saves the time the user takes to release the mouse button.
Because the request is sent that much earlier, the interaction feels faster.

Users can still activate an instant link with the keyboard.
They can no longer cancel a click by dragging the pressed mouse away from the link,
so reserve `[up-instant]` for navigation, where a stray click has no severe effect.
See `[up-instant]` for details.


Links that are never followed {#unfollowable}
-----------------------------

Some links are always handled by the browser, even when they match an `[up-follow]` selector:

@include no-follow-reasons

Clicking such a link falls back to default browser behavior.


Following links from JavaScript {#scripting}
-------------------------------

To follow a link element programmatically, pass it to `up.follow()`:

```js
let link = document.querySelector('a.featured')
up.follow(link)
```

The link's `[up-...]` attributes are honored, as if the user had clicked the link.
You can pass additional [render options](/up.render#parameters) to supplement
or override the link's attributes:

```js
up.follow(link, { target: '.sidebar' })
```

To update fragments without a link element, use `up.render()`.


@page following-links
@signature
