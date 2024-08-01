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
    // // TODO: Is this work really not done anywhere else already?
    // if (this.renderOptions.layer === 'new') {
    //   return 'new'
    // } else {
    //   return this.request.layer
    // }
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
