#= require ./record

u = up.util
e = up.element

###**
Instances of `up.Request` normalizes properties of an [`AJAX request`](/up.request)
such as the requested URL, form parameters and HTTP method.

You can queue a request using the `up.request()` method:

    let request = up.request('/foo')
    console.log(request.url)

    // A request object is also a promise for its response
    let response = await request
    console.log(response.text)

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
  The CSS selector that will be sent as an `X-Up-Target` header.

  @property up.Request#target
  @param {string} target
  @stable
  ###

  ###**
  The CSS selector that will be sent as an `X-Up-Fail-Target` header.

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

  If `up.network.config.maxRequests` is set,
  the timeout will not include the time spent waiting in the queue.

  @property up.Request#timeout
  @param {Object|undefined} timeout
  @stable
  ###

  ###**
  Whether to wrap non-standard HTTP methods in a POST request.

  If this is set, methods other than GET and POST will be converted to a `POST` request
  and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

  Defaults to [`up.network.config`](/up.network.config#config.wrapMethod).

  @property up.Request#wrapMethod
  @param {boolean} enabled
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#context
  @param {Object} context
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#failContext
  @param {Object} context
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#mode
  @param {string} mode
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#failMode
  @param {string} mode
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#contentType
  @param {string} contentType
  @stable
  ###

  ###**
  TODO: Docs

  @property up.Request#payload
  @param {string} payload
  @stable
  ###

  keys: ->
    [
      # 'signal',
      'method',
      'url',
      'params',
      'target',
      'failTarget',
      'headers',
      'timeout',
      'preload' # since up.network.request() options are sometimes wrapped in this class
      'cache',  # since up.network.request() options are sometimes wrapped in this class
      'clearCache',  # since up.network.request() options are sometimes wrapped in this class

      # While requests are queued or in flight we keep the layer they're targeting.
      # If that layer is closed we will cancel all pending requests targeting that layer.
      # Note that when opening a new layer, this { layer } attribute will be the set to
      # the current layer. The { mode } and { failMode } attributes will belong to the
      # new layer being opened.
      'layer',
      'mode',        # we would love to delegate @mode to @layer.mode, but @layer might be the string "new"
      'context',     # we would love to delegate @context to @layer.context, but @layer might be string "new"
      'failLayer',
      'failMode',    # we would love to delegate @failMode to @failLayer.mode, but @failLayer might be the string "new"
      'failContext', # we would love to delegate @failContext to @failLayer.mode, but @failLayer might be the string "new"
      'origin',
      'solo',
      'queueTime',
      'wrapMethod',
      'contentType',
      'payload'
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
  constructor: (options) ->
    super(options)

    @params = new up.Params(@params) # copies, which we want
    @state = 'new' # new | loading | loaded | aborted
    @headers ||= {}

    if @preload
      # Preloading requires caching.
      @cache = true

    @wrapMethod ?= up.network.config.wrapMethod

    # Help users programmatically build a request that will match an existing cache key.
    @layer = up.layer.get(@layer || @origin) # If @layer and @origin is undefined, this will choose the current layer.
    @failLayer = up.layer.get(@failLayer || @layer)
    @context ||= @layer.context || {} # @layer might be "new", so we default to {}
    @failContext ||= @failLayer.context || {} # @failLayer might be "new", so we default to {}
    @mode ||= @layer.mode
    @failMode ||= @failLayer.mode

    # Normalize a first time to get a normalized cache key.
    @normalizeForCaching()

    # This up.Request object is also promise for its up.Response.
    # We delegate all promise-related methods (then, catch, finally) to an internal
    # deferred object.
    @deferred = u.newDeferred()

  @delegate ['then', 'catch', 'finally'], 'deferred'

  normalizeForCaching: ->
    @method = u.normalizeMethod(@method)
    @extractHashFromURL()
    unless @allowsPayload()
      @transferParamsToURL()

  evictExpensiveAttrs: ->
    # We want to allow up:request:loaded events etc. to still access the properties that
    # we are about to evict, so we wait for one more frame. It shouldn't matter for GC.
    u.task =>
      # While the request is still in flight, we require the target layer
      # to be able to cancel it when the layers gets closed. We now
      # evict this property, since response.request.layer.element will
      # prevent the layer DOM tree from garbage collection while the response
      # is cached by up.network.
      @layer = undefined
      @failLayer = undefined

      # We want to provide the triggering element as { origin } to the function
      # providing the CSRF function. We now evict this property, since
      # response.request.origin will prevent its (now maybe detached) DOM tree
      # from garbage collection while the response is cached by up.network.
      @origin = undefined

      # Don't evict properties that may be part of our @cacheKey()!

  extractHashFromURL: ->
    if match = @url.match(/^(.+)(#.+)$/)
      @url = match[1]
      # Remember the #hash for later revealing.
      @hash = match[2]

  transferParamsToURL: ->
    unless u.isBlank(@params)
      # GET methods are not allowed to have a payload, so we transfer { params } params to the URL.
      @url = @params.toURL(@url)
      # Now that we have transfered the params into the URL, we delete them from the { params } option.
      @params.clear()

  isSafe: ->
    up.network.isSafeMethod(@method)

  allowsPayload: ->
    u.methodAllowsPayload(@method)

  will302RedirectWithGET: ->
    @isSafe() || @method == 'POST'

  willQueue: ->
    u.always(this, => @evictExpensiveAttrs())

    # @signal?.addEventListener('abort', => @abort())

  load: ->
    # If the request was aborted before it was sent (e.g. because it was queued)
    # we don't send it.
    return unless @state == 'new'
    @state = 'loading'

    # Convert from XHR's callback-based API to up.Request's promise-based API
    @xhr = new up.Request.XHRRenderer(this).buildAndSend(
      onload:    => @onXHRLoad()
      onerror:   => @onXHRError()
      ontimeout: => @onXHRTimeout()
      onabort:   => @onXHRAbort()
    )

  # TODO: Document API
  loadPage: ->
    # This method works independently of @state, since it is often
    # a fallback for a request that cannot be processed as a fragment update
    # (see up:fragment:loaded event).

    # Abort all pending requests so their callbacks won't run
    # while we're already navigating away.
    up.network.abort()
    new up.Request.FormRenderer(this).buildAndSubmit()

  onXHRLoad: ->
    response = @extractResponseFromXHR()
    @respondWith(response)

  onXHRError: ->
    # Neither XHR nor fetch() provide any meaningful error message.
    # Hence we ignore the passed ProgressEvent and use our own error message.
    log = 'Fatal error during request'
    @deferred.reject(up.error.failed(log))
    @emit('up:request:fatal', { log })

  onXHRTimeout: ->
    # We treat a timeout like a client-side abort (which it is).
    @setAbortedState('Requested timed out')

  onXHRAbort: ->
    # Use the default message that callers of request.abort() would also get.
    @setAbortedState()

  abort: ->
    # setAbortedState() must be called before xhr.abort(), since xhr's event handlers
    # will call setAbortedState() a second time, without a message.
    if @setAbortedState() && @xhr
      @xhr.abort()

  setAbortedState: (reason = ["Request to %s %s was aborted", @method, @url]) ->
    return unless @state == 'new' || @state == 'loading'
    @state = 'aborted'
    @emit('up:request:aborted', log: reason)
    @deferred.reject(up.error.aborted(reason))
    return true

  respondWith: (response) ->
    return unless @state == 'loading'
    @state = 'loaded'

    log = ['Server responded HTTP %d to %s %s (%d characters)', response.status, @method, @url, response.text.length]
    @emit('up:request:loaded', { request: response.request, response, log })

    if response.ok
      @deferred.resolve(response)
    else
      @deferred.reject(response)

  csrfHeader: ->
    up.protocol.csrfHeader()

  csrfParam: ->
    up.protocol.csrfParam()

  # Returns a csrfToken if this request requires it
  csrfToken: ->
    if !@isSafe() && !@isCrossDomain()
      up.protocol.csrfToken()

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
      target: up.protocol.targetFromXHR(@xhr)
      acceptLayer: up.protocol.acceptLayerFromXHR(@xhr)
      dismissLayer: up.protocol.dismissLayerFromXHR(@xhr)
      eventPlans: up.protocol.eventPlansFromXHR(@xhr)
      context: up.protocol.contextFromXHR(@xhr)
      clearCache: up.protocol.clearCacheFromXHR(@xhr)

    methodFromResponse = up.protocol.methodFromXHR(@xhr)

    if urlFromResponse = up.protocol.locationFromXHR(@xhr)
      # On browsers other than IE11 we can ask the XHR object for its { responseURL },
      # which contains the final URL after redirects. The server may also use the
      # custom X-Up-Location header to signal the final URL for all browsers.
      #
      # Unfortunately we cannot ask the XHR object for its response method.
      # The server may use the custom X-Up-Method for that. If that header is missing
      # AND the URLs changed between request and response, we assume GET.
      if !methodFromResponse && !u.matchURLs(responseAttrs.url, urlFromResponse)
        methodFromResponse = 'GET'

      responseAttrs.url = urlFromResponse

    if methodFromResponse
      responseAttrs.method = methodFromResponse

    return new up.Response(responseAttrs)

  isCachable: ->
    @isSafe() && !@params.hasBinaryValues()

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
    for key in u.evalOption(up.network.config.requestMetaKeys, this)
      value = this[key]
      if u.isGiven(value)
        props[key] = value
    props

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

  @getter 'description', ->
    @method + ' ' + @url

  ###**
  Returns whether the given URL pattern matches this request's URL.

  \#\#\# Example

  ````javascript
  let request = up.request({ url: '/foo/123' })
  request.testURL('/foo/*') // returns true
  request.testURL('/bar/*') // returns false
  ```

  @property up.Request#testURL
  @param {string} pattern
  @return {boolean}
  @experimental
  ###
  testURL: (pattern) ->
    return new up.URLPattern(pattern).test(@url)
