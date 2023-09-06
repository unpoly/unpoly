const u = up.util

up.Request.Cache = class Cache {

  constructor() {
    this.reset()
  }

  reset() {
    this._varyInfo = {}
    this._map = new Map()
  }

  _cacheKey(request) {
    let influencingHeaders = this._getPreviousInfluencingHeaders(request)
    let varyPart = u.flatMap(influencingHeaders, (headerName) => [headerName, request.header(headerName)])
    return [request.description, ...varyPart].join(':')
  }

  _getPreviousInfluencingHeaders(request) {
    // Returns a list of `Vary` header names that we have seen
    // in responses to earlier requests with the same method and URL.
    // This is how we know how fine we must segment our cache buckets.
    return (this._varyInfo[request.description] ||= new Set())
  }

  get(request) {
    request = this._wrap(request)
    let cacheKey = this._cacheKey(request)
    let cachedRequest = this._map.get(cacheKey)

    if (cachedRequest) {
      if (this._isUsable(cachedRequest)) {
        return cachedRequest
      } else {
        this._map.delete(cacheKey)
      }
    }
  }

  get _capacity() {
    return up.network.config.cacheSize

  }

  _isUsable(request) {
    return request.age < up.network.config.cacheEvictAge
  }

  async put(request) {
    request = this._wrap(request)
    this._makeRoom()
    let cacheKey = this._updateCacheKey(request)
    this._map.set(cacheKey, request)
  }

  _updateCacheKey(request) {
    let oldCacheKey = this._cacheKey(request)
    let { response } = request

    if (response) {
      this._mergePreviousHeaderNames(request, response)
      let newCacheKey = this._cacheKey(request)
      this._renameMapKey(oldCacheKey, newCacheKey)
      return newCacheKey
    } else {
      // If we haven't expanded our cache key above, use the old cache key.
      return oldCacheKey
    }
  }

  _renameMapKey(oldKey, newKey) {
    if (oldKey !== newKey && this._map.has(oldKey)) {
      this._map.set(newKey, this._map.get(oldKey))
      this._map.delete(oldKey)
    }
  }

  _mergePreviousHeaderNames(request, response) {
    let headersInfluencingResponse = response.ownInfluncingHeaders
    if (headersInfluencingResponse.length) {
      let previousInfluencingHeaders = this._getPreviousInfluencingHeaders(request)
      for (let headerName of headersInfluencingResponse) {
        previousInfluencingHeaders.add(headerName)
      }
    }
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

    let value = await u.always(existingRequest)

    if (value instanceof up.Response) {
      if (options.force || this._isCacheCompatible(existingRequest, newRequest)) {
        // Remember that newRequest was settles from cache.
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
      newRequest.deferred.reject(value)
    }
  }

  willHaveSameResponse(existingRequest, newRequest) {
    return existingRequest === newRequest || existingRequest === newRequest.trackedRequest
  }

  _delete(request) {
    request = this._wrap(request)
    let cacheKey = this._cacheKey(request)
    this._map.delete(cacheKey)
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

  _makeRoom() {
    while (this._map.size >= this._capacity) {
      let oldestKey = this._map.keys().next().value
      this._map.delete(oldestKey)
    }
  }

  _eachMatch(condition = true, testerOptions, fn) {
    let tester = up.Request.tester(condition, testerOptions)

    // Copy results so evict() can delete from the list we're iterating over
    let results = u.filter(this._map.values(), tester)

    u.each(results, fn)
  }

  _isCacheCompatible(request1, request2) {
    return this._cacheKey(request1) === this._cacheKey(request2)
  }

  _wrap(requestOrOptions) {
    return u.wrapValue(up.Request, requestOrOptions)
  }

}
