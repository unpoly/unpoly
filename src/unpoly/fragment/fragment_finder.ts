import { findResult } from '../util.js'
import { closest, config, containsMainPseudo, getFirstDescendant, matches, splitTarget } from '../fragment.js'

const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

/**
Options for an `up.FragmentFinder`. Other options (like `{ layer }`) are passed on to
`up.fragment.closest()` and `up.fragment.get()`.
@internal
*/
export interface FragmentFinderOptions {
  selector: string
  origin?: Element
  document?: Document | Element
  match?: 'region' | 'first'
  preferOldElements?: Element[]
  [key: string]: any
}

export class FragmentFinder {
  declare _options: FragmentFinderOptions
  declare _origin: Element | undefined
  declare _selector: string
  declare _document: Document | Element
  declare _match: 'region' | 'first'
  declare _preferOldElements: Element[] | undefined

  constructor(options: FragmentFinderOptions) {
    this._options = options
    this._origin = options.origin
    // Selector is a string, not an up.Selector
    this._selector = options.selector
    // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
    this._document = options.document || window.document
    this._match = options.match ?? config.match
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
      return this._findClosest() || this._findDescendantInRegion()
    }
  }

  // _findInRegion() only calls this with an origin.
  _findClosest(): HTMLElement | undefined {
    return closest(this._origin!, this._selector, this._options)
  }

  _findDescendantInRegion(): HTMLElement | undefined {
    let simpleSelectors = splitTarget(this._selector)

    return findResult(simpleSelectors, (simpleSelector) => {
      let parts = simpleSelector.match(DESCENDANT_SELECTOR)
      if (parts) {
        let parent = closest(this._origin!, parts[1], this._options)
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
