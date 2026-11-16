import type * as u from '../util.js'
import { type EventPlan, type UpEvent } from '../event.js'
import { type ParamsLike } from '../form.js'
import { type RenderOptions } from '../fragment.js'
import { type Layer, type LayerMode, type LayerReference, type NewLayer } from '../layer.js'
import { type LogArgs } from '../log.js'
import { type UpRequest } from './request.js'
import { type UpResponse } from './response.js'

/**
The properties of the `up:request:*` events.
*/
export interface RequestEvent extends UpEvent {
  request: UpRequest
  layer?: Layer
  origin?: Element
}

/** The `up:request:load` event. */
export interface RequestLoadEvent extends RequestEvent {}

/** The `up:request:loaded` event. */
export interface RequestLoadedEvent extends RequestEvent { response: UpResponse }

/** The `up:request:aborted` event. */
export interface RequestAbortedEvent extends RequestEvent {}

/** The `up:request:offline` event. */
export interface RequestOfflineEvent extends RequestEvent {}

/** The `up:network:late` event. */
export interface NetworkLateEvent extends UpEvent {}

/** The `up:network:recover` event. */
export interface NetworkRecoverEvent extends UpEvent {}

/**
The settings in `up.network.config`, described in its doc comment.
*/
export interface NetworkConfig {
  concurrency: number | (() => number)
  wrapMethod: boolean
  lateDelay: number | false | ((request: UpRequest) => number | false)
  timeout?: number
  fail: boolean | ((response: UpResponse) => boolean)
  cacheEnabled: boolean
  cacheSize: number
  cacheExpireAge: number
  cacheEvictAge: number
  autoCache: (request: UpRequest) => boolean
  expireCache: CacheMatcher
  evictCache: CacheMatcher
  progressBar: boolean | (() => boolean)
}

/**
Which cache entries to expire or evict: `true` for all, `false` for none.
A function receives the request and may also return a URL pattern.
@internal
*/
export type CacheMatcher = boolean | ((request: UpRequest) => boolean | string)

/**
The state of an `up.Request` in its lifecycle.
*/
// The request cache sets 'tracking' while a request waits for the response of an earlier, equivalent request.
export type RequestState = 'new' | 'loading' | 'tracking' | 'loaded' | 'aborted' | 'offline'

/**
Options for constructing an `up.Request`. See `up.request()` for most of them.
@internal
*/
export interface RequestOptions {
  url: string
  method?: string
  hash?: string
  params?: ParamsLike
  target?: string
  failTarget?: string
  headers?: Record<string, string>
  timeout?: number | null
  background?: boolean
  cache?: boolean | 'auto'
  expireCache?: RequestCondition
  evictCache?: RequestCondition
  layer?: LayerReference | NewLayer
  mode?: LayerMode
  context?: u.PlainObject
  failLayer?: LayerReference | NewLayer
  failMode?: LayerMode
  failContext?: u.PlainObject
  origin?: Element
  originLayer?: Layer
  originMode?: LayerMode
  builtAt?: Date
  wrapMethod?: boolean | null
  contentType?: string
  payload?: any
  onLoading?: () => void
  onSettle?: (responseOrError: UpResponse | Error) => void
  fail?: u.ValueOrFunction<boolean>
  abortable?: boolean | null
  lateDelay?: number | false
  previews?: any[]
  // Skip looking up layers, e.g. for a request that is only used as a cache key.
  basic?: boolean
  bindLayer?: Layer
  fragments?: Element[]
  bindFragments?: Element[]
}

/**
The arguments for `up.request()`: a URL and optional options, or options with a `{ url }`.
*/
export type RequestArgs = [url: string, options?: Partial<RequestOptions>] | [options: RequestOptions]

/**
What `up.Request.tester()` accepts: a request, a URL pattern, a function or a boolean.
@internal
*/
export type RequestCondition = UpRequest | string | ((request: UpRequest) => boolean) | boolean

/**
Options for constructing an `up.Response`. Most are read from the response headers.
@internal
*/
export interface ResponseOptions {
  method?: string
  url?: string
  text?: string
  status?: number
  request?: UpRequest
  xhr?: XMLHttpRequest
  target?: string
  title?: string
  openLayer?: RenderOptions
  acceptLayer?: any
  dismissLayer?: any
  eventPlans?: EventPlan[]
  context?: u.PlainObject
  expireCache?: string | false
  evictCache?: string | false
  // Custom headers for synthetic responses without { xhr }.
  headers?: Record<string, string>
  loadedAt?: Date
  fail?: u.ValueOrFunction<boolean>
}

/**
Options for `up.cache.track()`.
@internal
*/
export interface CacheTrackOptions {
  // Track even if the requests would not get the same response.
  force?: boolean
  onIncompatible?: (newRequest: UpRequest) => void
}

/**
Options for `up.Request.tester()`, and for the cache and queue methods that use it.
@internal
*/
export interface RequestTesterOptions {
  // Never match this request, or the cached request whose response it waits for.
  except?: UpRequest
}

/**
Options for `RequestQueue#abort()`.
@internal
*/
export interface AbortRequestsOptions extends RequestTesterOptions {
  reason?: string | Error
  // A message to log before the first request is aborted.
  logOnce?: LogArgs | null
}

declare module '../event.js' {
  interface UpEventMap {
    'up:network:late': NetworkLateEvent
    'up:network:recover': NetworkRecoverEvent
    'up:request:aborted': RequestAbortedEvent
    'up:request:load': RequestLoadEvent
    'up:request:loaded': RequestLoadedEvent
    'up:request:offline': RequestOfflineEvent
  }
}
