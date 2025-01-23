up.FocusCapsule = class FocusCapsule {

  constructor(element, target, cursorProps) {
    this._element = element
    this._target = target
    this._cursorProps = cursorProps
  }

  wasLost() {
    return document.activeElement !== this._element
  }

  // This function restores focus, but does not test if the user focuses something else
  // during the render pass (which would invalidate this capsule). This is handled elsewhere:
  //
  // (1) up.FragmentFocus will check #wasLost() before calling restore()
  // (2) runPreviews() will listen to focusin and void this capsule manually.
  restore(layer, focusOptions) {
    let rediscoveredElement = up.fragment.get(this._target, { layer })
    if (rediscoveredElement) {
      // Firefox needs focus-related props to be set *before* we focus the element
      up.viewport.copyCursorProps(this._cursorProps, rediscoveredElement)
      up.focus(rediscoveredElement, focusOptions)

      // Signals callers that we could restore.
      //
      // This matters to up.FragmentFocus to know that a { focus: ['restore', '.other'] }
      // option could restore focus, and should not focus the next option (".other".).
      return true
    }
  }

  static preserve(layer) {
    let focusedElement = up.viewport.focusedElementWithin(layer.element)
    if (!focusedElement) return

    let target = up.fragment.tryToTarget(focusedElement)
    if (!target) return

    const cursorProps = up.viewport.copyCursorProps(focusedElement)
    return new this(focusedElement, target, cursorProps)
  }

}
