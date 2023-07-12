const u = up.util
const e = up.element

up.Change.Addition = class Addition extends up.Change {

  constructor(options) {
    super(options)
    this.responseDoc = options.responseDoc
    this.acceptLayer = options.acceptLayer
    this.dismissLayer = options.dismissLayer
    this.eventPlans = options.eventPlans || []
    this.response = options.meta?.response
  }

  handleLayerChangeRequests() {
    if (this.layer.isOverlay()) {
      // The server may send an HTTP header `X-Up-Accept-Layer: value`
      this.tryAcceptLayerFromServer()
      this.abortWhenLayerClosed()

      // A close condition { acceptLocation: '/path' } might have been
      // set when the layer was opened.
      this.layer.tryAcceptForLocation(this.responseOption())
      this.abortWhenLayerClosed()

      // The server may send an HTTP header `X-Up-Dismiss-Layer: value`
      this.tryDismissLayerFromServer()
      this.abortWhenLayerClosed()

      // A close condition { dismissLocation: '/path' } might have been
      // set when the layer was opened.
      this.layer.tryDismissForLocation(this.responseOption())
      this.abortWhenLayerClosed()
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
      for (let eventPlan of this.eventPlans) {
        up.emit({ ...eventPlan, ...this.responseOption() })
        this.abortWhenLayerClosed()
      }
    })
  }

  tryAcceptLayerFromServer() {
    // When accepting without a value, the server will send X-Up-Accept-Layer: null
    if (u.isDefined(this.acceptLayer) && this.layer.isOverlay()) {
      this.layer.accept(this.acceptLayer, this.responseOption())
    }
  }

  tryDismissLayerFromServer() {
    // When dismissing without a value, the server will send X-Up-Dismiss-Layer: null
    if (u.isDefined(this.dismissLayer) && this.layer.isOverlay()) {
      this.layer.dismiss(this.dismissLayer, this.responseOption())
    }
  }

  abortWhenLayerClosed(layer = this.layer) {
    if (layer.isClosed()) {
      // Wind up the call stack. Whoever has closed the layer will also clean up
      // elements, handlers, etc.
      throw new up.Aborted('Layer was closed')
    }
  }

  setSource({ oldElement, newElement, source }) {
    // (1) When the server responds with an error, or when the request method is not
    //     reloadable (not GET), we keep the same source as before.
    // (2) Don't set a source if someone tries to 'keep' when opening a new layer
    if (source === 'keep') {
      source = (oldElement && up.fragment.source(oldElement))
    }

    // (1) Don't set a source if { false } is passed.
    // (2) Don't set a source if the element HTML already has an [up-source] attribute.
    if (source) {
      e.setMissingAttr(newElement, 'up-source', u.normalizeURL(source, { hash: false }))
    }
  }

  setTime({ newElement, time }) {
    // If the server didn't send a Last-Modified header, tag the element
    // with [up-time=false] to indicate that we cannot use an ancestor's [up-time].
    e.setMissingAttr(newElement, 'up-time', time ? time.toUTCString() : false)
  }

  setETag({ newElement, etag }) {
    // If the server didn't send an Etag header, tag the element
    // with [up-etag=false] to indicate that we cannot use an ancestor's [up-etag].
    e.setMissingAttr(newElement, 'up-etag', etag || false)
  }

  setReloadAttrs(options) {
    this.setSource(options)
    this.setTime(options)
    this.setETag(options)
  }

  responseOption() {
    return { response: this.response }
  }

}
