Live fragments
==============

Unpoly can load and refresh fragments without the user clicking anything,
like a menu that loads after the page has rendered, or a counter that reloads itself every 30 seconds.
Each update is a regular HTTP request for a fragment, the same kind a link makes.
There is no persistent connection and nothing new to run on the server.


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
It may respond with a full page or with only the targeted fragment, as the
[`X-Up-Target`](/optimizing-responses) header tells it what Unpoly is going to use.


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

<p class="read-more"><a href="/lazy-loading">Read more: Lazy loading content</a></p>


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

<p class="read-more"><a href="/polling">Read more: Polling</a></p>


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

<p class="read-more"><a href="/hungry-elements">Read more: Hungry elements</a></p>


Also in this topic
------------------

To load the next page of a long list when the user scrolls to its end, see [[infinite-scrolling]].

@page live-fragments
@menu-title Overview
@signature
