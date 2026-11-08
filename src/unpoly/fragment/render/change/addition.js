const u = up.util
const e = up.element

up.Change.Addition = class Addition extends up.Change {

  constructor(options) {
    super(options)
    this._acceptLayer = options.acceptLayer
    this._dismissLayer = options.dismissLayer
    this._eventPlans = options.eventPlans || []
    this._response = options.response
  }

  // TODO: Consider moving this to up.Layer.Base
  handleLayerChangeRequests(newElements, newLocation) {
    if (this.layer.isOverlay()) {
      // TODO: Can we do this with "close"? Please recheck

      // The server may send an HTTP header `X-Up-Accept-Layer: value`
      this._tryAcceptLayerFromServer()
      this.layer.assertAlive()

      // A close condition { acceptLocation: '/path' } might have been
      // set when the layer was opened.
      this.layer.tryAcceptForLocation(newLocation, this._response)
      this.layer.assertAlive()

      this.layer.tryAcceptForElements(newElements, this._response)
      this.layer.assertAlive()

      // The server may send an HTTP header `X-Up-Dismiss-Layer: value`
      this._tryDismissLayerFromServer()
      this.layer.assertAlive()

      // A close condition { dismissLocation: '/path' } might have been
      // set when the layer was opened.
      this.layer.tryDismissForLocation(newLocation, this._response)
      this.layer.assertAlive()

      this.layer.tryDismissForElements(newElements, this._response)
      this.layer.assertAlive()
    }

    // On the server we support up.layer.emit('foo'), which sends:
    //
    //     X-Up-Events: [{ layer: 'current', type: 'foo'}]
    //
    // We must set the current layer to @layer so { layer: 'current' } will emit on
    // the layer that is being updated, instead of the front layer.
    //
    // A listener to such a server-sent event might also close the layer.
    this.layer.asCurrent(() => {
      for (let eventPlan of this._eventPlans) {
        up.emit({ ...eventPlan, response: this._response })
        this.layer.assertAlive()
      }
    })
  }

  _tryAcceptLayerFromServer() {
    // When accepting without a value, the server will send X-Up-Accept-Layer: null
    if (u.isDefined(this._acceptLayer)) {
      this.layer.accept(this._acceptLayer, { response: this._response })
    }
  }

  _tryDismissLayerFromServer() {
    // When dismissing without a value, the server will send X-Up-Dismiss-Layer: null
    if (u.isDefined(this._dismissLayer)) {
      this.layer.dismiss(this._dismissLayer, { response: this._response })
    }
  }

  _setSource({ oldElement, newElement, source }) {
    // (1) When the server responds with an error, or when the request method is not
    //     reloadable (not GET), we keep the same source as before.
    // (2) Don't set a source if someone tries to 'keep' when opening a new layer
    if (source === 'keep') {
      source = (oldElement && up.fragment.source(oldElement))
    }

    // (1) Don't set a source if { false } is passed.
    // (2) Don't set a source if the element HTML already has an [up-source] attribute.
    // (3) Don't use u.matchableURL() here. We need to keep a trailing slash
    //     to support backends that care about trailing slashes.
    if (source) {
      e.setMissingAttr(newElement, 'up-source', up.fragment.normalizeSource(source))
    }
  }

  _setTime({ newElement, time }) {
    // If the server didn't send a Last-Modified header, tag the element
    // with [up-time=false] to indicate that we cannot use an ancestor's [up-time].
    e.setMissingAttr(newElement, 'up-time', time ? time.toUTCString() : false)
  }

  _setETag({ newElement, etag }) {
    // If the server didn't send an Etag header, tag the element
    // with [up-etag=false] to indicate that we cannot use an ancestor's [up-etag].
    e.setMissingAttr(newElement, 'up-etag', etag || false)
  }

  setReloadAttrs(options) {
    this._setSource(options)
    this._setTime(options)
    this._setETag(options)
  }

  executeSteps({ steps, responseDoc, noneOptions }) {
    return new up.Change.UpdateSteps({ steps, noneOptions }).execute(responseDoc)
  }

}
