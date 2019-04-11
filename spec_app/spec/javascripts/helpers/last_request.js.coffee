u = up.util
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

