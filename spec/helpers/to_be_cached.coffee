u = up.util
$ = jQuery

beforeEach ->
  jasmine.addMatchers
    toBeCached: (util, customEqualityTesters) ->
      compare: (optionsOrRequest) ->
        request = u.wrapValue(up.Request, optionsOrRequest)
        cached = up.cache.get(request)

        pass: !!cached

    toBeCachedWithResponse: (util, customEqualityTesters) ->
      compare: (optionsOrRequest, expectedResponseProps = {}) ->
        request = u.wrapValue(up.Request, optionsOrRequest)
        cached = up.cache.get(request)

        pass = cached && cached.response && u.objectContains(cached.response, expectedResponseProps)

        if pass
          message = u.sprintf("Expected %o not to be cached with response %o, but the cached response was %o", request, expectedResponseProps, cached?.response)
        else
          message = u.sprintf("Expected %o to be cached with response %o, but the cached response was %o", request, expectedResponseProps, cached?.response)

        { pass, message }
