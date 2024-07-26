const e = up.element
const SHIFT_CLASS = 'up-scrollbar-away'

// Gives `<body>` a right padding in the width of a scrollbar.
// Also gives elements anchored to the right side of the screen
// an increased `right`.
//
// This is to prevent the body and elements from jumping when we add the
// modal overlay, which has its own scroll bar.
// This is screwed up, but Bootstrap does the same.
up.BodyShifter = class BodyShifter {

  constructor() {
    this._anchoredElements = new Set()
    this._stack = 0
    this._cleaner = new up.Cleaner()
  }

  lowerStack() {
    if (--this._stack === 0) this._cleaner.clean()
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
    return this._rootScrollbarWidth && this._stack > 0
  }

  _shiftNow() {
    // Remember whether the root viewport has a visible scrollbar at rest.
    // It will disappear when we set overflow-y: hidden below.
    this._rootScrollbarWidth = up.viewport.rootScrollbarWidth()

    // Always publish on the <html> element for consistency, even if the scrolling element
    // is sometimes <body>. The property will be inherited
    this._cleaner.track(e.setTemporaryStyle(e.root, {
      '--up-scrollbar-width': this._rootScrollbarWidth + 'px'
    }))

    this._shiftElement(document.body, 'padding-right')

    for (let element of this._anchoredElements) {
      this._shiftElement(element, 'right')
    }
  }

  _shiftElement(element, styleProp) {
    if (!this._isShifted()) return

    // viewport.sass wants to add the scrollbar with to the value, so we store it in a separate property.
    let originalValue = e.style(element, styleProp)
    this._cleaner.track(
      e.setTemporaryStyle(e.root, { ['--up-original-' + styleProp]: originalValue }),
      e.addTemporaryClass(element, SHIFT_CLASS),
    )
  }

}
