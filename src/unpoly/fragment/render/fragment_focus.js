import { isDefined, isString, pickBy } from '../../util.js'
import { subtreeFirst } from '../../element.js'
import { FragmentProcessor } from './fragment_processor.js'
import { doFocus, firstHashTarget, restoreFocus } from '../../viewport.js'

const PREVENT_SCROLL_OPTIONS = { preventScroll: true }

export class FragmentFocus extends FragmentProcessor {

  constructor(options) {
    super(options)
    this.hash = options.hash
    this.focusVisible = options.focusVisible
    this.focusCapsule = options.focusCapsule
    this.inputDevice = options.inputDevice
  }

  attributes() {
    return pickBy({
      ...super.attributes(),
      hash: this.hash,
      focusVisible: this.focusVisible,
      focusCapsule: this.focusCapsule,
      inputDevice: this.inputDevice,
    }, isDefined)
  }

  processPrimitive(opt) {
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

  processElement(element) {
    return this._focusElement(element)
  }

  resolveCondition(condition) {
    if (condition === 'lost') {
      return this._wasFocusLost()
    } else {
      return super.resolveCondition(condition)
    }
  }

  _focusSelector(selector) {
    let match = this.findSelector(selector)
    return this._focusElement(match)
  }

  _restoreLostFocus() {
    return this.focusCapsule?.restore(this.layer, PREVENT_SCROLL_OPTIONS)
  }

  _restorePreviousFocusForLocation() {
    return restoreFocus({ layer: this.layer })
  }

  _autofocus() {
    let autofocusElement = this.fragment && subtreeFirst(this.fragment, '[autofocus]')
    if (autofocusElement) {
      return this._focusElement(autofocusElement)
    }
  }

  _focusElement(element) {
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

  _focusHash() {
    let hashTarget = firstHashTarget(this.hash, { layer: this.layer })
    if (hashTarget) {
      return this._focusElement(hashTarget)
    }
  }

  _wasFocusLost() {
    return this.focusCapsule?.wasLost()
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  FragmentFocus,
}
