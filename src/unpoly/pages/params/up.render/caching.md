@partial up.render/caching

@param {boolean} [options.cache]
  Whether to read from and write to the [cache](/caching).

  With `{ cache: true }` Unpoly will try to re-use a cached response before connecting
  to the network. To prevent display of stale content, cached responses are
  [reloaded once rendered](#options.revalidate).
  If no cached response exists, Unpoly will make a request and cache
  the server response.

  With `{ cache: 'auto' }` Unpoly will use the cache only if `up.network.config.autoCache`
  returns `true` for the request.

  With `{ cache: false }` Unpoly will always make a network request.

@param {boolean} [options.revalidate]
  Whether to reload the targeted fragment after it was rendered from a cached response.

  With `{ revalidate: 'auto' }` Unpoly will revalidate if the `up.fragment.config.autoRevalidate(response)`
  returns `true`. By default this configuration will return true for
  [expired](/up.fragment.config#config.autoRevalidate) responses.

  With `{ revalidate: true }` Unpoly will always revalidate cached content, regardless
  of its age.

  With `{ revalidate: false }` Unpoly will never revalidate cached content.

@param {string|Function(up.Preview)} [options.revalidatePreview]
  A [preview](/previews) that that runs
  while [revalidating cached content](/caching#revalidation).
  
  @experimental

@param {boolean|string} [options.expireCache]
  Whether existing [cache](/caching) entries will be [expired](/caching#expiration) with this request.

  Expired content remains in the cache, but will be [revalidated](/caching#revalidation) with the server
  after rendering.

  By default, any non-GET request will expire the entire cache.
  This can be configured with `up.network.config.expireCache`.

  To only expire some requests, pass an [URL pattern](/url-patterns) that matches requests to uncache.
  You may also pass a function that accepts an existing `up.Request` and returns a boolean value.

@param {boolean|string} [options.evictCache]
  Whether existing [cache](/caching) entries will be [evicted](/caching#eviction) with this request.

  By default, Unpoly will never evict entries while the cache has
  [space](/up.network.config#config.cacheSize),
  preferring [expiration](/caching#expiration) instead.
  This can be configured with `up.network.config.evictCache`.

  To only evict some requests, pass an [URL pattern](/url-patterns) that matches requests to uncache.
  You may also pass a function that accepts an existing `up.Request` and returns a boolean value.
