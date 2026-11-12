import * as u from '../util.js'
import { isCritical } from '../error.js'
import { type EventPlan } from '../event.js'
import { type RenderOptions } from '../fragment.js'
import { cache, networkConfig } from '../network.js'
import { CSPInfo } from '../script.js'
import type * as t from './types.js'
import { type UpRequest } from './request.js'

const HTML_CONTENT_TYPE = /^(text\/html|application\/xhtml\+xml) *(;|$)/i

// Prefixed, so the binding doesn't shadow the browser's `Response` here or in importers.
// At runtime the class is named `up.Response` (see unpoly.ts).
export class UpResponse {
  declare method: string
  declare url: string
  declare text: string
  declare status: number
  declare request: UpRequest
  declare xhr?: XMLHttpRequest
  declare target?: string
  declare title?: string
  declare openLayer?: RenderOptions
  declare acceptLayer: any
  declare dismissLayer: any
  declare eventPlans?: EventPlan[]
  declare context?: u.PlainObject
  declare expireCache?: string | false
  declare evictCache?: string | false
  declare headers: Record<string, string>
  declare loadedAt: Date
  declare fail?: u.ValueOrFunction<boolean>
  declare parsedJSON: any

  constructor(options: t.ResponseOptions = {}) {
    // Like a default parameter, a default only replaces an undefined option.
    const { headers = {}, loadedAt = new Date() } = options

    // up.Request always passes these.
    this.method = options.method!
    this.url = options.url!
    this.text = options.text!
    this.status = options.status!
    this.request = options.request!
    this.xhr = options.xhr // optional
    this.target = options.target
    this.title = options.title
    this.openLayer = options.openLayer
    this.acceptLayer = options.acceptLayer
    this.dismissLayer = options.dismissLayer
    this.eventPlans = options.eventPlans
    this.context = options.context
    this.expireCache = options.expireCache
    this.evictCache = options.evictCache
    this.headers = headers // custom headers for synthetic responses without { xhr }
    this.loadedAt = loadedAt
    this.fail = options.fail
  }

  get ok(): boolean {
    return !u.evalOption(this.fail ?? networkConfig.fail, this)
  }

  get none(): boolean {
    return !this.text
  }

  header(name: string): string | null | undefined {
    return this.headers[name] || this.xhr?.getResponseHeader(name)
  }

  get varyHeaderNames(): string[] {
    let varyHeaderValue = this.header('Vary')
    return u.getSimpleTokens(varyHeaderValue, { separator: ',' })
  }

  get contentType(): string | null | undefined {
    return this.header('Content-Type')
  }

  isHTML(): boolean {
    // test() stringifies a missing type, which doesn't match.
    return HTML_CONTENT_TYPE.test(this.contentType!)
  }

  get cspInfo(): CSPInfo {
    let policy = this.header('Content-Security-Policy') || this.header('Content-Security-Policy-Report-Only')
    return CSPInfo.fromHeader(policy)
  }

  get lastModified(): Date | undefined {
    let header = this.header('Last-Modified')
    if (header) {
      return new Date(header)
    }
  }

  get etag(): string | null | undefined {
    return this.header('ETag')
  }

  get json(): any {
    return this.parsedJSON ||= JSON.parse(this.text)
  }

  get age(): number {
    let now = new Date()
    // Subtracting dates gives milliseconds. TypeScript only allows arithmetic on numbers.
    return (now as any) - (this.loadedAt as any)
  }

  get expired(): boolean {
    return this.age > networkConfig.cacheExpireAge ||
      // When the user calls up.cache.expire() it will expire requests, not responses.
      // Hence we need to delegate to our request.
      this.request.expired
  }

  toString(): string {
    return `HTTP ${this.status} response to ${this.request}`
  }

  get redirect(): boolean {
    return (this.url !== this.request.url) || (this.method !== this.request.method)
  }

  get redirectRequest(): UpRequest | undefined {
    if (!this.redirect) return

    let finalRequest = u.variant(this.request, {
      method: this.method,
      url: this.url,
      // The { cacheRoute } prop may no longer be correctly cached
      // TODO: Maybe we can find a way to get rid of this prop?
      cacheRoute: null,
      // Don't run up.network's cache handling a second time when this variant settles
      onSettle: null,
    })

    cache.track(this.request, finalRequest, { force: true })

    return finalRequest
  }

  // A failed request rejects with its response, which is not a critical error.
  [isCritical.key](): boolean {
    return false
  }

}

export const api = {
  Response: UpResponse,
}
