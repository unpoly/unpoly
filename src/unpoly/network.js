require('./network.sass')

const u = up.util
const e = up.element

/*-
Network requests
================

Unpoly ships with an optimized HTTP client for fast and effective
communication with your server-side app.

While you can use the browser's native `fetch()` function,
Unpoly's `up.request()` has a number of convenience features:

- Requests may be [cached](/up.request#options.cache) to reuse responses and enable [preloading](/a-up-preload).
- Requests send [additional HTTP headers](/up.protocol) that the server may use to optimize its response.
  For example, when updating a [fragment](/up.fragment), the fragment's selector is automatically sent
  as an `X-Up-Target` header. The server may choose to only render the targeted fragment.
- Useful events like `up:request:loaded` or `up:request:late` are emitted throughout the request/response
  lifecycle.
- When too many requests are sent concurrently, excessive requests are [queued](/up.network.config#config.concurrency).
  This prevents exhausting the user's bandwidth and limits race conditions in end-to-end tests.
- A very concise API requiring zero boilerplate code.

@see up.request
@see up.Response
@see up:request:late

@module up.network
*/
up.network = (function() {

  /*-
  Sets default options for this package.

  @property up.network.config

  @param {number} [config.concurrency=4]
    The maximum number of concurrently loading requests.

    Additional requests are queued. [Preload](/a-up-preload) requests are
    always queued behind non-preload requests.

    You might find it useful to set the request concurrency `1` in end-to-end tests
    to prevent race conditions.

    Note that your browser might impose its own request limit
    regardless of what you configure here.

  @param {boolean} [config.wrapMethod]
    Whether to wrap non-standard HTTP methods in a POST request.

    If this is set, methods other than GET and POST will be converted to a `POST` request
    and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

    If you disable method wrapping, make sure that your server always redirects with
    with a 303 status code (rather than 302).

  @param {number} [config.cacheSize=70]
    The maximum number of responses to cache.

    If the size is exceeded, the oldest responses will be dropped from the cache.

  @param {number} [config.cacheExpiry=300000]
    The number of milliseconds until a cached response expires.

    Defaults to 5 minutes.

  @param {number} [config.badDownlink=0.6]
    The connection's minimum effective bandwidth estimate required
    to prevent Unpoly from [reducing requests](/up.network.shouldReduceRequests).

    The value is given in megabits per second. Higher is better.

  @param {number} [config.badRTT=0.6]
    The connection's maximum effective round-trip time required
    to prevent Unpoly from [reducing requests](/up.network.shouldReduceRequests).

    The value is given in milliseconds. Lower is better.

  @param {number} [config.badResponseTime=400]
    How long the proxy waits until emitting the [`up:request:late` event](/up:request:late).

    Requests exceeding this response time will also cause a [progress bar](/up.network.config#config.progressBar)
    to appear at the top edge of the screen.

    This metric is *not* considered for the decision to
    [reduce requests](/up.network.shouldReduceRequests).

    The value is given in milliseconds.

  @param {Function(up.Request): boolean} [config.autoCache]
    Whether to cache the given request with `{ cache: 'auto' }`.

    By default Unpoly will auto-cache requests with safe HTTP methods.

  @param {Function(up.Request, up.Response)} config.clearCache
    Whether to [clear the cache](/up.cache.clear) after the given request and response.

    By default Unpoly will clear the entire cache after a request with an unsafe HTTP method.

  @param {Array<string>|Function(up.Request): Array<string>} [config.requestMetaKeys]
    An array of request property names
    that are sent to the server as [HTTP headers](/up.protocol).

    The server may return an optimized response based on these properties,
    e.g. by omitting a navigation bar that is not targeted.

    ### Cacheability considerations

    Two requests with different `requestMetaKeys` are considered cache misses when [caching](/up.request) and
    [preloading](/a-up-preload). To **improve cacheability**, you may set
    `up.network.config.requestMetaKeys` to a shorter list of property keys.

    ### Available fields

    The default configuration is `['target', 'failTarget', 'mode', 'failMode', 'context', 'failContext']`.
    This means the following properties are sent to the server:

    | Request property         | Request header      |
    |--------------------------|---------------------|
    | `up.Request#target`      | `X-Up-Target`       |
    | `up.Request#failTarget`  | `X-Up-Fail-Target`  |
    | `up.Request#context`     | `X-Up-Context`      |
    | `up.Request#failContext` | `X-Up-Fail-Context` |
    | `up.Request#mode`        | `X-Up-Mode`         |
    | `up.Request#failMode`    | `X-Up-Fail-Mode`    |

    ### Per-route configuration

    You may also configure a function that accepts an [`up.Request`](/up.Request) and returns
    an array of request property names that are sent to the server.

    With this you may send different request properties for different URLs:

    ```javascript
    up.network.config.requestMetaKeys = function(request) {
      if (request.url == '/search') {
        // The server optimizes responses on the /search route.
        return ['target', 'failTarget']
      } else {
        // The server doesn't optimize any other route,
        // so configure maximum cacheability.
        return []
      }
    }

  @param {boolean|Function(): boolean} [config.progressBar]
    Whether to show a progress bar for [late requests](/up:request:late).

    The progress bar is implemented as a single `<up-progress-bar>` element.
    Unpoly will automatically insert and remove this element as requests
    are [late](/up:request:late) or [recovered](/up:request:recover).

    The default appearance is a simple blue bar at the top edge of the screen.
    You may customize the style using CSS:

    ```css
    up-progress-bar {
      background-color: red;
    }
    ```

  @stable
  */
  const config = new up.Config(() => ({
    concurrency: 4,
    wrapMethod: true,
    cacheSize: 70,
    cacheExpiry: 1000 * 60 * 5,
    badDownlink: 0.6,
    badRTT: 750,
    badResponseTime: 400,

    // 2G 66th percentile: RTT >= 1400 ms, downlink <=  70 Kbps
    // 3G 50th percentile: RTT >=  270 ms, downlink <= 700 Kbps
    autoCache(request) { return request.isSafe(); },

    clearCache(request, _response) { return !request.isSafe(); },
    requestMetaKeys: ['target', 'failTarget', 'mode', 'failMode', 'context', 'failContext'],
    progressBar: true
  }))

  const queue = new up.Request.Queue()

  const cache = new up.Request.Cache()

  let progressBar = null

  /*-
  Returns an earlier request [matching](/up.network.config#config.requestMetaKeys) the given request options.

  Returns `undefined` if the given request is not currently cached.

  Note that `up.request()` will only write to the cache with `{ cache: true }`.

  ### Example

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

    The user may configure `up.network.config.requestMetaKeys` to define
    which request options are relevant for cache matching.
  @return {up.Request|undefined}
    The cached request.
  @experimental
  */

  /*-
  Removes all [cache](/up.request#caching) entries.

  To only remove some cache entries, pass a [URL pattern](/url-patterns):

  ```js
  up.cache.clear('/users/*')
  ```

  ### Other reasons the cache may clear

  By default Unpoly automatically clears the entire cache whenever it processes
  a request with an non-GET HTTP method. To customize this rule, use `up.network.config.clearCache`.

  The server may also clear the cache by sending an [`X-Up-Clear-Cache`](/X-Up-Clear-Cache) header.

  @function up.cache.clear
  @param {string} [pattern]
    A [URL pattern](/url-patterns) matching cache entries that should be cleared.

    If omitted, the entire cache is cleared.
  @stable
  */

  /*-
  Makes the cache assume that `newRequest` has the same response as the
  already cached `oldRequest`.

  Unpoly uses this internally when the user redirects from `/old` to `/new`.
  In that case, both `/old` and `/new` will cache the same response from `/new`.

  @function up.cache.alias
  @param {Object} oldRequest
    The earlier [request options](/up.request).
  @param {Object} newRequest
    The new [request options](/up.request).
  @experimental
  */

  /*-
  Manually stores a request in the cache.

  Future calls to `up.request()` will try to re-use this request before
  making a new request.

  @function up.cache.set
  @param {string} request.url
  @param {string} [request.method='GET']
  @param {string} [request.target='body']
  @param {up.Request} request
    The request to cache. The cache is also a promise for the response.
  @internal
  */

  /*-
  Manually removes the given request from the cache.

  You can also [configure](/up.network.config) when
  cache entries expire automatically.

  @function up.cache.remove
  @param {Object} requestOptions
    The request options for which to remove cached requests.

    See `options` for `up.request()` for documentation.
  @experimental
  */

  function reset() {
    abortRequests()
    queue.reset()
    config.reset()
    cache.clear()
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

  You may cache responses by passing a `{ cache }` option. Responses for a cached
  request will resolve instantly.

  By default the cache cleared after making a request with an unsafe HTTP method.

  You can configure caching with the [`up.network.config`](/up.network.config) property.

  @function up.request

  @param {string} [url]
    The URL for the request.

    Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.

  @param {string} [options.url]
    The URL for the request.

  @param {string} [options.method='GET']
    The HTTP method for the request.

  @param {Object|up.Params|string|Array} [options.params={}]
    [Parameters](/up.Params) that should be sent as the request's
    [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

    When making a `GET` request to a URL with a query string, the given `{ params }` will be added
    to the query parameters.

  @param {boolean} [options.cache=false]
    Whether to read from and write to the [cache](/up.request#caching).

    With `{ cache: true }` Unpoly will try to re-use a cached response before connecting
    to the network. If no cached response exists, Unpoly will make a request and cache
    the server response.

    With `{ cache: 'auto' }` Unpoly will use the cache only if `up.network.config.autoCache`
    returns `true` for this request.

    With `{ cache: false }` (the default) Unpoly will always make a network request.

  @param {boolean|string} [options.clearCache]
    Whether to [clear](/up.cache.clear) the [cache](/up.cache.get) after this request.

    Defaults to the result of `up.network.config.clearCache`, which
    defaults to clearing the entire cache after a non-GET request.

    You may also pass a [URL pattern](/url-patterns) to only uncache matching responses.

  @param {boolean|string|Function} [options.solo]
    With `{ solo: true }` Unpoly will [abort](/up.network.abort) all other requests before making this new request.

    To only abort some requests, pass an [URL pattern](/url-patterns) that matches requests to abort.
    You may also pass a function that accepts an existing `up.Request` and returns a boolean value.

  @param {Object} [options.headers={}]
    An object of additional HTTP headers.

    Note that Unpoly will by default send a number of custom request headers.
    See `up.protocol` and `up.network.config.requestMetaKeys` for details.

  @param {boolean} [options.wrapMethod]
    Whether to wrap non-standard HTTP methods in a POST request.

    If this is set, methods other than GET and POST will be converted to a `POST` request
    and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

    Defaults to [`up.network.config`](/up.network.config#config.wrapMethod).

  @param {string} [options.timeout]
    A timeout in milliseconds.

    If the request is queued due to [many concurrent requests](/up.network.config#config.concurrency),
    the timeout will not include the time spent waiting in the queue.

  @param {string} [options.target='body']
    The CSS selector that will be sent as an `X-Up-Target` header.

  @param {string} [options.failTarget='body']
    The CSS selector that will be sent as an `X-Up-Fail-Target` header.

  @param {string} [options.layer='current']
    The [layer](/up.layer) this request is associated with.

    If this request is intended to update an existing fragment, this is that fragment's layer.

    If this request is intended to [open an overlay](/opening-overlays),
    the associated layer is the future overlay's parent layer.

  @param {string} [options.failLayer='current']
    The [layer](/up.layer) this request is associated with if the server [sends a HTTP status code](/server-errors).

  @param {Element} [options.origin]
    The DOM element that caused this request to be sent, e.g. a hyperlink or form element.

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

  @return {up.Request}
    An object with information about the request.

    The request object is also a promise for its `up.Response`.

  @stable
  */
  function makeRequest(...args) {
    const request = new up.Request(parseRequestOptions(args))

    useCachedRequest(request) || queueRequest(request)

    handleSolo(request)

    return request
  }

  function mimicLocalRequest(options) {
    handleSolo(options)

    // We cannot consult config.clearCache since there is no up.Request
    // for a local update.
    let clearCache = options.clearCache
    if (clearCache) {
      cache.clear(clearCache)
    }
  }

  function handleSolo(requestOrOptions) {
    let solo = requestOrOptions.solo
    if (solo && isBusy()) {
      up.puts('up.request()', 'Change with { solo } option will abort other requests')
      if (solo === 'subtree') {
        abortSubtree(requestOrOptions.targetElements, requestOrOptions)
      } else if (requestOrOptions instanceof up.Request) {
        queue.abortExcept(requestOrOptions, solo)
      } else {
        abortRequests(solo)
      }
    }
  }

  function parseRequestOptions(args) {
    const options = u.extractOptions(args)
    if (!options.url) { options.url = args[0]; }
    up.migrate.handleRequestOptions?.(options)
    return options
  }

  function useCachedRequest(request) {
    // If we have an existing promise matching this new request,
    // we use it unless `request.cache` is explicitly set to `false`.
    let cachedRequest
    if (request.willCache() && (cachedRequest = cache.get(request))) {
      up.puts('up.request()', 'Re-using previous request to %s %s', request.method, request.url)

      // Check if we need to upgrade a cached background request to a foreground request.
      // This might affect whether we're going to emit an up:request:late event further
      // down. Consider this case:
      //
      // - User preloads a request (1). We have a cache miss and connect to the network.
      //   This will never trigger `up:request:late`, because we only track foreground requests.
      // - User loads the same request (2) in the foreground (no preloading).
      //   We have a cache hit and receive the earlier request that is still preloading.
      //   Now we *should* trigger `up:request:late`.
      // - The request (1) finishes. This triggers `up:request:recover`.
      if (!request.preload) {
        queue.promoteToForeground(cachedRequest)
      }

      // We cannot simply return `cachedRequest`, since that might have a different #hash property.
      // While two requests with a different #hash have the same cache key, they are
      // not the same object.
      //
      // What we do instead is have `request` follow the state of `cachedRequest`'s exchange.
      request.followState(cachedRequest)
      return true
    }
  }

  // If no existing promise is available, we queue a network request.
  function queueRequest(request) {
    if (request.preload && !request.isSafe()) {
      up.fail('Will not preload request to %s', request.description)
    }

    handleCaching(request)

    queue.asap(request)

    return true
  }

  function handleCaching(request) {
    if (request.willCache()) {
      // Cache the request for calls for calls with the same URL, method, params
      // and target. See up.Request#cacheKey().
      cache.set(request, request)
    }

    return u.always(request, function(response) {
      // Three places can request the cache to be cleared or kept:
      // (1) The server via X-Up-Clear-Cache header, found in response.clearCache
      // (2) The interaction via { clearCache } option, found in request.clearCache
      // (3) The default in up.network.config.clearCache({ request, response })
      let clearCache = response.clearCache ?? request.clearCache ?? config.clearCache(request, response)
      if (clearCache) {
        cache.clear(clearCache)
      }

      // (1) Re-cache a cacheable request in case we cleared the cache above
      // (2) An un-cacheable request should still update an existing cache entry
      //     (written by a earlier, cacheable request with the same cache key)
      //     since the later response will be fresher.
      if (request.willCache() || cache.get(request)) {
        cache.set(request, request)
      }

      if (!response.ok) {
        // Uncache failed requests. We have no control over the server,
        // and another request with the same properties might succeed.
        cache.remove(request)
      }
    })
  }

  /*-
  Returns whether Unpoly is currently waiting for a [request](/up.request) to finish.

  @function up.network.isBusy
  @return {boolean}
  @stable
  */
  function isBusy() {
    return queue.isBusy()
  }

  /*-
   Returns whether Unpoly is *not* currently waiting for a [request](/up.request) to finish.

   @function up.network.isIdle
   @return {boolean}
   @stable
   */
  const isIdle = u.negate(isBusy)

  /*-
  Makes a full-page request, replacing the entire browser environment with a new page from the server response.

  Also see `up.Request#loadPage()`.

  @function up.network.loadPage
  @param {string} options.url
    The URL to load.
  @param {string} [options.method='get']
    The method for the request.

    Methods other than GET or POST will be [wrapped](/up.protocol.config#config.methodParam) in a POST request.
  @param {Object|Array|FormData|string} [options.params]
  @experimental
  */
  function loadPage(requestsAttrs) {
    new up.Request(requestsAttrs).loadPage()
  }

  /*-
  Returns whether optional requests should be avoided where possible.

  We assume the user wants to avoid requests if either of following applies:

  - The user has enabled data saving in their browser ("Lite Mode" in Chrome for Android).
  - The connection's effective round-trip time is longer than `up.network.config.badRTT`.
  - The connection's effective bandwidth estimate is less than `up.network.config.badDownlink`.

  By default Unpoly will disable [preloading](/a-up-preload) and [polling](/up-poll) if requests
  should be avoided.

  @function up.network.shouldReduceRequests
  @return {boolean}
    Whether requests should be avoided where possible.
  @experimental
  */
  function shouldReduceRequests() {
    // Browser support for navigator.connection: https://caniuse.com/?search=networkinformation
    let netInfo = navigator.connection
    if (netInfo) {
      // API for NetworkInformation#downlink: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/downlink
      // API for NetworkInformation#rtt:      https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/rtt
      // API for NetworkInformation#saveData: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData
      return netInfo.saveData ||
        (netInfo.rtt      && (netInfo.rtt      > config.badRTT)) ||
        (netInfo.downlink && (netInfo.downlink < config.badDownlink))
    }
  }

  /*-
  Aborts pending [requests](/up.request).

  The event `up:request:aborted` will be emitted.

  The promise returned by `up.request()` will be rejected with an exception named `AbortError`:

      try {
        let response = await up.request('/path')
        console.log(response.text)
      } catch (err) {
        if (err.name == 'AbortError') {
          console.log('Request was aborted')
        }
      }

  ### Examples

  Without arguments, this will abort all pending requests:

  ```js
  up.network.abort()
  ```

  To abort a given `up.Request` object, pass it as the first argument:

  ```js
  let request = up.request('/path')
  up.network.abort(request)
  ```

  To abort all requests matching a condition, pass a function that takes a request
  and returns a boolean value. Unpoly will abort all request for which the given
  function returns `true`. E.g. to abort all requests with a HTTP method as `GET`:

  ```js
  up.network.abort((request) => request.method == 'GET')
  ```

  @function up.network.abort
  @param {up.Request|boolean|Function(up.Request): boolean} [matcher=true]
    If this argument is omitted, all pending requests are aborted.
  @stable
  */
  function abortRequests(...args) {
    queue.abort(...args)
  }

  /*-
  Aborts other requests targeting the given element or its descendants.

  @function up.network.abortSubtree
  @param {Element} element
  @experimental
  */
  function abortSubtree(elements, excusedRequest) {
    const testFn = (request) => request.isPartOfSubtree(elements)
    const reason = 'Another fragment update targeted the same element'
    queue.abortExcept(excusedRequest, testFn, reason)
  }

  /*-
  This event is [emitted](/up.emit) when an [AJAX request](/up.request)
  was [aborted](/up.network.abort).

  The event is emitted on the layer that caused the request.

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
  are taking long to finish.

  By default Unpoly will wait 400 ms for an AJAX request to finish
  before emitting `up:request:late`. You may configure this delay like this:

  ```js
  up.network.config.badResponseTime = 1000 // milliseconds
  ```

  Once all responses have been received, an [`up:request:recover`](/up:request:recover)
  will be emitted.

  Note that if additional requests are made while Unpoly is already busy
  waiting, **no** additional `up:request:late` events will be triggered.

  ### Loading indicators

  By default the `up:request:late` event will cause a [progress bar](/up.network.config#config.progressBar)
  to appear at the top edge of the screen.

  If you don't like the default progress bar, you can [listen](/up.on) to the `up:request:late`
  and [`up:request:recover`](/up:request:recover) events to implement a custom
  loading indicator that appears during long-running requests.

  To build a custom loading indicator, please an element like this in your application layout:

  ```html
  <loading-indicator>Please wait!</loading-indicator>
  ```

  Now add a [compiler](/up.compiler) that hides the `<loading-indicator>` element
  while there are no long-running requests:

  ```js
  // Disable the default progress bar
  up.network.config.progressBar = false

  up.compiler('loading-indicator', function(indicator) {
    function show() { up.element.show(indicator) }
    function hide() { up.element.hide(indicator) }

    hide()

    return [
      up.on('up:request:late', show),
      up.on('up:request:recover', hide)
    ]
  })
  ```

  @event up:request:late
  @stable
  */

  /*-
  This event is [emitted](/up.emit) when [AJAX requests](/up.request)
  have [taken long to finish](/up:request:late), but have finished now.

  See [`up:request:late`](/up:request:late) for more documentation on
  how to use this event for implementing a spinner that shows during
  long-running requests.

  @event up:request:recover
  @stable
  */

  /*-
  This event is [emitted](/up.emit) before an [AJAX request](/up.request)
  is sent over the network.

  The event is emitted on the layer that caused the request.

  @event up:request:load
  @param {up.Request} event.request
    The request to be sent.
  @param {up.Layer} [event.layer]
    The [layer](/up.layer) this request is associated with.

    If this request is intended to update an existing fragment, this is that fragment's layer.

    If this request is intended to [open an overlay](/opening-overlays),
    the associated layer is the future overlay's parent layer.
  @param {Element} [event.origin]
    The link or form element that caused the request.
  @param event.preventDefault()
    Event listeners may call this method to prevent the request from being sent.
  @stable
  */

  function registerAliasForRedirect(request, response) {
    if (request.cache && response.url && request.url !== response.url) {
      const newRequest = request.variant({
        method: response.method,
        url: response.url
      })
      cache.alias(request, newRequest)
    }
  }

  /*-
  This event is [emitted](/up.emit) when the response to an [AJAX request](/up.request)
  has been received.

  Note that this event will also be emitted when the server signals an
  error with an HTTP status like `500`. Only if the request
  encounters a fatal error (like a loss of network connectivity),
  [`up:request:fatal`](/up:request:fatal) is emitted instead.

  The event is emitted on the layer that caused the request.

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
  encounters fatal error like a timeout or loss of network connectivity.

  Note that this event will *not* be emitted when the server produces an
  error message with an HTTP status like `500`. When the server can produce
  any response, [`up:request:loaded`](/up:request:loaded) is emitted instead.

  The event is emitted on the layer that caused the request.

  @event up:request:fatal

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

  up.on('up:request:late', onLate)
  up.on('up:request:recover', onRecover)
  up.on('up:framework:reset', reset)

  return {
    request: makeRequest,
    cache,
    isIdle,
    isBusy,
    isSafeMethod,
    config,
    abort: abortRequests,
    registerAliasForRedirect,
    queue, // for testing
    shouldReduceRequests,
    mimicLocalRequest,
    loadPage,
    abortSubtree,
    handleSolo
  }
})()

up.request = up.network.request

up.cache = up.network.cache
