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
  }

  find() {
    return this._findInRegion() || this._findFirst()
  }

  _findInRegion() {
    if (this._match === 'region' && this._origin?.isConnected) {
      return this._findClosest() || this._findDescendantInRegion()
    }
  }

  _findClosest() {
    return up.fragment.closest(this._origin, this._selector, this._options)
  }

  _findDescendantInRegion() {
    let parts = this._selector.match(DESCENDANT_SELECTOR)
    if (parts) {
      let parent = up.fragment.closest(this._origin, parts[1], this._options)
      if (parent) {
        return up.fragment.getDumb(parent, parts[2])
      }
    }
  }

  _findFirst() {
    return up.fragment.getDumb(this._document, this._selector, this._options)
  }
}
