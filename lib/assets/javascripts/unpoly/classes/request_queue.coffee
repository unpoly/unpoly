u = up.util

class up.RequestQueue extends up.Class

  constructor: (options = {}) ->
    @concurrency = options.concurrency ? -> up.proxy.config.concurrency
    @preloadQueueSize = options.preloadQueueSize ? -> up.proxy.config.preloadQueueSize
    @slowDelay = options.slowDelay ? -> up.proxy.config.slowDelay
    @reset()

  reset: ->
    @queuedRequests = []
    @currentRequests = []
    @emittedSlow = false

  @getter 'allRequests', ->
    return @currentRequests.concat(@queuedRequests)

  asap: (request) ->
    request.queuedAt = new Date()
    if @hasConcurrencyLeft()
      @sendRequestNow(request)
    else
      if request.preload
        if @hasPreloadQueueSpaceLeft()
          @queueRequest(request)
        else if oldestQueuedPreloadRequest = u.detect(@queuedRequests, 'preload')
          @abort(oldestQueuedPreloadRequest)
          @queueRequest(request)
        else
          @abort(request)
      else
        if oldestCurrentPreloadRequest = u.detect(@currentRequests, 'preload')
          @abort(oldestCurrentPreloadRequest)
          @sendRequestNow()
        else
          @queueRequest(request)

    @setSlowTimer(request)

    return request

  promoteToForeground: (request) ->
    if request.preload && @contains(request)
      request.preload = false
      @setSlowTimer(request)

  contains: (request) ->
    u.contains(@allRequests, request)

  setSlowTimer: (request) ->
    unless request.preload || request.aborted
      slowDelay = u.evalOption(@slowDelay)
      timer = setTimeout(@checkSlow, slowDelay)
      request.finally =>
        # If the request settled before the timer, we don't need it anymore.
        clearTimeout(timer)
        # In case a slow request eventually settled, we need to checkSlow() again
        # for a chance to emit up:proxy:recover.
        @checkSlow()

  hasConcurrencyLeft: ->
    maxConcurrency = u.evalOption(@concurrency)
    return maxConcurrency == -1 || @currentRequests.length < maxConcurrency

  hasPreloadQueueSpaceLeft: ->
    maxSize = u.evalOption(@preloadQueueSize)
    return maxSize == -1 || u.filter(@queuedRequests, 'preload').length < maxSize

  isBusy: ->
    @currentRequests.length > 0

  queueRequest: (request) ->
    @queuedRequests.push(request)

  pluckNextRequest: ->
    @queuedRequests.shift()

  sendRequestNow: (request) ->
    @currentRequests.push(request)
    request.start()
    request.finally => @onRequestSettled(request)

#    returnValue = request.start()
#
#    console.debug("return value of request %o is %o (isPromise == %o)", request.uid, returnValue, u.isPromise(returnValue))
#
#    if u.isPromise(returnValue)
#      u.finally(returnValue, => @onRequestDone(request))
#    else
#      @onRequestDone(request)

  onRequestSettled: (request) ->
    u.remove(@currentRequests, request)
    u.microrequest(@poke)

  poke: ->
    if @hasConcurrencyLeft() && (request = @pluckNextRequest())
      @sendRequestNow(request)

  abortList: (list, conditions) ->
    matches = u.select list, (request) => @requestMatches(request, conditions)
    matches.forEach (match) ->
      match.abort()
      u.remove(list, match)
    return

  requestMatches: (request, conditions) ->
    return conditions == true ||
      u.objectContains(request, conditions) ||

  abort: (conditions = true) ->
    @abortList(@currentRequests, conditions)
    @abortList(@queuedRequests, conditions)

  checkSlow: =>
    currentSlow = @isSlow()

    console.debug("--- checkSlow(); currentSlow is %o", currentSlow)

    if @emittedSlow != currentSlow
      @emittedSlow = currentSlow

      if currentSlow
        up.emit('up:proxy:slow', log: 'Proxy is slow to respond')
      else
        up.emit('up:proxy:recover', log: 'Proxy has recovered from slow response')

  isSlow: ->
    now = new Date()
    delay = u.evalOption(@slowDelay)
    allForegroundRequests = u.reject(@allRequests, 'preload')

    return u.some allForegroundRequests, (request) ->
      (now - request.queuedAt) > delay
