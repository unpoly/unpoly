const u = up.util
const e = up.element

up.Preview = class Preview {

  constructor({ request, renderOptions }) {
    this.request = request
    this.renderOptions = renderOptions
    this._cleaner = new up.Cleaner()
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
    return this.request.layer
  }

  swap(oldElement, newElement) {
    newElement = this._toElement(newElement)
    oldElement.replaceWith(newElement)
    up.hello(newElement)
    this._cleaner.track(() => {
      up.script.clean(newElement)
      newElement.replace(oldElement)
    })
  }

  swapTarget(newElement) {
    if (this.layer === 'new') {
      this.openLayer(newElement)
    } else {
      this.swap(this.fragment, newElement)
    }
  }

  openLayer(content) {
    let layer = up.layer.open({ content })
    this._cleaner.track(() => {
      if (layer.isOpen()) {
        layer.dismiss({ preventable: false })
      }
    })
  }

  insert(reference, position, newElement) {
    newElement = this._toElement(newElement)
    reference.insertAdjacentElement(position, newElement)
    up.hello(newElement)
    this._cleaner.track(() => {
      up.destroy(newElement)
    })
  }

  prepend(reference, newElement) {
    this.insert(reference, 'afterbegin', newElement)
  }

  append(reference, newElement) {
    this.insert(reference, 'beforeend', newElement)
  }

  show(element) {
    e.show(element)
    this._cleaner.track(() => e.hide(element))
  }

  hide(element) {
    e.hide(element)
    this._cleaner.track(() => e.show(element))
  }

  addClass(element, klass) {
    this._cleaner.track(
      e.addTemporaryClass(element, klass)
    )
  }

  disable(container) {
    this._cleaner.track(
      up.form.disable(container)
    )
  }

  setAttrs(element, attrs) {
    this._cleaner.track(
      e.setTemporaryAttrs(element, attrs)
    )
  }

  setStyle(element, styles) {
    this._cleaner.track(
      e.setTemporaryStyle(element, styles)
    )
  }

  run(fn) {
    this._cleaner.track(
      fn(this)
    )
  }

  undo() {
    this._cleaner.clean()
  }

  _toElement(elementOrHTML) {
    if (u.isString(elementOrHTML)) {
      return e.createFromHTML(elementOrHTML)
    } else {
      return elementOrHTML
    }
  }

}
