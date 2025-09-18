const e = up.element

up.Layer.Root = class Root extends up.Layer {

  static mode = 'root'

  get element() {
    // Let's talk about our choice of @element for the root layer.
    //
    // 1. We don't want to use `document`, since that is for our global event bus.
    //    For instance, take a look how up.Change.CloseLayer emits the up:layer:dismiss
    //    event first on `@layer.element`, then on `document`.
    //    Also `document` is not really an element, just an event target.
    // 2. We might want but cannot use <body> element. Since Unpoly boots before
    //    the DOM is ready, document.body is still undefined. We also cannot delay
    //    booting until the DOM is ready, since by then all user-defined event listeners
    //    and compilers will have registered.
    // 3. That leaves the <html> element, which is available before the DOM is ready
    //    on Chrome, Firefox, IE11, Safari.
    // 4. A nice benefit of using <html> is that up.fragment.get('html', layer: 'root')
    //    will yield a result.
    // 5. Also it's nice that elements in the <head> also belong to the root layer.
    //    Otherwise they would not belong to any layer.
    //
    // We always return the current <html> instead of caching it,
    // since the developer might replace it with a new version.
    return e.root
  }

  constructor(options) {
    super(options)
    this.setupHandlers()
  }

  getFirstSwappableElement() {
    return document.body
  }

  static selector() {
    return 'html'
  }

  setupHandlers() {
    // When we reset the framework during tests, we might re-initialize this
    // layer with the same <html> element. In this case we do not want to
    // setup handlers more than once.
    if (!this.element.upHandlersApplied) {
      this.element.upHandlersApplied = true
      super.setupHandlers()
    }
  }

  sync() {
    // In case a fragment update has swapped the <html> element we need to re-apply
    // event handlers to the new <html> element.
    this.setupHandlers()
  }

  isAlive() {
    return true
  }

  accept() {
    this._cannotCloseRoot()
  }

  dismiss() {
    this._cannotCloseRoot()
  }

  _cannotCloseRoot() {
    up.fail('Cannot close the root layer')
  }

  toString() {
    return "root layer"
  }
}
