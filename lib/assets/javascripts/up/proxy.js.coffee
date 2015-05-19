###*
Caching and preloading
======================

All HTTP requests go through the Up.js proxy.
It caches a limited number
  
The cache is cleared whenever the user makes a non-´GET` request
(like `POST`, `PUT`, `DELETE`).

The proxy can also used to speed up reaction times by preloading
links when the user hovers over the click area (or puts the mouse/finger
down before releasing). This way the
response will already be cached when the user performs the click.   

@class up.proxy  
###
up.proxy = (->

  config =
    preloadDelay: 50
    cacheSize: 70
    cacheExpiry: 1000 * 60 * 5

  ###*
  @method up.proxy.defaults
  @param {Number} [preloadDelay]
  @param {Number} [cacheSize]
  @param {Number} [cacheExpiry]
    The number of milliseconds until a cache entry expires.
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
    unless request._requestNormalized
      request.method = u.normalizeMethod(request.method)
      request.url = u.normalizeUrl(request.url) if request.url
      request.selector ||= 'body'
      request._requestNormalized = true
    request
    
  alias = (oldRequest, newRequest) ->
    u.debug("Aliasing %o to %o", oldRequest, newRequest)
    if promise = get(oldRequest)
      set(newRequest, promise)
  
  ###
  @method up.proxy.ajax
  @param {String} options.url
  @param {String} [options.method='GET']
  @param {String} [options.selector]
  ###
  ajax = (request) ->
    if !isIdempotent(request)
      clear()
      # We don't cache non-GET responses
      promise = u.ajax(request)
    else if promise = get(request)
      touch(promise)
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
    
  touch = (promise) ->
    promise.timestamp = timestamp()
    
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
#      $('body').css('background-color': 'yellow')
      undefined
      
  set = (request, promise) ->
    trim()
    key = cacheKey(request)
    cache[key] = promise
    touch(promise)
    promise
    
  remove = (request) ->
    key = cacheKey(request)
    delete cache[key]
    
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

  preload = (link, options) ->
    options = u.options()
    ensureIsIdempotent(options)
    u.debug("Preloading %o", link)
    options.preload = true
    up.link.follow(link, options)
    
  reset = ->
    cancelDelay()
    cache = {}

  up.bus.on 'framework:reset', reset

  ###
  Links with an `up-preload` attribute will silently fetch their target
  when the user hovers over the click area, or when the user puts her
  mouse/finger down (before releasing). This way the
  response will already be cached when the user performs the click,
  making the interaction feel instant.   

  @method [up-preload]
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
  defaults: defaults
  
)()
