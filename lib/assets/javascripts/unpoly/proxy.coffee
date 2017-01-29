###*
AJAX acceleration
=================

Unpoly comes with a number of tricks to shorten the latency between browser and server.

\#\#\# Server responses are cached by default

Unpoly caches server responses for a few minutes,
making requests to these URLs return instantly.
All Unpoly functions and selectors go through this cache, unless
you explicitly pass a `{ cache: false }` option or set an `up-cache="false"` attribute.

The cache holds up to 70 responses for 5 minutes. You can configure the cache size and expiry using
[`up.proxy.config`](/up.proxy.config), or clear the cache manually using [`up.proxy.clear()`](/up.proxy.clear).

Also the entire cache is cleared with every non-`GET` request (like `POST` or `PUT`).

If you need to make cache-aware requests from your [custom JavaScript](/up.syntax),
use [`up.ajax()`](/up.ajax).

\#\#\# Preloading links

Unpoly also lets you speed up reaction times by [preloading
links](/up-preload) when the user hovers over the click area (or puts the mouse/finger
down). This way the response will already be cached when
the user releases the mouse/finger.

\#\#\# Spinners

You can listen to the [`up:proxy:slow`](/up:proxy:slow) event to implement a spinner
that appears during a long-running request.

\#\#\# More acceleration

Other Unpoly modules contain even more tricks to outsmart network latency:

- [Instantaneous feedback for links that are currently loading](/up-active)
- [Follow links on `mousedown` instead of `click`](/up-instant)

@class up.proxy  
###
up.proxy = (($) ->

  u = up.util

  $waitingLink = undefined
  preloadDelayTimer = undefined
  slowDelayTimer = undefined
  pendingCount = undefined
  slowEventEmitted = undefined

  queuedRequests = []

  ###*
  @property up.proxy.config
  @param {Number} [config.preloadDelay=75]
    The number of milliseconds to wait before [`[up-preload]`](/up-preload)
    starts preloading.
  @param {Number} [config.cacheSize=70]
    The maximum number of responses to cache.
    If the size is exceeded, the oldest items will be dropped from the cache.
  @param {Number} [config.cacheExpiry=300000]
    The number of milliseconds until a cache entry expires.
    Defaults to 5 minutes.
  @param {Number} [config.slowDelay=300]
    How long the proxy waits until emitting the [`up:proxy:slow` event](/up:proxy:slow).
    Use this to prevent flickering of spinners.
  @param {Number} [config.maxRequests=4]
    The maximum number of concurrent requests to allow before additional
    requests are queued. This currently ignores preloading requests.

    You might find it useful to set this to `1` in full-stack integration
    tests (e.g. Selenium).

    Note that your browser might [impose its own request limit](http://www.browserscope.org/?category=network)
    regardless of what you configure here.
  @param {Array<String>} [config.wrapMethods]
    An array of uppercase HTTP method names. AJAX requests with one of these methods
    will be converted into a `POST` request and carry their original method as a `_method`
    parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).
  @param {Array<String>} [config.safeMethods]
    An array of uppercase HTTP method names that are considered idempotent.
    The proxy cache will only cache idempotent requests and will clear the entire
    cache after a non-idempotent request.
  @stable
  ###
  config = u.config
    slowDelay: 300
    preloadDelay: 75
    cacheSize: 70
    cacheExpiry: 1000 * 60 * 5
    maxRequests: 4
    wrapMethods: ['PATCH', 'PUT', 'DELETE']
    safeMethods: ['GET', 'OPTIONS', 'HEAD']

  cacheKey = (request) ->
    normalizeRequest(request)
    [ request.url,
      request.method,
      u.requestDataAsQuery(request.data),
      request.target
    ].join('|')

  cache = u.cache
    size: -> config.cacheSize
    expiry: -> config.cacheExpiry
    key: cacheKey
    # log: 'up.proxy'

  ###*
  Returns a cached response for the given request.

  Returns `undefined` if the given request is not currently cached.

  @function up.proxy.get
  @return {Promise}
    A promise for the response that is API-compatible with the
    promise returned by [`jQuery.ajax`](http://api.jquery.com/jquery.ajax/).
  @experimental
  ###
  get = (request) ->
    request = normalizeRequest(request)
    if isCachable(request)
      candidates = [request]
      unless request.target is 'html'
        requestForHtml = u.merge(request, target: 'html')
        candidates.push(requestForHtml)
        unless request.target is 'body'
          requestForBody = u.merge(request, target: 'body')
          candidates.push(requestForBody)
      for candidate in candidates
        if response = cache.get(candidate)
          return response

  cancelPreloadDelay = ->
    clearTimeout(preloadDelayTimer)
    preloadDelayTimer = null

  cancelSlowDelay = ->
    clearTimeout(slowDelayTimer)
    slowDelayTimer = null

  reset = ->
    $waitingLink = null
    cancelPreloadDelay()
    cancelSlowDelay()
    pendingCount = 0
    config.reset()
    cache.clear()
    slowEventEmitted = false
    queuedRequests = []

  reset()

  normalizeRequest = (request) ->
    unless request._normalized
      request.method = u.normalizeMethod(request.method)
      request.url = u.normalizeUrl(request.url) if request.url
      request.target ||= 'body'
      request._normalized = true
    request

  ###*
  Makes a request to the given URL and caches the response.
  If the response was already cached, returns the HTML instantly.
  
  If requesting a URL that is not read-only, the response will
  not be cached and the entire cache will be cleared.
  Only requests with a method of `GET`, `OPTIONS` and `HEAD`
  are considered to be read-only.

  \#\#\# Example

      up.ajax('/search', data: { query: 'sunshine' }).then(function(data, status, xhr) {
        console.log('The response body is %o', data);
      }).fail(function(xhr, status, error) {
        console.error('The request failed');
      });

  \#\#\# Events

  If a network connection is attempted, the proxy will emit
  a [`up:proxy:load`](/up:proxy:load) event with the `request` as its argument.
  Once the response is received, a [`up:proxy:receive`](/up:proxy:receive) event will
  be emitted.
  
  @function up.ajax
  @param {String} url
  @param {String} [request.method='GET']
  @param {String} [request.target='body']
  @param {Boolean} [request.cache]
    Whether to use a cached response, if available.
    If set to `false` a network connection will always be attempted.
  @param {Object} [request.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
  @param {Object} [request.data={}]
    An object of request parameters.
  @param {String} [request.url]
    You can omit the first string argument and pass the URL as
    a `request` property instead.
  @param {String} [request.timeout]
    A timeout in milliseconds for the request.

    If [`up.proxy.config.maxRequests`](/up.proxy.config#maxRequests) is set, the timeout
    will not include the time spent waiting in the queue.
  @return
    A promise for the response that is API-compatible with the
    promise returned by [`jQuery.ajax`](http://api.jquery.com/jquery.ajax/).
  @stable
  ###
  ajax = (args...) ->

    options = u.extractOptions(args)
    options.url = args[0] if u.isGiven(args[0])

    forceCache = (options.cache == true)
    ignoreCache = (options.cache == false)

    request = u.only options,
      'url',
      'method',
      'data',
      'target',
      'headers',
      'timeout',
      '_normalized'

    request = normalizeRequest(request)

    pending = true

    # Non-GET requests always touch the network
    # unless `options.cache` is explicitly set to `true`.
    # These requests are never cached.
    if !isIdempotent(request) && !forceCache
      clear()
      promise = loadOrQueue(request)
    # If we have an existing promise matching this new request,
    # we use it unless `options.cache` is explicitly set to `false`.
    # The promise might still be pending.
    else if (promise = get(request)) && !ignoreCache
      up.puts 'Re-using cached response for %s %s', request.method, request.url
      pending = (promise.state() == 'pending')
    # If no existing promise is available, we make a network request.
    else
      promise = loadOrQueue(request)
      set(request, promise)
      # Don't cache failed requests
      promise.fail -> remove(request)

    if pending && !options.preload
      # This might actually make `pendingCount` higher than the actual
      # number of outstanding requests. However, we need to cover the
      # following case:
      #
      # - User starts preloading a request.
      #   This triggers *no* `up:proxy:slow`.
      # - User starts loading the request (without preloading).
      #   This triggers `up:proxy:slow`.
      # - The request finishes.
      #   This triggers `up:proxy:recover`.
      loadStarted()
      promise.always(loadEnded)

    promise

  ###*
  Returns whether the proxy is capable of caching the given request.
  Even if this returns `true`, only idempodent requests will be
  cached by default.

  @function up.proxy.isCachable
  @internal
  ###
  isCachable = (request) ->
    not u.isFormData(request.data)

  ###*
  Returns `true` if the proxy is not currently waiting
  for a request to finish. Returns `false` otherwise.

  @function up.proxy.isIdle
  @return {Boolean}
    Whether the proxy is idle
  @experimental
  ###
  isIdle = ->
    pendingCount == 0

  ###*
  Returns `true` if the proxy is currently waiting
  for a request to finish. Returns `false` otherwise.

  @function up.proxy.isBusy
  @return {Boolean}
    Whether the proxy is busy
  @experimental
  ###
  isBusy = ->
    pendingCount > 0

  loadStarted = ->
    wasIdle = isIdle()
    pendingCount += 1
    if wasIdle
      # Since the emission of up:proxy:slow might be delayed by config.slowDelay,
      # we wrap the mission in a function for scheduling below.
      emission = ->
        if isBusy() # a fast response might have beaten the delay
          up.emit('up:proxy:slow', message: 'Proxy is busy')
          slowEventEmitted = true
      slowDelayTimer = u.setTimer(config.slowDelay, emission)

  ###*
  This event is [emitted](/up.emit) when [AJAX requests](/up.ajax)
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

      up.compiler('.spinner', function($element) {

        show = function() { $element.show() };
        hide = function() { $element.hide() };

        hide();

        return [
          up.on('up:proxy:slow', show),
          up.on('up:proxy:recover', hide)
        ];

      });

  The `up:proxy:slow` event will be emitted after a delay of 300 ms
  to prevent the spinner from flickering on and off.
  You can change (or remove) this delay by [configuring `up.proxy`](/up.proxy.config) like this:

      up.proxy.config.slowDelay = 150;


  @event up:proxy:slow
  @stable
  ###

  loadEnded = ->
    pendingCount -= 1
    if isIdle() && slowEventEmitted
      up.emit('up:proxy:recover', message: 'Proxy is idle')
      slowEventEmitted = false

  ###*
  This event is [emitted](/up.emit) when [AJAX requests](/up.ajax)
  have [taken long to finish](/up:proxy:slow), but have finished now.

  See [`up:proxy:slow`](/up:proxy:slow) for more documentation on
  how to use this event for implementing a spinner that shows during
  long-running requests.

  @event up:proxy:recover
  @stable
  ###

  loadOrQueue = (request) ->
    if pendingCount < config.maxRequests
      load(request)
    else
      queue(request)

  queue = (request) ->
    up.puts('Queuing request for %s %s', request.method, request.url)
    deferred = $.Deferred()
    entry =
      deferred: deferred
      request: request
    queuedRequests.push(entry)
    deferred.promise()

  load = (request) ->
    up.emit('up:proxy:load', u.merge(request, message: ['Loading %s %s', request.method, request.url]))

    # We will modify the request below for features like method wrapping.
    # Let's not change the original request which would confuse API clients
    # and cache key logic.
    request = u.copy(request)

    request.headers ||= {}
    request.headers[up.protocol.config.targetHeader] = request.target

    if u.contains(config.wrapMethods, request.method)
      request.data = u.appendRequestData(request.data, up.protocol.config.methodParam, request.method)
      request.method = 'POST'

    if u.isFormData(request.data)
      # Disable jQuery's request data processing so we can pass
      # a FormData object (http://stackoverflow.com/a/5976031)
      request.contentType = false
      request.processData = false

    promise = $.ajax(request)
    promise.done (data, textStatus, xhr) -> responseReceived(request, xhr)
    promise.fail (xhr, textStatus, errorThrown) -> responseReceived(request, xhr)
    promise

  responseReceived = (request, xhr) ->
    up.emit('up:proxy:received', u.merge(request, message: ['Server responded with %s %s (%d bytes)', xhr.status, xhr.statusText, xhr.responseText?.length]))
    pokeQueue()

  pokeQueue = ->
    if entry = queuedRequests.shift()
      promise = load(entry.request)
      promise.done (args...) -> entry.deferred.resolve(args...)
      promise.fail (args...) -> entry.deferred.reject(args...)
      return

  ###*
  Makes the proxy assume that `newRequest` has the same response as the
  already cached `oldRequest`.

  Unpoly uses this internally when the user redirects from `/old` to `/new`.
  In that case, both `/old` and `/new` will cache the same response from `/new`.

  @function up.proxy.alias
  @param {Object} oldRequest
  @param {Object} newRequest
  @experimental
  ###
  alias = cache.alias

  ###*
  Manually stores a promise for the response to the given request.

  @function up.proxy.set
  @param {String} request.url
  @param {String} [request.method='GET']
  @param {String} [request.target='body']
  @param {Promise} response
    A promise for the response that is API-compatible with the
    promise returned by [`jQuery.ajax`](http://api.jquery.com/jquery.ajax/).
  @experimental
  ###
  set = cache.set

  ###*
  Manually removes the given request from the cache.

  You can also [configure](/up.proxy.config) when the proxy
  automatically removes cache entries.

  @function up.proxy.remove
  @param {String} request.url
  @param {String} [request.method='GET']
  @param {String} [request.target='body']
  @experimental
  ###
  remove = cache.remove

  ###*
  Removes all cache entries.

  Unpoly also automatically clears the cache whenever it processes
  a request with a non-GET HTTP method.

  @function up.proxy.clear
  @stable
  ###
  clear = cache.clear

  ###*
  This event is [emitted](/up.emit) before an [AJAX request](/up.ajax)
  is starting to load.

  @event up:proxy:load
  @param event.url
  @param event.method
  @param event.target
  @experimental
  ###

  ###*
  This event is [emitted](/up.emit) when the response to an [AJAX request](/up.ajax)
  has been received.

  @event up:proxy:received
  @param event.url
  @param event.method
  @param event.target
  @experimental
  ###

  isIdempotent = (request) ->
    normalizeRequest(request)
    u.contains(config.safeMethods, request.method)

  checkPreload = ($link) ->
    delay = parseInt(u.presentAttr($link, 'up-delay')) || config.preloadDelay 
    unless $link.is($waitingLink)
      $waitingLink = $link
      cancelPreloadDelay()
      curriedPreload = ->
        preload($link)
        $waitingLink = null
      startPreloadDelay(curriedPreload, delay)
      
  startPreloadDelay = (block, delay) ->
    preloadDelayTimer = setTimeout(block, delay)

  ###*
  @function up.proxy.preload
  @param {String|Element|jQuery}
    The element whose destination should be preloaded.
  @return
    A promise that will be resolved when the request was loaded and cached
  @experimental
  ###
  preload = (linkOrSelector, options) ->
    $link = $(linkOrSelector)
    options = u.options(options)

    method = up.link.followMethod($link, options)
    if isIdempotent(method: method)
      up.log.group "Preloading link %o", $link, ->
        options.preload = true
        up.follow($link, options)
    else
      up.puts("Won't preload %o due to unsafe method %s", $link, method)
      u.resolvedPromise()

  ###*
  Links with an `up-preload` attribute will silently fetch their target
  when the user hovers over the click area, or when the user puts her
  mouse/finger down (before releasing). This way the
  response will already be cached when the user performs the click,
  making the interaction feel instant.   

  @selector [up-preload]
  @param [up-delay=75]
    The number of milliseconds to wait between hovering
    and preloading. Increasing this will lower the load in your server,
    but will also make the interaction feel less instant.
  @stable
  ###
  up.on 'mouseover mousedown touchstart', '[up-preload]', (event, $element) ->
    # Don't do anything if we are hovering over the child
    # of a link. The actual link will receive the event
    # and bubble in a second.
    unless up.link.childClicked(event, $element)
      checkPreload($element)

  up.on 'up:framework:reset', reset

  preload: preload
  ajax: ajax
  get: get
  alias: alias
  clear: clear
  remove: remove
  isIdle: isIdle
  isBusy: isBusy
  isCachable: isCachable
  config: config
  
)(jQuery)

up.ajax = up.proxy.ajax
