###**
AJAX acceleration
=================

Unpoly comes with a number of tricks to shorten the latency between browser and server.

\#\#\# Server responses are cached by default

Unpoly caches server responses for a few minutes,
making requests to these URLs return instantly.
All Unpoly functions and selectors go through this cache, unless
you explicitly pass a `{ cache: false }` option or set an `up-cache="false"` attribute.

The cache holds up to 70 responses for 5 minutes. You can configure the cache size and expiry using
[`up.proxy.config`](/up.proxy.config), or clear the cache manually using [`up.cache.clear()`](/up.cache.clear).

Also the entire cache is cleared with every non-`GET` request (like `POST` or `PUT`).

If you need to make cache-aware requests from your [custom JavaScript](/up.syntax),
use [`up.request()`](/up.request).

\#\#\# Preloading links

Unpoly also lets you speed up reaction times by [preloading
links](/a-up-preload) when the user hovers over the click area (or puts the mouse/finger
down). This way the response will already be cached when
the user releases the mouse/finger.

\#\#\# Spinners

You can listen to the [`up:proxy:slow`](/up:proxy:slow) event to implement a spinner
that appears during a long-running request.

\#\#\# More acceleration

Other Unpoly modules contain even more tricks to outsmart network latency:

- [Instantaneous feedback for links that are currently loading](/a.up-active)
- [Follow links on `mousedown` instead of `click`](/a-up-instant)

@module up.proxy
###
up.proxy = do ->

  u = up.util

  ###**
  @property up.proxy.config
  @param {number} [config.preloadDelay=75]
    The number of milliseconds to wait before [`[up-preload]`](/a-up-preload)
    starts preloading.
  @param {number} [config.cacheSize=70]
    The maximum number of responses to cache.
    If the size is exceeded, the oldest items will be dropped from the cache.
  @param {number} [config.cacheExpiry=300000]
    The number of milliseconds until a cache entry expires.
    Defaults to 5 minutes.
  @param {number} [config.slowDelay=300]
    How long the proxy waits until emitting the [`up:proxy:slow` event](/up:proxy:slow).
    Use this to prevent flickering of spinners.
  @param {number} [config.maxRequests=4]
    The maximum number of concurrent requests to allow before additional
    requests are queued. This currently ignores preloading requests.

    You might find it useful to set this to `1` in full-stack integration
    tests (e.g. Selenium).

    Note that your browser might [impose its own request limit](http://www.browserscope.org/?category=network)
    regardless of what you configure here.
  @param {Array<string>} [config.wrapMethods]
    An array of uppercase HTTP method names. AJAX requests with one of these methods
    will be converted into a `POST` request and carry their original method as a `_method`
    parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).
  @param {Array<string>} [config.safeMethods]
    An array of uppercase HTTP method names that are considered [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1).
    The proxy cache will only cache safe requests and will clear the entire
    cache after an unsafe request.
  @param {Function(string): Array<string>} [config.requestMetaKeys]
    A function that accepts an [`up.Request`](/up.Request) and returns an array of request property names
    that are sent to the server. The server may return an optimized response based on these properties,
    e.g. by omitting a navigation bar that is not targeted.

    Two requests with different `serverFields` are considered cache misses when [caching](/up.proxy) and
    [preloading](/up.link.preload). To improve cacheability, you may configure a function that returns
    fewer fields.

    By default the following properties are sent to the reserver:

    - [`up.Request.prototype.target`](/up.Request.prototype.target)
    - [`up.Request.prototype.failTarget`](/up.Request.prototype.failTarget)
    - [`up.Request.prototype.context`](/up.Request.prototype.context)
    - [`up.Request.prototype.failContext`](/up.Request.prototype.failContext)
    - [`up.Request.prototype.mode`](/up.Request.prototype.mode)
    - [`up.Request.prototype.failMode`](/up.Request.prototype.failMode)
  @stable
  ###
  config = new up.Config ->
    slowDelay: 300
    cacheSize: 70
    cacheExpiry: 1000 * 60 * 5
    wrapMethods: ['PATCH', 'PUT', 'DELETE']
    safeMethods: ['GET', 'OPTIONS', 'HEAD']
    concurrency: 4
    preloadQueueSize: 5
    preloadEnabled: 'auto'
    preloadTimeout: 10 * 1000
    preloadMaxResponseTime: 850
    preloadSampleSize: 3      # set to 0 to prevent sampling

    requestMetaKeys: (request) -> ['target', 'failTarget', 'mode', 'failMode', 'context', 'failContext']

  preloadDelayMoved = -> up.legacy.deprecated('up.proxy.config.preloadDelay', 'up.link.config.preloadDelay')
  Object.defineProperty config, 'preloadDelay',
    get: ->
      preloadDelayMoved()
      return up.link.config.preloadDelay
    set: (value) ->
      preloadDelayMoved()
      up.link.config.preloadDelay = value

  up.legacy.renamedProperty(config, 'maxRequests', 'concurrency')

  queue = new up.Request.Queue()

  cache = new up.ProxyCache()

  connectionSpeed = new up.ConnectionSpeed
    sampleSize: -> config.preloadSampleSize
    maxResponseTime: -> config.preloadMaxResponseTime

  ###**
  Returns a cached response for the given request.

  Returns `undefined` if the given request is not currently cached.

  @function up.cache.get
  @return {Promise<up.Response>}
    A promise for the response.
  @experimental
  ###

  ###**
  Removes all cache entries.

  Unpoly also automatically clears the cache whenever it processes
  a request with an [unsafe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
  HTTP method like `POST`.

  @function up.cache.clear
  @stable
  ###

  ###**
  Makes the proxy assume that `newRequest` has the same response as the
  already cached `oldRequest`.

  Unpoly uses this internally when the user redirects from `/old` to `/new`.
  In that case, both `/old` and `/new` will cache the same response from `/new`.

  @function up.cache.alias
  @param {Object} oldRequest
  @param {Object} newRequest
  @experimental
  ###

  ###**
  TODO: Remove this method. It's hard to use it.

  Manually stores a promise for the response to the given request.

  @function up.cache.set
  @param {string} request.url
  @param {string} [request.method='GET']
  @param {string} [request.target='body']
  @param {Promise<up.Response>} response
    A promise for the response.
  @experimental
  ###

  ###**
  Manually removes the given request from the cache.

  You can also [configure](/up.proxy.config) when the proxy
  automatically removes cache entries.

  @function up.cache.remove
  @param {string} request.url
  @param {string} [request.method='GET']
  @param {string} [request.target='body']
  @experimental
  ###

  reset = ->
    abortRequests()
    queue.reset()
    config.reset()
    cache.clear()

  ###**
  Makes an AJAX request to the given URL.

  \#\#\# Example

      up.request('/search', { params: { query: 'sunshine' } }).then(function(response) {
        console.log('The response text is %o', response.text)
      }).catch(function() {
        console.error('The request failed')
      })

  \#\#\# Caching

  All responses are cached by default. If requesting a URL with a non-`GET` method, the response will
  not be cached and the entire cache will be cleared.

  You can configure caching with the [`up.proxy.config`](/up.proxy.config) property.

  \#\#\# Events

  If a network connection is attempted, the proxy will emit
  a [`up:proxy:load`](/up:proxy:load) event with the `request` as its argument.
  Once the response is received, a [`up:proxy:loaded`](/up:proxy:loaded) event will
  be emitted.
  
  @function up.request
  @param {string} [url]
    The URL for the request.

    Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.
  @param {string} [options.url]
    You can omit the first string argument and pass the URL as
    a `request` property instead.
  @param {string} [options.method='GET']
    The HTTP method for the options.
  @param {boolean} [options.cache]
    Whether to use a cached response for [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    requests, if available. If set to `false` a network connection will always be attempted.
  @param {Object} [options.headers={}]
    An object of additional HTTP headers.
  @param {Object|FormData|string|Array} [options.params={}]
    [Parameters](/up.Params) that should be sent as the request's payload.
  @param {string} [options.timeout]
    A timeout in milliseconds.

    If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set, the timeout
    will not include the time spent waiting in the queue.
  @param {string} [options.target='body']
    The CSS selector that will be sent as an [`X-Up-Target` header](/up.protocol#optimizing-responses).
  @param {string} [options.failTarget='body']
    The CSS selector that will be sent as an [`X-Up-Fail-Target` header](/up.protocol#optimizing-responses).
  @return {Promise<up.Response>}
    A promise for the response.
  @stable
  ###
  makeRequest = (args...) ->
    request = up.Request.wrap(args...)

    if request.preload
      request.timeout ?= config.preloadTimeout
      request.cache = true

    # We clear the entire cache before an unsafe request, since we
    # assume the user is writing a change.
    cache.clear() unless request.isSafe()

    # If we have an existing promise matching this new request,
    # we use it unless `request.cache` is explicitly set to `false`.
    if request.cache && (cachedRequest = cache.get(request))
      up.puts('up.request()', 'Re-using cached response for %s %s', request.method, request.url)

      # Check if we need to upgrade a cached background request to a foreground request.
      # This might affect whether we're going to emit an up:proxy:slow event further
      # down. Consider this case:
      #
      # - User preloads a request (1). We have a cache miss and connect to the network.
      #   This will never trigger `up:proxy:slow`, because we only track foreground requests.
      # - User loads the same request (2) in the foreground (no preloading).
      #   We have a cache hit and receive the earlier request that is still preloading.
      #   Now we *should* trigger `up:proxy:slow`.
      # - The request (1) finishes. This triggers `up:proxy:recover`.
      unless request.preload
        queue.promoteToForeground(cachedRequest)

      request = cachedRequest
    else
      # If no existing promise is available, we make a network request.

      if request.cache
        # Cache the request for calls for calls with the same URL, method, params
        # and target. See up.Request#cacheKey().
        cache.set(request, request)

        # Immediately uncache failed requests.
        # We have no control over the server, and another request with the
        # same properties might succeed.
        request.catch -> cache.remove(request)

      queue.asap(request)

    # The request is also a promise for its response.
    return request

  ###**
  Makes an AJAX request to the given URL and caches the response.

  The function returns a promise that fulfills with the response text.

  \#\#\# Example

      up.request('/search', { params: { query: 'sunshine' } }).then(function(text) {
        console.log('The response text is %o', text)
      }).catch(function() {
        console.error('The request failed')
      })

  @function up.ajax
  @param {string} [url]
    The URL for the request.

    Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.
  @param {string} [request.url]
    You can omit the first string argument and pass the URL as
    a `request` property instead.
  @param {string} [request.method='GET']
    The HTTP method for the request.
  @param {boolean} [request.cache]
    Whether to use a cached response for [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
    requests, if available. If set to `false` a network connection will always be attempted.
  @param {Object} [request.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
  @param {Object|FormData|string|Array} [options.params]
    [Parameters](/up.Params) that should be sent as the request's payload.

    On IE 11 and Edge, `FormData` payloads require a [polyfill for `FormData#entries()`](https://github.com/jimmywarting/FormData).
  @param {string} [request.timeout]
    A timeout in milliseconds for the request.

    If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set, the timeout
    will not include the time spent waiting in the queue.
  @return {Promise<string>}
    A promise for the response text.
  @deprecated
    Use [`up.request()`](/up.request) instead.
  ###
  ajax = (args...) ->
    up.legacy.deprecated('up.ajax()', 'up.request()')
    pickResponseText = (response) -> return response.text
    makeRequest(args...).then(pickResponseText)

  ###**
  Returns `true` if the proxy is not currently waiting
  for a request to finish. Returns `false` otherwise.

  [Preload requests](/up.link.preload) will not be considered for this check.

  @function up.proxy.isIdle
  @return {boolean}
    Whether the proxy is idle
  @experimental
  ###
  isIdle = ->
    not isBusy()

  ###**
  Returns `true` if the proxy is currently waiting
  for a request to finish. Returns `false` otherwise.

  [Preload requests](/up.link.preload) will not be considered for this check.

  @function up.proxy.isBusy
  @return {boolean}
    Whether the proxy is busy
  @experimental
  ###
  isBusy = ->
    queue.isBusy()

  shouldPreload = (request) ->
    setting = u.evalOption(config.preloadEnabled, request)
    if setting == 'auto'
      return !connectionSpeed.isSlow()
    else
      setting

  abortRequests = (args...) ->
    queue.abort(args...)

  ###**
  This event is [emitted](/up.emit) when [AJAX requests](/up.request)
  are taking long to finish.

  By default Unpoly will wait 300 ms for an AJAX request to finish
  before emitting `up:proxy:slow`. You can configure this time like this:

      up.proxy.config.slowDelay = 150;

  Once all responses have been received, an [`up:proxy:recover`](/up:proxy:recover)
  will be emitted.

  Note that if additional requests are made while Unpoly is already busy
  waiting, **no** additional `up:proxy:slow` events will be triggered.


  \#\#\# Spinners

  You can [listen](/up.on) to the `up:proxy:slow`
  and [`up:proxy:recover`](/up:proxy:recover) events to implement a spinner
  that appears during a long-running request,
  and disappears once the response has been received:

      <div class="spinner">Please wait!</div>

  Here is the JavaScript to make it alive:

      up.compiler('.spinner', function(element) {
        show = () => { up.element.show(element) }
        hide = () => { up.element.hide(element) }

        hide()

        return [
          up.on('up:proxy:slow', show),
          up.on('up:proxy:recover', hide)
        ]
      })

  The `up:proxy:slow` event will be emitted after a delay of 300 ms
  to prevent the spinner from flickering on and off.
  You can change (or remove) this delay by [configuring `up.proxy`](/up.proxy.config) like this:

      up.proxy.config.slowDelay = 150;


  @event up:proxy:slow
  @stable
  ###

  ###**
  This event is [emitted](/up.emit) when [AJAX requests](/up.request)
  have [taken long to finish](/up:proxy:slow), but have finished now.

  See [`up:proxy:slow`](/up:proxy:slow) for more documentation on
  how to use this event for implementing a spinner that shows during
  long-running requests.

  @event up:proxy:recover
  @stable
  ###

  ###**
  This event is [emitted](/up.emit) before an [AJAX request](/up.request)
  is sent over the network.

  @event up:proxy:load
  @param {up.Request} event.request
  @param event.preventDefault()
    Event listeners may call this method to prevent the request from being sent.
  @experimental
  ###

  registerAliasForRedirect = (request, response) ->
    if request.cache && response.url && request.url != response.url
      newRequest = request.variant(
        method: response.method
        url: response.url
      )
      cache.alias(request, newRequest)

  ###**
  This event is [emitted](/up.emit) when the response to an
  [AJAX request](/up.request) has been received.

  Note that this event will also be emitted when the server signals an
  error with an HTTP status like `500`. Only if the request
  encounters a fatal error (like a loss of network connectivity),
  [`up:proxy:fatal`](/up:proxy:fatal) is emitted instead.

  @event up:proxy:loaded
  @param {up.Request} event.request
  @param {up.Response|Error} event.error
  @experimental
  ###

  ###**
  This event is [emitted](/up.emit) when an [AJAX request](/up.request)
  encounters fatal error like a timeout, loss of network connectivity,
  or when the request was [aborted](/up.proxy.abort).

  Note that this event will *not* be emitted when the server produces an
  error message with an HTTP status like `500`. When the server can produce
  any response, [`up:proxy:loaded`](/up:proxy:loaded) is emitted instead.

  @event up:proxy:fatal
  ###

  ###**
  @internal
  ###
  isSafeMethod = (method) ->
    u.contains(config.safeMethods, method)

  ###**
  @internal
  ###
  wrapMethod = (method, params) ->
    if u.contains(config.wrapMethods, method)
      params.add(up.protocol.config.methodParam, method)
      method = 'POST'
    method

  up.on 'up:framework:reset', reset

  preload: (args...) ->
    up.legacy.warn('up.proxy.preload() has been renamed to up.link.preload()')
    up.link.preload(args...)
  ajax: ajax
  request: makeRequest
  cache: cache
  clear: ->
    up.legacy.deprecated('up.proxy.clear()', 'up.cache.clear()')
    return cache.clear()
  isIdle: isIdle
  isBusy: isBusy
  isSafeMethod: isSafeMethod
  wrapMethod: wrapMethod
  config: config
  abort: abortRequests
  registerAliasForRedirect: registerAliasForRedirect
  queue: queue # for testing
  shouldPreload: shouldPreload

up.ajax = up.proxy.ajax
up.request = up.proxy.request
up.cache = up.proxy.cache
