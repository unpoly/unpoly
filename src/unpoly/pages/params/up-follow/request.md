@partial up-follow/request

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

@include up-follow/request-extras
