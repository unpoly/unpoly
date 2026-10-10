History
=======

Unpoly keeps the browser history working while it updates fragments.
When a link or form changes the page's main content, the address bar and window title
change as they would for a full page load, and the Back button brings the earlier page back.
Your scripts can observe every location change, for example to track page views.


Updating the address bar
------------------------

An update counts as a page change when it swaps the page's [main element](/main).
Only then does Unpoly push a history entry, so users can bookmark, share and reload
each URL as usual.

Smaller updates leave history alone. Paginating comments doesn't add a history entry,
so the Back button skips straight to the previous page:

```html
<a href="/comments?page=2" up-target="#comments">Next page</a> <!-- mark: up-target="#comments" -->
```

To override this default for a link or form, set `[up-history=true]` or `[up-history=false]`.

Overlays add one rule of their own: an overlay only shows its URL when it opens with a main element,
and the parent page's URL returns when the overlay closes. This is covered in [[history-in-overlays]].

<p class="read-more"><a href="/updating-history">Read more: Updating history</a></p>


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
To offer a *Back* link inside the page, use an [`[up-back]`](/restoring-history#back-link) attribute.

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

One listener covers every way the location can change: followed links,
redirecting forms and the Back button.

<p class="read-more"><a href="/tracking-page-views">Read more: Tracking page views</a></p>


@page history
@menu-title Overview
@signature
