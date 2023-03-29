const u = up.util

up.Request.Cache3 = class Cache3 {

  constructor() {
    this.reset()
  }

  reset() {
    this.varyInfo = {}
    this.map = new Map()
  }

  cacheKey(request) {
    let varyHeaderNames = this.getPreviousVaryHeaderNames(request)

    // TODO: Requests don't know their headers until they are sent

    let varyPart = u.flatMap(varyHeaderNames, (headerName) => [headerName, request.header(headerName)])
    return [request.description, ...varyPart].join(':')
  }

  getPreviousVaryHeaderNames(request) {
    // Returns a list of `Vary` header names that we have seen
    // in responses to earlier requests with the same method and URL.
    // This is how we know how fine we must segment our cache buckets.
    return (this.varyInfo[request.description] ||= new Set())
  }

  get(request) {
    console.debug("[cache] get() called with %o", request.description)

    let cacheKey = this.cacheKey(request)
    let cachedRequest = this.map.get(cacheKey)

    console.debug("[cache] cache hit is %o", cachedRequest)

    if (cachedRequest) {
      if (this.isUsable(cachedRequest)) {
        return cachedRequest
      } else {
        this.map.delete(cacheKey)
      }
    }
  }

  get maxSize() {
    return up.network.config.cacheSize

  }

  isUsable(request) {
    const evictAge = up.network.config.cacheEvictAge
    const age = new Date() - request.queuedAt
    return age < evictAge
  }

  async put(request) {
    console.debug("[cache] put() called for %o", request.description)
    this.makeRoom()
    let cacheKey = this.updateCacheKey(request)
    this.map.set(cacheKey, request)
  }

  updateCacheKey(request) {
    let oldCacheKey = this.cacheKey(request)
    let { response } = request

    if (response) {
      this.mergePreviousHeaderNames(request, response)
      let newCacheKey = this.cacheKey(request)
      this.renameMapKey(oldCacheKey, newCacheKey)
      return newCacheKey
    } else {
      // If we haven't expanded our cache key above, use the old cache key.
      return oldCacheKey
    }
  }

  renameMapKey(oldKey, newKey) {
    if (this.map.has(oldKey)) {
      this.map.set(newKey, this.map.get(oldKey))
      this.map.delete(oldKey)
    }
  }

  mergePreviousHeaderNames(request, response) {
    let responseVaryHeaderNames = response.ownVaryHeaderNames
    if (responseVaryHeaderNames.length) {
      let previousVaryHeaderNames = this.getPreviousVaryHeaderNames(request)
      for (let varyHeaderName of responseVaryHeaderNames) {
        previousVaryHeaderNames.add(varyHeaderName)
      }
    }
  }

  alias(existingCachedRequest, newRequest) {
    this.connect(existingCachedRequest, newRequest, { force: true })
    this.put(newRequest)
  }

  async connect(existingCachedRequest, newRequest, options = {}) {
    let value = await u.always(existingCachedRequest)

    if (value instanceof up.Response) {
      console.debug("[cache] connect settles to response %o", value.text)

      if (options.force || this.isCacheCompatible(existingCachedRequest, newRequest)) {
        console.debug("[cache] they are compatible")
        // Remember that newRequest was settles from cache.
        // This makes it a candidate for cache revalidation.
        newRequest.fromCache = true

        // respondWith() will check response.ok and either fulfill or reject newRequest's promise.
        newRequest.respondWith(value)

        // Since this request object is never in the cache, we need
        // to expire ourselves when otherRequest is expired.
        u.delegate(newRequest, ['expired', 'state'], () => existingCachedRequest)
      } else {
        console.debug("[cache] they are incompatible")
        // The two requests turned out to not be cache hits for each other, as
        // the response carried a Vary header. We will re-process newRequest as if it
        // was just queued.
        options.onIncompatible?.(newRequest)
      }
    } else {
      // If we did not get an up.Response, it must be an error
      newRequest.deferred.reject(value)
    }
  }

  delete(request) {
    let cacheKey = this.cacheKey(request)
    this.map.delete(cacheKey)
  }

  evict(condition = true, testerOptions) {
    this.eachMatch(condition, testerOptions,
      // It is generally not a great idea to manipulate the list we're iterating over,
      // but this.eachMatch() copies results before iterating.
      (request) => this.delete(request)
    )
  }

  expire(condition = true, testerOptions) {
    this.eachMatch(condition, testerOptions,
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

  makeRoom() {
    if (this.maxSize === 0) {
      throw "Disabling the cache with maxSize 0 is no longer supported. Use up.network.config.autoCache = false instead."
    }

    while (this.map.size >= this.maxSize) {
      let oldestKey = this.map.keys().next().value
      this.map.delete(oldestKey)
    }
  }

  eachMatch(condition = true, testerOptions, fn) {
    let tester = up.Request.tester(condition, testerOptions)

    // Copy results so evict() can delete from the list we're iterating over
    let results = u.filter(this.map.values(), tester)

    u.each(results, fn)
  }

  // Used by up.Request.tester({ except })
  isCacheCompatible(request1, request2) {
    return this.cacheKey(request1) === this.cacheKey(request2)
  }

}
