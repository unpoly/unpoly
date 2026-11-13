import {
  abortFragment, emitFragmentDestroyed, markFragmentAsDestroying,
} from '../../../fragment.js'
import { layerStack } from '../../../layer.js'
import { animate, type AnimationValue } from '../../../motion.js'
import { clean } from '../../../script.js'
import type * as t from '../../types.js'
import { chainCallbacks } from '../render_options.js'

// Options for up.destroy().
interface DestroyFragmentOptions {
  animation?: AnimationValue
  duration?: number
  easing?: string
  onFinished?: () => void
  log?: any
  layer?: t.LayerReference
  [key: string]: any
}

// Removes a fragment for up.destroy(), after playing its { animation }.
export function destroyFragment(fragment: Element, options: DestroyFragmentOptions): void {
  // Looking up the layer normalizes the options it is given, so it gets a copy of the caller's options.
  let layer = layerStack.get({ ...options }) || layerStack.current

  // Destroying a fragment is a sync function.
  //
  // A variant of the logic below can also be found in updateSteps().
  // Updating (swapping) a fragment also involves destroying the old version,
  // but the logic needs to be interwoven with the insertion logic for the new
  // version.

  // Save the parent because we emit up:fragment:destroyed on the parent
  // after removing the fragment.
  let parent = fragment.parentNode

  // The destroying fragment gets an .up-destroying class so we can
  // recognize elements that are being destroyed but are still playing out their
  // removal animation.
  markFragmentAsDestroying(fragment)

  animate(fragment, options.animation, chainCallbacks(options, {
    onFinished: () => {
      layer.asCurrent(() => {
        abortFragment(fragment)
        clean(fragment, { layer })
        fragment.remove()
      })

      emitFragmentDestroyed(fragment, { parent, log: options.log })
    }
  }))
}
