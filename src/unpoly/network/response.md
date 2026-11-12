# up.Response

A response to an [HTTP request](/api/up.request).

### Example

```js
let response = await up.request('/foo')
console.log(response.status) // 200
console.log(response.text)   // "<html><body>..."
```

@class up.Response
@parent up.network

-----

# up.Response#method

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

-----

# up.Response#url

The URL from which the response was loaded.

This is usually the [requested URL](/api/up.Request.prototype.url), or the final URL after the server redirected.

@property up.Response#url
@param {string} url
@stable

-----

# up.Response#text

The response body as a `string`.

@property up.Response#text
@param {string} text
@stable

-----

# up.Response#status

The response's
[HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)
as a `number`.

A successful response will usually have a `200` or `201` status code.

@property up.Response#status
@param {number} status
@stable

-----

# up.Response#request

The original [request](/api/up.Request) that triggered this response.

@property up.Response#request
@param {up.Request} request
@internal

-----

# up.Response#xhr

The [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)
object that was used to create this response.

@property up.Response#xhr
@param {XMLHttpRequest} xhr
@experimental

-----

# up.Response#title

A [document title pushed by the server](/api/X-Up-Title).

If the server pushed no title via HTTP header, this will be `undefined`.

@property up.Response#title
@param {string|undefined} [title]
  The decoded title.
@experimental

-----

# up.Response#target

A [render target pushed by the server](/api/X-Up-Target).

If the server pushed no target via HTTP header, this will be `undefined`.

@property up.Response#target
@param {string|undefined} [target]
  The decoded target.
@stable

-----

# up.Response#context

Changes to the current [context](/learn/layer-context) as [set by the server](/api/X-Up-Context).

@learn-ref layer-context

@property up.Response#context
@experimental

-----

# up.Response#ok

Returns whether the server responded with a `2xx` HTTP status.

@property up.Response#ok
@param {boolean} ok
@stable

-----

# up.Response#none

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

-----

# up.Response#header()

Returns the HTTP header value with the given name.

The search for the header is case-insensitive.

Returns `null` or `undefined` if the given header name was not included in the response.

@function up.Response#header
@param {string} name
@return {string|null|undefined}
  The value of the header.
@stable

-----

# up.Response#contentType

The response's [content-type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type).

@property up.Response#contentType
@param {string} contentType
@stable

-----

# up.Response#isHTML()

Returns whether the response has a [content-type](/api/up.Response.prototype.contentType)
for HTML or XHTML.

This method tests if the `Content-Type` header is either `text/html` or `application/xhtml+xml`.
It doesn't test if the response body actually contains a valid HTML
document.

@function up.Response#isHTML
@return {boolean}
  Whether the response has an HTML mime type.
@experimental

-----

# up.Response#cspInfo

@property up.Response#cspInfo
@param {Object} cspInfo
@internal

-----

# up.Response#lastModified

The last modification time of the response's underlying content.

This is extracted from the `Last-Modified` header sent by the server.

@property up.Response#lastModified
@param {Date|undefined} lastModified
@stable

-----

# up.Response#etag

The response's [ETag](https://en.wikipedia.org/wiki/HTTP_ETag).

This is extracted from the `ETag` header sent by the server.

@property up.Response#etag
@param {string|undefined} etag
@stable

-----

# up.Response#json

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

-----

# up.Response#age

The number of milliseconds since this response was received.

@property up.Response#age
@param {number} age
@stable

-----

# up.Response#expired

Returns whether this [cached](/learn/caching) response has expired.

Content rendered from an expired response is [revalidated](/learn/caching#revalidation) with the server.

@property up.Response#expired
@param {boolean} expired
@stable
