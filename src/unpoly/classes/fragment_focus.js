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
        return this.restoreFocus()
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
    if (match) {
      return this.focusElement(match)
    }
  }

  restoreFocus() {
    return this.focusCapsule?.restore(this.fragment, PREVENT_SCROLL_OPTIONS)
  }

  autofocus() {
    let autofocusElement = e.subtree(this.fragment, '[autofocus]')[0]
    if (autofocusElement) {
      up.focus(autofocusElement, PREVENT_SCROLL_OPTIONS)
      return true
    }
  }

  focusElement(element) {
    up.viewport.makeFocusable(element)
    up.focus(element, PREVENT_SCROLL_OPTIONS)
    return true
  }

  focusHash() {
    let hashTarget = up.viewport.firstHashTarget(this.hash, { layer: this.layer })
    if (hashTarget) {
      return this.focusElement(hashTarget)
    }
  }

  wasFocusLost() {
    return this.focusCapsule?.wasLost()
  }
}
