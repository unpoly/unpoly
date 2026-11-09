import { evalOption, getSimpleTokens, variant } from '../util.js'
import { cache, config } from '../network.js'
import { CSPInfo } from '../script/csp/csp_info.js'
import type { PlainObject, ValueOrFunction } from '../util.js'
import type { UpRequest as UpRequestClass } from './request.js'

type UpRequest = InstanceType<typeof UpRequestClass>

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
  openLayer?: PlainObject
  acceptLayer?: any
  dismissLayer?: any
  eventPlans?: PlainObject[]
  context?: PlainObject
  expireCache?: any
  evictCache?: any
  // Custom headers for synthetic responses without { xhr }.
  headers?: Record<string, string>
  loadedAt?: Date
  fail?: ValueOrFunction<boolean>
}

const HTML_CONTENT_TYPE = /^(text\/html|application\/xhtml\+xml) *(;|$)/i

/*-
A response to an [HTTP request](/api/up.request).

### Example

```js
let response = await up.request('/foo')
console.log(response.status) // 200
console.log(response.text)   // "<html><body>..."
```

@class up.Response
@parent up.network
*/
// A class expression, so the class is still named `Response` at runtime, while the binding
// doesn't shadow the browser's `Response` here or in importers.
export const UpResponse = class Response {
  declare method: string
  declare url: string
  declare text: string
  declare status: number
  declare request: UpRequest
  declare xhr: XMLHttpRequest | undefined
  declare target: string | undefined
  declare title: string | undefined
  declare openLayer: PlainObject | undefined
  declare acceptLayer: any
  declare dismissLayer: any
  declare eventPlans: PlainObject[] | undefined
  declare context: PlainObject | undefined
  declare expireCache: any
  declare evictCache: any
  declare headers: Record<string, string>
  declare loadedAt: Date
  declare fail: ValueOrFunction<boolean> | undefined
  declare parsedJSON: any

  /*-
  The HTTP method used for the request that produced this response.

  This is usually the HTTP method used by the initial request, but if the server
  redirected, multiple requests may have been involved. In this case this property reflects
  the method used by the last request.

  If the response's URL changed from the request's URL,
  Unpoly will assume a redirect and set the method to `GET`.
  Also see the `X-Up-Method` header.

  @property up.Response#method
  @param {string} method
  @stable
  */

  /*-
  The URL from which the response was loaded.

  This is usually the [requested URL](/api/up.Request.prototype.url), or the final URL after the server redirected.

  @property up.Response#url
  @param {string} url
  @stable
  */

  /*-
  The response body as a `string`.

  @property up.Response#text
  @param {string} text
  @stable
  */

  /*-
  The response's
  [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
  as a `number`.

  A successful response will usually have a `200` or `201` status code.

  @property up.Response#status
  @param {number} status
  @stable
  */

  /*-
  The original [request](/api/up.Request) that triggered this response.

  @property up.Response#request
  @param {up.Request} request
  @internal
  */

  /*-
  The [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
  object that was used to create this response.

  @property up.Response#xhr
  @param {XMLHttpRequest} xhr
  @experimental
  */

  /*-
  A [document title pushed by the server](/api/X-Up-Title).

  If the server pushed no title via HTTP header, this will be `undefined`.

  @property up.Response#title
  @param {string|undefined} [title]
    The decoded title.
  @experimental
  */

  /*-
  A [render target pushed by the server](/api/X-Up-Target).

  If the server pushed no target via HTTP header, this will be `undefined`.

  @property up.Response#target
  @param {string|undefined} [target]
    The decoded target.
  @stable
  */

  /*-
  Changes to the current [context](/learn/layer-context) as [set by the server](/api/X-Up-Context).

  @learn-ref layer-context

  @property up.Response#context
  @experimental
  */

  constructor(options: ResponseOptions = {}) {
    // Like a default parameter, a default only replaces an undefined option.
    const { headers = {}, loadedAt = new Date() } = options

    this.method = options.method
    this.url = options.url
    this.text = options.text
    this.status = options.status
    this.request = options.request
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

  /*-
  Returns whether the server responded with a `2xx` HTTP status.

  @property up.Response#ok
  @param {boolean} ok
  @stable
  */
  get ok(): boolean {
    return !evalOption(this.fail ?? config.fail, this)
  }

  /*-
  Returns whether the response has an empty body text.

  There are some cases where the server might send us an empty body:

  - HTTP status `304 Not Modified` (especially when reloading)
  - HTTP status `204 No Content`
  - Header `X-Up-Target: :none`
  - Header `X-Up-Accept-Layer` or `X-Up-Dismiss-Layer`, although the server
    may send an optional body in case the response is used on the root layer.

  @property up.Response#none
  @param {boolean} none
  @internal
  */
  get none(): boolean {
    return !this.text
  }

  /*-
  Returns the HTTP header value with the given name.

  The search for the header is case-insensitive.

  Returns `null` or `undefined` if the given header name was not included in the response.

  @function up.Response#header
  @param {string} name
  @return {string|null|undefined}
    The value of the header.
  @stable
  */
  header(name: string): string | undefined {
    return this.headers[name] || this.xhr?.getResponseHeader(name)
  }

  get varyHeaderNames(): string[] {
    let varyHeaderValue = this.header('Vary')
    return getSimpleTokens(varyHeaderValue, { separator: ',' })
  }

  /*-
  The response's [content-type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type).

  @property up.Response#contentType
  @param {string} contentType
  @stable
  */
  get contentType(): string | undefined {
    return this.header('Content-Type')
  }

  /*-
  Returns whether the response has a [content-type](/api/up.Response.prototype.contentType)
  for HTML or XHTML.

  This method tests if the `Content-Type` header is either `text/html` or `application/xhtml+xml`.
  It doesn't test if the response body actually contains a valid HTML
  document.

  @function up.Response#isHTML
  @return {boolean}
    Whether the response has an HTML mime type.
  @experimental
  */
  isHTML(): boolean {
    return HTML_CONTENT_TYPE.test(this.contentType)
  }

  /*-
  @property up.Response#cspInfo
  @param {Object} cspInfo
  @internal
  */
  get cspInfo(): CSPInfo {
    let policy = this.header('Content-Security-Policy') || this.header('Content-Security-Policy-Report-Only')
    return CSPInfo.fromHeader(policy)
  }

  /*-
  The last modification time of the response's underlying content.

  This is extracted from the `Last-Modified` header sent by the server.

  @property up.Response#lastModified
  @param {Date|undefined} lastModified
  @stable
  */
  get lastModified(): Date | undefined {
    let header = this.header('Last-Modified')
    if (header) {
      return new Date(header)
    }
  }

  /*-
  The response's [ETag](https://en.wikipedia.org/wiki/HTTP_ETag).

  This is extracted from the `ETag` header sent by the server.

  @property up.Response#etag
  @param {string|undefined} etag
  @stable
  */
  get etag(): string | undefined {
    return this.header('ETag')
  }

  /*-
  The response body parsed from JSON.

  The parsed JSON object is cached with the response object,
  so multiple accesses will call `JSON.parse()` only once.

  > [note]
  > This method can only parse regular JSON values. [Relaxed JSON](/api/relaxed-json) is not supported here.

  ### Example

  ```js
  let response = await up.request('/profile.json')
  console.log("User name is " + response.json.name)
  ```

  @property up.Response#json
  @param {Object} json
  @stable
  */
  get json(): any {
    return this.parsedJSON ||= JSON.parse(this.text)
  }

  /*-
  The number of milliseconds since this response was received.

  @property up.Response#age
  @param {number} age
  @stable
  */
  get age(): number {
    let now = new Date()
    // Subtracting dates gives milliseconds. TypeScript only allows arithmetic on numbers.
    return (now as any) - (this.loadedAt as any)
  }

  /*-
  Returns whether this [cached](/learn/caching) response has expired.

  Content rendered from an expired response is [revalidated](/learn/caching#revalidation) with the server.

  @property up.Response#expired
  @param {boolean} expired
  @stable
  */
  get expired(): boolean {
    return this.age > config.cacheExpireAge ||
      // When the user calls up.cache.expire() it will expire requests, not responses.
      // Hence we need to delegate to our request.
      this.request.expired
  }

  get [Symbol.toStringTag]() { return 'up.Response' }

  toString(): string {
    return `HTTP ${this.status} response to ${this.request}`
  }

  get redirect(): boolean {
    return (this.url !== this.request.url) || (this.method !== this.request.method)
  }

  get redirectRequest(): UpRequest | undefined {
    if (!this.redirect) return

    let finalRequest = variant(this.request, {
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

}

/**
An instance of `up.Response`.
*/
export type UpResponse = InstanceType<typeof UpResponse>

export const api = {
  Response: UpResponse,
}
