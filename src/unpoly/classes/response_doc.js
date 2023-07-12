const u = up.util
const e = up.element

up.ResponseDoc = class ResponseDoc {

  constructor(options) {
    this.root =
      this.parseDocument(options) ||
      this.parseFragment(options) ||
      this.parseContent(options)

    // If the user doesn't want to run scripts in the new fragment, we disable all <script> elements.
    // While <script> elements parsed by `DOMParser` are inert anyway, we also parse HTML through
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

  parseDocument(options) {
    let document = this.parse(options.document, e.createBrokenDocumentFromHTML)
    if (document) {
      // Remember that we need to fix <script> and <noscript> elements later.
      // We could fix these elements right now for the entire document, but since we will only use
      // a fragment, this would cause excessive work.
      this.scriptishNeedFix = true

      return document
    }
  }

  parseContent(options) {
    // Parsing { inner } is the last option we try. It should always succeed in case someone
    // tries `up.layer.open()` without any args. Hence we set the innerHTML to an empty string.
    let content = options.content || ''
    let target = options.target || up.fail("must pass a { target } when passing { content }")

    target = u.map(up.fragment.parseTargetSteps(target), 'selector').join(',')

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

  parseFragment(options) {
    return this.parse(options.fragment)
  }

  parse(value, parseFn = e.createFromHTML) {
    if (u.isString(value)) {
      value = parseFn(value)
    }
    return value
  }

  rootSelector() {
    return up.fragment.toTarget(this.root)
  }

  getTitle() {
    // We query for 'head title' instead of 'title' so we won't match the <title>
    // of an inline SVG image.
    return this.root.querySelector('head title')?.textContent
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

  selectSteps(steps) {
    return steps.filter((step) => {
      // The responseDoc has no layers.
      step.newElement ||= this.select(step.selector)

      if (step.newElement) {
        return true
      } else if (!step.maybe) {
        // An error message will be chosen by up.Change.FromContent
        throw new up.CannotMatch()
      }
    })
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
    u.memoizeMethod(this.prototype, 'getTitle')
  }

}
