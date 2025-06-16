Handling network issues
=======================

Unpoly lets you handle many types of connection problems.
The objective is to keep your application accessible as the user's connection becomes [flaky](#flaky-connections) or [goes away entirely](#disconnects).


Disconnects
-----------

In a vanilla HTML document, clicking a link while offline will replace your app with a standard error screen, no questions asked:

![Browser error when offline](images/browser-offline.png){:width='500'}

Interacting with an Unpoly-enhanced [link](/up-follow) or [form](/up-submit) while offline will *not* change the page. Instead Unpoly lets you define your own disconnect handling. E.g. you may choose to display an error, or to offer a button that retries the failed request.

To handle connection loss, pass an `{ onOffline }` option or set an `[up-on-offline]` attribute. When the device gets disconnected before or during a request, the callback is called with an `up:fragment:offline` argument:

```html
<a href="/path" up-follow up-on-offline="if (confirm('You are offline. Retry?')) event.retry()">
  Post bid
</a>
```

You may also configure a global handler that listens to `up:fragment:offline`:

```js
up.on('up:fragment:offline', function(event) {
  if (confirm('You are offline. Retry?')) event.retry()
})
```

You may also do something other than retrying, like substituting content:

```js
up.on('up:fragment:offline', function(event) {
  up.render(event.renderOptions.target, { content: "You are offline." })
})
```


### Expired pages remain accessible while offline {#offline-cache}

Even without a connection, [cached content](/caching) will remain navigatable for [90 minutes](/up.network.config#config.cacheEvictAge). This means that an offline user can instantly access pages that they already visited this session.

While offline, [cache revalidation](/caching#revalidation) of expired content will fail.

When revalidation fails, or when accessing uncached content, Unpoly will run `onOffline()` callbacks and emit `up:fragment:offline`. The page will not be changed unless your code says so.


### Preloading links before disconnects

You can use an [`[up-preload=insert]`](/up-preload#up-preload) attribute
to eagerly preload links as soon as they remain in the DOM. This way they remain navigatible while offline:

```html
<a href="/menu" up-layer="new drawer" up-preload="insert">≡ Menu</a>
```


### Limitations to offline support

While Unpoly lets you handle disconnects, some parts are missing for full "offline" support:

- To fill up the cache the device must be online for the first part of the session (warm start)
- The cache is still in-memory and dies with the browser tab

For a comprehensive offline experience (cold start) we recommend a [service worker](https://web.dev/offline-fallback-page/) or a canned solution like [UpUp](https://www.talater.com/upup/) (no relation to Unpoly).


Flaky connections
-----------------

Often our device reports a connection, but we're *effectively offline*:

- Smartphone in EDGE cell
- Car drives into a tunnel
- Overcrowded Wi-fi with massive packet loss

Unpoly handles flaky connections with *timeouts*. Timeouts will also run `onOffline()` callbacks and emit `up:fragment:offline`. This means that your existing disconnect handling (see behavior) can also be used to handle flaky connections.

All requests have a [default timeout of 90 seconds](/up.network.config#config.timeout).
You may use different timeouts for individual requests by passing an [`{ timeout }`](/up.render#options.timeout) option
or by setting an [`[up-timeout]`](/up-follow#up-timeout) attribute.



Slow server responses
---------------------

Even with a great network connection, your server make take long to render expensive pages.

When requests are taking [too long to respond](/up.network.config#config.lateDelay),
an animated [progress bar](/progress-bar) is shown.

You may also [change fragments while they are loading](/loading-state).


HTTP error codes
----------------

When the server responds with an error code (like `505 Server Error`), no `up:fragment:offline` event is emitted.
Instead you can tell Unpoly to [render such responses differently](/failed-responses#fail-options) from a successful response.

By default, [navigation](/navigation) (like clicking a link or submitting a form) will render an error response's
[main element](/main) in order to convey an error message from the server.

See [Handling failed responses](/failed-responses) for details.



@page network-issues
