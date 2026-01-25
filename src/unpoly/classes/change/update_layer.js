const u = up.util

up.Change.UpdateLayer = class UpdateLayer extends up.Change.Addition {

  constructor(options) {
    options = up.RenderOptions.finalize(options)
    super(options)
    this.layer = options.layer
    this.target = options.target
    this._context = options.context
    // up.fragment.expandTargets() was already called by up.Change.FromContent
    this._steps = up.fragment.parseTargetSteps(this.target, this.options)
    // this.uid = Math.random()
  }

  getPreflightProps() {
    // This will throw up.CannotMatch if { target } cannot be found in { layer }.
    this._matchPreflight()

    let fragments = this._getFragments()

    return {
      layer: this.layer,
      bindLayer: this.layer,
      mode: this.layer.mode,
      context: u.merge(this.layer.context, this._context),
      origin: this.options.origin,
      target: this._bestPreflightSelector(),
      fragments,
      bindFragments: fragments,
    }
  }

  _bestPreflightSelector() {
    this._matchPreflight()

    const isProbable = (step) => !step.maybe || step.oldElement?.isConnected
    let bestSteps = this._steps.filter(isProbable)
    let selectors = u.map(bestSteps, 'selector')
    return selectors.join(', ') || ':none'
  }

  _getFragments() {
    this._matchPreflight()

    return u.map(this._steps, 'oldElement')
  }

  execute(responseDoc, onApplicable) {
    // (1) For each step, find a `step.newElement` that matches both in this.layer
    //     and in the response document.
    // (2) Match newElements here instead of relying on up.Change.UpdateSteps to
    //     do it later. This way we will throw up.CannotMatch early, and our caller
    //     up.Change.FromContent knows that this plan is not applicable. It can then
    //     try a fallback plan.
    this._matchPostflight(responseDoc)

    // If our steps can be matched, up.Change.FromContent wants a chance to some final
    // preparations before we start rendering.
    onApplicable()

    // If our layer ends up being closed during rendering, we still want to render
    // [up-hungry][up-if-layer=any] elements on other layers.
    let renderOtherLayersOnce = u.memoize(() => this._renderOtherLayers(responseDoc))

    // TODO: Can this be a try ... catch ?
    let unbindClosing = this.layer.on('up:layer:accepting up:layer:dismissing', renderOtherLayersOnce)
    try {
      let partialResults = [
        ...this._renderCurrentLayer(responseDoc),
        ...renderOtherLayersOnce(),
      ]

      return new up.RenderResult({
        target: this.target,
        layer: this.layer,
        renderOptions: this.options,
        partialResults,
      })
    } finally {
      unbindClosing()
    }
  }

  _renderCurrentLayer(responseDoc) {
    if (this._steps.length) {
      // Don't log this.target since that does not include hungry elements
      up.puts('up.render()', `Updating "${this._bestPreflightSelector()}" in ${this.layer}`)
    }

    // Make sure only the first step will have scroll-related options.
    this._coordinateSteps()

    if (this.options.saveScroll) {
      up.viewport.saveScroll({ layer: this.layer })
    }

    if (this.options.saveFocus) {
      // TODO: This creates the same up.FocusCapsule that we already built in _setScrollAndFocusOption()
      up.viewport.saveFocus({ layer: this.layer })
    }

    let { peel } = this.options
    if (peel) {
      // (1) Layer#peel() will manipulate the stack sync.
      //     We don't wait for the peeling animation to finish.
      //
      // (2) Closing a layer will also abort requests targeting that layer.
      //
      // (3) Only restore the base layer's history if the fragment update adds a
      //     history entry (issue #397).
      this.layer.peel({ history: !this._hasHistory(), intent: peel })
    }

    // Unless the user has explicitly opted out of the default { abort: 'target' }
    // by passing { abort: false }, we abort pending requests targeting
    // the elements that we're about to remove.
    if (this.options.abort !== false) {
      up.fragment.abort(this._getFragments(), {
        reason: 'Fragment is being replaced',
        jid: this.options.jid,
      })
    }

    Object.assign(this.layer.context, this._context)

    // Change history before compilation, so new fragments see the new location.
    if (this._hasHistory()) {
      this.layer.updateHistory(this.options)
    }

    // If the update causes the overlay to close, we don't want to render changes.
    //
    // The server may trigger multiple signals that may cause the layer to close:
    //
    // - Close the layer directly through X-Up-Accept-Layer or X-Up-Dismiss-Layer
    // - Event an event with X-Up-Events, to which a listener may close the layer
    // - Update the location to a URL for which { acceptLocation } or { dismissLocation }
    //   will close the layer.
    //
    // Note that @handleLayerChangeRequests() also throws an `up.AbortError`
    // if any of these options cause the layer to close.
    this.handleLayerChangeRequests(u.map(this._steps, 'newElement'))

    return this.executeSteps({
      steps: this._steps,
      noneOptions: this.options,
      responseDoc,
    })
  }

  _renderOtherLayers(responseDoc) {
    // We execute steps on other layers first. If the render pass ends up closing this
    // layer (e.g. by reaching a close condition or X-Up-Accept-Layer) we want:
    //
    // (1) ... to use the discarded content for hungry elements on other layers that have [up-if-layer=any].
    // (2) ... to see updated hungry elements on other layers in onDismissed/onAccepted handlers.
    let otherLayerSteps = this._getHungrySteps().other

    return this.executeSteps({
      steps: otherLayerSteps,
      responseDoc,
    })
  }

  _matchPreflight() {
    this._matchOldElements()
    this._compressNestedSteps()
  }

  _matchPostflight(responseDoc) {
    this._matchOldElements()
    this._addHungryStepsOnCurrentLayer()
    this._compressNestedSteps()
    this._matchNewElements(responseDoc)
  }

  _addHungryStepsOnCurrentLayer() {
    this._steps.push(...this._getHungrySteps().current)
  }

  _matchOldElements() {
    this._steps = this._steps.filter((step) => {

      const finder = new up.FragmentFinder(u.pick(step, ['selector', 'origin', 'layer', 'match', 'preferOldElements']))

      // Try to find fragments matching step.selector within step.layer.
      // Note that step.oldElement might already have been set by up.radio.hungrySteps().
      step.oldElement ||= finder.find()

      if (step.oldElement) {
        return true
      } else if (!step.maybe) {
        // An error message will be chosen by up.Change.FromContent
        throw new up.CannotMatch()
      }
    })
  }

  _matchNewElements(responseDoc) {
    this._steps = responseDoc.selectSteps(this._steps)
  }

  _compressNestedSteps() {
    this._steps = up.fragment.compressNestedSteps(this._steps)
  }

  _getHungrySteps() {
    // Find all [up-hungry] elements matching our layer and fragments.
    return up.radio.hungrySteps(this._getEffectiveRenderOptions())
  }

  _coordinateSteps() {
    // Store the focused element's selector, scroll position and selection range
    // in an up.FocusCapsule for later restoration.
    let focusCapsule = up.FocusCapsule.preserve(this.layer)
    let oldScrollTops = up.viewport.getScrollTops({ layer: this.layer })

    this._steps.forEach((step, i) => {
      step.focusCapsule = focusCapsule
      step.oldScrollTops = oldScrollTops

      // A { scrollMap } option always overrides a { scroll } option.
      if (step.scrollMap) step.scroll = false

      // Since up.motion will call @handleScrollAndFocus() after each fragment,
      // and we only have a single scroll position and focus, only scroll/focus for the first step.
      if (i > 0) {
        step.focus = false
        step.scrollMap = undefined
        // The only option we apply to all fragments is { scroll: 'keep' }.
        if (step.scroll !== 'keep') step.scroll = false

        // Data is only applied to the primary target.
        // To override data for secondary or hungry targets, use { dataMap }.
        step.data = undefined
      }
    })
  }

  _hasHistory() {
    return u.evalAutoOption(this.options.history, this._hasAutoHistory.bind(this))
  }

  _hasAutoHistory() {
    // We update the history with { history: 'auto' } when at least
    // one targeted fragment has auto-history.
    const oldFragments = u.map(this._steps, 'oldElement')
    return up.fragment.hasAutoHistory(oldFragments, this.layer)
  }

  _getEffectiveRenderOptions() {
    return {
      ...this.options,
      layer: this.layer,
      history: this._hasHistory(),
    }
  }

  static {
    u.memoizeMethod(this.prototype, {
      _matchPreflight: true,
      _matchOldElements: true,
      _hasHistory: true,
      _getHungrySteps: true,
    })
  }

}
