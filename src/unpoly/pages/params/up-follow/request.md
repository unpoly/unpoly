@partial up-follow/request

@param [href]
  The URL to fetch from the server.

  See [loading content from a URL](/providing-html#url).

  To use a different URL when a link is followed through Unpoly (as opposed to a browser's full page load),
  set an `[up-href]` attribute.

  Instead of making a server request, you may also render an [existing string of HTML](/providing-html#string).

@param [up-method='get']
  The HTTP method to use for the request.

  Common values are `get`, `post`, `put`, `patch` and `delete`. The value is case-insensitive.

  The HTTP method may also be passed as a `[data-method]` attribute.

  By default, methods other than `get` or `post` will be converted into a `post` request, and carry
  their original method as a configurable [`_method` parameter](/up.protocol.config#config.methodParam).

@include up-follow/request-extras

@param [up-fail]
  Whether to render [failed responses](/failed-responses) differently.

  For failed responses Unpoly will use attributes prefixed with `up-fail`, e.g. [`[up-fail-target]`](/up-follow#up-fail-target).

  By [default](/up.network.config#config.fail) any HTTP status code other than 2xx or [304](/skipping-rendering#rendering-nothing) is considered an error code.
  Set `[up-fail=false]` to handle *any* response as successful, even with a 4xx or 5xx status code.
