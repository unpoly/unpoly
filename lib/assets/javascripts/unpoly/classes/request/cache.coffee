#= require ./cache

u = up.util

class up.Request.Cache extends up.Cache

  maxSize: ->
    up.network.config.cacheSize

  expiryMillis: ->
    up.network.config.cacheExpiry

  normalizeStoreKey: (request) ->
    up.Request.wrap(request).cacheKey()

  isCachable: (request) ->
    up.Request.wrap(request).isCachable()

#  get: (request) ->
#    request = up.Request.wrap(request)
#    candidates = [request]
#
#    if target = request.target
#      unless /^html[\[$]/.test(target)
#        # Since <html> is the root tag, a request for the `html` selector
#        # will contain all other selectors.
#        candidates.push(request.variant(target: 'html'))
#
#      unless /[^, >#](html|meta|body|title|style|script)[\[\.,# >$]/.test(target)
#        # Although <body> is not the root tag, we consider it the selector developers
#        # will use when they want to replace the entire page. Hence we consider it
#        # a suitable match for all other selectors, excluding `html`.
#        candidates.push(request.variant(target: 'body'))
#
#    u.findResult candidates, (candidate) => super(candidate)

  clear: (pattern) ->
    if pattern && pattern != '*' && pattern != true
      pattern = new up.URLPattern(pattern)
      @each (key, request) =>
        if pattern.test(request.url)
          @store.remove(key)
    else
      super()
