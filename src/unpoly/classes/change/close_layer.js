const u = up.util

up.Change.CloseLayer = class CloseLayer extends up.Change {

  constructor(options) {
    super(options)

    this._verb = options.verb
    this._layer = up.layer.get(options)
    this._origin = options.origin
    this._value = options.value
    this._preventable = options.preventable ?? true
    this._response = options.response
    this._history = options.history ?? true
  }

  execute() {
    // Closing a layer is a sync function.

    if (!this._layer.isOpen()) {
      return Promise.resolve()
    }

    up.browser.assertConfirmed(this.options)

    if (this._emitCloseEvent().defaultPrevented && this._preventable) {
      throw new up.Aborted('Close event was prevented')
    }

    this._emitClosingEvent()

    // Abort all pending requests targeting the layer we're now closing.
    up.fragment.abort({ reason: 'Layer is closing', layer: this._layer })

    // Remember the parent, which will no longer be accessible once we
    // remove @layer from the @stack.
    const { parent } = this._layer

    // Close any child-layers we might have.
    // We don't wait for peeling to finish, since changes that affect the
    // layer stack should happen sync:
    this._layer.peel()

    // Remove ourselves from the layer stack.
    this._layer.stack.remove(this._layer)

    if (this._history) {
      // Restore the history of the parent layer we just uncovered.
      parent.restoreHistory()
    }

    this._handleFocus(parent)

    this._layer.teardownHandlers()

    this._layer.destroyElements(this.options) // this will also pass the { onFinished } option

    this._emitClosedEvent(parent)
  }

  _emitCloseEvent() {
    // The close event is emitted on the layer that is about to close.
    let event = this._layer.emit(
      this._buildEvent(`up:layer:${this._verb}`), {
      callback: this._layer.callback(`on${u.upperCaseFirst(this._verb)}`),
      log: [`Will ${this._verb} ${this._layer} with value %o`, this._value]
    })

    // Allow an event listener to replace event.value with a new value.
    this._value = event.value

    return event
  }

  _emitClosingEvent() {
    let event = this._buildEvent(`up:layer:${this._verb}ing`)
    this._layer.emit(event, { log: false })
  }

  _emitClosedEvent(formerParent) {
    const verbPast = `${this._verb}ed`
    const verbPastUpperCaseFirst = u.upperCaseFirst(verbPast)

    // layer.emit({ ensureBubbles: true }) will automatically emit a second event on document
    // because the layer is detached. We do not want to emit it on the parent layer where users
    // might confuse it with an event for the parent layer itself. Since @layer.element
    // is now detached, the event will no longer bubble up to the document where global
    // event listeners can receive it. So we explicitly emit the event a second time
    // on the document.
    return this._layer.emit(
      this._buildEvent(`up:layer:${verbPast}`), {
        // Set up.layer.current to the parent of the closed layer, which is now likely
        // to be the front layer.
        baseLayer: formerParent,
        callback: this._layer.callback(`on${verbPastUpperCaseFirst}`),
        ensureBubbles: true,
        log: [`${verbPastUpperCaseFirst} ${this._layer} with value %o`, this._value]
      }
    )
  }

  _buildEvent(name) {
    return up.event.build(name, {
      layer: this._layer,
      value: this._value,
      origin: this._origin,
      response: this._response,
    })
  }

  _handleFocus(formerParent) {
    // A11Y: Stop trapping focus in the layer that's about to close
    this._layer.overlayFocus.teardown()
    // A11Y: Start trapping focus in the parent layer that is being promoted to front.

    formerParent.overlayFocus?.moveToFront()
    // A11Y: Focus the element that originally opened this layer.
    let newFocusElement = this._layer.origin || formerParent.element

    up.focus(newFocusElement, { preventScroll: true })
  }
}
