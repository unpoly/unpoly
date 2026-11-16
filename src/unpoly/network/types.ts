import type * as u from '../util.js'
import type { UpEvent } from '../event.js'
import type { ParamsLike } from '../form.js'
import type { Layer, LayerMode, LayerReference, NewLayer } from '../layer.js'
import type { LogArgs } from '../log.js'
import type { UpRequest } from './request.js'
import type { UpResponse } from './response.js'

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

// The request cache sets 'tracking' while a request waits for the response of an earlier, equivalent request.
/**
The state of an `up.Request` in its lifecycle.
*/
export type RequestState = 'new' | 'loading' | 'tracking' | 'loaded' | 'aborted' | 'offline'

/**
The options that an `up.Request` copies onto itself.
@internal
*/
export interface RequestProps {
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
  payload?: XMLHttpRequestBodyInit
  onLoading?: () => void
  onSettle?: (responseOrError: UpResponse | Error) => void
  fail?: u.ValueOrFunction<boolean>
  abortable?: boolean | null
  lateDelay?: number | false
  previews?: unknown[]
  bindLayer?: Layer
}

/**
Options for constructing an `up.Request`. See `up.request()` for most of them.
@internal
*/
export interface RequestOptions extends RequestProps {
  // Skip looking up layers, e.g. for a request that is only used as a cache key.
  basic?: boolean
  fragments?: Element[]
  bindFragments?: Element[]
}

/**
The arguments for `up.request()`: a URL and optional options, or options with a `{ url }`.
*/
export type RequestArgs = [url: string, options?: Partial<RequestOptions>] | [options: RequestOptions]

/**
Which requests `up.network.abort()` aborts: a request, a URL pattern, a function or a boolean.
A function may return any truthy or falsy value. `up.Request.tester()` accepts the same.
*/
export type RequestCondition = UpRequest | string | ((request: UpRequest) => unknown) | boolean

/**
Options for `up.Request.tester()`, and for the cache and queue methods that use it.
*/
export interface RequestTesterOptions {
  // Never match this request, or the cached request whose response it waits for.
  except?: UpRequest
}

/**
Options for `up.network.abort()`.
*/
export interface AbortRequestsOptions extends RequestTesterOptions {
  reason?: string | Error
  /** A message to log before the first request is aborted. @internal */
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
