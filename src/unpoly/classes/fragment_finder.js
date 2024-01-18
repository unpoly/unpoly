const u = up.util
const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

up.FragmentFinder = class FragmentFinder {

  constructor(options) {
    this._options = options
    this._origin = options.origin
    // Selector is a string, not an up.Selector
    this._selector = options.selector
    // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
    this._document = options.document || window.document
    this._match = options.match ?? up.fragment.config.match
    this._preferOldElements = options.preferOldElements
  }

  find() {
    return this._findInPreferredElements() || this._findInRegion() || this._findFirst()
  }

  _findInPreferredElements() {
    if (this._preferOldElements) {
      return this._preferOldElements.find((preferOldElement) => this._document.contains(preferOldElement) && up.fragment.matches(preferOldElement, this._selector))
    }
  }

  _findInRegion() {
    if (this._match === 'region' && !up.fragment.containsMainPseudo(this._selector) && this._origin?.isConnected) {
      return this._findClosest() || this._findDescendantInRegion()
    }
  }

  _findClosest() {
    return up.fragment.closest(this._origin, this._selector, this._options)
  }

  _findDescendantInRegion() {
    let simpleSelectors = up.fragment.splitTarget(this._selector)

    return u.findResult(simpleSelectors, (simpleSelector) => {
      let parts = simpleSelector.match(DESCENDANT_SELECTOR)
      if (parts) {
        let parent = up.fragment.closest(this._origin, parts[1], this._options)
        if (parent) {
          return up.fragment.getDumb(parent, parts[2])
        }
      }
    })
  }

  _findFirst() {
    return up.fragment.getDumb(this._document, this._selector, this._options)
  }
}
