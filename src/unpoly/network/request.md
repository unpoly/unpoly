# up.Request

A normalized description of an [HTTP request](/api/up.request).

You can queue a request using the `up.request()` method:

```js
let request = up.request('/foo')
console.log(request.url)

// A request object is also a promise for its response
let response = await request
console.log(response.text)
```

@class up.Request
@parent up.network

-----

# up.Request#method

The HTTP method for the request.

@property up.Request#method
@param {string} method
@stable

-----

# up.Request#url

The requested URL.

@property up.Request#url
@param {string} url
@stable

-----

# up.Request#hash

The [hash component](https://en.wikipedia.org/wiki/URI_fragment) of this request's URL.

The `{ hash }` property is automatically extracted from the given URL:

```js
let request = up.request({ url: '/path#section' })
request.url // result: '/path'
request.hash // result: '#section'
```

@property up.Request#hash
@param {string} hash
@stable

-----

# up.Request#params

[Parameters](/api/up.Params) that should be sent as the request's payload.

@property up.Request#params
@param {Object|FormData|string|Array} params
@stable

-----

# up.Request#target

The CSS selector [targeted](/learn/targeting-fragments) by this request.

The selector will be sent as an `X-Up-Target` header.

@learn-ref targeting-fragments

@property up.Request#target
@param {string} target
@stable

-----

# up.Request#failTarget

The CSS selector [targeted](/learn/targeting-fragments) by this request in case
the server responds with an [error code](/learn/error-responses).

The selector will be sent as an `X-Up-Fail-Target` header.

@learn-ref error-responses#fail-options

@property up.Request#failTarget
@param {string} failTarget
@stable

-----

# up.Request#headers

An object of HTTP headers that will be sent with this request.

Unpoly will by default send a number of custom request headers.
See `up.protocol` for details.

To read a single header, use `up.Request#header()`.

@property up.Request#headers
@param {Object} headers
@stable

-----

# up.Request#header()

Returns the HTTP request header value with the given name.

Returns `undefined` if the given header name will not be sent with this request.

> [note]
> For implementation reasons, the search for the header is case-sensitive.

@function up.Request#header
@param {string} name
  The case-sensitive name.
@return {string|undefined}
  The value of the header.
@stable

-----

# up.Request#timeout

A timeout in milliseconds.

If the request is queued due to [many concurrent requests](/api/up.network.config#config.concurrency),
the timeout will not include the time spent waiting in the queue.

@property up.Request#timeout
@param {Object|undefined} timeout
@stable

-----

# up.Request#wrapMethod

Whether to wrap non-standard HTTP methods in a POST request.

If this is set, methods other than GET and POST will be converted to a `POST` request
and carry their original method as a `_method` parameter. This is to [prevent unexpected redirect behavior](https://makandracards.com/makandra/38347).

Defaults to [`up.network.config`](/api/up.network.config#config.wrapMethod).

@property up.Request#wrapMethod
@param {boolean} wrapMethod
@stable

-----

# up.Request#context

The [context](/learn/layer-context) of the layer targeted by this request.

The context object will be sent as an `X-Up-Context` header.

@learn-ref layer-context

@property up.Request#context
@param {Object} context
@experimental

-----

# up.Request#failContext

The [context](/learn/layer-context) of the layer targeted by this request in case the server responds with an [error code](/learn/error-responses).

The context object will be sent as an `X-Up-Fail-Context` header.

@property up.Request#failContext
@param {Object} failContext
@experimental

-----

# up.Request#layer

The [layer](/api/up.layer) targeted by this request.

Setting the `{ layer }` property will automatically derive `{ context }` and `{ mode }` properties.

When this request will [open a new overlay](/learn/opening-overlays), the string `"new"` is returned.

To prevent memory leaks, this property is removed shortly after the response is received.

@property up.Request#layer
@param {up.Layer|string} layer
@stable

-----

# up.Request#failLayer

The [layer](/api/up.layer) targeted by this request in case the server responds with an [error code](/learn/error-responses).

Setting the `{ failLayer }` property will automatically derive `{ failContext }` and `{ failMode }` properties.

To prevent memory leaks, this property is removed shortly after the response is received.

@property up.Request#failLayer
@param {up.Layer} layer
@stable

-----

# up.Request#origin

The element that triggered the request.

For example, when this request was triggered by a click on a link, the link
element is set as the `{ origin }`.

To prevent memory leaks, this property is removed shortly after the response is received.

@property up.Request#origin
@param {Element} origin
@stable

-----

# up.Request#mode

The [mode](/api/up.Layer.prototype.mode) of the layer targeted by this request.

The value will be sent as an `X-Up-Mode` header.

@learn-ref customizing-overlays

@property up.Request#mode
@param {string} mode
@stable

-----

# up.Request#failMode

The [mode](/api/up.Layer.prototype.mode) of the layer targeted by this request in case the server responds with an [error code](/learn/error-responses).

The value will be sent as an `X-Up-Fail-Mode` header.

@property up.Request#failMode
@param {string} failMode
@stable

-----

# up.Request#originMode

The [mode](/api/up.Layer.prototype.mode) of the layer from which the interaction [originated](/api/origin).

The value will be sent as an `X-Up-Origin-Mode` header.

@property up.Request#originMode
@param {string} originMode
@experimental

-----

# up.Request#contentType

The format in which the [request params](/api/up.Request.prototype.params) will be encoded.

@property up.Request#contentType
@param {string} contentType
@stable

-----

# up.Request#payload

The payload that the request will encode into its body.

By default Unpoly will build a payload from the given `{ params }` option.

@property up.Request#payload
@param {string} payload
@stable

-----

# up.Request#abortable

Whether the request is abortable through `up.fragment.abort()`.

This belongs to the `up.fragment` API, not `up.request`.
A request with `{ abortable: false }` can still be aborted through `up.network.abort()`.

@property up.Request#abortable
@param {boolean} [abortable=true]
@internal

-----

# up.Request#background

Whether this request is loading in the background.

Background requests are deprioritized over foreground requests.
Background requests also won't emit `up:network:late` events and won't trigger
the [progress bar](/learn/progress-bar).

@learn-ref background-requests

@property up.Request#background
@param {boolean} [background=false]
@stable

-----

# up.Request#lateDelay

The number of milliseconds after which this request can cause
an `up:network:late` event and show the [progress bar](/learn/progress-bar).

Defaults to `up.network.config.lateDelay`.

@property up.Request#lateDelay
@param {number|boolean} [lateDelay]
@stable

-----

# new up.Request()

Creates a new `up.Request` object.

This will not actually send the request over the network. For that use `up.request()`.

@constructor up.Request
@param {string} attrs.url
@param {string} [attrs.method='get']
@param {up.Params|string|Object|Array|FormData} [attrs.params]
@param {string} [attrs.target]
@param {string} [attrs.failTarget]
@param {Object<string, string>} [attrs.headers]
@param {number} [attrs.timeout]
@internal

-----

# up.Request#xhr

Returns the underlying `XMLHttpRequest` instance.

@property up.Request#xhr
@param {XMLHttpRequest} xhr
@stable

-----

# up.Request#fragments

Returns the fragments matched by this request's [target selector](/api/up.Request.prototype.target).

When this request will [open a new overlay](/learn/opening-overlays), an empty array is returned.

See also `up.RenderResult#fragments`.

@property up.Request#fragments
@param {List<Element>} fragments
  A list of targeted fragments.
@stable

-----

# up.Request#fragment

Returns the fragment matched by this request's [target selector](/api/up.Request.prototype.target).

When [multiple fragments](/learn/targeting-fragments#multiple) are targeted, the first fragment is returned.
To get a list of all targeted fragments, use the [`{ fragments }`](/api/up.Request.prototype.fragments) property.

When this request will [open a new overlay](/learn/opening-overlays), `undefined` is returned.

See also `up.RenderResult#fragment`.

@property up.Request#fragment
@param {Element} fragment
  The first targeted fragment.
@stable

-----

# up.Request#isSafe()

Returns whether this request uses a [safe](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.1.1)
HTTP method like `GET`.

@function up.Request#isSafe
@return {boolean}
  Whether the request uses a safe HTTP method.
@experimental

-----

# up.Request#loadPage()

Loads this request object as a full-page request, replacing the entire browser environment
with a new page from the server response.

The full-page request will be loaded with the [URL](/api/up.Request.prototype.url),
[method](/api/up.Request.prototype.method) and [params](/api/up.Request.prototype.params)
from this request object.

Aborts all pending requests.

## Limitations

Some request properties cannot be transported with a full-page request and will be ignored.
Such properties include:

- Custom HTTP headers
- Binary param values (from file inputs)

@function up.Request#loadPage
@stable

-----

# up.Request#abort()

Aborts this request.

The request's promise will reject with an `up.Aborted` error.

### Example

```javascript
let request = up.request('/path')

request.abort()

try {
  let response = await request
} catch (result) {
  if (result.name === 'AbortError') {
    console.log('Request was aborted.')
  }
}
```

@function up.Request#abort
@param {string} [options.reason]
  A message describing the reason for aborting this request.

  If omitted, a generic reason like `"Aborted request to GET /path"` will be used.

  The reason will be set as the error's message.
@stable

-----

# up.Request#ended

Returns whether this request is no longer waiting for the network.

A request is considered to have ended in one of the following states:

- A response has been loaded, with any [status code](/api/up.Response.prototype.status).
- It has been [aborted](/learn/aborting-requests).
- It failed due to a [network issue](/learn/network-issues).
- It failed due to a timeout.

@property up.Request#ended
@param {boolean} ended
  Whether this request has ended.
@stable

-----

# up.Request#then()

An `up.Request` is also a promise for the server response.

A request is *fulfilled* with an `up.Response` when the server sends a response
with a status code of 2xx or [304](/learn/conditional-requests#rendering-nothing).

The promise will reject for responses with an [HTTP error status](/learn/error-responses),
when the request is [aborted](/learn/aborting-requests) or when there is a
[network issue](/learn/network-issues).

### Example

```js
try {
  let response = await up.request('foo')
  console.log('Successful response:', response.text)
} catch (error) {
  if (error instanceof up.Response) {
    console.log('Response with error code:', error.text)
  } else {
    console.log("Other error during request:", error)
  }
}
```

@function up.Request#then
@param {Function(up.Response)} onFulfilled
@param {Function(up.Response|Error)} onRejected
@return {Promise<up.Response>}
  A promise that fulfills when the server response was fully loaded.
@stable
