import * as u from '../../util.js'
import { guard } from '../../error.js'
import { containsFragment, getFragment } from '../../fragment.js'
import { printToWarn } from '../../log.js'
import type * as t from '../types.js'

// Processes a { focus } or { scroll } render option. The option can be a string, an element, a function,
// an array of alternatives or a selector map. A function may return any value, so the methods take `unknown`.
export abstract class FragmentProcessor<O extends t.FragmentProcessorOptions = t.FragmentProcessorOptions> {
  // A render pass passes all its render options, so this holds more keys than `O` lists.
  // A function value receives it, and so does the processor for a match in a selector map.
  declare options: O

  constructor(options: O) {
    this.options = options
  }

  // Returns a truthy value if the option was processed.
  process(opt: unknown): unknown {
    let preprocessed = this.preprocessOnce(opt)
    return this.tryProcess(preprocessed)
  }

  preprocessOnce(opt: unknown): unknown {
    return u.getComplexTokens(opt)
  }

  tryProcess(opt: unknown): unknown {
    if (u.isArray(opt)) {
      return this.processArray(opt)
    }

    if (u.isOptions(opt)) {
      return this.processSelectorMap(opt)
    }

    if (u.isFunction(opt)) {
      let result = guard(opt, this.options.fragment, this.options)
      // The function result can be another processable value.
      return this.tryProcess(result)
    }

    if (u.isElement(opt)) {
      return this.processElement(opt as HTMLElement) // TODO: Test that { focus: Element } works
    }

    if (u.isString(opt)) {
      if (opt === 'auto') {
        return this.tryProcess(this.options.autoMeans)
      }

      let match = opt.match(/^(.+?)-if-(.+?)$/)
      if (match) {
        return this.resolveCondition(match[2]) && this.tryProcess(match[1])
      }
    }

    return this.processPrimitive(opt)
  }

  abstract processPrimitive(opt: unknown): unknown

  abstract processElement(element: HTMLElement): unknown

  processSelectorMap(map: u.PlainObject): string[] {
    return Object.keys(map).filter((selector) => {
      let match = this.findSelector(selector)
      if (match) {
        let MatchProcessor = this.constructor as new (options: O) => this
        let matchProcessor = new MatchProcessor({ ...this.options, fragment: match })
        let opt = map[selector]
        return matchProcessor.process(opt)
      }
    })
  }

  processArray(array: unknown[]): unknown {
    return u.findInList(array, (opt) => this.tryProcess(opt))
  }

  resolveCondition(condition: string): boolean | null | undefined {
    if (condition === 'main') {
      let { fragment } = this.options
      return fragment && containsFragment(fragment, ':main')
    }
  }

  findSelector(selector: string): HTMLElement | undefined {
    let { fragment, layer, origin } = this.options
    const lookupOpts = { layer, origin }

    let matchWithinFragment = fragment && getFragment(fragment, selector, lookupOpts)
    // Prefer selecting a descendant of the fragment, but if not possible search through the fragment's entire layer
    let match = matchWithinFragment || getFragment(selector, lookupOpts)

    if (match) {
      return match
    } else {
      printToWarn('up.render()', 'Could not find an element matching "%s"', selector)
      // Return undefined so { focus: 'auto' } will try the next option from { autoMeans }
    }
  }
}
