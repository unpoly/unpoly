const DESCENDANT_SELECTOR = /^([^ >+(]+) (.+)$/;

up.FragmentFinder = class FragmentFinder {

  constructor(options) {
    this.options = options;
    this.origin = this.options.origin;
    this.selector = this.options.selector;
    this.layer = this.options.layer;
  }

  find() {
    return this.findAroundOrigin() || this.findInLayer();
  }

  findAroundOrigin() {
    if (this.origin && up.fragment.config.matchAroundOrigin && !up.element.isDetached(this.origin)) {
      return this.findClosest() || this.findInVicinity();
    }
  }

  findClosest() {
    return up.fragment.closest(this.origin, this.selector, this.options);
  }

  findInVicinity() {
    let parts;
    if (parts = this.selector.match(DESCENDANT_SELECTOR)) {
      let parent;
      if (parent = up.fragment.closest(this.origin, parts[1], this.options)) {
        return up.fragment.getDumb(parent, parts[2]);
      }
    }
  }

  findInLayer() {
    return up.fragment.getDumb(this.selector, this.options);
  }
};
