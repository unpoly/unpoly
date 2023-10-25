up.Change.DestroyFragment = class DestroyFragment extends up.Change.Removal {

  constructor(options) {
    super(options)
    this._layer = up.layer.get(options) || up.layer.current
    this._element = this.options.element
    this._animation = this.options.animation
    this._log = this.options.log
  }

  execute() {
    // Destroying a fragment is a sync function.
    //
    // A variant of the logic below can also be found in up.Change.UpdateLayer.
    // Updating (swapping) a fragment also involves destroying the old version,
    // but the logic needs to be interwoven with the insertion logic for the new
    // version.

    // Save the parent because we emit up:fragment:destroyed on the parent
    // after removing @element.
    this._parent = this._element.parentNode

    // The destroying fragment gets an .up-destroying class so we can
    // recognize elements that are being destroyed but are still playing out their
    // removal animation.
    up.fragment.markAsDestroying(this._element)

    if (up.motion.willAnimate(this._element, this._animation, this.options)) {
      // If we're animating, we resolve *before* removing the element.
      // The destroy animation will then play out, but the destroying
      // element is ignored by all up.fragment.* functions.
      this._destroyAfterAnimation()
    } else {
      this._destroyNow()
    }
  }

  async _destroyAfterAnimation() {
    this._emitDestroyed()
    await this._animate()
    this._wipe()
    this.onFinished()
  }

  _destroyNow() {
    // If we're not animating, we can remove the element before emitting up:fragment:destroyed.
    this._wipe()
    this._emitDestroyed()
    this.onFinished()
  }

  _animate() {
    return up.motion.animate(this._element, this._animation, this.options)
  }

  _wipe() {
    this._layer.asCurrent(() => {
      up.fragment.abort(this._element)
      up.script.clean(this._element, { layer: this._layer })
      up.element.cleanJQuery(this._element)
      this._element.remove()
    })
  }

  _emitDestroyed() {
    // Emits up:fragment:destroyed.
    up.fragment.emitDestroyed(this._element, { parent: this._parent, log: this._log })
  }
}
