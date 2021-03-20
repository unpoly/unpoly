#= require ../request

u = up.util

class up.Request.Queue extends up.Class

  constructor: (options = {}) ->
    @concurrency = options.concurrency ? -> up.network.config.concurrency
    @badResponseTime = options.badResponseTime ? -> up.network.config.badResponseTime
    @reset()

  reset: ->
    @queuedRequests = []
    @currentRequests = []
    clearTimeout(@checkSlowTimout)
    @emittedSlow = false

  @getter 'allRequests', ->
    return @currentRequests.concat(@queuedRequests)

  asap: (request) ->
    request.willQueue()
    u.always request, (responseOrError) => @onRequestSettled(request, responseOrError)

    # When considering whether a request is "slow", we're measing the duration between { queueTime }
    # and the moment when the request gets settled. Note that when setSlowTimer() occurs, it will
    # make its own check whether a request in the queue is considered slow.
    request.queueTime = new Date()
    @setSlowTimer()

    if @hasConcurrencyLeft()
      @sendRequestNow(request)
    else
      @queueRequest(request)

  # Changes a preload request to a non-preload request.
  # Does not change the request's position in the queue.
  # Does nothing if the given request is not a preload request.
  promoteToForeground: (request) ->
    if request.preload
      request.preload = false
      @setSlowTimer()

  setSlowTimer: ->
    badResponseTime = u.evalOption(@badResponseTime)
    @checkSlowTimout = u.timer(badResponseTime, => @checkSlow())

  hasConcurrencyLeft: ->
    maxConcurrency = u.evalOption(@concurrency)
    return maxConcurrency == -1 || @currentRequests.length < maxConcurrency

  isBusy: ->
    @currentRequests.length > 0

  queueRequest: (request) ->
    # Queue the request at the end of our FIFO queue.
    @queuedRequests.push(request)

  pluckNextRequest: ->
    # We always prioritize foreground requests over preload requests.
    # Only when there is no foreground request left in the queue we will send a preload request.
    # Note that if a queued preload request is requested without { preload: true } we will
    # promote it to the foreground (see @promoteToForeground()).
    request = u.find(@queuedRequests, (request) -> !request.preload)
    request ||= @queuedRequests[0]
    return u.remove(@queuedRequests, request)

  sendRequestNow: (request) ->
    if request.emit('up:request:load', { log: ['Loading %s %s', request.method, request.url] }).defaultPrevented
      request.abort('Prevented by event listener')
    else
      # Since up:request:load listeners may have mutated properties used in
      # the request's cache key ({ url, method, params }), we need to normalize
      # again. Normalizing e.g. moves the params into the URL for GET requests.
      request.normalizeForCaching()
      @currentRequests.push(request)
      request.load()

  onRequestSettled: (request, responseOrError) ->
    u.remove(@currentRequests, request)
    if (responseOrError instanceof up.Response) && responseOrError.ok
      up.network.registerAliasForRedirect(request, responseOrError)

    # Check if we can emit up:request:recover after a previous up:request:late event.
    @checkSlow()

    u.microtask(=> @poke())

  poke: ->
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

  abortExcept: (excusedRequest, additionalConditions = true) ->
    excusedCacheKey = excusedRequest.cacheKey()
    @abort (queuedRequest) ->
      queuedRequest.cacheKey() != excusedCacheKey && u.evalOption(additionalConditions, queuedRequest)

  requestMatches: (request, conditions) ->
    return request == conditions || u.evalOption(conditions, request)

  checkSlow: ->
    currentSlow = @isSlow()

    if @emittedSlow != currentSlow
      @emittedSlow = currentSlow

      if currentSlow
        up.emit('up:request:late', log: 'Server is slow to respond')
      else
        up.emit('up:request:recover', log: 'Slow requests were loaded')

  isSlow: ->
    now = new Date()
    delay = u.evalOption(@badResponseTime)
    allForegroundRequests = u.reject(@allRequests, 'preload')

    # If badResponseTime is 200, we're scheduling the checkSlow() timer after 200 ms.
    # The request must be slow when checkSlow() is called, or we will never look
    # at it again. Since the JavaScript setTimeout() is inaccurate, we allow a request
    # to "be slow" a few ms earlier than actually configured.
    timerTolerance = 1

    return u.some allForegroundRequests, (request) ->
      (now - request.queueTime) >= (delay - timerTolerance)
