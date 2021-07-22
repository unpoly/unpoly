/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e = up.element;

up.Layer.OverlayWithTether = class OverlayWithTether extends up.Layer.Overlay {

  createElements(content) {
    if (!this.origin) {
      up.fail('Missing { origin } option');
    }

    // We first construct an un-started Tether object so we can
    // ask for its parent element.
    this.tether = new up.Tether({
      anchor: this.origin,
      align: this.align,
      position: this.position
    });
    this.createElement(this.tether.parent);
    this.createContentElement(this.element, content);
    return this.tether.start(this.element);
  }

  onElementsRemoved() {
    return this.tether.stop();
  }

  sync() {
    // In case some async code calls #sync() on a layer that was already closed,
    // don't run the code below that might re-attach the overlay.
    if (this.isOpen()) {

      if (this.isDetached() || this.tether.isDetached()) {
        // If our tether parent and anchor is gone, the best thing we can
        // do now is to dismiss ourselves and have a consistent layer stack.
        return this.dismiss(
          ':detached', {       // no dismiss value
          animation: false,   // no need to animate since we're already hidden
          preventable: false
        } // since we're cleaning up a broken stack, don't allow user intervention
        );
      } else {
        // The fragment update might have moved elements around.
        // This is a good moment to sync our position relative to the anchor.
        return this.tether.sync();
      }
    }
  }
};
