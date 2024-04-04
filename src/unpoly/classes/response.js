const u = up.util

/*-
A response to an [HTTP request](/up.request).

### Example

```js
up.request('/foo').then(function(response) {
  console.log(response.status) // 200
  console.log(response.text)   // "<html><body>..."
})
```

@class up.Response
@parent up.network
*/
up.Response = class Response extends up.Record {

  /*-
  The HTTP method used for the request that produced this response.

  This is usually the HTTP method used by the initial request, but if the server
  redirected multiple requests may have been involved. In this case this property reflects
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

  This is usually the [requested URL](/up.Request.prototype.url), or the final URL after the server redirected.

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

  A successful response will usually have a `200` or `201' status code.

  @property up.Response#status
  @param {number} status
  @stable
  */

  /*-
  The original [request](/up.Request) that triggered this response.

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
  A [document title pushed by the server](/X-Up-Title).

  If the server pushed no title via HTTP header, this will be `undefined`.

  @property up.Response#title
  @param {string|undefined} [title]
    The decoded title.
  @experimental
  */

  /*-
  A [render target pushed by the server](/X-Up-Target).

  If the server pushed no title via HTTP header, this will be `undefined`.

  @property up.Response#target
  @param {string|undefined} [target]
    The decoded target.
  @stable
  */

  /*-
  Changes to the current [context](/context) as [set by the server](/X-Up-Context).

  @property up.Response#context
  @experimental
  */

  keys() {
    return [
      'method',
      'url',
      'text',
      'status',
      'request',
      'xhr', // optional
      'target',
      'title',
      'acceptLayer',
      'dismissLayer',
      'eventPlans',
      'context',
      'expireCache',
      'evictCache',
      'headers', // custom headers to for synthetic reponses without { xhr } property
      'loadedAt',
      'fail',
    ]
  }

  defaults() {
    return {
      headers: {},
      loadedAt: new Date()
    }
  }

  /*-
  Returns whether the server responded with a 2xx HTTP status.

  @property up.Response#ok
  @param {boolean} ok
  @stable
  */
  get ok() {
    return !u.evalOption(this.fail ?? up.network.config.fail, this)
  }

  /*-
  Response whether the response has an empty body text.

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
  get none() {
    return !this.text
  }

  isCacheable() {
    // (1) Uncache responses that have failed. We have no control over the server,
    //     and another request with the same properties may succeed.
    // (2) Uncache responses that have an empty body, in particular 304 Not Modified.
    //     Another request with a different ETag may produce a body.
    return this.ok && !this.none
  }

  /*-
  Returns the HTTP header value with the given name.

  The search for the header is case-insensitive.

  Returns `undefined` if the given header name was not included in the response.

  @function up.Response#header
  @param {string} name
  @return {string|undefined}
    The value of the header.
  @stable
  */
  header(name) {
    return this.headers[name] || this.xhr?.getResponseHeader(name)
  }

  // TODO: Do we need this? Why don't we take all the Vary info that we have?
  //  => Because network infrastructure may set additional Vary headers we don't care about
  //  => But why doesn't the test crash? (`ignores Vary for headers that were set outside Unpoly`)
  //     => Because our own requests will not have values for infrastructure-set Vary headers
  get ownInfluencingHeaderNames() {
    let influencingHeaders = up.protocol.influencingHeaderNamesFromResponse(this)
    // Only return the header names that actually had a value in the request.
    return u.filter(influencingHeaders, (headerName) => this.request.header(headerName))
  }

  /*-
  The response's [content-type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type).

  @property up.Response#contentType
  @param {string} contentType
  @experimental
  */
  get contentType() {
    return this.header('Content-Type')
  }

  /*-
  @property up.Response#cspNonces
  @param {Array<string>} cspNonces
  @internal
  */
  get cspNonces() {
    return up.protocol.cspNoncesFromHeader(this.header('Content-Security-Policy') || this.header('Content-Security-Policy-Report-Only'))
  }

  /*-
  The last modification time of the response's underlying content.

  This is extracted from the `Last-Modified` header sent by the server.

  @property up.Response#lastModified
  @param {Date|undefined} lastModified
  @experimental
  */
  get lastModified() { // eslint-disable-line getter-return
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
  @experimental
  */
  get etag() {
    return this.header('ETag')
  }

  /*-
  The response body parsed as a JSON string.

  The parsed JSON object is cached with the response object,
  so multiple accesses will call `JSON.parse()` only once.

  ### Example

      response = await up.request('/profile.json')
      console.log("User name is " + response.json.name)

  @property up.Response#json
  @param {Object} json
  @stable
  */
  get json() {
    return this.parsedJSON ||= JSON.parse(this.text)
  }

  /*-
  The number of milliseconds since this response was received.

  @property up.Response#age
  @param {number} age
  @experimental
  */
  get age() {
    let now = new Date()
    return now - this.loadedAt
  }

  /*-
  Returns whether this [cached](/caching) response has expired.

  Content rendered from an expired response is [revalidated](/caching#revalidation) with the server.

  @property up.Response#expired
  @param {boolean} expired
  @experimental
  */
  get expired() {
    return this.age > up.network.config.cacheExpireAge ||
      // When the user calls up.cache.expire() it will expire requests, not responses.
      // Hence we need to delegate to our request.
      this.request.expired
  }

  get description() {
    return `HTTP ${this.status} response to ${this.request.description}`
  }

}
