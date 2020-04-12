#= require ../request

u = up.util

class up.Request.Queue extends up.Class

  constructor: (options = {}) ->
    @concurrency = options.concurrency ? -> up.proxy.config.concurrency
    @preloadQueueSize = options.preloadQueueSize ? -> up.proxy.config.preloadQueueSize
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
    request.queuedAt = new Date()
    if @hasConcurrencyLeft()
      @sendRequestNow(request)
    else
      if request.preload
        if @hasPreloadQueueSpaceLeft()
          @queueRequest(request)
        else if oldestQueuedPreloadRequest = @oldestPreloadRequest(@queuedRequests)
          @abort(oldestQueuedPreloadRequest)
          @queueRequest(request)
        else
          # This can only happen if preloadQueueSize is zero.
          @abort(request)
      else
        if oldestCurrentPreloadRequest = @oldestPreloadRequest(@currentRequests)
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
      @checkSlowTimout = setTimeout(@checkSlow, slowDelay)

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

  oldestPreloadRequest: (list) ->
    u.find(list, 'preload')

  pluckNextRequest: ->
    # We process the most recently queued request first.
    # The assumption is that recently queued requests are caused by a recent user interaction.
    lifoQueue = u.reverse(@queuedRequests)

    # We always prioritize foreground requests over preload requests.
    # Only when there is no foreground request left in the queue we will send a preload request.
    # Note that if a queued preload request is requested without { preload: true } we will
    # promote it to the foreground (see @promoteToForeground()).
    request = u.find(lifoQueue, (request) -> !request.preload)
    request ||= lifoQueue[0]
    return u.remove(@queuedRequests, request)

  sendRequestNow: (request) ->
    log = ['Loading %s %s', request.method, request.url]
    event = request.emit('up:proxy:load', { log })

    if !event.defaultPrevented
      @currentRequests.push(request)
      request.send()
      u.always request, (value) => @onRequestSettled(request, value)
    else
      request.abort()

  onRequestSettled: (request, value) ->
    u.remove(@currentRequests, request)

    # Check if the settlement value is a up.Response (which has #text) or an error
    if value.text
      if value.ok
        up.proxy.registerAliasForRedirect(request, value)

      request.emit 'up:proxy:loaded',
        log: ['Server responded with HTTP %d (%d bytes)', value.status, value.text.length]
        response: value
    else if !value.aborted
      request.emit 'up:proxy:fatal',
        log: 'Fatal error during request'
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

    return u.some allForegroundRequests, (request) ->
      (now - request.queuedAt) > delay
