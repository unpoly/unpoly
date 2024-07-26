const u = up.util

// One route per method and URL (`request.description`).
class Route {

  // A list of `Vary` header names that we have seen in responses
  // to earlier requests with this route's method and URL.
  varyHeaders = new Set()

  // Cached requests for this route's method and URL.
  requests = []

  matchBest(newRequest) {
    let matches = this.requests.filter((cachedRequest) => this.satisfies(cachedRequest, newRequest))
    // Newer requests are always appended
    return u.last(matches)
  }

  delete(request) {
    u.remove(this.requests, request)
  }

  put(request) {
    this.requests.push(request)
  }

  updateVary(response) {
    for (let headerName of response.varyHeaderNames) {
      this.varyHeaders.add(headerName)
    }
  }

  satisfies(cachedRequest, newRequest) {
    if (cachedRequest === newRequest) return true

    return u.every(this.varyHeaders, (varyHeader) => {
      let cachedValue = cachedRequest.header(varyHeader)
      let newValue = newRequest.header(varyHeader)

      if (varyHeader === 'X-Up-Target' || varyHeader === 'X-Up-Fail-Target') {
        // A response that was not tailored to a target is a match for all targets
        if (!cachedValue) return true

        // A response tailored to a target is never a match for a response without a target
        if (!newValue) return false

        let cachedTokens = u.parseTokens(cachedValue, { separator: 'comma' })
        let newTokens = u.parseTokens(newValue, { separator: 'comma' })

        return u.containsAll(cachedTokens, newTokens)
      } else {
        return cachedValue === newValue
      }
    })
  }
}

up.Request.Cache = class Cache {

  constructor() {
    this.reset()
  }

  reset() {
    this._routes = {}
    this._requests = []
  }

  get(request) {
    request = this._wrap(request)
    let route = this._getRoute(request)

    let cachedRequest = route.matchBest(request)
    if (cachedRequest) {
      if (this._isUsable(cachedRequest)) {
        return cachedRequest
      } else {
        // Cache hit, but too old
        this._delete(request, route)
      }
    }
  }

  async put(request) {
    request = this._wrap(request)
    let route = this._getRoute(request)

    // put() is called both (1) before the request was made and (2) when the response was received.
    // A response may carry new Vary headers that we need to respect for future cache lookups.
    let { response } = request
    if (response) route.updateVary(response)

    // Delete all cached requests for which this newer request is also a match.
    // This could also match an earlier entry for the same request.
    let superseded = route.requests.filter((oldRequest) => route.satisfies(request, oldRequest))
    // Delete in two steps so we (1) don't change the list we're iterating over and
    // (2) only rewrite the requests array if necessary.
    for (let r of superseded) { this._delete(r) }

    // Wait for deletion above before we set request.cacheRoute.
    // We are often going to match and delete our own request, and this clears request.cacheRoute.
    request.cacheRoute = route

    // Store the request with the route for fast lookup.
    route.put(request)

    // Store the request in a global list for quick iteration over all cache entries.
    this._requests.push(request)

    // Make sure that our size doesn't exceed our capacity.
    this._limitSize()
  }

  alias(existingCachedRequest, newRequest) {
    // Check if we have a cached copy of the given up.Request or request options.
    // Only the cached copy will have the correct promise that will resolve to a response,
    // even if all other properties match.
    //
    // Calling up.get() will also wrap an options object into an up.Request.
    existingCachedRequest = this.get(existingCachedRequest)

    // If the existing request is no longer in the cache, we have nothing to register an alias against.
    if (!existingCachedRequest) return

    newRequest = this._wrap(newRequest)

    this.track(existingCachedRequest, newRequest, { force: true })
    this.put(newRequest)

    // If the user has passed us request options for `newRequest`, we have constructed
    // the up.Request instance. Return it to the user, who has no other means of accessing it.
    return newRequest
  }

  async track(existingRequest, newRequest, options = {}) {
    newRequest.trackedRequest = existingRequest
    newRequest.state = 'tracking'

    let value

    if (existingRequest._isSettled() && existingRequest.response)
      value = existingRequest.response
    else
      value = await u.always(existingRequest)

    if (value instanceof up.Response) {
      if (options.force || existingRequest.cacheRoute.satisfies(existingRequest, newRequest)) {
        // Remember that newRequest was settled from cache.
        // This makes it a candidate for cache revalidation.
        newRequest.fromCache = true

        // Create a variant where response.request === newRequest.
        // This is needed so up.render({ response }) can see the correct value for response.request.fromCache,
        // which is true for the cache-missing request but false for the cache-hitting request.
        value = u.variant(value, { request: newRequest })

        // respondWith() will check response.ok and either fulfill or reject newRequest's promise.
        newRequest.respondWith(value)

        // Since this request object is never in the cache, we need
        // to expire ourselves when otherRequest is expired.
        u.delegate(newRequest, ['expired', 'state'], () => existingRequest)
      } else {
        // A supposed cache hit turns out to be a cache *miss* due to the response carrying
        // an incompatible Vary header.
        delete newRequest.trackedRequest
        newRequest.state = 'new'

        // The two requests turned out to not be cache hits for each other, as
        // the response carried a Vary header. We will re-process newRequest as if it
        // was just queued.
        options.onIncompatible?.(newRequest)
      }
    } else {
      // Copy terminal state like 'offline' or 'aborted'
      newRequest.state = existingRequest.state
      // If we did not get an up.Response, it must be an error
      newRequest._reject(value)
    }
  }

  // Used by up.Request.Tester
  willHaveSameResponse(existingRequest, newRequest) {
    return existingRequest === newRequest || existingRequest === newRequest.trackedRequest
  }

  evict(condition = true, testerOptions) {
    this._eachMatch(condition, testerOptions,
      // It is generally not a great idea to manipulate the list we're iterating over,
      // but this._eachMatch() copies results before iterating.
      (request) => this._delete(request)
    )
  }

  expire(condition = true, testerOptions) {
    this._eachMatch(condition, testerOptions,
      // We need to force cached responses to be expired, regardless of their age.
      // It may seem strange that we're setting an { expired } property on the *request*
      // instead, but there are two good reasons:
      //
      // (1) The cache only holds request references. These are also promises for their
      //     responses, but we only have sync access to the requests.
      // (2) By marking in-flight requests as stale, this will also expire their responses
      //     when they are eventually received.
      (request) => request.expired = true
    )
  }

  reindex(request) {
    this._delete(request)
    this.put(request)
  }

  _delete(request) {
    u.remove(this._requests, request)
    request.cacheRoute?.delete(request)
    // In the case of reindex(), the cacheRoute is about to change because the request
    // changed URL or params in up:request:load.
    delete request.cacheRoute
  }

  _getRoute(request) {
    return request.cacheRoute || (this._routes[request.description] ||= new Route())
  }

  _isUsable(request) {
    return request.age < up.network.config.cacheEvictAge
  }

  get _size() {
    return this._requests.length
  }

  get _capacity() {
    return up.network.config.cacheSize

  }

  _limitSize() {
    for (let i = 0; i < (this._size - this._capacity); i++) {
      // The _requests array is in insertion order, so the oldest entry will be first
      this._delete(this._requests[0])
    }
  }

  _eachMatch(condition = true, testerOptions, fn) {
    let tester = up.Request.tester(condition, testerOptions)

    // Copy results so evict() can delete from the list we're iterating over
    let results = u.filter(this._requests, tester)

    u.each(results, fn)
  }

  _wrap(requestOrOptions) {
    return u.wrapValue(up.Request, requestOrOptions)
  }

}
