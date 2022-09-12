u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeExpired: (util, customEqualityTesters) ->
      compare: (optionsOrRequest) ->
        request = u.wrapValue(up.Request, optionsOrRequest)
        cached = up.cache.get(request)

        unless cached instanceof up.Request
          throw "Wanted to test if a cache entry was expired, but the request is not in the cache"

        pass: cached.expired
