import { isString, map, memoizeMethod, wrapList } from '../../util.js'
import {
  createBrokenDocumentFromHTML, createFromSelector, extractSingular, isFullDocumentHTML,
  revivedClone, subtree,
} from '../../element.js'
import { fail } from '../../error.js'
import { CannotMatch } from '../../error/cannot_match.js'
import { emit } from '../../event.js'
import { parseTargetSteps, provideNodes, toTarget, tryToTarget } from '../../fragment.js'
import { FragmentFinder } from '../fragment_finder.js'
import { findMetaTags, getLang } from '../../history.js'
import { adoptDetachedHeadAsset, adoptNewFragment, findAssets, warnOfUnsafeCSP } from '../../script.js'
import type { List } from '../../util.js'
import type { RenderStep } from '../../fragment.js'
import type { CSPInfo } from '../../script/csp/csp_info.js'

/**
Options for an `up.ResponseDoc`. One of `{ document }`, `{ fragment }` or `{ content }` holds the new HTML.
@internal
*/
export interface ResponseDocOptions {
  document?: string | Element | Document
  fragment?: string | Element
  content?: string | Element | List<Node>
  target?: string
  origin?: Element
  data?: any
  cspInfo?: CSPInfo
  match?: 'region' | 'first'
}

export class ResponseDoc {
  // A parsed Document for a full HTML document, or an <up-document> element wrapping a fragment.
  declare _document: Document | HTMLElement
  declare _isFullDocument: boolean | undefined
  declare _cspInfo: CSPInfo | undefined
  declare _rediscoveredOrigin: Element | undefined
  declare _match: 'region' | 'first' | undefined

  constructor({ document, fragment, content, target, origin, data, cspInfo, match }: ResponseDocOptions) {
    if (document) {
      this._parseDocument(document, origin, data)
    } else if (fragment) {
      this._parseFragment(fragment, origin, data)
    } else {
      // Parsing { inner } is the last option we try. It should always succeed in case someone
      // tries `up.layer.open()` without any args. Hence we default the innerHTML to an empty string.
      this._parseContent(content || '', origin, target, data)
    }

    // This is the parsed script-src declaration from the response
    this._cspInfo = cspInfo
    warnOfUnsafeCSP(cspInfo)

    if (origin) {
      let originSelector = tryToTarget(origin)
      if (originSelector) {
        this._rediscoveredOrigin = this.select(originSelector)
      }
    }

    this._match = match
  }

  _parseDocument(value: string | Element | Document, origin: Element | undefined, data: any): void {
    if (value instanceof Document) {  // Document
      this._document = value
      this._isFullDocument = true
    } else if (isString(value)) { // String of HTML or maybe a <template> selector
      // Remember whether the HTML originally contained a full document.
      // Asset comparison needs to know whether the document has a <head> because
      // e.createBrokenDocumentFromHTML() always creates an (empty) <head> if missing in the HTML.
      this._isFullDocument = isFullDocumentHTML(value)

      let htmlParser = (html: string) => [createBrokenDocumentFromHTML(html)]
      let nodes = provideNodes(value, { origin, data, htmlParser })

      // If value is HTML, e.createBrokenDocumentFromHTML() will parse it into a Document.
      // Even if value is only a fragment, or multiple sibling nodes, it will always be
      // wrapped into a Document.
      if (nodes[0] instanceof Document) {
        this._document = nodes[0] as Document
      } else {
        // If value is a template reference, a custom up:template:clone handler
        // may have passed us a non-document.
        this._document = this._buildFauxDocument(nodes)
      }
    } else { // Element
      this._document = this._buildFauxDocument(value)
    }
  }

  _parseFragment(value: string | Element, origin: Element | undefined, data: any): void {
    let element = extractSingular(provideNodes(value, { origin, data }))
    this._document = this._buildFauxDocument(element)
  }

  _parseContent(value: string | Element | List<Node>, origin: Element | undefined, target: string | undefined, data: any): void {
    if (!target) fail("must pass a { target } when passing { content }")

    // We are only provided with inner child content.
    // To simplify other code we wrap it in an element matching { target }.
    let simplifiedTarget = map(parseTargetSteps(target), 'selector').join()
    let nodes = provideNodes(value, { origin, data })
    let matchingElement = createFromSelector(simplifiedTarget, { content: nodes })

    this._document = this._buildFauxDocument(matchingElement)
  }

  _buildFauxDocument(nodes: Node | List<Node>): HTMLElement
  // The nodes are wrapped in a list in place, so the implementation takes the wrapped type.
  _buildFauxDocument(nodes: List<Node>) {
    nodes = wrapList(nodes)

    // We're creating a faux document to wrap around a fragment root that is not already a `Document`.
    // This has two motivations:
    //
    // (1) When a step plucks the fragment root it will no longer be available for selection by a later step.
    // (2) We can select any element (including the fragment root) by fauxDocument.querySelector()
    //     and do not use a more expensive subtree() operation.
    let fauxDocument = document.createElement('up-document')
    fauxDocument.append(...nodes)
    return fauxDocument
  }

  rootSelector(): string {
    // We want to say this._document.documentElement, but we sometimes have
    // a faux document with multiple children.
    return toTarget(this._document.children[0])
  }

  get title(): string | undefined {
    // We get it from the <head> instead of this._document.title.
    // We want to distinguish between a parsed document that does not have a <head> or <title>
    // and a given, but empty title.
    return this._fromHead(this._getTitleText)
  }

  /*
  Returns the root's `<head>`, if it has one.

  Returns `undefined` if the root has no contentful `<head>`, e.g. if the root was
  parsed from a fragment, or from a document without a `<head>` element.
  */
  // No _ prefix: specs call this directly, and _-prefixed members are mangled in the minified build.
  getHead(): HTMLHeadElement | undefined {
    // The root may be a `Document` (which always has a `#head`, even if it wasn't present in the HTML)
    // or an `Element` (which never has a `#head`).
    if (this._isFullDocument) {
      return (this._document as Document).head
    }
  }

  _fromHead<T>(fn: (head: HTMLHeadElement) => T): T | undefined {
    let head = this.getHead()
    return head && fn(head)
  }

  get metaTags(): NodeListOf<Element> | undefined {
    return this._fromHead(findMetaTags)
  }

  get assets(): Element[] | undefined {
    return this._fromHead((head) => {
      let assets = findAssets(head)

      // Need to use up.util.map() for a NodeList, which does not support #map()
      return map(assets, (asset) => {
        // (A) Assets might contain elements that need to be re-created in the current document context.
        // (B) Returns copies so multiple calls to #assets return the same array, even if some assets where inserted.
        asset = revivedClone(asset)

        // Rewrite [nonce] attributes so we don't see up:assets:changed with every request.
        adoptDetachedHeadAsset(asset, this._cspInfo)

        return asset
      })
    })
  }

  get lang(): string | undefined {
    // Although DOMParser always produces a document with <html> element, we must
    // only use the [lang] attribute if the initial document contained a <html> element.
    // Otherwise Unpoly would delete the attribute from the current page.
    if (this._isFullDocument) {
      return getLang(this._document as Document)
    }
  }

  _getTitleText(head: HTMLHeadElement): string | undefined {
    // We must find inside the head ('head title') instead of 'title'
    // so we won't match the <title> of an inline SVG image.
    return head.querySelector('title')?.textContent
  }

  // (1) Selects a single fragment with the given selector.
  // (2) Supports custom Unpoly selectors like :has() or :main.
  // (3) Supports origin-aware lookup priorities.
  // (4) Returns undefined if there is no match.
  select(selector: string): HTMLElement | undefined {
    let finder = new FragmentFinder({
      selector: selector,
      origin: this._rediscoveredOrigin,
      document: this._document,
      match: this._match,
    })
    return finder.find()
  }

  selectSteps(steps: RenderStep[]): RenderStep[] {
    return steps.filter((step) => {
      return this._trySelectStep(step) || this._cannotMatchStep(step)
    })
  }

  commitSteps(steps: RenderStep[]): RenderStep[] {
    // If multiple steps want to match the same new element, the first step will remain in the left.
    // This will happen when multiple layers have the same hungry element with [up-if-layer=any].
    return steps.filter((step) => this.commitElement(step.newElement))
  }

  _trySelectStep(step: RenderStep): boolean | undefined {
    // TODO: Why do we need this check?
    if (step.newElement) {
      return true
    }

    // Look for a match in the new content.
    // The new content has no layers, so no { layer } option here.
    let newElement = this.select(step.selector)

    if (!newElement) {
      return
    }

    let { selectEvent } = step
    if (selectEvent) {
      selectEvent.newFragment = newElement
      selectEvent.renderOptions = step.originalRenderOptions
      emit(step.oldElement, selectEvent, { callback: step.selectCallback })
      if (selectEvent.defaultPrevented) {
        return
      }
    }

    step.newElement = newElement
    return true
  }

  _cannotMatchStep(step: RenderStep): void {
    if (!step.maybe) {
      // An error message will be chosen by ChangeFromContent
      throw new CannotMatch()
    }
  }

  commitElement(element: Element): boolean | undefined {
    // If multiple steps want to match the name new element, only he first will succeed.
    // This will happen when multiple layers have the same hungry element with [up-if-layer=any].
    if (this._document.contains(element)) {
      // (A) If the user doesn't want to run scripts in the new fragment, we block all <script> elements.
      //     We cannot wait until finalizeElement(), because then the script has already been inserted and has executed.
      // (B) For the remaining scripts we verify and adopt CSP nonces so they can be executed in the current page.
      adoptNewFragment(element, this._cspInfo)

      // Ensure that the element cannot be matched for subsequent selects().
      element.remove()

      return true
    }
  }

  finalizeElement(element: Element): void {
    // If we plucked elements from a Document we assume that document was created by DOMParser,
    // which operates in a different context and creates inert elements:
    //
    // (1) Children of a <nonscript> tag are expected to be a verbatim text node in a scripting-capable browser.
    //     However, `DOMParser` parses children into actual DOM nodes.
    //     This confuses libraries that work with <noscript> tags, such as lazysizes.
    // (2) <script> elements are inert and will not run code when inserted into the main `document`.
    // (3) Safari cannot parse (or move?) auto-playing media elements.
    if (this._document instanceof Document) {
      for (let brokenElement of subtree(element, ':is(noscript, script, audio, video):not(.up-keeping, .up-keeping *)')) {
        // throw "why does this not re-execute a <script> tag? wouldn't it be safer to disable all scripts, then revive some of them?"
        let clone = revivedClone(brokenElement)
        brokenElement.replaceWith(clone)
      }
    }
  }

  static {
    // Cache since multiple plans will query this.
    memoizeMethod(this.prototype, {
      getHead: true,
    })
  }

}
