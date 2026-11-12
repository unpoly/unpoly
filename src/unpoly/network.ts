import './network.sass'
import * as u from './util.js'
import { newConfig } from './util/config.js'
import { on } from './event.js'
import { printToStandard } from './log.js'
import { mockable } from './mockable.js'
import type * as t from './network/types.js'
export type * from './network/types.js'
import { ProgressBar } from './network/progress_bar.js'
import { UpRequest } from './network/request.js'
export { UpRequest }
import { UpRequestCache } from './network/request_cache.js'
import { RequestQueue } from './network/request_queue.js'
import { UpResponse } from './network/response.js'
export { UpResponse }

export const networkConfig = newConfig('up.network.config', (): t.NetworkConfig => ({
  concurrency: 6,
  wrapMethod: true,
  cacheEnabled: true,
  cacheSize: 70,
  cacheExpireAge: 15 * 1000,
  cacheEvictAge: 90 * 60 * 1000,
  lateDelay: 400,
  fail(response) { return (response.status < 200 || response.status > 299) && response.status !== 304 },
  autoCache(request) { return request.isSafe() },
  expireCache(request) { return !request.isSafe() },
  evictCache: false,
  progressBar: true,
  timeout: 90_000,
}))

export const queue = new RequestQueue()

export const cache = new UpRequestCache()

let progressBar: ProgressBar | null = null

function reset(): void {
  abortRequests()
  queue.reset()
  cache.reset()
  progressBar?.destroy()
  progressBar = null
}

export const makeRequest = mockable(function makeRequest(...args: [url: string, options?: Partial<t.RequestOptions>] | [options: t.RequestOptions]): UpRequest {
  const options = parseRequestOptions(args)
  const request = new UpRequest(options)
  processRequest(request)
  return request
})

function parseRequestOptions(args: any[]): t.RequestOptions {
  let options = u.parseArgIntoOptions(args, 'url') as t.RequestOptions
  up.migrate.handleRequestOptions?.(options)
  return options
}

function processRequest(request: UpRequest): void {
  cache.expire(request.expireCache ?? u.evalOption(networkConfig.expireCache, request) ?? false)
  cache.evict(request.evictCache ?? u.evalOption(networkConfig.evictCache, request) ?? false)
  useCachedRequest(request) || queueRequest(request)
}

function useCachedRequest(newRequest: UpRequest): boolean | undefined {
  // If we have an existing promise matching this new request,
  // we use it unless `request.cache` is explicitly set to `false`.
  let cachedRequest
  if (newRequest.willCache() && (cachedRequest = cache.get(newRequest))) {
    printToStandard('up.request()', 'Re-using previous request to %s', newRequest)

    // Check if we need to upgrade a cached background request to a foreground request.
    // This might affect whether we're going to emit an up:network:late event further
    // down. Consider this case:
    //
    // - User preloads a request (1). We have a cache miss and connect to the network.
    //   This will never trigger `up:network:late`, because we only track foreground requests.
    // - User loads the same request (2) in the foreground (no preloading).
    //   We have a cache hit and receive the earlier request that is still preloading.
    //   Now we *should* trigger `up:network:late`.
    // - The request (1) finishes. This triggers `up:network:recover`.
    if (!newRequest.background) {
      queue.promoteToForeground(cachedRequest)
    }

    cachedRequest.mergeIfUnsent(newRequest)

    // We cannot simply return `cachedRequest`, since that might have a different #hash property.
    // While two requests with a different #hash have the same cache key, they are
    // not the same object.
    //
    // What we do instead is have `request` follow the state of `cachedRequest`'s exchange.
    //
    // There is also the edge case where a cached request is still in-flight and, when the
    // response is finally received, has a Vary header that makes it incompatible with
    // `newRequest`. In this case we re-process `newRequest` as if it was just made.
    cache.track(cachedRequest, newRequest, { onIncompatible: processRequest })

    // Make newRequest abortable on its own, e.g. by up.fragment.abort().
    // Aborting it only rejects newRequest, while cachedRequest keeps loading for others.
    if (!newRequest.ended) queue.track(newRequest)

    return true
  }
}

// If no existing promise is available, we queue a network request.
function queueRequest(request: UpRequest): boolean {
  handleCaching(request)

  queue.asap(request)

  return true
}

function handleCaching(request: UpRequest): void {
  // Several code paths lead here:
  //
  // (1) A request with { cache: true } when there was a cache miss.
  // (2) A request with { cache: false }. This may still update the cache if we end up with a fresher response,
  //     but should keep a good cache entry if we end up with a network error.
  //
  // A code path that does *never* lead here:
  //
  // (3) A request with { cache: true } when there was a cache hit.

  if (request.willCache()) {
    // Here we have a request with { request: true } and a cache miss.
    //
    // Cache the request before it is queued and loaded.
    // This way additional requests to the same endpoint will hit and track this request.
    // Since nothing was cached for this request, we're not overriding an existing cache entry.
    cache.put(request)

    // If the request changed its URL or params in up:request:load, the cache needs to re-index.
    request.onLoading = () => cache.reindex(request)
  }

  // Once we receive a response we honor options/headers for eviction/expiration,
  // even if the request was not cachable.
  //
  // We do this synchronously, before the request's promise settles. Otherwise a request made
  // synchronously after an abort (e.g. by a compiler during the render that aborted it)
  // would hit the aborted request in the cache.
  // An up.Response, or an error (which has no { expireCache } or { evictCache }).
  request.onSettle = function(responseOrError: any) {
    cache.expire(responseOrError.expireCache ?? false, { except: request })
    cache.evict(responseOrError.evictCache ?? false, { except: request })

    let isResponse = responseOrError instanceof UpResponse
    let isNetworkError = !isResponse
    let isSuccessResponse = isResponse && responseOrError.ok
    let isErrorResponse = isResponse && !responseOrError.ok
    let isEmptyResponse = isResponse && responseOrError.none
    let redirectRequest = isResponse && responseOrError.redirectRequest

    if (isErrorResponse) {
      // Evict an earlier cache entry with a successful response (as we now know a better state, even if that state is an error page).
      cache.evict(request.url)
    } else if (isNetworkError || isEmptyResponse) {
      // Only evict this one request instance in case we put it into the cache at the start of this function.
      // We keep other requests for the same URL but with a different { cacheRoute } (due to Vary).
      cache.evict(request)
    } else if (isSuccessResponse) {
      if (cache.get(request)) {
        // We now re-put the request into the cache, regardless of its { cache } setting, for multiple reasons:
        //
        // (1) In case we evicted the entire cache above, we must re-cache a cacheable request.
        // (2) An un-cacheable request should still update an existing cache entry
        //     (written by a earlier, cacheable request with the same cache key)
        //     since the later response will be fresher.
        // (3) Now that we have a response the cache needs to be updated with Vary info.
        cache.put(request)
      }

      if (redirectRequest && (redirectRequest.willCache() || cache.get(redirectRequest))) {
        // (1) If GET /foo redirected to GET /bar, both /foo and /bar should yield the cached response.
        // (2) If POST /foo redirected to GET /bar, we should now cache GET /bar (although we didn't cache POST /foo)
        // (3) If POST /foo redirected to GET /bar without caching, but /bar was already cached, update cache for /bar
        cache.put(redirectRequest)
      }
    }
  }
}

export function isBusy(): boolean {
  return queue.isBusy()
}

export const loadPage = mockable(function loadPage(requestsAttrs: t.RequestOptions): void {
  new UpRequest(requestsAttrs).loadPage()
})

export function abortRequests(...args: any[]): void {
  up.migrate.preprocessAbortArgs?.(args)
  queue.abort(...args)
}

export function isSafeMethod(method: string): boolean {
  return u.contains(['GET', 'OPTIONS', 'HEAD'], u.normalizeMethod(method))
}

function onLate(): void {
  if (u.evalOption(networkConfig.progressBar)) {
    progressBar = new ProgressBar()
  }
}

function onRecover(): void {
  progressBar?.conclude()
}

export function install(): void {
  on('up:network:late', onLate)

  on('up:network:recover', onRecover)

  on('up:framework:reset', reset)
}

export const api = {
  network: {
    request: makeRequest,
    // buildRequest,
    // processRequest,
    cache,
    isBusy,
    config: networkConfig,
    abort: abortRequests,
    loadPage,
  },
  request: makeRequest,
  cache,
}
