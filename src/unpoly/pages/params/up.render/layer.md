@partial up.render/layer

@param {string|up.Layer|Element} [options.layer='origin, current']
  The [layer](/api/up.layer) in which to match and render the fragment.

  See [layer option](/learn/targeting-other-layers) for a list of allowed values.

  To [open the fragment in a new overlay](/learn/opening-overlays), pass `{ layer: 'new' }`.
  In this case options for `up.layer.open()` may also be used.

@param {string|up.Layer|Element} [options.failLayer='origin, current']
  The [layer](/api/up.layer) in which to render if the server responds with an error code.

  See [Rendering error responses differently](/learn/error-responses#fail-options).

@param {boolean|string} [options.peel]
  Whether to close overlays obstructing the target layer,
  when [updating a background layer from an overlay](/learn/closing-overlays#peeling).

  To [dismiss](/learn/closing-overlays#intents) obstructing overlays, pass `{ peel: true }` or `{ peel: 'dismiss' }`.\
  To [accept](/learn/closing-overlays#intents) obstructing overlays, pass `{ peel: 'accept' }`.\
  To not peel, pass `{ peel: false }`.

  A listener can [prevent](/learn/closing-overlays#keeping-open) an obstructing overlay from closing.
  The render pass then rejects with an `up.Aborted` error and the target layer is not updated.
  To close obstructing overlays even when a listener prevents it, add the word `force`,
  e.g. `{ peel: 'force' }` or `{ peel: 'accept force' }`.
