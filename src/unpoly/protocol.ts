import * as u from './util.js'
import * as e from './element.js'
import { newConfig } from './util/config.js'
import { popCookie } from './browser.js'
import { type EventPlan } from './event.js'
import { type Params } from './form.js'
import { type RenderOptions } from './fragment.js'
import { mockable } from './mockable.js'
import type * as t from './protocol/types.js'
export type * from './protocol/types.js'


export const headerize = function(camel: string): string {
  const header = camel.replace(/(^.|[A-Z])/g, (char) => '-' + char.toUpperCase())
  return 'X-Up' + header
}

const extractHeader = function(xhr: XMLHttpRequest, shortHeader: string, parseFn: (value: string) => any = u.identity): any {
  let value = xhr.getResponseHeader(headerize(shortHeader))
  if (value) {
    return parseFn(value)
  }
}

export function targetFromXHR(xhr: XMLHttpRequest): string | undefined {
  return extractHeader(xhr, 'target')
}

function parseModifyCacheValue(value: string): string | false {
  if (value === 'false') {
    return false
  } else {
    return value
  }
}

export function evictCacheFromXHR(xhr: XMLHttpRequest): string | false | undefined {
  return extractHeader(xhr, 'evictCache', parseModifyCacheValue)
}


export function expireCacheFromXHR(xhr: XMLHttpRequest): string | false | undefined {
  return extractHeader(xhr, 'expireCache', parseModifyCacheValue) ?? up.migrate.clearCacheFromXHR?.(xhr)
}

export function contextFromXHR(xhr: XMLHttpRequest): u.PlainObject | undefined {
  return extractHeader(xhr, 'context', u.parseRelaxedJSON)
}

export function methodFromXHR(xhr: XMLHttpRequest): string | undefined {
  return extractHeader(xhr, 'method', u.normalizeMethod)
}

export function titleFromXHR(xhr: XMLHttpRequest): string | undefined {
  return up.migrate.titleFromXHR?.(xhr) ?? extractHeader(xhr, 'title', u.parseRelaxedJSON)
}

export function eventPlansFromXHR(xhr: XMLHttpRequest): EventPlan[] | undefined {
  return extractHeader(xhr, 'events', u.parseRelaxedJSON)
}

export function openLayerFromXHR(xhr: XMLHttpRequest): RenderOptions | undefined {
  // When no specific options are given, the server will send X-Up-Open-Layer: {}
  return extractHeader(xhr, 'openLayer', u.parseRelaxedJSON)
}

export function acceptLayerFromXHR(xhr: XMLHttpRequest): any {
  // Even if acceptance has no value, the server will send
  // X-Up-Accept-Layer: null
  return extractHeader(xhr, 'acceptLayer', u.parseRelaxedJSON)
}

export function dismissLayerFromXHR(xhr: XMLHttpRequest): any {
  // Even if dismissal has no value, the server will send
  // X-Up-Dismiss-Layer: null
  return extractHeader(xhr, 'dismissLayer', u.parseRelaxedJSON)
}

export const initialRequestMethod = mockable(function initialRequestMethod(): string {
  return readInitialRequestMethod()
})

// The cookie is deleted after reading, so we must only read it once.
const readInitialRequestMethod = u.memoize(function(): string {
  return u.normalizeMethod(popCookie('_up_method'))
})

export function locationFromXHR(xhr: XMLHttpRequest): string | undefined {
  // We prefer the X-Up-Location header to xhr.responseURL.
  // If the server redirected to a new location, Unpoly-related headers
  // will be encoded in the request's query params like this:
  //
  //     /redirect-target?_up[target]=.foo
  //
  // To prevent these these `_up` params from showing up in the browser URL,
  // the X-Up-Location header will omit these params while `xhr.responseURL`
  // will still contain them.
  let location = extractHeader(xhr, 'location') || xhr.responseURL
  if (location) {
    return u.normalizeURL(location)
  }
}

export const protocolConfig = newConfig('up.protocol.config', (): t.ProtocolConfig => ({
  methodParam: '_method',
  csrfParam() { return e.metaContent('csrf-param') },
  csrfToken() { return e.metaContent('csrf-token') },
  // TODO: Let's move config.cspNonce() to up.script.config after all
  csrfHeader: 'X-CSRF-Token', // Used by Rails. Other frameworks use different headers.
  maxHeaderSize: 2048,
}))

export function csrfHeader(): string {
  return u.evalOption(protocolConfig.csrfHeader)
}

export function csrfParam(): string | undefined {
  return u.evalOption(protocolConfig.csrfParam)
}

export function csrfToken(): string | undefined {
  return u.evalOption(protocolConfig.csrfToken)
}

export function wrapMethod(method: string, params: Params): string {
  params.add(protocolConfig.methodParam, method)
  return 'POST'
}

export const api = {
  protocol: {
    config: protocolConfig,
  },
}
