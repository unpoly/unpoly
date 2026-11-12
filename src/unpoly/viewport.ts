import './viewport.sass'
import * as u from './util.js'
import * as e from './element.js'
import { newConfig } from './util/config.js'
import { fail } from './error.js'
import { getInputDevice, on } from './event.js'
import { isField } from './form.js'
import { contains, getAllFragments, getSmart, tryToTarget } from './fragment.js'
import { layerStack } from './layer.js'
import { printToStandard, printToWarn } from './log.js'
import { mockable } from './mockable.js'
import { registerCompiler } from './script.js'
import type * as t from './viewport/types.js'
export type * from './viewport/types.js'
import { BodyShifter } from './viewport/body_shifter.js'
import { FocusCapsule } from './viewport/focus_capsule.js'
export { FocusCapsule }
import { RevealMotion } from './viewport/reveal_motion.js'


export const viewportConfig = newConfig('up.viewport.config', (): t.ViewportConfig => ({
  viewportSelectors: ['[up-viewport]', '[up-fixed]'],
  fixedTopSelectors: ['[up-fixed~=top]'],
  fixedBottomSelectors: ['[up-fixed~=bottom]'],
  anchoredRightSelectors: ['[up-anchored~=right]', '[up-fixed~=top]', '[up-fixed~=bottom]', '[up-fixed~=right]'],
  revealSnap: 200,
  revealPadding: 0,
  revealTop: false,
  revealMax() { return 0.5 * window.innerHeight },
  autoFocusVisible({ element, inputDevice }) { return inputDevice === 'key' || isField(element) }
}))

export const bodyShifter = new BodyShifter()


// The element may also be a selector.
export const reveal = mockable(function(element: any, options?: t.RevealOptions): true | Promise<void> {
  // copy options, since we will mutate it below (options.layer = ...).
  options = u.newOptions(options)
  element = getSmart(element, options)

  // Now that we have looked up the element with an option like { layer: 'any' },
  // the only layer relevant from here on is the element's layer.
  if (!(options.layer = layerStack.get(element))) {
    fail('Cannot reveal a detached element')
  }

  const motion = new RevealMotion(element, options)
  motion.start()

  if (options.focus) {
    tryFocus(element, { force: true, preventScroll: true })
  }

  return up.migrate.formerlyAsync?.('up.reveal()') || true
})

export const doFocus = mockable(function doFocus(element: HTMLElement, { preventScroll, force, inputDevice, focusVisible }: t.DoFocusOptions = {}): true | Promise<void> | undefined {
  if (force) {
    // (1) Element#tabIndex is -1 for all non-interactive elements,
    //     whether or not the element has an [tabindex=-1] attribute.
    // (2) Element#tabIndex is 0 for interactive elements, like links,
    //     inputs or buttons. [up-clickable] elements also get a [tabindex=0].
    //     to participate in the regular tab order.
    if (!element.hasAttribute('tabindex') && element.tabIndex === -1) {
      element.setAttribute('tabindex', '-1')
    }
  }

  inputDevice ??= getInputDevice()
  focusVisible ??= 'auto'
  focusVisible = u.evalAutoOption(focusVisible, viewportConfig.autoFocusVisible, { element, inputDevice })

  element.focus({
    preventScroll: true, // Focus without scrolling, since we're going to use our custom scrolling logic below.
    focusVisible,        // Control native :focus-visible for browsers that support this option
  })

  // Don't rely on the `focusin` listener below to remove our focus classes, to cover
  // an edge case where the element focused multiple times with different focus devices.
  removeFocusClasses(element)
  element.classList.add(focusVisible ? 'up-focus-visible' : 'up-focus-hidden')

  if (!preventScroll) {
    // Use up.reveal() which scrolls far enough to ignore fixed nav bars
    // obstructing the focused element.
    return reveal(element)
  }
})

function removeFocusClasses(element: Element | null): void {
  element?.classList.remove('up-focus-hidden', 'up-focus-visible')
}


export function tryFocus(element: HTMLElement, options?: t.DoFocusOptions): boolean {
  doFocus(element, options)
  return element === document.activeElement
}

export function revealHash(hash: string, options?: t.RevealHashOptions): boolean | Promise<void> | undefined {
  return revealHashFn(hash, options)?.()
}

export function revealHashFn(hash: string, { strong, layer, origin, behavior = 'instant', focus = false }: t.RevealHashOptions = {}): (() => boolean | Promise<void>) | undefined {
  if (!hash) return

  let match = firstHashTarget(hash, { layer, origin })

  if (match) {
    return () => {
      let doReveal = () => reveal(match, { top: true, behavior, focus })
      if (strong) u.queueFastTask(doReveal)
      return doReveal()
    }
  } else if (hash === '#top') {
    return () => {
      return scrollToPosition(0, { behavior })
    }
  }
}

function allSelector(): string {
  // On Edge the document viewport can be changed from CSS
  return [rootSelector(), ...viewportConfig.viewportSelectors].join()
}

export function closest(target: e.ElementOrSelector, options: u.PlainObject = {}): HTMLElement {
  const element = getSmart(target, options)!
  // Use up.element.closest() which searches across layer boundaries.
  // It is OK to find a viewport in a parent layer. Layers without its
  // own viewport (like popups) are scrolled by the parent layer's viewport.
  // Every element is within the root viewport, so closest() always finds one.
  return element.closest<HTMLElement>(allSelector())!
}

export function getViewportSubtree(element: e.ElementOrSelector, options: u.PlainObject = {}): u.List<HTMLElement> {
  element = getSmart(element, options)!
  return e.subtree(element, allSelector())
}

export function getViewportAround(element: e.ElementOrSelector, options: u.PlainObject = {}): HTMLElement[] {
  element = getSmart(element, options)!
  return e.around(element, allSelector())
}

function getAll(options: u.PlainObject = {}): u.List<HTMLElement> {
  return getAllFragments(allSelector(), options)
}

function rootSelector(): string {
  return getRoot().tagName
}

export function getRoot(): Element {
  // Only a quirks-mode document has no scrolling element.
  return document.scrollingElement!
}

export function rootWidth(): number {
  // This should happen on the <html> element, regardless of document.scrollingElement
  return e.getRoot().clientWidth
}

export function rootHeight(): number {
  // This should happen on the <html> element, regardless of document.scrollingElement
  return e.getRoot().clientHeight
}

export function isRoot(element: Element): boolean {
  return element === getRoot()
}

export const rootScrollbarWidth = mockable(function rootScrollbarWidth(): number {
  return window.innerWidth - rootWidth()
})

function scrollTopKey(viewport: Element): string | undefined {
  return tryToTarget(viewport)
}

function fixedElements(root: ParentNode = document): NodeListOf<HTMLElement> {
  const queryParts = ['[up-fixed]'].concat(viewportConfig.fixedTopSelectors).concat(viewportConfig.fixedBottomSelectors)
  return root.querySelectorAll<HTMLElement>(queryParts.join())
}

export function saveScroll(...args: any[]): void {
  const [viewports, options] = parseOptions(args)
  const location = options.location || options.layer.location
  if (location) {
    const tops = getScrollTopsForViewportElements(viewports)
    options.layer.lastScrollTops.set(location, tops)
  }
}

function getScrollTopsForViewportElements(viewports: Iterable<Element>): Record<string, number> {
  let tops: Record<string, number> = {}
  for (let viewport of viewports) {
    let key = scrollTopKey(viewport)
    if (key) {
      tops[key] = viewport.scrollTop
    } else {
      printToWarn('up.viewport.saveScroll()', 'Cannot save scroll positions for untargetable viewport %o', viewport)
    }
  }
  return tops
}

export function getScrollTops(options?: u.PlainObject): Record<string, number> {
  let viewports = getAll(options)
  return getScrollTopsForViewportElements(viewports)
}

export function restoreScroll(...args: any[]): boolean {
  const [viewports, options] = parseOptions(args)
  const location = options.location || options.layer.location
  const scrollTops = options.scrollTops ?? options.layer.lastScrollTops.get(location)
  if (scrollTops) {
    setScrollPositions(viewports, scrollTops, 0)
    printToStandard('up.viewport.restoreScroll()', 'Restored scroll positions to %o', scrollTops)
    return true
  } else {
    return false
  }
}

export function saveFocus(options: u.PlainObject = {}): void {
  const layer = layerStack.get(options)!
  const location = options.location || layer.location
  if (location) {
    const focusCapsule = FocusCapsule.preserve(layer)
    // `focusCapsule` may be undefined if `layer` did not have focus.
    // In that case we nullify a previously known capsule for `location`.
    layer.lastFocusCapsules.set(location, focusCapsule)
  }
}

export function restoreFocus(options: u.PlainObject = {}): boolean {
  const layer = layerStack.get(options)!
  const location = options.location || layer.location
  const locationCapsule = layer.lastFocusCapsules.get(location)
  // The capsule returns `true` if we could rediscover and focus the previous element.
  if (locationCapsule && locationCapsule.restore(layer)) {
    printToStandard('up.viewport.restoreFocus()', 'Restored focus to "%s"', locationCapsule._target)
    return true
  } else {
    return false
  }
}

export function newStateCache(): u.FIFOCache<string, any> {
  return new u.FIFOCache({ capacity: 30, normalizeKey: u.matchableURL })
}

function parseOptions(args: any[]): [u.List<HTMLElement>, u.PlainObject] {
  const [reference, options] = u.parseArgs(args, 'val', 'options')

  options.layer = layerStack.get(options)

  let viewports
  if (reference) {
    viewports = [closest(reference, options)]
  } else if (options.around) {
    // This is relevant when updating a fragment with { scroll: 'restore' | 'reset' }.
    // In tht case we restore / reset the scroll tops of all viewports around the fragment.
    viewports = getViewportAround(options.around, options)
  } else {
    viewports = getAll(options)
  }
  return [viewports, options]
}

export function scrollToPosition(position: number, ...args: any[]): boolean {
  const [viewports, options] = parseOptions(args)
  setScrollPositions(viewports, {}, position, options.behavior)
  return true
}

function setScrollPositions(viewports: Iterable<HTMLElement>, tops: Record<string, number>, defaultTop: number, behavior: ScrollBehavior = 'instant'): void {
  for (let viewport of viewports) {
    const key = scrollTopKey(viewport)
    // An untargetable viewport has no key, and has no saved position under tops['undefined'].
    let top = tops[key!] || defaultTop

    // Negative numbers scroll to the bottom, leaving an unscrolled buffer.
    if (top < 0 || Object.is(top, -0)) {
      top += viewport.scrollHeight - viewport.clientHeight
    }

    viewport.scrollTo({ top, behavior })
  }
}

export function absolutize(element: HTMLElement, options: { afterMeasure?: () => void } = {}): t.Absolutization {
  const viewport = closest(element)

  const viewportRect = viewport.getBoundingClientRect()
  const originalRect = element.getBoundingClientRect()

  const boundsRect = new u.Rect({
    left: originalRect.left - viewportRect.left,
    top: originalRect.top - viewportRect.top,
    width: originalRect.width,
    height: originalRect.height
  })

  // Allow the caller to run code before we start shifting elements around.
  options.afterMeasure?.()

  e.setInlineStyle(element, {
    // If the element had a layout context before, make sure the
    // ghost will have layout context as well (and vice versa).
    position: element.style.position === 'static' ? 'static' : 'relative',
    top:    'auto', // CSS default
    right:  'auto', // CSS default
    bottom: 'auto', // CSS default
    left:   'auto', // CSS default
    width:  '100%', // stretch to the <up-bounds> width we set below
    height: '100%'
  }) // stretch to the <up-bounds> height we set below

  // Wrap the ghost in another container so its margin can expand
  // freely. If we would position the element directly (old implementation),
  // it would gain a layout context which cannot be crossed by margins.
  const bounds = e.createFromSelector('up-bounds')
  // Insert the bounds object before our element, then move element into it.
  e.insertBefore(element, bounds)
  bounds.appendChild(element)

  const moveBounds = function(diffX: number, diffY: number) {
    boundsRect.left += diffX
    boundsRect.top += diffY
    return e.setInlineStyle(bounds, boundsRect, 'px')
  }

  // Position the bounds initially
  moveBounds(0, 0)

  // In theory, element should not have moved visually. However, element
  // (or a child of element) might collapse its margin against a previous
  // sibling element, and now that it is absolute it does not have the
  // same sibling. So we manually correct element's top position so it aligns
  // with the previous top position.
  const newElementRect = element.getBoundingClientRect()
  moveBounds(originalRect.left - newElementRect.left, originalRect.top - newElementRect.top)

  u.each(fixedElements(element), e.fixedToAbsolute)

  return {
    bounds,
    moveBounds
  }
}


export function firstHashTarget(hash?: string, options: u.PlainObject = {}): HTMLElement | undefined {
  hash = pureHash(hash)
  if (hash) {
    const selector = [
      // Match an <* id="hash">
      e.idSelector(hash),
      // Match an <a name="hash">
      'a' + e.attrSelector('name', hash)
    ].join()
    return getSmart(selector, options)
  }
}

function pureHash(value?: string): string | undefined {
  return value?.replace(/^#/, '')
}

export function focusedElementWithin(scopeElement: Element): Element | undefined {
  const focusedElement = document.activeElement
  if (contains(scopeElement, focusedElement)) {
    return focusedElement!
  }
}

export function install(): void {
  registerCompiler(viewportConfig.selectorFn('anchoredRightSelectors'), function(element) {
    return bodyShifter.onAnchoredElementInserted(element)
  })

  // Wait until another element is focused. Otherwise we would lose .up-focus-hidden
  // when the user switches to another window, then returns to the app window (where
  // a content element might still be :focus-visible).
  on('focusin', function({ relatedTarget }) {
    removeFocusClasses(relatedTarget as Element | null)
  })
}

export const api = {
  viewport: {
    reveal,
    config: viewportConfig,
    get: closest,
    get root() { return getRoot() },
    saveScroll,
    restoreScroll,
    saveFocus,
    restoreFocus,
    focus: doFocus,
  },
  focus: doFocus,
  reveal,
}
