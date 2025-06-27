@partial up-follow/layer

@param [up-layer='origin, current']
  The [layer](/up.layer) in which to match and render the fragment.

  See [layer option](/layer-option) for a list of allowed values.

  To [open the fragment in a new overlay](/opening-overlays), pass `[up-layer=new]`.
  In this case attributes for `[up-layer=new]` may also be used.

@param [up-fail-layer='origin, current']
  The [layer](/up.layer) in which render if the server responds with an error code.

  See [Rendering failed responses differently](/failed-responses#fail-options).

@param [up-peel='true']
  Whether to close overlays obstructing the updated layer when the fragment is updated.

  This is only relevant when updating a layer that is not the [frontmost layer](/up.layer.front).

