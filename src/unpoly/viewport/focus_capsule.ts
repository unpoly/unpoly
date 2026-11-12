import * as e from '../element.js'
import { on } from '../event.js'
import { getSmart, tryToTarget } from '../fragment.js'
import { type Layer } from '../layer.js'
import { doFocus, focusedElementWithin } from '../viewport.js'
import type * as t from './types.js'

export class FocusCapsule {
  declare _element: Element
  declare _target?: string
  declare _cursorProps: any
  declare _voided?: boolean

  constructor(element: Element, target?: string) {
    this._element = element
    this._target = target
    this._cursorProps = e.copyCursorProps(this._element)
  }

  wasLost(): boolean {
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
  autoVoid(): void {
    on('focusin', { once: true }, () => this._voided = true)
  }

  restore(layer: Layer, focusOptions?: t.DoFocusOptions): boolean | undefined {
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
      e.copyCursorProps(this._cursorProps, rediscoveredElement)
      doFocus(rediscoveredElement, focusOptions)

      // Signals callers that we could restore.
      // This matters to up.FragmentFocus to know that a { focus: ['restore', '.other'] }
      // option could restore focus, and should not focus the next option (".other".).
      return true
    }
  }

  static preserve(layer: Layer): FocusCapsule | undefined {
    let focusedElement = focusedElementWithin(layer.element)
    if (!focusedElement) return

    // We also preserve an element that we cannot target. We won't be able to restore its focus,
    // but we can still tell whether it was lost, e.g. for { focus: 'target-if-lost' }.
    let target = tryToTarget(focusedElement)
    return new this(focusedElement, target)
  }

}
