import * as u from '../util.js'
import {
  closest, containsMainPseudo, fragmentConfig, getFirstDescendant, matches, splitTarget,
} from '../fragment.js'
import type * as t from './types.js'

const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

export class FragmentFinder {
  declare _options: t.FragmentFinderOptions
  declare _origin?: Element
  declare _selector: string
  declare _document: Document | Element
  declare _match: 'region' | 'first'
  declare _preferOldElements?: Element[]

  constructor(options: t.FragmentFinderOptions) {
    this._options = options
    this._origin = options.origin
    // Selector is a string, not an up.Selector
    this._selector = options.selector
    // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
    this._document = options.document || window.document
    this._match = options.match ?? fragmentConfig.match
    this._preferOldElements = options.preferOldElements
  }

  // Unpoly works with HTML elements, see up.fragment.get().
  find(): HTMLElement | undefined {
    return this._findInPreferredElements() || this._findInRegion() || this._findFirst()
  }

  _findInPreferredElements(): HTMLElement | undefined {
    if (this._preferOldElements) {
      return this._preferOldElements.find((preferOldElement) => this._document.contains(preferOldElement) && matches(preferOldElement, this._selector)) as HTMLElement
    }
  }

  _findInRegion(): HTMLElement | undefined {
    if (this._match === 'region' && !containsMainPseudo(this._selector) && this._origin?.isConnected) {
      return this._findClosest(this._origin) || this._findDescendantInRegion(this._origin)
    }
  }

  _findClosest(origin: Element): HTMLElement | undefined {
    return closest(origin, this._selector, this._options)
  }

  _findDescendantInRegion(origin: Element): HTMLElement | undefined {
    let simpleSelectors = splitTarget(this._selector)

    return u.findResult(simpleSelectors, (simpleSelector) => {
      let parts = simpleSelector.match(DESCENDANT_SELECTOR)
      if (parts) {
        let parent = closest(origin, parts[1], this._options)
        if (parent) {
          return getFirstDescendant(parent, parts[2], this._options)
        }
      }
    })
  }

  _findFirst(): HTMLElement | undefined {
    return getFirstDescendant(this._document, this._selector, this._options)
  }
}
