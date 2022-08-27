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
    this.#reset()
  }

  #reset() {
    this.#unshiftNow()
    this.shiftCount = 0
  }

  shift() {
    this.shiftCount++

    if (this.shiftCount > 1) {
      return
    }

    // Remember whether the root viewport has a visible scrollbar at rest.
    // It will disappear when we set overflow-y: hidden below.
    const scrollbarTookSpace = up.viewport.rootHasReducedWidthFromScrollbar()

    // Even if root viewport has no scroll bar, we still want to give overflow-y: hidden
    // to the <body> element. Otherwise the user could scroll the underlying page by
    // scrolling over the dimmed backdrop (observable with touch emulation in Chrome DevTools).
    // Note that some devices don't show a vertical scrollbar at rest for a viewport, even
    // when it can be scrolled.
    const overflowElement = up.viewport.rootOverflowElement()
    this.#changeStyle(overflowElement, {overflowY: 'hidden'})

    // If the scrollbar never took space away from the main viewport's client width,
    // we do not need to run the code below that would pad it on the right.
    if (!scrollbarTookSpace) {
      return
    }

    const { body } = document

    const scrollbarWidth = up.viewport.scrollbarWidth()

    const bodyRightPadding = e.styleNumber(body, 'paddingRight')
    const bodyRightShift = scrollbarWidth + bodyRightPadding

    this.#changeStyle(body, {paddingRight: bodyRightShift})

    for (let anchor of up.viewport.anchoredRight()) {
      const elementRight = e.styleNumber(anchor, 'right')
      const elementRightShift = scrollbarWidth + elementRight
      this.#changeStyle(anchor, {right: elementRightShift})
    }
  }

  #changeStyle(element, styles) {
    this._unshiftFns.push(e.setTemporaryStyle(element, styles))
  }

  unshift() {
    this.shiftCount--
    if (this.shiftCount == 0) {
      this.#unshiftNow()
    }
  }

  #unshiftNow() {
    let unshiftFn
    while (unshiftFn = this._unshiftFns.pop()) {
      unshiftFn()
    }
  }
}
