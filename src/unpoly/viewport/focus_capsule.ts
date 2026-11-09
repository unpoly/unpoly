import { on } from '../event.js'
import { getSmart, tryToTarget } from '../fragment.js'
import { copyCursorProps, doFocus, focusedElementWithin } from '../viewport.js'

export class FocusCapsule {

  constructor(element, target) {
    this._element = element
    this._target = target
    this._cursorProps = copyCursorProps(this._element)
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
  @internal
  */
  autoVoid() {
    on('focusin', { once: true }, () => this._voided = true)
  }

  restore(layer, focusOptions) {
    if (!this.wasLost()) {
      // Signal callers that we could not restore.
      // This matters to up.FragmentFocus to know that a { focus: ['restore', '.other'] }
      // option could not restore focus, and should focus the next option (".other".).
      return false
    }

    // Without a target we cannot rediscover the element in a new fragment.
    let rediscoveredElement = this._target && getSmart(this._target, { layer })
    if (rediscoveredElement) {
      // Firefox needs focus-related props to be set *before* we focus the element
      copyCursorProps(this._cursorProps, rediscoveredElement)
      doFocus(rediscoveredElement, focusOptions)

      // Signals callers that we could restore.
      // This matters to up.FragmentFocus to know that a { focus: ['restore', '.other'] }
      // option could restore focus, and should not focus the next option (".other".).
      return true
    }
  }

  static preserve(layer) {
    let focusedElement = focusedElementWithin(layer.element)
    if (!focusedElement) return

    // We also preserve an element that we cannot target. We won't be able to restore its focus,
    // but we can still tell whether it was lost, e.g. for { focus: 'target-if-lost' }.
    let target = tryToTarget(focusedElement)
    return new this(focusedElement, target)
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  FocusCapsule,
}
