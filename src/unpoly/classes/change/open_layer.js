up.Change.OpenLayer = class OpenLayer extends up.Change.Addition {

  constructor(options) {
    super(options)
    this.target = options.target
    this.origin = options.origin
    this.baseLayer = options.baseLayer
    // Don't extract too many @properties from @options, since listeners
    // to up:layer:open may modify layer options.
  }

  getPreflightProps() {
    // We assume that the server will respond with our target.
    // Hence this change will always be applicable.

    return {
      mode: this.options.mode,
      context: this.buildLayer().context,
      origin: this.options.origin,

      // The target will always exist in the current page, since
      // we're opening a new layer that will match the target.
      target: this.target,

      // We associate this request to our base layer so up:request events may be emitted on something
      // more specific than the document. This will also abort this request when
      // `up.fragment.abort({ layer })` is called for the base layer.
      layer: this.baseLayer,

      // We associate this request with the base layer's main element. This way the request
      // will be aborted if the base layer receives a major navigation, but not when a
      // minor fragment is updated.
      targetElements: u.compact([up.fragment.get(':main', { layer: this.baseLayer })]),
    }
  }

  // bestPreflightSelector() {
  //   // We assume that the server will respond with our target.
  //   return this.target
  // }

  execute(responseDoc, onApplicable) {
    if (this.target === ':none') {
      this.content = document.createElement('up-none')
    } else {
      this.content = responseDoc.select(this.target)
    }

    if (!this.content || this.baseLayer.isClosed()) {
      throw this.notApplicable()
    }

    onApplicable()
    up.puts('up.render()', `Opening element "${this.target}" in new overlay`)

    this.options.title = this.improveHistoryValue(this.options.title, responseDoc.getTitle())

    if (this.emitOpenEvent().defaultPrevented) {
      // We cannot use @abortWhenLayerClosed() here,
      // because the layer is not even in the stack yet.
      throw up.error.aborted('Open event was prevented')
    }

    // Make sure that the baseLayer layer doesn't already have a child layer.
    // Note that this cannot be prevented with { peel: false }!
    // We don't wait for the peeling to finish.
    this.baseLayer.peel()

    // Change the stack sync. Don't wait for peeling to finish.
    this.layer = this.buildLayer()
    up.layer.stack.push(this.layer)

    this.layer.createElements(this.content)
    this.layer.setupHandlers()

    // Change history before compilation, so new fragments see the new location.
    this.handleHistory()

    // Remember where the element came from to support up.reload(element).
    this.setMeta({ newElement: this.content, source: this.options.source })

    // Unwrap <noscript> tags
    responseDoc.finalizeElement(this.content)

    // Compile the entire layer, not just the user content.
    // E.g. [up-dismiss] in the layer elements needs to go through a macro.
    up.hello(this.layer.element, { layer: this.layer, origin: this.origin })

    let renderResult = new up.RenderResult({
      layer: this.layer,
      fragments: [this.content],
      target: this.target
    })

    // The server may trigger multiple signals that may cause the layer to close:
    //
    // - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    // - Emit an event with X-Up-Events, to which a listener may close the layer
    // - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    //   will close the layer.
    //
    // Note that @handleLayerChangeRequests() also calls throws an up.error.aborted
    // if any of these options cause the layer to close.
    this.handleLayerChangeRequests()

    // Don't wait for the open animation to finish.
    // Otherwise a popup would start to open and only reveal itself after the animation.
    this.handleScroll()

    this.layer.startOpenAnimation().then(() => {
      // A11Y: Place the focus on the overlay element and setup a focus circle.
      // However, don't change focus if the layer has been closed while the animation was running.
      if (this.layer.isOpen()) {
        this.handleFocus()
      }

      // Run callbacks for callers that need to know when animations are done.
      this.onFinished(renderResult)
    })

    // Emit up:layer:opened to indicate that the layer was opened successfully.
    // This is a good time for listeners to manipulate the overlay optics.
    this.layer.opening = false
    this.emitOpenedEvent()

    // In case a listener to up:layer:opened immediately dimisses the new layer,
    // reject the promise returned by up.layer.open().
    this.abortWhenLayerClosed()

    // Resolve the promise with the layer instance, so callers can do:
    //
    //     layer = await up.layer.open(...)
    //
    // Don't wait to animations to finish:
    return renderResult
  }

  buildLayer() {
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

  handleHistory() {
    if (this.layer.history === 'auto') {
      this.layer.history = up.fragment.hasAutoHistory(this.content)
    }

    this.layer.parent.saveHistory()

    // For the initial fragment insertion we always update history, even if the layer
    // does not have visible history ({ history } attribute). This ensures that a
    // layer always has a #location.
    this.layer.updateHistory(this.options)
  }

  handleFocus() {
    this.baseLayer.overlayFocus?.moveToBack()
    this.layer.overlayFocus.moveToFront()

    const fragmentFocus = new up.FragmentFocus({
      fragment: this.content,
      layer: this.layer,
      autoMeans: ['autofocus', 'layer']
    })
    fragmentFocus.process(this.options.focus)
  }

  handleScroll() {
    const scrollingOptions = {
      ...this.options,
      fragment: this.content,
      layer: this.layer,
      autoMeans: ['hash', 'layer']
    }
    const scrolling = new up.FragmentScrolling(scrollingOptions)
    scrolling.process(this.options.scroll)
  }

  emitOpenEvent() {
    // The initial up:layer:open event is emitted on the document, since the layer
    // element has not been attached yet and there is no obvious element it should
    // be emitted on. We don't want to emit it on @layer.parent.element since users
    // might confuse this with the event for @layer.parent itself opening.
    //
    // There is no @layer.onOpen() handler to accompany the DOM event.
    return up.emit('up:layer:open', {
      origin: this.origin,
      baseLayer: this.baseLayer, // sets up.layer.current
      layerOptions: this.options,
      log: "Opening new overlay"
    })
  }

  emitOpenedEvent() {
    return this.layer.emit('up:layer:opened', {
      origin: this.origin,
      callback: this.layer.callback('onOpened'),
      log: `Opened new ${this.layer}`
    }
    )
  }
}
