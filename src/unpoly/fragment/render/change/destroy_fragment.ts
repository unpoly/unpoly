import {
  abortFragment, emitFragmentDestroyed, markFragmentAsDestroying,
} from '../../../fragment.js'
import { layerStack, type Layer } from '../../../layer.js'
import { animate, type AnimationValue } from '../../../motion.js'
import { clean } from '../../../script.js'
import type * as t from '../../types.js'
import { Change } from './change.js'
import { RenderOptions } from '../render_options.js'

/**
Options for `up.destroy()`, plus the element to destroy.
@internal
*/
export interface DestroyFragmentOptions {
  element: Element
  animation?: AnimationValue
  duration?: number
  easing?: string
  onFinished?: () => void
  log?: any
  layer?: t.LayerReference
  [key: string]: any
}

export class DestroyFragment extends Change<DestroyFragmentOptions> {
  declare _layer: Layer
  declare _element: Element
  declare _animation: AnimationValue | undefined
  declare _log: any
  declare _parent: ParentNode | null

  constructor(options: DestroyFragmentOptions) {
    super(options)
    this._layer = layerStack.get(options) || layerStack.current
    this._element = this.options.element
    this._animation = this.options.animation
    this._log = this.options.log
  }

  execute(): void {
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

  _erase(): void {
    this._layer.asCurrent(() => {
      abortFragment(this._element)
      clean(this._element, { layer: this._layer })
      this._element.remove()
    })
  }

  _emitDestroyed(): void {
    emitFragmentDestroyed(this._element, { parent: this._parent, log: this._log })
  }

}
