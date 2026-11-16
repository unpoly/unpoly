import * as u from '../../util.js'
import {
  closestFragment, containsMainPseudo, fragmentConfig, getFirstDescendant, matches, splitTarget,
} from '../../fragment.js'
import type * as t from '../types.js'

// Options for `findFragment()`. Other options (like `{ layer }`) are passed on to
// `up.fragment.closest()` and `up.fragment.get()`.
interface FindFragmentOptions extends t.LookupOptions {
  selector: string
  // For matching fragments in detached content, as needed by up.ResponseDoc.
  document?: Document | Element
  preferOldElements?: Element[]
}

const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

export function findFragment(options: FindFragmentOptions): HTMLElement | undefined {
  let { selector, preferOldElements } = options
  let document = options.document || window.document

  return findInPreferredElements(selector, document, preferOldElements)
    || findInRegion(options)
    || getFirstDescendant(document, selector, options)
}

function findInPreferredElements(selector: string, document: Document | Element, preferOldElements?: Element[]): HTMLElement | undefined {
  if (preferOldElements) {
    // Unpoly works with HTML elements, see up.fragment.get().
    return preferOldElements.find((preferOldElement) => document.contains(preferOldElement) && matches(preferOldElement, selector)) as HTMLElement
  }
}

function findInRegion(options: FindFragmentOptions): HTMLElement | undefined {
  let { selector, origin } = options
  let match = options.match ?? fragmentConfig.match
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
