up.Layer.OverlayWithViewport = class OverlayWithViewport extends up.Layer.Overlay {

  // For stubbing in tests
  static getParentElement() {
    // Always make a fresh lookup of the <body>, since the <body>
    // might be swapped out with a new element.
    return document.body
  }

  /*-
  @function up.Layer.OverlayWithViewport#openNow
  @internal
  */
  createElements() {
    up.viewport.bodyShifter.raiseStack()
    this.createElement(this.constructor.getParentElement())
    if (this.backdrop) { this.createBackdropElement(this.element) }
    this.createViewportElement(this.element)
    this.createBoxElement(this.viewportElement)
    this.createContentElement(this.boxElement)
  }

  onElementsRemoved() {
    up.viewport.bodyShifter.lowerStack()
  }

  sync() {
    // A swapping of <body> might have removed this overlay from the DOM, so we
    // attach it again.
    //
    // We also check #isOpen() in case some async code calls #sync() on a layer
    // that was already closed. In that case don't run the code below that might
    // re-attach the overlay.
    if (this.isDetached() && this.isOpen()) {
      this.constructor.getParentElement().appendChild(this.element)
    }
  }
}
