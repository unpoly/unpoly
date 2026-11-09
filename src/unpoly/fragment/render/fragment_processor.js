import {
  findInList, getComplexTokens, isArray, isDefined, isElement, isFunction, isOptions, isString, pickBy,
} from '../../util.js'
import { guard } from '../../error.js'
import { contains, getSmart } from '../../fragment.js'
import { printToWarn } from '../../log.js'

export class FragmentProcessor {

  constructor(options) {
    this.fragment = options.fragment
    this.autoMeans = options.autoMeans
    this.origin = options.origin
    this.layer = options.layer
  }

  // The options that we pass to a function value, and to the processor for a match in a
  // selector map. Subclasses add their own.
  attributes() {
    return pickBy({
      fragment: this.fragment,
      autoMeans: this.autoMeans,
      origin: this.origin,
      layer: this.layer,
    }, isDefined)
  }

  process(opt) {
    let preprocessed = this.preprocessOnce(opt)
    return this.tryProcess(preprocessed)
  }

  preprocessOnce(opt) {
    return getComplexTokens(opt)
  }

  tryProcess(opt) {
    if (isArray(opt)) {
      return this.processArray(opt)
    }

    if (isOptions(opt)) {
      return this.processSelectorMap(opt)
    }

    if (isFunction(opt)) {
      let result = guard(opt, this.fragment, this.attributes())
      // The function result can be another processable value.
      return this.tryProcess(result)
    }

    if (isElement(opt)) {
      return this.processElement(opt) // TODO: Test that { focus: Element } works
    }

    if (isString(opt)) {
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
    return findInList(array, (opt) => this.tryProcess(opt))
  }

  resolveCondition(condition) {
    if (condition === 'main') {
      return this.fragment && contains(this.fragment, ':main')
    }
  }

  findSelector(selector) {
    const lookupOpts = { layer: this.layer, origin: this.origin }

    let matchWithinFragment = this.fragment && getSmart(this.fragment, selector, lookupOpts)
    // Prefer selecting a descendant of @fragment, but if not possible search through @fragment's entire layer
    let match = matchWithinFragment || getSmart(selector, lookupOpts)

    if (match) {
      return match
    } else {
      printToWarn('up.render()', 'Could not find an element matching "%s"', selector)
      // Return undefined so { focus: 'auto' } will try the next option from { autoMeans }
    }
  }
}

export const api = {
  /** @internal On window.up for the specs. */
  FragmentProcessor,
}
