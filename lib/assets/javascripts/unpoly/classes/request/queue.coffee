#= require ../request

u = up.util

class up.Request.Queue extends up.Class

  constructor: (options = {}) ->
    @concurrency = options.concurrency ? -> up.proxy.config.concurrency
    @slowDelay = options.slowDelay ? -> up.proxy.config.slowDelay
    @reset()

  reset: ->
    @queuedRequests = []
    @currentRequests = []
    clearTimeout(@checkSlowTimout)
    @emittedSlow = false

  @getter 'allRequests', ->
    return @currentRequests.concat(@queuedRequests)

  asap: (request) ->
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
    slowDelay = u.evalOption(@slowDelay)
    @checkSlowTimout = setTimeout(@checkSlow, slowDelay)

  hasConcurrencyLeft: ->
    maxConcurrency = u.evalOption(@concurrency)
    return maxConcurrency == -1 || @currentRequests.length < maxConcurrency

  isBusy: ->
    u.reject(@currentRequests, 'preload').length > 0

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
    if request.preload && !up.proxy.shouldPreload(request)
      request.abort('Preloading is disabled')
    else if request.emit('up:proxy:load', { log: ['Loading %s %s', request.method, request.url] }).defaultPrevented
      request.abort('Prevented by event listener')
    else
      @currentRequests.push(request)
      request.load()

  onRequestSettled: (request, responseOrError) ->
    u.remove(@currentRequests, request)
    if (responseOrError instanceof up.Response) && responseOrError.ok
      up.proxy.registerAliasForRedirect(request, responseOrError)

    # Check if we can emit up:proxy:recover after a previous up:proxy:slow event.
    @checkSlow()

    u.microtask(=> @poke())

  poke: ->
    if @hasConcurrencyLeft() && (request = @pluckNextRequest())
      @sendRequestNow(request)

  # Aborting a request will cause its promise to reject, which will also uncache it
  abort: (conditions = true) ->
    reason = u.pluckKey(conditions, 'reason')
    for list in [@currentRequests, @queuedRequests]
      matches = u.filter list, (request) => @requestMatches(request, conditions)
      matches.forEach (match) ->
        match.abort(reason)
        u.remove(list, match)
      return

  requestMatches: (request, conditions) ->
    return conditions == true || request == conditions || conditions(request)

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

    # If slowDelay is 200, we're scheduling the checkSlow() timer after 200 ms.
    # The request must be slow when checkSlow() is called, or we will never look
    # at it again. Since the JavaScript setTimeout() is inaccurate, we allow a request
    # to "be slow" a few ms earlier than actually configured.
    timerTolerance = 1

    return u.some allForegroundRequests, (request) ->
      (now - request.queueTime) >= (delay - timerTolerance)
