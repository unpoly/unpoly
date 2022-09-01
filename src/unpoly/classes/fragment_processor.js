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
    let preprocessed = this.preprocess(opt)
    return this.tryProcess(preprocessed)
  }

  preprocess(opt) {
    return u.parseTokens(opt, { separator: 'or' })
  }

  tryProcess(opt) {
    if (u.isArray(opt)) {
      return this.processArray(opt)
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

  processArray(array) {
    return u.find(array, opt => this.tryProcess(opt))
  }

  resolveCondition(condition) {
    if (condition === 'main') {
      return this.fragment && up.fragment.contains(this.fragment, ':main')
    }
  }

  findSelector(selector) {
    const lookupOpts = { layer: this.layer, origin: this.origin }

    let matchWithinFragment = this.fragment && up.fragment.get(this.fragment, selector, lookupOpts)
    // Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    let match = matchWithinFragment || up.fragment.get(selector, lookupOpts)

    if (match) {
      return match
    } else {
      up.warn('up.render()', 'Could not find an element matching "%s"', selector)
      // Return undefined so { focus: 'auto' } will try the next option from { autoMeans }
    }
  }
}
