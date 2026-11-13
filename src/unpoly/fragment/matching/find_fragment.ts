import * as u from '../../util.js'
import {
  closest, containsMainPseudo, fragmentConfig, getFirstDescendant, matches, splitTarget,
} from '../../fragment.js'
import type * as t from '../types.js'

const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

// Unpoly works with HTML elements, see up.fragment.get().
export function findFragment(options: t.FindFragmentOptions): HTMLElement | undefined {
  // Selector is a string, not an up.Selector
  let { selector, origin, preferOldElements } = options
  // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
  let document = options.document || window.document
  let match = options.match ?? fragmentConfig.match

  return findInPreferredElements(selector, document, preferOldElements) || findInRegion(selector, origin, match, options) || findFirst(selector, document, options)
}

function findInPreferredElements(selector: string, document: Document | Element, preferOldElements?: Element[]): HTMLElement | undefined {
  if (preferOldElements) {
    return preferOldElements.find((preferOldElement) => document.contains(preferOldElement) && matches(preferOldElement, selector)) as HTMLElement
  }
}

function findInRegion(selector: string, origin: Element | undefined, match: 'region' | 'first', options: t.FindFragmentOptions): HTMLElement | undefined {
  if (match === 'region' && !containsMainPseudo(selector) && origin?.isConnected) {
    return findClosest(selector, origin, options) || findDescendantInRegion(selector, origin, options)
  }
}

function findClosest(selector: string, origin: Element, options: t.FindFragmentOptions): HTMLElement | undefined {
  return closest(origin, selector, options)
}

function findDescendantInRegion(selector: string, origin: Element, options: t.FindFragmentOptions): HTMLElement | undefined {
  let simpleSelectors = splitTarget(selector)

  return u.findResult(simpleSelectors, (simpleSelector) => {
    let parts = simpleSelector.match(DESCENDANT_SELECTOR)
    if (parts) {
      let parent = closest(origin, parts[1], options)
      if (parent) {
        return getFirstDescendant(parent, parts[2], options)
      }
    }
  })
}

function findFirst(selector: string, document: Document | Element, options: t.FindFragmentOptions): HTMLElement | undefined {
  return getFirstDescendant(document, selector, options)
}
