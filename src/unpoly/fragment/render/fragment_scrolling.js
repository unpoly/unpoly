import { isNumber, isString } from '../../util.js'
import { FragmentProcessor } from './fragment_processor.js'
import { restoreScroll, reveal, revealHash, scrollTo } from '../../viewport.js'

export class FragmentScrolling extends FragmentProcessor {

  keys() {
    return super.keys().concat([
      'hash',
      'mode',
      'revealTop',
      'revealMax',
      'revealSnap',
      'revealPadding',
      'behavior',
      'oldScrollTops',
    ])
  }

  constructor(options) {
    // Render options call it { scrollBehavior } to stand out among many other options.
    // The viewport functions we call only take scrolling options, and call it { behavior }.
    super({ ...options, behavior: options.scrollBehavior })
  }

  processPrimitive(opt) {
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
        if (isNumber(opt)) {
          return this._scrollTo(opt)
        } else if (isString(opt)) {
          return this._revealSelector(opt)
        }
    }
  }

  processElement(element) {
    return this._revealElement(element)
  }

  _revealElement(element) {
    if (element) {
      reveal(element, this.attributes())
      return true
    }
  }

  _revealSelector(selector) {
    let match = this.findSelector(selector)
    return this._revealElement(match)
  }

  _revealLayer() {
    // Reveal the layer's box instead of the layer's element.
    // If the layer has its own viewport, like a modal, revealing the box will
    // scroll the layer viewport. Revealing the layer element would scroll
    // the main document viewport.
    return this._revealElement(this.layer.getBoxElement())
  }

  _scrollTo(position) {
    // With { around: undefined }, scrollToTop() resets all viewports in { layer }
    return scrollTo(position, { ...this.attributes(), around: this.fragment })
  }

  _restoreOld() {
    if (this.oldScrollTops) {
      return this._restoreSaved({ scrollTops: this.oldScrollTops })
    }
  }

  _restoreSaved(extraOptions) {
    // With { around: undefined }, restoreScroll() restores all viewports in { layer }
    return restoreScroll({ ...this.attributes(), around: this.fragment, ...extraOptions })
  }

}

export const api = {
  /** @internal On window.up for the specs. */
  FragmentScrolling,
}
