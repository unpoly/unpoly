@partial up.render/layer

@param {string|up.Layer|Element} [options.layer='origin, current']
  The [layer](/up.layer) in which to match and render the fragment.

  See [layer option](/layer-option) for a list of allowed values.

  To [open the fragment in a new overlay](/opening-overlays), pass `{ layer: 'new' }`.
  In this case options for `up.layer.open()` may also be used.

@param {boolean} [options.peel]
  Whether to close overlays obstructing the updated layer when the fragment is updated.

  This is only relevant when updating a layer that is not the [frontmost layer](/up.layer.front).
