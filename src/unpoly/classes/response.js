/*-
A response to an [HTTP request](/up.request).

### Example

    up.request('/foo').then(function(response) {
      console.log(response.status) // 200
      console.log(response.text)   // "<html><body>..."
    })

@class up.Response
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
  The URL used for the response.

  This is usually the requested URL, or the final URL after the server redirected.

  On Internet Explorer 11 this property is only set when the server sends an `X-Up-Location` header.

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
  @experimental
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
  @param {string} [title]
  @experimental
  */

  /*-
  A [render target pushed by the server](/X-Up-Target).

  If the server pushed no title via HTTP header, this will be `undefined`.

  @property up.Response#target
  @param {string} [target]
  @experimental
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
      'clearCache',
      'headers' // custom headers to for synthetic reponses without { xhr } property
    ]
  }

  defaults() {
    return {headers: {}}
  }

  /*-
  Returns whether the server responded with a 2xx HTTP status.

  @property up.Response#ok
  @param {boolean} ok
  @stable
  */
  get ok() {
    // 0 is falsy in JavaScript
    return this.status && ((this.status >= 200) && (this.status <= 299))
  }
  
  /*-
  Returns the HTTP header value with the given name.

  The search for the header name is case-insensitive.

  Returns `undefined` if the given header name was not included in the response.

  @function up.Response#getHeader
  @param {string} name
  @return {string|undefined} value
  @experimental
  */
  getHeader(name) {
    return this.headers[name] || this.xhr?.getResponseHeader(name)
  }


  /*-
  The response's [content-type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type).

  @property up.Response#contentType
  @param {string} contentType
  @experimental
  */
  get contentType() {
    return this.getHeader('Content-Type')
  }

  get cspNonces() {
    return up.protocol.cspNoncesFromHeader(this.getHeader('Content-Security-Policy'))
  }

  get lastModified() {
    let header = this.getHeader('Last-Modified')
    if (header) {
      return new Date(header)
    }
  }

  get etag() {
    return this.getHeader('ETag')
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

}
