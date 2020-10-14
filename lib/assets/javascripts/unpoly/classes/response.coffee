#= require ./record

u = up.util

###**
Instances of `up.Response` describe the server response to an [`AJAX request`](/up.request).

\#\#\# Example

    up.fetch('/foo').then(function(response) {
      console.log(response.status) // 200
      console.log(response.text)   // "<html><body>..."
    })

@class up.Response
###
class up.Response extends up.Record

  ###**
  The HTTP method used for the response.

  This is usually the HTTP method used by the request.
  However, after a redirect the server should signal a `GET` method using
  an [`X-Up-Method: GET` header](/up.protocol#redirect-detection).

  @property up.Response#method
  @param {string} method
  @stable
  ###

  ###**
  The URL used for the response.

  This is usually the requested URL.
  However, after a redirect the server should signal a the new URL
  using an [`X-Up-Location: /new-url` header](/up.protocol#redirect-detection).

  @property up.Response#url
  @param {string} method
  @stable
  ###

  ###**
  The response body as a `string`.

  @property up.Response#text
  @param {string} text
  @stable
  ###

  ###**
  The response's
  [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
  as a `number`.

  A successful response will usually have a `200` or `201' status code.

  @property up.Response#status
  @param {number} status
  @stable
  ###

  ###**
  The [request](/up.Request) that triggered this response.

  @property up.Response#request
  @param {up.Request} request
  @experimental
  ###

  ###**
  The [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
  object that was used to create this response.

  @property up.Response#xhr
  @param {XMLHttpRequest} xhr
  @experimental
  ###

  ###**
  A [document title pushed by the server](/up.protocol#pushing-a-document-title-to-the-client).

  If the server pushed no title via HTTP header, this will be `undefined`.

  @property up.Response#title
  @param {string} [title]
  @stable
  ###
  keys: ->
    [
      'method',
      'url',
      'text',
      'status',
      'request',
      'xhr', # optional
      'title',
      'acceptLayer'
      'dismissLayer'
      'eventPlans'
      'context'
      'headers' # custom headers to for synthetic reponses without { xhr } property
    ]

  defaults: ->
    headers: {}

  ###**
  Returns whether the server responded with a 2xx HTTP status.

  @function up.Response#isSuccess
  @return {boolean}
  @experimental
  @deprecated
  ###
  isSuccess: ->
    up.legacy.deprecated('up.Response#isSuccess()', 'up.Response#ok')
    return @ok

  ###**
  Returns whether the server responded with a 2xx HTTP status.

  @property up.Response#ok
  @return {boolean}
  @experimental
  ###
  @getter 'ok', ->
    # 0 is falsy in JavaScript
    @status && (@status >= 200 && @status <= 299)

  ###**
  Returns whether the response was not [successful](/up.Request.prototype.isSuccess).

  @function up.Response#isError
  @return {boolean}
  @experimental
  @deprecated
  ###
  isError: ->
    up.legacy.deprecated('up.Response#isError()', '!up.Response#ok')
    return !@ok

  ###**
  Returns the HTTP header value with the given name.

  The search for the header name is case-insensitive.

  Returns `undefined` if the given header name was not included in the response.

  @function up.Response#getHeader
  @param {string} name
  @return {string|undefined} value
  @experimental
  ###
  getHeader: (name) ->
    @headers[name] || @xhr?.getResponseHeader(name)

  @getter 'contentType', ->
    @getHeader('Content-Type')

