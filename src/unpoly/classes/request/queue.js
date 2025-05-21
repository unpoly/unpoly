const u = up.util

up.Request.Queue = class Queue {

  constructor() {
    this.reset()
  }

  reset() {
    this._queuedRequests = []
    this._currentRequests = []
    this._emittedLate = false
  }

  get allRequests() {
    return this._currentRequests.concat(this._queuedRequests)
  }

  asap(request) {
    request.runQueuedCallbacks()
    u.always(request, (responseOrError) => this._onRequestSettled(request, responseOrError))

    // When considering whether a request is "slow", we're measuring the duration between request.queuedAt
    // and the moment when the request gets settled. Note that when setSlowTimer() occurs, it will
    // make its own check whether a request in the queue is considered slow.
    this._scheduleSlowTimer(request)
    this._queueRequest(request)
    queueMicrotask(() => this._poke())
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

      // If the request has been loading longer than its lateDelay, we have
      // already ignored its up:network:late event. Hence we schedule another check.
      this._scheduleSlowTimer(request)
    }
  }

  _scheduleSlowTimer(request) {
    if (!request.isTimed()) return

    // In case the request was loading in the background before it was promoted to
    // the foreground, the request may have less time left than request.lateDelay.
    let timeUntilLate = Math.max(request.effectiveLateTime - request.age)

    // We may have multiple timers running concurrently.
    // Nonethess we don't emit duplicate events due to the check in @_checkLate().
    u.timer(timeUntilLate, () => this._checkForLate())
  }

  _getMaxConcurrency() {
    return u.evalOption(up.network.config.concurrency)
  }

  _hasConcurrencyLeft() {
    const maxConcurrency = this._getMaxConcurrency()
    return (maxConcurrency === -1) || (this._currentRequests.length < maxConcurrency)
  }

  isBusy() {
    return this._currentRequests.length > 0 || this._queuedRequests.length > 0
  }

  _queueRequest(request) {
    // Queue the request at the end of our FIFO queue.
    this._queuedRequests.push(request)
  }

  _pluckNextRequest() {
    // We always prioritize foreground requests over background requests.
    // Only when there is no foreground request left in the queue we will send a background request.
    // Note that if a queued preload request is requested without { preload: true } we will
    // promote it to the foreground (see @promoteToForeground()).
    let request = u.find(this._queuedRequests, (request) => !request.background)
    request ||= this._queuedRequests[0]
    return u.remove(this._queuedRequests, request)
  }

  _sendRequestNow(request) {
    if (request.load()) {
      this._currentRequests.push(request)
    }
  }

  _onRequestSettled(request, responseOrError) {
    // If the request was aborted before it was sent, it still sits in @queuedRequests.
    u.remove(this._currentRequests, request) || u.remove(this._queuedRequests, request)

    queueMicrotask(() => this._poke())

    // Check if we can emit up:network:recover after a previous up:network:late event.
    // We do give other code one more task to queue another requests, e.g. a queued watcher diff.
    // This way a long-running chain of requests only shows a single, un-interrupted progress bar.
    u.task(() => this._checkForRecover())
  }

  _poke() {
    let request
    if (this._hasConcurrencyLeft() && (request = this._pluckNextRequest())) {
      return this._sendRequestNow(request)
    }
  }

  // Aborting a request will cause its promise to reject, which will also uncache it
  abort(...args) {
    let [conditions = true, { except, reason, logOnce }] = u.args(args, 'val', 'options')

    let tester = up.Request.tester(conditions, { except })

    for (let list of [this._currentRequests, this._queuedRequests]) {
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

  _checkForLate() {
    if (!this._emittedLate && this._hasLateTimedRequests()) {
      this._emittedLate = true
      up.emit('up:network:late', { log: 'Server is slow to respond' })
    }
  }

  _checkForRecover() {
    // We we ever emitted "late" (and probably are showing a progress bar), we wait for the
    // entire queue to clear before we emit "recover". This includes waiting for non-late requests.
    // This is to show a continuous progress bar for a chain of queued requests, e.g.
    // when a pending watch callback waits for a previous callback to finish.
    if (this._emittedLate && !this._timedRequests.length) {
      this._emittedLate = false
      up.emit('up:network:recover', { log: 'Slow requests were loaded' })
    }
  }

  get _timedRequests() {
    // Exclude requests that return false.
    // These are requests that were initialized with { lateDelay: false } or { background: true }.
    return this.allRequests.filter((request) => request.isTimed())
  }

  // Returns queued requests that are (1) timed (effectiveLateTime not false)
  // and (2) have been longer queued than their effectiveLateTime.
  _hasLateTimedRequests() {
    // If lateDelay is 200, we're scheduling the _checkLate() timer after 200 ms.
    // The request must be slow when _checkLate() is called, or we will never look
    // at it again. Since the JavaScript setTimeout() is inaccurate, we allow a request
    // to "be slow" a few ms earlier than actually configured.
    const timerTolerance = 1
    const isLate = (request) => request.age >= (request.effectiveLateTime - timerTolerance)
    return u.some(this._timedRequests, isLate)
  }

}
