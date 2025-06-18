require('./network.sass')

const u = up.util

/*-
Network requests
================

This package implements an optimized HTTP client
that is used for all requests made through Unpoly.

The HTTP client offers many quality-of-life improvements, for example:

- Requests may be [cached](/caching) to re-use responses and enable [preloading](/preloading).
  Cached content is [revalidated](/caching#revalidation) after rendering, so the user never
  sees stale content.
- You may [handle network issues](/network-issues), such as disconnects, flaky connections or low bandwidth.
- A [progress bar](/progress-bar) is shown when requests take too long to finish.
- When two requests [target](/targeting-fragments) the same element,
  Unpoly will [abort the earlier request](/aborting-requests).
- Requests send [additional HTTP headers](/up.protocol) that the server may use to [optimize its response](/optimizing-responses).
  For example, when [updating a fragment](/targeting-fragments), the target selector is automatically sent
  as an `X-Up-Target` header. The server may choose to only render the targeted fragment.
- Useful events like `up:request:loaded` or `up:network:late` are emitted throughout the request/response lifecycle.
- When too many requests are sent concurrently, excessive requests are [queued](/up.network.config#config.concurrency).
  This prevents exhausting the user's bandwidth and limits race conditions in end-to-end tests.

Unpoly's HTTP client is used automatically when rendering, e.g. when [following a link](/up-follow)
or [submitting a form](/up-submit). To use the client from your own JavaScripts, use `up.request()`.

@see caching
@see aborting-requests
@see network-issues
@see progress-bar

@see up.request
@see up.Response
@see up:network:late

@module up.network
*/
up.network = (function() {

  /*-
  Sets default options for network requests.

  @property up.network.config

  @section Requests
    @param {number|Function(): number} [config.concurrency]
      The maximum number of concurrently loading requests.

      Additional requests are queued. [Preload](/preloading) requests are
      always queued behind non-preload requests.

      By default Unpoly allows 6 concurrent requests.
      You might find it useful to set a concurrency of `1` in end-to-end tests
      to prevent race conditions.

      Your browser may impose additional concurrency limits  regardless of what you configure here.

    @param {boolean} [config.wrapMethod=true]
      Whether to wrap non-standard HTTP methods in a POST request.

      If this is set, methods other than GET and POST will be converted to a `POST` request
      and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

      If you disable method wrapping, make sure that your server always redirects with
      with a 303 status code (rather than 302).

    @param {number|Function(up.Request): number|boolean} [config.lateDelay=400]
      The number of milliseconds to wait before emitting the [`up:network:late` event](/up:network:late) and showing
      the [progress bar](/progress-bar).

      To never consider a request to be late, configure a function that returns `false` for that request.

      @experimental
    @param {number|undefined} [config.timeout=90_000]
      A default [timeout](/up.request#options.timeout) for [requests](/up.request) in milliseconds.

      Set `undefined` to not use a timeout.

    @param {boolean|Function(up.Response): boolean} [config.fail]
      Whether Unpoly will consider a response to constitute a [failed response](/failed-responses).

      By default Unpoly will consider any status code other than HTTP 2xx or [304](/skipping-rendering#rendering-nothing) to represent a failed response.
      You may use this option to customize this behavior. For instance, you can fail a response if it contains a given header or body text.

      The following configuration will fail all responses with an `X-Unauthorized` header:

      ```js
      let badStatus = up.network.config.fail
      up.network.config.fail = (response) => badStatus(response) || response.header('X-Unauthorized')
      ```

      Also see [Customizing failure detection](/failed-responses#customizing-failure-detection).

  @section Caching
    @param {number} [config.cacheSize=70]
      The maximum number of responses to cache.

      If the size is exceeded, the oldest responses will be dropped from the cache.

    @param {number} [config.cacheExpireAge=15_000]
      The number of milliseconds after which a cache entry is considered [expired](/caching#expiration) and will trigger [revalidation](/caching#revalidation) when used.

      The configured age should at least cover the average time between [preloading](/preloading) and following a link.

      Defaults to 15 seconds.

    @param {number} [config.cacheEvictAge=90*60*1000]
      The number of milliseconds after which a cache entry is [evicted](/caching#eviction).

      In practice you will often prefer [*expiration*](/caching#expiration) over *eviction*.

      Defaults to 90 minutes.

    @param {Function(up.Request): boolean} [config.autoCache]
      Whether to [cache](/caching) the given request with `{ cache: 'auto' }`.

      By default Unpoly will auto-cache requests with [safe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) HTTP methods like `GET`.

      You may change this default to prevent auto-caching of some of your routes. For example, this will prevent auto-caching
      of requests to URLs ending with `/edit`:

      ```js
      let defaultAutoCache = up.network.config.autoCache
      up.network.config.autoCache = function(request) {
        return defaultAutoCache(request) && !request.url.endsWith('/edit')
      }
      ```

    @param {(Function(up.Request): boolean|string)|boolean} [config.expireCache]
      A function that controls [cache expiration](/caching#expiration) before the given request loads.

      Returning `true` will expire the entire cache.\
      Returning `false` will not expire any cache entries.\
      Returning a [URL pattern](/url-pattern) will expire matching cache entries only:

      By default Unpoly will expire the entire cache after a request with an [unsafe](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) HTTP method:

      ```js
      up.request({ url: '/path', method: 'get' })  // no cache entries expired
      up.request({ url: '/path', method: 'post' }) // entire cache expired
      ```

    @param {(Function(up.Request): boolean|string)|boolean} [config.evictCache=false]
      A function that controls [cache eviction](/caching#eviction) before the given request loads.

      Returning `true` will expire the entire cache.\
      Returning `false` will not expire any cache entries.\
      Returning a [URL pattern](/url-pattern) will expire matching cache entries only.

      By default Unpoly will *not* evict any cache entries when a request is made.

    @param {boolean|Function(): boolean} [config.progressBar]
      Whether to show a [progress bar](/progress-bar) for [late requests](#config.lateDelay).

  @stable
  */
  const config = new up.Config(() => ({
    concurrency: 6,
    wrapMethod: true,
    cacheSize: 70,
    cacheExpireAge: 15 * 1000,
    cacheEvictAge: 90 * 60 * 1000,
    lateDelay: 400,
    fail(response) { return (response.status < 200 || response.status > 299) && response.status !== 304 },
    autoCache(request) { return request.isSafe() },
    expireCache(request) { return !request.isSafe() },
    evictCache: false,
    progressBar: true,
    timeout: 90_000,
  }))

  const queue = new up.Request.Queue()

  const cache = new up.Request.Cache()

  let progressBar = null

  /*-
  Returns a [cached](/caching) request matching the given request options.

  The request may still be in flight.

  Returns `undefined` if the given request is not currently cached.

  > [IMPORTANT]
  > `up.request()` and `up.render()` will only write to the cache when a [`{ cache }`](/up.request#options.cache)
  > option is set.

  ## Example

  ```
  let request = up.cache.get({ url: '/foo' })

  if (request) {
    let response = await request
    console.log("Response is %o", response)
  } else {
    console.log("The path /foo has not been requested before!")
  }
  ```

  @function up.cache.get
  @param {Object} requestOptions
    The request options to match against the cache.

    See `options` for `up.request()` for documentation.
  @return {up.Request|undefined}
    The cached request.
  @experimental
  */

  /*-
  [Evicts](/caching#eviction) responses in the [cache](/caching).

  The server may also evict cache entries by sending an [`X-Up-Evict-Cache`](/X-Up-Evict-Cache) header.

  ## Example

  Calling without argument will clear the entire cache:

  ```js
  up.cache.evict()
  ```

  To only remove some cache entries, pass a [URL pattern](/url-patterns):

  ```js
  up.cache.evict('/users/*')
  ```

  @function up.cache.evict
  @param {string} [pattern]
    A [URL pattern](/url-patterns) matching cache entries that should be removed.

    If omitted, the entire cache is evicted.
  @stable
  */

  /*-
  [Expires](/caching#expiration) entries in the [cache](/caching).

  Expired entries remain in the cache, but will be [revalidated](/caching#revalidation)
  after rendering.

  By default, Unpoly automatically expires the entire cache whenever it processes
  a request with an non-GET HTTP method. To customize this rule, use `up.network.config.expireCache`.

  The server may also expire cache entries by sending an [`X-Up-Expire-Cache`](/X-Up-Expire-Cache) header.

  ## Example

  Calling without argument will mark the entire cache as expired:

  ```js
  up.cache.expire()
  ```

  To only expire some cache entries, pass a [URL pattern](/url-patterns):

  ```js
  up.cache.expire('/users/*')
  ```

  @function up.cache.expire
  @param {string} [pattern]
    A [URL pattern](/url-patterns) matching cache entries that should be expired.

    If omitted, the entire cache is expired.
  @stable
  */

  /*-
  Makes the [cache](/caching) assume that `newRequest` has the same response as the
  already cached `oldRequest`.

  Unpoly uses this internally when the user redirects from `/old` to `/new`.
  In that case, both `/old` and `/new` will cache the same response from `/new`.

  @function up.cache.alias
  @param {Object|up.Request} oldRequest
    The earlier request or [request options](/up.request).
  @param {Object|up.Request|undefined} newRequest
    The new request or [request options](/up.request).
  @return {up.Request|undefined}
    If an alias could be registered, `newRequest` is returned.

    If `oldRequest` wasn't found in the cache, `undefined` is returned.
  @experimental
  */

  /*-
  Manually stores a request in the [cache](/caching).

  Future calls to `up.request()` will try to re-use this request before
  making a new request.

  @function up.cache.set
  @param {up.Request} request
    The request to cache. The cache is also a promise for the response.
  @internal
  */

  function reset() {
    abortRequests()
    queue.reset()
    cache.reset()
    progressBar?.destroy()
    progressBar = null
  }

  /*-
  Makes an AJAX request to the given URL.

  Returns an `up.Request` object which contains information about the request.
  This request object is also a promise for an `up.Response` that contains
  the response text, headers, etc.

  ### Example

  ```js
  let request = up.request('/search', { params: { query: 'sunshine' } })
  console.log('We made a request to', request.url)

  let response = await request
  console.log('The response text is', response.text)
  ```

  ### Error handling

  The returned promise will fulfill with an `up.Response` when the server
  responds with an HTTP status of 2xx (like `200`).

  When the server responds with an HTTP error code (like `422` or `500`), the promise
  will *reject* with `up.Response`.

  When the request fails from a fatal error (like a timeout or loss of connectivity),
  the promise will reject with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object.

  Here is an example for a complete control flow that handles both HTTP error codes
  and fatal errors:

  ```js
  try {
    let response = await up.request('/search', { params: { query: 'sunshine' } })
    console.log('Successful response with text:', response.text)
  } catch (e) {
    if (e instanceof up.Response) {
      console.log('Server responded with HTTP status %s and text %s', e.status, e.text)
    } else {
      console.log('Fatal error during request:', e.message)
    }
  }
  ```

  ### Caching

  You may [cache](/caching) responses by passing a `{ cache }` option. Responses for a cached
  request will resolve instantly.

  See [Caching](/caching) for more details and examples.

  @function up.request

  @section Request
    @param {string} [url]
      The requested URL.

      Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.

    @param {string} [options.url]
      The requested URL.

    @param {string} [options.method='GET']
      The HTTP method for the request.

    @param {Object|up.Params|FormData|string|Array} [options.params={}]
      [Parameters](/up.Params) that should be sent as the request's
      [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

      When making a `GET` request to a URL with a query string, the given `{ params }` will be added
      to the query parameters.

    @param {Object} [options.headers={}]
      An object of additional HTTP headers.

      Unpoly will by default send a number of custom request headers.
      See `up.protocol` for details.

    @param {boolean} [options.wrapMethod]
      Whether to wrap non-standard HTTP methods in a POST request.

      If this is set, methods other than GET and POST will be converted to a `POST` request
      and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

      Defaults to [`up.network.config`](/up.network.config#config.wrapMethod).

    @param {string} [options.timeout]
      A timeout in milliseconds.

      If the request is queued due to [many concurrent requests](/up.network.config#config.concurrency),
      the timeout will not include the time spent waiting in the queue.

    @param {Element} [options.contentType]
      The format in which to encode the request params.

      Allowed values are `application/x-www-form-urlencoded` and `multipart/form-data`.
      Only `multipart/form-data` can transport binary data.

      If this option is omitted Unpoly will prefer `application/x-www-form-urlencoded`,
      unless request params contains binary data.

    @param {string} [options.payload]
      A custom payload for this request.

      By default Unpoly will build a payload from the given `{ params }` option.
      Therefore this option is not required when making a standard link or form request to a server
      that renders HTML.

      A use case for this option is talking to a JSON API that expects requests with a `application/json` payload.

      If a `{ payload }` option is given you must also pass a `{ contentType }`.

    @param {boolean} [options.background=false]
      Whether this request will load in the background.

      Background requests deprioritized over foreground requests.
      Background requests also won't emit `up:network:late` events and won't trigger
      the [progress bar](/progress-bar).

    @param {number} [options.lateDelay]
      The number of milliseconds after which this request can cause
      an `up:network:late` event.

      Defaults to `up.network.config.lateDelay`.

      @experimental

    @param {string|boolean|Function(up.Response): boolean} [options.fail]
      Whether the response to this request should be considered [failed](/failed-responses).

      By [default](/up.network.config#config.autoFail) any HTTP status code other than 2xx or 304 is considered an error code.
      Pass `{ fail: false }` to handle *any* response as successful, even with a 4xx or 5xx status code.

      A failed response will cause the [returned promise](#return-value) to reject.

  @section Caching
    @param {boolean} [options.cache=false]
      Whether to read from and write to the [cache](/caching).

      With `{ cache: true }` Unpoly will try to re-use a cached response before connecting
      to the network. If no cached response exists, Unpoly will make a request and cache
      the server response.

      With `{ cache: 'auto' }` Unpoly will use the cache only if `up.network.config.autoCache`
      returns `true` for this request.

      With `{ cache: false }` (the default) Unpoly will always make a network request.

    @param {boolean|string} [options.expireCache]
      Whether to [expire](/caching#expiration) the [cache](/caching) after this request.

      Defaults to the result of `up.network.config.expireCache`, which
      defaults to expiring the entire cache after a non-GET request.

      You may also pass a [URL pattern](/url-patterns) to only expire matching responses.

    @param {boolean|string} [options.evictCache]
      Whether to [evict](/caching#eviction) the [cache](/caching) after this request.

      Defaults to the result of `up.network.config.evictCache`, which defaults to `false`.

      You may also pass a [URL pattern](/url-patterns) to only evict matching responses.


  @section Render context
    @param {string} [options.target='body']
      The CSS selector that will be sent as an `X-Up-Target` header.

      The targets of concurrent requests to the same URL [may be merged](/X-Up-Target#merging).

    @param {string} [options.failTarget='body']
      The CSS selector that will be sent as an `X-Up-Fail-Target` header.

    @param {string} [options.layer='current']
      The [layer](/up.layer) this request is associated with.

      If this request is intended to update an existing fragment, this is that fragment's layer.

      If this request is intended to [open an overlay](/opening-overlays),
      the associated layer is the future overlay's parent layer.

    @param {string} [options.failLayer='current']
      The [layer](/up.layer) this request is associated with if the server [sends a HTTP status code](/failed-responses).

    @param {Element} [options.origin]
      The DOM element that caused this request to be sent, e.g. a hyperlink or form element.

  @return {up.Request}
    An object with information about the request.

    The request object is also a promise for its `up.Response`.

  @stable
  */
  function makeRequest(...args) {
    const options = parseRequestOptions(args)
    const request = new up.Request(options)
    processRequest(request)
    return request
  }

  function parseRequestOptions(args) {
    let options = u.parseArgIntoOptions(args, 'url')
    up.migrate.handleRequestOptions?.(options)
    return options
  }

  function processRequest(request) {
    cache.expire(request.expireCache ?? u.evalOption(config.expireCache, request) ?? false)
    cache.evict(request.evictCache ?? u.evalOption(config.evictCache, request) ?? false)
    useCachedRequest(request) || queueRequest(request)
  }

  function useCachedRequest(newRequest) {
    // If we have an existing promise matching this new request,
    // we use it unless `request.cache` is explicitly set to `false`.
    let cachedRequest
    if (newRequest.willCache() && (cachedRequest = cache.get(newRequest))) {
      up.puts('up.request()', 'Re-using previous request to %s', newRequest.description)

      // Check if we need to upgrade a cached background request to a foreground request.
      // This might affect whether we're going to emit an up:network:late event further
      // down. Consider this case:
      //
      // - User preloads a request (1). We have a cache miss and connect to the network.
      //   This will never trigger `up:network:late`, because we only track foreground requests.
      // - User loads the same request (2) in the foreground (no preloading).
      //   We have a cache hit and receive the earlier request that is still preloading.
      //   Now we *should* trigger `up:network:late`.
      // - The request (1) finishes. This triggers `up:network:recover`.
      if (!newRequest.background) {
        queue.promoteToForeground(cachedRequest)
      }

      cachedRequest.mergeIfUnsent(newRequest)

      // We cannot simply return `cachedRequest`, since that might have a different #hash property.
      // While two requests with a different #hash have the same cache key, they are
      // not the same object.
      //
      // What we do instead is have `request` follow the state of `cachedRequest`'s exchange.
      //
      // There is also the edge case where a cached request is still in-flight and, when the
      // response is finally received, has a Vary header that makes it incompatible with
      // `newRequest`. In this case we re-process `newRequest` as if it was just made.
      cache.track(cachedRequest, newRequest, { onIncompatible: processRequest })

      return true
    }
  }

  // If no existing promise is available, we queue a network request.
  function queueRequest(request) {
    handleCaching(request)

    queue.asap(request)

    return true
  }

  function handleCaching(request) {
    // Several code paths lead here:
    //
    // (1) A request with { cache: true } when there was a cache miss.
    // (2) A request with { cache: false }. This may still update the cache if we end up with a fresher response,
    //     but should keep a good cache entry if we end up with a network error.
    //
    // A code path that does *never* lead here:
    //
    // (3) A request with { cache: true } when there was a cache hit.

    if (request.willCache()) {
      // Here we have a request with { request: true } and a cache miss.
      //
      // Cache the request before it is queued and loaded.
      // This way additional requests to the same endpoint will hit and track this request.
      // Since nothing was cached for this request, we're not overriding an existing cache entry.
      cache.put(request)

      // If the request changed its URL or params in up:request:load, the cache needs to re-index.
      request.onLoading = () => cache.reindex(request)
    }

    // Once we receive a response we honor options/headers for eviction/expiration,
    // even if the request was not cachable.
    u.always(request, function(responseOrError) {
      cache.expire(responseOrError.expireCache ?? false, { except: request })
      cache.evict(responseOrError.evictCache ?? false, { except: request })

      let isResponse = responseOrError instanceof up.Response
      let isNetworkError = !isResponse
      let isSuccessResponse = isResponse && responseOrError.ok
      let isErrorResponse = isResponse && !responseOrError.ok
      let isEmptyResponse = isResponse && responseOrError.none
      let redirectRequest = isResponse && responseOrError.redirectRequest

      if (isErrorResponse) {
        // Evict an earlier cache entry with a successful response (as we now know a better state, even if that state is an error page).
        cache.evict(request.url)
      } else if (isNetworkError || isEmptyResponse) {
        // Only evict this one request instance in case we put it into the cache at the start of this function.
        // We keep other requests for the same URL but with a different { cacheRoute } (due to Vary).
        cache.evict(request)
      } else if (isSuccessResponse) {
        if (cache.get(request)) {
          // We now re-put the request into the cache, regardless of its { cache } setting, for multiple reasons:
          //
          // (1) In case we evicted the entire cache above, we must re-cache a cacheable request.
          // (2) An un-cacheable request should still update an existing cache entry
          //     (written by a earlier, cacheable request with the same cache key)
          //     since the later response will be fresher.
          // (3) Now that we have a response the cache needs to be updated with Vary info.
          cache.put(request)
        }

        if (redirectRequest && (redirectRequest.willCache() || cache.get(redirectRequest))) {
          // (1) If GET /foo redirected to GET /bar, both /foo and /bar should yield the cached response.
          // (2) If POST /foo redirected to GET /bar, we should now cache GET /bar (although we didn't cache POST /foo)
          // (3) If POST /foo redirected to GET /bar without caching, but /bar was already cached, update cache for /bar
          cache.put(redirectRequest)
        }
      }
    })
  }

  /*-
  Returns whether Unpoly is currently loading a [request](/up.request).

  The network is also considered busy while requests are [loading in the background](/up.request#options.background).

  @function up.network.isBusy
  @return {boolean}
    Whether a request is loading.
  @stable
  */
  function isBusy() {
    return queue.isBusy()
  }

  /*-
  Makes a full-page request, replacing the entire browser environment with a new page from the server response.

  Aborts all pending requests.

  Also see `up.Request#loadPage()`.

  @function up.network.loadPage
  @param {string} options.url
    The URL to load as a full page.
  @param options.method
    @like up.render
  @param options.params
    @like up.render
  @experimental
  */
  function loadPage(requestsAttrs) {
    new up.Request(requestsAttrs).loadPage()
  }

  /*-
  Aborts pending [requests](/up.request) matching a condition.

  > [important]
  > This is a low-level API matching requests by their properties. If possible, use `up.fragment.abort()`,
  > which matches requests by screen region. Only when requests are aborted by screen region, components
  > can [react to being aborted](/up:fragment:aborted).

  [Aborting requests](/aborting-requests){:.article-ref}

  ## Effects of aborting

  When an `up.request()` is aborted, its returned promise rejects with an `up.AbortError`:

  ```js
  try {
    let response = await up.request('/path')
    console.log(response.text)
  } catch (error) {
    if (error instanceof up.AbortError) {
      console.log('Request was aborted: ' + error.reason)
    }
  }
  ```

  Also the event `up:request:aborted` will be emitted.
  The region-specific event `up:fragment:aborted` will *not* be emitted by this function.
  For this use `up.fragment.abort()` instead.

  ## Aborting all requests

  Without arguments, this will abort all pending requests:

  ```js
  up.network.abort()
  ```

  ## Aborting a single request

  To abort a given `up.Request` object, pass it as the first argument:

  ```js
  let request = up.request('/path')
  up.network.abort(request)
  ```

  ## Aborting requests matching a pattern

  To abort all requests matching an [URL pattern](/url-patterns), pass it as the first argument:

  ```js
  up.network.abort('/path/*')
  ```

  ## Aborting requests matching an arbitrary condition

  To abort all requests matching an arbitrary condition, pass a function that takes a request
  and returns a boolean value. Unpoly will abort all request for which the given
  function returns `true`. E.g. to abort all requests with a HTTP method as `GET`:

  ```js
  up.network.abort((request) => request.method == 'GET')
  ```

  ## Aborting requests targeting a fragment or layer

  Use `up.fragment.abort()`.

  @function up.network.abort
  @param {string|Function(up.Request): boolean|up.Request|boolean} [condition=true]
    A condition that controls which requests to abort.

    If set to a string, it is interpreted as a [URL pattern](/url-patterns). All requests
    matching that pattern will be aborted.

    If set to an `up.Request` object, that one request is aborted.

    If set to a function, it will be called for each pending requests.
    All requests for which the function returns `true` will be aborted.

    If set to `true`, all pending requests are aborted.
  @param {string} [options.reason]
    A reason for why the request was aborted.

    If omitted, a generic reason like `"Aborted request to GET /path"` will be used.

    The reason will be set as the `up.AbortError`'s message.
  @param {up.Request} [options.except]
    An `up.Request` that should not be aborted even if it matches the given `condition`.

    @experimental
  @stable
  */
  function abortRequests(...args) {
    up.migrate.preprocessAbortArgs?.(args)
    queue.abort(...args)
  }

  /*-
  This event is [emitted](/up.emit) when an [AJAX request](/up.request)
  was [aborted](/aborting-requests).

  The event is emitted on the layer that caused the request.

  Also see `up:fragment:aborted`.

  @event up:request:aborted

  @param {up.Request} event.request
    The aborted request.

  @param {up.Layer} [event.layer]
    The [layer](/up.layer) this request is associated with.

    If this request was intended to update an existing fragment, this is that fragment's layer.

    If this request was intended to [open an overlay](/opening-overlays),
    the associated layer is the future overlay's parent layer.

  @param {Element} [event.origin]
    The link or form element that caused the request.

  @param event.preventDefault()

  @experimental
  */

  /*-
  This event is [emitted](/up.emit) when [AJAX requests](/up.request)
  are taking long to finish loading.

  [Slow server responses](/network-issues#slow-server-responses){:.article-ref}

  ## Timing

  By default Unpoly will wait 400 ms for an AJAX request to finish
  before emitting `up:network:late`. You may [globally](/up.network.config#config.lateDelay),
  for [individual links](/up-follow#up-late-delay) or [specific requests](/up.request#options.lateDelay).

  Once all responses have been received, an [`up:network:recover`](/up:network:recover)
  will be emitted.

  If additional requests are made while Unpoly is already busy waiting,
  **no** additional `up:network:late` events will be emitted.

  ## Default behavior

  By default, Unpoly will show a [Progress bar](/progress-bar) while late requests
  are pending. You can [disable](/progress-bar#disabling) the progress bar
  or [implement custom loading indicators](/progress-bar#custom-implementation).

  @event up:network:late
  @stable
  */

  /*-
  This event is [emitted](/up.emit) when [AJAX requests](/up.request)
  have [taken long to finish](/up:network:late), but have finished now.

  [Slow server responses](/network-issues#slow-server-responses){:.article-ref}

  @event up:network:recover
  @stable
  */

  /*-
  This event is [emitted](/up.emit) before an [AJAX request](/up.request)
  is sent over the network.

  Only requests that are sent via Unpoly features
  (like `[up-follow]` or `up.request()`) will trigger this event.
  When making a requests using `fetch()` or `XMLHttpRequest`, no event is emitted.

  The event is emitted on the layer that caused the request.

  ## Changing requests before loading {#changing-requests}

  Listeners to `up:request:load` can inspect or
  mutate the [request options](/up.request#parameters-request)
  before it is loaded.

  For example, this listeners changes requests to `/stocks`
  to include a custom header and have a timeout of 10 seconds:

  ```js
  up.on('up:request:load', (event) => {
    if (event.request.url === '/stocks') {
      event.request.headers['X-Client-Time'] = Date.now().toString()
      event.request.timeout = 10_000
    }
  })
  ```

  @event up:request:load
  @param {up.Request} event.request
    The request that will be sent.

    Listeners can [inspect or mutate request options](#changing-requests) before it is sent.
  @param {up.Layer} [event.layer]
    The [layer](/up.layer) this request is associated with.

    If this request is intended to update an existing fragment, this is that fragment's layer.

    If this request is intended to [open an overlay](/opening-overlays),
    the associated layer is the future overlay's parent layer.
  @param {Element} [event.origin]
    The link or form element that caused the request.
  @param event.preventDefault()
    [Aborts](/up.Request.prototype.abort) the request before it is sent.
  @stable
  */

  /*-
  This event is [emitted](/up.emit) when the response to an [AJAX request](/up.request)
  has been received.

  Note that this event will also be emitted when the server signals an
  error with an HTTP status like `500`. Only if the request
  encounters a fatal error (like a loss of network connectivity),
  `up:request:offline` is emitted instead.

  The event is emitted on the layer that caused the request.

  > [tip]
  > If you're looking to influence a render pass after a server response,
  > use `up:fragment:loaded` instead.

  @event up:request:loaded

  @param {up.Request} event.request
    The request.

  @param {up.Response} event.response
    The response that was received from the server.

  @param {up.Layer} [event.layer]
    The [layer](/up.layer) this request is associated with.

    If this request is intended to update an existing fragment, this is that fragment's layer.

    If this request is intended to [open an overlay](/opening-overlays),
    the associated layer is the future overlay's parent layer.

  @param {Element} [event.origin]
    The link or form element that caused the request.

  @stable
  */

  /*-
  This event is [emitted](/up.emit) when an [AJAX request](/up.request)
  encounters a fatal error, like a [timeout](/up.network.config#config.timeout) or loss of network connectivity.

  > [NOTE]
  > This event will *not* be emitted when the server produces an
  > error message with an HTTP status like `500`. When the server can produce
  > any response, [`up:request:loaded`](/up:request:loaded) is emitted instead.

  The event is emitted on the layer that caused the request.

  To effectively [handle disconnects while rendering](/network-issues#disconnects), use the `up:fragment:offline` event instead.

  @event up:request:offline

  @param {up.Request} event.request
    The failed request.

  @param {up.Layer} [event.layer]
    The [layer](/up.layer) this request is associated with.

    If this request was intended to update an existing fragment, this is that fragment's layer.

    If this request was intended to [open an overlay](/opening-overlays),
    the associated layer is the future overlay's parent layer.

  @param {Element} [event.origin]
    The link or form element that caused the request.

  @stable
  */

  function isSafeMethod(method) {
    return u.contains(['GET', 'OPTIONS', 'HEAD'], u.normalizeMethod(method))
  }

  function onLate() {
    if (u.evalOption(config.progressBar)) {
      progressBar = new up.ProgressBar()
    }
  }

  function onRecover() {
    progressBar?.conclude()
  }

  up.on('up:network:late', onLate)
  up.on('up:network:recover', onRecover)
  up.on('up:framework:reset', reset)

  return {
    request: makeRequest,
    // buildRequest,
    // processRequest,
    cache,
    isBusy,
    isSafeMethod,
    config,
    abort: abortRequests,
    queue, // for testing
    loadPage,
  }
})()

up.request = up.network.request

up.cache = up.network.cache
