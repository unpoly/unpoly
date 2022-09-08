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

//  get: (request) ->
//    request = up.Request.wrap(request)
//    candidates = [request]
//
//    if target = request.target
//      unless /^html[\[$]/.test(target)
//        # Since <html> is the root tag, a request for the `html` selector
//        # will contain all other selectors.
//        candidates.push(request.variant(target: 'html'))
//
//      unless /[^, >#](html|meta|body|title|style|script)[\[\.,# >$]/.test(target)
//        # Although <body> is not the root tag, we consider it the selector developers
//        # will use when they want to replace the entire page. Hence we consider it
//        # a suitable match for all other selectors, excluding `html`.
//        candidates.push(request.variant(target: 'body'))
//
//    u.findResult candidates, (candidate) => super(candidate)

  clear(condition = true) {
    let tester = up.Request.tester(condition)
    this.each((key, request) => {
      if (tester(request)) {
        // It is generally not a great idea to manipulate the list we're iterating over,
        // but the implementation of up.Cache#each copies keys before iterating.
        this.store.remove(key)
      }
    })
  }
}
