const e = up.element

up.Layer.OverlayWithViewport = class OverlayWithViewport extends up.Layer.Overlay {

  static bodyShifter = new up.BodyShifter()

  // For stubbing in tests
  static getParentElement() {
    // Always make a fresh lookup of the <body>, since the <body>
    // might be swapped out with a new element.
    return document.body
  }

  /***
  @function up.Layer.OverlayWithViewport#openNow
  @param {Element} options.content
  @internal
  */
  createElements(content) {
    this.shiftBody()
    this.createElement(this.constructor.getParentElement())
    if (this.backdrop) { this.createBackdropElement(this.element); }
    this.createViewportElement(this.element)
    this.createBoxElement(this.viewportElement)
    this.createContentElement(this.boxElement, content)
  }

  onElementsRemoved() {
    this.unshiftBody()
  }

  shiftBody() {
    this.constructor.bodyShifter.shift()
  }

  unshiftBody() {
    this.constructor.bodyShifter.unshift()
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
