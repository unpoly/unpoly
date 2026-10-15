Live fragments
==============

Live fragments are elements that update without being targeted by a link or form.
They load lazily, poll, react to server events, or piggy-back on other responses.
Your server renders their content like any other page.


Reloading a fragment
--------------------

Most features in this topic build on the same move: request a URL, pick an element
from the response, swap it into the page. You can make that move yourself with `up.reload()`:

```js
up.reload('.unread-count')
```

Unpoly remembers the URL each fragment was loaded from, in an `[up-source]` attribute
set when the fragment was inserted. Reloading requests that URL again, finds the `.unread-count`
element in the response and replaces the one on the page. Everything around it stays as it is.

The server renders the same HTML it would for a regular request.
To render only the fragment Unpoly needs, see [[optimizing-responses]].


Loading content later
---------------------

Some parts of a page are expensive to render, but not needed right away.
Move such a part to its own URL and leave a deferred element with an `[up-defer]` attribute:

```html
<div id="menu" up-defer up-href="/menu"> <!-- mark: up-defer -->
  Loading...
</div>
```

The page renders without the menu. As soon as the deferred element is inserted, Unpoly
fetches `/menu` and swaps the `#menu` element from the response into the page.

To load only when the deferred element is scrolled into view, set `[up-defer="reveal"]`:

```html
<div id="comments" up-defer="reveal" up-href="/posts/5/comments"> <!-- mark: up-defer="reveal" -->
  Loading...
</div>
```

[[more: lazy-loading]]


Infinite scrolling
------------------

A long list can load its next page when the user scrolls to its end.
The "load more" link at the bottom is a deferred element that loads when revealed:

```html
<div id="pages">
  <div class="page">items for page 1</div>
</div>

<a id="next-page" href="/items?page=2" up-defer="reveal" up-target="#next-page, #pages:after"> <!-- mark: #pages:after -->
  Load next page
</a>
```

The `:after` suffix appends the next page to the list, instead of replacing it.
The link swaps itself with a link to the page after that.
Without JavaScript, it is a regular link to page 2.

[[more: infinite-scrolling]]


Polling for changes
-------------------

To pick up changes made by other users or background jobs, let a fragment reload itself periodically
with an `[up-poll]` attribute:

```html
<div class="unread-count" up-poll> <!-- mark: up-poll -->
  2 new messages
</div>
```

The element is reloaded every 30 seconds. Polling pauses while the browser tab is hidden
or the fragment's layer is covered by an overlay, and resumes when the user comes back.
The interval, source URL and many other details can be configured.

[[more: polling]]


Real-time updates
-----------------

When a few seconds of delay are too much, your server can tell the page when something changed.
Put an element like `<div data-stream="/updates">` in your layout.
A [compiler](/up.compiler) of a few lines connects it to [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
and reloads the fragment the server names:

```js
up.compiler('[data-stream]', function(element, { stream: url }) {
  let source = new EventSource(url)
  source.addEventListener('message', function(event) {
    let fragment = up.fragment.get(event.data, { layer: element })
    if (fragment) up.reload(fragment) // mark: up.reload(fragment)
  })
  return () => source.close()
})
```

The message only names a fragment. The new content comes from a regular request, so the server renders it
with the same code as before. This needs an open connection to your server, so polling is simpler when a delay is acceptable.

[[more: real-time-updates]]


Updating elements outside the target
------------------------------------

Some elements live in the application layout, outside of the fragment a link usually
targets, like an unread counter or a warning about an expired credit card.
Mark such an element as `[up-hungry]`:

```html
<div class="unread-count" up-hungry> <!-- mark: up-hungry -->
  2 new messages
</div>
```

Whenever any response contains an `.unread-count` element, the hungry element
is updated along with the targeted fragment. When a response doesn't contain
the element, nothing happens. You no longer need to name the counter in every link's
`[up-target]`.

To show confirmations or errors from any response, use a ready-made hungry element for [notification flashes](/flashes).

[[more: hungry-elements]]

@page live-fragments
@menu-title Overview
@signature
