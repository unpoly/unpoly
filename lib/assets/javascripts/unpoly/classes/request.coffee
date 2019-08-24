#= require ./record

u = up.util
e = up.element

###**
Instances of `up.Request` normalizes properties of an [`AJAX request`](/up.request)
such as the requested URL, form parameters and HTTP method.

TODO: Docs: up.Request is also a promise for its response. Show example.

@class up.Request
###
class up.Request extends up.Record

  ###**
  The HTTP method for the request.

  @property up.Request#method
  @param {string} method
  @stable
  ###

  ###**
  The URL for the request.

  @property up.Request#url
  @param {string} url
  @stable
  ###

  ###**
  [Parameters](/up.Params) that should be sent as the request's payload.

  @property up.Request#params
  @param {Object|FormData|string|Array} params
  @stable
  ###

  ###**
  The CSS selector that will be sent as an [`X-Up-Target` header](/up.protocol#optimizing-responses).

  @property up.Request#target
  @param {string} target
  @stable
  ###

  ###**
  The CSS selector that will be sent as an [`X-Up-Fail-Target` header](/up.protocol#optimizing-responses).

  @property up.Request#failTarget
  @param {string} failTarget
  @stable
  ###

  ###**
  An object of additional HTTP headers.

  @property up.Request#headers
  @param {Object} headers
  @stable
  ###

  ###**
  A timeout in milliseconds.

  If [`up.proxy.config.maxRequests`](/up.proxy.config#config.maxRequests) is set,
  the timeout will not include the time spent waiting in the queue.

  @property up.Request#timeout
  @param {Object|undefined} timeout
  @stable
  ###
  keys: ->
    [
      'method',
      'url',
      'params',
      'target',
      'failTarget',
      'headers',
      'timeout',
      'preload' # since up.proxy.request() options are sometimes wrapped in this class
      'cache',  # since up.proxy.request() options are sometimes wrapped in this class
      # While requests are queued or in flight we keep the layer they're targeting.
      # If that layer is closed we will cancel all pending requests targeting that layer.
      'preflightLayer',
      'origin',
      'context',
      'solo',
    ]

  ###**
  Creates a new `up.Request` object.

  This will not actually send the request over the network. For that use `up.request()`.

  @constructor up.Request
  @param {string} attrs.url
  @param {string} [attrs.method='get']
  @param {up.Params|string|Object|Array} [attrs.params]
  @param {string} [attrs.target]
  @param {string} [attrs.failTarget]
  @param {Object<string, string>} [attrs.headers]
  @param {number} [attrs.timeout]
  @internal
  ###
  constructor: (args...) ->
    options = u.extractOptions(args)
    options.url ||= args[0]

    up.legacy.fixKey(options, 'data', 'params')
    super(options)
    @params = new up.Params(@params) # copies, which we want

    if @origin
      @preflightLayer ||= up.layer.of(@origin)

    # Make sure @context is always an object, even if no preflightLayer is given.
    # Note that @context is a part of our @cacheKey(), since different contexts
    # might yield different server responses.
    @context ||= @preflightLayer?.context || {}

    @uid = u.uid()

    @normalize()
    @aborted = false
    @deferred = u.newDeferred()
    @deferred.promise().then(=> console.log("Request %o fulfilled", @uid)).catch(=> console.log("Request %o rejected", @uid))
    # TODO: Test that compacting happens

    # console.log("Request#always is %o", @always)
    @finally(@evictExpensiveAttrs)

  @delegate ['then', 'catch', 'finally'], 'deferred'

  evictExpensiveAttrs: =>
    # Allow up:proxy:loaded events etc. to still access the properties that
    # we are about to evict.

    u.task =>
      # While the request is still in flight, we require the target layer
      # to be able to cancel it when the layers gets closed. We now
      # evict this property, since response.request.preflightLayer.element will
      # prevent the layer DOM tree from garbage collection while the response
      # is cached by up.proxy.
      @preflightLayer = undefined

      # We want to provide the triggering element as { origin } to the function
      # providing the CSRF function. We now evict this property, since
      # response.request.origin will prevent its (now maybe detached) DOM tree
      # from garbage collection while the response is cached by up.proxy.
      @origin = undefined

  normalize: =>
    @method = u.normalizeMethod(@method)
    @headers ||= {}
    @extractHashFromURL()

    unless u.methodAllowsPayload(@method)
      @transferParamsToURL()

  extractHashFromURL: =>
    urlParts = u.parseURL(@url)
    # Remember the #hash for later revealing.
    # It will be lost during normalization.
    @hash = u.presence(urlParts.hash)
    @url = u.normalizeURL(urlParts, hash: false)

  transferParamsToURL: =>
    unless u.isBlank(@params)
      # GET methods are not allowed to have a payload, so we transfer { params } params to the URL.
      @url = @params.toURL(@url)
      # Now that we have transfered the params into the URL, we delete them from the { params } option.
      @params.clear()

  transferSearchToParams: =>
    paramsFromQuery = up.Params.fromURL(@url)
    unless u.isBlank(paramsFromQuery)
      @params.addAll(paramsFromQuery)
      @url = u.normalizeURL(@url, search: false)

  isSafe: =>
    up.proxy.isSafeMethod(@method)

  send: =>
    # If the requesr was aborted before it was sent (e.g. because it was queued)
    # we don't send it.
    return if @aborted

    # We will modify this request below.
    # This would confuse API clients and cache key logic in up.proxy.
    @xhr = new XMLHttpRequest()

    xhrHeaders = u.copy(@headers)
    xhrURL = @url
    xhrParams = u.copy(@params)
    xhrMethod = up.proxy.wrapMethod(@method, xhrParams)

    xhrPayload = null
    unless u.isBlank(xhrParams)
      delete xhrHeaders['Content-Type'] # let the browser set the content type
      xhrPayload = xhrParams.toFormData()

    xhrHeaders[up.protocol.config.targetHeader] = @target if @target
    xhrHeaders[up.protocol.config.failTargetHeader] = @failTarget if @failTarget
    xhrHeaders['X-Requested-With'] ||= 'XMLHttpRequest' unless @isCrossDomain()
    if (csrfHeader= @csrfHeader()) && (csrfToken = @csrfToken())
      xhrHeaders[csrfHeader] = csrfToken

    if @context
      xhrHeaders[up.protocol.config.contextHeader] = JSON.stringify(@context)

    @xhr.open(xhrMethod, xhrURL)

    for header, value of xhrHeaders
      @xhr.setRequestHeader(header, value)

    # Convert from XHR API to promise API
    @xhr.onload = @responseReceived
    @xhr.onerror = @responseReceived
    @xhr.ontimeout =  @setAbortedState
    @xhr.onabort = @setAbortedState

    @xhr.timeout = @timeout if @timeout

    @xhr.send(xhrPayload)

  abort: (message) =>
    @xhr?.abort()
    @setAbortedState(message)

  setAbortedState: (message = 'Request was aborted') =>
    console.debug("setAbortedState(%o)", message)
    @aborted = true
    @deferred.reject(up.event.abortError(message))
    console.debug("Request deferred %o was rejected", @deferred)

  responseReceived: =>
    @respondWith(@extractResponseFromXhr())

  respondWith: (response) ->
    if response.isSuccess()
      @deferred.resolve(response)
    else
      @deferred.reject(response)

  navigate: =>
    up.legacy.deprecated('up.Request#navigate()', 'up.Request#loadPage()')
    @loadPage()

  loadPage: =>
    # GET forms cannot have an URL with a query section in their [action] attribute.
    # The query section would be overridden by the serialized input values on submission.
    @transferSearchToParams()

    form = e.affix(document.body, 'form.up-page-loader')

    addField = (attrs) ->
      e.affix(form, 'input[type=hidden]', attrs)

    if @method == 'GET'
      formMethod = 'GET'
    else
      # Browser forms can only have GET or POST methods.
      # When we want to make a request with another method, most backend
      # frameworks allow to pass the method as a param.
      addField(name: up.protocol.config.methodParam, value: @method)
      formMethod = 'POST'

    e.setAttrs(form, method: formMethod, action: @url)

    if (csrfParam = @csrfParam()) && (csrfToken = @csrfToken())
      addField(name: csrfParam, value: csrfToken)

    # @params will be undefined for GET requests, since we have already
    # transfered all params to the URL during normalize().
    u.each(@params.toArray(), addField)

    e.hide(form)

    up.browser.submitForm(form)

  csrfHeader: ->
    up.protocol.csrfHeader(this)

  csrfParam: ->
    up.protocol.csrfParam(this)

  # Returns a csrfToken if this request requires it
  csrfToken: =>
    if !@isSafe() && !@isCrossDomain()
      up.protocol.csrfToken(this)

  isCrossDomain: =>
    u.isCrossDomain(@url)

  extractResponseFromXhr:  =>
    responseAttrs =
      method: @method
      url: @url
      request: this
      xhr: @xhr
      text: @xhr.responseText
      status: @xhr.status
      title: up.protocol.titleFromXhr(@xhr)
      acceptLayer: up.protocol.acceptLayerFromXhr(@xhr)
      dismissLayer: up.protocol.dismissLayerFromXhr(@xhr)
      event: up.protocol.eventFromXhr(@xhr)
      layerEvent: up.protocol.layerEventFromXhr(@xhr)

    if urlFromServer = up.protocol.locationFromXhr(@xhr)
      responseAttrs.url = urlFromServer
      # If the server changes a URL, it is expected to signal a new method as well.
      responseAttrs.method = up.protocol.methodFromXhr(@xhr) ? 'GET'

    return new up.Response(responseAttrs)

  isCachable: =>
    @isSafe() && !u.isFormData(@params)

  cacheKey: =>
    [ @url,
      @method,
      @params.toQuery(),
      @target,
      JSON.stringify(@context)
    ].join('|')

  @wrap: (args...) ->
    u.wrapValue(@, args...)
