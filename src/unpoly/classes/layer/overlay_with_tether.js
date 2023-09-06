up.Layer.OverlayWithTether = class OverlayWithTether extends up.Layer.Overlay {

  createElements(content) {
    if (!this.origin) {
      up.fail('Missing { origin } option')
    }

    // We first construct an un-started Tether object so we can
    // ask for its parent element.
    this._tether = new up.Tether({
      anchor: this.origin,
      align: this.align,
      position: this.position
    })
    this.createElement(this._tether.parent)
    this.createContentElement(this.element, content)
    this._tether.start(this.element)
  }

  onElementsRemoved() {
    this._tether.stop()
  }

  sync() {
    // In case some async code calls #sync() on a layer that was already closed,
    // don't run the code below that might re-attach the overlay.
    if (this.isOpen()) {

      if (this.isDetached() || this._tether.isDetached()) {
        // If our tether parent and anchor is gone, the best thing we can
        // do now is to dismiss ourselves and have a consistent layer stack.
        this.dismiss(
          ':detached', {      // custom dismiss value so listeners can distinguish from other dismissals
          animation: false,   // no need to animate since we're already hidden
          preventable: false  // since we're cleaning up a broken stack, don't allow user intervention
        })
      } else {
        // The fragment update might have moved elements around.
        // This is a good moment to sync our position relative to the anchor.
        this._tether.sync()
      }
    }
  }
}
