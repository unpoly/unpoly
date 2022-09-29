Caching
=======

Unpoly caches responses, allowing instant access to pages that the user has already visited this session.

Cached pages also [remain accessible](/disconnects#expired-pages-remain-accessible-while-offline) after a [disconnect](/disconnects).

To ensure that the user never sees stale content, cached content is [revalidated with the server](#revalidation).


Enabling caching
----------------

You can enable caching with `{ cache: 'auto' }`, which caches all responses to GET requests. You can configure this default:

```js
up.network.config.autoCache = (request) => request.method === 'GET'
```

When [navigating](/navigation) the `{ cache: 'auto' }` option is already set by [default](/up.fragment.config#config.navigateOptions). To opt *out* of caching while navigating, pass a [`{ cache: false }`](/up.render#options.cache) option (JavaScript), set an [`[up-cache=false]`](/a-up-follow#up-cache) attribute (HTML), or configure `up.network.config.autoCache`.

To force caching regardless of HTTP method, pass `{ cache: true }`.


Revalidation
------------

Cache entries are only considered *fresh* for [15 seconds](/up.network.config#config.cacheExpireAge). When rendering older cache content, Unpoly automatically reloads the fragment to ensure that the user never sees expired content. This process is called *cache revalidation*.

This means when re-visiting pages Unpoly often renders twice:

1. A first render pass from the cache (which may be expired)
2. A second render pass from the server (which is always fresh)


### Enabling revalidation

You can enable revalidation with `{ revalidate: 'auto' }`, which revalidates [expired](/up.network.config#config.cacheExpireAge) cache entries. You can configure this default:

```js
up.network.config.cacheExpireAge = 20_000 // expire ater 20 seconds
up.fragment.config.autoRevalidate = (response) => response.expired
```

When [navigating](/navigation) the `{ revalidate: 'auto' }` is already set by [default](/up.fragment.config#config.navigateOptions). To opt *out* of revalidation while navigating, pass a  [`{ revalidate: false }`](/up.render#options.revalidate) option (JavaScript), set an [`[up-revalidate=false]`](/a-up-follow#up-revalidate) attribute (HTML) or configure `up.fragment.config.autoRevalidate`.

To force revalidation regardless of cache age, pass `{ revalidate: true }`.


### Faster revalidation with conditional requests

Your server-side app may support [conditional HTTP requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests) to speed up the requests Unpoly makes when reloading the fragment that is being revalidated.

When rendering HTML your server may send [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) and [`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified) response headers. When reloading Unpoly echoes these headers as `If-Modified-Since` or `If-None-Match` request headers. Your server can match these headers against the underlying data before rendering. When the data hasn't changed, your server can send an empty response with HTTP status `304 Not Modified` or `204 No Content`. This dramatically reduces the time required to produce a revalidation response for unchanged content.



Expiration
----------

Cached content automatically expires after 15 seconds. This can be configured in `up.network.config.cacheExpireAge`. The configured age should cover the average time between [preloading](/a-up-preload) and following a link.

After expiring cached content is kept in the cache, but will trigger [revalidation](#revalidation) when used. Expired pages also [remain accessible](/disconnects#expired-pages-remain-accessible-while-offline) after a [connection loss](/disconnects).

When the user makes a non-GET request (usually a form submission), the entire cache is expired by default. The assumption is that a non-GET request will change data on the server, so all cache entries should be revalidated. There are multiple was to override this behavior:

- Pass an [`{ expireCache }`](/up.render#options.expireCache) option to the rendering function
- Set an [`[up-expire-cache]`](/up.render#options.expireCache) attribute on a link or form
- Send an `X-Up-Expire-Cache` response header from the server
- Configure a new default in `up.network.config.expireCache`

Your JavaScript may also imperatively expire cache entries through the `up.cache.expire()` function.


Eviction
--------




@page caching

