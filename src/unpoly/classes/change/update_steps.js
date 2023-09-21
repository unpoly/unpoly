const u = up.util
const e = up.element

up.Change.UpdateSteps = class UpdateSteps extends up.Change.Addition {

  constructor(options) {
    super(options)

    this._noneOptions = options.noneOptions || {}
    this._steps = u.copy(options.steps) // we mutate it below
  }

  execute(responseDoc) {
    this.responseDoc = responseDoc

    // Fill in `step.newElement` unless it was already done by our caller.
    // This may throw up.CannotMatch for non-optional steps that don't match in `responseDoc`.
    this._steps = responseDoc.selectAndReserveSteps(this._steps)

    if (!this._steps.length) {
      return this._executeNone()
    }

    this.renderResult = new up.RenderResult({
      layer: this._steps[0]?.layer,
      target: up.fragment.targetForSteps(this._steps),
    })

    // We swap fragments in reverse order for two reasons:
    //
    // (1) Only the first step will process focus. Other steps may cause focus loss
    //     (when they're swapping a fragment with focus), causing an option like
    //     { focus: 'main-if-lost' } to not satisfy the "lost" condition.
    // (2) Only the first step will scroll. However other steps may change
    //     the viewport height through element insertions.
    this._steps.reverse()

    const motionEndPromises = this._steps.map(step => this._executeStep(step))
    this.renderResult.finished = this._finish(motionEndPromises)

    return this.renderResult
  }

  _executeNone() {
    // When rendering nothing we still want to process { focus, scroll } options.
    this._handleFocus(null, this._noneOptions)
    this._handleScroll(null, this._noneOptions)
    return up.RenderResult.buildNone()
  }

  async _finish(motionEndPromises) {
    await Promise.all(motionEndPromises)

    // If our layer was closed while animations are running, don't finish
    // and reject with an up.AbortError.
    for (let step of this._steps) {
      this.abortWhenLayerClosed(step.layer)
    }

    // The RenderResult has not changed. We still updated the same target and fragments.
    // We only want to signal the time of the end of animations / DOM changes.
    return this.renderResult
  }

  _addToResult(fragment) {
    let newFragments = fragment.matches('up-wrapper') ? fragment.children : [fragment]

    // Since we're executing steps in reverse order we prepend the new fragment
    // to the beginning of the array. This way the elements will be in the order
    // that the user named them in their { target }.
    this.renderResult.fragments.unshift(...newFragments)
  }

  _executeStep(step) {
    // Remember where the element came from to support up.reload(element).
    this.setReloadAttrs(step)

    switch (step.placement) {
      case 'swap': {
        let keepPlan = this._findKeepPlan(step)
        if (keepPlan) {
          // Since we're keeping the element that was requested to be swapped,
          // we won't be making changes to the DOM.

          this._handleFocus(step.oldElement, step)
          this._handleScroll(step.oldElement, step)

          // Don't add kept fragment to this.renderResult.

          return Promise.resolve()

        } else {
          // This needs to happen before up.script.clean() below.
          // Otherwise we would run destructors for elements we want to keep.
          this._preserveKeepables(step)

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
              this._restoreKeepables(step)

              // In the case of [up-keep] descendants, keepable elements are now transferred
              // to step.newElement, leaving a clone in their old DOM Position.
              // up.hello() is aware of step.keepPlans and will not compile kept elements a second time.
              up.hello(step.newElement, step)

              this._addToResult(step.newElement)
            },
            beforeDetach: () => {
              // In the case of [up-keep] descendants, keepable elements have been replaced
              // with a clone in step.oldElement. However, since that clone was never compiled,
              // it does not have destructors registered. Hence we will not clean the clone
              // unnecessarily.
              up.script.clean(step.oldElement, { layer: step.layer })
            },
            afterDetach() {
              up.element.cleanJQuery()
              up.fragment.emitDestroyed(step.oldElement, {parent, log: false})
            },
            scrollNew: () => {
              this._handleFocus(step.newElement, step)
              this._handleScroll(step.newElement, step)
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

        return this._executeStep(wrapperStep).then(() => {
          e.unwrap(newWrapper)
          // Unwrapping may destroy focus, so we need to handle it again.
          // Since we never inserted step.newElement (only its children), we handle focus on step.oldElement.
          this._handleFocus(step.oldElement, step)
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

        this._addToResult(wrapper)

        this._handleFocus(wrapper, step)

        // Reveal element that was being prepended/appended.
        // Since we will animate (not morph) it's OK to allow animation of scrolling
        // if options.scrollBehavior is given.
        this._handleScroll(wrapper, step)

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
  _findKeepPlan(options) {
    if (!options.useKeep) { return }

    const { oldElement, newElement } = options

    let doKeep = e.booleanAttr(oldElement, 'up-keep')
    // Early return if [up-keep=false]
    if (!doKeep) { return }

    let partner
    let partnerSelector = up.fragment.toTarget(oldElement)
    const lookupOpts = { layer: options.layer }

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
        newData: up.script.data(partner) // the parsed up-data attribute of the element we will discard
      }

      if (!up.fragment.emitKeep(plan).defaultPrevented) {
        return plan
      }
    }
  }

  // This will find all [up-keep] descendants in oldElement, overwrite their partner
  // element in newElement and leave a visually identical clone in oldElement for a later transition.
  // Returns an array of keepPlans.
  _preserveKeepables(step) {
    const keepPlans = []
    if (step.useKeep) {
      for (let keepable of step.oldElement.querySelectorAll('[up-keep]')) {
        let keepPlan = this._findKeepPlan({ ...step, oldElement: keepable, descendantsOnly: true })
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

          if (this._willChangeElement(document.body)) {
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

  _restoreKeepables(step) {
    for (let keepPlan of step.keepPlans) {
      // Now that we know the final destination of { newElement }, we can replace it with the keepable.
      keepPlan.newElement.replaceWith(keepPlan.oldElement)

      for (let reviver of keepPlan.revivers) {
        reviver()
      }
    }
  }

  _willChangeElement(element) {
    return u.some(this._steps, (step) => step.oldElement.contains(element))
  }

  _handleFocus(fragment, options) {
    const fragmentFocus = new up.FragmentFocus({
      ...options,
      fragment,
      autoMeans: up.fragment.config.autoFocus,
    })
    return fragmentFocus.process(options.focus)
  }

  _handleScroll(fragment, options) {
    const scrolling = new up.FragmentScrolling({
      ...options,
      fragment,
      autoMeans: up.fragment.config.autoScroll
    })
    return scrolling.process(options.scroll)
  }

}
