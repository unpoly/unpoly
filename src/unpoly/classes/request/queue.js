const u = up.util

up.Request.Queue = class Queue {

  constructor() {
    this.reset()
  }

  reset() {
    this.queuedRequests = []
    this.currentRequests = []
    this.emittedLate = false
  }

  get allRequests() {
    return this.currentRequests.concat(this.queuedRequests)
  }

  asap(request) {
    request.runQueuedCallbacks()
    u.always(request, responseOrError => this.onRequestSettled(request, responseOrError))

    // When considering whether a request is "slow", we're measing the duration between { queuedAt }
    // and the moment when the request gets settled. Note that when setSlowTimer() occurs, it will
    // make its own check whether a request in the queue is considered slow.
    request.queuedAt = new Date()
    this.scheduleSlowTimer(request)
    this.queueRequest(request)
    u.microtask(() => this.poke())
  }

  // Promotes a background request to a non-background request.
  //
  // Does not change the request's position in the queue, but foreground requests
  // are prioritized when picking the next request under concurrency constraints.
  //
  // Does nothing if the given request is not a background request.
  promoteToForeground(request) {
    if (request.background) {
      request.background = false

      // If the request has been loading longer than its badResponseTime, we have
      // already ignored its up:network:late event. Hence we schedule another check.
      this.scheduleSlowTimer(request)
    }
  }

  scheduleSlowTimer(request) {
    // In case the request was loading in the background before it was promoted to
    // the foreground, the request may have less time left than request.badResponseTime.
    let timeUntilLate = Math.max(request.badResponseTime - request.queueAge, 0)

    // We may have multiple timers running concurrently.
    // Nonethess we don't emit duplicate events due to the check in @checkLate().
    u.timer(timeUntilLate, () => this.checkLate())
  }

  getMaxConcurrency() {
    return u.evalOption(up.network.config.concurrency)
  }

  hasConcurrencyLeft() {
    const maxConcurrency = this.getMaxConcurrency()
    return (maxConcurrency === -1) || (this.currentRequests.length < maxConcurrency)
  }

  isBusy() {
    return this.currentRequests.length > 0 || this.queuedRequests.length > 0
  }

  queueRequest(request) {
    // Queue the request at the end of our FIFO queue.
    this.queuedRequests.push(request)
  }

  pluckNextRequest() {
    // We always prioritize foreground requests over background requests.
    // Only when there is no foreground request left in the queue we will send a background request.
    // Note that if a queued preload request is requested without { preload: true } we will
    // promote it to the foreground (see @promoteToForeground()).
    let request = u.find(this.queuedRequests, request => !request.background)
    request ||= this.queuedRequests[0]
    return u.remove(this.queuedRequests, request)
  }

  sendRequestNow(request) {
    if (request.emit('up:request:load', { log: ['Loading %s %s', request.method, request.url] }).defaultPrevented) {
      request.abort({ reason: 'Prevented by event listener' })
    } else {
      // Since up:request:load listeners may have mutated properties used in
      // the request's cache key ({ url, method, params }), we need to normalize
      // again. Normalizing e.g. moves the params into the URL for GET requests.
      request.normalizeForCaching()

      this.currentRequests.push(request)
      request.load()
    }
  }

  onRequestSettled(request, responseOrError) {
    // If the request was aborted before it was sent, it still sits in @queuedRequests.
    u.remove(this.currentRequests, request) || u.remove(this.queuedRequests, request)

    if ((responseOrError instanceof up.Response) && responseOrError.ok) {
      up.network.registerAliasForRedirect(request, responseOrError)
    }

    // Check if we can emit up:network:recover after a previous up:network:late event.
    this.checkLate()

    u.microtask(() => this.poke())
  }

  poke() {
    let request
    if (this.hasConcurrencyLeft() && (request = this.pluckNextRequest())) {
      return this.sendRequestNow(request)
    }
  }

  // Aborting a request will cause its promise to reject, which will also uncache it
  abort(...args) {
    let options = u.extractOptions(args)
    let { except, reason, logOnce } = options

    let conditions = args[0] ?? true

    let tester = up.Request.tester(conditions, { except })
    for (let list of [this.currentRequests, this.queuedRequests]) {
      const abortableRequests = u.filter(list, tester)
      for (let abortableRequest of abortableRequests) {
        if (logOnce) {
          up.puts(...logOnce)
          logOnce = null
        }
        abortableRequest.abort({ reason })
        // Avoid changing the list we're iterating over.
        u.remove(list, abortableRequest)
      }
    }
  }

  checkLate() {
    const currentLate = this.isLate()

    if (this.emittedLate !== currentLate) {
      this.emittedLate = currentLate

      if (currentLate) {
        up.emit('up:network:late', { log: 'Server is slow to respond' })
      } else {
        up.emit('up:network:recover', { log: 'Slow requests were loaded' })
      }
    }
  }

  isLate() {
    const allForegroundRequests = u.reject(this.allRequests, 'background')

    // If badResponseTime is 200, we're scheduling the checkLate() timer after 200 ms.
    // The request must be slow when checkLate() is called, or we will never look
    // at it again. Since the JavaScript setTimeout() is inaccurate, we allow a request
    // to "be slow" a few ms earlier than actually configured.
    const timerTolerance = 1

    return u.some(allForegroundRequests, request => request.queueAge >= (request.badResponseTime - timerTolerance))
  }
}
