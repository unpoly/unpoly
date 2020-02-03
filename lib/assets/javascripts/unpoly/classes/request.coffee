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
    @method = u.normalizeMethod(@method)
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

    @extractHashFromURL()
    unless u.methodAllowsPayload(@method)
      @transferParamsToURL()

    @deferred = u.newDeferred()

    @finally(@evictExpensiveAttrs)

  @delegate ['then', 'catch', 'finally'], 'deferred'

  evictExpensiveAttrs: =>
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

  isSafe: =>
    up.proxy.isSafeMethod(@method)

  send: =>
    # If the request was aborted before it was sent (e.g. because it was queued)
    # we don't send it.
    return if @aborted

    # Convert from XHR's callback-based API to up.Request's promise-based API
    @xhr = new up.Request.XhrRenderer(this).buildAndSend(
      onload: @responseReceived,
      onerror: @responseReceived,
      ontimeout: @setAbortedState
      onabort: @setAbortedState
    )

  abort: (message) =>
    @xhr?.abort()
    @setAbortedState(message)

  setAbortedState: (message = 'Request was aborted') =>
    unless @aborted
      @emit('up:proxy:aborted')
      @aborted = true
      @deferred.reject(up.error.aborted(message))

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
    new up.Request.FormRenderer(this).buildAndSubmit()

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
      events: up.protocol.eventsFromXhr(@xhr)

    if urlFromServer = up.protocol.locationFromXhr(@xhr)
      responseAttrs.url = urlFromServer
      # If the server changes a URL, it is expected to signal a new method as well.
      responseAttrs.method = up.protocol.methodFromXhr(@xhr) ? 'GET'

    return new up.Response(responseAttrs)

  isCachable: =>
    @isSafe() && @params.hasOnlyPrimitiveValues()

  cacheKey: =>
    [ @url,
      @method,
      @params.toQuery(),
      @target,
      @failTarget,
      @mode,
      @failMode,
      JSON.stringify(@context)
      JSON.stringify(@failContext)
    ].join('|')

  @wrap: (args...) ->
    u.wrapValue(@, args...)

  # If the request is marked for a { layer }, up.proxy-related events are emitted
  # ob that layer.  up.proxy delegates event submission to this method.
  emit: (name, props) ->
    emitter = if @layer && @layer != 'new' then @layer else up
    emitter.emit(name, u.merge(props, request: this))
