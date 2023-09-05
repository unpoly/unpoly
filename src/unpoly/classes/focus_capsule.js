up.FocusCapsule = class FocusCapsule {

  constructor(target, cursorProps) {
    this._target = target
    this._cursorProps = cursorProps
  }

  restore(layer, options) {
    let rediscoveredElement = up.fragment.get(this._target, { layer })
    if (rediscoveredElement) {
      // Firefox needs focus-related props to be set *before* we focus the element
      up.viewport.copyCursorProps(this._cursorProps, rediscoveredElement)
      up.focus(rediscoveredElement, options)

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
    return new this(target, cursorProps)
  }

}
