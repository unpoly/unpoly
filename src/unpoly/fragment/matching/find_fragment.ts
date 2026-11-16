import * as u from '../../util.js'
import {
  closestFragment, containsMainPseudo, fragmentConfig, getFirstDescendant, matches, splitTarget,
} from '../../fragment.js'
import type * as t from '../types.js'

// Options for `findFragment()`. Other options (like `{ layer }`) are passed on to
// `up.fragment.closest()` and `up.fragment.get()`.
interface FindFragmentOptions extends t.LookupOptions {
  selector: string
  // For matching in detached content, as needed by up.ResponseDoc.
  document?: Document | Element
  preferOldElements?: Element[]
}

const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

// Unpoly works with HTML elements, see up.fragment.get().
export function findFragment(options: FindFragmentOptions): HTMLElement | undefined {
  // Selector is a string, not an up.Selector
  let { selector, origin, preferOldElements } = options
  // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
  let document = options.document || window.document
  let match = options.match ?? fragmentConfig.match

  return findInPreferredElements(selector, document, preferOldElements) || findInRegion(selector, origin, match, options) || getFirstDescendant(document, selector, options)
}

function findInPreferredElements(selector: string, document: Document | Element, preferOldElements?: Element[]): HTMLElement | undefined {
  if (preferOldElements) {
    return preferOldElements.find((preferOldElement) => document.contains(preferOldElement) && matches(preferOldElement, selector)) as HTMLElement
  }
}

function findInRegion(
  selector: string,
  origin: Element | undefined,
  match: t.MatchMode,
  options: FindFragmentOptions,
): HTMLElement | undefined {
  if (match === 'region' && !containsMainPseudo(selector) && origin?.isConnected) {
    return closestFragment(origin, selector, options) || findDescendantInRegion(selector, origin, options)
  }
}

function findDescendantInRegion(selector: string, origin: Element, options: FindFragmentOptions): HTMLElement | undefined {
  let simpleSelectors = splitTarget(selector)

  return u.findResult(simpleSelectors, (simpleSelector) => {
    let parts = simpleSelector.match(DESCENDANT_SELECTOR)
    if (parts) {
      let parent = closestFragment(origin, parts[1], options)
      if (parent) {
        return getFirstDescendant(parent, parts[2], options)
      }
    }
  })
}
