u = up.util

###**
AJAX acceleration
=================

Unpoly comes with a number of tricks to shorten the latency between browser and server.

\#\#\# Server responses are cached by default

Unpoly caches server responses for a few minutes,
making requests to these URLs return instantly.
All Unpoly functions and selectors go through this cache, unless
you explicitly pass a `{ cache: false }` option or set an `up-cache="false"` attribute.

The cache holds up to 50 responses for 5 minutes. You can configure the cache size and expiry using
[`up.network.config`](/up.network.config), or clear the cache manually using [`up.cache.clear()`](/up.cache.clear).

Also the entire cache is cleared with every non-`GET` request (like `POST` or `PUT`).

If you need to make cache-aware requests from your [custom JavaScript](/up.syntax),
use [`up.request()`](/up.request).

\#\#\# Preloading links

Unpoly also lets you speed up reaction times by [preloading
links](/a-up-preload) when the user hovers over the click area (or puts the mouse/finger
down). This way the response will already be cached when
the user releases the mouse/finger.

\#\#\# Spinners

You can listen to the [`up:request:late`](/up:request:late) event to implement a spinner
that appears during a long-running request.

\#\#\# More acceleration

Other Unpoly modules contain even more tricks to outsmart network latency:

- [Instantaneous feedback for links that are currently loading](/a.up-active)
- [Follow links on `mousedown` instead of `click`](/a-up-instant)

@module up.request
###
up.network = do ->
  ###**
  @property up.network.config
  @param {number} [config.preloadDelay=75]
    The number of milliseconds to wait before [`[up-preload]`](/a-up-preload)
    starts preloading.
  @param {number} [config.cacheSize=50]
    The maximum number of responses to cache.
    If the size is exceeded, the oldest items will be dropped from the cache.
  @param {number} [config.cacheExpiry=300000]
    The number of milliseconds until a cache entry expires.
    Defaults to 5 minutes.
  @param {number} [config.badResponseTime=300]
    How long the proxy waits until emitting the [`up:request:late` event](/up:request:late).
    Use this to prevent flickering of spinners.
  @param {number} [config.concurrency=4]
    The maximum number of concurrent active requests.

    Additional requests are queued. [Preload](/up.network.preload) requests are
    always queued behind non-preload requests.

    You might find it useful to set the request concurrency `1` in full-stack
    integration tests (e.g. Selenium) to prevent race conditions.

    Note that your browser might [impose its own request limit](http://www.browserscope.org/?category=network)
    regardless of what you configure here.
  @param {boolean} [config.wrapMethod]
    Whether to wrap non-standard HTTP methods in a POST request.

    If this is set, methods other than GET and POST will be converted to a `POST` request
    and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

    If you disable method wrapping, make sure that your server always redirects with
    with a 303 status code (rather than 302).
  @param {boolean|string} [config.preloadEnabled='auto']
    Whether Unpoly will load [preload requests](/up.network.preload).

    With the default setting (`"auto"`) Unpoly will load preload requests
    unless `up.network.shouldReduceRequests()` detects a poor connection.

    If set to `true`, Unpoly will always load preload requests.

    If set to `false`, Unpoly will automatically [abort](/up.network.abort) all preload requests.
  @param {number} [config.badDownlink=0.6]
    The connection's minimum effective bandwidth estimate required
    to [enable preloading](/up.network.config#config.preloadEnabled).

    The value is given in megabits per second.

    This setting is only honored if `up.network.config.preloadEnabled` is set to `'auto'` (the default).
  @param {number} [config.badRTT=0.6]
    The connection's maximum effective round-trip time required
    to [enable preloading](/up.network.config#config.preloadEnabled).

    The value is given in milliseconds.

    This setting is only honored if `up.network.config.preloadEnabled` is set to `'auto'` (the default).
  @param {Array<string>|Function(up.Request): Array<string>} [config.requestMetaKeys]
    An array of request property names
    that are sent to the server as [HTTP headers](/up.protocol).

    The server may return an optimized response based on these properties,
    e.g. by omitting a navigation bar that is not targeted.

    \#\#\# Cacheability considerations

    Two requests with different `requestMetaKeys` are considered cache misses when [caching](/up.request) and
    [preloading](/up.link.preload). To **improve cacheability**, you may set
    `up.network.config.requestMetaKeys` to a shorter list of property keys.

    \#\#\# Available fields

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

    \#\#\# Per-route configuration

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

  @stable
  ###
  config = new up.Config ->
    badResponseTime: 800
    cacheSize: 70
    cacheExpiry: 1000 * 60 * 5
    concurrency: 4
    wrapMethod: true
    preloadEnabled: 'auto' # true | false | 'auto'
    # 2G 66th percentile: RTT >= 1400 ms, downlink <=  70 Kbps
    # 3G 50th percentile: RTT >=  270 ms, downlink <= 700 Kbps
    badDownlink: 0.6
    badRTT: 750
    requestMetaKeys: ['target', 'failTarget', 'mode', 'failMode', 'context', 'failContext']
    clearCache: ({ request }) -> !request.isSafe()

  queue = new up.Request.Queue()

  cache = new up.Request.Cache()

  ###**
  Returns an earlier request [matching](/up.network.config.requestMetaKeys) the given request options.

  Returns `undefined` if the given request is not currently cached.

  Note that `up.request()` will only write to the cache with `{ cache: true }`.

  \#\#\# Example

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
  ###

  ###**
  Removes all [cache](/up.cache.get) entries.

  Unpoly also automatically clears the cache whenever it processes
  a request with an [unsafe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
  HTTP method like `POST`.

  The server may also clear the cache by sending an [`X-Up-Cache: clear`](/X-Up-Cache) header.

  @function up.cache.clear
  @stable
  ###

  ###**
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
  ###

  ###**
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
  ###

  ###**
  Manually removes the given request from the cache.

  You can also [configure](/up.network.config) when
  cache entries expire automatically.

  @function up.cache.remove
  @param {Object} requestOptions
    The request options for which to remove cached requests.

    See `options` for `up.request()` for documentation.
  @experimental
  ###

  reset = ->
    abortRequests()
    queue.reset()
    config.reset()
    cache.clear()

  ###**
  Makes an AJAX request to the given URL.

  Returns an `up.Request` object which contains information about the request.
  The request object is also a promise for its `up.Response`.

  \#\#\# Example

      let request = up.request('/search', { params: { query: 'sunshine' } })
      console.log('We made a request to', request.url)

      let response = await request
      console.log('The response text is', response.text)

  \#\#\# Error handling

  The returned promise will fulfill with an `up.Response` when the server
  responds with an HTTP status of 2xx (like `200`).

  When the server responds with an error code (like `422` or `500`), the promise
  will *reject* with `up.Response`.

  When the request fails from a fatal error (like a timeout or loss of connectivity),
  the promise will reject with an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object.

  Here is an example for a complete control flow that also handles errors:

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


  \#\#\# Caching

  When an `{ cache: true }` option is given, responses are cached.

  If requesting a URL with a non-`GET` method, the response will
  not be cached and the entire cache will be cleared.

  You can configure caching with the [`up.network.config`](/up.network.config) property.

  \#\#\# Events

  Multiple events may be emitted throughout the lifecycle of a request:

  - If a network connection is attempted,
    an `up:request:load` event is emitted.
  - When a response is received,
    an `up:request:loaded` event is emitted.
  - When the request fails from a fatal error like a timeout or loss of network connectivity,
    an `up:request:fatal` event is emitted.
  - When a request is [aborted](/up.network.abort),
    an `up:request:aborted` event is emitted.

  @function up.request
  @param {string} [url]
    The URL for the request.

    Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.
  @param {string} [options.url]
    You can omit the first string argument and pass the URL as
    a `request` property instead.
  @param {string} [options.method='GET']
    The HTTP method for the options.
  @param {boolean} [options.cache=false]
    Whether to use a cached response for [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    requests, if available. If set to `false` a network connection will always be attempted.
  @param {Object} [options.headers={}]
    An object of additional HTTP headers.
  @param {Object|FormData|string|Array} [options.params={}]
    [Parameters](/up.Params) that should be sent as the request's payload.
  @param {string} [options.timeout]
    A timeout in milliseconds.

    If `up.network.config.maxRequests` is set, the timeout
    will not include the time spent waiting in the queue.
  @param {string} [options.target='body']
    The CSS selector that will be sent as an `X-Up-Target` header.
  @param {string} [options.failTarget='body']
    The CSS selector that will be sent as an `X-Up-Fail-Target` header.
  @param {Element} [options.origin]
    The DOM element that caused this request to be sent, e.g. a hyperlink or form element.
  @param {Element} [options.contentType]
    The format in which to encode the request params.

    Allowed values are `application/x-www-form-urlencoded` and `multipart/form-data`.
    Only `multipart/form-data` can transport binary data.

    If this option is omitted Unpoly will prefer `application/x-www-form-urlencoded`,
    unless request params contains binary data.
  @return {up.Request}
    An object with information about the request.

    The request object is also a promise for its `up.Response`.
  @stable
  ###
  makeRequest = (args...) ->
    request = new up.Request(parseRequestOptions(args))
    request = useCachedRequest(request) || queueRequest(request)
    if solo = request.solo
      queue.abortExcept(request, solo)
    return request

  mimicLocalRequest = (options) ->
    if solo = options.solo
      abortRequests(solo)
    if clearCache = options.clearCache
      cache.clear(clearCache)

  preload = (args...) ->
    up.migrate.handleNetworkPreloadArgs?(args...)

    options = parseRequestOptions(args)
    options.preload = true
    # The constructor of up.Request will set { cache: true } when passed { preload: true }
    makeRequest(options)

  parseRequestOptions = (args) ->
    options = u.extractOptions(args)
    options.url ||= args[0]
    up.migrate.handleRequestOptions?(options)
    options

  useCachedRequest = (request) ->
    # If we have an existing promise matching this new request,
    # we use it unless `request.cache` is explicitly set to `false`.
    if request.cache && (cachedRequest = cache.get(request))
      up.puts('up.request()', 'Re-using previous request to %s %s', request.method, request.url)

      # Check if we need to upgrade a cached background request to a foreground request.
      # This might affect whether we're going to emit an up:request:late event further
      # down. Consider this case:
      #
      # - User preloads a request (1). We have a cache miss and connect to the network.
      #   This will never trigger `up:request:late`, because we only track foreground requests.
      # - User loads the same request (2) in the foreground (no preloading).
      #   We have a cache hit and receive the earlier request that is still preloading.
      #   Now we *should* trigger `up:request:late`.
      # - The request (1) finishes. This triggers `up:network:recover`.
      unless request.preload
        queue.promoteToForeground(cachedRequest)

      return cachedRequest

  # If no existing promise is available, we queue a network request.
  queueRequest = (request) ->
    if request.preload && !request.isSafe()
      up.fail('Will not preload a %o request (%o)', request.method, request)

    handleCaching(request)

    queue.asap(request)

    # The request is also a promise for its response.
    return request

  handleCaching = (request) ->
    if request.cache
      # Cache the request for calls for calls with the same URL, method, params
      # and target. See up.Request#cacheKey().
      cache.set(request, request)

    u.always request, (response) ->
      # Three places can request the cache to be cleared or kept:
      # (1) The server via X-Up-Clear-Cache header, found in response.clearCache
      # (2) The interaction via { clearCache } option, found in request.clearCache
      # (3) The default in up.network.config.clearCache({ request, response })

      if clearCache = (response.clearCache ? request.clearCache ? config.clearCache({ request, response }))
        cache.clear(clearCache)
        # Re-cache the request in case we just threw it out.
        if request.cache
          cache.set(request, request)

      unless response.ok
        # Uncache failed requests. We have no control over the server,
        # and another request with the same properties might succeed.
        cache.remove(request)

  ###**
  Returns whether Unpoly is not currently waiting for a [request](/up.request) to finish.

  @function up.network.isIdle
  @return {boolean}
  @stable
  ###
  isIdle = ->
    not isBusy()

  ###**
  Returns whether Unpoly is currently waiting for a [request](/up.request) to finish.

  @function up.network.isBusy
  @return {boolean}
  @stable
  ###
  isBusy = ->
    queue.isBusy()

  ###**
  Returns whether optional requests should be avoided where possible.

  We assume the user wants to avoid requests if either of following applies:

  - The user has enabled data saving in their browser ("Lite Mode" in Chrome for Android).
  - The connection's effective round-trip time is longer than `up.network.config.badRTT`.
  - The connection's effective bandwidth estimate is less than `up.network.config.badDownlink`.

  By default Unpoly will disable [preloading](/up-preload) or [polling](/up-poll) if requests
  should be avoided.

  @function up.network.shouldReduceRequests
  @return {boolean}
    Whether requests should be avoided where possible.
  @experimental
  ###
  shouldReduceRequests = ->
    # Browser support for navigator.connection: https://caniuse.com/?search=networkinformation
    if netInfo = navigator.connection
      # API for NetworkInformation#downlink: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/downlink
      # API for NetworkInformation#rtt:      https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/rtt
      # API for NetworkInformation#saveData: https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData
      return netInfo.saveData ||
        (netInfo.rtt      && netInfo.rtt      > config.badRTT) ||
        (netInfo.downlink && netInfo.downlink < config.badDownlink)

  shouldPreload = (request) ->
    setting = u.evalOption(config.preloadEnabled, request)
    if setting == 'auto'
      # Since connection.effectiveType might change during a session we need to
      # re-evaluate the value every time.
      return !shouldReduceRequests() && up.browser.canPushState()
    return setting

  ###**
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

  \#\#\# Examples

  Without arguments, this will abort all pending requests:

      up.network.abort()

  To abort a given `up.Request` object, pass it as the first argument:

      let request = up.request('/path')
      up.network.abort(request)

  To abort all requests matching a condition, pass a function that takes a request
  and returns a boolean value. Unpoly will abort all request for which the given
  function returns `true`. E.g. to abort all requests with a HTTP method as `GET`:

      up.network.abort((request) => request.method == 'GET')

  @function up.network.abort
  @param {up.Request|boolean|Function(up.Request): boolean} [matcher=true]
    If this argument is omitted, all pending requests are aborted.
  @stable
  ###
  abortRequests = (args...) ->
    queue.abort(args...)

  ###**
  This event is [emitted](/up.emit) when an [AJAX request](/up.request)
  was [aborted](/up.network.abort()).

  The event is emitted on the layer that caused the request.

  @event up:request:aborted
  @param {up.Request} event.request
    The aborted request.
  @param {up.Layer} [event.layer]
    The [layer](/up.layer) that caused the request.
  @param event.preventDefault()
  @experimental
  ###

  ###**
  This event is [emitted](/up.emit) when [AJAX requests](/up.request)
  are taking long to finish.

  By default Unpoly will wait 800 ms for an AJAX request to finish
  before emitting `up:request:late`. You can configure this time like this:

      up.network.config.badResponseTime = 400;

  Once all responses have been received, an [`up:network:recover`](/up:network:recover)
  will be emitted.

  Note that if additional requests are made while Unpoly is already busy
  waiting, **no** additional `up:request:late` events will be triggered.

  \#\#\# Spinners

  You can [listen](/up.on) to the `up:request:late`
  and [`up:network:recover`](/up:network:recover) events to implement a spinner
  that appears during a long-running request,
  and disappears once the response has been received:

      <div class="spinner">Please wait!</div>

  Here is the JavaScript to make it alive:

      up.compiler('.spinner', function(element) {
        show = () => { up.element.show(element) }
        hide = () => { up.element.hide(element) }

        hide()

        return [
          up.on('up:request:late', show),
          up.on('up:network:recover', hide)
        ]
      })

  The `up:request:late` event will be emitted after a delay
  to prevent the spinner from flickering on and off.
  You can change (or remove) this delay like this:

      up.network.config.badResponseTime = 400;

  @event up:request:late
  @stable
  ###

  ###**
  This event is [emitted](/up.emit) when [AJAX requests](/up.request)
  have [taken long to finish](/up:request:late), but have finished now.

  See [`up:request:late`](/up:request:late) for more documentation on
  how to use this event for implementing a spinner that shows during
  long-running requests.

  @event up:network:recover
  @stable
  ###

  ###**
  This event is [emitted](/up.emit) before an [AJAX request](/up.request)
  is sent over the network.

  The event is emitted on the layer that caused the request.

  @event up:request:load
  @param {up.Request} event.request
    The request to be sent.
  @param {up.Layer} [event.layer]
    The [layer](/up.layer) that caused the request.
  @param event.preventDefault()
    Event listeners may call this method to prevent the request from being sent.
  @stable
  ###

  registerAliasForRedirect = (request, response) ->
    if request.cache && response.url && request.url != response.url
      newRequest = request.variant(
        method: response.method
        url: response.url
      )
      cache.alias(request, newRequest)

  ###**
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
    The [layer](/up.layer) that caused the request.
  @stable
  ###

  ###**
  This event is [emitted](/up.emit) when an [AJAX request](/up.request)
  encounters fatal error like a timeout or loss of network connectivity.

  Note that this event will *not* be emitted when the server produces an
  error message with an HTTP status like `500`. When the server can produce
  any response, [`up:request:loaded`](/up:request:loaded) is emitted instead.

  The event is emitted on the layer that caused the request.

  @event up:request:fatal
  @param {up.Request} event.request
    The request.
  @param {up.Layer} [event.layer]
    The [layer](/up.layer) that caused the request.
  @stable
  ###

  ###**
  @internal
  ###
  isSafeMethod = (method) ->
    u.contains(['GET', 'OPTIONS', 'HEAD'], method)

  up.on 'up:framework:reset', reset

  request: makeRequest
  preload: preload
  cache: cache
  isIdle: isIdle
  isBusy: isBusy
  isSafeMethod: isSafeMethod
  config: config
  abort: abortRequests
  registerAliasForRedirect: registerAliasForRedirect
  queue: queue # for testing
  shouldPreload: shouldPreload
  shouldReduceRequests: shouldReduceRequests
  mimicLocalRequest: mimicLocalRequest

up.request = up.network.request

# TODO: Docs for up.cache.clear
up.cache = up.network.cache
