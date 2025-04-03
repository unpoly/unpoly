const u = up.util
const e = up.element

// HTML allows comments before a <!DOCTYPE> or <html> tag (issue #726)
const FULL_DOCUMENT_PATTERN = /^\s*(<!--[^-]*.*?-->\s*)*<(html|!DOCTYPE)\b/i

up.ResponseDoc = class ResponseDoc {

  constructor({ document, fragment, content, target, origin, data, cspNonces, match }) {
    if (document) {
      this._parseDocument(document, origin, data)
    } else if (fragment) {
      this._parseFragment(fragment, origin, data)
    } else {
      // Parsing { inner } is the last option we try. It should always succeed in case someone
      // tries `up.layer.open()` without any args. Hence we default the innerHTML to an empty string.
      this._parseContent(content || '', origin, target, data)
    }

    this._cspNonces = cspNonces

    if (origin) {
      let originSelector = up.fragment.tryToTarget(origin)
      if (originSelector) {
        this._rediscoveredOrigin = this.select(originSelector)
      }
    }

    this._match = match
  }

  _parseDocument(value, origin, data) {
    if (value instanceof Document) {  // Document
      this._document = value
      this._isFullDocument = true
    } else if (u.isString(value)) { // String of HTML or maybe a <template> selector
      // Remember whether the HTML originally contained a full document.
      // Asset comparison needs to know whether the document has a <head> because
      // e.createBrokenDocumentFromHTML() always creates an (empty) <head> if missing in the HTML.
      this._isFullDocument = FULL_DOCUMENT_PATTERN.test(value)

      let htmlParser = (html) => [e.createBrokenDocumentFromHTML(html)]
      let nodes = up.fragment.provideNodes(value, { origin, data, htmlParser })

      // If value is HTML, e.createBrokenDocumentFromHTML() will parse it into a Document.
      // Even if value is only a fragment, or multiple sibling nodes, it will always be
      // wrapped into a Document.
      if (nodes[0] instanceof Document) {
        this._document = nodes[0]
      } else {
        // If value is a template reference, a custom up:template:clone handler
        // may have passed us a non-document.
        this._document = this._buildFauxDocument(nodes)
      }
    } else { // Element
      this._document = this._buildFauxDocument(value)
    }
  }

  _parseFragment(value, origin, data) {
    let element = e.extractSingular(up.fragment.provideNodes(value, { origin, data }))
    this._document = this._buildFauxDocument(element)
  }

  _parseContent(value, origin, target, data) {
    if (!target) up.fail("must pass a { target } when passing { content }")

    // We are only provided with inner child content.
    // To simplify other code we wrap it in an element matching { target }.
    let simplifiedTarget = u.map(up.fragment.parseTargetSteps(target), 'selector').join()
    let nodes = up.fragment.provideNodes(value, { origin, data })
    let matchingElement = e.createFromSelector(simplifiedTarget, { content: nodes })

    this._document = this._buildFauxDocument(matchingElement)
  }

  _buildFauxDocument(nodes) {
    nodes = u.wrapList(nodes)

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

  rootSelector() {
    // We want to say this._document.documentElement, but we sometimes have
    // a faux document with multiple children.
    return up.fragment.toTarget(this._document.children[0])
  }

  get title() {
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
  // eslint-disable-next-line getter-return
  _getHead() {
    // The root may be a `Document` (which always has a `#head`, even if it wasn't present in the HTML)
    // or an `Element` (which never has a `#head`).
    if (this._isFullDocument) {
      return this._document.head
    }
  }

  _fromHead(fn) {
    let head = this._getHead()
    return head && fn(head)
  }

  get metaTags() {
    return this._fromHead(up.history.findMetaTags)
  }

  get assets() {
    return this._fromHead(up.script.findAssets)
  }

  get lang() {
    // Although DOMParser always produces a document with <html> element, we must
    // only use the [lang] attribute if the initial document contained a <html> element.
    // Otherwise Unpoly would delete the attribute from the current page.
    if (this._isFullDocument) {
      return up.history.getLang(this._document)
    }
  }

  _getTitleText(head) {
    // We must find inside the head ('head title') instead of 'title'
    // so we won't match the <title> of an inline SVG image.
    return head.querySelector('title')?.textContent
  }

  // (1) Selects a single fragment with the given selector.
  // (2) Supports custom Unpoly selectors like :has() or :main.
  // (3) Supports origin-aware lookup priorities.
  // (4) Returns undefined if there is no match.
  select(selector) {
    let finder = new up.FragmentFinder({
      selector: selector,
      origin: this._rediscoveredOrigin,
      document: this._document,
      match: this._match,
    })
    return finder.find()
  }

  selectSteps(steps) {
    return steps.filter((step) => {
      return this._trySelectStep(step) || this._cannotMatchStep(step)
    })
  }

  commitSteps(steps) {
    // If multiple steps want to match the same new element, the first step will remain in the left.
    // This will happen when multiple layers have the same hungry element with [up-if-layer=any].
    return steps.filter((step) => this.commitElement(step.newElement))
  }

  _trySelectStep(step) {
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
      up.emit(step.oldElement, selectEvent, { callback: step.selectCallback })
      if (selectEvent.defaultPrevented) {
        return
      }
    }

    step.newElement = newElement
    return true
  }

  _cannotMatchStep(step) {
    if (!step.maybe) {
      // An error message will be chosen by up.Change.FromContent
      throw new up.CannotMatch()
    }
  }

  commitElement(element) {
    if (this._document.contains(element)) {
      // If the user doesn't want to run scripts in the new fragment, we disable all <script> elements.
      // While <script> elements parsed by `DOMParser` are inert anyway, we also parse HTML through
      // other methods, which do create non-inert <script> elements.
      if (!up.fragment.config.runScripts) {
        up.script.disableSubtree(element)
      }

      // Ensure that the element cannot be matched for subsequent selects().
      element.remove()
      return true
    }
  }

  finalizeElement(element) {
    // Rewrite per-request CSP nonces to match that of the current page.
    up.NonceableCallback.adoptNonces(element, this._cspNonces)

    // If we plucked elements from a Document we assume that document was created by DOMParser,
    // which operates in a different context and creates inert elements.
    if (this._document instanceof Document) {
      // Now that these elements is attached to the current document, we can re-create them
      // in the correct browsing context.
      let brokenElements = e.subtree(element, ':is(noscript,script,audio,video):not(.up-keeping, .up-keeping *)')
      u.each(brokenElements, e.fixParserDamage)
    }
  }

  static {
    // Cache since multiple plans will query this.
    u.memoizeMethod(this.prototype, {
      _getHead: true,
    })
  }

}
