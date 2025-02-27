@partial options/emit-without-element

@param {string} eventType
  The event type, e.g. `my:event`.
@param {Object} [props={}]
  A list of properties to become part of the event object that will be passed to listeners.
@param {up.Layer|string|number} [props.layer]
  The [layer](/up.layer) on which to emit this event.

  If this property is set, the event will be emitted on the [layer's outmost element](/up.Layer.prototype.element).
  Also [up.layer.current](/up.layer.current) will be set to the given layer while event listeners
  are running.
@param {string|Array} [props.log]
  A message to print to the [log](/up.log) when the event is emitted.

  Pass `false` to not log this event emission.

  @experimental
@param {Element|jQuery} [props.target=document]
  The element on which the event is triggered.

  Alternatively the target element may be passed as the first argument.
@return {Event}
  The emitted event object.
