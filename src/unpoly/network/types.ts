import * as u from '../util.js'
import { type ParamsLike } from '../form.js'
import { type Layer } from '../layer.js'
import { type LogArgs } from '../log.js'
import { type UpRequest } from './request.js'
import { type UpResponse } from './response.js'

/**
The `up:request:load`, `up:request:aborted` and `up:request:offline` events.
*/
export type RequestEvent = Event & {
  request: UpRequest
  layer: Layer | undefined
  origin: Element | undefined
}

/**
The `up:request:loaded` event.
*/
export type RequestLoadedEvent = RequestEvent & {
  response: UpResponse
}

/**
The settings in `up.network.config`, described in its doc comment.
*/
export interface NetworkConfig {
  concurrency: number | (() => number)
  wrapMethod: boolean
  lateDelay: number | false | ((request: UpRequest) => number | false)
  timeout: number | undefined
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
  expireCache?: any
  evictCache?: any
  // A layer, or a name like 'root' or 'new'.
  layer?: Layer | string
  mode?: string
  context?: u.PlainObject
  failLayer?: Layer | string
  failMode?: string
  failContext?: u.PlainObject
  origin?: Element
  originLayer?: Layer
  originMode?: string
  builtAt?: Date
  wrapMethod?: boolean | null
  contentType?: string
  payload?: any
  onLoading?: () => any
  onSettle?: (responseOrError: UpResponse | Error) => any
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
  openLayer?: u.PlainObject
  acceptLayer?: any
  dismissLayer?: any
  eventPlans?: u.PlainObject[]
  context?: u.PlainObject
  expireCache?: any
  evictCache?: any
  // Custom headers for synthetic responses without { xhr }.
  headers?: Record<string, string>
  loadedAt?: Date
  fail?: u.ValueOrFunction<boolean>
}

/**
Options for `up.cache.track()`.
@internal
*/
export interface TrackOptions {
  // Track even if the requests would not get the same response.
  force?: boolean
  onIncompatible?: (newRequest: UpRequest) => void
}

/**
Options for `RequestQueue#abort()`.
@internal
*/
export interface AbortRequestsOptions {
  except?: UpRequest
  reason?: string | Error
  // A message to log before the first request is aborted.
  logOnce?: LogArgs | null
}
