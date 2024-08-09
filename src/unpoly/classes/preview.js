const u = up.util
const e = up.element

up.Preview = class Preview {

  constructor({ request, renderOptions }) {
    this.request = request
    this.renderOptions = renderOptions
    this.undo = u.cleaner()
  }

  get target() {
    return this.renderOptions.target
  }

  get fragment() {
    if (this.layer !== 'new') {
      // For new layers, the request will bind to the main element of the base layer.
      // This is not what we want to expose as a (potentially swappable) target fragment in a preview.
      return this.request.fragment
    }
  }

  get origin() {
    return this.request.origin
  }

  get fragments() {
    return this.request.fragments
  }

  get layer() {
    return this.renderOptions.layers[0]
  }

  run(fn) {
    this.undo(fn(this))
  }

  revert() {
    this.undo.clean()
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

  swap(...args) {
    this.undo(up.fragment.swapTemp(...args))
  }

  show(...args) {
    this.undo(e.showTemp(...args))
  }

  hide(...args) {
    this.undo(e.hideTemp(...args))
  }

}
