import { evalOption, filterList, isNumber, map } from '../util.js'
import { computedStyle, getOne, isVisible } from '../element.js'
import { fail } from '../error.js'
import { getAll } from '../fragment.js'
import { layerStack } from '../layer.js'
import { Rect } from '../util/rect.js'
import { closest, config, isRoot, rootHeight, rootWidth } from '../viewport.js'
import type { Layer } from '../layer/base.js'
import type { ValueOrFunction } from '../util.js'

/**
Options for `up.reveal()`. Each `reveal*` option is an alias used by render options.
@internal
*/
export interface RevealOptions {
  viewport?: Element | string
  behavior?: ScrollBehavior
  snap?: number
  revealSnap?: number
  padding?: number
  revealPadding?: number
  top?: boolean
  revealTop?: boolean
  max?: ValueOrFunction<number>
  revealMax?: ValueOrFunction<number>
}

export class RevealMotion {
  declare _element: HTMLElement
  declare _viewport: HTMLElement
  declare _obstructionsLayer: Layer
  declare _behavior: ScrollBehavior
  declare _snap: number
  declare _padding: number
  declare _top: boolean
  declare _max: ValueOrFunction<number>
  declare _topObstructionSelector: string
  declare _bottomObstructionSelector: string

  constructor(element: HTMLElement, options: RevealOptions = {}) {
    this._element = element
    this._viewport = getOne(options.viewport) || closest(this._element)
    this._obstructionsLayer = layerStack.get(this._viewport)
    this._behavior = options.behavior ?? 'instant'

    const viewportConfig = config
    this._snap    = options.snap    ?? options.revealSnap    ?? viewportConfig.revealSnap
    this._padding = options.padding ?? options.revealPadding ?? viewportConfig.revealPadding
    this._top     = options.top     ?? options.revealTop     ?? viewportConfig.revealTop
    this._max     = options.max     ?? options.revealMax     ?? viewportConfig.revealMax

    this._topObstructionSelector = viewportConfig.selector('fixedTopSelectors')
    this._bottomObstructionSelector = viewportConfig.selector('fixedBottomSelectors')
  }

  start(): void {
    const viewportRect = this._getViewportRect(this._viewport)
    const elementRect = Rect.fromElement(this._element)
    if (this._max) {
      const maxPixels =  evalOption(this._max, this._element)
      elementRect.height = Math.min(elementRect.height, maxPixels)
    }

    elementRect.grow(this._padding)
    this._substractObstructions(viewportRect)

    // Cards test (topics dropdown) throw an error when we also fail at zero
    if (viewportRect.height < 0) {
      fail('Viewport has no visible area')
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

    if (isNumber(this._snap) && (newScrollTop < this._snap) && (elementRect.top < (0.5 * viewportRect.height))) {
      newScrollTop = 0
    }

    if (newScrollTop !== originalScrollTop) {
      this._viewport.scrollTo({ top: newScrollTop, behavior: this._behavior })
    }
  }

  _getViewportRect(): Rect {
    if (isRoot(this._viewport)) {
      // Other than an element with overflow-y, the document viewport
      // stretches to the full height of its contents. So we create a viewport
      // sized to the usuable screen area.
      return new Rect({
        left: 0,
        top: 0,
        width: rootWidth(),
        height: rootHeight()
      })
    } else {
      return Rect.fromElement(this._viewport)
    }
  }

  _computeObstructionRects(selector: string): Rect[] {
    let elements = getAll(selector, { layer: this._obstructionsLayer })
    elements = filterList(elements, isVisible)
    return map(elements, (element) => {
      if (computedStyle(element, 'position') === 'sticky') {
        // There is no simple way to detect if a sticky element is in static or fixed positioning.
        // We pretend it is always fixed for the purpose of measuring obstruction.
        return Rect.fromElementAsFixed(element)
      } else {
        return Rect.fromElement(element)
      }
    })
  }

  _substractObstructions(viewportRect: Rect): void {
    for (let obstructionRect of this._computeObstructionRects(this._topObstructionSelector)) {
      let diff = obstructionRect.bottom - viewportRect.top
      if (diff > 0) {
        viewportRect.top += diff
        viewportRect.height -= diff
      }
    }

    for (let obstructionRect of this._computeObstructionRects(this._bottomObstructionSelector)) {
      let diff = viewportRect.bottom - obstructionRect.top
      if (diff > 0) {
        viewportRect.height -= diff
      }
    }
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  RevealMotion,
}
