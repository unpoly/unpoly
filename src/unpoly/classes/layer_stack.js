const u = up.util

up.LayerStack = class LayerStack extends Array {

  constructor() {
    super()
    this._currentOverrides = []
    this.push(this._buildRoot())
  }

  _buildRoot() {
    return up.layer.build({ mode: 'root', stack: this })
  }

  remove(layer) {
    u.remove(this, layer)
  }

  peel(layer, options) {
    // We will dismiss descendants closer to the front first to prevent
    // recursive calls of peel().
    const descendants = u.reverse(layer.descendants)

    // Callers expect the effects of peel() to manipulate the layer stack sync.
    // Because of this we will dismiss alle descendants sync rather than waiting
    // for each descendant to finish its closing animation.
    const dismissOptions = { ...options, preventable: false }

    for (let descendant of descendants) {
      descendant.dismiss(':peel', dismissOptions)
    }
  }

  reset() {
    this.peel(this.root, {animation: false})
    this._currentOverrides = []
    this.root.reset()
  }

  isOpen(layer) {
    return layer.index >= 0
  }

  isClosed(layer) {
    return !this.isOpen(layer)
  }

  parentOf(layer) {
    return this[layer.index - 1]
  }

  childOf(layer) {
    return this[layer.index + 1]
  }

  ancestorsOf(layer) {
    // Return closest ancestors first
    return u.reverse(this.slice(0, layer.index))
  }

  selfAndAncestorsOf(layer) {
    // Order for layer.closest()
    return [layer, ...layer.ancestors]
  }

  descendantsOf(layer) {
    return this.slice(layer.index + 1)
  }

  isRoot(layer) {
    return this[0] === layer
  }

  isOverlay(layer) {
    return !this.isRoot(layer)
  }

  isCurrent(layer) {
    return this.current === layer
  }

  isFront(layer) {
    return this.front === layer
  }

  get(...args) {
    return this.getAll(...args)[0]
  }

  getAll(...args) {
    return new up.LayerLookup(this, ...args).all()
  }

  sync() {
    for (let layer of this) {
      layer.sync()
    }
  }

  asCurrent(layer, fn) {
    try {
      this._currentOverrides.push(layer)
      return fn()
    } finally {
      this._currentOverrides.pop()
    }
  }

  reversed() {
    return u.reverse(this)
  }

  dismissOverlays(value = null, options = {}) {
    options.dismissable = false
    for (let overlay of u.reverse(this.overlays)) {
      overlay.dismiss(value, options)
    }
  }

  // Used by up.util.reverse() and specs
  [u.copy.key]() {
    return u.copyArrayLike(this)
  }

  get count() {
    return this.length
  }

  get root() {
    return this[0]
  }

  get overlays() {
    return this.root.descendants
  }

  get current() {
    // Event listeners and compilers will push into @currentOverrides
    // to temporarily set up.layer.current to the layer they operate in.
    return u.last(this._currentOverrides) || this.front
  }

  get front() {
    return u.last(this)
  }

}
