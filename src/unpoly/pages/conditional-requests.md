Conditional requests
====================

When Unpoly reloads a fragment that has not changed, your server can answer with an empty `304 Not Modified`.
The exchange then costs about 1 KB and no rendering time.
This works for every reload, whether from [polling](/polling), [cache revalidation](/caching#revalidation) or `up.reload()`,
and uses standard HTTP *conditional requests*.

Supporting conditional requests is optional. Reloading, polling and revalidation also work
with a server that always renders the full response.


How a reload becomes conditional {#how-it-works}
--------------------------------

The first response for a fragment carries a version of its content, as an `ETag` or `Last-Modified` header.
Unpoly remembers that version on the rendered fragment.
When it later reloads the fragment, it sends the version back in an `If-None-Match` or `If-Modified-Since` request header.
The server compares it with the current version of its data. When nothing changed, it responds with
`304 Not Modified` and an empty body, and Unpoly finishes the render pass without changes.

> [tip]
> Many web servers add a default `ETag` by hashing the response body.
> With such a server, identical HTML already results in a short `304 Not Modified` response,
> without any changes to your application code.
> This only works when your pages render identical HTML for unchanged data. Rails, for example, renders a
> differently masked CSRF token into every response, so the body hash never matches.


Using a content hash {#etag-condition}
--------------------

An `ETag` is a string that identifies the rendered content, e.g. a hash of the underlying records
and their last update. The server sends it with the first response:

```http
HTTP/1.1 200 OK
ETag: "x234dff"

<html>
  ...
  <div class="messages">
    ...
  </div>
  ...
</html>
```

> [note]
> The double quotes are part of the [ETag's format](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag).

After rendering, Unpoly remembers the `ETag` header in an `[up-etag]` attribute on the fragment:

```html
<div class="messages" up-etag='"x234dff"'> <!-- mark: up-etag='"x234dff"' -->
  ...
</div>
```

When the fragment is reloaded, Unpoly echoes the ETag in an `If-None-Match` request header:

```http
GET /messages HTTP/1.1
If-None-Match: "x234dff"
```

The server compares the ETag from the request with the ETag of its current data.
When they match, it skips rendering and responds with an empty `304 Not Modified`:

```http
HTTP/1.1 304 Not Modified
```

When the data has changed, the server renders the new content with a new `ETag`, as for any other request.


Using a modification time {#time-condition}
-------------------------

Instead of a hash, the server can send the time when the rendered data was last changed,
as a `Last-Modified` header:

```http
HTTP/1.1 200 OK
Last-Modified: Wed, 15 Nov 2000 13:11:22 GMT

<html>
  <div class="messages">...</div>
</html>
```

After rendering, Unpoly remembers the time in an `[up-time]` attribute on the fragment:

```html
<div class="messages" up-time="Wed, 15 Nov 2000 13:11:22 GMT"> <!-- mark: up-time -->
  ...
</div>
```

When the fragment is reloaded, Unpoly echoes the time in an `If-Modified-Since` request header:

```http
GET /messages HTTP/1.1
If-Modified-Since: Wed, 15 Nov 2000 13:11:22 GMT
```

When no newer data exists, the server responds with an empty `304 Not Modified`.


Modification time or content hash? {#etag-or-time}
----------------------------------

A server can send both `Last-Modified` and `ETag`. Unpoly then sends both conditional headers,
and the server should give `If-None-Match` precedence.

An `ETag` is the more flexible choice. It is easy to mix additional data into the hash,
like the ID of the signed-in user or the hash of the deployed commit,
so that a change in either produces new content.


Individual versions per fragment {#fragment-versions}
--------------------------------

A large response may contain several fragments that are later reloaded individually.
Instead of one version for the whole response, the server can render each fragment
with its own `[up-etag]` or `[up-time]` attribute:

```html
<div class="messages" up-time="Wed, 21 Oct 2015 07:28:00 GMT">
  <div class="message" id="message1">...</div>
  <div class="message" id="message2">...</div>
</div>

<div class="recent-posts" up-time="Thu, 3 Nov 2022 15:35:02 GMT">
  <div class="post" id="post1">...</div>
  <div class="post" id="post2">...</div>
</div>
```

When a fragment is reloaded, Unpoly uses the version from the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
`[up-etag]` or `[up-time]` attribute, so a nested element inherits the version of its container:

```js
up.reload('.messages')     // If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
up.reload('.recent-posts') // If-Modified-Since: Thu, 3 Nov 2022 15:35:02 GMT
up.reload('#post1')        // If-Modified-Since: Thu, 3 Nov 2022 15:35:02 GMT
```

The server may still send `ETag` or `Last-Modified` response headers.
They are only used for fragments without a closer `[up-etag]` or `[up-time]` attribute.


### Removing versions for a fragment {#removing-versions}

To prevent a fragment from inheriting a version from an ancestor,
set an `[up-etag=false]` or `[up-time=false]` attribute. The fragment is then reloaded without conditional headers.


Rendering nothing {#rendering-nothing}
-----------------

A `304 Not Modified` is one of three responses that finish a render pass without changes.
The server can send any of them, with an empty body:

- A response header [`X-Up-Target: :none`](/X-Up-Target)
- An HTTP status [`204 No Content`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204)
- An HTTP status [`304 Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304)

A `304` counts as a successful response, not as a [failed response](/failed-responses), even though its status is not `2xx`.

When nothing is rendered, no `up:fragment:loaded` event is emitted and no `{ onRendered }` callback is called.
The `up.render()` promise still fulfills, with an [empty](/up.RenderResult.prototype.none) `up.RenderResult`.
Loading state is reverted and `{ onFinished }` callbacks run as usual.

To skip a response on the client after it was loaded, see [[render-lifecycle#skipping-responses]].


Resources
---------

- [MDN: Conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)
- [RFC 7232: Conditional requests](https://datatracker.ietf.org/doc/html/rfc7232)


@page conditional-requests
