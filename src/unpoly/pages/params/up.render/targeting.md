@partial up.render/targeting

@param {string|Element|jQuery|Array<string>} [options.target]
  The [target selector](/learn/targeting-fragments) to update after a successful response.

  If omitted, a [main target](/api/up-main) will be rendered when [`{ fallback: true }`](#options.fallback) is set.
  [Navigation](/learn/navigation-defaults) sets `{ fallback: true }`, so following a link or submitting a form
  without a target renders a main target. A plain `up.render()` needs a `{ target }` or `{ fallback }`.

  You may also pass a DOM element or jQuery element here, in which case a selector
  will be [derived](/learn/target-derivation).
  The given element will also be used as [`{ origin }`](#options.origin) for the fragment update.

  You may also pass an array of selector alternatives. The first selector
  matching in both old and new content will be used.

@param {string|Element|jQuery|Array<string>} [options.failTarget]
  The [target selector](/learn/targeting-fragments) to update when the server responds with an error code.

  See [Rendering error responses differently](/learn/error-responses#fail-options).

@param {string|boolean} [options.fallback]
  Specifies behavior if the [target selector](/learn/targeting-fragments) is missing from the current page or the server response.

  If set to a CSS selector string, Unpoly will attempt to replace that selector instead.

  If set to `true`, Unpoly will attempt to replace a [main target](/api/up-main) instead.

  If set to `false`, Unpoly will immediately reject the render promise.

  Also see [Dealing with missing targets](/learn/targeting-fragments#missing-targets).

@param {string} [options.match='region']
  Controls which fragment to update when the [`{ target }`](#options.target) selector yields multiple results.

  When set to `'region'`, Unpoly will prefer to update fragments in the
  [region](/learn/targeting-fragments#ambiguous-selectors) of the [origin element](/api/up.render#options.origin).

  If set to `'first'`, Unpoly will always update the first matching fragment.

  Defaults to `up.fragment.config.match`, which defaults to `'region'`.

@param {Element|jQuery} [options.origin]
  The element that triggered the change.

  When multiple elements in the current page match the `{ target }`,
  Unpoly will replace an element in the [origin's proximity](/learn/targeting-fragments#ambiguous-selectors).

  The origin's selector will be substituted for `:origin` in a [target selector](/learn/targeting-fragments).

@param {boolean} [options.hungry=true]
  Whether [`[up-hungry]`](/api/up-hungry) elements outside the updated fragment will also be updated.

  @experimental
