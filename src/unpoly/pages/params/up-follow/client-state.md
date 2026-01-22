@partial up-follow/client-state

@param [up-use-data]
  A [relaxed JSON](/relaxed-json) object that [overrides properties](/data#override)
  from the new fragment's [data](/data).

  When updating [multiple fragments](/targeting-fragments#multiple), `{ data }` is only applied to the primary fragment.
  To apply data to multiple fragments, set [`[up-use-data-map]`](#up-use-data-map).

@param [up-use-data-map]
  A [relaxed JSON](/relaxed-json) object mapping selectors to [data objects](/data).

  When a selector matches any element within an updated fragment, the matching element is compiled with the mapped data.

  See [Mapping selectors to data](/data#map).

  @experimental

@param [up-use-keep='true']
  Whether [`[up-keep]`](/up-keep) elements will be preserved in the updated fragments.

  @experimental

@param [up-context]
  A [relaxed JSON](/relaxed-json) object that will be merged into the [context](/context)
  of the current layer once the fragment is rendered.

  @experimental
