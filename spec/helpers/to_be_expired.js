const u = up.util
const $ = jQuery

beforeEach(function() {
  jasmine.addMatchers({
    toBeExpired(util, customEqualityTesters) {
      return {
        compare(optionsOrRequest) {
          const request = u.wrapValue(up.Request, optionsOrRequest)
          const cached = up.cache.get(request)

          if (!(cached instanceof up.Request)) {
            throw "Wanted to test if a cache entry was expired, but the request is not in the cache"
          }

          return { pass: cached.expired }
        }
      }
    }
  })
})
