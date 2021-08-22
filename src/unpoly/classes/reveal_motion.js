const e = up.element
const u = up.util

up.RevealMotion = class RevealMotion {

  constructor(element, options = {}) {
    this.element = element
    this.options = options
    const viewportConfig = up.viewport.config
    this.viewport = e.get(this.options.viewport) || up.viewport.get(this.element)
    this.obstructionsLayer = up.layer.get(this.viewport)

    this.snap    = this.options.snap    ?? this.options.revealSnap    ?? viewportConfig.revealSnap
    this.padding = this.options.padding ?? this.options.revealPadding ?? viewportConfig.revealPadding
    this.top     = this.options.top     ?? this.options.revealTop     ?? viewportConfig.revealTop
    this.max     = this.options.max     ?? this.options.revealMax     ?? viewportConfig.revealMax

    this.topObstructions = viewportConfig.fixedTop
    this.bottomObstructions = viewportConfig.fixedBottom
  }

  start() {
    const viewportRect = this.getViewportRect(this.viewport)
    const elementRect = up.Rect.fromElement(this.element)
    if (this.max) {
      const maxPixels =  u.evalOption(this.max, this.element)
      elementRect.height = Math.min(elementRect.height, maxPixels)
    }

    this.addPadding(elementRect)
    this.substractObstructions(viewportRect)

    // Cards test (topics dropdown) throw an error when we also fail at zero
    if (viewportRect.height < 0) {
      return up.error.failed.async('Viewport has no visible area')
    }

    const originalScrollTop = this.viewport.scrollTop
    let newScrollTop = originalScrollTop

    if (this.top || (elementRect.height > viewportRect.height)) {
      // Element is either larger than the viewport,
      // or the user has explicitly requested for the element to align at top
      // => Scroll the viewport so the first element row is the first viewport row
      const diff = elementRect.top - viewportRect.top
      newScrollTop += diff
    } else if (elementRect.top < viewportRect.top) {
      // Element fits within viewport, but sits too high
      // => Scroll up (reduce scrollY), so the element comes down
      newScrollTop -= (viewportRect.top - elementRect.top)
    } else if (elementRect.bottom > viewportRect.bottom) {
      // Element fits within viewport, but sits too low
      // => Scroll down (increase scrollY), so the element comes up
      newScrollTop += (elementRect.bottom - viewportRect.bottom)
    }
    else {
      // Element is fully visible within viewport.
      // Do nothing.
    }

    if (u.isNumber(this.snap) && (newScrollTop < this.snap) && (elementRect.top < (0.5 * viewportRect.height))) {
      newScrollTop = 0
    }

    if (newScrollTop !== originalScrollTop) {
      return this.scrollTo(newScrollTop)
    } else {
      return Promise.resolve()
    }
  }

  scrollTo(newScrollTop) {
    this.scrollMotion = new up.ScrollMotion(this.viewport, newScrollTop, this.options)
    return this.scrollMotion.start()
  }

  getViewportRect() {
    if (up.viewport.isRoot(this.viewport)) {
      // Other than an element with overflow-y, the document viewport
      // stretches to the full height of its contents. So we create a viewport
      // sized to the usuable screen area.
      return new up.Rect({
        left: 0,
        top: 0,
        width: up.viewport.rootWidth(),
        height: up.viewport.rootHeight()
      })
    } else {
      return up.Rect.fromElement(this.viewport)
    }
  }

  addPadding(elementRect) {
    elementRect.top -= this.padding
    elementRect.height += 2 * this.padding
  }

  selectObstructions(selectors) {
    return up.fragment.all(selectors.join(','), { layer: this.obstructionsLayer })
  }

  substractObstructions(viewportRect) {
    for (let obstruction of this.selectObstructions(this.topObstructions)) {
      let obstructionRect = up.Rect.fromElement(obstruction)
      let diff = obstructionRect.bottom - viewportRect.top
      if (diff > 0) {
        viewportRect.top += diff
        viewportRect.height -= diff
      }
    }

    for (let obstruction of this.selectObstructions(this.bottomObstructions)) {
      let obstructionRect = up.Rect.fromElement(obstruction)
      let diff = viewportRect.bottom - obstructionRect.top
      if (diff > 0) {
        viewportRect.height -= diff
      }
    }
  }

  finish() {
    this.scrollMotion?.finish()
  }
}
