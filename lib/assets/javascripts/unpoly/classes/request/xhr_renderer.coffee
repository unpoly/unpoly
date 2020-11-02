#= require ../request

u = up.util

class up.Request.XHRRenderer

  constructor: (@request) ->

  buildAndSend: (handlers) ->
    @xhr = new XMLHttpRequest()

    @xhr.timeout = @request.timeout

    # xhrParams is always given, but we only want to send a FormData payload if
    # there is at least one key/value pair in the params. Sending FormData will
    # cause the browser to change the request's content type to `multipart/form-data`.
    #
    # TODO: There is a feature request to allow the user to control the request's content type (https://github.com/unpoly/unpoly/issues/107)
    if u.isPresent(@request.params)
      @xhrPayload = @request.params.toFormData()

    # The XMLHttpRequest method must be opened before we can add headers to it.
    @xhr.open(@request.method, @request.url)

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
