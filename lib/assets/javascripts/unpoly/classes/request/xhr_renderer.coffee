#= require ../request

u = up.util

class up.Request.XHRRenderer

  constructor: (@request) ->

  buildAndSend: (handlers) ->
    @xhr = new XMLHttpRequest()

    # We copy params since we will modify them below.
    # This would confuse API clients and cache key logic in up.network.
    xhrParams = u.copy(@request.params)

    # By default HTTP methods other than `GET` or `POST` will be converted into a `POST`
    # request and carry their original method as a `_method` parameter. This is to
    # [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).
    @xhrMethod = up.network.wrapMethod(@request.method, xhrParams)

    @xhr.timeout = @request.timeout

    # xhrParams is always given, but we only want to send a FormData payload if
    # there is at least one key/value pair in the params. Sending FormData will
    # cause the browser to change the request's content type to `multipart/form-data`.
    #
    # TODO: There is a feature request to allow the user to control the request's content type (https://github.com/unpoly/unpoly/issues/107)
    if u.isPresent(xhrParams)
      @xhrPayload = xhrParams.toFormData()

    # The XMLHttpRequest method must be opened before we can add headers to it.
    @xhr.open(@xhrMethod, @request.url)

    # Add information about the response's intended use so the server may
    # customize or shorten its response.
    for key, value of @request.metaProps()
      header = up.protocol.headerize(key)
      @addHeader(header, value)

    for header, value of @request.headers
      @addHeader(header, value)

    if (csrfHeader = @request.csrfHeader()) && (csrfToken = @request.csrfToken())
      @addHeader(csrfHeader, csrfToken)

    @addHeader(up.protocol.config.versionHeader, up.version)

    u.assign(@xhr, handlers)
    @xhr.send(@xhrPayload)

    return @xhr

  addHeader: (header, value) ->
    if u.isOptions(value) || u.isArray(value)
      value = JSON.stringify(value)
    @xhr.setRequestHeader(header, value)
