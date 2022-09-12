let u = up.util

up.Request.Cache = class Cache extends up.Cache {

  maxSize() {
    return up.network.config.cacheSize
  }

  evictAge() {
    return up.network.config.cacheEvictAge
  }

  normalizeStoreKey(request) {
    return u.wrapValue(up.Request, request).cacheKey()
  }

  evict(condition = true, testerOptions) {
    this.eachMatch(condition, testerOptions,
      // It is generally not a great idea to manipulate the list we're iterating over,
      // but the implementation of up.Cache#each copies keys before iterating.
      ({ key }) => this.map.delete(key)
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
      ({ value: request }) => request.expired = true
    )
  }

  eachMatch(condition = true, testerOptions, fn) {
    let tester = up.Request.tester(condition, testerOptions)

    for (let record of this.records()) {
      if (tester(record.value)) {
        fn(record)
      }
    }
  }

}
