const u = up.util

up.Change.UpdateLayer = class UpdateLayer extends up.Change.Addition {

  constructor(options) {
    options = up.RenderOptions.finalize(options)
    super(options)
    this.layer = options.layer
    this.target = options.target
    this._context = options.context
    this._useKeep = options.useKeep
    // up.fragment.expandTargets() was already called by up.Change.FromContent
    this._steps = up.fragment.parseTargetSteps(this.target, this.options)
    // this.uid = Math.random()
  }

  getPreflightProps() {
    // This will throw up.CannotMatch if { target } cannot be found in { layer }.
    this._matchPreflight()

    return {
      layer: this.layer,
      mode: this.layer.mode,
      context: u.merge(this.layer.context, this._context),
      origin: this.options.origin,
      target: this._bestPreflightSelector(),
      fragments: this._getFragments(),
      newLayer: false
    }
  }

  _bestPreflightSelector() {
    this._matchPreflight()

    return up.fragment.targetForSteps(this._steps)
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

    onApplicable()

    if (this._steps.length) {
      // Don't log this.target since that does not include hungry elements
      up.puts('up.render()', `Updating "${this._bestPreflightSelector()}" in ${this.layer}`)
    } else {
      up.puts('up.render()', 'Nothing was rendered')
    }

    // Make sure only the first step will have scroll-related options.
    this._setScrollAndFocusOptions()

    if (this.options.saveScroll) {
      up.viewport.saveScroll({ layer: this.layer })
    }

    if (this.options.saveFocus) {
      up.viewport.saveFocus({ layer: this.layer })
    }

    if (this.options.peel) {
      // (1) Layer#peel() will manipulate the stack sync.
      //     We don't wait for the peeling animation to finish.
      //
      // (2) Closing a layer will also abort requests targeting that layer.
      //
      // (3) Only restore the base layer's history if the fragment update adds a
      //     history entry (issue #397).
      this.layer.peel({ history: !this._hasHistory() })
    }

    // Unless the user has explicitly opted out of the default { abort: 'target' }
    // by passing { abort: false }, we abort pending requests targeting
    // the elements that we're about to remove.
    if (this.options.abort !== false) {
      up.fragment.abort(this._getFragments(), { reason: 'Fragment is being replaced' })
    }

    Object.assign(this.layer.context, this._context)

    // Change history before compilation, so new fragments see the new location.
    if (this._hasHistory()) {
      this.layer.updateHistory(this.options)
    }

    for (let step of this._steps) {
      responseDoc.reserveElement(step.newElement)
    }

    // We execute steps on other layers first. If the render pass ends up closing this
    // layer (e.g. by reaching a close condition or X-Up-Accept-Layer) we want:
    //
    // (1) ... to use the discarded content for hungry elements on other layers that have [up-if-layer=any].
    // (2) ... to see updated hungry elements on other layers in onDismissed/onAccepted handlers.
    let otherLayerSteps = this._getHungrySteps().other
    let otherLayersResult = this.executeSteps(otherLayerSteps, responseDoc)

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
    this.handleLayerChangeRequests()

    let currentLayerSteps = this._steps.concat(this._getHungrySteps().current)
    let currentLayerResult = this.executeSteps(currentLayerSteps, responseDoc, this.options)

    // Don't wait for animations to finish.
    return up.RenderResult.both(currentLayerResult, otherLayersResult)
  }

  _matchPreflight() {
    this._steps = this._steps.filter((step) => {
      const finder = new up.FragmentFinder(step)
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

    this._steps = up.fragment.compressNestedSteps(this._steps)
  }

  _matchPostflight(responseDoc) {
    this._matchPreflight()

    this._steps = responseDoc.selectAndReserveSteps(this._steps)
  }

  _getHungrySteps() {
    // Find all [up-hungry] elements matching our layer and fragments.
    return up.radio.hungrySteps({
      layer: this.layer,
      history: this._hasHistory(),
      origin: this.options.origin,
      useHungry: this.options.useHungry,
    })
  }

  _setScrollAndFocusOptions() {
    // Store the focused element's selector, scroll position and selection range
    // in an up.FocusCapsule for later restoration.
    let focusCapsule = up.FocusCapsule.preserve(this.layer)

    this._steps.forEach((step, i) => {
      step.focusCapsule = focusCapsule

      // Since up.motion will call @handleScrollAndFocus() after each fragment,
      // and we only have a single scroll position and focus, only scroll/focus  for the first step.
      if (i > 0) {
        step.scroll = false
        step.focus = false
      }

      if ((step.placement === 'swap') || (step.placement === 'content')) {
        // We cannot animate scrolling when we're morphing between two elements.
        // The placements 'append', 'prepend' animate (instead of morphing) and can allow scrolling.
        step.scrollBehavior = 'instant'
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
    return u.some(oldFragments, up.fragment.hasAutoHistory)
  }

  static {
    u.memoizeMethod(this.prototype, {
      _matchPreflight: true,
      _matchPostflight: true,
      _hasHistory: true,
      _getHungrySteps: true,
    })
  }

}
