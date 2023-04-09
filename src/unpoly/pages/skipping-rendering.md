Skipping unnecessary rendering
==============================

Your app may skip a render pass if there is nothing to update.


Rendering nothing
-----------------

If the server wants to render nothing they can do one of the following:

- Send a response header [`X-Up-Target: :none`](/X-Up-Target).
- Send a HTTP status [`204 No Content`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204).
- Send a HTTP status [`304 Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304).

No response body is required.


Conditional requests
--------------------

[Conditional requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests) is an [HTTP feature](https://datatracker.ietf.org/doc/html/rfc7232).
It lets a client request content that is newer than a known modification time, or different from a known content hash.

Unpoly uses conditional requests for [reloading](/up.reload), [cache revalidation](/caching#revalidation) and [polling](/up-poll).
By observing HTTP headers, your server can quickly produce an empty response for unchanged content.
This saves CPU time and reduces the bandwidth cost for a
request/response exchange to about 1 KB.

> [IMPORTANT]
> Supporting conditional requests is entirely optional.
> If your backend does not honor conditional request headers, can still use features like [polling](/up-poll) or [cache revalidation](/caching#revalidation).


### Requesting content changed from a known content hash {#etag-condition}

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

When Unpoly [reloads](/up.reload), [revalidates](/caching#revalidation) or [polls](/up-poll) the fragment, it echoes the earlier content hash in an `If-None-Match` header:

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


### Requesting content newer than a known modification time {#time-condition}

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

When Unpoly [reloads](/up.reload), [revalidates](/caching#revalidation) or [polls](/up-poll) the fragment, it echoes the earlier modification time in an `If-Modified-Since` header:

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


### Individual versions per fragment {#fragment-versions}

A large response may contain multiple fragments that are later reloaded individually
and should each have their own ETag or modification time. In this case the server may render each fragment
with its own `[up-etag]` or `[up-time]` attribute:

```html
<div class='messages' up-time='Wed, 21 Oct 2015 07:28:00 GMT'>
  <div class='message' id='message1'>...</div>
  <div class='message' id='message2'>...</div>
</div>

<div class='recent-posts' up-time='Thu, 3 Nov 2022 15:35:02 GMT'>
  <div class='post' id='post1'>...</div>
  <div class='post' id='post2'>...</div>
</div>
```

When a fragment is reloaded Unpoly will use the version from the [closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
`[up-etag]` or `[up-time]` attribute:

```js
up.reload('.messages')     // If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT
up.reload('.recent-posts') // If-Modified-Since: Thu, 3 Nov 2022 15:35:02 GMT
up.reload('#post1')        // If-Modified-Since: Thu, 3 Nov 2022 15:35:02 GMT
```

The server may send additional `ETag` or `Last-Modified` response headers. However this is optional and will only be used for fragments that don't have a close `[up-etag]` or `[up-time]` attribute.


### Removing versions for a fragment

To prevent a fragment from inheriting a version from an ancestor, assign it an `[up-etag=false]` or `[up-time=false]` attribute. 


## Preventing rendering of loaded responses

Even after the server has sent a response, you may still prevent rendering at the last second
by canceling the `up:fragment:loaded` event.  This gives you a chance to inspect the response
or DOM state right before a fragment would be inserted:

  ```js
  up.on('up:fragment:loaded', async function(event) {
    if (event.response.header('X-User-Created')) {
      // If we see an X-User-Created header, abort the rendering pass
      event.preventDefault()

      // Show an alert instead
      alert('The user was created successfully')
    }
  })
  ```

See `up:fragment:loaded` for more examples.


### Global skipping rules

To configure global rules for responses that should not be rendered, you may
also set `up.fragment.config.skipResponse`.

By default Unpoly skips the following responses:

- Responses without text in their body.
  Such responses occur when a [conditional request](#conditional-requests)
  in answered with HTTP status `304 Not Modified` or `204 No Content`.
- When [revalidating](/caching#revalidation), if the expired response and fresh response
  have the exact same text.



## Partially rendering a response

The response may include a full HTML document, but only the [targeted fragment](/targeting-fragments)
will be updated on the page. Other elements from the response will be discarded.

The server may choose to [only render content that is targeted](/optimizing-responses).



### Preserving elements in a targeted fragment

Even when elements are re-rendered from identical HTML, they may lose client-side state.

To preserve individual elements within the targeted fragment, set an `[up-keep]` attribute.
A common use case it to preserve playback state in media elements:

```html
<article>
  <p>Content</p>
  <audio id="player" up-keep src="song.mp3"></audio>
</article>
```

When [targeting](/targeting-fragments) the `<article>` fragment, the `<audio>` element and
its playback state will be the same before and after the update. All other elements (like the `<p>`)
will be updated with new content.


## Preventing a render pass before it starts

You can [prevent or interrupt](/render-hooks#preventing-a-render-pass) a render pass before it requests content
by calling `event.preventDefault()` on an event like `up:link:follow` or `up:form:submit`.


@page skipping-rendering
