const u = up.util

up.Change.CloseLayer = class CloseLayer extends up.Change.Removal {

  constructor(options) {
    super(options)

    this.verb = options.verb
    this.layer = up.layer.get(options)
    this.origin = options.origin
    this.value = options.value
    this.preventable = options.preventable ?? true
  }

  execute() {
    // Closing a layer is a sync function.

    if (!this.layer.isOpen()) {
      return Promise.resolve()
    }

    up.browser.assertConfirmed(this.options)

    if (this.emitCloseEvent().defaultPrevented && this.preventable) {
      throw new up.Aborted('Close event was prevented')
    }

    // Abort all pending requests targeting the layer we're now closing.
    up.fragment.abort({ reason: 'Layer is closing', layer: this.layer })

    // Remember the parent, which will no longer be accessible once we
    // remove @layer from the @stack.
    const { parent } = this.layer

    // Close any child-layers we might have.
    // We don't wait for peeling to finish, since changes that affect the
    // layer stack should happen sync:
    this.layer.peel()

    // Remove ourselves from the layer stack.
    this.layer.stack.remove(this.layer)

    // Restore the history of the parent layer we just uncovered.
    parent.restoreHistory()

    this.handleFocus(parent)

    this.layer.teardownHandlers()
    this.layer.destroyElements(this.options) // this will also pass the { onFinished } option

    this.emitClosedEvent(parent)
  }

  emitCloseEvent() {
    // The close event is emitted on the layer that is about to close.
    let event = this.layer.emit(
      this.buildEvent(`up:layer:${this.verb}`), {
      callback: this.layer.callback(`on${u.upperCaseFirst(this.verb)}`),
      log: [`Will ${this.verb} ${this.layer} with value %o`, this.value]
    })

    // Allow an event listener to replace event.value with a new value.
    this.value = event.value

    return event
  }

  emitClosedEvent(formerParent) {
    const verbPast = `${this.verb}ed`
    const verbPastUpperCaseFirst = u.upperCaseFirst(verbPast)

    // layer.emit({ ensureBubbles: true }) will automatically emit a second event on document
    // because the layer is detached. We do not want to emit it on the parent layer where users
    // might confuse it with an event for the parent layer itself. Since @layer.element
    // is now detached, the event will no longer bubble up to the document where global
    // event listeners can receive it. So we explicitly emit the event a second time
    // on the document.
    return this.layer.emit(
      this.buildEvent(`up:layer:${verbPast}`), {
        // Set up.layer.current to the parent of the closed layer, which is now likely
        // to be the front layer.
        baseLayer: formerParent,
        callback: this.layer.callback(`on${verbPastUpperCaseFirst}`),
        ensureBubbles: true,
        log: [`${verbPastUpperCaseFirst} ${this.layer} with value %o`, this.value]
      }
    )
  }

  buildEvent(name) {
    return up.event.build(name, {
      layer: this.layer,
      value: this.value,
      origin: this.origin
    })
  }

  handleFocus(formerParent) {
    // A11Y: Stop trapping focus in the layer that's about to close
    this.layer.overlayFocus.teardown()
    // A11Y: Start trapping focus in the parent layer that is being promoted to front.

    formerParent.overlayFocus?.moveToFront()
    // A11Y: Focus the element that originally opened this layer.
    let newFocusElement = this.layer.origin || formerParent.element
    newFocusElement.focus({ preventScroll: true })
  }
}
