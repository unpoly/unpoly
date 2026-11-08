import { Overlay } from './overlay.js'
import { bodyShifter } from '../../viewport.js'

export class OverlayWithViewport extends Overlay {

  // For stubbing in tests
  static getParentElement() {
    // Always make a fresh lookup of the <body>, since the <body>
    // might be swapped out with a new element.
    return document.body
  }

  /*-
  @function OverlayWithViewport#openNow
  @internal
  */
  createElements() {
    bodyShifter.raiseStack()
    this.createElement(this.constructor.getParentElement())
    if (this.backdrop) { this.createBackdropElement(this.element) }
    this.createViewportElement(this.element)
    this.createBoxElement(this.viewportElement)
    this.createContentElement(this.boxElement)
  }

  onElementsRemoved() {
    bodyShifter.lowerStack()
  }

  sync() {
    // A swapping of <body> might have removed this overlay from the DOM, so we
    // attach it again.
    //
    // We also check #isOpen() in case some async code calls #sync() on a layer
    // that was already closed. In that case don't run the code below that might
    // re-attach the overlay.
    if (this.isAlive() && !this.element.isConnected) {
      this.constructor.getParentElement().appendChild(this.element)
    }
  }
}
