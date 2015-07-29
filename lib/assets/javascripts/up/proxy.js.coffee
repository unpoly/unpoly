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

@class up.proxy  
###
up.proxy = (->

  config =
    preloadDelay: 75
    cacheSize: 70
    cacheExpiry: 1000 * 60 * 5

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
  ###
  defaults = (options) ->
    u.extend(config, options)
  
  cache = {}
  
  u = up.util
  
  $waitingLink = null
  delayTimer = null
  
  cacheKey = (request) ->
    normalizeRequest(request)
    [ request.url, 
      request.method, 
      request.selector
    ].join('|')
    
  trim = ->
    keys = u.keys(cache)
    if keys.length > config.cacheSize
      oldestKey = null
      oldestTimestamp = null
      u.each keys, (key) ->
        promise = cache[key] # we don't need to call cacheKey here
        timestamp = promise.timestamp
        if !oldestTimestamp || oldestTimestamp > timestamp
          oldestKey = key
          oldestTimestamp = timestamp
      delete cache[oldestKey] if oldestKey
    
  timestamp = ->
    (new Date()).valueOf()
    
  normalizeRequest = (request) ->
    debugger unless u.isHash(request)
    unless request._normalized
      request.method = u.normalizeMethod(request.method)
      request.url = u.normalizeUrl(request.url) if request.url
      request.selector ||= 'body'
      request._normalized = true
    request
    
  alias = (oldRequest, newRequest) ->
    u.debug("Aliasing %o to %o", oldRequest, newRequest)
    if promise = get(oldRequest)
      set(newRequest, promise)
  
  ###*
  Makes a request to the given URL and caches the response.
  If the response was already cached, returns the HTML instantly.
  
  If requesting a URL that is not read-only, the response will
  not be cached and the entire cache will be cleared.
  Only requests with a method of `GET`, `OPTIONS` and `HEAD`
  are considered to be read-only.
  
  @method up.proxy.ajax
  @param {String} request.url
  @param {String} [request.method='GET']
  @param {String} [request.selector]
  @param {Boolean} [request.cache]
    Whether to use a cached response, if available.
    If set to `false` a network connection will always be attempted.
  ###
  ajax = (options) ->
    forceCache = u.castsToTrue(options.cache)
    ignoreCache = u.castsToFalse(options.cache)

    request = u.only(options, 'url', 'method', 'selector', '_normalized')

    # We don't cache non-GET responses unless `options.cache`
    # is explicitly set to `true`.
    if !isIdempotent(request) && !forceCache
      clear()
      promise = u.ajax(request)
    # If a cached response is available, we use it unless
    # `options.cache` is explicitly set to `false`.
    else if (promise = get(request)) && !ignoreCache
      promise
    else
      promise = u.ajax(request)
      set(request, promise)

    promise

  SAFE_HTTP_METHODS = ['GET', 'OPTIONS', 'HEAD']
    
  isIdempotent = (request) ->
    normalizeRequest(request)
    u.contains(SAFE_HTTP_METHODS, request.method)
    
  ensureIsIdempotent = (request) ->
    isIdempotent(request) or u.error("Won't preload non-GET request %o", request)
    
  isFresh = (promise) ->
    timeSinceTouch = timestamp() - promise.timestamp
    timeSinceTouch < config.cacheExpiry

  ###*
  @protected
  @method up.proxy.get
  ###
  get = (request) ->
    key = cacheKey(request)
    if promise = cache[key]
      if !isFresh(promise)
        u.debug("Discarding stale cache entry for %o (%o)", request.url, request)
        remove(request)
        undefined
      else
        u.debug("Cache hit for %o (%o)", request.url, request)
#        $('body').css('background-color': 'green')
        promise
    else
      u.debug("Cache miss for %o (%o)", request.url, request)
      undefined

  ###*
  @protected
  @method up.proxy.set
  ###
  set = (request, promise) ->
    trim()
    key = cacheKey(request)
    promise.timestamp = timestamp()
    cache[key] = promise
    promise

  ###*
  @protected
  @method up.proxy.remove
  ###
  remove = (request) ->
    key = cacheKey(request)
    delete cache[key]

  ###*
  @protected
  @method up.proxy.clear
  ###
  clear = ->
    cache = {}
  
  checkPreload = ($link) ->
    delay = parseInt(u.presentAttr($link, 'up-delay')) || config.preloadDelay 
    unless $link.is($waitingLink)
      $waitingLink = $link
      cancelDelay()
      curriedPreload = -> preload($link)
      startDelay(curriedPreload, delay)
      
  startDelay = (block, delay) ->
    delayTimer = setTimeout(block, delay)
    
  cancelDelay = ->
    clearTimeout(delayTimer)
    delayTimer = null

  ###*
  @protected
  @method up.proxy.preload
  @return
    A promise that will be resolved when the request was loaded and cached
  ###
  preload = (linkOrSelector, options) ->
    $link = $(linkOrSelector)
    options = u.options(options)

    alert("hier ist noch ein fehler! options wird immer idempotent sein!")

    ensureIsIdempotent(options)
    u.debug("Preloading %o", $link)
    options.preload = true
    up.link.follow(link, options)
    
  reset = ->
    cancelDelay()
    cache = {}

  up.bus.on 'framework:reset', reset

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
      checkPreload(up.link.resolve($element))

  preload: preload
  ajax: ajax
  get: get
  set: set
  alias: alias
  clear: clear
  remove: remove
  defaults: defaults
  
)()
