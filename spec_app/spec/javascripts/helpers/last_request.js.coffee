u = up.util
e = up.element
$ = jQuery

beforeEach ->
  @lastRequest = ->
    jasmine.Ajax.requests.mostRecent() or up.fail('There is no last request')

  @respondWith = (args...) ->
    firstArg = args.shift()
    responseText = undefined
    options = undefined
    if u.isString(firstArg)
      responseText = firstArg
      options = args[0] || {}
    else
      options = firstArg
      responseText = options.responseText || 'response-text'
    request = options.request || @lastRequest()
    request.respondWith
      status: options.status || 200
      contentType: options.contentType || 'text/html'
      responseHeaders: options.responseHeaders
      responseText: responseText
      responseURL: options.responseURL

  @respondWithSelector = (selector, options = {}) ->
    respondWithKeys = ['contentType', 'status', 'responseURL', 'responseHeaders']
    respondWithOptions = u.pick(options, respondWithKeys)
    affixOptions = u.omit(options, respondWithKeys)

    element = e.createFromSelector(selector, affixOptions)
    responseText = element.outerHTML
    @respondWith(responseText, respondWithOptions)

