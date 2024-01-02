const u = up.util
const e = up.element

const PREVENT_SCROLL_OPTIONS = { preventScroll: true }

up.FragmentFocus = class FragmentFocus extends up.FragmentProcessor {

  keys() {
    return super.keys().concat([
      'hash',
      'focusCapsule',
      'inputDevice',
    ])
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
        if (u.isString(opt)) {
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
    if (this._wasFocusLost()) {
      return this.focusCapsule?.restore(this.layer, PREVENT_SCROLL_OPTIONS)
    }
  }

  _restorePreviousFocusForLocation() {
    return up.viewport.restoreFocus({ layer: this.layer })
  }

  _autofocus() {
    let autofocusElement = this.fragment && e.subtree(this.fragment, '[autofocus]')[0]
    if (autofocusElement) {
      return this._focusElement(autofocusElement)
    }
  }

  _focusElement(element) {
    if (element) {
      up.focus(element, { force: true, ...PREVENT_SCROLL_OPTIONS, inputDevice: this.inputDevice })
      return true
    }
  }

  _focusHash() {
    let hashTarget = up.viewport.firstHashTarget(this.hash, { layer: this.layer })
    if (hashTarget) {
      return this._focusElement(hashTarget)
    }
  }

  _wasFocusLost() {
    return !this.layer.hasFocus()
  }

}
