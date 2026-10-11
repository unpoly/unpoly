@partial up-follow/layer

@param [up-layer='origin, current']
  The [layer](/up.layer) in which to match and render the fragment.

  See [layer option](/layer-option) for a list of allowed values.

  To [open the fragment in a new overlay](/opening-overlays), pass `[up-layer=new]`.
  In this case attributes for `[up-layer=new]` may also be used.

@param [up-fail-layer='origin, current']
  The [layer](/up.layer) in which to render if the server responds with an error code.

  See [Rendering failed responses differently](/failed-responses#fail-options).

@param [up-peel='dismiss']
  Whether to close overlays obstructing the target layer,
  when [updating a background layer from an overlay](/closing-overlays#peeling).

  By default, obstructing overlays will be [dismissed](/closing-overlays#intents).\
  To [accept](/closing-overlays#intents) them instead, set `[up-peel="accept"]`.\
  To not peel, set `[up-peel="false"]`.

  A listener can [prevent](/closing-overlays#callbacks) an obstructing overlay from closing.
  The target layer is then not updated.
  To close obstructing overlays even when a listener prevents it, add the word `force`,
  e.g. `[up-peel="force"]` or `[up-peel="accept force"]`.
