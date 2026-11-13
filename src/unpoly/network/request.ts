import * as u from '../util.js'
import { Aborted, Offline } from '../error.js'
import {
  assertEventEmitted, emitEvent, parseEmitArgs, type EmitProps, type EmittedEvent,
  type EventEmitterOptions,
} from '../event.js'
import { Params } from '../form.js'
import { getSmart, parseTargetSteps, splitTarget, type RenderOptions } from '../fragment.js'
import { layerStack, type Layer } from '../layer.js'
import { abortRequests, cache, isSafeMethod, networkConfig } from '../network.js'
import {
  acceptLayerFromXHR, contextFromXHR, csrfHeader, csrfParam, csrfToken, dismissLayerFromXHR,
  eventPlansFromXHR, evictCacheFromXHR, expireCacheFromXHR, headerize, locationFromXHR,
  methodFromXHR, openLayerFromXHR, targetFromXHR, titleFromXHR,
} from '../protocol.js'
import { runPreviews } from '../status.js'
import type * as t from './types.js'
import { type Route } from './request_cache.js'
import { UpResponse } from './response.js'
import { sendWithXHR, submitWithForm } from './transports.js'

// Prefixed, so the binding doesn't shadow the browser's `Request` here or in importers.
// At runtime the class is named `up.Request` (see unpoly.ts).
export class UpRequest {
  // 'up.Request', set in unpoly.ts. TypeScript needs it to accept a request as a promise.
  declare [Symbol.toStringTag]: string
  declare state: t.RequestState
  declare expired: boolean
  declare method: string
  declare url: string
  declare hash?: string
  declare params: Params
  declare target?: string
  declare failTarget?: string
  declare headers: Record<string, string>
  declare timeout?: number | null
  declare background?: boolean
  declare cache?: boolean | 'auto'
  declare expireCache?: t.RequestCondition
  declare evictCache?: t.RequestCondition
  // While the request is new, these may be a layer name like 'root' or 'new'.
  declare layer: any
  declare mode?: string
  declare context?: u.PlainObject
  declare failLayer: any
  declare failMode?: string
  declare failContext?: u.PlainObject
  declare origin?: Element
  declare originLayer?: Layer
  declare originMode?: string
  declare builtAt: Date
  declare wrapMethod: boolean | null
  declare contentType?: string
  declare payload: any
  declare onLoading?: () => void
  declare onSettle?: (responseOrError: UpResponse | Error) => void
  declare fail?: u.ValueOrFunction<boolean>
  declare abortable: boolean | null
  declare lateDelay?: number | false
  declare previews: any[]
  declare bindLayer?: Layer
  declare response?: UpResponse
  declare fromCache?: boolean
  declare _fragments?: Element[]
  declare _bindFragments?: Element[]
  declare _deferred: u.Deferred<UpResponse>
  declare _xhr?: XMLHttpRequest
  declare _revertPreviews?: () => void
  // Set by the request cache.
  declare cacheRoute?: Route
  declare trackedRequest?: UpRequest

  // A request is also a promise for its response. The static block at the end delegates these.
  declare then: Promise<UpResponse>['then']
  declare catch: Promise<UpResponse>['catch']
  declare finally: Promise<UpResponse>['finally']

  constructor(options: t.RequestOptions) {
    // Like a default parameter, a default only replaces an undefined option.
    // A null option stays null, e.g. { timeout: null } sends the request without a timeout.
    const {
      headers = {},
      timeout = networkConfig.timeout,
      builtAt = new Date(),
      wrapMethod = networkConfig.wrapMethod,
      abortable = true,
      previews = [],
    } = options

    this.state = 'new'
    this.expired = false

    // _normalize() below sets the default.
    this.method = options.method!
    this.url = options.url
    this.hash = options.hash
    this.params = new Params(options.params) // copies, which we want
    this.target = options.target
    this.failTarget = options.failTarget
    this.headers = headers
    this.timeout = timeout
    this.background = options.background
    this.cache = options.cache  // since up.network.request() options are sometimes wrapped in this class
    this.expireCache = options.expireCache  // since up.network.request() options are sometimes wrapped in this class
    this.evictCache = options.evictCache  // since up.network.request() options are sometimes wrapped in this class

    // While requests are queued or in flight we keep the layer they're targeting.
    // If that layer is closed we will cancel all pending requests targeting that layer.
    // Note that when opening a new layer, this { layer } attribute will be the set to
    // the current layer. The { mode } and { failMode } attributes will belong to the
    // new layer being opened.
    this.layer = options.layer
    this.mode = options.mode // we would love to delegate @mode to @layer.mode, but @layer might be the string "new"
    this.context = options.context // we would love to delegate @context to @layer.context, but @layer might be string "new"
    this.failLayer = options.failLayer
    this.failMode = options.failMode // we would love to delegate @failMode to @failLayer.mode, but @failLayer might be the string "new"
    this.failContext = options.failContext // we would love to delegate @failContext to @failLayer.mode, but @failLayer might be the string "new"
    this.origin = options.origin
    this.originLayer = options.originLayer
    this.originMode = options.originMode
    this.builtAt = builtAt
    this.wrapMethod = wrapMethod
    this.contentType = options.contentType
    this.payload = options.payload
    this.onLoading = options.onLoading
    this.onSettle = options.onSettle
    this.fail = options.fail
    this.abortable = abortable
    this.lateDelay = options.lateDelay
    this.previews = previews

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
      // In OpenLayerPlan we connect requests to the base layer we're stacking upon.
      this.layer = layerStack.get(this.layer, layerLookupOptions)
      this.context ||= this.layer.context || {} // @layer might be "new", so we default to {}
      this.mode ||= this.layer.mode

      this.failLayer = layerStack.get(this.failLayer, layerLookupOptions)
      this.failContext ||= this.failLayer?.context || {} // @failLayer might be "new", so we default to {}
      this.failMode ||= this.failLayer?.mode

      this.originLayer ||= layerStack.get(this.origin) || layerStack.current
      this.originMode ||= this.originLayer?.mode
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

  get effectiveLateTime(): number | false {
    if (this.background) {
      return false
    } else {
      return this.lateDelay ?? u.evalOption(networkConfig.lateDelay, this)
    }
  }

  isTimed(): boolean {
    return u.isNumber(this.effectiveLateTime)
  }

  get xhr(): XMLHttpRequest {
    // Initialize the xhr request on first access,
    // so listeners on up:request:send events have a chance to access the xhr.
    return this._xhr ??= new XMLHttpRequest()
  }

  get fragments(): Element[] {
    // This property is required for `up.fragment.abort()` to select requests within
    // the subtree that we're canceling.
    //
    // We allow users to pass in pre-matched `{ fragments }` in the constructor.
    // We use this in `renderFromURL()` since we already know the element's we're trying
    // to replace.
    //
    // If we haven't received a `{ fragments }` property (or if it has been deleted by
    // evictExpensitveAttrs()) but did we receive a `{ target }`, we find matching elements here.
    return (this._fragments ||= this._findFragments())
  }

  _findFragments(): Element[] {
    let steps = parseTargetSteps(this.target)
    let lookupOpts = { origin: this.origin, layer: this.layer }
    // Look for one match per step.
    let matches = u.map(steps, (step) => getSmart(step.selector, lookupOpts))
    return u.compact(matches)
  }

  get bindFragments(): Element[] {
    return this._bindFragments || this.fragments
  }

  get fragment(): Element | undefined {
    return this.fragments?.[0]
  }

  _normalize(): void {
    this.method = u.normalizeMethod(this.method)
    this._extractHashFromURL()
    this._transferParamsToURL()

    // This consistently strips the hostname from same-origin requests.
    this.url = u.normalizeURL(this.url)
  }

  _evictExpensiveAttrs(): void {
    // We want to allow up:request:loaded events etc. to still access the properties that
    // we are about to evict, so we wait for one more frame. It shouldn't matter for GC.
    u.queueTask(() => {
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
      this.bindLayer = undefined

      // We want to provide the triggering element as { origin } to the function
      // providing the CSRF function. We now evict this property, since
      // response.request.origin will prevent its (now maybe detached) DOM tree
      // from garbage collection while the response is cached by up.network.
      this.origin = undefined
      this.originLayer = undefined

      this._fragments = undefined
      this._bindFragments = undefined // there is also a bindLayer() getter
    })
  }

  _extractHashFromURL(): string | undefined {
    let match = this.url?.match(/^([^#]*)(#.+)$/)
    if (match) {
      this.url = match[1]
      // Remember the #hash for later revealing.
      return this.hash = match[2]
    }
  }

  _transferParamsToURL(): void {
    if (!this.url || this.allowsPayload() || u.isBlank(this.params)) {
      return
    }

    // GET methods are not allowed to have a payload, so we transfer { params } params to the URL.
    this.url = this.params.toURL(this.url)
    // Now that we have transfered the params into the URL, we delete them from the { params } option.
    this.params.clear()
  }

  isSafe(): boolean {
    return isSafeMethod(this.method)
  }

  allowsPayload(): boolean {
    return u.methodAllowsPayload(this.method)
  }

  will302RedirectWithGET(): boolean {
    return this.isSafe() || (this.method === 'POST')
  }

  willCache(): boolean | undefined {
    return networkConfig.cacheEnabled && u.evalAutoOption(this.cache, networkConfig.autoCache, this)
  }

  runQueuedCallbacks(): void {
    u.always(this, () => this._evictExpensiveAttrs())
  }

  load(): boolean | undefined {
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
      sendWithXHR(this, {
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

  runPreviews(renderOptions: RenderOptions): void {
    if (!this.ended && !this.fromCache) {
      this._revertPreviews = runPreviews(this, renderOptions)
    }
  }

  _emitLoad(): boolean {
    let event = this.emit('up:request:load', { log: ['Loading %s', this] })
    return !event.defaultPrevented
  }

  loadPage(): void {
    // This method works independently of @state, since it is often
    // a fallback for a request that cannot be processed as a fragment update
    // (see up:fragment:loaded event).

    // Abort all pending requests so their callbacks won't run
    // while we're already navigating away.
    abortRequests()
    submitWithForm(this)
  }

  _onXHRLoad(): void {
    const response = this._extractResponseFromXHR()

    const log = ['Loaded %s', response]
    this.emit('up:request:loaded', { request: response.request, response, log })

    this.respondWith(response)
  }

  _onXHRError(): void {
    // Neither XHR nor fetch() provide any meaningful error message.
    // Hence we ignore the passed ProgressEvent and use our own error message.
    this._setOfflineState('Network error')
  }

  _onXHRTimeout(): void {
    // We used to treat timeouts like a client-side abort. While this is technically
    // what happens, it is more practical for users to consider a timeout like a failed
    // connection that we can retry with up.render({ onOffline }) etc.
    this._setOfflineState('Timeout')
  }

  _onXHRAbort(): void {
    // Use the default message that callers of request.abort() would also get.
    this._setAbortedState()
  }

  abort({ reason }: { reason?: string | Error } = {}): void {
    // _setAbortedState() must be called before xhr.abort(), since xhr's event handlers
    // will call _setAbortedState() a second time, without a message.
    if (this._setAbortedState(reason) && this._xhr) {
      this._xhr.abort()
    }
  }

  _setAbortedState(reason: string | Error = 'Unknown reason'): boolean | undefined {
    if (this.ended) return

    let log = ["Aborted request to %s: %s", this, reason]
    this.state = 'aborted'
    this._reject(new Aborted(log))
    this.emit('up:request:aborted', { log })

    // Return true so callers know we didn't return early without actually aborting anything.
    return true
  }

  _setOfflineState(reason: string = 'Unknown reason'): void {
    if (this.ended) return

    let log = ['Cannot load request from %s: %s', this, reason]
    this.state = 'offline'
    this.emit('up:request:offline', { log })
    this._reject(new Offline(log, { reason, request: this }))
  }

  respondWith(response: UpResponse): void {
    this.response = response

    if (this.ended) return
    this.state = 'loaded'

    if (response.ok) {
      this._resolve(response)
    } else {
      this._reject(response)
    }
  }

  // Settle our promise before running settle callbacks. A callback may settle a u.variant() of this
  // request (like up.Response#redirectRequest), which shares our deferred and would settle it first.
  _resolve(response: UpResponse): void {
    this._deferred.resolve(response)
    this._runSettleCallbacks(response)
  }

  _reject(responseOrError: UpResponse | Error): void {
    this._deferred.reject(responseOrError)
    this._runSettleCallbacks(responseOrError)
  }

  _runSettleCallbacks(responseOrError: UpResponse | Error): void {
    // Do this sync so previews are reverted before another DOM mutation.
    // awaiting the response would delay this for too long.
    this._revertPreviews?.()

    // This callback is used by up.network to update the cache before a new request
    // (made synchronously after this request settles) can hit a stale cache entry.
    this.onSettle?.(responseOrError)
  }

  get ended(): boolean {
    return (this.state !== 'new') && (this.state !== 'loading') && (this.state !== 'tracking')
  }

  csrfHeader(): string {
    return csrfHeader()
  }

  csrfParam(): string | undefined {
    return csrfParam()
  }

  // Returns a CSRF token if this request requires it
  csrfToken(): string | undefined {
    if (!this.isSafe() && !this.isCrossOrigin()) {
      return csrfToken()
    }
  }

  isCrossOrigin(): boolean {
    return u.isCrossOrigin(this.url)
  }

  _extractResponseFromXHR(): UpResponse {
    const responseAttrs = {
      method: this.method,
      url: this.url,
      request: this,
      xhr: this.xhr,
      text: this.xhr.responseText,
      status: this.xhr.status,
      title: titleFromXHR(this.xhr),
      target: targetFromXHR(this.xhr),
      openLayer: openLayerFromXHR(this.xhr),
      acceptLayer: acceptLayerFromXHR(this.xhr),
      dismissLayer: dismissLayerFromXHR(this.xhr),
      eventPlans: eventPlansFromXHR(this.xhr),
      context: contextFromXHR(this.xhr),
      expireCache: expireCacheFromXHR(this.xhr),
      evictCache: evictCacheFromXHR(this.xhr),
      fail: this.fail,
    }

    let methodFromResponse = methodFromXHR(this.xhr)

    let urlFromResponse = locationFromXHR(this.xhr)
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

    return new UpResponse(responseAttrs)
  }

  _parseEmitArgs(args: any[]): EventEmitterOptions {
    // We prefer emitting request-related events on the targeted layer.
    // This way listeners can observe event-related events on a given layer.
    // This request has an optional { layer } attribute, which is used by
    // parseEmitArgs().
    return parseEmitArgs(args, {
      layer: this.bindLayer,
      request: this,
      origin: this.origin
    })
  }

  emit<T extends string>(eventType: T, props?: EmitProps): EmittedEvent<T>
  emit<E extends Event>(event: E, options?: EmitProps): E
  emit(...args: any[]): Event {
    return emitEvent(this._parseEmitArgs(args))
  }

  assertEmitted(...args: any[]): void {
    assertEventEmitted(this._parseEmitArgs(args))
  }

  toString(): string {
    return this.method + ' ' + this.url
  }

  isBoundToSubtrees(subtreeRoots: Element[]): boolean {
    subtreeRoots = u.wrapList(subtreeRoots)

    return u.some(this.bindFragments, function(fragment) {
      return u.some(subtreeRoots, (subtreeElement) => subtreeElement.contains(fragment))
    })
  }

  isBoundToLayers(layers: Layer[]): boolean {
    return u.contains(layers, this.bindLayer)
  }

  get age(): number {
    // Subtracting dates gives milliseconds. TypeScript only allows arithmetic on numbers.
    return (new Date() as any) - (this.builtAt as any)
  }

  header(name: string): string | undefined {
    return this.headers[name]
  }

  _setAutoHeaders(): void {
    // Add information about the response's intended use, so the server may
    // customize or shorten its response.
    for (let key of ['target', 'failTarget', 'mode', 'failMode', 'context', 'failContext', 'originMode'] as const) {
      this._setPropertyHeader(key)
    }

    let header, token
    if ((header = this.csrfHeader()) && (token = this.csrfToken())) {
      this._setAutoHeader(header, token)
    }

    this._setAutoHeader(headerize('version'), up.version)
  }

  _setPropertyHeader(key: keyof UpRequest & string): void {
    this._setAutoHeader(
      headerize(key),
      this[key]
    )
  }

  _setAutoHeader(name: string, value: any): void {
    if (u.isMissing(value)) {
      return
    }

    if (u.isOptions(value) || u.isArray(value)) {
      value = u.safeStringifyJSON(value)
    }
    this.headers[name] = value
  }

  mergeIfUnsent(trackingRequest: UpRequest): void {
    // We can only merge a tracking request if the original request has not been sent to the network.
    // This can happen if multiple [up-defer] requests are sent during the same render pass.
    if (this.state !== 'new') return

    // Only merge requests with a target. Otherwise we could inadvertently change a request
    // without target (expecting a full page response) to a request with a target (allowing
    // a fragment response).
    if (!this.target || !trackingRequest.target) return

    let targetAtoms = splitTarget(this.target + ',' + trackingRequest.target)
    this.target = u.uniq(targetAtoms).join(', ')
    this._setPropertyHeader('target') // X-Up-Target header was set in the response

    this._fragments = u.uniq([...this.fragments, ...trackingRequest.fragments])
  }

  static tester(condition: t.RequestCondition, { except }: t.RequestTesterOptions = {}): (request: UpRequest) => boolean {
    let testFn: (request: UpRequest) => boolean
    if (u.isFunction(condition)) {
      testFn = condition
    } else if (condition instanceof this) {
      testFn = (request) => condition === request
    } else if (u.isString(condition)) {
      let pattern = new u.UpURLPattern(condition)
      testFn = (request) => pattern.test(request.url)
    } else { // boolean, truthy/falsy values
      testFn = (_request) => condition
    }

    if (except) {
      return (request) => !cache.willHaveSameResponse(request, except) && testFn(request)
    } else {
      return testFn
    }
  }

  static {
    // A request is also a promise ("thenable") for its response.
    u.delegatePromise(this.prototype, function() { return this._deferred })
  }
}

export const api = {
  Request: UpRequest,
}
