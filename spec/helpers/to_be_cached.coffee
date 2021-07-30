u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeCached: (util, customEqualityTesters) ->
      compare: (optionsOrRequest) ->
        request = u.wrapValue(up.Request, optionsOrRequest)
        cached = up.cache.get(request)

        pass: !!cached
