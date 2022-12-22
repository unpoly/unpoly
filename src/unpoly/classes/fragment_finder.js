const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/

up.FragmentFinder = class FragmentFinder {

  constructor(options) {
    this.options = options
    this.origin = options.origin
    // Selector is a string, not an up.Selector
    this.selector = options.selector
    // This option is for matching fragments in detached content, as needed by up.ResponseDoc.
    this.externalRoot = options.externalRoot
  }

  find() {
    return this.findAroundOrigin() || this.findInLayer()
  }

  findAroundOrigin() {
    if (this.origin && up.fragment.config.matchAroundOrigin && this.origin.isConnected) {
      return this.findClosest() || this.findInVicinity()
    }
  }

  findClosest() {
    return up.fragment.closest(this.origin, this.selector, this.options)
  }

  findInVicinity() {
    let parts = this.selector.match(DESCENDANT_SELECTOR)
    if (parts) {
      let parent = up.fragment.closest(this.origin, parts[1], this.options)
      if (parent) {
        return up.fragment.getDumb(parent, parts[2])
      }
    }
  }

  findInLayer() {
    if (this.externalRoot) {
      return up.fragment.subtree(this.externalRoot, this.selector, this.options)[0]
    } else {
      return up.fragment.getDumb(this.selector, this.options)
    }
  }
}
