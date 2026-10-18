@partial up-follow/request-extras

@param [up-params]
  A [relaxed JSON](/api/relaxed-json) object with additional [parameters](/api/up.Params) that should be sent as the request's
  [query string](https://en.wikipedia.org/wiki/Query_string) or payload.

  When making a `GET` request to a URL with a query string, the given `{ params }` will be added
  to the query parameters.

@param [up-headers]
  A [relaxed JSON](/api/relaxed-json) object with additional request headers.

  Unpoly will by default send a number of custom request headers.
  For example, the `X-Up-Target` header includes the [target selector](/learn/targeting-fragments).
  See `up.protocol` for details.

@param [up-abort='target']
  Whether to [abort existing requests](/learn/aborting-requests) before rendering.

@param [up-abortable='true']
  Whether this request may be aborted by other requests targeting the same fragments or layer.

  See [aborting requests](/learn/aborting-requests) for details.

@param [up-background='false']
  Whether this request will load in the background.

  Background requests are deprioritized and won't show the [progress bar](/learn/progress-bar).
  See [[background-requests]].

@param [up-late-delay]
  The number of milliseconds after which this request can cause
  an `up:network:late` event.

  Defaults to `up.network.config.lateDelay`.

@param [up-timeout]
  The number of milliseconds after which this request fails with a timeout.

  Defaults to `up.network.config.timeout`.
