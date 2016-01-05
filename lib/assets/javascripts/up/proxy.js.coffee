###*
Caching and preloading
======================

All HTTP requests go through the Up.js proxy.
It caches a [limited](/up.proxy.config) number of server responses
for a [limited](/up.proxy.config) amount of time,
making requests to these URLs return insantly.
  
The cache is cleared whenever the user makes a non-`GET` request
(like `POST`, `PUT` or `DELETE`).

The proxy can also used to speed up reaction times by [preloading
links when the user hovers over the click area](/up-preload) (or puts the mouse/finger
down before releasing). This way the response will already be cached when
the user performs the click.

Spinners
--------

You can [listen](/up.on) to the [`up:proxy:busy`](/up:proxy:busy)
and [`up:proxy:idle`](/up:proxy:idle) events  to implement a spinner
that appears during a long-running request,
and disappears once the response has been received:

    <div class="spinner">Please wait!</div>

Here is the Javascript to make it alive:

    up.compiler('.spinner', function($element) {

      show = function() { $element.show() };
      hide = function() { $element.hide() };

      showOff = up.on('up:proxy:busy', show);
      hideOff = up.on('up:proxy:idle', hide);

      hide();

      // Clean up when the element is removed from the DOM
      return function() {
        showOff();
        hideOff();
      };

    });

The `up:proxy:busy` event will be emitted after a delay of 300 ms
to prevent the spinner from flickering on and off.
You can change (or remove) this delay by [configuring `up.proxy`](/up.proxy.config) like this:

    up.proxy.config.busyDelay = 150;

@class up.proxy  
###
up.proxy = (($) ->

  u = up.util

  $waitingLink = undefined
  preloadDelayTimer = undefined
  busyDelayTimer = undefined
  pendingCount = undefined
  busyEventEmitted = undefined

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
  @param {Number} [config.busyDelay=300]
    How long the proxy waits until emitting the [`up:proxy:busy` event](/up:proxy:busy).
    Use this to prevent flickering of spinners.
  @stable
  ###
  config = u.config
    busyDelay: 300
    preloadDelay: 75
    cacheSize: 70
    cacheExpiry: 1000 * 60 * 5

  cacheKey = (request) ->
    normalizeRequest(request)
    [ request.url,
      request.method,
      request.data,
      request.selector
    ].join('|')

  cache = u.cache
    size: -> config.cacheSize
    expiry: -> config.cacheExpiry
    key: cacheKey
    log: 'up.proxy'

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
    candidates = [request]
    unless request.selector is 'html'
      requestForHtml = u.merge(request, selector: 'html')
      candidates.push(requestForHtml)
      unless request.selector is 'body'
        requestForBody = u.merge(request, selector: 'body')
        candidates.push(requestForBody)
    for candidate in candidates
      if response = cache.get(candidate)
        return response

  ###*
  Manually stores a promise for the response to the given request.

  @function up.proxy.set
  @param {String} request.url
  @param {String} [request.method='GET']
  @param {String} [request.selector='body']
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
  @param {String} [request.selector='body']
  @experimental
  ###
  remove = cache.remove

  ###*
  Removes all cache entries.

  Up.js also automatically clears the cache whenever it processes
  a request with a non-GET HTTP method.

  @function up.proxy.clear
  @stable
  ###
  clear = cache.clear

  cancelPreloadDelay = ->
    clearTimeout(preloadDelayTimer)
    preloadDelayTimer = null

  cancelBusyDelay = ->
    clearTimeout(busyDelayTimer)
    busyDelayTimer = null

  reset = ->
    $waitingLink = null
    cancelPreloadDelay()
    cancelBusyDelay()
    pendingCount = 0
    config.reset()
    busyEventEmitted = false
    cache.clear()

  reset()

  alias = cache.alias

  normalizeRequest = (request) ->
    unless request._normalized
      request.method = u.normalizeMethod(request.method)
      request.url = u.normalizeUrl(request.url) if request.url
      request.selector ||= 'body'
      request._normalized = true
    request

  ###*
  Makes a request to the given URL and caches the response.
  If the response was already cached, returns the HTML instantly.
  
  If requesting a URL that is not read-only, the response will
  not be cached and the entire cache will be cleared.
  Only requests with a method of `GET`, `OPTIONS` and `HEAD`
  are considered to be read-only.

  If a network connection is attempted, the proxy will emit
  a `up:proxy:load` event with the `request` as its argument.
  Once the response is received, a `up:proxy:receive` event will
  be emitted.
  
  @function up.proxy.ajax
  @param {String} request.url
  @param {String} [request.method='GET']
  @param {String} [request.selector='body']
  @param {Boolean} [request.cache]
    Whether to use a cached response, if available.
    If set to `false` a network connection will always be attempted.
  @param {Object} [request.headers={}]
    An object of additional header key/value pairs to send along
    with the request.
  @return
    A promise for the response that is API-compatible with the
    promise returned by [`jQuery.ajax`](http://api.jquery.com/jquery.ajax/).
  @stable
  ###
  ajax = (options) ->

    forceCache = (options.cache == true)
    ignoreCache = (options.cache == false)

    request = u.only(options, 'url', 'method', 'data', 'selector', 'headers', '_normalized')

    pending = true

    # We don't cache non-GET responses unless `options.cache`
    # is explicitly set to `true`.
    if !isIdempotent(request) && !forceCache
      clear()
      promise = load(request)
    # If a cached response is available, we use it unless
    # `options.cache` is explicitly set to `false`.
    else if (promise = get(request)) && !ignoreCache
      pending = (promise.state() == 'pending')
    else
      promise = load(request)
      set(request, promise)
      # Don't cache failed requests
      promise.fail -> remove(request)

    if pending && !options.preload
      # This will actually make `pendingCount` higher than the actual
      # number of outstanding requests. However, we need to cover the
      # following case:
      #
      # - User starts preloading a request.
      #   This triggers *no* `up:proxy:busy`.
      # - User starts loading the request (without preloading).
      #   This triggers `up:proxy:busy`.
      # - The request finishes.
      #   This triggers `up:proxy:idle`.
      loadStarted()
      promise.always(loadEnded)

    promise

  SAFE_HTTP_METHODS = ['GET', 'OPTIONS', 'HEAD']

  ###*
  Returns `true` if the proxy is not currently waiting
  for a request to finish. Returns `false` otherwise.

  The proxy will also emit an [`up:proxy:idle` event](/up:proxy:idle) if it
  used to busy, but is now idle.

  @function up.proxy.idle
  @return {Boolean}
    Whether the proxy is idle
  @experimental
  ###
  idle = ->
    pendingCount == 0

  ###*
  Returns `true` if the proxy is currently waiting
  for a request to finish. Returns `false` otherwise.

  The proxy will also emit an [`up:proxy:busy` event](/up:proxy:busy) if it
  used to be idle, but is now busy.

  @function up.proxy.busy
  @return {Boolean}
    Whether the proxy is busy
  @experimental
  ###
  busy = ->
    pendingCount > 0

  loadStarted = ->
    wasIdle = idle()
    pendingCount += 1
    if wasIdle
      # Since the emission of up:proxy:busy might be delayed by config.busyDelay,
      # we wrap the mission in a function for scheduling below.
      emission = ->
        if busy() # a fast response might have beaten the delay
          up.emit('up:proxy:busy')
          busyEventEmitted = true
      if config.busyDelay > 0
        busyDelayTimer = setTimeout(emission, config.busyDelay)
      else
        emission()

  ###*
  This event is [emitted]/(up.emit) when [AJAX requests](/up.proxy.ajax)
  are taking long to finish.

  By default Up.js will wait 300 ms for an AJAX request to finish
  before emitting `up:proxy:busy`. You can configure this time like this:

      up.proxy.config.busyDelay = 150;

  Once all responses have been received, an [`up:proxy:idle`](/up:proxy:idle)
  will be emitted.

  Note that if additional requests are made while Up.js is already busy
  waiting, **no** additional `up:proxy:busy` events will be triggered.

  @event up:proxy:busy
  @stable
  ###

  loadEnded = ->
    pendingCount -= 1
    if idle() && busyEventEmitted
      up.emit('up:proxy:idle')
      busyEventEmitted = false

  ###*
  This event is [emitted]/(up.emit) when [AJAX requests](/up.proxy.ajax)
  have [taken long to finish](/up:proxy:busy), but have finished now.

  @event up:proxy:idle
  @stable
  ###

  load = (request) ->
    u.debug('Loading URL %o', request.url)
    up.emit('up:proxy:load', request)
    promise = u.ajax(request)
    promise.always -> up.emit('up:proxy:received', request)
    promise

  ###*
  This event is [emitted]/(up.emit) before an [AJAX request](/up.proxy.ajax)
  is starting to load.

  @event up:proxy:load
  @param event.url
  @param event.method
  @param event.selector
  @experimental
  ###

  ###*
  This event is [emitted]/(up.emit) when the response to an [AJAX request](/up.proxy.ajax)
  has been received.

  @event up:proxy:received
  @param event.url
  @param event.method
  @param event.selector
  @experimental
  ###

  isIdempotent = (request) ->
    normalizeRequest(request)
    u.contains(SAFE_HTTP_METHODS, request.method)

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
      u.debug("Preloading %o", $link)
      options.preload = true
      up.follow($link, options)
    else
      u.debug("Won't preload %o due to unsafe method %o", $link, method)
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
  idle: idle
  busy: busy
  config: config
  defaults: -> u.error('up.proxy.defaults(...) no longer exists. Set values on he up.proxy.config property instead.')
  
)(jQuery)
