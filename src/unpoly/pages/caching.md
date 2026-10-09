Caching
=======

Unpoly caches responses so that pages the user has already visited this session render instantly on their next visit.
Cached content is [revalidated with the server](#revalidation) after rendering, so stale content is quickly replaced.
Cached pages also [remain accessible](/network-issues#offline-cache) after a [disconnect](/network-issues#disconnects).


Enabling caching {#enabling}
----------------

Caching is controlled by the [`{ cache }`](/up.render#options.cache) render option or an `[up-cache]` attribute.
When [navigating](/navigation-defaults), the `{ cache: 'auto' }` option is already set by [default](/up.fragment.config#config.navigateOptions).
It caches all responses to `GET` requests, so following a link or submitting a `GET` form fills the cache without any setup.

A render pass that does not navigate, like a plain `up.render()` call, only caches when you ask for it:

```js
up.render({ target: '.content', url: '/stories/5', cache: 'auto' }) // mark: cache: 'auto'
```

Which requests `'auto'` caches is decided by `up.network.config.autoCache`.
By default it caches requests with a [safe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) HTTP method like `GET`.
You can configure this default:

```js
up.network.config.autoCache = function(request) {
  return request.method === 'GET'
}
```

To force caching regardless of HTTP method, pass `{ cache: true }` or set `[up-cache="true"]`.

[Preloading](/preloading) a link also writes its response to the cache.


Revalidation
------------

Cache entries are only considered *fresh* for [15 seconds](/up.network.config#config.cacheExpireAge).
When Unpoly renders older content from the cache, it reloads the fragment from the server right after.
This process is called *cache revalidation*.

When re-visiting pages, Unpoly often renders twice:

1. An initial render pass from the cache, which may be expired
2. A second render pass from the server, which is always fresh

The user sees the cached version instantly and the fresh version a moment later. This has some benefits:

- The user always ends up with fresh content. If another user has added an item to a cached list, the user sees that new item after revalidation.
- Cache entries can be kept for a long time, allowing instant navigation for 90 minutes, even when offline or on a flaky connection.
- Nothing needs to clear the cache after a form submission. Cache entries are only marked as expired.

> [note]
> Revalidation only happens after expired content was rendered into the page.
> No revalidation occurs when expired cache entries are accessed without rendering, e.g. when [preloading](/preloading) a cached URL.


### When nothing changed

Your server-side app is not required to re-render a page when the cached content is still current.

By supporting [conditional requests](/conditional-requests), it can answer a revalidation request with an empty
`304 Not Modified` response. Unpoly then keeps the fragment it has already rendered.


### Controlling revalidation {#controlling-revalidation}

Revalidation is controlled by the [`{ revalidate }`](/up.render#options.revalidate) render option or an `[up-revalidate]` attribute.
When [navigating](/navigation-defaults), `{ revalidate: 'auto' }` is the default. It revalidates only [expired](#expiration) cache entries.
You can configure both the expiry age and the rule:

```js
up.network.config.cacheExpireAge = 20_000 // expire after 20 seconds
up.fragment.config.autoRevalidate = (response) => response.expired
```

To revalidate regardless of a cache entry's age, pass `{ revalidate: true }`.

When not navigating, pass `{ revalidate: 'auto' }` or set an `[up-revalidate="auto"]` attribute to revalidate expired entries.


### Disabling revalidation {#disabling-revalidation}

[Navigation](/navigation-defaults) is the only moment when Unpoly revalidates by default.
To disable revalidation while navigating:

```js
up.fragment.config.navigateOptions.revalidate = false
```

To keep the navigation default, but exempt some responses, configure `up.fragment.config.autoRevalidate`:

```js
up.fragment.config.autoRevalidate = (response) => response.expired && response.url != '/dashboard'
```

To keep the default, but disable revalidation for an individual link, set an `[up-revalidate="false"]` attribute:

```html
<a href="/" up-revalidate="false">Start page</a> <!-- mark: up-revalidate="false" -->
```

To keep the default, but disable revalidation for a function call that would otherwise navigate,
pass a `{ revalidate: false }` option:

```js
up.follow(link, { cache: true, revalidate: false })
```


Expiration
----------

Cached content expires after 15 seconds. This can be configured in `up.network.config.cacheExpireAge`.
The configured age should at least cover the typical time between [preloading](/preloading) a link and following it.

Expired content stays in the cache, but triggers [revalidation](#revalidation) when rendered.
Expired pages also [remain accessible](/network-issues#offline-cache) after a [connection loss](/network-issues#disconnects).


### Expiring content after an interaction

`GET` requests don't expire any content. When the user makes a non-`GET` request (usually a form submission with `POST`),
the *entire cache* is expired as soon as the request is sent. A non-`GET` request has probably changed data on the server,
so all cache entries should be [revalidated](#revalidation) before they are shown again.

To change what a request expires, use any of the following. A value of `false` expires nothing:

- Configure which requests should cause expiration in `up.network.config.expireCache`
- Pass an [`{ expireCache }`](/up.render#options.expireCache) option to the rendering function
- Set an [`[up-expire-cache]`](/up-follow#up-expire-cache) attribute on a link or form

To expire additional entries later:

- Send an `X-Up-Expire-Cache` response header from the server.
  It cannot undo the expiration that happened when the request was sent.
- Expire cache entries from JavaScript with `up.cache.expire()`

Each of these accepts a [URL pattern](/url-patterns) to expire only matching entries:

```js
up.cache.expire('/users/*')
```


Disabling caching {#disabling}
-----------------

You can disable the caching mechanism globally or selectively.

Without caching, every request and render pass hits the network. Responses are not cached either,
unless there is an existing cache entry that can be updated with a fresher response.


### Disabling the cache globally {#disabling-globally}

[Navigation](/navigation-defaults) is the only moment when Unpoly caches by default.

You can disable caching globally like so:

```js
up.fragment.config.navigateOptions.cache = false
```

### Disabling the cache for selected routes {#disabling-route}

To keep the navigation default, but disable auto-caching for some URLs, configure `up.network.config.autoCache`:

```js
let defaultAutoCache = up.network.config.autoCache
up.network.config.autoCache = function(request) {
  return defaultAutoCache(request) && !request.url.endsWith('/edit')
}
```

### Disabling the cache for a link {#disabling-link}

To keep the default, but disable caching for an individual link, set an `[up-cache="false"]` attribute:

```html
<a href="/stock-charts" up-cache="false">View latest prices</a> <!-- mark: up-cache="false" -->
```

### Disabling the cache for a function call {#disabling-function-call}

To keep the default, but disable caching for a function call that would otherwise navigate,
pass a `{ cache: false }` option:

```js
up.follow(link, { cache: false })
```


Eviction
--------

Instead of expiring content you may also *evict* content to erase it from the cache.

In practice you will often prefer *expiration* over *eviction*. Expired content remains available during a connection loss
and for instant navigation, while [revalidation](#revalidation) ensures the user always ends up with a fresh revision.
Evicted content is gone from the cache entirely, and a new network request is needed to access it again.


### Evicting content after an interaction

Eviction is the right choice when it is not acceptable for the user to see even a brief flash of stale content
before [revalidation](#revalidation) finishes. By default no request evicts content.
The controls mirror those for expiration:

- Configure which requests should cause eviction in `up.network.config.evictCache`
- Pass an [`{ evictCache }`](/up.render#options.evictCache) option to the rendering function
- Set an [`[up-evict-cache]`](/up-follow#up-evict-cache) attribute on a link or form
- Send an `X-Up-Evict-Cache` response header from the server
- Evict cache entries from JavaScript with `up.cache.evict()`

Each of these accepts a [URL pattern](/url-patterns) to evict only matching entries.
The configuration, option and attribute take effect when the request is sent.
The response header takes effect when the response is received.


### Capping memory usage

To limit the memory required to hold its cache, Unpoly evicts cached content in two ways:

- Cache entries are evicted after 90 minutes. This can be configured in `up.network.config.cacheEvictAge`.
- The cache holds up to 70 responses. When this limit is reached, the oldest responses are evicted. This can be configured in `up.network.config.cacheSize`.


Reacting to revalidation in code {#reacting-to-revalidation}
--------------------------------

### Preventing rendering of revalidation responses

To discard revalidated HTML *after* the server has responded, you may call `event.skip()`
on an `up:fragment:loaded` event with a `{ revalidating: true }` property.
This gives you a chance to inspect the response or DOM state right before a fragment would be inserted:

```js
up.on('up:fragment:loaded', function(event) {
  // Don't insert fresh content if the user has started a video
  // after the expired content was rendered.
  let video = event.request.fragment.querySelector('video')

  if (event.revalidating && video && !video.paused) { // mark: event.revalidating
    // Finish the render pass with no changes.
    event.skip()
  }
})
```

See [skipping a loaded response](/render-lifecycle#skipping-responses) for more details and examples.


### Detecting revalidation from a compiler

Compilers with side effects may want to behave differently when the compiled element is being
reloaded for the purpose of cache revalidation.

To detect revalidation, compilers may accept a third argument with information about the current [render pass](/up.render).
In the example below a compiler wants to [track a page view](/tracking-page-views) in a web analytics tool:

```js
up.compiler('[track-page-view]', function(element, data, meta) { // mark: meta
  // Don't track duplicate page views if we just reloaded for cache revalidation.
  if (!meta.revalidating) {
    // Send an event to our web analytics tool.
    trackPageView(meta.layer.location)
  }
})
```


Caching optimized responses {#caching-optimized-responses}
---------------------------

Servers may inspect [request headers](/up.protocol) to [optimize responses](/optimizing-responses),
e.g. by omitting a navigation bar that is not targeted.
Request headers that influenced a response should be listed in a `Vary` response header,
so Unpoly can partition its cache by header value.
See [Caching optimized responses](/optimizing-responses#vary) for details and examples.


### How cache entries are matched {#how-cache-entries-are-matched}

When a response has a `Vary` header, matching cache entries must have the same values for all listed headers.
See [How cache entries are matched](/optimizing-responses#cache-matching) for tables of hits and misses.


Caching after redirects
-----------------------

- When a request `GET /foo` redirects to `GET /bar`, the response to `/bar` will be cached for both `GET /foo` and `GET /bar`.
- For technical reasons Unpoly cannot read from the cache when a request to an uncached URL redirects to a cached URL.
  For example, when a form submission makes a request to `POST /action`, and the response redirects to `GET /path`,
  the browser will make a fresh request to `GET /path` even if `GET /path` was cached before.
- For technical reasons Unpoly cannot detect redirects to the same URL, but using a different method. For example, when a request
  to `POST /users` redirects to `GET /users`. You can address this by including an `X-Up-Method` header in your responses.


@page caching
@signature
