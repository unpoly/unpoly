up.Layer.Modal = class Modal extends up.Layer.OverlayWithViewport {
  static mode = 'modal'

  get [Symbol.toStringTag]() { return 'up.Layer.Modal' }
}
