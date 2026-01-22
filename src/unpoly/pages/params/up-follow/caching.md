@partial up-follow/caching

@param [up-cache='auto']
  Whether to read from and write to the [cache](/caching).

  With `[up-cache=true]` Unpoly will try to re-use a cached response before connecting
  to the network. To prevent display of stale content, cached responses are
  [reloaded once rendered](#up-revalidate). If no cached response exists,
  Unpoly will make a request and cache the server response.

  With `[up-cache=auto]` Unpoly will use the cache only if `up.network.config.autoCache`
  returns `true` for the request. By default this only caches `GET` requests.

  With `[up-cache=false]` Unpoly will always make a network request.

@param [up-revalidate='auto']
  Whether to [reload the targeted fragment](/caching#revalidation)
  after it was rendered from a cached response.

  With `[up-revalidate='auto']`, Unpoly will revalidate [expired](/caching#expiration) responses.
  This behavior can be configured with `up.fragment.config.autoRevalidate(response)`.

  With `[up-revalidate='true']`, Unpoly will always revalidate cached content, regardless
  of its age.

  With `[up-revalidate='false']`, Unpoly will never revalidate cached content.

@param [up-revalidate-preview]
  The name of a [preview](/previews) that runs
  while [revalidating cached content](/caching#revalidation).

  @experimental

@param [up-expire-cache]
  Whether existing [cache](/caching) entries will be [expired](/caching#expiration) with this request.

  By default a non-GET request will expire the entire cache.
  You may also pass a [URL pattern](/url-patterns) to only expire matching requests.

  Also see [`up.request({ expireCache })`](/up.request#options.expireCache) and `up.network.config.expireCache`.

@param [up-evict-cache]
  Whether existing [cache](/caching) entries will be [evicted](/caching#eviction) with this request.

  You may also pass a [URL pattern](/url-patterns) to only evict matching requests.

  Also see [`up.request({ evictCache })`](/up.request#options.evictCache) and `up.network.config.evictCache`.
