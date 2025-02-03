up.FocusCapsule = class FocusCapsule {

  constructor(element, target) {
    this._element = element
    this._target = target
    this._cursorProps = up.viewport.copyCursorProps(this._element)
  }

  wasLost() {
    return document.activeElement !== this._element && !this._voided
  }

  /*-
  Invalidates this capsule when an explicit focus change by the user was detected.

  Call it *after* your own focus-losing DOM mutation:

  ```js
  let capsule = up.FocusCapsule.preserve(layer)
  domChangeThatMayLoseFocus() // e.g. disabling
  capsule.autoVoid()
  await timeInWhichUserMayChangeFocusExplictly()
  capsule.restore()
  ```

  @function up.FocusCapsule.prototype.autoVoid
  */
  autoVoid() {
    up.on('focusin', { once: true }, () => this._voided = true)
  }

  restore(layer, focusOptions) {
    if (!this.wasLost()) {
      // Signal callers that we could not restore.
      // This matters to up.FragmentFocus to know that a { focus: ['restore', '.other'] }
      // option could not restore focus, and should focus the next option (".other".).
      return false
    }

    let rediscoveredElement = up.fragment.get(this._target, { layer })
    if (rediscoveredElement) {
      // Firefox needs focus-related props to be set *before* we focus the element
      up.viewport.copyCursorProps(this._cursorProps, rediscoveredElement)
      up.focus(rediscoveredElement, focusOptions)

      // Signals callers that we could restore.
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

    return new this(focusedElement, target)
  }

}
