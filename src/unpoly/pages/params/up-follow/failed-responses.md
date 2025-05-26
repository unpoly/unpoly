@partial up-follow/failed-responses

@param [up-fail]
  How to handle [failed server responses](/failed-responses).

  For failed responses Unpoly will use attributes prefixed with `up-fail`, e.g. [`[up-fail-target]`](#up-fail-target).
  See [handling server errors](/failed-responses) for details.

  By [default](/up.network.config#config.fail) any HTTP status code other than 2xx or [304](/skipping-rendering#rendering-nothing) is considered an error code.
  Set `[up-fail=false]` to handle *any* response as successful, even with a 4xx or 5xx status code.

@param [up-fail-target=':main']
  The [target selector](/targeting-fragments) to update after a [failed response](/failed-responses).

  See [Rendering failed responses differently](/failed-responses#fail-options) for details.

  If omitted, a failed response will *not* update the [`[up-target]`](#up-target),
  but update the [main target](/up-main) instead.
