Restoring history
=================

When the user presses the browser's Back or Forward button, Unpoly restores the earlier page in place:
it fetches the restored URL, renders it into the `<body>` and brings back the scroll positions and focus the user left behind.
You can restore a different fragment, or handle restoration with your own code.


What happens when the user goes back {#default-behavior}
------------------------------------

The browser changes the address bar on its own. Unpoly then restores the content for the restored URL:

1. The restored URL is requested with `GET`. A [cached](/caching) response is used when available.
2. Any open [overlays](/history-in-overlays#restoration) are closed. The restored page is rendered in the root layer.
3. The response's `<body>` replaces the current `<body>`.
4. Scroll positions are restored to where they were when the user left the page.
5. Focus and text selection are restored to the element the user was in.
6. If the cached content has [expired](/caching#revalidation), it is revalidated with the server.

Unpoly renders whatever the server responds, even an error page.
The browser has already changed the URL, so the page must follow.

When only the `#hash` changed between two history entries, nothing is rendered.
Unpoly scrolls to the element matching the hash, honoring any [obstructing layout elements](/scroll-tuning#fixed-layout-elements-obstructing-the-viewport).


Restoring a different fragment {#restore-targets}
------------------------------

By default Unpoly replaces the entire `<body>`, in case the earlier page used a different layout.
If your layout never changes, you can restore a smaller fragment and keep elements like
a navigation bar or a sidebar alive. Configure `up.history.config.restoreTargets` with a list of selectors:

```js
up.history.config.restoreTargets = ['.content', 'body'] // mark: ['.content', 'body']
```

Unpoly updates the first selector that matches both the current page and the server response.
Here `.content` is restored when both documents have one, and the `<body>` otherwise.


Customizing the restoration {#custom-behavior}
---------------------------

Before Unpoly renders the restored content, it emits an `up:location:restore` event.
Listeners can inspect and change the [render options](/up.render#parameters) in `event.renderOptions`:

```js
up.on('up:location:restore', function(event) {
  // Update a different fragment when restoring /special-path
  if (event.location === '/special-path') {
    event.renderOptions.target = '#other' // mark-line
  }
})
```

You can also replace Unpoly's render pass with your own restoration code by preventing the event.
Unpoly then changes no element on the page:

```js
up.on('up:location:restore', function(event) {
  // Stop Unpoly from rendering anything
  event.preventDefault() // mark-line

  // We will render ourselves
  document.body.innerText = `Restored content for ${event.location}!`
})
```

When `up:location:restore` is emitted, the [browser location](/up.history.location)
has already been updated. Neither preventing the event nor changing render options can undo that.

> [important]
> Custom restoration code should not push new history entries.


Which entries Unpoly restores {#handled-entries}
-----------------------------

Unpoly restores history entries that it *owns*:

- The entry of the initial page load.
- Entries placed by Unpoly while [updating history](/updating-history), or through `up.history.push()` and `up.history.replace()`.
- Entries for a changed `#hash` on a location that Unpoly owns, whether from a link or typed into the address bar.

An entry that another script pushed with `history.pushState()` is left alone.
Unpoly assumes that script will restore its own state.

To take over or hand off an entry, listen to `up:location:changed` and set `event.willHandle`:

```js
up.on('up:location:changed', function(event) {
  // Let Unpoly restore entries pushed by a third-party script
  if (event.location.startsWith('/gallery/')) {
    event.willHandle = true // mark-line
  }
})
```

Setting `event.willHandle = false` stops Unpoly from restoring an entry it owns.
Your listener can then restore the page with its own code.

> [note]
> If the initial page was loaded with a `POST` request, reloading its URL with `GET` would render something else.
> Your server can tell Unpoly with an `_up_method` cookie, so Unpoly does not claim that entry.


Linking to the previous page {#back-link}
----------------------------

To offer a *Back* link inside the page, set an `[up-back]` attribute:

```html
<a href="/posts" up-back>Back</a> <!-- mark: up-back -->
```

When Unpoly knows the previous URL, clicking the link [navigates](/navigation-defaults) there
and restores the earlier scroll position. When no previous URL is known, for example right after the initial page load,
the link follows its `[href]` as usual.

Unlike the browser's Back button, an `[up-back]` link does not call `history.back()`.
It follows the previous URL like any other link, moving forward in history.

The previous URL is also available as `up.history.previousLocation`.


@page restoring-history
