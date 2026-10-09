History
=======

Unpoly keeps the browser history working while it updates fragments.
When a link or form changes the page's main content, the address bar and window title
change as they would for a full page load, and the Back button brings the earlier page back.
Your scripts can observe every location change, for example to track page views.


Updating the address bar
------------------------

Follow a link with `[up-follow]`:

```html
<a href="/posts/5" up-follow>Read post</a> <!-- mark: up-follow -->
```

Clicking it swaps the page's [main element](/main) with the one from `/posts/5`.
Because a main element was updated, Unpoly also pushes a history entry:
the address bar shows `/posts/5`, the window title changes to the response's `<title>`,
and meta tags like `meta[name=description]` are updated in the `<head>`.

A link that targets a smaller fragment leaves history alone:

```html
<a href="/comments?page=2" up-target="#comments">Next page</a> <!-- mark: up-target="#comments" -->
```

Only the `#comments` element is replaced. The URL keeps its value,
so the user does not collect a history entry for every minor update.
To override this default for a link or form, set `[up-history=true]` or `[up-history=false]`.

Overlays add one rule of their own: an overlay only shows its URL while its content is a main element,
and the parent page's URL returns when the overlay closes. This is covered in [[history-in-overlays]].

<p class="read-more"><a href="/updating-history">Read more: Updating history</a></p>


History is a navigation default
-------------------------------

Updating history is one of the [navigation defaults](/navigation) that links and forms get out of the box.
The low-level `up.render()` function only changes history when you pass a `{ history }` option.

Only a `GET` response can change history, since only `GET` URLs can be reloaded.
A form that submits with `POST` changes history once the server redirects to the next page.


Restoring the previous page
---------------------------

When the user presses the Back button, Unpoly fetches the earlier URL and renders its `<body>` into the current page.
Scroll positions and focus are restored to where the user left them.
Since responses are [cached](/caching), going back is usually instant.

To keep parts of your layout alive, restore a smaller fragment:

```js
up.history.config.restoreTargets = ['.content', 'body'] // mark: ['.content', 'body']
```

To customize the render pass, or to restore the page with your own code,
listen to `up:location:restore`.

<p class="read-more"><a href="/restoring-history">Read more: Restoring history</a></p>


Tracking page views
-------------------

Analytics tools count a page view on every page load.
With Unpoly the page loads once, so track a view whenever the location changes:

```js
up.on('up:location:changed', function(event) {
  trackPageView(event.location) // mark-line
})
```

The event is emitted after every change of the address bar, whether from a followed link,
a redirecting form submission or the Back button.

<p class="read-more"><a href="/tracking-page-views">Read more: Tracking page views</a></p>


@page history
@menu-title Overview
@signature
