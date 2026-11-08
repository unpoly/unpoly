up.Layer.Popup = class Popup extends up.Layer.OverlayWithTether {
  static mode = 'popup'

  get [Symbol.toStringTag]() { return 'up.Layer.Popup' }
}
