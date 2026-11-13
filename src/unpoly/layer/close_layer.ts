import * as u from '../util.js'
import { assertConfirmed } from '../browser.js'
import { Aborted, guard, muteUncriticalRejection } from '../error.js'
import { build } from '../event.js'
import { abortFragment, reload } from '../fragment.js'
import { layerStack, type Layer, type LayerCloseEvent, type Overlay } from '../layer.js'
import { type UpResponse } from '../network.js'
import { doFocus } from '../viewport.js'
import type * as t from '../fragment/types.js'
import { Change } from '../fragment/render/change/change.js'

export class CloseLayer extends Change<t.CloseLayerOptions> {
  declare _verb: 'accept' | 'dismiss'
  declare layer: Overlay
  declare _origin?: Element
  declare _value: any
  declare _preventable: boolean
  declare _response?: UpResponse
  declare _history: boolean

  constructor(options: t.CloseLayerOptions) {
    super(options)

    this._verb = options.verb
    this.layer = layerStack.get(options) as Overlay
    this._origin = options.origin
    this._value = options.value
    this._preventable = options.preventable ?? true
    this._response = options.response
    this._history = options.history ?? true
  }

  execute(): void {
    // Closing a layer is a sync function.

    // Abort when this layer is already closing, or when it has finished closing.
    this.layer.assertAlive()

    assertConfirmed(this.options)

    if (this._emitCloseEvent().defaultPrevented && this._preventable) {
      throw new Aborted('Close event was prevented')
    }

    this._emitClosingEvent()

    // Abort all pending requests targeting the layer we're now closing.
    abortFragment({ reason: 'Layer is closing', layer: this.layer })

    // Mark the element as closing. This will prevent some actions that we don't want
    // during closing time, such as the overlay re-attaching itself after every
    // up:fragment:destroyed event.
    this.layer.state = 'closing'

    // Remember the parent, which will no longer be accessible once we
    // remove @layer from the @stack.
    // An overlay always has a parent.
    const parent = this.layer.parent!

    // Close any child-layers we might have.
    // We don't wait for peeling to finish, since changes that affect the
    // layer stack should happen sync:
    this.layer.peel()

    // Move focus before destroying elements, as this involves checking if the closing
    // overlay had focus.
    this._handleFocus(parent)

    this.layer.teardownHandlers()

    // Destroy the overlay's container element and all of its contents.
    // This will also pass the { onFinished } option
    this.layer.destroyElements(this.options)

    // Remove ourselves from the layer stack.
    this.layer.stack.remove(this.layer)

    // Restore the history of the parent layer we just uncovered.
    // This will only work after parent layer has become the front layer.
    if (this._history) {
      parent.restoreHistory()
    }

    // We immediately emit up:layer:accepted/:dismissed and execute onAccepted/onDismissed callbacks.
    // We don't wait for the closing animation to finish.
    this.layer.state = 'closed'
    this._emitClosedEvent(parent)

    // After an { onAccepted } or { onDismissed } callback, reload a fragment from { onAcceptedReload } or { onDismissedReload }.
    this._reloadParent(parent)
  }

  _reloadParent(parent: Layer): void {
    // The name is { onAcceptedReload } or { onDismissedReload }, built from a string.
    let selector = (this.layer as u.PlainObject)[`on${u.upperCaseFirst(this._verb)}edReload`]
    // When the parent layer is closing too, e.g. when it peels this overlay, there is nothing to reload.
    if (selector && parent.isAlive()) {
      // (1) We prefer a match near the link that opened the overlay, and allow :origin in the selector.
      // (2) The overlay is already closed. Like for a throwing { onAccepted } callback, we report an error
      //     instead of throwing it, e.g. for a selector that matches nothing.
      // (3) Like other reloads, we ignore an aborted request or an error response.
      guard(() => muteUncriticalRejection(reload(selector, { layer: parent, origin: this.layer.origin })))
    }
  }

  _emitCloseEvent(): LayerCloseEvent {
    // The close event is emitted on the layer that is about to close.
    let event: LayerCloseEvent = this.layer.emit(
      this._buildEvent(`up:layer:${this._verb}`), {
      callback: this.layer.callback(`on${u.upperCaseFirst(this._verb)}`),
      log: [`Will ${this._verb} ${this.layer} with value %o`, this._value]
    })

    // Allow an event listener to replace event.value with a new value.
    this._value = event.value

    return event
  }

  _emitClosingEvent(): void {
    let event = this._buildEvent(`up:layer:${this._verb}ing`)
    this.layer.emit(event, { log: false })
  }

  _emitClosedEvent(formerParent: Layer): LayerCloseEvent {
    const verbPast = `${this._verb}ed`
    const verbPastUpperCaseFirst = u.upperCaseFirst(verbPast)

    // layer.emit({ ensureBubbles: true }) will automatically emit a second event on document
    // because the layer is detached. We do not want to emit it on the parent layer where users
    // might confuse it with an event for the parent layer itself. Since @layer.element
    // is now detached, the event will no longer bubble up to the document where global
    // event listeners can receive it. So we explicitly emit the event a second time
    // on the document.
    return this.layer.emit(
      this._buildEvent(`up:layer:${verbPast}`), {
        // Set up.layer.current to the parent of the closed layer, which is now likely
        // to be the front layer.
        baseLayer: formerParent,
        callback: this.layer.callback(`on${verbPastUpperCaseFirst}`),
        ensureBubbles: true,
        log: [`${verbPastUpperCaseFirst} ${this.layer} with value %o`, this._value]
      }
    )
  }

  // Builds up:layer:accept, up:layer:accepting, up:layer:accepted or their dismiss variants.
  // build() can't look up the type of a name we put together, so we cast.
  _buildEvent(name: string): LayerCloseEvent {
    return build(name, {
      layer: this.layer,
      value: this._value,
      origin: this._origin,
      response: this._response,
    }) as LayerCloseEvent
  }

  _handleFocus(formerParent: Layer): void {
    let hadFocus = this.layer.hasFocus()

    // A11Y: Stop trapping focus in the layer that's about to close
    this.layer.overlayFocus.teardown()

    // A11Y: Start trapping focus in the parent layer that is being promoted to front.
    formerParent.overlayFocus?.moveToFront()

    if (hadFocus) {
      // A11Y: Focus the element that originally opened this layer.
      // Otherwise focus the parent layer. Its focus element was made focusable by moveToFront() above.
      let newFocusElement = this.layer.origin || formerParent.getFocusElement()

      // The origin is an Element, but in practice always focusable like an HTMLElement.
      doFocus(newFocusElement as HTMLElement, { preventScroll: true })
    }
  }
}
