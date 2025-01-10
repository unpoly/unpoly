const u = up.util

/*-
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
@parent up.network
*/
up.Request = class Request extends up.Record {

  /*-
  The HTTP method for the request.

  @property up.Request#method
  @param {string} method
  @stable
  */

  /*-
  The requested URL.

  @property up.Request#url
  @param {string} url
  @stable
  */

  /*-
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
  */

  /*-
  [Parameters](/up.Params) that should be sent as the request's payload.

  @property up.Request#params
  @param {Object|FormData|string|Array} params
  @stable
  */

  /*-
  The CSS selector [targeted](/targeting-fragments) by this request.

  The selector will be sent as an `X-Up-Target` header.

  @property up.Request#target
  @param {string} target
  @stable
  */

  /*-
  The CSS selector [targeted](/targeting-fragments) by this request in case
  the server responds with an [error code](/failed-responses).

  The selector will be sent as an `X-Up-Fail-Target` header.

  @property up.Request#failTarget
  @param {string} failTarget
  @stable
  */

  /*-
  An object of HTTP headers that will be sent with this request.

  Unpoly will by default send a number of custom request headers.
  See `up.protocol` for details.

  @see up.Request.prototype.header

  @property up.Request#headers
  @param {Object} headers
  @stable
  */

  /*-
  Returns the HTTP request header value with the given name.

  Returns `undefined` if the given header name will not be sent with this request.

  > [note]
  > For implementation reasons, the search for the header is case-sensitive.

  @function up.Request#header
  @param {string} name
    The case-sensitive name.
  @return {string|undefined}
    The value of the header.
  @stable
  */

  /*-
  A timeout in milliseconds.

  If the request is queued due to [many concurrent requests](/up.network.config#config.concurrency),
  the timeout will not include the time spent waiting in the queue.

  @property up.Request#timeout
  @param {Object|undefined} timeout
  @stable
  */

  /*-
  Whether to wrap non-standard HTTP methods in a POST request.

  If this is set, methods other than GET and POST will be converted to a `POST` request
  and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

  Defaults to [`up.network.config`](/up.network.config#config.wrapMethod).

  @property up.Request#wrapMethod
  @param {boolean} wrapMethod
  @stable
  */

  /*-
  The [context](/context) of the layer targeted by this request.

  The context object will be sent as an `X-Up-Context` header.

  @property up.Request#context
  @param {Object} context
  @experimental
  */

  /*-
  The [context](/context) of the layer targeted by this request in case the server responds with an [error code](/failed-responses).

  The context object will be sent as an `X-Up-Fail-Context` header.

  @property up.Request#failContext
  @param {Object} failContext
  @experimental
  */

  /*-
  The [layer](/up.layer) targeted by this request.

  Setting the `{ layer }` property will automatically derive `{ context }` and `{ mode }` properties.

  When this request will [open a new overlay](/opening-overlays), the string `"new"` is returned.

  To prevent memory leaks, this property is removed shortly after the response is received.

  @property up.Request#layer
  @param {up.Layer|string} layer
  @experimental
  */

  /*-
  The [layer](/up.layer) targeted by this request in case the server responds with an [error code](/failed-responses).

  Setting the `{ failLayer }` property will automatically derive `{ failContext }` and `{ failMode }` properties.

  To prevent memory leaks, this property is removed shortly after the response is received.

  @property up.Request#failLayer
  @param {up.Layer} layer
  @experimental
  */

  /*-
  The element that triggered the request.

  For example, when this request was triggered by a click on a link, the link
  element is set as the `{ origin }`.

  To prevent memory leaks, this property is removed shortly after the response is received.

  @property up.Request#origin
  @param {Element} origin
  @experimental
  */

  /*-
  The [mode](/up.Layer.prototype.mode) of the layer targeted by this request.

  The value will be sent as an `X-Up-Mode` header.

  @property up.Request#mode
  @param {string} mode
  @stable
  */

  /*-
  The [mode](/up.Layer.prototype.mode) of the layer targeted by this request in case the server responds with an [error code](/failed-responses).

  The value will be sent as an `X-Up-Fail-Mode` header.

  @property up.Request#failMode
  @param {string} failMode
  @stable
  */

  /*-
  The format in which the [request params](/up.Request.prototype.params) will be encoded.

  @property up.Request#contentType
  @param {string} contentType
  @stable
  */

  /*-
  The payload that the request will encode into its body.

  By default Unpoly will build a payload from the given `{ params }` option.

  @property up.Request#payload
  @param {string} payload
  @stable
  */

  /*-
  Whether the request is abortable through `up.fragment.abort()`.

  This belongs to the `up.fragment` API, not `up.request`.
  A request with `{ abortable: false }` can still be aborted through `up.request.abort()`.

  @property up.Request#abortable
  @param {boolean} [abortable=true]
  @internal
  */

  /*-
  Whether this request is loading in the background.

  Background requests deprioritized over foreground requests.
  Background requests also won't emit `up:network:late` events and won't trigger
  the [progress bar](/up.network.config#config.progressBar).

  @property up.Request#background
  @param {boolean} [background=false]
  @experimental
  */

  /*-
  The number of milliseconds after which this request can cause
  an `up:network:late` event and show the [progress bar](/progress-bar).

  Defaults to `up.network.config.lateDelay`.

  @property up.Request#lateDelay
  @param {number|boolean} [lateDelay]
  @experimental
  */

  keys() {
    return [
      // 'signal',
      'method',
      'url',
      'hash',
      'params',
      'target',
      'failTarget',
      'headers',
      'timeout',
      'background',
      'cache',  // since up.network.request() options are sometimes wrapped in this class
      'expireCache',  // since up.network.request() options are sometimes wrapped in this class
      'evictCache',  // since up.network.request() options are sometimes wrapped in this class

      // While requests are queued or in flight we keep the layer they're targeting.
      // If that layer is closed we will cancel all pending requests targeting that layer.
      // Note that when opening a new layer, this { layer } attribute will be the set to
      // the current layer. The { mode } and { failMode } attributes will belong to the
      // new layer being opened.
      'layer',
      'mode',        // we would love to delegate @mode to @layer.mode, but @layer might be the string "new"
      'context',     // we would love to delegate @context to @layer.context, but @layer might be string "new"
      'failLayer',
      'failMode',    // we would love to delegate @failMode to @failLayer.mode, but @failLayer might be the string "new"
      'failContext', // we would love to delegate @failContext to @failLayer.mode, but @failLayer might be the string "new"
      'origin',
      'builtAt',
      'wrapMethod',
      'contentType',
      'payload',
      'onLoading',
      'fail',
      'abortable',
      'lateDelay',
      'previews',
    ]
  }

  defaults() {
    return {
      state: 'new',
      abortable: true,
      headers: {},
      timeout: up.network.config.timeout,
      builtAt: new Date(),
      previews: [],
    }
  }

  /*-
  Creates a new `up.Request` object.

  This will not actually send the request over the network. For that use `up.request()`.

  @constructor up.Request
  @param {string} attrs.url
  @param {string} [attrs.method='get']
  @param {up.Params|string|Object|Array|FormData} [attrs.params]
  @param {string} [attrs.target]
  @param {string} [attrs.failTarget]
  @param {Object<string, string>} [attrs.headers]
  @param {number} [attrs.timeout]
  @internal
  */
  constructor(options) {
    super(options)

    this.params = new up.Params(this.params) // copies, which we want

    if (this.wrapMethod == null) { this.wrapMethod = up.network.config.wrapMethod }

    // Normalize a first time to get a normalized cache key.
    this._normalize()

    if ((this.target || this.layer || this.origin) && !options.basic) {
      const layerLookupOptions = { origin: this.origin }
      // Calling up.layer.get() will give us:
      //
      // (1) Resolution of strings like 'current' to an up.Layer instance
      // (2) Default of origin's layer
      // (3) Default of up.layer.current
      //
      // up.layer.get('new') will return 'new' unchanged, but I'm not sure
      // if any code actually calls up.request({ ..., layer: 'new' }).
      // In up.Change.OpenLayer we connect requests to the base layer we're stacking upon.
      this.layer = up.layer.get(this.layer, layerLookupOptions)
      this.failLayer = up.layer.get(this.failLayer, layerLookupOptions)
      this.context ||= this.layer.context || {} // @layer might be "new", so we default to {}
      this.failContext ||= this.failLayer?.context || {} // @failLayer might be "new", so we default to {}
      this.mode ||= this.layer.mode
      this.failMode ||= this.failLayer?.mode
    }

    this.bindLayer = options.bindLayer || this.layer

    this._fragments = options.fragments

    // We don't want to default this to this.fragments here, because
    // that may be an expensive getter, so we do it lazily.
    this._bindFragments = options.bindFragments

    // This up.Request object is also promise for its up.Response.
    // We delegate all promise-related methods (then, catch, finally) to an internal
    // _deferred object.
    this._deferred = u.newDeferred()

    this._setAutoHeaders()
  }

  get effectiveLateTime() {
    if (this.background) {
      return false
    } else {
      return this.lateDelay ?? u.evalOption(up.network.config.lateDelay, this)
    }
  }

  isTimed() {
    return u.isNumber(this.effectiveLateTime)
  }

  /*-
  Returns the underlying `XMLHttpRequest` instance.

  @property up.Request#xhr
  @param {XMLHttpRequest} xhr
  @stable
  */
  get xhr() {
    // Initialize the xhr request on first access,
    // so listeners on up:request:send events have a chance to access the xhr.
    return this._xhr ??= new XMLHttpRequest()
  }

  /*-
  Returns the fragments matched by this request's [target selector](/up.Request.prototype.target).

  When this request will [open a new overlay](/opening-overlays), an empty array is returned.

  @see up.RenderResult.prototype.fragments

  @property up.Request#fragments
  @param List<Element> fragments
  @experimental
  */
  get fragments() { // eslint-disable-line getter-return
    // This property is required for `up.fragment.abort()` to select requests within
    // the subtree that we're canceling.
    //
    // We allow users to pass in pre-matched `{ fragments }` in the constructor.
    // We use this in `up.Change.FromURL` since we already know the element's we're trying
    // to replace.
    //
    // If we haven't received a `{ fragments }` property (or if it has been deleted by
    // evictExpensitveAttrs()) but did we receive a `{ target }`, we find matching elements here.
    return (this._fragments ||= this._findFragments())
  }

  _findFragments() {
    let steps = up.fragment.parseTargetSteps(this.target)
    let lookupOpts = { origin: this.origin, layer: this.layer }
    // Look for one match per step.
    let matches = u.map(steps, (step) => up.fragment.get(step.selector, lookupOpts))
    return u.compact(matches)
  }

  get bindFragments() {
    return this._bindFragments || this.fragments
  }

  /*-
  Returns the fragment matched by this request's [target selector](/up.Request.prototype.target).

  When [multiple fragments](/targeting-fragments#multiple) were inserted, the first fragment is returned.
  To get a list of all inserted fragments, use the [`{ fragments }`](/up.Request.prototype.fragments) property.

  When this request will [open a new overlay](/opening-overlays), `undefined` is returned.

  @see up.RenderResult.prototype.fragment

  @property up.Request#fragment
  @param Element fragment
  @experimental
  */
  get fragment() {
    return this.fragments?.[0]
  }

  _normalize() {
    this.method = u.normalizeMethod(this.method)
    this._extractHashFromURL()
    this._transferParamsToURL()

    // This consistently strips the hostname from same-origin requests.
    this.url = u.normalizeURL(this.url)
  }

  _evictExpensiveAttrs() {
    // We want to allow up:request:loaded events etc. to still access the properties that
    // we are about to evict, so we wait for one more frame. It shouldn't matter for GC.
    u.task(() => {
      // (1) While the request is still in flight, we require the target layer
      // to be able to cancel it when the layers gets closed. We now
      // evict this property, since response.request.layer.element will
      // prevent the layer DOM tree from garbage collection while the response
      // is cached by up.network.
      //
      // (2) Although we must take care to not evict attributes that are part of our #cacheKey(),
      // we have already copied all layer-relevant properties, e.g. this.mode, this.context.
      this.layer = undefined
      this.failLayer = undefined
      this._bindLayer = undefined

      // We want to provide the triggering element as { origin } to the function
      // providing the CSRF function. We now evict this property, since
      // response.request.origin will prevent its (now maybe detached) DOM tree
      // from garbage collection while the response is cached by up.network.
      this.origin = undefined

      this._fragments = undefined
      this._bindFragments = undefined
    })
  }

  _extractHashFromURL() {
    let match = this.url?.match(/^([^#]*)(#.+)$/)
    if (match) {
      this.url = match[1]
      // Remember the #hash for later revealing.
      return this.hash = match[2]
    }
  }

  _transferParamsToURL() {
    if (!this.url || this.allowsPayload() || u.isBlank(this.params)) {
      return
    }

    // GET methods are not allowed to have a payload, so we transfer { params } params to the URL.
    this.url = this.params.toURL(this.url)
    // Now that we have transfered the params into the URL, we delete them from the { params } option.
    this.params.clear()
  }

  isSafe() {
    return up.network.isSafeMethod(this.method)
  }

  allowsPayload() {
    return u.methodAllowsPayload(this.method)
  }

  will302RedirectWithGET() {
    return this.isSafe() || (this.method === 'POST')
  }

  willCache() {
    return u.evalAutoOption(this.cache, up.network.config.autoCache, this)
  }

  runQueuedCallbacks() {
    u.always(this, () => this._evictExpensiveAttrs())
  }

  load() {
    // If the request was aborted before it was sent (e.g. because it was queued)
    // we don't send it.
    if (this.state !== 'new') return

    if (this._emitLoad()) {
      this.state = 'loading'

      // Listeners to up:request:load may have mutated properties that need to be
      // re-normalized and/or are part of a cache key.
      //
      // To be correct we would also need to re-run _setAutoHeaders() here. However since
      // this is costly and also rare that listeners mutate properties like #target or #layer,
      // we leave it to the listener to update headers.
      this._normalize()

      // This callback is used by up.network to re-cache the request after its cache key
      // may have changed by mutation from a up:request:load listener.
      this.onLoading?.()

      // If someone expired this link while it was waiting in the queue (e.g. through
      // expiring everyhing with up.cache.expire(), it now becomes fresh through the
      // act of loading.
      this.expired = false

      // Convert from XHR's callback-based API to up.Request's promise-based API
      new up.Request.XHRRenderer(this).buildAndSend({
        onload: () => this._onXHRLoad(),
        onerror: () => this._onXHRError(),
        ontimeout: () => this._onXHRTimeout(),
        onabort: () => this._onXHRAbort()
      })

      // Signal to callers (in particular to up.Queue) that load() was not aborted.
      return true
    } else {
      this.abort({ reason: 'Prevented by event listener' })
    }
  }

  runPreviews(renderOptions) {
    if (!this.ended && !this.fromCache) {
      this._revertPreviews = up.status.runPreviews(this, renderOptions)
    }
  }

  _emitLoad() {
    let event = this.emit('up:request:load', { log: ['Loading %s', this.description] })
    return !event.defaultPrevented
  }

  // _emitLoad() {
  //   if (this.customLoadEvent) {
  //
  //   }
  //   return !event.defaultPrevented
  // }

  /*-
  Loads this request object as a full-page request, replacing the entire browser environment
  with a new page from the server response.

  The full-page request will be loaded with the [URL](/up.Request.prototype.url),
  [method](/up.Request.prototype.method) and [params](/up.Request.prototype.params)
  from this request object.
  Properties that are not possible in a full-page request (such as custom HTTP headers)
  will be ignored.

  Aborts all pending requests.

  @function up.Request#loadPage
  @experimental
  */
  loadPage() {
    // This method works independently of @state, since it is often
    // a fallback for a request that cannot be processed as a fragment update
    // (see up:fragment:loaded event).

    // Abort all pending requests so their callbacks won't run
    // while we're already navigating away.
    up.network.abort()
    new up.Request.FormRenderer(this).buildAndSubmit()
  }

  _onXHRLoad() {
    const response = this._extractResponseFromXHR()

    const log = 'Loaded ' + response.description
    this.emit('up:request:loaded', { request: response.request, response, log })

    this.respondWith(response)
  }

  _onXHRError() {
    // Neither XHR nor fetch() provide any meaningful error message.
    // Hence we ignore the passed ProgressEvent and use our own error message.
    this._setOfflineState('Network error')
  }

  _onXHRTimeout() {
    // We used to treat timeouts like a client-side abort. While this is technically
    // what happens, it is more practical for users to consider a timeout like a failed
    // connection that we can retry with up.render({ onOffline }) etc.
    this._setOfflineState('Timeout')
  }

  _onXHRAbort() {
    // Use the default message that callers of request.abort() would also get.
    this._setAbortedState()
  }

  /*-
  Aborts this request.

  The request's promise will reject with an `up.AbortError`.

  ### Example

  ```javascript
  let request = await up.request('/path')

  try {
    let response = await request('/path')
  } catch (result) {
    if (result instanceof up.AbortError) {
      console.log('Request was aborted.')
    }
  }

  request.abort()
  ```

  @function up.Request#abort
  @param {string} [options.reason]
    A message describing the reason for aborting this request.

    If omitted, a generic reason like `"Aborted request to GET /path"` will be used.

    The reason will be set as the `up.AbortError`'s message.
  @experimental
  */
  abort({ reason } = {}) {
    // _setAbortedState() must be called before xhr.abort(), since xhr's event handlers
    // will call _setAbortedState() a second time, without a message.
    if (this._setAbortedState(reason) && this._xhr) {
      this._xhr.abort()
    }
  }

  _setAbortedState(reason) {
    if (this.ended) return

    let message = 'Aborted request to ' + this.description + (reason ? ': ' + reason : '')
    this.state = 'aborted'
    this._reject(new up.Aborted(message))
    this.emit('up:request:aborted', { log: message })

    // Return true so callers know we didn't return early without actually aborting anything.
    return true
  }

  _setOfflineState(reason) {
    if (this.ended) return

    let message = 'Cannot load request to ' + this.description + (reason ? ': ' + reason : '')
    this.state = 'offline'
    this.emit('up:request:offline', { log: message })
    this._reject(new up.Offline(message))
  }

  respondWith(response) {
    this.response = response

    if (this.ended) return
    this.state = 'loaded'

    if (response.ok) {
      this._resolve(response)
    } else {
      this._reject(response)
    }
  }

  _resolve(response) {
    this._onSettle()
    this._deferred.resolve(response)
  }

  _reject(responseOrError) {
    this._onSettle()
    this._deferred.reject(responseOrError)
  }

  _onSettle() {
    // Do this sync so previews are reverted before another DOM mutation.
    // awaiting the response would delay this for too long.
    this._revertPreviews?.()
  }

  /*-
  Returns whether this request is no longer waiting for the network.

  A request is considered to have ended in one of the following states:

  - A response has been loaded, with any [status code](/up.Response.prototype.status).
  - It has been [aborted](/aborting-requests).
  - It failed due to a [network issue](/network-issues).
  - It failed due to a timeout.

  @property up.Request#ended
  @param {boolean} ended
    Whether is request has ended.
  @experimental
  */
  get ended() {
    return (this.state !== 'new') && (this.state !== 'loading') && (this.state !== 'tracking')
  }

  csrfHeader() {
    return up.protocol.csrfHeader()
  }

  csrfParam() {
    return up.protocol.csrfParam()
  }

  // Returns a CSRF token if this request requires it
  csrfToken() {
    if (!this.isSafe() && !this.isCrossOrigin()) {
      return up.protocol.csrfToken()
    }
  }

  isCrossOrigin() {
    return u.isCrossOrigin(this.url)
  }

  _extractResponseFromXHR() {
    const responseAttrs = {
      method: this.method,
      url: this.url,
      request: this,
      xhr: this.xhr,
      text: this.xhr.responseText,
      status: this.xhr.status,
      title: up.protocol.titleFromXHR(this.xhr),
      target: up.protocol.targetFromXHR(this.xhr),
      acceptLayer: up.protocol.acceptLayerFromXHR(this.xhr),
      dismissLayer: up.protocol.dismissLayerFromXHR(this.xhr),
      eventPlans: up.protocol.eventPlansFromXHR(this.xhr),
      context: up.protocol.contextFromXHR(this.xhr),
      expireCache: up.protocol.expireCacheFromXHR(this.xhr),
      evictCache: up.protocol.evictCacheFromXHR(this.xhr),
      fail: this.fail,
    }

    let methodFromResponse = up.protocol.methodFromXHR(this.xhr)

    let urlFromResponse = up.protocol.locationFromXHR(this.xhr)
    if (urlFromResponse) {
      // On browsers other than IE11 we can ask the XHR object for its { responseURL },
      // which contains the final URL after redirects. The server may also use the
      // custom X-Up-Location header to signal the final URL for all browsers.
      //
      // Unfortunately we cannot ask the XHR object for its response method.
      // The server may use the custom X-Up-Method for that. If that header is missing
      // AND the URLs changed between request and response, we assume GET.
      if (!u.matchURLs(this.url, urlFromResponse)) {
        methodFromResponse ||= 'GET'
      }

      responseAttrs.url = urlFromResponse
    }

    if (methodFromResponse) {
      responseAttrs.method = methodFromResponse
    }

    return new up.Response(responseAttrs)
  }

  _buildEventEmitter(args) {
    // We prefer emitting request-related events on the targeted layer.
    // This way listeners can observe event-related events on a given layer.
    // This request has an optional { layer } attribute, which is used by
    // EventEmitter.
    return up.EventEmitter.fromEmitArgs(args, {
      layer: this.bindLayer,
      request: this,
      origin: this.origin
    })
  }

  emit(...args) {
    return this._buildEventEmitter(args).emit()
  }

  assertEmitted(...args) {
    this._buildEventEmitter(args).assertEmitted()
  }

  get description() {
    return this.method + ' ' + this.url
  }

  isBoundToSubtrees(subtreeRoots) {
    subtreeRoots = u.wrapList(subtreeRoots)

    return u.some(this.bindFragments, function(fragment) {
      return u.some(subtreeRoots, (subtreeElement) => subtreeElement.contains(fragment))
    })
  }

  isBoundToLayers(layers) {
    return u.contains(layers, this.bindLayer)
  }

  get age() {
    return new Date() - this.builtAt
  }

  header(name) {
    return this.headers[name]
  }

  _setAutoHeaders() {
    // Add information about the response's intended use, so the server may
    // customize or shorten its response.
    for (let key of ['target', 'failTarget', 'mode', 'failMode', 'context', 'failContext']) {
      this._setPropertyHeader(key)
    }

    let csrfHeader, csrfToken
    if ((csrfHeader = this.csrfHeader()) && (csrfToken = this.csrfToken())) {
      this._setAutoHeader(csrfHeader, csrfToken)
    }

    this._setAutoHeader(up.protocol.headerize('version'), up.version)
  }

  _setPropertyHeader(key) {
    this._setAutoHeader(
      up.protocol.headerize(key),
      this[key]
    )
  }

  _setAutoHeader(name, value) {
    if (u.isMissing(value)) {
      return
    }

    if (u.isOptions(value) || u.isArray(value)) {
      value = u.safeStringifyJSON(value)
    }
    this.headers[name] = value
  }

  mergeIfUnsent(trackingRequest) {
    // We can only merge a tracking request if the original request has not been sent to the network.
    // This can happen if multiple [up-defer] requests are sent during the same render pass.
    if (this.state !== 'new') return

    // Only merge requests with a target. Otherwise we could inadvertently change a request
    // without target (expecting a full page response) to a request with a target (allowing
    // a fragment response).
    if (!this.target || !trackingRequest.target) return

    let targetAtoms = up.fragment.splitTarget(this.target + ',' + trackingRequest.target)
    this.target = u.uniq(targetAtoms).join(', ')
    this._setPropertyHeader('target') // X-Up-Target header was set in the response

    this._fragments = u.uniq([...this.fragments, ...trackingRequest.fragments])
  }

  static tester(condition, { except } = {}) {
    let testFn
    if (u.isFunction(condition)) {
      testFn = condition
    } else if (condition instanceof this) {
      testFn = (request) => condition === request
    } else if (u.isString(condition)) {
      let pattern = new up.URLPattern(condition)
      testFn = (request) => pattern.test(request.url)
    } else { // boolean, truthy/falsy values
      testFn = (_request) => condition
    }

    if (except) {
      return (request) => !up.cache.willHaveSameResponse(request, except) && testFn(request)
    } else {
      return testFn
    }
  }

  /*-
  An `up.Request` is also a promise for the server response.

  A request is *fulfilled* with an `up.Response` when the server sends a response
  with a status code of 2xx or [304](/skipping-rendering#rendering-nothing).

  The promise will reject for responses with a failed HTTP status,
  when the request is [aborted](/aborting-requests) or when there is
  [network issue](/network-issues).

  ### Example

  ```js
  try {
    let response = await up.request('foo')
    console.log('Successful response:', response.text)
  } catch (error) {
    if (error instanceof up.Request) {
      console.log('Response with error code:', response.text)
    } else {
      console.log("Other error during request: ", error)
    }
  }
  ```

  @function up.Request#then
  @param {Function(up.Response)} onFulfilled
  @param {Function(up.Response|Error)} onRejected
  @return {Promise<up.Response>}
    A promise that fulfills when the server response was fully loaded.
  @stable
  */
  static {
    // A request is also a promise ("thenable") for its response.
    u.delegatePromise(this.prototype, '_deferred')
  }
}
