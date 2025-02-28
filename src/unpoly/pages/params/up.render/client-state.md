@partial up.render/client-state

@param {Object} [options.data]
  The [data object](/data) object for the new fragment.

  If the new fragment already has an `[up-data]` object, this option will override
  individual properties from that attribute.

@param {boolean} [options.keep=true]
  Whether [`[up-keep]`](/up-keep) elements will be preserved in the updated fragments.

  @experimental

@param {Object} [options.context]
  An object that will be merged into the [context](/context) of the current layer once the fragment is rendered.

  @experimental
  
