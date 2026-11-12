import { bodyShifter } from '../../viewport.js'
import { Overlay } from './overlay.js'

export class OverlayWithViewport extends Overlay {

  // For stubbing in tests
  static getParentElement(): HTMLElement {
    // Always make a fresh lookup of the <body>, since the <body>
    // might be swapped out with a new element.
    return document.body
  }

  /*-
  @function OverlayWithViewport#openNow
  @internal
  */
  createElements(): void {
    bodyShifter.raiseStack()
    this.createElement((this.constructor as typeof OverlayWithViewport).getParentElement())
    if (this.backdrop) { this.createBackdropElement(this.element) }
    this.createViewportElement(this.element)
    // The calls above set each parent element.
    this.createBoxElement(this.viewportElement!)
    this.createContentElement(this.boxElement!)
  }

  onElementsRemoved(): void {
    bodyShifter.lowerStack()
  }

  sync(): void {
    // A swapping of <body> might have removed this overlay from the DOM, so we
    // attach it again.
    //
    // We also check #isOpen() in case some async code calls #sync() on a layer
    // that was already closed. In that case don't run the code below that might
    // re-attach the overlay.
    if (this.isAlive() && !this.element.isConnected) {
      (this.constructor as typeof OverlayWithViewport).getParentElement().appendChild(this.element)
    }
  }
}
