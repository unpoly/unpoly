const u = up.util
const e = up.element

const PREVENT_SCROLL_OPTIONS = { preventScroll: true }

up.FragmentFocus = class FragmentFocus extends up.FragmentProcessor {

  keys() {
    return super.keys().concat([
      'hash',
      'focusCapsule'
    ])
  }

  processPrimitive(opt) {
    switch (opt) {
      case 'keep':
        // Try to keep the focus from before the fragment update.
        return this.restoreLostFocus()
      case 'restore':
        // Restore the focus we saved at a previous visit the current location.
        return this.restorePreviousFocusForLocation()
      case 'target':
      case true:
        return this.focusElement(this.fragment)
      case 'layer':
        return this.focusElement(this.layer.getFocusElement())
      case 'main':
        return this.focusSelector(':main')
      case 'hash':
        return this.focusHash()
      case 'autofocus':
        return this.autofocus()
      default:
        if (u.isString(opt)) {
          return this.focusSelector(opt)
        }
    }
  }

  processElement(element) {
    return this.focusElement(element)
  }

  resolveCondition(condition) {
    if (condition === 'lost') {
      return this.wasFocusLost()
    } else {
      return super.resolveCondition(condition)
    }
  }

  focusSelector(selector) {
    let match = this.findSelector(selector)
    return this.focusElement(match)
  }

  restoreLostFocus() {
    if (this.wasFocusLost()) {
      return this.focusCapsule?.restore(this.layer, PREVENT_SCROLL_OPTIONS)
    }
  }

  restorePreviousFocusForLocation() {
    return up.viewport.restoreFocus({ layer: this.layer })
  }

  autofocus() {
    let autofocusElement = this.fragment && e.subtree(this.fragment, '[autofocus]')[0]
    if (autofocusElement) {
      return this.focusElement(autofocusElement)
    }
  }

  focusElement(element) {
    if (element) {
      up.focus(element, { force: true, ...PREVENT_SCROLL_OPTIONS })
      return true
    }
  }

  focusHash() {
    let hashTarget = up.viewport.firstHashTarget(this.hash, { layer: this.layer })
    if (hashTarget) {
      return this.focusElement(hashTarget)
    }
  }

  wasFocusLost() {
    return !this.layer.hasFocus()
  }

}
