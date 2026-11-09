import { abort, emitFragmentDestroyed, markFragmentAsDestroying } from '../../../fragment.js'
import { Change } from './change.js'
import { RenderOptions } from '../render_options.js'
import { layerStack } from '../../../layer.js'
import { animate } from '../../../motion.js'
import { clean } from '../../../script.js'

export class DestroyFragment extends Change {

  constructor(options) {
    super(options)
    this._layer = layerStack.get(options) || layerStack.current
    this._element = this.options.element
    this._animation = this.options.animation
    this._log = this.options.log
  }

  execute() {
    // Destroying a fragment is a sync function.
    //
    // A variant of the logic below can also be found in UpdateLayerPlan.
    // Updating (swapping) a fragment also involves destroying the old version,
    // but the logic needs to be interwoven with the insertion logic for the new
    // version.

    // Save the parent because we emit up:fragment:destroyed on the parent
    // after removing @element.
    this._parent = this._element.parentNode

    // The destroying fragment gets an .up-destroying class so we can
    // recognize elements that are being destroyed but are still playing out their
    // removal animation.
    markFragmentAsDestroying(this._element)

    animate(this._element, this._animation, RenderOptions.chainCallbacks(this.options, {
      onFinished: () => {
        this._erase()
        this._emitDestroyed()
      }
    }))
  }

  _erase() {
    this._layer.asCurrent(() => {
      abort(this._element)
      clean(this._element, { layer: this._layer })
      this._element.remove()
    })
  }

  _emitDestroyed() {
    emitFragmentDestroyed(this._element, { parent: this._parent, log: this._log })
  }

}
