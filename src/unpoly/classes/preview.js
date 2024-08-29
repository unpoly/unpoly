const u = up.util
const e = up.element

/*-
The `up.Preview` class allows to describe revertible preview effects.

@class up.Preview
@parent up.feedback
*/
up.Preview = class Preview {

  /*-
  @constructor up.Preview
  @internal
  */
  constructor({ request, renderOptions }) {
    this.request = request
    this.renderOptions = renderOptions
    this._cleaner = u.cleaner()
  }

  undo(...args) {
    this._cleaner.guard(...args)
  }

  get newLayer() {
    return this.layer === 'new'
  }

  get target() {
    return this.renderOptions.target
  }

  get fragment() {
    if (!this.newLayer) {
      // For new layers, the request will bind to the main element of the base layer.
      // This is not what we want to expose as a (potentially swappable) target fragment in a preview.
      return this.request.fragment
    }
  }

  get origin() {
    return this.request.origin
  }

  get fragments() {
    if (!this.newLayer) {
      return this.request.fragments
    } else {
      return []
    }
  }

  get layer() {
    return this.renderOptions.layers[0]
  }

  run(nameOrFn) {
    let fn = up.feedback.getPreviewFn(nameOrFn)
    this.undo(up.error.guard(fn, this))
  }

  revert() {
    this._cleaner.clean()
  }

  setAttrs(...args) {
    this.undo(e.setAttrsTemp(...args))
  }

  addClass(...args) {
    this.undo(e.addClassTemp(...args))
  }

  setStyle(...args) {
    this.undo(e.setStyleTemp(...args))
  }

  disable(...args) {
    this.undo(up.form.disable(...args))
  }

  insert(...args) {
    this.undo(up.fragment.insertTemp(...args))
  }

  // swap(...args) {
  //   this.undo(up.fragment.swapTemp(...args))
  // }

  show(...args) {
    this.undo(e.showTemp(...args))
  }

  hide(...args) {
    this.undo(e.hideTemp(...args))
  }

  hideChildren(parent) {
    for (let child of parent.children) {
      this.hide(parent)
    }
  }

}
