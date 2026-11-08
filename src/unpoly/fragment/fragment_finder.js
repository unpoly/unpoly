import { findResult } from '../util.js'
import { closest, config, containsMainPseudo, getFirstDescendant, matches, splitTarget } from '../fragment.js'

const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

export class FragmentFinder {

  constructor(options) {
    this._options = options
    this._origin = options.origin
    // Selector is a string, not an up.Selector
    this._selector = options.selector
    // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
    this._document = options.document || window.document
    this._match = options.match ?? config.match
    this._preferOldElements = options.preferOldElements
  }

  find() {
    return this._findInPreferredElements() || this._findInRegion() || this._findFirst()
  }

  _findInPreferredElements() {
    if (this._preferOldElements) {
      return this._preferOldElements.find((preferOldElement) => this._document.contains(preferOldElement) && matches(preferOldElement, this._selector))
    }
  }

  _findInRegion() {
    if (this._match === 'region' && !containsMainPseudo(this._selector) && this._origin?.isConnected) {
      return this._findClosest() || this._findDescendantInRegion()
    }
  }

  _findClosest() {
    return closest(this._origin, this._selector, this._options)
  }

  _findDescendantInRegion() {
    let simpleSelectors = splitTarget(this._selector)

    return findResult(simpleSelectors, (simpleSelector) => {
      let parts = simpleSelector.match(DESCENDANT_SELECTOR)
      if (parts) {
        let parent = closest(this._origin, parts[1], this._options)
        if (parent) {
          return getFirstDescendant(parent, parts[2], this._options)
        }
      }
    })
  }

  _findFirst() {
    return getFirstDescendant(this._document, this._selector, this._options)
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  FragmentFinder,
}
