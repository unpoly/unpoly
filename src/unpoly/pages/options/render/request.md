@partial options/render/request

@param {string} [options.url]
  The URL to request from the server.

  See [loading content from a URL](/providing-html#url).

@param {string} [options.method='get']
  The HTTP method to use for the request.

  Common values are `'get'`, `'post'`, `'put'`, `'patch'` and `'delete`'.
  The value is case insensitive.

@param {Object|up.Params|FormData|string|Array} [options.params]
  Additional [parameters](/up.Params) that should be sent as the request's
  [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

  When making a `GET` request to a URL with a query string, the given `{ params }` will be added
  to the query parameters.

@param {Object} [options.headers={}]
  An object with additional request headers.

  Unpoly will by default send a number of custom request headers.
  E.g. the `X-Up-Target` header includes the [targeted](/targeting-fragments) CSS selector.
  See `up.protocol` for details.

@param {boolean|string|Function(request): boolean} [options.abort='target']
  Whether to abort existing requests before rendering.

  See [aborting requests](/aborting-requests) for details and a list of options.

@param {boolean} [options.abortable=true]
  Whether the request may be aborted by other requests [targeting](/targeting-fragments)
  the same fragments or layer.

  See [Aborting rules in layers](/aborting-requests#layers).

@param {boolean} [options.background=false]
  Whether this request will load in the background.

  Background requests deprioritized over foreground requests.
  Background requests also won't emit `up:network:late` events and won't trigger
  the [progress bar](/progress-bar).

@param {number|boolean} [options.lateDelay]
  The number of milliseconds after which this request can cause
  an `up:network:late` event and show the [progress bar](/progress-bar).

  To prevent the event and progress bar, pass `{ lateDelay: false }`.

  Defaults to `up.network.config.lateDelay`.

  @experimental

@param {number} [options.timeout]
  The number of milliseconds after which this request fails with a timeout.

  Defaults to `up.network.config.timeout`.
