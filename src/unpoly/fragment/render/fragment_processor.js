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
    let preprocessed = this.preprocessOnce(opt)
    return this.tryProcess(preprocessed)
  }

  preprocessOnce(opt) {
    return u.getComplexTokens(opt)
  }

  tryProcess(opt) {
    if (u.isArray(opt)) {
      return this.processArray(opt)
    }

    if (u.isOptions(opt)) {
      return this.processSelectorMap(opt)
    }

    if (u.isFunction(opt)) {
      let result = up.error.guard(opt, this.fragment, this.attributes())
      // The function result can be another processable value.
      return this.tryProcess(result)
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
        return this.resolveCondition(match[2]) && this.tryProcess(match[1])
      }
    }

    return this.processPrimitive(opt)
  }

  processSelectorMap(map) {
    return Object.keys(map).filter((selector) => {
      let match = this.findSelector(selector)
      if (match) {
        let matchProcessor = new this.constructor({ ...this.attributes(), fragment: match })
        let opt = map[selector]
        return matchProcessor.process(opt)
      }
    })
  }

  processArray(array) {
    return u.find(array, (opt) => this.tryProcess(opt))
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
