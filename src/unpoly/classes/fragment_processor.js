const u = up.util

up.FragmentProcessor = class FragmentProcessor extends up.Record {

  keys() {
    return [
      'fragment',
      'autoMeans',
      'origin',
      'layer'
    ]
  }

  process(opt) {
    // Expose this additional method so subclasses can implement default values.
    return this.tryProcess(opt)
  }

  tryProcess(opt) {
    if (u.isArray(opt)) {
      return u.find(opt, opt => this.tryProcess(opt))
    }

    if (u.isFunction(opt)) {
      return this.tryProcess(opt(this.fragment, this.attributes()))
    }

    if (u.isElement(opt)) {
      return this.processElement(opt) // TODO: Test that { focus: Element } works
    }

    if (u.isString(opt)) {
      if (opt === 'auto') {
        return this.tryProcess(this.autoMeans)
      }

      let match = opt.match(/^(.+?)-if-(.+?)$/)
      if (match) {
        return this.resolveCondition(match[2]) && this.process(match[1])
      }
    }

    return this.processPrimitive(opt)
  }

  resolveCondition(condition) {
    if (condition === 'main') {
      return up.fragment.contains(this.fragment, ':main')
    }
  }

  findSelector(selector) {
    const lookupOpts = { layer: this.layer, origin: this.origin }
    // Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    let match = up.fragment.get(this.fragment, selector, lookupOpts) || up.fragment.get(selector, lookupOpts)
    if (match) {
      return match
    } else {
      up.warn('up.render()', 'Could not find an element matching "%s"', selector)
      // Return undefined so { focus: 'auto' } will try the next option from { autoMeans }
    }
  }
}
