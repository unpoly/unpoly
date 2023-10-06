const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

up.FragmentFinder = class FragmentFinder {

  constructor(options) {
    this._options = options
    this._origin = options.origin
    // Selector is a string, not an up.Selector
    this._selector = options.selector
    // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
    this._document = options.document || window.document
  }

  find() {
    return this._findAroundOrigin() || this._findInLayer()
  }

  _findAroundOrigin() {
    if (this._origin && up.fragment.config.matchAroundOrigin && this._origin.isConnected) {
      return this._findClosest() || this._findInVicinity()
    }
  }

  _findClosest() {
    return up.fragment.closest(this._origin, this._selector, this._options)
  }

  _findInVicinity() {
    let parts = this._selector.match(DESCENDANT_SELECTOR)
    if (parts) {
      let parent = up.fragment.closest(this._origin, parts[1], this._options)
      if (parent) {
        return up.fragment.getDumb(parent, parts[2])
      }
    }
  }

  _findInLayer() {
    return up.fragment.getDumb(this._document, this._selector, this._options)
  }
}
