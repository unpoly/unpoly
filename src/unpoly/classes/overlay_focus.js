const e = up.element
const u = up.util

up.OverlayFocus = class OverlayFocus {

  constructor(layer) {
    this._layer = layer
    this._focusElement = this._layer.getFocusElement()
  }

  moveToFront() {
    if (this._enabled) { return }
    this._enabled = true

    this._untrapFocus = up.on('focusin', event => this._onFocus(event))
    this._unsetAttrs = e.setAttrsTemp(this._focusElement, {
      // Make layer.element focusable.
      // It would be slightly nicer to give it [tabindex=-1] to make it focusable through JS,
      // but remove it from the keyboard tab sequence. However, then we would need additional
      // code to prevent an infinite loop between focus traps in an overlay that has no
      // focusable elements.
      'tabindex': '0',
      // Make screen readers speak "dialog field" as we focus layer.element.
      'role': 'dialog',
      // Tell modern screen readers to make all elements outside layer.element's subtree inert.
      'aria-modal': 'true'
    })
    this._focusTrapBefore = e.affix(this._focusElement, 'beforebegin', 'up-focus-trap[tabindex=0]')
    this._focusTrapAfter = e.affix(this._focusElement, 'afterend', 'up-focus-trap[tabindex=0]')
  }

  moveToBack() {
    this.teardown()
  }

  teardown() {
    if (!this._enabled) { return }
    this._enabled = false

    this._untrapFocus()
    // Remove [aria-modal] attribute to not confuse screen readers with multiple
    // mutually exclusive [aria-modal] layers.
    this._unsetAttrs()

    this._focusTrapBefore.remove()
    this._focusTrapAfter.remove()
  }

  _onFocus(event) {
    const { target } = event

    // (1) Ignore focus events triggered by this method.
    // (2) Ignore focus events within overlays by other libraries.
    if (this._processingFocusEvent || up.layer.isWithinForeignOverlay(target)) {
      return
    }

    this._processingFocusEvent = true

    if (target === this._focusTrapBefore) {
      // User shift-tabbed from the first focusable element in the overlay.
      // Focus pierced through the layer the the beginning.
      // We want to wrap around and focus the end of the overlay.
      this._focusEnd()
    } else if ((target === this._focusTrapAfter) || !this._layer.contains(target)) {
      // User tabbed from the last focusable element in the overlay
      // OR user moved their virtual cursor on an element outside the layer.
      // We want to to trap focus and focus the start of the overlay.
      this._focusStart()
    }

    this._processingFocusEvent = false
  }

  _focusStart(focusOptions) {
    // Focusing the overlay element with its [role=dialog] will read out
    // "dialog field" in many screen readers.
    up.focus(this._focusElement, focusOptions)
  }

  _focusEnd() {
    // The end will usually be the dismiss button, if there is one.
    // Otherwise it will be the last focusable element.
    // We focus on the box element since focusing on the layer container
    // would include the viewport, which is focusable due to scroll bars.
    this._focusLastDescendant(this._layer.getBoxElement()) || this._focusStart()
  }

  _focusLastDescendant(element) {
    // Don't use forEach since we need to break out of the loop with `return`
    for (let child of u.reverse(element.children)) {
      if (up.viewport.tryFocus(child) || this._focusLastDescendant(child)) {
        return true
      }
    }
  }
}
