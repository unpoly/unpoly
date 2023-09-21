const u = up.util
const e = up.element

up.ResponseDoc = class ResponseDoc {

  constructor(options) {
    this.root =
      this._parseDocument(options) ||
      this._parseFragment(options) ||
      this._parseContent(options)

    // If the user doesn't want to run scripts in the new fragment, we disable all <script> elements.
    // While <script> elements parsed by `DOMParser` are inert anyway, we also _parse HTML through
    // other methods, which do create non-inert <script> elements.
    if (!up.fragment.config.runScripts) {
      this.root.querySelectorAll('script').forEach((e) => e.remove())
    }

    this.cspNonces = options.cspNonces

    if (options.origin) {
      let originSelector = up.fragment.tryToTarget(options.origin)
      if (originSelector) {
        this.rediscoveredOrigin = this.select(originSelector)
      }
    }
  }

  _parseDocument(options) {
    let document = this._parse(options.document, e.createBrokenDocumentFromHTML)
    if (document) {
      // Remember that we need to fix <script> and <noscript> elements later.
      // We could fix these elements right now for the entire document, but since we will only use
      // a fragment, this would cause excessive work.
      this.scriptishNeedFix = true

      return document
    }
  }

  _parseContent(options) {
    // Parsing { inner } is the last option we try. It should always succeed in case someone
    // tries `up.layer.open()` without any args. Hence we set the innerHTML to an empty string.
    let content = options.content || ''
    let target = options.target || up.fail("must pass a { target } when passing { content }")

    target = u.map(up.fragment.parseTargetSteps(target), 'selector').join()

    // Conjure an element that will later match options.target in @select()
    const matchingElement = e.createFromSelector(target)

    if (u.isString(content)) {
      // Don't use e.createFromHTML() here, since content may be a text node.
      matchingElement.innerHTML = content
    } else {
      matchingElement.appendChild(content)
    }

    return matchingElement
  }

  _parseFragment(options) {
    return this._parse(options.fragment)
  }

  _parse(value, parseFn = e.createFromHTML) {
    if (u.isString(value)) {
      value = parseFn(value)
    }
    return value
  }

  rootSelector() {
    return up.fragment.toTarget(this.root)
  }

  get title() {
    // We get it from the <head> instead of this.root.title.
    // We want to distinguish between a parsed document that does not have a <head> or <title>
    // and a given, but empty title.
    return this.fromHead(this._getTitleText)
  }

  /*
  Returns the root's `<head>`, if it has one.

  Returns `undefined` if the root has no contentful `<head>`, e.g. if the root was
  parsed from a fragment, or from a docuemnt without a `<head>` element.
  */
  // eslint-disable-next-line getter-return
  getHead() {
    // The root may be a `Document` (which always has a `#head`, even if it wasn't present in the HTML)
    // or an `Element` (which never has a `#head`).
    let { head } = this.root

    // DocumentParser also produces a document with a <head>, even if the initial HTML
    // has no <head> element. To work around this we consider the head to be missing
    // if it has no child nodes.
    if (head && head.childNodes.length > 0) {
      return head
    }
  }

  fromHead(fn) {
    let head = this.getHead()
    return head && fn(head)
  }

  get metaElements() {
    return this.fromHead(up.history.findMetas)
  }

  get assets() {
    return this.fromHead(up.script.findAssets)
  }

  _getTitleText(head) {
    // We must find inside the head ('head title') instead of 'title'
    // so we won't match the <title> of an inline SVG image.
    return head.querySelector('title')?.textContent
  }

  // Selects a single fragment with the given selector.
  // Supports custom Unpoly selectors like :has() or :main.
  // Supports origin-aware lookup priorities.
  select(selector) {
    let finder = new up.FragmentFinder({
      selector: selector,
      origin: this.rediscoveredOrigin,
      externalRoot: this.root,
    })
    return finder.find()
  }

  selectAndReserveSteps(steps) {
    steps = steps.filter((step) => {
      // The responseDoc has no layers.
      step.newElement ||= this.select(step.selector)

      if (step.newElement) {
        return true
      } else if (!step.maybe) {
        // An error message will be chosen by up.Change.FromContent
        throw new up.CannotMatch()
      }
    })

    // Now that we know we could match all steps, remove their { newElement }
    // from the DOM so they become unavailable for re-selecting.
    // In particular we don't want hungry element processing to re-select
    // elements that were already selected for the explicit target.
    for (let step of steps) step.newElement.remove()

    return steps
  }

  // commitElement(element) {
  //   this.finalizeElement(element)
  //   // Remove the newElement so they cannot be re-selected.
  //   element.remove()
  // }

  reserveElement(element) {
    element.remove()
  }

  finalizeElement(element) {
    // Rewrite per-request CSP nonces to match that of the current page.
    up.NonceableCallback.adoptNonces(element, this.cspNonces)

    if (this.scriptishNeedFix) {
      element.querySelectorAll('noscript, script').forEach(e.fixScriptish)
    }
  }

  static {
    // Cache since multiple plans will query this.
    u.memoizeMethod(this.prototype, {
      getHead: true,
    })
  }

}
