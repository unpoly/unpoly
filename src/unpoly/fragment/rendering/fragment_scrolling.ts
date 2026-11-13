import * as u from '../../util.js'
import { type LayerMode } from '../../layer.js'
import { restoreScroll, reveal, revealHash, scrollToPosition } from '../../viewport.js'
import type * as t from '../types.js'
import { FragmentProcessor } from './fragment_processor.js'

// Options for an up.FragmentScrolling.
interface FragmentScrollingOptions extends t.FragmentProcessorOptions {
  hash?: string
  mode?: LayerMode
  revealTop?: boolean
  revealMax?: number | ((viewportHeight: number) => number)
  revealSnap?: number
  revealPadding?: number
  scrollBehavior?: ScrollBehavior
  // Scroll positions from before the update, for { scroll: 'keep' }.
  oldScrollTops?: Record<string, number>
}

export class FragmentScrolling extends FragmentProcessor {
  declare hash?: string
  declare mode?: LayerMode
  declare revealTop?: boolean
  declare revealMax?: number | ((viewportHeight: number) => number)
  declare revealSnap?: number
  declare revealPadding?: number
  declare behavior?: ScrollBehavior
  declare oldScrollTops?: Record<string, number>

  constructor(options: FragmentScrollingOptions) {
    super(options)
    this.hash = options.hash
    this.mode = options.mode
    this.revealTop = options.revealTop
    this.revealMax = options.revealMax
    this.revealSnap = options.revealSnap
    this.revealPadding = options.revealPadding
    // Render options call it { scrollBehavior } to stand out among many other options.
    // The viewport functions we call only take scrolling options, and call it { behavior }.
    //
    // The processor for a match in a selector map is built from our attributes, which have
    // { behavior } but no { scrollBehavior }, so it scrolls instantly. This is how it has
    // always worked, but it may be a bug.
    this.behavior = options.scrollBehavior
    this.oldScrollTops = options.oldScrollTops
  }

  attributes(): u.PlainObject {
    return u.pickBy({
      ...super.attributes(),
      hash: this.hash,
      mode: this.mode,
      revealTop: this.revealTop,
      revealMax: this.revealMax,
      revealSnap: this.revealSnap,
      revealPadding: this.revealPadding,
      behavior: this.behavior,
      oldScrollTops: this.oldScrollTops,
    }, u.isDefined)
  }

  processPrimitive(opt: any): any {
    switch (opt) {
      case 'top':
        return this._scrollTo(0)
      case 'bottom':
        return this._scrollTo(-0)
      case 'layer':
        return this._revealLayer()
      case 'main':
        return this._revealSelector(':main')
      case 'keep':
        return this._restoreOld()
      case 'restore':
        return this._restoreSaved()
      case 'hash':
        return this.hash && revealHash(this.hash, this.attributes())
      case 'target':
      case 'reveal':
      case true:
        return this._revealElement(this.fragment)
      default:
        if (u.isNumber(opt)) {
          return this._scrollTo(opt)
        } else if (u.isString(opt)) {
          return this._revealSelector(opt)
        }
    }
  }

  processElement(element: HTMLElement): boolean | undefined {
    return this._revealElement(element)
  }

  _revealElement(element?: HTMLElement | null): boolean | undefined {
    if (element) {
      reveal(element, this.attributes())
      return true
    }
  }

  _revealSelector(selector: string): boolean | undefined {
    let match = this.findSelector(selector)
    return this._revealElement(match)
  }

  _revealLayer(): boolean | undefined {
    // Reveal the layer's box instead of the layer's element.
    // If the layer has its own viewport, like a modal, revealing the box will
    // scroll the layer viewport. Revealing the layer element would scroll
    // the main document viewport.
    // The render pass always passes a { layer }.
    return this._revealElement(this.layer!.getBoxElement())
  }

  _scrollTo(position: number): boolean {
    // With { around: undefined }, scrollToTop() resets all viewports in { layer }
    return scrollToPosition(position, { ...this.attributes(), around: this.fragment })
  }

  _restoreOld(): boolean | undefined {
    if (this.oldScrollTops) {
      return this._restoreSaved({ scrollTops: this.oldScrollTops })
    }
  }

  _restoreSaved(extraOptions?: u.PlainObject): boolean {
    // With { around: undefined }, restoreScroll() restores all viewports in { layer }
    return restoreScroll({ ...this.attributes(), around: this.fragment, ...extraOptions })
  }

}
