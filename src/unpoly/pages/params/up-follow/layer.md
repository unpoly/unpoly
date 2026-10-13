@partial up-follow/layer

@param [up-layer='origin, current']
  The [layer](/api/up.layer) in which to match and render the fragment.

  See [layer option](/learn/layer-option) for a list of allowed values.

  To [open the fragment in a new overlay](/learn/opening-overlays), pass `[up-layer=new]`.
  In this case attributes for `[up-layer=new]` may also be used.

@param [up-fail-layer='origin, current']
  The [layer](/api/up.layer) in which to render if the server responds with an error code.

  See [Rendering failed responses differently](/learn/failed-responses#fail-options).

@param [up-peel='dismiss']
  Whether to close overlays obstructing the target layer,
  when [updating a background layer from an overlay](/learn/closing-overlays#peeling).

  By default, obstructing overlays will be [dismissed](/learn/closing-overlays#intents).\
  To [accept](/learn/closing-overlays#intents) them instead, set `[up-peel="accept"]`.\
  To not peel, set `[up-peel="false"]`.

  A listener can [prevent](/learn/closing-overlays#callbacks) an obstructing overlay from closing.
  The target layer is then not updated.
  To close obstructing overlays even when a listener prevents it, add the word `force`,
  e.g. `[up-peel="force"]` or `[up-peel="accept force"]`.
