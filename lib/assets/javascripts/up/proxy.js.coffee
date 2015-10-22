###*
Caching and preloading
======================

All HTTP requests go through the Up.js proxy.
It caches a [limited](/up.proxy#up.proxy.defaults) number of server responses
for a [limited](/up.proxy#up.proxy.defaults) amount of time,
making requests to these URLs return insantly.
  
The cache is cleared whenever the user makes a non-`GET` request
(like `POST`, `PUT` or `DELETE`).

The proxy can also used to speed up reaction times by preloading
links when the user hovers over the click area (or puts the mouse/finger
down before releasing). This way the
response will already be cached when the user performs the click.

Spinners
---------

You can listen to [framework events](/up.bus) to implement a spinner
(progress indicator) that appears during a long-running request,
and disappears once the response has been received:

    <div class="spinner">Please wait!</div>

Here is the Javascript to make it alive:

    up.compiler('.spinner', function($element) {

      show = function() { $element.show() };
      hide = function() { $element.hide() };

      up.bus.on('proxy:busy', show);
      up.bus.on('proxy:idle', hide);

      return function() {
        up.bus.off('proxy:busy', show);
        up.bus.off('proxy:idle', hide);
      };

    });

The `proxy:busy` event will be emitted after a delay of 300 ms
to prevent the spinner from flickering on and off.
You can change (or remove) this delay like this:

    up.proxy.defaults({ busyDelay: 150 });

@class up.proxy  
###
up.proxy = (->

  u = up.util

  $waitingLink = undefined
  preloadDelayTimer = undefined
  busyDelayTimer = undefined
  pendingCount = undefined
  busyEventEmitted = undefined

  ###*
  @method up.proxy.defaults
  @param {Number} [options.preloadDelay=75]
    The number of milliseconds to wait before [`[up-preload]`](#up-preload)
    starts preloading.
  @param {Number} [options.cacheSize=70]
    The maximum number of responses to cache.
    If the size is exceeded, the oldest items will be dropped from the cache.
  @param {Number} [options.cacheExpiry=300000]
    The number of milliseconds until a cache entry expires.
    Defaults to 5 minutes.
  @param {Number} [options.busyDelay=300]
    How long the proxy waits until emitting the `proxy:busy` [event](/up.bus).
    Use this to prevent flickering of spinners.
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
  @protected
  @method up.proxy.get
  ###
  get = cache.get

  ###*
  @protected
  @method up.proxy.set
  ###
  set = cache.set

  ###*
  @protected
  @method up.proxy.remove
  ###
  remove = cache.remove

  ###*
  @protected
  @method up.proxy.clear
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
  a `proxy:load` event with the `request` as its argument.
  Once the response is received, a `proxy:receive` event will
  be emitted.
  
  @method up.proxy.ajax
  @param {String} request.url
  @param {String} [request.method='GET']
  @param {String} [request.selector]
  @param {Boolean} [request.cache]
    Whether to use a cached response, if available.
    If set to `false` a network connection will always be attempted.
  ###
  ajax = (options) ->

    forceCache = (options.cache == true)
    ignoreCache = (options.cache == false)

    request = u.only(options, 'url', 'method', 'data', 'selector', '_normalized')

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
      #   This triggers *no* `proxy:busy`.
      # - User starts loading the request (without preloading).
      #   This triggers `proxy:busy`.
      # - The request finishes.
      #   This triggers `proxy:idle`.
      loadStarted()
      promise.always(loadEnded)

    promise

  SAFE_HTTP_METHODS = ['GET', 'OPTIONS', 'HEAD']

  ###*
  Returns `true` if the proxy is not currently waiting
  for a request to finish. Returns `false` otherwise.

  The proxy will also emit an `proxy:idle` [event](/up.bus) if it
  used to busy, but is now idle.

  @method up.proxy.idle
  @return {Boolean} Whether the proxy is idle
  ###
  idle = ->
    pendingCount == 0

  ###*
  Returns `true` if the proxy is currently waiting
  for a request to finish. Returns `false` otherwise.

  The proxy will also emit an `proxy:busy` [event](/up.bus) if it
  used to idle, but is now busy.

  @method up.proxy.busy
  @return {Boolean} Whether the proxy is busy
  ###
  busy = ->
    pendingCount > 0

  loadStarted = ->
    wasIdle = idle()
    pendingCount += 1
    if wasIdle
      emission = ->
        if busy() # a fast response might have beaten the delay
          up.bus.emit('up:proxy:busy')
          busyEventEmitted = true
      if config.busyDelay > 0
        busyDelayTimer = setTimeout(emission, config.busyDelay)
      else
        emission()

  loadEnded = ->
    pendingCount -= 1
    if idle() && busyEventEmitted
      up.bus.emit('up:proxy:idle')
      busyEventEmitted = false

  load = (request) ->
    u.debug('Loading URL %o', request.url)
    up.bus.emit('up:proxy:load', request)
    promise = u.ajax(request)
    promise.always -> up.bus.emit('up:proxy:receive', request)
    promise

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
  @protected
  @method up.proxy.preload
  @return
    A promise that will be resolved when the request was loaded and cached
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

  @method [up-preload]
  @param [up-delay=75]
    The number of milliseconds to wait between hovering
    and preloading. Increasing this will lower the load in your server,
    but will also make the interaction feel less instant.
  @ujs
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
  defaults: config.update
  
)()
