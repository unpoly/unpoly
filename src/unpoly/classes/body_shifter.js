const e = up.element

// Gives `<body>` a right padding in the width of a scrollbar.
// Also gives elements anchored to the right side of the screen
// an increased `right`.
//
// This is to prevent the body and elements from jumping when we add the
// modal overlay, which has its own scroll bar.
// This is screwed up, but Bootstrap does the same.
up.BodyShifter = class BodyShifter {

  constructor() {
    this._unshiftFns = []
    this._anchoredElements = new Set()
    this._stack = 0
  }

  lowerStack() {
    this._stack--
    if (this._stack === 0) {
      this._unshiftNow()
    }
  }

  raiseStack() {
    this._stack++

    if (this._stack === 1) {
      this._shiftNow()
    }
  }

  onAnchoredElementInserted(element) {
    this._anchoredElements.add(element)

    // If the new element was inserted after we shifted, we must now shift its { right }.
    if (this._isShifted()) {
      this._shiftAnchoredElement(element)
    }

    // Destructor
    return () => this._anchoredElements.delete(element)
  }

  _isShifted() {
    // If the scrollbar never took space away from the main viewport's client width,
    // we do not need to change any styles.
    return this._scrollbarTookSpace && this._stack > 0
  }

  _shiftNow() {
    this._scrollbarWidth = up.viewport.scrollbarWidth()

    // Remember whether the root viewport has a visible scrollbar at rest.
    // It will disappear when we set overflow-y: hidden below.
    this._scrollbarTookSpace = up.viewport.rootHasReducedWidthFromScrollbar()
    if (!this._scrollbarTookSpace) return

    this._shiftBody()

    for (let element of this._anchoredElements) {
      this._shiftAnchoredElement(element)
    }
  }

  _shiftBody() {
    // Even if root viewport has no scroll bar, we still want to give overflow-y: hidden
    // to the <body> element. Otherwise the user could scroll the underlying page by
    // scrolling over the dimmed backdrop (observable with touch emulation in Chrome DevTools).
    // Note that some devices don't show a vertical scrollbar at rest for a viewport, even
    // when it can be scrolled.
    const overflowElement = up.viewport.rootOverflowElement()
    this._changeStyle(overflowElement, { overflowY: 'hidden' })

    const { body } = document
    const bodyRightPadding = e.styleNumber(body, 'paddingRight')
    const bodyRightShift = this._scrollbarWidth + bodyRightPadding
    this._changeStyle(body, { paddingRight: bodyRightShift })
  }

  _shiftAnchoredElement(element) {
    const elementRight = e.styleNumber(element, 'right')
    const elementRightShift = this._scrollbarWidth + elementRight
    this._changeStyle(element, { right: elementRightShift })
  }

  _changeStyle(element, styles) {
    this._unshiftFns.push(e.setTemporaryStyle(element, styles))
  }

  _unshiftNow() {
    let unshiftFn
    while (unshiftFn = this._unshiftFns.pop()) {
      unshiftFn()
    }
  }
}
