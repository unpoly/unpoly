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
        else if oldestQueuedPreloadRequest = u.find(@queuedRequests, 'preload')
          @abort(oldestQueuedPreloadRequest)
          @queueRequest(request)
        else
          @abort(request)
      else
        if oldestCurrentPreloadRequest = u.find(@currentRequests, 'preload')
          @abort(oldestCurrentPreloadRequest)
          @sendRequestNow(request)
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
      setTimeout(@checkSlow, slowDelay)

  hasConcurrencyLeft: ->
    maxConcurrency = u.evalOption(@concurrency)
    return maxConcurrency == -1 || @currentRequests.length < maxConcurrency

  hasPreloadQueueSpaceLeft: ->
    maxSize = u.evalOption(@preloadQueueSize)
    return maxSize == -1 || u.filter(@queuedRequests, 'preload').length < maxSize

  isBusy: ->
    u.reject(@currentRequests, 'preload').length > 0

  queueRequest: (request) ->
    @queuedRequests.push(request)

  pluckNextRequest: ->
    @queuedRequests.shift()

  sendRequestNow: (request) ->
    eventProps =
      request: request
      log: ['Loading %s %s', request.method, request.url]

    if up.event.nobodyPrevents('up:proxy:load', eventProps)
      @currentRequests.push(request)
      request.send()
      u.always request, (value) => @onRequestSettled(request, value)
    else
      request.abort()

  onRequestSettled: (request, value) ->
    u.remove(@currentRequests, request)

    # Check if the settlement value is a up.Response (which has #text) or an error
    if value.text
      if value.isSuccess()
        up.proxy.registerAliasForRedirect(request, value)

      up.emit 'up:proxy:loaded',
        log: ['Server responded with HTTP %d (%d bytes)', value.status, value.text.length]
        request: request
        response: value
    else
      up.emit 'up:proxy:fatal',
        log: 'Fatal error during request'
        request: request
        error: value

    @checkSlow()

    u.microtask(@poke)

  poke: =>
    if @hasConcurrencyLeft() && (request = @pluckNextRequest())
      @sendRequestNow(request)

  # Aborting a request will cause its promise to reject, which will also uncache it
  abort: (conditions = true) ->
    for list in [@currentRequests, @queuedRequests]
      matches = u.filter list, (request) => @requestMatches(request, conditions)
      matches.forEach (match) ->
        match.abort()
        u.remove(list, match)
      return

  requestMatches: (request, conditions) ->
    return conditions == true ||
      u.objectContains(request, conditions)

  checkSlow: =>
    currentSlow = @isSlow()

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
