# up.network

@namespace up.network

-----

# up.ajax()

Makes a request to the given URL and caches the response.

The function returns a promise that fulfills with the response text.

### Example

```
up.ajax('/search', { params: { query: 'sunshine' } }).then(function(text) {
  console.log('The response text is %o', text)
}).catch(function() {
  console.error('The request failed')
})
```

@function up.ajax
@param {string} [url]
  The requested URL.

  Instead of passing the URL as a string argument, you can also pass it as an `{ url }` option.
@param {Object} [options]
  See options for `up.request()`.
@return {Promise<string>}
  A promise for the response text.
@deprecated
  Use `up.request()` instead.

-----

# up.proxy.clear()

Expires all cache entries.

@function up.proxy.clear
@deprecated
  Use `up.cache.expire()` instead.

-----

# up.cache.clear()

Expires cache entries.

@function up.cache.clear
@deprecated
  Use `up.cache.expire()` instead.

-----

# up.proxy.preload()

Preloads the given link.

@function up.proxy.preload
@param {Element} link
@deprecated
  Use `up.link.preload()` instead.

-----

# up.network.isIdle()

Returns whether Unpoly is *not* currently loading a [request](/api/up.request).

The network is also considered [busy](/api/up.network.isBusy) while requests are [loading in the background](/api/up.request#options.background).

See also `up.network.isBusy()`.

@function up.network.isIdle
@return {boolean}
@deprecated
  Use `!up.network.isBusy()` instead.

-----

# up.Request

@class up.Request

-----

# up.Request#navigate()

Loads this request object as a full-page request, replacing the entire browser environment
with a new page from the server response.

The full-page request will be loaded with the [URL](/api/up.Request.prototype.url),
[method](/api/up.Request.prototype.method) and [params](/api/up.Request.prototype.params)
from this request object.
Properties that are not possible in a full-page request (such as custom HTTP headers)
will be ignored.

Aborts all pending requests.

@function up.Request#navigate
@deprecated
  Use `up.Request#loadPage()` instead.

-----

# up.Request#preload

Whether this request is [preloading](/learn/preloading) content.

@property up.Request#preload
@param {boolean} [preload=false]
@deprecated
  Use `up.Request#background` instead.

-----

# up.Request#badResponseTime

The number of milliseconds after which this request can cause
an `up:network:late` event and show the [progress bar](/learn/progress-bar).

Defaults to `up.network.config.lateDelay`.

@property up.Request#badResponseTime
@param {number} [badResponseTime]
@deprecated
  Use `up.Request#lateDelay` instead.

-----

# up.Response

@class up.Response

-----

# up.Response#isSuccess()

Returns whether the server responded with a 2xx HTTP status.

@function up.Response#isSuccess
@return {boolean}
@deprecated
  Use `up.Response#ok` instead.

-----

# up.Response#getHeader()

Returns the HTTP header value with the given name.

The search for the header name is case-insensitive.

Returns `undefined` if the given header name was not included in the response.

@function up.Response#getHeader
@param {string} name
@return {string|undefined}
  The value of the header.
@deprecated
  Use `up.Response#header` instead.

-----

# up.Response#isError()

Returns whether the response was not [successful](/api/up.Response.prototype.ok).

@function up.Response#isError
@return {boolean}
@deprecated
  Use `!up.Response#ok` instead.
