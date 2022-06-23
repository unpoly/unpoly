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
  The URL for the request.

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
  The CSS selector targeted by this request.

  The selector will be sent as an `X-Up-Target` header.

  @property up.Request#target
  @param {string} target
  @stable
  */

  /*-
  The CSS selector targeted by this request in case the server responds
  with an [error code](/failed-responses).

  The selector will be sent as an `X-Up-Fail-Target` header.

  @property up.Request#failTarget
  @param {string} failTarget
  @stable
  */

  /*-
  An object of additional HTTP headers.

  Unpoly will by default send a number of custom request headers.
  See `up.protocol` and `up.network.config.requestMetaKeys` for details.

  @property up.Request#headers
  @param {Object} headers
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

  To prevent memory leaks, this property is removed shortly after the response is received.

  @property up.Request#layer
  @param {up.Layer} layer
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
  Whether this request is [preloading](/a-up-preload) content.

  @property up.Request#preload
  @param {boolean} [preload=false]
  @experimental
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
  an `up:network:late` event.

  Defaults to `up.network.config.badResponseTime`.

  @property up.Request#badResponseTime
  @param {number} [badResponseTime]
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
      'preload', // since up.network.request() options are sometimes wrapped in this class
      'background',
      'cache',  // since up.network.request() options are sometimes wrapped in this class
      'clearCache',  // since up.network.request() options are sometimes wrapped in this class

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
      'targetElements',
      'queuedAt',
      'wrapMethod',
      'contentType',
      'payload',
      'onQueued',
      'fail',
      'abortable',
      'badResponseTime',
    ]
  }

  defaults() {
    return {
      state: 'new',
      abortable: true,
      headers: {},
      timeout: up.network.config.timeout
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

    this.params = new up.Params(this.params); // copies, which we want

    if (this.preload) {
      // Preloading requires caching.
      this.cache = true

      // Preloading is always in the background.
      this.background = true
    }

    if (this.wrapMethod == null) { this.wrapMethod = up.network.config.wrapMethod }

    // Normalize a first time to get a normalized cache key.
    this.normalizeForCaching()

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
      this.failLayer = up.layer.get(this.failLayer || this.layer, layerLookupOptions)
      this.context ||= this.layer.context || {} // @layer might be "new", so we default to {}
      this.failContext ||= this.failLayer.context || {} // @failLayer might be "new", so we default to {}
      this.mode ||= this.layer.mode
      this.failMode ||= this.failLayer.mode
    }

    // This up.Request object is also promise for its up.Response.
    // We delegate all promise-related methods (then, catch, finally) to an internal
    // deferred object.
    this.deferred = u.newDeferred()

    // (1) We want to set the default after all other properties are initialized,
    //     in case up.network.config.badResponseTime is a function that inspects this request.
    // (2) We want to set the default once and then keep the value immutable. Otherwise
    //     the timer logic for up:network:late/:recover gets inconvenient edge cases.
    this.badResponseTime ??= u.evalOption(up.network.config.badResponseTime, this)
  }

  /*-
  Returns the elements matched by this request's [target selector](/up.Request.prototype.target).

  @property up.Request#targetElements
  @param List<Element> targetElements
  @experimental
  */
  get targetElements() {
    // This property is required for `up.fragment.abort()` to select requests within
    // the subtree that we're cancling.
    //
    // We allow users to pass in pre-matched `{ targetElements }` in the constructor.
    // We use this in `up.Change.FromURL` since we already know the element's we're trying
    // to replace.
    //
    // If we haven't received a `{ targetElements }` property but did we receive a `{ target }`,
    // we find matching elements here.
    if (!this._targetElements && this.target) {
      let steps = up.fragment.parseTargetSteps(this.target)
      let selectors = u.map(steps, 'selector')
      let lookupOpts = { origin: this.origin, layer: this.layer }
      this._targetElements = u.compact(u.map(selectors, (selector) => up.fragment.get(selector, lookupOpts)))
    }

    return this._targetElements
  }

  set targetElements(value) {
    this._targetElements = value
  }

  followState(sourceRequest) {
    u.delegate(this, ['deferred', 'state', 'preload'], () => sourceRequest)
  }

  normalizeForCaching() {
    this.method = u.normalizeMethod(this.method)
    this.extractHashFromURL()
    this.transferParamsToURL()

    // This consistently strips the hostname from same-origin requests.
    this.url = u.normalizeURL(this.url)
  }

  evictExpensiveAttrs() {
    // We want to allow up:request:loaded events etc. to still access the properties that
    // we are about to evict, so we wait for one more frame. It shouldn't matter for GC.
    u.task(() => {
      // While the request is still in flight, we require the target layer
      // to be able to cancel it when the layers gets closed. We now
      // evict this property, since response.request.layer.element will
      // prevent the layer DOM tree from garbage collection while the response
      // is cached by up.network.
      this.layer = undefined
      this.failLayer = undefined

      // We want to provide the triggering element as { origin } to the function
      // providing the CSRF function. We now evict this property, since
      // response.request.origin will prevent its (now maybe detached) DOM tree
      // from garbage collection while the response is cached by up.network.
      this.origin = undefined

      this.targetElements = undefined
    })
  }

      // Don't evict properties that may be part of our @cacheKey()!

  extractHashFromURL() {
    let match = this.url?.match(/^([^#]*)(#.+)$/)
    if (match) {
      this.url = match[1]
      // Remember the #hash for later revealing.
      return this.hash = match[2]
    }
  }

  transferParamsToURL() {
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
    u.always(this, () => this.evictExpensiveAttrs())

    this.onQueued?.(this)
  }
    // @signal?.addEventListener('abort', => @abort())

  load() {
    // If the request was aborted before it was sent (e.g. because it was queued)
    // we don't send it.
    if (this.state !== 'new') { return }
    this.state = 'loading'

    // Convert from XHR's callback-based API to up.Request's promise-based API
    this.xhr = new up.Request.XHRRenderer(this).buildAndSend({
      onload:    () => this.onXHRLoad(),
      onerror:   () => this.onXHRError(),
      ontimeout: () => this.onXHRTimeout(),
      onabort:   () => this.onXHRAbort()
    })
  }

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

  onXHRLoad() {
    const response = this.extractResponseFromXHR()

    const log = ['Server responded HTTP %d to %s %s (%d characters)', response.status, this.method, this.url, response.text.length]
    this.emit('up:request:loaded', { request: response.request, response, log })

    this.respondWith(response)
  }

  onXHRError() {
    // Neither XHR nor fetch() provide any meaningful error message.
    // Hence we ignore the passed ProgressEvent and use our own error message.
    const log = 'Fatal error during request'
    this.deferred.reject(up.error.failed(log))
    this.emit('up:request:offline', { log })
  }

  onXHRTimeout() {
    // We treat a timeout like a client-side abort (which it is).
    this.setAbortedState('Requested timed out')
  }

  onXHRAbort() {
    // Use the default message that callers of request.abort() would also get.
    this.setAbortedState()
  }

  /*-
  Aborts this request.

  The request's promise will reject with an error object that has `{ name: 'AbortError' }`.

  ### Example

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
  @string [options.reason]
  @experimental
  */
  abort({ reason } = {}) {
    // setAbortedState() must be called before xhr.abort(), since xhr's event handlers
    // will call setAbortedState() a second time, without a message.
    if (this.setAbortedState(reason) && this.xhr) {
      this.xhr.abort()
    }
  }

  setAbortedState(reason) {
    if ((this.state !== 'new') && (this.state !== 'loading')) { return; }
    this.state = 'aborted'

    let message = this.abortMessage(reason)
    this.emit('up:request:aborted', { log: message })
    this.deferred.reject(up.error.aborted(message))

    // Return true so callers know we didn't return early without actually aborting anything.
    return true
  }

  abortMessage(reason) {
    let message = `Aborted request to ${this.description}`
    if (reason) {
      message += `: ${reason}`
    }
    return message
  }

  respondWith(response) {
    if (this.state !== 'loading') { return; }
    this.state = 'loaded'

    if (response.ok) {
      return this.deferred.resolve(response)
    } else {
      return this.deferred.reject(response)
    }
  }

  csrfHeader() {
    return up.protocol.csrfHeader()
  }

  csrfParam() {
    return up.protocol.csrfParam()
  }

  // Returns a csrfToken if this request requires it
  csrfToken() {
    if (!this.isSafe() && !this.isCrossOrigin()) {
      return up.protocol.csrfToken()
    }
  }

  isCrossOrigin() {
    return u.isCrossOrigin(this.url)
  }

  extractResponseFromXHR() {
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
      clearCache: up.protocol.clearCacheFromXHR(this.xhr),
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
      if (!methodFromResponse && !u.matchURLs(responseAttrs.url, urlFromResponse)) {
        methodFromResponse = 'GET'
      }

      responseAttrs.url = urlFromResponse
    }

    if (methodFromResponse) {
      responseAttrs.method = methodFromResponse
    }

    return new up.Response(responseAttrs)
  }

  cacheKey() {
    return JSON.stringify([
      this.method,
      this.url,
      this.params.toQuery(),
      // If we send a meta prop to the server it must also become part of our cache key,
      // given that server might send a different response based on these props.
      this.metaProps()
    ])
  }

  // Returns an object like { target: '...', mode: '...' } that will
  // (1) be sent to the server so it can optimize responses and
  // (2) become part of our @cacheKey().
  metaProps() {
    const props = {}
    for (let key of u.evalOption(up.network.config.requestMetaKeys, this)) {
      const value = this[key]
      if (u.isGiven(value)) {
        props[key] = value
      }
    }
    return props
  }

  buildEventEmitter(args) {
    // We prefer emitting request-related events on the targeted layer.
    // This way listeners can observe event-related events on a given layer.
    // This request has an optional { layer } attribute, which is used by
    // EventEmitter.
    return up.EventEmitter.fromEmitArgs(args, {
      layer: this.layer,
      request: this,
      origin: this.origin
    })
  }

  emit(...args) {
    return this.buildEventEmitter(args).emit()
  }

  assertEmitted(...args) {
    this.buildEventEmitter(args).assertEmitted()
  }

  get description() {
    return this.method + ' ' + this.url
  }

  isPartOfSubtree(subtreeElements) {
    if (!this.targetElements || !subtreeElements) {
      return false
    }

    subtreeElements = u.wrapList(subtreeElements)

    return u.some(this.targetElements, function(targetElement) {
      return u.some(subtreeElements, (subtreeElement) => subtreeElement.contains(targetElement))
    })
  }

  get queueAge() {
    const now = new Date()
    return now - this.queuedAt
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
      let exceptCacheKey = except.cacheKey()
      return (request) => (request.cacheKey() !== exceptCacheKey) && testFn(request)
    } else {
      return testFn
    }
  }

  static {
    // A request is also a promise ("thenable") for its response.
    u.delegate(this.prototype, ['then', 'catch', 'finally'], function() { return this.deferred })
  }
}
