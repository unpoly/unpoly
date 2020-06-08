#= require ./record

u = up.util
e = up.element

###**
Instances of `up.Request` normalizes properties of an [`AJAX request`](/up.request)
such as the requested URL, form parameters and HTTP method.

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

  ###**
  TODO: Docs

  @property up.Request#context
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#failContext
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#mode
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#failMode
  @stable
2  ###

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
      # Note that when opening a new layer, this { layer } attribute will be the set to
      # the current layer. The { mode } and { failMode } attributes will belong to the
      # new layer being opened.
      'layer',
      'mode',
      'failMode',
      'context',
      'failContext',
      'origin',
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
    @uid = u.uid() # TODO: Remove me

    @normalize()

    @headers ||= {}
    @aborted = false
    @preload = !!@preload
    @headers ||= {}

    if @origin
      @layer ||= up.layer.get(@origin)

    # Make sure @context is always an object, even if no @layer is given.
    # Note that @context is a part of our @cacheKey(), since different contexts
    # might yield different server responses.
    @context ||= @layer?.context || {}
    @failContext ||= {}

    @mode ||= @layer?.mode || 'root'
    @failMode ||= @layer?.mode || 'root'

    @deferred = u.newDeferred()

    @finally => @evictExpensiveAttrs()

  @delegate ['then', 'catch', 'finally'], 'deferred'

  normalize: ->
    @method = u.normalizeMethod(@method)
    @extractHashFromURL()
    unless u.methodAllowsPayload(@method)
      @transferParamsToURL()

  evictExpensiveAttrs: ->
    # We want to allow up:proxy:loaded events etc. to still access the properties that
    # we are about to evict, so we wait for one more frame. It shouldn't matter for GC.

    u.task =>
      # While the request is still in flight, we require the target layer
      # to be able to cancel it when the layers gets closed. We now
      # evict this property, since response.request.layer.element will
      # prevent the layer DOM tree from garbage collection while the response
      # is cached by up.proxy.
      @layer = undefined

      # We want to provide the triggering element as { origin } to the function
      # providing the CSRF function. We now evict this property, since
      # response.request.origin will prevent its (now maybe detached) DOM tree
      # from garbage collection while the response is cached by up.proxy.
      @origin = undefined

  extractHashFromURL: ->
    return unless u.contains(@url, '#')
    urlParts = u.parseURL(@url)
    # Remember the #hash for later revealing.
    # It will be lost during normalization.
    @hash = u.presence(urlParts.hash)
    @url = u.normalizeURL(urlParts, hash: false)

  transferParamsToURL: ->
    unless u.isBlank(@params)
      # GET methods are not allowed to have a payload, so we transfer { params } params to the URL.
      @url = @params.toURL(@url)
      # Now that we have transfered the params into the URL, we delete them from the { params } option.
      @params.clear()

  isSafe: ->
    up.proxy.isSafeMethod(@method)

  send: ->
    # If the request was aborted before it was sent (e.g. because it was queued)
    # we don't send it.
    return if @aborted

    # In case an up:proxy:load listener changed { url, method, params } we need to
    # normalize again.
    @normalize()

    # Convert from XHR's callback-based API to up.Request's promise-based API
    @xhr = new up.Request.XHRRenderer(this).buildAndSend(
      onload: (_event) => @onXHRLoad(_event)
      onerror: (_event) => @onXHRError(_event)
      ontimeout: (_event) => @onXHRTimeout(_event)
      onabort: (_event) => @onXHRAbort(_event)
    )

  onXHRLoad: (_progressEvent) ->
    response = @extractResponseFromXHR()
    @respondWith(response)

  onXHRError: (_progressEvent) ->
    # Neither XHR nor fetch() provide any meaningful error message.
    # Hence we ignore the passed ProgressEvent and use our own error message.
    log = 'Fatal error during request'
    @deferred.reject(up.error.failed(log))
    @emit('up:proxy:fatal', { log })

  onXHRTimeout: (_progressEvent) ->
    # We treat a timeout like a client-side abort (which is is).
    @setAbortedState('Requested timed out')

  onXHRAbort: (_progressEvent) ->
    # Use the default message that callers of request.abort() would also get.
    @setAbortedState()

  abort: (message) ->
    # setAbortedState() must be called before xhr.abort(), since xhr's event handlers
    # will call setAbortedState() a second time, without a message.
    @setAbortedState(message)
    @xhr?.abort()

  setAbortedState: (message = 'Request was aborted') ->
    unless @aborted
      @emit('up:proxy:aborted', log: message)
      @aborted = true
      @deferred.reject(up.error.aborted(message))

  respondWith: (response) ->
    log = ['Server responded HTTP %d to %s %s (%d characters)', response.status, @method, @url, response.text.length]
    @emit('up:proxy:loaded', { response, log })

    if response.ok
      @deferred.resolve(response)
    else
      @deferred.reject(response)

  navigate: ->
    up.legacy.deprecated('up.Request#navigate()', 'up.Request#loadPage()')
    @loadPage()

  # TODO: Document API
  loadPage: ->
    new up.Request.FormRenderer(this).buildAndSubmit()

  csrfHeader: ->
    up.protocol.csrfHeader(this)

  csrfParam: ->
    up.protocol.csrfParam(this)

  # Returns a csrfToken if this request requires it
  csrfToken: ->
    if !@isSafe() && !@isCrossDomain()
      up.protocol.csrfToken(this)

  isCrossDomain: =>
    u.isCrossDomain(@url)

  extractResponseFromXHR:  ->
    responseAttrs =
      method: @method
      url: @url
      request: this
      xhr: @xhr
      text: @xhr.responseText
      status: @xhr.status
      title: up.protocol.titleFromXHR(@xhr)
      acceptLayer: up.protocol.acceptLayerFromXHR(@xhr)
      dismissLayer: up.protocol.dismissLayerFromXHR(@xhr)
      eventPlans: up.protocol.eventPlansFromXHR(@xhr)
      context: up.protocol.contextFromXHR(@xhr)

    if urlFromServer = up.protocol.locationFromXHR(@xhr)
      responseAttrs.url = urlFromServer
      # If the server changes a URL, it is expected to signal a new method as well.
      responseAttrs.method = up.protocol.methodFromXHR(@xhr) ? 'GET'

    return new up.Response(responseAttrs)

  isCachable: ->
    @isSafe() && @params.hasOnlyPrimitiveValues()

  cacheKey: ->
    JSON.stringify [
      @method,
      @url,
      @params.toQuery(),
      # If we send a meta prop to the server it must also become part of our cache key,
      # given that server might send a different response based on these props.
      @metaProps()
    ]

  # Returns an object like { target: '...', mode: '...' } that will
  # (1) be sent to the server so it can optimize responses and
  # (2) become part of our @cacheKey().
  metaProps: ->
    props = {}
    for key in up.proxy.config.requestMetaKeys(@url)
      value = this[key]
      if u.isGiven(value)
        props[key] = value
    props

  @wrap: (args...) ->
    u.wrapValue(@, args...)

  buildEventEmitter: (args) ->
    # We prefer emitting request-related events on the targeted layer.
    # This way listeners can observe event-related events on a given layer.
    # This request has an optional { layer } attribute, which is used by
    # EventEmitter.
    return up.EventEmitter.fromEmitArgs(args, request: this, layer: @layer)

  emit: (args...) ->
    return @buildEventEmitter(args).emit()

  whenEmitted: (args...) ->
    return @buildEventEmitter(args).whenEmitted()
