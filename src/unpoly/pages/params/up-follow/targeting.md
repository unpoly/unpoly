@partial up-follow/targeting

@param [up-target=':main']
  The [target selector](/targeting-fragments) to update after a successful response.

  If omitted a [main target](/up-main) will be rendered.

@param [up-fallback='true']
  Specifies behavior if the [target selector](/up.render#options.target) is missing from the current page or the server response.

  If set to a CSS selector, Unpoly will attempt to replace that selector instead.

  If set to `true`, Unpoly will attempt to replace a [main target](/up-main) instead.

  If set to `false`, Unpoly will immediately reject the render promise.

@param [up-match='region']
  Controls which fragment to update when the [`[up-target]`](#up-target) selector yields multiple results.

  When set to `'region'` Unpoly will prefer to update fragments in the
  [region](/targeting-fragments#ambiguous-selectors) of the [origin element](/up.render#options.origin).

  If set to `'first'` Unpoly will always update the first matching fragment.

  Defaults to `up.fragment.config.match`, which defaults to `'region'`.

@param [up-use-hungry='true']
  Whether [`[up-hungry]`](/up-hungry) elements outside the updated fragment will also be updated.

  @experimental
