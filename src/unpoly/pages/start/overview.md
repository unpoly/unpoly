How Unpoly works
================

Unpoly lets your links and forms update fragments of the current page,
instead of loading full new documents. Screens update without a full page load and keep their state.
Your app stays on the server, rendering HTML with any language and any framework.


Updating fragments
------------------

Here is a link enhanced with an Unpoly attribute:

```html
<a href="/messages" up-target=".messages">Messages</a> <!-- mark: up-target=".messages" -->
```

When the user clicks, Unpoly fetches `/messages` in the background.
Your server handles the request like any other, and responds with a full HTML page.
Unpoly extracts the `.messages` fragment from the response and swaps it into the current page.

The rest of the page is left untouched: scroll positions, focus, unsaved form fields
and running scripts all survive the update.

<div embed="fragment-updates-diagram"></div>

Because the server renders full pages, each screen remains a page of its own.
When the user opens the link in a new tab, or when JavaScript is unavailable,
the browser makes a regular full page load.


The server stays in charge
--------------------------

To your backend, requests from Unpoly look like any browser request.
There is no JSON API to build and no client-side templates to maintain.
You keep rendering HTML on the server, with the routes and templates you already have.

You also don't need separate fragment endpoints: Unpoly takes the fragment it needs
and discards the rest of the response. A server [can choose](/optimizing-responses)
to render only the requested fragment, but that is an optional optimization.
Most screens never need it.


Strong defaults
---------------

When a link or form updates the main content of the page, Unpoly treats the interaction
as a [navigation](/navigation) and mimics what a full page load would have done:

- The browser URL and history are updated, so the Back button keeps working.
- The page scrolls to the top, as after a full page load.
- Focus moves to the new fragment, so keyboard and screen reader users don't get lost.
- Responses to links are [cached](/caching) and revalidated, so revisits render instantly.

Each of these defaults can be changed, per element or globally.


Your first thirty minutes
-------------------------

The rest of this chapter is hands-on. After [installing Unpoly](/install),
you will make one basic move in each area:

- [[start/links]]: Enhance a link to update a fragment.
- [[start/forms]]: Submit a form in place and show validation errors.
- [[start/overlays]]: Open an existing screen in a modal overlay.
- [[start/elements]]: Pair your own JavaScript with HTML elements.

You will then learn [the shape of the API](/start/api): one pattern that all
of Unpoly's features follow. Every move works on its own, so you can stop
at any point and already have a better app.


@page start/overview
@signature
