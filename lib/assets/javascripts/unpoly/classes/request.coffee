#= require ./record

u = up.util

###*
Instances of `up.Request` normalizes properties of an [`AJAX request`](/up.request)
such as the requested URL, form parameters and HTTP method.

@class up.Request
###
class up.Request extends up.Record

  ###*
  The HTTP method for the request.

  @property up.Request#method
  @param {string} method
  @stable
  ###

  ###*
  The URL for the request.

  @property up.Request#url
  @param {string} url
  @stable
  ###

  ###*
  Parameters that should be sent as the request's payload.

  Parameters may be passed as one of the following forms:

  1. An object where keys are param names and the values are param values
  2. An array of `{ name: 'param-name', value: 'param-value' }` objects
  3. A [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object

  @property up.Request#data
  @param {String} data
  @stable
  ###

  ###*
  The CSS selector that will be sent as an [`X-Up-Target` header](/up.protocol#optimizing-responses).

  @property up.Request#target
  @param {string} target
  @stable
  ###

  ###*
  The CSS selector that will be sent as an [`X-Up-Fail-Target` header](/up.protocol#optimizing-responses).

  @property up.Request#failTarget
  @param {string} failTarget
  @stable
  ###

  ###*
  An object of additional HTTP headers.

  @property up.Request#headers
  @param {object} headers
  @stable
  ###

  ###*
  A timeout in milliseconds.

  If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set,
  the timeout will not include the time spent waiting in the queue.

  @property up.Request#timeout
  @param {object|undefined} timeout
  @stable
  ###
  fields: ->
    [
      'method',
      'url',
      'data',
      'target',
      'failTarget',
      'headers',
      'timeout'
    ]

  ###*
  @constructor up.Request
  @param {string} [attributes]
  ###
  constructor: (options) ->
    super(options)
    @normalize()

  normalize: =>
    @method = u.normalizeMethod(@method)
    @headers ||= {}
    @extractHashFromUrl()
    if @data && !u.methodAllowsPayload(@method) && !u.isFormData(@data)
      @transferDataToUrl()

  extractHashFromUrl: =>
    urlParts = u.parseUrl(@url)
    # Remember the #hash for later revealing.
    # It will be lost during normalization.
    @hash = urlParts.hash
    @url = u.normalizeUrl(urlParts, hash: false)

  transferDataToUrl: =>
    # GET methods are not allowed to have a payload, so we transfer { data } params to the URL.
    query = u.requestDataAsQuery(@data)
    separator = if u.contains(@url, '?') then '&' else '?'
    @url += separator + query
    # Now that we have transfered the params into the URL, we delete them from the { data } option.
    @data = undefined

  isSafe: =>
    up.proxy.isSafeMethod(@method)

  send: =>
    # We will modify this request below.
    # This would confuse API clients and cache key logic in up.proxy.
    new Promise (resolve, reject) =>
      xhr = new XMLHttpRequest()

      xhrHeaders = u.copy(@headers)
      xhrData = @data
      xhrMethod = @method
      xhrUrl = @url

      [xhrMethod, xhrData] = up.proxy.wrapMethod(xhrMethod, xhrData)

      if u.isFormData(xhrData)
        delete xhrHeaders['Content-Type'] # let the browser set the content type
      else if u.isPresent(xhrData)
        xhrData = u.requestDataAsQuery(xhrData, purpose: 'form')
        xhrHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
      else
        # XMLHttpRequest expects null for an empty body
        xhrData = null

      xhrHeaders[up.protocol.config.targetHeader] = @target if @target
      xhrHeaders[up.protocol.config.failTargetHeader] = @failTarget if @failTarget
      xhrHeaders['X-Requested-With'] ||= 'XMLHttpRequest' unless @isCrossDomain()

      if csrfToken = @csrfToken()
        xhrHeaders[up.protocol.config.csrfHeader] = csrfToken

      xhr.open(xhrMethod, xhrUrl)

      for header, value of xhrHeaders
        xhr.setRequestHeader(header, value)

      resolveWithResponse = =>
        response = @buildResponse(xhr)
        if response.isSuccess()
          resolve(response)
        else
          reject(response)

      # Convert from XHR API to promise API
      xhr.onload = resolveWithResponse
      xhr.onerror = resolveWithResponse
      xhr.ontimeout = resolveWithResponse

      xhr.timeout = @timeout if @timeout

      xhr.send(xhrData)

  navigate: =>
    $form = $('<form class="up-page-loader"></form>')

    addField = (field) -> $('<input type="hidden">').attr(field).appendTo($form)

    if @method == 'GET'
      formMethod = 'GET'
    else
      # Browser forms can only have GET or POST methods.
      # When we want to make a request with another method, most backend
      # frameworks allow to pass the method as a param.
      addField(name: up.protocol.config.methodParam, value: @method)
      formMethod = 'POST'

    $form.attr(method: formMethod, action: @url)

    if (csrfParam = up.protocol.csrfParam()) && (csrfToken = @csrfToken())
      addField(name: csrfParam, value: csrfToken)

    u.each u.requestDataAsArray(@data), addField

    $form.hide().appendTo('body')
    up.browser.submitForm($form)

  # Returns a csrfToken if this request requires it
  csrfToken: =>
    if !@isSafe() && !@isCrossDomain()
      up.protocol.csrfToken()

  isCrossDomain: =>
    u.isCrossDomain(@url)

  buildResponse: (xhr) =>
    responseAttrs =
      method: @method
      url: @url
      text: xhr.responseText
      status: xhr.status
      request: @
      xhr: xhr

    if urlFromServer = up.protocol.locationFromXhr(xhr)
      responseAttrs.url = urlFromServer
      # If the server changes a URL, it is expected to signal a new method as well.
      responseAttrs.method = up.protocol.methodFromXhr(xhr) ? 'GET'

    responseAttrs.title = up.protocol.titleFromXhr(xhr)

    new up.Response(responseAttrs)

  isCachable: =>
    @isSafe() && !u.isFormData(@data)

  cacheKey: =>
    [@url, @method, u.requestDataAsQuery(@data), @target].join('|')

  @wrap: (object) ->
    if object instanceof @
      # This object has gone through instantiation and normalization before.
      object
    else
      new @(object)
