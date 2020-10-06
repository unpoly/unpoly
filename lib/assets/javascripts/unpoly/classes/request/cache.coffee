#= require ./cache

u = up.util

class up.Request.Cache extends up.Cache

  maxKeys: ->
    up.request.config.cacheSize

  expiryMillis: ->
    up.request.config.cacheExpiry

  normalizeStoreKey: (key) ->
    up.Request.wrap(key).cacheKey()

  isCachable: (key) ->
    up.Request.wrap(key).isCachable()

  get: (key) ->
    request = up.Request.wrap(key)
    candidates = [request]

    if request.target != 'html'
      # Since <html> is the root tag, a request for the `html` selector
      # will contain all other selectors.
      candidates.push(request.variant(target: 'html'))

      # Although <body> is not the root tag, we consider it the selector developers
      # will use when they want to replace the entire page. Hence we consider it
      # a suitable match for all other selectors, including `html`.
      if request.target != 'body'
        candidates.push(request.variant(target: 'body'))

    u.findResult candidates, (candidate) => super(candidate)
