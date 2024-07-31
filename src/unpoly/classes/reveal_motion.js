const e = up.element
const u = up.util

up.RevealMotion = class RevealMotion {

  constructor(element, options = {}) {
    this._element = element
    this._viewport = e.get(options.viewport) || up.viewport.get(this._element)
    this._obstructionsLayer = up.layer.get(this._viewport)
    // (1) When called with options parsed from up.link.followOptions() we get { scrollBehavior }
    // (2) When called from up.reveal() we get { behavior }
    this._behavior = options.scrollBehavior ?? options.behavior ?? 'instant'

    const viewportConfig = up.viewport.config
    this._snap    = options.snap    ?? options.revealSnap    ?? viewportConfig.revealSnap
    this._padding = options.padding ?? options.revealPadding ?? viewportConfig.revealPadding
    this._top     = options.top     ?? options.revealTop     ?? viewportConfig.revealTop
    this._max     = options.max     ?? options.revealMax     ?? viewportConfig.revealMax

    this._topObstructionSelector = viewportConfig.selector('fixedTopSelectors')
    this._bottomObstructionSelector = viewportConfig.selector('fixedBottomSelectors')
  }

  start() {
    const viewportRect = this._getViewportRect(this._viewport)
    const elementRect = up.Rect.fromElement(this._element)
    if (this._max) {
      const maxPixels =  u.evalOption(this._max, this._element)
      elementRect.height = Math.min(elementRect.height, maxPixels)
    }

    elementRect.grow(this._padding)
    this._substractObstructions(viewportRect)

    // Cards test (topics dropdown) throw an error when we also fail at zero
    if (viewportRect.height < 0) {
      up.fail('Viewport has no visible area')
    }

    const originalScrollTop = this._viewport.scrollTop
    let newScrollTop = originalScrollTop

    if (this._top || (elementRect.height > viewportRect.height)) {
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

    if (u.isNumber(this._snap) && (newScrollTop < this._snap) && (elementRect.top < (0.5 * viewportRect.height))) {
      newScrollTop = 0
    }

    if (newScrollTop !== originalScrollTop) {
      this._viewport.scrollTo({ top: newScrollTop, behavior: this._behavior })
    }
  }

  _getViewportRect() {
    if (up.viewport.isRoot(this._viewport)) {
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
      return up.Rect.fromElement(this._viewport)
    }
  }

  _selectObstructions(selector) {
    let elements = up.fragment.all(selector, { layer: this._obstructionsLayer })
    return u.filter(elements, e.isVisible)
  }

  _substractObstructions(viewportRect) {
    for (let obstruction of this._selectObstructions(this._topObstructionSelector)) {
      let obstructionRect = up.Rect.fromElement(obstruction)
      let diff = obstructionRect.bottom - viewportRect.top
      if (diff > 0) {
        viewportRect.top += diff
        viewportRect.height -= diff
      }
    }

    for (let obstruction of this._selectObstructions(this._bottomObstructionSelector)) {
      let obstructionRect = up.Rect.fromElement(obstruction)
      let diff = viewportRect.bottom - obstructionRect.top
      if (diff > 0) {
        viewportRect.height -= diff
      }
    }
  }
}
