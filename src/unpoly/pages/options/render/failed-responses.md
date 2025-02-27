@partial options/render/failed-responses

@param {boolean|Function(up.Response): boolean} [options.fail]
  Whether a received server response should be considered failed.

  Failed responses will be rendered using options prefixed with `fail`, e.g. `{ failTarget }`.
  See [Handling failed responses](/failed-responses) for details.

  By [default](/up.network.config#config.fail) any HTTP status code other than 2xx or 304 is considered failed.
  Pass `{ fail: false }` to handle *any* response as successful, even with a 4xx or 5xx status code.

@param {string|Element|jQuery|Array<string>} [options.failTarget]
  The [target selector](/targeting-fragments) to update after a [failed response](/failed-responses).

  See [Rendering failed responses differently](/failed-responses#rendering-failed-responses-differently) for details.
