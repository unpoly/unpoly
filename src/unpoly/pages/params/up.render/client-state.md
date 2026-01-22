@partial up.render/client-state

@param {Object} [options.data]
  The [data](/data) object for the new fragment.

  If the new fragment already has an `[up-data]` object, properties from `{ data }` take precedence.

  When updating [multiple fragments](/targeting-fragments#multiple), `{ data }` is only applied to the primary fragment.
  To apply data to multiple fragments, use [`{ dataMap }`](#options.dataMap).

  See [Overriding data for a render pass](/data#override).

@param {Object} [options.dataMap]
  An object mapping selectors to [data objects](/data).

  When a selector matches any element within an updated fragment, the matching element is compiled with the mapped data.

  See [Mapping selectors to data](/data#map).

  @experimental

@param {boolean} [options.keep=true]
  Whether [`[up-keep]`](/up-keep) elements will be preserved in the updated fragments.

  @experimental

@param {Object} [options.context]
  An object that will be merged into the [context](/context) of the current layer once the fragment is rendered.

  @experimental
  
