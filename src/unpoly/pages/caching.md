Caching
=======

Unpoly caches responses, allowing instant access to pages that the user has already visited this session.

To ensure that the user never sees stale content, cached content is [revalidated with the server](#revalidation).

Cached pages also [remain accessible](/network-issues#offline-cache) after a [disconnect](/network-issues#disconnects).


Enabling caching
----------------

You can enable caching with `{ cache: 'auto' }`, which caches all responses to GET requests. You can configure this default:

```js
up.network.config.autoCache = (request) => request.method === 'GET'
```

When [navigating](/navigation) the `{ cache: 'auto' }` option is already set by [default](/up.fragment.config#config.navigateOptions). To opt *out* of caching while navigating, there are several methods:

- Pass a [`{ cache: false }`](/up.render#options.cache) option (JavaScript)
- Set an [`[up-cache=false]`](/a-up-follow#up-cache) attribute (HTML)
- Exclude a URL from `up.network.config.autoCache`.

To force caching regardless of HTTP method, pass `{ cache: true }`.


Revalidation
------------

Cache entries are only considered *fresh* for [15 seconds](/up.network.config#config.cacheExpireAge). When rendering older cache content, Unpoly automatically reloads the fragment to ensure that the user never sees expired content. This process is called *cache revalidation*.

When re-visiting pages, Unpoly often renders twice:

1. An initial render pass from the cache (which may be expired)
2. A second render pass from the server (which is always fresh)


### Enabling revalidation

You can enable revalidation with `{ revalidate: 'auto' }`, which revalidates [expired](/up.network.config#config.cacheExpireAge) cache entries. You can configure this default:

```js
up.network.config.cacheExpireAge = 20_000 // expire after 20 seconds
up.fragment.config.autoRevalidate = (response) => response.expired
```

To force revalidation regardless of cache age, pass `{ revalidate: true }`.


### Disabling revalidation

When [navigating](/navigation) the `{ revalidate: 'auto' }` option is already set by [default](/up.fragment.config#config.navigateOptions). To opt *out* of revalidation while navigating, there are several methods:

- Pass a  [`{ revalidate: false }`](/up.render#options.revalidate) option (JavaScript)
- Set an [`[up-revalidate=false]`](/a-up-follow#up-revalidate) attribute (HTML)
- Configure `up.fragment.config.navigateOptions.revalidate = false`


### When nothing changed

Your server-side app is not required to re-render a request if there are no changes to the cached content.

By supporting [conditional HTTP requests](/conditional-requests) you can quickly produce an empty revalidation response for unchanged content.


### Preventing rendering of revalidation responses

To discard revalidated HTML *after* the server has responded, you may prevent the
`up:fragment:loaded` event when it has an `{ revalidating: true }` property.
This gives you a chance to inspect the response or DOM state right before a fragment would be inserted:

```js
up.on('up:fragment:loaded', function(event) {
  // Don't insert fresh content if the user has started a video
  // after the stale content was rendered.
  if (event.revalidating && !event.request.fragment.querySelector('video')?.paused) {
    // Finish the render pass with no changes.
    event.skip()
  }
})
```

See [skipping unnecessary rendering](/skipping-rendering) for more details and examples.


### Detecting revalidation from a compiler

Compilers with side effects may occasionally want to behave differently when the compiled element is being
reloaded for the purpose of cache revalidation.

To detect revalidation, compilers may accept a third argument with information about the current [render pass](/up.render).
In the example below a compiler wants to [track a page view](/analytics) in a web analytics tool:

```js
up.compiler('[track-page-view]', function(element, data, meta) { // mark-phrase "meta"
  // Don't track duplicate page views if we just reloaded for cache revalidation. 
  if (!meta.revalidating) {
    // Send an event to our web analytics tool.
    trackPageView(meta.layer.location)
  }
})
```


Expiration
----------

Cached content automatically expires after 15 seconds. This can be configured in `up.network.config.cacheExpireAge`. The configured age should at least cover the average time between [preloading](/a-up-preload) and following a link.

After expiring, cached content is kept in the cache, but will trigger [revalidation](#revalidation) when used. Expired pages also [remain accessible](/network-issues#offline-cache) after a [connection loss](/network-issues#disconnects).


### Expiring content after an interaction

`GET` requests don't expire any content by default. When the user makes a non-`GET` request (usually a form submission with `POST`), the *entire cache* is expired. The assumption here is that a non-GET request will change data on the server, so all cache entries should be [revalidated](#revalidation).

There are multiple ways to override this behavior:

- Pass an [`{ expireCache }`](/up.render#options.expireCache) option to the rendering function
- Set an [`[up-expire-cache]`](/up.render#options.expireCache) attribute on a link or form
- Send an `X-Up-Expire-Cache` response header from the server
- Configure which requests should cause expiration in `up.network.config.expireCache`
- Imperatively expire cache entries through the `up.cache.expire()` function


Eviction
--------

Instead of expiring content you may also *evict* content to erase it from the cache.

In practice you will often prefer *expiration* over *eviction*. Expired content remains available during a connection loss and for instant navigation, while [revalidation](#revalidation) ensures the user always sees a fresh revision. Evicted content on the other hand is gone from the cache entirely, and a new network request is needed to access it again.

### Evicting content after an interaction

One use case for eviction is when it is not acceptable for the user to see a brief flash of stale content before [revalidation](#revalidation) finishes. You can do so in multiple ways:

- Pass an [`{ evictCache }`](/up.render#options.evictCache) option to the rendering function
- Set an [`[up-evict-cache]`](/up.render#options.evictCache) attribute on a link or form
- Send an `X-Up-Evict-Cache` response header from the server
- Configure which requests should cause eviction in `up.network.config.evictCache`
- Imperatively evict cache entries through the `up.cache.evict()` function

### Capping memory usage

To limit the memory required to hold its cache, Unpoly evicts cached content in the following ways:

- Unpoly evicts cache entries after 90 minutes. This can be configured in `up.network.config.cacheEvictAge`.
- The cache holds up to 70 responses. When this limit is reached, the oldest responses are evicted. This can be configured in `up.network.config.cacheSize`.


Caching optimized responses
---------------------------

Servers may inspect [request headers](/up.protocol) to [optimize responses](/optimizing-responses),
e.g. by omitting a navigation bar that is not targeted.

Request headers that influenced a response should be listed in a `Vary` response header.
This tells Unpoly to partition its cache for that URL so that each
request header value gets a separate cache entries.

### Example

The user makes a request to `/sitemap` in order to updates a fragment `.menu`.
Unpoly makes a request like this:

```http
GET /sitemap HTTP/1.1
X-Up-Target: .menu
```

The server may choose to [optimize its response](/optimizing-responses) by only render only the HTML for
the `.menu` fragment. It responds with the following HTTP:

```http
Vary: X-Up-Target

<div class="menu">...</div>
```

After observing the `Vary: X-Up-Target` header, Unpoly will partition cache entries to `/sitemap` by `X-Up-Target` value.
That means a request targeting `.menu` is no longer a cache hit for a request targeting a different selector.


@page caching

