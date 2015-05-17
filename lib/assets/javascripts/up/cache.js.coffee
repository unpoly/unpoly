###*
Caching and preloading
======================
  
Document me.

@class up.cache  
###
up.cache = (->

  DELAY = 50
  SIZE = 70
  DURATION = 1000 * 60 * 5
  
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
    if keys.length > SIZE
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
    u.debug("normalizing request %o", request)
    unless request._requestNormalized
      request.method = u.normalizeMethod(request.method)
      request.url = u.normalizeUrl(request.url) if request.url
      request.selector ||= 'body'
      request._requestNormalized = true
    request
    
  alias = (oldRequest, newRequest) ->
    console.log("Aliasing %o to %o", oldRequest, newRequest)
    if promise = get(oldRequest)
      set(newRequest, promise)
    
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
    
  isIdempotent = (request) ->
    normalizeRequest(request)
    request.method == 'GET'
    
  ensureIsIdempotent = (request) ->
    isIdempotent(request) or u.error("Won't preload non-GET request %o", request)
    
  isFresh = (promise) ->
    timeSinceTouch = timestamp() - promise.timestamp
    timeSinceTouch < DURATION
    
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
    unless $link.is($waitingLink)
      $waitingLink = $link
      cancelDelay()
      startDelay(-> preload($link))
      
  startDelay = (block) ->
    delayTimer = setTimeout(block, DELAY)
    
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
  
)()
