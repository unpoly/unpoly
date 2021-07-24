u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeCached: (util, customEqualityTesters) ->
      compare: (optionsOrRequest) ->
        request = up.Request.wrap(optionsOrRequest)
        cached = up.cache.get(request)

        pass: !!cached
