const u = up.util
const e = up.element

up.Change.UpdateLayer = class UpdateLayer extends up.Change.Addition {

  constructor(options) {
    options = up.RenderOptions.finalize(options)
    super(options)
    this.layer = options.layer
    this.target = options.target
    this.context = options.context
    this.useKeep = options.useKeep
    // up.fragment.expandTargets() was already called by up.Change.FromContent
    this.steps = up.fragment.parseTargetSteps(this.target, this.options)
    // this.uid = Math.random()
  }

  getPreflightProps() {
    // This will throw up.CannotMatch if { target } cannot be found in { layer }.
    this.matchPreflight()

    return {
      layer: this.layer,
      mode: this.layer.mode,
      context: u.merge(this.layer.context, this.context),
      origin: this.options.origin,
      target: this.bestPreflightSelector(),
      fragments: this.getFragments(),
    }
  }

  bestPreflightSelector() {
    this.matchPreflight()

    return u.map(this.steps, 'selector').join(', ') || ':none'
  }

  getFragments() {
    this.matchPreflight()

    return u.map(this.steps, 'oldElement')
  }

  execute(responseDoc, onApplicable) {
    this.responseDoc = responseDoc

    // For each step, find a step.alternative that matches in both the current page
    // and the response document.
    this.matchPostflight()

    onApplicable()

    if (this.steps.length) {
      // Don't log @target since that does not include hungry elements
      up.puts('up.render()', `Updating "${this.bestPreflightSelector()}" in ${this.layer}`)
    } else {
      up.puts('up.render()', 'Nothing was rendered')
    }

    this.options.title = this.improveHistoryValue(this.options.title, this.responseDoc.getTitle())

    // Make sure only the first step will have scroll-related options.
    this.setScrollAndFocusOptions()

    if (this.options.saveScroll) {
      up.viewport.saveScroll({ layer: this.layer })
    }

    if (this.options.saveFocus) {
      up.viewport.saveFocus({ layer: this.layer })
    }

    if (this.options.peel) {
      // Layer#peel() will manipulate the stack sync.
      // We don't wait for the peeling animation to finish.
      // Closing a layer will also abort requests targeting that layer.
      this.layer.peel()
    }

    // Unless the user has explicitly opted out of the default { abort: 'target' }
    // by passing { abort: false }, we abort pending requests targeting
    // the elements that we're about to remove.
    if (this.options.abort !== false) {
      up.fragment.abort(this.getFragments(), { reason: 'Fragment is being replaced' })
    }

    Object.assign(this.layer.context, this.context)

    // Change history before compilation, so new fragments see the new location.
    if (this.hasHistory()) {
      this.layer.updateHistory(this.options)
    }

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

    this.renderResult = new up.RenderResult({
      layer: this.layer,
      target: this.target,
    })

    // We swap fragments in reverse order for two reasons:
    //
    // (1) Only the first step will process focus. Other steps may cause focus loss
    //     (when they're swapping a fragment with focus), causing an option like
    //     { focus: 'main-if-lost' } to not satisfy the "lost" condition.
    // (2) Only the first step will scroll. However other steps may change
    //     the viewport height through element insertions.
    this.steps.reverse()

    const motionEndPromises = this.steps.map(step => this.executeStep(step))

    this.renderResult.finished = this.finish(motionEndPromises)

    // When rendering nothing we still want to proess { focus, scroll } options.
    if (!this.steps.length) {
      this.handleFocus(null, this.options)
      this.handleScroll(null, this.options)
    }

    // Don't wait for animations to finish.
    return this.renderResult
  }

  async finish(motionEndPromises) {
    await Promise.all(motionEndPromises)

    // If our layer was closed while animations are running, don't finish
    // and reject with an up.AbortError.
    this.abortWhenLayerClosed()

    // Resolve second promise for callers that need to know when animations are done.
    return this.renderResult
  }

  addToResult(fragment) {
    let newFragments = fragment.matches('up-wrapper') ? fragment.children : [fragment]

    // Since we're executing steps in reverse order we prepend the new fragment
    // to the beginning of the array. This way the elements will be in the order
    // that the user named them in their { target }.
    this.renderResult.fragments.unshift(...newFragments)
  }

  executeStep(step) {
    // Remember where the element came from to support up.reload(element).
    this.setReloadAttrs(step)

    switch (step.placement) {
      case 'swap': {
        let keepPlan = this.findKeepPlan(step)
        if (keepPlan) {
          // Since we're keeping the element that was requested to be swapped,
          // we won't be making changes to the DOM.

          this.handleFocus(step.oldElement, step)

          this.handleScroll(step.oldElement, step)

          // Don't add kept fragment to this.renderResult.

          return Promise.resolve()

        } else {
          // This needs to happen before up.syntax.clean() below.
          // Otherwise we would run destructors for elements we want to keep.
          this.preserveKeepables(step)

          // TODO: Don't suppport [up-keep] for direct children of <body>

          const parent = step.oldElement.parentNode

          const morphOptions = {
            ...step,
            beforeStart() {
              up.fragment.markAsDestroying(step.oldElement)
            },
            afterInsert: () => {
              this.responseDoc.finalizeElement(step.newElement)

              // step.keepPlans.forEach(this.reviveKeepable)
              this.restoreKeepables(step)

              // In the case of [up-keep] descendants, keepable elements are now transferred
              // to step.newElement, leaving a clone in their old DOM Position.
              // up.hello() is aware of step.keepPlans and will not compile kept elements a second time.
              up.hello(step.newElement, step)

              this.addToResult(step.newElement)
            },
            beforeDetach: () => {
              // In the case of [up-keep] descendants, keepable elements have been replaced
              // with a clone in step.oldElement. However, since that clone was never compiled,
              // it does not have destructors registered. Hence we will not clean the clone
              // unnecessarily.
              up.syntax.clean(step.oldElement, {layer: this.layer})
            },
            afterDetach() {
              up.element.cleanJQuery()
              up.fragment.emitDestroyed(step.oldElement, {parent, log: false})
            },
            scrollNew: () => {
              this.handleFocus(step.newElement, step)
              this.handleScroll(step.newElement, step)
            }
          }

          return up.morph(
            step.oldElement,
            step.newElement,
            step.transition,
            morphOptions
          )
        }
      }
      case 'content': {
        let oldWrapper = e.wrapChildren(step.oldElement)
        // oldWrapper.appendTo(step.oldElement)
        let newWrapper = e.wrapChildren(step.newElement)

        let wrapperStep = {
          ...step,
          placement: 'swap',
          oldElement: oldWrapper,
          newElement: newWrapper,
          focus: false
        }

        return this.executeStep(wrapperStep).then(() => {
          e.unwrap(newWrapper)
          // Unwrapping may destroy focus, so we need to handle it again.
          // Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
          this.handleFocus(step.oldElement, step)
        })

      }
      case 'before':
      case 'after': {
        // We're either appending or prepending. No keepable elements must be honored.

        // Text nodes are wrapped in an <up-wrapper> container so we can
        // animate them and measure their position/size for scrolling.
        // This is not possible for container-less text nodes.
        let wrapper = e.wrapChildren(step.newElement)

        // Note that since we're prepending/appending instead of replacing,
        // newElement will not actually be inserted into the DOM, only its children.
        let position = step.placement === 'before' ? 'afterbegin' : 'beforeend'
        step.oldElement.insertAdjacentElement(position, wrapper)

        this.responseDoc.finalizeElement(wrapper)
        up.hello(wrapper, step)

        this.addToResult(wrapper)

        this.handleFocus(wrapper, step)

        // Reveal element that was being prepended/appended.
        // Since we will animate (not morph) it's OK to allow animation of scrolling
        // if options.scrollBehavior is given.
        this.handleScroll(wrapper, step)

        // Since we're adding content instead of replacing, we'll only
        // animate newElement instead of morphing between oldElement and newElement
        return up.animate(wrapper, step.transition, step).then(() => e.unwrap(wrapper))
      }
      default: {
        up.fail('Unknown placement: %o', step.placement)
      }
    }
  }

  // Returns a object detailling a keep operation iff the given element is [up-keep] and
  // we can find a matching partner in newElement. Otherwise returns undefined.
  //
  // @param {Element} options.oldElement
  // @param {Element} options.newElement
  // @param {boolean} options.descendantsOnly
  findKeepPlan(options) {
    if (!this.useKeep) { return }

    const { oldElement, newElement } = options

    let doKeep = e.booleanAttr(oldElement, 'up-keep')
    // Early return if [up-keep=false]
    if (!doKeep) { return }

    let partner
    let partnerSelector = up.fragment.toTarget(oldElement)
    const lookupOpts = { layer: this.layer }

    if (options.descendantsOnly) {
      // Since newElement is from a freshly parsed HTML document, we could use
      // up.element functions to match the selector. However, since we also want
      // to use custom selectors like ":main" or "&" we use up.fragment.get().
      partner = up.fragment.get(newElement, partnerSelector, lookupOpts)
    } else {
      partner = up.fragment.subtree(newElement, partnerSelector, lookupOpts)[0]
    }

    // The partner must be matched, must be [up-keep], but not [up-keep=false]
    if (partner && e.booleanAttr(partner, 'up-keep')) {
      const plan = {
        oldElement, // the element that should be kept
        newElement: partner, // the element that would have replaced it but now does not
        newData: up.syntax.data(partner) // the parsed up-data attribute of the element we will discard
      }

      if (!up.fragment.emitKeep(plan).defaultPrevented) {
        return plan
      }
    }
  }

  // This will find all [up-keep] descendants in oldElement, overwrite their partner
  // element in newElement and leave a visually identical clone in oldElement for a later transition.
  // Returns an array of keepPlans.
  preserveKeepables(step) {
    const keepPlans = []
    if (this.useKeep) {
      for (let keepable of step.oldElement.querySelectorAll('[up-keep]')) {
        let keepPlan = this.findKeepPlan({ ...step, oldElement: keepable, descendantsOnly: true })
        if (keepPlan) {
          // Replace keepable with its clone so it looks good in a transition
          // between oldElement and newElement.
          const keepableClone = keepable.cloneNode(true)
          keepable.insertAdjacentElement('beforebegin', keepableClone)

          // Attaching a viewport to another element will cause it to loose
          // its scroll position, even if both parents are in the same document.
          let viewports = up.viewport.subtree(keepPlan.oldElement)
          keepPlan.revivers = viewports.map(function(viewport) {
            let cursorProps = up.viewport.copyCursorProps(viewport)
            return () => up.viewport.copyCursorProps(cursorProps, viewport)
          })

          if (this.willChangeElement(document.body)) {
            // Since we're going to swap the entire oldElement and newElement containers afterwards,
            // replace the matching element with keepable so it will eventually return to the DOM.
            keepPlan.newElement.replaceWith(keepable)
          } else {
            // If keepable is a media element, detaching it (or attaching it to another document) would cause it
            // to lose playback state. To avoid this we temporarily move the keepable (keepPlan.oldElement)
            // so it can remain attached while we swap fragment versions. We will move it to its place within
            // the new fragment version once the swap is complete.
            document.body.append(keepable)
          }

          // // Since we're going to swap the entire oldElement and newElement containers afterwards,
          // // replace the matching element with keepable so it will eventually return to the DOM.
          // keepPlan.newElement.replaceWith(keepable)
          keepPlans.push(keepPlan)
        }
      }
    }

    step.keepPlans = keepPlans
  }

  restoreKeepables(step) {
    for (let keepPlan of step.keepPlans) {
      // Now that we know the final destination of { newElement }, we can replace it with the keepable.
      keepPlan.newElement.replaceWith(keepPlan.oldElement)

      for (let reviver of keepPlan.revivers) {
        reviver()
      }
    }
  }

  matchPreflight() {
    this.filterSteps((step) => {
      const finder = new up.FragmentFinder(step)
      // Try to find fragments matching step.selector within step.layer.
      // Note that step.oldElement might already have been set by @parseSteps().
      step.oldElement ||= finder.find()

      if (step.oldElement) {
        return true
      } else if (!step.maybe) {
        throw this.cannotMatch(`Could not find element "${this.target}" in current page`)
      }
    })

    this.resolveOldNesting()
  }

  matchPostflight() {
    this.matchPreflight()

    // Only when we have a match in the required selectors, we
    // append the optional steps for [up-hungry] elements.
    if (this.options.useHungry) {
      this.addHungrySteps()
    }

    this.filterSteps((step) => {
      // The responseDoc has no layers.
      step.newElement = this.responseDoc.select(step.selector)

      if (step.newElement) {
        return true
      } else if (!step.maybe) {
        throw this.cannotMatch(`Could not find element "${this.target}" in server response`)
      }
    })

    this.resolveOldNesting()
  }

  filterSteps(condition) {
    this.steps = u.filter(this.steps, condition)
  }

  addHungrySteps() {
    // Find all [up-hungry] elements matching our layer and fragments.
    const hungrySolutions = up.radio.hungrySolutions({
      layer: this.layer,
      history: this.hasHistory(),
      origin: this.options.origin
    })

    for (let { element: oldElement, target: selector } of hungrySolutions) {
      const transition = e.booleanOrStringAttr(oldElement, 'transition')

      const step = {
        selector,
        oldElement,
        transition,
        placement: 'swap',
        maybe: true
      }
      this.steps.push(step)
    }
  }

  containedByRivalStep(steps, candidateStep) {
    return u.some(steps, function(rivalStep) {
      return (rivalStep !== candidateStep) &&
        ((rivalStep.placement === 'swap') || (rivalStep.placement === 'content')) &&
        rivalStep.oldElement.contains(candidateStep.oldElement)
    })
  }

  resolveOldNesting() {
    let compressed = u.uniqBy(this.steps, 'oldElement')
    compressed = u.reject(compressed, step => this.containedByRivalStep(compressed, step))
    this.steps = compressed
  }

  setScrollAndFocusOptions() {
    this.steps.forEach((step, i) => {
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

        // Store the focused element's selector, scroll position and selection range in an up.FocusCapsule
        // for later restoration.
      }
    })

    this.focusCapsule = up.FocusCapsule.preserve(this.layer)

  }

  handleFocus(fragment, options) {
    const fragmentFocus = new up.FragmentFocus({
      ...options,
      fragment,
      layer: this.layer,
      focusCapsule: this.focusCapsule,
      autoMeans: up.fragment.config.autoFocus,
    })
    return fragmentFocus.process(options.focus)
  }

  handleScroll(fragment, options) {
    const scrolling = new up.FragmentScrolling({
      ...options,
      fragment,
      layer: this.layer,
      autoMeans: up.fragment.config.autoScroll
    })
    return scrolling.process(options.scroll)
  }

  hasHistory() {
    return u.evalAutoOption(this.options.history, this.hasAutoHistory.bind(this))
  }

  hasAutoHistory() {
    // We update the history with { history: 'auto' } when at least
    // one targeted fragment has auto-history.
    const oldFragments = u.map(this.steps, 'oldElement')
    return u.some(oldFragments, up.fragment.hasAutoHistory)
  }

  willChangeElement(element) {
    return u.some(this.steps, (step) => step.oldElement.contains(element))
  }

  static {
    u.memoizeMethod(this.prototype, [
      'matchPreflight',
      'matchPostflight',
      'hasHistory',
    ])
  }

}
