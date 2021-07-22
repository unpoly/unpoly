/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e = up.element;

const Cls = (up.Layer.OverlayWithViewport = class OverlayWithViewport extends up.Layer.Overlay {
  static initClass() {
  
    // Since there is only one <body>, we share a single BodyShifter
    // between all overlay instances.
    this.bodyShifter = new up.BodyShifter();
  }

  // For stubbing in tests
  static getParentElement() {
    // Always make a fresh lookup of the <body>, since the <body>
    // might be swapped out with a new element.
    return document.body;
  }

  /***
  @function up.Layer.OverlayWithViewport#openNow
  @param {Element} options.content
  @internal
  */
  createElements(content) {
    this.shiftBody();
    this.createElement(this.constructor.getParentElement());
    if (this.backdrop) { this.createBackdropElement(this.element); }
    this.createViewportElement(this.element);
    this.createBoxElement(this.viewportElement);
    return this.createContentElement(this.boxElement, content);
  }

  onElementsRemoved() {
    return this.unshiftBody();
  }

  shiftBody() {
    return this.constructor.bodyShifter.shift();
  }

  unshiftBody() {
    return this.constructor.bodyShifter.unshift();
  }

  sync() {
    // A swapping of <body> might have removed this overlay from the DOM, so we
    // attach it again.
    //
    // We also check #isOpen() in case some async code calls #sync() on a layer
    // that was already closed. In that case don't run the code below that might
    // re-attach the overlay.
    if (this.isDetached() && this.isOpen()) {
      return this.constructor.getParentElement().appendChild(this.element);
    }
  }
});
Cls.initClass();
