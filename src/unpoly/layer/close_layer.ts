import * as u from '../util.js'
import { assertConfirmed } from '../browser.js'
import { Aborted, guard, muteUncriticalRejection } from '../error.js'
import { build } from '../event.js'
import { abortFragment, reload } from '../fragment.js'
import { doFocus } from '../viewport.js'
import type * as t from './types.js'
import { type Layer } from './base.js'
import { type Overlay } from './overlay.js'

// Accepts or dismisses an overlay, for up.Layer#accept() and up.Layer#dismiss().
export function closeLayer(options: t.CloseLayerOptions): void {
  let { verb, layer } = options

  // Closing a layer is a sync function.

  // Abort when this layer is already closing, or when it has finished closing.
  layer.assertAlive()

  assertConfirmed(options)

  let closeEvent = emitCloseEvent(options)

  // Allow an event listener to replace event.value with a new value.
  let { value } = closeEvent

  if (closeEvent.defaultPrevented && (options.preventable ?? true)) {
    throw new Aborted('Close event was prevented')
  }

  emitClosingEvent(options, value)

  // Abort all pending requests targeting the layer we're now closing.
  abortFragment({ reason: 'Layer is closing', layer })

  // Mark the element as closing. This will prevent some actions that we don't want
  // during closing time, such as the overlay re-attaching itself after every
  // up:fragment:destroyed event.
  layer.state = 'closing'

  // Remember the parent, which will no longer be accessible once we
  // remove the layer from the stack.
  // An overlay always has a parent.
  const parent = layer.parent!

  // Close any child-layers we might have.
  // We don't wait for peeling to finish, since changes that affect the
  // layer stack should happen sync:
  layer.peel()

  // Move focus before destroying elements, as this involves checking if the closing
  // overlay had focus.
  handleFocus(layer, parent)

  layer.teardownHandlers()

  // Destroy the overlay's container element and all of its contents.
  // This will also pass the { onFinished } option
  layer.destroyElements(options)

  // Remove ourselves from the layer stack.
  layer.stack.remove(layer)

  // Restore the history of the parent layer we just uncovered.
  // This will only work after parent layer has become the front layer.
  if (options.history ?? true) {
    parent.restoreHistory()
  }

  // We immediately emit up:layer:accepted/:dismissed and execute onAccepted/onDismissed callbacks.
  // We don't wait for the closing animation to finish.
  layer.state = 'closed'
  emitClosedEvent(options, value, parent)

  // After an { onAccepted } or { onDismissed } callback, reload a fragment from { onAcceptedReload } or { onDismissedReload }.
  reloadParent(layer, verb, parent)
}

function reloadParent(layer: Overlay, verb: 'accept' | 'dismiss', parent: Layer): void {
  // The name is { onAcceptedReload } or { onDismissedReload }, built from a string.
  let selector = (layer as u.PlainObject)[`on${u.upperCaseFirst(verb)}edReload`]
  // When the parent layer is closing too, e.g. when it peels this overlay, there is nothing to reload.
  if (selector && parent.isAlive()) {
    // (1) We prefer a match near the link that opened the overlay, and allow :origin in the selector.
    // (2) The overlay is already closed. Like for a throwing { onAccepted } callback, we report an error
    //     instead of throwing it, e.g. for a selector that matches nothing.
    // (3) Like other reloads, we ignore an aborted request or an error response.
    guard(() => muteUncriticalRejection(reload(selector, { layer: parent, origin: layer.origin })))
  }
}

// Emits up:layer:accept or up:layer:dismiss with the value the overlay is closed with.
function emitCloseEvent(options: t.CloseLayerOptions): t.LayerCloseEvent {
  let { verb, layer, value } = options

  // The close event is emitted on the layer that is about to close.
  return layer.emit(
    buildCloseEvent(`up:layer:${verb}`, options, value), {
    callback: layer.callback(`on${u.upperCaseFirst(verb)}`),
    log: [`Will ${verb} ${layer} with value %o`, value]
  })
}

function emitClosingEvent(options: t.CloseLayerOptions, value: any): void {
  let event = buildCloseEvent(`up:layer:${options.verb}ing`, options, value)
  options.layer.emit(event, { log: false })
}

function emitClosedEvent(options: t.CloseLayerOptions, value: any, formerParent: Layer): t.LayerCloseEvent {
  let { verb, layer } = options
  const verbPast = `${verb}ed`
  const verbPastUpperCaseFirst = u.upperCaseFirst(verbPast)

  // layer.emit({ ensureBubbles: true }) will automatically emit a second event on document
  // because the layer is detached. We do not want to emit it on the parent layer where users
  // might confuse it with an event for the parent layer itself. Since layer.element
  // is now detached, the event will no longer bubble up to the document where global
  // event listeners can receive it. So we explicitly emit the event a second time
  // on the document.
  return layer.emit(
    buildCloseEvent(`up:layer:${verbPast}`, options, value), {
      // Set up.layer.current to the parent of the closed layer, which is now likely
      // to be the front layer.
      baseLayer: formerParent,
      callback: layer.callback(`on${verbPastUpperCaseFirst}`),
      ensureBubbles: true,
      log: [`${verbPastUpperCaseFirst} ${layer} with value %o`, value]
    }
  )
}

// Builds up:layer:accept, up:layer:accepting, up:layer:accepted or their dismiss variants.
// build() can't look up the type of a name we put together, so we cast.
// The value is passed separately, since a listener of the close event may have replaced { value }.
function buildCloseEvent(name: string, { layer, origin, response }: t.CloseLayerOptions, value: any): t.LayerCloseEvent {
  return build(name, {
    layer,
    value,
    origin,
    response,
  }) as t.LayerCloseEvent
}

function handleFocus(layer: Overlay, formerParent: Layer): void {
  let hadFocus = layer.hasFocus()

  // A11Y: Stop trapping focus in the layer that's about to close
  layer.overlayFocus.teardown()

  // A11Y: Start trapping focus in the parent layer that is being promoted to front.
  formerParent.overlayFocus?.moveToFront()

  if (hadFocus) {
    // A11Y: Focus the element that originally opened this layer.
    // Otherwise focus the parent layer. Its focus element was made focusable by moveToFront() above.
    let newFocusElement = layer.origin || formerParent.getFocusElement()

    // The origin is an Element, but in practice always focusable like an HTMLElement.
    doFocus(newFocusElement as HTMLElement, { preventScroll: true })
  }
}
