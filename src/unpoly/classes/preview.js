const u = up.util
const e = up.element

up.Preview = class Preview {

  constructor({ request, renderOptions }) {
    this.request = request
    this.renderOptions = renderOptions
    this._cleaner = u.cleaner()
  }

  get target() {
    return this.renderOptions.target
  }

  get fragment() {
    return this.request.fragment
  }

  get origin() {
    return this.request.origin
  }

  get fragments() {
    return this.request.fragments
  }

  get layer() {
    // TODO: Is this work really not done anywhere else already?
    if (this.renderOptions.layer === 'new') {
      return 'new'
    } else {
      return this.request.layer
    }
  }

  run(fn) {
    this._cleaner(fn(this))
  }

  undo() {
    this._cleaner.clean()
  }

}
