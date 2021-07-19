u = up.util
e = up.element

###**
A normalized description of an [HTTP request](/up.request).

You can queue a request using the `up.request()` method:

```js
let request = up.request('/foo')
console.log(request.url)

// A request object is also a promise for its response
let response = await request
console.log(response.text)
```

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
  The [hash component](https://en.wikipedia.org/wiki/URI_fragment) of this request's URL.

  The `{ hash }` property is automatically extracted from the given URL:

  ```js
  let request = up.request({ url: '/path#section' })
  request.url // => '/path'
  request.hash // => '#section'
  ```

  @property up.Request#hash
  @param {string} hash
  @stable
  ###

  ###**
  [Parameters](/up.Params) that should be sent as the request's payload.

  @property up.Request#params
  @param {Object|FormData|string|Array} params
  @stable
  ###

  ###**
  The CSS selector targeted by this request.

  The selector will be sent as an `X-Up-Target` header.

  @property up.Request#target
  @param {string} target
  @stable
  ###

  ###**
  The CSS selector targeted by this request in case the server responds
  with an [error code](/server-errors).

  The selector will be sent as an `X-Up-Fail-Target` header.

  @property up.Request#failTarget
  @param {string} failTarget
  @stable
  ###

  ###**
  An object of additional HTTP headers.

  Unpoly will by default send a number of custom request headers.
  See `up.protocol` and `up.network.config.requestMetaKeys` for details.

  @property up.Request#headers
  @param {Object} headers
  @stable
  ###

  ###**
  A timeout in milliseconds.

  If the request is queued due to [many concurrent requests](/up.network.config#config.concurrency),
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
  @param {boolean} wrapMethod
  @stable
  ###

  ###**
  The [context](/context) of the layer targeted by this request.

  The context object will be sent as an `X-Up-Context` header.

  @property up.Request#context
  @param {Object} context
  @experimental
  ###

  ###**
  The [context](/context) of the layer targeted by this request in case the server responds with an [error code](/server-errors).

  The context object will be sent as an `X-Up-Fail-Context` header.

  @property up.Request#failContext
  @param {Object} failContext
  @experimental
  ###

  ###**
  The [layer](/up.layer) targeted by this request.

  Setting the `{ layer }` property will automatically derive `{ context }` and `{ mode }` properties.

  To prevent memory leaks, this property is removed shortly after the response is received.

  @property up.Request#layer
  @param {up.Layer} layer
  @experimental
  ###

  ###**
  The [layer](/up.layer) targeted by this request in case the server responds with an [error code](/server-errors).

  Setting the `{ failLayer }` property will automatically derive `{ failContext }` and `{ failMode }` properties.

  To prevent memory leaks, this property is removed shortly after the response is received.

  @property up.Request#failLayer
  @param {up.Layer} layer
  @experimental
  ###

  ###**
  The element that triggered the request.

  For example, when this request was triggered by a click on a link, the link
  element is set as the `{ origin }`.

  To prevent memory leaks, this property is removed shortly after the response is received.

  @property up.Request#origin
  @param {Element} origin
  @experimental
  ###

  ###**
  The [mode](/up.Layer.prototype.mode) of the layer targeted by this request.

  The value will be sent as an `X-Up-Mode` header.

  @property up.Request#mode
  @param {string} mode
  @stable
  ###

  ###**
  The [mode](/up.Layer.prototype.mode) of the layer targeted by this request in case the server responds with an [error code](/server-errors).

  The value will be sent as an `X-Up-Fail-Mode` header.

  @property up.Request#failMode
  @param {string} failMode
  @stable
  ###

  ###**
  The format in which the [request params](/up.Request.prototype.params) will be encoded.

  @property up.Request#contentType
  @param {string} contentType
  @stable
  ###

  ###**
  The payload that the request will encode into its body.

  By default Unpoly will build a payload from the given `{ params }` option.

  @property up.Request#payload
  @param {string} payload
  @stable
  ###

  ###**
  @property up.Request#preload
  @param {boolean} preload
  @experimental
  ###

  keys: ->
    [
      # 'signal',
      'method',
      'url',
      'hash',
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
      'payload',
      'onQueued'
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
    @headers ||= {}

    if @preload
      # Preloading requires caching.
      @cache = true

    @wrapMethod ?= up.network.config.wrapMethod

    # Normalize a first time to get a normalized cache key.
    @normalizeForCaching()

    unless options.basic
      @layer = up.layer.get(@layer) # If @layer and @origin is undefined, this will choose the current layer.
      @failLayer = up.layer.get(@failLayer || @layer)
      @context ||= @layer.context || {} # @layer might be "new", so we default to {}
      @failContext ||= @failLayer.context || {} # @failLayer might be "new", so we default to {}
      @mode ||= @layer.mode
      @failMode ||= @failLayer.mode

      # This up.Request object is also promise for its up.Response.
      # We delegate all promise-related methods (then, catch, finally) to an internal
      # deferred object.
      @deferred = u.newDeferred()
      @state = 'new' # new | loading | loaded | aborted

  @delegate ['then', 'catch', 'finally'], 'deferred'

  followState: (sourceRequest) ->
    u.delegate(this, ['deferred', 'state', 'preload'], -> sourceRequest)

  normalizeForCaching: ->
    @method = u.normalizeMethod(@method)
    @extractHashFromURL()
    @transferParamsToURL()

    # This consistently strips the hostname from same-origin requests.
    @url = u.normalizeURL(@url)

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
    if match = @url?.match(/^([^#]*)(#.+)$/)
      @url = match[1]
      # Remember the #hash for later revealing.
      @hash = match[2]

  transferParamsToURL: ->
    if !@url || @allowsPayload() || u.isBlank(@params)
      return

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

  willCache: ->
    if @cache == 'auto'
      return up.network.config.autoCache(this)
    else
      return @cache

  runQueuedCallbacks: ->
    u.always(this, => @evictExpensiveAttrs())

    @onQueued?(this)
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

  ###**
  Loads this request object as a full-page request, replacing the entire browser environment
  with a new page from the server response.

  The full-page request will be loaded with the [URL](/up.Request.prototype.url),
  [method](/up.Request.prototype.method) and [params](/up.Request.prototype.params)
  from this request object.
  Properties that are not possible in a full-page request (such as custom HTTP headers)
  will be ignored.

  \#\#\# Example

  ```javascript
  let request = await up.request('/path')

  try {
    let response = await request('/path')
  } catch (result) {
    if (result.name === 'AbortError') {
      console.log('Request was aborted.')
    }
  }

  request.abort()
  ```

  @function up.Request#loadPage
  @experimental
  ###
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

    log = ['Server responded HTTP %d to %s %s (%d characters)', response.status, @method, @url, response.text.length]
    @emit('up:request:loaded', { request: response.request, response, log })

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

  ###**
  Aborts this request.

  The request's promise will reject with an error object that has `{ name: 'AbortError' }`.

  \#\#\# Example

  ```javascript
  let request = await up.request('/path')

  try {
    let response = await request('/path')
  } catch (result) {
    if (result.name === 'AbortError') {
      console.log('Request was aborted.')
    }
  }

  request.abort()
  ```

  @function up.Request#abort
  @experimental
  ###
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
    if !@isSafe() && !@isCrossOrigin()
      up.protocol.csrfToken()

  isCrossOrigin: ->
    u.isCrossOrigin(@url)

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

  assertEmitted: (args...) ->
    return @buildEventEmitter(args).assertEmitted()

  @getter 'description', ->
    @method + ' ' + @url
