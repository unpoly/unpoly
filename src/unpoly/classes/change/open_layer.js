let u = up.util

up.Change.OpenLayer = class OpenLayer extends up.Change.Addition {

  constructor(options) {
    super(options)
    this.target = options.target
    this._origin = options.origin
    this._baseLayer = options.baseLayer
    // Don't extract too many @properties from @options, since listeners
    // to up:layer:open may modify layer options.
  }

  getPreflightProps() {
    // We assume that the server will respond with our target.
    // Hence this change will always be applicable.

    return {
      mode: this.options.mode,
      context: this._buildLayer().context,
      origin: this.options.origin,

      // The target will always exist in the current page, since
      // we're opening a new layer that will match the target.
      target: this.target,

      // We associate this request to our base layer so up:request events may be emitted on something
      // more specific than the document. This will also abort this request when
      // `up.fragment.abort({ layer })` is called for the base layer.
      layer: this._baseLayer,

      // We associate this request with the base layer's main element. This way the request
      // will be aborted if the base layer receives a major navigation, but not when a
      // minor fragment is updated.
      fragments: u.compact([up.fragment.get(':main', { layer: this._baseLayer })]),

      newLayer: true,
    }
  }

  execute(responseDoc, onApplicable) {
    this.responseDoc = responseDoc

    // Find our target in the responseDoc.
    // If it cannot be matched, up.CannotMatch is thrown and up.Change.FromContent will try the next plan.
    this._matchPostflight()

    // If our steps can be matched, up.Change.FromContent wants a chance to some final
    // preparations before we start rendering.
    onApplicable()

    // Create the overlay elements, but don't render content yet.
    this._createOverlay()

    // If our layer ends up being closed during rendering, we still want to render
    // [up-hungry][up-if-layer=any] elements on other layers.
    let unbindClosing = this.layer.on('up:layer:accepting up:layer:dimissing', this._renderOtherLayers.bind(this))
    try {
      this._renderOverlayContent()
      this._renderOtherLayers()
      return up.RenderResult.both(this._newOverlayResult, this._otherLayersResult)
    } finally {
      unbindClosing()
    }
  }

  _matchPostflight() {
    if (this.target === ':none') {
      this._content = document.createElement('up-none')
    } else {
      this._content = this.responseDoc.select(this.target)
    }

    if (!this._content || this._baseLayer.isClosed()) {
      // An error message will be chosen by up.Change.FromContent
      throw new up.CannotMatch()
    }
  }

  _createOverlay() {
    up.puts('up.render()', `Opening element "${this.target}" in new overlay`)

    this._assertOpenEventEmitted()

    this.layer = this._buildLayer()

    // (1) Make sure that the baseLayer layer doesn't already have a child layer.
    //     This cannot be prevented with { peel: false }, as the layer stack must be a sequence,
    //     not a tree.
    //
    // (2) Only restore the base layer's history if the new overlay does not add one of its own.
    //     Otherwise we would add an intermediate history entries when swapping overlays
    //     with { layer: 'swap' } (issue #397).
    this._baseLayer.peel({ history: !this.layer.history })

    // Don't wait for peeling to finish. Change the stack sync so there is no state
    // when the new overlay is scheduled to be pushed, but not yet in the stack.
    up.layer.stack.push(this.layer)

    this.layer.createElements()
    this.layer.setupHandlers()
  }

  _renderOverlayContent() {
    // (1) Change history before compilation, so new fragments see the new location.
    // (2) Change history before checking { acceptLocation, dismissLocation }, so we check the overlay's location and not the parent layer's location.
    this._handleHistory()

    // The server may trigger multiple signals that may cause the overlay to close immediately:
    //
    // - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    // - Emit an event with X-Up-Events, to which a listener may close the layer
    // - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    //   will close the layer.
    //
    // Note that @handleLayerChangeRequests() also calls throws an up.AbortError
    // if any of these options cause the layer to close.
    this.handleLayerChangeRequests()

    // Preprocess content element before insertion.
    this.responseDoc.commitElement(this._content)

    // Only if handleLayerChangeRequests() does not abort, we insert the content in the overlay.
    // If it does abort we want to use the content for [up-hungry][up-if-layer=any] elements
    // on background layers.
    this.layer.setContent(this._content)

    // Remember where the element came from to support up.reload(element).
    this.setReloadAttrs({ newElement: this._content, source: this.options.source })

    // Adopt CSP nonces and fix broken script tags
    this.responseDoc.finalizeElement(this._content)

    this._newOverlayResult = new up.RenderResult({
      layer: this.layer,
      fragments: [this._content],
      target: this.target,
    })

    // Compile the entire layer, not just the user content.
    // E.g. [up-dismiss] in the layer elements needs to go through a macro.
    up.hello(this.layer.element, { ...this.options, layer: this.layer })

    // Don't wait for the open animation to finish.
    // Otherwise a popup would start to open and only reveal itself after the animation.
    this._handleScroll()

    // This starts the open animation.
    // Resolve the RenderResult#finished promise for callers that need to know when animations are done.
    this._newOverlayResult.finished = this._finish()

    // Emit up:layer:opened to indicate that the layer was opened successfully.
    // This is a good time for listeners to manipulate the overlay optics.
    this.layer.opening = false
    this._emitOpenedEvent()

    // In case a listener to up:layer:opened immediately dimisses the new layer,
    // reject the promise returned by up.layer.open().
    this.abortWhenLayerClosed()
  }

  _renderOtherLayers() {
    // Can be called twice but most only execute once.
    if (this._otherLayersResult) return

    // We execute steps on other layers first. If the render pass ends up closing this
    // layer (e.g. by reaching a close condition or X-Up-Accept-Layer) we want:
    //
    // (1) ... to use the discarded content for hungry elements on other layers that have [up-if-layer=any].
    // (2) ... to see updated hungry elements on other layers in onDismissed/onAccepted handlers.
    let otherLayerSteps = this._getHungrySteps().other

    this._otherLayersResult = this.executeSteps(otherLayerSteps, this.responseDoc)
  }

  async _finish() {
    await this.layer.startOpenAnimation()

    // Don't change focus if the layer has been closed while the animation was running.
    this.abortWhenLayerClosed()

    // A11Y: Place the focus on the overlay element and setup a focus circle.
    // However, don't change focus if the layer has been closed while the animation was running.
    this._handleFocus()

    // The fulfillment value of the finished promise is the same as for the rendered promise.
    return this._newOverlayResult
  }

  _buildLayer() {
    // We need to mark the layer as { opening: true } so its topmost swappable element
    // does not resolve from the :layer pseudo-selector. Since :layer is a part of
    // up.fragment.config.mainTargets and :main is a part of fragment.config.autoHistoryTargets,
    // this would otherwise cause auto-history for *every* overlay regardless of initial target.
    const buildOptions = { ...this.options, opening: true }

    const beforeNew = optionsWithLayerDefaults => {
      return this.options = up.RenderOptions.finalize(optionsWithLayerDefaults)
    }

    return up.layer.build(buildOptions, beforeNew)
  }

  _handleHistory() {
    // If the layer is opened with { history } auto, the new overlay will from now
    // on have visible history *if* its initial fragment has auto-history.
    if (this.layer.history === 'auto') {
      this.layer.history = up.fragment.hasAutoHistory([this._content], this.layer)
    }

    let { parent } = this.layer

    // If an ancestor layer was opened with the wish to not affect history, this
    // child layer must not affect it either, regardless of its @history setting.
    this.layer.history &&= parent.history

    // The parent's saved history will be restored when this new overlay is closed.
    parent.saveHistory()

    // For the initial fragment insertion we always update its location, even if the layer
    // does not have visible history ({ history } attribute). This ensures that a
    // layer always has a #location.
    this.layer.updateHistory(this.options)
  }

  _handleFocus() {
    this._baseLayer.overlayFocus?.moveToBack()
    this.layer.overlayFocus.moveToFront()

    const fragmentFocus = new up.FragmentFocus({
      fragment: this._content,
      layer: this.layer,
      autoMeans: ['autofocus', 'layer'],
      focusDevice: this.options.focusDevice,
    })

    fragmentFocus.process(this.options.focus)
  }

  _handleScroll() {
    const scrollingOptions = {
      ...this.options,
      fragment: this._content,
      layer: this.layer,
      autoMeans: ['hash', 'layer']
    }
    const scrolling = new up.FragmentScrolling(scrollingOptions)
    scrolling.process(this.options.scroll)
  }

  _assertOpenEventEmitted() {
    // The initial up:layer:open event is emitted on the document, since the layer
    // element has not been attached yet and there is no obvious element it should
    // be emitted on. We don't want to emit it on @layer.parent.element since users
    // might confuse this with the event for @layer.parent itself opening.
    //
    // There is no { onOpen } or [up-on-open] handler to accompany the DOM event.
    up.event.assertEmitted('up:layer:open', {
      origin: this._origin,
      baseLayer: this._baseLayer, // sets up.layer.current
      layerOptions: this.options,
      log: "Opening new overlay"
    })
  }

  _emitOpenedEvent() {
    this.layer.emit('up:layer:opened', {
      origin: this._origin,
      callback: this.layer.callback('onOpened'),
      log: `Opened new ${this.layer}`
    }
    )
  }

  _getHungrySteps() {
    return up.radio.hungrySteps(this._getEffectiveRenderOptions())
  }

  _getEffectiveRenderOptions() {
    return {
      ...this.options,
      layer: this.layer,
      history: this.layer.history,
    }
  }

}
