import * as u from '../util.js'
import * as e from '../element.js'
import { fail } from '../error.js'
import { getAllFragments } from '../fragment.js'
import { layerStack, type Layer } from '../layer.js'
import { closest, isRoot, rootHeight, rootWidth, viewportConfig } from '../viewport.js'
import type * as t from './types.js'

export function revealInViewport(element: HTMLElement, options: t.RevealOptions = {}): void {
  const viewport = e.getOne(options.viewport) || closest(element)
  const obstructionsLayer = layerStack.get(viewport)!
  const behavior = options.behavior ?? 'instant'

  const snap    = options.snap    ?? options.revealSnap    ?? viewportConfig.revealSnap
  const padding = options.padding ?? options.revealPadding ?? viewportConfig.revealPadding
  const top     = options.top     ?? options.revealTop     ?? viewportConfig.revealTop
  const max     = options.max     ?? options.revealMax     ?? viewportConfig.revealMax

  const topObstructionSelector = viewportConfig.selector('fixedTopSelectors')
  const bottomObstructionSelector = viewportConfig.selector('fixedBottomSelectors')

  const viewportRect = getViewportRect(viewport)
  const elementRect = u.Rect.fromElement(element)
  if (max) {
    const maxPixels =  u.evalOption(max, element)
    elementRect.height = Math.min(elementRect.height, maxPixels)
  }

  elementRect.grow(padding)
  subtractObstructions(viewportRect, obstructionsLayer, topObstructionSelector, bottomObstructionSelector)

  // Cards test (topics dropdown) throw an error when we also fail at zero
  if (viewportRect.height < 0) {
    fail('Viewport has no visible area')
  }

  const originalScrollTop = viewport.scrollTop
  let newScrollTop = originalScrollTop

  if (top || (elementRect.height > viewportRect.height)) {
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

  if (u.isNumber(snap) && (newScrollTop < snap) && (elementRect.top < (0.5 * viewportRect.height))) {
    newScrollTop = 0
  }

  if (newScrollTop !== originalScrollTop) {
    viewport.scrollTo({ top: newScrollTop, behavior })
  }
}

function getViewportRect(viewport: HTMLElement): u.Rect {
  if (isRoot(viewport)) {
    // Other than an element with overflow-y, the document viewport
    // stretches to the full height of its contents. So we create a viewport
    // sized to the usuable screen area.
    return new u.Rect({
      left: 0,
      top: 0,
      width: rootWidth(),
      height: rootHeight()
    })
  } else {
    return u.Rect.fromElement(viewport)
  }
}

function computeObstructionRects(selector: string, layer: Layer): u.Rect[] {
  let elements: HTMLElement[] = getAllFragments(selector, { layer })
  elements = u.filterList(elements, e.isVisible)
  return u.map(elements, (element) => {
    if (e.computedStyle(element, 'position') === 'sticky') {
      // There is no simple way to detect if a sticky element is in static or fixed positioning.
      // We pretend it is always fixed for the purpose of measuring obstruction.
      return u.Rect.fromElementAsFixed(element)
    } else {
      return u.Rect.fromElement(element)
    }
  })
}

function subtractObstructions(viewportRect: u.Rect, layer: Layer, topSelector: string, bottomSelector: string): void {
  for (let obstructionRect of computeObstructionRects(topSelector, layer)) {
    let diff = obstructionRect.bottom - viewportRect.top
    if (diff > 0) {
      viewportRect.top += diff
      viewportRect.height -= diff
    }
  }

  for (let obstructionRect of computeObstructionRects(bottomSelector, layer)) {
    let diff = viewportRect.bottom - obstructionRect.top
    if (diff > 0) {
      viewportRect.height -= diff
    }
  }
}
