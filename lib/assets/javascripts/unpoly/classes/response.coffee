#= require ./record

u = up.util

###*
@class up.Response
@stable
###
class up.Response extends up.Record

  ###*
  The HTTP method used for the response.

  This is usually the HTTP method used by the request.
  However, after a redirect the server should signal a `GET` method using
  an [`X-Up-Method: GET` header](/up.protocol#redirect-detection).

  @property up.Response.prototype.method
  @param {string} method
  @stable
  ###

  ###*
  The URL used for the response.

  This is usually the requested URL.
  However, after a redirect the server should signal a the new URL
  using an [`X-Up-Location: /new-url` header](/up.protocol#redirect-detection).

  @property up.Response.prototype.url
  @param {string} method
  @stable
  ###

  ###*
  The response body as a `string`.

  @property up.Response.prototype.text
  @param {string} text
  @stable
  ###

  ###*
  The response's
  [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
  as a `number`.

  A successful response will usually have a `200` or `201' status code.

  @property up.Response.prototype.status
  @param {number} status
  @stable
  ###

  ###*
  The [request](/up.Request) that triggered this response.

  @property up.Response.prototype.request
  @param {up.Request} request
  @experimental
  ###

  ###*
  The [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
  object that was used to create this response.

  @property up.Response.prototype.xhr
  @param {XMLHttpRequest} xhr
  @experimental
  ###

  ###*
  A [document title pushed by the server](/up.protocol#pushing-a-document-title-to-the-client).

  If the server pushed no title via HTTP header, this will be `undefined`.

  @property up.Response.prototype.title
  @param {string} [title]
  @stable
  ###
  fields: ->
    [
      'method',
      'url',
      'text',
      'status',
      'request',
      'xhr',
      'title'
    ]

  constructor: (options) ->
    super(options)

  isSuccess: =>
    @status && (@status >= 200 && @status <= 299)

  isError: =>
    !@isSuccess()

  isMaterialError: =>
    @isError() && u.isBlank(@text)
