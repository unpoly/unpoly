import * as u from '../../util.js'
import { guard } from '../../error.js'
import { contains, getSmart } from '../../fragment.js'
import { printToWarn } from '../../log.js'
import type { Layer } from '../../layer/base.js'

/**
Options for an `up.FragmentProcessor`. Subclasses take more.
@internal
*/
export interface FragmentProcessorOptions {
  fragment?: HTMLElement
  // What { focus: 'auto' } or { scroll: 'auto' } means, as another processable value.
  autoMeans?: any
  origin?: Element
  layer?: Layer
  [key: string]: any
}

// Processes a { focus } or { scroll } render option. The option can be a string, an element, a function,
// an array of alternatives or a selector map, so its type stays `any`.
export abstract class FragmentProcessor {
  declare fragment: HTMLElement | undefined
  declare autoMeans: any
  declare origin: Element | undefined
  declare layer: Layer | undefined

  constructor(options: FragmentProcessorOptions) {
    this.fragment = options.fragment
    this.autoMeans = options.autoMeans
    this.origin = options.origin
    this.layer = options.layer
  }

  // The options that we pass to a function value, and to the processor for a match in a
  // selector map. Subclasses add their own.
  attributes(): u.PlainObject {
    return u.pickBy({
      fragment: this.fragment,
      autoMeans: this.autoMeans,
      origin: this.origin,
      layer: this.layer,
    }, u.isDefined)
  }

  // Returns a truthy value if the option was processed.
  process(opt: any): any {
    let preprocessed = this.preprocessOnce(opt)
    return this.tryProcess(preprocessed)
  }

  preprocessOnce(opt: any): any {
    return u.getComplexTokens(opt)
  }

  tryProcess(opt: any): any {
    if (u.isArray(opt)) {
      return this.processArray(opt)
    }

    if (u.isOptions(opt)) {
      return this.processSelectorMap(opt)
    }

    if (u.isFunction(opt)) {
      let result = guard(opt, this.fragment, this.attributes())
      // The function result can be another processable value.
      return this.tryProcess(result)
    }

    if (u.isElement(opt)) {
      return this.processElement(opt as HTMLElement) // TODO: Test that { focus: Element } works
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

  abstract processPrimitive(opt: any): any

  abstract processElement(element: HTMLElement): any

  processSelectorMap(map: u.PlainObject): string[] {
    return Object.keys(map).filter((selector) => {
      let match = this.findSelector(selector)
      if (match) {
        let matchProcessor = new (this.constructor as any)({ ...this.attributes(), fragment: match })
        let opt = map[selector]
        return matchProcessor.process(opt)
      }
    })
  }

  processArray(array: any[]): any {
    return u.findInList(array, (opt) => this.tryProcess(opt))
  }

  resolveCondition(condition: string): boolean | undefined {
    if (condition === 'main') {
      return this.fragment && contains(this.fragment, ':main')
    }
  }

  findSelector(selector: string): HTMLElement | undefined {
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
