#= require ../request

u = up.util

class up.Request.XhrRenderer

  constructor: (@request) ->

  buildAndSend: (handlers) ->
    @xhr = new XMLHttpRequest()

    # We copy params since we will modify them below.
    # This would confuse API clients and cache key logic in up.proxy.
    xhrParams = u.copy(@request.params)

    # By default HTTP methods other than `GET` or `POST` will be converted into a `POST`
    # request and carry their original method as a `_method` parameter. This is to
    # [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).
    @xhrMethod = up.proxy.wrapMethod(@request.method, xhrParams)

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
    for key in ['target', 'mode', 'context']
      @addHeaderFromRequest(up.protocol.successHeader(key), key)
      @addHeaderFromRequest(up.protocol.failHeader(key), up.fragment.failKey(key))

    if (csrfHeader = @request.csrfHeader()) && (csrfToken = @request.csrfToken())
      @addHeader(csrfHeader, csrfToken)

    u.assign(@xhr, handlers)
    @xhr.send(@xhrPayload)

    return @xhr

  addHeader: (header, value) ->
    @xhr.setRequestHeader(header, value)

  addHeaderFromRequest: (header, key) ->
    if value = @request[key]
      if u.isOptions(value)
        value = JSON.stringify(value)
      @addHeader(header, value)
