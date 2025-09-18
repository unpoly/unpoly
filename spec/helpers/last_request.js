const u = up.util
const e = up.element
const $ = jQuery

beforeEach(function() {
  this.lastRequest = jasmine.lastRequest
  this.respondWith = jasmine.respondWith
  this.respondWithSelector = jasmine.respondWithSelector
})

jasmine.lastRequest = function() {
  return jasmine.Ajax.requests.mostRecent() || up.fail('There is no last request')
}

jasmine.respondWith = function(...args) {
  const firstArg = args.shift()
  let responseText = undefined
  let options = undefined
  if (u.isString(firstArg)) {
    responseText = firstArg
    options = args[0] || {}
  } else {
    options = firstArg
    responseText = options.responseText
  }

  const status = options.status || 200

  if ((status !== 204) && (status !== 304) && u.isMissing(responseText)) { // don't override ""
    responseText = 'response-text'
  }

  const contentType = options.contentType || 'text/html'
  const headers = options.responseHeaders || {}
  headers['Content-Type'] ||= contentType

  const requestAttrs = {
    status,
    contentType,
    responseHeaders: headers,
    responseText,
    responseURL: options.responseURL
  }

  let request = options.request ?? jasmine.lastRequest()
  if (u.isNumber(request)) {
    request = jasmine.Ajax.requests.at(request)
  }

  request.respondWith(requestAttrs)
}

jasmine.respondWithSelector = function(selector, options = {}) {
  const respondWithKeys = ['contentType', 'status', 'responseURL', 'responseHeaders']
  const respondWithOptions = u.pick(options, respondWithKeys)
  const affixOptions = u.omit(options, respondWithKeys)

  const element = e.createFromSelector(selector, affixOptions)
  const responseText = element.outerHTML

  jasmine.respondWith(responseText, respondWithOptions)
}

