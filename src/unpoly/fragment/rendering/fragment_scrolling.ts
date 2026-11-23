import * as u from '../../util.js'
import type { LayerMode } from '../../layer.js'
import { restoreScroll, reveal, revealHash, scrollToPosition, type RevealMax } from '../../viewport.js'
import type * as t from '../types.js'
import { FragmentProcessor } from './fragment_processor.js'

// Options for a FragmentScrolling.
interface FragmentScrollingOptions extends t.FragmentProcessorOptions {
  hash?: string
  mode?: LayerMode
  revealTop?: boolean
  revealMax?: RevealMax
  revealSnap?: number
  revealPadding?: number
  scrollBehavior?: ScrollBehavior
  // Scroll positions from before the update, for { scroll: 'keep' }.
  oldScrollTops?: Record<string, number>
}

export class FragmentScrolling extends FragmentProcessor<FragmentScrollingOptions> {
  // The options for the viewport functions we call.
  //
  // We don't pass all our options, since a render pass passes all its render options,
  // and reveal() would act on { focus }, restoreScroll() on { location }.
  //
  // Render options call it { scrollBehavior } to stand out among many other options.
  // The viewport functions only take scrolling options, and call it { behavior }.
  _viewportOptions(): u.PlainObject {
    let { layer, origin, mode, revealTop, revealMax, revealSnap, revealPadding, scrollBehavior } = this.options
    return { layer, origin, mode, revealTop, revealMax, revealSnap, revealPadding, behavior: scrollBehavior }
  }

  processPrimitive(opt: unknown): unknown {
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
        return this.options.hash && revealHash(this.options.hash, this._viewportOptions())
      case 'target':
      case 'reveal':
      case true:
        return this._revealElement(this.options.fragment)
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
      reveal(element, this._viewportOptions())
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
    return this._revealElement(this.options.layer!.getBoxElement())
  }

  _scrollTo(position: number): boolean {
    // With { around: undefined }, scrollToPosition() resets all viewports in { layer }
    return scrollToPosition(position, { ...this._viewportOptions(), around: this.options.fragment })
  }

  _restoreOld(): boolean | undefined {
    let { oldScrollTops } = this.options
    if (oldScrollTops) {
      return this._restoreSaved({ scrollTops: oldScrollTops })
    }
  }

  _restoreSaved(extraOptions?: u.PlainObject): boolean {
    // With { around: undefined }, restoreScroll() restores all viewports in { layer }
    return restoreScroll({ ...this._viewportOptions(), around: this.options.fragment, ...extraOptions })
  }

}
