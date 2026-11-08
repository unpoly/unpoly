import { cleaner } from '../util.js'
import { addClassTemp, computedStyle, getRoot, setStyleTemp } from '../element.js'
import { rootScrollbarWidth } from '../viewport.js'

const SHIFT_CLASS = 'up-scrollbar-away'

// Gives `<body>` a right padding in the width of a scrollbar.
// Also gives elements anchored to the right side of the screen
// an increased `right`.
//
// This is to prevent the body and elements from jumping when we add the
// modal overlay, which has its own scroll bar.
// This is screwed up, but Bootstrap does the same.
export class BodyShifter {

  constructor() {
    this._anchoredElements = new Set()
    this._stack = 0
    this._cleaner = cleaner()
  }

  lowerStack() {
    if (--this._stack === 0) this._unshiftNow()
  }

  raiseStack() {
    if (++this._stack === 1) this._shiftNow()
  }

  onAnchoredElementInserted(element) {
    this._anchoredElements.add(element)

    // If the new element was inserted after we shifted, we must now shift its { right }.
    this._shiftElement(element, 'right')

    // Destructor
    return () => this._anchoredElements.delete(element)
  }

  _isShifted() {
    // If the scrollbar never took space away from the main viewport's client width,
    // we do not need to change any styles.
    return this._stack > 0
  }

  _shiftNow() {
    // Remember whether the root viewport has a visible scrollbar at rest.
    // It will disappear when we set overflow-y: hidden below.
    this._rootScrollbarWidth = rootScrollbarWidth()

    // Always publish on the <html> element for consistency, even if the scrolling element
    // is sometimes <body>. The property will be inherited
    this._cleaner(setStyleTemp(getRoot(), {
      '--up-scrollbar-width': this._rootScrollbarWidth + 'px'
    }))

    this._shiftElement(document.body, 'padding-right')

    for (let element of this._anchoredElements) {
      this._shiftElement(element, 'right')
    }
  }

  _unshiftNow() {
    this._cleaner.clean()
  }

  _shiftElement(element, styleProp) {
    if (!this._isShifted()) return

    // viewport.sass wants to add the scrollbar with to the value, so we store it in a separate property.
    let originalValue = computedStyle(element, styleProp)

    this._cleaner(
      setStyleTemp(element, { ['--up-original-' + styleProp]: originalValue }),
      addClassTemp(element, SHIFT_CLASS),
    )
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  BodyShifter,
}
