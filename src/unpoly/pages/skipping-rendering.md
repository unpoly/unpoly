Skipping unnecessary rendering
==============================

Your app may skip a render pass if there is nothing to update.


## Rendering nothing

If the server wants to render nothing they can do one of the following:

- Send a response header [`X-Up-Target: :none`](/X-Up-Target).
- Send a HTTP status [`204 No Content`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204).
- Send a HTTP status [`304 Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304).

No response body is required.


## Skipping rendering of unchanged content

Unpoly sends [conditional request](/conditional-requests) headers for [reloading](/up.reload),
[cache revalidation](/caching#revalidation) and [polling](/up-poll).
By observing these headers, your server can quickly produce an empty response for unchanged content.

See [Conditional requests](/conditional-requests) for details and examples.


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
  Such responses occur when a [conditional request](/conditional-requests)
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
