Network & caching
=================

All of Unpoly's requests go through one HTTP client. It caches responses so revisited pages
render instantly, revalidates cached content so stale data is quickly replaced,
aborts requests that would race each other, and handles disconnects without the browser's error screen.
This works without setup, and every part can be changed for a single link, a form or your whole app.


Requests in the background
--------------------------

When the user follows a link or submits a form, Unpoly requests the URL in the background:

```html
<a href="/preferences" up-target=".content">Preferences</a> <!-- mark: up-target=".content" -->
```

The request is a plain HTTP request. It carries extra headers that tell the server
what Unpoly intends to do with the response, like the targeted selector:

```http
GET /preferences HTTP/1.1
X-Up-Target: .content
```

The server renders a full HTML page, as it would for any browser request. Unpoly extracts
the `.content` fragment from the response and swaps it into the page. A server may use
the headers to [omit content that is not targeted](/optimizing-responses), but it never has to.

Requests from links, forms, [polling](/polling) and [preloading](/preloading) all pass
through the same client. They share one cache, one queue that limits concurrent requests,
and one set of [events](/up.network).


Instant revisits from the cache
-------------------------------

When [navigating](/navigation-defaults), responses to `GET` requests are cached. When the user returns
to a page they already saw this session, the fragment renders from the cache,
without waiting for the network:

```html
<a href="/stories/5" up-follow>Read story</a> <!-- mark: up-follow -->
```

Following this link the first time fills the cache. Following it again renders instantly.

A cache entry is only considered fresh for 15 seconds. When Unpoly renders older content,
it reloads the fragment from the server right after. This is called *revalidation*:
the user sees the cached version immediately and the fresh version a moment later.
When a form is submitted with a method like `POST`, the entire cache is expired,
since the submission has probably changed data on the server.

<p class="read-more"><a href="/caching">Read more: Caching</a></p>


Aborting conflicting requests
-----------------------------

When a request is sent for a fragment that is still waiting for an earlier request,
the earlier request is aborted:

```html
<a href="/pages/a" up-target="article">A</a>
<a href="/pages/b" up-target="article">B</a>
```

When the user clicks *A* and then *B* before *A* has loaded, the request for *A* is aborted.
Only the response to *B* is rendered, regardless of which response arrives first.
Requests targeting other fragments are not affected.

Links and forms can change this rule with an `[up-abort]` attribute.
For example, `[up-abort="layer"]` aborts every request on the current layer.

<p class="read-more"><a href="/aborting-requests">Read more: Aborting requests</a></p>


Handling disconnects
--------------------

When the device is offline, clicking a regular link replaces your app with the browser's error page.
Clicking an Unpoly link leaves the page as it is. Instead an `up:fragment:offline` event is emitted,
which you can use to retry or to show a message:

```js
up.on('up:fragment:offline', function(event) {
  if (confirm('You are offline. Retry?')) event.retry() // mark: event.retry()
})
```

Requests that time out are handled the same way. Pages already in the cache remain accessible while offline.

A server that is slow to respond is not a network issue. Unpoly shows a [progress bar](/progress-bar)
after 400 ms, and can show [loading state](/loading-state) in the targeted fragment while the user waits.

<p class="read-more"><a href="/network-issues">Read more: Handling network issues</a></p>


Making requests from JavaScript
-------------------------------

To use the HTTP client from your own code, call `up.request()`. It returns an `up.Request` object,
which is also a promise for an `up.Response`:

```js
let response = await up.request('/search', { params: { query: 'sunshine' } })
console.log(response.text)
```

These requests share the cache, the request queue and the events of requests made by links and forms.
Pass `{ cache: true }` to read from and write to the cache. The promise rejects with the `up.Response`
when the server responds with an error code, and with an `Error` when the request is aborted,
times out or the device is offline.

Every request emits events throughout its lifecycle. For example, listeners to `up:request:load`
can change a request before it is sent:

```js
up.on('up:request:load', function(event) {
  event.request.headers['X-Client-Time'] = Date.now().toString() // mark: event.request.headers
})
```


@page network
@menu-title Overview
@signature
