@partial attrs/follow/request

@param [href]
  The URL to fetch from the server.

  See [loading content from a URL](/providing-html#url).

  To use a different URL when a link is followed through Unpoly (as opposed to a browser's full page load),
  set an `[up-href]` attribute.

  Instead of making a server request, you may also render an [existing string of HTML](/providing-html#string).


@param [up-method='get']
  The HTTP method to use for the request.

  Common values are `get`, `post`, `put`, `patch` and `delete`. The value is case insensitive.

  The HTTP method may also be passed as an `[data-method]` attribute.

  By default, methods other than `get` or `post` will be converted into a `post` request, and carry
  their original method as a configurable [`_method` parameter](/up.protocol.config#config.methodParam).

@param [up-params]
  A [relaxed JSON](/relaxed-json) object with additional [parameters](/up.Params) that should be sent as the request's
  [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

  When making a `GET` request to a URL with a query string, the given `{ params }` will be added
  to the query parameters.

@param [up-headers]
  A [relaxed JSON](/relaxed-json) object with additional request headers.

  Unpoly will by default send a number of custom request headers.
  E.g. the `X-Up-Target` header includes the [target selector](/targeting-fragments).
  See `up.protocol` for details.

@param [up-abort='target']
  Whether to [abort existing requests](/aborting-requests) before rendering.

@param [up-abortable='true']
  Whether this request may be aborted by other requests targeting the same fragments or layer.

  See [aborting requests](/aborting-requests) for details.

  @experimental

@param [up-background='false']
  Whether this request will load in the background.

  Background requests deprioritized over foreground requests.
  Background requests also won't emit `up:network:late` events and won't trigger
  the [progress bar](/progress-bar).

@param [up-late-delay]
  The number of milliseconds after which this request can cause
  an `up:network:late` event.

  Defaults to `up.network.config.lateDelay`.

  @experimental

@param [up-timeout]
  The number of milliseconds after which this request fails with a timeout.

  Defaults to `up.network.config.timeout`.
