const u = up.util

up.Layer.New = class New {

  constructor(layerOptions) {
    this.layerOptions = layerOptions
  }

  isNew() {
    return true
  }

  contains(element) {
    return false
  }

  get parent() {
    return this.layerOptions.baseLayer
  }

  static {
    u.delegate(this.prototype, up.layer.OPTION_KEYS, function() { this.layerOptions })
  }

}
