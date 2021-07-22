/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const e = up.element;

// Gives `<body>` a right padding in the width of a scrollbar.
// Also gives elements anchored to the right side of the screen
// an increased `right`.
//
// This is to prevent the body and elements from jumping when we add the
// modal overlay, which has its own scroll bar.
// This is screwed up, but Bootstrap does the same.
up.BodyShifter = class BodyShifter {

  constructor() {
    this.unshiftFns = [];
    this.reset();
  }

  reset() {
    this.unshiftNow();
    return this.shiftCount = 0;
  }

  shift() {
    this.shiftCount++;

    if (this.shiftCount > 1) {
      return;
    }

    // Remember whether the root viewport has a visible scrollbar at rest.
    // It will disappear when we set overflow-y: hidden below.
    const scrollbarTookSpace = up.viewport.rootHasReducedWidthFromScrollbar();

    // Even if root viewport has no scroll bar, we still want to give overflow-y: hidden
    // to the <body> element. Otherwise the user could scroll the underlying page by
    // scrolling over the dimmed backdrop (observable with touch emulation in Chrome DevTools).
    // Note that some devices don't show a vertical scrollbar at rest for a viewport, even
    // when it can be scrolled.
    const overflowElement = up.viewport.rootOverflowElement();
    this.changeStyle(overflowElement, {overflowY: 'hidden'});

    // If the scrollbar never took space away from the main viewport's client width,
    // we do not need to run the code below that would pad it on the right.
    if (!scrollbarTookSpace) {
      return;
    }

    const {
      body
    } = document;

    const scrollbarWidth = up.viewport.scrollbarWidth();

    const bodyRightPadding = e.styleNumber(body, 'paddingRight');
    const bodyRightShift = scrollbarWidth + bodyRightPadding;

    this.changeStyle(body, {paddingRight: bodyRightShift});

    return (() => {
      const result = [];
      for (let anchor of up.viewport.anchoredRight()) {
        const elementRight = e.styleNumber(anchor, 'right');
        const elementRightShift = scrollbarWidth + elementRight;
        result.push(this.changeStyle(anchor, {right: elementRightShift}));
      }
      return result;
    })();
  }

  changeStyle(element, styles) {
    return this.unshiftFns.push(e.setTemporaryStyle(element, styles));
  }

  unshift() {
    this.shiftCount--;
    if (this.shiftCount > 0) {
      return;
    }

    return this.unshiftNow();
  }

  unshiftNow() {
    return (() => {
      let unshiftFn;
      const result = [];
      while ((unshiftFn = this.unshiftFns.pop())) {
        result.push(unshiftFn());
      }
      return result;
    })();
  }
};
