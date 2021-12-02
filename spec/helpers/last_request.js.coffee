u = up.util
e = up.element
$ = jQuery

beforeEach ->
  @lastRequest = jasmine.lastRequest
  @respondWith = jasmine.respondWith
  @respondWithSelector = jasmine.respondWithSelector

jasmine.lastRequest = ->
  return jasmine.Ajax.requests.mostRecent() or up.fail('There is no last request')

jasmine.respondWith = (args...) ->
  firstArg = args.shift()
  responseText = undefined
  options = undefined
  if u.isString(firstArg)
    responseText = firstArg
    options = args[0] || {}
  else
    options = firstArg
    responseText = options.responseText

  status = options.status || 200

  if status != 204 && status != 304 && u.isMissing(responseText) # don't override ""
    responseText = 'response-text'

  contentType = options.contentType || 'text/html'
  headers = options.responseHeaders || {}
  headers['Content-Type'] ||= contentType

  requestAttrs =
    status: status
    contentType: contentType
    responseHeaders: headers
    responseText: responseText
    responseURL: options.responseURL

  request = options.request || jasmine.lastRequest()
  request.respondWith(requestAttrs)

jasmine.respondWithSelector = (selector, options = {}) ->
  respondWithKeys = ['contentType', 'status', 'responseURL', 'responseHeaders']
  respondWithOptions = u.pick(options, respondWithKeys)
  affixOptions = u.omit(options, respondWithKeys)

  element = e.createFromSelector(selector, affixOptions)
  responseText = element.outerHTML

  jasmine.respondWith(responseText, respondWithOptions)

