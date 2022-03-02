const u = up.util

up.Request.Queue = class Queue {

  constructor(options = {}) {
    this.concurrency = options.concurrency ?? (() => up.network.config.concurrency)
    this.badResponseTime = options.badResponseTime ?? (() => up.network.config.badResponseTime)
    this.reset()
  }

  reset() {
    this.queuedRequests = []
    this.currentRequests = []
    clearTimeout(this.checkSlowTimout)
    this.emittedSlow = false
  }

  get allRequests() {
    return this.currentRequests.concat(this.queuedRequests)
  }

  asap(request) {
    request.runQueuedCallbacks()
    u.always(request, responseOrError => this.onRequestSettled(request, responseOrError))

    // When considering whether a request is "slow", we're measing the duration between { queueTime }
    // and the moment when the request gets settled. Note that when setSlowTimer() occurs, it will
    // make its own check whether a request in the queue is considered slow.
    request.queueTime = new Date()
    this.setSlowTimer()
    this.queueRequest(request)
    u.microtask(() => this.poke())
  }

  // Changes a preload request to a non-preload request.
  // Does not change the request's position in the queue.
  // Does nothing if the given request is not a preload request.
  promoteToForeground(request) {
    if (request.preload) {
      request.preload = false
      return this.setSlowTimer()
    }
  }

  setSlowTimer() {
    const badResponseTime = u.evalOption(this.badResponseTime)
    this.checkSlowTimout = u.timer(badResponseTime, () => this.checkSlow())
  }

  hasConcurrencyLeft() {
    const maxConcurrency = u.evalOption(this.concurrency)
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
    // We always prioritize foreground requests over preload requests.
    // Only when there is no foreground request left in the queue we will send a preload request.
    // Note that if a queued preload request is requested without { preload: true } we will
    // promote it to the foreground (see @promoteToForeground()).
    let request = u.find(this.queuedRequests, request => !request.preload)
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

    // Check if we can emit up:request:recover after a previous up:request:late event.
    this.checkSlow()

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

  checkSlow() {
    const currentSlow = this.isSlow()

    if (this.emittedSlow !== currentSlow) {
      this.emittedSlow = currentSlow

      if (currentSlow) {
        up.emit('up:request:late', { log: 'Server is slow to respond' })
      } else {
        up.emit('up:request:recover', { log: 'Slow requests were loaded' })
      }
    }
  }

  isSlow() {
    const now = new Date()
    const delay = u.evalOption(this.badResponseTime)
    const allForegroundRequests = u.reject(this.allRequests, 'preload')

    // If badResponseTime is 200, we're scheduling the checkSlow() timer after 200 ms.
    // The request must be slow when checkSlow() is called, or we will never look
    // at it again. Since the JavaScript setTimeout() is inaccurate, we allow a request
    // to "be slow" a few ms earlier than actually configured.
    const timerTolerance = 1

    return u.some(allForegroundRequests, request => (now - request.queueTime) >= (delay - timerTolerance))
  }
}
