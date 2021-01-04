#= require ../request

CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded'
CONTENT_TYPE_FORM_DATA = 'multipart/form-data'

u = up.util

class up.Request.XHRRenderer

  constructor: (@request) ->

  buildAndSend: (handlers) ->
    @xhr = new XMLHttpRequest()

    # We copy params since we will modify them below.
    # This would confuse API clients and cache key logic in up.network.
    @params = u.copy(@request.params)

    @xhr.timeout = @request.timeout

    # The XMLHttpRequest method must be opened before we can add headers to it.
    @xhr.open(@getMethod(), @request.url)

    # Add information about the response's intended use so the server may
    # customize or shorten its response.
    for key, value of @request.metaProps()
      header = up.protocol.headerize(key)
      @addHeader(header, value)

    for header, value of @request.headers
      @addHeader(header, value)

    if (csrfHeader = @request.csrfHeader()) && (csrfToken = @request.csrfToken())
      @addHeader(csrfHeader, csrfToken)

    @addHeader(up.protocol.headerize('version'), up.version)

    # The { contentType } will be missing in case of a FormData payload.
    # In this case the browser will choose a content-type with MIME boundary,
    # like: multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
    if contentType = @getContentType()
      @addHeader('Content-Type', contentType)

    u.assign(@xhr, handlers)
    @xhr.send(@getPayload())

    return @xhr

  getMethod: ->
    # By default HTTP methods other than `GET` or `POST` will be converted into a `POST`
    # request and carry their original method as a `_method` parameter. This is to
    # [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347)
    # if the server redirects with 302 (Rails default) instead of 303.
    unless @method
      @method = @request.method
      if @request.wrapMethod && !@request.will302RedirectWithGET()
        @method = up.protocol.wrapMethod(@method, @params)

    return @method

  getContentType: ->
    @finalizePayload()
    return @contentType

  getPayload: ->
    @finalizePayload()
    return @payload

  addHeader: (header, value) ->
    if u.isOptions(value) || u.isArray(value)
      value = JSON.stringify(value)
    @xhr.setRequestHeader(header, value)

  finalizePayload: ->
    return if @payloadFinalized
    @payloadFinalized = true

    @payload = @request.payload
    @contentType = @request.contentType

    # (1) If a user sets { payload } we also expect them to set a { contentType }.
    #     In that case we don't change anything.
    # (2) We don't send a { contentType } or { payload } for GET requests.
    if !@payload && @request.allowsPayload()

      # Determine the effective Content-Type by looking at our params values.
      unless @contentType
        @contentType = if @params.hasBinaryValues() then CONTENT_TYPE_FORM_DATA else CONTENT_TYPE_URL_ENCODED

      # Serialize our payload
      if @contentType == CONTENT_TYPE_FORM_DATA
        # The effective Content-Type header will look like
        # multipart/form-data; boundary=----WebKitFormBoundaryHkiKAbOweEFUtny8
        # When we send a FormData payload the browser will automatically
        # chooose a boundary and set the payload.
        @contentType = null
        @payload = @params.toFormData()
      else
        # Only in form submissions %-encoded spaces are sent as a plus characater ("+")
        @payload = @params.toQuery().replace(/%20/g, '+')
