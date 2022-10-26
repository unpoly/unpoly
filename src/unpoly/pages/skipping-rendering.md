Skipping rendering
==================

Your server-side app may skip a render pass if there is nothing to update.


Rendering nothing
-----------------

If the server wants to render nothing they can do one of the following:

- Send a header [`X-Up-Target: :none`](/X-Up-Target).
- Send a HTTP status [`204 No Content`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204).
- Send a HTTP status [`304 Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304).

In all of these cases no response body is required.


Conditional requests
--------------------

[Conditional requests]((https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)) is an [old HTTP feature](https://datatracker.ietf.org/doc/html/rfc7232).
It lets browser ask for content newer than a known modification time, or content different from a known content hash.

Unpoly uses conditional requests for [reloading](/up.reload), [cache revalidation](/caching#revalidating) and [polling](/up-poll).
By observing HTTP headers, your server can quickly produce an empty response for unchanged content.

### Protocol

When rendering HTML your server may send [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) and [`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) response headers.

When reloading Unpoly echoes these headers as `If-Modified-Since` or `If-None-Match` request headers.

Your server can match these headers against the underlying data before rendering. When the data hasn't changed, your server can send an empty response with HTTP status `304 Not Modified` or `204 No Content`. 


### Requesting content changed from a known content hash

In this example the browser updates a fragment with a [target](/targeting-fragments) from a URL `/messages`. For this it makes the following HTTP request:

```http
GET /messages HTTP/1.1
X-Up-Target: .messages
```

The server responds with both the content and a hash over the underlying data. The hash can be any string that identifies the rendered objects, revision and representation. Here is an example response:

```http
HTTP/1.1 200 OK
ETag: "x234dff"

<html>
  ...
  <div class='messages'>
    ...
  </div>
  ...  
</html>
```

> [NOTE]
> The double quotes are part of the [ETag's format](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag).

After rendering, Unpoly remembers the `ETag` headers in an `[up-etag]` attribute:

```html
<div class='messages' up-etag='"x234dff"'>
...
</div>
```

When Unpoly [reloads](/up.reload), [revalidates](/caching#revalidating) or [polls](/up-poll) the fragment, it echoes the earlier content hash in an `If-None-Match` header:

```http
GET /messages HTTP/1.1
If-None-Match: "x234dff"
```

The server can compare the ETag from the request with the ETag of the underlying data.
If no more recent data is available, the server can skip rendering and
respond with `304 Not Modified`. No response body is required.

```http
HTTP/1.1 304 Not Modified
```


### Requesting content newer than a known modification time

In this example the browser updates a fragment with a [target](/targeting-fragments) from a URL `/messages`. For this it makes the following HTTP request:

```http
GET /messages HTTP/1.1
X-Up-Target: .messages
```

The server responds with both the content and its last modification time. The modification time can be any update timestamp for the data that was rendered. It should be sent as an `Last-Modified` header:

```http
HTTP/1.1 200 OK
Last-Modified: Wed, 15 Nov 2000 13:11:22 GMT

<html>
  <div class='messages'>...</div>
</html>
```

After rendering, Unpoly remembers the `Last-Modified` header in an `[up-time]` attribute:

```html
<div class='messages' up-time='Wed, 21 Oct 2015 07:28:00 GMT'>
...
</div>
```

When Unpoly [reloads](/up.reload), [revalidates](/caching#revalidating) or [polls](/up-poll) the fragment, it echoes the earlier modification time in an `If-Modified-Since` header:

```http
GET /messages HTTP/1.1
If-Modified-Since: Wed, 15 Nov 2000 13:11:22 GMT
```

The server can compare the time from the request with the time of the last data update.
If no more recent data is available, the server can skip rendering and
respond with `304 Not Modified`. No response body is required.

```http
HTTP/1.1 304 Not Modified
```


### Modification time or content hash?

Servers can use both `Last-Modified` and `ETag`, but `ETag` always takes precedence.

It's easier to mix in additional data into an `ETag`, e.g. the ID of the logged in user or the currently deployed commit hash.


### Setting versions per-fragment

TODO: Rewrite

To achieve this, assign `[up-time]` or `[up-etag]` attributes to the fragment you're
reloading. Unpoly will automatically send these values as `If-Modified-Since` or
`If-None-Match` headers when reloading.

If the server has no more recent changes, it may skip the update by responding
with an HTTP status `304 Not Modified`.



@page skipping-rendering
