import { isDefined, isString, pickBy } from '../../util.js'
import { subtreeFirst } from '../../element.js'
import { FragmentProcessor } from './fragment_processor.js'
import { doFocus, firstHashTarget, restoreFocus } from '../../viewport.js'
import type { FragmentProcessorOptions } from './fragment_processor.js'
import type { PlainObject } from '../../util.js'
import type { FocusCapsule } from '../../viewport/focus_capsule.js'
import type { InputDevice } from '../../event.js'

/**
Options for an `up.FragmentFocus`.
@internal
*/
export interface FragmentFocusOptions extends FragmentProcessorOptions {
  hash?: string
  focusVisible?: boolean | 'auto'
  focusCapsule?: FocusCapsule
  inputDevice?: InputDevice
}

const PREVENT_SCROLL_OPTIONS = { preventScroll: true }

export class FragmentFocus extends FragmentProcessor {
  declare hash: string | undefined
  declare focusVisible: boolean | 'auto' | undefined
  declare focusCapsule: FocusCapsule | undefined
  declare inputDevice: InputDevice | undefined

  constructor(options: FragmentFocusOptions) {
    super(options)
    this.hash = options.hash
    this.focusVisible = options.focusVisible
    this.focusCapsule = options.focusCapsule
    this.inputDevice = options.inputDevice
  }

  attributes(): PlainObject {
    return pickBy({
      ...super.attributes(),
      hash: this.hash,
      focusVisible: this.focusVisible,
      focusCapsule: this.focusCapsule,
      inputDevice: this.inputDevice,
    }, isDefined)
  }

  processPrimitive(opt: any): boolean | undefined {
    switch (opt) {
      case 'keep':
        // Try to keep the focus from before the fragment update.
        return this._restoreLostFocus()
      case 'restore':
        // Restore the focus we saved at a previous visit the current location.
        return this._restorePreviousFocusForLocation()
      case 'target':
      case true:
        return this._focusElement(this.fragment)
      case 'layer':
        return this._focusElement(this.layer.getFocusElement())
      case 'main':
        return this._focusSelector(':main')
      case 'hash':
        return this._focusHash()
      case 'autofocus':
        return this._autofocus()
      default:
        if (isString(opt)) {
          return this._focusSelector(opt)
        }
    }
  }

  processElement(element: HTMLElement): boolean | undefined {
    return this._focusElement(element)
  }

  resolveCondition(condition: string): boolean | undefined {
    if (condition === 'lost') {
      return this._wasFocusLost()
    } else {
      return super.resolveCondition(condition)
    }
  }

  _focusSelector(selector: string): boolean | undefined {
    let match = this.findSelector(selector)
    return this._focusElement(match)
  }

  _restoreLostFocus(): boolean | undefined {
    return this.focusCapsule?.restore(this.layer, PREVENT_SCROLL_OPTIONS)
  }

  _restorePreviousFocusForLocation(): boolean {
    return restoreFocus({ layer: this.layer })
  }

  _autofocus(): boolean | undefined {
    let autofocusElement = this.fragment && subtreeFirst(this.fragment, '[autofocus]')
    if (autofocusElement) {
      return this._focusElement(autofocusElement)
    }
  }

  _focusElement(element: HTMLElement | undefined): boolean | undefined {
    if (element) {
      doFocus(element, {
        force: true, // force focus on otherwise non-focusable elements
        ...PREVENT_SCROLL_OPTIONS,
        inputDevice: this.inputDevice,
        focusVisible: this.focusVisible,
      })
      return true
    }
  }

  _focusHash(): boolean | undefined {
    let hashTarget = firstHashTarget(this.hash, { layer: this.layer })
    if (hashTarget) {
      return this._focusElement(hashTarget)
    }
  }

  _wasFocusLost(): boolean | undefined {
    return this.focusCapsule?.wasLost()
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  FragmentFocus,
}
